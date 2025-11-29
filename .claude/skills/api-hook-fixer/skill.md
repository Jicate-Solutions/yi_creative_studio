# API & Hook Integrity Fixer

Automatically detects and fixes broken API endpoints, hooks, and service layer connections after code changes. Use when user mentions "API broken", "hook not working", "endpoint error", "fetch failing", "data not loading", or after any significant code edits. Proactively scan and repair the entire data flow chain.

---

## Core Purpose

When APIs/hooks break, the problem is usually in the **connection chain**:
```
API Route → Service → Hook → Component
```

This skill traces the entire chain and fixes ALL breakages, not just the obvious one.

---

## Phase 1: Auto-Detection (Run Immediately)

### 1.1 Scan for Common Break Points

```bash
# Find all API routes
app/api/**/route.ts

# Find all services  
services/**/*.ts
lib/services/**/*.ts

# Find all hooks
hooks/**/*.ts
lib/hooks/**/*.ts

# Find API calls in components
components/**/*.tsx (fetch, useSWR, useQuery patterns)
```

### 1.2 Break Detection Patterns

| Symptom | Likely Cause | Check |
|---------|--------------|-------|
| 404 on API call | Route path changed/deleted | Compare route paths vs fetch URLs |
| Type errors | Interface changed | Compare API response vs hook types |
| Undefined data | Response structure changed | Check API return shape |
| Hook returns null | Service function renamed | Match service exports to hook imports |
| "is not a function" | Export changed | Check named vs default exports |
| CORS/network error | API route syntax error | Check route.ts exports |

### 1.3 Automated Chain Trace

For each broken feature, trace:
```
1. Component: What hook/fetch is called?
2. Hook: What service/API does it call?
3. Service: What endpoint does it hit?
4. API Route: What does it actually return?
5. Database: Does the query work?
```

---

## Phase 2: Common Fixes (Auto-Apply)

### 2.1 API Route Fixes

```typescript
// ❌ Common mistake: Wrong export
export default async function handler() {} // Pages Router style

// ✅ Fix: App Router style
export async function GET(request: Request) {}
export async function POST(request: Request) {}
```

```typescript
// ❌ Missing NextResponse
return { data: result }

// ✅ Fix
return NextResponse.json({ data: result })
```

```typescript
// ❌ Wrong status handling
return new Response(error)

// ✅ Fix
return NextResponse.json({ error: message }, { status: 500 })
```

### 2.2 Hook Fixes

```typescript
// ❌ Hardcoded wrong URL
fetch('/api/old-endpoint')

// ✅ Fix: Match actual route
fetch('/api/correct-endpoint')
```

```typescript
// ❌ Type mismatch after API change
const { data } = useQuery<OldType>()

// ✅ Fix: Update type to match new response
const { data } = useQuery<NewType>()
```

```typescript
// ❌ Missing error handling
const data = await response.json()

// ✅ Fix
if (!response.ok) throw new Error('Failed')
const data = await response.json()
```

### 2.3 Service Layer Fixes

```typescript
// ❌ Function renamed but not updated
export const getUsers = async () => {}
// Hook still calls: getUserList()

// ✅ Fix: Update hook to use new name OR add alias
export const getUsers = async () => {}
export const getUserList = getUsers // Alias for compatibility
```

---

## Phase 3: Integrity Check Script

Run this check sequence:

### Step 1: Map All Endpoints
```
Scan: app/api/**/route.ts
Extract: HTTP methods (GET, POST, PUT, DELETE)
Build: Endpoint map { path: methods[] }
```

### Step 2: Find All API Consumers
```
Scan: hooks/, services/, components/
Find: fetch(), axios, useSWR, useQuery, useMutation
Extract: URLs being called
```

### Step 3: Cross-Reference
```
For each API call:
  - Does endpoint exist? 
  - Does method match?
  - Do types align?
  - Is response structure correct?
```

### Step 4: Auto-Fix or Report
```
IF fixable (URL typo, import path, type update):
  → Fix automatically
  
IF needs decision (business logic change):
  → Report to user with options
```

---

## Phase 4: Quick Diagnosis Commands

### When user says "X is broken":

```
1. FIND the component using X
2. TRACE to the hook
3. TRACE to the service/fetch
4. TRACE to the API route
5. CHECK each connection point
6. FIX all breaks found
7. VERIFY with type check (npx tsc --noEmit)
```

### Common Scenarios

**"Data not loading"**
```
→ Check: Hook query key matches
→ Check: API route returns correct shape
→ Check: Service function is exported
→ Check: Types match throughout chain
```

**"Getting 404"**
```
→ Check: API route file exists at correct path
→ Check: Route exports correct HTTP method
→ Check: Fetch URL matches file path
→ Check: Dynamic route params correct [id] vs {id}
```

**"Type error after changes"**
```
→ Regenerate types: mcp__supabase__generate_typescript_types
→ Update interfaces in types/
→ Update hook return types
→ Update component prop types
```

**"Hook returns undefined"**
```
→ Check: API actually returns data
→ Check: Response parsing (await response.json())
→ Check: Query/mutation is enabled
→ Check: Suspense boundaries
```

---

## Phase 5: Preventive Patterns

### Recommend These Patterns to Prevent Breaks:

```typescript
// 1. Centralized API paths
// lib/api-paths.ts
export const API_PATHS = {
  users: '/api/users',
  products: '/api/products',
} as const

// 2. Type-safe API calls
// Use Zod to validate responses
const UserSchema = z.object({ id: z.string(), name: z.string() })
const data = UserSchema.parse(await response.json())

// 3. Shared types between API and hooks
// types/api.ts - single source of truth
```

---

## Phase 6: Auto-Run After Edits

When this skill detects you've edited:
- Any file in `app/api/`
- Any file in `services/`
- Any file in `types/`

**Automatically offer:**
```
"I noticed you changed [file]. Want me to check for broken connections?"
```

Then scan related hooks and components for breaks.

---

## Quick Fix Checklist

When something breaks, check in order:

- [ ] API route file exists at expected path?
- [ ] Route exports correct HTTP method (GET/POST/etc)?
- [ ] Route returns NextResponse.json()?
- [ ] Service imports from correct path?
- [ ] Service function is exported?
- [ ] Hook calls correct service/URL?
- [ ] Hook types match API response?
- [ ] Component uses correct hook?
- [ ] TypeScript compiles? (`npx tsc --noEmit`)

---

## Example Usage

**User:** "my products API is broken after I changed the schema"

**Skill Response:**
```
Tracing products chain...

Found issues:
1. ❌ API returns `{ items: [] }` but hook expects `{ products: [] }`
2. ❌ Type `Product` missing new `category_id` field
3. ❌ Hook `useProducts` has stale cache key

Fixing all 3...
✅ Updated API response key
✅ Added category_id to Product type
✅ Updated hook query key

Run `npx tsc --noEmit` - no errors.
```

---

## Anti-Patterns

❌ Only fixing the reported error (fix the whole chain)
❌ Guessing the problem (trace and verify)
❌ Leaving type mismatches (they'll break later)
❌ Manual URL strings everywhere (centralize)
❌ Ignoring TypeScript errors (they're hints)

✅ Trace full chain → Fix all breaks → Verify with tsc
