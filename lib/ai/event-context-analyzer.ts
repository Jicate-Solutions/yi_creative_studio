/**
 * AI Event Context Analyzer v1.0
 *
 * Uses Claude Sonnet to intelligently analyze event context from form data.
 * This is a GLOBAL solution that understands ANY event type automatically,
 * without relying on hardcoded keyword detection.
 *
 * APPROACH: Hybrid (Category Match + Custom Enhancements)
 * - Claude identifies the best matching preset from ~20 predefined categories
 * - PLUS generates event-specific custom enhancements
 * - This gives consistency from presets + creativity from AI customization
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
  /** The best matching preset category from predefined list */
  matchedPreset: string | null

  /** Confidence in the preset match (0-1) */
  presetConfidence: number

  /** Event-specific visual enhancements that go BEYOND the preset */
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

/**
 * Available preset categories that the AI can match to
 * These align with EVENT_CONTEXT_PRESETS in context-helpers.ts
 */
const AVAILABLE_PRESETS = [
  // Academic & Educational
  'academic_inauguration',    // Student programme/course inaugurations
  'workshop',                 // Training, hands-on sessions
  'seminar',                  // Educational talks, lectures
  'conference',               // Multi-speaker professional gatherings

  // Professional & Business
  'networking',               // Professional meetups, mixers
  'panel_discussion',         // Expert discussions
  'keynote',                  // Single prominent speaker
  'masterclass',              // Expert-led skill sessions
  'summit',                   // High-level strategic gatherings

  // Ceremonial & Formal
  'inauguration',             // Building/facility openings (not academic)
  'award_ceremony',           // Recognition and awards
  'celebration',              // Milestones, anniversaries
  'graduation',               // Completion ceremonies

  // Cause & Action
  'awareness_campaign',       // Social causes, health drives
  'blood_donation',           // Blood donation drives
  'fundraiser',               // Charity events
  'walkathon',                // Running/walking events
  'marathon',                 // Competitive running

  // Social & Cultural
  'cultural_program',         // Dance, music, arts
  'festival',                 // Festive celebrations (Diwali, Christmas, etc.)
  'party',                    // Casual celebrations

  // Special Formats
  'product_launch',           // New product/service announcements
  'tech_event',               // Technology focused
  'health_camp',              // Medical camps

  // Fallback
  'general',                  // When no specific category matches
]

// ============================================================================
// PROMPT TEMPLATE
// ============================================================================

const ANALYSIS_PROMPT = `You are an intelligent event context analyzer. Your job is to understand the FULL context of an event from form data and provide:

1. The BEST MATCHING preset category from the available list
2. CUSTOM ENHANCEMENTS specific to THIS event that go beyond the preset
3. VISUAL DIRECTION tailored to the specific event context

## Available Preset Categories:
${AVAILABLE_PRESETS.map(p => `- ${p}`).join('\n')}

## CRITICAL RULES:

1. **Read ALL form data** - The event name alone is not enough. Consider:
   - Event description for context
   - Venue for setting
   - Speakers for formality level
   - Organization/Vertical for branding context
   - Date/time for seasonal considerations

2. **Match preset with CONFIDENCE** - Only match if you're confident (>0.7)
   - If uncertain, use 'general' preset with low confidence
   - Some events are truly unique and won't match any preset

3. **CUSTOM ENHANCEMENTS are KEY** - This is where you add value:
   - For "BDS Inaugural Induction Program": preset = 'academic_inauguration', but ADD "dental equipment icons, tooth models, medical blue theme"
   - For "AI Hackathon for Climate": preset = 'tech_event', but ADD "environmental green accents, sustainability symbols, code + leaves fusion"

4. **Be SPECIFIC, not generic**:
   - BAD: "professional atmosphere"
   - GOOD: "dental clinic ambiance with sterilization blue lighting and medical precision aesthetic"

5. **Consider the AUDIENCE**:
   - Students → youthful, aspirational imagery
   - Professionals → sophisticated, premium feel
   - Mixed → balance of approachability and professionalism

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
  "matchedPreset": "preset_name or null if truly unique",
  "presetConfidence": 0.0-1.0,
  "customEnhancements": [
    "Enhancement 1: specific visual addition for THIS event",
    "Enhancement 2: another specific addition",
    "Enhancement 3: etc."
  ],
  "visualDirection": "Detailed visual direction for image generation, specific to THIS event's context",
  "colorGuidance": "Recommended color palette with reasoning",
  "keyVisuals": [
    "Specific visual element 1 (e.g., 'students in academic regalia with dental tools')",
    "Specific visual element 2",
    "Specific visual element 3"
  ],
  "moodAtmosphere": "Description of the mood and atmosphere to evoke",
  "reasoning": "Brief explanation of why you chose this preset and enhancements"
}

CRITICAL: Return ONLY valid JSON. No markdown, no explanations outside JSON.`

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Analyze event context using Claude Sonnet
 *
 * This function takes all available form data and uses AI to:
 * 1. Identify the best matching preset category
 * 2. Generate event-specific custom enhancements
 * 3. Provide tailored visual direction
 *
 * @param formData - All available form data
 * @returns AI-analyzed event context
 */
export async function analyzeEventContext(
  formData: EventFormData
): Promise<AIEventContext> {
  const startTime = Date.now()

  // Check for API key
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error('[Event Context Analyzer] Missing ANTHROPIC_API_KEY')
    return createFallbackContext(formData, startTime)
  }

  // Build the prompt with form data
  const prompt = buildPrompt(formData)

  try {
    const anthropic = new Anthropic({ apiKey })

    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
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

    console.log(`[Event Context Analyzer] ✅ Analysis complete in ${durationMs}ms`)
    console.log(`[Event Context Analyzer] Matched preset: ${parsed.matchedPreset} (${(parsed.presetConfidence * 100).toFixed(0)}% confidence)`)
    console.log(`[Event Context Analyzer] Custom enhancements: ${parsed.customEnhancements.length}`)
    console.log(`[Event Context Analyzer] Token usage: ${tokenUsage.totalTokens} tokens`)

    return {
      ...parsed,
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
      matchedPreset: parsed.matchedPreset || null,
      presetConfidence: typeof parsed.presetConfidence === 'number' ? parsed.presetConfidence : 0.5,
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
 */
function createFallbackContext(
  formData: EventFormData,
  startTime: number
): AIEventContext {
  const durationMs = Date.now() - startTime

  // Simple keyword-based fallback
  const eventName = (formData.eventName || '').toLowerCase()
  let matchedPreset: string | null = 'general'

  // Basic keyword matching as fallback
  if (eventName.includes('inaugur') || eventName.includes('induction')) {
    if (eventName.includes('programme') || eventName.includes('program') || eventName.includes('batch') || eventName.includes('student')) {
      matchedPreset = 'academic_inauguration'
    } else {
      matchedPreset = 'inauguration'
    }
  } else if (eventName.includes('workshop') || eventName.includes('training')) {
    matchedPreset = 'workshop'
  } else if (eventName.includes('conference')) {
    matchedPreset = 'conference'
  } else if (eventName.includes('seminar')) {
    matchedPreset = 'seminar'
  } else if (eventName.includes('blood') && eventName.includes('donat')) {
    matchedPreset = 'blood_donation'
  } else if (eventName.includes('marathon') || eventName.includes('run')) {
    matchedPreset = 'marathon'
  }

  console.log(`[Event Context Analyzer] ⚠️ Using fallback - matched: ${matchedPreset}`)

  return {
    matchedPreset,
    presetConfidence: 0.5,
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
