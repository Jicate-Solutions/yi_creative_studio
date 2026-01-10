# Multi-Speaker AI-Driven Sizing Integration Guide

## 🎯 Overview

The intelligent multi-speaker photo sizing system automatically calculates optimal photo sizes based on:

1. **Speaker Count** (2-4 speakers)
2. **Aspect Ratio** (portrait/square/landscape)
3. **Design Sophistication** (minimalist/balanced/rich)
4. **Speaker Hierarchy** (featured speaker gets +20% size)
5. **Available Space** (after text zones, logos, footer)

## 🚀 Quick Start: API Route Integration

### Option 1: Simple Helper Function (Recommended)

```typescript
import { calculateIntelligentLayout } from '@/lib/config/multi-speaker-layouts'

// In your API route (app/api/generate/route.ts)
const layout = calculateIntelligentLayout({
  speakerCount: speakers.length,
  formatId: 'event_poster', // or 'certificate', 'instagram_square', etc.
  canvasWidth: 1080,
  canvasHeight: 1440,
  sophistication: 'balanced', // or 'minimalist', 'rich'
})

// Use the layout
layout.positions.forEach((position, index) => {
  console.log(`Speaker ${index + 1}:`)
  console.log(`  Position: (${position.x}, ${position.y})`)
  console.log(`  Size: ${position.size}px`)
  console.log(`  Shape: ${position.shape}`)
  console.log(`  Z-Index: ${position.zIndex}`)
})

// Add composition guidance to Gemini prompt
const compositionGuidance = layout.compositionGuidance
```

### Option 2: Get Sizes Only

```typescript
import { getSpeakerPhotoSizes } from '@/lib/config/multi-speaker-layouts'

// Just get the pixel sizes for each speaker
const sizes = getSpeakerPhotoSizes(3, '4:5', 1080, 1440, 'balanced')
// Returns: [324, 270, 270] (pixels)

// Use with Sharp overlay
speakers.forEach((speaker, index) => {
  const size = sizes[index]
  // Apply circular mask and overlay at calculated size
})
```

### Option 3: Full Control

```typescript
import { calculateMultiSpeakerLayout } from '@/lib/config/multi-speaker-layouts'

const layout = calculateMultiSpeakerLayout(
  3, // speakerCount
  '4:5', // aspectRatio
  1080, // canvasWidth
  1440, // canvasHeight
  'medium', // photoSize (ignored if useIntelligentSizing: true)
  {
    useIntelligentSizing: true, // AI-driven sizing
    sophistication: 'balanced', // Design level
  }
)
```

## 📊 AI Sizing Results (Examples)

### Portrait (4:5) - 2 Speakers
```
Canvas: 1080×1440px
Speaker 1: 324px (30.0%) ← Featured +20%
Speaker 2: 270px (25.0%)
```

### Square (1:1) - 3 Speakers
```
Canvas: 1080×1080px
Minimalist sophistication:
  Speaker 1: 280px (25.9%) ← Featured
  Speaker 2: 233px (21.6%)
  Speaker 3: 233px (21.6%)

Balanced sophistication:
  Speaker 1: 311px (28.8%) ← Featured
  Speaker 2: 259px (24.0%)
  Speaker 3: 259px (24.0%)

Rich sophistication:
  Speaker 1: 342px (31.7%) ← Featured
  Speaker 2: 285px (26.4%)
  Speaker 3: 285px (26.4%)
```

### Landscape (16:9) - 4 Speakers
```
Canvas: 1920×1080px
Speaker 1: 530px (27.6%) ← Featured +20%
Speaker 2: 442px (23.0%)
Speaker 3: 442px (23.0%)
Speaker 4: 442px (23.0%)
```

## 🎨 Sophistication Levels

### Minimalist (`sophistication: 'minimalist'`)
- **10% smaller photos** for breathing room
- Clean, spacious aesthetic
- More text-focused
- **Use for**: Corporate events, professional certificates, formal announcements

### Balanced (`sophistication: 'balanced'`) [DEFAULT]
- **Baseline sizing** (no adjustment)
- General-purpose
- Good for most use cases
- **Use for**: Community events, workshops, standard posters

### Rich (`sophistication: 'rich'`)
- **10% larger photos** for visual impact
- Photo-dominant aesthetic
- More engaging, vibrant
- **Use for**: Festival posters, cultural events, social media posts

## 🔧 Integration Points in API Route

### 1. Determine Sophistication Level (Optional)

You can determine sophistication from:
- User preference (form field)
- Event type (cultural → rich, corporate → minimalist)
- Vertical preset (arts → rich, business → minimalist)

```typescript
const sophistication =
  eventData.vertical === 'arts_culture' ? 'rich' :
  eventData.vertical === 'business' ? 'minimalist' :
  'balanced'
```

### 2. Calculate Layout

```typescript
const layout = calculateIntelligentLayout({
  speakerCount: speakers.length,
  formatId: formatData.id,
  canvasWidth: formatDimensions.width,
  canvasHeight: formatDimensions.height,
  sophistication,
})
```

### 3. Validate Layout

```typescript
if (!layout.isValid) {
  console.error('[Multi-Speaker] Layout validation failed:', layout.validationErrors)
  // Fall back to single speaker mode or show error
}

if (layout.validationErrors.some(err => err.startsWith('⚠️'))) {
  console.warn('[Multi-Speaker] Layout warnings:', layout.validationErrors)
  // Continue but log warnings
}
```

### 4. Use in Gemini Prompt

```typescript
// Add composition guidance to prompt
const promptWithComposition = `
${basePrompt}

${layout.compositionGuidance}

SPEAKER PHOTOS: ${layout.positions.length} circular speaker photos will be overlaid.
Ensure decorative elements avoid collision with these zones.
`
```

### 5. Apply to Sharp Overlay

```typescript
// After Gemini generates the image
const processedImage = await overlayMultipleSpeakerPhotos(
  generatedImageBuffer,
  speakers,
  layout.positions, // Use calculated positions with AI-sized dimensions
  formatDimensions
)
```

## 🧪 Testing & Validation

### Run Test Suite

```bash
npx tsx lib/config/__test-multi-speaker-layouts.ts
```

### Expected Output

```
✅ Layout templates: 12 (portrait/square/landscape × 2-4 speakers)
✅ Validation: Header zone, footer zone, photo overlap, canvas bounds
✅ Text zone adjustments: Dynamic per layout
✅ Composition guidance: Natural language per layout
✅ AI-driven intelligent sizing: Context-aware per speaker
```

## 📐 Layout Output Structure

```typescript
interface MultiSpeakerLayout {
  positions: SpeakerPhotoPosition[] // Array of photo positions
  textZoneAdjustments: TextZoneAdjustments // Header, tagline, date, speakers, footer
  compositionGuidance: string // Natural language for Gemini
  isValid: boolean // Validation status
  validationErrors: string[] // Array of errors (⚠️ = warning, no prefix = error)
  layoutKey: string // e.g., 'portrait-3', 'square-2', 'landscape-4'
  recommendedAspectRatio?: string // If layout not optimal
}

interface SpeakerPhotoPosition {
  x: number // Center X coordinate (pixels)
  y: number // Center Y coordinate (pixels)
  size: number // Diameter (pixels) - INTELLIGENTLY CALCULATED
  shape: 'circle' | 'square' // Photo shape
  zIndex: number // Layering priority
}
```

## 🎯 Key Benefits

### ✅ No More Manual Size Selection
- **Before**: User selects small/medium/large (manual, error-prone)
- **After**: AI automatically optimizes based on context

### ✅ Context-Aware Sizing
- **Portrait formats**: Smaller photos to prevent vertical overlap
- **Landscape formats**: Larger photos using available width
- **Square formats**: Balanced sizing for 2×2 grids

### ✅ Speaker Hierarchy
- **Featured speaker** (first in array): 20% larger for prominence
- **Supporting speakers**: Baseline size

### ✅ Design Sophistication
- **Minimalist**: Smaller photos, more breathing room
- **Rich**: Larger photos, more visual impact
- **Balanced**: General-purpose sizing

### ✅ Automatic Validation
- Header zone collision (0-15%)
- Footer zone collision (85-100%)
- Photo-to-photo overlap
- Canvas boundary overflow
- Recommended aspect ratio warnings

## 🚨 Error Handling

### Validation Errors

```typescript
if (!layout.isValid) {
  // Critical errors - do not proceed
  const criticalErrors = layout.validationErrors.filter(err => !err.startsWith('⚠️'))
  console.error('Critical layout errors:', criticalErrors)

  // Fall back to single speaker mode
  return generateWithSingleSpeaker(...)
}

// Warnings - can proceed with caution
const warnings = layout.validationErrors.filter(err => err.startsWith('⚠️'))
if (warnings.length > 0) {
  console.warn('Layout warnings:', warnings)
  // Continue but log for debugging
}
```

### Unsupported Configurations

```typescript
// 4 speakers in portrait (not recommended)
if (layout.recommendedAspectRatio) {
  console.warn(`Consider switching to: ${layout.recommendedAspectRatio}`)
  // Optionally: prompt user to change format
}
```

## 🔄 Migration from Manual Sizing

### Before (Manual)

```typescript
const photoSize = speakers.length <= 2 ? 'medium' : 'small'
const layout = calculateMultiSpeakerLayout(
  speakers.length,
  aspectRatio,
  width,
  height,
  photoSize // Manual selection
)
```

### After (AI-Driven)

```typescript
const layout = calculateIntelligentLayout({
  speakerCount: speakers.length,
  formatId: 'event_poster',
  canvasWidth: width,
  canvasHeight: height,
  sophistication: 'balanced',
})
// Photo sizes automatically optimized per speaker!
```

## 📝 Notes

1. **Default Mode**: AI-driven sizing is enabled by default (`useIntelligentSizing: true`)
2. **Legacy Support**: Pass `useIntelligentSizing: false` to use old manual preset-based sizing
3. **Speaker Order**: First speaker in array is treated as featured (20% larger)
4. **Safe Ranges**: Minimum 15% of width, maximum 45% of width (automatically clamped)
5. **Logging**: Development mode logs full calculation breakdown per speaker

## 🎨 Example: Full API Route Integration

```typescript
// app/api/generate/route.ts
import { calculateIntelligentLayout } from '@/lib/config/multi-speaker-layouts'

export async function POST(request: Request) {
  const { speakers, formatId, vertical } = await request.json()

  // Get format dimensions
  const format = CREATIVE_FORMATS.find(f => f.id === formatId)
  const dims = format?.dimensions[resolution] || { width: 1080, height: 1440 }

  // Determine sophistication from vertical
  const sophistication =
    vertical === 'arts_culture' || vertical === 'festivals' ? 'rich' :
    vertical === 'business' || vertical === 'corporate' ? 'minimalist' :
    'balanced'

  // Calculate intelligent layout
  const layout = calculateIntelligentLayout({
    speakerCount: speakers.length,
    formatId: formatId,
    canvasWidth: dims.width,
    canvasHeight: dims.height,
    sophistication,
  })

  // Validate layout
  if (!layout.isValid) {
    return Response.json({ error: 'Layout validation failed', details: layout.validationErrors })
  }

  // Build Gemini prompt with composition guidance
  const prompt = buildEventPosterPrompt({
    ...eventData,
    compositionGuidance: layout.compositionGuidance,
    textZones: layout.textZoneAdjustments,
  })

  // Generate image with Gemini
  const generatedImage = await generateWithGemini(prompt, dims.width, dims.height)

  // Overlay speaker photos at calculated positions
  const finalImage = await overlayMultipleSpeakerPhotos(
    generatedImage,
    speakers.map(s => s.photoUrl),
    layout.positions, // Uses AI-calculated sizes!
    dims
  )

  return Response.json({ success: true, imageUrl: finalImage })
}
```

## ✅ Checklist

- [ ] Import `calculateIntelligentLayout` in API route
- [ ] Determine sophistication level (optional, defaults to 'balanced')
- [ ] Call `calculateIntelligentLayout()` with speaker count, format, dimensions
- [ ] Validate layout with `layout.isValid`
- [ ] Add `layout.compositionGuidance` to Gemini prompt
- [ ] Pass `layout.positions` to Sharp overlay function
- [ ] Test with 2, 3, and 4 speakers across different formats
- [ ] Test all sophistication levels (minimalist/balanced/rich)
- [ ] Verify featured speaker is 20% larger
- [ ] Check validation warnings in logs

---

**🎉 You're all set! The AI will now automatically optimize speaker photo sizes based on context.**
