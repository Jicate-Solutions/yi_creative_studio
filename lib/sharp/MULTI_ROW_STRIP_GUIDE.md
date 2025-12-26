# Multi-Row Single Strip - Usage Guide

## Problem Solved

**OLD APPROACH** - Two separate strips with gap:
```
┌────────────────────────────┐
│ [Yi]  [CII]  [Bharat]      │  ← Strip 1 (header)
└────────────────────────────┘
         ↓ 15-40px GAP (awkward!)
┌────────────────────────────┐
│   [Learning] [Innovation]  │  ← Strip 2 (middle)
└────────────────────────────┘
```

**NEW APPROACH** - One single strip, multiple rows:
```
┌────────────────────────────┐
│ [Yi]  [CII]  [Bharat]      │  ← Row 1
│                            │  ← 12px leading (internal)
│   [Learning] [Innovation]  │  ← Row 2
└────────────────────────────┘
    ↑ Single strip background!
```

---

## Benefits

1. ✅ **No gap problem** - It's one unified strip
2. ✅ **AI calculates optimal width for ALL rows together** - Better optimization
3. ✅ **Even spacing across all logos** - More cohesive
4. ✅ **Better leading** - 12px internal spacing between rows
5. ✅ **Layered header effect** - Professional look

---

## How to Use

### Function Signature

```typescript
async function createMultiRowStrip(
  imageWidth: number,
  logosByRow: Map<LogoStripRow, Array<{ buffer: Buffer; width: number; height: number; column: number }>>,
  backgroundColor: string,
  stripPadding: number,
  stripShape: LogoStripShape = 'straight',
  rowLeading: number = 12
): Promise<{ stripBuffer: Buffer; stripHeight: number }>
```

### Example: Header + Middle (5 + 2 logos)

```typescript
import { createMultiRowStrip } from '@/lib/sharp/logo-overlay'

// Prepare logos for each row
const headerLogos = [
  { buffer: yiLogoBuffer, width: 180, height: 90, column: 1 },
  { buffer: ciiLogoBuffer, width: 180, height: 90, column: 2 },
  { buffer: bharatBuffer, width: 180, height: 90, column: 3 },
  { buffer: chapterBuffer, width: 180, height: 90, column: 5 },
  { buffer: youthreachBuffer, width: 180, height: 90, column: 6 }
]

const middleLogos = [
  { buffer: learningBuffer, width: 120, height: 60, column: 2 },
  { buffer: innovationBuffer, width: 120, height: 60, column: 5 }
]

// Create combined strip
const logosByRow = new Map()
logosByRow.set('header', headerLogos)
logosByRow.set('middle', middleLogos)

const { stripBuffer, stripHeight } = await createMultiRowStrip(
  2400,              // Image width
  logosByRow,        // Logos grouped by row
  '#FFFFFF',         // Background color
  40,                // Horizontal padding
  'straight',        // Strip shape
  12                 // Row leading (12px between rows)
)

// Overlay on image
const finalImage = await sharp(baseImage)
  .composite([{
    input: stripBuffer,
    top: 0,
    left: 0
  }])
  .toBuffer()
```

---

## Console Output

When you use `createMultiRowStrip()`, you'll see:

```
[Multi-Row Strip] Creating combined strip for 2 rows
[Multi-Row Strip] Row "header": 5 logos, height 130px
[Multi-Row Strip] Row "middle": 2 logos, height 100px
[Multi-Row Strip] Total height: 242px (230px rows + 12px leading)
[Multi-Row Strip] Row "header" at Y=0px
[Multi-Row Strip] Virtual columns: 1, 2, 3, 5, 6
[Multi-Row Strip] Row "middle" at Y=142px
[Multi-Row Strip] Virtual columns: 2, 5
[Multi-Row Strip] ✅ Combined strip created successfully
```

---

## Parameters Explained

### `imageWidth`
- Width of the base image (e.g., 2400px)
- Strip will be created at this full width

### `logosByRow`
- Map of row name → array of logos
- Each logo needs: `buffer`, `width`, `height`, `column`
- Example:
  ```typescript
  const logosByRow = new Map()
  logosByRow.set('header', [/* header logos */])
  logosByRow.set('middle', [/* middle logos */])
  ```

### `backgroundColor`
- Strip background color (e.g., `'#FFFFFF'`, `'#F5F5F5'`)
- Usually white or light gray

### `stripPadding`
- Horizontal padding on left/right (e.g., 40px)
- Creates breathing room at edges

### `stripShape`
- `'straight'` - Flat rectangular strip (default)
- `'curved'` - Wave-shaped edges
- `'angled'` - Diagonal cut edges
- `'rounded'` - Rounded corners

### `rowLeading`
- Vertical spacing between rows WITHIN the strip
- Default: 12px (tight, layered effect)
- Recommended: 10-15px for header layers, 20-25px for more separation

---

## How It Works Internally

### Step 1: Calculate Row Heights

```
Row 1 (header, 5 logos):
- Max logo height: 90px
- Row height: 90px + 40px padding = 130px

Row 2 (middle, 2 logos):
- Max logo height: 60px
- Row height: 60px + 40px padding = 100px

Leading: 12px

Total strip height: 130px + 12px + 100px = 242px
```

### Step 2: Create Strip Background

```typescript
// Generate SVG background for full strip
const shapeSVG = generateStripShapeSVG(2400, 242, 'straight', '#FFFFFF')
```

### Step 3: Position Logos Row by Row

```
Current Y = 0

Row 1 (header):
  - Redistribute columns: [1,2,3,5,6] → [1,2,3,5,6] (already optimal)
  - Calculate spacing between column groups
  - Position logos at Y=0 to Y=130

Current Y = 130 + 12 (leading) = 142

Row 2 (middle):
  - Redistribute columns: [2,5] → [2,5] (centered)
  - Calculate spacing between column groups
  - Position logos at Y=142 to Y=242
```

### Step 4: Composite All Logos

```typescript
// One composite operation with all logos from all rows
await sharp(stripBuffer)
  .composite([
    // Row 1 logos at their Y positions
    // Row 2 logos at their Y positions
  ])
```

---

## Column Redistribution Per Row

Each row gets its own column redistribution:

```
Row 1 (header): [1,2,3,5,6] → Already optimal
Row 2 (middle): [2,5] → Stays [2,5] (centered placement)

Result:
┌────────────────────────────────────┐
│ [1] [2] [3]       [5] [6]          │ ← Row 1: spread across width
│                                    │
│       [2]           [5]            │ ← Row 2: centered
└────────────────────────────────────┘
```

---

## Use Cases

### 1. Event Poster - Brand + Verticals
```
Header: Yi, CII, Bharat Rising
Middle: Yi Learning, Yi Innovation
```

### 2. Conference Poster - Brands + Chapters
```
Header: Yi, CII
Middle: Yi Pune, Yi Mumbai, Yi Delhi
```

### 3. Certificate - Full Header Stack
```
Header: Yi, CII, Bharat Rising
Middle: Chapter Logo, Vertical Logo
Footer: Sponsors
```

---

## Comparison: Single Strip vs Multi-Strip

| Aspect | Old (Multi-Strip) | New (Single Strip Multi-Row) |
|--------|------------------|------------------------------|
| **Background** | 2 separate strips | 1 combined strip |
| **Gap** | 15-40px between strips | 12px internal leading |
| **Width calc** | Separate per strip | Unified for all rows |
| **Spacing** | Independent | Cohesive across rows |
| **Visual** | Two separate elements | One layered element |
| **Use case** | Separate header/footer | Layered header effect |

---

## When to Use

### Use Multi-Row Single Strip:
✅ Header + "header below" (brand + verticals)
✅ Layered header effect (tight, cohesive)
✅ 2-3 consecutive rows that should feel unified
✅ When gap between strips looks awkward

### Use Separate Strips:
✅ Header + Footer (wide separation)
✅ Brand logos (top) + Sponsors (bottom)
✅ When rows need visual separation
✅ When rows are not consecutive

---

## Advanced: Three Rows in One Strip

```typescript
const logosByRow = new Map()
logosByRow.set('header', headerLogos)   // 3 brand logos
logosByRow.set('middle', middleLogos)   // 2 vertical logos
logosByRow.set('footer', footerLogos)   // 4 sponsor logos

const { stripBuffer, stripHeight } = await createMultiRowStrip(
  2400,
  logosByRow,
  '#FFFFFF',
  40,
  'straight',
  15  // 15px leading between each row
)

// Creates:
// ┌─────────────────────────────┐
// │ [Brand1] [Brand2] [Brand3]  │ ← Row 1
// │                             │ ← 15px
// │   [Vertical1] [Vertical2]   │ ← Row 2
// │                             │ ← 15px
// │ [S1] [S2] [S3] [S4]         │ ← Row 3
// └─────────────────────────────┘
```

---

## Tips

1. **Keep row leading tight** (10-15px) for header layers
2. **Use consistent background color** across all rows
3. **Let AI calculate optimal width** for all rows together
4. **Test with different logo counts** to see redistribution
5. **Use logging** to verify virtual columns and spacing

---

## Next Steps

1. Export `createMultiRowStrip()` from logo-overlay.ts
2. Use in generation API when consecutive rows detected
3. Update AI agent to recommend combined strip mode
4. Add UI toggle for "Combined Strip Mode" vs "Separate Strips"

---

This approach solves the gap problem and creates a more professional, unified logo strip! 🎉
