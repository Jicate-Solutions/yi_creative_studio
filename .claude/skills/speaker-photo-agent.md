# Speaker Photo Agent

> Debug and optimize speaker photo handling, zone calculations, and layout decisions for event poster generation.

## Trigger Phrases

Activate this agent when user mentions:
- "speaker photo debug", "debug speaker sizing"
- "analyze speaker layout", "speaker zone analysis"
- "speaker photo overlap", "photo too large"
- "multi-speaker layout issue", "speaker positioning"
- "photo vs text layout", "speaker count mismatch"

## Agent Capabilities

### 1. Configuration Analysis
Analyze speaker details vs photos mismatch:

```
User: "Why is my single photo too large for 3 speakers?"
Agent:
1. Reads speaker config from form data
2. Counts total speakers vs speakers with photos
3. Identifies sizing bug: using photosCount (1) instead of totalSpeakers (3)
4. Shows correct sizing calculation
```

### 2. Zone Calculation Debug
Debug speaker photo zone calculations:

```
User: "Speaker photo overlaps with text"
Agent:
1. Reads multi-speaker-layouts.ts configuration
2. Calculates expected zones for speaker count
3. Compares with actual overlay coordinates
4. Identifies collision points
```

### 3. Layout Testing
Test different speaker/photo combinations:

```
User: "Show me how 3 speakers with 1 photo should look"
Agent:
1. Simulates layout calculation
2. Shows ASCII diagram of expected layout
3. Calculates photo size (based on 3 speakers)
4. Identifies which speaker positions have photos vs text-only
```

### 4. Prompt Validation
Validate speaker-related prompt output:

```
User: "Check if prompt correctly describes speaker layout"
Agent:
1. Reads event-poster.ts prompt builder
2. Checks speakerLayoutContext injection
3. Validates zone instructions for Gemini
4. Suggests prompt improvements
```

## Workflow

### Step 1: Gather Configuration
```typescript
// Read current speaker config
Read: lib/utils/speaker-migration.ts
Read: lib/config/multi-speaker-layouts.ts
Read: lib/sharp/speaker-overlay.ts

// Understand the data flow
- getSpeakerCount() → total speakers from form
- getSpeakerCountWithPhotos() → speakers with actual photo URLs
- calculateIntelligentLayout() → layout decisions
- overlayMultipleSpeakerPhotos() → final overlay
```

### Step 2: Analyze the Mismatch
```
Key Question: What count is being used for sizing?

WRONG (current bug):
photoSize = calculateOptimalPhotoSize(speakersWithPhotos, aspectRatio)
→ 1 photo = full-size layout

CORRECT (fix):
photoSize = calculateOptimalPhotoSize(totalSpeakers, aspectRatio)
→ 3 speakers = 3-speaker layout (smaller photos)
```

### Step 3: Visualize Layout
```
┌─────────────────────────────────────────────────────────┐
│  SCENARIO: 3 Speakers, 1 Photo                          │
│                                                         │
│  WRONG (sizing based on 1 photo):                       │
│  ┌─────────────────────────────────────┐               │
│  │        [HUGE PHOTO]                 │ ← Overlaps!   │
│  │   Covers entire speaker zone        │               │
│  └─────────────────────────────────────┘               │
│                                                         │
│  CORRECT (sizing based on 3 speakers):                  │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐             │
│  │  [PHOTO]  │ │  Name 2   │ │  Name 3   │             │
│  │  Name 1   │ │  (text)   │ │  (text)   │             │
│  └───────────┘ └───────────┘ └───────────┘             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Step 4: Trace Data Flow
```typescript
// Trace from form to overlay

1. FORM DATA
   speakers: [
     { name: "Dr. Priya", designation: "CEO", photoUrl: "data:image/..." },
     { name: "Rajesh", designation: "CTO", photoUrl: null },
     { name: "Ananya", designation: "CFO", photoUrl: null }
   ]

2. MIGRATION UTILS
   getSpeakerCount() → 3
   getSpeakerCountWithPhotos() → 1
   getSpeakersWithPhotos() → [{ name: "Dr. Priya", ... }]

3. LAYOUT CALCULATION (BUG HERE)
   calculateIntelligentLayout({
     speakerCount: 1,  // ← WRONG! Should be 3
     formatId: 'event_poster',
     ...
   })

4. SIZE CALCULATION
   photoSize = 35% of canvas  // ← Too large!
   Should be: 18% of canvas (3-speaker layout)

5. OVERLAY
   Single photo overlaid at 35% size
   → Covers zones meant for speakers 2 and 3
```

### Step 5: Suggest Fix
```typescript
// In app/api/generate/route.ts

// BEFORE
const layoutResult = calculateIntelligentLayout({
  speakerCount: getSpeakerCountWithPhotos(speakerConfig),
  // ...
})

// AFTER
const layoutResult = calculateIntelligentLayout({
  speakerCount: getSpeakerCount(speakerConfig),      // Use TOTAL
  photosCount: getSpeakerCountWithPhotos(speakerConfig), // Track photos separately
  // ...
})
```

## Scenario Testing Matrix

### All Possible Combinations
| Speakers | Photos | Expected Layout | Photo Size |
|----------|--------|-----------------|------------|
| 1 | 0 | Text only | N/A |
| 1 | 1 | Single photo | 35% |
| 2 | 0 | Text only x2 | N/A |
| 2 | 1 | 2-column, 1 photo | 25% |
| 2 | 2 | 2-column, 2 photos | 25% |
| 3 | 0 | Text only x3 | N/A |
| 3 | 1 | 3-column, 1 photo | 18% |
| 3 | 2 | 3-column, 2 photos | 18% |
| 3 | 3 | 3-column, 3 photos | 18% |
| 4 | any | Grid layout | 15% |

### Test Each Scenario
```
For each scenario, verify:
1. Photo size matches expected (based on total speakers)
2. Zone allocations are correct
3. Text-only positions show names prominently
4. No overlaps between elements
```

## Key Files to Read

### Core Logic
- `lib/utils/speaker-migration.ts` - Speaker count functions
- `lib/config/multi-speaker-layouts.ts` - Layout templates
- `lib/sharp/speaker-overlay.ts` - Overlay logic
- `lib/agents/speaker-zone-analyzer.ts` - Zone mapping

### Prompt Building
- `lib/prompts/services/yi-prompt-builder/format-builders/event-poster.ts`
- `lib/prompts/services/yi-prompt-builder/context-helpers.ts`

### API Integration
- `app/api/generate/route.ts` - Main generation flow

## Example Debugging Session

```
User: "My 3-speaker poster has a huge photo covering everything"

Agent Analysis:
1. READ speaker-migration.ts
   → Confirmed: getSpeakerCount returns total, getSpeakerCountWithPhotos returns with photos

2. READ multi-speaker-layouts.ts line 200-250
   → Found: calculateIntelligentLayout uses speakerCount for sizing

3. READ app/api/generate/route.ts
   → ISSUE FOUND: speakerCount = getSpeakerCountWithPhotos()
   → This passes 1 instead of 3 to layout calculator

4. RECOMMENDATION:
   - Change to use getSpeakerCount() for layout decisions
   - Pass photosCount separately for overlay positioning
   - This ensures photo is sized for 3-speaker layout

Diagnosis: The sizing calculation receives "1" instead of "3" because
getSpeakerCountWithPhotos() is used instead of getSpeakerCount().
Result: Photo sized for single-speaker layout (35%) instead of
3-speaker layout (18%), causing overlap.
```

## Tools Used

- `Read` - Examine source files
- `Grep` - Search for function usage patterns
- `Glob` - Find related files
- `Bash` - Run tests if available

## Debugging Commands

```bash
# Find all usages of getSpeakerCountWithPhotos
grep -r "getSpeakerCountWithPhotos" lib/ app/

# Find all usages of speakerCount in layouts
grep -r "speakerCount" lib/config/multi-speaker-layouts.ts

# Check if totalSpeakers parameter exists
grep -r "totalSpeakers" lib/
```

## Quick Reference

### The Core Bug
```
getSpeakerCountWithPhotos() → Used for SIZING (wrong)
getSpeakerCount() → Should be used for SIZING

Fix: Use totalSpeakers for layout sizing, photosCount for overlay decisions
```

### The Fix Pattern
```typescript
// Layout calculation
calculateLayout({
  totalSpeakers: getSpeakerCount(config),     // For sizing
  photosCount: getSpeakerCountWithPhotos(config) // For overlay
})

// Photo sizing
photoSize = calculateSize(totalSpeakers)  // Not photosCount!

// Overlay positioning
for (speaker of speakersWithPhotos) {
  overlay(speaker, photoSize)  // Use pre-calculated size
}
```
