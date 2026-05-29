/**
 * Stage 9 — Typography Intelligence
 *
 * Maps the typography context (tone / formality / energy + user font hint) into a
 * TypographySpec — the creative voice of the type, NOT pixel sizes (those are
 * resolved at render time by the fitter). Pure heuristic in increment 1; can
 * become AI-backed later without changing the contract (the `source` field is
 * already part of TypographySpec).
 */

import type { CreativeContext } from '../contracts/creative-context'
import type {
  TypographySpec,
  FontFamilyClass,
  FontWeightName,
  TextCase,
} from '../contracts/direction'

function fontHintToFamily(hint: string | undefined): FontFamilyClass | undefined {
  switch (hint) {
    case 'serif':
      return 'serif'
    case 'sans':
      return 'sans-serif'
    case 'slab':
      return 'slab-serif'
    case 'mono':
      return 'monospace'
    case 'script':
      return 'script'
    case 'display':
      return 'display'
    default:
      return undefined
  }
}

export function runTypography(ctx: CreativeContext['typographyContext']): TypographySpec {
  const { formality, energy, fontStyleHint } = ctx

  // Family / weight / case by formality, overridable by an explicit user hint.
  let family: FontFamilyClass
  let weight: FontWeightName
  let headlineCase: TextCase
  switch (formality) {
    case 'formal':
      family = 'serif'
      weight = 'semibold'
      headlineCase = 'title'
      break
    case 'playful':
      family = 'display'
      weight = 'heavy'
      headlineCase = 'upper'
      break
    default:
      family = 'sans-serif'
      weight = 'bold'
      headlineCase = 'upper'
  }
  const hinted = fontHintToFamily(fontStyleHint)
  if (hinted) family = hinted

  // Energy nudges weight + rhythm.
  if (energy === 'explosive') weight = 'black'
  else if (energy === 'high' && weight === 'semibold') weight = 'bold'

  const layoutRhythm: TypographySpec['layoutRhythm'] =
    energy === 'explosive' ? 'dense' : energy === 'high' ? 'tight' : 'airy'

  return {
    headlineStyle: {
      weight,
      family,
      case: headlineCase,
      character:
        formality === 'formal'
          ? 'refined, high-contrast, generous spacing'
          : formality === 'playful'
            ? 'bold, condensed, punchy'
            : 'confident, clean, modern',
    },
    layoutRhythm,
    dateStyle: { weight: 'semibold', case: 'upper', color: 'auto' },
    visualWeight: { headline: 1, subtitle: 0.42, details: 0.28 },
    pairingStrategy: `${family} headline with a clean sans-serif for details`,
    source: 'fallback',
  }
}
