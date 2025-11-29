---
name: pos-offline-sync
description: Offline-first architecture for POS applications with Supabase. Covers local storage, IndexedDB, queue management, background sync, conflict resolution, and seamless online/offline transitions. Critical for POS reliability when internet is unstable. (project)
---

# POS Offline Sync Skill

## Purpose

This skill provides comprehensive patterns for building offline-capable POS applications. It ensures sales and operations can continue even when internet connectivity is lost, with automatic synchronization when connection is restored.

## When to Use This Skill

Use this skill when:
- **Building offline-capable POS** - Sales must work without internet
- **Implementing local storage** - IndexedDB for offline data
- **Managing sync queues** - Queue operations for later sync
- **Handling conflicts** - Resolve data conflicts
- **Monitoring connectivity** - Online/offline status
- **Background sync** - Sync when connection returns

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     POS Application                          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   UI Layer  │  │ Sync Queue  │  │  Conflict Resolver  │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
│         │                │                     │             │
│  ┌──────▼────────────────▼─────────────────────▼──────────┐ │
│  │                    Data Layer                           │ │
│  │  ┌────────────────┐        ┌────────────────────────┐  │ │
│  │  │   IndexedDB    │◄──────►│    Supabase Client     │  │ │
│  │  │ (Local Store)  │        │   (Remote Sync)        │  │ │
│  │  └────────────────┘        └────────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. IndexedDB Setup with Dexie

```tsx
// lib/db/index.ts
import Dexie, { Table } from 'dexie';

export interface LocalProduct {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  price: number;
  stock: number;
  category_id?: string;
  image_url?: string;
  synced_at: number;
}

export interface LocalSale {
  id: string;
  items: LocalSaleItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  payment_method: string;
  customer_id?: string;
  created_at: number;
  synced: boolean;
  sync_error?: string;
}

export interface LocalSaleItem {
  product_id: string;
  product_name: string;
  sku: string;
  quantity: number;
  price: number;
  discount: number;
  total: number;
}

export interface SyncQueueItem {
  id: string;
  type: 'sale' | 'customer' | 'stock_adjustment';
  action: 'create' | 'update' | 'delete';
  data: any;
  created_at: number;
  attempts: number;
  last_attempt?: number;
  error?: string;
}

export class POSDatabase extends Dexie {
  products!: Table<LocalProduct, string>;
  sales!: Table<LocalSale, string>;
  customers!: Table<LocalCustomer, string>;
  syncQueue!: Table<SyncQueueItem, string>;
  metadata!: Table<{ key: string; value: any }, string>;

  constructor() {
    super('pos_db');

    this.version(1).stores({
      products: 'id, sku, barcode, category_id, synced_at',
      sales: 'id, created_at, synced',
      customers: 'id, phone, synced_at',
      syncQueue: 'id, type, created_at, attempts',
      metadata: 'key',
    });
  }
}

export const db = new POSDatabase();

// Initialize database
export async function initializeDatabase() {
  await db.open();
  console.log('Database initialized');
}
```

### 2. Connectivity Monitor

```tsx
// hooks/useOnlineStatus.ts
'use client';

import { useState, useEffect, useCallback } from 'react';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [lastOnline, setLastOnline] = useState<Date | null>(null);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setLastOnline(new Date());
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Also check with actual network request periodically
    const checkConnection = async () => {
      try {
        const response = await fetch('/api/health', {
          method: 'HEAD',
          cache: 'no-store',
        });
        if (response.ok && !isOnline) {
          handleOnline();
        }
      } catch {
        if (isOnline) {
          handleOffline();
        }
      }
    };

    const interval = setInterval(checkConnection, 30000); // Check every 30s

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [isOnline]);

  return { isOnline, lastOnline };
}

// Online Status Indicator Component
export function OnlineStatusIndicator() {
  const { isOnline } = useOnlineStatus();
  const { pendingCount } = useSyncQueue();

  return (
    <div className={cn(
      "fixed bottom-20 md:bottom-4 right-4 z-50",
      "flex items-center gap-2 px-3 py-2 rounded-full shadow-lg",
      isOnline ? "bg-green-100" : "bg-red-100"
    )}>
      <div className={cn(
        "w-2 h-2 rounded-full",
        isOnline ? "bg-green-500" : "bg-red-500 animate-pulse"
      )} />
      <span className={cn(
        "text-sm font-medium",
        isOnline ? "text-green-700" : "text-red-700"
      )}>
        {isOnline ? 'Online' : 'Offline'}
      </span>
      {pendingCount > 0 && (
        <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full">
          {pendingCount} pending
        </span>
      )}
    </div>
  );
}
```

### 3. Sync Queue Manager

```tsx
// lib/sync/queue.ts
import { db, SyncQueueItem } from '@/lib/db';

export class SyncQueueManager {
  private static instance: SyncQueueManager;
  private isSyncing = false;

  static getInstance() {
    if (!this.instance) {
      this.instance = new SyncQueueManager();
    }
    return this.instance;
  }

  // Add item to queue
  async enqueue(
    type: SyncQueueItem['type'],
    action: SyncQueueItem['action'],
    data: any
  ): Promise<string> {
    const id = crypto.randomUUID();

    await db.syncQueue.add({
      id,
      type,
      action,
      data,
      created_at: Date.now(),
      attempts: 0,
    });

    // Try to sync immediately if online
    if (navigator.onLine) {
      this.processQueue();
    }

    return id;
  }

  // Get pending items count
  async getPendingCount(): Promise<number> {
    return await db.syncQueue.count();
  }

  // Get all pending items
  async getPendingItems(): Promise<SyncQueueItem[]> {
    return await db.syncQueue.orderBy('created_at').toArray();
  }

  // Process the queue
  async processQueue(): Promise<void> {
    if (this.isSyncing || !navigator.onLine) return;

    this.isSyncing = true;

    try {
      const items = await db.syncQueue
        .where('attempts')
        .below(5) // Max 5 retries
        .sortBy('created_at');

      for (const item of items) {
        try {
          await this.syncItem(item);
          await db.syncQueue.delete(item.id);
        } catch (error) {
          // Update attempt count
          await db.syncQueue.update(item.id, {
            attempts: item.attempts + 1,
            last_attempt: Date.now(),
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    } finally {
      this.isSyncing = false;
    }
  }

  // Sync individual item
  private async syncItem(item: SyncQueueItem): Promise<void> {
    const response = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Sync failed');
    }

    // Update local record as synced
    if (item.type === 'sale') {
      await db.sales.update(item.data.id, { synced: true });
    }
  }

  // Clear failed items
  async clearFailed(): Promise<void> {
    await db.syncQueue.where('attempts').aboveOrEqual(5).delete();
  }

  // Retry failed items
  async retryFailed(): Promise<void> {
    await db.syncQueue
      .where('attempts')
      .aboveOrEqual(5)
      .modify({ attempts: 0, error: undefined });

    this.processQueue();
  }
}

export const syncQueue = SyncQueueManager.getInstance();
```

### 4. Offline-Capable Sale Hook

```tsx
// hooks/useOfflineSale.ts
'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { db, LocalSale } from '@/lib/db';
import { syncQueue } from '@/lib/sync/queue';
import { useOnlineStatus } from './useOnlineStatus';

interface CreateSaleInput {
  items: CartItem[];
  totals: CartTotals;
  payment: PaymentDetails;
  customer_id?: string;
}

export function useOfflineSale() {
  const queryClient = useQueryClient();
  const { isOnline } = useOnlineStatus();

  return useMutation({
    mutationFn: async (input: CreateSaleInput): Promise<LocalSale> => {
      const saleId = crypto.randomUUID();
      const timestamp = Date.now();

      // Create local sale record
      const localSale: LocalSale = {
        id: saleId,
        items: input.items.map(item => ({
          product_id: item.product_id,
          product_name: item.name,
          sku: item.sku,
          quantity: item.quantity,
          price: item.price,
          discount: item.discount?.value || 0,
          total: item.price * item.quantity,
        })),
        subtotal: input.totals.subtotal,
        discount: input.totals.totalDiscount,
        tax: input.totals.tax,
        total: input.totals.total,
        payment_method: input.payment.method,
        customer_id: input.customer_id,
        created_at: timestamp,
        synced: false,
      };

      // Save to IndexedDB
      await db.sales.add(localSale);

      // Update local stock
      for (const item of input.items) {
        await db.products
          .where('id')
          .equals(item.product_id)
          .modify(product => {
            product.stock -= item.quantity;
          });
      }

      // Add to sync queue
      await syncQueue.enqueue('sale', 'create', {
        id: saleId,
        ...localSale,
      });

      return localSale;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['local-sales'] });
      queryClient.invalidateQueries({ queryKey: ['local-products'] });
    },
  });
}

// Hook to get local sales
export function useLocalSales() {
  return useQuery({
    queryKey: ['local-sales'],
    queryFn: async () => {
      return await db.sales.orderBy('created_at').reverse().toArray();
    },
  });
}

// Hook to get unsynced sales count
export function useUnsyncedSalesCount() {
  return useQuery({
    queryKey: ['unsynced-sales-count'],
    queryFn: async () => {
      return await db.sales.where('synced').equals(false).count();
    },
    refetchInterval: 5000, // Refresh every 5 seconds
  });
}
```

### 5. Product Cache & Sync

```tsx
// lib/sync/products.ts
import { db, LocalProduct } from '@/lib/db';
import { createClient } from '@/lib/supabase/client';

export class ProductSync {
  private static lastSync: number = 0;

  // Initial sync - download all products
  static async fullSync(storeId: string): Promise<void> {
    const supabase = createClient();

    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, sku, barcode, selling_price, stock_quantity, category_id, image_url')
      .eq('store_id', storeId)
      .eq('is_active', true);

    if (error) throw error;

    // Clear and repopulate
    await db.products.clear();

    const localProducts: LocalProduct[] = products.map(p => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      barcode: p.barcode,
      price: p.selling_price,
      stock: p.stock_quantity,
      category_id: p.category_id,
      image_url: p.image_url,
      synced_at: Date.now(),
    }));

    await db.products.bulkAdd(localProducts);

    // Update last sync time
    await db.metadata.put({ key: 'products_last_sync', value: Date.now() });
    this.lastSync = Date.now();
  }

  // Incremental sync - only changed products
  static async incrementalSync(storeId: string): Promise<void> {
    const supabase = createClient();

    const lastSyncRecord = await db.metadata.get('products_last_sync');
    const lastSync = lastSyncRecord?.value || 0;

    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, sku, barcode, selling_price, stock_quantity, category_id, image_url, updated_at')
      .eq('store_id', storeId)
      .gt('updated_at', new Date(lastSync).toISOString());

    if (error) throw error;

    // Update changed products
    for (const p of products || []) {
      await db.products.put({
        id: p.id,
        name: p.name,
        sku: p.sku,
        barcode: p.barcode,
        price: p.selling_price,
        stock: p.stock_quantity,
        category_id: p.category_id,
        image_url: p.image_url,
        synced_at: Date.now(),
      });
    }

    await db.metadata.put({ key: 'products_last_sync', value: Date.now() });
  }

  // Get product by barcode (local first)
  static async getByBarcode(barcode: string): Promise<LocalProduct | undefined> {
    return await db.products.where('barcode').equals(barcode).first();
  }

  // Search products locally
  static async search(query: string): Promise<LocalProduct[]> {
    const lowerQuery = query.toLowerCase();

    return await db.products
      .filter(p =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.sku.toLowerCase().includes(lowerQuery) ||
        (p.barcode && p.barcode.includes(query))
      )
      .limit(50)
      .toArray();
  }
}
```

### 6. Background Sync Service Worker

```tsx
// public/sw.js (Service Worker)
const CACHE_NAME = 'pos-cache-v1';
const OFFLINE_URL = '/offline';

// Files to cache
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/sales',
  '/inventory',
  '/manifest.json',
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - Network first, fallback to cache
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone and cache successful responses
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(async () => {
        // Try cache
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }

        // Return offline page for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match(OFFLINE_URL);
        }

        throw new Error('No cache available');
      })
  );
});

// Background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-sales') {
    event.waitUntil(syncSales());
  }
});

async function syncSales() {
  // This would communicate with IndexedDB via postMessage
  // or use the Background Sync API
  const clients = await self.clients.matchAll();
  clients.forEach((client) => {
    client.postMessage({ type: 'SYNC_REQUESTED' });
  });
}
```

### 7. Sync Service Hook

```tsx
// hooks/useSyncService.ts
'use client';

import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { syncQueue } from '@/lib/sync/queue';
import { ProductSync } from '@/lib/sync/products';
import { useOnlineStatus } from './useOnlineStatus';

export function useSyncService(storeId: string) {
  const queryClient = useQueryClient();
  const { isOnline } = useOnlineStatus();

  // Process sync queue when coming online
  useEffect(() => {
    if (isOnline) {
      syncQueue.processQueue();
    }
  }, [isOnline]);

  // Listen for service worker sync requests
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SYNC_REQUESTED') {
        syncQueue.processQueue();
      }
    };

    navigator.serviceWorker?.addEventListener('message', handleMessage);
    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleMessage);
    };
  }, []);

  // Initial product sync
  const syncProducts = useCallback(async () => {
    if (!isOnline) return;

    try {
      await ProductSync.fullSync(storeId);
      queryClient.invalidateQueries({ queryKey: ['local-products'] });
    } catch (error) {
      console.error('Product sync failed:', error);
    }
  }, [storeId, isOnline, queryClient]);

  // Incremental product sync
  const refreshProducts = useCallback(async () => {
    if (!isOnline) return;

    try {
      await ProductSync.incrementalSync(storeId);
      queryClient.invalidateQueries({ queryKey: ['local-products'] });
    } catch (error) {
      console.error('Product refresh failed:', error);
    }
  }, [storeId, isOnline, queryClient]);

  // Force sync all pending items
  const forceSyncAll = useCallback(async () => {
    if (!isOnline) {
      throw new Error('Cannot sync while offline');
    }

    await syncQueue.processQueue();
    await refreshProducts();
  }, [isOnline, refreshProducts]);

  return {
    syncProducts,
    refreshProducts,
    forceSyncAll,
  };
}
```

### 8. Conflict Resolution

```tsx
// lib/sync/conflict-resolver.ts
import { db } from '@/lib/db';
import { createClient } from '@/lib/supabase/client';

export type ConflictStrategy = 'local_wins' | 'server_wins' | 'merge' | 'manual';

export interface Conflict {
  id: string;
  type: string;
  localData: any;
  serverData: any;
  detectedAt: number;
}

export class ConflictResolver {
  private strategy: ConflictStrategy = 'server_wins';
  private conflicts: Conflict[] = [];

  setStrategy(strategy: ConflictStrategy) {
    this.strategy = strategy;
  }

  async detectConflicts(type: string, localId: string): Promise<Conflict | null> {
    const supabase = createClient();

    // Get local version
    const localRecord = await this.getLocalRecord(type, localId);
    if (!localRecord) return null;

    // Get server version
    const { data: serverRecord } = await supabase
      .from(type)
      .select('*')
      .eq('id', localId)
      .single();

    if (!serverRecord) return null;

    // Check for conflict (both modified since last sync)
    const localModified = localRecord.updated_at || localRecord.created_at;
    const serverModified = new Date(serverRecord.updated_at).getTime();
    const lastSync = await this.getLastSyncTime(type);

    if (localModified > lastSync && serverModified > lastSync) {
      const conflict: Conflict = {
        id: crypto.randomUUID(),
        type,
        localData: localRecord,
        serverData: serverRecord,
        detectedAt: Date.now(),
      };

      this.conflicts.push(conflict);
      return conflict;
    }

    return null;
  }

  async resolveConflict(
    conflict: Conflict,
    resolution?: ConflictStrategy
  ): Promise<any> {
    const strategy = resolution || this.strategy;

    switch (strategy) {
      case 'local_wins':
        return this.applyLocalVersion(conflict);

      case 'server_wins':
        return this.applyServerVersion(conflict);

      case 'merge':
        return this.mergeVersions(conflict);

      case 'manual':
        // Store conflict for manual resolution
        await db.table('conflicts').add(conflict);
        throw new Error('Manual resolution required');

      default:
        return this.applyServerVersion(conflict);
    }
  }

  private async applyLocalVersion(conflict: Conflict) {
    const supabase = createClient();

    // Update server with local data
    const { error } = await supabase
      .from(conflict.type)
      .update(conflict.localData)
      .eq('id', conflict.localData.id);

    if (error) throw error;

    // Remove from conflicts
    this.conflicts = this.conflicts.filter(c => c.id !== conflict.id);

    return conflict.localData;
  }

  private async applyServerVersion(conflict: Conflict) {
    // Update local with server data
    await this.updateLocalRecord(conflict.type, conflict.serverData);

    // Remove from conflicts
    this.conflicts = this.conflicts.filter(c => c.id !== conflict.id);

    return conflict.serverData;
  }

  private async mergeVersions(conflict: Conflict) {
    // Intelligent merge based on field timestamps
    // For POS, typically newer values win per field
    const merged = { ...conflict.serverData };

    // For sales: keep local items, update totals from recalculation
    if (conflict.type === 'sales') {
      merged.items = conflict.localData.items;
      // Recalculate totals
    }

    return merged;
  }

  private async getLocalRecord(type: string, id: string) {
    const table = db.table(type);
    return await table.get(id);
  }

  private async updateLocalRecord(type: string, data: any) {
    const table = db.table(type);
    await table.put(data);
  }

  private async getLastSyncTime(type: string): Promise<number> {
    const record = await db.metadata.get(`${type}_last_sync`);
    return record?.value || 0;
  }

  getConflicts(): Conflict[] {
    return [...this.conflicts];
  }
}

export const conflictResolver = new ConflictResolver();
```

### 9. Sync Status Component

```tsx
// components/sync/SyncStatus.tsx
'use client';

import { useState } from 'react';
import { useSyncQueue, useSyncService } from '@/hooks/useSync';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { RefreshCw, CloudOff, Cloud, AlertCircle, CheckCircle } from 'lucide-react';

export function SyncStatus({ storeId }: { storeId: string }) {
  const { isOnline } = useOnlineStatus();
  const { pendingCount, failedCount, items } = useSyncQueue();
  const { forceSyncAll } = useSyncService(storeId);
  const [syncing, setSyncing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await forceSyncAll();
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="relative">
      {/* Sync Button */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg",
          isOnline ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
        )}
      >
        {isOnline ? (
          <Cloud className="w-4 h-4" />
        ) : (
          <CloudOff className="w-4 h-4" />
        )}
        <span className="text-sm font-medium">
          {isOnline ? 'Online' : 'Offline'}
        </span>
        {pendingCount > 0 && (
          <span className="px-1.5 py-0.5 bg-yellow-200 text-yellow-800 text-xs rounded-full">
            {pendingCount}
          </span>
        )}
      </button>

      {/* Details Dropdown */}
      {showDetails && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-lg shadow-lg border z-50">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Sync Status</span>
              {isOnline && (
                <button
                  onClick={handleSync}
                  disabled={syncing || pendingCount === 0}
                  className="p-1.5 hover:bg-gray-100 rounded disabled:opacity-50"
                >
                  <RefreshCw className={cn("w-4 h-4", syncing && "animate-spin")} />
                </button>
              )}
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Pending</span>
                <span className="font-medium">{pendingCount}</span>
              </div>
              {failedCount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Failed</span>
                  <span className="font-medium">{failedCount}</span>
                </div>
              )}
            </div>
          </div>

          {/* Pending Items */}
          {items.length > 0 && (
            <div className="max-h-48 overflow-y-auto">
              {items.slice(0, 5).map(item => (
                <div
                  key={item.id}
                  className="px-4 py-2 border-b last:border-0 flex items-center gap-2"
                >
                  {item.attempts >= 5 ? (
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  ) : (
                    <RefreshCw className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {item.type}: {item.action}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(item.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {items.length === 0 && (
            <div className="p-4 text-center text-sm text-gray-500">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
              All synced!
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

### 10. Offline Sales Page

```tsx
// app/(dashboard)/sales/page.tsx - Offline-capable version
'use client';

import { useState, useEffect } from 'react';
import { useOfflineSale, useLocalProducts } from '@/hooks/useOfflineSale';
import { useSyncService } from '@/hooks/useSyncService';
import { OnlineStatusIndicator } from '@/components/OnlineStatusIndicator';
import { SyncStatus } from '@/components/sync/SyncStatus';
import { db } from '@/lib/db';

export default function OfflineSalesPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const { mutate: createSale, isPending } = useOfflineSale();
  const { products, isLoading } = useLocalProducts();
  const { syncProducts } = useSyncService('store-id');

  // Initial product sync
  useEffect(() => {
    syncProducts();
  }, [syncProducts]);

  const handleAddToCart = async (barcode: string) => {
    // Search locally first (instant)
    const product = await db.products.where('barcode').equals(barcode).first();

    if (product) {
      addToCart(product);
    } else {
      // Show not found message
      toast.error('Product not found');
    }
  };

  const handleCheckout = async (payment: PaymentDetails) => {
    createSale({
      items: cart,
      totals: calculateTotals(cart),
      payment,
    }, {
      onSuccess: (sale) => {
        // Print receipt
        printReceipt(sale);
        // Clear cart
        setCart([]);
        // Show success (works offline too)
        toast.success('Sale completed!');
      },
    });
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header with sync status */}
      <header className="flex items-center justify-between p-4 border-b bg-white">
        <h1 className="text-xl font-semibold">Sales</h1>
        <SyncStatus storeId="store-id" />
      </header>

      {/* Sales interface */}
      <div className="flex-1 flex">
        {/* Product grid - uses local data */}
        <div className="flex-1 p-4">
          <ProductGrid
            products={products}
            onAddToCart={addToCart}
            isLoading={isLoading}
          />
        </div>

        {/* Cart */}
        <div className="w-96 border-l">
          <Cart
            items={cart}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={removeItem}
            onCheckout={handleCheckout}
          />
        </div>
      </div>

      {/* Offline indicator */}
      <OnlineStatusIndicator />
    </div>
  );
}
```

## Database Setup

```sql
-- Add sync tracking columns
ALTER TABLE sales ADD COLUMN IF NOT EXISTS local_id VARCHAR(100);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS synced_at TIMESTAMPTZ;
ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

## Installation

```bash
# Install dependencies
npm install dexie @tanstack/react-query idb

# For barcode scanning
npm install @zxing/library
```

## Best Practices

1. **Always save locally first** - Never block on network
2. **Queue everything** - All writes go to sync queue
3. **Incremental sync** - Only sync changes, not everything
4. **Handle conflicts gracefully** - Have a clear strategy
5. **Show sync status** - Users should know what's pending
6. **Test offline regularly** - Use Chrome DevTools Network tab
7. **Clear old data** - Don't let IndexedDB grow forever
8. **Background sync** - Use Service Workers when possible

## References

- `references/indexeddb-patterns.md` - IndexedDB best practices
- `references/service-worker.md` - Service worker setup
- `references/conflict-strategies.md` - Conflict resolution patterns
