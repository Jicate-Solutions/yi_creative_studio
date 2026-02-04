# Fix: Google Calendar Sync RLS Policy Violation

## Problem Summary

Google Calendar connection works successfully, but event sync fails with RLS policy violations:

```
Failed to upsert event: {
  code: '42501',
  message: 'new row violates row-level security policy for table "synced_events"'
}
```

## Root Cause Analysis (Updated)

**The actual issue:** The sync service uses `createClient()` which creates an authenticated server-side client. When `syncEvents()` is called asynchronously after the OAuth callback redirect, the user session context is lost.

1. **Session context lost after redirect**
   - OAuth callback triggers `syncEvents(fullConnection, true).catch(...)`
   - This runs AFTER the redirect response is sent
   - The cookies/session are no longer accessible
   - `auth.uid()` returns null → RLS policies deny access

2. **RLS policies exist but require auth.uid()**
   - Policies check `organization_members.user_id = auth.uid()`
   - Without a valid session, `auth.uid()` is null
   - All policies fail → deny by default

3. **Working pattern in codebase**
   - `app/api/external-events/route.ts` uses `createAdminClient()` for synced_events
   - Service role client bypasses RLS (appropriate for background operations)

---

## Solution: Use Service Role Client for Sync Operations

### Recommended Approach

Change the sync service to use `createAdminClient()` instead of `createClient()`.

**Why this is correct:**
- Sync is a background/system operation, not a direct user action
- User permissions were already verified during OAuth (only admins can connect)
- This matches the pattern used in `app/api/external-events/route.ts`
- Service role client is designed for server-side operations without user context

---

## Implementation Plan

### Step 1: Update google-calendar-service.ts to use Admin Client

**File:** `lib/services/google-calendar/google-calendar-service.ts`

**Change:** Replace `createClient()` with `createAdminClient()` in the `syncEvents` function.

```typescript
// Before (line 376):
import { createClient } from '@/lib/supabase/server'
// ...
const supabase = await createClient()

// After:
import { createAdminClient } from '@/lib/supabase/admin'
// ...
const supabase = createAdminClient()  // Note: not async
```

**Full changes needed:**
1. Add import: `import { createAdminClient } from '@/lib/supabase/admin'`
2. In `syncEvents()` function, change line 376 from:
   ```typescript
   const supabase = await createClient()
   ```
   to:
   ```typescript
   const supabase = createAdminClient()
   ```

### Step 2: Test the Fix

1. Click "Sync Now" in Settings > Integrations
2. Check server logs - should see successful sync instead of RLS errors
3. Verify events appear on the /events page

---

## Critical Files

| File | Action |
|------|--------|
| `lib/services/google-calendar/google-calendar-service.ts` | Change `createClient()` to `createAdminClient()` |

---

## Verification Steps

1. **Apply code change** to google-calendar-service.ts

2. **Test sync:**
   - Go to Settings > Integrations
   - Click "Sync Now" 
   - Server logs should show successful sync (no RLS errors)

3. **Verify events:**
   - Navigate to /events page
   - Synced Google Calendar events should be visible

4. **Database check:**
   ```sql
   SELECT COUNT(*) FROM synced_events WHERE source_app_id = 'google-calendar';
   ```

---

# Fix: Event Source Filter Not Working

## Problem

The event source filter dropdown (showing "yi-connect" or "google-calendar") doesn't actually filter the events. All events from all sources are displayed regardless of the selected filter.

## Root Cause

The cache in `hooks/use-external-events.ts` is keyed only by `organization_id`, not by the source filter:

```typescript
// Line 80: Cache key doesn't include sourceFilter
const cacheKey = currentOrganization.id
```

When the user changes the filter:
1. Hook detects change and calls `fetchEvents()`
2. Cache check finds cached data (from previous "all sources" fetch)
3. Cache is still valid (within 5 min), returns cached UNFILTERED events
4. User sees all events despite selecting a specific source

## Solution

Include `sourceFilter` in the cache key and cache validation.

### File: `hooks/use-external-events.ts`

**Change 1:** Update cache key (line ~80)
```typescript
// Before:
const cacheKey = currentOrganization.id

// After:
const cacheKey = `${currentOrganization.id}|${sourceFilter || 'all'}`
```

**Change 2:** Store sourceFilter in cache entry (line ~113-117)
```typescript
eventCache.set(cacheKey, {
  events,
  timestamp: Date.now(),
  month: state.currentMonth,
  sourceFilter: sourceFilter || 'all',  // Add this
})
```

**Change 3:** Update CacheEntry interface (line ~22-27)
```typescript
interface CacheEntry {
  events: ExternalEvent[]
  timestamp: number
  month: string
  sourceFilter?: string  // Add this
}
```

## Verification

1. Select "google-calendar" from filter → Only Google Calendar events shown
2. Select "yi-connect" from filter → Only Yi Connect events shown
3. Select "All Sources" → All events shown
