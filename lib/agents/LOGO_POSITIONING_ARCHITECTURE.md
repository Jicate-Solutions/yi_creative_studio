# Logo Positioning System - Complete Architecture

This document explains the complete architecture of the logo positioning system in Yi CreativeStudio.

---

## 🏗️ System Overview

The logo positioning system has **4 main layers**:

```
┌─────────────────────────────────────────────────────────────┐
│                    USER INPUT LAYER                         │
│  (User selects logos + positions via UI)                   │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│               AI DECISION LAYER                             │
│  • Logo Placement Agent (Claude AI)                         │
│  • Strip Width/Spacing Intelligence                         │
│  • Logo Position Optimizer (Algorithmic)                    │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│              VALIDATION LAYER                               │
│  • Logo Locks (Yi=top-1, CII=top-6)                        │
│  • Position Constraints (18-position grid)                  │
│  • Column Redistribution (even spacing)                     │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│              RENDERING LAYER                                │
│  • Logo Overlay Engine (Sharp.js)                          │
│  • Strip Creation (individual/strip modes)                  │
│  • Logo Scaling & Spacing                                   │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
                FINAL IMAGE
```

---

## 📂 File Structure & Components

```
lib/
├── agents/
│   └── logo-placement-agent.ts          # AI decision maker
│
├── services/
│   └── logo-position-optimizer.ts       # Algorithmic optimizer
│
├── sharp/
│   └── logo-overlay.ts                  # Rendering engine
│
├── config/
│   ├── constants.ts                     # 18-position grid definitions
│   ├── logo-locks.ts                    # Brand logo constraints
│   └── logoConstants.ts                 # Size/shape presets
│
└── prompts/
    └── helpers/
        └── logo-awareness.ts            # Logo position awareness for AI
```

---

## 🔄 Complete Data Flow

### Step 1: User Input → AI Decision

```typescript
// User selects logos in UI
const logos = [
  { id: "yi-logo", name: "Yi", file: File },
  { id: "cii-logo", name: "CII", file: File },
  { id: "chapter-logo", name: "Yi Pune", file: File }
]

// ↓ Sent to AI Placement Agent

import { getAIOptimizedPlacements } from '@/lib/agents/logo-placement-agent'

const aiDecision = await getAIOptimizedPlacements({
  logos: logos.map(l => ({
    id: l.id,
    name: l.name,
    type: detectLogoType(l.name) // 'brand' | 'chapter' | 'sponsor'
  })),
  formatId: "event_poster",
  formatDimensions: { width: 2400, height: 3000 },
  brandConstraints: {
    yiLogoId: "yi-logo",
    ciiLogoId: "cii-logo"
  }
})

// AI returns:
{
  placements: [
    { logoId: "yi-logo", position: "top-1", size: "medium" },
    { logoId: "chapter-logo", position: "top-4", size: "medium" },
    { logoId: "cii-logo", position: "top-6", size: "medium" }
  ],
  stripRecommendations: {
    header: {
      widthPercentage: 80,
      spacingStrategy: "normal",
      alignment: "justified",
      paddingHorizontal: 40
    }
  },
  reasoning: "3 logos distributed at edges and center...",
  confidence: 0.95
}
```

---

### Step 2: AI Decision → Validation & Redistribution

```typescript
// Validate logo locks
import { validateLogoLocks } from '@/lib/config/logo-locks'

const validationResult = validateLogoLocks(aiDecision.placements, {
  yiLogoId: "yi-logo",
  ciiLogoId: "cii-logo"
})

if (!validationResult.valid) {
  console.error("Logo lock violation:", validationResult.violations)
  // Fix violations automatically
}

// ↓ Positions validated, now prepare for rendering

// Extract logo positions
const logosWithPositions = aiDecision.placements.map(p => ({
  ...logos.find(l => l.id === p.logoId),
  position: p.position,
  size: p.size
}))
```

---

### Step 3: Rendering Preparation → Column Redistribution

```typescript
// In logo-overlay.ts

// Convert positions to grid coordinates
const logosWithGridCoords = logosWithPositions.map(logo => ({
  ...logo,
  row: getRowFromPosition(logo.position),    // 'header' | 'middle' | 'footer'
  column: getColumnFromPosition(logo.position) // 1-6
}))

// Group by row (strip)
const headerLogos = logosWithGridCoords.filter(l => l.row === 'header')
const middleLogos = logosWithGridCoords.filter(l => l.row === 'middle')
const footerLogos = logosWithGridCoords.filter(l => l.row === 'footer')

// ↓ For each strip, apply column redistribution

// REDISTRIBUTION LOGIC (from our recent fix)
function redistributeColumnsForFullWidth(logos, totalColumns = 6) {
  const usedColumns = [...new Set(logos.map(l => l.column))].sort()

  // If logos at [1,2,3], redistribute to [1,4,6] for even spacing
  const virtualColumns = calculateEvenDistribution(usedColumns.length)

  return logos.map((logo, idx) => ({
    ...logo,
    virtualColumn: virtualColumns[idx]
  }))
}

const redistributedHeader = redistributeColumnsForFullWidth(headerLogos)

// Console output:
// [Logo Overlay] Original Columns: 1, 2, 3
// [Logo Overlay] Virtual Columns: 1, 4, 6
// [Logo Overlay] Distribution Pattern: [1, 4, 6] - Left, Center-Right, Right
```

---

### Step 4: Strip Creation with AI Recommendations

```typescript
// Apply AI strip recommendations
import {
  getStripRecommendationByRow,
  applyStripRecommendations
} from '@/lib/agents/logo-placement-agent'

const headerRec = getStripRecommendationByRow(
  aiDecision.stripRecommendations,
  'header'
)

const stripConfig = applyStripRecommendations(headerRec, 2400)

// stripConfig:
{
  stripWidth: 1920,              // 80% of 2400
  horizontalPadding: 40,         // From AI
  spacingGuideline: { min: 40, max: 60 }  // "normal" spacing
}

// ↓ Create strip with these parameters

const { stripBuffer, stripHeight } = await createColumnAwareLogoStrip({
  logos: redistributedHeader,
  imageWidth: stripConfig.stripWidth,  // Use AI-recommended width!
  backgroundColor: '#FFFFFF',
  stripPadding: stripConfig.horizontalPadding,
  stripShape: 'straight'
})
```

---

### Step 5: Logo Scaling & Spacing

```typescript
// Inside createColumnAwareLogoStrip()

// Group logos by virtual column
const logosByColumn = new Map()
for (const logo of redistributedLogos) {
  const col = logo.virtualColumn  // Use virtual column!
  logosByColumn.set(col, [...])
}

// Calculate available space
const effectiveWidth = stripWidth - (edgeSafeMargin * 2)

// Calculate scale factor if logos are too wide
const totalRequiredWidth = calculateTotalWidth(logosByColumn)
const isOvercrowded = totalRequiredWidth > effectiveWidth

let scaleFactor = 1.0
if (isOvercrowded) {
  scaleFactor = effectiveWidth / totalRequiredWidth
  scaleFactor = Math.max(0.6, scaleFactor)  // Minimum 60%
}

// Validate spacing (from our recent fix)
const spacingCheck = validateLogoSpacing(scaledGroups, 50)
if (!spacingCheck.valid) {
  console.warn('Spacing too tight, reducing scale factor...')
  scaleFactor *= 0.9
}

// Apply scale factor
const scaledGroups = activeGroups.map(g => ({
  ...g,
  finalWidth: Math.floor(g.originalWidth * scaleFactor)
}))

// Calculate spacing between groups
const totalScaledWidth = sum(scaledGroups.map(g => g.finalWidth))
const finalAvailableSpace = effectiveWidth - totalScaledWidth
const groupSpacing = finalAvailableSpace / (scaledGroups.length + 1)

console.log('[Strip] Group spacing:', groupSpacing + 'px')
```

---

### Step 6: Final Composition

```typescript
// Position logos on strip
const compositeOperations = []
let currentX = startX + groupSpacing

for (const group of scaledGroups) {
  for (const logo of group.logos) {
    const logoBuffer = await resizeLogoIfNeeded(logo, scaleFactor)

    compositeOperations.push({
      input: logoBuffer,
      top: Math.floor((stripHeight - logo.height) / 2),  // Vertical center
      left: Math.floor(currentX)
    })

    currentX += logo.width + internalGap
  }
  currentX += groupSpacing
}

// Composite logos onto strip
const finalStrip = await sharp(stripBuffer)
  .composite(compositeOperations)
  .png()
  .toBuffer()

// ↓ Overlay strip on main image

const finalImage = await sharp(baseImage)
  .composite([{
    input: finalStrip,
    top: getStripYPosition('header', stripHeight, imageHeight),
    left: 0
  }])
  .toBuffer()

return finalImage
```

---

## 🎯 18-Position Grid System

```
┌─────────────────────────────────────────────────────────┐
│                    IMAGE CANVAS                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  HEADER STRIP (top-1 to top-6)                         │
│  ┌─────┬─────┬─────┬─────┬─────┬─────┐                │
│  │top-1│top-2│top-3│top-4│top-5│top-6│                │
│  └─────┴─────┴─────┴─────┴─────┴─────┘                │
│                                                         │
│  [MAIN CONTENT AREA]                                    │
│                                                         │
│  MIDDLE STRIP (mid-1 to mid-6)                         │
│  ┌─────┬─────┬─────┬─────┬─────┬─────┐                │
│  │mid-1│mid-2│mid-3│mid-4│mid-5│mid-6│                │
│  └─────┴─────┴─────┴─────┴─────┴─────┘                │
│                                                         │
│  [MORE CONTENT]                                         │
│                                                         │
│  FOOTER STRIP (bottom-1 to bottom-6)                   │
│  ┌─────┬─────┬─────┬─────┬─────┬─────┐                │
│  │btm-1│btm-2│btm-3│btm-4│btm-5│btm-6│                │
│  └─────┴─────┴─────┴─────┴─────┴─────┘                │
└─────────────────────────────────────────────────────────┘
```

### Position Mapping:

```typescript
// lib/config/constants.ts

export type LogoPosition =
  | 'top-1' | 'top-2' | 'top-3' | 'top-4' | 'top-5' | 'top-6'
  | 'mid-1' | 'mid-2' | 'mid-3' | 'mid-4' | 'mid-5' | 'mid-6'
  | 'bottom-1' | 'bottom-2' | 'bottom-3' | 'bottom-4' | 'bottom-5' | 'bottom-6'

// Extract row and column
function parsePosition(position: LogoPosition): { row: string; column: number } {
  const [row, col] = position.split('-')
  return {
    row: row === 'top' ? 'header' : row === 'mid' ? 'middle' : 'footer',
    column: parseInt(col)
  }
}
```

---

## 🔐 Logo Locks (Brand Constraints)

```typescript
// lib/config/logo-locks.ts

export const LOGO_LOCKS = {
  yi: {
    position: 'top-1',
    locked: true,
    reason: 'Yi brand identity - always top-left'
  },
  cii: {
    position: 'top-6',
    locked: true,
    reason: 'CII partner logo - always top-right'
  },
  bharatRising: {
    position: 'top-3',
    locked: false,
    preferred: true,
    reason: 'Bharat Rising - preferred center position'
  }
}

// Validation function
export function validateLogoLocks(
  placements: Array<{ logoId: string; position: LogoPosition }>,
  constraints: { yiLogoId?: string; ciiLogoId?: string }
): { valid: boolean; violations: string[] } {
  const violations = []

  // Check Yi logo
  const yiPlacement = placements.find(p => p.logoId === constraints.yiLogoId)
  if (yiPlacement && yiPlacement.position !== 'top-1') {
    violations.push(`Yi logo must be at top-1, found at ${yiPlacement.position}`)
  }

  // Check CII logo
  const ciiPlacement = placements.find(p => p.logoId === constraints.ciiLogoId)
  if (ciiPlacement && ciiPlacement.position !== 'top-6') {
    violations.push(`CII logo must be at top-6, found at ${ciiPlacement.position}`)
  }

  return {
    valid: violations.length === 0,
    violations
  }
}
```

---

## 🤖 AI Integration Points

### Point 1: Logo Placement Decision

```typescript
// When: User uploads logos
// Where: lib/agents/logo-placement-agent.ts

const aiDecision = await getAIOptimizedPlacements({
  logos,
  formatId,
  formatDimensions,
  brandConstraints
})

// AI analyzes:
// - Logo count per strip
// - Logo types (brand/sponsor/vertical)
// - Format dimensions
// - Brand constraints

// AI decides:
// - Which position for each logo
// - Strip width percentages
// - Spacing strategies
// - Alignment approaches
```

### Point 2: Logo Awareness in Prompts

```typescript
// When: Generating creative
// Where: lib/prompts/helpers/logo-awareness.ts

const logoContext = buildLogoAwarenessContext({
  placements: aiDecision.placements,
  stripRecommendations: aiDecision.stripRecommendations
})

// Injected into Gemini prompt:
// "LOGO AWARENESS:
//  - Yi logo positioned at top-left (column 1)
//  - Chapter logo positioned at center-right (column 4)
//  - CII logo positioned at top-right (column 6)
//  - Leave top 15% of image clear for logo strip (95% width)
//  - DO NOT place text/graphics in logo strip area"
```

---

## 🎨 Multi-Strip Rendering Flow

### Scenario: Header (5 logos) + Middle (2 logos)

```
Step 1: AI Decision
├─ Header: 5 logos → 95% width, tight spacing, justified
└─ Middle: 2 logos → 65% width, loose spacing, center

Step 2: Column Redistribution
├─ Header: [1,2,3,4,5] → [1,2,3,5,6] (virtual columns)
└─ Middle: [2,5] → [2,5] (already optimal)

Step 3: Strip Creation
├─ Create header strip (2280px wide, 95% of 2400)
│  ├─ Group logos by virtual column
│  ├─ Calculate spacing: 20-30px gaps (tight)
│  ├─ Scale if overcrowded
│  └─ Composite logos
│
└─ Create middle strip (1560px wide, 65% of 2400)
   ├─ Group logos by column
   ├─ Calculate spacing: 80-120px gaps (loose)
   ├─ Center-align within strip
   └─ Composite logos

Step 4: Strip Overlay
├─ Overlay header strip at Y=0
└─ Overlay middle strip at Y=stripHeight

Step 5: Final Image
└─ Return composite image with both strips
```

---

## 📊 Component Responsibilities

| Component | Responsibility | Input | Output |
|-----------|---------------|-------|--------|
| **Logo Placement Agent** | AI-powered position decisions | Logos, format, constraints | Placements + strip recommendations |
| **Logo Position Optimizer** | Algorithmic optimization | Logo count, format | Distribution patterns |
| **Logo Locks** | Enforce brand constraints | Placements, logo IDs | Validation result |
| **Column Redistributor** | Even spacing across strip | Logo positions | Virtual columns |
| **Strip Creator** | Render logo strips | Logos, width, spacing | Strip image buffer |
| **Logo Overlay Engine** | Compose final image | Base image, strips | Final creative image |

---

## 🔧 Configuration Files

### 1. Logo Sizes

```typescript
// lib/constants/logoConstants.ts

export const LOGO_SIZES = {
  small: { maxWidth: 120, maxHeight: 60 },
  medium: { maxWidth: 180, maxHeight: 90 },
  large: { maxWidth: 240, maxHeight: 120 },
  xlarge: { maxWidth: 300, maxHeight: 150 }
}
```

### 2. Strip Shapes

```typescript
export const STRIP_SHAPES = {
  straight: 'Flat horizontal strip',
  angled: 'Diagonal angled strip',
  curved: 'Wave-shaped strip'
}
```

### 3. Distribution Patterns

```typescript
// lib/services/logo-position-optimizer.ts

const DISTRIBUTION_PATTERNS = {
  2: [
    [1, 6],       // Edges (recommended)
    [2, 5],       // Inner edges
    [3, 4]        // Center
  ],
  3: [
    [1, 4, 6],    // Left, Center-Right, Right (recommended)
    [1, 3, 6],    // Left, Center, Right
    [2, 4, 6]     // Distributed right
  ],
  4: [
    [1, 2, 5, 6], // Edges + inner (recommended)
    [1, 3, 4, 6]  // Distributed
  ]
}
```

---

## 🚀 Complete Request Flow Example

```typescript
// 1. USER UPLOADS LOGOS
const userLogos = [
  { id: "yi", name: "Yi", file: File },
  { id: "cii", name: "CII", file: File },
  { id: "chapter", name: "Yi Pune", file: File }
]

// 2. AI DECIDES POSITIONS
const aiResult = await getAIOptimizedPlacements({
  logos: userLogos,
  formatId: "event_poster",
  formatDimensions: { width: 2400, height: 3000 }
})
// → Returns: top-1, top-4, top-6 with 80% width, normal spacing

// 3. VALIDATE LOCKS
const validation = validateLogoLocks(aiResult.placements, {
  yiLogoId: "yi",
  ciiLogoId: "cii"
})
// → Passes: Yi at top-1 ✓, CII at top-6 ✓

// 4. PREPARE LOGO BUFFERS
const logoBuffers = await Promise.all(
  userLogos.map(async logo => ({
    ...logo,
    buffer: await logo.file.arrayBuffer(),
    width: logo.file.width,
    height: logo.file.height
  }))
)

// 5. REDISTRIBUTE COLUMNS
const redistributed = redistributeColumnsForFullWidth([
  { column: 1, ...logoBuffers[0] },  // Yi
  { column: 4, ...logoBuffers[2] },  // Chapter
  { column: 6, ...logoBuffers[1] }   // CII
])
// → Virtual columns: [1, 4, 6] (already optimal, no change)

// 6. CREATE STRIP
const stripConfig = applyStripRecommendations(
  aiResult.stripRecommendations.header,
  2400
)

const { stripBuffer } = await createColumnAwareLogoStrip({
  logos: redistributed,
  imageWidth: stripConfig.stripWidth,  // 1920px (80%)
  stripPadding: stripConfig.horizontalPadding,  // 40px
  backgroundColor: '#FFFFFF'
})

// 7. OVERLAY ON IMAGE
const finalImage = await sharp(baseCreativeImage)
  .composite([{
    input: stripBuffer,
    top: 0,
    left: (2400 - 1920) / 2  // Center the 80% strip
  }])
  .toBuffer()

// 8. RETURN TO USER
return {
  image: finalImage,
  metadata: {
    placements: aiResult.placements,
    stripConfig: stripConfig,
    confidence: aiResult.confidence
  }
}
```

---

## 🎯 Key Algorithms

### Algorithm 1: Column Redistribution

```
Input: Logos at columns [1, 2, 3]
Goal: Spread across full width

Logic:
1. Extract used columns: [1, 2, 3]
2. Check if already full-width (has 1 AND 6): NO
3. Calculate virtual distribution for 3 logos: [1, 4, 6]
4. Map original → virtual:
   - 1 → 1
   - 2 → 4
   - 3 → 6
5. Return logos with virtualColumn property

Result: Logos now at [1, 4, 6] → Even distribution!
```

### Algorithm 2: Spacing Validation

```
Input: Scaled logo groups with positions
Goal: Ensure minimum 50px gaps

Logic:
1. For each consecutive pair of groups:
   - Calculate: gap = nextGroup.position - (currentGroup.position + width)
   - If gap < 50px → INVALID
2. If invalid:
   - Reduce scale factor by 10%
   - Recalculate widths
3. Return validation result

Result: Logos never too cramped!
```

### Algorithm 3: Strip Width Calculation

```
Input: AI recommendation (80%), image width (2400px)
Goal: Calculate actual strip width

Logic:
1. stripWidth = (imageWidth * widthPercentage) / 100
2. stripWidth = floor(2400 * 0.80) = 1920px
3. Calculate centering offset: (2400 - 1920) / 2 = 240px
4. Return: { width: 1920, offset: 240 }

Result: Strip is 80% wide, centered on canvas
```

---

## 📈 Decision Tree

```
User uploads logos
       │
       ▼
How many logos?
       │
       ├─ 1-2 → AI recommends: 60-70% width, loose spacing, center align
       ├─ 3-4 → AI recommends: 75-85% width, normal spacing, justified
       └─ 5-6 → AI recommends: 90-100% width, tight spacing, justified
       │
       ▼
Which strips are used?
       │
       ├─ Header only → Single strip configuration
       ├─ Header + Middle → Layered header effect
       └─ Header + Footer → Brand + sponsor hierarchy
       │
       ▼
Are logos clustered (e.g., all in columns 1-3)?
       │
       ├─ YES → Redistribute to virtual columns [1, 4, 6]
       └─ NO → Use original columns
       │
       ▼
Calculate spacing
       │
       ├─ Total width > available? → Scale down
       ├─ Gaps < 50px? → Reduce scale by 10%
       └─ OK → Proceed
       │
       ▼
Render strips
       │
       └─ Composite onto final image
```

---

This is the complete architecture of the logo positioning system! Every layer works together to create perfectly positioned, evenly spaced logos.
