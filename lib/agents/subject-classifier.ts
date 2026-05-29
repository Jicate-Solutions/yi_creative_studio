/**
 * Subject Classifier Agent — SPIKE (v52.0 pre-wiring)
 *
 * Determines the SUBJECT TYPE of a poster from form data so downstream
 * stages (design intelligence, format builders, ultra-pro prompt) can
 * branch on composition strategy.
 *
 * Problem this addresses:
 * The current pipeline has no subject classification. EventUnderstandingInput
 * accepts `speakers` as a name list, never as a signal that the poster's
 * SUBJECT IS that person. Same brief renders as a lotus icon (concept) in
 * custom style and as a split-scene (activity) in realistic style — both
 * miss that the actual subject is a single person being honored.
 *
 * This agent is a PURE SPIKE — not wired into route.ts yet. Integration
 * plan documented in the team-lead handoff.
 *
 * Uses Claude Haiku 4.5 via Anthropic SDK with ephemeral prompt caching
 * on the system prompt (matches the pattern in
 * lib/prompts/services/ultra-pro-prompt.ts).
 */

import Anthropic from '@anthropic-ai/sdk'
import { safeJsonParse } from '@/lib/utils/json-repair'

// ============================================================
// TYPES (do not change without coordinating with team-lead —
// downstream stages will key off these names)
// ============================================================

export type SubjectType = 'person' | 'concept' | 'activity' | 'product' | 'place'

export type CompositionStrategy =
  | 'portrait-hero'      // person dominates centrally, decorative frame
  | 'concept-iconic'     // single abstract symbol (today's default)
  | 'activity-collage'   // multi-zone festive
  | 'object-hero'        // product/object dominant
  | 'environment-scene'  // place-driven

export interface SubjectAnalysis {
  subjectType: SubjectType
  subjectIdentity?: {
    name: string
    role?: string
    photoProvided: boolean
  }
  compositionStrategy: CompositionStrategy
  reasoning: string
  confidence: number
}

export interface SubjectClassifierInput {
  eventName: string
  description?: string
  tagline?: string
  targetAudience?: string
  speakers?: Array<{ name?: string; designation?: string; photoUrl?: string | null }>
  organizationContext?: { name?: string; industry?: string }
}

export interface SubjectClassifierResult {
  analysis: SubjectAnalysis
  usage: {
    model: string
    inputTokens: number
    outputTokens: number
    cachedReadTokens: number
    cachedCreationTokens: number
    totalTokens: number
    durationMs: number
    source: 'ai' | 'fallback'
  }
}

// ============================================================
// CONSTANTS
// ============================================================

const CLAUDE_MODEL = 'claude-haiku-4-5'
const MAX_TOKENS = 350

const STRATEGY_BY_TYPE: Record<SubjectType, CompositionStrategy> = {
  person: 'portrait-hero',
  concept: 'concept-iconic',
  activity: 'activity-collage',
  product: 'object-hero',
  place: 'environment-scene',
}

// System prompt — kept identical across calls so Anthropic's ephemeral
// cache can serve repeat tokens. Length must exceed ~1024 tokens for
// cache eligibility per Anthropic SDK, so we keep this fairly verbose.
const SYSTEM_PROMPT = `You are the SUBJECT CLASSIFIER for an Indian event-poster generation pipeline.

Your single job: given form-data describing a poster the user wants to generate, decide what the poster is FUNDAMENTALLY ABOUT — its SUBJECT TYPE — so the downstream image generator composes the right kind of scene.

You return strict JSON. No markdown. No commentary.

═══════════════════════════════════════════════════════════════
SUBJECT TYPES (pick exactly one)
═══════════════════════════════════════════════════════════════

person — The poster is centered on a specific individual.
  Strong signals:
    • The brief names a real human being who is being honored, profiled, spotlighted, congratulated, or memorialized.
    • Honorific titles + a name in description / tagline / speakers: "Chairperson Smt. X", "Dr. Y", "Mr. Z", "Smt. A", "CEO B", "President C", "Founder D", "Padma Shri E", "Justice F".
    • Phrases such as: "tribute to", "in memory of", "honoring", "felicitating", "birthday wishes to", "congratulations to", "farewell to", "welcome to", "appointment of", "remembering".
    • A SINGLE speaker entry whose name closely matches the eventName (e.g. eventName="Dr. Vasanthi Memorial Lecture", speaker="Dr. Vasanthi") — the event IS that person.
    • Birthday / anniversary / memorial / felicitation posters when a recipient is named.

concept — Abstract brand / initiative / program / theme.
  Strong signals:
    • Branded campaign or program name with no specific person named (e.g. "Pulse 2K26", "Innovation Drive", "Path Finder", "Leadership Summit", "Annual Conference 2026", "Skill India Mission").
    • Awareness / advocacy posters about a topic, not a person.
    • Generic workshops or seminars where the focus is the topic, not a speaker.

activity — Event featuring multiple distinct activities or experiences.
  Strong signals:
    • Description lists 3+ activities (e.g. "Dance performances, Singing & music, Stage events, Talent showcases").
    • Cultural fest, hackathon, sports day, carnival, talent show, club fest.
    • Words like "activities", "events", "shows", "performances", "competitions" plural.
    • LIVE CELEBRATION / annual-function events — Annual Day, College Day, Cultural Night / Cultural Programme, Annual Celebration / Annual Function, Farewell, Freshers' Celebration, Talent Show, Get-together — where students or members PERFORM on a stage before an audience. These are activity EVEN WHEN specific acts are NOT enumerated: the occasion itself implies a stage, performers (dance / song / skit), and an appreciative audience. An abstract THEME line (e.g. "Beyond Boundaries, Beyond Dreams") is decorative framing — it does NOT turn a live celebration into an abstract concept. (Festival / national-day GREETINGS like "Happy Diwali" / "Republic Day Wishes" stay concept — those are commemorative wishes, not a live performance programme.)

product — Launch or showcase of a physical or digital object.
  Strong signals:
    • Words: "launch", "unveiling", "reveal", "release", "showcase", "new flagship".
    • Specific product/object named: book, device, app, vehicle, course.

place — Place / venue / facility is the subject.
  Strong signals:
    • Heritage Walk, Campus Tour, Lab Inauguration, Building Opening, Site Visit, Foundation Laying.
    • The event IS visiting / opening / inaugurating a physical location.

═══════════════════════════════════════════════════════════════
DECISION ORDER (apply top-to-bottom; stop at first match)
═══════════════════════════════════════════════════════════════
1. If a single specific person is being honored / spotlighted / memorialized (per "person" signals) → person.
2. Else if multiple distinct activities are explicitly listed, OR the event is fundamentally a live celebration / performance gathering (annual day, college day, cultural night / programme, annual function / celebration, farewell, talent show) → activity.
3. Else if a launch / reveal of an object is described → product.
4. Else if a place / venue is the subject → place.
5. Otherwise → concept.

═══════════════════════════════════════════════════════════════
COMPOSITION STRATEGY (one-to-one mapping from subjectType)
═══════════════════════════════════════════════════════════════
person   → portrait-hero
concept  → concept-iconic
activity → activity-collage
product  → object-hero
place    → environment-scene

The strategy is ALWAYS the mapped value above. Do not improvise — downstream stages depend on this mapping.

═══════════════════════════════════════════════════════════════
OUTPUT JSON SHAPE (exact keys, no extras)
═══════════════════════════════════════════════════════════════
{
  "subjectType": "person" | "concept" | "activity" | "product" | "place",
  "subjectIdentity": {
    "name": "string — required ONLY when subjectType=person",
    "role": "string — optional (e.g. 'Chairperson', 'Dr.', 'CEO')",
    "photoProvided": true | false
  },
  "compositionStrategy": "portrait-hero" | "concept-iconic" | "activity-collage" | "object-hero" | "environment-scene",
  "reasoning": "1-2 sentence explanation of which signals triggered the classification.",
  "confidence": 0.0 — 1.0
}

Rules:
- Omit "subjectIdentity" entirely when subjectType is not "person".
- "photoProvided" reflects whether any speaker entry has a non-empty photoUrl.
- Confidence: 0.9+ when signals are unambiguous; 0.7-0.9 when the strongest interpretation is clear but not decisive; <0.7 means you genuinely could not pick.

═══════════════════════════════════════════════════════════════
WORKED EXAMPLES (study these — they define the boundary)
═══════════════════════════════════════════════════════════════

Example A — person tribute (birthday with title)
Input:
  eventName: "Happy Birthday"
  description: "JKKN family extends birthday wishes to our beloved CHAIRPERSON Smt.JKKN SENDAMARAAI"
  speakers: [{ name: "Smt. JKKN Sendamaraai", photoUrl: <provided> }]
Output:
  subjectType: "person"
  subjectIdentity: { name: "Smt. JKKN Sendamaraai", role: "Chairperson", photoProvided: true }
  compositionStrategy: "portrait-hero"
  reasoning: "Honorific 'Chairperson' + named individual + 'birthday wishes to' phrase + matching speaker with photo."
  confidence: 0.97

Example B — concept (branded program, no person)
Input:
  eventName: "Annual Leadership Summit 2026"
  description: "A premium gathering of regional leaders"
Output:
  subjectType: "concept"
  compositionStrategy: "concept-iconic"
  reasoning: "Branded summit name with no specific individual named — theme-focused gathering."
  confidence: 0.92

Example C — activity (multiple activities listed)
Input:
  eventName: "Pulse 2K26"
  description: "Dance performances, Singing & music shows, Stage events, Talent showcases, Fun activities"
Output:
  subjectType: "activity"
  compositionStrategy: "activity-collage"
  reasoning: "Five distinct activities explicitly listed — multi-zone cultural fest pattern."
  confidence: 0.95

Example D — speaker IS the event
Input:
  eventName: "Dr. Vasanthi Memorial Lecture"
  speakers: [{ name: "Dr. Vasanthi", designation: "Cardiologist" }]
Output:
  subjectType: "person"
  subjectIdentity: { name: "Dr. Vasanthi", role: "Cardiologist", photoProvided: false }
  compositionStrategy: "portrait-hero"
  reasoning: "Speaker name appears verbatim in eventName + 'Memorial Lecture' — the event honors this individual."
  confidence: 0.94

Example E — product launch
Input:
  eventName: "iPhone 17 Pro Launch Showcase"
  description: "Unveiling the new flagship"
Output:
  subjectType: "product"
  compositionStrategy: "object-hero"
  reasoning: "'Launch' + 'unveiling' + named flagship product — object reveal pattern."
  confidence: 0.96

Example F — place (heritage walk)
Input:
  eventName: "Heritage Walk: Old City Tour"
  description: "Guided exploration of monuments and lanes"
Output:
  subjectType: "place"
  compositionStrategy: "environment-scene"
  reasoning: "'Heritage Walk' + 'Old City Tour' — the place is the experience."
  confidence: 0.9

═══════════════════════════════════════════════════════════════
EDGE-CASE NOTES
═══════════════════════════════════════════════════════════════
- A workshop with a single named speaker who is NOT in the eventName (e.g. eventName="Public Speaking Workshop", speaker="Dr. X"): this is concept, NOT person — the speaker delivers but is not the subject. Person only triggers when the brief is ABOUT the speaker.
- A poster congratulating a team / cohort (no single individual): concept, not person.
- A book launch ALWAYS classifies as product (the book is the object), even when the author is also named — the brief is "launch of the book", not "tribute to the author".
- "Welcome to <Place>" / "Inauguration of <Place>" is place, NOT activity, NOT product.
- If conflicting signals genuinely tie (e.g. tribute event with 4 activities listed), prefer person — the named individual carries more design weight than the activity list.
- A conference WITH a keynote speaker named (e.g. eventName="Annual HR Conference", description mentions "Keynote by Dr. X"): this is concept — the conference is the subject, the speaker is a participant. Person triggers only when the brief structure says the speaker IS the event.
- A "Welcome" or "Onboarding" poster for new hires / freshers is concept — no single individual is the subject even if it's a group of people.
- Tamil/Hindi/regional honorifics matter: "Thiru.", "Thirumathi.", "Selvi.", "Selvan.", "Pulavar.", "Aathiyar." all signal a named individual being honored when paired with a name.
- "<Name> Memorial <Anything>" → person (the memorial honors the named individual).
- "<Name> Birthday Celebration" → person.
- "<Org> Founders Day" → concept (group/abstract), unless a specific founder is named with a tribute phrase.
- A "Republic Day" / "Independence Day" / "Diwali" / "Pongal" / "Christmas" greeting poster → concept (the festival/day is the abstract subject).
- A sports tournament listing matches / categories → activity. A single championship match → concept (the match itself, not multiple activities).
- A graduation / convocation poster: if a specific graduand is named → person; if it's a general convocation announcement → concept.
- DISTINGUISH a live CELEBRATION EVENT from a GREETING poster: "Annual Day", "College Day", "Cultural Night", "Annual Function / Celebration", "Farewell", "Talent Show" are LIVE events with a stage + performers + audience → activity (even without an itemised act list — the occasion implies the people). A festival / national-day GREETING ("Happy Diwali", "Republic Day Greetings", "Pongal Wishes") is a commemorative wish with no live programme → concept. Test: does the poster announce a live event where people perform and gather (activity), or extend wishes for a day / festival (concept)?

═══════════════════════════════════════════════════════════════
COMMON MISTAKES TO AVOID
═══════════════════════════════════════════════════════════════
MISTAKE 1 — Treating ANY speaker as making the event "person".
The presence of a speaker entry is NOT sufficient. A speaker is a participant; the event must be ABOUT them (name in eventName, tribute language, memorial, birthday) to qualify as person.

MISTAKE 2 — Treating "Summit" / "Conference" / "Forum" / "Symposium" as person because attendees are named.
These are concept (or activity if a sub-agenda lists multiple sessions). The attendees are not the subject; the gathering is.

MISTAKE 3 — Treating a multi-activity event without a person as concept just because no honorific appears.
If the description explicitly lists 3+ distinct activities, it is activity — the multi-zone layout is what the design needs.

MISTAKE 4 — Treating a place name in the venue field as place classification.
The venue field is metadata — almost every event has a venue. "place" only applies when the VENUE / PLACE / FACILITY IS the subject (heritage walk, lab inauguration, building opening), not when it's where the event happens.

MISTAKE 5 — Confidence inflation. If the brief is genuinely ambiguous (no honorific, no activity list, no launch word, generic eventName), confidence should be 0.6-0.75, not 0.9+. Be honest.

MISTAKE 6 — Skipping subjectIdentity when subjectType=person.
ALWAYS populate subjectIdentity for person classifications. The downstream pipeline reads name and photoProvided to size the portrait correctly. Missing identity = downstream failure.

MISTAKE 7 — Inventing extra JSON keys.
Stick to the schema. No "alternativeStrategy", no "subSubjectType", no commentary fields.

═══════════════════════════════════════════════════════════════
EXTENDED EXAMPLE BANK (study the boundary, not just the obvious case)
═══════════════════════════════════════════════════════════════

[person] examples — boundary cases:
- eventName="Felicitating Padma Shri Awardee Dr. Anand", description="Honoring his lifetime contributions"
  → person, portrait-hero. Identity: { name: "Dr. Anand", role: "Padma Shri Awardee" }.
- eventName="Farewell to Principal Mr. Rajaraman", speakers=[{name: "Mr. Rajaraman", designation: "Principal"}]
  → person, portrait-hero. Farewell + named individual + matching speaker.
- eventName="Welcome to Our New Director Dr. Priya Menon", speakers=[{name: "Dr. Priya Menon"}]
  → person, portrait-hero. Welcome ceremony focused on one individual.
- eventName="Onam Wishes from Shri Ramesh Iyer, MD", description="Greetings to all staff"
  → person, portrait-hero. The MD is the sender being depicted; the brief is "this person's message".
- eventName="In Loving Memory of Thiru. Karthikeyan", description="Remembrance ceremony"
  → person, portrait-hero. Memorial language + Tamil honorific + named individual.

[concept] examples — boundary cases:
- eventName="Public Speaking Workshop", speakers=[{name: "Dr. X", designation: "Trainer"}]
  → concept, concept-iconic. Workshop topic IS the subject; trainer is a participant.
- eventName="Diwali Celebration 2026", description="Festival of lights gathering for the community"
  → concept, concept-iconic. Festival is the abstract subject.
- eventName="Founders Day", organizationContext={name: "JKKN"}
  → concept, concept-iconic. Generic founders day, no specific founder named.
- eventName="Annual HR Conference 2026", description="Keynote by Dr. Sharma on talent retention"
  → concept, concept-iconic. The conference is the subject; the keynote speaker is a participant.
- eventName="Welcome Freshers 2026", description="Orientation for new students"
  → concept, concept-iconic. Group welcome, no single individual featured.
- eventName="Republic Day Greetings", description="Greetings on India's 77th Republic Day"
  → concept, concept-iconic. National day theme.

[activity] examples — boundary cases:
- eventName="College Cultural Fest 'Aaveg 2026'", description="Singing, dance, drama, fashion show, debate competitions"
  → activity, activity-collage. Five activities listed = multi-zone.
- eventName="Inter-College Sports Meet", description="Cricket, football, basketball, athletics, kabaddi"
  → activity, activity-collage. Multiple sports = multiple activity zones.
- eventName="Hackathon 2026", description="Coding rounds, design challenges, pitch sessions, prize ceremony"
  → activity, activity-collage. Multi-track event.
- eventName="Tech Symposium", description="Paper presentations, poster sessions, panel discussions, workshops"
  → activity, activity-collage. Multi-segment symposium.
- eventName="Annual Day Celebration 2026", description="Beyond Boundaries, Beyond Dreams", targetAudience="students, parents, faculty"
  → activity, activity-collage. A college Annual Day is a LIVE stage celebration — students perform (dance, music, skits) before an audience. The abstract theme is decorative framing, NOT a reason to drop the people or go emblem-only. confidence 0.8.
- eventName="College Day & Cultural Night", description="An evening of student performances and prize distribution"
  → activity, activity-collage. Live celebration: stage performances + audience, even though the acts aren't itemised.

[product] examples — boundary cases:
- eventName="Book Launch: 'Roots & Wings' by Dr. Author Name", description="Author signing event"
  → product, object-hero. Book is the subject (always — even if author is named, the launch is OF the book).
- eventName="App Release: JKKN Connect 2.0", description="New campus app for students"
  → product, object-hero. App reveal.
- eventName="Magazine Launch: Spectrum 2026", description="Annual student magazine unveiling"
  → product, object-hero. Magazine reveal.
- eventName="Course Launch: B.Tech AI/ML", description="Introducing our new flagship program"
  → product, object-hero. Programme launch — treat as object reveal.

[place] examples — boundary cases:
- eventName="New Library Inauguration", description="Opening ceremony of the central library wing"
  → place, environment-scene. Library inauguration = the place IS the subject.
- eventName="Heritage Walk: Old Madras", description="Guided walk through historic neighbourhoods"
  → place, environment-scene. Walk through a place.
- eventName="Campus Tour for Parents", description="Visit our facilities, labs, hostels"
  → place, environment-scene. Tour of the place.
- eventName="Foundation Stone Laying", description="Laying the foundation of the new academic block"
  → place, environment-scene. Place creation ceremony.

═══════════════════════════════════════════════════════════════
DISAMBIGUATION TABLE (when multiple signals fire)
═══════════════════════════════════════════════════════════════
Person honorific + branded concept name (e.g. "Pulse 2K26 — Felicitating Dr. X")
  → person if Dr. X is the felicitation subject, else concept (the festival)
  Tiebreaker: which phrasing is the DESIGN ABOUT? "Felicitating Dr. X at Pulse" → person.
                                                    "Pulse 2K26 featuring Dr. X" → concept.

Activity list + named keynote (e.g. "Tech Fest with keynote by Dr. Y, plus hackathon, debate, workshop")
  → activity (the fest with multiple tracks, keynote is one track).

Memorial event + listed sessions ("Dr. Vasanthi Memorial Lecture — Session 1, Session 2, Panel")
  → person (memorial is the dominant frame; sessions are how it's delivered).

Product launch + featured speaker ("Book Launch with author Dr. Z")
  → product (book is always the subject of a book launch).

Place inauguration + chief guest ("Library Inauguration by Hon'ble Minister")
  → place (the place opening is the event; the guest performs the action).

═══════════════════════════════════════════════════════════════
FORMATTING REMINDERS
═══════════════════════════════════════════════════════════════
- Output starts with { and ends with } — no prose before or after.
- No markdown fences (no \`\`\`json).
- No trailing commas.
- Use lowercase exactly for subjectType and compositionStrategy values.
- "reasoning" is one or two sentences only — not a paragraph.
- "confidence" is a number, not a string, not a percent (use 0.85, not 85 or "85%").

Return ONLY the JSON object.`

// ============================================================
// MAIN
// ============================================================

export async function classifySubject(
  input: SubjectClassifierInput,
  options?: { signal?: AbortSignal }
): Promise<SubjectAnalysis> {
  const result = await classifySubjectWithUsage(input, options)
  return result.analysis
}

/**
 * Same as classifySubject but also returns token-usage metadata.
 * Use this in the test harness or anywhere the caller wants to log cost.
 */
export async function classifySubjectWithUsage(
  input: SubjectClassifierInput,
  options?: { signal?: AbortSignal }
): Promise<SubjectClassifierResult> {
  const startTime = Date.now()
  const apiKey = process.env.ANTHROPIC_API_KEY

  // Fast pre-check: photoProvided is computed locally regardless of AI path
  const photoProvided = !!input.speakers?.some(
    s => s.photoUrl && s.photoUrl.trim().length > 0
  )

  if (!apiKey) {
    // Without an API key, fall back to a heuristic so callers still get a valid shape.
    const fallback = heuristicClassify(input, photoProvided)
    return {
      analysis: fallback,
      usage: {
        model: CLAUDE_MODEL,
        inputTokens: 0,
        outputTokens: 0,
        cachedReadTokens: 0,
        cachedCreationTokens: 0,
        totalTokens: 0,
        durationMs: Date.now() - startTime,
        source: 'fallback',
      },
    }
  }

  const client = new Anthropic({ apiKey })
  const userPrompt = buildUserPrompt(input)

  try {
    const response = await client.messages.create(
      {
        model: CLAUDE_MODEL,
        max_tokens: MAX_TOKENS,
        system: [
          {
            type: 'text' as const,
            text: SYSTEM_PROMPT,
            cache_control: { type: 'ephemeral' as const },
          },
        ],
        messages: [{ role: 'user' as const, content: userPrompt }],
      },
      options?.signal ? { signal: options.signal } : undefined
    )

    const durationMs = Date.now() - startTime

    const textBlock = response.content.find(b => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text block in Claude response')
    }

    const parsed = parseSubjectAnalysis(textBlock.text)
    const normalised = normaliseAnalysis(parsed, input, photoProvided)

    // Anthropic cache fields — match the pattern just fixed in
    // ultra-pro-prompt.ts: read BOTH cache_read_input_tokens (cache hit)
    // and cache_creation_input_tokens (cache miss / write).
    const cacheReadTokens = (response.usage as any).cache_read_input_tokens ?? 0
    const cacheCreationTokens = (response.usage as any).cache_creation_input_tokens ?? 0

    return {
      analysis: normalised,
      usage: {
        model: CLAUDE_MODEL,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        cachedReadTokens: cacheReadTokens,
        cachedCreationTokens: cacheCreationTokens,
        totalTokens:
          response.usage.input_tokens +
          response.usage.output_tokens +
          cacheReadTokens +
          cacheCreationTokens,
        durationMs,
        source: 'ai',
      },
    }
  } catch (error) {
    console.warn('[Subject Classifier] Claude call failed, using heuristic fallback:', error)
    const fallback = heuristicClassify(input, photoProvided)
    return {
      analysis: fallback,
      usage: {
        model: CLAUDE_MODEL,
        inputTokens: 0,
        outputTokens: 0,
        cachedReadTokens: 0,
        cachedCreationTokens: 0,
        totalTokens: 0,
        durationMs: Date.now() - startTime,
        source: 'fallback',
      },
    }
  }
}

// ============================================================
// USER PROMPT
// ============================================================

function buildUserPrompt(input: SubjectClassifierInput): string {
  const speakerLines =
    input.speakers && input.speakers.length > 0
      ? input.speakers
          .map((s, i) => {
            const name = s.name?.trim() || `Speaker ${i + 1}`
            const desig = s.designation?.trim()
            const hasPhoto = !!(s.photoUrl && s.photoUrl.trim())
            return `  ${i + 1}. ${name}${desig ? ` (${desig})` : ''} — ${hasPhoto ? 'photo provided' : 'no photo'}`
          })
          .join('\n')
      : '  (none)'

  const orgLine = input.organizationContext
    ? `${input.organizationContext.name ?? '(unnamed org)'}${input.organizationContext.industry ? ` — ${input.organizationContext.industry}` : ''}`
    : '(none)'

  return [
    'Classify the subject of this poster.',
    '',
    `eventName: ${input.eventName || '(empty)'}`,
    `tagline: ${input.tagline || '(none)'}`,
    `description: ${input.description || '(none)'}`,
    `targetAudience: ${input.targetAudience || '(none)'}`,
    `speakers:`,
    speakerLines,
    `organizationContext: ${orgLine}`,
    '',
    'Return the JSON object now.',
  ].join('\n')
}

// ============================================================
// PARSING / NORMALISATION
// ============================================================

function parseSubjectAnalysis(raw: string): any {
  let s = raw.trim()
  if (s.startsWith('```json')) s = s.slice(7)
  else if (s.startsWith('```')) s = s.slice(3)
  if (s.endsWith('```')) s = s.slice(0, -3)
  s = s.trim()

  const match = s.match(/\{[\s\S]*\}/)
  const jsonStr = match ? match[0] : s
  return safeJsonParse<any>(jsonStr)
}

function normaliseAnalysis(
  parsed: any,
  input: SubjectClassifierInput,
  photoProvided: boolean
): SubjectAnalysis {
  const rawType: unknown = parsed?.subjectType
  const subjectType: SubjectType = isSubjectType(rawType) ? rawType : 'concept'

  // Force the strategy to match the mapping — if Claude drifted, correct it.
  const compositionStrategy: CompositionStrategy = STRATEGY_BY_TYPE[subjectType]

  const reasoning =
    typeof parsed?.reasoning === 'string' && parsed.reasoning.length > 0
      ? parsed.reasoning
      : 'Heuristic classification (model returned no reasoning).'

  const confidenceRaw = Number(parsed?.confidence)
  const confidence = Number.isFinite(confidenceRaw)
    ? Math.max(0, Math.min(1, confidenceRaw))
    : 0.6

  const out: SubjectAnalysis = {
    subjectType,
    compositionStrategy,
    reasoning,
    confidence,
  }

  if (subjectType === 'person') {
    const id = parsed?.subjectIdentity ?? {}
    const name =
      typeof id.name === 'string' && id.name.trim().length > 0
        ? id.name.trim()
        : input.speakers?.[0]?.name?.trim() || input.eventName
    const role =
      typeof id.role === 'string' && id.role.trim().length > 0
        ? id.role.trim()
        : input.speakers?.[0]?.designation?.trim() || undefined
    out.subjectIdentity = {
      name,
      role,
      photoProvided: typeof id.photoProvided === 'boolean' ? id.photoProvided : photoProvided,
    }
  }

  return out
}

function isSubjectType(v: unknown): v is SubjectType {
  return v === 'person' || v === 'concept' || v === 'activity' || v === 'product' || v === 'place'
}

// ============================================================
// HEURISTIC FALLBACK
// (Used only when AI is unavailable — best-effort rules, not a
// replacement for the model. Confidence stays low so downstream
// stages know to be cautious.)
// ============================================================

function heuristicClassify(input: SubjectClassifierInput, photoProvided: boolean): SubjectAnalysis {
  const text = [
    input.eventName,
    input.tagline,
    input.description,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  const honorific =
    /\b(chairperson|chairman|chairwoman|dr\.?|mr\.?|mrs\.?|ms\.?|smt\.?|shri|sri|prof\.?|professor|ceo|cto|cfo|coo|president|vice president|founder|justice|padma\s*shri|padma\s*bhushan|padma\s*vibhushan)\b/.test(text)
  const tributeWords =
    /\b(tribute|in memory of|honor(ing)?|felicitation|birthday|congratulation|farewell|welcome|appointment|remembering|memorial)\b/.test(text)
  const activityListed =
    /\b(activities|performances|shows|competitions|workshops)\b/.test(text) ||
    (input.description?.split(/[,•|•]/).filter(p => p.trim().length > 4).length ?? 0) >= 3
  const launchWords = /\b(launch|unveiling|reveal|release|showcase)\b/.test(text)
  const placeWords = /\b(heritage walk|campus tour|inauguration|foundation laying|site visit|building opening|lab inauguration)\b/.test(text)

  const singleSpeakerMatchesEvent =
    (input.speakers?.length ?? 0) === 1 &&
    !!input.speakers?.[0]?.name &&
    input.eventName.toLowerCase().includes(input.speakers![0].name!.toLowerCase().split(' ').slice(-1)[0])

  let subjectType: SubjectType
  if ((honorific && tributeWords) || singleSpeakerMatchesEvent || (honorific && (input.speakers?.length ?? 0) >= 1)) {
    subjectType = 'person'
  } else if (activityListed) {
    subjectType = 'activity'
  } else if (launchWords) {
    subjectType = 'product'
  } else if (placeWords) {
    subjectType = 'place'
  } else {
    subjectType = 'concept'
  }

  const out: SubjectAnalysis = {
    subjectType,
    compositionStrategy: STRATEGY_BY_TYPE[subjectType],
    reasoning: 'Heuristic fallback (no AI available).',
    confidence: 0.55,
  }

  if (subjectType === 'person') {
    const name =
      input.speakers?.[0]?.name?.trim() ||
      extractFirstName(input.tagline) ||
      extractFirstName(input.description) ||
      input.eventName
    out.subjectIdentity = {
      name,
      role: input.speakers?.[0]?.designation?.trim() || undefined,
      photoProvided,
    }
  }

  return out
}

function extractFirstName(s?: string): string | undefined {
  if (!s) return undefined
  const m = s.match(/(?:dr\.?|mr\.?|mrs\.?|ms\.?|smt\.?|shri|sri|prof\.?|chairperson)\s+([A-Z][\w.\-]*(?:\s+[A-Z][\w.\-]*)*)/i)
  return m?.[1]
}
