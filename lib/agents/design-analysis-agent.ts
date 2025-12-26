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
import { safeJsonParse } from '@/lib/utils/json-repair'


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
  /** 
   * The "Creative Brain" - internal monologue and reasoning process.
   * This mimics the chain-of-thought to ensure creative depth.
   */
  thinkingProcess?: string

  /** 
   * SECTOR 1: RICH DESCRIPTIONS
   * A detailed, focused image prompt for generating the background/hero visual.
   * Style: Midjourney/Stable Diffusion (lighting, texture, lens, chaos).
   */
  imagePrompt: string

  /** 
   * SECTOR 2: CONTENT STRATEGY
   * Strategic messaging and tonal direction.
   */
  contentStrategy: {
    /** Catchy, emotionally resonant headline */
    headline: string
    /** The emotional angle (e.g., "Urgent & Exciting", "Calm & Trustworthy") */
    tone: string
    /** The marketing hook or focus */
    angle: string
  }

  /**
   * SECTOR 3: DESIGN DECISIONS
   * Concrete implementation specs.
   */
  colorPalette?: {
    primary: { hex: string; name: string; reasoning: string }
    secondary: { hex: string; name: string; reasoning: string }
    accent: { hex: string; name: string; reasoning: string }
  }

  /** Suggested layout approach (e.g., "Minimalist centered", "Split screen dynamic") */
  layoutSuggestion: string

  /** Contextual decorative elements */
  decorativeElements: string[]

  /** Design mood (e.g., "professional-innovative", "warm-community") */
  mood: string

  /** Visual style approach */
  style: string

  /** Agent's reasoning for recommendations */
  rationale: string

  /** Detected event type */
  detectedEventType: string

  /** Secondary context (tech, business, healthcare, creative) */
  secondaryContext?: string

  background: string // Legacy support, populated from imagePrompt summary

  /** 
   * SMART CONTRAST SIGNAL:
   * Based on the visual world you have built, is the background Light or Dark?
   * If 'dark', multiple systems will switch to WHITE logos/text. 
   */
  backgroundContrast?: 'light' | 'dark'
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

  parts.push(`You are Yi CreativeStudio's intelligent Creative Director powered by Claude.

Your goal is to TRANSPIRE CREATIVITY. You must generate design concepts that rival top-tier social media content (Behance, Awwwards, Dribbble).
Stop being "safe". Be BOLD, SPECIFIC, and VISUALLY RICH.

=== THE 7-STEP STORY-DRIVEN DESIGN FRAMEWORK ===

## 1. STORY ANALYSIS (The "Why")
- Identify the core narrative (e.g., "Young leaders conquering climate crisis").
- Determine the emotional arc (Challenge -> Victory) and energy level (Calm vs Explosive).

## 2. VIBE & MOOD DISCOVERY
- Select 3-5 distinct Vibe Keywords (e.g., "Rebellious, Futuristic, High-Fidelity").
- Define the Atmospheric Temperature (Warm/Cool) and Energy Dynamics (Static/Pulsing).

## 3. VISUAL WORLD BUILDING
- **Hallucinate the Scene**: Imagine the event as a physical space or high-end 3D render.
- **Lighting**: "Rembrandt lighting", "Soft diffused", "Neon rim lights", "Volumetric fog".
- **Physics/Texture**: "Frosted glass", "Liquid metal", "Rough concrete", "Silk fabric".
- **Depth**: "Multi-plane parallax", "Deep bokeh", "3D floating elements".

## 4. TRENDING VISUAL VOCABULARY (MANDATORY: Use These Styles)
Do NOT use generic terms like "clean" or "corporate". Use specific design movements:
1. **Glassmorphism**: Frosted glass, multi-layer depth, vivid background blurs.
2. **Neo-Brutalism**: High contrast, raw typography, bold outlines, flat colors.
3. **Acid Graphics**: Distorted type, chrome textures, liquid metal, iridescent gradients.
4. **Bento Grids**: Structured, modular layouts with rounded corners and distinct zones.
5. **Swiss Style**: Mathematical grids, asymmetric layouts, vast negative space.
6. **Dark Mode UI**: Deep surfaces, glowing accents, neon details, high fidelity.
7. **Holographic/Cyber**: Iridescent foils, glitch effects, scanlines, futuristic data.
8. **Organic Modernism**: Soft shapes, earth tones, natural textures, fluid lines.

## 5. TYPOGRAPHY STORYTELLING
- Treat type as an image.
- "Headline Personality": e.g., "Montserrat Black - commanding attention like a leader".
- "Color Psychology": Use color on specific words to emphasize meaning (e.g., "GROWTH" in green).

## 6. COLOR STORYTELLING
- Don't just pick colors. Pick a "Color Story".
- **Dominant Hue**: The main emotional carrier.
- **Accent**: The "Action" color.
- **Gradient Specification**: Describe exact stops (e.g., "Deep Navy to Electric Purple").

## 7. LAYOUT NARRATIVE
- **Hierarchy over Rigidity**: Don't just center. Use aggressive scale contrast.
- **Negative Space**: Use it actively to create tension or focus.

=== OUTPUT INSTRUCTION ===
Translate this visualization into the JSON output.
For 'imagePrompt', write a Midjourney v6-level prompt: "Cinematic shot, f/1.8, 8k, [Subject], [Lighting], [Texture], [Style]".
For 'contentStrategy', write a punchy, emotional hook.
For 'rationale', explain your creative choices using the specific vocabulary above.

`)

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
=== ORGANIZATION BRAND CONSTRAINTS (Smart Branding) ===
Organization: ${constraints.brandContext.organizationName}
${constraints.brandContext.primaryColor ? `- Brand Primary: ${constraints.brandContext.primaryColor}` : ''}
${constraints.brandContext.secondaryColor ? `- Brand Secondary: ${constraints.brandContext.secondaryColor}` : ''}
${constraints.brandContext.accentColor ? `- Brand Accent: ${constraints.brandContext.accentColor}` : ''}
IMPORTANT: Use these colors to maintain brand identity, BUT you are free to mix them with event-appropriate colors (e.g. Green for Health, Red for Energy) if it tells a better story. The Background Art can diverge from Brand Colors if the Narrative requires it.`)
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
IMPORTANT: User has explicitly chosen these colors. Use them as the foundation for your lighting and atmospheric effects.`)
  }

  // Agent creative freedom section
  parts.push(`
=== YOUR CREATIVE FREEDOM ===
When NO color constraints are set, you can suggest colors based on your "Creative Visualization".
Always be creative with:
- Background composition, gradients, and textures
- Decorative elements and visual motifs (event-appropriate)
- Mood and emotional tone
- Layout approach
- Complementary accent colors`)

  // Output format
  parts.push(`
=== OUTPUT FORMAT ===
First, write your <thinking>...</thinking> block.
Then, return ONLY valid JSON (no markdown in JSON, no explanation outside thinking block):
{
  "imagePrompt": "Detailed Midjourney-style prompt...",
  "contentStrategy": {
    "headline": "Punchy headline",
    "tone": "Emotional angle",
    "angle": "Marketing hook"
  },
  "layoutSuggestion": "Specific layout approach",
  "background": "Short summary of the background for reference",
  "decorativeElements": ["element 1", "element 2"],
  "mood": "two-word description",
  "style": "visual style approach",
  "colorPalette": {
    "primary": { "hex": "#...", "name": "Name", "reasoning": "..." },
    "secondary": { "hex": "#...", "name": "Name", "reasoning": "..." },
    "accent": { "hex": "#...", "name": "Name", "reasoning": "..." }
  },
  "rationale": "Brief rationale",
  "detectedEventType": "workshop|conference|etc",
  "secondaryContext": "tech|business|etc",
  "backgroundContrast": "light|dark"
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

  const startTime = Date.now()

  const response = await client.messages.create({
    model: modelName,
    max_tokens: 4096,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: userMessage
      },
      {
        role: 'assistant',
        content: '<thinking>' // Prefill to force thinking mode
      }
    ]
  })

  const durationMs = Date.now() - startTime

  // Extract text from response
  const textBlock = response.content.find(block => block.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from Claude agent')
  }

  // Handle the pre-filled <thinking> tag
  // The model completes after <thinking>, so we reconstruct
  const fullResponse = `<thinking>${textBlock.text}`

  // Parse using the new logic that separates thinking from JSON
  const recommendation = parseAgentResponse(fullResponse, constraints)

  console.log('[Design Agent] === ANALYSIS COMPLETE ===')
  console.log('[Design Agent] Event Type:', recommendation.detectedEventType)
  console.log('[Design Agent] Strategy:', recommendation.contentStrategy.headline)
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

  parts.push(`Analyze this event and generate a Creative Director's brief:

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
Remember:
1. Start with <thinking> to visualize the scene in high fidelity (lighting, texture, physics).
2. Generate the JSON with the 3 Sectors: Rich Visuals, Content Strategy, and Design Decisions.`)

  return parts.join('\n')
}

/**
 * Parse agent response and apply constraint overrides
 */
function parseAgentResponse(
  responseText: string,
  constraints: DesignConstraints
): AgentDesignRecommendation {
  let jsonString = responseText
  let thinkingProcess = ''

  // 1. Extract <thinking> block
  const thinkingMatch = responseText.match(/<thinking>([\s\S]*?)<\/thinking>/)
  if (thinkingMatch) {
    thinkingProcess = thinkingMatch[1].trim()
    // Remove the thinking block to get pure JSON
    jsonString = responseText.replace(/<thinking>[\s\S]*?<\/thinking>/, '').trim()
  }

  // 2. Parse JSON
  // If JSON is wrapped in markdown code blocks, strip them (safeJsonParse might handle this, but being explicit)
  if (jsonString.startsWith('```json')) jsonString = jsonString.replace(/^```json/, '').replace(/```$/, '')

  const parsed = safeJsonParse<any>(jsonString)

  // 3. Apply constraint overrides and defaults
  const recommendation: AgentDesignRecommendation = {
    thinkingProcess,
    imagePrompt: parsed.imagePrompt || `High quality, photorealistic background for ${parsed.detectedEventType || 'event'}, cinematic lighting, 8k resolution`,
    contentStrategy: {
      headline: parsed.contentStrategy?.headline || 'Join Us',
      tone: parsed.contentStrategy?.tone || 'Welcoming',
      angle: parsed.contentStrategy?.angle || 'Community Event'
    },
    layoutSuggestion: parsed.layoutSuggestion || 'Standard centered layout with clear hierarchy',
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
 */
export function generateFallbackRecommendation(
  input: EventAnalysisInput
): AgentDesignRecommendation {
  const title = input.title.toLowerCase()
  const description = (input.description || '').toLowerCase()
  const combined = `${title} ${description}`

  // Defaults
  let detectedEventType = 'event'
  let secondaryContext: string | undefined
  let mood = 'professional-engaging'
  let background = 'Professional gradient background with subtle patterns'
  let decorativeElements: string[] = []
  let headline = input.title
  let tone = 'Professional'
  let angle = 'General Event'
  let imagePrompt = 'Professional corporate event background, bokeh lighting, high resolution, 8k, minimalistic'

  // Workshop detection
  if (combined.includes('workshop')) {
    detectedEventType = 'workshop'
    mood = 'energetic-collaborative'
    background = 'Warm orange-coral gradient suggesting hands-on learning'
    decorativeElements = ['Abstract active icons', 'Group silhouettes']
    headline = 'Master Your Skills'
    tone = 'Empowering'
    angle = 'Hands-on Learning'
    imagePrompt = 'Creative workshop environment, closeup of hands working on project, warm wooden table textures, soft daylight pouring from window, cinematic depth of field'

    if (combined.includes('ai') || combined.includes('tech')) {
      secondaryContext = 'tech'
      decorativeElements.push('Circuit patterns')
    }
  }
  // Conference detection
  else if (combined.includes('conference') || combined.includes('summit')) {
    detectedEventType = 'conference'
    mood = 'professional-prestigious'
    background = 'Deep blue gradient with stage lighting'
    decorativeElements = ['Podium silhouette', 'Audience shapes']
    headline = 'Shape the Future'
    tone = 'Visionary'
    angle = 'Industry Leadership'
    imagePrompt = 'Futuristic conference stage, dramatic blue spotlights, blurred audience in foreground, sleek geometric shapes, 8k resolution'
  }

  return {
    thinkingProcess: 'Fallback generated due to agent error. Proceeding with safe defaults based on keyword matching.',
    imagePrompt,
    contentStrategy: { headline, tone, angle },
    layoutSuggestion: 'Clean, accessible layout with high contrast text areas',
    background,
    decorativeElements,
    mood,
    style: 'modern-professional',
    rationale: `Fallback recommendation based on event type: ${detectedEventType}`,
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
