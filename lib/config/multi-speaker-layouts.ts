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
// v20.11: Updated with aggressive safe zones (36% start, 74% end)
const DEFAULT_TEXT_ZONES: TextZoneAdjustments = {
  headline: { start: 36, end: 44 },
  tagline: { start: 44, end: 50 },
  dateVenue: { start: 50, end: 58 },
  speakers: { start: 60, end: 68 },
  additionalDetails: { start: 70, end: 74 }
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
      headline: { start: 36, end: 43 }, // Start at 36% (aggressive safe zone)
      tagline: { start: 44, end: 49 },
      dateVenue: { start: 50, end: 58 },
      speakers: { start: 60, end: 68 },
      additionalDetails: { start: 70, end: 74 } // End at 74% (8% buffer before 82%)
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
      headline: { start: 36, end: 42 }, // Start at 36%
      tagline: { start: 42, end: 48 },
      dateVenue: { start: 48, end: 56 },
      speakers: { start: 58, end: 66 },
      additionalDetails: { start: 72, end: 74 } // End at 74%
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
      headline: { start: 36, end: 41 }, // Start at 36%
      tagline: { start: 41, end: 46 },
      dateVenue: { start: 46, end: 52 },
      speakers: { start: 64, end: 70 },
      additionalDetails: { start: 72, end: 74 } // End at 74%
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
      headline: { start: 36, end: 44 }, // Start at 36%
      tagline: { start: 44, end: 50 },
      dateVenue: { start: 50, end: 58 },
      speakers: { start: 60, end: 68 },
      additionalDetails: { start: 70, end: 74 } // End at 74%
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
      headline: { start: 48, end: 56 }, // Moved to MIDDLE (between top and bottom photos)
      tagline: { start: 56, end: 61 },
      dateVenue: { start: 61, end: 66 },
      speakers: { start: 72, end: 74 }, // Pushed to bottom, end at 74%
      additionalDetails: { start: 36, end: 43 } // Moved to after aggressive safe zone
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
      headline: { start: 36, end: 41 }, // Start at 36%
      tagline: { start: 41, end: 46 },
      dateVenue: { start: 46, end: 52 },
      speakers: { start: 60, end: 68 }, // Between top and bottom rows
      additionalDetails: { start: 72, end: 74 } // End at 74%
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
      headline: { start: 36, end: 44 }, // Start at 36%
      tagline: { start: 44, end: 50 },
      dateVenue: { start: 50, end: 56 },
      speakers: { start: 68, end: 72 }, // Below photos
      additionalDetails: { start: 72, end: 74 } // End at 74%
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
      headline: { start: 36, end: 43 }, // Start at 36%
      tagline: { start: 43, end: 48 },
      dateVenue: { start: 48, end: 54 },
      speakers: { start: 68, end: 72 }, // Below photos
      additionalDetails: { start: 72, end: 74 } // End at 74%
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
      headline: { start: 36, end: 42 }, // Start at 36%
      tagline: { start: 42, end: 47 },
      dateVenue: { start: 47, end: 53 },
      speakers: { start: 68, end: 72 }, // Below photos
      additionalDetails: { start: 72, end: 74 } // End at 74%
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
 * @param photoSize Photo size preset (small/medium/large) - ignored if useIntelligentSizing is true
 * @param options Optional configuration
 * @param options.useIntelligentSizing Use AI-driven intelligent photo sizing (default: true)
 * @param options.sophistication Design sophistication level (default: 'balanced')
 * @param options.footerReservePercent Percentage reserved for footer (for maxY constraint)
 * @returns Complete layout with positions, text adjustments, and validation
 */
export function calculateMultiSpeakerLayout(
  speakerCount: number,
  aspectRatio: string,
  canvasWidth: number,
  canvasHeight: number,
  photoSize: PhotoSizePreset = 'medium',
  options?: {
    useIntelligentSizing?: boolean
    sophistication?: 'minimalist' | 'balanced' | 'rich'
    /** v7.1: Total speakers for sizing (may differ from speakerCount if some don't have photos) */
    totalSpeakersForSizing?: number
    /** v20.10: PHASE 3 - Footer reserve percentage for boundary protection */
    footerReservePercent?: number
  }
): MultiSpeakerLayout {
  const useIntelligentSizing = options?.useIntelligentSizing ?? true // Default to AI-driven sizing
  const sophistication = options?.sophistication ?? 'balanced'
  // v7.1: Use totalSpeakersForSizing for photo sizing, speakerCount for positions
  const sizingBasedOnSpeakers = options?.totalSpeakersForSizing ?? speakerCount

  console.log(`[Layout Engine] Calculating layout: ${speakerCount} speakers, ${aspectRatio} (${canvasWidth}×${canvasHeight})`)
  console.log(`[Layout Engine] Mode: ${useIntelligentSizing ? 'AI-DRIVEN INTELLIGENT SIZING' : `Manual (${photoSize})`}`)
  if (options?.totalSpeakersForSizing && options.totalSpeakersForSizing !== speakerCount) {
    console.log(`[Layout Engine v7.1] Sizing photos for ${sizingBasedOnSpeakers}-speaker layout (only ${speakerCount} have photos)`)
  }

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

  // Calculate absolute positions from percentages
  const positions: SpeakerPhotoPosition[] = template.positions.map((pos, index) => {
    const absoluteX = Math.round((pos.xPercent / 100) * canvasWidth)
    let absoluteY = Math.round((pos.yPercent / 100) * canvasHeight)

    // INTELLIGENT SIZING: Calculate photo size per speaker
    let photoSizePixels: number

    if (useIntelligentSizing) {
      // AI-DRIVEN: Use context-aware intelligent sizing
      // v7.1: Use sizingBasedOnSpeakers for sizing (may differ from speakerCount if some don't have photos)
      photoSizePixels = calculateOptimalPhotoSize({
        speakerCount: sizingBasedOnSpeakers, // v7.1: Size based on TOTAL speakers
        aspectRatio,
        canvasWidth,
        canvasHeight,
        sophistication,
        speakerIndex: index,
        textZones: template.textZoneAdjustments,
      })

      console.log(`[Layout Engine] Speaker ${index + 1}: AI-sized to ${photoSizePixels}px (${((photoSizePixels / canvasWidth) * 100).toFixed(1)}% of width, based on ${sizingBasedOnSpeakers} total speakers)`)
    } else {
      // MANUAL: Use legacy preset-based sizing
      const sizeMultiplier = getSizeMultiplier(photoSize)
      photoSizePixels = Math.round(canvasWidth * sizeMultiplier)

      if (index === 0) {
        console.log(`[Layout Engine] All speakers: Manual size ${photoSize} = ${photoSizePixels}px (${(sizeMultiplier * 100).toFixed(0)}% of width)`)
      }
    }

    // v20.10: PHASE 3 - Add footer zone protection
    // Prevent speaker photos from overlapping footer zone
    if (options?.footerReservePercent && options.footerReservePercent > 0) {
      const footerBufferZone = canvasHeight * 0.08 // 8% buffer above footer
      const footerStartY = canvasHeight * ((100 - options.footerReservePercent) / 100)
      const maxSpeakerY = footerStartY - footerBufferZone

      // Check if speaker photo would extend into footer zone
      const photoBottom = absoluteY + (photoSizePixels / 2)

      if (photoBottom > maxSpeakerY) {
        const adjustedY = maxSpeakerY - (photoSizePixels / 2)
        console.warn(`[Layout Engine] Speaker ${index + 1} would overlap footer (Y=${absoluteY}, bottom=${photoBottom.toFixed(0)} > maxY=${maxSpeakerY.toFixed(0)})`)
        console.warn(`[Layout Engine] Adjusting speaker Y position: ${absoluteY} → ${adjustedY.toFixed(0)}`)
        absoluteY = Math.round(adjustedY)
      }
    }

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
 * Context for intelligent photo size calculation
 */
export interface PhotoSizeContext {
  speakerCount: number
  aspectRatio: string // e.g., '4:5', '1:1', '16:9'
  canvasWidth: number
  canvasHeight: number
  sophistication?: 'minimalist' | 'balanced' | 'rich'
  speakerIndex?: number // For hierarchy (0 = primary/featured speaker)
  textZones?: TextZoneAdjustments
}

/**
 * AI-DRIVEN INTELLIGENT PHOTO SIZE CALCULATION
 *
 * This function uses context-aware logic to determine optimal speaker photo sizes
 * instead of relying on manual selection. It considers:
 *
 * 1. Speaker count (baseline)
 * 2. Aspect ratio constraints (portrait needs smaller, landscape allows larger)
 * 3. Available space after text zones
 * 4. Design sophistication level
 * 5. Speaker hierarchy (featured speakers can be larger)
 * 6. Layout density and overlap prevention
 *
 * Returns size in pixels (absolute value, not percentage)
 */
export function calculateOptimalPhotoSize(context: PhotoSizeContext): number {
  const {
    speakerCount,
    aspectRatio,
    canvasWidth,
    canvasHeight,
    sophistication = 'balanced',
    speakerIndex = 0,
  } = context

  // STEP 1: Baseline size from speaker count
  const basePercentages = {
    1: 0.40, // Single speaker: large (40%)
    2: 0.32, // Two speakers: medium-large (32%)
    3: 0.24, // Three speakers: small-medium (24%)
    4: 0.20, // Four speakers: small (20%)
  }
  const basePercent = basePercentages[speakerCount as keyof typeof basePercentages] || 0.20

  // STEP 2: Aspect ratio multiplier
  // Portrait formats (4:5, 3:4) have less width → smaller photos
  // Landscape formats (16:9) have more width → larger photos
  const ratio = canvasWidth / canvasHeight
  let ratioMultiplier = 1.0

  if (ratio < 0.95) {
    // Portrait: constrained width, reduce size
    ratioMultiplier = 0.85 // 15% reduction
  } else if (ratio > 1.05) {
    // Landscape: ample width, can increase size
    ratioMultiplier = 1.15 // 15% increase
  }
  // Square (0.95-1.05): no adjustment (1.0)

  // STEP 3: Sophistication multiplier
  // Minimalist designs: smaller, more breathing room
  // Rich designs: larger, more visual presence
  const sophisticationMultipliers = {
    minimalist: 0.90, // 10% smaller for clean aesthetic
    balanced: 1.00, // No adjustment
    rich: 1.10, // 10% larger for visual impact
  }
  const sophisticationMultiplier = sophisticationMultipliers[sophistication]

  // STEP 4: Speaker hierarchy multiplier
  // Primary/featured speaker (index 0) can be 20% larger
  // Supporting speakers (index 1+) use base size
  const hierarchyMultiplier = speakerIndex === 0 && speakerCount >= 2 ? 1.20 : 1.0

  // STEP 5: Vertical space constraint
  // If canvas is very tall (like 4:5), reduce size to prevent vertical overlap
  const heightConstraint = canvasHeight / canvasWidth
  let verticalMultiplier = 1.0
  if (heightConstraint > 1.3) {
    // Very tall canvas (4:5 = 1.33, 3:4 = 1.33)
    verticalMultiplier = 0.92 // 8% reduction
  }

  // STEP 6: Calculate final size in pixels
  const calculatedSize = Math.round(
    canvasWidth *
      basePercent *
      ratioMultiplier *
      sophisticationMultiplier *
      hierarchyMultiplier *
      verticalMultiplier
  )

  // STEP 7: Safety clamps
  // Minimum: 15% of canvas width (too small = unreadable)
  // Maximum: 45% of canvas width (too large = overlap)
  const minSize = Math.round(canvasWidth * 0.15)
  const maxSize = Math.round(canvasWidth * 0.45)

  const finalSize = Math.max(minSize, Math.min(maxSize, calculatedSize))

  // Optional: Log calculation for debugging
  if (process.env.NODE_ENV === 'development') {
    console.log(`[AI Photo Sizing] Speaker ${speakerIndex + 1}/${speakerCount}:`, {
      basePercent: `${(basePercent * 100).toFixed(0)}%`,
      ratioMult: ratioMultiplier.toFixed(2),
      sophistMult: sophisticationMultiplier.toFixed(2),
      hierarchyMult: hierarchyMultiplier.toFixed(2),
      verticalMult: verticalMultiplier.toFixed(2),
      calculated: `${calculatedSize}px`,
      final: `${finalSize}px (${((finalSize / canvasWidth) * 100).toFixed(1)}%)`,
    })
  }

  return finalSize
}

/**
 * Get recommended photo size for speaker count (LEGACY - Simple Version)
 *
 * IMPORTANT: Photo size affects spacing between photos.
 * - 2 speakers: 'medium' (30%) or 'large' (40%) work well
 * - 3 speakers: 'small' (20%) or 'medium' (30%) recommended
 * - 4 speakers: 'small' (20%) required to prevent overlap
 *
 * NOTE: Consider using calculateOptimalPhotoSize() for AI-driven sizing
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

/**
 * Convert PhotoSizePreset to percentage (for backward compatibility)
 */
export function photoSizeToPercent(size: PhotoSizePreset): number {
  const percentages = {
    small: 0.20,
    medium: 0.30,
    large: 0.40,
  }
  return percentages[size]
}

/**
 * Convert pixel size to PhotoSizePreset (nearest match)
 */
export function pixelSizeToPreset(pixelSize: number, canvasWidth: number): PhotoSizePreset {
  const percent = pixelSize / canvasWidth

  if (percent <= 0.25) return 'small' // 0-25%
  if (percent <= 0.35) return 'medium' // 25-35%
  return 'large' // 35%+
}

// ============================================================
// HELPER FUNCTIONS FOR API INTEGRATION
// ============================================================

/**
 * Quick helper for API route: Calculate multi-speaker layout with AI sizing
 *
 * This is the recommended function to use in your API route.
 * It automatically uses intelligent sizing and returns optimized layout.
 *
 * @example
 * ```typescript
 * const layout = calculateIntelligentLayout({
 *   speakerCount: 3,
 *   formatId: 'event_poster', // '4:5' aspect ratio
 *   canvasWidth: 1080,
 *   canvasHeight: 1440,
 *   sophistication: 'balanced', // or 'minimalist', 'rich'
 * })
 *
 * // Access positions
 * layout.positions.forEach((pos, i) => {
 *   console.log(`Speaker ${i + 1}: ${pos.size}px at (${pos.x}, ${pos.y})`)
 * })
 *
 * // Use composition guidance in prompt
 * console.log(layout.compositionGuidance)
 * ```
 */
export function calculateIntelligentLayout(params: {
  speakerCount: number
  formatId: string // e.g., 'event_poster', 'certificate', 'instagram_square'
  canvasWidth: number
  canvasHeight: number
  sophistication?: 'minimalist' | 'balanced' | 'rich'
  /** v7.1: Total speakers for sizing (may differ from speakerCount if some don't have photos) */
  totalSpeakersForSizing?: number
}): MultiSpeakerLayout {
  const { speakerCount, formatId, canvasWidth, canvasHeight, sophistication = 'balanced', totalSpeakersForSizing } = params

  // Determine aspect ratio from format ID or calculate from dimensions
  const aspectRatioMap: Record<string, string> = {
    event_poster: '4:5',
    certificate: '3:4',
    instagram_square: '1:1',
    instagram_post: '1:1',
    youtube_thumbnail: '16:9',
    linkedin_post: '4:5',
    facebook_post: '1:1',
    twitter_post: '16:9',
  }

  const aspectRatio = aspectRatioMap[formatId] || `${canvasWidth}:${canvasHeight}`

  // v7.1: Log if sizing is based on different speaker count than positions
  if (totalSpeakersForSizing && totalSpeakersForSizing !== speakerCount) {
    console.log(`[Layout Engine v7.1] Sizing based on ${totalSpeakersForSizing} total speakers, positions for ${speakerCount} photos`)
  }

  // Use AI-driven intelligent sizing
  return calculateMultiSpeakerLayout(speakerCount, aspectRatio, canvasWidth, canvasHeight, 'medium', {
    useIntelligentSizing: true,
    sophistication,
    totalSpeakersForSizing, // v7.1: Pass total speakers for sizing
  })
}

/**
 * Get speaker photo sizes for API payload
 *
 * Returns array of pixel sizes optimized for each speaker.
 * First speaker is featured (20% larger), others are supporting.
 *
 * @example
 * ```typescript
 * const sizes = getSpeakerPhotoSizes(3, '4:5', 1080, 1440)
 * // Returns: [324, 270, 270] (pixels)
 * ```
 */
export function getSpeakerPhotoSizes(
  speakerCount: number,
  aspectRatio: string,
  canvasWidth: number,
  canvasHeight: number,
  sophistication?: 'minimalist' | 'balanced' | 'rich'
): number[] {
  const layout = calculateMultiSpeakerLayout(speakerCount, aspectRatio, canvasWidth, canvasHeight, 'medium', {
    useIntelligentSizing: true,
    sophistication,
  })

  return layout.positions.map((pos) => pos.size)
}
