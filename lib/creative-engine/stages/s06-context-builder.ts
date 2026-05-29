/**
 * Stage 6 — Creative Context Builder
 *
 * Projects the canonical event + semantic profile + psychology into SIX
 * partitioned context slices. Each downstream agent receives only its slice —
 * the firewall that keeps the Director from seeing geometry and the typography
 * stage from seeing brand hex enforcement.
 *
 * `renderableText` carries the exact strings the deterministic engine draws; it
 * is never sent to the image model.
 */

import { getFormatZones } from '@/lib/config/format-zones'
import type { CanonicalEvent } from '../contracts/canonical'
import type { SemanticProfile, EventPsychology } from '../contracts/semantic'
import type { CreativeContext } from '../contracts/creative-context'

const FORMAL_FAMILIES = new Set(['MEMORIAL-DECEASED', 'TRIBUTE-LIVING', 'ACADEMIC-CONFERENCE'])
const PLAYFUL_FAMILIES = new Set(['BIRTHDAY-LIVING', 'CULTURAL-FESTIVAL', 'CELEBRATION-LIVE'])

function deriveFormality(eventFamily: string): string {
  if (FORMAL_FAMILIES.has(eventFamily)) return 'formal'
  if (PLAYFUL_FAMILIES.has(eventFamily)) return 'playful'
  return 'balanced'
}

export function buildCreativeContext(
  canonical: CanonicalEvent,
  semantic: SemanticProfile,
  psychology: EventPsychology
): CreativeContext {
  const zones = getFormatZones(canonical.format.id)

  // Custom lines that aren't already consumed as CTA / registration.
  const consumed = new Set(
    [canonical.callToAction, canonical.registrationInfo].filter(Boolean) as string[]
  )
  const customLines = canonical.customFields
    .filter((f) => !consumed.has(f.value))
    .map((f) => `${f.label}: ${f.value}`)

  const timeLine =
    canonical.startTime && canonical.endTime
      ? `${canonical.startTime} – ${canonical.endTime}`
      : canonical.startTime ?? undefined

  // Advertising hierarchy: the punchy tagline becomes the hero headline and the
  // event name drops to the subheadline (e.g. "Drive Safe. Save Lives." over
  // "Road Safety Awareness Drive"). Applies to the advertising style / marketing.
  const adMode = canonical.controls.backgroundStyle === 'advertising' || semantic.isMarketing
  const headline = adMode && canonical.tagline ? canonical.tagline : canonical.eventName
  const subtitle = adMode && canonical.tagline ? canonical.eventName : canonical.tagline

  return {
    emotionalContext: {
      tone: semantic.eventPsychology.tone,
      energy: semantic.eventPsychology.energy,
      audienceEmotion: semantic.eventPsychology.audienceEmotion,
      eventFamily: semantic.eventFamily,
    },
    visualContext: {
      subjectType: psychology.subjectType,
      compositionStrategy: psychology.compositionStrategy,
      sceneEnergy: semantic.visualBehavior.sceneEnergy,
      motionLanguage: semantic.visualBehavior.motionLanguage,
      backgroundStyle: canonical.controls.backgroundStyle,
      region: canonical.brand.region,
    },
    typographyContext: {
      tone: semantic.eventPsychology.tone,
      formality: deriveFormality(semantic.eventFamily),
      energy: semantic.eventPsychology.energy,
      headlineText: headline,
      subtitleText: subtitle,
      fontStyleHint: canonical.controls.fontStyle,
    },
    spatialContext: {
      format: canonical.format,
      zones: {
        header: [zones.headerZone.start, zones.headerZone.end],
        content: [zones.contentZone.start, zones.contentZone.end],
        footer: [zones.footerZone.start, zones.footerZone.end],
      },
      hasSpeakerPhoto: canonical.speakers.some((s) => s.photoProvided),
      speakerCount: canonical.speakers.length,
      logoBarsEnabled: canonical.controls.logoBarsEnabled,
      fullCanvas: canonical.controls.fullCanvas,
    },
    audienceContext: {
      targetAudience: canonical.targetAudience,
      region: canonical.brand.region,
      language: canonical.controls.language,
    },
    brandContext: {
      primary: canonical.brand.primary,
      secondary: canonical.brand.secondary,
      accent: canonical.brand.accent,
      organizationName: canonical.organizationName,
    },
    renderableText: {
      headline,
      subtitle,
      dateLine: canonical.date,
      timeLine,
      venueLine: canonical.venue,
      speakers: canonical.speakers,
      callToAction: canonical.callToAction,
      footerNote: canonical.footerNote,
      customLines,
    },
  }
}
