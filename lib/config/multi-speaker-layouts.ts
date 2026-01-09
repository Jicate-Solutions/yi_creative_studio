/**
 * Multi-Speaker Photo Layout Engine v7.1
 *
 * Calculates optimal positions for 2-4 speaker photos based on:
 * - Speaker count
 * - Aspect ratio (portrait, square, landscape)
 * - Canvas dimensions
 * - Photo size preference
 * - Reserved zones (header, footer, text)
 *
 * Key Design Principles:
 * 1. Avoid header zone (0-15% from top) - reserved for logos
 * 2. Avoid footer zone (85-100% from top) - reserved for footer strip
 * 3. Avoid text zones (dynamic based on content)
 * 4. Maintain minimum 5% spacing between photos
 * 5. Keep photos within canvas bounds
 */

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export type PhotoShape = 'circle' | 'rounded' | 'square'
export type PhotoSizePreset = 'small' | 'medium' | 'large'
export type AspectRatioCategory = 'portrait' | 'square' | 'landscape'

export interface SpeakerPhotoPosition {
  x: number // pixels from left edge (center point)
  y: number // pixels from top edge (center point)
  size: number // diameter/width in pixels
  shape: PhotoShape
  zIndex: number // stacking order (higher = on top)
}

export interface TextZoneAdjustments {
  headline: { start: number; end: number } // percentage from top (0-100)
  tagline: { start: number; end: number }
  dateVenue: { start: number; end: number }
  speakers: { start: number; end: number }
  additionalDetails: { start: number; end: number }
}

export interface MultiSpeakerLayout {
  positions: SpeakerPhotoPosition[]
  textZoneAdjustments: TextZoneAdjustments
  compositionGuidance: string // Natural language for Gemini
  isValid: boolean
  validationErrors: string[]
  layoutKey: string // e.g., "portrait-2", "landscape-3"
  recommendedAspectRatio?: string // Suggestion if current ratio is suboptimal
}

interface LayoutTemplate {
  positions: Array<{
    xPercent: number // 0-100
    yPercent: number // 0-100
    shape: PhotoShape
    zIndex: number
  }>
  textZoneAdjustments: TextZoneAdjustments
  compositionGuidance: string
  isRecommended: boolean // true if this is ideal for speaker count
  warningMessage?: string // shown if not recommended but allowed
}

type LayoutKey =
  | 'portrait-2' | 'portrait-3' | 'portrait-4'
  | 'square-2' | 'square-3' | 'square-4'
  | 'landscape-2' | 'landscape-3' | 'landscape-4'

// ============================================================
// CONSTANTS
// ============================================================

// Default text zones (used when no adjustment needed)
const DEFAULT_TEXT_ZONES: TextZoneAdjustments = {
  headline: { start: 15, end: 35 },
  tagline: { start: 35, end: 45 },
  dateVenue: { start: 45, end: 55 },
  speakers: { start: 65, end: 75 },
  additionalDetails: { start: 75, end: 85 }
}

// Photo size multipliers (percentage of canvas width)
const SIZE_MULTIPLIERS: Record<PhotoSizePreset, number> = {
  small: 0.20,  // 20% of canvas width
  medium: 0.30, // 30% of canvas width
  large: 0.40   // 40% of canvas width
}

// Reserved zones (percentages from top)
const HEADER_ZONE_END = 15    // 0-15% reserved for logos
const FOOTER_ZONE_START = 85  // 85-100% reserved for footer

// ============================================================
// LAYOUT TEMPLATES
// ============================================================

const LAYOUT_TEMPLATES: Record<LayoutKey, LayoutTemplate> = {
  // ========================================
  // PORTRAIT LAYOUTS (4:5, 3:4)
  // ========================================

  'portrait-2': {
    positions: [
      { xPercent: 25, yPercent: 70, shape: 'circle', zIndex: 10 }, // Bottom-left
      { xPercent: 75, yPercent: 70, shape: 'circle', zIndex: 10 }  // Bottom-right
    ],
    textZoneAdjustments: {
      headline: { start: 15, end: 30 },
      tagline: { start: 30, end: 38 },
      dateVenue: { start: 38, end: 48 },
      speakers: { start: 58, end: 66 }, // Moved UP from default 65% to create gap
      additionalDetails: { start: 80, end: 85 }
    },
    compositionGuidance: 'COMPOSITION PHILOSOPHY: Center the main visual elements and focal points in the middle region where the headline and key message live. The left and right edges benefit from understated elegance—use flowing gradients, gentle color transitions, and visual breathing room rather than dense patterns or intricate details. This balanced approach creates professional sophistication while maintaining dynamic visual interest.',
    isRecommended: true
  },

  'portrait-3': {
    positions: [
      { xPercent: 18, yPercent: 68, shape: 'circle', zIndex: 10 }, // Bottom-left (adjusted up)
      { xPercent: 50, yPercent: 70, shape: 'circle', zIndex: 10 }, // Bottom-center (adjusted up)
      { xPercent: 82, yPercent: 68, shape: 'circle', zIndex: 10 }  // Bottom-right (adjusted up)
    ],
    textZoneAdjustments: {
      headline: { start: 15, end: 28 },
      tagline: { start: 28, end: 35 },
      dateVenue: { start: 35, end: 45 },
      speakers: { start: 55, end: 63 }, // Moved significantly UP
      additionalDetails: { start: 82, end: 85 }
    },
    compositionGuidance: 'COMPOSITION PHILOSOPHY: Concentrate the primary visual elements, decorative details, and rich patterns in the upper and central regions (the first 55% of the canvas from top). The lower third should embrace elegant simplicity—think smooth color gradients, subtle atmospheric transitions, and visual breathing room. This creates a natural focal hierarchy that guides attention to the headline while maintaining professional polish throughout.',
    isRecommended: false,
    warningMessage: '3 speakers in portrait format may feel cramped. Consider landscape (16:9) for better spacing.'
  },

  'portrait-4': {
    positions: [
      { xPercent: 25, yPercent: 58, shape: 'circle', zIndex: 10 }, // Top-left (adjusted up)
      { xPercent: 75, yPercent: 58, shape: 'circle', zIndex: 10 }, // Top-right (adjusted up)
      { xPercent: 25, yPercent: 73, shape: 'circle', zIndex: 10 }, // Bottom-left (adjusted up)
      { xPercent: 75, yPercent: 73, shape: 'circle', zIndex: 10 }  // Bottom-right (adjusted up)
    ],
    textZoneAdjustments: {
      headline: { start: 15, end: 25 },
      tagline: { start: 25, end: 32 },
      dateVenue: { start: 32, end: 40 },
      speakers: { start: 48, end: 56 }, // Heavily compressed
      additionalDetails: { start: 83, end: 85 }
    },
    compositionGuidance: 'COMPOSITION PHILOSOPHY: Build visual richness in the upper region (first 45% from top) where the headline commands attention. The middle and lower sections, as well as all edges and corners, should maintain elegant simplicity with smooth gradients and atmospheric transitions. This creates breathing room across the extended vertical canvas.',
    isRecommended: false,
    warningMessage: '4 speakers in portrait format is not recommended. Please switch to landscape (16:9) or square (1:1).'
  },

  // ========================================
  // SQUARE LAYOUTS (1:1)
  // ========================================

  'square-2': {
    positions: [
      { xPercent: 25, yPercent: 70, shape: 'circle', zIndex: 10 }, // Bottom-left (adjusted up)
      { xPercent: 75, yPercent: 70, shape: 'circle', zIndex: 10 }  // Bottom-right (adjusted up)
    ],
    textZoneAdjustments: {
      headline: { start: 15, end: 32 },
      tagline: { start: 32, end: 40 },
      dateVenue: { start: 40, end: 50 },
      speakers: { start: 60, end: 68 },
      additionalDetails: { start: 80, end: 85 }
    },
    compositionGuidance: 'COMPOSITION PHILOSOPHY: Center the main visual elements in the upper and middle regions. The bottom edge and corners benefit from understated elegance—flowing gradients and gentle color transitions that create visual breathing room while maintaining balanced composition.',
    isRecommended: true
  },

  'square-3': {
    positions: [
      { xPercent: 50, yPercent: 32, shape: 'circle', zIndex: 10 }, // Top-center
      { xPercent: 25, yPercent: 70, shape: 'circle', zIndex: 10 }, // Bottom-left (adjusted up)
      { xPercent: 75, yPercent: 70, shape: 'circle', zIndex: 10 }  // Bottom-right (adjusted up)
    ],
    textZoneAdjustments: {
      headline: { start: 48, end: 58 }, // Moved to MIDDLE (between top and bottom photos)
      tagline: { start: 58, end: 63 },
      dateVenue: { start: 63, end: 68 },
      speakers: { start: 80, end: 85 }, // Pushed to bottom
      additionalDetails: { start: 15, end: 25 } // Moved to TOP (unconventional but necessary)
    },
    compositionGuidance: 'COMPOSITION PHILOSOPHY: Create visual interest through a triangular composition. The top-center and bottom corners benefit from elegant simplicity—smooth gradients and subtle atmospheric transitions. The middle horizontal band (45-70% from top) should concentrate the headline and key messages, creating a natural visual flow.',
    isRecommended: true
  },

  'square-4': {
    positions: [
      { xPercent: 25, yPercent: 45, shape: 'circle', zIndex: 10 }, // Top-left
      { xPercent: 75, yPercent: 45, shape: 'circle', zIndex: 10 }, // Top-right
      { xPercent: 25, yPercent: 72, shape: 'circle', zIndex: 10 }, // Bottom-left (adjusted up)
      { xPercent: 75, yPercent: 72, shape: 'circle', zIndex: 10 }  // Bottom-right (adjusted up)
    ],
    textZoneAdjustments: {
      headline: { start: 15, end: 25 },
      tagline: { start: 25, end: 30 },
      dateVenue: { start: 30, end: 38 },
      speakers: { start: 60, end: 70 }, // Between top and bottom rows
      additionalDetails: { start: 82, end: 85 }
    },
    compositionGuidance: 'COMPOSITION PHILOSOPHY: Emphasize visual richness in the center region (between the top and bottom photo rows) where the headline lives. The corners and outer edges should maintain elegant simplicity with smooth gradients and subtle color transitions that frame the composition. This 2×2 arrangement creates natural breathing room at the periphery.',
    isRecommended: true
  },

  // ========================================
  // LANDSCAPE LAYOUTS (16:9)
  // ========================================

  'landscape-2': {
    positions: [
      { xPercent: 20, yPercent: 55, shape: 'circle', zIndex: 10 }, // Left side (adjusted up)
      { xPercent: 80, yPercent: 55, shape: 'circle', zIndex: 10 }  // Right side (adjusted up)
    ],
    textZoneAdjustments: {
      headline: { start: 15, end: 32 },
      tagline: { start: 32, end: 40 },
      dateVenue: { start: 40, end: 48 },
      speakers: { start: 72, end: 80 }, // Below photos
      additionalDetails: { start: 80, end: 85 }
    },
    compositionGuidance: 'COMPOSITION PHILOSOPHY: Center the main visual elements and focal points across the horizontal expanse. The left and right side margins benefit from understated elegance—flowing gradients and gentle color transitions that create visual breathing room while maintaining professional sophistication across the wide canvas.',
    isRecommended: true
  },

  'landscape-3': {
    positions: [
      { xPercent: 20, yPercent: 58, shape: 'circle', zIndex: 10 }, // Left (adjusted up)
      { xPercent: 50, yPercent: 58, shape: 'circle', zIndex: 10 }, // Center (adjusted up)
      { xPercent: 80, yPercent: 58, shape: 'circle', zIndex: 10 }  // Right (adjusted up)
    ],
    textZoneAdjustments: {
      headline: { start: 15, end: 30 },
      tagline: { start: 30, end: 37 },
      dateVenue: { start: 37, end: 45 },
      speakers: { start: 73, end: 80 }, // Below photos
      additionalDetails: { start: 80, end: 85 }
    },
    compositionGuidance: 'COMPOSITION PHILOSOPHY: Build visual richness in the upper region where the headline and message command attention. The side margins and lower edge benefit from understated elegance—let them breathe with flowing gradients, gentle color transitions, and atmospheric simplicity. This creates professional balance across the horizontal canvas while maintaining dynamic composition.',
    isRecommended: true
  },

  'landscape-4': {
    positions: [
      { xPercent: 15, yPercent: 58, shape: 'circle', zIndex: 10 }, // Far left (adjusted up)
      { xPercent: 38, yPercent: 58, shape: 'circle', zIndex: 10 }, // Center-left (adjusted up)
      { xPercent: 62, yPercent: 58, shape: 'circle', zIndex: 10 }, // Center-right (adjusted up)
      { xPercent: 85, yPercent: 58, shape: 'circle', zIndex: 10 }  // Far right (adjusted up)
    ],
    textZoneAdjustments: {
      headline: { start: 15, end: 28 },
      tagline: { start: 28, end: 35 },
      dateVenue: { start: 35, end: 43 },
      speakers: { start: 73, end: 80 }, // Below photos
      additionalDetails: { start: 80, end: 85 }
    },
    compositionGuidance: 'COMPOSITION PHILOSOPHY: Concentrate primary visual elements in the upper-center region. The side margins and lower edge should embrace elegant simplicity with smooth gradients and subtle atmospheric transitions. This horizontal distribution creates natural breathing room at the periphery while maintaining visual balance across the wide canvas.',
    isRecommended: true
  }
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Determine aspect ratio category from width/height ratio
 */
function getAspectRatioCategory(width: number, height: number): AspectRatioCategory {
  const ratio = width / height

  if (ratio < 0.95) return 'portrait'
  if (ratio > 1.05) return 'landscape'
  return 'square'
}

/**
 * Get size multiplier for photo preset
 */
function getSizeMultiplier(preset: PhotoSizePreset): number {
  return SIZE_MULTIPLIERS[preset]
}

/**
 * Check if a layout key exists in templates
 */
function layoutExists(key: LayoutKey): boolean {
  return key in LAYOUT_TEMPLATES
}

/**
 * Get recommended aspect ratio for speaker count
 */
function getRecommendedAspectRatio(speakerCount: number): string[] {
  if (speakerCount <= 2) {
    return ['4:5', '3:4', '1:1', '16:9'] // All work well
  }
  if (speakerCount === 3) {
    return ['16:9', '1:1', '4:5'] // Landscape/square preferred
  }
  if (speakerCount >= 4) {
    return ['16:9', '1:1'] // Landscape/square only
  }
  return []
}

// ============================================================
// MAIN CALCULATION FUNCTION
// ============================================================

/**
 * Calculate multi-speaker photo layout
 *
 * @param speakerCount Number of speakers (2-4)
 * @param aspectRatio Aspect ratio string (e.g., "4:5", "16:9")
 * @param canvasWidth Canvas width in pixels
 * @param canvasHeight Canvas height in pixels
 * @param photoSize Photo size preset (small/medium/large)
 * @returns Complete layout with positions, text adjustments, and validation
 */
export function calculateMultiSpeakerLayout(
  speakerCount: number,
  aspectRatio: string,
  canvasWidth: number,
  canvasHeight: number,
  photoSize: PhotoSizePreset = 'medium'
): MultiSpeakerLayout {
  console.log(`[Layout Engine] Calculating layout: ${speakerCount} speakers, ${aspectRatio} (${canvasWidth}×${canvasHeight}), size: ${photoSize}`)

  // Validation: Speaker count
  if (speakerCount < 2) {
    return {
      positions: [],
      textZoneAdjustments: DEFAULT_TEXT_ZONES,
      compositionGuidance: '',
      isValid: false,
      validationErrors: ['Multi-speaker layout requires at least 2 speakers. Use single speaker layout instead.'],
      layoutKey: `invalid-${speakerCount}`
    }
  }

  if (speakerCount > 4) {
    return {
      positions: [],
      textZoneAdjustments: DEFAULT_TEXT_ZONES,
      compositionGuidance: '',
      isValid: false,
      validationErrors: [`Maximum 4 speakers supported. Received ${speakerCount} speakers.`],
      layoutKey: `invalid-${speakerCount}`,
      recommendedAspectRatio: 'Please reduce speaker count to 4 or fewer'
    }
  }

  // Determine aspect ratio category
  const category = getAspectRatioCategory(canvasWidth, canvasHeight)
  const layoutKey: LayoutKey = `${category}-${speakerCount}` as LayoutKey

  console.log(`[Layout Engine] Detected category: ${category}, layout key: ${layoutKey}`)

  // Check if layout template exists
  if (!layoutExists(layoutKey)) {
    const recommended = getRecommendedAspectRatio(speakerCount)
    return {
      positions: [],
      textZoneAdjustments: DEFAULT_TEXT_ZONES,
      compositionGuidance: '',
      isValid: false,
      validationErrors: [`No layout template found for ${layoutKey}`],
      layoutKey,
      recommendedAspectRatio: recommended.join(', ')
    }
  }

  // Get layout template
  const template = LAYOUT_TEMPLATES[layoutKey]

  // Calculate photo size in pixels
  const sizeMultiplier = getSizeMultiplier(photoSize)
  const photoSizePixels = Math.round(canvasWidth * sizeMultiplier)

  console.log(`[Layout Engine] Photo size: ${photoSize} = ${sizeMultiplier * 100}% of width = ${photoSizePixels}px`)

  // Calculate absolute positions from percentages
  const positions: SpeakerPhotoPosition[] = template.positions.map((pos, index) => {
    const absoluteX = Math.round((pos.xPercent / 100) * canvasWidth)
    const absoluteY = Math.round((pos.yPercent / 100) * canvasHeight)

    return {
      x: absoluteX,
      y: absoluteY,
      size: photoSizePixels,
      shape: pos.shape,
      zIndex: pos.zIndex
    }
  })

  console.log(`[Layout Engine] Calculated ${positions.length} positions:`)
  positions.forEach((pos, i) => {
    console.log(`  Speaker ${i + 1}: (${pos.x}, ${pos.y}), size: ${pos.size}px, shape: ${pos.shape}`)
  })

  // Perform basic validation
  const validationErrors = performBasicValidation(positions, canvasWidth, canvasHeight)

  // Check if layout is recommended
  if (!template.isRecommended && validationErrors.length === 0) {
    validationErrors.push(`⚠️ ${template.warningMessage || 'This layout may not be optimal for the speaker count'}`)
  }

  const isValid = validationErrors.filter(e => !e.startsWith('⚠️')).length === 0

  return {
    positions,
    textZoneAdjustments: template.textZoneAdjustments,
    compositionGuidance: template.compositionGuidance,
    isValid,
    validationErrors,
    layoutKey,
    recommendedAspectRatio: !template.isRecommended ? getRecommendedAspectRatio(speakerCount).join(', ') : undefined
  }
}

/**
 * Perform basic validation on calculated positions
 */
function performBasicValidation(
  positions: SpeakerPhotoPosition[],
  canvasWidth: number,
  canvasHeight: number
): string[] {
  const errors: string[] = []

  // Check canvas bounds
  positions.forEach((pos, i) => {
    const left = pos.x - pos.size / 2
    const right = pos.x + pos.size / 2
    const top = pos.y - pos.size / 2
    const bottom = pos.y + pos.size / 2

    if (left < 0 || right > canvasWidth) {
      errors.push(`Speaker ${i + 1} exceeds horizontal canvas bounds (x: ${pos.x}, size: ${pos.size}, canvas: ${canvasWidth})`)
    }

    if (top < 0 || bottom > canvasHeight) {
      errors.push(`Speaker ${i + 1} exceeds vertical canvas bounds (y: ${pos.y}, size: ${pos.size}, canvas: ${canvasHeight})`)
    }
  })

  // Check header zone collision (0-15%)
  const headerBottom = canvasHeight * (HEADER_ZONE_END / 100)
  positions.forEach((pos, i) => {
    const photoTop = pos.y - pos.size / 2
    if (photoTop < headerBottom) {
      errors.push(`Speaker ${i + 1} overlaps header zone (top ${Math.round(photoTop)}px < ${Math.round(headerBottom)}px)`)
    }
  })

  // Check footer zone collision (85-100%)
  const footerTop = canvasHeight * (FOOTER_ZONE_START / 100)
  positions.forEach((pos, i) => {
    const photoBottom = pos.y + pos.size / 2
    if (photoBottom > footerTop) {
      errors.push(`Speaker ${i + 1} overlaps footer zone (bottom ${Math.round(photoBottom)}px > ${Math.round(footerTop)}px)`)
    }
  })

  // Check photo-to-photo overlap
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const distance = Math.sqrt(
        Math.pow(positions[i].x - positions[j].x, 2) +
        Math.pow(positions[i].y - positions[j].y, 2)
      )
      const minDistance = (positions[i].size + positions[j].size) / 2 + canvasWidth * 0.05 // 5% buffer

      if (distance < minDistance) {
        errors.push(`Speaker ${i + 1} and ${j + 1} photos overlap (distance ${Math.round(distance)}px < required ${Math.round(minDistance)}px)`)
      }
    }
  }

  return errors
}

// ============================================================
// UTILITY EXPORTS
// ============================================================

/**
 * Get composition guidance for a specific layout
 */
export function getCompositionGuidance(speakerCount: number, category: AspectRatioCategory): string {
  const layoutKey: LayoutKey = `${category}-${speakerCount}` as LayoutKey

  if (!layoutExists(layoutKey)) {
    return ''
  }

  return LAYOUT_TEMPLATES[layoutKey].compositionGuidance
}

/**
 * Check if a speaker count + aspect ratio combination is recommended
 */
export function isLayoutRecommended(speakerCount: number, category: AspectRatioCategory): boolean {
  const layoutKey: LayoutKey = `${category}-${speakerCount}` as LayoutKey

  if (!layoutExists(layoutKey)) {
    return false
  }

  return LAYOUT_TEMPLATES[layoutKey].isRecommended
}

/**
 * Get warning message for non-recommended layouts
 */
export function getLayoutWarning(speakerCount: number, category: AspectRatioCategory): string | undefined {
  const layoutKey: LayoutKey = `${category}-${speakerCount}` as LayoutKey

  if (!layoutExists(layoutKey)) {
    return 'Layout not supported'
  }

  return LAYOUT_TEMPLATES[layoutKey].warningMessage
}

/**
 * Get recommended photo size for speaker count
 *
 * IMPORTANT: Photo size affects spacing between photos.
 * - 2 speakers: 'medium' (30%) or 'large' (40%) work well
 * - 3 speakers: 'small' (20%) or 'medium' (30%) recommended
 * - 4 speakers: 'small' (20%) required to prevent overlap
 */
export function getRecommendedPhotoSize(speakerCount: number): PhotoSizePreset {
  if (speakerCount <= 2) {
    return 'medium' // 30% - good balance
  }
  if (speakerCount === 3) {
    return 'small' // 20% - prevents overlap in tight layouts
  }
  return 'small' // 4+ speakers always need small
}
