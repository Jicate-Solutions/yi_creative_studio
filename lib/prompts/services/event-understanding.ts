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

function buildEventUnderstandingPrompt(input: EventUnderstandingInput): string {
  return `You are an expert visual designer and semiotics analyst. Your task is to deeply understand an event concept and generate appropriate visual associations.

EVENT DETAILS:
- Event Name: "${input.eventName}"
${input.description ? `- Description: "${input.description}"` : ''}
${input.venue ? `- Venue: "${input.venue}"` : ''}
${input.eventType ? `- Event Type: "${input.eventType}"` : ''}
${input.speakers && input.speakers.length > 0 ? `- Speakers: ${input.speakers.map(s => s.name).join(', ')}` : ''}
${input.organizationContext ? `- Organization: ${input.organizationContext.name} (${input.organizationContext.industry || 'Business'})` : ''}

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
        estimatedCostUsd: (response.usage.input_tokens * 0.001 / 1000000) + (response.usage.output_tokens * 0.005 / 1000000),
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
  // Always use for these creative formats
  const creativeFormats = [
    'event_poster',
    'workshop_flyer',
    'conference_poster',
    'instagram_post',
    'instagram_story',
    'linkedin_post',
    'facebook_event_cover',
    'youtube_thumbnail',
    'web_banner',
    'x_post'
  ]

  if (creativeFormats.includes(formatId)) {
    // Skip if event name is too generic
    const genericNames = ['event', 'meeting', 'session', 'workshop', 'conference', 'seminar']
    const isGeneric = genericNames.some(g =>
      eventName.toLowerCase().trim() === g
    )

    return !isGeneric
  }

  return false
}
