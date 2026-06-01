/**
 * Designer Pipeline — Orchestrator
 *
 * buildDesignerPipeline() converts raw user input into a structured design
 * understanding BEFORE prompt generation, then hands the duplicated Forge route a
 * constraint block (for the Claude Director) plus a user-facing summary (for the UI).
 *
 * It is intentionally DETERMINISTIC and synchronous so the result is stable, cheap,
 * and testable offline. The two designer problems it solves:
 *   1. Bridge between user expectation and AI interpretation (s01 + s02).
 *   2. Separated colour theory to stop uncontrolled high-contrast posters (s03).
 *
 * Used ONLY by app/api/generate-designer/route.ts — the main /api/generate and the
 * Forge pipeline are untouched.
 */

import type {
  DesignerPipelineInput,
  DesignerPipelineResult,
  StructuredUnderstanding,
} from './contracts'
import { buildUserBridge } from './s01-user-bridge'
import { buildDesignIntent } from './s02-design-intent'
import { buildColorPlan } from './s03-color-theory'
import { buildLayoutPlan } from './s04-layout-plan'
import { buildStylePlan } from './s05-style-plan'
import { buildStyleBlendPlan } from './s06-style-blend'
import { buildUserFacingSummary, compileDirectorConstraints } from './s07-prompt-compiler'
import {
  auditTypographyPlan,
  buildTypographyDirectionSummary,
  buildTypographyPlan,
} from './s07-typography-plan'
import { buildCreativeDirectives, emptyParsedIdea } from './idea-parser'

export function buildDesignerPipeline(input: DesignerPipelineInput): DesignerPipelineResult {
  // s01 — what the user meant (the bridge).
  const bridge = buildUserBridge(input)

  // s02 — how the AI must treat the subject (actor preservation).
  const designIntent = buildDesignIntent(bridge, input)

  // s03 — separated colour theory (60-30-10 roles + contrast discipline).
  const colorPlan = buildColorPlan(input, bridge)

  // s04 — layout from the shared format-zones profile.
  const layoutPlan = buildLayoutPlan(input)

  // s05 — rendering-mode decision + concrete style id.
  const stylePlan = buildStylePlan(input, bridge)

  // s06 — role-based style blend (passthrough/empty when 'auto').
  const styleBlendPlan = buildStyleBlendPlan(input)

  // v1.1 — the user's idea split into the 10 role buckets (computed in s01).
  const parsedIdea = bridge.parsedIdea ?? emptyParsedIdea()

  // v1.1 — role-assigned typography / text-effects / layout from the parsed idea.
  const creativeDirectives = buildCreativeDirectives(parsedIdea)

  // v1.1 — the resolved design-domain lock (s01 detected it; fall back to 'general').
  const domain = bridge.domainLock ?? {
    domain: 'general' as const,
    confidence: 0.3,
    label: 'general',
    forbiddenDrift: [],
  }

  // v1.3 — Typography Intelligence: pick a designed headline personality + treatment
  // from the style blend, domain, rendering mode, event type, and the user's font requests.
  // Typography affinity follows the user's STYLISTIC INTENT, so fall back to the raw style
  // ids when s06 dropped them all (e.g. an intent label that isn't a registered background).
  const typographyStyleStack = styleBlendPlan.styleStack.length
    ? styleBlendPlan.styleStack
    : (input.styleBlend?.styleStack ?? []).map((id) => ({ id, label: id }))
  const typographyPlan = buildTypographyPlan({
    styleStack: typographyStyleStack,
    domain: domain.domain,
    renderingMode: stylePlan.renderingMode,
    eventFamily: bridge.detectedEventFamily,
    briefText: [input.eventName, input.tagline, input.description].filter(Boolean).join(' '),
    typographyRequests: parsedIdea.typographyRequests,
    moodRequests: parsedIdea.moodRequests,
    styleRequests: parsedIdea.styleRequests,
    textEffectsRequests: parsedIdea.textEffectsRequests,
    avoidRequests: parsedIdea.avoidRequests,
    colorPlan,
  })
  // v1.3 — deterministic pre-generation typography audit (plan-level critic).
  const typographyAudit = auditTypographyPlan(typographyPlan)

  // s07 — compile the Director constraint block + the user-facing summary. typographyPlan
  // feeds the hard typography constraint block (designed lettering, not document text).
  const parts = {
    bridge,
    designIntent,
    colorPlan,
    layoutPlan,
    stylePlan,
    styleBlendPlan,
    creativeDirectives,
    typographyPlan,
  }
  const directorConstraints = compileDirectorConstraints(parts)
  const userFacingSummary = buildUserFacingSummary(parts)

  // v1.1 — the compact "AI understood this" card. colorDirection reads from the v2
  // ColorPlan (color-dev) when present, else from the legacy colour direction / roles.
  const structuredUnderstanding = buildStructuredUnderstanding({
    designIntent,
    colorPlan,
    creativeDirectives,
    styleBlendPlan,
    stylePlan,
    typographyPlan,
  })

  return {
    bridge,
    designIntent,
    colorPlan,
    layoutPlan,
    stylePlan,
    styleBlendPlan,
    creativeDirectives,
    parsedIdea,
    domain,
    structuredUnderstanding,
    typographyPlan,
    typographyAudit,
    userFacingSummary,
    directorConstraints,
  }
}

/** Compose the compact preview card from the resolved stages. */
function buildStructuredUnderstanding(parts: {
  designIntent: DesignerPipelineResult['designIntent']
  colorPlan: DesignerPipelineResult['colorPlan']
  creativeDirectives: DesignerPipelineResult['creativeDirectives']
  styleBlendPlan: DesignerPipelineResult['styleBlendPlan']
  stylePlan: DesignerPipelineResult['stylePlan']
  typographyPlan: DesignerPipelineResult['typographyPlan']
}): StructuredUnderstanding {
  const { designIntent, colorPlan, creativeDirectives, styleBlendPlan, stylePlan, typographyPlan } = parts

  // colorDirection: prefer the user-named direction, then describe the resolved roles.
  const ratio = `${colorPlan.ratio.dominant}-${colorPlan.ratio.support}-${colorPlan.ratio.accent}`
  const colorDirection =
    colorPlan.colorDirection ??
    `${colorPlan.dominantColor} dominant, ${colorPlan.supportColor} support, ${colorPlan.accentColor} accent (${ratio})`

  const styleMix =
    styleBlendPlan.mode === 'auto' ? 'AI Auto' : styleBlendPlan.stackLabel || stylePlan.styleId

  return {
    hero: designIntent.mainSubject,
    backgroundMotifs: designIntent.backgroundMotifs,
    colorDirection,
    typography: creativeDirectives.typography,
    typographyDirection: buildTypographyDirectionSummary(typographyPlan),
    textEffects: creativeDirectives.textEffects,
    styleMix,
    renderingMode: stylePlan.renderingMode,
    willAvoid: designIntent.mustAvoid,
  }
}

export * from './contracts'
