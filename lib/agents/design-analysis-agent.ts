/**
 * Claude Agent-Powered Design Analysis
 *
 * When user enables AI toggle with "AI Auto" theme, this agent:
 * 1. Analyzes event details (title, description, venue)
 * 2. Respects mandatory constraints (brand colors, vertical presets, logo positions)
 * 3. Generates contextual background and decorative element recommendations
 *
 * PRIORITY HIERARCHY:
 * 1. MANDATORY: Logo positions, safe zones, format dimensions (CANNOT override)
 * 2. HIGH PRIORITY: Organization brand colors, vertical preset colors (override agent if set)
 * 3. AGENT CREATIVE: Background, decoratives, mood, style (when no override)
 */

import Anthropic from '@anthropic-ai/sdk'
import type { VerticalPreset } from '@/types/database.types'
import type { BrandContextPrompt, LogoAwarenessContext } from '@/lib/prompts/services/yi-prompt-builder/types'

// ============================================================
// TYPES
// ============================================================

/**
 * User-selected custom colors from the Color tab
 */
export interface UserColorSelection {
  /** Whether user has selected custom colors */
  hasCustomColors: boolean
  /** Primary color hex */
  primary?: string
  /** Secondary color hex */
  secondary?: string
  /** Accent color hex */
  accent?: string
  /** Palette name if using a preset */
  paletteName?: string
}

export interface DesignConstraints {
  /** Vertical preset with predefined colors/mood (from vertical_presets table) */
  verticalPreset?: VerticalPreset | null
  /** Organization brand colors */
  brandContext?: BrandContextPrompt | null
  /** User-selected custom colors from Color tab */
  userColors?: UserColorSelection | null
  /** Logo positions and safe zones */
  logoAwareness?: LogoAwarenessContext | null
  /** Format dimensions */
  formatDimensions?: { width: number; height: number }
  /** Format name for context */
  formatName?: string
}

export interface EventAnalysisInput {
  /** Event/content title */
  title: string
  /** Event description or additional details */
  description?: string
  /** Venue information */
  venue?: string
  /** Any additional context */
  additionalContext?: string
}

export interface AgentDesignRecommendation {
  /** AI-generated background description */
  background: string
  /** Contextual decorative elements */
  decorativeElements: string[]
  /** Design mood (e.g., "professional-innovative", "warm-community") */
  mood: string
  /** Visual style approach */
  style: string
  /** Color palette (only if no constraints override) */
  colorPalette?: {
    primary: { hex: string; name: string; reasoning: string }
    secondary: { hex: string; name: string; reasoning: string }
    accent: { hex: string; name: string; reasoning: string }
  }
  /** Agent's reasoning for recommendations */
  rationale: string
  /** Detected event type */
  detectedEventType: string
  /** Secondary context (tech, business, healthcare, creative) */
  secondaryContext?: string
}

export interface AgentAnalysisResult {
  recommendation: AgentDesignRecommendation
  usage: {
    inputTokens: number
    outputTokens: number
    model: string
    durationMs: number
  }
  /** Whether constraints were applied */
  constraintsApplied: {
    verticalColors: boolean
    brandColors: boolean
    userColors: boolean
    logoSafeZones: boolean
  }
}

// ============================================================
// AGENT SYSTEM PROMPT
// ============================================================

function buildAgentSystemPrompt(constraints: DesignConstraints): string {
  const parts: string[] = []

  parts.push(`You are Yi CreativeStudio's intelligent design specialist powered by Claude.

Your role is to analyze event details and generate contextually appropriate design recommendations for marketing creatives (posters, flyers, social media).

You think deeply about:
- What the event is really about (workshop = hands-on learning, health camp = community care, conference = knowledge sharing)
- What visual elements naturally BELONG in this context
- What emotional response the design should evoke
- What colors, patterns, and decorations reinforce the message`)

  // MANDATORY CONSTRAINTS (cannot override)
  parts.push(`

=== MANDATORY CONSTRAINTS (You CANNOT Override) ===`)

  if (constraints.logoAwareness?.hasLogo) {
    parts.push(`
LOGO SAFE ZONES:
- Logos will be overlaid AFTER image generation
- Keep these areas clean with simple backgrounds:
${constraints.logoAwareness.logos?.map(l => `  - ${l.position}: ${l.size} logo`).join('\n') || '  - See layout guidance'}
- DO NOT place headlines, decoratives, or important visuals in logo zones`)
  }

  if (constraints.formatDimensions) {
    parts.push(`
FORMAT: ${constraints.formatName || 'Creative'}
- Dimensions: ${constraints.formatDimensions.width}x${constraints.formatDimensions.height}px
- Design must fill the entire canvas edge-to-edge`)
  }

  // HIGH PRIORITY CONSTRAINTS (override agent colors if set)
  if (constraints.verticalPreset?.theme_config) {
    const config = constraints.verticalPreset.theme_config as {
      primaryColor?: string
      secondaryColor?: string
      mood?: string
      style?: string
    }
    parts.push(`

=== VERTICAL PRESET CONSTRAINTS (High Priority) ===
Vertical: ${constraints.verticalPreset.name}
${config.primaryColor ? `- Primary Color MUST be: ${config.primaryColor}` : ''}
${config.secondaryColor ? `- Secondary Color MUST be: ${config.secondaryColor}` : ''}
${config.mood ? `- Mood: ${config.mood}` : ''}
${config.style ? `- Style: ${config.style}` : ''}

IMPORTANT: Do NOT suggest different primary/secondary colors. Only suggest complementary accent colors.`)
  }

  if (constraints.brandContext?.useBrandColors && constraints.brandContext.primaryColor) {
    parts.push(`

=== ORGANIZATION BRAND CONSTRAINTS (High Priority) ===
Organization: ${constraints.brandContext.organizationName}
${constraints.brandContext.primaryColor ? `- Primary Color MUST be: ${constraints.brandContext.primaryColor}` : ''}
${constraints.brandContext.secondaryColor ? `- Secondary Color MUST be: ${constraints.brandContext.secondaryColor}` : ''}
${constraints.brandContext.accentColor ? `- Accent Color: ${constraints.brandContext.accentColor}` : ''}

IMPORTANT: Honor brand colors. Your creativity is in background style and decorative elements.`)
  }

  // User-selected custom colors (from Color tab)
  if (constraints.userColors?.hasCustomColors && constraints.userColors.primary) {
    parts.push(`

=== USER COLOR SELECTION (High Priority) ===
User has selected specific colors for this design:
${constraints.userColors.paletteName ? `- Palette: ${constraints.userColors.paletteName}` : '- Custom Colors Selected'}
${constraints.userColors.primary ? `- Primary Color MUST be: ${constraints.userColors.primary}` : ''}
${constraints.userColors.secondary ? `- Secondary Color MUST be: ${constraints.userColors.secondary}` : ''}
${constraints.userColors.accent ? `- Accent Color: ${constraints.userColors.accent}` : ''}

IMPORTANT: User has explicitly chosen these colors. You MUST use them. Your creativity is in:
- Background gradients and textures using these colors
- Decorative elements that complement these colors
- Layout and composition that showcases these colors effectively`)
  }

  // Agent creative freedom section
  parts.push(`

=== YOUR CREATIVE FREEDOM ===
When NO color constraints are set, you can suggest colors.
Always be creative with:
- Background composition, gradients, and textures
- Decorative elements and visual motifs (event-appropriate)
- Mood and emotional tone
- Layout composition (within reserved zones)
- Additional complementary accent colors`)

  // Output format
  parts.push(`

=== OUTPUT FORMAT ===
Return ONLY valid JSON (no markdown, no explanation):
{
  "background": "Detailed background description with colors, gradients, textures",
  "decorativeElements": ["element 1", "element 2", "element 3", "element 4"],
  "mood": "two-word mood description (e.g., professional-innovative)",
  "style": "visual style approach",
  "colorPalette": {
    "primary": { "hex": "#...", "name": "Color Name", "reasoning": "Why this color" },
    "secondary": { "hex": "#...", "name": "Color Name", "reasoning": "..." },
    "accent": { "hex": "#...", "name": "Color Name", "reasoning": "..." }
  },
  "rationale": "Your reasoning for these recommendations in 2-3 sentences",
  "detectedEventType": "workshop|conference|health_camp|seminar|etc",
  "secondaryContext": "tech|business|healthcare|creative|community|null"
}

CRITICAL: If vertical/brand colors are constrained, set colorPalette to null and work within those colors.`)

  return parts.join('')
}

// ============================================================
// AGENT ANALYSIS
// ============================================================

/**
 * Analyze event details using Claude and generate design recommendations
 * Respects the priority hierarchy of constraints
 */
export async function analyzeEventWithAgent(
  input: EventAnalysisInput,
  constraints: DesignConstraints
): Promise<AgentAnalysisResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured')
  }

  const client = new Anthropic({ apiKey })
  const modelName = 'claude-haiku-4-5-20251001' // Fast, cost-effective for analysis

  // Build the system prompt with constraints
  const systemPrompt = buildAgentSystemPrompt(constraints)

  // Build the user message
  const userMessage = buildUserMessage(input)

  console.log('[Design Agent] === ANALYZING EVENT ===')
  console.log('[Design Agent] Title:', input.title)
  console.log('[Design Agent] Has Vertical Preset:', !!constraints.verticalPreset)
  console.log('[Design Agent] Has Brand Colors:', !!constraints.brandContext?.useBrandColors)

  const startTime = Date.now()

  const response = await client.messages.create({
    model: modelName,
    max_tokens: 1024,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: userMessage
      }
    ]
  })

  const durationMs = Date.now() - startTime

  // Extract text from response
  const textBlock = response.content.find(block => block.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from Claude agent')
  }

  // Parse the JSON response
  const recommendation = parseAgentResponse(textBlock.text, constraints)

  console.log('[Design Agent] === ANALYSIS COMPLETE ===')
  console.log('[Design Agent] Detected Event Type:', recommendation.detectedEventType)
  console.log('[Design Agent] Secondary Context:', recommendation.secondaryContext || 'none')
  console.log('[Design Agent] Mood:', recommendation.mood)
  console.log('[Design Agent] Duration:', durationMs, 'ms')

  return {
    recommendation,
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      model: modelName,
      durationMs
    },
    constraintsApplied: {
      verticalColors: !!constraints.verticalPreset?.theme_config,
      brandColors: !!constraints.brandContext?.useBrandColors,
      userColors: !!constraints.userColors?.hasCustomColors,
      logoSafeZones: !!constraints.logoAwareness?.hasLogo
    }
  }
}

/**
 * Build the user message for event analysis
 */
function buildUserMessage(input: EventAnalysisInput): string {
  const parts: string[] = []

  parts.push(`Analyze this event and generate design recommendations:

TITLE: ${input.title}`)

  if (input.description) {
    parts.push(`DESCRIPTION: ${input.description}`)
  }

  if (input.venue) {
    parts.push(`VENUE: ${input.venue}`)
  }

  if (input.additionalContext) {
    parts.push(`ADDITIONAL CONTEXT: ${input.additionalContext}`)
  }

  parts.push(`
Think deeply about:
1. What type of event is this? (workshop, conference, health camp, seminar, cultural, sports, etc.)
2. What secondary context applies? (tech, business, healthcare, creative, community)
3. What visual elements BELONG in this context?
4. What background style reinforces the message?
5. What decorative elements add visual interest without overwhelming?

Generate contextually rich design recommendations.`)

  return parts.join('\n')
}

/**
 * Parse agent response and apply constraint overrides
 */
function parseAgentResponse(
  responseText: string,
  constraints: DesignConstraints
): AgentDesignRecommendation {
  // Extract JSON from response
  let jsonStr = responseText.trim()

  // Remove markdown code blocks if present
  if (jsonStr.startsWith('```json')) {
    jsonStr = jsonStr.slice(7)
  } else if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.slice(3)
  }
  if (jsonStr.endsWith('```')) {
    jsonStr = jsonStr.slice(0, -3)
  }
  jsonStr = jsonStr.trim()

  // Extract JSON object
  const jsonMatch = jsonStr.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('Failed to extract JSON from agent response')
  }

  const parsed = JSON.parse(jsonMatch[0])

  // Apply constraint overrides
  const recommendation: AgentDesignRecommendation = {
    background: parsed.background || 'Professional gradient background',
    decorativeElements: Array.isArray(parsed.decorativeElements)
      ? parsed.decorativeElements
      : [],
    mood: parsed.mood || 'professional-engaging',
    style: parsed.style || 'modern',
    rationale: parsed.rationale || 'AI-generated recommendation',
    detectedEventType: parsed.detectedEventType || 'event',
    secondaryContext: parsed.secondaryContext || undefined
  }

  // Only include colorPalette if NO constraints override colors
  const hasColorConstraints =
    constraints.verticalPreset?.theme_config ||
    (constraints.brandContext?.useBrandColors && constraints.brandContext.primaryColor) ||
    (constraints.userColors?.hasCustomColors && constraints.userColors.primary)

  if (!hasColorConstraints && parsed.colorPalette) {
    recommendation.colorPalette = parsed.colorPalette
  }

  return recommendation
}

// ============================================================
// FALLBACK (when agent fails)
// ============================================================

/**
 * Generate fallback recommendation when agent fails
 * Uses simple keyword matching for basic event type detection
 */
export function generateFallbackRecommendation(
  input: EventAnalysisInput
): AgentDesignRecommendation {
  const title = input.title.toLowerCase()
  const description = (input.description || '').toLowerCase()
  const combined = `${title} ${description}`

  // Simple event type detection
  let detectedEventType = 'event'
  let secondaryContext: string | undefined
  let mood = 'professional-engaging'
  let background = 'Professional gradient background with subtle patterns'
  let decorativeElements: string[] = []

  // Workshop detection
  if (combined.includes('workshop')) {
    detectedEventType = 'workshop'
    mood = 'energetic-collaborative'
    background = 'Warm orange-coral gradient suggesting hands-on learning and energy'
    decorativeElements = [
      'Abstract hands-on activity icons',
      'Collaborative group silhouettes',
      'Learning pathway symbols',
      'Interactive element shapes'
    ]

    // Tech workshop
    if (combined.includes('ai') || combined.includes('tech') || combined.includes('digital')) {
      secondaryContext = 'tech'
      decorativeElements.push('Circuit board patterns')
      decorativeElements.push('Digital network nodes')
    }
  }

  // Health/Medical detection
  else if (
    combined.includes('health') ||
    combined.includes('medical') ||
    combined.includes('blood') ||
    combined.includes('donation')
  ) {
    detectedEventType = 'health_camp'
    secondaryContext = 'healthcare'
    mood = 'compassionate-caring'
    background = 'Clean medical gradient from soft blue to white with healing atmosphere'
    decorativeElements = [
      'Medical cross symbols',
      'Heart health icons',
      'Caring hands imagery',
      'Life-saving visual elements'
    ]
  }

  // Conference detection
  else if (combined.includes('conference') || combined.includes('summit')) {
    detectedEventType = 'conference'
    mood = 'professional-prestigious'
    background = 'Deep blue to navy gradient with stage lighting effects'
    decorativeElements = [
      'Podium and microphone silhouette',
      'Audience gathering shapes',
      'Keynote speaker elements',
      'Professional networking icons'
    ]
  }

  // Seminar detection
  else if (combined.includes('seminar') || combined.includes('lecture')) {
    detectedEventType = 'seminar'
    mood = 'academic-enlightening'
    background = 'Scholarly gradient with subtle book/knowledge patterns'
    decorativeElements = [
      'Open book imagery',
      'Knowledge sharing symbols',
      'Academic achievement icons',
      'Wisdom and learning elements'
    ]
  }

  return {
    background,
    decorativeElements,
    mood,
    style: 'modern-professional',
    rationale: `Fallback recommendation based on detected event type: ${detectedEventType}`,
    detectedEventType,
    secondaryContext
  }
}

/**
 * Safe wrapper that returns fallback on error
 */
export async function analyzeEventWithAgentSafe(
  input: EventAnalysisInput,
  constraints: DesignConstraints
): Promise<AgentAnalysisResult> {
  try {
    return await analyzeEventWithAgent(input, constraints)
  } catch (error) {
    console.error('[Design Agent] Error:', error instanceof Error ? error.message : error)
    console.warn('[Design Agent] Using fallback recommendation')

    return {
      recommendation: generateFallbackRecommendation(input),
      usage: {
        inputTokens: 0,
        outputTokens: 0,
        model: 'fallback',
        durationMs: 0
      },
      constraintsApplied: {
        verticalColors: !!constraints.verticalPreset?.theme_config,
        brandColors: !!constraints.brandContext?.useBrandColors,
        userColors: !!constraints.userColors?.hasCustomColors,
        logoSafeZones: !!constraints.logoAwareness?.hasLogo
      }
    }
  }
}
