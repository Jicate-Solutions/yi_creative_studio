/**
 * Event Understanding Agent
 *
 * Purpose: Deep semantic analysis of event concepts before generation
 *
 * This agent uses Claude AI to understand events beyond keyword matching:
 * - Analyzes literal and metaphorical meanings
 * - Generates contextual visual associations
 * - Classifies emotional tone and formality
 * - Brainstorms and ranks visual concepts
 *
 * Integration: Called at the start of the generation pipeline (Stage 1)
 * Cost: ~$0.006 per call (~800ms latency)
 */

import Anthropic from '@anthropic-ai/sdk'
import { trackApiUsage } from '@/lib/services/api-usage'
import type { CompositionStrategy } from '@/lib/agents/subject-classifier'

// ============================================================================
// Types
// ============================================================================

export interface EventUnderstandingInput {
  eventName: string
  description?: string
  venue?: string
  eventType?: string
  speakers?: Array<{
    name: string
    designation?: string
  }>
  organizationContext?: {
    name: string
    industry?: string
    brandPersonality?: string
  }
  // v50.9: Style awareness — the user's chosen backgroundStyle. When set, the agent
  // generates visual concepts compatible with this style instead of defaulting to
  // photorealistic scenes for every event.
  backgroundStyle?: string
  // v53.0: Composition strategy from Subject Classifier (Stage 0). When provided,
  // EU adapts its visual concepts to fit the composition type (e.g. portrait-hero
  // → empty dignified stage backdrop, no crowds; activity-collage → multi-zone festive).
  compositionStrategy?: CompositionStrategy
}

export interface VisualConcept {
  name: string
  description: string
  visualElements: string[]
  appropriatenessScore: number  // 0-1
  reasoning: string
}

export interface EventProfile {
  // Core understanding
  literalMeaning: string
  metaphoricalMeanings: string[]

  // Visual associations
  visualAssociations: {
    primary: string[]      // Top 5-7 most relevant
    secondary: string[]    // Alternative options
    abstract: string[]     // Conceptual representations
  }

  // Context classification
  formality: 'casual' | 'professional' | 'premium' | 'exclusive'
  energyLevel: 'calm' | 'moderate' | 'high' | 'explosive'
  emotionalTone: string

  // Visual concepts (ranked)
  concepts: VisualConcept[]

  // Selected best concept
  selectedConcept: string

  // Confidence
  confidence: number  // 0-1, how confident AI is in this analysis
}

// ============================================================================
// Event Understanding Prompt
// ============================================================================

// v50.9: Style-aware guidance — directs Event Understanding to generate concepts
// compatible with the user's chosen visual style. Without this, EU committed to
// "Live Stage Energy" concepts even when user wanted festive cartoon illustration.
function getStyleGuidanceForEventUnderstanding(style?: string): string {
  if (!style || style === 'scene') {
    return '' // default — let EU freelance with photorealistic scene concepts
  }
  const guidance: Record<string, string> = {
    festive:
      'Generate VIBRANT MULTI-ACTIVITY ILLUSTRATED concepts — split into illustrated activity zones (one per listed activity like dance / music / stage events), cartoon-style figures, Indian festival celebration motifs (mandala, paisley, kolam borders, confetti, fireworks). NOT cinematic concert scenes. NOT photorealistic. Think Diwali / Holi / college cultural-fest flyer aesthetics.',
    dark:
      'Generate cinematic concepts where people appear in DRAMATIC DARK LIGHTING — side-lit silhouettes, theatrical spotlights cutting through atmospheric haze, deep shadows pooled around bright subjects. Keep people in the scene; do not strip the people out.',
    abstract:
      'Generate ABSTRACT CONCEPTUAL visualizations — flowing color gradients, geometric metaphors, soft fluid shapes representing the event theme. NO realistic people. NO photographic scenes.',
    illustrated:
      'Generate FLAT VECTOR-ILLUSTRATED concepts — bold graphic shapes, clean iconic figures, simple compositions, solid fills. NOT photorealistic.',
    bokeh:
      'Generate SOFT ATMOSPHERIC concepts — dreamy out-of-focus settings, glowing light orbs, warm sparkle particles. Subtle, premium, dreamy. People appear as soft blurred presences.',
    geometric:
      'Generate BOLD GEOMETRIC pattern concepts — hexagons, triangles, tessellations, structural compositions in brand palette. Modern, tech-forward, structural.',
    'photo-real':
      'Generate PHOTOJOURNALISTIC scene concepts — 35mm DSLR-style photographs of real Indian people in authentic emotional moments at real Indian venues. Premium magazine quality, NOT illustration.',
    product:
      'Generate OBJECT-AS-HERO concepts — ONE symbolic object that represents the event dominates 60%+ of the composition. People are secondary or absent. Examples: graduation cap mid-air, microphone with sound waves, blood drop on clean surface.',
    mandala:
      'Generate INDIAN CULTURAL MOTIF concepts — radial mandala patterns, paisley elements, traditional ornamental borders, festival aesthetics. Symmetrical, ornate, cultural.',
    custom:
      'Generate vibrant gradient + focal symbol concepts — AI chooses 2 energetic palette colors for the gradient, plus ONE clean iconic symbol representing the event (no realistic people).',
    neon:
      'Generate FUTURISTIC NEON concepts — electric neon trails, glowing grids, bioluminescent halos in brand accent color on deep near-black base. NO realistic people, NO photographic scenes.',
    duotone:
      'Generate TWO-COLOR treatment concepts — entire composition mapped to exactly 2 brand colors (shadows + highlights). Bold high-contrast monochromatic, silhouettes / abstract forms only.',
    glassmorphism:
      'Generate FROSTED-GLASS layered concepts — translucent rounded panels over soft gradient blobs or bokeh in brand colors. Clean modern depth, NOT realistic.',
    watercolor:
      'Generate PAINTERLY concepts — soft organic paint washes, flowing pigment, wet brush strokes, visible paper grain. NO photorealism.',
    texture:
      'Generate MATERIAL-SURFACE concepts — marble veining, woven fabric, paper grain, brushed metal in brand palette. NOT scenes, NOT people.',
    split:
      'Generate SPLIT-LAYOUT concepts — left 50% is an event-relevant atmospheric scene; right 50% is a clean solid brand-color panel.',
  }
  const styleHint = guidance[style]
  if (!styleHint) return ''
  return `

DESIGN STYLE COMPATIBILITY (v50.9 — MANDATORY):
The user has explicitly selected "${style}" as the background style. Your visualAssociations and selectedConcept MUST be compatible with this style. ${styleHint}

This means: when you generate the "concepts" array and select the best concept, choose one that fits the "${style}" style aesthetic — not the generic default scene-based concept.`
}

// v53.0: Composition-strategy-aware guidance — keeps EU from generating crowds for
// portrait-hero posters, multi-activity scenes for object-hero, etc.
function getCompositionStrategyGuidance(strategy?: CompositionStrategy): string {
  if (!strategy) return ''
  const map: Partial<Record<CompositionStrategy, string>> = {
    'portrait-hero':
      'This is a PORTRAIT-HERO composition. The honored person IS the subject; the scene is the EMPTY DIGNIFIED STAGE BACKDROP that frames them. visualAssociations.primary MUST describe stage architecture (pillars, drapes, ceremonial lighting), ceremonial atmosphere (warm spotlights, soft glow, depth), and decorative objects (flowers, cake, brand-color textures, garlands, podiums) suitable for placing a real portrait at the center. Do NOT describe crowds, audiences, attendees, team members, blurred figures, silhouettes, or any other people anywhere — the only person in the final artwork will be the honored individual composited as a real portrait. Architectural elements, ceremonial lighting, decorative objects, atmosphere only.',
    'activity-collage':
      'This is an ACTIVITY-COLLAGE composition (cultural fest / multi-track event). visualAssociations.primary should describe MULTIPLE distinct activity zones (one per listed activity), festive Indian motifs (mandala / paisley / kolam borders, confetti, fireworks), and energetic illustrated figures performing each activity. Multi-zone, vibrant, celebratory.',
    'object-hero':
      'This is an OBJECT-HERO composition (product / book / device / app launch). visualAssociations.primary should describe ONE symbolic object dominating ~60% of the canvas, dramatic product lighting, clean backdrop, and brand-aligned atmospheric accents. People should be SECONDARY or absent — the object is the hero.',
    'environment-scene':
      'This is an ENVIRONMENT-SCENE composition (heritage walk / lab inauguration / building opening / campus tour). visualAssociations.primary should describe the PLACE itself in architectural detail — the building, the venue, the landscape, the spatial atmosphere. The place is the subject; any people are incidental scale figures, not the focus.',
    // 'concept-iconic' → no override (current default behavior)
  }
  const guidance = map[strategy]
  if (!guidance) return ''
  return `

COMPOSITION STRATEGY (v53.0 — MANDATORY):
The upstream Subject Classifier determined this poster's composition strategy is "${strategy}". ${guidance}

Apply this composition strategy to your "visualAssociations.primary" and "selectedConcept" — they must be consistent with this strategy.`
}

function buildEventUnderstandingPrompt(input: EventUnderstandingInput): string {
  return `You are an expert visual designer and semiotics analyst. Your task is to deeply understand an event concept and generate appropriate visual associations.

EVENT DETAILS:
- Event Name: "${input.eventName}"
${input.description ? `- Description: "${input.description}"` : ''}
${input.venue ? `- Venue: "${input.venue}"` : ''}
${input.eventType ? `- Event Type: "${input.eventType}"` : ''}
${input.speakers && input.speakers.length > 0 ? `- Speakers: ${input.speakers.map(s => s.name).join(', ')}` : ''}
${input.organizationContext ? `- Organization: ${input.organizationContext.name} (${input.organizationContext.industry || 'Business'})` : ''}
${getStyleGuidanceForEventUnderstanding(input.backgroundStyle)}
${getCompositionStrategyGuidance(input.compositionStrategy)}

YOUR TASK:

Analyze this event deeply and return a JSON object with the following structure:

{
  "literalMeaning": "Direct definition of the event name",
  "metaphoricalMeanings": ["Array of 3-5 metaphorical interpretations"],
  "visualAssociations": {
    "primary": ["5-7 most relevant visual elements that directly represent the concept"],
    "secondary": ["3-5 alternative visual options"],
    "abstract": ["3-5 conceptual/symbolic representations"]
  },
  "formality": "casual|professional|premium|exclusive",
  "energyLevel": "calm|moderate|high|explosive",
  "emotionalTone": "Brief description of emotional feeling (inspiring, celebratory, authoritative, etc.)",
  "concepts": [
    {
      "name": "Concept name (e.g., 'Navigation & Discovery')",
      "description": "Brief description of this visual concept",
      "visualElements": ["Specific visual elements for this concept"],
      "appropriatenessScore": 0.95,
      "reasoning": "Why this concept matches the event"
    }
  ],
  "selectedConcept": "Name of the best concept from the concepts array",
  "confidence": 0.9
}

ANALYSIS GUIDELINES:

1. SEMANTIC ANALYSIS
   - Analyze the event name's literal meaning
   - Identify metaphorical and symbolic interpretations
   - Consider cultural and contextual associations

2. VISUAL ASSOCIATIONS
   - PRIMARY: Most direct, obvious visual representations
   - SECONDARY: Alternative or complementary visuals
   - ABSTRACT: Symbolic, conceptual representations

3. EMOTIONAL & CONTEXTUAL CLASSIFICATION
   - Formality: How formal/casual is this event?
   - Energy: What energy level does it convey?
   - Tone: What emotions should it evoke?

4. CONCEPT BRAINSTORMING
   - Generate 2-3 distinct visual concept options
   - For each concept, provide specific visual elements
   - Score each by appropriateness (0-1)
   - Explain reasoning for scoring
   - Select the best concept

5. AVOID GENERIC INTERPRETATIONS
   - Don't default to generic business/corporate imagery
   - Think creatively about the specific event name
   - Consider the literal and metaphorical layers

6. ANTI-CONVERGENCE RULES (v32.0 — CRITICAL)
   - NEVER suggest "silhouettes" of people in visualAssociations (silhouettes are BANNED)
   - NEVER suggest "lotus flowers" unless the event is literally about lotus/nature
   - NEVER suggest "circular motifs" or "mandala patterns" as default decorative elements
   - NEVER suggest "flowing ribbons" or "abstract waves" as filler
   - Think in SCENES not CATEGORIES — describe what THIS SPECIFIC event literally looks like
   - Two "leadership" events must have COMPLETELY DIFFERENT visuals
   - visualAssociations.primary should be SCENE DESCRIPTIONS, not generic icons/symbols:
     WRONG: "human silhouettes in professional attire", "lotus flower symbolizing purity"
     RIGHT: "a bustling workshop room with flip charts and animated discussion groups"
     WRONG: "converging leaders", "crown/laurel wreath"
     RIGHT: "a round table with diverse professionals debating over laptops, city view through glass walls"

EXAMPLES:

Event: "PATHFINDER"
{
  "literalMeaning": "One who finds or shows the path; a guide or explorer",
  "metaphoricalMeanings": ["Trailblazer", "Navigator", "Pioneer", "Guide", "Mentor"],
  "visualAssociations": {
    "primary": ["compass rose", "winding path through landscape", "star navigation", "map with route", "footprints leading forward", "guiding light beam", "mountain trail"],
    "secondary": ["milestone markers", "wayfinding signs", "explorer's tools", "journey timeline", "destination horizon"],
    "abstract": ["converging lines to vanishing point", "golden ratio spiral", "interconnected nodes", "upward arrow trajectory"]
  },
  "formality": "professional",
  "energyLevel": "moderate",
  "emotionalTone": "Inspiring, forward-looking, empowering, growth-oriented",
  "concepts": [
    {
      "name": "Navigation & Discovery",
      "description": "Visual theme focused on navigation tools, journey mapping, and exploration",
      "visualElements": ["prominent compass rose", "topographic map lines", "star constellations", "winding path", "discovery telescope"],
      "appropriatenessScore": 0.95,
      "reasoning": "Directly aligns with 'pathfinder' concept of navigation and showing the way"
    },
    {
      "name": "Trailblazing Leadership",
      "description": "Focus on leadership, breaking new ground, and pioneering",
      "visualElements": ["footprints in untrodden ground", "person at mountain summit", "blazing trail through forest", "torch lighting the way"],
      "appropriatenessScore": 0.85,
      "reasoning": "Captures the leadership aspect of being a pathfinder"
    },
    {
      "name": "Guiding Light",
      "description": "Symbolic representation of guidance through light and illumination",
      "visualElements": ["lighthouse on coast", "light beams piercing darkness", "glowing path", "lantern", "guiding star"],
      "appropriatenessScore": 0.75,
      "reasoning": "More abstract interpretation, less literal than navigation theme"
    }
  ],
  "selectedConcept": "Navigation & Discovery",
  "confidence": 0.95
}

Event: "Annual Leadership Summit"
{
  "literalMeaning": "Yearly gathering of leaders at the highest level",
  "metaphoricalMeanings": ["Peak achievement", "Convergence of influence", "Strategic elevation", "Authority assembly"],
  "visualAssociations": {
    "primary": ["mountain summit/peak", "ascending stairs/paths", "skyline from above", "converging leaders", "podium with spotlight", "executive boardroom view"],
    "secondary": ["rising sun over horizon", "eagle's perspective", "ascending graph", "trophy/achievement symbols"],
    "abstract": ["golden pyramid peak", "converging diagonal lines upward", "crown/laurel wreath", "interconnected leadership circles"]
  },
  "formality": "premium",
  "energyLevel": "moderate",
  "emotionalTone": "Authoritative, prestigious, aspirational, strategic",
  "concepts": [
    {
      "name": "Summit Achievement",
      "description": "Visual metaphor of reaching the peak, mountain summit imagery",
      "visualElements": ["mountain peak with flag", "panoramic view from summit", "ascending path to peak", "climbers reaching top"],
      "appropriatenessScore": 0.92,
      "reasoning": "Summit literally means peak/highest point, perfect metaphor for leadership gathering"
    }
  ],
  "selectedConcept": "Summit Achievement",
  "confidence": 0.92
}

Now analyze the event provided above and return ONLY the JSON object (no additional text).`
}

// ============================================================================
// Event Understanding Agent
// ============================================================================

export async function generateEventUnderstanding(
  input: EventUnderstandingInput,
  options?: {
    userId?: string
    organizationId?: string
    temperature?: number
  }
): Promise<EventProfile> {
  const startTime = Date.now()

  console.log('[Event Understanding] Starting semantic analysis...')
  console.log('[Event Understanding] Event:', input.eventName)

  // Initialize Anthropic client
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured')
  }

  const anthropic = new Anthropic({ apiKey })

  // Build prompt
  const prompt = buildEventUnderstandingPrompt(input)

  try {
    // Call Claude Haiku 4.5 for event understanding
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 2048,
      temperature: options?.temperature ?? 1.0,  // High temperature for creative thinking
      messages: [{
        role: 'user',
        content: prompt
      }]
    })

    const latency = Date.now() - startTime

    // Extract response text
    const contentBlock = response.content[0]
    if (contentBlock.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    const responseText = contentBlock.text

    // Parse JSON response
    let eventProfile: EventProfile
    try {
      // Try to extract JSON from response (in case there's extra text)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }
      eventProfile = JSON.parse(jsonMatch[0])
    } catch (parseError) {
      console.error('[Event Understanding] Failed to parse JSON:', parseError)
      console.error('[Event Understanding] Response:', responseText)
      throw new Error('Failed to parse event understanding response')
    }

    // Validate response structure
    if (!eventProfile.literalMeaning || !eventProfile.selectedConcept) {
      throw new Error('Invalid event profile structure')
    }

    // v25.0: Override formality for premium/formal events based on keywords
    eventProfile.formality = overrideFormalityIfNeeded(input.eventName, eventProfile.formality)

    // Track API usage (only if userId and organizationId are provided)
    if (options?.userId && options?.organizationId) {
      await trackApiUsage({
        userId: options.userId,
        organizationId: options.organizationId,
        requestType: 'design_intelligence',
        provider: 'claude',
        model: 'claude-haiku-4-5',
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        estimatedCostUsd: (response.usage.input_tokens / 1_000_000 * 1.00) + (response.usage.output_tokens / 1_000_000 * 5.00),
        durationMs: latency,
        success: true,
        metadata: {
          operation: 'event_understanding',
          eventName: input.eventName,
          selectedConcept: eventProfile.selectedConcept,
          confidence: eventProfile.confidence,
          conceptsGenerated: eventProfile.concepts.length
        }
      })
    }

    console.log('[Event Understanding] ✅ Analysis complete')
    console.log('[Event Understanding] Selected Concept:', eventProfile.selectedConcept)
    console.log('[Event Understanding] Confidence:', eventProfile.confidence)
    console.log('[Event Understanding] Primary Visuals:', eventProfile.visualAssociations.primary.slice(0, 3).join(', '))
    console.log('[Event Understanding] Latency:', latency, 'ms')
    console.log('[Event Understanding] Tokens:', response.usage.input_tokens, 'in /', response.usage.output_tokens, 'out')

    return eventProfile

  } catch (error) {
    const latency = Date.now() - startTime
    console.error('[Event Understanding] ❌ Error:', error)

    // Track failed usage (only if userId and organizationId are provided)
    if (options?.userId && options?.organizationId) {
      await trackApiUsage({
        userId: options.userId,
        organizationId: options.organizationId,
        requestType: 'design_intelligence',
        provider: 'claude',
        model: 'claude-haiku-4-5',
        inputTokens: 0,
        outputTokens: 0,
        estimatedCostUsd: 0,
        durationMs: latency,
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          operation: 'event_understanding_error',
          eventName: input.eventName
        }
      })
    }

    throw error
  }
}

// ============================================================================
// Fallback Event Understanding
// ============================================================================

/**
 * Generate a basic event profile without AI when Event Understanding fails
 * or when fast fallback is needed
 */
export function generateFallbackEventProfile(input: EventUnderstandingInput): EventProfile {
  console.log('[Event Understanding] Using fallback profile for:', input.eventName)

  // Extract keywords from event name
  const keywords = input.eventName.toLowerCase().split(/\s+/).filter(w => w.length > 3)

  return {
    literalMeaning: `Event titled "${input.eventName}"`,
    metaphoricalMeanings: keywords,
    visualAssociations: {
      primary: [`${input.eventName} themed imagery`, 'professional setting', 'branded elements'],
      secondary: ['corporate backdrop', 'event space'],
      abstract: ['professional composition', 'branded design']
    },
    formality: 'professional',
    energyLevel: 'moderate',
    emotionalTone: 'professional and engaging',
    concepts: [{
      name: 'Professional Event Theme',
      description: `Visual design for ${input.eventName}`,
      visualElements: ['clean design', 'professional imagery', 'branded elements'],
      appropriatenessScore: 0.5,
      reasoning: 'Fallback concept due to AI unavailability'
    }],
    selectedConcept: 'Professional Event Theme',
    confidence: 0.5
  }
}

// ============================================================================
// Premium Event Keywords (v25.0 - Formality Override)
// ============================================================================

/**
 * Keywords that indicate events where LITERAL imagery is specifically required
 * (document signings, ribbon cuttings, groundbreaking ceremonies).
 * v35.0: Narrowed to only truly literal-required events — graduation, awards, summits
 * etc. all deserve BOLD creative compositions, not stock-photo literal scenes.
 */
const PREMIUM_EVENT_KEYWORDS = [
  'mou', 'signing', 'agreement', 'memorandum',
  'ribbon cutting', 'groundbreaking',
]

/**
 * Check if event name contains premium/formal keywords
 * Used to override formality to 'premium' for literal imagery
 */
export function detectPremiumFormality(eventName: string): boolean {
  const eventNameLower = eventName.toLowerCase()
  return PREMIUM_EVENT_KEYWORDS.some(keyword => eventNameLower.includes(keyword))
}

/**
 * Override formality based on event keywords
 * Called after AI generates formality to ensure formal events get literal treatment
 */
export function overrideFormalityIfNeeded(
  eventName: string,
  aiFormality: EventProfile['formality']
): EventProfile['formality'] {
  if (detectPremiumFormality(eventName)) {
    console.log('[Event Understanding] v25.0: Premium keyword detected, overriding formality to "premium"')
    console.log('[Event Understanding] Original formality:', aiFormality)
    return 'premium'
  }
  return aiFormality
}

// ============================================================================
// Helper: Should Use Event Understanding?
// ============================================================================

/**
 * Determine if Event Understanding should be used based on format and context
 *
 * Use Event Understanding for:
 * - Creative formats (posters, flyers, social posts)
 * - Events with unique/creative names
 * - Events where visual theme is critical
 *
 * Skip for:
 * - Certificates (name-focused, not theme-focused)
 * - Simple announcements
 * - When event name is very generic
 */
export function shouldUseEventUnderstanding(
  formatId: string,
  eventName: string
): boolean {
  // v7.0: Use event understanding for ALL creative formats
  // Excluded: certificate (name-focused), letterhead, resume, business_card (non-event)
  const excludedFormats = [
    'certificate',
    'letterhead',
    'resume',
    'business_card',
    'report_cover',
    'book_cover'
  ]

  // Skip for non-event formats
  if (excludedFormats.includes(formatId)) {
    return false
  }

  // Skip if no format specified
  if (!formatId) {
    return false
  }

  // Skip if event name is too generic
  const genericNames = ['event', 'meeting', 'session', 'workshop', 'conference', 'seminar']
  const isGeneric = genericNames.some(g =>
    eventName.toLowerCase().trim() === g
  )

  return !isGeneric
}
