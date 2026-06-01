/**
 * Designer Pipeline — Stage 02: Design Intent
 *
 * Turns the bridge into an actor-preservation contract. For people-events
 * (awareness/student/community/nursing/drive/campaign/celebration) the narrative
 * is LOCKED to actor-led + activity-driven: the real people stay the hero, and any
 * thematic symbol (helmet, zebra crossing, road sign) is demoted to a SUPPORTING
 * prop that must never replace them. This is the deterministic fix for "empty road
 * + floating helmet" posters.
 */

import {
  ACTOR_LED_FAMILIES,
  type DesignerPipelineInput,
  type DesignIntent,
  type EventFamily,
  type NarrativeMode,
  type UserBridge,
  type VisualStrategy,
} from './contracts'

/**
 * Topic → supporting symbols + the topic-specific "empty scene" failure mode.
 * Keys are matched as substrings against the interpreted topic (lower-cased).
 */
const TOPIC_SYMBOLS: Array<{
  re: RegExp
  symbols: string[]
  emptyScene: string
  loneSymbol: string
  stockImage: string
}> = [
  {
    re: /road|traffic|drive|helmet|vehicle/,
    symbols: ['helmet', 'zebra crossing', 'road signs', 'traffic signal'],
    emptyScene: 'empty road',
    loneSymbol: 'only helmet symbol',
    stockImage: 'generic road stock image',
  },
  {
    re: /blood|donation/,
    symbols: ['blood drop icon', 'donation kit', 'red ribbon'],
    emptyScene: 'empty donation hall',
    loneSymbol: 'only a floating blood-drop icon',
    stockImage: 'generic medical stock image',
  },
  {
    re: /tree|plantation|environment|green|clean/,
    symbols: ['saplings', 'gloves', 'reusable bags'],
    emptyScene: 'empty field with no people',
    loneSymbol: 'only a single tree icon',
    stockImage: 'generic nature stock image',
  },
  {
    re: /health|hygiene|nursing|medical|wellness/,
    symbols: ['medical kit', 'health checklist', 'cross emblem'],
    emptyScene: 'empty clinic',
    loneSymbol: 'only a floating medical cross',
    stockImage: 'generic healthcare stock image',
  },
]

function deriveSymbolProfile(text: string) {
  for (const entry of TOPIC_SYMBOLS) {
    if (entry.re.test(text)) return entry
  }
  return null
}

/**
 * Concrete elements a brief / idea may call for. When the user's visual idea (or the
 * topic) mentions one, it becomes a MUST-SHOW so the AI keeps it in the composition
 * rather than reducing the scene to a lone symbol.
 */
const ELEMENT_KEYWORDS: Array<{ re: RegExp; show: string }> = [
  { re: /helmet/i, show: 'helmet guidance (riders being helped to wear helmets)' },
  { re: /zebra\s*cross|crosswalk|crossing/i, show: 'zebra crossing' },
  { re: /rider|commuter|motorist|biker|two[-\s]?wheeler|pedestrian|traffic/i, show: 'commuters' },
  { re: /signal|traffic\s*light/i, show: 'traffic signal' },
  { re: /sapling|plantation|\btree(s)?\b|planting/i, show: 'saplings being planted' },
  { re: /blood/i, show: 'a live blood-donation moment' },
  { re: /\bmask|sanitiz|hygiene\b/i, show: 'hygiene practice in action' },
]

function deriveMustShow(combinedText: string): string[] {
  const out: string[] = []
  for (const { re, show } of ELEMENT_KEYWORDS) {
    if (re.test(combinedText)) out.push(show)
  }
  return out
}

function narrativeFor(family: EventFamily): NarrativeMode {
  if (ACTOR_LED_FAMILIES.includes(family)) return 'actor-led'
  if (family === 'greeting') return 'concept-led'
  return 'concept-led'
}

function strategyFor(family: EventFamily): VisualStrategy {
  if (ACTOR_LED_FAMILIES.includes(family)) return 'activity-driven'
  if (family === 'greeting') return 'symbolic'
  if (family === 'conference' || family === 'official') return 'institutional'
  return 'editorial-minimal'
}

export function buildDesignIntent(bridge: UserBridge, input: DesignerPipelineInput): DesignIntent {
  const family = bridge.detectedEventFamily
  const narrativeMode = narrativeFor(family)
  const visualStrategy = strategyFor(family)

  // The user's idea is part of the corpus for symbol + element detection, so an idea
  // that only appears in the free-text (not the event name) still drives the scene.
  const combinedText = [bridge.interpretedTopic, bridge.userVisualIdea].filter(Boolean).join(' ')
  const symbolProfile = deriveSymbolProfile(combinedText)

  // mainSubject fallback chain — never let the hero be empty. The user's parsed actor /
  // brief grammar leads (actorCandidates); when absent we fall back, in order, through the
  // event name → tagline → description → organisation → audience → format-aware default.
  const fallbackChain = [
    bridge.actorCandidates[0],
    input.targetAudience,
    input.eventName,
    input.tagline,
    input.description,
    input.organizationName,
    narrativeMode === 'actor-led' ? 'the participants' : undefined,
    bridge.interpretedTopic,
    'the subject',
  ]
  const mainSubject =
    fallbackChain.find((c) => c && c.trim().length > 0)?.trim() ?? 'the subject'

  const supportingSymbols = symbolProfile ? symbolProfile.symbols : []

  // Background motifs / textures the user asked for live BEHIND the hero (never the subject).
  const backgroundMotifs = bridge.parsedIdea?.visualMotifs ?? []

  const mustShow: string[] = []
  const mustPreserve: string[] = []
  const mustAvoid: string[] = []

  // Concrete elements the user asked for (or the topic implies) — keep them visible.
  const elements = deriveMustShow(combinedText)

  if (narrativeMode === 'actor-led') {
    // The hero leads the must-show list, followed by the user's named elements.
    mustShow.push(mainSubject, ...elements)
    mustPreserve.push('the actual people/activity', mainSubject)
    // Topic-specific empty scene + the "symbol replaces actor" failure modes.
    if (symbolProfile) {
      mustAvoid.push(symbolProfile.emptyScene, symbolProfile.loneSymbol, symbolProfile.stockImage)
    }
    mustAvoid.push('floating emblem with no people', 'generic stock photo with no real activity')
    // Keep the world in the detected domain (don't drift to a tech/office scene).
    if (bridge.domain) {
      mustAvoid.push(`unrelated tech / corporate / office setting (this is a ${bridge.domain} event)`)
    }
  } else if (narrativeMode === 'concept-led') {
    mustShow.push(...elements)
    mustPreserve.push('a single clear iconic idea')
    mustAvoid.push('cluttered collage', 'unreadable busy background')
  } else {
    mustShow.push(...elements)
  }

  // De-duplicate mustShow while preserving order (hero first).
  const seen = new Set<string>()
  const dedupedMustShow = mustShow.filter((s) => {
    const k = s.toLowerCase()
    if (!s || seen.has(k)) return false
    seen.add(k)
    return true
  })

  return {
    mainSubject,
    narrativeMode,
    visualStrategy,
    supportingSymbols,
    backgroundMotifs,
    mustShow: dedupedMustShow,
    mustPreserve,
    mustAvoid,
  }
}
