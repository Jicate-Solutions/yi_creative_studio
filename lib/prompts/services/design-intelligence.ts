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
import Anthropic from '@anthropic-ai/sdk'

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
  /** Specific layout guidance based on speaker photo position and logo requirements */
  layoutGuidance?: string
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
  /** Guest/speaker designation (e.g., 'Chief Guest', 'Keynote Speaker') */
  guestDesignation?: string
  /** Venue information */
  venue?: string
  /** Any additional context */
  additionalContext?: string

  // === VISUAL LAYOUT CONTEXT ===
  /** Whether speaker photo overlay is enabled */
  hasSpeakerPhoto?: boolean
  /** Speaker photo position: 'left', 'center', 'right' */
  speakerPhotoPosition?: string
  /** Speaker photo shape: 'circle', 'rounded', 'square' */
  speakerPhotoShape?: string
  /** Speaker photo size in pixels */
  speakerPhotoSize?: number
  /** Whether header logo zone is enabled */
  hasHeaderLogo?: boolean
  /** Header zone height in pixels */
  headerHeight?: number
  /** Whether footer zone is enabled */
  hasFooterLogo?: boolean
  /** Footer zone height in pixels */
  footerHeight?: number
  /** Additional layout preferences */
  layoutPreferences?: string
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
10. What LAYOUT GUIDANCE is needed based on speaker photo and logo positions?

CRITICAL RULES:
- Be SPECIFIC with visual elements - name exact objects (e.g., "microphone at podium", "blood donation bag with tubing", "graduation cap flying in air")
- Background settings should be CONTEXTUAL to the event type (e.g., "modern convention center with stage lighting" for conferences)
- Avoid generic descriptions - be precise and purposeful
- Think about what a viewer seeing this design would immediately understand
- IMPORTANT: The design should be a FULL-BLEED poster that fills the entire canvas edge-to-edge
- NEVER describe the poster as "displayed on a wall", "framed", "mockup", or any presentation context
- The backgroundSetting should describe what's IN the poster design, not a wall/room the poster hangs on

VISUAL LAYOUT RULES (CRITICAL - READ CAREFULLY):
- If a SPEAKER PHOTO is mentioned in the brief, describe a composition that leaves appropriate space for the photo overlay
- If speaker photo position is LEFT: Main content (title, details) should flow to the RIGHT side of the design
- If speaker photo position is RIGHT: Main content should flow to the LEFT side of the design
- If speaker photo position is CENTER: Design should frame around the center with content above/below
- NEVER suggest generating an illustrated face or person if a speaker photo will be overlaid - leave that space clear/neutral for the actual photo
- If HEADER LOGO zone is mentioned: Keep the top portion of the design suitable for logo placement (avoid complex backgrounds there)
- If FOOTER LOGO zone is mentioned: Keep the bottom portion clean and suitable for contact info/branding
- Consider the visual weight distribution: speaker photo areas should have neutral/complementary backgrounds

Return ONLY valid JSON (no markdown code blocks, no explanation, just the JSON object):
{
  "corePurpose": "Single compelling sentence about what this design MUST accomplish emotionally",
  "desiredAction": "Specific action viewers should take (e.g., 'Register immediately', 'Donate blood today', 'Attend this wedding')",
  "emotionalJob": "How viewers should feel (e.g., 'Excited and professionally inspired', 'Compassionate and heroic', 'Joyful and celebratory')",
  "visualElements": ["specific element 1", "specific element 2", "specific element 3", "specific element 4", "specific element 5"],
  "backgroundSetting": "Detailed, contextually appropriate background description - consider speaker photo and logo zones",
  "iconicImagery": ["iconic image 1", "iconic image 2", "iconic image 3"],
  "colorMood": "Color psychology guidance specific to this design's emotional goal",
  "designStrategy": "Strategic approach for the visual execution",
  "successMetric": "How to measure if the design worked (viewer's immediate thought)",
  "layoutGuidance": "Specific guidance on element placement based on speaker photo position (left/right/center) and logo zone requirements"
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
  provider: LLMProvider = 'claude'
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
 * Now includes visual layout context for better AI understanding
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

  // Guest info with designation
  if (brief.guestName) {
    const guestInfo = brief.guestDesignation
      ? `${brief.guestName} (${brief.guestDesignation})`
      : brief.guestName
    parts.push(`Guest/Speaker: ${guestInfo}`)
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

  // === VISUAL LAYOUT CONTEXT (CRITICAL FOR IMAGE GENERATION) ===
  parts.push('')  // Empty line for separation
  parts.push('=== VISUAL LAYOUT REQUIREMENTS ===')

  // Speaker photo context
  if (brief.hasSpeakerPhoto) {
    const position = brief.speakerPhotoPosition || 'center'
    const shape = brief.speakerPhotoShape || 'circle'
    const size = brief.speakerPhotoSize || 150

    parts.push(`SPEAKER PHOTO: ENABLED`)
    parts.push(`- Position: ${position.toUpperCase()} side of the poster`)
    parts.push(`- Shape: ${shape} (approximately ${size}px)`)
    parts.push(`- IMPORTANT: Leave appropriate space on the ${position.toUpperCase()} side for the speaker photo overlay`)
    parts.push(`- DO NOT generate an illustrated face/person in that area - the actual speaker photo will be overlaid`)

    // Position-specific guidance
    if (position === 'left') {
      parts.push(`- Main content (title, event details) should be positioned on the RIGHT side`)
      parts.push(`- The LEFT portion should have a complementary but neutral background suitable for photo overlay`)
    } else if (position === 'right') {
      parts.push(`- Main content (title, event details) should be positioned on the LEFT side`)
      parts.push(`- The RIGHT portion should have a complementary but neutral background suitable for photo overlay`)
    } else if (position === 'center') {
      parts.push(`- Design should frame around the CENTER`)
      parts.push(`- Title and key info above the center, details below`)
      parts.push(`- The CENTER area should be neutral/subtle for photo overlay`)
    }
  } else {
    parts.push(`SPEAKER PHOTO: Not enabled (no photo overlay expected)`)
  }

  // Header logo zone
  if (brief.hasHeaderLogo && brief.headerHeight && brief.headerHeight > 0) {
    parts.push(`HEADER LOGO ZONE: Reserve top ${brief.headerHeight}px for organization logo(s)`)
    parts.push(`- Keep top area clean and suitable for logo placement`)
    parts.push(`- Avoid complex imagery or important text in the header zone`)
  }

  // Footer logo zone
  if (brief.hasFooterLogo && brief.footerHeight && brief.footerHeight > 0) {
    parts.push(`FOOTER ZONE: Reserve bottom ${brief.footerHeight}px for contact info and branding`)
    parts.push(`- Keep bottom area suitable for text overlays (website, contact, sponsors)`)
    parts.push(`- Use a slightly darker or lighter tone that ensures text readability`)
  }

  // Additional layout preferences
  if (brief.layoutPreferences) {
    parts.push(`Layout Preferences: ${brief.layoutPreferences}`)
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

    // layoutGuidance is optional but should be a string if present
    if (parsed.layoutGuidance && typeof parsed.layoutGuidance !== 'string') {
      parsed.layoutGuidance = String(parsed.layoutGuidance)
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
 * Using Claude 3.5 Haiku - fast, cost-effective, and excellent reasoning
 */
async function callClaude(prompt: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY

  console.log('[Design Intelligence] API Key Check:', apiKey ? `Present (***${apiKey.slice(-4)})` : 'MISSING!')

  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured')
  }

  const client = new Anthropic({ apiKey })

  console.log('[Design Intelligence] Calling Claude 3.5 Haiku...')
  const startTime = Date.now()

  const response = await client.messages.create({
    model: 'claude-3-5-haiku-latest',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ]
  })

  const duration = Date.now() - startTime
  console.log(`[Design Intelligence] Response received in ${duration}ms`)

  // Extract text from response
  const textBlock = response.content.find(block => block.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from Claude')
  }

  console.log('[Design Intelligence] Response length:', textBlock.text.length, 'chars')

  return textBlock.text
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
  provider: LLMProvider = 'claude'
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
