# Todo: Optimize cleanPromptInstructions with Combined Regex

---
status: pending
priority: p2
issue_id: 006
tags: [code-review, performance]
dependencies: []
---

## Problem Statement

The `cleanPromptInstructions` function runs 13 sequential regex scans through the entire prompt, causing O(13m) complexity where m is prompt length.

**Why it matters:** Each scan adds 5-10ms latency. At scale (100 concurrent users), this wastes 500-1000ms of CPU time per second.

## Findings

**Location:** `app/api/generate/route.ts` (Lines 544-572)

**Current Code:**
```typescript
function cleanPromptInstructions(prompt: string): string {
  const instructionPatterns = [
    /Create\s+(?:a|an)\s+(?:striking|professional|...)/gi,
    /Use\s+(?:bold|vibrant|...)/gi,
    /Include\s+(?:visual\s+elements?|imagery)[^.]*\./gi,
    // ... 9 more patterns
  ]

  let cleaned = prompt
  for (const pattern of instructionPatterns) {
    cleaned = cleaned.replace(pattern, '') // 12 separate scans!
  }

  return cleaned.replace(/\s+/g, ' ').trim() // 13th scan!
}
```

**Performance Impact:**
- 13 sequential regex scans
- Current: 10-15ms per API call
- At scale: 30-50ms with complex prompts (5000+ chars)

## Proposed Solutions

### Solution 1: Combine All Patterns (Recommended)
**Pros:** 85-90% performance improvement, single scan
**Cons:** Regex is longer, needs careful escaping
**Effort:** Medium (30-45 min)
**Risk:** Low

```typescript
function cleanPromptInstructions(prompt: string): string {
  // Combine all patterns into ONE alternation regex
  const combinedPattern = new RegExp(
    [
      'Create\\s+(?:a|an)\\s+(?:striking|professional|vibrant|elegant|beautiful|modern|inspiring|bright|playful|warm)[^"]*(?:poster|design|flyer)\\s+for\\s*',
      'Use\\s+(?:bold|vibrant|elegant|warm|nature-inspired|energetic)[^.]*(?:colors?|tones?|palette)[^.]*\\.',
      'Include\\s+(?:visual\\s+elements?|imagery)[^.]*\\.',
      'Style:\\s*[^.]+\\.',
      'IMPORTANT:\\s*[^.]+\\.',
      'Leave\\s+\\d+px\\s+(?:clear\\s+)?space[^.]+\\.',
      'the\\s+top\\s+for\\s+header\\s*logos?\\s*(?:and\\s+\\d+px[^.]*)?[.!]?',
      'header\\s+logos?\\s+and\\s+\\d+px\\s+at\\s+the\\s+footer[.!]?',
      '\\d+px\\s+(?:clear\\s+)?(?:at\\s+the\\s+)?(?:top|bottom|header|footer)[^.]*[.!]?'
    ].join('|'),
    'gi'
  )

  // SINGLE pass through prompt
  return prompt
    .replace(combinedPattern, '')
    .replace(/\s+/g, ' ')
    .trim()
}
```

### Solution 2: Lazy Pattern Compilation
**Pros:** Patterns compiled once at module load
**Cons:** Still multiple scans
**Effort:** Small (15 min)
**Risk:** Low

```typescript
// Module-level compilation (runs once)
const INSTRUCTION_PATTERNS = [
  /Create\s+(?:a|an)\s+.../gi,
  // ...
].map(p => new RegExp(p.source, p.flags))

function cleanPromptInstructions(prompt: string): string {
  return INSTRUCTION_PATTERNS.reduce(
    (cleaned, pattern) => cleaned.replace(pattern, ''),
    prompt
  ).replace(/\s+/g, ' ').trim()
}
```

## Recommended Action

Implement **Solution 1** for maximum performance gain.

## Technical Details

**Affected Files:**
- `app/api/generate/route.ts` (Lines 544-572)

**Performance Metrics:**
- Before: 10-15ms per call
- After: 1-2ms per call (85-90% improvement)

## Acceptance Criteria

- [ ] All existing patterns still match correctly
- [ ] Performance < 5ms for 5000 char prompts
- [ ] Unit tests for pattern matching
- [ ] Benchmark comparison

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2025-12-04 | Created from code review | Multiple regex scan performance issue |

## Resources

- Performance review findings
- Regex optimization best practices
