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
import {
  type LogoStripShape,
  DEFAULT_LOGO_STRIP_SHAPE,
  type Enhanced4RowStripMode,
  type InitiativeTextConfig,
  type PartnerLabelConfig,
  type FooterRowConfig,
  ENHANCED_STRIP_ROW_HEIGHTS,
} from '@/lib/config/design-constants'
import { renderInitiativeText, renderPartnerLabel, renderFooterBar, estimateTextWidth } from './svg-text-renderer'

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
 * Convert hex color to Sharp-compatible background object
 * v14.1: Sharp's create.background expects {r, g, b, alpha} format
 *
 * @param hex - Hex color string (e.g., '#FFFFFF')
 * @param opacityPercent - Opacity as percentage (0-100)
 * @returns Sharp-compatible color object
 *
 * Format requirements:
 * - r, g, b: 0-255 (byte range for RGB channels)
 * - alpha: 0-1 (decimal percentage, NOT 0-255)
 */
function hexToSharpBackground(hex: string, opacityPercent: number): { r: number; g: number; b: number; alpha: number } {
  const cleanHex = hex.replace('#', '')
  const r = parseInt(cleanHex.substring(0, 2), 16)
  const g = parseInt(cleanHex.substring(2, 4), 16)
  const b = parseInt(cleanHex.substring(4, 6), 16)
  return { r, g, b, alpha: opacityPercent / 100 }  // Convert 0-100 to 0-1
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
  // v14.3: Semi-transparent background for logo visibility
  // Use rgba() format - proven to work with Sharp's SVG-to-PNG conversion
  const fillColor = hexToRgba(backgroundColor, opacity)

  switch (shape) {
    case 'curved': {
      const waveDepth = Math.min(height * 0.15, 15)
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
      const angleOffset = Math.min(height * 0.4, 30)
      return `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
          <path d="
            M 0,0
            L ${width},${angleOffset}
            L ${width},${height}
            L 0,${height - angleOffset}
            Z
          " fill="${fillColor}"/>
        </svg>
      `
    }
    case 'rounded': {
      const radius = Math.min(height * 0.5, 20)
      return `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
          <rect x="0" y="0" width="${width}" height="${height}" rx="${radius}" ry="${radius}" fill="${fillColor}"/>
        </svg>
      `
    }
    case 'tapered': {
      const taperWidth = Math.min(height * 0.3, 20)
      return `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
          <path d="
            M ${taperWidth},0
            L ${width - taperWidth},0
            L ${width},${height}
            L 0,${height}
            Z
          " fill="${fillColor}"/>
        </svg>
      `
    }
    case 'rectangle':
    default: {
      return `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
          <rect x="0" y="0" width="${width}" height="${height}" fill="${fillColor}"/>
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
    logos: Array<{ column: number;[key: string]: any }>,
    totalColumns: number = 6
  ): Array<{ column: number; virtualColumn: number;[key: string]: any }> {
    // Extract unique columns used
    const usedColumns = Array.from(new Set(logos.map(l => l.column))).sort((a, b) => a - b)

    // v6.7 FIX: Always respect user's column selections when both edges are used
    if (usedColumns.includes(1) && usedColumns.includes(totalColumns)) {
      console.log('[Logo Overlay] ✅ User selected both edges - preserving original columns')
      return logos.map(l => ({ ...l, virtualColumn: l.column }))
    }

    // v6.7 FIX: For other cases, preserve middle column selections too
    // Only redistribute if columns are clustered (all on one side)
    const hasLeftCluster = usedColumns.every(col => col <= 3)
    const hasRightCluster = usedColumns.every(col => col >= 4)

    if (!hasLeftCluster && !hasRightCluster) {
      // User spread logos across canvas - preserve selections
      console.log('[Logo Overlay] ✅ User spread logos across canvas - preserving columns')
      return logos.map(l => ({ ...l, virtualColumn: l.column }))
    }

    // Only redistribute when logos are clustered on one side
    console.log('[Logo Overlay] ⚠️ Logos clustered - applying redistribution')
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

  // v6.7 FIX: Show ACTUAL virtual columns instead of hardcoded pattern
  const virtualColumnsStr = `[${redistributedLogos.map(l => l.virtualColumn).join(', ')}]`
  const patternDescription =
    redistributedLogos.length === 1 ? 'Center' :
      redistributedLogos.length === 2 ? 'Edges' :
        redistributedLogos.length === 3 ? 'Left, Center-Right, Right' :
          redistributedLogos.length >= 4 ? 'Evenly Distributed' :
            'Custom'

  console.log('[Logo Overlay] Distribution Pattern:', `${virtualColumnsStr} - ${patternDescription}`)

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
  logos: Array<{ column: number;[key: string]: any }>,
  totalColumns: number = 6
): Array<{ column: number; virtualColumn: number;[key: string]: any }> {
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
        // v7.0: Changed default to false - only render white background when explicitly enabled
        const renderStripBackground = config.stripMode?.enabled ?? false

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
    // TIER 2 FIX: Use mitchell kernel for better edge preservation during resize
    resizedBuffer = await sharp(imageBuffer)
      .resize(targetWidth, targetHeight, {
        fit: 'fill', // Stretch/distort to exact dimensions
        kernel: 'mitchell', // Better edge quality than default lanczos3
      })
      .png({ compressionLevel: 9 }) // Maximum quality PNG
      .toBuffer()
  } else if (mode === 'contain') {
    // Fit inside with background - preserves all content
    // TIER 2 FIX: Use mitchell kernel for better edge preservation
    resizedBuffer = await sharp(imageBuffer)
      .resize(targetWidth, targetHeight, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }, // White background for letterboxing
        kernel: 'mitchell', // Better edge quality
      })
      .png({ compressionLevel: 9 }) // Maximum quality PNG
      .toBuffer()
  } else {
    // 'cover' mode - crop to fill (original behavior)
    // TIER 2 FIX: Use mitchell kernel for better edge preservation
    resizedBuffer = await sharp(imageBuffer)
      .resize(targetWidth, targetHeight, {
        fit: 'cover',
        position: 'center',
        kernel: 'mitchell', // Better edge quality
      })
      .png({ compressionLevel: 9 }) // Maximum quality PNG
      .toBuffer()
  }

  return `data:image/png;base64,${resizedBuffer.toString('base64')}`
}

// ============================================================
// ENHANCED 4-ROW LOGO STRIP SYSTEM
// ============================================================

/**
 * Logo data with buffer for rendering
 */
interface LogoBufferData {
  logoId: string
  buffer: Buffer
  width: number
  height: number
}

/**
 * Result of creating enhanced 4-row strip
 */
interface Enhanced4RowStripResult {
  stripBuffer: Buffer
  stripHeight: number
  stripLeft: number // X offset for logoBound mode
}

/**
 * Create unified 4-row logo strip with all content
 *
 * Rows:
 * 1. Brand logos (Yi, Bharat ONE, CII)
 * 2. Vertical logos (user-selected, max 6)
 * 3. Initiative text ("YI Erode Initiative")
 * 4. Partner label ("Digital Partner – [Logo]")
 *
 * All rows share a unified background strip
 */
export async function createEnhanced4RowStrip(
  imageWidth: number,
  config: Enhanced4RowStripMode,
  logoData: {
    brandLogos: LogoBufferData[]
    verticalLogos: LogoBufferData[]
    partnerLogo?: LogoBufferData
  }
): Promise<Enhanced4RowStripResult> {
  const { rows, background, rowSpacing, padding, logoBound } = config

  // Determine which rows are active
  const activeRows: Array<'brand' | 'vertical' | 'initiative' | 'partner'> = []

  if (rows.brand.enabled && logoData.brandLogos.length > 0) {
    activeRows.push('brand')
  }
  if (rows.vertical.enabled && logoData.verticalLogos.length > 0) {
    activeRows.push('vertical')
  }
  if (rows.initiative.enabled && rows.initiative.text.trim()) {
    activeRows.push('initiative')
  }
  if (rows.partner.enabled && rows.partner.labelText.trim()) {
    activeRows.push('partner')
  }

  // If no active rows, return empty strip
  if (activeRows.length === 0) {
    console.log('[4-Row Strip] No active rows, returning empty strip')
    const emptyStrip = await sharp({
      create: {
        width: imageWidth,
        height: 1,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 0 },
      },
    })
      .png()
      .toBuffer()
    return { stripBuffer: emptyStrip, stripHeight: 0, stripLeft: 0 }
  }

  console.log(`[4-Row Strip] Creating strip with ${activeRows.length} active rows: ${activeRows.join(', ')}`)

  // Calculate row heights based on content
  const rowHeights: Partial<Record<'brand' | 'vertical' | 'initiative' | 'partner', number>> = {}

  if (activeRows.includes('brand')) {
    const maxLogoHeight = Math.max(
      ...logoData.brandLogos.map((l) => l.height),
      ENHANCED_STRIP_ROW_HEIGHTS.brand * 0.6
    )
    rowHeights.brand = Math.min(maxLogoHeight + 16, ENHANCED_STRIP_ROW_HEIGHTS.brand)
  }

  if (activeRows.includes('vertical')) {
    const maxLogoHeight = Math.max(
      ...logoData.verticalLogos.map((l) => l.height),
      ENHANCED_STRIP_ROW_HEIGHTS.vertical * 0.6
    )
    rowHeights.vertical = Math.min(maxLogoHeight + 12, ENHANCED_STRIP_ROW_HEIGHTS.vertical)
  }

  if (activeRows.includes('initiative')) {
    // Height based on font size with padding
    rowHeights.initiative = rows.initiative.fontSize * 1.5 + 16
  }

  if (activeRows.includes('partner')) {
    // Height based on logo size with padding
    rowHeights.partner = rows.partner.logoSize + 16
  }

  // Calculate total strip dimensions
  const totalRowHeight = Object.values(rowHeights).reduce((sum, h) => sum + (h || 0), 0)
  const totalSpacing = (activeRows.length - 1) * rowSpacing
  const stripHeight = Math.ceil(totalRowHeight + totalSpacing + padding.vertical * 2)

  // Calculate strip width (logoBound vs edge-to-edge)
  let stripLeft = 0
  let stripWidth = imageWidth

  if (logoBound) {
    // Use 90% of image width, centered
    stripWidth = Math.floor(imageWidth * 0.9)
    stripLeft = Math.floor((imageWidth - stripWidth) / 2)
  }

  console.log(`[4-Row Strip] Strip dimensions: ${stripWidth}x${stripHeight}px`)

  // Generate unified background strip
  const backgroundSVG = generateStripShapeSVG(
    stripWidth,
    stripHeight,
    background.shape,
    background.color,
    background.opacity
  )
  // v14.0: Ensure PNG has alpha channel for transparency
  let stripBuffer = await sharp(Buffer.from(backgroundSVG))
    .ensureAlpha()
    .png({ compressionLevel: 6, adaptiveFiltering: false })
    .toBuffer()

  // Composite each row
  const compositeOps: sharp.OverlayOptions[] = []
  let currentY = padding.vertical

  for (const rowType of activeRows) {
    const rowHeight = rowHeights[rowType] || 0
    const contentWidth = stripWidth - padding.horizontal * 2

    try {
      if (rowType === 'brand' && logoData.brandLogos.length > 0) {
        // v16.5: ROW 1 - Dynamic width (fit-to-logos), centered, attached to top edge
        // v17.0: Increased gap from 6px to 12px for better visual spacing between brand logos
        // Calculate card width based on actual logo dimensions
        const logoGap = 12
        const cardPaddingX = 32  // 16px padding each side
        const maxLogoHeight = Math.floor(rowHeight * 0.96)

        // Estimate total logos width after resize
        let estimatedTotalLogosWidth = 0
        for (const logo of logoData.brandLogos) {
          const aspectRatio = logo.width / logo.height
          let estimatedHeight = Math.min(logo.height, maxLogoHeight)
          let estimatedWidth = Math.round(estimatedHeight * aspectRatio)
          // Cap max width per logo to prevent overly wide logos
          const maxWidthPerLogo = 150
          if (estimatedWidth > maxWidthPerLogo) {
            estimatedWidth = maxWidthPerLogo
          }
          estimatedTotalLogosWidth += estimatedWidth
        }

        const totalGapsWidth = (logoData.brandLogos.length - 1) * logoGap
        // Card width = logos + gaps + padding, with min 280px
        const cardWidth = Math.max(280, estimatedTotalLogosWidth + totalGapsWidth + cardPaddingX)
        // Center the card horizontally on the strip
        const cardLeft = Math.floor((stripWidth - cardWidth) / 2)

        console.log(`[4-Row Strip] ROW 1 (brand): Dynamic width ${cardWidth}px, centered at left=${cardLeft}`)

        const rowBuffer = await renderLogoRow(
          cardWidth,  // v16.5: Dynamic width (fit-to-logos)
          rowHeight,
          logoData.brandLogos,
          'center',   // Center alignment within the card
          16,         // Horizontal padding
          {
            borderRadius: 16,
            roundTop: false,   // Sharp top (attached to top edge)
            roundBottom: true, // Rounded bottom (floating look)
            backgroundColor: { r: 255, g: 255, b: 255, alpha: 1 },  // White background
            logoGap: logoGap,
          }
        )
        compositeOps.push({
          input: rowBuffer,
          top: currentY,
          left: cardLeft,  // v16.5: Centered position (not padding.horizontal)
        })
      } else if (rowType === 'vertical' && logoData.verticalLogos.length > 0) {
        // v16.3: ROW 2 - Dynamic width (fit-to-logos), centered, floating card
        const logoGap = 2
        const cardPaddingX = 24  // 12px padding each side
        const maxLogoHeight = Math.floor(rowHeight * 0.96)

        // Estimate total logos width after resize
        // v19.0: Increased max width from 100px to 150px to accommodate larger Row 2 logos
        let estimatedTotalLogosWidth = 0
        for (const logo of logoData.verticalLogos) {
          const aspectRatio = logo.width / logo.height
          let estimatedHeight = Math.min(logo.height, maxLogoHeight)
          let estimatedWidth = Math.round(estimatedHeight * aspectRatio)
          const maxWidthPerLogo = 150  // v19.0: Increased from 100 to 150px to accommodate larger Row 2 logos
          if (estimatedWidth > maxWidthPerLogo) {
            estimatedWidth = maxWidthPerLogo
          }
          estimatedTotalLogosWidth += estimatedWidth
        }

        const totalGapsWidth = (logoData.verticalLogos.length - 1) * logoGap
        const cardWidth = Math.max(200, estimatedTotalLogosWidth + totalGapsWidth + cardPaddingX)
        const cardLeft = Math.floor((stripWidth - cardWidth) / 2)

        console.log(`[4-Row Strip] ROW 2 (vertical): Dynamic width ${cardWidth}px, centered at left=${cardLeft}`)

        const rowBuffer = await renderLogoRow(
          cardWidth,  // v16.3: Dynamic width (fit-to-logos)
          rowHeight,
          logoData.verticalLogos,
          'center',
          12,
          {
            borderRadius: 8,   // rounded-lg for floating card look
            backgroundColor: { r: 255, g: 255, b: 255, alpha: 1 },
            logoGap: logoGap,
          }
        )
        compositeOps.push({
          input: rowBuffer,
          top: currentY,
          left: cardLeft,  // v16.3: Centered position
        })
      } else if (rowType === 'initiative') {
        const textBuffer = await renderInitiativeText(
          rows.initiative,
          contentWidth,
          rowHeight
        )
        compositeOps.push({
          input: textBuffer,
          top: currentY,
          left: padding.horizontal,
        })
      } else if (rowType === 'partner') {
        const partnerBuffer = await renderPartnerLabel(
          rows.partner,
          contentWidth,
          rowHeight,
          logoData.partnerLogo?.buffer
        )
        compositeOps.push({
          input: partnerBuffer,
          top: currentY,
          left: padding.horizontal,
        })
      }
    } catch (error) {
      console.error(`[4-Row Strip] Error rendering ${rowType} row:`, error)
    }

    currentY += rowHeight + rowSpacing
  }

  // Apply all composites
  if (compositeOps.length > 0) {
    stripBuffer = await sharp(stripBuffer).composite(compositeOps).png().toBuffer()
  }

  console.log(`[4-Row Strip] Strip created successfully`)
  return { stripBuffer, stripHeight, stripLeft }
}

/**
 * Alignment mode for logo rows
 * - 'space-evenly': Equal gaps on all sides: |--gap--[logo]--gap--[logo]--gap--|
 * - 'space-between': Logos pushed to edges: |[logo]------[logo]------[logo]|
 * - 'center': All logos centered together: |---[logo][logo][logo]---|
 */
type LogoRowAlignment = 'space-evenly' | 'space-between' | 'center'

/**
 * Render a row of logos with proper even distribution
 * v7.1: FIXED - Resize logos to fit before calculating positions (prevents negative positions)
 *
 * @param rowWidth - Width of the row canvas
 * @param rowHeight - Height of the row canvas
 * @param logos - Array of logo buffers with dimensions
 * @param alignment - Alignment mode (default: 'space-evenly')
 * @param horizontalPadding - Padding from edges (default: 10px)
 * @param shapeConfig - Optional border radius configuration (v15.0)
 */

/**
 * Shape configuration for individual logo rows
 * v15.0: Support per-row border radius for floating card design
 */
export interface LogoRowShapeConfig {
  borderRadius?: number;  // Border radius in pixels (0 = sharp, 16 = rounded-2xl)
  roundTop?: boolean;     // Round only top corners (for footer)
  roundBottom?: boolean;  // Round only bottom corners
  backgroundColor?: { r: number; g: number; b: number; alpha: number };  // v15.1: Row background color (white for floating cards, transparent for default)
  logoGap?: number;       // v16.1: Explicit gap between logos in pixels (overrides default calculation)
}

async function renderLogoRow(
  rowWidth: number,
  rowHeight: number,
  logos: LogoBufferData[],
  alignment: LogoRowAlignment = 'space-evenly',
  horizontalPadding: number = 10,  // v12.0: Reduced from 15 to 10 for more horizontal space
  shapeConfig?: LogoRowShapeConfig  // v15.0: Per-row border radius
): Promise<Buffer> {
  // v15.1: Create canvas with configurable background (default: transparent, or solid for floating cards)
  const bgColor = shapeConfig?.backgroundColor || { r: 0, g: 0, b: 0, alpha: 0 }

  const canvas = await sharp({
    create: {
      width: rowWidth,
      height: rowHeight,
      channels: 4,
      background: bgColor,  // Use white for floating cards, transparent for default
    },
  })
    .png()
    .toBuffer()

  if (logos.length === 0) return canvas

  // v16.3 FIX: Create rounded background directly with SVG fill (replaces broken mask approach)
  // The previous dest-in blend mode was causing the white background to not render correctly
  let processedCanvas = canvas
  if (shapeConfig?.borderRadius && shapeConfig.borderRadius > 0) {
    const radius = shapeConfig.borderRadius

    // Use the configured background color for the SVG fill
    const bgR = bgColor.r
    const bgG = bgColor.g
    const bgB = bgColor.b
    const bgA = bgColor.alpha

    // Generate SVG with colored fill (not white mask + blend)
    let bgSVG: string

    if (shapeConfig.roundTop && !shapeConfig.roundBottom) {
      // Round top only (footer bar)
      bgSVG = `
        <svg width="${rowWidth}" height="${rowHeight}">
          <path d="M 0,${radius} Q 0,0 ${radius},0 L ${rowWidth - radius},0 Q ${rowWidth},0 ${rowWidth},${radius} L ${rowWidth},${rowHeight} L 0,${rowHeight} Z" fill="rgba(${bgR},${bgG},${bgB},${bgA})"/>
        </svg>
      `
    } else if (shapeConfig.roundBottom && !shapeConfig.roundTop) {
      // Round bottom only (ROW 1 - top attached, bottom floating)
      bgSVG = `
        <svg width="${rowWidth}" height="${rowHeight}">
          <path d="M 0,0 L ${rowWidth},0 L ${rowWidth},${rowHeight - radius} Q ${rowWidth},${rowHeight} ${rowWidth - radius},${rowHeight} L ${radius},${rowHeight} Q 0,${rowHeight} 0,${rowHeight - radius} Z" fill="rgba(${bgR},${bgG},${bgB},${bgA})"/>
        </svg>
      `
    } else {
      // Round all corners (ROW 2 - floating card)
      bgSVG = `
        <svg width="${rowWidth}" height="${rowHeight}">
          <rect x="0" y="0" width="${rowWidth}" height="${rowHeight}" rx="${radius}" ry="${radius}" fill="rgba(${bgR},${bgG},${bgB},${bgA})"/>
        </svg>
      `
    }

    // v16.3: Create background directly from SVG (no mask compositing needed)
    processedCanvas = await sharp(Buffer.from(bgSVG))
      .png()
      .toBuffer()
  }

  const availableWidth = rowWidth - (horizontalPadding * 2)
  // v16.1: Use explicit logoGap if provided, else fallback to dynamic calculation
  // v11.2: Reduced gaps to maximize logo size (was 8:12:15, now 5:8:10)
  const minGap = shapeConfig?.logoGap ?? (logos.length > 4 ? 5 : logos.length > 2 ? 8 : 10)
  // v15.0: Increased from 0.95 to 0.96 for tighter fit in smaller rows (50px → 48px, 40px → 38px)
  const maxLogoHeight = Math.floor(rowHeight * 0.96)

  // v16.12 FIX: Calculate max width per logo based on alignment mode
  // 'space-evenly' needs gaps before, between, and after (logos.length + 1)
  // 'center' only needs gaps between logos (logos.length - 1)
  const gapCount = alignment === 'space-evenly' ? (logos.length + 1) : (logos.length - 1)
  const maxTotalLogoWidth = availableWidth - (minGap * gapCount)
  const maxWidthPerLogo = Math.floor(maxTotalLogoWidth / logos.length)

  // v7.1: Resize logos to fit constraints BEFORE calculating positions
  const resizedLogos: LogoBufferData[] = await Promise.all(
    logos.map(async (logo) => {
      const aspectRatio = logo.width / logo.height

      // Calculate new dimensions respecting both height and width constraints
      let newHeight = Math.min(logo.height, maxLogoHeight)
      let newWidth = Math.round(newHeight * aspectRatio)

      // If still too wide, scale down based on width constraint
      if (newWidth > maxWidthPerLogo) {
        const scaleFactor = maxWidthPerLogo / newWidth
        newWidth = maxWidthPerLogo
        newHeight = Math.round(newHeight * scaleFactor)
      }

      // Skip resize if already small enough
      if (newWidth >= logo.width && newHeight >= logo.height) {
        return logo
      }

      console.log(`[renderLogoRow] Resizing logo from ${logo.width}x${logo.height} to ${newWidth}x${newHeight}`)

      const resizedBuffer = await sharp(logo.buffer)
        .resize(newWidth, newHeight, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer()

      return { buffer: resizedBuffer, width: newWidth, height: newHeight, logoId: logo.logoId }
    })
  )

  // Recalculate total width after resizing
  const totalLogoWidth = resizedLogos.reduce((sum, l) => sum + l.width, 0)

  // Calculate positions based on alignment mode - NOW GUARANTEED POSITIVE
  const positions: number[] = []

  switch (alignment) {
    case 'space-evenly': {
      // Equal gaps between all elements including edges
      // |--gap--[logo]--gap--[logo]--gap--[logo]--gap--|
      const totalGaps = resizedLogos.length + 1
      const gapSize = Math.max(minGap, (availableWidth - totalLogoWidth) / totalGaps)
      let currentX = horizontalPadding + gapSize

      for (const logo of resizedLogos) {
        positions.push(Math.round(currentX))
        currentX += logo.width + gapSize
      }
      break
    }

    case 'space-between': {
      // Logos spread edge-to-edge with equal gaps between
      // |[logo]------[logo]------[logo]|
      if (resizedLogos.length === 1) {
        // Single logo - center it
        positions.push(Math.round((rowWidth - resizedLogos[0].width) / 2))
      } else {
        const gapSize = Math.max(minGap, (availableWidth - totalLogoWidth) / (resizedLogos.length - 1))
        let currentX = horizontalPadding

        for (const logo of resizedLogos) {
          positions.push(Math.round(currentX))
          currentX += logo.width + gapSize
        }
      }
      break
    }

    case 'center': {
      // All logos centered together with minimal gap between them
      // |-------[logo][gap][logo][gap][logo]-------|
      const totalWidth = totalLogoWidth + (minGap * (resizedLogos.length - 1))
      const startX = Math.max(horizontalPadding, (rowWidth - totalWidth) / 2)
      let currentX = startX

      for (const logo of resizedLogos) {
        positions.push(Math.round(currentX))
        currentX += logo.width + minGap
      }
      break
    }

    default: {
      // Fallback to simple even spacing
      const spacing = Math.max(minGap, (availableWidth - totalLogoWidth) / (resizedLogos.length + 1))
      let currentX = horizontalPadding + spacing

      for (const logo of resizedLogos) {
        positions.push(Math.round(currentX))
        currentX += logo.width + spacing
      }
    }
  }

  // Build composite operations with safety clamps
  const compositeOps: sharp.OverlayOptions[] = resizedLogos.map((logo, index) => ({
    input: logo.buffer,
    left: Math.max(0, positions[index]), // Safety clamp to prevent negative
    top: Math.max(0, Math.floor((rowHeight - logo.height) / 2)),
  }))

  console.log(`[renderLogoRow] Alignment: ${alignment}, Logos: ${resizedLogos.length}, Positions:`, positions, `(availableWidth: ${availableWidth}, totalLogoWidth: ${totalLogoWidth})`)

  return await sharp(processedCanvas).composite(compositeOps).png().toBuffer()
}

/**
 * Apply enhanced 4-row strip to an image
 *
 * Composites the strip at the top of the image
 */
export async function applyEnhanced4RowStrip(
  imageBuffer: Buffer,
  config: Enhanced4RowStripMode,
  logoData: {
    brandLogos: LogoBufferData[]
    verticalLogos: LogoBufferData[]
    partnerLogo?: LogoBufferData
  }
): Promise<Buffer> {
  if (!config.enabled) {
    return imageBuffer
  }

  // Get image dimensions
  const metadata = await sharp(imageBuffer).metadata()
  const imageWidth = metadata.width || 1024

  // Create the strip
  const { stripBuffer, stripHeight, stripLeft } = await createEnhanced4RowStrip(
    imageWidth,
    config,
    logoData
  )

  if (stripHeight === 0) {
    return imageBuffer
  }

  // Composite strip at top of image
  // v14.0: Explicit blend mode - composite respecting alpha channel for transparency
  return await sharp(imageBuffer)
    .composite([
      {
        input: stripBuffer,
        top: 0,
        left: stripLeft,
        blend: 'over', // Respects alpha channel - transparent pixels don't obscure poster
      },
    ])
    .png()
    .toBuffer()
}

// ============================================================
// SPLIT LAYOUT FUNCTIONS (Header at Top + Footer at Bottom)
// ============================================================

/**
 * Create header strip only (rows 1-3: brand, vertical, initiative)
 * Used in split layout mode where footer is separate
 */
export async function createEnhanced4RowHeaderStrip(
  imageWidth: number,
  config: Enhanced4RowStripMode,
  logoData: {
    brandLogos: LogoBufferData[]
    verticalLogos: LogoBufferData[]
  }
): Promise<{ stripBuffer: Buffer; stripHeight: number; stripLeft: number }> {
  const { rows, background, rowSpacing, padding, logoBound } = config

  // v12.2: Calculate active header rows (1-3 only, no partner row) - Content-based check
  // Matches safe zone logic in route.ts - renders if content exists, ignores enabled flags
  const activeRows: Array<'brand' | 'vertical' | 'initiative'> = []
  if (rows.brand.logoIds.length > 0) activeRows.push('brand')  // Render if logos exist
  if (rows.vertical.logoIds.length > 0) activeRows.push('vertical')  // Render if logos exist
  if (rows.initiative.text.trim()) activeRows.push('initiative')  // Render if text exists

  if (activeRows.length === 0) {
    // Return empty strip
    return {
      stripBuffer: await sharp({
        create: { width: 1, height: 1, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
      }).png().toBuffer(),
      stripHeight: 0,
      stripLeft: 0,
    }
  }

  // v16.4: Calculate total height - ROW 1 attached to top (no top padding)
  let totalHeight = padding.vertical  // Only bottom padding (ROW 1 attached to top)
  for (const row of activeRows) {
    totalHeight += ENHANCED_STRIP_ROW_HEIGHTS[row]
    if (activeRows.indexOf(row) < activeRows.length - 1) {
      totalHeight += rowSpacing
    }
  }

  // Calculate strip width - v15.1: Floating card effect with margins
  // Reduce width to 75% with max 800px for better floating appearance
  const maxCardWidth = 800  // Maximum width for floating card
  const floatingCardWidth = Math.min(imageWidth * 0.75, maxCardWidth)
  const stripWidth = logoBound ? floatingCardWidth : imageWidth
  const stripLeft = logoBound ? Math.floor((imageWidth - stripWidth) / 2) : 0

  // v15.1: Per-row card approach - no unified background wrapper
  // Each row will have its own background and border radius applied by renderLogoRow

  // v15.1: White background config for floating card effect
  const rowBackgroundColor = { r: 255, g: 255, b: 255, alpha: 1 }  // White solid background

  // Render and composite each row
  const compositeOps: sharp.OverlayOptions[] = []
  let currentY = 0  // v16.4: Start at Y=0 (ROW 1 attached to top edge of poster)

  for (const rowType of activeRows) {
    const rowHeight = ENHANCED_STRIP_ROW_HEIGHTS[rowType]

    if (rowType === 'brand' && logoData.brandLogos.length > 0) {
      // v18.2: ROW 1 - FULL WIDTH with space-evenly alignment
      // User requested full width edge-to-edge instead of dynamic tight-fit
      // space-evenly provides equal gaps: |--gap--[logo]--gap--[logo]--gap--|

      console.log(`[ROW 1 Full Width] Logos: ${logoData.brandLogos.length}, Width: ${imageWidth}px (full width, space-evenly)`)

      const brandRowBuffer = await renderLogoRow(
        imageWidth,       // v18.2: Full width (was: cardWidth)
        rowHeight,
        logoData.brandLogos,
        'space-evenly',   // v18.2: Even spacing on all sides (was: 'center')
        20,               // v18.2: Reduced padding since we have full width
        {
          borderRadius: 16,  // v16.0: rounded-b-2xl (bottom only)
          roundTop: false,   // v16.4: TOP ATTACHED - sharp corners (touches top edge)
          roundBottom: true, // v16.4: BOTTOM FLOATING - rounded corners
          backgroundColor: rowBackgroundColor,
          // Note: logoGap not needed with space-evenly - it calculates gaps automatically
        }
      )

      // v18.2: Position at left: 0 (full width, no centering needed)
      compositeOps.push({ input: brandRowBuffer, top: currentY, left: 0 })
    } else if (rowType === 'vertical' && logoData.verticalLogos.length > 0) {
      // v16.3: ROW 2 - Dynamic width floating card (fit-to-logos, centered)
      // Card width should fit the logos inside it, not stretch full edge-to-edge
      // If 2 logos = smaller card, if 6 logos = wider card

      const logoGap = 2  // v16.1: 2px gap between program logos
      const cardPaddingX = 24  // 12px padding each side

      // Calculate the actual logo widths after they would be resized
      // First, estimate the resized logo dimensions
      const maxLogoHeight = Math.floor(rowHeight * 0.96)

      let estimatedTotalLogosWidth = 0
      for (const logo of logoData.verticalLogos) {
        const aspectRatio = logo.width / logo.height
        let estimatedHeight = Math.min(logo.height, maxLogoHeight)
        let estimatedWidth = Math.round(estimatedHeight * aspectRatio)

        // Cap width to reasonable maximum per logo (e.g., 100px)
        const maxWidthPerLogo = 100
        if (estimatedWidth > maxWidthPerLogo) {
          estimatedWidth = maxWidthPerLogo
        }

        estimatedTotalLogosWidth += estimatedWidth
      }

      // Calculate card width: logos + gaps + padding
      const totalGapsWidth = (logoData.verticalLogos.length - 1) * logoGap
      const cardWidth = Math.max(200, estimatedTotalLogosWidth + totalGapsWidth + cardPaddingX)

      // Center the card within stripWidth
      const cardLeft = Math.floor((stripWidth - cardWidth) / 2)

      console.log(`[ROW 2 Dynamic Width] Logos: ${logoData.verticalLogos.length}, Total width: ${estimatedTotalLogosWidth}px, Card: ${cardWidth}px, Left: ${cardLeft}px`)

      // v16.3: Render at cardWidth (dynamic), not stripWidth (full edge-to-edge)
      const verticalRowBuffer = await renderLogoRow(
        cardWidth,   // v16.3: Dynamic width based on logo count!
        rowHeight,
        logoData.verticalLogos,
        'center',    // Center logos within the card
        12,          // v16.3: Adjusted padding for smaller card
        {
          borderRadius: 8,   // v16.0: rounded-lg floating card
          backgroundColor: rowBackgroundColor,
          logoGap: logoGap,  // v16.1: Explicit 2px gap between program logos
        }
      )

      // v16.3: Position at cardLeft (centered) instead of 0
      compositeOps.push({ input: verticalRowBuffer, top: currentY, left: cardLeft })
    } else if (rowType === 'initiative') {
      // v16.4: ROW 3 - Dynamic width floating card (fit-to-text, centered)
      // Same pattern as ROW 2 - card width fits the text, not full edge-to-edge

      const cardPaddingX = 32  // 16px padding each side (slightly more than ROW 2 for text breathing room)

      // Estimate text width
      const fontSize = rows.initiative.fontSize || 18  // Default from InitiativeTextConfig
      const fontWeight = rows.initiative.fontWeight || 'medium'
      const estimatedTextWidth = estimateTextWidth(
        rows.initiative.text,
        fontSize,
        fontWeight
      )

      // Calculate card width: text + padding
      const cardWidth = Math.max(250, estimatedTextWidth + cardPaddingX)

      // Center the card within stripWidth
      const cardLeft = Math.floor((stripWidth - cardWidth) / 2)

      console.log(`[ROW 3 Dynamic Width] Text: "${rows.initiative.text.substring(0, 30)}...", Estimated: ${estimatedTextWidth}px, Card: ${cardWidth}px, Left: ${cardLeft}px`)

      // v16.4: Render at cardWidth (dynamic), not stripWidth (full edge-to-edge)
      const initiativeBuffer = await renderInitiativeText(
        rows.initiative,
        cardWidth,   // v16.4: Dynamic width based on text length!
        rowHeight,
        {
          backgroundColor: rowBackgroundColor,  // White solid background
          borderRadius: 8,  // v16.4: rounded-lg floating card (same as ROW 2)
        }
      )

      // v16.4: Position at cardLeft (centered) instead of 0
      compositeOps.push({ input: initiativeBuffer, top: currentY, left: cardLeft })
    }

    currentY += rowHeight + rowSpacing
  }

  // v15.1: Return transparent strip with individual rows (no unified background)
  // Each row already has its own white background + border radius
  let headerStripBuffer: Buffer

  if (compositeOps.length === 0) {
    // No rows - return empty transparent strip
    headerStripBuffer = await sharp({
      create: { width: stripWidth, height: totalHeight, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
    }).png().toBuffer()
  } else {
    // Create transparent canvas for composite
    headerStripBuffer = await sharp({
      create: {
        width: imageWidth,  // v16.16: Full edge-to-edge width (was stripWidth)
        height: totalHeight,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },  // Transparent - no unified background
      },
    })
      .composite(compositeOps)
      .png()
      .toBuffer()
  }

  return { stripBuffer: headerStripBuffer, stripHeight: totalHeight, stripLeft }
}

/**
 * Create footer strip only (row 4: 3-zone layout)
 * Used in split layout mode where footer is at bottom of image
 *
 * v9.0: 3-Zone Layout Support
 * - Zone 1 (Left): Signature illustration (watercolor/sketch landmark)
 * - Zone 2 (Center): Hashtag + Website URL + Social Media Bar
 * - Zone 3 (Right): Digital Partner label + logo
 */
export async function createEnhanced4RowFooterStrip(
  imageWidth: number,
  config: FooterRowConfig,
  logoData?: {
    partnerLogo?: LogoBufferData
    signatureLogo?: LogoBufferData  // v9.0: Zone 1 signature illustration
  }
): Promise<{ stripBuffer: Buffer; stripHeight: number; stripLeft: number }> {
  if (!config.enabled) {
    return {
      stripBuffer: await sharp({
        create: { width: 1, height: 1, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
      }).png().toBuffer(),
      stripHeight: 0,
      stripLeft: 0,
    }
  }

  // Check if any content exists (v8.0: Removed enabled flag checks - render if content exists, like rows 1-2)
  // v9.0: Added signature check for Zone 1
  const hasContent =
    (config.signature?.enabled && config.signature?.logoId) ||  // Zone 1: Signature
    (config.hashtag.text.trim()) ||                             // Zone 2: Hashtag
    (config.website.url.trim() || config.website.socialHandle?.trim()) ||  // Zone 2: Website/Social
    (config.digitalPartner.logoId || config.digitalPartner.labelText.trim())  // Zone 3: Partner

  console.log('[Footer Debug] Config received:', {
    signature: { enabled: config.signature?.enabled, logoId: config.signature?.logoId },
    hashtag: { text: config.hashtag.text, enabled: config.hashtag.enabled },
    website: { url: config.website.url, handle: config.website.socialHandle, enabled: config.website.enabled },
    partner: { labelText: config.digitalPartner.labelText, logoId: config.digitalPartner.logoId, enabled: config.digitalPartner.enabled },
    hasContent
  })

  if (!hasContent) {
    console.log('[Footer Debug] No content - returning empty strip')
    return {
      stripBuffer: await sharp({
        create: { width: 1, height: 1, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
      }).png().toBuffer(),
      stripHeight: 0,
      stripLeft: 0,
    }
  }

  const { background, height: footerHeight, padding } = config

  // v16.5: Calculate dynamic width for footer based on content
  // Estimate widths of each zone to determine minimum card width
  const zone1Width = (config.signature?.enabled && logoData?.signatureLogo?.buffer)
    ? Math.min(logoData.signatureLogo.width || 200, 350)  // v17.1: Increased from 250px to 350px for better signature visibility in 180px footer
    : 0
  // v16.6: Calculate Zone 3 width from actual partner logo dimensions + label
  const zone3Width = (config.digitalPartner.enabled && logoData?.partnerLogo?.buffer)
    ? Math.max(
      config.digitalPartner.logoSize || 80,  // User-configured logo size
      logoData.partnerLogo.width || 100,     // Actual logo width
      150                                     // Minimum for label + logo + padding
    ) + 40  // Extra padding for label text above logo
    : 0

  // Zone 2 width estimate (hashtag + website + social bar)
  let zone2Width = 0
  if (config.hashtag.text.trim()) {
    zone2Width += estimateTextWidth(config.hashtag.text, config.fontSize + 2, config.fontWeight) + 20
  }
  if (config.website.url.trim()) {
    zone2Width += estimateTextWidth(config.website.url, config.fontSize, 'normal') + 10
  }
  if (config.website.socialHandle?.trim()) {
    zone2Width += estimateTextWidth(config.website.socialHandle, 10, 'medium') + 60  // Icons + padding
  }
  // Add some overlap buffer since items stack vertically
  zone2Width = Math.max(zone2Width * 0.6, zone2Width > 0 ? 150 : 0)

  // Calculate card width with padding and gaps
  const zonePadding = 40  // 20px each side
  const zoneGaps = 10     // v16.8: 5px gap between each zone (2 gaps × 5px = 10px total)
  const contentWidth = zone1Width + zone2Width + zone3Width + zonePadding + zoneGaps
  const minCardWidth = 320
  const maxCardWidth = imageWidth * 0.95

  // v16.5: Dynamic width (fit-to-content), min 320px, max 95% of image
  // CRITICAL: Must be integer for Sharp - floating point values cause "Expected valid width" error
  const stripWidth = Math.floor(Math.min(maxCardWidth, Math.max(minCardWidth, contentWidth)))
  const stripLeft = Math.floor((imageWidth - stripWidth) / 2)  // Center horizontally

  console.log(`[Footer Strip] v16.5 Dynamic width: ${stripWidth}px (zones: ${zone1Width}+${zone2Width}+${zone3Width}), centered at left=${stripLeft}`)

  // v17.2: Create TRANSPARENT base canvas (no duplicate background)
  // The actual styled background is added via SVG below (line 2479)
  let stripBuffer = await sharp({
    create: {
      width: stripWidth,
      height: footerHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },  // Transparent - no duplicate
    },
  }).png().toBuffer()

  // Get background color for SVG rendering
  const bgColor = hexToSharpBackground(background.color, background.opacity)

  // v16.5: Skip old shape mask - use direct SVG background with rounded top corners
  // Apply shape mask if not rectangle (legacy support)
  if (background.shape !== 'rectangle') {
    const shapeSvg = generateStripShapeSVG(stripWidth, footerHeight, background.shape, background.color, background.opacity)
    const shapeMask = await sharp(Buffer.from(shapeSvg)).png().toBuffer()

    stripBuffer = await sharp(stripBuffer)
      .composite([{ input: shapeMask, blend: 'dest-in' }])
      .png()
      .toBuffer()
  }

  // v16.5: Create footer background directly with SVG (same approach as ROW 1/2 fix in v16.3)
  // Rounded top corners (attached to bottom edge), sharp bottom corners
  const borderRadius = 16
  const bgR = bgColor.r
  const bgG = bgColor.g
  const bgB = bgColor.b
  const bgA = bgColor.alpha

  const roundedTopSVG = `
    <svg width="${stripWidth}" height="${footerHeight}">
      <path d="M 0,${borderRadius} Q 0,0 ${borderRadius},0 L ${stripWidth - borderRadius},0 Q ${stripWidth},0 ${stripWidth},${borderRadius} L ${stripWidth},${footerHeight} L 0,${footerHeight} Z" fill="rgba(${bgR},${bgG},${bgB},${bgA})"/>
    </svg>
  `

  // v16.5: Create background directly from SVG (replaces mask approach that caused issues)
  stripBuffer = await sharp(Buffer.from(roundedTopSVG))
    .png()
    .toBuffer()

  // Render footer content (text + optional partner logo + optional signature)
  // v9.0: Added signatureLogo parameter for Zone 1
  const footerContentBuffer = await renderFooterBar(
    config,
    stripWidth,
    footerHeight,
    logoData?.partnerLogo?.buffer,
    logoData?.signatureLogo?.buffer  // v9.0: Zone 1 signature illustration
  )

  // Composite footer content onto background
  stripBuffer = await sharp(stripBuffer)
    .composite([{ input: footerContentBuffer, top: 0, left: 0 }])
    .png()
    .toBuffer()

  return { stripBuffer, stripHeight: footerHeight, stripLeft }
}

/**
 * Apply enhanced 4-row split layout to an image
 *
 * - Header strip (rows 1-3) at TOP
 * - Footer strip (row 4) at BOTTOM
 *
 * v9.0: Added signatureLogo support for Zone 1 (watercolor/sketch landmark)
 */
export async function applyEnhanced4RowStripSplit(
  imageBuffer: Buffer,
  config: Enhanced4RowStripMode,
  logoData: {
    brandLogos: LogoBufferData[]
    verticalLogos: LogoBufferData[]
    partnerLogo?: LogoBufferData
    signatureLogo?: LogoBufferData  // v9.0: Zone 1 signature illustration
  }
): Promise<Buffer> {
  if (!config.enabled || config.version !== '4-row-split') {
    return imageBuffer
  }

  // Get image dimensions
  const metadata = await sharp(imageBuffer).metadata()
  const imageWidth = metadata.width || 1024
  const imageHeight = metadata.height || 1024

  const compositeOps: sharp.OverlayOptions[] = []

  // Create header strip (rows 1-3)
  const { stripBuffer: headerBuffer, stripHeight: headerHeight, stripLeft: headerLeft } =
    await createEnhanced4RowHeaderStrip(imageWidth, config, {
      brandLogos: logoData.brandLogos,
      verticalLogos: logoData.verticalLogos,
    })

  if (headerHeight > 0) {
    compositeOps.push({
      input: headerBuffer,
      top: 0,
      left: headerLeft,
    })
  }

  // Create footer strip (row 4) - v9.0: Now includes signature logo for Zone 1
  const { stripBuffer: footerBuffer, stripHeight: footerHeight, stripLeft: footerLeft } =
    await createEnhanced4RowFooterStrip(imageWidth, config.footer, {
      partnerLogo: logoData.partnerLogo,
      signatureLogo: logoData.signatureLogo,  // v9.0: Zone 1 signature illustration
    })

  if (footerHeight > 0) {
    compositeOps.push({
      input: footerBuffer,
      top: imageHeight - footerHeight,
      left: footerLeft,
    })
  }

  if (compositeOps.length === 0) {
    return imageBuffer
  }

  // Composite both strips onto image
  return await sharp(imageBuffer)
    .composite(compositeOps)
    .png()
    .toBuffer()
}
