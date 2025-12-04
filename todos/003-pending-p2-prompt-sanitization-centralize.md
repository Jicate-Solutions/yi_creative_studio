# Todo: Centralize Prompt Sanitization Logic

---
status: pending
priority: p2
issue_id: 003
tags: [code-review, security, architecture]
dependencies: []
---

## Problem Statement

Three different sanitization strategies across three files with no centralized library. This creates inconsistency and maintenance burden.

**Why it matters:** Unsanitized prompts can cause `{{variableName}}` to appear literally in generated images.

## Findings

**Sanitization Location 1:** `app/(dashboard)/create/page.tsx` (Line 435)
```typescript
prompt = prompt.replace(/\{\{[a-zA-Z_]+\}\}/g, '').replace(/\s+/g, ' ').trim()
```

**Sanitization Location 2:** `app/api/generate/route.ts` (Lines 576-587)
```typescript
function sanitizePlaceholders(text: string, context: string = 'prompt'): string {
  const placeholders = text.match(/\{\{[a-zA-Z_]+\}\}/g)
  if (placeholders) {
    console.warn(`WARNING: Unreplaced placeholders in ${context}:`, placeholders)
    return text.replace(/\{\{[a-zA-Z_]+\}\}/g, '').replace(/\s+/g, ' ').trim()
  }
  return text
}
```

**Sanitization Location 3:** `lib/prompts/adapters/gemini-adapter.ts` (Lines 69-100)
```typescript
function sanitizeLayoutGuidance(guidance: string): string {
  let sanitized = guidance
    .replace(/~?\d+\s*px/gi, '')
    .replace(/\b(CRITICAL|ZONE|RULES|...)\b/gi, '')
    // ... 15 more patterns
}
```

**Problems:**
1. Inconsistent patterns across files
2. Missing patterns (nested placeholders, alternative syntax)
3. No centralized logging/monitoring

## Proposed Solutions

### Solution 1: Create Centralized Sanitizer (Recommended)
**Pros:** Single source of truth, configurable, testable
**Cons:** Requires refactoring multiple files
**Effort:** Medium (2-3 hours)
**Risk:** Low

```typescript
// lib/utils/prompt-sanitizer.ts
export interface SanitizationOptions {
  removeUnreplacedPlaceholders: boolean
  removeLayoutInstructions: boolean
  removeTechnicalKeywords: boolean
  logWarnings: boolean
  context?: string
}

const DEFAULT_OPTIONS: SanitizationOptions = {
  removeUnreplacedPlaceholders: true,
  removeLayoutInstructions: false,
  removeTechnicalKeywords: false,
  logWarnings: true,
}

export function sanitizePrompt(
  text: string,
  options: Partial<SanitizationOptions> = {}
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  let result = text

  if (opts.removeUnreplacedPlaceholders) {
    const placeholders = result.match(/\{\{+[a-zA-Z_]+\}+\}/g)
    if (placeholders && opts.logWarnings) {
      console.warn(`[Sanitize] Unreplaced placeholders in ${opts.context}:`, placeholders)
    }
    result = result.replace(/\{\{+[a-zA-Z_]+\}+\}/g, '')
  }

  if (opts.removeLayoutInstructions) {
    result = result.replace(/~?\d+\s*px/gi, '')
    result = result.replace(/\b(CRITICAL|ZONE|RULES|LAYOUT|PLACEMENT)\b/gi, '')
  }

  if (opts.removeTechnicalKeywords) {
    result = result.replace(/\b(RESERVE|HEADER|FOOTER|OVERLAY|AWARENESS)\b/gi, '')
  }

  return result.replace(/\s+/g, ' ').trim()
}
```

## Recommended Action

Implement **Solution 1** and refactor all three files to use the centralized sanitizer.

## Technical Details

**Affected Files:**
- `app/(dashboard)/create/page.tsx` - Use sanitizePrompt()
- `app/api/generate/route.ts` - Replace sanitizePlaceholders()
- `lib/prompts/adapters/gemini-adapter.ts` - Replace sanitizeLayoutGuidance()
- NEW: `lib/utils/prompt-sanitizer.ts`

## Acceptance Criteria

- [ ] Single sanitization function used across all files
- [ ] All existing patterns preserved
- [ ] Configurable options for different use cases
- [ ] Unit tests for all sanitization patterns
- [ ] Logging for debugging production issues

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2025-12-04 | Created from code review | Security + architecture issue |

## Resources

- Security audit findings
- Pattern recognition analysis
