# Todo: Standardize API Error Response Format

---
status: pending
priority: p3
issue_id: 008
tags: [code-review, api-design]
dependencies: []
---

## Problem Statement

API routes return inconsistent error formats, making client-side error handling difficult.

**Why it matters:** Inconsistent error formats require multiple handling paths on the client.

## Findings

**Inconsistent Error Formats:**

```typescript
// Format 1: Simple error string
{ error: 'message' }

// Format 2: With success flag
{ error: error.message, success: false }

// Format 3: With fallback data
{ error: 'message', fallbackSchema: {...} }

// Format 4: With details
{ error: 'message', details: 'additional info' }
```

## Proposed Solutions

### Solution 1: Standard Response Interface (Recommended)
**Pros:** Consistent, type-safe, predictable
**Cons:** Requires updating all API routes
**Effort:** Medium (2-3 hours)
**Risk:** Low

```typescript
// lib/types/api-response.ts
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    message: string
    code?: string
    details?: unknown
  }
  fallback?: T
}

// Usage in routes:
return NextResponse.json<ApiResponse<Creative>>({
  success: false,
  error: {
    message: 'Failed to generate creative',
    code: 'GENERATION_ERROR',
    details: { originalError: error.message }
  }
}, { status: 500 })
```

## Recommended Action

Implement **Solution 1** for all API routes.

## Technical Details

**Affected Files:**
- `app/api/generate/route.ts`
- `app/api/resize-template/route.ts`
- `app/api/generate-fields/route.ts`
- Other API routes

## Acceptance Criteria

- [ ] All API routes use `ApiResponse<T>` type
- [ ] Consistent error structure
- [ ] Client-side error handling simplified
- [ ] TypeScript types exported

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2025-12-04 | Created from code review | API consistency issue |

## Resources

- Architecture review findings
