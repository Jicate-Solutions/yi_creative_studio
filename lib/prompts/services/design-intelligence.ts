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

// Import prompt optimization utilities
import {
  getTemperatureConfig,
  generateDesignContextCacheKey,
  getCachedDesignContext,
  setCachedDesignContext,
  validateAndFixDesignContext,
  integratePattersWithDesignContext,
  selectABVariant,
  createClaudeCacheableRequest,
} from './prompt-optimization'

// ============================================================
// TYPES
// ============================================================

export type LLMProvider = 'gemini' | 'claude' | 'openai'

/**
 * Token usage from AI API call
 */
export interface TokenUsage {
  inputTokens: number
  outputTokens: number
  cachedTokens?: number
  totalTokens: number
}

/**
 * Response from LLM call including token usage
 */
interface LLMResponse {
  text: string
  tokenUsage: TokenUsage
  model: string
  durationMs: number
}

/**
 * Result from design context generation including usage tracking
 */
export interface DesignContextResult {
  context: DesignContext
  usage: {
    provider: 'gemini' | 'claude'
    model: string
    tokenUsage: TokenUsage
    durationMs: number
  }
}

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

  // === v3.4: Enhanced design attributes ===
  /** Typography recommendations for this design */
  typographyGuidance?: {
    /** Headline font style and weight (e.g., "Bold sans-serif for impact") */
    headlineStyle: string
    /** Body text style (e.g., "Clean readable sans-serif") */
    bodyStyle: string
    /** Size and weight hierarchy description */
    hierarchy: string
  }
  /** Decorative element recommendations */
  decorativeElements?: {
    /** Corner treatments (e.g., "Geometric corner accents") */
    corners: string
    /** Pattern overlays (e.g., "Subtle gradient mesh at 10% opacity") */
    patterns: string
    /** Accent elements (e.g., "Gold ribbon borders") */
    accents: string
  }
  /** ONE unexpected visual element that makes this design unique and memorable */
  creativeTwist?: string
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

  // === LOGO AWARENESS (Smart Layout) ===
  /** Pre-computed logo safe zone guidance for AI */
  logoSafeZoneGuidance?: string
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
const DESIGN_INTELLIGENCE_PROMPT = `You are an ULTRA-PRO DESIGNER with 20+ years creating award-winning campaigns for Apple, Nike, TED, ESPN, National Geographic, and Google.

Your SUPERPOWER: You think like a DOMAIN EXPERT. When you see "AI Workshop", you don't just think "technology" - you think like a Silicon Valley designer who lives and breathes tech culture. When you see "Cricket Tournament", you think like a sports brand designer who understands athletic energy.

=== DOMAIN-SPECIFIC DESIGN THINKING (CRITICAL!) ===

STEP 1: IDENTIFY THE DOMAIN from the event details. Then THINK LIKE THAT DOMAIN'S TOP DESIGNER:

🤖 **AI / TECHNOLOGY / INNOVATION EVENTS**
Think like: Apple, Google, Tesla design teams
Typography: Futuristic sans-serif (like SF Pro, Inter, Geist), ultra-bold headlines with tight tracking
Colors: Electric blue (#0066FF), neon cyan (#00D4FF), deep purple (#6B5CE7), dark backgrounds
Patterns: Neural network meshes, circuit board traces, data flow visualizations, holographic grids
Decorative: Glowing orbs, particle effects, geometric wireframes, gradient meshes
Background: Dark space with glowing nodes, abstract data streams, futuristic cityscapes
Energy: Cutting-edge, innovative, forward-thinking, sleek

⚽ **SPORTS / FITNESS / ATHLETIC EVENTS**
Think like: Nike, ESPN, Under Armour design teams
Typography: Bold condensed impact fonts, dynamic italics for speed, aggressive uppercase
Colors: High-energy (red #FF3B30, orange #FF9500, electric green #30D158), strong contrasts
Patterns: Dynamic diagonal stripes, motion blur effects, halftone dots, speed lines
Decorative: Swooshes, action bursts, geometric shapes suggesting movement
Background: Stadium lights, action shots, athletic textures, grass/court surfaces
Energy: Powerful, dynamic, competitive, victorious, adrenaline-pumping

🏥 **MEDICAL / HEALTH / WELLNESS EVENTS**
Think like: Mayo Clinic, WHO, wellness brand design teams
Typography: Clean humanist sans-serif (like Avenir, Proxima Nova), approachable yet professional
Colors: Trust blue (#007AFF), healing green (#34C759), clean white, soft coral for warmth
Patterns: Subtle pulse lines, DNA helix motifs, cellular structures, soft gradients
Decorative: Medical crosses, heart icons, stethoscope silhouettes, clean geometric shapes
Background: Clean clinical environments, soft gradients, medical imagery, caring hands
Energy: Trustworthy, caring, professional, life-saving, hopeful

🎭 **CULTURAL / TRADITIONAL / HERITAGE EVENTS**
Think like: Museum curators, cultural festival designers, heritage brand teams
Typography: Elegant serifs (like Playfair, Cormorant), decorative scripts for accents
Colors: Rich golds (#FFD700), deep maroons (#800020), royal purples, earthy tones
Patterns: Traditional motifs (rangoli, mandala, ethnic patterns), ornate borders
Decorative: Floral elements, paisley designs, cultural symbols, intricate borders
Background: Warm textures, fabric patterns, architectural elements, festive imagery
Energy: Rich, celebratory, rooted, majestic, heritage-proud

💼 **CORPORATE / BUSINESS / PROFESSIONAL EVENTS**
Think like: McKinsey, Deloitte, Fortune 500 design teams
Typography: Professional sans-serif (like Helvetica, Arial, Calibri), clean and authoritative
Colors: Corporate blue (#0A66C2), charcoal (#333333), professional greens, gold accents
Patterns: Subtle geometric grids, abstract business graphics, minimal line patterns
Decorative: Clean borders, professional badges, subtle gradients
Background: Modern office architecture, abstract corporate imagery, clean gradients
Energy: Professional, trustworthy, authoritative, growth-oriented

🎓 **EDUCATION / ACADEMIC / LEARNING EVENTS**
Think like: Harvard, TED-Ed, Coursera design teams
Typography: Scholarly serifs for prestige (Georgia, Times), modern sans for accessibility
Colors: Academic navy (#1E3A5F), wisdom gold (#CFB53B), knowledge green, parchment cream
Patterns: Book page textures, graduation cap motifs, lightbulb iconography
Decorative: Laurel wreaths, academic crests, scroll elements, wisdom symbols
Background: Library settings, graduation scenes, inspiring educational environments
Energy: Inspiring, intellectual, empowering, growth-focused

🎉 **ENTERTAINMENT / PARTY / CELEBRATION EVENTS**
Think like: MTV, festival designers, entertainment brand teams
Typography: Bold display fonts, playful scripts, dynamic varied weights
Colors: Vibrant party colors (magenta #FF2D55, electric yellow #FFCC00, party purple #AF52DE)
Patterns: Confetti, sparkles, dynamic shapes, party textures
Decorative: Balloons, streamers, stars, celebration bursts
Background: Stage lights, party atmospheres, colorful abstract backgrounds
Energy: Fun, exciting, celebratory, energetic, joyful

🌱 **ENVIRONMENT / SUSTAINABILITY / GREEN EVENTS**
Think like: WWF, Patagonia, sustainability brand teams
Typography: Organic rounded fonts, nature-inspired letterforms, eco-friendly aesthetics
Colors: Natural greens (#34C759, #228B22), earth browns, sky blues, organic tones
Patterns: Leaf textures, organic shapes, nature patterns, sustainable motifs
Decorative: Leaves, trees, eco symbols, natural elements
Background: Nature scenes, sustainable imagery, green environments
Energy: Hopeful, responsible, natural, earth-conscious

=== FORMAT RULES ===
FORMAT = What the design IS (poster, certificate, thumbnail)
EVENT TYPE = What CONTENT/DOMAIN it represents (tech, sports, medical)

ANALYZE THE FOLLOWING CREATIVE BRIEF:
{brief}

=== ULTRA-THINK PROCESS ===

1. **DOMAIN DETECTION**: What domain does this event belong to? (AI/Tech, Sports, Medical, Cultural, Corporate, Education, Entertainment, Environment, or hybrid)

2. **DESIGNER PERSONA**: Now BECOME that domain's top designer. Think in their visual language.

3. **VISUAL VOCABULARY**: What specific visual elements does this domain use? Be EXTREMELY specific - not "tech imagery" but "neural network with glowing blue nodes and connecting data streams"

4. **TYPOGRAPHY DNA**: What fonts does this domain use? What's the headline weight, tracking, and style?

5. **COLOR PSYCHOLOGY**: What colors trigger the right emotions for this domain?

6. **PATTERN LANGUAGE**: What subtle patterns reinforce the domain identity?

7. **DECORATIVE SIGNATURE**: What decorative elements are this domain's visual signature?

=== ULTRA-CREATIVE THINKING (MANDATORY) ===

Before generating, THINK DEEPLY about creating something UNIQUE:

1. **VISUAL METAPHOR**: What single powerful image captures this event's essence?
   - For AI/Tech: Not just "neural network" but "a human consciousness merging with digital infinity"
   - For Health: Not just "medical symbols" but "the moment when care transforms into healing"
   - For Sports: Not just "athletic energy" but "the split-second before victory"

2. **UNEXPECTED COMBINATION**: Mix two concepts that create surprise:
   - Technology + organic nature (circuits that grow like vines)
   - Digital + handcrafted (holographic calligraphy)
   - Future + heritage (ancient patterns made of light)
   - Abstract + human emotion (data streams that feel like hope)

3. **EMOTIONAL MOMENT**: What specific moment does this design capture?
   - The breakthrough instant when understanding dawns
   - The connection forming between minds
   - The future arriving in the present
   - The transformation happening before your eyes

4. **UNIQUE SIGNATURE**: What ONE visual element makes this unmistakably THIS event?
   - Something never seen before in similar designs
   - Something that tells the story instantly
   - Something memorable that viewers will recall

Generate designs that FEEL like ART, not templates. Each design should be a fresh creative vision.

=== CRITICAL RULES ===
- Be HYPER-SPECIFIC: Not "technology elements" but "holographic AI brain visualization with cyan neural pathways"
- Be DOMAIN-AUTHENTIC: A sports event should FEEL athletic, a tech event should FEEL futuristic
- Be VIEWER-FOCUSED: What will the viewer IMMEDIATELY understand about this event?
- FULL-BLEED design that fills the canvas edge-to-edge
- NEVER describe poster "on a wall" - describe what's IN the design

=== LAYOUT RULES ===
- If SPEAKER PHOTO position is LEFT: Content flows RIGHT
- If SPEAKER PHOTO position is RIGHT: Content flows LEFT
- If SPEAKER PHOTO position is CENTER: Content frames around center
- NEVER generate illustrated faces if speaker photo will be added
- Keep HEADER area clean for logos
- Use VISUAL language only in layoutGuidance (no "px", "zone", "overlay")

Return ONLY valid JSON:
{
  "corePurpose": "What emotional job this design MUST accomplish - be domain-specific",
  "desiredAction": "Specific action viewers should take",
  "emotionalJob": "How viewers should FEEL - tied to the domain's energy",
  "visualElements": ["SPECIFIC domain element 1", "SPECIFIC domain element 2", "SPECIFIC element 3", "SPECIFIC element 4", "SPECIFIC element 5"],
  "backgroundSetting": "Detailed DOMAIN-APPROPRIATE background - immersive and contextual",
  "iconicImagery": ["domain-specific icon 1", "domain-specific icon 2", "domain-specific icon 3"],
  "colorMood": "DOMAIN-SPECIFIC color psychology with hex codes",
  "designStrategy": "Strategic approach that matches the domain's design language",
  "successMetric": "What viewer thinks in 3 seconds - domain-relevant",
  "layoutGuidance": "Visual composition using design language only",
  "typographyGuidance": {
    "headlineStyle": "DOMAIN-SPECIFIC headline font style (e.g., 'Futuristic bold sans-serif with tight tracking for tech' or 'Impact condensed italic for sports energy')",
    "bodyStyle": "DOMAIN-APPROPRIATE body text that ensures readability while matching the vibe",
    "hierarchy": "Size/weight hierarchy that matches domain conventions"
  },
  "decorativeElements": {
    "corners": "DOMAIN-SPECIFIC corner treatment (e.g., 'Geometric circuit-trace corners for AI events' or 'Dynamic swoosh corners for sports')",
    "patterns": "DOMAIN-AUTHENTIC pattern at low opacity (e.g., 'Neural mesh pattern at 10% for tech' or 'Stadium turf texture at 8% for sports')",
    "accents": "DOMAIN-SIGNATURE accent elements (e.g., 'Neon glow lines for tech' or 'Athletic stripe accents for sports')"
  },
  "creativeTwist": "ONE unexpected visual element that makes this design UNIQUE and MEMORABLE - something viewers haven't seen before (e.g., 'AI neurons that bloom like flowers' or 'data streams that form a human heartbeat pattern')"
}`

// ============================================================
// MAIN SERVICE
// ============================================================

/**
 * Generate design context using AI analysis
 *
 * OPTIMIZATIONS (v3.7):
 * - Response caching for similar requests
 * - Dynamic temperature based on format type
 * - Schema validation with auto-fix
 * - Feedback pattern integration
 * - A/B testing support
 *
 * @param brief - The creative brief to analyze
 * @param provider - LLM provider to use (default: claude)
 * @param organizationId - Optional org ID for feedback patterns
 * @returns Structured design context for image generation with usage tracking
 */
export async function generateDesignContext(
  brief: DesignBrief,
  provider: LLMProvider = 'claude',
  organizationId?: string
): Promise<DesignContextResult> {
  console.log('[Design Intelligence] === STAGE 1: GENERATING DESIGN CONTEXT ===')
  console.log('[Design Intelligence] FORMAT:', brief.formatId || 'event_poster (default)')
  console.log('[Design Intelligence] Format Name:', brief.formatName || 'not specified')
  console.log('[Design Intelligence] Format Category:', brief.formatCategory || 'not specified')
  console.log('[Design Intelligence] Event Type:', brief.eventType || 'unknown')
  console.log('[Design Intelligence] Event Name:', brief.eventName || 'not provided')
  console.log('[Design Intelligence] Theme:', brief.theme || 'default')
  console.log('[Design Intelligence] Style:', brief.style || 'default')

  // === OPTIMIZATION 1: Check cache first ===
  const cacheKey = generateDesignContextCacheKey({
    formatId: brief.formatId,
    eventType: brief.eventType,
    eventName: brief.eventName,
    theme: brief.theme,
    style: brief.style,
    hasSpeakerPhoto: brief.hasSpeakerPhoto,
  })

  const cachedContext = getCachedDesignContext(cacheKey) as DesignContext | null
  if (cachedContext) {
    console.log('[Design Intelligence] Using CACHED context')
    return {
      context: cachedContext,
      usage: {
        provider: provider === 'gemini' ? 'gemini' : 'claude',
        model: 'cached',
        tokenUsage: { inputTokens: 0, outputTokens: 0, cachedTokens: 0, totalTokens: 0 },
        durationMs: 0,
      },
    }
  }

  // === OPTIMIZATION 2: Get dynamic temperature config ===
  let tempConfig = getTemperatureConfig(brief.formatId)
  console.log('[Design Intelligence] Temperature config:', tempConfig.description)

  // === OPTIMIZATION 3: A/B test variant selection ===
  const abVariant = selectABVariant('creative_twist_emphasis_v1')
  if (abVariant) {
    console.log('[Design Intelligence] A/B test variant:', abVariant.variantId)
    tempConfig = { ...tempConfig, ...abVariant.config }
  }

  // Build the full brief text
  const briefText = buildBriefText(brief)
  console.log('[Design Intelligence] Brief Text:', briefText.substring(0, 200) + '...')

  // Generate the prompt
  const prompt = DESIGN_INTELLIGENCE_PROMPT.replace('{brief}', briefText)

  // Call the appropriate LLM provider with dynamic temperature
  let llmResponse: LLMResponse
  let effectiveProvider: 'gemini' | 'claude' = provider === 'gemini' ? 'gemini' : 'claude'
  console.log('[Design Intelligence] Provider:', provider)
  console.log('[Design Intelligence] Temperature:', tempConfig.designIntelligence)

  switch (provider) {
    case 'gemini':
      llmResponse = await callGemini(prompt, tempConfig.designIntelligence, tempConfig.topP)
      effectiveProvider = 'gemini'
      break
    case 'claude':
      llmResponse = await callClaude(prompt, tempConfig.designIntelligence)
      effectiveProvider = 'claude'
      break
    case 'openai':
      llmResponse = await callOpenAI(prompt)
      effectiveProvider = 'claude' // OpenAI not implemented, would fallback
      break
    default:
      llmResponse = await callGemini(prompt, tempConfig.designIntelligence, tempConfig.topP)
      effectiveProvider = 'gemini'
  }

  // === OPTIMIZATION 4: Schema validation with auto-fix ===
  const parsedContext = parseDesignContext(llmResponse.text)
  const validatedContext = validateAndFixDesignContext(parsedContext)

  if (!validatedContext) {
    console.warn('[Design Intelligence] Validation failed, using fallback context')
    return {
      context: generateFallbackContext(brief),
      usage: {
        provider: effectiveProvider,
        model: llmResponse.model,
        tokenUsage: llmResponse.tokenUsage,
        durationMs: llmResponse.durationMs,
      },
    }
  }

  // === OPTIMIZATION 5: Integrate feedback patterns ===
  let finalContext = validatedContext as DesignContext
  if (organizationId && brief.formatId) {
    const { enhancedContext, appliedPatterns } = await integratePattersWithDesignContext(
      validatedContext as Record<string, unknown>,
      {
        formatId: brief.formatId,
        eventType: brief.eventType,
        organizationId,
      }
    )
    if (appliedPatterns.length > 0) {
      console.log('[Design Intelligence] Applied feedback patterns:', appliedPatterns.join(', '))
      finalContext = enhancedContext as DesignContext
    }
  }

  console.log('[Design Intelligence] === CONTEXT GENERATED SUCCESSFULLY ===')
  console.log('[Design Intelligence] Core Purpose:', finalContext.corePurpose)
  console.log('[Design Intelligence] Visual Elements:', finalContext.visualElements.join(', '))
  console.log('[Design Intelligence] Background:', finalContext.backgroundSetting.substring(0, 100) + '...')

  // === OPTIMIZATION 6: Cache the result ===
  setCachedDesignContext(cacheKey, finalContext)

  return {
    context: finalContext,
    usage: {
      provider: effectiveProvider,
      model: llmResponse.model,
      tokenUsage: llmResponse.tokenUsage,
      durationMs: llmResponse.durationMs,
    },
  }
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

  // Guest info with designation - ONLY include when speaker photo is enabled
  // This prevents speaker data from leaking into AI prompts when speaker feature is disabled
  if (brief.guestName && brief.hasSpeakerPhoto) {
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

  // === LOGO SAFE ZONES (Smart Layout - CRITICAL FOR AI AWARENESS) ===
  if (brief.logoSafeZoneGuidance) {
    parts.push('')  // Empty line for separation
    parts.push('=== LOGO SAFE ZONES (DO NOT PLACE CONTENT HERE) ===')
    parts.push(brief.logoSafeZoneGuidance)
    parts.push('')
    parts.push('IMPORTANT: Logos will be digitally overlaid AFTER image generation.')
    parts.push('Your job is to create a design where these areas have clean, simple backgrounds.')
    parts.push('Do NOT place headlines, key text, or important visuals in logo zones.')
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
 *
 * @param prompt - The prompt to send
 * @param temperature - Dynamic temperature (default: 1.3 for creative formats)
 * @param topP - Top-P sampling parameter (default: 0.95)
 */
async function callGemini(
  prompt: string,
  temperature: number = 1.3,
  topP: number = 0.95
): Promise<LLMResponse> {
  // Support both GEMINI_API_KEY (primary) and GOOGLE_AI_API_KEY (fallback)
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY
  const modelName = 'gemini-2.0-flash-exp'

  console.log('[Design Intelligence] API Key Check:', apiKey ? `Present (***${apiKey.slice(-4)})` : 'MISSING!')

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY or GOOGLE_AI_API_KEY is not configured')
  }

  const genAI = new GoogleGenerativeAI(apiKey)

  // Use Gemini 2.0 Flash for fast, cost-effective analysis
  // Temperature is now dynamic based on format type
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature, // Dynamic temperature for format-appropriate creativity
      topP, // Dynamic top-P for word choice variation
      maxOutputTokens: 1024, // Enough for structured response
    }
  })

  console.log('[Design Intelligence] Calling Gemini 2.0 Flash...')
  const startTime = Date.now()

  const result = await model.generateContent(prompt)
  const response = result.response

  const durationMs = Date.now() - startTime
  const text = response.text()

  // Extract token usage from response metadata
  const usageMetadata = response.usageMetadata
  const tokenUsage: TokenUsage = {
    inputTokens: usageMetadata?.promptTokenCount || Math.ceil(prompt.length / 4),
    outputTokens: usageMetadata?.candidatesTokenCount || Math.ceil(text.length / 4),
    cachedTokens: usageMetadata?.cachedContentTokenCount || 0,
    totalTokens: usageMetadata?.totalTokenCount || Math.ceil((prompt.length + text.length) / 4),
  }

  console.log(`[Design Intelligence] Response received in ${durationMs}ms`)
  console.log('[Design Intelligence] Response length:', text.length, 'chars')
  console.log('[Design Intelligence] Token usage:', JSON.stringify(tokenUsage))

  return {
    text,
    tokenUsage,
    model: modelName,
    durationMs,
  }
}

/**
 * Call Claude for design intelligence
 * Using Claude Haiku 4.5 - fast, cost-effective, and excellent reasoning
 *
 * OPTIMIZATION: Uses prompt caching for system prompt to reduce costs
 *
 * @param prompt - The prompt to send
 * @param temperature - Dynamic temperature (default: 1.0)
 */
async function callClaude(
  prompt: string,
  temperature: number = 1.0
): Promise<LLMResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  const modelName = 'claude-haiku-4-5-20251001'

  console.log('[Design Intelligence] API Key Check:', apiKey ? `Present (***${apiKey.slice(-4)})` : 'MISSING!')

  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured')
  }

  const client = new Anthropic({ apiKey })

  console.log('[Design Intelligence] Calling Claude Haiku 4.5 (temp:', temperature, ')...')
  const startTime = Date.now()

  // Extract system prompt and user content for caching
  // The system prompt (DESIGN_INTELLIGENCE_PROMPT) is cacheable
  const systemPromptEnd = prompt.indexOf('=== OUTPUT FORMAT')
  const systemPrompt = systemPromptEnd > 0 ? prompt.substring(0, systemPromptEnd) : ''
  const userContent = systemPromptEnd > 0 ? prompt.substring(systemPromptEnd) : prompt

  // Use prompt caching for system prompt if it's substantial
  const usePromptCaching = systemPrompt.length > 1000

  const response = await client.messages.create({
    model: modelName,
    max_tokens: 4096,  // v3.6: Increased from 2048 - complex design contexts need 8000+ chars
    // Apply prompt caching to system prompt for cost reduction
    ...(usePromptCaching ? {
      system: [
        {
          type: 'text' as const,
          text: systemPrompt,
          cache_control: { type: 'ephemeral' as const },
        },
      ],
      messages: [
        {
          role: 'user' as const,
          content: userContent,
        },
      ],
    } : {
      messages: [
        {
          role: 'user' as const,
          content: prompt,
        },
      ],
    }),
  })

  const durationMs = Date.now() - startTime
  console.log(`[Design Intelligence] Response received in ${durationMs}ms`)

  // Extract text from response
  const textBlock = response.content.find(block => block.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from Claude')
  }

  const text = textBlock.text

  // Extract token usage from Claude's response
  const tokenUsage: TokenUsage = {
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    cachedTokens: 0, // Claude doesn't report cached tokens the same way
    totalTokens: response.usage.input_tokens + response.usage.output_tokens,
  }

  console.log('[Design Intelligence] Response length:', text.length, 'chars')
  console.log('[Design Intelligence] Token usage:', JSON.stringify(tokenUsage))

  return {
    text,
    tokenUsage,
    model: modelName,
    durationMs,
  }
}

/**
 * Call OpenAI for design intelligence
 * @placeholder - To be implemented when needed
 */
async function callOpenAI(prompt: string): Promise<LLMResponse> {
  // Future implementation for OpenAI API
  // Would use openai package with gpt-4o-mini for cost efficiency
  throw new Error('OpenAI provider not yet implemented. Use gemini or claude for now.')
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
    corePurpose: 'Create an attention-grabbing promotional flyer with contextual decorative elements that reinforce the event message and visual appeal',
    visualElements: [
      'bold headline area with event-appropriate styling',
      'contextual decorative elements based on event type (e.g., medical icons for health events, tech patterns for workshops)',
      'clear information hierarchy with date/venue/CTA',
      'prominent call-to-action button or banner',
      'subtle corner and edge decorations that enhance without overwhelming',
    ],
    backgroundSetting: 'Eye-catching gradient background with event-appropriate decorative elements - medical gradients with health symbols for health events, warm orange with hands-on icons for workshops, corporate blue with networking elements for conferences, festive colors with celebration motifs for festivals',
    iconicImagery: ['event-specific symbols in corners', 'thematic visual elements that reinforce the message', 'subtle decorative patterns along edges'],
    colorMood: 'Vibrant, attention-grabbing colors appropriate to the event type - medical colors for health events, warm energetic colors for workshops, corporate palette for business, festive for celebrations - all CMYK print-safe',
    designStrategy: 'Clear hierarchy with headline dominating, contextual decorative elements SUBTLY enhancing mood in corners and edges without overwhelming, details organized for 5-second scanning, prominent CTA',
    desiredAction: 'Read details quickly and take action (attend, sign up, contact, register)',
    emotionalJob: 'Interested, informed about the event context through visual cues, and motivated to act',
    successMetric: 'Viewer immediately understands the event type through contextual visual elements, gets key information in 5 seconds, and knows exactly what action to take',
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
 * Returns DesignContextResult with zero usage for fallback cases
 */
export async function generateDesignContextSafe(
  brief: DesignBrief,
  provider: LLMProvider = 'claude'
): Promise<DesignContextResult> {
  try {
    return await generateDesignContext(brief, provider)
  } catch (error) {
    console.error('[Design Intelligence] === ERROR - USING FALLBACK ===')
    console.error('[Design Intelligence] Error:', error instanceof Error ? error.message : error)
    console.warn('[Design Intelligence] WARNING: AI context generation failed, using generic fallback!')
    console.warn('[Design Intelligence] This will result in less contextual designs.')

    // Return fallback with zero usage
    return {
      context: generateFallbackContext(brief),
      usage: {
        provider: provider === 'gemini' ? 'gemini' : 'claude',
        model: 'fallback',
        tokenUsage: {
          inputTokens: 0,
          outputTokens: 0,
          cachedTokens: 0,
          totalTokens: 0,
        },
        durationMs: 0,
      },
    }
  }
}
