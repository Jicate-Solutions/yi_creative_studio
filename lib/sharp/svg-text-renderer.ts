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
    font-family="${fontFamily}, Montserrat, Poppins, Inter, sans-serif"
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
 */
export async function renderInitiativeText(
  config: InitiativeTextConfig,
  containerWidth: number,
  rowHeight: number
): Promise<Buffer> {
  const svg = generateInitiativeTextSVG(config, containerWidth, rowHeight)

  try {
    return await sharp(Buffer.from(svg)).png().toBuffer()
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
          fit: 'contain',
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
 * Generate SVG for footer bar with multiple content sections
 *
 * Layout options:
 * - spread: Elements distributed across width (hashtag left, website center, partner right)
 * - center: All elements centered together
 * - left-right: Hashtag/website left, partner right
 *
 * Returns SVG string and positions for logo compositing
 */
export function generateFooterBarSVG(
  config: FooterRowConfig,
  containerWidth: number,
  rowHeight: number,
  actualLogoWidth: number = 0
): { svg: string; partnerLogoX: number; partnerLogoY: number } {
  const {
    hashtag,
    website,
    digitalPartner,
    layout,
    fontSize,
    fontWeight,
    textColor,
    padding,
  } = config

  const fontWeightNum = fontWeightToNumber(fontWeight)

  // Calculate content sections
  const sections: FooterSection[] = []
  const gap = 20 // Gap between sections

  // Add hashtag section (v8.0: Removed enabled check - render if content exists)
  if (hashtag.text.trim()) {
    const text = hashtag.text.startsWith('#') ? hashtag.text : `#${hashtag.text}`
    sections.push({
      type: 'hashtag',
      text,
      width: estimateTextWidth(text, fontSize, fontWeight),
      x: 0,
    })
  }

  // Add website section (may include social handle on second line)
  if (website.url.trim() || website.socialHandle?.trim()) {
    const websiteText = website.url.trim()
    const socialText = website.socialHandle?.trim() || ''
    // For now, combine them with a line break placeholder
    const displayText = socialText ? `${websiteText}` : websiteText
    sections.push({
      type: 'website',
      text: displayText,
      socialHandle: socialText, // Store for rendering second line
      width: estimateTextWidth(displayText, fontSize, fontWeight),
      x: 0,
    })
  }

  // Add digital partner section
  if (digitalPartner.labelText.trim()) {
    const partnerText = `${digitalPartner.labelText} ${digitalPartner.separator}`
    const logoWidth = actualLogoWidth || digitalPartner.logoSize
    sections.push({
      type: 'partner',
      text: partnerText,
      width: estimateTextWidth(partnerText, fontSize, fontWeight) + gap / 2 + logoWidth,
      x: 0,
    })
  }

  // Calculate positions based on layout
  const usableWidth = containerWidth - padding.horizontal * 2
  const totalContentWidth = sections.reduce((sum, s) => sum + s.width, 0) + (sections.length - 1) * gap

  let currentX = padding.horizontal

  switch (layout) {
    case 'spread':
      // Distribute evenly across width
      if (sections.length === 1) {
        sections[0].x = containerWidth / 2
      } else if (sections.length === 2) {
        sections[0].x = padding.horizontal + sections[0].width / 2
        sections[1].x = containerWidth - padding.horizontal - sections[1].width / 2
      } else if (sections.length === 3) {
        sections[0].x = padding.horizontal + sections[0].width / 2
        sections[1].x = containerWidth / 2
        sections[2].x = containerWidth - padding.horizontal - sections[2].width / 2
      }
      break

    case 'center':
      // Center all content together
      currentX = (containerWidth - totalContentWidth) / 2
      for (const section of sections) {
        section.x = currentX + section.width / 2
        currentX += section.width + gap
      }
      break

    case 'left-right':
      // Hashtag/website on left, partner on right
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i]
        if (section.type === 'partner') {
          section.x = containerWidth - padding.horizontal - section.width / 2
        } else {
          section.x = currentX + section.width / 2
          currentX += section.width + gap
        }
      }
      break
  }

  // Calculate partner logo position
  let partnerLogoX = 0
  let partnerLogoY = 0
  const partnerSection = sections.find(s => s.type === 'partner')
  if (partnerSection && digitalPartner.enabled && digitalPartner.logoId) {
    const logoWidth = actualLogoWidth || digitalPartner.logoSize
    const textWidth = estimateTextWidth(
      `${digitalPartner.labelText} ${digitalPartner.separator}`,
      fontSize,
      fontWeight
    )
    partnerLogoX = partnerSection.x + textWidth / 2 + gap / 4
    partnerLogoY = (rowHeight - digitalPartner.logoSize) / 2
  }

  // Generate SVG
  const textY = rowHeight / 2 + fontSize * 0.35

  // Escape function for XML
  const escapeXml = (str: string) =>
    str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')

  const textElements = sections
    .filter(s => s.type !== 'partner' || !digitalPartner.logoId) // Only render partner text if no logo
    .map(section => {
      if (section.type === 'partner' && digitalPartner.logoId) {
        // Render just the text part, logo will be composited separately
        const textOnly = `${digitalPartner.labelText} ${digitalPartner.separator}`
        const textOnlyWidth = estimateTextWidth(textOnly, fontSize, fontWeight)
        return `<text
          x="${section.x - (section.width - textOnlyWidth) / 2}"
          y="${textY}"
          text-anchor="middle"
          font-family="Montserrat, Poppins, Inter, sans-serif"
          font-size="${fontSize}"
          font-weight="${fontWeightNum}"
          fill="${textColor}"
        >${escapeXml(textOnly)}</text>`
      }
      return `<text
        x="${section.x}"
        y="${textY}"
        text-anchor="middle"
        font-family="Montserrat, Poppins, Inter, sans-serif"
        font-size="${fontSize}"
        font-weight="${fontWeightNum}"
        fill="${textColor}"
      >${escapeXml(section.text)}</text>`
    })
    .join('\n    ')

  // Add website social handle as second line if present (v8.0: Use stored socialHandle from section)
  let socialHandleElement = ''
  const websiteSection = sections.find(s => s.type === 'website')
  if (websiteSection?.socialHandle) {
    const smallerFontSize = Math.max(fontSize - 2, 10)
    socialHandleElement = `<text
      x="${websiteSection.x}"
      y="${textY + fontSize * 0.8}"
      text-anchor="middle"
      font-family="Montserrat, Poppins, Inter, sans-serif"
      font-size="${smallerFontSize}"
      font-weight="${fontWeightNum}"
      fill="${textColor}"
      opacity="0.9"
    >${escapeXml(websiteSection.socialHandle)}</text>`
  }

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg
  width="${containerWidth}"
  height="${rowHeight}"
  xmlns="http://www.w3.org/2000/svg"
>
    ${textElements}
    ${socialHandleElement}
</svg>`

  return {
    svg,
    partnerLogoX: Math.floor(partnerLogoX),
    partnerLogoY: Math.floor(partnerLogoY),
  }
}

/**
 * Render footer bar to image buffer using Sharp
 *
 * If partnerLogoBuffer is provided, composites the logo at the calculated position
 */
export async function renderFooterBar(
  config: FooterRowConfig,
  containerWidth: number,
  rowHeight: number,
  partnerLogoBuffer?: Buffer
): Promise<Buffer> {
  let actualLogoWidth = config.digitalPartner.logoSize

  // Get actual logo dimensions if provided
  if (partnerLogoBuffer) {
    try {
      const metadata = await sharp(partnerLogoBuffer).metadata()
      if (metadata.width && metadata.height) {
        // Resize proportionally to fit height
        actualLogoWidth = Math.floor(
          (metadata.width / metadata.height) * config.digitalPartner.logoSize
        )
      }
    } catch (error) {
      console.error('[SVG Text Renderer] Error getting partner logo metadata:', error)
    }
  }

  const { svg, partnerLogoX, partnerLogoY } = generateFooterBarSVG(
    config,
    containerWidth,
    rowHeight,
    actualLogoWidth
  )

  try {
    // Create base with text
    let result = await sharp(Buffer.from(svg)).png().toBuffer()

    // Composite partner logo if provided
    if (partnerLogoBuffer && config.digitalPartner.enabled && config.digitalPartner.logoId) {
      const resizedLogo = await sharp(partnerLogoBuffer)
        .resize(actualLogoWidth, config.digitalPartner.logoSize, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toBuffer()

      result = await sharp(result)
        .composite([
          {
            input: resizedLogo,
            left: partnerLogoX,
            top: partnerLogoY,
          },
        ])
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
