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
import { type LogoStripShape, DEFAULT_LOGO_STRIP_SHAPE } from '@/lib/config/design-constants'

// Logo position grid (18 positions - 6 columns × 3 rows) - matches lib/config/constants.ts
export type LogoPosition =
  // Header strip (Row 1)
  | 'top-1' | 'top-2' | 'top-3' | 'top-4' | 'top-5' | 'top-6'
  // Second strip (Row 2)
  | 'mid-1' | 'mid-2' | 'mid-3' | 'mid-4' | 'mid-5' | 'mid-6'
  // Footer strip (Row 3)
  | 'bottom-1' | 'bottom-2' | 'bottom-3' | 'bottom-4' | 'bottom-5' | 'bottom-6'

export interface LogoPlacement {
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
  opacity?: number // Strip opacity 0-100 (default: 100 = fully opaque)
  logoBound?: boolean // When true, strip only covers logo area; when false, edge-to-edge
}

/**
 * Convert hex color to rgba with opacity
 */
function hexToRgba(hex: string, opacity: number): string {
  const cleanHex = hex.replace('#', '')
  const r = parseInt(cleanHex.substring(0, 2), 16)
  const g = parseInt(cleanHex.substring(2, 4), 16)
  const b = parseInt(cleanHex.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${opacity / 100})`
}

/**
 * Generate SVG mask for different logo strip shapes
 * Creates a mask that will be applied to the rectangular strip
 */
function generateStripShapeSVG(
  width: number,
  height: number,
  shape: LogoStripShape,
  backgroundColor: string,
  opacity: number = 100 // 0-100
): string {
  // Apply opacity to the background color
  const fillColor = opacity < 100 ? hexToRgba(backgroundColor, opacity) : backgroundColor
  switch (shape) {
    case 'curved': {
      // Smooth wave at top and bottom edges
      const waveDepth = Math.min(height * 0.15, 15) // 15% of height or max 15px
      return `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
          <path d="
            M 0,${waveDepth}
            Q ${width * 0.25},0 ${width * 0.5},${waveDepth}
            T ${width},${waveDepth}
            L ${width},${height - waveDepth}
            Q ${width * 0.75},${height} ${width * 0.5},${height - waveDepth}
            T 0,${height - waveDepth}
            Z
          " fill="${fillColor}"/>
        </svg>
      `
    }

    case 'angled': {
      // Diagonal cut edges (parallelogram)
      const angleOffset = Math.min(height * 0.4, 30) // 40% of height or max 30px
      return `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
          <path d="
            M ${angleOffset},0
            L ${width},0
            L ${width - angleOffset},${height}
            L 0,${height}
            Z
          " fill="${fillColor}"/>
        </svg>
      `
    }

    case 'rounded': {
      // Rounded rectangle with corner radius
      const cornerRadius = Math.min(height * 0.25, 20) // 25% of height or max 20px
      return `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
          <rect
            x="0"
            y="0"
            width="${width}"
            height="${height}"
            rx="${cornerRadius}"
            ry="${cornerRadius}"
            fill="${fillColor}"
          />
        </svg>
      `
    }

    case 'tapered': {
      // Trapezoid shape (wider at bottom)
      const taperAmount = Math.min(width * 0.05, 40) // 5% of width or max 40px
      return `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
          <path d="
            M ${taperAmount},0
            L ${width - taperAmount},0
            L ${width},${height}
            L 0,${height}
            Z
          " fill="${fillColor}"/>
        </svg>
      `
    }

    case 'rectangle':
    default: {
      // Standard rectangle (no shape transformation)
      return `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
          <rect
            x="0"
            y="0"
            width="${width}"
            height="${height}"
            fill="${fillColor}"
          />
        </svg>
      `
    }
  }
}

interface OverlayConfig {
  baseImageBuffer: Buffer
  logosPlacements: LogoPlacement[]
  defaultLogoSize?: LogoSizePreset | number // Default logo size (preset or pixels)
  padding?: LogoPaddingPreset | number // Padding preset or custom pixels
  backgroundColor?: string // Global background color for all logos (hex)
  stripMode?: LogoStripModeConfig // Unified strip layout mode
  stripShape?: LogoStripShape // NEW v3.11: Shape of the logo strip (curved, angled, rounded, tapered)
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
 * v6.0 Phase 5: Adds drop shadow to a logo buffer for visibility on any background
 * Enables logos to be placed directly on AI-generated backgrounds without strip background
 *
 * @param logoBuffer - Logo image buffer
 * @param shadowBlur - Shadow blur radius in pixels (default: 15)
 * @param shadowOpacity - Shadow opacity 0-1 (default: 0.4)
 * @param shadowOffset - Shadow offset {x, y} (default: {x: 2, y: 2})
 * @returns Buffer with logo and drop shadow on transparent background
 */
async function addDropShadowToLogo(
  logoBuffer: Buffer,
  shadowBlur: number = 15,
  shadowOpacity: number = 0.4,
  shadowOffset: { x: number; y: number } = { x: 2, y: 2 }
): Promise<Buffer> {
  const logoSharp = sharp(logoBuffer)
  const metadata = await logoSharp.metadata()

  if (!metadata.width || !metadata.height) {
    console.warn('[Drop Shadow] Could not read logo metadata, returning original buffer')
    return logoBuffer  // Fallback if metadata unavailable
  }

  const shadowPadding = shadowBlur + Math.max(Math.abs(shadowOffset.x), Math.abs(shadowOffset.y))
  const canvasWidth = metadata.width + shadowPadding * 2
  const canvasHeight = metadata.height + shadowPadding * 2

  // Create shadow using SVG filter
  const shadowSvg = `
    <svg width="${canvasWidth}" height="${canvasHeight}">
      <defs>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="${shadowBlur}" />
          <feOffset dx="${shadowOffset.x}" dy="${shadowOffset.y}" result="offsetblur" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="${shadowOpacity}" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect width="${canvasWidth}" height="${canvasHeight}" fill="transparent" />
    </svg>
  `

  try {
    // Create canvas with shadow effect
    const shadowBuffer = await sharp(Buffer.from(shadowSvg))
      .png()
      .toBuffer()

    // Composite logo onto canvas with shadow padding
    const result = await sharp({
      create: {
        width: canvasWidth,
        height: canvasHeight,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    })
    .composite([
      {
        input: logoBuffer,
        top: shadowPadding,
        left: shadowPadding,
      }
    ])
    // Apply blur to create soft shadow effect
    .blur(shadowBlur * 0.5)
    .png()
    .toBuffer()

    console.log(`[Drop Shadow] Added shadow to logo (${metadata.width}x${metadata.height} → ${canvasWidth}x${canvasHeight})`)
    return result
  } catch (error) {
    console.error('[Drop Shadow] Error creating shadow:', error)
    return logoBuffer  // Fallback to original
  }
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
 *
 * LOGO-BOUND MODE (v5.4):
 * - When enabled, strip only spans from first logo to last logo (plus padding)
 * - When disabled, strip spans full image width (edge-to-edge)
 *
 * v6.0 Phase 5: CONDITIONAL BACKGROUND RENDERING:
 * - When renderBackground is false, returns null (no strip background)
 * - Logos will be placed directly on AI-generated background with drop shadows
 * - User controls via logoStripMode.enabled flag
 */
async function createLogoStrip(
  imageWidth: number,
  logos: { buffer: Buffer; width: number; height: number; column: number; logoId?: string }[],
  backgroundColor: string,
  stripPadding: number = 15, // Reduced from 20px to give more horizontal space for 6 logos
  stripShape: LogoStripShape = DEFAULT_LOGO_STRIP_SHAPE, // NEW v3.11: Strip shape
  stripOpacity: number = 100, // NEW v5.4: Strip opacity 0-100
  logoBound: boolean = false, // NEW v5.4: When true, strip only covers logo area
  renderBackground: boolean = true // NEW v6.0 Phase 5: When false, skip background rendering
): Promise<{ stripBuffer: Buffer; stripHeight: number; stripLeft: number } | null> {
  // v6.0 Phase 5: Skip background rendering if disabled
  if (!renderBackground) {
    console.log('[Logo Strip] Background rendering DISABLED - logos will be placed directly on AI background with drop shadows')
    return null
  }

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
    return { stripBuffer: emptyStrip, stripHeight: 0, stripLeft: 0 }
  }

  // Calculate strip height based on tallest logo + padding (compact)
  // v5.3: Ultra-tight strip height - just logo height + minimal padding (2px top/bottom)
  const maxLogoHeight = Math.max(...logos.map(l => l.height))
  const stripHeight = maxLogoHeight + 4 // v5.3: Just 2px padding on each side

  // --- NEW v5.4: LOGO-BOUND STRIP CALCULATION ---
  // Calculate the extent of logos for logo-bound mode
  let stripLeft = 0 // Left offset of the strip (0 for edge-to-edge)
  let stripWidth = imageWidth // Full width by default

  if (logoBound && logos.length > 0) {
    // Find the leftmost and rightmost logo positions
    const minColumn = Math.min(...logos.map(l => l.column))
    const maxColumn = Math.max(...logos.map(l => l.column))

    // Calculate column positions
    const colWidth = (imageWidth - stripPadding * 2) / 6
    const logoAreaPadding = 30 // Extra padding around logos

    // Calculate strip bounds based on logo columns
    stripLeft = Math.max(0, stripPadding + (minColumn - 1) * colWidth - logoAreaPadding)
    const stripRight = Math.min(imageWidth, stripPadding + maxColumn * colWidth + logoAreaPadding)
    stripWidth = stripRight - stripLeft

    console.log(`[Strip] Logo-bound mode: columns ${minColumn}-${maxColumn}, strip from ${stripLeft}px to ${stripRight}px (width: ${stripWidth}px)`)
  }

  // Column-aware positioning: divide strip into 6 equal columns
  const availableWidth = stripWidth - stripPadding * 2

  // --- NEW v4.8: SHAPE SAFE ZONES ---
  // Angled and Curved shapes cut into the strip at the edges.
  // We must reserve space so logos don't sit on the transparent cut-out.
  let edgeSafeMargin = 0
  if (stripShape === 'angled') edgeSafeMargin = 40 // Matches angleOffset roughly
  if (stripShape === 'curved') edgeSafeMargin = 20 // Matches waveDepth roughly

  // Effective width available for logos
  const effectiveWidth = availableWidth - (edgeSafeMargin * 2)
  const startX = stripPadding + edgeSafeMargin

  console.log(`[Strip] Creating column-aware strip: ${stripWidth}x${stripHeight}, ${logos.length} logos, opacity: ${stripOpacity}%`)
  console.log(`[Strip] Shape: ${stripShape}, Edge Margin: ${edgeSafeMargin}px, Effective Width: ${effectiveWidth}px, Logo-bound: ${logoBound}`)

  // Generate shaped strip background using SVG with opacity support
  const shapeSVG = generateStripShapeSVG(stripWidth, stripHeight, stripShape, backgroundColor, stripOpacity)
  const stripBuffer = await sharp(Buffer.from(shapeSVG))
    .png()
    .toBuffer()

  /**
   * Redistribute logo columns to use full strip width
   * Maps user-specified columns to evenly-spaced virtual columns
   */
  function redistributeColumnsForFullWidth(
    logos: Array<{ column: number; [key: string]: any }>,
    totalColumns: number = 6
  ): Array<{ column: number; virtualColumn: number; [key: string]: any }> {
    // Extract unique columns used
    const usedColumns = Array.from(new Set(logos.map(l => l.column))).sort((a, b) => a - b)

    // If already using full width (columns 1 and 6), no redistribution needed
    if (usedColumns.includes(1) && usedColumns.includes(totalColumns)) {
      return logos.map(l => ({ ...l, virtualColumn: l.column }))
    }

    // Calculate even distribution
    const logoCount = usedColumns.length
    const virtualColumns: number[] = []

    if (logoCount === 1) {
      // Single logo: center it
      virtualColumns.push(3)
    } else if (logoCount === 2) {
      // Two logos: use edges
      virtualColumns.push(1, 6)
    } else if (logoCount === 3) {
      // Three logos: left, center-right, right
      virtualColumns.push(1, 4, 6)
    } else if (logoCount === 4) {
      // Four logos: evenly distributed
      virtualColumns.push(1, 2, 5, 6)
    } else if (logoCount === 5) {
      // Five logos
      virtualColumns.push(1, 2, 3, 5, 6)
    } else {
      // Six or more: use all columns
      for (let i = 1; i <= Math.min(logoCount, totalColumns); i++) {
        virtualColumns.push(i)
      }
    }

    // Create mapping: original column → virtual column
    const columnMap = new Map<number, number>()
    usedColumns.forEach((origCol, idx) => {
      columnMap.set(origCol, virtualColumns[idx])
    })

    // Apply mapping to logos
    return logos.map(logo => ({
      ...logo,
      virtualColumn: columnMap.get(logo.column) || logo.column
    }))
  }

  // Step 1: Redistribute columns for full-width spacing
  const redistributedLogos = redistributeColumnsForFullWidth(logos, 6)

  // Log redistribution for debugging
  console.log('[Logo Overlay] ═══ COLUMN REDISTRIBUTION ═══')
  console.log('[Logo Overlay] Original Columns:', logos.map(l => l.column).join(', '))
  console.log('[Logo Overlay] Virtual Columns:', redistributedLogos.map(l => l.virtualColumn).join(', '))
  console.log('[Logo Overlay] Distribution Pattern:',
    redistributedLogos.length === 3 ? '[1, 4, 6] - Left, Center-Right, Right' :
    redistributedLogos.length === 2 ? '[1, 6] - Edges' :
    redistributedLogos.length === 1 ? '[3] - Center' :
    redistributedLogos.length === 4 ? '[1, 2, 5, 6] - Evenly Distributed' :
    'Custom')

  // Step 2: Group by VIRTUAL columns (not original columns)
  const logosByColumn: Map<number, typeof redistributedLogos> = new Map()
  for (const logo of redistributedLogos) {
    const col = logo.virtualColumn  // Use virtual column!
    if (!logosByColumn.has(col)) {
      logosByColumn.set(col, [])
    }
    logosByColumn.get(col)!.push(logo)
  }

  // --- NEW v4.8: AUTO-SCALING LOGIC ---
  // 1. Calculate the TOTAL REQUIRED WIDTH for all logos + gaps
  const sortedEntries = Array.from(logosByColumn.entries()).sort((a, b) => a[0] - b[0])

  const activeGroups = sortedEntries.map(([col, groupLogos]) => ({
    col,
    logos: groupLogos,
    // Original width of this group
    originalWidth: groupLogos.reduce((sum, l) => sum + l.width, 0) + (Math.max(0, groupLogos.length - 1) * 10)
  }))

  const totalRequiredWidth = activeGroups.reduce((sum, g) => sum + g.originalWidth, 0)

  // 2. Check overlap risk
  // We need at least 20px gaps between groups
  const minTotalGap = Math.max(0, activeGroups.length - 1) * 20
  const isOvercrowded = (totalRequiredWidth + minTotalGap) > effectiveWidth

  // 3. Calculate Scale Factor
  let scaleFactor = 1.0
  if (isOvercrowded) {
    // scale * totalWidth + minTotalGap = effectiveWidth
    // scale = (effectiveWidth - minTotalGap) / totalWidth
    scaleFactor = (effectiveWidth - minTotalGap) / totalRequiredWidth

    // Cap minimum scale to avoid microscopic logos (e.g. 0.5)
    // If it requires < 0.5, we just let them overlap slightly as fallback or use 0.5
    scaleFactor = Math.max(0.6, scaleFactor)

    console.log(`[Strip] OVERCROWD DETECTED! Scaling down by factor: ${scaleFactor.toFixed(2)}`)
  }

  // Position logos
  const compositeOperations: sharp.OverlayOptions[] = []

  // Logic for spacing distribution
  // If we scaled down, we use the specific "Tight Fit" spacing
  // Otherwise we use "Space Around"

  /**
   * Validate minimum spacing between logos
   * Returns true if spacing is acceptable, false if cramped
   */
  function validateLogoSpacing(
    activeGroups: Array<{ col: number; finalWidth: number }>,
    minimumGap: number = 50
  ): { valid: boolean; reason?: string } {
    if (activeGroups.length < 2) return { valid: true }

    // Check gaps between consecutive groups
    for (let i = 0; i < activeGroups.length - 1; i++) {
      const currentGroup = activeGroups[i]
      const nextGroup = activeGroups[i + 1]

      // Calculate actual pixel positions (simplified check)
      // In reality, the spacing is calculated later, but we check theoretical minimum
      const gap = Math.abs(nextGroup.col - currentGroup.col) * (effectiveWidth / 6) - currentGroup.finalWidth

      if (gap < minimumGap) {
        return {
          valid: false,
          reason: `Gap between logo groups ${i} and ${i + 1} is only ${Math.floor(gap)}px (minimum: ${minimumGap}px)`
        }
      }
    }

    return { valid: true }
  }

  // Recalculate group widths with scale factor
  let scaledGroups = activeGroups.map(g => ({
    ...g,
    finalWidth: Math.floor(g.originalWidth * scaleFactor)
  }))

  // Validate spacing after initial scaling
  const spacingCheck = validateLogoSpacing(scaledGroups, 50)
  if (!spacingCheck.valid) {
    console.warn('[Logo Overlay] Spacing validation failed:', spacingCheck.reason)
    console.warn('[Logo Overlay] Reducing scale factor to create more space...')

    // Reduce scale factor by 10% to create more space
    scaleFactor = Math.max(0.5, scaleFactor * 0.9)

    // Recalculate with reduced scale
    scaledGroups = activeGroups.map(g => ({
      ...g,
      finalWidth: Math.floor(g.originalWidth * scaleFactor)
    }))

    console.log('[Logo Overlay] New scale factor:', scaleFactor.toFixed(2))
  }

  const totalScaledWidth = scaledGroups.reduce((sum, g) => sum + g.finalWidth, 0)
  const finalAvailableSpace = effectiveWidth - totalScaledWidth

  // Distribute remaining space
  const groupSpacing = Math.max(20, finalAvailableSpace / (scaledGroups.length + 1))

  let currentX = startX + groupSpacing

  for (const group of scaledGroups) {
    const { logos: groupLogos } = group
    const internalGap = Math.floor(10 * scaleFactor)

    let internalX = currentX

    for (const logo of groupLogos) {
      // Resize logo if scale factor < 1.0
      let logoBuffer = logo.buffer
      let logoW = logo.width
      let logoH = logo.height

      if (scaleFactor < 0.99) {
        try {
          const newW = Math.floor(logo.width * scaleFactor)
          const newH = Math.floor(logo.height * scaleFactor)
          // We must resize the buffer
          logoBuffer = await sharp(logo.buffer)
            .resize(newW, newH)
            .png()
            .toBuffer()
          logoW = newW
          logoH = newH
        } catch (e) {
          console.error('Failed to resize logo during auto-scale', e)
        }
      }

      const y = Math.floor((stripHeight - logoH) / 2)

      compositeOperations.push({
        input: logoBuffer,
        top: y,
        left: Math.max(0, Math.floor(internalX)),
      })

      internalX += logoW + internalGap
    }

    currentX += group.finalWidth + groupSpacing
  }

  // Composite logos onto strip
  const finalStrip = await sharp(stripBuffer)
    .composite(compositeOperations)
    .png()
    .toBuffer()

  return { stripBuffer: finalStrip, stripHeight, stripLeft }
}

/**
 * Create a MULTI-ROW SINGLE STRIP containing logos from multiple rows
 *
 * This solves the gap problem by creating ONE strip background for both rows
 * instead of two separate strips with a gap between them.
 *
 * Example: Header (5 logos) + Middle (2 logos) = One tall strip with both rows
 *
 * @param imageWidth - Width of the base image
 * @param logosByRow - Map of row name → logos for that row
 * @param backgroundColor - Strip background color
 * @param stripPadding - Horizontal padding
 * @param stripShape - Shape of the strip
 * @param rowLeading - Vertical spacing between rows within the strip (default 12px)
 * @param stripOpacity - Strip opacity 0-100 (default: 100)
 * @param logoBound - When true, strip only covers logo area (default: false)
 */
async function createMultiRowStrip(
  imageWidth: number,
  logosByRow: Map<LogoStripRow, Array<{ buffer: Buffer; width: number; height: number; column: number }>>,
  backgroundColor: string,
  stripPadding: number,
  stripShape: LogoStripShape = 'rectangle',
  rowLeading: number = 12,
  stripOpacity: number = 100,
  logoBound: boolean = false
): Promise<{ stripBuffer: Buffer; stripHeight: number; stripLeft: number }> {
  console.log('[Multi-Row Strip] Creating combined strip for', logosByRow.size, 'rows, opacity:', stripOpacity, '%, logoBound:', logoBound)

  // Calculate height for each row
  // v5.3: Ultra-tight row height - just logo height + minimal padding
  const rowHeights = new Map<LogoStripRow, number>()
  for (const [rowName, logos] of logosByRow.entries()) {
    const maxLogoHeight = Math.max(...logos.map(l => l.height))
    const rowHeight = maxLogoHeight + 4 // v5.3: Just 2px padding top+bottom per row
    rowHeights.set(rowName, rowHeight)
    console.log(`[Multi-Row Strip] Row "${rowName}": ${logos.length} logos, height ${rowHeight}px`)
  }

  // Calculate total strip height
  const rowNames = Array.from(logosByRow.keys())
  const totalRowHeight = Array.from(rowHeights.values()).reduce((sum, h) => sum + h, 0)
  const totalLeading = (rowNames.length - 1) * rowLeading // Leading between rows
  const stripHeight = totalRowHeight + totalLeading

  // --- NEW v5.4: LOGO-BOUND STRIP CALCULATION FOR MULTI-ROW ---
  let stripLeft = 0
  let stripWidth = imageWidth

  if (logoBound) {
    // Find min/max columns across ALL rows
    const allLogos = Array.from(logosByRow.values()).flat()
    if (allLogos.length > 0) {
      const minColumn = Math.min(...allLogos.map(l => l.column))
      const maxColumn = Math.max(...allLogos.map(l => l.column))

      const colWidth = (imageWidth - stripPadding * 2) / 6
      const logoAreaPadding = 30 // Extra padding around logos

      stripLeft = Math.max(0, stripPadding + (minColumn - 1) * colWidth - logoAreaPadding)
      const stripRight = Math.min(imageWidth, stripPadding + maxColumn * colWidth + logoAreaPadding)
      stripWidth = stripRight - stripLeft

      console.log(`[Multi-Row Strip] Logo-bound mode: columns ${minColumn}-${maxColumn}, strip from ${stripLeft}px to ${stripRight}px (width: ${stripWidth}px)`)
    }
  }

  console.log(`[Multi-Row Strip] Total height: ${stripHeight}px (${totalRowHeight}px rows + ${totalLeading}px leading)`)

  // Generate strip background with opacity support
  const shapeSVG = generateStripShapeSVG(stripWidth, stripHeight, stripShape, backgroundColor, stripOpacity)
  const stripBuffer = await sharp(Buffer.from(shapeSVG))
    .png()
    .toBuffer()

  // Composite operations for all logos across all rows
  const compositeOperations: sharp.OverlayOptions[] = []

  let currentY = 0

  for (const rowName of rowNames) {
    const rowLogos = logosByRow.get(rowName) || []
    const rowHeight = rowHeights.get(rowName) || 0

    if (rowLogos.length === 0) continue

    // Redistribute columns for this row
    const redistributed = redistributeColumnsForFullWidth(rowLogos, 6)

    console.log(`[Multi-Row Strip] Row "${rowName}" at Y=${currentY}px`)
    console.log(`[Multi-Row Strip] Virtual columns:`, redistributed.map(l => l.virtualColumn).join(', '))

    // Group by virtual column
    const logosByColumn: Map<number, typeof redistributed> = new Map()
    for (const logo of redistributed) {
      const col = logo.virtualColumn
      if (!logosByColumn.has(col)) {
        logosByColumn.set(col, [])
      }
      logosByColumn.get(col)!.push(logo)
    }

    // Calculate positions for this row
    const sortedEntries = Array.from(logosByColumn.entries()).sort((a, b) => a[0] - b[0])
    const activeGroups = sortedEntries.map(([col, groupLogos]) => ({
      col,
      logos: groupLogos,
      originalWidth: groupLogos.reduce((sum, l) => sum + l.width, 0) + (Math.max(0, groupLogos.length - 1) * 10)
    }))

    const effectiveWidth = imageWidth - (stripPadding * 2)
    const totalRequiredWidth = activeGroups.reduce((sum, g) => sum + g.originalWidth, 0)

    let scaleFactor = 1.0
    if (totalRequiredWidth > effectiveWidth) {
      scaleFactor = effectiveWidth / totalRequiredWidth
      scaleFactor = Math.max(0.6, scaleFactor)
    }

    const scaledGroups = activeGroups.map(g => ({
      ...g,
      finalWidth: Math.floor(g.originalWidth * scaleFactor)
    }))

    const totalScaledWidth = scaledGroups.reduce((sum, g) => sum + g.finalWidth, 0)
    const finalAvailableSpace = effectiveWidth - totalScaledWidth
    const groupSpacing = Math.max(20, finalAvailableSpace / (scaledGroups.length + 1))

    let currentX = stripPadding + groupSpacing

    // Position logos for this row
    for (const group of scaledGroups) {
      const internalGap = Math.floor(10 * scaleFactor)
      let internalX = currentX

      for (const logo of group.logos) {
        let logoBuffer = logo.buffer
        let logoW = logo.width
        let logoH = logo.height

        // Resize if needed
        if (scaleFactor < 0.99) {
          try {
            const newW = Math.floor(logo.width * scaleFactor)
            const newH = Math.floor(logo.height * scaleFactor)
            logoBuffer = await sharp(logo.buffer)
              .resize(newW, newH)
              .png()
              .toBuffer()
            logoW = newW
            logoH = newH
          } catch (e) {
            console.error('Failed to resize logo', e)
          }
        }

        // Y position within this row (vertically centered)
        const yInRow = Math.floor((rowHeight - logoH) / 2)

        compositeOperations.push({
          input: logoBuffer,
          top: currentY + yInRow,
          left: Math.max(0, Math.floor(internalX)),
        })

        internalX += logoW + internalGap
      }

      currentX += group.finalWidth + groupSpacing
    }

    // Move to next row
    currentY += rowHeight + rowLeading
  }

  // Composite all logos onto the strip
  const finalStrip = await sharp(stripBuffer)
    .composite(compositeOperations)
    .png()
    .toBuffer()

  console.log('[Multi-Row Strip] ✅ Combined strip created successfully')

  return { stripBuffer: finalStrip, stripHeight, stripLeft }
}

/**
 * Redistribute logo columns to use full strip width
 * Maps user-specified columns to evenly-spaced virtual columns
 */
function redistributeColumnsForFullWidth(
  logos: Array<{ column: number; [key: string]: any }>,
  totalColumns: number = 6
): Array<{ column: number; virtualColumn: number; [key: string]: any }> {
  // Extract unique columns used
  const usedColumns = Array.from(new Set(logos.map(l => l.column))).sort((a, b) => a - b)

  // If already using full width (columns 1 and 6), no redistribution needed
  if (usedColumns.includes(1) && usedColumns.includes(totalColumns)) {
    return logos.map(l => ({ ...l, virtualColumn: l.column }))
  }

  // Calculate even distribution
  const logoCount = usedColumns.length
  const virtualColumns: number[] = []

  if (logoCount === 1) {
    // Single logo: center it
    virtualColumns.push(3)
  } else if (logoCount === 2) {
    // Two logos: use edges
    virtualColumns.push(1, 6)
  } else if (logoCount === 3) {
    // Three logos: left, center-right, right
    virtualColumns.push(1, 4, 6)
  } else if (logoCount === 4) {
    // Four logos: evenly distributed
    virtualColumns.push(1, 2, 5, 6)
  } else if (logoCount === 5) {
    // Five logos
    virtualColumns.push(1, 2, 3, 5, 6)
  } else {
    // Six or more: use all columns
    for (let i = 1; i <= Math.min(logoCount, totalColumns); i++) {
      virtualColumns.push(i)
    }
  }

  // Create mapping: original column → virtual column
  const columnMap = new Map<number, number>()
  usedColumns.forEach((origCol, idx) => {
    columnMap.set(origCol, virtualColumns[idx])
  })

  // Apply mapping to logos
  return logos.map(logo => ({
    ...logo,
    virtualColumn: columnMap.get(logo.column) || logo.column
  }))
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
  stripGap: number = 20, // Gap between strips (default 20px for tight spacing)
  topOffset: number = 0 // Offset from top (for 'middle' strip below header)
): number {
  switch (row) {
    case 'header':
      return 0 // Top of image
    case 'middle':
      // If topOffset is provided, position just below it (with minimal gap)
      // Otherwise fallback to center (legacy behavior)
      return topOffset > 0 ? topOffset + stripGap : Math.floor((imageHeight - stripHeight) / 2)
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
  // MULTI-MODE PROCESSING: Strips + Individual Logos
  // ==================================================
  // NEW v4.7: Independent Row Processing
  // Instead of a single unified strip, we process each row (header, middle, footer)
  // independently based on the user's configuration. This allows for:
  // 1. Multiple strips (e.g., Header Strip + Footer Strip)
  // 2. Hybrid layouts (e.g., Header Strip + Individual Floating Logos in Middle)

  const compositeOperations: sharp.OverlayOptions[] = []

  // Helper to categorize logos by row
  const getRowForPosition = (pos: LogoPosition): LogoStripRow => {
    if (pos.startsWith('top-')) return 'header'
    if (pos.startsWith('mid-')) return 'middle'
    return 'footer'
  }

  // Group placements by row
  const logosByRow: Record<LogoStripRow, LogoPlacement[]> = {
    header: [],
    middle: [],
    footer: []
  }

  for (const placement of logosPlacements) {
    const row = getRowForPosition(placement.position)
    logosByRow[row].push(placement)
  }

  // Process a list of logos (either as a strip or individually)
  // Returns the BOTTOM Y coordinate of the processed element (for stacking)
  const processLogos = async (
    rowName: LogoStripRow,
    placements: LogoPlacement[],
    useStrip: boolean,
    topOffset: number = 0
  ): Promise<number> => {
    if (placements.length === 0) return topOffset

    let contentHeight = 0

    if (useStrip) {
      // --- STRIP MODE for this row ---
      console.log(`[Logo System] Creating ${rowName} strip with ${placements.length} logos`)

      const processedLogos: { buffer: Buffer; width: number; height: number; column: number; logoId: string }[] = []

      for (const placement of placements) {
        if (!placement.logo?.file_url) continue
        try {
          const logoBuffer = await downloadImage(placement.logo.file_url)
          const logoSizeValue = placement.size ?? defaultLogoSize
          const logoSizePixels = getLogoSizePixels(logoSizeValue)

          const resizedLogo = await sharp(logoBuffer)
            .resize(logoSizePixels, logoSizePixels, { fit: 'inside', withoutEnlargement: true })
            .png()
            .toBuffer()

          const logoMetadata = await sharp(resizedLogo).metadata()
          const column = parseInt(placement.position.split('-')[1]) || 1

          processedLogos.push({
            buffer: resizedLogo,
            width: logoMetadata.width || logoSizePixels,
            height: logoMetadata.height || logoSizePixels,
            column,
            logoId: placement.logoId
          })
        } catch (e) {
          console.error(`Failed to load logo for strip:`, e)
        }
      }

      if (processedLogos.length > 0) {
        const stripShape = config.stripShape || DEFAULT_LOGO_STRIP_SHAPE
        const stripOpacity = config.stripMode?.opacity ?? 100
        const logoBound = config.stripMode?.logoBound ?? false
        // v6.0 Phase 5: Extract background rendering flag
        const renderStripBackground = config.stripMode?.enabled ?? true

        const stripResult = await createLogoStrip(
          imageWidth,
          processedLogos,
          backgroundColor, // Use global background for strip
          paddingPixels,
          stripShape,
          stripOpacity,
          logoBound,
          renderStripBackground // v6.0 Phase 5: Pass background rendering flag
        )

        // v6.0 Phase 5: Only composite strip if background was rendered
        if (stripResult) {
          const { stripBuffer, stripHeight, stripLeft } = stripResult
          contentHeight = stripHeight

          // Use topOffset for 'middle', 0 for 'header'
          // Strip gap: 15px for tight spacing between header and middle strips
          const stripGap = 15 // Minimal gap between strips (was using paddingPixels ~40px before)
          const stripY = getStripYPosition(rowName, stripHeight, imageHeight, stripGap, topOffset)

          console.log(`[Logo Overlay] Strip "${rowName}" positioned at Y=${stripY}px, X=${stripLeft}px (gap: ${stripGap}px, opacity: ${stripOpacity}%, logoBound: ${logoBound}, background: ${renderStripBackground ? 'ENABLED' : 'DISABLED'})`)

          compositeOperations.push({
            input: stripBuffer,
            top: stripY,
            left: stripLeft
          })
        } else {
          console.log(`[Logo Overlay] Strip "${rowName}" background DISABLED - logos will be composited individually with drop shadows`)

          // v6.0 Phase 5: Composite logos directly on AI background with drop shadows
          // Calculate positions for each logo in the strip
          const colWidth = imageWidth / 6
          const stripGap = 15
          const stripY = getStripYPosition(rowName, 0, imageHeight, stripGap, topOffset)

          for (const logo of processedLogos) {
            try {
              // Add drop shadow to logo
              const logoWithShadow = await addDropShadowToLogo(logo.buffer)
              const shadowMeta = await sharp(logoWithShadow).metadata()

              // Calculate column-based X position (centered in column)
              const columnCenter = (logo.column - 0.5) * colWidth
              const logoX = Math.floor(columnCenter - (shadowMeta.width || logo.width) / 2)
              const logoY = stripY

              console.log(`[Logo Overlay] Placing logo "${logo.logoId}" with drop shadow at column ${logo.column} (X=${logoX}px, Y=${logoY}px)`)

              compositeOperations.push({
                input: logoWithShadow,
                top: Math.max(0, logoY),
                left: Math.max(0, logoX)
              })
            } catch (error) {
              console.error(`[Logo Overlay] Error adding drop shadow to logo "${logo.logoId}":`, error)
            }
          }
        }
      }

    } else {
      // --- INDIVIDUAL MODE for this row ---
      console.log(`[Logo System] Placing ${placements.length} individual logos in ${rowName}`)

      for (const placement of placements) {
        if (!placement.logo?.file_url) continue
        try {
          const logoSizeValue = placement.size ?? defaultLogoSize
          const logoSizePixels = getLogoSizePixels(logoSizeValue)
          const bgShape = placement.backgroundShape || DEFAULT_LOGO_BACKGROUND.shape
          const bgStyle = placement.backgroundStyle || DEFAULT_LOGO_BACKGROUND.style

          const logoBuffer = await downloadImage(placement.logo.file_url)
          const resizedLogo = await sharp(logoBuffer)
            .resize(logoSizePixels, logoSizePixels, { fit: 'inside', withoutEnlargement: true })
            .png()
            .toBuffer()

          const finalLogo = await createLogoWithBackground(
            resizedLogo,
            logoSizePixels,
            bgShape,
            bgStyle,
            backgroundColor
          )

          const finalMetadata = await sharp(finalLogo).metadata()
          const finalWidth = finalMetadata.width || logoSizePixels
          const finalHeight = finalMetadata.height || logoSizePixels

          const { x, y } = calculatePosition(
            placement.position,
            imageWidth,
            imageHeight,
            Math.max(finalWidth, finalHeight),
            paddingPixels
          )

          contentHeight = Math.max(contentHeight, finalHeight)

          compositeOperations.push({
            input: finalLogo,
            top: Math.max(0, y),
            left: Math.max(0, x)
          })

        } catch (e) {
          console.error(`Failed to place individual logo:`, e)
        }
      }
    }

    // Return the bottom edge of this content
    // For individual logos, we approximate using the generic row height
    // For strips, we know exact height
    if (rowName === 'header') {
      return contentHeight > 0 ? contentHeight : topOffset
    }
    return topOffset // Only header offset matters for middle
  }

  // Execute processing for each row
  // Check which rows are enabled for strip mode
  // NEW v4.9: Auto-detect rows with logos when strip mode is globally enabled
  const stripEnabledRows = new Set<LogoStripRow>(
    (stripMode?.enabled && stripMode.rows) ? (stripMode.rows as LogoStripRow[]) : []
  )

  // Auto-add rows that have logos if strip mode is globally enabled
  if (stripMode?.enabled) {
    const rowsWithLogos: LogoStripRow[] = []
    if (logosByRow.header.length > 0) rowsWithLogos.push('header')
    if (logosByRow.middle.length > 0) rowsWithLogos.push('middle')
    if (logosByRow.footer.length > 0) rowsWithLogos.push('footer')

    for (const row of rowsWithLogos) {
      stripEnabledRows.add(row)
    }

    console.log(`[Logo System] Auto-enabled strip mode for rows with logos: ${rowsWithLogos.join(', ')}`)
  }

  // v5.0: Check if we should merge header + middle into ONE unified strip
  const shouldMergeHeaderMiddle = stripMode?.enabled &&
    logosByRow.header.length > 0 &&
    logosByRow.middle.length > 0 &&
    stripEnabledRows.has('header') &&
    stripEnabledRows.has('middle')

  console.log('[Logo System] v5.0 Merge Check:', {
    stripModeEnabled: stripMode?.enabled,
    headerLogos: logosByRow.header.length,
    middleLogos: logosByRow.middle.length,
    headerInSet: stripEnabledRows.has('header'),
    middleInSet: stripEnabledRows.has('middle'),
    shouldMerge: shouldMergeHeaderMiddle
  })

  if (shouldMergeHeaderMiddle) {
    // Use createMultiRowStrip to merge header and middle into ONE strip
    console.log('[Logo System] v5.3: Merging header + middle into ONE unified strip')

    const mergedLogosMap = new Map<LogoStripRow, Array<{ buffer: Buffer; width: number; height: number; column: number }>>()
    const stripShape = config.stripShape || DEFAULT_LOGO_STRIP_SHAPE
    const stripPadding = 10 // v5.3: Minimal padding for unified strip

    // v5.3: Force SAME logo size for all logos in unified strip (compact, uniform height)
    const UNIFIED_STRIP_LOGO_SIZE = 100 // v5.5: Balanced size for visibility without excessive strip height

    // Prepare header logos
    const headerLogosForStrip: Array<{ buffer: Buffer; width: number; height: number; column: number }> = []
    for (const placement of logosByRow.header) {
      if (!placement.logo?.file_url) continue
      try {
        const logoBuffer = await downloadImage(placement.logo.file_url)
        const logoSizePixels = UNIFIED_STRIP_LOGO_SIZE // v5.3: Force same size
        const resizedLogo = await sharp(logoBuffer)
          .resize(logoSizePixels, logoSizePixels, { fit: 'inside', withoutEnlargement: true })
          .png()
          .toBuffer()
        const metadata = await sharp(resizedLogo).metadata()
        const column = parseInt(placement.position.split('-')[1]) || 1
        headerLogosForStrip.push({
          buffer: resizedLogo,
          width: metadata.width || logoSizePixels,
          height: metadata.height || logoSizePixels,
          column
        })
      } catch (e) {
        console.error('Failed to prepare header logo:', e)
      }
    }

    // Prepare middle logos
    const middleLogosForStrip: Array<{ buffer: Buffer; width: number; height: number; column: number }> = []
    for (const placement of logosByRow.middle) {
      if (!placement.logo?.file_url) continue
      try {
        const logoBuffer = await downloadImage(placement.logo.file_url)
        const logoSizePixels = UNIFIED_STRIP_LOGO_SIZE // v5.3: Force same size
        const resizedLogo = await sharp(logoBuffer)
          .resize(logoSizePixels, logoSizePixels, { fit: 'inside', withoutEnlargement: true })
          .png()
          .toBuffer()
        const metadata = await sharp(resizedLogo).metadata()
        const column = parseInt(placement.position.split('-')[1]) || 1
        middleLogosForStrip.push({
          buffer: resizedLogo,
          width: metadata.width || logoSizePixels,
          height: metadata.height || logoSizePixels,
          column
        })
      } catch (e) {
        console.error('Failed to prepare middle logo:', e)
      }
    }

    if (headerLogosForStrip.length > 0) mergedLogosMap.set('header', headerLogosForStrip)
    if (middleLogosForStrip.length > 0) mergedLogosMap.set('middle', middleLogosForStrip)

    // Get strip opacity and logoBound settings
    const stripOpacity = config.stripMode?.opacity ?? 100
    const logoBound = config.stripMode?.logoBound ?? false

    // Create unified strip with rowLeading=0 (no gap between rows)
    const { stripBuffer, stripHeight, stripLeft } = await createMultiRowStrip(
      imageWidth,
      mergedLogosMap,
      backgroundColor || '#FFFFFF',
      stripPadding,
      stripShape,
      0, // rowLeading = 0 for seamless unified strip
      stripOpacity,
      logoBound
    )

    compositeOperations.push({
      input: stripBuffer,
      top: 0,
      left: stripLeft
    })

    console.log(`[Logo System] v5.0: Unified strip created, height: ${stripHeight}px`)

    // Process footer separately if it exists
    if (logosByRow.footer.length > 0) {
      await processLogos('footer', logosByRow.footer, stripEnabledRows.has('footer'))
    }

  } else {
    // Original separate processing for single-row cases
    // 1. Process Header -> Get Bottom Y
    const headerBottom = await processLogos('header', logosByRow.header, stripEnabledRows.has('header'))

    // 2. Process Middle -> Pass Header Bottom as Top Offset
    await processLogos('middle', logosByRow.middle, stripEnabledRows.has('middle'), headerBottom)

    // 3. Process Footer -> Position fixed at bottom (offset doesn't matter)
    await processLogos('footer', logosByRow.footer, stripEnabledRows.has('footer'))
  }

  // Apply all composite operations
  if (compositeOperations.length > 0) {
    return await baseImage.composite(compositeOperations).png().toBuffer()
  }

  return await baseImage.png().toBuffer()
}

/**
 * Process a base64 or data URL image and overlay logos
 */
export async function processImageWithLogos(
  imageDataUrl: string,
  logosPlacements: LogoPlacement[],
  backgroundColor?: string, // Global background color for all logos
  stripMode?: { enabled: boolean; rows: ('header' | 'middle' | 'footer')[] }, // Unified strip layout mode
  stripShape?: string // NEW v3.11: Logo strip shape
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

  // Overlay logos with optional background color, strip mode, and strip shape
  const resultBuffer = await overlayLogosOnImage({
    baseImageBuffer: imageBuffer,
    logosPlacements,
    backgroundColor,
    stripMode: stripMode ? { enabled: stripMode.enabled, rows: stripMode.rows as LogoStripRow[] } : undefined,
    stripShape: stripShape as LogoStripShape | undefined, // NEW v3.11
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
