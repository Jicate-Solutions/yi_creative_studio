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

  // === FORMAT AWARENESS (CRITICAL for correct design type) ===
  /** Format ID (e.g., 'certificate', 'youtube_thumbnail', 'business_card') */
  formatId?: string
  /** Format category/base pattern (e.g., 'print_landscape', 'thumbnail_click') */
  formatCategory?: string
  /** Human-readable format name (e.g., 'Certificate', 'YouTube Thumbnail') */
  formatName?: string
  /** Format-specific design guidance from knowledge base */
  formatGuidance?: string

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

=== CRITICAL FORMAT RULES (READ FIRST!) ===
The OUTPUT FORMAT defines what the design LOOKS LIKE. The event details are CONTENT to fill the format.

FORMAT vs EVENT TYPE (MUST UNDERSTAND):
- FORMAT = What the design IS (certificate = formal document, youtube_thumbnail = click-worthy image, business_card = networking tool)
- EVENT TYPE = What CONTENT goes on it (blood donation = achievement details, seminar = topic info)

Examples of CORRECT interpretation:
- FORMAT: "certificate" + EVENT: "Blood Donation Camp" → Formal certificate document with decorative borders that honors participation in blood donation
- FORMAT: "youtube_thumbnail" + EVENT: "Tech Conference" → Click-worthy thumbnail style with face focus, NOT a conference poster
- FORMAT: "business_card" + EVENT: "Medical Practice" → Compact professional card, NOT a medical poster
- FORMAT: "event_poster" + EVENT: "Blood Donation Camp" → Full promotional poster with blood donation imagery

If no format is specified, default to "event_poster" behavior.

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
- If a SPEAKER PHOTO is mentioned in the brief, describe a composition that leaves appropriate space for the photo
- If speaker photo position is LEFT: Main content (title, details) should flow to the RIGHT side of the design
- If speaker photo position is RIGHT: Main content should flow to the LEFT side of the design
- If speaker photo position is CENTER: Design should frame around the center with content above/below
- NEVER suggest generating an illustrated face or person if a speaker photo will be added - leave that space clear/neutral
- If HEADER area is needed: Keep the top portion clean and airy for branding elements
- If FOOTER area is needed: Keep the bottom portion clean with breathing room
- Consider the visual weight distribution: photo areas should have neutral/complementary backgrounds

IMPORTANT FOR layoutGuidance OUTPUT:
- Use VISUAL/COMPOSITIONAL language only: "content flows left", "balanced top section", "breathing room at bottom"
- NEVER use technical terms in layoutGuidance: NO "px", "reserve", "zone", "overlay", "placement", "logo zone"
- Describe composition in natural design language that won't be confused with text to render

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
  "layoutGuidance": "Natural visual composition guidance using only design language (content flows left, balanced sections, breathing room) - NO technical terms like px, reserve, zone, overlay"
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
  console.log('[Design Intelligence] FORMAT:', brief.formatId || 'event_poster (default)')
  console.log('[Design Intelligence] Format Name:', brief.formatName || 'not specified')
  console.log('[Design Intelligence] Format Category:', brief.formatCategory || 'not specified')
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
 * FORMAT takes PRIORITY over event type for design direction
 */
function buildBriefText(brief: DesignBrief): string {
  const parts: string[] = []

  // === FORMAT TAKES PRIORITY (defines design TYPE) ===
  if (brief.formatId) {
    parts.push('=== OUTPUT FORMAT (DEFINES DESIGN TYPE) ===')
    parts.push(`FORMAT: ${brief.formatName?.toUpperCase() || brief.formatId.toUpperCase().replace(/_/g, ' ')}`)
    parts.push(`This is a ${brief.formatName || brief.formatId.replace(/_/g, ' ')} design.`)

    if (brief.formatCategory) {
      parts.push(`Category: ${brief.formatCategory.replace(/_/g, ' ')}`)
    }

    if (brief.formatGuidance) {
      parts.push(`Format Requirements: ${brief.formatGuidance}`)
    }

    parts.push('')  // Empty line for separation
    parts.push('The above FORMAT defines what the design LOOKS LIKE.')
    parts.push('The below event/content details are what goes ON the design.')
    parts.push('')  // Empty line for separation
  }

  // === EVENT CONTENT (fills the format) ===
  parts.push('=== CONTENT TO DISPLAY ===')

  if (brief.eventType) {
    parts.push(`Content Theme: ${brief.eventType.replace(/_/g, ' ')}`)
  }

  if (brief.eventName) {
    parts.push(`Event/Title: ${brief.eventName}`)
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
 * FORMAT-specific design contexts
 * When a FORMAT is specified, these take PRIORITY over event type fallbacks
 * The FORMAT defines what the design LOOKS LIKE, not the content
 */
const FORMAT_DESIGN_CONTEXTS: Record<string, Partial<DesignContext>> = {
  // === DOCUMENT FORMATS ===
  certificate: {
    corePurpose: 'Create a formal, prestigious document that honors achievement and conveys official recognition',
    visualElements: ['elegant decorative border', 'gold or silver accents', 'laurel wreaths', 'ribbon corners', 'seal placeholder', 'formal typography hierarchy'],
    backgroundSetting: 'Cream or ivory textured paper background with subtle watermark pattern, formal document style',
    iconicImagery: ['official seal', 'laurel wreath', 'decorative flourishes', 'ribbon elements'],
    colorMood: 'Prestigious gold, cream/ivory, deep navy or burgundy accents - formal and distinguished',
    designStrategy: 'Formal, symmetrical layout with recipient name as hero element, decorative borders framing the content',
    desiredAction: 'Display proudly and feel honored',
    emotionalJob: 'Valued, accomplished, and officially recognized',
    successMetric: 'Viewer sees a formal certificate worthy of framing, not a poster or promotional material',
  },

  // === THUMBNAIL FORMATS ===
  youtube_thumbnail: {
    corePurpose: 'Create a click-worthy thumbnail that demands attention in 1-2 seconds and drives video views',
    visualElements: ['expressive human face taking 50%+ of frame', 'bold outlined text with stroke', 'high contrast elements', 'dramatic lighting on face'],
    backgroundSetting: 'Bold solid color or dramatic gradient background that makes the subject pop instantly',
    iconicImagery: ['reaction face with emotion', 'action moment captured', 'dramatic lighting effects'],
    colorMood: 'Bright, saturated, high contrast colors optimized for YouTube algorithm - yellows, reds, bright blues',
    designStrategy: 'Face-focused composition with minimal but impactful text, designed for thumb-stopping power at small sizes',
    desiredAction: 'Click to watch the video immediately',
    emotionalJob: 'Curious, intrigued, and compelled to click',
    successMetric: 'Viewer instantly understands the video topic and feels compelled to click - NOT a poster',
  },
  tiktok_cover: {
    corePurpose: 'Create a vertical-first cover that stops scrolling and represents the video content',
    visualElements: ['vertical human figure or face', 'bold text overlay', 'mobile-optimized elements', 'high contrast'],
    backgroundSetting: 'Bold, clean background optimized for mobile vertical viewing',
    iconicImagery: ['expressive face', 'trending visual style', 'mobile-native elements'],
    colorMood: 'Vibrant, trendy colors that pop on mobile screens',
    designStrategy: 'Vertical-first design with elements positioned for mobile feed viewing',
    desiredAction: 'Stop scrolling and watch the video',
    emotionalJob: 'Entertained, curious, engaged',
    successMetric: 'Viewer stops scrolling to watch - designed for vertical mobile feed',
  },

  // === PROFESSIONAL FORMATS ===
  business_card: {
    corePurpose: 'Create a memorable, professional networking tool that fits in a wallet',
    visualElements: ['clean name hierarchy', 'contact information layout', 'brand logo space', 'professional typography'],
    backgroundSetting: 'Clean, minimal background with brand colors, business card dimensions',
    iconicImagery: ['professional patterns', 'subtle brand elements', 'clean geometric accents'],
    colorMood: 'Professional, memorable brand colors with clean contrast',
    designStrategy: 'Compact, scannable layout with clear information hierarchy, all text must be readable at card size',
    desiredAction: 'Save this contact and remember this professional',
    emotionalJob: 'Impressed and confident in this professional',
    successMetric: 'Viewer sees a professional business card, NOT a poster or promotional flyer',
  },
  letterhead: {
    corePurpose: 'Create a professional document header that establishes brand credibility',
    visualElements: ['company logo space', 'contact information bar', 'subtle brand elements', 'formal typography'],
    backgroundSetting: 'Clean white background with minimal brand color accents',
    iconicImagery: ['professional logo placeholder', 'subtle watermark', 'corporate elements'],
    colorMood: 'Professional, clean, brand-consistent colors',
    designStrategy: 'Top-heavy design with branding, leaving ample space for document content below',
    desiredAction: 'Trust this organization',
    emotionalJob: 'Confident in the professionalism of this organization',
    successMetric: 'Viewer recognizes this as professional letterhead stationery',
  },

  // === SOCIAL MEDIA FORMATS ===
  instagram_story: {
    corePurpose: 'Create a vertical, swipe-stopping story that drives engagement in the Instagram Stories feed',
    visualElements: ['vertical focal point', 'bold overlay text', 'interactive element hints', 'mobile-optimized imagery'],
    backgroundSetting: 'Full-bleed vertical background optimized for 9:16 mobile viewing',
    iconicImagery: ['story-native elements', 'swipe-up hints', 'engagement prompts'],
    colorMood: 'Vibrant, Instagram-native colors that stand out in Stories',
    designStrategy: 'Vertical composition with key content in safe zones, designed for quick consumption',
    desiredAction: 'Engage with story (swipe, reply, react)',
    emotionalJob: 'Engaged, entertained, connected',
    successMetric: 'Viewer stops on this story and engages - NOT a square or landscape poster',
  },
  instagram_post: {
    corePurpose: 'Create a feed-stopping square post that drives likes, comments, and saves',
    visualElements: ['centered focal point', 'clean composition', 'brand-consistent elements', 'caption-ready design'],
    backgroundSetting: 'Square format background that works in the Instagram grid',
    iconicImagery: ['Instagram-native visual style', 'shareable elements', 'aesthetic composition'],
    colorMood: 'Aesthetic, curated colors that fit Instagram visual culture',
    designStrategy: 'Square composition optimized for grid view and individual viewing',
    desiredAction: 'Like, comment, save, or share this post',
    emotionalJob: 'Inspired, connected, aesthetically pleased',
    successMetric: 'Viewer engages with the post - designed for Instagram grid',
  },
  linkedin_post: {
    corePurpose: 'Create a professional, thought-leadership post that drives engagement in the LinkedIn feed',
    visualElements: ['professional imagery', 'clear headline text', 'data visualization elements', 'corporate-appropriate design'],
    backgroundSetting: 'Professional, clean background appropriate for business context',
    iconicImagery: ['professional icons', 'business imagery', 'thought leadership visuals'],
    colorMood: 'Professional blues, corporate colors, trustworthy palette',
    designStrategy: 'Professional composition that looks good in LinkedIn feed and drives comments',
    desiredAction: 'Engage with post, comment, or connect',
    emotionalJob: 'Professionally impressed, thoughtful, engaged',
    successMetric: 'Viewer sees professional content worthy of LinkedIn engagement',
  },

  // === MARKETING FORMATS ===
  flyer: {
    corePurpose: 'Create an attention-grabbing promotional flyer that can be distributed physically or digitally',
    visualElements: ['bold headline', 'event details', 'call to action', 'promotional imagery'],
    backgroundSetting: 'Eye-catching background appropriate for promotional material',
    iconicImagery: ['promotional graphics', 'action-oriented imagery', 'event visuals'],
    colorMood: 'Vibrant, attention-grabbing colors that stand out when distributed',
    designStrategy: 'Clear hierarchy with headline, details, and CTA - designed for quick scanning',
    desiredAction: 'Read details and take action (attend, sign up, buy)',
    emotionalJob: 'Excited, interested, motivated to act',
    successMetric: 'Viewer gets the key message quickly and knows what action to take',
  },
  billboard: {
    corePurpose: 'Create a high-impact design readable at a glance from distance',
    visualElements: ['massive bold text', 'single focal image', 'brand logo', 'minimal elements'],
    backgroundSetting: 'Bold, simple background with maximum contrast for outdoor viewing',
    iconicImagery: ['single powerful image', 'iconic brand elements', 'dramatic visuals'],
    colorMood: 'High contrast, bold colors visible from distance',
    designStrategy: 'Ultra-simple composition with 7 words or less - readable at 60mph',
    desiredAction: 'Remember the brand/message',
    emotionalJob: 'Impacted, aware, brand recognition',
    successMetric: 'Viewer gets the message in 3 seconds from distance',
  },

  // === PRESENTATION FORMATS ===
  presentation_slide: {
    corePurpose: 'Create a clear, scannable slide that supports presenter without overwhelming',
    visualElements: ['bullet points or key text', 'supporting graphic', 'slide number', 'minimal design'],
    backgroundSetting: 'Clean, professional background that doesn\'t distract from content',
    iconicImagery: ['supporting icons', 'data visualizations', 'professional graphics'],
    colorMood: 'Professional, readable colors with good contrast for projection',
    designStrategy: 'Content-focused with clear hierarchy, designed to be spoken TO not read FROM',
    desiredAction: 'Understand the key point and listen to presenter',
    emotionalJob: 'Informed, focused, engaged with presenter',
    successMetric: 'Viewer can grasp the slide point in 3 seconds - NOT a document to read',
  },

  // === EVENT FORMATS (default poster behavior) ===
  event_poster: {
    corePurpose: 'Create an attention-grabbing event poster that drives attendance',
    visualElements: ['bold event title', 'event imagery', 'date and venue', 'call to action'],
    backgroundSetting: 'Event-appropriate background with visual impact',
    iconicImagery: ['event-specific icons', 'thematic elements', 'action imagery'],
    colorMood: 'Event-appropriate colors that create excitement and urgency',
    designStrategy: 'Visual hierarchy leading to registration/attendance CTA',
    desiredAction: 'Register or attend the event',
    emotionalJob: 'Excited, informed, motivated to attend',
    successMetric: 'Viewer knows what the event is, when it is, and wants to attend',
  },
}

/**
 * Generate a fallback design context when AI fails
 * FORMAT takes PRIORITY over event type for design direction
 */
export function generateFallbackContext(brief: DesignBrief): DesignContext {
  const eventType = brief.eventType?.replace(/_/g, ' ') || 'event'
  const eventTypeKey = brief.eventType?.toLowerCase() || ''
  const eventName = brief.eventName || 'Special Event'
  const formatId = brief.formatId?.toLowerCase() || ''
  const formatName = brief.formatName || brief.formatId?.replace(/_/g, ' ') || 'design'

  // PRIORITY 1: Try FORMAT-specific fallback first (defines design TYPE)
  const formatFallback = FORMAT_DESIGN_CONTEXTS[formatId]

  if (formatFallback) {
    console.log('[Design Intelligence] Using FORMAT-specific fallback for:', formatId)
    console.log('[Design Intelligence] Event content:', eventTypeKey || 'general')

    // Merge format design with event content context
    return {
      corePurpose: formatFallback.corePurpose || `Create a professional ${formatName}`,
      desiredAction: formatFallback.desiredAction || `Engage with this ${formatName}`,
      emotionalJob: formatFallback.emotionalJob || 'Professionally impressed',
      visualElements: formatFallback.visualElements || [],
      backgroundSetting: formatFallback.backgroundSetting || 'Professional background',
      iconicImagery: formatFallback.iconicImagery || [],
      colorMood: formatFallback.colorMood || 'Professional colors',
      designStrategy: formatFallback.designStrategy || 'Clear, professional layout',
      successMetric: formatFallback.successMetric || `Viewer recognizes this as a ${formatName}`
    }
  }

  // PRIORITY 2: Try event-type specific fallback (for posters/general creatives)
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

  // PRIORITY 3: Generic fallback for unknown format/event types
  console.log('[Design Intelligence] Using generic fallback (no specific type found for format:', formatId, 'event:', eventTypeKey, ')')
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
