# IndexedDB Best Practices for POS

## Dexie.js Setup

```bash
npm install dexie
```

## Database Versioning

```tsx
// Always increment version when schema changes
class POSDatabase extends Dexie {
  constructor() {
    super('pos_db');

    // Version 1 - Initial schema
    this.version(1).stores({
      products: 'id, sku, barcode',
      sales: 'id, created_at',
    });

    // Version 2 - Added sync queue
    this.version(2).stores({
      products: 'id, sku, barcode, category_id',
      sales: 'id, created_at, synced',
      syncQueue: 'id, type, created_at',
    });

    // Version 3 - Added customers
    this.version(3).stores({
      products: 'id, sku, barcode, category_id',
      sales: 'id, created_at, synced',
      syncQueue: 'id, type, created_at',
      customers: 'id, phone, email',
    }).upgrade(tx => {
      // Migration logic if needed
    });
  }
}
```

## Efficient Queries

```tsx
// Good - Uses index
await db.products.where('barcode').equals('123456').first();

// Good - Uses compound query
await db.products.where('category_id').equals('cat-1').and(p => p.stock > 0).toArray();

// Bad - Full table scan
await db.products.filter(p => p.name.includes('shirt')).toArray();

// Better - Create index for common searches
// In schema: products: 'id, sku, barcode, *tags'
```

## Bulk Operations

```tsx
// Good - Single transaction
await db.transaction('rw', db.products, async () => {
  await db.products.bulkPut(products);
});

// Bad - Multiple transactions
for (const product of products) {
  await db.products.put(product);
}
```

## Storage Limits

```tsx
// Check storage usage
async function checkStorageUsage() {
  if (navigator.storage && navigator.storage.estimate) {
    const { usage, quota } = await navigator.storage.estimate();
    const percentUsed = ((usage || 0) / (quota || 1)) * 100;
    console.log(`Using ${percentUsed.toFixed(2)}% of available storage`);

    if (percentUsed > 80) {
      await cleanupOldData();
    }
  }
}

// Cleanup old data
async function cleanupOldData() {
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

  // Delete old synced sales
  await db.sales
    .where('created_at')
    .below(thirtyDaysAgo)
    .and(sale => sale.synced)
    .delete();
}
```

## Error Handling

```tsx
try {
  await db.products.add(product);
} catch (error) {
  if (error.name === 'ConstraintError') {
    // Duplicate key - update instead
    await db.products.put(product);
  } else if (error.name === 'QuotaExceededError') {
    // Storage full
    await cleanupOldData();
    await db.products.add(product);
  } else {
    throw error;
  }
}
```

## React Integration

```tsx
// Custom hook for reactive queries
function useLiveQuery<T>(
  querier: () => Promise<T>,
  deps: any[] = []
): T | undefined {
  const [result, setResult] = useState<T>();

  useEffect(() => {
    let mounted = true;

    const subscription = liveQuery(querier).subscribe({
      next: (value) => {
        if (mounted) setResult(value);
      },
      error: (error) => console.error(error),
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, deps);

  return result;
}

// Usage
function ProductList() {
  const products = useLiveQuery(
    () => db.products.where('stock').above(0).toArray(),
    []
  );

  // Automatically updates when products change
}
```
