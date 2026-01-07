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
  calculateFooterZoneWidths,
  calculateFooterZonePositions,
  calculateSpaceEvenlyPositions,
  type FooterZoneConfig,
} from '@/lib/services/footer-zone-optimizer'

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

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg
  width="${containerWidth}"
  height="${rowHeight}"
  xmlns="http://www.w3.org/2000/svg"
>
  <defs>
    ${filterDef}
    ${gradientDef}
  </defs>
  <text
    x="${x}"
    y="${y}"
    text-anchor="${textAnchor}"
    font-family="${fontFamily}, Poppins, Montserrat, Inter, sans-serif"
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

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg
  width="${containerWidth}"
  height="${rowHeight}"
  xmlns="http://www.w3.org/2000/svg"
>
  <text
    x="${textX}"
    y="${textY}"
    text-anchor="start"
    font-family="Montserrat, Poppins, Inter, sans-serif"
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
    let buffer = await sharp(Buffer.from(svg)).png().toBuffer()

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
    // Create base with text
    let result = await sharp(Buffer.from(svg)).png().toBuffer()

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
 * - Zone 2 (Center): Hashtag + Website URL + Social Media Bar
 * - Zone 3 (Right): Digital Partner label + logo
 *
 * Uses footer-zone-optimizer for intelligent zone width distribution
 * Same algorithm as header strip for visual balance
 *
 * Legacy layout options (for backward compatibility):
 * - spread: Elements distributed across width
 * - center: All elements centered together
 * - left-right: Hashtag/website left, partner right
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
    layout,
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
  const zone2HasContent = !!(
    (hashtag.enabled !== false && hashtag.text.trim()) ||
    (website.enabled !== false && website.url.trim()) ||
    ((socialBar?.enabled ?? true) && website.socialHandle?.trim())
  )
  const zone3HasContent = !!(digitalPartner.enabled && (digitalPartner.logoId || digitalPartner.labelText.trim()))

  // Count Zone 2 content items for density-based width adjustment
  const zone2ContentCount = [
    hashtag.enabled !== false && hashtag.text.trim(),
    website.enabled !== false && website.url.trim(),
    (socialBar?.enabled ?? true) && website.socialHandle?.trim(),
  ].filter(Boolean).length

  // ═══════════════════════════════════════════════════════════════════════════
  // v16.11: ACTUAL CONTENT WIDTH CALCULATION (replaces percentage-based patterns)
  // ═══════════════════════════════════════════════════════════════════════════

  // Calculate Zone 1 actual width (signature logo)
  let zone1ActualWidth = 0
  if (zone1HasContent && signatureWidth > 0) {
    zone1ActualWidth = signatureWidth + 20  // Logo width + small padding
  }

  // Calculate Zone 2 actual width (hashtag + website + social pill)
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
      const pillWidth = estimateTextWidth(socialText, fontSize, fontWeight) + 78  // v18.1: Increased from 60 to 78 (icons + padding + right extension)
      maxWidth = Math.max(maxWidth, pillWidth)
    }

    zone2ActualWidth = maxWidth + 40  // Content + breathing room
  }

  // Calculate Zone 3 actual width (partner label + logo)
  let zone3ActualWidth = 0
  if (zone3HasContent) {
    const labelWidth = digitalPartner.labelText.trim()
      ? estimateTextWidth(digitalPartner.labelText, fontSize - 4, fontWeight)
      : 0
    const logoWidth = actualLogoWidth || digitalPartner.logoSize || 80
    zone3ActualWidth = labelWidth + logoWidth + 40  // Label + logo + padding
  }

  // v16.11: Use actual content widths for positioning
  const zones = [
    { width: zone1ActualWidth, enabled: zone1HasContent },
    { width: zone2ActualWidth, enabled: zone2HasContent },
    { width: zone3ActualWidth, enabled: zone3HasContent },
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
  if (zone3HasContent && positionsArray[posIndex]) {
    zonePositions.zone3 = positionsArray[posIndex]
  }

  // Legacy zone widths for compatibility (now using actual widths)
  const zoneConfig: FooterZoneConfig = {
    zone1Enabled: !!zone1HasContent,
    zone2Enabled: !!zone2HasContent,
    zone3Enabled: !!zone3HasContent,
    zone2ContentCount,
  }
  const zoneWidths = calculateFooterZoneWidths(zoneConfig, containerWidth)

  // Calculate zone center X positions using actual widths
  const zone1CenterX = zonePositions.zone1
    ? zonePositions.zone1.x + zonePositions.zone1.width / 2
    : padding.horizontal
  const zone2CenterX = zonePositions.zone2
    ? zonePositions.zone2.x + zonePositions.zone2.width / 2
    : containerWidth / 2
  const zone3CenterX = zonePositions.zone3
    ? zonePositions.zone3.x + zonePositions.zone3.width / 2
    : containerWidth - padding.horizontal

  // ═══════════════════════════════════════════════════════════════════════════
  // LEGACY SECTION SUPPORT: For backward compatibility
  // ═══════════════════════════════════════════════════════════════════════════

  const sections: FooterSection[] = []
  const gap = zoneWidths.gapSize || 20

  // Map Zone 2 content to sections
  if (zone2HasContent) {
    // Add hashtag section
    if (hashtag.enabled !== false && hashtag.text.trim()) {
      const text = hashtag.text.startsWith('#') ? hashtag.text : `#${hashtag.text}`
      sections.push({
        type: 'hashtag',
        text,
        width: estimateTextWidth(text, fontSize + 2, fontWeight), // Hashtag is slightly larger
        x: zone2CenterX,
      })
    }

    // Add website section
    if ((website.enabled !== false && website.url.trim()) || website.socialHandle?.trim()) {
      const websiteText = website.url.trim()
      const socialText = website.socialHandle?.trim() || ''
      sections.push({
        type: 'website',
        text: websiteText,
        socialHandle: socialText,
        width: estimateTextWidth(websiteText || socialText, fontSize, fontWeight),
        x: zone2CenterX,
      })
    }
  }

  // Map Zone 3 content to sections
  if (zone3HasContent && digitalPartner.labelText.trim()) {
    const partnerText = `${digitalPartner.labelText} ${digitalPartner.separator || ''}`
    const logoWidth = actualLogoWidth || digitalPartner.logoSize
    sections.push({
      type: 'partner',
      text: partnerText,
      width: estimateTextWidth(partnerText, fontSize - 2, fontWeight) + (digitalPartner.logoId ? logoWidth + 10 : 0),
      x: zone3CenterX,
    })
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CALCULATE LOGO POSITIONS
  // ═══════════════════════════════════════════════════════════════════════════

  // Zone 1: Signature logo position
  // v17.2: Vertical optical centering for signature logo
  let signatureLogoX = padding.horizontal
  let signatureLogoY = rowHeight - (signature?.logoId ? rowHeight * 0.8 : 0) // Bottom aligned (fallback)

  if (zonePositions.zone1) {
    signatureLogoX = zonePositions.zone1.x
    // v17.2: Center signature vertically within footer height
    // Signature height is 95% of row height (see line 1041)
    const signatureActualHeight = rowHeight * 0.95
    signatureLogoY = (rowHeight - signatureActualHeight) / 2
  }

  // Zone 3: Partner logo position
  let partnerLogoX = 0
  let partnerLogoY = 0
  let partnerLabelY = 0  // v17.2: Store label Y position for vertical centering
  const partnerSection = sections.find(s => s.type === 'partner')

  if (zone3HasContent && digitalPartner.enabled && digitalPartner.logoId) {
    const logoWidth = actualLogoWidth || digitalPartner.logoSize
    const textWidth = estimateTextWidth(
      `${digitalPartner.labelText} ${digitalPartner.separator || ''}`,
      fontSize - 2,
      fontWeight
    )

    if (zonePositions.zone3) {
      // v17.2: Vertical optical centering for Zone 3
      // Calculate total Zone 3 content height
      const labelFontSize = fontSize  // v18.1: Increased to match base font size (18px) for better visibility (was: fontSize-2)
      const labelHeight = labelFontSize  // v18.1: Removed +4 padding to minimize gap with logo below (was: labelFontSize + 4)
      const logoHeight = digitalPartner.logoSize || 100
      const agencyHeight = digitalPartner.agencyName ? (labelFontSize - 2) + 4 : 0
      const zone3TotalHeight = labelHeight + logoHeight + agencyHeight + 2 + (digitalPartner.agencyName ? 2 : 0)  // v18.1: Add gap sizes (2px label-to-logo, 2px logo-to-agency)

      // Center Zone 3 content group vertically
      const zone3StartY = (rowHeight - zone3TotalHeight) / 2

      // Position elements within centered group
      partnerLogoX = zone3CenterX + textWidth / 2 + 5
      // Label at top of centered group
      partnerLabelY = zone3StartY
      // Logo positioned below label with 2px gap (v18.1: Reduced from 5px to fix excessive spacing)
      partnerLogoY = zone3StartY + labelHeight + 2
    } else {
      // Fallback to legacy calculation
      partnerLogoX = partnerSection
        ? partnerSection.x + textWidth / 2 + gap / 4
        : containerWidth - padding.horizontal - logoWidth
      partnerLogoY = (rowHeight - digitalPartner.logoSize) / 2
    }
  }

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
  const textY = rowHeight / 2 + fontSize * 0.35

  // Zone 2: Render center content (hashtag, website, social bar)
  // v17.2: Vertical optical centering for Zone 2
  // Calculate total Zone 2 content height first, then center it vertically
  if (zone2HasContent && zonePositions.zone2) {
    const zone2X = zone2CenterX

    // Calculate total Zone 2 content height (v17.2)
    const hashtagFontSize = fontSize + 6  // 24px
    let zone2TotalHeight = 0
    if (hashtag.enabled !== false && hashtag.text.trim()) {
      zone2TotalHeight += hashtagFontSize + 6  // Text height + gap
    }
    if (website.enabled !== false && website.url.trim()) {
      zone2TotalHeight += fontSize + 5  // 18px + gap
    }
    if ((socialBar?.enabled ?? true) && website.socialHandle?.trim()) {
      const pillHeight = (fontSize + 2) + 22  // v17.2: 20 + 22 = 42px
      zone2TotalHeight += pillHeight
    }
    // Remove last gap from total
    if (zone2TotalHeight > 6) zone2TotalHeight -= 6

    // Center Zone 2 content vertically (v17.2)
    const zone2VerticalMargin = (rowHeight - zone2TotalHeight) / 2
    let currentY = zone2VerticalMargin

    // Hashtag (primary - large, bold, colored)
    if (hashtag.enabled !== false && hashtag.text.trim()) {
      const hashtagText = hashtag.text.startsWith('#') ? hashtag.text : `#${hashtag.text}`
      const hashtagFontSize = fontSize + 6  // v16.12: Increased from +4 to +6 (18+6=24px)
      svgElements.push(`<text
        x="${zone2X}"
        y="${currentY + hashtagFontSize}"
        text-anchor="middle"
        font-family="Montserrat, Poppins, Inter, sans-serif"
        font-size="${hashtagFontSize}"
        font-weight="700"
        fill="${hashtag.color || '#0B6D41'}"
        text-transform="uppercase"
        letter-spacing="1"
      >${escapeXml(hashtagText)}</text>`)
      currentY += hashtagFontSize + 6  // v16.10: Reduced from 8 to 6
    }

    // Website URL (secondary)
    if (website.enabled !== false && website.url.trim()) {
      svgElements.push(`<text
        x="${zone2X}"
        y="${currentY + fontSize}"
        text-anchor="middle"
        font-family="Montserrat, Poppins, Inter, sans-serif"
        font-size="${fontSize}"
        font-weight="${fontWeightNum}"
        fill="${textColor}"
      >${escapeXml(website.url)}</text>`)
      currentY += fontSize + 5  // v16.10: Reduced from 6 to 5
    }

    // Social Media Bar (dark pill with social handle)
    // v16.10: Increased sizes for better visibility
    if ((socialBar?.enabled ?? true) && website.socialHandle?.trim()) {
      const socialText = website.socialHandle.startsWith('@')
        ? website.socialHandle
        : `@${website.socialHandle}`
      const socialFontSize = fontSize + 2  // v17.2: Increased from 18px to 20px for better readability
      const pillWidth = estimateTextWidth(socialText, socialFontSize, fontWeight) + 78 // v18.1: Increased from 65 to 78 to prevent text cutoff on right edge
      const pillHeight = socialFontSize + 22  // v17.2: Increased from +20 to +22 (20+22=42px total)
      const pillX = zone2X - pillWidth / 2
      const pillY = currentY

      // Dark pill background
      svgElements.push(`<rect
        x="${pillX}"
        y="${pillY}"
        width="${pillWidth}"
        height="${pillHeight}"
        rx="${(socialBar?.borderRadius || 20)}"
        fill="${socialBar?.backgroundColor || '#1a1a1a'}"
      />`)

      // v16.18: ULTRA-OPTIMIZED dynamic icon positioning
      // Calculate professional layout with proper spacing
      const iconRadius = 10  // Icon circle radius (20px diameter)
      const iconPadding = 12  // Left padding from pill edge
      const iconGap = 12  // Gap between icon centers
      const textGap = 15  // Gap from icon 2 edge to text

      // Icon 1 position: left padding + radius (center of first icon)
      const icon1X = pillX + iconPadding + iconRadius

      // Icon 2 position: icon 1 center + gap + radius
      const icon2X = icon1X + (iconRadius * 2) + iconGap

      // Text position: icon 2 right edge + gap + half remaining space
      const textStartX = icon2X + iconRadius + textGap
      const remainingSpace = (pillX + pillWidth) - textStartX
      const textX = textStartX + (remainingSpace / 2)

      // Vertical center for all elements
      const centerY = pillY + pillHeight / 2

      // v17.1: DEBUG - Log icon positions to diagnose visibility issues
      console.log(`[Footer SVG] Social icons debug:`, {
        zone2CenterX,
        pillX,
        pillWidth,
        icon1X,
        icon2X,
        centerY,
        containerWidth,
        rowHeight,
        'icon1_visible': icon1X >= 0 && icon1X <= containerWidth,
        'icon2_visible': icon2X >= 0 && icon2X <= containerWidth,
        'centerY_visible': centerY >= 0 && centerY <= rowHeight,
      })

      // Social icons with dynamic positioning
      // Social icons with dynamic positioning (Instagram & Facebook)
      // v17.1: Replaced placeholder circles with actual SVG paths
      const strokeColor = socialBar?.textColor || '#FFFFFF'
      const strokeWidth = 1.5

      // Instagram Icon (at icon1X)
      // v17.2: Increased from 16px to 18px for better visibility
      const iconSize = 18
      const icon1Left = icon1X - (iconSize / 2)
      const iconTop = centerY - (iconSize / 2)

      svgElements.push(`
        <g transform="translate(${icon1Left}, ${iconTop})">
          <rect width="16" height="16" fill="none"/>
          <rect width="14" height="14" x="1" y="1" rx="4" ry="4" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>
          <circle cx="8" cy="8" r="3" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>
          <circle cx="12.5" cy="3.5" r="1" fill="${strokeColor}"/>
        </g>
      `)

      // Facebook Icon (at icon2X)
      const icon2Left = icon2X - (iconSize / 2)

      svgElements.push(`
        <g transform="translate(${icon2Left}, ${iconTop})">
           <rect width="16" height="16" fill="none"/>
           <path d="M12 1H10C8.67392 1 7.40215 1.52678 6.46447 2.46447C5.52678 3.40215 5 4.67392 5 6V9H3V13H5V21H9V13H12L13 9H9V6C9 5.73478 9.10536 5.48043 9.29289 5.29289C9.48043 5.10536 9.73478 5 10 5H12V1Z" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
        </g>
      `)

      // Social handle text - centered in remaining space after icons
      svgElements.push(`<text
        x="${textX}"
        y="${centerY + socialFontSize * 0.35}"
        text-anchor="middle"
        font-family="Montserrat, Poppins, Inter, sans-serif"
        font-size="${socialFontSize}"
        font-weight="500"
        fill="${socialBar?.textColor || '#FFFFFF'}"
      >${escapeXml(socialText)}</text>`)
    }
  }

  // Zone 3: Render partner label (logo composited separately)
  if (zone3HasContent && zonePositions.zone3 && digitalPartner.labelText.trim()) {
    const labelFontSize = fontSize  // v18.1: Synced with layout calculation (line 729) for 18px consistency (was: fontSize-2)
    // v17.2: Use calculated centered Y position instead of fixed percentage
    const labelY = partnerLabelY || (rowHeight * 0.3)  // Fallback to old position if not set

    svgElements.push(`<text
      x="${zone3CenterX}"
      y="${labelY}"
      text-anchor="middle"
      font-family="Montserrat, Poppins, Inter, sans-serif"
      font-size="${labelFontSize}"
      font-weight="500"
      fill="${digitalPartner.labelColor || '#9CA3AF'}"
      text-transform="uppercase"
      letter-spacing="1.5"
    >${escapeXml(digitalPartner.labelText)}</text>`)

    // Agency name below logo (if provided)
    // v17.2: Position agency name below the centered logo
    if (digitalPartner.agencyName) {
      const agencyY = partnerLogoY + (digitalPartner.logoSize || 100) + 2  // v18.1: Reduced from 5px to 2px for tighter spacing
      svgElements.push(`<text
        x="${zone3CenterX}"
        y="${agencyY}"
        text-anchor="middle"
        font-family="Montserrat, Poppins, Inter, sans-serif"
        font-size="${labelFontSize - 2}"
        font-weight="400"
        fill="${digitalPartner.labelColor || '#9CA3AF'}"
      >${escapeXml(digitalPartner.agencyName)}</text>`)
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FINAL SVG OUTPUT
  // ═══════════════════════════════════════════════════════════════════════════

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg
  width="${containerWidth}"
  height="${rowHeight}"
  viewBox="0 0 ${containerWidth} ${rowHeight}"
  xmlns="http://www.w3.org/2000/svg"
>
    ${svgElements.join('\n    ')}
</svg>`

  return {
    svg,
    partnerLogoX: Math.floor(partnerLogoX),
    partnerLogoY: Math.floor(partnerLogoY),
    signatureLogoX: Math.floor(signatureLogoX),
    signatureLogoY: Math.floor(signatureLogoY),
    zonePositions: {
      zone1X: zone1CenterX,
      zone2X: zone2CenterX,
      zone3X: zone3CenterX,
    },
  }
}

/**
 * Render footer bar to image buffer using Sharp
 *
 * v9.0: 3-Zone Layout Support
 * - Zone 1: signatureLogoBuffer (bottom-left illustration)
 * - Zone 2: Text content (hashtag, website, social bar) - rendered via SVG
 * - Zone 3: partnerLogoBuffer (digital partner logo)
 *
 * Composites logos at positions calculated by footer-zone-optimizer
 */
export async function renderFooterBar(
  config: FooterRowConfig,
  containerWidth: number,
  rowHeight: number,
  partnerLogoBuffer?: Buffer,
  signatureLogoBuffer?: Buffer  // NEW: Zone 1 signature/illustration
): Promise<Buffer> {
  let actualLogoWidth = config.digitalPartner.logoSize
  let actualSignatureWidth = 0

  // Get actual partner logo dimensions if provided
  if (partnerLogoBuffer) {
    try {
      const metadata = await sharp(partnerLogoBuffer).metadata()
      if (metadata.width && metadata.height) {
        actualLogoWidth = Math.floor(
          (metadata.width / metadata.height) * config.digitalPartner.logoSize
        )
      }
    } catch (error) {
      console.error('[SVG Text Renderer] Error getting partner logo metadata:', error)
    }
  }

  // Get actual signature logo dimensions if provided
  if (signatureLogoBuffer && config.signature?.enabled) {
    try {
      const metadata = await sharp(signatureLogoBuffer).metadata()
      if (metadata.width && metadata.height) {
        // Calculate width based on footer height and signature width percentage
        const maxHeight = rowHeight * 0.95  // v17.1: Increased from 0.85 to 0.95
        actualSignatureWidth = Math.floor(
          (metadata.width / metadata.height) * maxHeight
        )
      }
    } catch (error) {
      console.error('[SVG Text Renderer] Error getting signature logo metadata:', error)
    }
  }

  const {
    svg,
    partnerLogoX,
    partnerLogoY,
    signatureLogoX,
    signatureLogoY,
    zonePositions,
  } = generateFooterBarSVG(
    config,
    containerWidth,
    rowHeight,
    actualLogoWidth,
    actualSignatureWidth
  )

  try {
    // Create base with text elements
    let result = await sharp(Buffer.from(svg)).png().toBuffer()

    const composites: Array<{ input: Buffer; left: number; top: number }> = []

    // Zone 1: Composite signature/illustration logo (bottom-left)
    if (signatureLogoBuffer && config.signature?.enabled && config.signature?.logoId) {
      const signatureHeight = Math.floor(rowHeight * 0.95)  // v17.1: Increased from 0.85 to 0.95 to maximize signature visibility in 180px footer
      const signatureWidth = Math.floor(
        (config.signature.width / 100) * containerWidth  // v17.1: Removed 0.8 constraint to allow full zone width
      )

      const resizedSignature = await sharp(signatureLogoBuffer)
        .resize(signatureWidth, signatureHeight, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 },
          position: 'left bottom',
        })
        .png()
        .toBuffer()

      composites.push({
        input: resizedSignature,
        left: signatureLogoX,
        top: Math.floor(rowHeight - signatureHeight),
      })
    }

    // Zone 3: Composite partner logo (right side, below label)
    if (partnerLogoBuffer && config.digitalPartner.enabled && config.digitalPartner.logoId) {
      const partnerLogoHeight = Math.floor(rowHeight * 0.96)  // v17.4: Match ROW 1 sizing (96% of footer height) for prominence
      const resizedLogo = await sharp(partnerLogoBuffer)
        .resize(actualLogoWidth, partnerLogoHeight, {
          fit: 'contain',              // v17.5: Scale to fit without cropping (reverted from 'cover' - matches ROW 1 behavior)
          kernel: 'lanczos3',          // v16.17: Upgrade from cubic to match ROW 1 quality
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toBuffer()

      // Center partner logo within zone 3
      const adjustedX = Math.floor(zonePositions.zone3X - actualLogoWidth / 2)
      // v17.4: Vertically center enlarged logo (96% height) within footer bounds
      const adjustedY = Math.floor((rowHeight - partnerLogoHeight) / 2)

      composites.push({
        input: resizedLogo,
        left: adjustedX,
        top: adjustedY,
      })
    }

    // Apply all composites
    if (composites.length > 0) {
      result = await sharp(result)
        .composite(composites)
        .png()
        .toBuffer()
    }

    return result
  } catch (error) {
    console.error('[SVG Text Renderer] Error rendering footer bar:', error)
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
