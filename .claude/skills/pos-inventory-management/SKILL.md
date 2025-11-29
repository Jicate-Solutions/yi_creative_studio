---
name: pos-inventory-management
description: Complete inventory management system for POS applications. Covers stock tracking, low stock alerts, batch/expiry management, stock transfers, inventory valuation (FIFO/LIFO), and barcode generation. Use when building inventory pages, stock management, or product catalog features. (project)
---

# POS Inventory Management Skill

## Purpose

This skill provides comprehensive patterns for building inventory management functionality in POS systems. It covers stock tracking, alerts, transfers between stores, batch management, and inventory valuation methods.

## When to Use This Skill

Use this skill when:
- **Building inventory pages** - Product catalog management
- **Tracking stock levels** - Real-time stock updates
- **Setting up alerts** - Low stock notifications
- **Managing batches** - Expiry date tracking
- **Stock transfers** - Multi-store inventory
- **Inventory valuation** - FIFO/LIFO/Weighted Average
- **Generating barcodes** - Product labeling

## Core Components

### 1. Inventory Dashboard

```tsx
// app/(dashboard)/inventory/page.tsx
'use client';

import { useState } from 'react';
import { useInventory } from '@/hooks/useInventory';
import { ProductTable } from '@/components/inventory/ProductTable';
import { StockAlerts } from '@/components/inventory/StockAlerts';
import { InventoryStats } from '@/components/inventory/InventoryStats';

export default function InventoryPage() {
  const [filter, setFilter] = useState({
    category: '',
    stockStatus: 'all', // all, low, out
    search: '',
  });

  const { products, stats, isLoading } = useInventory(filter);

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-semibold">Inventory</h1>
          <div className="flex gap-2">
            <button className="px-4 py-2 border rounded-lg hover:bg-gray-50">
              Export
            </button>
            <Link
              href="/inventory/add"
              className="px-4 py-2 bg-primary text-white rounded-lg"
            >
              Add Product
            </Link>
          </div>
        </div>
      </header>

      <div className="px-4 py-4 sm:px-6 sm:py-6">
        {/* Stats Cards */}
        <InventoryStats stats={stats} />

        {/* Low Stock Alerts */}
        <StockAlerts className="mt-6" />

        {/* Filters */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <input
            type="search"
            placeholder="Search products..."
            value={filter.search}
            onChange={(e) => setFilter({ ...filter, search: e.target.value })}
            className="flex-1 px-4 py-2 border rounded-lg"
          />
          <select
            value={filter.stockStatus}
            onChange={(e) => setFilter({ ...filter, stockStatus: e.target.value })}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="all">All Stock</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </select>
          <select
            value={filter.category}
            onChange={(e) => setFilter({ ...filter, category: e.target.value })}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="">All Categories</option>
            {/* Category options */}
          </select>
        </div>

        {/* Products Table */}
        <ProductTable products={products} isLoading={isLoading} className="mt-4" />
      </div>
    </div>
  );
}
```

### 2. Product Data Model

```tsx
// types/inventory.ts
export interface Product {
  id: string;
  store_id: string;
  category_id: string;
  name: string;
  description?: string;
  sku: string;
  barcode?: string;
  cost_price: number;
  selling_price: number;
  tax_rate?: number;
  stock_quantity: number;
  min_stock_level: number;
  max_stock_level?: number;
  unit: string; // pcs, kg, ltr, etc.
  image_url?: string;
  is_active: boolean;
  track_inventory: boolean;
  allow_negative_stock: boolean;
  created_at: string;
  updated_at: string;

  // Relations
  category?: Category;
  batches?: ProductBatch[];
}

export interface ProductBatch {
  id: string;
  product_id: string;
  batch_number: string;
  quantity: number;
  cost_price: number;
  manufacturing_date?: string;
  expiry_date?: string;
  supplier_id?: string;
  received_date: string;
  notes?: string;
}

export interface StockMovement {
  id: string;
  product_id: string;
  store_id: string;
  type: 'in' | 'out' | 'adjustment' | 'transfer';
  quantity: number;
  reference_type: 'purchase' | 'sale' | 'return' | 'transfer' | 'adjustment';
  reference_id?: string;
  batch_id?: string;
  notes?: string;
  user_id: string;
  created_at: string;
}

export interface StockTransfer {
  id: string;
  from_store_id: string;
  to_store_id: string;
  status: 'pending' | 'in_transit' | 'received' | 'cancelled';
  items: StockTransferItem[];
  notes?: string;
  created_by: string;
  created_at: string;
  received_at?: string;
  received_by?: string;
}

export interface StockTransferItem {
  id: string;
  transfer_id: string;
  product_id: string;
  quantity_sent: number;
  quantity_received?: number;
  batch_id?: string;
}
```

### 3. Inventory Hooks

```tsx
// hooks/useInventory.ts
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

interface InventoryFilter {
  category?: string;
  stockStatus?: 'all' | 'low' | 'out';
  search?: string;
  storeId?: string;
}

export function useInventory(filter: InventoryFilter = {}) {
  const supabase = createClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['inventory', filter],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select(`
          *,
          category:categories(id, name),
          batches:product_batches(*)
        `)
        .eq('is_active', true);

      if (filter.storeId) {
        query = query.eq('store_id', filter.storeId);
      }

      if (filter.category) {
        query = query.eq('category_id', filter.category);
      }

      if (filter.stockStatus === 'low') {
        query = query.lte('stock_quantity', supabase.raw('min_stock_level'));
      } else if (filter.stockStatus === 'out') {
        query = query.lte('stock_quantity', 0);
      }

      if (filter.search) {
        query = query.or(
          `name.ilike.%${filter.search}%,sku.ilike.%${filter.search}%,barcode.eq.${filter.search}`
        );
      }

      const { data, error } = await query.order('name');

      if (error) throw error;
      return data;
    },
  });

  // Calculate stats
  const stats = {
    totalProducts: data?.length || 0,
    totalValue: data?.reduce((sum, p) => sum + (p.cost_price * p.stock_quantity), 0) || 0,
    lowStockCount: data?.filter(p => p.stock_quantity <= p.min_stock_level && p.stock_quantity > 0).length || 0,
    outOfStockCount: data?.filter(p => p.stock_quantity <= 0).length || 0,
  };

  return {
    products: data || [],
    stats,
    isLoading,
    error,
  };
}

// Hook for stock adjustments
export function useStockAdjustment() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({
      productId,
      adjustment,
      reason,
      notes,
    }: {
      productId: string;
      adjustment: number;
      reason: string;
      notes?: string;
    }) => {
      // Get current stock
      const { data: product } = await supabase
        .from('products')
        .select('stock_quantity')
        .eq('id', productId)
        .single();

      const newQuantity = (product?.stock_quantity || 0) + adjustment;

      // Update stock
      const { error: updateError } = await supabase
        .from('products')
        .update({ stock_quantity: newQuantity, updated_at: new Date().toISOString() })
        .eq('id', productId);

      if (updateError) throw updateError;

      // Record movement
      const { error: movementError } = await supabase
        .from('stock_movements')
        .insert({
          product_id: productId,
          type: adjustment > 0 ? 'in' : 'out',
          quantity: Math.abs(adjustment),
          reference_type: 'adjustment',
          notes: `${reason}: ${notes || ''}`,
        });

      if (movementError) throw movementError;

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}
```

### 4. Stock Alerts Component

```tsx
// components/inventory/StockAlerts.tsx
'use client';

import { useLowStockProducts } from '@/hooks/useInventory';
import { AlertTriangle, Package } from 'lucide-react';

export function StockAlerts({ className }: { className?: string }) {
  const { products, isLoading } = useLowStockProducts();

  if (isLoading || products.length === 0) return null;

  const outOfStock = products.filter(p => p.stock_quantity <= 0);
  const lowStock = products.filter(p => p.stock_quantity > 0);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Out of Stock Alert */}
      {outOfStock.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="font-semibold text-red-800">
              Out of Stock ({outOfStock.length})
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {outOfStock.slice(0, 5).map(product => (
              <Link
                key={product.id}
                href={`/inventory/${product.id}`}
                className="px-3 py-1 bg-white border border-red-200 rounded-full text-sm hover:bg-red-100"
              >
                {product.name}
              </Link>
            ))}
            {outOfStock.length > 5 && (
              <span className="px-3 py-1 text-sm text-red-600">
                +{outOfStock.length - 5} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Low Stock Alert */}
      {lowStock.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Package className="w-5 h-5 text-yellow-600" />
            <h3 className="font-semibold text-yellow-800">
              Low Stock ({lowStock.length})
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStock.slice(0, 5).map(product => (
              <Link
                key={product.id}
                href={`/inventory/${product.id}`}
                className="px-3 py-1 bg-white border border-yellow-200 rounded-full text-sm hover:bg-yellow-100"
              >
                {product.name} ({product.stock_quantity}/{product.min_stock_level})
              </Link>
            ))}
            {lowStock.length > 5 && (
              <span className="px-3 py-1 text-sm text-yellow-600">
                +{lowStock.length - 5} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

### 5. Stock Adjustment Modal

```tsx
// components/inventory/StockAdjustmentModal.tsx
'use client';

import { useState } from 'react';
import { useStockAdjustment } from '@/hooks/useInventory';
import { X, Plus, Minus } from 'lucide-react';

interface StockAdjustmentModalProps {
  product: Product;
  onClose: () => void;
}

const adjustmentReasons = [
  'Stock count correction',
  'Damaged goods',
  'Expired products',
  'Theft/Loss',
  'Received shipment',
  'Return to supplier',
  'Other',
];

export function StockAdjustmentModal({
  product,
  onClose,
}: StockAdjustmentModalProps) {
  const [type, setType] = useState<'add' | 'remove'>('add');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  const { mutate: adjustStock, isPending } = useStockAdjustment();

  const newQuantity = type === 'add'
    ? product.stock_quantity + parseInt(quantity || '0')
    : product.stock_quantity - parseInt(quantity || '0');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const adjustment = type === 'add'
      ? parseInt(quantity)
      : -parseInt(quantity);

    adjustStock(
      { productId: product.id, adjustment, reason, notes },
      { onSuccess: onClose }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Adjust Stock</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Product Info */}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="font-medium">{product.name}</p>
            <p className="text-sm text-gray-500">SKU: {product.sku}</p>
            <p className="text-sm mt-2">
              Current Stock: <span className="font-bold">{product.stock_quantity}</span> {product.unit}
            </p>
          </div>

          {/* Adjustment Type */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setType('add')}
              className={cn(
                "flex items-center justify-center gap-2 p-3 rounded-lg border-2",
                type === 'add'
                  ? "border-green-500 bg-green-50 text-green-700"
                  : "border-gray-200"
              )}
            >
              <Plus className="w-5 h-5" />
              Add Stock
            </button>
            <button
              type="button"
              onClick={() => setType('remove')}
              className={cn(
                "flex items-center justify-center gap-2 p-3 rounded-lg border-2",
                type === 'remove'
                  ? "border-red-500 bg-red-50 text-red-700"
                  : "border-gray-200"
              )}
            >
              <Minus className="w-5 h-5" />
              Remove Stock
            </button>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium mb-1">Quantity</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="1"
              max={type === 'remove' ? product.stock_quantity : undefined}
              required
              className="w-full px-4 py-3 border rounded-lg"
              placeholder="Enter quantity"
            />
          </div>

          {/* New Stock Preview */}
          {quantity && (
            <div className={cn(
              "p-3 rounded-lg text-center",
              newQuantity < 0 ? "bg-red-50" : "bg-gray-50"
            )}>
              <p className="text-sm text-gray-500">New Stock Level</p>
              <p className={cn(
                "text-2xl font-bold",
                newQuantity < 0 ? "text-red-600" : "text-gray-900"
              )}>
                {newQuantity} {product.unit}
              </p>
              {newQuantity < 0 && (
                <p className="text-xs text-red-600 mt-1">
                  Warning: Stock will be negative
                </p>
              )}
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium mb-1">Reason</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              className="w-full px-4 py-3 border rounded-lg"
            >
              <option value="">Select reason</option>
              {adjustmentReasons.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-1">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg resize-none"
              rows={2}
              placeholder="Additional details..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border rounded-lg font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || !quantity || !reason}
              className={cn(
                "flex-1 py-3 rounded-lg font-medium text-white",
                type === 'add' ? "bg-green-600" : "bg-red-600",
                "disabled:opacity-50"
              )}
            >
              {isPending ? 'Saving...' : 'Confirm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

### 6. Batch Management

```tsx
// components/inventory/BatchManager.tsx
'use client';

import { useState } from 'react';
import { useBatches, useAddBatch } from '@/hooks/useInventory';
import { formatDate, formatCurrency } from '@/lib/utils';

interface BatchManagerProps {
  productId: string;
}

export function BatchManager({ productId }: BatchManagerProps) {
  const { batches, isLoading } = useBatches(productId);
  const [showAddForm, setShowAddForm] = useState(false);

  // Sort by expiry date (closest first)
  const sortedBatches = [...(batches || [])].sort((a, b) => {
    if (!a.expiry_date) return 1;
    if (!b.expiry_date) return -1;
    return new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime();
  });

  const expiringBatches = sortedBatches.filter(b => {
    if (!b.expiry_date) return false;
    const daysUntilExpiry = Math.ceil(
      (new Date(b.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  });

  const expiredBatches = sortedBatches.filter(b => {
    if (!b.expiry_date) return false;
    return new Date(b.expiry_date) < new Date();
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Batches</h3>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-3 py-1.5 text-sm bg-primary text-white rounded-lg"
        >
          Add Batch
        </button>
      </div>

      {/* Expiry Alerts */}
      {expiredBatches.length > 0 && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm font-medium text-red-800">
            {expiredBatches.length} batch(es) have expired!
          </p>
        </div>
      )}

      {expiringBatches.length > 0 && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm font-medium text-yellow-800">
            {expiringBatches.length} batch(es) expiring within 30 days
          </p>
        </div>
      )}

      {/* Batch List */}
      <div className="space-y-2">
        {sortedBatches.map(batch => {
          const isExpired = batch.expiry_date && new Date(batch.expiry_date) < new Date();
          const isExpiringSoon = batch.expiry_date && !isExpired &&
            Math.ceil((new Date(batch.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) <= 30;

          return (
            <div
              key={batch.id}
              className={cn(
                "p-3 rounded-lg border",
                isExpired ? "bg-red-50 border-red-200" :
                isExpiringSoon ? "bg-yellow-50 border-yellow-200" :
                "bg-white border-gray-200"
              )}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{batch.batch_number}</p>
                  <p className="text-sm text-gray-500">
                    Qty: {batch.quantity} | Cost: {formatCurrency(batch.cost_price)}
                  </p>
                </div>
                <div className="text-right">
                  {batch.expiry_date && (
                    <p className={cn(
                      "text-sm",
                      isExpired ? "text-red-600" : isExpiringSoon ? "text-yellow-600" : "text-gray-500"
                    )}>
                      {isExpired ? 'Expired: ' : 'Expires: '}
                      {formatDate(batch.expiry_date)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showAddForm && (
        <AddBatchModal
          productId={productId}
          onClose={() => setShowAddForm(false)}
        />
      )}
    </div>
  );
}
```

### 7. Stock Transfer

```tsx
// components/inventory/StockTransfer.tsx
'use client';

import { useState } from 'react';
import { useStores } from '@/hooks/useStores';
import { useCreateTransfer } from '@/hooks/useInventory';

interface TransferItem {
  product_id: string;
  product_name: string;
  quantity: number;
  available: number;
}

export function StockTransferForm() {
  const { stores } = useStores();
  const [fromStore, setFromStore] = useState('');
  const [toStore, setToStore] = useState('');
  const [items, setItems] = useState<TransferItem[]>([]);
  const [notes, setNotes] = useState('');

  const { mutate: createTransfer, isPending } = useCreateTransfer();

  const addItem = (product: Product) => {
    if (items.find(i => i.product_id === product.id)) return;

    setItems([...items, {
      product_id: product.id,
      product_name: product.name,
      quantity: 1,
      available: product.stock_quantity,
    }]);
  };

  const updateItemQuantity = (productId: string, quantity: number) => {
    setItems(items.map(item =>
      item.product_id === productId
        ? { ...item, quantity: Math.min(quantity, item.available) }
        : item
    ));
  };

  const removeItem = (productId: string) => {
    setItems(items.filter(item => item.product_id !== productId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    createTransfer({
      from_store_id: fromStore,
      to_store_id: toStore,
      items: items.map(i => ({
        product_id: i.product_id,
        quantity_sent: i.quantity,
      })),
      notes,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Store Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">From Store</label>
          <select
            value={fromStore}
            onChange={(e) => setFromStore(e.target.value)}
            required
            className="w-full px-4 py-3 border rounded-lg"
          >
            <option value="">Select store</option>
            {stores.map(store => (
              <option key={store.id} value={store.id}>{store.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">To Store</label>
          <select
            value={toStore}
            onChange={(e) => setToStore(e.target.value)}
            required
            disabled={!fromStore}
            className="w-full px-4 py-3 border rounded-lg"
          >
            <option value="">Select store</option>
            {stores.filter(s => s.id !== fromStore).map(store => (
              <option key={store.id} value={store.id}>{store.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Product Selection */}
      {fromStore && (
        <div>
          <label className="block text-sm font-medium mb-1">Add Products</label>
          <ProductSearchInput
            storeId={fromStore}
            onSelect={addItem}
            excludeIds={items.map(i => i.product_id)}
          />
        </div>
      )}

      {/* Selected Items */}
      {items.length > 0 && (
        <div className="space-y-2">
          <label className="block text-sm font-medium">Transfer Items</label>
          {items.map(item => (
            <div
              key={item.product_id}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex-1">
                <p className="font-medium">{item.product_name}</p>
                <p className="text-sm text-gray-500">
                  Available: {item.available}
                </p>
              </div>
              <input
                type="number"
                value={item.quantity}
                onChange={(e) => updateItemQuantity(item.product_id, parseInt(e.target.value))}
                min={1}
                max={item.available}
                className="w-20 px-3 py-2 border rounded-lg text-center"
              />
              <button
                type="button"
                onClick={() => removeItem(item.product_id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium mb-1">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full px-4 py-3 border rounded-lg resize-none"
          rows={2}
          placeholder="Transfer reason or notes..."
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending || !fromStore || !toStore || items.length === 0}
        className="w-full py-3 bg-primary text-white rounded-lg font-medium disabled:opacity-50"
      >
        {isPending ? 'Creating Transfer...' : 'Create Transfer'}
      </button>
    </form>
  );
}
```

### 8. Barcode Generation

```tsx
// components/inventory/BarcodeGenerator.tsx
'use client';

import { useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { useEffect } from 'react';

interface BarcodeGeneratorProps {
  value: string;
  format?: 'CODE128' | 'EAN13' | 'UPC' | 'CODE39';
  width?: number;
  height?: number;
  displayValue?: boolean;
}

export function BarcodeGenerator({
  value,
  format = 'CODE128',
  width = 2,
  height = 100,
  displayValue = true,
}: BarcodeGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && value) {
      try {
        JsBarcode(canvasRef.current, value, {
          format,
          width,
          height,
          displayValue,
          fontSize: 14,
          margin: 10,
        });
      } catch (error) {
        console.error('Invalid barcode value');
      }
    }
  }, [value, format, width, height, displayValue]);

  return <canvas ref={canvasRef} />;
}

// Print barcode labels
export function printBarcodeLabels(products: Product[], copies: number = 1) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const labelsHTML = products.flatMap(product =>
    Array(copies).fill(null).map(() => `
      <div class="label">
        <div class="product-name">${product.name}</div>
        <div class="barcode">
          <svg id="barcode-${product.id}-${Math.random()}"></svg>
        </div>
        <div class="price">${formatCurrency(product.selling_price)}</div>
      </div>
    `)
  ).join('');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        @page { size: 50mm 30mm; margin: 0; }
        body { margin: 0; font-family: Arial, sans-serif; }
        .label {
          width: 50mm;
          height: 30mm;
          padding: 2mm;
          box-sizing: border-box;
          page-break-after: always;
          text-align: center;
        }
        .product-name {
          font-size: 8pt;
          font-weight: bold;
          margin-bottom: 2mm;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .barcode svg {
          max-width: 100%;
          height: 15mm;
        }
        .price {
          font-size: 12pt;
          font-weight: bold;
          margin-top: 2mm;
        }
      </style>
      <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
    </head>
    <body>
      ${labelsHTML}
      <script>
        ${products.map(p => `
          document.querySelectorAll('[id^="barcode-${p.id}"]').forEach(el => {
            JsBarcode(el, "${p.barcode || p.sku}", {
              format: "CODE128",
              width: 1.5,
              height: 40,
              displayValue: true,
              fontSize: 10,
              margin: 0,
            });
          });
        `).join('')}
        window.onload = () => window.print();
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
}
```

## Database Schema

```sql
-- Products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) NOT NULL,
  category_id UUID REFERENCES categories(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  sku VARCHAR(100) NOT NULL,
  barcode VARCHAR(100),
  cost_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  selling_price DECIMAL(10,2) NOT NULL,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  min_stock_level INTEGER NOT NULL DEFAULT 5,
  max_stock_level INTEGER,
  unit VARCHAR(20) DEFAULT 'pcs',
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  track_inventory BOOLEAN DEFAULT true,
  allow_negative_stock BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(store_id, sku)
);

-- Product batches
CREATE TABLE product_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  batch_number VARCHAR(100) NOT NULL,
  quantity INTEGER NOT NULL,
  cost_price DECIMAL(10,2) NOT NULL,
  manufacturing_date DATE,
  expiry_date DATE,
  supplier_id UUID REFERENCES suppliers(id),
  received_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stock movements
CREATE TABLE stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  store_id UUID REFERENCES stores(id) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('in', 'out', 'adjustment', 'transfer')),
  quantity INTEGER NOT NULL,
  reference_type VARCHAR(50),
  reference_id UUID,
  batch_id UUID REFERENCES product_batches(id),
  notes TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stock transfers
CREATE TABLE stock_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_store_id UUID REFERENCES stores(id) NOT NULL,
  to_store_id UUID REFERENCES stores(id) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  received_at TIMESTAMPTZ,
  received_by UUID REFERENCES auth.users(id)
);

-- Transfer items
CREATE TABLE stock_transfer_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id UUID REFERENCES stock_transfers(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) NOT NULL,
  quantity_sent INTEGER NOT NULL,
  quantity_received INTEGER,
  batch_id UUID REFERENCES product_batches(id)
);

-- Indexes
CREATE INDEX idx_products_store ON products(store_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_low_stock ON products(stock_quantity, min_stock_level);
CREATE INDEX idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX idx_stock_movements_date ON stock_movements(created_at);
CREATE INDEX idx_batches_expiry ON product_batches(expiry_date);

-- Function to decrement stock
CREATE OR REPLACE FUNCTION decrement_stock(p_product_id UUID, p_quantity INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE products
  SET stock_quantity = stock_quantity - p_quantity,
      updated_at = NOW()
  WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql;
```

## Inventory Valuation Methods

```tsx
// lib/inventory-valuation.ts

// FIFO (First In, First Out)
export function calculateFIFOValue(batches: ProductBatch[]): number {
  return batches
    .sort((a, b) => new Date(a.received_date).getTime() - new Date(b.received_date).getTime())
    .reduce((total, batch) => total + (batch.quantity * batch.cost_price), 0);
}

// LIFO (Last In, First Out)
export function calculateLIFOValue(batches: ProductBatch[]): number {
  return batches
    .sort((a, b) => new Date(b.received_date).getTime() - new Date(a.received_date).getTime())
    .reduce((total, batch) => total + (batch.quantity * batch.cost_price), 0);
}

// Weighted Average
export function calculateWeightedAverageValue(batches: ProductBatch[]): number {
  const totalQuantity = batches.reduce((sum, b) => sum + b.quantity, 0);
  const totalValue = batches.reduce((sum, b) => sum + (b.quantity * b.cost_price), 0);

  if (totalQuantity === 0) return 0;

  const averageCost = totalValue / totalQuantity;
  return totalQuantity * averageCost;
}
```

## Best Practices

1. **Track all stock movements** for audit trail
2. **Set appropriate min/max levels** per product
3. **Regular stock counts** to catch discrepancies
4. **FIFO for perishables** - sell oldest first
5. **Batch tracking** for items with expiry
6. **Automated reorder alerts** at min stock level
7. **Barcode everything** for faster operations

## References

- `references/valuation-methods.md` - FIFO/LIFO/WAC details
- `references/batch-tracking.md` - Batch management patterns
- `references/stock-audit.md` - Stock count procedures
