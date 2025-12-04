# Todo: Extract Field Priority Logic to Shared Hook

---
status: pending
priority: p2
issue_id: 004
tags: [code-review, architecture, dry-violation, react]
dependencies: []
---

## Problem Statement

Same field priority logic (`dynamicSchema > formatFields > staticSchema`) is duplicated in 2 places, creating risk of divergence and bugs.

**Why it matters:** If priority logic differs between validation and rendering, fields could be validated against wrong schema.

## Findings

**Duplicate Location 1:** `app/(dashboard)/create/page.tsx` (Lines 547-561)
```typescript
// Validation logic
let fieldsToValidate: Array<{ id: string; required: boolean }>
if (dynamicFields && dynamicFields.length > 0) {
  fieldsToValidate = dynamicFields
} else if (formatFields && formatFields.length > 0) {
  fieldsToValidate = formatFields
} else {
  fieldsToValidate = staticSchema.fields
}
```

**Duplicate Location 2:** `components/create/DynamicDetailsForm.tsx` (Lines 396-409)
```typescript
// Rendering logic
const effectiveFields = useMemo<SchemaField[]>(() => {
  if (dynamicSchema?.fields && dynamicSchema.fields.length > 0) {
    return dynamicSchema.fields.map(dynamicToSchemaField)
  }
  if (formatSpecificFields.length > 0) {
    return formatSpecificFields.map(formatFieldToSchemaField)
  }
  return staticSchema.fields
}, [dynamicSchema, formatSpecificFields, staticSchema])
```

**Problems:**
1. Same priority waterfall repeated
2. Different variable names
3. Risk of one being updated without the other

## Proposed Solutions

### Solution 1: Create Shared Hook (Recommended)
**Pros:** Single source of truth, reusable, memoized
**Cons:** Requires refactoring both components
**Effort:** Medium (1-2 hours)
**Risk:** Low

```typescript
// hooks/use-effective-schema.ts
import { useMemo } from 'react'
import { getFormatFields } from '@/lib/schemas/formatFieldSchemas'
import { getCreativeSchema } from '@/lib/schemas/creativeSchemas'

export interface UseEffectiveSchemaParams {
  formatId: string | null
  verticalSlug?: string
  dynamicSchema?: { fields: any[] } | null
}

export interface EffectiveSchema {
  fields: Array<{ id: string; required: boolean; label: string }>
  source: 'ai-generated' | 'format-specific' | 'static-fallback'
  schemaType: string
}

export function useEffectiveSchema({
  formatId,
  verticalSlug,
  dynamicSchema,
}: UseEffectiveSchemaParams): EffectiveSchema {
  return useMemo(() => {
    // Priority 1: AI-generated dynamic schema
    if (dynamicSchema?.fields && dynamicSchema.fields.length > 0) {
      return {
        fields: dynamicSchema.fields,
        source: 'ai-generated' as const,
        schemaType: dynamicSchema.schemaType || 'dynamic',
      }
    }

    // Priority 2: Format-specific fields
    const formatFields = getFormatFields(formatId || '', verticalSlug)
    if (formatFields.length > 0) {
      return {
        fields: formatFields,
        source: 'format-specific' as const,
        schemaType: formatId || 'format',
      }
    }

    // Priority 3: Static fallback
    const staticSchema = getCreativeSchema(formatId)
    return {
      fields: staticSchema.fields,
      source: 'static-fallback' as const,
      schemaType: staticSchema.schemaType,
    }
  }, [formatId, verticalSlug, dynamicSchema])
}
```

**Usage in both files:**
```typescript
// create/page.tsx
const { fields: fieldsToValidate } = useEffectiveSchema({
  formatId: selectedFormat?.id || null,
  verticalSlug: selectedVertical?.slug,
  dynamicSchema: dynamicSchema.schema,
})

// DynamicDetailsForm.tsx
const { fields: effectiveFields, source } = useEffectiveSchema({
  formatId,
  verticalSlug: verticalName,
  dynamicSchema,
})
```

## Recommended Action

Implement **Solution 1** - extract to `hooks/use-effective-schema.ts`.

## Technical Details

**Affected Files:**
- `app/(dashboard)/create/page.tsx` - Use hook for validation
- `components/create/DynamicDetailsForm.tsx` - Use hook for rendering
- NEW: `hooks/use-effective-schema.ts`

## Acceptance Criteria

- [ ] Single hook used by both components
- [ ] Same priority logic produces same results
- [ ] Memoization works correctly
- [ ] TypeScript types for schema fields
- [ ] Unit tests for priority resolution

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2025-12-04 | Created from code review | DRY violation in React components |

## Resources

- Architecture review findings
- Pattern recognition analysis
