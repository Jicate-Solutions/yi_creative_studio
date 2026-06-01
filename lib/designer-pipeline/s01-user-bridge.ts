/**
 * Designer Pipeline — Stage 01: User Bridge
 *
 * The BRIDGE between what the user wrote and what the AI will be told. It reads the
 * raw brief and produces an explicit, inspectable understanding: the event family, the
 * subject DOMAIN, the real actor(s), and plain-English expectation statements. The
 * free-text idea is parsed into role buckets (idea-parser) so a motif/font/colour
 * request never becomes the hero. Nothing here calls an LLM — it is deterministic.
 */

import type { DesignerPipelineInput, EventFamily, UserBridge } from './contracts'
import { IDEA_IMPERATIVE_RE, normalizeActor, parseVisualIdea } from './idea-parser'
import { detectDesignDomain } from './domain-detect'

// ----------------------------------------------------------------------------
// Event-family detection (order matters — first match wins)
// ----------------------------------------------------------------------------

const FAMILY_PATTERNS: Array<{ family: EventFamily; re: RegExp }> = [
  // Greetings / festival wishes — symbolic, NOT a live people-event.
  {
    family: 'greeting',
    re: /\b(diwali|deepavali|pongal|onam|holi|eid|christmas|new\s*year|republic\s*day|independence\s*day|gandhi\s*jayanti|wishes|greetings|happy\b)/i,
  },
  // Nursing / health-worker led.
  { family: 'nursing', re: /\b(nursing|nurse|nurses|health\s*worker|paramedic)/i },
  // Drives (blood/road-safety/cleanliness/plantation…).
  { family: 'drive', re: /\b(drive|rally|camp|cleanup|clean[-\s]?up|plantation|donation)/i },
  // Awareness programmes.
  { family: 'awareness', re: /\b(awareness|sensiti[sz]ation|prevention|hygiene|safety)/i },
  // Campaigns.
  { family: 'campaign', re: /\b(campaign|mission|initiative|movement|outreach)/i },
  // Student / campus life & celebrations.
  {
    family: 'student',
    re: /\b(college|campus|student|students|fresher|department\s*day|inter[-\s]?college)/i,
  },
  // Live celebrations / functions.
  {
    family: 'celebration',
    re: /\b(annual\s*day|college\s*day|cultural|fest|festival|farewell|talent|celebration|function|get[-\s]?together|fete|carnival)/i,
  },
  // Conferences / summits.
  { family: 'conference', re: /\b(conference|summit|symposium|seminar|convention|conclave)/i },
  // Community service.
  { family: 'community', re: /\b(community|village|public|society|welfare|ngo|volunteer)/i },
]

/** Formal documents where copy must be pixel-exact. */
const OFFICIAL_FORMATS =
  /certificate|letterhead|report_cover|book_cover|business_card|id_card|notice|resume/i

function detectEventFamily(input: DesignerPipelineInput, haystack: string): EventFamily {
  // Format/language strongly override toward "official" (deterministic text).
  if (OFFICIAL_FORMATS.test(input.formatId)) return 'official'
  if (input.languageHint && input.languageHint.toLowerCase() !== 'en') return 'official'

  for (const { family, re } of FAMILY_PATTERNS) {
    if (re.test(haystack)) return family
  }
  return 'generic'
}

// ----------------------------------------------------------------------------
// Domain detection — keeps a Makeup Carnival in the beauty world, not a tech hub.
// ----------------------------------------------------------------------------

const DOMAIN_PATTERNS: Array<{ domain: string; participants: string; re: RegExp }> = [
  {
    domain: 'beauty / cosmetics / makeup',
    participants: 'makeup artists / beauty artists',
    re: /\b(makeup|make-?up|cosmetic|beauty|salon|glam|bridal|mehndi|nail|skincare|spa|hairsty|lipstick|mascara)/i,
  },
  {
    domain: 'food / culinary',
    participants: 'chefs / culinary participants',
    re: /\b(food|culinary|chef|bak(?:e|ing)|cuisine|restaurant|cook(?:ing|out)?|barista|patisserie|dessert)/i,
  },
  {
    domain: 'fashion / apparel',
    participants: 'models / fashion designers',
    re: /\b(fashion|apparel|couture|runway|textile|boutique|styling|garment)/i,
  },
  {
    domain: 'music / performing arts',
    participants: 'performers / musicians',
    re: /\b(music|concert|band|\bdj\b|orchestra|dance|theatre|theater|drama|singing|choir|recital)/i,
  },
  {
    domain: 'sports / fitness',
    participants: 'athletes / players',
    re: /\b(sport|cricket|football|soccer|marathon|fitness|tournament|athletic|yoga|\bgym\b)/i,
  },
  {
    domain: 'technology',
    participants: 'developers / tech participants',
    re: /\b(tech|technology|coding|hackathon|software|robotics|\bai\b|startup|developer|cyber)/i,
  },
]

function detectDomain(haystack: string): { domain: string; participants: string } | null {
  for (const d of DOMAIN_PATTERNS) {
    if (d.re.test(haystack)) return { domain: d.domain, participants: d.participants }
  }
  return null
}

// ----------------------------------------------------------------------------
// Actor extraction
// ----------------------------------------------------------------------------

const ACTOR_PHRASE_RE =
  /\b(?:by|presented\s+by|organi[sz]ed\s+by|hosted\s+by|conducted\s+by|from)\s+([A-Z][\w&.''-]*(?:\s+[A-Z][\w&.''-]*){0,5})/i

/**
 * Recover the real actor(s) the poster is ABOUT. Priority:
 *   1. the user's idea SUBJECT (people/activity only — parsed, never a motif)
 *   2. the brief's "by/from" grammar (a phrase the image model tends to discard)
 *   3. domain participants (only when NO explicit human actor — a brand org isn't the hero)
 *   4. the organisation, then the target audience
 */
function extractActorCandidates(
  input: DesignerPipelineInput,
  subjectIntent: string[],
  domain: { participants: string } | null
): string[] {
  const candidates: string[] = []

  // 1. Highest priority — the user's stated SUBJECT(s) (people/activity), in order.
  for (const s of subjectIntent) if (s) candidates.push(s)

  // 2. Brief grammar ("…by JKKN Nursing Students").
  const sources = [input.eventName, input.tagline, input.description].filter(Boolean) as string[]
  for (const text of sources) {
    const m = text.match(ACTOR_PHRASE_RE)
    if (m && m[1]) {
      const norm = normalizeActor(m[1])
      if (norm) candidates.push(norm)
    }
  }

  // 3. Domain participants — only when no explicit human actor was found, so a brand
  //    name (organisation) never becomes the visible hero of a people-event.
  const hasExplicitHuman = candidates.length > 0
  if (!hasExplicitHuman && domain?.participants) candidates.push(domain.participants)

  // 4. Organisation, then target audience.
  if (input.organizationName) candidates.push(normalizeActor(input.organizationName))
  if (input.targetAudience) candidates.push(normalizeActor(input.targetAudience))

  // De-duplicate, PRESERVING priority order.
  const seen = new Set<string>()
  const unique: string[] = []
  for (const c of candidates) {
    const key = c.toLowerCase()
    if (c && !seen.has(key)) {
      seen.add(key)
      unique.push(c)
    }
  }
  return unique
}

// ----------------------------------------------------------------------------
// Topic + expectation framing
// ----------------------------------------------------------------------------

function deriveInterpretedTopic(input: DesignerPipelineInput, idea: string): string {
  const topic = (input.eventName ?? '').replace(ACTOR_PHRASE_RE, '').replace(/\s{2,}/g, ' ').trim()
  if (topic) return topic.toLowerCase()
  if (idea) return idea.replace(IDEA_IMPERATIVE_RE, '').trim().toLowerCase()
  return (input.eventName ?? '').toLowerCase()
}

/** The user's idea text (userVisualIdea wins over creativeDirection). */
function resolveIdea(input: DesignerPipelineInput): string {
  return (input.userVisualIdea ?? input.creativeDirection ?? '').trim()
}

export function buildUserBridge(input: DesignerPipelineInput): UserBridge {
  const idea = resolveIdea(input)
  const parsedIdea = parseVisualIdea(idea)

  // The idea is part of the signal corpus for family + domain detection too.
  const haystack = [input.eventName, input.tagline, input.description, input.targetAudience, idea]
    .filter(Boolean)
    .join(' ')

  const detectedEventFamily = detectEventFamily(input, haystack)
  const domainHit = detectDomain(haystack)
  // v1.1 — structured coarse domain lock (drift-forbidding) alongside the legacy label.
  const domainLock = detectDesignDomain(haystack, input.formatId)
  const actorCandidates = extractActorCandidates(input, parsedIdea.subjectIntent, domainHit)
  const interpretedTopic = deriveInterpretedTopic(input, idea)

  const expectationStatements: string[] = []
  const assumptions: string[] = []

  // The user's own idea is the primary direction — surface it first.
  if (idea) {
    expectationStatements.push(`User's own visual idea: "${idea}" — honour it as the primary direction.`)
  }

  const peopleLed = (
    ['awareness', 'student', 'community', 'nursing', 'drive', 'campaign', 'celebration'] as EventFamily[]
  ).includes(detectedEventFamily)

  if (peopleLed) {
    const who = actorCandidates[0] ?? input.targetAudience ?? 'the participants'
    expectationStatements.push(
      `User expects ${who} to be the visible, central hero — actively taking part, not replaced by a symbol.`
    )
    expectationStatements.push(
      `This is a real, on-the-ground "${interpretedTopic}" — the scene should show people doing it.`
    )
    if (actorCandidates.length === 0) {
      assumptions.push('No explicit actor was named, so the target audience is treated as the hero.')
    }
  } else if (detectedEventFamily === 'greeting') {
    expectationStatements.push(
      `User expects a festive "${interpretedTopic}" greeting — a symbolic, celebratory composition.`
    )
  } else if (detectedEventFamily === 'official') {
    expectationStatements.push(
      `User expects a formal, brand-safe "${interpretedTopic}" with exact, legible text.`
    )
  } else {
    expectationStatements.push(`User expects a clear, on-brand "${interpretedTopic}" composition.`)
  }

  // Lock the world to the detected domain.
  if (domainHit) {
    expectationStatements.push(
      `Domain: ${domainHit.domain}. Keep the world consistent — do NOT reinterpret it as a tech / corporate / office scene.`
    )
  }

  return {
    rawEventName: input.eventName,
    interpretedTopic,
    detectedEventFamily,
    actorCandidates,
    expectationStatements,
    assumptions,
    userVisualIdea: idea || undefined,
    domain: domainHit?.domain,
    domainLock,
    parsedIdea,
  }
}
