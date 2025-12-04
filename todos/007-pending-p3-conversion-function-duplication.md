# Todo: Consolidate Schema Field Conversion Functions

---
status: pending
priority: p3
issue_id: 007
tags: [code-review, dry-violation]
dependencies: []
---

## Problem Statement

Two nearly identical converter functions exist in `DynamicDetailsForm.tsx` for converting different field types to the same `SchemaField` output.

**Why it matters:** Code duplication creates maintenance burden and risk of divergence.

## Findings

**Location:** `components/create/DynamicDetailsForm.tsx`

**Duplicate 1:** Lines 48-60
```typescript
function formatFieldToSchemaField(field: FormatDynamicField): SchemaField {
  return {
    id: field.id,
    label: field.label,
    type: field.type,
    required: field.required,
    placeholder: field.placeholder,
    maxLength: field.maxLength,
    rows: field.rows,
    options: field.options,
    suggestable: field.suggestable,
  }
}
```

**Duplicate 2:** Lines 333-345
```typescript
function dynamicToSchemaField(field: DynamicSchemaField): SchemaField {
  return {
    id: field.id,
    label: field.label,
    type: field.type,
    required: field.required,
    placeholder: field.placeholder,
    maxLength: field.maxLength,
    rows: field.rows,
    options: field.options,
    suggestable: field.suggestable,
  }
}
```

**Problem:** Two functions with identical bodies, different names, different input types.

## Proposed Solutions

### Solution 1: Generic Converter (Recommended)
**Pros:** Single function, type-safe
**Cons:** Requires TypeScript generics
**Effort:** Small (15-30 min)
**Risk:** Low

```typescript
interface SchemaFieldSource {
  id: string
  label: string
  type: string
  required: boolean
  placeholder?: string
  maxLength?: number
  rows?: number
  options?: string[]
  suggestable?: boolean
}

function toSchemaField<T extends SchemaFieldSource>(field: T): SchemaField {
  return {
    id: field.id,
    label: field.label,
    type: field.type,
    required: field.required,
    placeholder: field.placeholder,
    maxLength: field.maxLength,
    rows: field.rows,
    options: field.options,
    suggestable: field.suggestable,
  }
}

// Usage:
effectiveFields = dynamicSchema.fields.map(toSchemaField)
effectiveFields = formatSpecificFields.map(toSchemaField)
```

## Recommended Action

Implement **Solution 1** - create generic `toSchemaField` function.

## Technical Details

**Affected Files:**
- `components/create/DynamicDetailsForm.tsx`

## Acceptance Criteria

- [ ] Single `toSchemaField` function replaces both converters
- [ ] Type safety preserved
- [ ] No behavioral changes

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2025-12-04 | Created from code review | Simple DRY violation |

## Resources

- Pattern recognition analysis
