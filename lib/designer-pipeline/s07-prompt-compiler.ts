/**
 * Designer Pipeline — Stage 07: Prompt Compiler
 *
 * Renders the structured plan into two text artefacts:
 *   - directorConstraints: a compact block injected into the Claude Director's
 *     prompt so the rich prose it writes MUST honour the actor, the symbol-as-support
 *     rule, the 60-30-10 colour roles, the role-based STYLE BLEND, and the mustAvoid
 *     failure modes.
 *   - userFacingSummary: a plain-English "AI understood this" paragraph the UI shows
 *     BEFORE generation, so the user can confirm the interpretation up front.
 */

import type {
  ColorPlan,
  CreativeDirectives,
  DesignIntent,
  LayoutPlan,
  StyleBlendPlan,
  StylePlan,
  TypographyPlan,
  UserBridge,
} from './contracts'
import { buildTypographyDirectorLines } from './s07-typography-plan'

/**
 * v1.1 — structured domain profile. Parser-dev's pipeline adds this to the `parts`
 * object built in index.ts. Optional so older callers that omit it still compile;
 * the DOMAIN LOCK block is skipped when it (or forbiddenDrift) is absent. `label`
 * is the human domain string (e.g. "beauty / cosmetics / makeup"); `forbiddenDrift`
 * lists the worlds the Director must NOT reinterpret the brief into.
 */
interface DomainProfile {
  label?: string
  forbiddenDrift?: string[]
}

interface CompileParts {
  bridge: UserBridge
  designIntent: DesignIntent
  colorPlan: ColorPlan
  layoutPlan: LayoutPlan
  stylePlan: StylePlan
  styleBlendPlan: StyleBlendPlan
  creativeDirectives: CreativeDirectives
  /**
   * v1.1 — structured domain profile (label + forbiddenDrift). Optional: read
   * DEFENSIVELY so a caller that doesn't pass it never crashes the compiler.
   */
  domain?: DomainProfile
  /**
   * v1.3 — designed typography plan. Optional so older callers still compile; when
   * present it adds the hard "designed poster lettering, not document text" block.
   */
  typographyPlan?: TypographyPlan
}

// ----------------------------------------------------------------------------
// v1.1 defensive accessors — keep this compiler green whether the v2 ColorPlan
// (dominant/support/accent/neutral) or the legacy *Color shape is in place, and
// whether bridge.domain is a plain string or a structured object.
// ----------------------------------------------------------------------------

/** Read a colour role from either v2 (`dominant`) or legacy (`dominantColor`) naming. */
function colorRole(plan: ColorPlan, role: 'dominant' | 'support' | 'accent' | 'neutral'): string {
  const p = plan as unknown as Record<string, unknown>
  const v2 = p[role]
  const legacy = p[`${role}Color`]
  return (typeof v2 === 'string' && v2) || (typeof legacy === 'string' && legacy) || ''
}

/** True when the palette came from the user's own colour request (v2 discriminator + legacy fallbacks). */
function colorsAreUserHonored(plan: ColorPlan): boolean {
  const p = plan as unknown as Record<string, unknown>
  if (p.userColorsHonored === true) return true
  if (p.source === 'user-color-request') return true
  return p.isCustomPalette === true // legacy v1.0 signal
}

/** Optional string field off the ColorPlan (v2 may add gradientTokens / textColorStrategy). */
function colorString(plan: ColorPlan, key: string): string | undefined {
  const v = (plan as unknown as Record<string, unknown>)[key]
  return typeof v === 'string' && v.trim() ? v.trim() : undefined
}

/** Optional string[] field off the ColorPlan (e.g. gradientTokens). */
function colorTokens(plan: ColorPlan, key: string): string[] {
  const v = (plan as unknown as Record<string, unknown>)[key]
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && !!x.trim()) : []
}

/**
 * Read the domain label safely from any of the shapes the pipeline may supply:
 *   - bridge.domainLock.label    (v1.1 structured DomainLock — parser-dev)
 *   - bridge.domain as object     (alternate structured form) or plain string (legacy)
 */
function bridgeDomainLabel(bridge: UserBridge): string | undefined {
  const b = bridge as unknown as Record<string, unknown>
  const lock = b.domainLock
  if (lock && typeof lock === 'object') {
    const label = (lock as Record<string, unknown>).label
    if (typeof label === 'string' && label.trim()) return label.trim()
  }
  const d = b.domain
  if (typeof d === 'string') return d.trim() || undefined
  if (d && typeof d === 'object') {
    const label = (d as Record<string, unknown>).label
    if (typeof label === 'string' && label.trim()) return label.trim()
  }
  return undefined
}

/** Pull a forbiddenDrift list off an unknown value if it carries one. */
function forbiddenDriftOf(value: unknown): string[] {
  if (value && typeof value === 'object') {
    const fd = (value as Record<string, unknown>).forbiddenDrift
    if (Array.isArray(fd)) return fd.filter((x): x is string => typeof x === 'string' && !!x.trim())
  }
  return []
}

/**
 * Resolve the forbiddenDrift list from any source the pipeline may use:
 *   - parts.domain.forbiddenDrift        (explicit s07 CompileParts.domain)
 *   - bridge.domainLock.forbiddenDrift   (v1.1 DomainLock — works without index.ts wiring)
 *   - bridge.domain.forbiddenDrift       (alternate structured bridge.domain)
 * First non-empty wins; absent everywhere → [] (DOMAIN LOCK block skipped).
 */
function resolveForbiddenDrift(parts: CompileParts): string[] {
  const fromParts = parts.domain?.forbiddenDrift
  if (Array.isArray(fromParts) && fromParts.length) {
    return fromParts.filter((x): x is string => typeof x === 'string' && !!x.trim())
  }
  const b = parts.bridge as unknown as Record<string, unknown>
  const fromLock = forbiddenDriftOf(b.domainLock)
  if (fromLock.length) return fromLock
  return forbiddenDriftOf(b.domain)
}

export function compileDirectorConstraints(parts: CompileParts): string {
  const { bridge, designIntent, colorPlan, layoutPlan, creativeDirectives } = parts
  const lines: string[] = []

  lines.push('=== DESIGNER PIPELINE CONSTRAINTS (must obey) ===')

  // 0. The user's own idea is the primary direction, when given.
  if (bridge.userVisualIdea) {
    lines.push(`USER'S VISUAL IDEA (primary direction): ${bridge.userVisualIdea}`)
  }

  // 0b. Domain lock — keep the world consistent. The soft DOMAIN line names the world;
  // the explicit DOMAIN LOCK block (below) enumerates the forbidden drifts from the
  // structured domain profile when one is supplied.
  const domainLabel = bridgeDomainLabel(bridge)
  if (domainLabel) {
    lines.push(
      `DOMAIN: ${domainLabel}. Stay in this world — do NOT reinterpret it as a tech / corporate / office scene unless explicitly requested.`
    )
  }

  // 1. Subject / actor preservation.
  lines.push(`MAIN SUBJECT (the hero): ${designIntent.mainSubject}.`)
  lines.push(
    `NARRATIVE: ${designIntent.narrativeMode}; visual strategy: ${designIntent.visualStrategy}.`
  )
  if (designIntent.narrativeMode === 'actor-led') {
    lines.push(
      `The main subject MUST be clearly visible and dominant, actively taking part. Do not replace them with a symbol, an empty scene, or a lone object.`
    )
  }
  if (designIntent.mustShow.length) {
    lines.push(`MUST SHOW (keep these visible in the scene): ${designIntent.mustShow.join('; ')}.`)
  }
  if (designIntent.supportingSymbols.length) {
    lines.push(
      `SUPPORTING SYMBOLS (support the hero, never replace them): ${designIntent.supportingSymbols.join(', ')}.`
    )
  }
  if (designIntent.backgroundMotifs.length) {
    lines.push(
      `BACKGROUND MOTIF (a subtle texture BEHIND the hero — never the subject): ${designIntent.backgroundMotifs.join(', ')}.`
    )
  }
  if (designIntent.mustPreserve.length) {
    lines.push(`MUST PRESERVE: ${designIntent.mustPreserve.join('; ')}.`)
  }
  if (designIntent.mustAvoid.length) {
    lines.push(`MUST AVOID: ${designIntent.mustAvoid.join('; ')}.`)
  }

  // 2. Colour discipline. Roles read via the defensive accessor so this holds for
  //    both the v2 (dominant/…) and legacy (dominantColor/…) ColorPlan shapes.
  const cDominant = colorRole(colorPlan, 'dominant')
  const cSupport = colorRole(colorPlan, 'support')
  const cAccent = colorRole(colorPlan, 'accent')
  const cNeutral = colorRole(colorPlan, 'neutral')
  lines.push(
    `COLOUR ROLES — dominant ${cDominant} (~${colorPlan.ratio.dominant}%), support ${cSupport} (~${colorPlan.ratio.support}%), accent ${cAccent} (~${colorPlan.ratio.accent}%, ${colorPlan.accentUsage}), neutral ${cNeutral} for negative space.`
  )
  lines.push(`CONTRAST: ${colorPlan.contrastLevel}. ${colorPlan.notes.join(' ')}`)

  // 2b. USER COLORS OVERRIDE — when the palette came from the user's own colour request,
  //     it WINS over the brand/fallback palette. State it explicitly so the Director never
  //     drifts back to brand colours, and surface the gradient + text-colour strategy when
  //     ColorPlan v2 supplies them. designerPlan has priority over legacy context (designer route only).
  if (colorsAreUserHonored(colorPlan)) {
    const overrideBits = [
      `dominant ${cDominant}`,
      `support ${cSupport}`,
      `accent ${cAccent}`,
      `neutral ${cNeutral}`,
    ]
    lines.push(
      `USER COLORS OVERRIDE BRAND/FALLBACK COLORS — the user asked for these colours, so use them, NOT the brand palette: ${overrideBits.join(', ')}.`
    )
    const gradientTokens = colorTokens(colorPlan, 'gradientTokens')
    if (gradientTokens.length) {
      lines.push(`GRADIENT (render as a smooth premium gradient where appropriate): ${gradientTokens.join(' → ')}.`)
    }
    const textColorStrategy = colorString(colorPlan, 'textColorStrategy')
    if (textColorStrategy) {
      lines.push(`TEXT COLOUR STRATEGY: ${textColorStrategy}.`)
    }
  }

  // 3. Layout.
  lines.push(
    `LAYOUT: ${layoutPlan.shape}. Hero in ${layoutPlan.focalZone}. ${layoutPlan.textZones.join('; ')}.`
  )

  // 3b. Typography / text-effects / layout requests parsed from the user's idea.
  if (creativeDirectives.typography.length) {
    lines.push(`TYPOGRAPHY (use these fonts by role): ${creativeDirectives.typography.join('; ')}.`)
  }
  if (creativeDirectives.textEffects.length) {
    lines.push(`TEXT EFFECTS: ${creativeDirectives.textEffects.join('; ')}.`)
  }
  if (creativeDirectives.layout.length) {
    lines.push(`LAYOUT REQUESTS: ${creativeDirectives.layout.join('; ')}.`)
  }

  // 3c. v1.3 — designed typography treatment (poster lettering, NOT document text).
  //     The hard block + anti-patterns so the Director never writes plain centered text.
  if (parts.typographyPlan) {
    lines.push(...buildTypographyDirectorLines(parts.typographyPlan))
  }

  // 4. Role-based style blend (skipped entirely when 'auto' — no lines emitted).
  if (parts.styleBlendPlan.directorLines.length) {
    lines.push(...parts.styleBlendPlan.directorLines)
  }

  // 5. DOMAIN LOCK — explicit list of worlds the Director must not drift into. Sourced
  //    from the structured domain profile's forbiddenDrift; skipped when none supplied.
  const forbiddenDrift = resolveForbiddenDrift(parts)
  if (forbiddenDrift.length) {
    lines.push(
      `DOMAIN LOCK — do NOT drift into ${forbiddenDrift.join(', ')} unless explicitly requested. Keep every element inside the ${domainLabel ?? 'stated'} world.`
    )
  }

  lines.push('=== END CONSTRAINTS ===')
  return lines.join('\n')
}

export function buildUserFacingSummary(parts: CompileParts): string {
  const { bridge, designIntent, colorPlan, stylePlan, styleBlendPlan, creativeDirectives } = parts

  const heroLine =
    designIntent.narrativeMode === 'actor-led'
      ? `Hero: ${designIntent.mainSubject}, shown actively taking part`
      : `Hero: ${designIntent.mainSubject}`

  const symbolLine = designIntent.supportingSymbols.length
    ? ` Symbols (${designIntent.supportingSymbols.join(', ')}) support the people, not replace them.`
    : ''

  // Show what's kept beyond the hero (the user's named elements).
  const extraShow = designIntent.mustShow.filter(
    (s) => s.toLowerCase() !== designIntent.mainSubject.toLowerCase()
  )
  const showLine = extraShow.length ? ` Keeping: ${extraShow.join(', ')}.` : ''

  // Background motif (behind the hero) — surfaced separately so it reads as a texture.
  const motifLine = designIntent.backgroundMotifs.length
    ? `Background motif: ${designIntent.backgroundMotifs.join(', ')}.`
    : ''

  // Colour: the user's named direction wins; otherwise the role-based breakdown.
  // Role values read via the defensive accessor (v2 / legacy shape agnostic).
  const colorLine = colorPlan.colorDirection
    ? `Color direction: ${colorPlan.colorDirection}.`
    : `Colours: ${colorRole(colorPlan, 'dominant')} leads (${colorPlan.ratio.dominant}%), ${colorRole(colorPlan, 'support')} supports (${colorPlan.ratio.support}%), ${colorRole(colorPlan, 'accent')} as accent only (${colorPlan.ratio.accent}%), ${colorPlan.contrastLevel} contrast.`

  // Typography + text effects, if the user asked for any.
  const typoParts = [...creativeDirectives.typography, ...creativeDirectives.textEffects]
  const typoLine = typoParts.length ? `Typography: ${typoParts.join(', ')}.` : ''

  const layoutLine = creativeDirectives.layout.length
    ? `Layout: ${creativeDirectives.layout.join(', ')}.`
    : ''

  const _domainLabel = bridgeDomainLabel(bridge)
  const domainLine = _domainLabel ? `Domain: ${_domainLabel}.` : ''

  // Surface the style mix in the text card only when the user picked styles.
  const blendLine =
    styleBlendPlan.mode !== 'auto' && styleBlendPlan.understoodBullets.length
      ? `Style: ${styleBlendPlan.stackLabel} (${styleBlendPlan.understoodBullets.join(' · ')}).`
      : ''

  return [
    `AI understood this as a ${bridge.detectedEventFamily} "${bridge.interpretedTopic}".`,
    domainLine,
    `${heroLine}.${showLine}${symbolLine}`,
    motifLine,
    colorLine,
    typoLine,
    layoutLine,
    `Rendering: ${stylePlan.renderingMode} (${stylePlan.styleIntent} style).`,
    blendLine,
  ]
    .filter(Boolean)
    .join(' ')
}
