/**
 * Stage 10 — Layout Intelligence
 *
 * Pure spatial planning. Resolves the format's percentage zones into absolute
 * pixel rectangles, reserves the header/footer bands for logos, and produces a
 * stacked TextLayer[] in the content band. Font sizes are expressed as a RANGE
 * (the render-time fitter picks the exact px); `color` is omitted so the engine
 * auto-picks for contrast against the AI background.
 *
 * No AI, no Sharp — total function over its inputs.
 */

import type { CreativeContext } from '../contracts/creative-context'
import type { TypographySpec, TextCase } from '../contracts/direction'
import type { LayoutSpec, TextLayer, Zone, Rect, TextLayerRole } from '../contracts/layout'

/** Only reliably-loading font family today (Montserrat .ttf are invalid WOFF2 — see event-text-overlay). */
const RENDER_FAMILY = 'poppins'

function weightToNumber(w: TypographySpec['headlineStyle']['weight']): number {
  return w === 'light' || w === 'regular' ? 400 : 700
}

function pct(value: number, total: number): number {
  return Math.round((value / 100) * total)
}

export function runLayout(
  spatial: CreativeContext['spatialContext'],
  typography: TypographySpec,
  renderable: CreativeContext['renderableText']
): LayoutSpec {
  const width = spatial.format.width
  const height = spatial.format.height

  const headerEndPx = pct(spatial.zones.header[1], height)
  const footerStartPx = pct(spatial.zones.footer[0], height)
  const contentTop = headerEndPx
  const contentBottom = footerStartPx
  const contentH = Math.max(0, contentBottom - contentTop)
  const padX = Math.round(width * 0.06)
  const innerW = width - padX * 2

  const headerZone: Zone = {
    id: 'header',
    rect: { x: 0, y: 0, w: width, h: headerEndPx },
    density: 'empty',
  }
  const footerZone: Zone = {
    id: 'footer',
    rect: { x: 0, y: footerStartPx, w: width, h: height - footerStartPx },
    density: 'empty',
  }
  const contentZone: Zone = {
    id: 'content',
    rect: { x: padX, y: contentTop, w: innerW, h: contentH },
    density: 'medium',
  }

  // Font ranges scaled to canvas width, modulated by typography visual weights.
  const headlineMax = Math.round(width * 0.085) // ~92px @1080
  const headlineMin = Math.round(width * 0.04) // ~43px @1080
  const subMax = Math.round(headlineMax * typography.visualWeight.subtitle)
  const subMin = Math.round(headlineMin * typography.visualWeight.subtitle)
  const detMax = Math.max(22, Math.round(headlineMax * typography.visualWeight.details))
  const detMin = Math.max(16, Math.round(headlineMin * typography.visualWeight.details))

  const headlineCase: TextCase = typography.headlineStyle.case
  const headlineWeight = weightToNumber(typography.headlineStyle.weight)

  // Vertical cursor walk through the content band (advisory rects; the renderer
  // performs the final fit/stack within the same band).
  let cursor = contentTop + Math.round(contentH * 0.04)
  const lineGap = typography.layoutRhythm === 'dense' ? 8 : typography.layoutRhythm === 'tight' ? 14 : 20
  const layers: TextLayer[] = []

  const push = (
    role: TextLayerRole,
    text: string,
    maxFontPx: number,
    minFontPx: number,
    weight: number,
    textCase: TextCase
  ) => {
    if (!text || !text.trim()) return
    const blockH = Math.round(maxFontPx * 1.25)
    layers.push({
      id: `${role}-${layers.length}`,
      role,
      text: text.trim(),
      rect: { x: padX, y: cursor, w: innerW, h: blockH },
      align: 'center',
      typography: { family: RENDER_FAMILY, weight, case: textCase, maxFontPx, minFontPx },
      zIndex: 10 + layers.length,
    })
    cursor += blockH + lineGap
  }

  push('headline', renderable.headline, headlineMax, headlineMin, headlineWeight, headlineCase)
  if (renderable.subtitle) push('subtitle', renderable.subtitle, subMax, subMin, 400, 'none')

  const dateTime = [renderable.dateLine, renderable.timeLine].filter(Boolean).join('  •  ')
  if (dateTime) push('date', dateTime, detMax + 6, detMin, 700, 'upper')
  if (renderable.venueLine) push('venue', renderable.venueLine, detMax, detMin, 400, 'none')

  // Speakers (text-only when no photo) — one layer per speaker credit line.
  if (!spatial.hasSpeakerPhoto) {
    for (const s of renderable.speakers) {
      const line = s.designation ? `${s.name} — ${s.designation}` : s.name
      push('speaker', line, detMax, detMin, 600, 'none')
    }
  }

  if (renderable.callToAction) push('cta', renderable.callToAction, detMax, detMin, 700, 'upper')

  // Speaker photo rect (when a photo is provided) within the speaker zone.
  let speakerPhoto: LayoutSpec['speakerPhoto']
  if (spatial.hasSpeakerPhoto) {
    const sizePercent = 30
    const photoW = Math.round(width * (sizePercent / 100))
    const photoH = photoW
    speakerPhoto = {
      rect: {
        x: Math.round((width - photoW) / 2),
        y: Math.round(contentTop + contentH * 0.45),
        w: photoW,
        h: photoH,
      },
      sizePercent,
    }
  }

  return {
    canvas: { width, height },
    zones: [headerZone, contentZone, footerZone],
    textLayers: layers,
    speakerPhoto,
    reservedZones: { header: headerZone, footer: footerZone },
  }
}
