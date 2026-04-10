/**
 * Event Text Overlay (v40.5)
 *
 * Renders event detail text (date, venue, prize structure, registration info)
 * as Sharp SVG overlays with pixel-perfect positioning.
 *
 * v40.5 — Typography enhancement:
 *   - 3D layered shadow text (Montserrat Bold for date/CTA)
 *   - Multi-color gradient fills (secondary yellow → accent white)
 *   - Gradient dark card backgrounds with brand yellow accent bar
 *   - Alternating prize line colors (yellow label → white values)
 *   - Drop shadow filters on icons and venue text
 *   - CTA: gradient background + yellow border stroke
 *
 * Gemini still renders the headline + tagline (creative typography).
 * Sharp handles all structured data (dates, venues, details, CTA).
 *
 * Uses text-to-path (opentype.js) for font-independent SVG rendering.
 */

import sharp from 'sharp'
import { textToPath, getTextWidth } from './text-to-path'

// ============================================================
// TYPES
// ============================================================

export interface EventTextData {
  headline?: string          // "Awareness Program on Menstrual Health & Hygiene"
  tagline?: string           // "Break taboos and empower minds..."
  dateTime?: string          // "Sun, 12 Apr, 2026 | 3:16 PM"
  venue?: string             // "JKKN INSTITUTIONS, KUMARAPALAYAM BYPASS"
  additionalDetails?: string // Prize structure as single string
  registrationInfo?: string  // CTA text
  speakers?: Array<{ name: string; designation?: string }> // Speakers without photos
}

export interface EventTextOverlayConfig {
  canvasWidth: number
  canvasHeight: number
  /** Where Sharp should render text (percentage of canvas) */
  renderZone: {
    startPercent: number  // e.g., 40 (just below logo bar zone)
    endPercent: number    // e.g., 83 (above footer bar)
  }
  brandColors: {
    primary: string    // e.g., "#107023"
    secondary: string  // e.g., "#fcff33"
    accent: string     // e.g., "#faf9f4"
  }
}

// ============================================================
// COLOR HELPERS
// ============================================================

function getLuminance(hex: string): number {
  const clean = hex.replace('#', '').padEnd(6, '0')
  const [r, g, b] = (clean.match(/.{2}/g) ?? ['ff','ff','ff'])
    .map(h => { const c = parseInt(h, 16) / 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4) })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/**
 * Pick the brand color that reads best over a dark background.
 * Tries accent → secondary → primary → falls back to white.
 */
function getBestLightColor(brandColors: { primary: string; secondary: string; accent: string }): string {
  const candidates = [brandColors.accent, brandColors.secondary, brandColors.primary, '#FFFFFF']
  for (const c of candidates) {
    if (getLuminance(c) > 0.20) return c
  }
  return '#FFFFFF'
}

/**
 * Pick the brand color that reads best over a light background.
 * Tries primary → secondary → accent → falls back to near-black.
 */
function getBestDarkColor(brandColors: { primary: string; secondary: string; accent: string }): string {
  const candidates = [brandColors.primary, brandColors.secondary, brandColors.accent, '#1A1A1A']
  for (const c of candidates) {
    if (getLuminance(c) < 0.25) return c
  }
  return '#1A1A1A'
}

/**
 * Sample the average greyscale luminance of the image in the content zone.
 * Uses a 20×20 thumbnail for speed. Returns 0 (black) → 1 (white).
 */
async function sampleBackgroundLuminance(
  imageBuffer: Buffer,
  zoneStartPx: number,
  zoneEndPx: number,
  canvasWidth: number,
  canvasHeight: number
): Promise<number> {
  try {
    const top = Math.max(0, zoneStartPx)
    const height = Math.min(zoneEndPx - top, canvasHeight - top)
    if (height <= 0) return 0.15  // assume dark

    const { data } = await sharp(imageBuffer)
      .extract({ left: 0, top, width: canvasWidth, height })
      .resize(20, 20, { fit: 'fill' })
      .greyscale()
      .raw()
      .toBuffer({ resolveWithObject: true })

    let sum = 0
    for (let i = 0; i < data.length; i++) sum += (data as Buffer)[i]
    return sum / data.length / 255
  } catch {
    return 0.15  // fallback: assume dark
  }
}

// ============================================================
// CONSTANTS
// ============================================================

const FONT_FAMILY = 'poppins'           // Default: venue, details
const DATE_FONT_FAMILY = 'poppins'      // Montserrat .ttf files are invalid (WOFF2 signatures) — use poppins
const CTA_FONT_FAMILY = 'poppins'       // Same — poppins bold confirmed working

const INFO_CARD_RADIUS = 14
const CARD_PADDING_X = 24
const CARD_PADDING_Y = 14
const LINE_SPACING = 6
const SECTION_GAP = 10

// Font sizes (calibrated for 1080×1440 canvas — v40.5)
const DATE_FONT_SIZE = 30
const VENUE_FONT_SIZE = 24
const DETAILS_FONT_SIZE = 20
const CTA_FONT_SIZE = 18

// SVG path icons (simple calendar and pin icons)
const CALENDAR_ICON = (x: number, y: number, size: number, fill: string) =>
  `<g filter="url(#evt-icon-shadow)" transform="translate(${x},${y - size}) scale(${size / 24})">
    <path d="M19 3h-1V1h-2v2H8V1H6v2H5C3.89 3 3 3.9 3 5v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z" fill="${fill}"/>
  </g>`

const PIN_ICON = (x: number, y: number, size: number, fill: string) =>
  `<g filter="url(#evt-icon-shadow)" transform="translate(${x},${y - size}) scale(${size / 24})">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="${fill}"/>
  </g>`

// ============================================================
// MAIN FUNCTION
// ============================================================

/**
 * Render event detail text onto the image using Sharp
 */
export async function renderEventTextOverlay(
  imageBuffer: Buffer,
  eventData: EventTextData,
  config: EventTextOverlayConfig
): Promise<Buffer> {
  const { canvasWidth, canvasHeight, renderZone, brandColors } = config

  // Skip if no detail data to render
  if (!eventData.headline && !eventData.tagline && !eventData.dateTime && !eventData.venue && !eventData.additionalDetails && !eventData.registrationInfo) {
    return imageBuffer
  }

  const zoneStartPx = Math.floor(canvasHeight * renderZone.startPercent / 100)
  const zoneEndPx = Math.floor(canvasHeight * renderZone.endPercent / 100)
  const availableHeight = zoneEndPx - zoneStartPx

  console.log(`[Event Text Overlay] Rendering details in ${renderZone.startPercent}-${renderZone.endPercent}% zone (${zoneStartPx}-${zoneEndPx}px, ${availableHeight}px available)`)

  try {
    // Sample background luminance to decide dark-on-light vs light-on-dark text
    const bgLuminance = await sampleBackgroundLuminance(imageBuffer, zoneStartPx, zoneEndPx, canvasWidth, canvasHeight)
    const bgIsDark = bgLuminance < 0.50
    console.log(`[Event Text Overlay] Background luminance: ${bgLuminance.toFixed(3)} → ${bgIsDark ? 'DARK bg (light text)' : 'LIGHT bg (dark text)'}`)

    // Build SVG elements
    const svgElements: string[] = []

    let currentY = zoneStartPx

    // ── HEADLINE + TAGLINE (Sharp-rendered, replaces Gemini text) ──
    if (eventData.headline || eventData.tagline) {
      const headlineResult = buildHeadlineBlock(
        eventData.headline,
        eventData.tagline,
        canvasWidth,
        currentY,
        zoneEndPx,
        brandColors,
        bgIsDark
      )
      svgElements.push(headlineResult.svg)
      currentY = headlineResult.bottomY + SECTION_GAP * 2
    }

    // ── INFO CARD (Date + Venue) ──
    if (eventData.dateTime || eventData.venue) {
      const cardResult = buildInfoCard(
        eventData.dateTime,
        eventData.venue,
        canvasWidth,
        currentY,
        brandColors,
        bgIsDark
      )
      svgElements.push(cardResult.svg)
      currentY = cardResult.bottomY + SECTION_GAP
    }

    // ── SPEAKERS (name + designation, for speakers without photos) ──
    if (eventData.speakers && eventData.speakers.length > 0) {
      const speakerResult = buildSpeakerBlock(
        eventData.speakers,
        canvasWidth,
        currentY,
        zoneEndPx,
        brandColors,
        bgIsDark
      )
      if (speakerResult.svg) {
        svgElements.push(speakerResult.svg)
        currentY = speakerResult.bottomY + SECTION_GAP
      }
    }

    // ── ADDITIONAL DETAILS (Prize Structure) ──
    if (eventData.additionalDetails) {
      const detailsResult = buildAdditionalDetails(
        eventData.additionalDetails,
        canvasWidth,
        currentY,
        zoneEndPx,
        brandColors
      )
      svgElements.push(detailsResult.svg)
      currentY = detailsResult.bottomY + SECTION_GAP
    }

    // ── REGISTRATION INFO (CTA) ──
    // v43.1: Only skip if truly no space (< 24px) — adaptive sizing handles tight zones
    if (eventData.registrationInfo && currentY < zoneEndPx - 24) {
      const ctaResult = buildRegistrationCTA(
        eventData.registrationInfo,
        canvasWidth,
        currentY,
        zoneEndPx,
        brandColors
      )
      svgElements.push(ctaResult.svg)
    }

    if (svgElements.length === 0) {
      return imageBuffer
    }

    // Inject <defs> with gradients + filters (adaptive based on bg luminance)
    const svgDefs = buildSvgDefs(brandColors, bgIsDark)

    // Build full SVG
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${canvasWidth}" height="${canvasHeight}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    ${svgDefs}
  </defs>
  ${svgElements.join('\n  ')}
</svg>`

    // Render SVG to PNG buffer
    const textBuffer = await sharp(Buffer.from(svg))
      .png()
      .toBuffer()

    // Composite onto image
    const result = await sharp(imageBuffer)
      .composite([{ input: textBuffer, top: 0, left: 0 }])
      .png()
      .toBuffer()

    console.log(`[Event Text Overlay] ✅ Rendered ${svgElements.length} text sections`)
    return result
  } catch (error) {
    console.error('[Event Text Overlay] ❌ Failed (non-fatal, using original):', error)
    return imageBuffer
  }
}

// ============================================================
// SVG DEFS (gradients + filters) — v40.5
// ============================================================

/**
 * Build <defs> content: gradients for text/cards, drop shadow filters for icons/text
 */
function buildSvgDefs(brandColors: { primary: string; secondary: string; accent: string }, bgIsDark: boolean): string {
  return `
    <!-- Date text gradient: secondary yellow → accent white (dark bg) OR primary dark (light bg) -->
    <linearGradient id="evt-date-grad" x1="0%" y1="0%" x2="100%" y2="0%">
      ${bgIsDark
        ? `<stop offset="0%"   stop-color="${brandColors.secondary}"/>
           <stop offset="55%"  stop-color="${brandColors.accent}"/>
           <stop offset="100%" stop-color="${brandColors.secondary}" stop-opacity="0.85"/>`
        : `<stop offset="0%"   stop-color="${brandColors.primary}"/>
           <stop offset="55%"  stop-color="#1A1A1A"/>
           <stop offset="100%" stop-color="${brandColors.primary}" stop-opacity="0.85"/>`
      }
    </linearGradient>

    <!-- CTA bg gradient: primary brand color fading right -->
    <linearGradient id="evt-cta-grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%"   stop-color="${brandColors.primary}" stop-opacity="1"/>
      <stop offset="100%" stop-color="${brandColors.primary}" stop-opacity="0.65"/>
    </linearGradient>

    <!-- Icon drop shadow -->
    <filter id="evt-icon-shadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="1" dy="1" stdDeviation="1.5" flood-color="#000000" flood-opacity="0.7"/>
    </filter>

    <!-- General text drop shadow — for venue, tagline, details -->
    <filter id="evt-text-shadow" x="-15%" y="-15%" width="130%" height="130%">
      <feDropShadow dx="2" dy="2" stdDeviation="3" flood-color="#000000" flood-opacity="0.92"/>
    </filter>

    <!-- Headline outline via feMorphology dilate — adds crisp dark border around glyphs -->
    <!-- Works on SVG path elements: expands SourceAlpha, composites with black, merges under SourceGraphic -->
    <filter id="evt-headline-outline" x="-5%" y="-10%" width="110%" height="120%">
      <feMorphology in="SourceAlpha" operator="dilate" radius="3" result="expanded"/>
      <feFlood flood-color="#000000" result="outlineColor"/>
      <feComposite in="outlineColor" in2="expanded" operator="in" result="outline"/>
      <feMerge>
        <feMergeNode in="outline"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>

    <!-- Headline combined: outline + heavy drop shadow for maximum contrast -->
    <!-- Uses explicit primitives (not feDropShadow shorthand) so intermediate results stay separate -->
    <filter id="evt-headline-strong" x="-15%" y="-20%" width="130%" height="140%">
      <!-- Outline: dilate alpha → flood black → mask to outline shape -->
      <feMorphology in="SourceAlpha" operator="dilate" radius="2.5" result="expanded"/>
      <feFlood flood-color="#000000" result="outlineFlood"/>
      <feComposite in="outlineFlood" in2="expanded" operator="in" result="outline"/>
      <!-- Drop shadow: offset alpha → blur → flood black → mask to blur shape -->
      <feOffset in="SourceAlpha" dx="3" dy="4" result="shadowOffset"/>
      <feGaussianBlur in="shadowOffset" stdDeviation="5" result="shadowBlur"/>
      <feFlood flood-color="#000000" flood-opacity="0.88" result="shadowFlood"/>
      <feComposite in="shadowFlood" in2="shadowBlur" operator="in" result="shadow"/>
      <!-- Merge back-to-front: shadow → outline → original fill -->
      <feMerge>
        <feMergeNode in="shadow"/>
        <feMergeNode in="outline"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  `
}

// ============================================================
// 3D TEXT HELPER — v40.5
// ============================================================

/**
 * Render text with layered 3D shadow effect.
 * Produces N offset shadow copies (darker behind) + the main text on top.
 *
 * @param text         - Text string to render
 * @param options      - textToPath options (x, y, fill = gradient URL or color)
 * @param shadowColor  - Color for shadow layers (default near-black)
 * @param depth        - Number of shadow layers (default 3)
 */
function text3D(
  text: string,
  options: Parameters<typeof textToPath>[1],
  shadowColor = '#000000',
  depth = 3
): string {
  const layers: string[] = []
  const baseX = options.x ?? 0
  const baseY = options.y ?? 0

  // Shadow layers — rendered back-to-front (largest offset first = deepest)
  for (let i = depth; i >= 1; i--) {
    const opacity = (i / depth) * 0.55  // depth=3: i=3→0.55, i=2→0.37, i=1→0.18
    const shadowPath = textToPath(text, {
      ...options,
      x: baseX + i,
      y: baseY + i,
      fill: shadowColor,
    })
    layers.push(`<g opacity="${opacity.toFixed(2)}">${shadowPath}</g>`)
  }

  // Main text on top (uses caller's fill — gradient URL or solid color)
  layers.push(textToPath(text, options))

  return layers.join('\n')
}

// ============================================================
// BUILDERS
// ============================================================

/**
 * Build headline + tagline block — v43.1 adaptive font sizing
 *
 * Tries font sizes from largest to smallest (72→64→56→48→40 for headline,
 * 28→24→20→18 for tagline) until ALL lines fit within the available zone.
 * No lines are ever silently dropped — content always renders completely.
 */
function buildHeadlineBlock(
  headline: string | undefined,
  tagline: string | undefined,
  canvasWidth: number,
  startY: number,
  zoneEndPx: number,
  brandColors: { primary: string; secondary: string; accent: string },
  bgIsDark: boolean
): { svg: string; bottomY: number } {
  const elements: string[] = []
  const PADDING_X = 60
  const maxTextWidth = canvasWidth - PADDING_X * 2
  const BG_PADDING_TOP = 24
  const BG_PADDING_BOTTOM = 28
  const availableHeight = zoneEndPx - startY

  // v43.1: Adaptive sizing — step down until everything fits, never drop lines
  const HEADLINE_SIZES = [72, 64, 56, 48, 40]
  const TAGLINE_SIZES  = [28, 24, 20, 18]

  let headlineSize = 40  // fallback minimum
  let taglineSize  = 18
  let headlineLines: string[] = headline ? wrapText(headline, 'poppins', 40, 'bold', maxTextWidth) : []
  let taglineLines: string[]  = tagline  ? wrapText(tagline, 'poppins', 18, 'regular', maxTextWidth) : []

  // Find the largest combo (headline size × tagline size) where everything fits
  outer: for (const hs of HEADLINE_SIZES) {
    const hLines = headline ? wrapText(headline, 'poppins', hs, 'bold', maxTextWidth) : []
    const lineH  = hs * 1.15
    for (const ts of TAGLINE_SIZES) {
      const tLines = tagline ? wrapText(tagline, 'poppins', ts, 'regular', maxTextWidth) : []
      const tagH   = ts * 1.3
      const totalH = BG_PADDING_TOP + hLines.length * lineH + 16 + tLines.length * tagH + BG_PADDING_BOTTOM
      if (totalH <= availableHeight) {
        headlineSize  = hs
        taglineSize   = ts
        headlineLines = hLines
        taglineLines  = tLines
        break outer
      }
    }
  }

  if (headlineLines.length === 0 && taglineLines.length === 0) {
    return { svg: '', bottomY: startY }
  }

  const LINE_HEIGHT        = headlineSize * 1.15
  const TAGLINE_LINE_HEIGHT = taglineSize * 1.3

  // === Compute scrim height to cover all text ===
  const headlineTotalH = headlineLines.length * LINE_HEIGHT + 16
  const taglineTotalH  = taglineLines.length * TAGLINE_LINE_HEIGHT + 8
  const bgHeight = BG_PADDING_TOP + headlineTotalH + taglineTotalH + BG_PADDING_BOTTOM

  // v44.2: Scrim removed — text renders directly over Gemini background.
  // Readability comes from the 2-layer text shadow + outline applied below.

  // === Render ALL headline lines (no zone-break guard — sizing guarantees fit) ===
  let currentY = startY + BG_PADDING_TOP
  const shadowFillA = bgIsDark ? 'rgba(0,0,0,0.75)'  : 'rgba(255,255,255,0.65)'
  const shadowFillB = bgIsDark ? 'rgba(0,0,0,0.90)' : 'rgba(255,255,255,0.45)'
  const headlineColor = bgIsDark ? getBestLightColor(brandColors) : getBestDarkColor(brandColors)

  for (const line of headlineLines) {
    currentY += LINE_HEIGHT
    elements.push(`<g opacity="0.8">${textToPath(line, {
      fontFamily: 'poppins', fontSize: headlineSize, fontWeight: 'bold',
      x: PADDING_X + 6, y: currentY + 6, fill: shadowFillA, textAnchor: 'start',
    })}</g>`)
    elements.push(`<g opacity="0.95">${textToPath(line, {
      fontFamily: 'poppins', fontSize: headlineSize, fontWeight: 'bold',
      x: PADDING_X + 3, y: currentY + 3, fill: shadowFillB, textAnchor: 'start',
    })}</g>`)
    elements.push(`<g filter="url(#evt-headline-strong)">${textToPath(line, {
      fontFamily: 'poppins', fontSize: headlineSize, fontWeight: 'bold',
      x: PADDING_X, y: currentY, fill: headlineColor, textAnchor: 'start',
    })}</g>`)
  }
  currentY += 16

  // === Render ALL tagline lines ===
  const taglineColor = bgIsDark
    ? (getLuminance(brandColors.secondary) > 0.20 ? brandColors.secondary : (getLuminance(brandColors.accent) > 0.20 ? brandColors.accent : '#E8E8E8'))
    : getBestDarkColor(brandColors)

  for (const line of taglineLines) {
    currentY += TAGLINE_LINE_HEIGHT
    elements.push(`<g filter="url(#evt-text-shadow)">${textToPath(line, {
      fontFamily: 'poppins', fontSize: taglineSize, fontWeight: 'regular',
      x: PADDING_X, y: currentY, fill: taglineColor, textAnchor: 'start',
    })}</g>`)
  }
  currentY += BG_PADDING_BOTTOM

  console.log(`[Headline Block] Font: ${headlineSize}px headline / ${taglineSize}px tagline | Lines: ${headlineLines.length}h + ${taglineLines.length}t | Height: ${Math.round(currentY - startY)}px`)
  return { svg: elements.join('\n'), bottomY: currentY }
}

/**
 * Build the info card (date + venue) — v40.5 enhanced
 * - Date: Montserrat Bold + yellow→white gradient + 3D shadow
 * - Venue: Poppins Regular + drop shadow filter
 * - Card bg: gradient dark overlay + secondary-color left accent bar
 * - Icons: 26px with drop shadow filter
 */
function buildInfoCard(
  dateTime: string | undefined,
  venue: string | undefined,
  canvasWidth: number,
  startY: number,
  brandColors: { primary: string; secondary: string; accent: string },
  bgIsDark: boolean
): { svg: string; bottomY: number } {
  const elements: string[] = []
  const iconSize = 26  // v40.5: 20 → 26
  const iconGap = 10
  let textY = startY + CARD_PADDING_Y + DATE_FONT_SIZE

  // Measure text widths to calculate card width (use montserrat for date)
  let maxTextWidth = 0
  if (dateTime) {
    const w = getTextWidth(dateTime, DATE_FONT_FAMILY, DATE_FONT_SIZE, 'bold')
    maxTextWidth = Math.max(maxTextWidth, w + iconSize + iconGap)
  }
  if (venue) {
    const w = getTextWidth(venue, FONT_FAMILY, VENUE_FONT_SIZE, 'regular')
    maxTextWidth = Math.max(maxTextWidth, w + iconSize + iconGap)
  }

  const cardWidth = Math.min(maxTextWidth + CARD_PADDING_X * 2, canvasWidth - 60)
  const cardX = Math.floor((canvasWidth - cardWidth) / 2)
  const innerTextStartX = cardX + CARD_PADDING_X + iconSize + iconGap

  // Date line — Montserrat Bold, gradient fill, 3D shadow
  if (dateTime) {
    const date3d = text3D(
      dateTime,
      {
        fontFamily: DATE_FONT_FAMILY,
        fontSize: DATE_FONT_SIZE,
        fontWeight: 'bold',
        x: innerTextStartX,
        y: textY,
        fill: 'url(#evt-date-grad)',
      },
      '#000000',
      3
    )
    elements.push(date3d)
    elements.push(CALENDAR_ICON(cardX + CARD_PADDING_X, textY, iconSize, bgIsDark ? brandColors.secondary : getBestDarkColor(brandColors)))
    textY += DATE_FONT_SIZE + LINE_SPACING
  }

  // Venue — word-wrap up to 2 lines instead of character-level truncation
  // v43.1: wrapText prevents "JKKN INSTITUTIONS, KUMARAPALAYAM BYPASS" from being clipped to "JKKN INST..."
  if (venue) {
    const maxVenueWidth = cardWidth - CARD_PADDING_X * 2 - iconSize - iconGap
    const venueLines = wrapText(venue, FONT_FAMILY, VENUE_FONT_SIZE, 'regular', maxVenueWidth).slice(0, 2)
    const venueFill = bgIsDark ? '#E8E8E8' : getBestDarkColor(brandColors)
    const iconFill = bgIsDark ? brandColors.secondary : getBestDarkColor(brandColors)
    // Pin icon anchored to first line
    elements.push(PIN_ICON(cardX + CARD_PADDING_X, textY, iconSize, iconFill))
    for (const vLine of venueLines) {
      const venuePath = textToPath(vLine, {
        fontFamily: FONT_FAMILY,
        fontSize: VENUE_FONT_SIZE,
        fontWeight: 'regular',
        x: innerTextStartX,
        y: textY,
        fill: venueFill,
      })
      elements.push(`<g filter="url(#evt-text-shadow)">${venuePath}</g>`)
      textY += VENUE_FONT_SIZE + LINE_SPACING
    }
  }

  const cardHeight = textY - startY + CARD_PADDING_Y

  // v44.5: Sharp card disabled — Gemini bakes frosted cards into scene via prompt
  // Left accent bar (secondary color) — visual grouping cue
  const accentBar = `<rect x="${cardX}" y="${startY + 6}" width="4" height="${cardHeight - 12}" rx="2" ry="2" fill="${brandColors.secondary}"/>`

  return {
    svg: `<g data-section="info-card">
      ${accentBar}
      ${elements.join('\n      ')}
    </g>`,
    bottomY: startY + cardHeight,
  }
}

/**
 * Build additional details text (prize structure) — v43.1 adaptive font sizing
 * Steps font size down (20→16→13px) until ALL entries fit in remaining zone.
 * Accepts semicolons, pipes (|), or newlines as entry delimiters.
 */
function buildAdditionalDetails(
  details: string,
  canvasWidth: number,
  startY: number,
  maxY: number,
  brandColors: { primary: string; secondary: string; accent: string }
): { svg: string; bottomY: number } {
  const margin = 50
  const maxWidth = canvasWidth - margin * 2
  const availableHeight = maxY - startY

  // Split on semicolons, pipes, or newlines
  const entries = details.split(/[;\n|]/).map(l => l.trim()).filter(Boolean)
  if (entries.length === 0) return { svg: '', bottomY: startY }

  // Adaptive font sizing: find largest size where all entries fit
  const DETAIL_SIZES = [20, 16, 13]
  let fontSize = 13
  let allWrapped: string[][] = []

  for (const fs of DETAIL_SIZES) {
    const wrapped = entries.map(e => wrapText(e, FONT_FAMILY, fs, 'bold', maxWidth))
    const totalLines = wrapped.reduce((sum, w) => sum + w.length, 0)
    const totalH = totalLines * (fs + 4) + 10
    if (totalH <= availableHeight) {
      fontSize = fs
      allWrapped = wrapped
      break
    }
    // At smallest size, use it regardless (render what fits without breaking)
    if (fs === 13) {
      allWrapped = wrapped
    }
  }

  const elements: string[] = []
  let currentY = startY
  let lineIndex = 0

  for (const wrappedLines of allWrapped) {
    for (const wLine of wrappedLines) {
      const textY = currentY + fontSize

      if (lineIndex === 0) {
        elements.push(text3D(wLine, {
          fontFamily: FONT_FAMILY, fontSize, fontWeight: 'bold',
          x: canvasWidth / 2, y: textY,
          fill: brandColors.secondary, textAnchor: 'middle',
        }, '#000000', 2))
      } else {
        const path = textToPath(wLine, {
          fontFamily: FONT_FAMILY, fontSize, fontWeight: 'bold',
          x: canvasWidth / 2, y: textY, fill: '#FFFFFF', textAnchor: 'middle',
        })
        elements.push(`<g filter="url(#evt-text-shadow)">${path}</g>`)
      }

      currentY += fontSize + 4
      lineIndex++
    }
  }

  if (elements.length === 0) return { svg: '', bottomY: startY }

  // v44.5: Sharp bg disabled — Gemini bakes frosted cards into scene via prompt
  const topBorder = `<line x1="${margin - 10}" y1="${startY - 2}" x2="${canvasWidth - margin + 10}" y2="${startY - 2}" stroke="${brandColors.secondary}" stroke-width="2"/>`
  return {
    svg: `<g data-section="additional-details">${topBorder}${elements.join('')}</g>`,
    bottomY: currentY,
  }
}

/**
 * Build registration info CTA — v43.1 adaptive font sizing
 * Steps font size down (18→15→12→10px) until the card fits in remaining zone.
 * Never returns empty — always renders the full CTA text.
 */
function buildRegistrationCTA(
  text: string,
  canvasWidth: number,
  startY: number,
  maxY: number,
  brandColors: { primary: string; secondary: string; accent: string }
): { svg: string; bottomY: number } {
  const maxWidth = canvasWidth - 80
  const availableHeight = maxY - startY
  if (availableHeight < 24) return { svg: '', bottomY: startY }  // truly no room

  // Adaptive sizing: step down until card fits in remaining zone
  const CTA_SIZES = [18, 15, 12, 10]
  let ctaFontSize = 10
  let lines: string[] = []
  let cardHeight = 0

  for (const fs of CTA_SIZES) {
    lines = wrapText(text, CTA_FONT_FAMILY, fs, 'bold', maxWidth)
    cardHeight = lines.length * (fs + 4) + 18
    if (startY + cardHeight <= maxY) {
      ctaFontSize = fs
      break
    }
    // At minimum size, use it (guarantees render — content may extend slightly)
    if (fs === 10) ctaFontSize = fs
  }

  const lineHeight = ctaFontSize + 4
  const cardWidth = Math.min(maxWidth + 32, canvasWidth - 40)
  const cardX = Math.floor((canvasWidth - cardWidth) / 2)
  const elements: string[] = []

  // Gradient background + yellow border
  elements.push(`<rect x="${cardX}" y="${startY}" width="${cardWidth}" height="${cardHeight}" rx="12" ry="12" fill="url(#evt-cta-grad)" stroke="${brandColors.secondary}" stroke-width="1.5"/>`)

  // Text lines: white + 3D shadow at adaptive font size
  let textY = startY + 9 + ctaFontSize
  for (const line of lines) {
    const path3d = text3D(
      line,
      {
        fontFamily: CTA_FONT_FAMILY,
        fontSize: ctaFontSize,
        fontWeight: 'bold',
        x: canvasWidth / 2,
        y: textY,
        fill: '#FFFFFF',
        textAnchor: 'middle',
      },
      '#000000',
      2
    )
    elements.push(path3d)
    textY += lineHeight
  }

  return {
    svg: `<g data-section="registration-cta">${elements.join('')}</g>`,
    bottomY: startY + cardHeight,
  }
}

/**
 * Build speaker name + designation block — rendered after the info card
 * Shows each speaker (without photo) as: Name (bold, brand accent) + Designation (smaller, muted)
 */
function buildSpeakerBlock(
  speakers: Array<{ name: string; designation?: string }>,
  canvasWidth: number,
  startY: number,
  zoneEndPx: number,
  brandColors: { primary: string; secondary: string; accent: string },
  bgIsDark: boolean
): { svg: string; bottomY: number } {
  if (speakers.length === 0) return { svg: '', bottomY: startY }

  const PADDING_X = 60
  const maxTextWidth = canvasWidth - PADDING_X * 2
  const NAME_SIZE = 26
  const DESIG_SIZE = 18
  const LINE_GAP = 8
  const SPEAKER_GAP = 14
  const BG_PAD_V = 14
  const BG_PAD_H = 24

  const nameColor = bgIsDark
    ? (getLuminance(brandColors.secondary) > 0.20 ? brandColors.secondary : '#FFE066')
    : getBestDarkColor(brandColors)
  const desigColor = bgIsDark ? '#D0D0D0' : '#444444'

  const elements: string[] = []
  let currentY = startY + BG_PAD_V

  for (const speaker of speakers) {
    if (currentY + NAME_SIZE > zoneEndPx) break

    // Speaker name — bold, brand secondary color
    const nameLines = wrapText(speaker.name, 'poppins', NAME_SIZE, 'bold', maxTextWidth)
    for (const line of nameLines) {
      if (currentY + NAME_SIZE > zoneEndPx) break
      currentY += NAME_SIZE
      elements.push(`<g filter="url(#evt-headline-outline)">${textToPath(line, {
        fontFamily: 'poppins', fontSize: NAME_SIZE, fontWeight: 'bold',
        x: PADDING_X, y: currentY, fill: nameColor, textAnchor: 'start',
      })}</g>`)
    }

    // Designation — smaller, muted
    if (speaker.designation) {
      const desigLines = wrapText(speaker.designation, 'poppins', DESIG_SIZE, 'regular', maxTextWidth)
      for (const line of desigLines) {
        if (currentY + DESIG_SIZE > zoneEndPx) break
        currentY += DESIG_SIZE + LINE_GAP
        elements.push(`<g filter="url(#evt-text-shadow)">${textToPath(line, {
          fontFamily: 'poppins', fontSize: DESIG_SIZE, fontWeight: 'regular',
          x: PADDING_X, y: currentY, fill: desigColor, textAnchor: 'start',
        })}</g>`)
      }
    }

    currentY += SPEAKER_GAP
  }

  currentY += BG_PAD_V

  if (elements.length === 0) return { svg: '', bottomY: startY }

  const blockHeight = currentY - startY
  // v44.5: Sharp bg disabled — Gemini bakes frosted cards into scene via prompt
  // Left accent line
  const accent = `<rect x="${PADDING_X - 16}" y="${startY + BG_PAD_V}" width="4" height="${blockHeight - BG_PAD_V * 2}" rx="2" fill="${brandColors.secondary}"/>`

  console.log(`[Speaker Block] Rendered ${speakers.length} speaker(s) — height: ${Math.round(blockHeight)}px`)
  return {
    svg: `<g data-section="speakers">${accent}${elements.join('\n')}</g>`,
    bottomY: currentY,
  }
}

// ============================================================
// HELPERS
// ============================================================

/**
 * Word wrap text to fit within maxWidth
 */
function wrapText(
  text: string,
  fontFamily: string,
  fontSize: number,
  fontWeight: 'regular' | 'bold',
  maxWidth: number
): string[] {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word
    const testWidth = getTextWidth(testLine, fontFamily, fontSize, fontWeight)

    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = testLine
    }
  }

  if (currentLine) {
    lines.push(currentLine)
  }

  return lines
}
