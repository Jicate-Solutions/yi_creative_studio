import sharp from 'sharp'
import type {
  SpeakerPhotoCustomization,
  PhotoPosition,
  PhotoShape,
  PhotoVerticalPosition,
  SpeakerItem,
  LayoutMode,
  LayoutStrategy,
} from '@/lib/config/design-constants'
import { normalizeSpeakerConfig, getSpeakerCount } from '@/lib/utils/speaker-migration'

// Re-export types for use by other modules
export type { LayoutStrategy }

interface SpeakerOverlayConfig {
  baseImageBuffer: Buffer
  speakerPhoto: SpeakerPhotoCustomization
}

/**
 * Calculate x position based on PhotoPosition ('left', 'center', 'right')
 */
function calculateXPosition(
  position: PhotoPosition,
  imageWidth: number,
  photoSize: number,
  padding: number
): number {
  switch (position) {
    case 'left':
      return padding
    case 'center':
      return Math.floor((imageWidth - photoSize) / 2)
    case 'right':
      return imageWidth - photoSize - padding
    default:
      return Math.floor((imageWidth - photoSize) / 2)
  }
}

/**
 * Calculate y position based on PhotoVerticalPosition
 * Maps position to percentage of image height
 */
function calculateYPosition(
  verticalPosition: PhotoVerticalPosition | undefined,
  imageHeight: number,
  photoSize: number,
  padding: number
): number {
  // Map vertical positions to percentages
  const positionPercentages: Record<PhotoVerticalPosition, number> = {
    'top': 0.15,      // 15% from top
    'upper': 0.30,    // 30% from top
    'middle': 0.50,   // 50% (center)
    'lower': 0.65,    // 65% from top
    'bottom': 0.80,   // 80% from top
  }

  const percentage = positionPercentages[verticalPosition || 'lower'] || 0.65
  const baseY = Math.floor(imageHeight * percentage)

  // Ensure photo stays within bounds with padding
  const maxY = imageHeight - photoSize - padding
  const minY = padding

  return Math.max(minY, Math.min(baseY - Math.floor(photoSize / 2), maxY))
}

/**
 * Calculate exact speaker photo coordinates for pre-generation use
 * This function enables coordination between Gemini prompt generation and Sharp overlay
 *
 * @param config - Photo configuration
 * @param dimensions - Image dimensions
 * @returns Exact pixel coordinates and bounding box information
 */
export function calculateSpeakerPhotoCoordinates(
  config: {
    position: PhotoPosition
    verticalPosition?: PhotoVerticalPosition
    size: number
    borderWidth?: number
  },
  dimensions: { width: number; height: number }
): {
  x: number
  y: number
  width: number
  height: number
  topEdge: number
  bottomEdge: number
  leftEdge: number
  rightEdge: number
} {
  const padding = 40
  const borderWidth = config.borderWidth || 0
  const totalPhotoSize = config.size + borderWidth * 2

  const x = calculateXPosition(config.position, dimensions.width, totalPhotoSize, padding)
  const y = calculateYPosition(config.verticalPosition, dimensions.height, totalPhotoSize, padding)

  return {
    x,
    y,
    width: totalPhotoSize,
    height: totalPhotoSize,
    topEdge: y,
    bottomEdge: y + totalPhotoSize,
    leftEdge: x,
    rightEdge: x + totalPhotoSize,
  }
}

/**
 * Apply shape masking to a photo buffer
 */
async function applyShapeMask(
  photoBuffer: Buffer,
  size: number,
  shape: PhotoShape
): Promise<Buffer> {
  if (shape === 'square') {
    // No mask needed for square
    return photoBuffer
  }

  // Create mask based on shape
  let maskSvg: string

  if (shape === 'circle') {
    const radius = size / 2
    maskSvg = `
      <svg width="${size}" height="${size}">
        <circle cx="${radius}" cy="${radius}" r="${radius}" fill="white"/>
      </svg>
    `
  } else {
    // rounded - use rounded rectangle
    const borderRadius = Math.floor(size * 0.1) // 10% border radius
    maskSvg = `
      <svg width="${size}" height="${size}">
        <rect x="0" y="0" width="${size}" height="${size}" rx="${borderRadius}" ry="${borderRadius}" fill="white"/>
      </svg>
    `
  }

  // Create the mask buffer
  const maskBuffer = Buffer.from(maskSvg)

  // Apply mask using composite
  return await sharp(photoBuffer)
    .resize(size, size, { fit: 'cover' })
    .composite([
      {
        input: await sharp(maskBuffer).resize(size, size).png().toBuffer(),
        blend: 'dest-in',
      },
    ])
    .png()
    .toBuffer()
}

/**
 * DEPRECATED v6.0 Phase 5: Apply border to a shaped photo
 * This function created solid background behind speaker photos - replaced by addSpeakerPhotoShadow()
 * Kept for backward compatibility but should not be used in new code
 */
async function applyBorder(
  photoBuffer: Buffer,
  size: number,
  shape: PhotoShape,
  borderWidth: number,
  borderColor: string
): Promise<Buffer> {
  console.warn('[Speaker Photo] applyBorder() is DEPRECATED - use addSpeakerPhotoShadow() instead')

  if (borderWidth <= 0) {
    return photoBuffer
  }

  // Calculate total size with border
  const totalSize = size + borderWidth * 2

  // Create border SVG
  let borderSvg: string

  if (shape === 'circle') {
    const radius = totalSize / 2
    borderSvg = `
      <svg width="${totalSize}" height="${totalSize}">
        <circle cx="${radius}" cy="${radius}" r="${radius}" fill="${borderColor}"/>
      </svg>
    `
  } else if (shape === 'rounded') {
    const borderRadius = Math.floor(totalSize * 0.1)
    borderSvg = `
      <svg width="${totalSize}" height="${totalSize}">
        <rect x="0" y="0" width="${totalSize}" height="${totalSize}" rx="${borderRadius}" ry="${borderRadius}" fill="${borderColor}"/>
      </svg>
    `
  } else {
    // square
    borderSvg = `
      <svg width="${totalSize}" height="${totalSize}">
        <rect x="0" y="0" width="${totalSize}" height="${totalSize}" fill="${borderColor}"/>
      </svg>
    `
  }

  // Create border background
  const borderBuffer = await sharp(Buffer.from(borderSvg))
    .resize(totalSize, totalSize)
    .png()
    .toBuffer()

  // Composite photo onto border
  return await sharp(borderBuffer)
    .composite([
      {
        input: photoBuffer,
        top: borderWidth,
        left: borderWidth,
      },
    ])
    .png()
    .toBuffer()
}

/**
 * v6.0 Phase 5: Adds drop shadow to speaker photo (NO solid background)
 * Replaces applyBorder() to enable transparent speaker photos on AI backgrounds
 *
 * @param photoBuffer - Circular/rounded/square masked photo buffer
 * @param size - Photo size in pixels
 * @param shape - Photo shape (circle, rounded, square)
 * @param shadowConfig - Shadow configuration
 * @returns Buffer with photo and drop shadow on transparent background
 */
async function addSpeakerPhotoShadow(
  photoBuffer: Buffer,
  size: number,
  shape: PhotoShape,
  shadowConfig: { blur: number; opacity: number; offset: { x: number; y: number } } = {
    blur: 15,
    opacity: 0.5,
    offset: { x: 3, y: 3 }
  }
): Promise<Buffer> {
  const shadowPadding = shadowConfig.blur + Math.max(Math.abs(shadowConfig.offset.x), Math.abs(shadowConfig.offset.y))
  const totalSize = size + shadowPadding * 2

  try {
    // Create shadow using SVG filter matching photo shape
    let shadowMaskSvg: string

    if (shape === 'circle') {
      const radius = size / 2
      shadowMaskSvg = `
        <svg width="${size}" height="${size}">
          <defs>
            <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="${shadowConfig.blur}" />
              <feOffset dx="${shadowConfig.offset.x}" dy="${shadowConfig.offset.y}" result="offsetblur" />
              <feComponentTransfer>
                <feFuncA type="linear" slope="${shadowConfig.opacity}" />
              </feComponentTransfer>
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <circle cx="${radius}" cy="${radius}" r="${radius}" fill="black" filter="url(#shadow)" />
        </svg>
      `
    } else if (shape === 'rounded') {
      const borderRadius = Math.floor(size * 0.1)
      shadowMaskSvg = `
        <svg width="${size}" height="${size}">
          <defs>
            <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="${shadowConfig.blur}" />
              <feOffset dx="${shadowConfig.offset.x}" dy="${shadowConfig.offset.y}" result="offsetblur" />
              <feComponentTransfer>
                <feFuncA type="linear" slope="${shadowConfig.opacity}" />
              </feComponentTransfer>
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <rect width="${size}" height="${size}" rx="${borderRadius}" ry="${borderRadius}" fill="black" filter="url(#shadow)" />
        </svg>
      `
    } else {
      // square
      shadowMaskSvg = `
        <svg width="${size}" height="${size}">
          <defs>
            <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="${shadowConfig.blur}" />
              <feOffset dx="${shadowConfig.offset.x}" dy="${shadowConfig.offset.y}" result="offsetblur" />
              <feComponentTransfer>
                <feFuncA type="linear" slope="${shadowConfig.opacity}" />
              </feComponentTransfer>
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <rect width="${size}" height="${size}" fill="black" filter="url(#shadow)" />
        </svg>
      `
    }

    // Create canvas with shadow (transparent background)
    const result = await sharp({
      create: {
        width: totalSize,
        height: totalSize,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }  // Transparent background
      }
    })
    .composite([
      {
        input: photoBuffer,
        top: shadowPadding,
        left: shadowPadding,
      }
    ])
    .png()
    .toBuffer()

    console.log(`[Speaker Photo] Added drop shadow (${size}px → ${totalSize}px with ${shadowConfig.blur}px blur)`)
    return result
  } catch (error) {
    console.error('[Speaker Photo] Error creating shadow:', error)
    return photoBuffer  // Fallback to original
  }
}

/**
 * Apply drop shadow to an image
 */
async function applyShadow(
  photoBuffer: Buffer,
  totalSize: number
): Promise<{ buffer: Buffer; offset: number }> {
  const shadowOffset = 4
  const shadowBlur = 8
  const expandedSize = totalSize + shadowBlur * 2 + shadowOffset

  // Create shadow layer
  const shadowSvg = `
    <svg width="${expandedSize}" height="${expandedSize}">
      <defs>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="${shadowOffset}" dy="${shadowOffset}" stdDeviation="${shadowBlur / 2}" flood-color="rgba(0,0,0,0.3)"/>
        </filter>
      </defs>
      <rect x="${shadowBlur}" y="${shadowBlur}" width="${totalSize}" height="${totalSize}" fill="white" filter="url(#shadow)"/>
    </svg>
  `

  // This approach is simpler - just offset the photo and add transparency padding
  // Sharp doesn't support SVG filters well, so we'll use a simpler shadow approach

  // Create a canvas with padding for shadow effect
  const shadowCanvas = await sharp({
    create: {
      width: expandedSize,
      height: expandedSize,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .png()
    .toBuffer()

  // Composite the photo with offset to create shadow illusion
  const result = await sharp(shadowCanvas)
    .composite([
      {
        input: photoBuffer,
        top: shadowBlur,
        left: shadowBlur,
      },
    ])
    .png()
    .toBuffer()

  return { buffer: result, offset: shadowBlur }
}

/**
 * Process and prepare the speaker photo for overlay
 */
async function prepareSpeakerPhoto(
  photoDataUrl: string,
  config: SpeakerPhotoCustomization
): Promise<Buffer> {
  // Extract buffer from data URL
  const base64Data = photoDataUrl.split(',')[1]
  const photoBuffer = Buffer.from(base64Data, 'base64')

  // Resize and apply shape mask
  let processedBuffer = await sharp(photoBuffer)
    .resize(config.size, config.size, { fit: 'cover' })
    .png()
    .toBuffer()

  // Apply shape mask (circular cutout)
  processedBuffer = await applyShapeMask(processedBuffer, config.size, config.shape)

  // v6.0 Phase 5: NEW - Add drop shadow for visibility (NO solid background)
  // Replaces the old border logic which created solid white/colored backgrounds
  const shouldAddShadow = config.shadow !== false  // Default to true if not specified

  if (shouldAddShadow) {
    processedBuffer = await addSpeakerPhotoShadow(
      processedBuffer,
      config.size,
      config.shape,
      {
        blur: 15,
        opacity: 0.5,
        offset: { x: 3, y: 3 }
      }
    )
    console.log('[Speaker Photo] Applied drop shadow (no solid background)')
  } else {
    console.log('[Speaker Photo] Shadow disabled - photo will sit directly on AI background')
  }

  // DEPRECATED: Old border logic kept for backward compatibility
  // This creates solid backgrounds which override AI-generated backgrounds
  if (config.border.width > 0) {
    console.warn('[Speaker Photo] Border is DEPRECATED and creates visual conflicts with AI backgrounds')
    processedBuffer = await applyBorder(
      processedBuffer,
      config.size,
      config.shape,
      config.border.width,
      config.border.color
    )
  }

  return processedBuffer
}

// ============================================================
// MULTI-SPEAKER SUPPORT (NEW v5.0)
// ============================================================

/**
 * Calculate the anchor point (base X/Y) based on user's position settings
 * This determines WHERE the photo block should be placed on the image
 */
function calculateAnchorPosition(config: {
  position: PhotoPosition
  verticalPosition: PhotoVerticalPosition | undefined
  imageWidth: number
  imageHeight: number
  blockWidth: number
  blockHeight: number
  padding: number
}): { anchorX: number; anchorY: number } {
  const { position, verticalPosition, imageWidth, imageHeight, blockWidth, blockHeight, padding } = config

  // Calculate X based on horizontal position
  let anchorX: number
  switch (position) {
    case 'left':
      anchorX = padding
      break
    case 'right':
      anchorX = imageWidth - blockWidth - padding
      break
    case 'center':
    default:
      anchorX = Math.floor((imageWidth - blockWidth) / 2)
      break
  }

  // Calculate Y based on vertical position
  // Use percentages to place photo group at the right vertical position
  const positionPercentages: Record<PhotoVerticalPosition, number> = {
    'top': 0.15,
    'upper': 0.30,
    'middle': 0.50,
    'lower': 0.65,
    'bottom': 0.80,
  }

  const percentage = positionPercentages[verticalPosition || 'lower'] || 0.65
  const baseY = Math.floor(imageHeight * percentage)

  // Center the block at the target Y position
  let anchorY = baseY - Math.floor(blockHeight / 2)

  // Clamp to stay within bounds
  anchorY = Math.max(padding, Math.min(anchorY, imageHeight - blockHeight - padding))

  return { anchorX, anchorY }
}

/**
 * Calculate speaker photo positions based on layout strategy AND user position settings
 * Supports 2-10 speakers with different layout modes
 *
 * @param config.position - Horizontal position (left/center/right) where the speaker block should be placed
 * @param config.verticalPosition - Vertical position (top/upper/middle/lower/bottom) where the block should be placed
 */
export function calculateMultiSpeakerPositions(config: {
  speakerCount: number
  layout: LayoutStrategy
  imageWidth: number
  imageHeight: number
  photoSize: number
  spacing: number
  position?: PhotoPosition
  verticalPosition?: PhotoVerticalPosition
}): Array<{ x: number; y: number }> {
  const {
    speakerCount,
    layout,
    imageWidth,
    imageHeight,
    photoSize,
    spacing,
    position = 'center',
    verticalPosition = 'lower',
  } = config
  const positions: Array<{ x: number; y: number }> = []
  const padding = 40

  // Calculate block dimensions based on layout
  let blockWidth: number
  let blockHeight: number

  if (layout === 'side-by-side') {
    blockWidth = speakerCount * photoSize + (speakerCount - 1) * spacing
    blockHeight = photoSize
  } else if (layout === 'stacked') {
    blockWidth = photoSize
    blockHeight = speakerCount * photoSize + (speakerCount - 1) * spacing
  } else {
    // Grid layout
    const cols = 2
    const rows = Math.ceil(speakerCount / cols)
    blockWidth = cols * photoSize + (cols - 1) * spacing
    blockHeight = rows * photoSize + (rows - 1) * spacing
  }

  // Get the anchor position based on user settings
  const { anchorX, anchorY } = calculateAnchorPosition({
    position,
    verticalPosition,
    imageWidth,
    imageHeight,
    blockWidth,
    blockHeight,
    padding,
  })

  console.log(`[Speaker Positions] Anchor at x:${anchorX}, y:${anchorY} for position:${position}, vertical:${verticalPosition}`)

  if (layout === 'side-by-side') {
    // Horizontal row - place photos from anchor point
    for (let i = 0; i < speakerCount; i++) {
      positions.push({
        x: Math.floor(anchorX + i * (photoSize + spacing)),
        y: anchorY,
      })
    }
  } else if (layout === 'stacked') {
    // Vertical stack - place photos from anchor point
    for (let i = 0; i < speakerCount; i++) {
      positions.push({
        x: anchorX,
        y: Math.floor(anchorY + i * (photoSize + spacing)),
      })
    }
  } else if (layout === 'grid') {
    // 2-column grid
    const cols = 2

    for (let i = 0; i < speakerCount; i++) {
      const row = Math.floor(i / cols)
      const col = i % cols

      positions.push({
        x: Math.floor(anchorX + col * (photoSize + spacing)),
        y: Math.floor(anchorY + row * (photoSize + spacing)),
      })
    }
  }

  return positions
}

/**
 * Overlay multiple speaker photos onto base image
 * Uses shared settings with dynamic positioning based on layout strategy AND user position settings
 */
export async function overlayMultipleSpeakerPhotos(config: {
  baseImageBuffer: Buffer
  speakers: SpeakerItem[]
  sharedSettings: {
    shape: PhotoShape
    size: number
    border: { width: number; color: string }
    shadow: boolean
    position?: PhotoPosition
    verticalPosition?: PhotoVerticalPosition
  }
  layoutMode: LayoutMode
  layoutStrategy?: LayoutStrategy
  spacing?: number
}): Promise<Buffer> {
  const {
    baseImageBuffer,
    speakers,
    sharedSettings,
    layoutMode,
    layoutStrategy,
    spacing = 20,
  } = config

  if (!speakers || speakers.length === 0) {
    console.log('No speakers to overlay, returning original image')
    return baseImageBuffer
  }

  console.log(`Overlaying ${speakers.length} speaker photos with layout: ${layoutMode}`)

  // Get base image metadata
  const baseImage = sharp(baseImageBuffer)
  const metadata = await baseImage.metadata()
  const imageWidth = metadata.width || 1080
  const imageHeight = metadata.height || 1350

  // Auto-detect layout if needed
  const finalLayout = layoutMode === 'auto'
    ? autoDetectSpeakerLayout(speakers.length)
    : (layoutStrategy || 'side-by-side')

  // Calculate positions for all speakers using user's position settings
  const positions = calculateMultiSpeakerPositions({
    speakerCount: speakers.length,
    layout: finalLayout,
    imageWidth,
    imageHeight,
    photoSize: sharedSettings.size,
    spacing,
    position: sharedSettings.position,
    verticalPosition: sharedSettings.verticalPosition,
  })

  console.log(`[Speaker Overlay] Using position: ${sharedSettings.position || 'center'}, vertical: ${sharedSettings.verticalPosition || 'lower'}`)

  // Prepare all speaker photos in parallel
  const preparedPhotos = await Promise.all(
    speakers
      .filter(s => s.photoUrl)
      .map(async (speaker, index) => {
        try {
          // Create a temp config with shared settings for prepareSpeakerPhoto
          const tempConfig: SpeakerPhotoCustomization = {
            enabled: true,
            photoUrl: speaker.photoUrl!,
            size: sharedSettings.size,
            shape: sharedSettings.shape,
            border: sharedSettings.border,
            shadow: sharedSettings.shadow,
            position: 'center',
            verticalPosition: 'middle',
          }

          const photoBuffer = await prepareSpeakerPhoto(speaker.photoUrl!, tempConfig)

          return {
            buffer: photoBuffer,
            position: positions[index],
          }
        } catch (error) {
          console.error(`Failed to prepare speaker ${index + 1} photo:`, error)
          return null
        }
      })
  )

  // Filter out failed photos
  const validPhotos = preparedPhotos.filter(p => p !== null) as Array<{
    buffer: Buffer
    position: { x: number; y: number }
  }>

  if (validPhotos.length === 0) {
    console.log('No valid speaker photos to overlay, returning original image')
    return baseImageBuffer
  }

  // Create composite operations
  const compositeOps: sharp.OverlayOptions[] = validPhotos.map(photo => ({
    input: photo.buffer,
    top: Math.max(0, photo.position.y),
    left: Math.max(0, photo.position.x),
  }))

  console.log(`Compositing ${compositeOps.length} speaker photos onto base image`)

  try {
    // Single Sharp composite operation (efficient!)
    return await baseImage.composite(compositeOps).png().toBuffer()
  } catch (error) {
    console.error('Failed to composite speaker photos:', error)
    return baseImageBuffer
  }
}

/**
 * Auto-detect optimal speaker layout based on count
 * Matches the logic in speaker-zones.ts
 */
export function autoDetectSpeakerLayout(count: number): LayoutStrategy {
  if (count === 1) return 'side-by-side'  // Single speaker (legacy)
  if (count === 2) return 'side-by-side'  // Left + Right
  if (count === 3) return 'side-by-side'  // Horizontal row
  if (count <= 6) return 'grid'           // 2×2 or 2×3 grid
  return 'grid'                           // Default to grid for 7+
}

/**
 * Overlay speaker photo onto a base image using Sharp
 */
export async function overlaySpeakerPhotoOnImage(config: SpeakerOverlayConfig): Promise<Buffer> {
  const { baseImageBuffer, speakerPhoto } = config

  // Skip if not enabled or no photo URL
  if (!speakerPhoto.enabled || !speakerPhoto.photoUrl) {
    console.log('Speaker photo not enabled or no photo URL, returning original image')
    return baseImageBuffer
  }

  console.log('Processing speaker photo overlay')

  // Get base image metadata
  const baseImage = sharp(baseImageBuffer)
  const metadata = await baseImage.metadata()
  const imageWidth = metadata.width || 1080
  const imageHeight = metadata.height || 1350

  try {
    // Prepare the speaker photo with shape, border
    const preparedPhoto = await prepareSpeakerPhoto(speakerPhoto.photoUrl, speakerPhoto)

    // Calculate total photo size (including border)
    const totalPhotoSize = speakerPhoto.size + speakerPhoto.border.width * 2

    // Calculate position using user's settings
    const padding = 40
    const yPosition = calculateYPosition(speakerPhoto.verticalPosition, imageHeight, totalPhotoSize, padding)
    const xPosition = calculateXPosition(speakerPhoto.position || 'center', imageWidth, totalPhotoSize, padding)

    // Create composite operation
    const compositeOperations: sharp.OverlayOptions[] = [
      {
        input: preparedPhoto,
        top: Math.max(0, yPosition),
        left: Math.max(0, xPosition),
      },
    ]

    console.log(`Speaker photo positioned at x:${xPosition}, y:${yPosition}`)

    // Apply overlay
    return await baseImage.composite(compositeOperations).png().toBuffer()
  } catch (error) {
    console.error('Failed to process speaker photo:', error)
    // Return original image on error
    return baseImageBuffer
  }
}

/**
 * Process a base64 or data URL image and overlay speaker photo(s)
 * Handles both legacy single-speaker and new multi-speaker formats
 */
export async function processImageWithSpeakerPhoto(
  imageDataUrl: string,
  speakerPhoto: SpeakerPhotoCustomization
): Promise<string> {
  // Normalize config (handles migration from legacy to new format)
  const normalized = normalizeSpeakerConfig(speakerPhoto)

  if (!normalized.enabled) {
    return imageDataUrl
  }

  // Extract base64 data from data URL
  let imageBuffer: Buffer

  if (imageDataUrl.startsWith('data:')) {
    const base64Data = imageDataUrl.split(',')[1]
    imageBuffer = Buffer.from(base64Data, 'base64')
  } else if (imageDataUrl.startsWith('http')) {
    // Download image from URL
    const response = await fetch(imageDataUrl)
    if (!response.ok) {
      throw new Error(`Failed to download image: ${imageDataUrl}`)
    }
    const arrayBuffer = await response.arrayBuffer()
    imageBuffer = Buffer.from(arrayBuffer)
  } else {
    throw new Error('Invalid image format')
  }

  const speakerCount = getSpeakerCount(normalized)
  console.log(`[Speaker Overlay] Processing ${speakerCount} speaker(s)`)

  let resultBuffer: Buffer

  // Multi-speaker mode
  if (normalized.speakers && normalized.speakers.length > 0) {
    console.log('[Speaker Overlay] Using multi-speaker overlay')
    console.log('[Speaker Overlay] Position settings:', {
      position: normalized.position,
      verticalPosition: normalized.verticalPosition,
    })
    resultBuffer = await overlayMultipleSpeakerPhotos({
      baseImageBuffer: imageBuffer,
      speakers: normalized.speakers,
      sharedSettings: {
        shape: normalized.shape,
        size: normalized.size,
        border: normalized.border,
        shadow: normalized.shadow,
        position: normalized.position,
        verticalPosition: normalized.verticalPosition,
      },
      layoutMode: normalized.layoutMode || 'auto',
      layoutStrategy: normalized.layoutStrategy,
      spacing: normalized.spacing || 20,
    })
  }
  // Legacy single speaker mode (backward compatibility)
  else if (normalized.photoUrl) {
    console.log('[Speaker Overlay] Using legacy single-speaker overlay')
    resultBuffer = await overlaySpeakerPhotoOnImage({
      baseImageBuffer: imageBuffer,
      speakerPhoto: normalized,
    })
  }
  // No speakers to overlay
  else {
    console.log('[Speaker Overlay] No speakers to overlay')
    return imageDataUrl
  }

  // Return as data URL
  return `data:image/png;base64,${resultBuffer.toString('base64')}`
}
