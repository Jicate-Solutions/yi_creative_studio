/**
 * AI Event Context Analyzer v2.0 (v30.0 Pipeline Upgrade)
 *
 * Uses Claude Sonnet to intelligently analyze event context from form data.
 * This is a GLOBAL solution that understands ANY event type automatically.
 *
 * APPROACH: Free-Form Dynamic Analysis (v30.0)
 * - NO preset categories — Claude analyzes the event freely
 * - Generates UNIQUE visual concepts for EACH specific event
 * - Prevents visual convergence across different events
 *
 * TIMING: After Form Submit
 * - All form data is available for comprehensive analysis
 * - Users expect processing time after clicking "Generate"
 *
 * COST: ~$0.01-0.05 per analysis (Claude Sonnet)
 */

import Anthropic from '@anthropic-ai/sdk'

// ============================================================================
// TYPES
// ============================================================================

/**
 * Input form data for event analysis
 */
export interface EventFormData {
  eventName: string
  eventDescription?: string
  venue?: string
  date?: string
  time?: string
  speakers?: Array<{
    name: string
    designation?: string
    topic?: string
  }>
  organizationName?: string
  verticalName?: string
  initiativeText?: string
  theme?: string
  style?: string
  targetAudience?: string
}

/**
 * AI-analyzed event context result
 */
export interface AIEventContext {
  /** v30.0: Always null — no preset matching */
  matchedPreset: string | null

  /** v30.0: Always 0 — no preset confidence */
  presetConfidence: number

  /** Event-specific visual enhancements unique to THIS event */
  customEnhancements: string[]

  /** AI-generated visual direction tailored to this specific event */
  visualDirection: string

  /** Recommended color palette based on event context */
  colorGuidance: string

  /** Key visual elements to include */
  keyVisuals: string[]

  /** Mood/atmosphere description */
  moodAtmosphere: string

  /** Short reasoning for the analysis */
  reasoning: string

  /** Token usage for cost tracking */
  tokenUsage: {
    inputTokens: number
    outputTokens: number
    totalTokens: number
  }

  /** Duration of the analysis */
  durationMs: number
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CLAUDE_MODEL = 'claude-sonnet-4-20250514' // Claude Sonnet for quality analysis

// ============================================================================
// PROMPT TEMPLATE (v30.0 — Free-Form Dynamic Analysis)
// ============================================================================

const ANALYSIS_PROMPT = `You are a visual storytelling expert who creates UNIQUE poster concepts.

Your job: Analyze THIS SPECIFIC EVENT and generate completely original visual concepts.

## CRITICAL ANTI-CONVERGENCE RULES:

1. **DO NOT** fall back on generic stock imagery:
   - NO generic silhouettes of people (unless the event is literally about silhouette art)
   - NO lotus flowers (unless the event is about lotus flowers)
   - NO abstract ripple patterns
   - NO generic podium/microphone imagery
   - NO "diverse group of professionals" unless specifically relevant

2. **Think LITERALLY about the event topic**:
   - "Menstrual Health Awareness" → menstrual health education visuals, NOT generic women empowerment imagery
   - "Blood Donation Drive" → blood donation specific imagery (blood bags, donor arm, life-saving metaphor)
   - "AI Hackathon for Climate" → code + environmental fusion, NOT generic tech imagery
   - "BDS Inaugural Program" → dental-specific imagery, NOT generic graduation

3. **Each event is UNIQUE** — even two health events should look different:
   - "Mental Health Workshop" vs "Menstrual Health Awareness" should have COMPLETELY different visuals
   - The visual must make someone INSTANTLY understand what THIS specific event is about

4. **Be HYPER-SPECIFIC, not generic**:
   - BAD: "professional atmosphere with warm lighting"
   - GOOD: "menstrual cup and sanitary pad education display with anatomical diagram in soft pink and teal medical setting"

5. **Consider ALL form data** — not just the event name:
   - Event description for the REAL topic
   - Venue for physical setting
   - Speakers for expertise domain
   - Organization/Vertical for community context
   - Date/time for seasonal mood

## Event Form Data to Analyze:

EVENT NAME: {eventName}
DESCRIPTION: {description}
VENUE: {venue}
DATE/TIME: {dateTime}
SPEAKERS: {speakers}
ORGANIZATION: {organization}
VERTICAL: {vertical}
INITIATIVE: {initiative}
THEME PREFERENCE: {theme}
STYLE PREFERENCE: {style}
TARGET AUDIENCE: {audience}

## Required Output (JSON):

{
  "customEnhancements": [
    "Enhancement 1: a SPECIFIC visual addition unique to THIS event",
    "Enhancement 2: another specific visual element",
    "Enhancement 3: a creative visual metaphor for THIS event's message"
  ],
  "visualDirection": "Detailed, hyper-specific visual direction for image generation. Describe the EXACT scene, objects, colors, and mood that represent THIS event's unique identity. Minimum 2 sentences.",
  "colorGuidance": "Specific color palette with reasoning tied to THIS event's topic (not generic 'professional blue')",
  "keyVisuals": [
    "Specific visual 1: describe an actual object/scene that represents THIS event",
    "Specific visual 2: another concrete visual element",
    "Specific visual 3: a unique visual metaphor"
  ],
  "moodAtmosphere": "The specific emotional atmosphere THIS event should evoke (tied to its topic, not generic)",
  "reasoning": "Why these visuals uniquely represent THIS specific event and not any other event"
}

CRITICAL: Return ONLY valid JSON. No markdown, no explanations outside JSON.`

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Analyze event context using Claude Sonnet (v30.0 — Free-Form)
 *
 * This function takes all available form data and uses AI to generate
 * UNIQUE visual concepts without constraining to preset categories.
 *
 * @param formData - All available form data
 * @returns AI-analyzed event context with unique visuals
 */
export async function analyzeEventContext(
  formData: EventFormData,
  options?: {
    temperature?: number | null // v31.0: Prompt style temperature override
    creativeDirection?: string   // v31.0: Prompt style creative direction
  }
): Promise<AIEventContext> {
  const startTime = Date.now()

  // Check for API key
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error('[Event Context Analyzer] Missing ANTHROPIC_API_KEY')
    return createFallbackContext(formData, startTime)
  }

  // Build the prompt with form data + optional creative direction
  let prompt = buildPrompt(formData)

  // v31.0: Inject creative style direction if provided
  if (options?.creativeDirection) {
    prompt += `\n\nCREATIVE STYLE DIRECTION:\n${options.creativeDirection}\nApply this creative approach to your visual analysis. Let it influence your visual choices, color guidance, and mood.`
  }

  // v31.0: Use style temperature or default to 1.0
  const temperature = options?.temperature ?? 1.0

  try {
    const anthropic = new Anthropic({ apiKey })

    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      temperature, // v31.0: Configurable via prompt style (default: 1.0)
      messages: [
        {
          role: 'user',
          content: prompt,
        },
        {
          role: 'assistant',
          content: '{', // Force JSON start
        },
      ],
    })

    const durationMs = Date.now() - startTime

    // Extract text from response
    const textBlock = response.content.find(block => block.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text response from Claude')
    }

    // Parse the JSON response (prepend the '{' we forced)
    const jsonText = `{${textBlock.text}`
    const parsed = parseResponse(jsonText)

    // Add usage info
    const tokenUsage = {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      totalTokens: response.usage.input_tokens + response.usage.output_tokens,
    }

    console.log(`[Event Context Analyzer] v30.0 Free-form analysis complete in ${durationMs}ms`)
    console.log(`[Event Context Analyzer] Visual direction: ${parsed.visualDirection.substring(0, 80)}...`)
    console.log(`[Event Context Analyzer] Key visuals: ${parsed.keyVisuals.length}`)
    console.log(`[Event Context Analyzer] Token usage: ${tokenUsage.totalTokens} tokens`)

    return {
      ...parsed,
      // v30.0: Always null/0 — no preset matching to prevent convergence
      matchedPreset: null,
      presetConfidence: 0,
      tokenUsage,
      durationMs,
    }
  } catch (error) {
    console.error('[Event Context Analyzer] Error:', error)
    return createFallbackContext(formData, startTime)
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Build the analysis prompt with form data
 */
function buildPrompt(formData: EventFormData): string {
  const speakersText = formData.speakers?.length
    ? formData.speakers
        .map(s => `${s.name}${s.designation ? ` (${s.designation})` : ''}${s.topic ? ` - Topic: ${s.topic}` : ''}`)
        .join('; ')
    : 'None specified'

  const dateTimeText = [formData.date, formData.time].filter(Boolean).join(' at ') || 'Not specified'

  return ANALYSIS_PROMPT
    .replace('{eventName}', formData.eventName || 'Not specified')
    .replace('{description}', formData.eventDescription || 'Not specified')
    .replace('{venue}', formData.venue || 'Not specified')
    .replace('{dateTime}', dateTimeText)
    .replace('{speakers}', speakersText)
    .replace('{organization}', formData.organizationName || 'Not specified')
    .replace('{vertical}', formData.verticalName || 'Not specified')
    .replace('{initiative}', formData.initiativeText || 'Not specified')
    .replace('{theme}', formData.theme || 'Not specified')
    .replace('{style}', formData.style || 'Not specified')
    .replace('{audience}', formData.targetAudience || 'Not specified')
}

/**
 * Parse the JSON response from Claude
 */
function parseResponse(jsonText: string): Omit<AIEventContext, 'tokenUsage' | 'durationMs'> {
  try {
    // Clean the JSON
    let cleaned = jsonText.trim()

    // Remove markdown code blocks if present
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.slice(7)
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.slice(3)
    }
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.slice(0, -3)
    }

    const parsed = JSON.parse(cleaned)

    // Validate and provide defaults
    return {
      matchedPreset: null, // v30.0: no preset matching
      presetConfidence: 0,
      customEnhancements: Array.isArray(parsed.customEnhancements) ? parsed.customEnhancements : [],
      visualDirection: parsed.visualDirection || '',
      colorGuidance: parsed.colorGuidance || '',
      keyVisuals: Array.isArray(parsed.keyVisuals) ? parsed.keyVisuals : [],
      moodAtmosphere: parsed.moodAtmosphere || '',
      reasoning: parsed.reasoning || '',
    }
  } catch (error) {
    console.error('[Event Context Analyzer] JSON parse error:', error)
    console.error('[Event Context Analyzer] Raw text:', jsonText.substring(0, 200))

    return {
      matchedPreset: null,
      presetConfidence: 0,
      customEnhancements: [],
      visualDirection: '',
      colorGuidance: '',
      keyVisuals: [],
      moodAtmosphere: '',
      reasoning: 'Failed to parse AI response',
    }
  }
}

/**
 * Create a fallback context when AI analysis fails
 * v30.0: No keyword→preset matching — generic safe fallback only
 */
function createFallbackContext(
  formData: EventFormData,
  startTime: number
): AIEventContext {
  const durationMs = Date.now() - startTime

  console.log('[Event Context Analyzer] v30.0 Using generic fallback (AI unavailable)')

  return {
    matchedPreset: null,
    presetConfidence: 0,
    customEnhancements: [],
    visualDirection: 'Professional event design with appropriate thematic elements',
    colorGuidance: 'Use brand colors with complementary accents',
    keyVisuals: [],
    moodAtmosphere: 'Professional and engaging',
    reasoning: 'Fallback analysis due to AI unavailability',
    tokenUsage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
    durationMs,
  }
}

/**
 * Check if AI event analysis should be used
 * Can be disabled via environment variable for debugging
 */
export function shouldUseAIEventAnalysis(): boolean {
  return process.env.DISABLE_AI_EVENT_ANALYSIS !== 'true'
}
