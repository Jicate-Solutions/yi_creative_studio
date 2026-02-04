/**
 * v24.42: Unified speaker card dimension calculator
 * Ensures route.ts and speaker-overlay.ts use identical calculations
 *
 * Card anatomy:
 * - Photo: base size (180px default)
 * - Border: 3px on each side
 * - Shadow: 30px padding on each side (blur: 22 + offset: 8 from prepareSpeakerPhoto)
 * - Glow: 12px padding on each side
 * - Text: 91px below photo, 90px extra width
 *
 * v24.42: Fixed shadow padding mismatch
 * - Was using 18px but actual shadow uses blur:22 + offset:8 = 30px
 * - This caused card canvas to be 24px too small, cropping photos
 */

/**
 * Calculate speaker card dimensions with all effects (border, shadow, glow, text)
 * This is the SINGLE SOURCE OF TRUTH for card dimensions
 */
export function calculateSpeakerCardDimensions(photoSize: number = 180, options?: {
  shadow?: boolean
  textEnabled?: boolean
}): {
  cardWidth: number
  cardHeight: number
  effectivePhotoSize: number
} {
  const shouldAddShadow = options?.shadow !== false
  // v24.42: Shadow padding matches actual values in prepareSpeakerPhoto()
  // blur: 22, offset: {x: 8, y: 8} → shadowPadding = 22 + 8 = 30px
  const shadowPadding = shouldAddShadow ? 30 : 0
  const glowPadding = shouldAddShadow ? 12 : 0
  const borderWidth = 3
  const textEnabled = options?.textEnabled !== false

  // Photo with all visual effects
  // v24.42: 180 + 6 + 60 + 24 = 270px for default size (was 246px with wrong shadow padding)
  const effectivePhotoSize = photoSize + borderWidth * 2 + shadowPadding * 2 + glowPadding * 2

  // Card dimensions with text
  // Text adds ~90px width for name/designation display
  const textWidthBonus = textEnabled ? 90 : 0
  const cardWidth = effectivePhotoSize + textWidthBonus  // 336px for default
  const cardHeight = textEnabled ? effectivePhotoSize + 91 : effectivePhotoSize  // 337px for default

  return {
    cardWidth: Math.floor(cardWidth),
    cardHeight: Math.floor(cardHeight),
    effectivePhotoSize: Math.floor(effectivePhotoSize)
  }
}

/**
 * v24.40: Determine layout strategy based on speaker count
 * v24.46: Added 'horizontal' layout for 2 speakers (side-by-side, centered below content)
 *
 * Strategy:
 * - 1 speaker: 'stacked' (single card)
 * - 2 speakers: 'horizontal' (side-by-side in single row) - v24.46
 * - 3 speakers: 'stacked' (vertical column)
 * - 4+ speakers: 'grid' (2-column grid)
 */
export function getLayoutStrategy(count: number): 'stacked' | 'horizontal' | 'grid' {
  if (count === 1) return 'stacked'
  if (count === 2) return 'horizontal'  // v24.46: Side-by-side for 2 speakers
  if (count === 3) return 'stacked'
  return 'grid'
}

/**
 * v24.40: Calculate total block dimensions based on layout strategy
 * v24.46: Added horizontal layout support for 2 speakers
 * Used for AI positioning and zone calculations
 */
export function calculateBlockDimensions(
  speakerCount: number,
  cardWidth: number,
  cardHeight: number,
  spacing: number
): { width: number; height: number } {
  const layout = getLayoutStrategy(speakerCount)

  if (layout === 'horizontal') {
    // v24.46: Horizontal layout for 2 speakers - side-by-side in single row
    return {
      width: cardWidth * speakerCount + spacing * (speakerCount - 1),
      height: cardHeight  // Single row height
    }
  }

  if (layout === 'stacked') {
    // Vertical stack: single column
    return {
      width: cardWidth,
      height: cardHeight * speakerCount + spacing * (speakerCount - 1)
    }
  }

  // Grid layout: 2 columns (for 4+ speakers)
  const cols = 2
  const rows = Math.ceil(speakerCount / cols)
  return {
    width: cols * cardWidth + (cols - 1) * spacing,
    height: rows * cardHeight + (rows - 1) * spacing
  }
}

/**
 * v24.45: Calculate compact speaker card (photo only, no text)
 * Used when zone is too small for full cards with name/designation
 *
 * @param targetHeight - Available height in pixels
 */
export function calculateCompactSpeakerCard(targetHeight: number): {
  photoSize: number
  cardWidth: number
  cardHeight: number
} {
  // Effects: border(6) + shadow(60) + glow(24) = 90px overhead
  const effectsOverhead = 90
  const photoSize = Math.max(30, targetHeight - effectsOverhead)
  const cardSize = photoSize + effectsOverhead

  return {
    photoSize,
    cardWidth: cardSize,
    cardHeight: cardSize
  }
}

/**
 * v24.40: Scale down photo size until block fits in safe zone
 * v24.45: Enhanced with compact mode for very tight zones
 *
 * Iteratively reduces photo size by 10px until the block fits
 * For zones < 150px, uses compact mode (photo only, no text)
 *
 * @param speakerCount - Number of speakers to fit
 * @param safeZoneHeight - Available height in pixels
 * @param spacing - Gap between cards in pixels
 * @param minPhotoSize - Minimum allowed photo size (default 30px for compact mode)
 */
export function scaleToFitSafeZone(
  speakerCount: number,
  safeZoneHeight: number,
  spacing: number,
  minPhotoSize: number = 30
): {
  photoSize: number
  cardWidth: number
  cardHeight: number
  blockWidth: number
  blockHeight: number
  wasScaled: boolean
  compactMode: boolean  // v24.45: True if text disabled (photo only)
} {
  // v24.45: For very tight zones (<150px), use compact mode (no text, horizontal layout)
  if (safeZoneHeight < 150) {
    const compact = calculateCompactSpeakerCard(safeZoneHeight)
    // Horizontal layout for compact mode
    const blockWidth = compact.cardWidth * speakerCount + spacing * (speakerCount - 1)
    return {
      photoSize: compact.photoSize,
      cardWidth: compact.cardWidth,
      cardHeight: compact.cardHeight,
      blockWidth: blockWidth,
      blockHeight: compact.cardHeight,  // Single row height
      wasScaled: true,
      compactMode: true  // Signal to disable text in overlay
    }
  }

  // Standard scaling for larger zones
  let photoSize = 180  // Start with default size
  let wasScaled = false

  while (photoSize >= minPhotoSize) {
    const dims = calculateSpeakerCardDimensions(photoSize)
    const block = calculateBlockDimensions(speakerCount, dims.cardWidth, dims.cardHeight, spacing)

    if (block.height <= safeZoneHeight) {
      return {
        photoSize,
        cardWidth: dims.cardWidth,
        cardHeight: dims.cardHeight,
        blockWidth: block.width,
        blockHeight: block.height,
        wasScaled,
        compactMode: false
      }
    }

    photoSize -= 10
    wasScaled = true
  }

  // Minimum reached, return smallest possible
  const dims = calculateSpeakerCardDimensions(minPhotoSize)
  const block = calculateBlockDimensions(speakerCount, dims.cardWidth, dims.cardHeight, spacing)
  return {
    photoSize: minPhotoSize,
    cardWidth: dims.cardWidth,
    cardHeight: dims.cardHeight,
    blockWidth: block.width,
    blockHeight: block.height,
    wasScaled: true,
    compactMode: false
  }
}

/**
 * v24.40: Get dimension info for logging/debugging
 */
export function getDimensionInfo(photoSize: number = 180): string {
  const dims = calculateSpeakerCardDimensions(photoSize)
  return `photoSize=${photoSize}px → card=${dims.cardWidth}x${dims.cardHeight}px (effectivePhoto=${dims.effectivePhotoSize}px)`
}
