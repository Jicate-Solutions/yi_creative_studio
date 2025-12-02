import sharp from 'sharp'
import type { SpeakerPhotoCustomization, PhotoPosition, PhotoShape, PhotoVerticalPosition } from '@/lib/config/design-constants'

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
    const xPosition = calculateXPosition(speakerPhoto.position, imageWidth, totalPhotoSize, padding)

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
 * Process a base64 or data URL image and overlay speaker photo
 */
export async function processImageWithSpeakerPhoto(
  imageDataUrl: string,
  speakerPhoto: SpeakerPhotoCustomization
): Promise<string> {
  // Skip if not enabled or no photo
  if (!speakerPhoto.enabled || !speakerPhoto.photoUrl) {
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

  // Overlay speaker photo
  const resultBuffer = await overlaySpeakerPhotoOnImage({
    baseImageBuffer: imageBuffer,
    speakerPhoto,
  })

  // Return as data URL
  return `data:image/png;base64,${resultBuffer.toString('base64')}`
}
