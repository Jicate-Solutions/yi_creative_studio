/**
 * Stage 8 — Creative Director (REDEFINED: structured JSON output)
 *
 * The primary reasoning engine. Produces STRUCTURED creative direction —
 * meaning, emotion, cinematic identity — and explicitly does NOT produce
 * text-to-render, layout, pixel coordinates, or fonts. The image model paints
 * background art only (stage 12 derives the background prompt from this), and the
 * deterministic engine draws all text (stage 13). So the Director's job shrinks
 * to pure taste: what world, what light, what mood, how the brand color lives.
 *
 * Reuses the proven Anthropic infra from forge-creative-director.ts (ephemeral
 * cache + usage tracking) but swaps prose-for-rendering for a clean schema.
 */

import Anthropic from '@anthropic-ai/sdk'
import { trackApiUsage } from '@/lib/services/api-usage'
import { safeJsonParse } from '@/lib/utils/json-repair'
import type { CanonicalEvent } from '../contracts/canonical'
import type { CreativeContext } from '../contracts/creative-context'
import type { CreativeDirection, HeroElementKind, NarrativeAnchor } from '../contracts/direction'
import type { StrategySelection } from '../contracts/strategy'
import type { EngineConfig } from '../pipeline.types'

const DIRECTOR_MODEL = (process.env.LAB_DIRECTOR_MODEL || 'claude-sonnet-4-6') as
  | 'claude-sonnet-4-6'
  | 'claude-haiku-4-5'
const MAX_OUTPUT_TOKENS = 1000

// ── Narrative anchor derivation (actor-preservation contract) ──────────────────
const PEOPLE_RE =
  /students?|volunteers?|nursing|nurses?|\bteam\b|\bclub\b|members?|society|association|cadets?|\bncc\b|\bnss\b|scouts?|faculty|staff|alumni/i
const ORG_TYPE_TAIL =
  /\s+(initiative|association|society|club|team|cell|wing|forum|chapter|committee|foundation|trust|department)\s*$/i
const PROP_LEXICON = [
  'helmet', 'zebra crossing', 'traffic signal', 'traffic light', 'road markings', 'seatbelt',
  'signboard', 'barricade', 'road sign', 'crosswalk', 'placard', 'banner', 'ribbon', 'first aid',
  'stethoscope', 'sapling', 'plant', 'tree', 'trophy', 'medal', 'flag', 'book', 'microphone', 'stage',
]

function derivePrimaryActor(c: CanonicalEvent): string {
  const org = c.organizationName?.trim()
  if (org && PEOPLE_RE.test(org)) return org.replace(ORG_TYPE_TAIL, '').trim()
  const desc = c.description ?? ''
  const m = desc.match(
    /([A-Za-z][\w&.]*(?:\s+[\w&.]+){0,3}?\s+(?:nursing students|students|volunteers|nurses|cadets|members|team))/i
  )
  if (m) return m[1].trim()
  return org || 'the event participants'
}

function deriveSupportingSymbols(c: CanonicalEvent): string[] {
  const hay = [c.eventName, c.tagline, c.description].filter(Boolean).join(' ').toLowerCase()
  const found = PROP_LEXICON.filter((p) => hay.includes(p))
  // Domain augment: road-safety briefs imply the canonical road props even if unstated.
  if (/road|traffic|drive|safety|rider|commuter|vehicle|helmet|pedestrian/i.test(hay)) {
    for (const p of ['zebra crossing', 'helmet', 'traffic signal', 'road markings']) {
      if (!found.includes(p)) found.push(p)
    }
  }
  return found.slice(0, 6)
}

export function deriveNarrativeAnchor(c: CanonicalEvent, selection: StrategySelection): NarrativeAnchor {
  const actorLed =
    selection.strategy === 'activity-driven' ||
    selection.strategy === 'documentary' ||
    selection.strategy === 'emotional'
  return {
    primaryActor: derivePrimaryActor(c),
    primaryAction: `conducting the ${c.eventName.toLowerCase()}, actively engaging and assisting the community`,
    mustRemainVisible: actorLed,
    supportingSymbols: deriveSupportingSymbols(c),
  }
}

const SYSTEM_PROMPT = `You are an experienced creative director for premium institutional brand work in India (Young Indians / CII chapters). You decide the CREATIVE DIRECTION for a poster: the world it lives in, its light, its mood, and how the brand color breathes through it.

CRITICAL DIVISION OF LABOUR — read carefully:
- An image model will paint ONLY the background art from your "sceneNarrative". It renders NO text, NO logos, NO headline, NO dates, NO names — those are drawn separately by a deterministic typography engine afterwards.
- Therefore your scene must describe a believable visual WORLD with calm, uncluttered regions where text will later sit. Never describe lettering, captions, signage, posters-within-the-poster, watermarks, or UI. Never mention fonts, pixels, percentages, or coordinates.

VISUAL STRATEGY: The brief specifies a binding VISUAL STRATEGY with a directive — follow it exactly. It decides whether the scene is a symbolic icon, a documentary moment, an activity-driven people-scene, institutional, emotional, cinematic, or editorial-minimal. Do not drift to a different strategy.

ACTOR PRESERVATION (critical): The brief names a PRIMARY ACTOR and a PRIMARY ACTION. When the strategy is activity-driven, documentary, or emotional, the scene's hero MUST be that primary actor actively performing that action — clearly visible, recognizable, and dominant in the frame. You may NOT replace them with a generic pedestrian, traffic police, an empty road or venue, or a lone object/symbol. The SUPPORTING PROPS (e.g. helmet, zebra crossing, traffic signal, road markings) may enrich the scene but must stay secondary and never become the subject. Echo the actor and action back in the narrativeAnchor field. For an advertising-style brief, still make it feel like a premium, art-directed civic campaign — never a generic stock road photo.

HOW TO THINK:
1. EVENT FAMILY FIRST. Match the emotional register exactly. A birthday/celebration is joyful and alive; a memorial is reverent and still; a sports event is kinetic; an academic summit is premium and focused; an awareness cause is earnest. NEVER conflate (no memorial vocabulary on a birthday, no empty venue for a live people-celebration).
2. SUBJECT TREATMENT follows compositionStrategy: portrait-hero = one human subject dominant with a clean environment behind; activity-collage = a populated, on-theme scene with real people mid-action (never an empty venue or a lone floating emblem); concept-iconic = a single bold symbol in generous negative space (only when the brief is genuinely an abstract idea/product, not a people-event); environment-scene = a place rendered with depth; object-hero = a product as the dramatic subject.
3. REGION = contemporary, not heritage-by-default. If a region is given (e.g. tamil-nadu), render authentic contemporary people and settings of that region — not generic North-Indian or dated motifs — unless the brief is explicitly traditional.
4. BRAND COLOR woven naturally as light, accent, atmosphere, and material — describe roughly how much of the frame each color occupies so the model renders luminous accents rather than washing them out.
5. LEAVE ROOM FOR TYPE. The composition should keep a quiet upper region and a quiet lower region as soft atmospheric continuation — no busy detail there — because headline and footer typography overlay those areas later.

OUTPUT — return ONLY a single JSON object, no prose around it, with EXACTLY these keys:
{
  "creativeTheme": "short named concept, e.g. Bright Compass Career Navigator",
  "heroElement": { "kind": "environment|iconic-symbol|abstract-field|object|atmospheric|portrait", "description": "what the art centers on" },
  "sceneNarrative": "2-4 sentences describing the background WORLD only — no text, no logos. Concrete and sensory. For actor-led strategies, the primary actor performing the primary action is the visible hero.",
  "narrativeAnchor": { "primaryActor": "the hero people/subject of the scene", "primaryAction": "what they are actively doing", "mustRemainVisible": true, "supportingSymbols": ["prop", "prop"] },
  "lightingStyle": "the light for THIS event, e.g. golden-hour directional sun, long warm shadows",
  "compositionFeel": "spatial feel, e.g. asymmetric, depth-receding, generous negative space",
  "paletteDirection": "how the brand colors distribute across the art",
  "negativeSpaceStrategy": "how negative space is used and where the typography will breathe",
  "moodWords": ["3-5", "mood", "descriptors"],
  "designerReference": "optional: a named photographer or campaign whose look fits",
  "reasoning": "1-2 sentences on why this fits the brief"
}`

interface RawDirection {
  creativeTheme?: string
  narrativeAnchor?: {
    primaryActor?: string
    primaryAction?: string
    mustRemainVisible?: boolean
    supportingSymbols?: string[]
  }
  heroElement?: { kind?: string; description?: string }
  sceneNarrative?: string
  lightingStyle?: string
  compositionFeel?: string
  paletteDirection?: string
  negativeSpaceStrategy?: string
  moodWords?: string[]
  designerReference?: string
  reasoning?: string
}

const VALID_KINDS: HeroElementKind[] = [
  'environment',
  'iconic-symbol',
  'abstract-field',
  'object',
  'atmospheric',
  'portrait',
]

function coerceKind(kind: string | undefined, fallback: HeroElementKind): HeroElementKind {
  return VALID_KINDS.includes(kind as HeroElementKind) ? (kind as HeroElementKind) : fallback
}

function buildUserPrompt(
  context: CreativeContext,
  canonical: CanonicalEvent,
  strategy: StrategySelection,
  anchor: NarrativeAnchor
): string {
  const b = context.brandContext
  const colorLine = [
    `primary ${b.primary}`,
    b.secondary ? `secondary ${b.secondary}` : null,
    b.accent ? `accent ${b.accent}` : null,
  ]
    .filter(Boolean)
    .join(', ')

  return [
    `EVENT: ${canonical.eventName}`,
    canonical.tagline ? `TAGLINE: ${canonical.tagline}` : null,
    canonical.description ? `DESCRIPTION: ${canonical.description}` : null,
    context.audienceContext.targetAudience ? `AUDIENCE: ${context.audienceContext.targetAudience}` : null,
    ``,
    `VISUAL STRATEGY (binding — follow exactly): ${strategy.strategy} — ${strategy.directive}`,
    `PRIMARY ACTOR (must remain the visible hero): ${anchor.primaryActor}`,
    `PRIMARY ACTION: ${anchor.primaryAction}`,
    anchor.supportingSymbols.length
      ? `SUPPORTING PROPS (enrich the scene only — must NOT replace the actor): ${anchor.supportingSymbols.join(', ')}`
      : null,
    `EVENT FAMILY: ${context.emotionalContext.eventFamily}`,
    `EMOTIONAL REGISTER: ${context.emotionalContext.tone} (energy: ${context.emotionalContext.energy}; audience feels: ${context.emotionalContext.audienceEmotion})`,
    `SUBJECT TYPE: ${context.visualContext.subjectType}`,
    `COMPOSITION STRATEGY: ${context.visualContext.compositionStrategy}`,
    `SCENE ENERGY: ${context.visualContext.sceneEnergy}; MOTION: ${context.visualContext.motionLanguage}`,
    context.visualContext.backgroundStyle ? `USER STYLE CHOICE: ${context.visualContext.backgroundStyle}` : null,
    context.visualContext.region ? `REGION: ${context.visualContext.region}` : null,
    `BRAND COLORS: ${colorLine}`,
    b.organizationName ? `ORGANIZATION: ${b.organizationName}` : null,
    ``,
    `Return the creative direction JSON now.`,
  ]
    .filter((l) => l !== null)
    .join('\n')
}

function fallbackDirection(
  context: CreativeContext,
  canonical: CanonicalEvent,
  selection: StrategySelection,
  anchor: NarrativeAnchor
): CreativeDirection {
  const family = context.emotionalContext.eventFamily
  const subjectType = context.visualContext.subjectType
  const composition = context.visualContext.compositionStrategy
  const b = context.brandContext
  const colorMention = `${b.primary}${b.secondary ? ` and ${b.secondary}` : ''}`

  // The chosen visual strategy leads — this is what keeps the offline fallback
  // from drifting (e.g. activity-driven stays populated, never a lone symbol).
  let kind: HeroElementKind = 'atmospheric'
  let sceneNarrative: string
  if (selection.strategy === 'activity-driven') {
    kind = 'environment'
    sceneNarrative = `A vibrant, premium civic-campaign scene with ${anchor.primaryActor} as the clear hero, ${anchor.primaryAction}, mid-action inside a believable on-theme setting, warm directional light and genuine depth.${anchor.supportingSymbols.length ? ` ${anchor.supportingSymbols.join(', ')} support the scene as secondary props.` : ''} The ${colorMention} palette carries across the space as light and atmosphere. Real people are the subject — never an empty venue or a lone emblem.`
  } else if (selection.strategy === 'symbolic' || subjectType === 'concept' || composition === 'concept-iconic') {
    kind = 'iconic-symbol'
    sceneNarrative = `A single bold symbolic form embodying the message, set in a smooth gradient field of the ${colorMention} palette, with generous negative space and restrained, confident composition.`
  } else if (
    selection.strategy === 'emotional' ||
    ((subjectType === 'person' || composition === 'portrait-hero') &&
      (family === 'MEMORIAL-DECEASED' || family === 'TRIBUTE-LIVING'))
  ) {
    kind = 'portrait'
    sceneNarrative = `An intimate, emotionally resonant environment behind a single human subject, soft directional light and a tender atmosphere in a ${colorMention} palette, with quiet open space above and below.`
  } else if (subjectType === 'person' || composition === 'portrait-hero' || selection.strategy === 'documentary') {
    kind = 'portrait'
    sceneNarrative = `A clean, authentic environment behind a human subject, natural directional light and gentle depth, calm uncluttered surroundings in a ${colorMention} palette, with quiet open space above and below.`
  } else {
    sceneNarrative = `A modern atmospheric backdrop in the ${colorMention} palette with generous negative space and an editorial, contemporary sensibility.`
  }

  return {
    creativeTheme: `${family.replace(/-/g, ' ').toLowerCase()} composition`,
    visualStrategy: selection.strategy,
    narrativeAnchor: anchor,
    heroElement: { kind, description: sceneNarrative.split('.')[0] },
    sceneNarrative,
    lightingStyle: 'soft natural directional light with gentle fill and clear depth',
    compositionFeel: 'balanced, generous negative space, quiet upper and lower regions',
    paletteDirection: `${colorMention} woven through light and atmosphere; luminous accents kept vivid`,
    negativeSpaceStrategy: 'quiet upper and lower bands left open for typography overlay',
    moodWords: context.emotionalContext.tone.split(/,\s*/).slice(0, 4),
    reasoning: 'Generated from rule-based fallback (API unavailable or output malformed).',
    source: 'fallback',
  }
}

export async function runCreativeDirector(
  context: CreativeContext,
  canonical: CanonicalEvent,
  strategy: StrategySelection,
  cfg: EngineConfig
): Promise<CreativeDirection> {
  const anchor = deriveNarrativeAnchor(canonical, strategy)
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (cfg.forceFallback || !apiKey) {
    return fallbackDirection(context, canonical, strategy, anchor)
  }

  const startMs = Date.now()
  const anthropic = new Anthropic({ apiKey })

  try {
    const response = await anthropic.messages.create(
      {
        model: DIRECTOR_MODEL,
        max_tokens: MAX_OUTPUT_TOKENS,
        temperature: 0.85,
        system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
        messages: [{ role: 'user', content: buildUserPrompt(context, canonical, strategy, anchor) }],
      },
      { signal: cfg.signal }
    )

    const latencyMs = Date.now() - startMs
    const inputTokens = response.usage.input_tokens
    const outputTokens = response.usage.output_tokens
    const cachedTokens = (response.usage as { cache_read_input_tokens?: number }).cache_read_input_tokens ?? 0

    const textBlock = response.content.find((c) => c.type === 'text')
    if (!textBlock || textBlock.type !== 'text') return fallbackDirection(context, canonical, strategy, anchor)

    const parsed = safeJsonParse<RawDirection>(textBlock.text)
    if (!parsed || typeof parsed.sceneNarrative !== 'string' || parsed.sceneNarrative.length < 40) {
      return fallbackDirection(context, canonical, strategy, anchor)
    }

    const fb = fallbackDirection(context, canonical, strategy, anchor)
    // Actor preservation: when the actor must remain visible, FORCE the derived
    // primaryActor (the binding identity) even if the model tried to generalize it.
    const aiAnchor = parsed.narrativeAnchor
    const narrativeAnchor: NarrativeAnchor = {
      primaryActor: anchor.mustRemainVisible
        ? anchor.primaryActor
        : (aiAnchor?.primaryActor || anchor.primaryActor).trim(),
      primaryAction: (aiAnchor?.primaryAction || anchor.primaryAction).trim(),
      mustRemainVisible: anchor.mustRemainVisible || !!aiAnchor?.mustRemainVisible,
      supportingSymbols: aiAnchor?.supportingSymbols?.length
        ? aiAnchor.supportingSymbols.map((s) => String(s).trim()).slice(0, 6)
        : anchor.supportingSymbols,
    }
    const direction: CreativeDirection = {
      creativeTheme: (parsed.creativeTheme || fb.creativeTheme).trim(),
      visualStrategy: strategy.strategy,
      narrativeAnchor,
      heroElement: {
        kind: coerceKind(parsed.heroElement?.kind, fb.heroElement.kind),
        description: (parsed.heroElement?.description || fb.heroElement.description).trim(),
      },
      sceneNarrative: parsed.sceneNarrative.trim(),
      lightingStyle: (parsed.lightingStyle || fb.lightingStyle).trim(),
      compositionFeel: (parsed.compositionFeel || fb.compositionFeel).trim(),
      paletteDirection: (parsed.paletteDirection || fb.paletteDirection).trim(),
      negativeSpaceStrategy: (parsed.negativeSpaceStrategy || fb.negativeSpaceStrategy).trim(),
      moodWords:
        Array.isArray(parsed.moodWords) && parsed.moodWords.length
          ? parsed.moodWords.map((m) => String(m).trim()).slice(0, 5)
          : fb.moodWords,
      designerReference: parsed.designerReference?.trim() || undefined,
      reasoning: (parsed.reasoning || '').trim(),
      source: 'ai',
    }

    if (cfg.trackUsage) {
      try {
        const inputRate = DIRECTOR_MODEL === 'claude-sonnet-4-6' ? 3 / 1_000_000 : 0.25 / 1_000_000
        const outputRate = DIRECTOR_MODEL === 'claude-sonnet-4-6' ? 15 / 1_000_000 : 1.25 / 1_000_000
        await trackApiUsage({
          organizationId: cfg.trackUsage.organizationId,
          userId: cfg.trackUsage.userId,
          creativeId: cfg.trackUsage.creativeId ?? null,
          requestType: 'creative_director_lab',
          provider: 'claude',
          model: DIRECTOR_MODEL,
          inputTokens,
          outputTokens,
          cachedTokens,
          estimatedCostUsd: inputTokens * inputRate + outputTokens * outputRate,
          durationMs: latencyMs,
          success: true,
        })
      } catch {
        /* non-fatal */
      }
    }

    return direction
  } catch {
    return fallbackDirection(context, canonical, strategy, anchor)
  }
}
