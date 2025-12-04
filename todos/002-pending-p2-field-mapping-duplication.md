# Todo: Extract Field Mapping to Shared Utility

---
status: pending
priority: p2
issue_id: 002
tags: [code-review, architecture, dry-violation]
dependencies: []
---

## Problem Statement

Same field mapping logic is duplicated in **2 different files** with inconsistent implementations. This creates high maintenance burden and risk of mapping bugs.

**Why it matters:** Adding a new field requires changes in multiple locations, and inconsistencies can cause data loss.

## Findings

**Duplicate Location 1:** `app/(dashboard)/create/page.tsx` (Lines 374-404)
```typescript
const fieldToTemplateVar: Record<string, string> = {
  title: 'eventName',
  eventName: 'eventName',
  name: 'eventName',
  // ... 30+ mappings
}
```

**Duplicate Location 2:** `app/api/generate/route.ts` (Lines 377-422)
```typescript
function extractFromFormData(formData: Record<string, unknown>): Partial<CreativeContent> {
  return {
    eventName: String(
      formData.title || formData.eventName || formData.eventTitle || formData.name || ''
    ).trim() || undefined,
    // ... same mappings inline
  }
}
```

**Problems:**
1. Different approaches (object vs inline extraction)
2. Different field name priorities
3. No centralized documentation

## Proposed Solutions

### Solution 1: Create Shared Utility Module (Recommended)
**Pros:** Single source of truth, testable, documented
**Cons:** Requires import changes in multiple files
**Effort:** Medium (2-4 hours)
**Risk:** Low

```typescript
// lib/utils/field-mapper.ts
export const FIELD_ALIASES: Record<string, string[]> = {
  eventName: ['title', 'eventName', 'eventTitle', 'name'],
  eventDate: ['date', 'eventDate'],
  eventTime: ['time', 'eventTime'],
  venue: ['venue', 'location', 'venueName'],
  speakerName: ['speaker', 'guestName', 'speakerName', 'guest', 'chiefGuest'],
  speakerDesignation: ['designation', 'guestDesignation', 'speakerDesignation'],
  description: ['description', 'additionalInfo'],
}

export function normalizeFieldName(fieldName: string): string {
  for (const [canonical, aliases] of Object.entries(FIELD_ALIASES)) {
    if (aliases.includes(fieldName)) return canonical
  }
  return fieldName
}

export function extractFieldValue(
  formData: Record<string, unknown>,
  canonicalName: string
): string | undefined {
  const aliases = FIELD_ALIASES[canonicalName] || [canonicalName]
  for (const alias of aliases) {
    const value = formData[alias]
    if (value && String(value).trim()) {
      return String(value).trim()
    }
  }
  return undefined
}
```

### Solution 2: Keep Current + Add Documentation
**Pros:** No code changes
**Cons:** Duplication remains, risk persists
**Effort:** Small (30 min)
**Risk:** High (not recommended)

## Recommended Action

Implement **Solution 1** - create `lib/utils/field-mapper.ts` and refactor both files to use it.

## Technical Details

**Affected Files:**
- `app/(dashboard)/create/page.tsx` - Replace `fieldToTemplateVar` object
- `app/api/generate/route.ts` - Replace `extractFromFormData` function
- NEW: `lib/utils/field-mapper.ts`

**Components:**
- CreatePage template replacement
- Generate API form data extraction

## Acceptance Criteria

- [ ] Single `FIELD_ALIASES` constant used by both files
- [ ] All existing field mappings preserved
- [ ] Unit tests for `normalizeFieldName()` and `extractFieldValue()`
- [ ] TypeScript types for field names

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2025-12-04 | Created from code review | DRY violation identified |

## Resources

- Architecture review findings
- Pattern recognition analysis
