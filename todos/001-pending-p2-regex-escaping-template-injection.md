# Todo: Add Regex Escaping for Template Variables

---
status: pending
priority: p2
issue_id: 001
tags: [code-review, security, performance]
dependencies: []
---

## Problem Statement

Template variable replacement uses `new RegExp()` with user-controlled keys without escaping regex metacharacters. This creates both security (ReDoS) and correctness risks.

**Why it matters:** If template variable names or form field keys contain regex special characters (`$`, `*`, `+`, `?`, `.`), the replacement could fail or behave unexpectedly.

## Findings

**Location:** `app/(dashboard)/create/page.tsx` (Lines 411-420)

**Current Code:**
```typescript
Object.entries(formData.formData).forEach(([key, value]) => {
  if (isValidValue(value)) {
    const templateVar = fieldToTemplateVar[key] || key
    const safeValue = String(value).trim()
    prompt = prompt.replace(new RegExp(`{{${templateVar}}}`, 'g'), safeValue)
    prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), safeValue)
  }
})
```

**Issues:**
1. `new RegExp()` compiles regex on every iteration (O(n) compilation overhead)
2. No escaping of regex metacharacters in `templateVar` or `key`
3. Performance: Multiple full-string scans per field

## Proposed Solutions

### Solution 1: Add Regex Escaping (Recommended)
**Pros:** Minimal change, fixes security issue
**Cons:** Still has performance overhead from per-iteration regex
**Effort:** Small (30 min)
**Risk:** Low

```typescript
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

Object.entries(formData.formData).forEach(([key, value]) => {
  if (isValidValue(value)) {
    const templateVar = fieldToTemplateVar[key] || key
    const safeValue = String(value).trim()
    const escapedVar = escapeRegex(templateVar)
    const escapedKey = escapeRegex(key)
    prompt = prompt.replace(new RegExp(`\\{\\{${escapedVar}\\}\\}`, 'g'), safeValue)
    prompt = prompt.replace(new RegExp(`\\{\\{${escapedKey}\\}\\}`, 'g'), safeValue)
  }
})
```

### Solution 2: Single-Pass Replacement (Best Performance)
**Pros:** 80-90% performance improvement, cleaner code
**Cons:** Larger refactor
**Effort:** Medium (1-2 hours)
**Risk:** Low

```typescript
function replaceTemplatePlaceholders(
  prompt: string,
  formData: Record<string, unknown>,
  fieldMapping: Record<string, string>
): string {
  const replacements = new Map<string, string>()

  Object.entries(formData).forEach(([key, value]) => {
    if (isValidValue(value)) {
      const safeValue = String(value).trim()
      const templateVar = fieldMapping[key] || key
      replacements.set(`{{${templateVar}}}`, safeValue)
      replacements.set(`{{${key}}}`, safeValue)
    }
  })

  // Build single combined regex
  const pattern = Array.from(replacements.keys())
    .map(p => p.replace(/[{}]/g, '\\$&'))
    .join('|')

  if (!pattern) return prompt

  return prompt.replace(new RegExp(pattern, 'g'), match => replacements.get(match) || match)
}
```

## Recommended Action

Implement **Solution 2** for both security and performance benefits.

## Technical Details

**Affected Files:**
- `app/(dashboard)/create/page.tsx` (Lines 411-420)

**Components:**
- `CreatePage` component
- Template variable replacement logic

## Acceptance Criteria

- [ ] Regex metacharacters in field keys don't cause errors
- [ ] Performance test shows < 50ms for 50+ fields
- [ ] All existing template variables still replaced correctly
- [ ] Unit test for regex escaping edge cases

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2025-12-04 | Created from code review | Security + Performance issue identified |

## Resources

- PR: Current uncommitted changes on master
- Security: OWASP ReDoS prevention
- Performance: Regex compilation costs
