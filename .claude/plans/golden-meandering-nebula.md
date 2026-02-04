# Plan: v24.45 - Fix Speaker Photo Overlapping Content

## The Problem

Speaker photos + details are overlapping with event content (headline, date, venue, topics) because:
1. `SPEAKER_SAFE_START = 0.58` (58%) - too high, overlaps with content at 40-65%
2. Content zone ends at 65%, but speakers start at 58% = **7% overlap!**

## The Simple Fix

**Move speaker start BELOW content zone** - from 58% to **66%** (just after content ends at 65%).

## Current Flow (Broken)

```
0%  ┌─────────────────────────────┐
    │       LOGO BAR              │
40% ├─────────────────────────────┤
    │  Event Title                │  ← Content Zone (40-65%)
    │  Date | Venue               │
    │  Topics list                │
58% │ ← SPEAKER STARTS HERE       │  ❌ OVERLAP!
65% ├─────────────────────────────┤
    │                             │
75% ├─────────────────────────────┤
    │       FOOTER BAR            │
100%└─────────────────────────────┘
```

## Fixed Flow (v24.45)

```
0%  ┌─────────────────────────────┐
    │       LOGO BAR              │
40% ├─────────────────────────────┤
    │  Event Title                │  ← Content Zone (40-65%)
    │  Date | Venue               │
    │  Topics list                │
65% ├─────────────────────────────┤
    │   ┌───────┐                 │  ← Speaker Zone (66-75%)
66% │   │ Photo │ Name            │  ✅ NO OVERLAP!
    │   └───────┘ Designation     │
75% ├─────────────────────────────┤
    │       FOOTER BAR            │
100%└─────────────────────────────┘
```

## Implementation

### File: `app/api/generate/route.ts`

**Find (around line 2678):**
```typescript
const SPEAKER_SAFE_START = 0.58  // Start of speaker zone
```

**Replace with:**
```typescript
// v24.45: Move speaker start BELOW content zone (65%) to prevent overlap
const SPEAKER_SAFE_START = 0.66  // Start AFTER content ends at 65%
```

**That's it!** One line change.

## Why This Works

| Zone | Before (v24.44) | After (v24.45) |
|------|-----------------|----------------|
| Content | 40% - 65% | 40% - 65% (unchanged) |
| **Speaker Start** | **58%** | **66%** |
| Speaker End | 75% | 75% (unchanged) |
| **Overlap** | **7%** | **0%** ✅ |
| Speaker Space | 17% (245px) | 9% (130px) |

## Trade-off

Less vertical space for speakers (130px vs 245px), but:
- 1 speaker at 180px photo fits fine (card = 361px, scaled to ~120px = fits)
- 2 speakers will need scaling (already implemented in v24.40)
- **NO OVERLAP is more important than large photos**

## Verification

1. Run `npm run build`
2. Generate poster with speaker photos
3. Check logs: `SPEAKER_SAFE_START = 0.66`
4. Verify speakers appear BELOW event content (not overlapping)
5. Content visible at 40-65%, speakers at 66-75%

## Files to Modify

| File | Line | Change |
|------|------|--------|
| `app/api/generate/route.ts` | ~2678 | `SPEAKER_SAFE_START = 0.58` → `0.66` |
