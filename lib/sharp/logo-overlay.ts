import sharp from 'sharp'
import {
  type LogoSizePreset,
  getLogoSizePixels,
  DEFAULT_LOGO_SIZE,
  LOGO_PADDING_OPTIONS,
  type LogoPaddingPreset,
  getLogoPaddingPixels,
  type LogoBackgroundShape,
  type LogoBackgroundStyle,
  DEFAULT_LOGO_BACKGROUND,
} from '@/lib/constants/logoConstants'

// Logo position grid (18 positions - 6 columns × 3 rows) - matches lib/config/constants.ts
export type LogoPosition =
  // Header strip (Row 1)
  | 'top-1' | 'top-2' | 'top-3' | 'top-4' | 'top-5' | 'top-6'
  // Second strip (Row 2)
  | 'mid-1' | 'mid-2' | 'mid-3' | 'mid-4' | 'mid-5' | 'mid-6'
  // Footer strip (Row 3)
  | 'bottom-1' | 'bottom-2' | 'bottom-3' | 'bottom-4' | 'bottom-5' | 'bottom-6'

interface LogoPlacement {
  logoId: string
  position: LogoPosition
  size?: LogoSizePreset | number // Size preset or custom pixel value
  logo?: {
    file_url: string
  }
  // Background options
  backgroundShape?: LogoBackgroundShape // 'none' | 'rectangle' | 'rounded' | 'circle'
  backgroundStyle?: LogoBackgroundStyle // { shadow: boolean, border: boolean }
}

// Logo strip mode - unified white strip containing all logos
export type LogoStripRow = 'header' | 'middle' | 'footer'

interface LogoStripModeConfig {
  enabled: boolean
  rows: LogoStripRow[] // Which rows use strip mode
}

interface OverlayConfig {
  baseImageBuffer: Buffer
  logosPlacements: LogoPlacement[]
  defaultLogoSize?: LogoSizePreset | number // Default logo size (preset or pixels)
  padding?: LogoPaddingPreset | number // Padding preset or custom pixels
  backgroundColor?: string // Global background color for all logos (hex)
  stripMode?: LogoStripModeConfig // Unified strip layout mode
}

/**
 * Calculate the x,y position for a logo based on the 6-column grid position
 *
 * Yi Brand Guidelines 2025 - 6-Column × 3-Row Layout:
 * - HEADER STRIP (top row): Brand logos at top with padding (6 positions)
 * - SECOND STRIP (mid row): Vertical logos positioned JUST BELOW header (6 positions)
 * - FOOTER STRIP (bottom row): Sponsor/Partner logos at bottom (6 positions)
 *
 * Total: 18 positions (top-1 to top-6, mid-1 to mid-6, bottom-1 to bottom-6)
 */
function calculatePosition(
  position: LogoPosition,
  imageWidth: number,
  imageHeight: number,
  logoSize: number,
  padding: number
): { x: number; y: number } {
  // Yi Brand Guidelines: Second strip is positioned just below header strip
  const stripGap = Math.floor(padding * 0.5) // Half padding as gap between strips
  const secondStripY = padding + logoSize + stripGap // Just below header logos

  // Calculate column positions for 6-column grid
  // Columns 1 and 6 are at the edges, columns 2-5 are evenly distributed
  const usableWidth = imageWidth - 2 * padding - logoSize // Width available for distributing logos
  const colSpacing = usableWidth / 5 // 5 gaps between 6 columns

  // Get X position for a column (0-indexed: 0=left edge, 5=right edge)
  const getColX = (col: number): number => {
    if (col === 0) return padding // Left edge
    if (col === 5) return imageWidth - logoSize - padding // Right edge
    return Math.floor(padding + col * colSpacing)
  }

  const positions: Record<LogoPosition, { x: number; y: number }> = {
    // HEADER STRIP - Top row (6 positions)
    'top-1': { x: getColX(0), y: padding },
    'top-2': { x: getColX(1), y: padding },
    'top-3': { x: getColX(2), y: padding },
    'top-4': { x: getColX(3), y: padding },
    'top-5': { x: getColX(4), y: padding },
    'top-6': { x: getColX(5), y: padding },

    // SECOND STRIP - Just below header (6 positions)
    'mid-1': { x: getColX(0), y: secondStripY },
    'mid-2': { x: getColX(1), y: secondStripY },
    'mid-3': { x: getColX(2), y: secondStripY },
    'mid-4': { x: getColX(3), y: secondStripY },
    'mid-5': { x: getColX(4), y: secondStripY },
    'mid-6': { x: getColX(5), y: secondStripY },

    // FOOTER STRIP - Bottom row (6 positions)
    'bottom-1': { x: getColX(0), y: imageHeight - logoSize - padding },
    'bottom-2': { x: getColX(1), y: imageHeight - logoSize - padding },
    'bottom-3': { x: getColX(2), y: imageHeight - logoSize - padding },
    'bottom-4': { x: getColX(3), y: imageHeight - logoSize - padding },
    'bottom-5': { x: getColX(4), y: imageHeight - logoSize - padding },
    'bottom-6': { x: getColX(5), y: imageHeight - logoSize - padding },
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
 * Create a logo with a background shape (rectangle, rounded, or circle)
 * Adds colored background (default white) with optional shadow and border
 */
async function createLogoWithBackground(
  logoBuffer: Buffer,
  logoSize: number,
  shape: LogoBackgroundShape,
  style: LogoBackgroundStyle,
  backgroundColor: string = '#FFFFFF'
): Promise<Buffer> {
  // If no background, return original logo
  if (shape === 'none') {
    return logoBuffer
  }

  // Get actual logo dimensions after resize
  const logoMetadata = await sharp(logoBuffer).metadata()
  const logoWidth = logoMetadata.width || logoSize
  const logoHeight = logoMetadata.height || logoSize

  // Calculate background size with padding around logo
  const bgPadding = Math.floor(Math.max(logoWidth, logoHeight) * 0.15) // 15% padding
  const bgSize = Math.max(logoWidth, logoHeight) + bgPadding * 2

  // Shadow offset and blur for drop shadow effect
  const shadowOffset = style.shadow ? 4 : 0
  const shadowBlur = style.shadow ? 8 : 0
  const totalSize = bgSize + shadowOffset + shadowBlur

  // Border width
  const borderWidth = style.border ? 2 : 0

  // Create SVG background with shape
  let backgroundSvg: string
  const fillColor = backgroundColor // Use provided background color
  const borderColor = '#e5e7eb' // gray-200

  // Calculate center position accounting for shadow
  const centerX = totalSize / 2 - shadowOffset / 2
  const centerY = totalSize / 2 - shadowOffset / 2

  if (shape === 'circle') {
    const radius = bgSize / 2 - borderWidth
    backgroundSvg = `
      <svg width="${totalSize}" height="${totalSize}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          ${style.shadow ? `
            <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="${shadowOffset}" dy="${shadowOffset}" stdDeviation="${shadowBlur / 2}" flood-color="rgba(0,0,0,0.15)"/>
            </filter>
          ` : ''}
        </defs>
        <circle
          cx="${centerX}"
          cy="${centerY}"
          r="${radius}"
          fill="${fillColor}"
          ${style.border ? `stroke="${borderColor}" stroke-width="${borderWidth}"` : ''}
          ${style.shadow ? 'filter="url(#shadow)"' : ''}
        />
      </svg>
    `
  } else if (shape === 'rounded') {
    const cornerRadius = Math.floor(bgSize * 0.12) // 12% corner radius
    backgroundSvg = `
      <svg width="${totalSize}" height="${totalSize}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          ${style.shadow ? `
            <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="${shadowOffset}" dy="${shadowOffset}" stdDeviation="${shadowBlur / 2}" flood-color="rgba(0,0,0,0.15)"/>
            </filter>
          ` : ''}
        </defs>
        <rect
          x="${centerX - bgSize / 2 + borderWidth}"
          y="${centerY - bgSize / 2 + borderWidth}"
          width="${bgSize - borderWidth * 2}"
          height="${bgSize - borderWidth * 2}"
          rx="${cornerRadius}"
          ry="${cornerRadius}"
          fill="${fillColor}"
          ${style.border ? `stroke="${borderColor}" stroke-width="${borderWidth}"` : ''}
          ${style.shadow ? 'filter="url(#shadow)"' : ''}
        />
      </svg>
    `
  } else {
    // Rectangle (square)
    backgroundSvg = `
      <svg width="${totalSize}" height="${totalSize}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          ${style.shadow ? `
            <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="${shadowOffset}" dy="${shadowOffset}" stdDeviation="${shadowBlur / 2}" flood-color="rgba(0,0,0,0.15)"/>
            </filter>
          ` : ''}
        </defs>
        <rect
          x="${centerX - bgSize / 2 + borderWidth}"
          y="${centerY - bgSize / 2 + borderWidth}"
          width="${bgSize - borderWidth * 2}"
          height="${bgSize - borderWidth * 2}"
          fill="${fillColor}"
          ${style.border ? `stroke="${borderColor}" stroke-width="${borderWidth}"` : ''}
          ${style.shadow ? 'filter="url(#shadow)"' : ''}
        />
      </svg>
    `
  }

  // Create background from SVG
  const bgBuffer = await sharp(Buffer.from(backgroundSvg)).png().toBuffer()

  // Calculate logo position to center it on background
  const logoLeft = Math.floor((totalSize - logoWidth) / 2 - shadowOffset / 2)
  const logoTop = Math.floor((totalSize - logoHeight) / 2 - shadowOffset / 2)

  // Composite logo onto background
  const result = await sharp(bgBuffer)
    .composite([
      {
        input: logoBuffer,
        top: Math.max(0, logoTop),
        left: Math.max(0, logoLeft),
      },
    ])
    .png()
    .toBuffer()

  return result
}

/**
 * Create a horizontal logo strip with logos positioned at their designated columns
 * The strip is a white (or colored) bar spanning the full image width
 *
 * COLUMN-AWARE POSITIONING:
 * - Strip is divided into 6 equal columns (matching the 6-column grid)
 * - Each logo is placed at the CENTER of its designated column
 * - Multiple logos in the same column are distributed within that column
 * - This respects user's column selection instead of equal spacing
 */
async function createLogoStrip(
  imageWidth: number,
  logos: { buffer: Buffer; width: number; height: number; column: number }[],
  backgroundColor: string,
  stripPadding: number = 20
): Promise<{ stripBuffer: Buffer; stripHeight: number }> {
  if (logos.length === 0) {
    // Return an empty 1px strip if no logos
    const emptyStrip = await sharp({
      create: {
        width: imageWidth,
        height: 1,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 0 },
      },
    }).png().toBuffer()
    return { stripBuffer: emptyStrip, stripHeight: 0 }
  }

  // Calculate strip height based on tallest logo + padding (compact strip)
  const maxLogoHeight = Math.max(...logos.map(l => l.height))
  const stripHeight = maxLogoHeight + stripPadding // Single padding for compact height

  // Column-aware positioning: divide strip into 6 equal columns
  const availableWidth = imageWidth - stripPadding * 2
  const columnWidth = availableWidth / 6

  console.log(`[Strip] Creating column-aware strip: ${imageWidth}x${stripHeight}, ${logos.length} logos, columnWidth: ${columnWidth.toFixed(0)}px`)

  // Parse background color (hex to RGB)
  const bgColor = backgroundColor.startsWith('#') ? backgroundColor.slice(1) : backgroundColor
  const r = parseInt(bgColor.slice(0, 2), 16) || 255
  const g = parseInt(bgColor.slice(2, 4), 16) || 255
  const b = parseInt(bgColor.slice(4, 6), 16) || 255

  // Create the strip background
  const stripBuffer = await sharp({
    create: {
      width: imageWidth,
      height: stripHeight,
      channels: 4,
      background: { r, g, b, alpha: 1 },
    },
  }).png().toBuffer()

  // Group logos by their column
  const logosByColumn: Map<number, typeof logos> = new Map()
  for (const logo of logos) {
    const col = logo.column
    if (!logosByColumn.has(col)) {
      logosByColumn.set(col, [])
    }
    logosByColumn.get(col)!.push(logo)
  }

  console.log(`[Strip] Logos by column: ${Array.from(logosByColumn.entries()).map(([col, l]) => `col${col}:${l.length}`).join(', ')}`)

  // Position each logo at its column center
  const compositeOperations: sharp.OverlayOptions[] = []

  for (const [column, columnLogos] of logosByColumn) {
    // Calculate column center X position (column is 1-indexed)
    const columnCenterX = stripPadding + (column - 0.5) * columnWidth

    if (columnLogos.length === 1) {
      // Single logo: center in column
      const logo = columnLogos[0]
      const y = Math.floor((stripHeight - logo.height) / 2)
      const x = Math.floor(columnCenterX - logo.width / 2)

      compositeOperations.push({
        input: logo.buffer,
        top: y,
        left: Math.max(0, x), // Ensure not negative
      })
    } else {
      // Multiple logos in same column: distribute within column width
      const totalWidth = columnLogos.reduce((sum, l) => sum + l.width, 0)
      const gap = Math.max(5, (columnWidth - totalWidth) / (columnLogos.length + 1))
      let offsetX = columnCenterX - (totalWidth + gap * (columnLogos.length - 1)) / 2

      for (const logo of columnLogos) {
        const y = Math.floor((stripHeight - logo.height) / 2)
        compositeOperations.push({
          input: logo.buffer,
          top: y,
          left: Math.max(0, Math.floor(offsetX)),
        })
        offsetX += logo.width + gap
      }
    }
  }

  // Composite logos onto strip
  const finalStrip = await sharp(stripBuffer)
    .composite(compositeOperations)
    .png()
    .toBuffer()

  return { stripBuffer: finalStrip, stripHeight }
}

/**
 * Map row type to logo positions
 */
function getPositionsForRow(row: LogoStripRow): LogoPosition[] {
  switch (row) {
    case 'header':
      return ['top-1', 'top-2', 'top-3', 'top-4', 'top-5', 'top-6']
    case 'middle':
      return ['mid-1', 'mid-2', 'mid-3', 'mid-4', 'mid-5', 'mid-6']
    case 'footer':
      return ['bottom-1', 'bottom-2', 'bottom-3', 'bottom-4', 'bottom-5', 'bottom-6']
  }
}

/**
 * Get the Y position for a row strip
 */
function getStripYPosition(
  row: LogoStripRow,
  stripHeight: number,
  imageHeight: number,
  padding: number
): number {
  switch (row) {
    case 'header':
      return 0 // Top of image
    case 'middle':
      return Math.floor((imageHeight - stripHeight) / 2) // Center
    case 'footer':
      return imageHeight - stripHeight // Bottom of image
  }
}

/**
 * Overlay logos onto a base image using Sharp
 * Now supports individual logo sizes per placement and strip mode
 */
export async function overlayLogosOnImage(config: OverlayConfig): Promise<Buffer> {
  const { baseImageBuffer, logosPlacements, defaultLogoSize = DEFAULT_LOGO_SIZE, padding = 'normal', backgroundColor = '#FFFFFF', stripMode } = config

  // Convert padding to pixels
  const paddingPixels = typeof padding === 'number' ? padding : getLogoPaddingPixels(padding)

  // Get base image metadata
  const baseImage = sharp(baseImageBuffer)
  const metadata = await baseImage.metadata()
  const imageWidth = metadata.width || 1080
  const imageHeight = metadata.height || 1350

  // ==================================================
  // STRIP MODE: Create unified horizontal strip with ALL logos
  // ==================================================
  // When strip mode is enabled, put ALL logos into a single strip at the
  // first selected row position. This matches user expectation of a unified
  // banner containing all logos, regardless of their individual grid positions.
  if (stripMode?.enabled && stripMode.rows.length > 0) {
    // Use the first selected row for strip placement (usually 'header')
    const primaryRow = stripMode.rows[0]
    console.log(`[Strip Mode] Creating unified strip at ${primaryRow} with ALL ${logosPlacements.length} logos`)

    // Sort logos by position to maintain correct order (Yi at left, CII at right)
    const positionOrder: Record<string, number> = {
      'top-1': 0, 'top-2': 1, 'top-3': 2, 'top-4': 3, 'top-5': 4, 'top-6': 5,
      'mid-1': 6, 'mid-2': 7, 'mid-3': 8, 'mid-4': 9, 'mid-5': 10, 'mid-6': 11,
      'bottom-1': 12, 'bottom-2': 13, 'bottom-3': 14, 'bottom-4': 15, 'bottom-5': 16, 'bottom-6': 17,
    }
    const sortedPlacements = [...logosPlacements].sort((a, b) =>
      (positionOrder[a.position] ?? 99) - (positionOrder[b.position] ?? 99)
    )

    console.log(`[Strip Mode] Logo order: ${sortedPlacements.map(p => `${p.logoId}@${p.position}`).join(', ')}`)

    // Download and resize ALL logos (sorted by position)
    // Include column info for column-aware positioning in createLogoStrip()
    const processedLogos: { buffer: Buffer; width: number; height: number; column: number }[] = []

    for (const placement of sortedPlacements) {
      if (!placement.logo?.file_url) continue

      try {
        const logoBuffer = await downloadImage(placement.logo.file_url)
        const logoSizeValue = placement.size ?? defaultLogoSize
        const logoSizePixels = getLogoSizePixels(logoSizeValue)

        const resizedLogo = await sharp(logoBuffer)
          .resize(logoSizePixels, logoSizePixels, {
            fit: 'inside',
            withoutEnlargement: true,
          })
          .png()
          .toBuffer()

        const logoMetadata = await sharp(resizedLogo).metadata()

        // Extract column number from position (e.g., 'top-3' → 3, 'mid-1' → 1, 'bottom-6' → 6)
        const column = parseInt(placement.position.split('-')[1]) || 1

        processedLogos.push({
          buffer: resizedLogo,
          width: logoMetadata.width || logoSizePixels,
          height: logoMetadata.height || logoSizePixels,
          column, // Pass column for column-aware strip positioning
        })
      } catch (error) {
        console.error(`[Strip Mode] Failed to process logo ${placement.logoId}:`, error)
      }
    }

    if (processedLogos.length === 0) {
      console.log(`[Strip Mode] No logos to process, returning original image`)
      return await baseImage.png().toBuffer()
    }

    // Create the unified strip with ALL logos
    const { stripBuffer, stripHeight } = await createLogoStrip(
      imageWidth,
      processedLogos,
      backgroundColor,
      paddingPixels
    )

    // Calculate Y position for the strip based on selected row
    const stripY = getStripYPosition(primaryRow, stripHeight, imageHeight, paddingPixels)

    console.log(`[Strip Mode] Unified ${primaryRow} strip: ${imageWidth}x${stripHeight} at y=${stripY}, ${processedLogos.length} logos`)

    // Composite strip onto base image and return
    return await baseImage.composite([{
      input: stripBuffer,
      top: stripY,
      left: 0,
    }]).png().toBuffer()
  }

  // ==================================================
  // STANDARD MODE: Individual logo placements
  // ==================================================
  // Prepare composite operations
  const compositeOperations: sharp.OverlayOptions[] = []

  console.log(`Processing ${logosPlacements.length} logo placements`)

  for (const placement of logosPlacements) {
    if (!placement.logo?.file_url) {
      console.log(`Skipping logo ${placement.logoId}: no file_url`)
      continue
    }

    // Get the logo size for this specific placement
    // Use placement's size if specified, otherwise fall back to default
    const logoSizeValue = placement.size ?? defaultLogoSize
    const logoSizePixels = getLogoSizePixels(logoSizeValue)

    // Get background settings (default to no background)
    const backgroundShape = placement.backgroundShape || DEFAULT_LOGO_BACKGROUND.shape
    const backgroundStyle = placement.backgroundStyle || DEFAULT_LOGO_BACKGROUND.style

    console.log(`Processing logo ${placement.logoId} at position ${placement.position} with size ${logoSizePixels}px, background: ${backgroundShape}`)

    try {
      // Download logo image
      const logoBuffer = await downloadImage(placement.logo.file_url)

      // Resize logo while maintaining aspect ratio using individual size
      const resizedLogo = await sharp(logoBuffer)
        .resize(logoSizePixels, logoSizePixels, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .png() // Ensure PNG format for transparency
        .toBuffer()

      // Apply background if specified (using global background color)
      const finalLogo = await createLogoWithBackground(
        resizedLogo,
        logoSizePixels,
        backgroundShape,
        backgroundStyle,
        backgroundColor
      )

      // Get final logo dimensions (may be larger with background)
      const finalMetadata = await sharp(finalLogo).metadata()
      const finalWidth = finalMetadata.width || logoSizePixels
      const finalHeight = finalMetadata.height || logoSizePixels

      // Calculate position using final logo dimensions
      const { x, y } = calculatePosition(
        placement.position,
        imageWidth,
        imageHeight,
        Math.max(finalWidth, finalHeight), // Use the larger dimension for positioning
        paddingPixels
      )

      compositeOperations.push({
        input: finalLogo,
        top: Math.max(0, y),
        left: Math.max(0, x),
      })
    } catch (error) {
      console.error(`Failed to process logo ${placement.logoId}:`, error)
      // Continue with other logos if one fails
    }
  }

  // Apply all logo overlays
  console.log(`Total composite operations: ${compositeOperations.length}`)
  if (compositeOperations.length > 0) {
    return await baseImage.composite(compositeOperations).png().toBuffer()
  }

  // Return original image if no logos to overlay
  console.log('No logos to overlay, returning original image')
  return await baseImage.png().toBuffer()
}

/**
 * Process a base64 or data URL image and overlay logos
 */
export async function processImageWithLogos(
  imageDataUrl: string,
  logosPlacements: LogoPlacement[],
  backgroundColor?: string, // Global background color for all logos
  stripMode?: { enabled: boolean; rows: ('header' | 'middle' | 'footer')[] } // Unified strip layout mode
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

  // Overlay logos with optional background color and strip mode
  const resultBuffer = await overlayLogosOnImage({
    baseImageBuffer: imageBuffer,
    logosPlacements,
    backgroundColor,
    stripMode: stripMode ? { enabled: stripMode.enabled, rows: stripMode.rows as LogoStripRow[] } : undefined,
  })

  // Return as data URL
  return `data:image/png;base64,${resultBuffer.toString('base64')}`
}

/**
 * Resize mode for exact dimension fitting
 * - 'fill': Stretch/distort to exact dimensions (best after AI resize - AI handled composition)
 * - 'cover': Crop to fill (maintains aspect ratio, may lose content)
 * - 'contain': Fit inside with letterboxing (maintains all content, adds bars)
 */
export type ResizeFitMode = 'fill' | 'cover' | 'contain'

/**
 * Resize an image to exact dimensions
 * @param imageDataUrl - Source image as data URL or http URL
 * @param targetWidth - Target width in pixels
 * @param targetHeight - Target height in pixels
 * @param mode - Resize mode: 'fill' (default, stretch), 'cover' (crop), 'contain' (letterbox)
 */
export async function resizeImageToExactDimensions(
  imageDataUrl: string,
  targetWidth: number,
  targetHeight: number,
  mode: ResizeFitMode = 'fill'
): Promise<string> {
  // Extract buffer from data URL or fetch from URL
  let imageBuffer: Buffer

  if (imageDataUrl.startsWith('data:')) {
    const base64Data = imageDataUrl.split(',')[1]
    imageBuffer = Buffer.from(base64Data, 'base64')
  } else if (imageDataUrl.startsWith('http')) {
    imageBuffer = await downloadImage(imageDataUrl)
  } else {
    throw new Error('Invalid image format')
  }

  // Get current dimensions
  const metadata = await sharp(imageBuffer).metadata()
  const currentWidth = metadata.width || targetWidth
  const currentHeight = metadata.height || targetHeight

  console.log(`Resizing image from ${currentWidth}x${currentHeight} to ${targetWidth}x${targetHeight} (mode: ${mode})`)

  // Resize based on mode
  let resizedBuffer: Buffer

  if (mode === 'fill') {
    // Stretch to exact dimensions - best for AI-resized images where AI handled composition
    resizedBuffer = await sharp(imageBuffer)
      .resize(targetWidth, targetHeight, {
        fit: 'fill', // Stretch/distort to exact dimensions
      })
      .png()
      .toBuffer()
  } else if (mode === 'contain') {
    // Fit inside with background - preserves all content
    resizedBuffer = await sharp(imageBuffer)
      .resize(targetWidth, targetHeight, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }, // White background for letterboxing
      })
      .png()
      .toBuffer()
  } else {
    // 'cover' mode - crop to fill (original behavior)
    resizedBuffer = await sharp(imageBuffer)
      .resize(targetWidth, targetHeight, {
        fit: 'cover',
        position: 'center',
      })
      .png()
      .toBuffer()
  }

  return `data:image/png;base64,${resizedBuffer.toString('base64')}`
}
