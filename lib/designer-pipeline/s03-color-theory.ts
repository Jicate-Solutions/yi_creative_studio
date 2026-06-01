/**
 * Designer Pipeline — Stage 03: Color Theory (v2)
 *
 * Separates colour so posters stop coming out as full-canvas high-contrast walls.
 * Colours are assigned explicit ROLES (dominant / support / accent / neutral) on a
 * fixed 60-30-10 distribution. Contrast defaults to `balanced`; high contrast and
 * saturated full-canvas colour are opt-in only (`requestedHighContrast`).
 *
 * v2 (color-dev) — when the user NAMES colours (form field or parsed from the idea),
 * those colours are honoured (`source: 'user-color-request'`, `userColorsHonored: true`)
 * and assigned roles by DESIGN LOGIC rather than raw input order:
 *   • dominant  = the background / atmosphere (a deep, calm tone — never a vivid flood)
 *   • support   = the secondary / large-surface brand colour (the vivid identity hue)
 *   • accent    = the small highlight / CTA / text-effect colour (gradients live here)
 *   • neutral   = the readability colour for text backing & negative space
 * A gradient request populates `gradientTokens`; `textColorStrategy` states how the
 * title vs supporting text are coloured. When NO user colours resolve, behaviour falls
 * back to today's brand/auto path (`userColorsHonored: false`).
 */

import { BRAND_COLORS } from '@/lib/config/constants'
import type { ColorPlan, ColorSource, DesignerPipelineInput, UserBridge } from './contracts'
import { normalizeColorRequests, type NormalizedColorEntry, type NormalizedColors } from './color-names'

/** A calm neutral used for negative space when the brand doesn't define one. */
const DEFAULT_NEUTRAL = BRAND_COLORS.muted // '#F5F5F5'

/** Deep luxury-black atmosphere — the default background for a vivid/luxury palette. */
const LUXURY_BLACK = '#080808'
/** Soft ivory — the default readability neutral for a dark luxury palette. */
const IVORY = '#FFFFF0'

/** Colour names that read as a deep, dark "atmosphere" suitable for the background. */
const DARK_NAMES = new Set([
  'luxury black',
  'black',
  'deep purple',
  'navy',
  'maroon',
  'burgundy',
  'charcoal',
])

/**
 * Pure readability neutrals — true text-backing / negative-space tones. Light luxury
 * SURFACES (champagne / beige / platinum) are deliberately NOT here: they read as a large
 * secondary surface (support), so they must stay available for the support role.
 */
const NEUTRAL_NAMES = new Set(['white', 'ivory', 'cream'])

function accentUsageFor(bridge: UserBridge): string {
  switch (bridge.detectedEventFamily) {
    case 'drive':
    case 'awareness':
    case 'nursing':
      return 'limited to safety highlights (signage, vests, CTA chip)'
    case 'celebration':
    case 'greeting':
      return 'limited to celebratory highlights (headline, festive sparkle)'
    case 'official':
    case 'conference':
      return 'limited to a single restrained highlight (seal, title underline)'
    default:
      return 'limited to the headline and the call-to-action'
  }
}

/** Darken a hex toward black by `amount` (0–1) — used to derive a "deep <colour>" atmosphere. */
function darken(hex: string, amount: number): string {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim())
  if (!m) return hex
  const f = (h: string) => Math.round(parseInt(h, 16) * (1 - amount))
  const to2 = (n: number) => n.toString(16).padStart(2, '0')
  return `#${to2(f(m[1]))}${to2(f(m[2]))}${to2(f(m[3]))}`
}

/** Lighten a hex toward white by `amount` (0–1) — used to derive a distinct accent. */
function lighten(hex: string, amount: number): string {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim())
  if (!m) return hex
  const f = (h: string) => {
    const v = parseInt(h, 16)
    return Math.round(v + (255 - v) * amount)
  }
  const to2 = (n: number) => n.toString(16).padStart(2, '0')
  return `#${to2(f(m[1]))}${to2(f(m[2]))}${to2(f(m[3]))}`
}

/**
 * Resolved colour ROLES from a user palette. The four role hexes plus the gradient tokens
 * and a text-colour strategy line, all derived by design logic (not raw input order).
 */
interface ResolvedRoles {
  dominant: string
  support: string
  accent: string
  neutral: string
  gradientTokens?: string
  textColorStrategy: string
}

/**
 * Assign dominant / support / accent / neutral from the user's named colours.
 *
 * Roles are resolved in dependency order and each CONSUMES its entry, so no two roles ever
 * collapse onto one colour (dominant background ≠ accent, support never falls back to white):
 *  - GRADIENT entries are reserved for the ACCENT up front (a "gold gradient" / "rose gold"
 *    is a title/CTA highlight, never the background or a large support surface).
 *  - NEUTRAL  = a true readability tone: the first named white/ivory/cream, else ivory.
 *  - DOMINANT = the background atmosphere: a dark-named colour (only consumed when another
 *               chromatic remains for support), else a DEEPENED version of the lead hue
 *               (vivid magenta → deep magenta / luxury black) so the canvas stays calm.
 *  - SUPPORT  = the secondary / large-surface identity hue: the first remaining chromatic.
 *  - ACCENT   = the reserved gradient, else a remaining chromatic, else a tone DERIVED from
 *               support so the accent is always distinct from the dominant background.
 */
function assignRoles(custom: NormalizedColors): ResolvedRoles {
  const entries = custom.entries
  const isNeutralTone = (e: NormalizedColorEntry) => NEUTRAL_NAMES.has(e.name)
  const isDark = (e: NormalizedColorEntry) => DARK_NAMES.has(e.name)

  // Roles are resolved in DEPENDENCY ORDER (neutral → dominant → support → accent) and
  // each role CONSUMES the entry it took, so two roles never collapse onto one colour
  // (the dominant background is never also the accent, support never falls back to white).
  const used = new Set<NormalizedColorEntry>()
  const claim = (e: NormalizedColorEntry | undefined) => {
    if (e) used.add(e)
    return e
  }
  /** First entry matching `pred` that no earlier role has consumed. */
  const pick = (pred: (e: NormalizedColorEntry) => boolean) =>
    entries.find((e) => !used.has(e) && pred(e))

  // GRADIENT entries are ACCENT-reserved up front: a "gold gradient" / "rose gold" is a
  // highlight (title / CTA sheen), never the dominant background or a large support surface.
  // Reserving it first stops a later role from consuming it.
  const gradientEntry = entries.find((e) => e.gradientTokens && e.gradientTokens.length >= 2)
  if (gradientEntry) used.add(gradientEntry)

  // NEUTRAL — a true readability tone: a named white/ivory/cream, else ivory by default.
  // Light luxury surfaces (champagne) are NOT a readability neutral — they stay available
  // for support. A named neutral is consumed so it can't double as support/accent.
  const neutralEntry = claim(pick(isNeutralTone))
  const neutral = neutralEntry?.hex ?? IVORY

  // DOMINANT — the background atmosphere. Prefer a dark-named colour (consumed); else
  // ground the lead chromatic hue into a deep atmosphere (luxury → luxury black) WITHOUT
  // consuming a chromatic entry, so vivid colours stay available for support/accent.
  const leadChroma = entries.find((e) => !isNeutralTone(e)) // for the deepened fallback
  // Only consume a dark for the background when ANOTHER chromatic remains for support;
  // otherwise a single dark colour should stay the identity (support) and the background
  // is a deepened version of it — so we don't strand support with nothing.
  const otherChroma = entries.find((e) => !isNeutralTone(e) && e !== gradientEntry)
  const moreThanOneChroma =
    entries.filter((e) => !isNeutralTone(e) && e !== gradientEntry).length > 1
  const darkEntry = moreThanOneChroma ? claim(pick(isDark)) : undefined
  let dominant: string
  if (darkEntry) {
    dominant = darkEntry.hex
  } else if (custom.isLuxury) {
    dominant = LUXURY_BLACK
  } else {
    dominant = darken((otherChroma ?? leadChroma ?? entries[0]).hex, 0.78)
  }

  // SUPPORT — the secondary / large-surface IDENTITY hue: the first remaining chromatic
  // (non-neutral) colour (gradients were already reserved for the accent).
  const supportEntry =
    claim(pick((e) => !isNeutralTone(e))) ?? claim(pick(() => true))
  const support = (supportEntry ?? leadChroma ?? entries[0]).hex

  // ACCENT — the small highlight (CTA / title text-effect). Use the reserved gradient first;
  // else a remaining chromatic colour distinct from dominant & support; else derive a distinct
  // accent FROM the support so the accent never equals the dominant/background.
  const accentEntry = gradientEntry ?? claim(pick((e) => !isNeutralTone(e)))
  const accent = accentEntry?.hex ?? deriveAccentFrom(support, dominant)
  const gradientTokens = gradientEntry?.gradientTokens?.join(', ')

  // TEXT COLOUR STRATEGY — title vs supporting text.
  const titleColor = gradientEntry
    ? `${gradientEntry.name}-gradient`
    : accentEntry
      ? accentEntry.name
      : supportEntry?.name ?? 'high-contrast headline'
  const bodyColor = neutralEntry?.name ?? 'white'
  const textColorStrategy = `${titleColor} title text + ${bodyColor} supporting text`

  return { dominant, support, accent, neutral, gradientTokens, textColorStrategy }
}

/**
 * Derive a distinct accent when the palette ran out of colours. Lightens the support
 * unless that would collide with the (dark) dominant, in which case it returns support.
 */
function deriveAccentFrom(support: string, dominant: string): string {
  const lighter = lighten(support, 0.25)
  return lighter.toLowerCase() === dominant.toLowerCase() ? support : lighter
}

export function buildColorPlan(input: DesignerPipelineInput, bridge: UserBridge): ColorPlan {
  const brand = input.brandColors ?? {}

  // v1.1/v2 — natural colour names the user typed (from the form AND parsed from the idea)
  // override the brand fallback, so "Magenta + Gold gradient" is honoured instead of Yi.
  const colorRequests = [
    ...(input.colorRequests ?? []),
    ...(bridge.parsedIdea?.colorRequests ?? []),
  ]
  const custom = colorRequests.length ? normalizeColorRequests(colorRequests) : null

  const contrastLevel = input.requestedHighContrast ? 'high' : 'balanced'
  const accentUsage = accentUsageFor(bridge)
  const notes: string[] = []

  let dominant: string
  let support: string
  let accent: string
  let neutral: string
  let source: ColorSource
  let userColorsHonored: boolean
  let gradientTokens: string[] | undefined
  let textColorStrategy: string

  if (custom) {
    // ---- User named colours → honour them with design-logic roles. ----
    const roles = assignRoles(custom)
    dominant = roles.dominant
    support = roles.support
    accent = roles.accent
    neutral = roles.neutral
    source = 'user-color-request'
    userColorsHonored = true
    gradientTokens = custom.gradientTokens
    textColorStrategy = roles.textColorStrategy

    notes.push(
      `User colour request: ${custom.direction}. Render ${dominant} as the dominant background/atmosphere (~60%), ${support} as support (~30%), ${accent} as accent (~10%).`,
      `Text: ${textColorStrategy}. Keep the background calm — do NOT flood the canvas with one saturated colour.`
    )
    if (custom.hasGradient) {
      notes.push(
        `Render the requested gradient as a smooth, premium multi-stop blend${gradientTokens ? ` (${gradientTokens.join(' → ')})` : ''} — reserved for the title / accent, not the whole canvas.`
      )
    }
    if (custom.isLuxury) {
      notes.push('Premium / luxury palette — refined finishes (metallic accents, deep tones, generous negative space).')
    }
  } else {
    // ---- No user colours → keep today's brand/auto fallback behaviour. ----
    dominant = brand.primary ?? BRAND_COLORS.primary
    support = brand.secondary ?? BRAND_COLORS.secondary
    accent = brand.accent ?? BRAND_COLORS.accent
    neutral = brand.neutral ?? DEFAULT_NEUTRAL
    source = input.brandColors ? 'brand' : 'auto'
    userColorsHonored = false
    gradientTokens = undefined
    textColorStrategy = 'high-contrast headline for readability; body text in the neutral on calmer backing'

    notes.push(
      `Use a 60-30-10 split: ${dominant} dominates (~60%), ${support} supports (~30%), ${accent} as accent only (~10%).`
    )
  }

  notes.push(
    `Fill negative space and text-backing with the neutral ${neutral} — do NOT flood the canvas with one colour.`,
    'Reserve high contrast for headline / CTA readability only; keep the background calmer.',
    `Accent ${accent} is ${accentUsage}.`
  )

  if (contrastLevel === 'balanced') {
    notes.push('Avoid neon / fully saturated full-canvas contrast (not requested for this brief).')
  } else {
    notes.push('High contrast explicitly requested — bold saturated treatment is allowed.')
  }

  return {
    // Legacy role fields (kept intact for existing s07 / preview consumers).
    dominantColor: dominant,
    supportColor: support,
    accentColor: accent,
    neutralColor: neutral,
    ratio: { dominant: 60, support: 30, accent: 10 },
    contrastLevel,
    accentUsage,
    notes,
    colorDirection: custom?.direction,
    isCustomPalette: !!custom,
    // v2 role fields (color-dev) — short aliases + provenance.
    source,
    dominant,
    support,
    accent,
    neutral,
    gradientTokens,
    textColorStrategy,
    userColorsHonored,
  }
}
