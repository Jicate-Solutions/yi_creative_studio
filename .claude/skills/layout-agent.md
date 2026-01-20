# Multi-Format Layout Agent

> Debug and optimize layout structures, zone allocations, and element placement across all creative formats using Actor-Critic thinking.

## Trigger Phrases

Activate this agent when user mentions:
- "layout agent debug", "debug layout"
- "analyze format layout", "format layout analysis"
- "debug element placement", "element positioning issue"
- "layout zone analysis", "zone overlap issue"
- "format layout thinking", "layout actor-critic"
- "text zone issue", "text placement problem"
- "logo strip collision", "header zone overlap"
- "footer zone debug", "zone allocation"

## Agent Capabilities

### 1. Format Layout Structure Analysis
Analyze any creative format's layout architecture:

```
User: "Why is text overlapping with the logo zone?"
Agent:
1. Identifies format type (event_poster, certificate, etc.)
2. Reads format-specific zone configurations
3. Maps text zones vs logo strips vs speaker zones
4. Calculates zone boundaries and identifies overlaps
5. Suggests zone reallocation or text repositioning
```

### 2. Zone Allocation Debugging
Debug zone calculations and boundaries:

```
User: "Header zone is too large for this format"
Agent:
1. Reads STRIP_POSITIONS from logo-locks.ts
2. Calculates header zone as percentage (0-15%)
3. Compares with content zone requirements
4. Identifies constraint violations
5. Recommends zone adjustments
```

### 3. Element Placement Validation
Validate placement of all design elements:

```
User: "Where should the CTA go for 16:9 format?"
Agent:
1. Reads format dimensions from creative-formats.ts
2. Loads layout template from multi-speaker-layouts.ts
3. Calculates available zones after reserved areas
4. Recommends optimal CTA placement with coordinates
```

### 4. Actor-Critic Layout Analysis
Apply Actor-Critic thinking for complex layout decisions:

```
User: "Should I use portrait or landscape for 3 speakers?"
Agent:
1. ACTOR: Explores creative possibilities for each format
2. CRITIC: Evaluates spacing, readability, visual hierarchy
3. SYNTHESIS: Provides recommendation with trade-off analysis
```

## Actor-Critic Thinking Pattern

### Actor Perspective (Creative/Experiential)
- What visual hierarchy best serves the content?
- How does the eye flow through the design?
- What emotional response does this layout create?
- Where should attention be drawn first?

### Critic Perspective (Analytical/Evaluative)
- Are all elements within bounds?
- Is there sufficient spacing (minimum 5%)?
- Does text meet contrast requirements?
- Are reserved zones (header/footer) respected?

### Synthesis Output
```typescript
{
  recommendation: "Use portrait-3 layout",
  actorInsights: ["Strong vertical hierarchy", "Speaker photos frame content"],
  criticValidation: ["All zones within bounds", "5.2% spacing achieved"],
  tradeoffs: ["Less horizontal breathing room", "Compact tagline zone"],
  confidence: 0.85
}
```

## Workflow

### Step 1: Gather Layout Configuration
```typescript
// Read layout configurations
Read: lib/config/multi-speaker-layouts.ts     // Zone positions, text adjustments
Read: lib/config/logo-locks.ts                // Logo strip positions (6x3 grid)
Read: lib/config/creative-formats.ts          // Format dimensions, aspect ratios
Read: types/layout-agent.types.ts             // Type definitions

// Understand zone architecture
- STRIP_POSITIONS: header (top-1 to top-6), second (mid-1 to mid-6), footer (bottom-1 to bottom-6)
- TextZoneAdjustments: headline, tagline, dateVenue, speakers, additionalDetails
- Reserved zones: HEADER_ZONE_END (15%), FOOTER_ZONE_START (85%)
```

### Step 2: Identify Format Category
```
Format Categories and Layout Rules:

PORTRAIT FORMATS (4:5, 3:4):
- Constrained width, extended height
- Speaker photos at yPercent 68-73%
- Text zones compressed vertically
- Logo hierarchy: top-1 (Yi), top-2 (Bharat Rising), top-6 (CII)

LANDSCAPE FORMATS (16:9):
- Ample horizontal space
- Speaker photos at yPercent 55-58%
- Wide text zones available
- Good for 3-4 speakers horizontally

SQUARE FORMATS (1:1):
- Balanced composition
- Triangular speaker arrangements (3 speakers)
- Center content with corner breathing room
```

### Step 3: Zone Map Visualization
```
┌─────────────────────────────────────────────────────────────┐
│  ZONE MAP (Portrait 4:5 - 1080×1350px)                      │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  HEADER STRIP (0-15%)                               │    │
│  │  [top-1: Yi] [top-2: Bharat] ... [top-6: CII]       │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  CONTENT ZONE (15-65%)                              │    │
│  │  - Headline: 15-30%                                 │    │
│  │  - Tagline: 30-38%                                  │    │
│  │  - Date/Venue: 38-48%                               │    │
│  │  - Speaker Names: 55-66%                            │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  PHOTO OVERLAY ZONE (65-80%)                        │    │
│  │  [Photo 1] [Photo 2] [Photo 3]                      │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  FOOTER STRIP (85-100%)                             │    │
│  │  [bottom-1: Partner] ... [bottom-6: Sponsor]        │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Step 4: Zone Collision Detection
```typescript
// Check if element overlaps reserved zone
const overlaps = (pos.yPercent >= zone.yStart && pos.yPercent <= zone.yEnd)
  || (pos.yPercent + pos.heightPercent >= zone.yStart)

// Minimum spacing validation
const spacing = Math.abs(zone1.end - zone2.start)
if (spacing < 5) {
  warning("Insufficient zone spacing")
}
```

## Format-Specific Guidance

### Event Poster (4:5, 1080×1350)
- Header: Yi brand logos locked
- Content: 15-65% vertical space
- Speakers: 65-80% for photo overlays
- Footer: 85-100% for chapter info

### Certificate (3:4, 1200×1600)
- Header: Minimal (10%)
- Content: Large central text zone (15-75%)
- Footer: Signatures and date (80-95%)

### YouTube Thumbnail (16:9, 1280×720)
- Header: Optional logos (0-10%)
- Content: Full width text focus
- Speaker: Side positioning preferred (right third)

### Instagram Story (9:16, 1080×1920)
- Header: Safe zone for platform UI
- Content: Middle 60% for main content
- Footer: CTA zone above swipe area

### LinkedIn Post (1:1, 1200×1200)
- Professional layout
- Header: 0-12%
- Content: Centered, data-friendly
- Footer: 88-100%

## Integration with Existing Tools

### Multi-Speaker Layouts
```typescript
import { calculateMultiSpeakerLayout, calculateIntelligentLayout } from '@/lib/config/multi-speaker-layouts'

// Calculate layout for debugging
const layout = calculateIntelligentLayout({
  speakerCount: 3,
  formatId: 'event_poster',
  canvasWidth: 1080,
  canvasHeight: 1350,
  sophistication: 'balanced',
  totalSpeakersForSizing: 3
})

// Access calculated zones
layout.textZoneAdjustments  // Where text should go
layout.positions            // Where photos overlay
layout.compositionGuidance  // Prompt guidance for Gemini
```

### Logo Lock Validation
```typescript
import { isPositionCompliant, getComplianceWarning, STRIP_POSITIONS } from '@/lib/config/logo-locks'

// Validate logo placement
const isValid = isPositionCompliant('Yi', 'top-1')  // true
const warning = getComplianceWarning('CII', 'mid-3')  // "CII Logo should be in top-6..."

// Get available positions
const headerPositions = STRIP_POSITIONS.header  // ['top-1', ..., 'top-6']
const footerPositions = STRIP_POSITIONS.footer  // ['bottom-1', ..., 'bottom-6']
```

### Speaker Zone Analyzer
```typescript
import { analyzeSpeakerZones, getAvailablePositions } from '@/lib/agents/speaker-zone-analyzer'

// Analyze speaker photo zones
const zones = analyzeSpeakerZones({
  speakerPhoto: formData.speakerPhoto,
  formatDimensions: { width: 1080, height: 1350 }
})

// Check occupied grid positions
zones.occupiedGridPositions  // ['mid-1', 'mid-5', 'mid-6']
zones.description            // "3 speakers in horizontal layout occupy..."
```

## Example Debugging Workflows

### Workflow 1: Text-Logo Overlap
```
User: "My headline is overlapping with the header logos"

Agent Analysis:
1. READ lib/config/logo-locks.ts
   → Header strip occupies 0-15% (top-1 through top-6)

2. READ format TextZoneAdjustments
   → Headline zone: start: 15%, end: 30%
   → This should be BELOW header strip

3. CHECK current implementation
   → If headline starts at 10% → OVERLAP DETECTED
   → Issue: headline.start < HEADER_ZONE_END (15%)

4. RECOMMENDATION:
   - Adjust headline zone to start at 15% or later
   - OR reduce header strip size in HeaderLogoBandConfig
   - Ensure minimum 2% gap between zones
```

### Workflow 2: Actor-Critic Format Selection
```
User: "3 speakers with photos - portrait or landscape?"

ACTOR Analysis:
"Portrait (4:5) creates strong vertical hierarchy,
drawing eye from headline down through speaker section.
Speaker photos at bottom create anchor point.
However, 3 speakers in portrait may feel cramped."

CRITIC Analysis:
"Portrait-3: Photo size 24% × 0.85 (portrait) × 0.92 (vertical) = 18.7%
Landscape-3: Photo size 24% × 1.15 (landscape) = 27.6%
Spacing check: Portrait has 18% between photos, Landscape has 30%"

SYNTHESIS:
"RECOMMEND: Landscape (16:9) for 3 speakers.
 - Better horizontal spacing (30% vs 18%)
 - Larger photos (27.6% vs 18.7%)
 - Equal visual weight per speaker

 Use Portrait only if:
 - Vertical content is essential
 - Mobile-first delivery
 - Print format requires it"
```

### Workflow 3: Zone Allocation Issue
```
User: "Footer is overlapping with speaker photos"

Agent Analysis:
1. READ multi-speaker-layouts.ts
   → Speaker photo zone: 65-80%
   → Footer zone: 85-100%
   → Gap should be: 5%

2. CHECK actual values
   → If speaker photos extend to 88% → OVERLAP!
   → Issue: Photo zone exceeds bounds

3. TRACE calculation
   → Photo size calculated too large
   → Check: Was totalSpeakers used instead of photosCount?

4. FIX:
   - Reduce photo size
   - OR move footer zone down
   - Ensure minimum 5% gap
```

## Key Files to Read

### Core Layout Logic
- `lib/config/multi-speaker-layouts.ts` - Layout templates, size calculations
- `lib/config/logo-locks.ts` - Logo positioning rules (6×3 grid)
- `lib/config/creative-formats.ts` - Format dimensions and categories

### Zone Architecture
- `lib/prompts/knowledge-base/design-architecture/zones/speaker-zones.ts`
- `lib/prompts/services/yi-prompt-builder/types/layout-styling.ts`
- `lib/services/footer-zone-optimizer.ts`

### Agent Files
- `lib/agents/layout-agent.ts` - Main layout agent (this skill)
- `lib/agents/speaker-zone-analyzer.ts` - Speaker zone mapping
- `lib/agents/speaker-layout-agent.ts` - Speaker-specific layout

### Type Definitions
- `types/layout-agent.types.ts` - All layout agent interfaces

### Prompt Building
- `lib/prompts/services/yi-prompt-builder/format-builders/event-poster.ts`
- `lib/prompts/services/yi-prompt-builder/context-helpers.ts`

## Tools Used

- `Read` - Examine layout configuration files
- `Grep` - Search for zone percentage patterns
- `Glob` - Find format-specific builders
- `mcp__actor-critic-thinking__actor-critic-thinking` - Dual-perspective analysis

## Debugging Commands

```bash
# Find all zone percentage definitions
grep -r "start:\s*\d\+\|end:\s*\d\+" lib/config/

# Find text zone adjustments
grep -r "textZoneAdjustments" lib/

# Check reserved zone constants
grep -r "HEADER_ZONE_END\|FOOTER_ZONE_START" lib/

# Find format builder files
ls lib/prompts/services/yi-prompt-builder/format-builders/

# Find layout agent references
grep -r "analyzeLayout\|LayoutDecision" lib/ types/
```

## Quick Reference

### Zone Percentages (Portrait 4:5)
| Zone | Start | End | Purpose |
|------|-------|-----|---------|
| Header | 0% | 15% | Brand logos (locked) |
| Headline | 15% | 30% | Event title |
| Tagline | 30% | 38% | Event subtitle |
| Date/Venue | 38% | 48% | Event details |
| Speaker Text | 55% | 66% | Speaker names |
| Photo Zone | 66% | 80% | Speaker photo overlays |
| Footer | 85% | 100% | Chapter info, sponsors |

### Photo Size by Speaker Count
| Speakers | Base % | Portrait | Square | Landscape |
|----------|--------|----------|--------|-----------|
| 1 | 40% | 34% | 40% | 46% |
| 2 | 32% | 27% | 32% | 37% |
| 3 | 24% | 20% | 24% | 28% |
| 4 | 20% | 17% | 20% | 23% |

### Critical Validation Rules
```typescript
// Zone boundary validation
if (textZone.start < HEADER_ZONE_END) {
  error("Text overlaps header zone")
}

if (photoZone.end > FOOTER_ZONE_START) {
  error("Photos overlap footer zone")
}

// Spacing validation (minimum 5%)
const spacing = Math.abs(zone1.end - zone2.start)
if (spacing < 5) {
  warning("Insufficient zone spacing")
}
```

### Actor-Critic Integration
```typescript
// Use MCP tool for multi-round analysis
mcp__actor-critic-thinking__actor-critic-thinking({
  content: "Layout proposal analysis...",
  role: "actor",  // or "critic"
  thoughtNumber: 1,
  totalThoughts: 3,
  nextRoundNeeded: true
})
```
