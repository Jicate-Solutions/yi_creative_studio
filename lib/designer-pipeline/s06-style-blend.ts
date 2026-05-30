/**
 * Designer Pipeline — Stage 06: Style Blend Engine (v2)
 *
 * The user composes the look themselves by picking styles from the FULL background-
 * style library, IN ORDER. Mixing is ROLE-BASED with PRIORITY OWNERSHIP, never random
 * prompt stacking:
 *
 *   • 0 styles  → AI Auto (no blend; the Director chooses freely).
 *   • 1 style   → a plain single style — identical to the legacy single-style path.
 *   • 2+ styles → a blend. The 1st pick LEADS: it owns the dimensions it is strongest
 *                 at AND drives the base pipeline (its concept menu, style-reference
 *                 image and geminiStyleLock — the proven single-style machinery).
 *                 Each later pick claims ONLY the dimensions still unclaimed, so no
 *                 two styles ever fight over the same dimension.
 *
 * "Which dimensions is a style strongest at?" is derived from the style's category
 * (STYLE_CATEGORIES) plus a small per-style override table, so every one of the ~50
 * library styles gets sensible role ownership for free. The DIRECTIVE text reuses each
 * style's hand-authored `geminiStyleLock` (designer-written, never paraphrased) rather
 * than inventing new prose.
 */

import {
  BACKGROUND_STYLES,
  STYLE_CATEGORIES,
  getBackgroundStyle,
  getGeminiStyleLock,
} from '@/lib/config/background-styles'
import type {
  StyleAxis,
  StyleBlendInput,
  StyleBlendPlan,
  StyleRecipeId,
  StyleRoleAssignment,
} from './contracts'

// ---------------------------------------------------------------------------
// Role affinity — which dimensions each style is strongest at (priority order).
// ---------------------------------------------------------------------------

/** Default dimension ownership per UI category (a general, sensible mapping). */
const CATEGORY_AXES: Record<string, StyleAxis[]> = {
  Photographic: ['lighting', 'people', 'composition', 'finish'],
  Illustration: ['composition', 'color', 'finish'],
  'Graphic & Type': ['composition', 'spacing', 'color'],
  'Abstract & Atmospheric': ['color', 'lighting', 'finish'],
  'Cultural & Heritage': ['color', 'finish', 'composition'],
  'Premium & Bold': ['finish', 'spacing', 'color'],
  'Campus & Academic': ['composition', 'finish', 'people'],
  Custom: ['composition', 'color', 'finish'],
  Other: ['composition', 'color', 'finish'],
}

/** Per-style overrides for the styles most likely to be blended (sharper ownership). */
const STYLE_AXES_OVERRIDE: Record<string, StyleAxis[]> = {
  'movie-keyart': ['lighting', 'composition'],
  dark: ['lighting', 'color'],
  bokeh: ['lighting', 'finish'],
  'photo-real': ['people', 'lighting'],
  'photo-pop': ['people', 'color'],
  'bw-editorial': ['lighting', 'people', 'finish'],
  'double-exposure': ['composition', 'finish'],
  advertising: ['composition', 'color', 'lighting'],
  'spotlight-event': ['lighting', 'composition'],
  luxury: ['finish', 'spacing', 'color'],
  minimal: ['spacing', 'color'],
  typographic: ['composition', 'spacing'],
  geometric: ['composition', 'spacing'],
  duotone: ['color', 'finish'],
  neon: ['color', 'lighting'],
  glassmorphism: ['finish', 'color'],
}

/** Reverse index: style id → its UI category label. Built once at module load. */
const CATEGORY_OF_STYLE: Record<string, string> = (() => {
  const map: Record<string, string> = {}
  for (const cat of STYLE_CATEGORIES) {
    for (const id of cat.styleIds) map[id] = cat.label
  }
  return map
})()

/** The dimensions a style is strongest at, best-first. */
function affinityFor(styleId: string): StyleAxis[] {
  if (STYLE_AXES_OVERRIDE[styleId]) return STYLE_AXES_OVERRIDE[styleId]
  const cat = CATEGORY_OF_STYLE[styleId] ?? 'Other'
  return CATEGORY_AXES[cat] ?? CATEGORY_AXES.Other
}

// ---------------------------------------------------------------------------
// Quick-start presets — each is just an ORDERED styleStack of real library ids.
// (Named the same as before so they read as the familiar "recipes", but they are
//  now plain stacks the user could also build by hand.)
// ---------------------------------------------------------------------------

export const RECIPE_STACKS: Record<StyleRecipeId, string[]> = {
  'cinematic-human-luxury': ['movie-keyart', 'photo-real', 'luxury'],
  'premium-social-campaign': ['advertising', 'photo-real', 'luxury'],
  'documentary-advertising': ['bw-editorial', 'advertising', 'movie-keyart'],
  'conceptual-luxury': ['double-exposure', 'luxury', 'minimal'],
  'institutional-premium': ['spotlight-event', 'luxury', 'minimal'],
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Human phrase per axis, used in the "AI will use…" UI bullets (exported for the UI). */
export const AXIS_PHRASE: Record<StyleAxis, string> = {
  lighting: 'lighting',
  people: 'realistic people',
  color: 'colour',
  spacing: 'spacing',
  composition: 'framing',
  finish: 'finish',
}

function labelFor(styleId: string): string {
  return getBackgroundStyle(styleId)?.label ?? styleId
}

/** The directive prose for a style — its verbatim lock, else its hint, else a generic line. */
function directiveFor(styleId: string): string {
  const opt = getBackgroundStyle(styleId)
  return (
    getGeminiStyleLock(styleId) ||
    opt?.designIntelligenceHint ||
    `Apply the "${labelFor(styleId)}" visual style.`
  )
}

/** Join phrases as "a, b & c". */
function joinPhrases(parts: string[]): string {
  if (parts.length <= 1) return parts.join('')
  return `${parts.slice(0, -1).join(', ')} & ${parts[parts.length - 1]}`
}

/** Drop unknown / duplicate ids while preserving order. */
function sanitizeStack(ids: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of ids) {
    const id = (raw || '').trim()
    if (!id || seen.has(id)) continue
    if (!getBackgroundStyle(id)) continue // not a real library style → ignore
    seen.add(id)
    out.push(id)
  }
  return out
}

/**
 * Priority claim: assign each axis to the FIRST style (in pick order) strong at it.
 * Returns per-style owned axes in stack order. Shared by the plan builder and the UI.
 */
function claimAxes(stack: string[]): Map<string, StyleAxis[]> {
  const claimed = new Set<StyleAxis>()
  const ownedByStyle = new Map<string, StyleAxis[]>()
  for (const id of stack) {
    const owned = affinityFor(id).filter((axis) => !claimed.has(axis))
    owned.forEach((axis) => claimed.add(axis))
    ownedByStyle.set(id, owned)
  }
  return ownedByStyle
}

/**
 * Per-style role ownership for an ordered stack, for LIVE UI feedback (the Studio's
 * role tags + the inline summary). Mirrors what buildStyleBlendPlan computes, but
 * exposes the LEAD's owned axes too (the plan only emits those as director text).
 */
export function getStackRoles(
  stack: string[]
): { id: string; label: string; isLead: boolean; ownedAxes: StyleAxis[] }[] {
  const clean = sanitizeStack(stack)
  if (clean.length === 0) return []
  // A single style owns the whole look; show all axes so the tag row isn't empty.
  if (clean.length === 1) {
    return [{ id: clean[0], label: labelFor(clean[0]), isLead: true, ownedAxes: [] }]
  }
  const ownedByStyle = claimAxes(clean)
  return clean.map((id, i) => ({
    id,
    label: labelFor(id),
    isLead: i === 0,
    ownedAxes: ownedByStyle.get(id) ?? [],
  }))
}

function autoBlendPlan(): StyleBlendPlan {
  return {
    mode: 'auto',
    styleStack: [],
    stackLabel: 'AI Auto',
    leadStyleId: undefined,
    roles: [],
    directorLines: [],
    understoodBullets: ['AI will choose the style automatically'],
  }
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

/**
 * Resolve the user's ordered style selection into a role-based StyleBlendPlan.
 *
 * Pure function of the selection — "auto = no blend" means no event-family inference.
 */
export function buildStyleBlendPlan(input: { styleBlend?: StyleBlendInput }): StyleBlendPlan {
  const blend = input.styleBlend

  // Resolve the ordered stack: explicit styleStack wins; else a preset; else auto.
  let stack = sanitizeStack(blend?.styleStack ?? [])
  if (stack.length === 0 && blend?.styleRecipe && blend.styleRecipe !== 'auto') {
    stack = sanitizeStack(RECIPE_STACKS[blend.styleRecipe] ?? [])
  }

  if (stack.length === 0) return autoBlendPlan()

  const styleStack = stack.map((id) => ({ id, label: labelFor(id) }))
  const stackLabel = styleStack.map((s) => s.label).join(' + ')
  const leadStyleId = stack[0]

  // Single style — the lead drives everything via the base path; no extra blend lines.
  if (stack.length === 1) {
    return {
      mode: 'single',
      styleStack,
      stackLabel,
      leadStyleId,
      roles: [],
      directorLines: [],
      understoodBullets: [`${styleStack[0].label} — full style`],
    }
  }

  // Blend — assign each axis to the FIRST style (in pick order) that is strong at it.
  const ownedByStyle = claimAxes(stack)

  // The lead's directive is injected by the base pipeline (route sets bgStyle = lead),
  // so the blend's DIRECTOR LINES cover only the SECONDARY styles. Role assignments are
  // recorded for all secondaries that own at least one axis.
  const roles: StyleRoleAssignment[] = []
  const directorLines: string[] = ['=== STYLE BLEND (priority order — 1st style leads) ===']
  directorLines.push(
    `Style stack: ${stackLabel}. Blend into ONE coherent image; the lead style sets the base look and earlier styles win any conflict.`
  )

  stack.forEach((id, i) => {
    const owned = ownedByStyle.get(id) ?? []
    const label = labelFor(id)
    if (i === 0) {
      directorLines.push(
        `LEAD — ${label}: sets the overall look${owned.length ? ` and owns ${owned.join(', ')}` : ''} (applied via the base style).`
      )
      return
    }
    if (owned.length === 0) {
      // Every dimension this style is good at is already owned — keep it as a light influence.
      directorLines.push(`${label}: a light secondary influence; defer to the styles above.`)
      return
    }
    const directive = directiveFor(id)
    owned.forEach((axis) => roles.push({ axis, styleId: id, styleLabel: label, directive }))
    directorLines.push(`${owned.join(', ').toUpperCase()} — ${label}: ${directive}`)
  })

  directorLines.push(
    'Honour each style ONLY for the dimensions it owns; do not let a later style override a dimension an earlier style already owns.'
  )
  directorLines.push('=== END STYLE BLEND ===')

  // UI bullets — one per style, naming the dimensions it controls.
  const understoodBullets = stack.map((id, i) => {
    const owned = ownedByStyle.get(id) ?? []
    const phrases = owned.map((a) => AXIS_PHRASE[a])
    const label = labelFor(id)
    if (i === 0) {
      return phrases.length ? `${label} leads — ${joinPhrases(phrases)}` : `${label} leads`
    }
    return phrases.length ? `${label} — ${joinPhrases(phrases)}` : `${label} — supporting accent`
  })

  return { mode: 'blend', styleStack, stackLabel, leadStyleId, roles, directorLines, understoodBullets }
}

/** All library styles, grouped for the UI builder (re-exported for convenience). */
export { BACKGROUND_STYLES }
