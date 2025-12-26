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
 * Apply border to a shaped photo
 */
async function applyBorder(
  photoBuffer: Buffer,
  size: number,
  shape: PhotoShape,
  borderWidth: number,
  borderColor: string
): Promise<Buffer> {
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

  // Apply shape mask
  processedBuffer = await applyShapeMask(processedBuffer, config.size, config.shape)

  // Apply border if specified
  if (config.border.width > 0) {
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
 * Calculate speaker photo positions based on layout strategy
 * Supports 2-10 speakers with different layout modes
 */
export function calculateMultiSpeakerPositions(config: {
  speakerCount: number
  layout: LayoutStrategy
  imageWidth: number
  imageHeight: number
  photoSize: number
  spacing: number
}): Array<{ x: number; y: number }> {
  const { speakerCount, layout, imageWidth, imageHeight, photoSize, spacing } = config
  const positions: Array<{ x: number; y: number }> = []
  const padding = 40

  if (layout === 'side-by-side') {
    // Horizontal row - works for 2-3 speakers
    const totalWidth = speakerCount * photoSize + (speakerCount - 1) * spacing
    const startX = Math.max(padding, (imageWidth - totalWidth) / 2)
    const centerY = Math.floor(imageHeight / 2 - photoSize / 2)

    for (let i = 0; i < speakerCount; i++) {
      positions.push({
        x: Math.floor(startX + i * (photoSize + spacing)),
        y: centerY,
      })
    }
  } else if (layout === 'stacked') {
    // Vertical stack - works for 2-4 speakers
    const totalHeight = speakerCount * photoSize + (speakerCount - 1) * spacing
    const centerX = Math.floor(imageWidth / 2 - photoSize / 2)
    const startY = Math.max(padding, (imageHeight - totalHeight) / 2)

    for (let i = 0; i < speakerCount; i++) {
      positions.push({
        x: centerX,
        y: Math.floor(startY + i * (photoSize + spacing)),
      })
    }
  } else if (layout === 'grid') {
    // 2-column grid - works for 4-10 speakers
    const cols = 2
    const rows = Math.ceil(speakerCount / cols)

    const gridWidth = cols * photoSize + (cols - 1) * spacing
    const gridHeight = rows * photoSize + (rows - 1) * spacing

    const startX = Math.max(padding, (imageWidth - gridWidth) / 2)
    const startY = Math.max(padding, (imageHeight - gridHeight) / 2)

    for (let i = 0; i < speakerCount; i++) {
      const row = Math.floor(i / cols)
      const col = i % cols

      positions.push({
        x: Math.floor(startX + col * (photoSize + spacing)),
        y: Math.floor(startY + row * (photoSize + spacing)),
      })
    }
  }

  return positions
}

/**
 * Overlay multiple speaker photos onto base image
 * Uses shared settings with dynamic positioning based on layout strategy
 */
export async function overlayMultipleSpeakerPhotos(config: {
  baseImageBuffer: Buffer
  speakers: SpeakerItem[]
  sharedSettings: {
    shape: PhotoShape
    size: number
    border: { width: number; color: string }
    shadow: boolean
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

  // Calculate positions for all speakers
  const positions = calculateMultiSpeakerPositions({
    speakerCount: speakers.length,
    layout: finalLayout,
    imageWidth,
    imageHeight,
    photoSize: sharedSettings.size,
    spacing,
  })

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
    resultBuffer = await overlayMultipleSpeakerPhotos({
      baseImageBuffer: imageBuffer,
      speakers: normalized.speakers,
      sharedSettings: {
        shape: normalized.shape,
        size: normalized.size,
        border: normalized.border,
        shadow: normalized.shadow,
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
