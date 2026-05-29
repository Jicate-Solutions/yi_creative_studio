/**
 * Creative Context Builder — contract (stage 6 output)
 *
 * The firewall against prompt overload. Context is partitioned into six slices;
 * each downstream agent receives ONLY the slice it needs (the Director never sees
 * geometry; the typography stage never sees brand hex enforcement, etc.).
 *
 * `renderableText` is special: it carries the EXACT strings the deterministic
 * engine must draw. It is NEVER sent to the image model (which paints art only).
 */

import type { CanonicalSpeaker, SupportedLanguage } from './canonical'

export interface CreativeContext {
  /** → Creative Director (8) */
  emotionalContext: {
    tone: string
    energy: string
    audienceEmotion: string
    eventFamily: string
  }
  /** → Creative Director (8) + Scene Generation (12) */
  visualContext: {
    subjectType: string
    compositionStrategy: string
    sceneEnergy: string
    motionLanguage: string
    backgroundStyle?: string
    region?: string
  }
  /** → Typography Intelligence (9) ONLY */
  typographyContext: {
    tone: string
    formality: string
    energy: string
    headlineText: string
    subtitleText?: string
    fontStyleHint?: string
  }
  /** → Layout Intelligence (10) ONLY */
  spatialContext: {
    format: { id: string; width: number; height: number; aspectRatio: string; category: string }
    /** [startPercent, endPercent] of canvas height. */
    zones: {
      header: [number, number]
      content: [number, number]
      footer: [number, number]
    }
    hasSpeakerPhoto: boolean
    speakerCount: number
    logoBarsEnabled: boolean
    fullCanvas: boolean
  }
  /** → Director + Scene */
  audienceContext: {
    targetAudience?: string
    region?: string
    language: SupportedLanguage
  }
  /** → Scene (12) + Render (13) */
  brandContext: {
    primary: string
    secondary?: string
    accent?: string
    organizationName?: string
  }
  /** The text the deterministic engine renders. NEVER sent to the image model. */
  renderableText: {
    headline: string
    subtitle?: string
    dateLine?: string
    timeLine?: string
    venueLine?: string
    speakers: CanonicalSpeaker[]
    callToAction?: string
    footerNote?: string
    customLines: string[]
  }
}
