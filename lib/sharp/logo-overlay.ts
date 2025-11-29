import sharp from 'sharp'

// Logo position grid (9 positions)
export type LogoPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'middle-left'
  | 'middle-center'
  | 'middle-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'

interface LogoPlacement {
  logoId: string
  position: LogoPosition
  logo?: {
    file_url: string
  }
}

interface OverlayConfig {
  baseImageBuffer: Buffer
  logosPlacements: LogoPlacement[]
  logoSize?: number // Default logo size in pixels
  padding?: number // Padding from edges
}

/**
 * Calculate the x,y position for a logo based on the grid position
 */
function calculatePosition(
  position: LogoPosition,
  imageWidth: number,
  imageHeight: number,
  logoSize: number,
  padding: number
): { x: number; y: number } {
  const positions: Record<LogoPosition, { x: number; y: number }> = {
    'top-left': { x: padding, y: padding },
    'top-center': { x: Math.floor((imageWidth - logoSize) / 2), y: padding },
    'top-right': { x: imageWidth - logoSize - padding, y: padding },
    'middle-left': { x: padding, y: Math.floor((imageHeight - logoSize) / 2) },
    'middle-center': {
      x: Math.floor((imageWidth - logoSize) / 2),
      y: Math.floor((imageHeight - logoSize) / 2),
    },
    'middle-right': {
      x: imageWidth - logoSize - padding,
      y: Math.floor((imageHeight - logoSize) / 2),
    },
    'bottom-left': { x: padding, y: imageHeight - logoSize - padding },
    'bottom-center': {
      x: Math.floor((imageWidth - logoSize) / 2),
      y: imageHeight - logoSize - padding,
    },
    'bottom-right': {
      x: imageWidth - logoSize - padding,
      y: imageHeight - logoSize - padding,
    },
  }

  return positions[position]
}

/**
 * Download an image from a URL and return it as a Buffer
 */
async function downloadImage(url: string): Promise<Buffer> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to download image: ${url}`)
  }
  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

/**
 * Overlay logos onto a base image using Sharp
 */
export async function overlayLogosOnImage(config: OverlayConfig): Promise<Buffer> {
  const { baseImageBuffer, logosPlacements, logoSize = 80, padding = 20 } = config

  // Get base image metadata
  const baseImage = sharp(baseImageBuffer)
  const metadata = await baseImage.metadata()
  const imageWidth = metadata.width || 1080
  const imageHeight = metadata.height || 1350

  // Prepare composite operations
  const compositeOperations: sharp.OverlayOptions[] = []

  for (const placement of logosPlacements) {
    if (!placement.logo?.file_url) continue

    try {
      // Download logo image
      const logoBuffer = await downloadImage(placement.logo.file_url)

      // Resize logo while maintaining aspect ratio
      const resizedLogo = await sharp(logoBuffer)
        .resize(logoSize, logoSize, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .png() // Ensure PNG format for transparency
        .toBuffer()

      // Calculate position
      const { x, y } = calculatePosition(
        placement.position,
        imageWidth,
        imageHeight,
        logoSize,
        padding
      )

      compositeOperations.push({
        input: resizedLogo,
        top: Math.max(0, y),
        left: Math.max(0, x),
      })
    } catch (error) {
      console.error(`Failed to process logo ${placement.logoId}:`, error)
      // Continue with other logos if one fails
    }
  }

  // Apply all logo overlays
  if (compositeOperations.length > 0) {
    return await baseImage.composite(compositeOperations).png().toBuffer()
  }

  // Return original image if no logos to overlay
  return await baseImage.png().toBuffer()
}

/**
 * Process a base64 or data URL image and overlay logos
 */
export async function processImageWithLogos(
  imageDataUrl: string,
  logosPlacements: LogoPlacement[]
): Promise<string> {
  // Extract base64 data from data URL
  let imageBuffer: Buffer

  if (imageDataUrl.startsWith('data:')) {
    const base64Data = imageDataUrl.split(',')[1]
    imageBuffer = Buffer.from(base64Data, 'base64')
  } else if (imageDataUrl.startsWith('http')) {
    // Download image from URL
    imageBuffer = await downloadImage(imageDataUrl)
  } else {
    throw new Error('Invalid image format')
  }

  // Overlay logos
  const resultBuffer = await overlayLogosOnImage({
    baseImageBuffer: imageBuffer,
    logosPlacements,
  })

  // Return as data URL
  return `data:image/png;base64,${resultBuffer.toString('base64')}`
}
