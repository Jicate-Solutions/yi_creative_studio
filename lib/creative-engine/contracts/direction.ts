/**
 * Creative Direction + Typography Spec — contracts (stages 8 & 9 output)
 *
 * The REDEFINED Creative Director output: structured JSON, not prose. It captures
 * meaning / emotion / cinematic identity — and explicitly does NOT carry any
 * text-to-render, pixel coordinates, fonts, or layout. Scene Generation (12)
 * derives a background-only prompt FROM this; the deterministic engine never
 * reads it.
 */

import type { VisualStrategy } from './strategy'

export type HeroElementKind =
  | 'environment'
  | 'iconic-symbol'
  | 'abstract-field'
  | 'object'
  | 'atmospheric'
  | 'portrait'

/**
 * Actor-preservation contract. Guarantees the primary human subject survives the
 * whole pipeline — the Director may NOT swap "JKKN nursing students conducting a
 * drive" for a generic pedestrian, traffic police, empty road, or a lone symbol.
 */
export interface NarrativeAnchor {
  /** The hero the scene is ABOUT, e.g. "JKKN nursing students". */
  primaryActor: string
  /** What they are actively doing. */
  primaryAction: string
  /** When true, the scene MUST keep the primary actor visible and dominant. */
  mustRemainVisible: boolean
  /** Props that support the story but must NOT replace the actor. */
  supportingSymbols: string[]
}

/** Stage 8 — structured creative direction. No layout / typography / geometry / text-to-render. */
export interface CreativeDirection {
  /** Named concept, e.g. "Bright Compass Career Navigator". */
  creativeTheme: string
  /** HOW the story is told — selected upstream, hard-constrains this direction. */
  visualStrategy: VisualStrategy
  /** WHO/WHAT the scene must keep as its hero (actor-preservation contract). */
  narrativeAnchor: NarrativeAnchor
  heroElement: {
    kind: HeroElementKind
    description: string
  }
  /** The WORLD behind the subject — background art only, no text. */
  sceneNarrative: string
  lightingStyle: string
  compositionFeel: string
  /** How brand colors distribute across the art. */
  paletteDirection: string
  /** How negative space is used (where the typography will breathe). */
  negativeSpaceStrategy: string
  /** 3–5 mood descriptors. */
  moodWords: string[]
  /** Optional named visual reference (photographer / campaign). */
  designerReference?: string
  reasoning: string
  source: 'ai' | 'fallback'
}

export type FontFamilyClass =
  | 'serif'
  | 'sans-serif'
  | 'slab-serif'
  | 'display'
  | 'script'
  | 'monospace'
export type FontWeightName =
  | 'light'
  | 'regular'
  | 'medium'
  | 'semibold'
  | 'bold'
  | 'heavy'
  | 'black'
export type TextCase = 'none' | 'upper' | 'title'

/** Stage 9 — Typography Intelligence. Creative voice, NOT pixel sizes (those are computed at render). */
export interface TypographySpec {
  headlineStyle: {
    weight: FontWeightName
    family: FontFamilyClass
    case: TextCase
    /** Sensory description of the type character (no real font names). */
    character: string
  }
  layoutRhythm: 'tight' | 'airy' | 'dense'
  dateStyle: {
    weight: FontWeightName
    case: TextCase
    color: 'primary' | 'secondary' | 'accent' | 'auto'
  }
  /** Relative scale ratios between roles (resolved to px by the layout/fitter). */
  visualWeight: {
    headline: number
    subtitle: number
    details: number
  }
  pairingStrategy: string
  source: 'ai' | 'fallback'
}
