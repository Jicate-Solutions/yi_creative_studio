/**
 * AI-Powered Design Intelligence Service
 *
 * Two-stage AI pipeline:
 * Stage 1: Analyze creative brief and generate design context (this service)
 * Stage 2: Use context for image generation (handled by adapters)
 *
 * Supports configurable LLM providers for future optimization
 */

import { GoogleGenerativeAI } from '@google/generative-ai'

// ============================================================
// TYPES
// ============================================================

export type LLMProvider = 'gemini' | 'claude' | 'openai'

/**
 * AI-generated design context
 * Contains everything the image generation AI needs to understand
 * the CORE PURPOSE and VISUAL REQUIREMENTS of the design
 */
export interface DesignContext {
  /** The emotional job this design must accomplish */
  corePurpose: string
  /** What viewers should DO after seeing this */
  desiredAction: string
  /** How viewers should FEEL */
  emotionalJob: string
  /** Visual elements that BELONG in this type of design */
  visualElements: string[]
  /** Appropriate environment/backdrop description */
  backgroundSetting: string
  /** Iconic imagery that reinforces the message */
  iconicImagery: string[]
  /** Color psychology guidance for this design */
  colorMood: string
  /** Strategic visual approach */
  designStrategy: string
  /** How to know the design worked */
  successMetric: string
}

/**
 * Input for design intelligence generation
 */
export interface DesignBrief {
  /** Type of event or creative (e.g., 'conference', 'blood_donation', 'wedding') */
  eventType?: string
  /** Name of the event */
  eventName?: string
  /** Organization name */
  organizationName?: string
  /** Additional details about the creative */
  details?: string
  /** Theme selection (e.g., 'corporate', 'festive') */
  theme?: string
  /** Style selection (e.g., 'gradient', 'geometric') */
  style?: string
  /** Guest/speaker name if applicable */
  guestName?: string
  /** Venue information */
  venue?: string
  /** Any additional context */
  additionalContext?: string
}

// ============================================================
// PROMPT TEMPLATE
// ============================================================

/**
 * Design Intelligence Master Prompt
 *
 * This prompt transforms the LLM into an ultra-pro designer who:
 * - Understands the CORE PURPOSE of every design
 * - Knows what visual elements BELONG in each context
 * - Thinks strategically about viewer psychology
 * - Outputs structured, actionable design guidance
 */
const DESIGN_INTELLIGENCE_PROMPT = `You are an ULTRA-PRO DESIGNER who has created award-winning campaigns for Apple, Nike, TED, and National Geographic.

Your unique ability: You understand that designs don't just look good—they ACCOMPLISH GOALS. Every element in a design must serve the core purpose.

ANALYZE THE FOLLOWING CREATIVE BRIEF:
{brief}

Think deeply about:
1. What is the CORE PURPOSE? (What emotional job must this design accomplish?)
2. What ACTION should viewers take after seeing this?
3. What should viewers FEEL? (emotional response)
4. What VISUAL ELEMENTS naturally BELONG in this type of design? (specific objects, symbols, imagery)
5. What BACKGROUND SETTING is contextually appropriate?
6. What ICONIC IMAGERY reinforces the core message?
7. What COLOR MOOD supports the emotional goal?
8. What DESIGN STRATEGY should the image AI follow?
9. How will we know the design worked? (success metric)

CRITICAL RULES:
- Be SPECIFIC with visual elements - name exact objects (e.g., "microphone at podium", "blood donation bag with tubing", "graduation cap flying in air")
- Background settings should be CONTEXTUAL to the event type (e.g., "modern convention center with stage lighting" for conferences)
- Avoid generic descriptions - be precise and purposeful
- Think about what a viewer seeing this design would immediately understand

Return ONLY valid JSON (no markdown code blocks, no explanation, just the JSON object):
{
  "corePurpose": "Single compelling sentence about what this design MUST accomplish emotionally",
  "desiredAction": "Specific action viewers should take (e.g., 'Register immediately', 'Donate blood today', 'Attend this wedding')",
  "emotionalJob": "How viewers should feel (e.g., 'Excited and professionally inspired', 'Compassionate and heroic', 'Joyful and celebratory')",
  "visualElements": ["specific element 1", "specific element 2", "specific element 3", "specific element 4", "specific element 5"],
  "backgroundSetting": "Detailed, contextually appropriate background description",
  "iconicImagery": ["iconic image 1", "iconic image 2", "iconic image 3"],
  "colorMood": "Color psychology guidance specific to this design's emotional goal",
  "designStrategy": "Strategic approach for the visual execution",
  "successMetric": "How to measure if the design worked (viewer's immediate thought)"
}`

// ============================================================
// MAIN SERVICE
// ============================================================

/**
 * Generate design context using AI analysis
 *
 * @param brief - The creative brief to analyze
 * @param provider - LLM provider to use (default: gemini)
 * @returns Structured design context for image generation
 */
export async function generateDesignContext(
  brief: DesignBrief,
  provider: LLMProvider = 'gemini'
): Promise<DesignContext> {
  console.log('[Design Intelligence] === STAGE 1: GENERATING DESIGN CONTEXT ===')
  console.log('[Design Intelligence] Event Type:', brief.eventType || 'unknown')
  console.log('[Design Intelligence] Event Name:', brief.eventName || 'not provided')
  console.log('[Design Intelligence] Theme:', brief.theme || 'default')
  console.log('[Design Intelligence] Style:', brief.style || 'default')

  // Build the full brief text
  const briefText = buildBriefText(brief)
  console.log('[Design Intelligence] Brief Text:', briefText.substring(0, 200) + '...')

  // Generate the prompt
  const prompt = DESIGN_INTELLIGENCE_PROMPT.replace('{brief}', briefText)

  // Call the appropriate LLM provider
  let response: string
  console.log('[Design Intelligence] Provider:', provider)

  switch (provider) {
    case 'gemini':
      response = await callGemini(prompt)
      break
    case 'claude':
      response = await callClaude(prompt)
      break
    case 'openai':
      response = await callOpenAI(prompt)
      break
    default:
      response = await callGemini(prompt)
  }

  // Parse and validate the response
  const context = parseDesignContext(response)
  console.log('[Design Intelligence] === CONTEXT GENERATED SUCCESSFULLY ===')
  console.log('[Design Intelligence] Core Purpose:', context.corePurpose)
  console.log('[Design Intelligence] Visual Elements:', context.visualElements.join(', '))
  console.log('[Design Intelligence] Background:', context.backgroundSetting.substring(0, 100) + '...')

  return context
}

/**
 * Build formatted brief text from structured input
 */
function buildBriefText(brief: DesignBrief): string {
  const parts: string[] = []

  if (brief.eventType) {
    parts.push(`Event Type: ${brief.eventType.replace(/_/g, ' ')}`)
  }

  if (brief.eventName) {
    parts.push(`Event Name: ${brief.eventName}`)
  }

  if (brief.organizationName) {
    parts.push(`Organization: ${brief.organizationName}`)
  }

  if (brief.guestName) {
    parts.push(`Guest/Speaker: ${brief.guestName}`)
  }

  if (brief.venue) {
    parts.push(`Venue: ${brief.venue}`)
  }

  if (brief.theme) {
    parts.push(`Design Theme: ${brief.theme}`)
  }

  if (brief.style) {
    parts.push(`Visual Style: ${brief.style}`)
  }

  if (brief.details) {
    parts.push(`Details: ${brief.details}`)
  }

  if (brief.additionalContext) {
    parts.push(`Additional Context: ${brief.additionalContext}`)
  }

  return parts.join('\n')
}

/**
 * Parse AI response into DesignContext
 */
function parseDesignContext(response: string): DesignContext {
  // Try to extract JSON from response (handle potential markdown wrapping)
  let jsonStr = response.trim()

  // Remove markdown code block if present
  if (jsonStr.startsWith('```json')) {
    jsonStr = jsonStr.slice(7)
  } else if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.slice(3)
  }
  if (jsonStr.endsWith('```')) {
    jsonStr = jsonStr.slice(0, -3)
  }
  jsonStr = jsonStr.trim()

  // Extract JSON object using regex as fallback
  const jsonMatch = jsonStr.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    console.error('Failed to extract JSON from response:', response)
    throw new Error('Failed to parse design context from AI response')
  }

  try {
    const parsed = JSON.parse(jsonMatch[0])

    // Validate required fields
    const required = [
      'corePurpose',
      'desiredAction',
      'emotionalJob',
      'visualElements',
      'backgroundSetting',
      'iconicImagery',
      'colorMood',
      'designStrategy',
      'successMetric'
    ]

    for (const field of required) {
      if (!(field in parsed)) {
        throw new Error(`Missing required field: ${field}`)
      }
    }

    // Ensure arrays are arrays
    if (!Array.isArray(parsed.visualElements)) {
      parsed.visualElements = [parsed.visualElements].filter(Boolean)
    }
    if (!Array.isArray(parsed.iconicImagery)) {
      parsed.iconicImagery = [parsed.iconicImagery].filter(Boolean)
    }

    return parsed as DesignContext
  } catch (error) {
    console.error('JSON parse error:', error, 'Response:', jsonStr)
    throw new Error(`Failed to parse design context: ${error}`)
  }
}

// ============================================================
// LLM PROVIDER IMPLEMENTATIONS
// ============================================================

/**
 * Call Gemini Flash for design intelligence
 * Using Gemini 2.0 Flash - fast, cheap, and excellent for structured output
 */
async function callGemini(prompt: string): Promise<string> {
  // Support both GEMINI_API_KEY (primary) and GOOGLE_AI_API_KEY (fallback)
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY

  console.log('[Design Intelligence] API Key Check:', apiKey ? `Present (***${apiKey.slice(-4)})` : 'MISSING!')

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY or GOOGLE_AI_API_KEY is not configured')
  }

  const genAI = new GoogleGenerativeAI(apiKey)

  // Use Gemini 2.0 Flash for fast, cost-effective analysis
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
    generationConfig: {
      temperature: 0.7, // Some creativity but mostly focused
      topP: 0.9,
      maxOutputTokens: 1024, // Enough for structured response
    }
  })

  console.log('[Design Intelligence] Calling Gemini 2.0 Flash...')
  const startTime = Date.now()

  const result = await model.generateContent(prompt)
  const response = result.response.text()

  const duration = Date.now() - startTime
  console.log(`[Design Intelligence] Response received in ${duration}ms`)
  console.log('[Design Intelligence] Response length:', response.length, 'chars')

  return response
}

/**
 * Call Claude for design intelligence
 * @placeholder - To be implemented when needed
 */
async function callClaude(prompt: string): Promise<string> {
  // Future implementation for Claude API
  // Would use @anthropic-ai/sdk
  throw new Error('Claude provider not yet implemented. Use gemini for now.')
}

/**
 * Call OpenAI for design intelligence
 * @placeholder - To be implemented when needed
 */
async function callOpenAI(prompt: string): Promise<string> {
  // Future implementation for OpenAI API
  // Would use openai package with gpt-4o-mini for cost efficiency
  throw new Error('OpenAI provider not yet implemented. Use gemini for now.')
}

// ============================================================
// FALLBACK / DEFAULT CONTEXT
// ============================================================

/**
 * Event-type specific fallback contexts
 * Provides contextually relevant visual elements when AI analysis fails
 */
const EVENT_TYPE_FALLBACKS: Record<string, Partial<DesignContext>> = {
  conference: {
    visualElements: ['podium with microphone', 'seated audience', 'presentation screen', 'stage lighting', 'conference badges'],
    backgroundSetting: 'Modern convention center with professional stage setup, ambient blue lighting',
    iconicImagery: ['keynote speaker silhouette', 'networking crowd', 'conference banner'],
    colorMood: 'Professional blues and grays with energetic accent colors',
  },
  seminar: {
    visualElements: ['speaker at podium', 'whiteboard or screen', 'attentive audience', 'educational materials'],
    backgroundSetting: 'Academic auditorium or modern lecture hall with focused lighting',
    iconicImagery: ['graduation cap', 'open book', 'knowledge sharing'],
    colorMood: 'Scholarly tones - deep blues, burgundy, gold accents',
  },
  workshop: {
    visualElements: ['hands-on activity', 'workstations', 'participants collaborating', 'tools and materials'],
    backgroundSetting: 'Creative studio space or training room with natural lighting',
    iconicImagery: ['hands working', 'creative tools', 'collaboration'],
    colorMood: 'Energetic and creative - warm oranges, teals, vibrant accents',
  },
  blood_donation: {
    visualElements: ['blood donation bag', 'red cross symbol', 'helping hands', 'heart shape', 'medical equipment'],
    backgroundSetting: 'Clean medical facility or community center with warm, welcoming atmosphere',
    iconicImagery: ['blood drop', 'heart symbol', 'life-saving hands'],
    colorMood: 'Medical red as hero color, clean white, compassionate pink accents',
  },
  awareness: {
    visualElements: ['symbolic ribbon', 'people united', 'informational graphics', 'hands raised'],
    backgroundSetting: 'Community gathering space with hopeful lighting',
    iconicImagery: ['awareness ribbon', 'united hands', 'knowledge symbol'],
    colorMood: 'Cause-appropriate colors with emotional depth',
  },
  camp: {
    visualElements: ['outdoor setting', 'group activities', 'tents or facilities', 'nature elements'],
    backgroundSetting: 'Natural outdoor environment with trees, open sky',
    iconicImagery: ['campfire', 'nature', 'adventure'],
    colorMood: 'Earth tones with vibrant accent colors',
  },
  inauguration: {
    visualElements: ['ribbon cutting ceremony', 'dignitaries', 'building facade', 'ceremonial elements'],
    backgroundSetting: 'Grand entrance or building with formal decorations',
    iconicImagery: ['scissors and ribbon', 'grand opening', 'celebration'],
    colorMood: 'Prestigious gold, deep blue, ceremonial red',
  },
  festival: {
    visualElements: ['colorful decorations', 'cultural elements', 'celebration crowd', 'festive lighting'],
    backgroundSetting: 'Vibrant festival grounds with colorful lighting and decorations',
    iconicImagery: ['fireworks', 'traditional elements', 'celebration'],
    colorMood: 'Vibrant, celebratory colors - bright yellows, reds, oranges',
  },
  webinar: {
    visualElements: ['laptop screen', 'video call interface', 'speaker headshot', 'digital graphics'],
    backgroundSetting: 'Modern home office or professional studio setup',
    iconicImagery: ['webcam', 'digital connection', 'online learning'],
    colorMood: 'Tech-forward blues and purples with clean whites',
  },
  hackathon: {
    visualElements: ['laptops and coding', 'team collaboration', 'whiteboards with ideas', 'coffee cups'],
    backgroundSetting: 'Tech workspace with multiple screens, energetic atmosphere',
    iconicImagery: ['code brackets', 'lightbulb innovation', 'team coding'],
    colorMood: 'Tech neon accents - electric blue, green, purple on dark background',
  },
  competition: {
    visualElements: ['trophy', 'contestants', 'stage or arena', 'scoring display'],
    backgroundSetting: 'Competition venue with dramatic lighting and stage setup',
    iconicImagery: ['trophy', 'winner podium', 'achievement medal'],
    colorMood: 'Champion gold, competitive red, victory blue',
  },
}

/**
 * Generate a fallback design context when AI fails
 * Now uses event-type specific fallbacks for better contextual results
 */
export function generateFallbackContext(brief: DesignBrief): DesignContext {
  const eventType = brief.eventType?.replace(/_/g, ' ') || 'event'
  const eventTypeKey = brief.eventType?.toLowerCase() || ''
  const eventName = brief.eventName || 'Special Event'

  // Try to find event-type specific fallback
  const specificFallback = EVENT_TYPE_FALLBACKS[eventTypeKey]

  if (specificFallback) {
    console.log('[Design Intelligence] Using event-specific fallback for:', eventTypeKey)
    return {
      corePurpose: `Create an impactful ${eventType} design that inspires action and communicates the event's significance`,
      desiredAction: `Register and participate in ${eventName}`,
      emotionalJob: 'Excited, motivated, and eager to participate',
      visualElements: specificFallback.visualElements || [],
      backgroundSetting: specificFallback.backgroundSetting || 'Professional event environment',
      iconicImagery: specificFallback.iconicImagery || [],
      colorMood: specificFallback.colorMood || 'Professional colors with energetic accents',
      designStrategy: 'Lead with impactful visual elements that immediately communicate the event type',
      successMetric: `Viewer immediately understands this is a ${eventType} and feels compelled to attend`
    }
  }

  // Generic fallback for unknown event types
  console.log('[Design Intelligence] Using generic fallback (no specific type found for:', eventTypeKey, ')')
  return {
    corePurpose: `Create an engaging ${eventType} design that captures attention and communicates professionalism`,
    desiredAction: `Attend and participate in ${eventName}`,
    emotionalJob: 'Interested, engaged, and professionally impressed',
    visualElements: [
      'prominent event title',
      'professional speaker or host',
      'relevant thematic imagery',
      'clear call-to-action',
      'event details display'
    ],
    backgroundSetting: 'Professional, modern environment with sophisticated lighting and depth',
    iconicImagery: [
      'event-related symbols',
      'people engaged',
      'dynamic visual elements'
    ],
    colorMood: 'Brand colors with professional harmony, creating trust and engagement',
    designStrategy: 'Balance visual impact with clear information hierarchy, ensuring immediate comprehension',
    successMetric: `Viewer immediately understands this is a noteworthy ${eventType} worth attending`
  }
}

/**
 * Safe wrapper that returns fallback on error
 */
export async function generateDesignContextSafe(
  brief: DesignBrief,
  provider: LLMProvider = 'gemini'
): Promise<DesignContext> {
  try {
    return await generateDesignContext(brief, provider)
  } catch (error) {
    console.error('[Design Intelligence] === ERROR - USING FALLBACK ===')
    console.error('[Design Intelligence] Error:', error instanceof Error ? error.message : error)
    console.warn('[Design Intelligence] WARNING: AI context generation failed, using generic fallback!')
    console.warn('[Design Intelligence] This will result in less contextual designs.')
    return generateFallbackContext(brief)
  }
}
