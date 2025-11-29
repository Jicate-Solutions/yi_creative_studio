---
name: pos-sales-module
description: Complete POS sales/checkout module for retail applications. Covers cart management, barcode scanning, payment processing, discounts, receipts, and quick sale workflows. Use when building sales pages, checkout flows, or payment integrations for Point of Sale systems. (project)
---

# POS Sales Module Skill

## Purpose

This skill provides comprehensive patterns and workflows for building Point of Sale (POS) sales functionality. It covers the complete checkout flow from product selection to payment processing and receipt generation.

## When to Use This Skill

Use this skill when:
- **Building checkout/sales pages** - Quick POS interface
- **Implementing cart management** - Add/remove/update items
- **Adding barcode scanning** - Camera or hardware scanner
- **Processing payments** - Cash, card, UPI, split payments
- **Applying discounts** - Percentage, fixed, coupons
- **Generating receipts** - Print or digital receipts
- **Building quick sale workflows** - Fast checkout for retail

## Core Components

### 1. Sales Page Layout

```tsx
// app/(dashboard)/sales/page.tsx
'use client';

import { useState } from 'react';
import { ProductGrid } from '@/components/pos/ProductGrid';
import { Cart } from '@/components/pos/Cart';
import { PaymentModal } from '@/components/pos/PaymentModal';
import { BarcodeScanner } from '@/components/pos/BarcodeScanner';

export default function SalesPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showPayment, setShowPayment] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  return (
    <div className="h-screen flex flex-col lg:flex-row">
      {/* Product Selection - Left/Main */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Search & Scanner Bar */}
        <div className="p-4 border-b bg-white">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search products or scan barcode..."
                className="w-full px-4 py-3 pl-10 border rounded-lg"
                onKeyDown={handleBarcodeInput}
              />
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
            <button
              onClick={() => setShowScanner(true)}
              className="px-4 py-3 bg-primary text-white rounded-lg md:hidden"
            >
              <BarcodeIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <CategoryTabs />

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <ProductGrid onAddToCart={addToCart} />
        </div>
      </div>

      {/* Cart - Right/Bottom */}
      <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l bg-white flex flex-col">
        <Cart
          items={cart}
          onUpdateQuantity={updateQuantity}
          onRemoveItem={removeItem}
          onCheckout={() => setShowPayment(true)}
        />
      </div>

      {/* Modals */}
      {showPayment && (
        <PaymentModal
          cart={cart}
          onClose={() => setShowPayment(false)}
          onComplete={handlePaymentComplete}
        />
      )}

      {showScanner && (
        <BarcodeScanner
          onScan={handleBarcodeScan}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}
```

### 2. Cart State Management

```tsx
// types/pos.ts
export interface CartItem {
  id: string;
  product_id: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  discount?: {
    type: 'percentage' | 'fixed';
    value: number;
  };
  tax_rate?: number;
  notes?: string;
}

export interface CartState {
  items: CartItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  customer_id?: string;
}

// hooks/useCart.ts
'use client';

import { useState, useCallback, useMemo } from 'react';

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [globalDiscount, setGlobalDiscount] = useState<{
    type: 'percentage' | 'fixed';
    value: number;
  } | null>(null);

  const addItem = useCallback((product: Product, quantity = 1) => {
    setItems(prev => {
      const existing = prev.find(item => item.product_id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, {
        id: crypto.randomUUID(),
        product_id: product.id,
        name: product.name,
        sku: product.sku,
        price: product.selling_price,
        quantity,
        tax_rate: product.tax_rate,
      }];
    });
  }, []);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems(prev => prev.filter(item => item.id !== itemId));
    } else {
      setItems(prev =>
        prev.map(item =>
          item.id === itemId ? { ...item, quantity } : item
        )
      );
    }
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
  }, []);

  const applyItemDiscount = useCallback((
    itemId: string,
    discount: { type: 'percentage' | 'fixed'; value: number }
  ) => {
    setItems(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, discount } : item
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setCustomerId(null);
    setGlobalDiscount(null);
  }, []);

  // Calculate totals
  const totals = useMemo(() => {
    let subtotal = 0;
    let itemDiscounts = 0;
    let tax = 0;

    items.forEach(item => {
      const lineTotal = item.price * item.quantity;
      let lineDiscount = 0;

      if (item.discount) {
        lineDiscount = item.discount.type === 'percentage'
          ? lineTotal * (item.discount.value / 100)
          : item.discount.value;
      }

      const taxableAmount = lineTotal - lineDiscount;
      const lineTax = item.tax_rate
        ? taxableAmount * (item.tax_rate / 100)
        : 0;

      subtotal += lineTotal;
      itemDiscounts += lineDiscount;
      tax += lineTax;
    });

    // Apply global discount
    let globalDiscountAmount = 0;
    if (globalDiscount) {
      globalDiscountAmount = globalDiscount.type === 'percentage'
        ? (subtotal - itemDiscounts) * (globalDiscount.value / 100)
        : globalDiscount.value;
    }

    const total = subtotal - itemDiscounts - globalDiscountAmount + tax;

    return {
      subtotal,
      itemDiscounts,
      globalDiscount: globalDiscountAmount,
      totalDiscount: itemDiscounts + globalDiscountAmount,
      tax,
      total: Math.max(0, total),
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    };
  }, [items, globalDiscount]);

  return {
    items,
    customerId,
    globalDiscount,
    totals,
    addItem,
    updateQuantity,
    removeItem,
    applyItemDiscount,
    setCustomerId,
    setGlobalDiscount,
    clearCart,
  };
}
```

### 3. Product Grid Component

```tsx
// components/pos/ProductGrid.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useProducts } from '@/hooks/useProducts';
import { formatCurrency } from '@/lib/utils';

interface ProductGridProps {
  onAddToCart: (product: Product) => void;
  categoryId?: string;
}

export function ProductGrid({ onAddToCart, categoryId }: ProductGridProps) {
  const { products, isLoading } = useProducts({ categoryId });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="aspect-square bg-gray-100 animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {products.map(product => (
        <button
          key={product.id}
          onClick={() => onAddToCart(product)}
          disabled={product.stock_quantity <= 0}
          className={cn(
            "flex flex-col bg-white rounded-lg border p-3 text-left",
            "hover:border-primary hover:shadow-md transition-all",
            "active:scale-95",
            product.stock_quantity <= 0 && "opacity-50 cursor-not-allowed"
          )}
        >
          {/* Product Image */}
          <div className="relative aspect-square mb-2 bg-gray-50 rounded-md overflow-hidden">
            {product.image_url ? (
              <Image
                src={product.image_url}
                alt={product.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-300">
                <PackageIcon className="w-8 h-8" />
              </div>
            )}
            {product.stock_quantity <= 5 && product.stock_quantity > 0 && (
              <span className="absolute top-1 right-1 px-1.5 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded">
                Low Stock
              </span>
            )}
            {product.stock_quantity <= 0 && (
              <span className="absolute top-1 right-1 px-1.5 py-0.5 bg-red-100 text-red-800 text-xs rounded">
                Out of Stock
              </span>
            )}
          </div>

          {/* Product Info */}
          <h3 className="font-medium text-sm line-clamp-2 mb-1">
            {product.name}
          </h3>
          <p className="text-xs text-gray-500 mb-2">{product.sku}</p>
          <p className="font-bold text-primary mt-auto">
            {formatCurrency(product.selling_price)}
          </p>
        </button>
      ))}
    </div>
  );
}
```

### 4. Cart Component

```tsx
// components/pos/Cart.tsx
'use client';

import { Minus, Plus, Trash2, Percent } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface CartProps {
  items: CartItem[];
  totals: CartTotals;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onApplyDiscount: (itemId: string, discount: Discount) => void;
  onCheckout: () => void;
}

export function Cart({
  items,
  totals,
  onUpdateQuantity,
  onRemoveItem,
  onApplyDiscount,
  onCheckout,
}: CartProps) {
  if (items.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <ShoppingCartIcon className="w-16 h-16 text-gray-300 mb-4" />
        <h3 className="font-semibold text-gray-600 mb-2">Cart is empty</h3>
        <p className="text-sm text-gray-400">
          Add products to start a sale
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Cart Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Current Sale</h2>
          <span className="text-sm text-gray-500">
            {totals.itemCount} items
          </span>
        </div>
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {items.map(item => (
          <div
            key={item.id}
            className="bg-gray-50 rounded-lg p-3"
          >
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm truncate">{item.name}</h4>
                <p className="text-xs text-gray-500">{item.sku}</p>
                <p className="text-sm font-semibold text-primary mt-1">
                  {formatCurrency(item.price)}
                </p>
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                  className="p-1.5 rounded-md hover:bg-gray-200 min-w-[36px] min-h-[36px] flex items-center justify-center"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center font-medium">
                  {item.quantity}
                </span>
                <button
                  onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                  className="p-1.5 rounded-md hover:bg-gray-200 min-w-[36px] min-h-[36px] flex items-center justify-center"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Line Total & Actions */}
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200">
              <div className="flex gap-2">
                <button
                  onClick={() => {/* Show discount modal */}}
                  className="text-xs text-primary hover:underline"
                >
                  <Percent className="w-3 h-3 inline mr-1" />
                  Discount
                </button>
                <button
                  onClick={() => onRemoveItem(item.id)}
                  className="text-xs text-red-600 hover:underline"
                >
                  <Trash2 className="w-3 h-3 inline mr-1" />
                  Remove
                </button>
              </div>
              <span className="font-semibold">
                {formatCurrency(item.price * item.quantity)}
              </span>
            </div>

            {/* Item Discount */}
            {item.discount && (
              <div className="text-xs text-green-600 mt-1">
                Discount: -{item.discount.type === 'percentage'
                  ? `${item.discount.value}%`
                  : formatCurrency(item.discount.value)
                }
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Cart Summary */}
      <div className="border-t p-4 space-y-2 bg-gray-50">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal</span>
          <span>{formatCurrency(totals.subtotal)}</span>
        </div>
        {totals.totalDiscount > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Discount</span>
            <span>-{formatCurrency(totals.totalDiscount)}</span>
          </div>
        )}
        {totals.tax > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Tax</span>
            <span>{formatCurrency(totals.tax)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-lg pt-2 border-t">
          <span>Total</span>
          <span className="text-primary">{formatCurrency(totals.total)}</span>
        </div>

        {/* Checkout Button */}
        <button
          onClick={onCheckout}
          className="w-full py-4 bg-primary text-white rounded-lg font-semibold text-lg hover:bg-primary-dark transition-colors"
        >
          Checkout
        </button>
      </div>
    </div>
  );
}
```

### 5. Payment Processing

```tsx
// components/pos/PaymentModal.tsx
'use client';

import { useState } from 'react';
import { X, CreditCard, Banknote, Smartphone, SplitSquareHorizontal } from 'lucide-react';

type PaymentMethod = 'cash' | 'card' | 'upi' | 'split';

interface PaymentModalProps {
  totals: CartTotals;
  onClose: () => void;
  onComplete: (payment: PaymentDetails) => void;
}

export function PaymentModal({ totals, onClose, onComplete }: PaymentModalProps) {
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [cashReceived, setCashReceived] = useState('');
  const [processing, setProcessing] = useState(false);

  const change = method === 'cash' && cashReceived
    ? parseFloat(cashReceived) - totals.total
    : 0;

  const handleComplete = async () => {
    setProcessing(true);
    try {
      await onComplete({
        method,
        amount: totals.total,
        cash_received: method === 'cash' ? parseFloat(cashReceived) : undefined,
        change: method === 'cash' ? Math.max(0, change) : undefined,
      });
    } finally {
      setProcessing(false);
    }
  };

  // Quick cash buttons
  const quickCashAmounts = [
    Math.ceil(totals.total / 10) * 10,
    Math.ceil(totals.total / 50) * 50,
    Math.ceil(totals.total / 100) * 100,
    Math.ceil(totals.total / 500) * 500,
  ].filter((v, i, a) => a.indexOf(v) === i && v >= totals.total);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">Payment</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Amount */}
        <div className="p-6 text-center border-b bg-gray-50">
          <p className="text-sm text-gray-500 mb-1">Amount Due</p>
          <p className="text-4xl font-bold text-primary">
            {formatCurrency(totals.total)}
          </p>
        </div>

        {/* Payment Methods */}
        <div className="p-4 border-b">
          <p className="text-sm font-medium mb-3">Payment Method</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'cash', label: 'Cash', icon: Banknote },
              { id: 'card', label: 'Card', icon: CreditCard },
              { id: 'upi', label: 'UPI', icon: Smartphone },
              { id: 'split', label: 'Split', icon: SplitSquareHorizontal },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setMethod(id as PaymentMethod)}
                className={cn(
                  "flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all",
                  method === id
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Cash Input */}
        {method === 'cash' && (
          <div className="p-4 border-b">
            <p className="text-sm font-medium mb-3">Cash Received</p>
            <input
              type="number"
              value={cashReceived}
              onChange={(e) => setCashReceived(e.target.value)}
              placeholder="Enter amount"
              className="w-full px-4 py-3 text-2xl text-center border rounded-lg"
              autoFocus
            />

            {/* Quick amounts */}
            <div className="flex gap-2 mt-3">
              {quickCashAmounts.slice(0, 4).map(amount => (
                <button
                  key={amount}
                  onClick={() => setCashReceived(amount.toString())}
                  className="flex-1 py-2 px-3 bg-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200"
                >
                  {formatCurrency(amount)}
                </button>
              ))}
            </div>

            {/* Change */}
            {cashReceived && change >= 0 && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg text-center">
                <p className="text-sm text-green-600">Change to return</p>
                <p className="text-2xl font-bold text-green-700">
                  {formatCurrency(change)}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Complete Button */}
        <div className="p-4">
          <button
            onClick={handleComplete}
            disabled={
              processing ||
              (method === 'cash' && (!cashReceived || parseFloat(cashReceived) < totals.total))
            }
            className={cn(
              "w-full py-4 rounded-lg font-semibold text-lg transition-colors",
              "bg-primary text-white hover:bg-primary-dark",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {processing ? 'Processing...' : 'Complete Sale'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

### 6. Barcode Scanner

```tsx
// components/pos/BarcodeScanner.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';
import { X, Camera, FlashlightIcon } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [torch, setTorch] = useState(false);

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();
    let mounted = true;

    async function startScanning() {
      try {
        const devices = await codeReader.listVideoInputDevices();
        const backCamera = devices.find(d =>
          d.label.toLowerCase().includes('back') ||
          d.label.toLowerCase().includes('rear')
        ) || devices[0];

        if (!backCamera) {
          setError('No camera found');
          return;
        }

        await codeReader.decodeFromVideoDevice(
          backCamera.deviceId,
          videoRef.current!,
          (result, err) => {
            if (result && mounted) {
              onScan(result.getText());
              onClose();
            }
          }
        );
      } catch (err) {
        setError('Camera access denied');
      }
    }

    startScanning();

    return () => {
      mounted = false;
      codeReader.reset();
    };
  }, [onScan, onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent">
        <button
          onClick={onClose}
          className="p-2 text-white rounded-full bg-black/30"
        >
          <X className="w-6 h-6" />
        </button>
        <button
          onClick={() => setTorch(!torch)}
          className="p-2 text-white rounded-full bg-black/30"
        >
          <FlashlightIcon className={cn("w-6 h-6", torch && "text-yellow-400")} />
        </button>
      </div>

      {/* Camera View */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
      />

      {/* Scanner Frame */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-64 h-64 border-2 border-white rounded-2xl relative">
          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-xl" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-xl" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-xl" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-xl" />

          {/* Scanning line animation */}
          <div className="absolute left-4 right-4 h-0.5 bg-primary animate-scan" />
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-0 left-0 right-0 p-6 text-center text-white bg-gradient-to-t from-black/50 to-transparent">
        <p className="text-lg font-medium">Point at barcode to scan</p>
        <p className="text-sm opacity-75 mt-1">
          Position barcode within the frame
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-center text-white p-6">
            <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">{error}</p>
            <button
              onClick={onClose}
              className="mt-4 px-6 py-2 bg-white text-black rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

### 7. Receipt Generation

```tsx
// lib/receipt.ts
interface ReceiptData {
  sale_id: string;
  store: Store;
  items: CartItem[];
  totals: CartTotals;
  payment: PaymentDetails;
  customer?: Customer;
  cashier: string;
  created_at: Date;
}

export function generateReceiptHTML(data: ReceiptData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Courier New', monospace; font-size: 12px; width: 80mm; margin: 0; padding: 10px; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .line { border-top: 1px dashed #000; margin: 8px 0; }
        .row { display: flex; justify-content: space-between; }
        .item-row { margin: 4px 0; }
      </style>
    </head>
    <body>
      <div class="center bold" style="font-size: 16px;">${data.store.name}</div>
      <div class="center">${data.store.address}</div>
      <div class="center">Tel: ${data.store.phone}</div>
      ${data.store.gst ? `<div class="center">GST: ${data.store.gst}</div>` : ''}

      <div class="line"></div>

      <div class="row">
        <span>Receipt #:</span>
        <span>${data.sale_id}</span>
      </div>
      <div class="row">
        <span>Date:</span>
        <span>${formatDate(data.created_at)}</span>
      </div>
      <div class="row">
        <span>Cashier:</span>
        <span>${data.cashier}</span>
      </div>
      ${data.customer ? `
        <div class="row">
          <span>Customer:</span>
          <span>${data.customer.name}</span>
        </div>
      ` : ''}

      <div class="line"></div>

      ${data.items.map(item => `
        <div class="item-row">
          <div>${item.name}</div>
          <div class="row">
            <span>${item.quantity} x ${formatCurrency(item.price)}</span>
            <span>${formatCurrency(item.price * item.quantity)}</span>
          </div>
          ${item.discount ? `
            <div class="row" style="color: #666;">
              <span>  Discount</span>
              <span>-${formatCurrency(calculateDiscount(item))}</span>
            </div>
          ` : ''}
        </div>
      `).join('')}

      <div class="line"></div>

      <div class="row">
        <span>Subtotal:</span>
        <span>${formatCurrency(data.totals.subtotal)}</span>
      </div>
      ${data.totals.totalDiscount > 0 ? `
        <div class="row">
          <span>Discount:</span>
          <span>-${formatCurrency(data.totals.totalDiscount)}</span>
        </div>
      ` : ''}
      ${data.totals.tax > 0 ? `
        <div class="row">
          <span>Tax:</span>
          <span>${formatCurrency(data.totals.tax)}</span>
        </div>
      ` : ''}
      <div class="row bold" style="font-size: 14px; margin-top: 8px;">
        <span>TOTAL:</span>
        <span>${formatCurrency(data.totals.total)}</span>
      </div>

      <div class="line"></div>

      <div class="row">
        <span>Payment:</span>
        <span>${data.payment.method.toUpperCase()}</span>
      </div>
      ${data.payment.method === 'cash' ? `
        <div class="row">
          <span>Cash Received:</span>
          <span>${formatCurrency(data.payment.cash_received!)}</span>
        </div>
        <div class="row">
          <span>Change:</span>
          <span>${formatCurrency(data.payment.change!)}</span>
        </div>
      ` : ''}

      <div class="line"></div>

      <div class="center" style="margin-top: 16px;">
        Thank you for your purchase!
      </div>
      <div class="center" style="margin-top: 8px; font-size: 10px;">
        ${data.store.receipt_footer || ''}
      </div>
    </body>
    </html>
  `;
}

// Print receipt
export async function printReceipt(data: ReceiptData) {
  const html = generateReceiptHTML(data);

  // For web printing
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
    printWindow.close();
  }
}
```

## Database Schema

```sql
-- Sales table
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) NOT NULL,
  customer_id UUID REFERENCES customers(id),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  sale_number VARCHAR(50) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2) DEFAULT 0,
  tax DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(20) NOT NULL,
  payment_status VARCHAR(20) DEFAULT 'completed',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sale items table
CREATE TABLE sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID REFERENCES sales(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  sku VARCHAR(100),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2) DEFAULT 0,
  tax DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID REFERENCES sales(id) ON DELETE CASCADE NOT NULL,
  method VARCHAR(20) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  cash_received DECIMAL(10,2),
  change_given DECIMAL(10,2),
  reference_number VARCHAR(100),
  status VARCHAR(20) DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_sales_store ON sales(store_id);
CREATE INDEX idx_sales_date ON sales(created_at);
CREATE INDEX idx_sales_customer ON sales(customer_id);
CREATE INDEX idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product ON sale_items(product_id);
```

## Keyboard Shortcuts

```tsx
// hooks/usePOSShortcuts.ts
import { useEffect } from 'react';

export function usePOSShortcuts({
  onNewSale,
  onCheckout,
  onHoldSale,
  onRecallSale,
  onClearCart,
}: POSShortcutHandlers) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ctrl/Cmd shortcuts
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'n': // New sale
            e.preventDefault();
            onNewSale();
            break;
          case 'Enter': // Checkout
            e.preventDefault();
            onCheckout();
            break;
          case 'h': // Hold sale
            e.preventDefault();
            onHoldSale();
            break;
          case 'r': // Recall held sale
            e.preventDefault();
            onRecallSale();
            break;
          case 'Delete': // Clear cart
            e.preventDefault();
            onClearCart();
            break;
        }
      }

      // F-key shortcuts
      switch (e.key) {
        case 'F2': // Focus search
          e.preventDefault();
          document.querySelector<HTMLInputElement>('#product-search')?.focus();
          break;
        case 'F4': // Toggle scanner
          e.preventDefault();
          // Toggle scanner
          break;
        case 'F12': // Quick checkout
          e.preventDefault();
          onCheckout();
          break;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNewSale, onCheckout, onHoldSale, onRecallSale, onClearCart]);
}
```

## Best Practices

1. **Always validate stock** before completing sale
2. **Use optimistic updates** for cart operations
3. **Cache products** for fast loading
4. **Support offline mode** with queue sync
5. **Log all transactions** for audit trail
6. **Handle payment failures** gracefully
7. **Support keyboard-only** operation
8. **Mobile-first design** for tablet POS

## References

- `references/payment-integrations.md` - Payment gateway patterns
- `references/receipt-templates.md` - Receipt customization
- `references/hardware-integration.md` - Scanner/printer setup
