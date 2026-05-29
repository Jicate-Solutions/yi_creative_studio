/**
 * Sharp Render Adapter (stage 13 — Production Rendering Engine bridge)
 *
 * Translates the engine's LayoutSpec + renderableText into the existing, proven
 * lib/sharp/event-text-overlay renderer (which already does font auto-fit,
 * contrast sampling, and vertical stacking within a render zone). The deterministic
 * engine draws ALL text — the AI background carries none.
 *
 * This is the ONE place the engine touches Sharp; planCreative stays Sharp-free.
 */

import {
  renderEventTextOverlay,
  type EventTextData,
  type EventTextOverlayConfig,
} from '@/lib/sharp/event-text-overlay'
import type { LayoutSpec } from '../contracts/layout'
import type { CreativeContext } from '../contracts/creative-context'
import type { RenderedPoster } from '../contracts/render'

export interface RenderOptions {
  brand: { primary: string; secondary?: string; accent?: string }
}

export async function renderTextLayers(
  background: Buffer,
  layout: LayoutSpec,
  renderable: CreativeContext['renderableText'],
  opts: RenderOptions
): Promise<RenderedPoster> {
  const { width, height } = layout.canvas

  // Render zone = the content band between the reserved header/footer.
  const content = layout.zones.find((z) => z.id === 'content')?.rect
  const startPercent = content
    ? Math.round((content.y / height) * 100)
    : Math.round((layout.reservedZones.header.rect.h / height) * 100)
  const endPercent = content
    ? Math.round(((content.y + content.h) / height) * 100)
    : Math.round(((height - layout.reservedZones.footer.rect.h) / height) * 100)

  const dateTime = [renderable.dateLine, renderable.timeLine].filter(Boolean).join(' | ')
  const details = renderable.customLines.length ? renderable.customLines.join('  •  ') : undefined

  const eventData: EventTextData = {
    headline: renderable.headline || undefined,
    tagline: renderable.subtitle,
    dateTime: dateTime || undefined,
    venue: renderable.venueLine,
    additionalDetails: details,
    registrationInfo: renderable.callToAction,
    // Speakers render as text only when no photo is composited.
    speakers: layout.speakerPhoto
      ? undefined
      : renderable.speakers.map((s) => ({ name: s.name, designation: s.designation })),
  }

  const config: EventTextOverlayConfig = {
    canvasWidth: width,
    canvasHeight: height,
    renderZone: { startPercent, endPercent },
    brandColors: {
      primary: opts.brand.primary,
      secondary: opts.brand.secondary || opts.brand.primary,
      accent: opts.brand.accent || '#FFFFFF',
    },
  }

  const imageBuffer = await renderEventTextOverlay(background, eventData, config)

  return {
    imageBuffer,
    width,
    height,
    mimeType: 'image/png',
    appliedLayers: layout.textLayers.map((l) => l.id),
  }
}
