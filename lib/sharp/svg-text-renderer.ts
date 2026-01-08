/**
 * SVG Text Renderer for Enhanced 4-Row Logo Strip
 *
 * Generates SVG text elements with styling for:
 * - Initiative text (Row 3): "YI Erode Initiative"
 * - Partner label (Row 4): "Digital Partner – [Logo]"
 * - Footer bar (Split Layout): "#Hashtag | Website | Digital Partner – [Logo]"
 *
 * Uses Sharp to convert SVG to image buffers for compositing
 */

import sharp from 'sharp'
import type { InitiativeTextConfig, PartnerLabelConfig, FooterRowConfig } from '@/lib/config/design-constants'
import {
  calculateSpaceEvenlyPositions,
} from '@/lib/services/footer-zone-optimizer'
import { EMBEDDED_FONTS, FontFamily } from '@/lib/config/embedded-fonts'
import { isResvgAvailable, renderSvgWithResvg } from './resvg-renderer'

// CRITICAL DEBUG: Verify embedded fonts are loaded at module initialization
console.log('[SVG Text Renderer] Module loaded - EMBEDDED_FONTS available:', typeof EMBEDDED_FONTS !== 'undefined')
console.log('[SVG Text Renderer] Module loaded - Font families:', Object.keys(EMBEDDED_FONTS || {}))
if (EMBEDDED_FONTS.poppins) {
  console.log('[SVG Text Renderer] Module loaded - Poppins regular length:', EMBEDDED_FONTS.poppins.regular?.length || 0)
}

// Font weight to numeric mapping
const FONT_WEIGHTS: Record<string, number> = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
}

/**
 * Convert font weight string to numeric value
 */
function fontWeightToNumber(weight: string): number {
  return FONT_WEIGHTS[weight] || 400
}

/**
 * Apply text transform to string
 */
function applyTextTransform(
  text: string,
  transform: 'none' | 'uppercase' | 'lowercase' | 'capitalize'
): string {
  switch (transform) {
    case 'uppercase':
      return text.toUpperCase()
    case 'lowercase':
      return text.toLowerCase()
    case 'capitalize':
      return text
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
    default:
      return text
  }
}

/**
 * Get text anchor based on alignment
 */
function getTextAnchor(alignment: 'left' | 'center' | 'right'): string {
  switch (alignment) {
    case 'left':
      return 'start'
    case 'right':
      return 'end'
    default:
      return 'middle'
  }
}

/**
 * Get X position based on alignment
 */
function getXPosition(
  alignment: 'left' | 'center' | 'right',
  width: number,
  padding: number = 20
): number {
  switch (alignment) {
    case 'left':
      return padding
    case 'right':
      return width - padding
    default:
      return width / 2
  }
}

/**
 * Generate CSS @font-face definitions using embedded font constants
 *
 * v19.1: Replaced runtime file loading with build-time embedded fonts
 * Fixes Vercel deployment issue where fonts rendered as boxes (□)
 *
 * Fonts are pre-encoded as base64 constants in lib/config/embedded-fonts.ts
 * No file system access needed - works in serverless environments
 */
function generateFontFaceCSS(fontFamily: string): string {
  // CRITICAL DEBUG: Check if EMBEDDED_FONTS is defined
  console.log('[SVG Text Renderer] === FONT DEBUG START ===')
  console.log('[SVG Text Renderer] EMBEDDED_FONTS defined:', typeof EMBEDDED_FONTS !== 'undefined')
  console.log('[SVG Text Renderer] EMBEDDED_FONTS keys:', Object.keys(EMBEDDED_FONTS || {}))
  console.log('[SVG Text Renderer] Requested font family:', fontFamily)

  // Normalize font family name to lowercase for lookup
  const family = fontFamily.toLowerCase() as FontFamily
  console.log('[SVG Text Renderer] Normalized family:', family)

  // Validate font family exists in embedded fonts
  if (!EMBEDDED_FONTS[family]) {
    console.error(`[SVG Text Renderer] ❌ Unknown font family: ${fontFamily}, using Poppins fallback`)
    console.log('[SVG Text Renderer] Available fonts:', Object.keys(EMBEDDED_FONTS))
    return generateFontFaceCSS('Poppins') // Fallback to Poppins
  }

  const fonts = EMBEDDED_FONTS[family]
  console.log('[SVG Text Renderer] Font data found:', {
    hasRegular: !!fonts.regular,
    hasRegularData: fonts.regular?.startsWith('data:font/woff2'),
    regularLength: fonts.regular?.length || 0,
    hasBold: !!fonts.bold,
    hasBoldData: fonts.bold?.startsWith('data:font/woff2'),
    boldLength: fonts.bold?.length || 0,
  })

  // Generate @font-face CSS with embedded base64 data URIs
  const css = `
    @font-face {
      font-family: "${fontFamily}";
      font-weight: 400;
      src: url('${fonts.regular}') format('woff2');
    }
    @font-face {
      font-family: "${fontFamily}";
      font-weight: 700;
      src: url('${fonts.bold}') format('woff2');
    }
  `

  console.log('[SVG Text Renderer] ✅ Generated @font-face CSS:', css.substring(0, 200) + '...')
  console.log('[SVG Text Renderer] === FONT DEBUG END ===')

  return css
}

/**
 * Generate SVG for initiative text with full styling support
 *
 * Features:
 * - Font family, size, weight, style
 * - Text transform (uppercase, lowercase, capitalize)
 * - Letter spacing
 * - Drop shadow effect
 * - Gradient fill
 */
export function generateInitiativeTextSVG(
  config: InitiativeTextConfig,
  containerWidth: number,
  rowHeight: number
): string {
  const {
    text,
    fontFamily,
    fontSize,
    fontWeight,
    fontStyle,
    color,
    letterSpacing,
    textTransform,
    alignment,
    effects,
  } = config

  // Apply text transform
  const displayText = applyTextTransform(text, textTransform)

  // Calculate positions
  const textAnchor = getTextAnchor(alignment)
  const x = getXPosition(alignment, containerWidth)
  // Vertical centering: baseline at center + 35% of font size
  const y = rowHeight / 2 + fontSize * 0.35

  // Build filter definition for shadow effect
  let filterId = ''
  let filterDef = ''

  if (effects.shadow) {
    filterId = 'initiative-shadow'
    filterDef = `
      <filter id="${filterId}" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow
          dx="${effects.shadowOffsetX}"
          dy="${effects.shadowOffsetY}"
          stdDeviation="${effects.shadowBlur / 2}"
          flood-color="${effects.shadowColor}"
        />
      </filter>
    `
  }

  // Build gradient definition
  let gradientId = ''
  let gradientDef = ''
  let fillAttr = `fill="${color}"`

  if (effects.gradient) {
    gradientId = 'initiative-gradient'
    const isHorizontal = effects.gradientDirection === 'horizontal'

    gradientDef = `
      <linearGradient
        id="${gradientId}"
        x1="${isHorizontal ? '0%' : '50%'}"
        y1="${isHorizontal ? '50%' : '0%'}"
        x2="${isHorizontal ? '100%' : '50%'}"
        y2="${isHorizontal ? '50%' : '100%'}"
      >
        <stop offset="0%" stop-color="${effects.gradientColors[0]}" />
        <stop offset="100%" stop-color="${effects.gradientColors[1]}" />
      </linearGradient>
    `
    fillAttr = `fill="url(#${gradientId})"`
  }

  // Escape special characters for XML
  const escapedText = displayText
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')

  // Embed fonts
  const fontCss = generateFontFaceCSS(fontFamily)

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg
  width="${containerWidth}"
  height="${rowHeight}"
  xmlns="http://www.w3.org/2000/svg"
>
  <defs>
    <style>${fontCss}</style>
    ${filterDef}
    ${gradientDef}
  </defs>
  <text
    x="${x}"
    y="${y}"
    text-anchor="${textAnchor}"
    font-family="${fontFamily}, sans-serif"
    font-size="${fontSize}"
    font-weight="${fontWeightToNumber(fontWeight)}"
    font-style="${fontStyle}"
    letter-spacing="${letterSpacing}"
    ${fillAttr}
    ${filterId ? `filter="url(#${filterId})"` : ''}
  >${escapedText}</text>
</svg>`
}

/**
 * Generate SVG for partner label with logo placeholder positioning
 *
 * Returns SVG and calculated logo position for compositing
 */
export function generatePartnerLabelSVG(
  config: PartnerLabelConfig,
  containerWidth: number,
  rowHeight: number,
  actualLogoWidth: number = 0 // Actual logo width if known
): { svg: string; logoX: number; logoY: number } {
  const {
    labelText,
    separator,
    fontSize,
    fontWeight,
    color,
    alignment,
    logoPosition,
    logoSize,
  } = config

  // Use actual logo width or default to configured size
  const logoWidth = actualLogoWidth || logoSize

  // Estimate text width (rough approximation: ~0.6x font size per character)
  const fullText =
    logoPosition === 'after'
      ? `${labelText} ${separator}`
      : `${separator} ${labelText}`
  const estimatedTextWidth = fullText.length * fontSize * 0.55

  // Calculate total width (text + gap + logo)
  const gap = 12 // Gap between text and logo
  const totalWidth = estimatedTextWidth + gap + logoWidth

  // Calculate starting X based on alignment
  let startX: number
  switch (alignment) {
    case 'left':
      startX = 20
      break
    case 'right':
      startX = containerWidth - 20 - totalWidth
      break
    default:
      startX = (containerWidth - totalWidth) / 2
  }

  // Calculate text and logo positions
  let textX: number
  let logoX: number

  if (logoPosition === 'before') {
    // Logo comes first
    logoX = startX
    textX = startX + logoWidth + gap
  } else {
    // Text comes first (default)
    textX = startX
    logoX = startX + estimatedTextWidth + gap
  }

  // Vertical positions
  const textY = rowHeight / 2 + fontSize * 0.35
  const logoY = (rowHeight - logoSize) / 2

  // Escape text for XML
  const escapedText = fullText
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')

  // Embed font (Montserrat is default for branding)
  const fontCss = generateFontFaceCSS('Montserrat')

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg
  width="${containerWidth}"
  height="${rowHeight}"
  xmlns="http://www.w3.org/2000/svg"
>
  <defs>
    <style>${fontCss}</style>
  </defs>
  <text
    x="${textX}"
    y="${textY}"
    text-anchor="start"
    font-family="Montserrat, sans-serif"
    font-size="${fontSize}"
    font-weight="${fontWeightToNumber(fontWeight)}"
    fill="${color}"
  >${escapedText}</text>
</svg>`

  return {
    svg,
    logoX: Math.floor(logoX),
    logoY: Math.floor(logoY),
  }
}

/**
 * Render initiative text to image buffer using Sharp
 *
 * v16.4: Added optional background support for floating card effect
 */
export async function renderInitiativeText(
  config: InitiativeTextConfig,
  containerWidth: number,
  rowHeight: number,
  options?: {
    backgroundColor?: { r: number; g: number; b: number; alpha: number }
    borderRadius?: number
  }
): Promise<Buffer> {
  const svg = generateInitiativeTextSVG(config, containerWidth, rowHeight)

  try {
    // Use Resvg for font-aware rendering (webpack build with serverExternalPackages)
    let buffer: Buffer

    if (isResvgAvailable()) {
      console.log('[SVG Text Renderer] Using Resvg for initiative text')
      buffer = await renderSvgWithResvg(svg, containerWidth, rowHeight)
    } else {
      console.log('[SVG Text Renderer] Fallback to Sharp for initiative text (fonts not available)')
      buffer = await sharp(Buffer.from(svg)).png().toBuffer()
    }

    // v16.4: Add background with border radius if requested (floating card effect)
    if (options?.backgroundColor && options?.borderRadius) {
      const bgSvg = `<?xml version="1.0" encoding="UTF-8"?>
        <svg width="${containerWidth}" height="${rowHeight}">
          <rect
            width="${containerWidth}"
            height="${rowHeight}"
            rx="${options.borderRadius}"
            ry="${options.borderRadius}"
            fill="rgb(${options.backgroundColor.r}, ${options.backgroundColor.g}, ${options.backgroundColor.b})"
            fill-opacity="${options.backgroundColor.alpha}"
          />
        </svg>
      `
      const bgBuffer = await sharp(Buffer.from(bgSvg)).png().toBuffer()

      // Composite text on top of background
      buffer = await sharp(bgBuffer)
        .composite([{ input: buffer, top: 0, left: 0 }])
        .png()
        .toBuffer()
    }

    return buffer
  } catch (error) {
    console.error('[SVG Text Renderer] Error rendering initiative text:', error)
    // Return transparent fallback
    return await sharp({
      create: {
        width: containerWidth,
        height: rowHeight,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .png()
      .toBuffer()
  }
}

/**
 * Render partner label to image buffer using Sharp
 *
 * If logoBuffer is provided, composites the logo at the calculated position
 */
export async function renderPartnerLabel(
  config: PartnerLabelConfig,
  containerWidth: number,
  rowHeight: number,
  logoBuffer?: Buffer
): Promise<Buffer> {
  let actualLogoWidth = config.logoSize

  // Get actual logo dimensions if provided
  if (logoBuffer) {
    try {
      const metadata = await sharp(logoBuffer).metadata()
      if (metadata.width && metadata.height) {
        // Resize proportionally to fit height
        actualLogoWidth = Math.floor(
          (metadata.width / metadata.height) * config.logoSize
        )
      }
    } catch (error) {
      console.error('[SVG Text Renderer] Error getting logo metadata:', error)
    }
  }

  const { svg, logoX, logoY } = generatePartnerLabelSVG(
    config,
    containerWidth,
    rowHeight,
    actualLogoWidth
  )

  try {
    // Use Resvg for font-aware rendering (webpack build with serverExternalPackages)
    let result: Buffer

    if (isResvgAvailable()) {
      console.log('[SVG Text Renderer] Using Resvg for partner label')
      result = await renderSvgWithResvg(svg, containerWidth, rowHeight)
    } else {
      console.log('[SVG Text Renderer] Fallback to Sharp for partner label (fonts not available)')
      result = await sharp(Buffer.from(svg)).png().toBuffer()
    }

    // Composite logo if provided
    if (logoBuffer && config.logoId) {
      const resizedLogo = await sharp(logoBuffer)
        .resize(actualLogoWidth, config.logoSize, {
          fit: 'contain',              // Keep for layout compatibility
          kernel: 'lanczos3',          // v16.17: Upgrade from cubic to match ROW 1 quality
          withoutEnlargement: true,    // v16.17: Prevent upscaling blur
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toBuffer()

      result = await sharp(result)
        .composite([
          {
            input: resizedLogo,
            left: logoX,
            top: logoY,
          },
        ])
        .png()
        .toBuffer()
    }

    return result
  } catch (error) {
    console.error('[SVG Text Renderer] Error rendering partner label:', error)
    // Return transparent fallback
    return await sharp({
      create: {
        width: containerWidth,
        height: rowHeight,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .png()
      .toBuffer()
  }
}

/**
 * Estimate text width for layout calculations
 *
 * Uses character-based estimation with font size multiplier
 * This is approximate - actual width depends on font metrics
 */
export function estimateTextWidth(
  text: string,
  fontSize: number,
  fontWeight: string = 'normal'
): number {
  // Character width multipliers based on font weight
  const multipliers: Record<string, number> = {
    normal: 0.55,
    medium: 0.57,
    semibold: 0.59,
    bold: 0.6,
  }

  const multiplier = multipliers[fontWeight] || 0.55
  return text.length * fontSize * multiplier
}

// ============================================================
// FOOTER BAR SVG GENERATION (Split Layout - Row 4 at Bottom)
// ============================================================

/**
 * Content section for footer layout calculation
 */
interface FooterSection {
  type: 'hashtag' | 'website' | 'partner'
  text: string
  width: number
  x: number
  socialHandle?: string  // For website section - social handle on second line
}

/**
 * Generate SVG for footer bar with 3-zone layout using AI-powered space-evenly distribution
 *
 * 3-Zone Layout (v9.0):
 * - Zone 1 (Left): Signature illustration (rendered via logo-overlay, not SVG)
 * - Zone 2 (Center): Hashtag + Website URL + Social Media Bar + Supported By (NEW)
 * - Zone 3 (Right): REMOVED (Previous Partner Zone)
 *
 * Uses footer-zone-optimizer for intelligent zone width distribution
 * Same algorithm as header strip for visual balance
 *
 * Returns SVG string and positions for logo compositing
 */
export function generateFooterBarSVG(
  config: FooterRowConfig,
  containerWidth: number,
  rowHeight: number,
  actualLogoWidth: number = 0,
  signatureWidth: number = 0  // Width of Zone 1 signature (from logo-overlay)
): {
  svg: string
  partnerLogoX: number
  partnerLogoY: number
  signatureLogoX: number
  signatureLogoY: number
  zonePositions: { zone1X: number; zone2X: number; zone3X: number }
} {
  const {
    hashtag,
    website,
    digitalPartner,
    signature,
    socialBar,
    fontSize,
    fontWeight,
    textColor,
    padding,
  } = config

  const fontWeightNum = fontWeightToNumber(fontWeight)

  // ═══════════════════════════════════════════════════════════════════════════
  // ZONE ANALYSIS: Determine which zones have content
  // ═══════════════════════════════════════════════════════════════════════════

  const zone1HasContent = !!(signature?.enabled && signature?.logoId)
  // Zone 2 contains previous center content AND partner/supported-by content
  const zone2HasContent = !!(
    (hashtag.enabled !== false && hashtag.text.trim()) ||
    (website.enabled !== false && website.url.trim()) ||
    ((socialBar?.enabled ?? true) && website.socialHandle?.trim()) ||
    (digitalPartner.enabled && (digitalPartner.logoId || digitalPartner.labelText.trim()))
  )
  const zone3HasContent = !!(digitalPartner.enabled && digitalPartner.logoId)

  // ═══════════════════════════════════════════════════════════════════════════
  // v16.11: ACTUAL CONTENT WIDTH CALCULATION
  // ═══════════════════════════════════════════════════════════════════════════

  // Calculate Zone 1 actual width (signature logo)
  let zone1ActualWidth = 0
  if (zone1HasContent && signatureWidth > 0) {
    zone1ActualWidth = signatureWidth + 20  // Logo width + small padding
  }

  // Calculate Zone 2 actual width (hashtag + website + social pill + partner)
  let zone2ActualWidth = 0
  if (zone2HasContent) {
    let maxWidth = 0

    // Hashtag width
    if (hashtag.enabled !== false && hashtag.text.trim()) {
      const hashtagText = hashtag.text.startsWith('#') ? hashtag.text : `#${hashtag.text}`
      const hashtagWidth = estimateTextWidth(hashtagText, fontSize + 4, 'bold')
      maxWidth = Math.max(maxWidth, hashtagWidth)
    }

    // Website URL width
    if (website.enabled !== false && website.url.trim()) {
      const websiteWidth = estimateTextWidth(website.url, fontSize, fontWeight)
      maxWidth = Math.max(maxWidth, websiteWidth)
    }

    // Social pill width
    if ((socialBar?.enabled ?? true) && website.socialHandle?.trim()) {
      const socialText = website.socialHandle.startsWith('@')
        ? website.socialHandle
        : `@${website.socialHandle}`
      const pillWidth = estimateTextWidth(socialText, fontSize, fontWeight) + 78
      maxWidth = Math.max(maxWidth, pillWidth)
    }

    // "Supported By" label width (now in Zone 2, logo is in Zone 3)
    if (digitalPartner.enabled && (digitalPartner.logoId || digitalPartner.labelText)) {
      const labelText = "Supported By"
      const labelWidth = estimateTextWidth(labelText, fontSize - 2, '600')
      maxWidth = Math.max(maxWidth, labelWidth)
    }

    zone2ActualWidth = maxWidth + 40  // Content + breathing room
  }

  // Zone 3 actual width (partner logo - matches signature size)
  let zone3ActualWidth = 0
  if (zone3HasContent && digitalPartner.logoId) {
    // Use signature width as estimate since both logos are now same height
    zone3ActualWidth = signatureWidth > 0 ? signatureWidth + 20 : 120 // Match Zone 1 width
  }

  // v16.11: Use actual content widths for positioning
  const zones = [
    { width: zone1ActualWidth, enabled: zone1HasContent },
    { width: zone2ActualWidth, enabled: zone2HasContent },
    { width: zone3ActualWidth, enabled: zone3HasContent }, // Zone 3 now enabled for partner logo
  ]

  const positionsArray = calculateSpaceEvenlyPositions(zones, containerWidth, padding.horizontal)

  // Map positions array back to zone1/zone2/zone3 structure
  let posIndex = 0
  const zonePositions: {
    zone1: { x: number; width: number } | null
    zone2: { x: number; width: number } | null
    zone3: { x: number; width: number } | null
    gapSize: number
  } = {
    zone1: null,
    zone2: null,
    zone3: null,
    gapSize: 5,
  }

  if (zone1HasContent && positionsArray[posIndex]) {
    zonePositions.zone1 = positionsArray[posIndex]
    posIndex++
  }
  if (zone2HasContent && positionsArray[posIndex]) {
    zonePositions.zone2 = positionsArray[posIndex]
    posIndex++
  }
  // v19.0: ADD ZONE 3 MAPPING (was missing - caused partner logo to overlap with signature)
  if (zone3HasContent && positionsArray[posIndex]) {
    zonePositions.zone3 = positionsArray[posIndex]
    posIndex++
  }

  // Calculate zone center X positions
  const zone1CenterX = zonePositions.zone1
    ? zonePositions.zone1.x + zonePositions.zone1.width / 2
    : padding.horizontal
  const zone2CenterX = zonePositions.zone2
    ? zonePositions.zone2.x + zonePositions.zone2.width / 2
    : containerWidth / 2

  // ═══════════════════════════════════════════════════════════════════════════
  // CALCULATE LOGO POSITIONS
  // ═══════════════════════════════════════════════════════════════════════════

  // Zone 1: Signature logo position
  let signatureLogoX = padding.horizontal
  let signatureLogoY = 0

  if (zonePositions.zone1) {
    signatureLogoX = zonePositions.zone1.x
    const signatureActualHeight = rowHeight * 0.95
    signatureLogoY = (rowHeight - signatureActualHeight) / 2
  }

  // v19.0: Zone 3: Partner logo position (RIGHT side of footer)
  let partnerLogoX = 0
  let partnerLogoY = 0

  if (zonePositions.zone3 && digitalPartner.enabled && digitalPartner.logoId) {
    // Center logo in Zone 3 horizontally
    partnerLogoX = zonePositions.zone3.x + (zonePositions.zone3.width - actualLogoWidth) / 2
    const partnerLogoHeight = rowHeight * 0.95
    partnerLogoY = (rowHeight - partnerLogoHeight) / 2
  }

  // Calculate vertical stack in Zone 2
  // Stack: Hashtag -> Website -> Social Pill -> "Supported By" -> Logo
  // This is a lot of content for one column, so we'll center it all.

  // Calculate heights
  const hHashtag = (hashtag.enabled !== false && hashtag.text.trim()) ? (fontSize + 6 + 6) : 0
  const hWebsite = (website.enabled !== false && website.url.trim()) ? (fontSize + 5) : 0
  const hSocial = ((socialBar?.enabled ?? true) && website.socialHandle?.trim()) ? ((fontSize + 2) + 22) : 0

  const labelFontSize = fontSize // 18px
  // "Supported By" text
  const hPartnerLabel = (digitalPartner.enabled && (digitalPartner.logoId || digitalPartner.labelText)) ? (labelFontSize + 2) : 0
  // Partner Logo
  const hPartnerLogo = (digitalPartner.enabled && digitalPartner.logoId) ? (digitalPartner.logoSize || 80) : 0

  // Zone 2 total height: "Supported By" label at top, then hashtag/website/social
  const totalStackHeight = hPartnerLabel + hHashtag + hWebsite + hSocial
  // Add gap between "Supported By" label and other content if both exist
  const sectionGap = hPartnerLabel && (hHashtag || hWebsite || hSocial) ? 15 : 0

  const finalHeight = totalStackHeight + sectionGap

  let currentY = (rowHeight - finalHeight) / 2

  // ═══════════════════════════════════════════════════════════════════════════
  // GENERATE SVG ELEMENTS
  // ═══════════════════════════════════════════════════════════════════════════

  const escapeXml = (str: string) =>
    str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')

  const svgElements: string[] = []

  // Embed fonts
  const fontCss = generateFontFaceCSS('Montserrat') + generateFontFaceCSS('Poppins')

  // Render Zone 2 Content
  if (zone2HasContent && zonePositions.zone2) {
    const zone2X = zone2CenterX
    let yCursor = currentY

    // 1. "Supported By" Label (TOP of Zone 2)
    if (digitalPartner.enabled && (digitalPartner.logoId || digitalPartner.labelText)) {
      svgElements.push(`<text
        x="${zone2X}"
        y="${yCursor + labelFontSize}"
        text-anchor="middle"
        font-family="Montserrat, sans-serif"
        font-size="${labelFontSize}"
        font-weight="600"
        fill="#666666"
      >${escapeXml("Supported By")}</text>`)

      yCursor += hPartnerLabel
      if (hHashtag || hWebsite || hSocial) {
        yCursor += sectionGap // Add gap if there's other content below
      }
    }

    // 2. Hashtag
    if (hashtag.enabled !== false && hashtag.text.trim()) {
      const hashtagText = hashtag.text.startsWith('#') ? hashtag.text : `#${hashtag.text}`
      const hashtagFontSize = fontSize + 6
      svgElements.push(`<text
        x="${zone2X}"
        y="${yCursor + hashtagFontSize}"
        text-anchor="middle"
        font-family="Montserrat, sans-serif"
        font-size="${hashtagFontSize}"
        font-weight="700"
        fill="#005B96"
      >${escapeXml(hashtagText)}</text>`)
      yCursor += hHashtag
    }

    // 3. Website
    if (website.enabled !== false && website.url.trim()) {
      svgElements.push(`<text
        x="${zone2X}"
        y="${yCursor + fontSize}"
        text-anchor="middle"
        font-family="Poppins, sans-serif"
        font-size="${fontSize}"
        font-weight="bold"
        fill="#333333"
      >${escapeXml(website.url)}</text>`)
      yCursor += hWebsite
    }

    // 4. Social Pill
    if ((socialBar?.enabled ?? true) && website.socialHandle?.trim()) {
      const socialText = website.socialHandle.startsWith('@')
        ? website.socialHandle
        : `@${website.socialHandle}`
      const pillFontSize = fontSize + 2
      const textWidth = estimateTextWidth(socialText, pillFontSize, fontWeight)

      // Get dynamic colors from config (match frontend)
      const pillBgColor = socialBar?.backgroundColor || '#1a1a1a'
      const iconColor = socialBar?.textColor || '#FFFFFF'
      const textColor = socialBar?.textColor || '#FFFFFF'

      const iconSize = 24
      const iconGap = 12
      const sidePadding = 20
      const pillWidth = sidePadding * 2 + iconSize * 2 + iconGap + textWidth
      const pillHeight = 42 // Fixed height
      const pillX = zone2X - pillWidth / 2
      const pillY = yCursor

      // Draw pill background (use dynamic color from config)
      svgElements.push(`<rect
        x="${pillX}"
        y="${pillY}"
        width="${pillWidth}"
        height="${pillHeight}"
        rx="${pillHeight / 2}"
        ry="${pillHeight / 2}"
        fill="${pillBgColor}"
      />`)

      // Icon positioning - centered vertically in pill
      const iconY = pillY + (pillHeight - iconSize) / 2
      const instagramX = pillX + sidePadding
      const facebookX = instagramX + iconSize + iconGap

      // Instagram Icon - Stroke-based (matches frontend)
      svgElements.push(`
        <!-- Instagram Icon -->
        <rect
          x="${instagramX + 2}"
          y="${iconY + 2}"
          width="20"
          height="20"
          rx="5"
          ry="5"
          fill="none"
          stroke="${iconColor}"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <circle
          cx="${instagramX + 12}"
          cy="${iconY + 12}"
          r="4"
          fill="none"
          stroke="${iconColor}"
          stroke-width="1.5"
        />
        <circle
          cx="${instagramX + 17.5}"
          cy="${iconY + 6.5}"
          r="0.5"
          fill="${iconColor}"
        />
      `)

      // Facebook Icon - Stroke-based (matches frontend)
      svgElements.push(`
        <!-- Facebook Icon -->
        <path
          d="M${facebookX + 18} ${iconY + 2} h-3 a5 5 0 0 0 -5 5 v3 H${facebookX + 7} v4 h3 v8 h4 v-8 h3 l1 -4 h-4 V${iconY + 7} a1 1 0 0 1 1 -1 h3 z"
          fill="none"
          stroke="${iconColor}"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      `)

      // Text (use dynamic color from config)
      svgElements.push(`<text
        x="${pillX + sidePadding + iconSize * 2 + iconGap}"
        y="${pillY + pillHeight / 2 + 5}"
        text-anchor="start"
        font-family="Poppins, sans-serif"
        font-size="${pillFontSize}"
        font-weight="500"
        fill="${textColor}"
      >${escapeXml(socialText)}</text>`)

      yCursor += hSocial
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ZONE 3: Partner Logo (Right Container)
  // ═══════════════════════════════════════════════════════════════════════════
  if (zone3HasContent && zonePositions.zone3) {
    const zone3X = zonePositions.zone3.x + zonePositions.zone3.width / 2

    // Partner logo will be composited later in renderFooterBar()
    // Just calculate position here
    if (digitalPartner.enabled && digitalPartner.logoId) {
      const partnerLogoHeight = rowHeight * 0.95 // Match signature logo height
      // Note: actual width will be calculated by Sharp based on aspect ratio
      // For centering, we'll use an estimate based on signatureWidth
      const estimatedWidth = signatureWidth > 0 ? signatureWidth : 100
      partnerLogoX = zone3X - estimatedWidth / 2
      partnerLogoY = (rowHeight - partnerLogoHeight) / 2
    }
  }

  const svgString = `<?xml version="1.0" encoding="UTF-8"?>
<svg
  width="${containerWidth}"
  height="${rowHeight}"
  xmlns="http://www.w3.org/2000/svg"
>
  <defs>
    <style>${fontCss}</style>
  </defs>
  ${svgElements.join('\n')}
</svg>`

  return {
    svg: svgString,
    partnerLogoX: Math.floor(partnerLogoX),
    partnerLogoY: Math.floor(partnerLogoY),
    signatureLogoX: Math.floor(signatureLogoX),
    signatureLogoY: Math.floor(signatureLogoY),
    zonePositions: {
      zone1X: zonePositions.zone1?.x || 0,
      zone2X: zonePositions.zone2?.x || 0,
      zone3X: 0
    }
  }
}

/**
 * Render footer bar to image buffer using Sharp
 *
 * Composites:
 * 1. Base SVG (Hashtag, Website, Social Pill, Text)
 * 2. Signature Logo (Zone 1)
 * 3. Partner Logo (Zone 2 - Centered)
 */
export async function renderFooterBar(
  config: FooterRowConfig,
  containerWidth: number,
  rowHeight: number,
  partnerLogoBuffer?: Buffer,
  signatureLogoBuffer?: Buffer
): Promise<Buffer> {
  // 1. Prepare Partner Logo dimensions
  let actualPartnerLogoWidth = config.digitalPartner.logoSize || 80
  if (config.digitalPartner.enabled && config.digitalPartner.logoId && partnerLogoBuffer) {
    try {
      const metadata = await sharp(partnerLogoBuffer).metadata()
      if (metadata.width && metadata.height) {
        actualPartnerLogoWidth = Math.floor(
          (metadata.width / metadata.height) * (config.digitalPartner.logoSize || 80)
        )
      }
    } catch (e) {
      console.warn('Failed to get partner logo metadata', e)
    }
  }

  // 2. Prepare Signature Logo dimensions
  let actualSignatureWidth = 0
  if (config.signature?.enabled && config.signature.logoId && signatureLogoBuffer) {
    try {
      const metadata = await sharp(signatureLogoBuffer).metadata()
      if (metadata.width && metadata.height) {
        // Constrain by height (e.g., 90% of row height)
        const maxHeight = rowHeight * 0.9
        actualSignatureWidth = Math.floor(
          (metadata.width / metadata.height) * maxHeight
        )
      }
    } catch (e) {
      console.warn('Failed to get signature logo metadata', e)
    }
  }

  // 3. Generate SVG and Positions
  const {
    svg,
    partnerLogoX,
    partnerLogoY,
    signatureLogoX,
    signatureLogoY,
    zonePositions
  } = generateFooterBarSVG(
    config,
    containerWidth,
    rowHeight,
    actualPartnerLogoWidth,
    actualSignatureWidth
  )

  try {
    // 4. Create base rendering from SVG using Resvg (webpack build with serverExternalPackages)
    let result: Buffer

    if (isResvgAvailable()) {
      console.log('[SVG Text Renderer] Using Resvg for footer bar')
      result = await renderSvgWithResvg(svg, containerWidth, rowHeight)
    } else {
      console.log('[SVG Text Renderer] Fallback to Sharp for footer bar (fonts not available)')
      result = await sharp(Buffer.from(svg)).png().toBuffer()
    }

    const composites: sharp.OverlayOptions[] = []

    // 5. Composite Signature Logo (Zone 1)
    if (
      config.signature?.enabled &&
      config.signature.logoId &&
      signatureLogoBuffer &&
      actualSignatureWidth > 0
    ) {
      const resizedSig = await sharp(signatureLogoBuffer)
        .resize({
          width: actualSignatureWidth,
          height: Math.floor(rowHeight * 0.95), // Max height constraint
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png()
        .toBuffer()

      composites.push({
        input: resizedSig,
        left: signatureLogoX,
        top: signatureLogoY,
      })
    }

    // 6. Composite Partner Logo (Zone 3)
    if (
      config.digitalPartner.enabled &&
      config.digitalPartner.logoId &&
      partnerLogoBuffer &&
      actualPartnerLogoWidth > 0
    ) {
      const partnerLogoHeight = rowHeight * 0.95 // Match signature logo height
      const resizedPartner = await sharp(partnerLogoBuffer)
        .resize({
          height: partnerLogoHeight, // Use same height as signature logo
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png()
        .toBuffer()

      composites.push({
        input: resizedPartner,
        left: partnerLogoX,
        top: partnerLogoY,
      })
    }

    // Apply composites if any
    if (composites.length > 0) {
      result = await sharp(result).composite(composites).png().toBuffer()
    }

    return result
  } catch (error) {
    console.error('[SVG Text Renderer] Error rendering footer bar:', error)
    // Return transparent fallback
    const fallback = await sharp({
      create: {
        width: containerWidth,
        height: rowHeight,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .png()
      .toBuffer()

    return fallback
  }
}
