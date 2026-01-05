/**
 * Ultra-Pro Prompt Generator Service
 *
 * Uses Claude AI to transform user form data into an optimized image generation prompt.
 * This ensures user's exact values are prioritized and correctly rendered in the final image.
 */

import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'
import type { CompiledFormData } from './form-data-compiler'
import { buildTextBriefFromCompiled } from './form-data-compiler'
import { safeJsonParse } from '@/lib/utils/json-repair'

// Import prompt optimization utilities
import {
  getTemperatureConfig,
  generateUltraProCacheKey,
  getCachedUltraProPrompt,
  setCachedUltraProPrompt,
  validateAndFixUltraProPrompt,
} from './prompt-optimization'

// ============================================================
// TYPES
// ============================================================

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

export interface UltraProPrompt {
  /** The main headline text that MUST appear prominently in the image */
  primaryText: string
  /** Secondary text elements that should appear in the image */
  secondaryText: string[]
  /** Description of the visual scene/background for the image */
  visualScene: string
  /** Creative direction for layout and visual treatment */
  designGuidance: string
  /** Where text should be positioned in the image */
  textPlacementHints: string
  /** Color suggestions based on event type */
  colorPaletteHints: string
  /** Visual elements that must appear in the image */
  mustIncludeElements: string[]
  /** The complete enhanced prompt for image generation */
  enhancedPrompt: string
}

/**
 * Result from ultra-pro prompt generation including usage tracking
 */
export interface UltraProPromptResult {
  prompt: UltraProPrompt
  usage: {
    provider: 'gemini' | 'claude'
    model: string
    tokenUsage: TokenUsage
    durationMs: number
  }
}

// ============================================================
// PROMPT TEMPLATE
// ============================================================

const ULTRA_PRO_PROMPT_SYSTEM = `You are an expert at creating image generation prompts for professional creative designs.
Your job is to transform user-provided event/creative details into a powerful, precise prompt that will generate stunning visuals.

v5.0 ENHANCEMENT: DESIGN INTELLIGENCE INTEGRATION
When Design Intelligence context is provided, you MUST:
1. PRESERVE all story-driven insights (narrative, emotional arc, visual elements, decorative elements)
2. ENRICH with Gemini 2.5 best practices (narrative prose, not keyword lists)
3. CONVERT design context into vivid scene descriptions
4. USE event-specific visual metaphors from Design Intelligence
5. MAINTAIN multi-color typography strategy and decorative element placements
6. ENFORCE sophistication level with specific visual cues

DESIGN SOPHISTICATION RULES (CRITICAL):
The user can specify a "sophistication" level which MUST dictate your visual strategy:

1. MINIMALIST MODE (Default for Professional/Tech/Climate):
   - Focus on HIGH-IMPACT MINIMALISM and VAST NEGATIVE SPACE (at least 40% of canvas).
   - Use clean, solid backgrounds (matte white, light gray, or deep slate).
   - Use ONE primary high-quality visual symbol instead of busy patterns.
   - TOP AREA: Keep the top 15% clean with simple, high-contrast background (solid colors or subtle gradients). No text or bands in this area.
   - MOOD TYPOGRAPHY: Suggest ultra-clean Serif for elegance or Bold Sans for modern tech.
   - Avoid "atmospheric clutter," "particle effects," or "busy textures."
   - Prioritize ultra-clean typography hierarchy and strategic alignment (Center/Left).

2. BALANCED MODE:
   - Standard professional design with modern aesthetic.
   - Balanced use of background elements and white space.
   - Professional lighting and depth without over-generation.

3. RICH MODE:
   - Immersive, multi-layered, and atmospheric designs.
   - Deep dimension with glows, textures, and many visual elements.
   - High energy and vivid color harmony.

CINEMATIC DEPTH FRAMEWORK (v6.0 - STORYTELLING THROUGH LAYERS):
When creating backgrounds, think cinematically with three distinct depth layers:

1. FOREGROUND LAYER (10-30% opacity overlays):
   - Purpose: Adds visual interest without obscuring content
   - Examples: Subtle leaf silhouettes, light ray overlays, flowing patterns, gentle particle effects
   - Rule: NEVER place solid/opaque elements here - text must remain legible
   - Sophistication: Minimalist uses 0-10%, Balanced uses 10-20%, Rich uses 20-30%

2. MIDGROUND LAYER (Text content zone):
   - Purpose: Where all text, logos, and primary content lives
   - Rule: This layer must have clean, high-contrast backgrounds for readability
   - Examples: Solid color zones, soft gradient backdrops, subtle texture fills
   - Sophistication: All modes prioritize text legibility here

3. BACKGROUND LAYER (Deep atmospheric scene):
   - Purpose: Sets the mood and tells the event's story through environment
   - Examples: "Deep forest atmosphere", "Kinetic energy fields", "Ocean depth scene", "Innovation hub skyline"
   - Rule: Create emotional depth - what FEELING should the viewer get?
   - Sophistication: Minimalist uses simple gradients, Balanced uses moderate atmospheres, Rich uses immersive scenes

CINEMATIC COMPOSITION QUESTIONS (Ask yourself before finalizing):
- Does the background FEEL like the event type? (Workshop = hands-on energy, Conference = professional prestige)
- Is there visual depth? (Blurred background + crisp midground + subtle foreground = cinema-quality)
- Do the layers work together or fight each other?
- Would this design make someone STOP and look, or is it generic?

Example Cinematic Scenes:
- Nature theme: "Deep misty forest (background) → Clean text zone (midground) → Gentle leaf overlay (foreground)"
- Tech theme: "Holographic data streams (background) → Solid gradient text zone (midground) → Circuit pattern overlay (foreground)"
- Energy theme: "Explosive radial burst (background) → High-contrast text area (midground) → Motion blur streaks (foreground)"

CRITICAL CUSTOM COLOR ENFORCEMENT (v5.3):
When custom colors are explicitly provided by the user, you MUST use them exclusively:
- Do NOT suggest alternative color palettes based on event theme
- Do NOT recommend navy/gold, purple/pink, or other preset combinations
- Do NOT invent complementary colors or make color assumptions
- Custom colors represent the user's brand identity and are NON-NEGOTIABLE
- Use ONLY the provided hex values in colorPaletteHints
- If custom colors are specified, your colorPaletteHints field must describe those exact colors
- Example: If user provides #1c9924 green, #f8ff36 yellow, do NOT suggest navy/gold - use their exact colors

CRITICAL RULES:
1. The user's EXACT text values (event name, speaker name, date, venue) MUST be preserved exactly as provided
2. Prioritize TEXT ACCURACY - every word the user typed should be rendered correctly in the final image
3. Create a visual hierarchy: most important text (event name) should be largest/most prominent
4. NEVER invent or change the user's content - only use what they provided
5. Add creative visual guidance that ENHANCES (not replaces) the user's content
6. Consider the format type when suggesting layout (poster, certificate, thumbnail, etc.)

OUTPUT FORMAT:
Return a valid JSON object with these exact fields:
{
  "primaryText": "The main headline text that MUST appear prominently (user's event name exactly as provided)",
  "secondaryText": ["Array of ONLY essential text - LIMIT to: date, time, venue, speaker name/designation. DO NOT include: taglines, descriptions, registration details, topics, or long notes"],
  "visualScene": "Description of the visual scene/background that complements the event type",
  "designGuidance": "Creative direction for layout, typography, and visual treatment",
  "textPlacementHints": "Where text should be positioned in the image",
  "colorPaletteHints": "Color suggestions based on event type and mood",
  "mustIncludeElements": ["Array of visual elements that must appear"],
  "enhancedPrompt": "A complete, detailed prompt combining all the above for image generation"
}

CRITICAL SECONDARY TEXT RULES:
- ONLY include: Date, Time, Venue, Speaker Name + Designation (if speaker exists)
- NEVER include: Event taglines, descriptions, topics lists, registration fees, notes, or any long-form content
- Keep secondaryText array to maximum 4-5 SHORT elements (each under 50 characters)
- Long content should be referenced in visualScene or designGuidance, NOT in secondaryText

IMPORTANT: The enhancedPrompt should be a comprehensive paragraph that includes:
- The exact event name and all text that must appear
- The visual scene description
- Color guidance
- Layout hints
- Must-include visual elements
- Any format-specific requirements`

// ============================================================
// MAIN FUNCTION
// ============================================================

/**
 * Generate an ultra-pro prompt using Claude AI.
 * Transforms compiled form data into an optimized image generation prompt.
 * Returns the prompt along with usage tracking information.
 *
 * OPTIMIZATIONS (v3.7):
 * - Response caching for similar requests
 * - Dynamic temperature based on format type
 * - Schema validation with auto-fix
 *
 * v5.1: Added logoStripEnabled parameter for conditional header band instructions
 */
export async function generateUltraProPrompt(
  compiledData: CompiledFormData,
  provider: 'claude' | 'gemini' = 'claude',
  designContext?: any, // DesignContext from Design Intelligence (optional)
  logoStripEnabled?: boolean, // Whether user has enabled logo strip feature (v5.1)
  resolvedColors?: { source: string; primaryColor: string; secondaryColor: string; accentColor: string }, // Custom colors to enforce (v5.3)
  dualStripeMode?: boolean // v6.0: Whether dual-stripe header mode is enabled (primary + vertical logos)
): Promise<UltraProPromptResult> {
  console.log('[Ultra-Pro Prompt] === GENERATING OPTIMIZED PROMPT ===')
  console.log('[Ultra-Pro Prompt] Event Name:', compiledData.eventName || '(not provided)')
  console.log('[Ultra-Pro Prompt] Format:', compiledData.format?.name || 'default')
  console.log('[Ultra-Pro Prompt] Provider:', provider)
  console.log('[Ultra-Pro Prompt] Design Context:', designContext ? 'PROVIDED (v5.0 enhancement)' : 'NOT PROVIDED (fallback mode)')
  console.log('[Ultra-Pro Prompt] Dual-Stripe Mode:', dualStripeMode ? 'YES (18% reserved, 20% text start)' : 'NO (8% reserved, 15% text start)')

  if (designContext) {
    console.log('[Ultra-Pro Prompt] Story Analysis:', designContext.storyAnalysis?.narrative?.substring(0, 100) || '(none)')
    console.log('[Ultra-Pro Prompt] Visual Elements:', designContext.visualElements?.join(', ') || '(none)')
    console.log('[Ultra-Pro Prompt] Vibe Keywords:', designContext.vibeAndMood?.vibeKeywords?.join(', ') || '(none)')
  }

  // === OPTIMIZATION 1: Check cache first ===
  const formatId = compiledData.format?.id

  // v5.5: Add variation seed for creative formats to prevent identical generations
  const isCreativeFormat = ['event_poster', 'flyer', 'instagram_post', 'youtube_thumbnail'].includes(formatId || '')
  const variationSeed = isCreativeFormat ? Date.now().toString() : undefined

  const cacheKey = generateUltraProCacheKey({
    formatId,
    eventName: compiledData.eventName || undefined,
    eventType: compiledData.eventType || undefined,
    hasSpeaker: !!compiledData.speakerName,
    hasVenue: !!compiledData.venue,
    variationSeed, // NEW: Forces unique cache key every time for creative formats
  })

  // For creative formats, skip cache to ensure fresh variation
  const cachedPrompt = isCreativeFormat ? null : (getCachedUltraProPrompt(cacheKey) as UltraProPrompt | null)
  if (cachedPrompt) {
    console.log('[Ultra-Pro Prompt] Using CACHED prompt (non-creative format)')
    return {
      prompt: cachedPrompt,
      usage: {
        provider,
        model: 'cached',
        tokenUsage: { inputTokens: 0, outputTokens: 0, cachedTokens: 0, totalTokens: 0 },
        durationMs: 0,
      },
    }
  }

  if (isCreativeFormat) {
    console.log('[Ultra-Pro Prompt] Skipping cache for creative format (ensuring variation)')
  }

  // === OPTIMIZATION 2: Get dynamic temperature config ===
  const tempConfig = getTemperatureConfig(formatId)
  console.log('[Ultra-Pro Prompt] Temperature config:', tempConfig.description)

  // Build the user brief from compiled data
  const userBrief = buildTextBriefFromCompiled(compiledData)
  console.log('[Ultra-Pro Prompt] User Brief:', userBrief.substring(0, 200) + '...')

  // Build design context section (v5.0)
  let designContextSection = ''
  if (designContext) {
    designContextSection = `

DESIGN INTELLIGENCE CONTEXT (v5.0 - PRESERVE AND ENHANCE):
Story Analysis: ${designContext.storyAnalysis?.narrative || '(none)'}
Emotional Arc: ${designContext.storyAnalysis?.emotionalArc || '(none)'}
Visual Elements: ${designContext.visualElements?.join(', ') || '(none)'}
Vibe Keywords: ${designContext.vibeAndMood?.vibeKeywords?.join(', ') || '(none)'}
Mood Atmosphere: ${designContext.vibeAndMood?.moodAtmosphere || '(none)'}
Background Setting: ${designContext.backgroundSetting || '(none)'}
Iconic Imagery: ${designContext.iconicImagery?.join(', ') || '(none)'}
Decorative Elements: ${designContext.decorativeElementsContext ? JSON.stringify(designContext.decorativeElementsContext.thematicElements) : '(none)'}
Typography Strategy: ${designContext.typographyStrategy ? `${designContext.typographyStrategy.headlineApproach} / ${designContext.typographyStrategy.multiColorStrategy?.colorRhythm}` : '(none)'}
Color Storytelling: ${designContext.colorStorytelling ? `${designContext.colorStorytelling.palette?.dominantHues?.join(' + ')} - ${designContext.colorStorytelling.palette?.psychologyReasoning}` : '(none)'}

CRITICAL: Your enhancedPrompt MUST integrate these story-driven insights into a NARRATIVE SCENE DESCRIPTION (not keyword lists).
`
  }

  // Build logo strip instructions (v5.3: AI should NOT extend into reserved area - Sharp handles it)
  // IMPORTANT: When logo strip enabled, AI should START design below the reserved area
  // v6.0: Dual-stripe mode uses 18% reserved (vs 8% single-stripe) and 20% text start (vs 15%)
  const reservedPercent = dualStripeMode ? 18 : 8
  const textStartPercent = dualStripeMode ? 20 : 15

  const logoStripInstructions = logoStripEnabled
    ? `
TOP AREA GUIDANCE (CRITICAL):
- The top ${reservedPercent}% of the canvas is RESERVED and will be replaced in post-processing.
- START your design at approximately ${reservedPercent}% from the top edge.
- Do NOT extend backgrounds, gradients, or any graphics into the top ${reservedPercent}%.
- Treat ${reservedPercent}% from top as the TOP EDGE of your design canvas.
- Position the main headline starting at approximately ${textStartPercent}% from top.${dualStripeMode ? '\n- DUAL-STRIPE MODE: Two rows of logos occupy top 18%, ensure 2% buffer before text.' : ''}`
    : `
TOP AREA GUIDANCE:
- DO NOT create any visible stripe, band, or header section at the top.
- The background design should flow naturally and seamlessly from top to bottom.
- Keep the top 10% clean with simple background (no text, faces, or graphics).
- Use simple backgrounds (solid colors or subtle gradients) in the top area.`

  // Build color enforcement section (v5.5: STRICT enforcement for ALL sources)
  let colorBriefSection = ''
  if (resolvedColors && resolvedColors.source !== 'fallback') {
    // Determine enforcement language based on source
    const sourceLabel = {
      custom: 'MANDATORY CUSTOM USER COLORS (NON-NEGOTIABLE)',
      brand: 'MANDATORY ORGANIZATION BRAND COLORS (STRICT COMPLIANCE)',
      preset: 'USER-SELECTED COLOR PALETTE (STRICT COMPLIANCE)',
    }[resolvedColors.source]

    const sourceDescription = {
      custom: 'user-selected custom colors',
      brand: 'the organization\'s brand identity',
      preset: 'user-selected from preset palette',
    }[resolvedColors.source]

    colorBriefSection = `
${sourceLabel}:
Primary Color: ${resolvedColors.primaryColor}
Secondary Color: ${resolvedColors.secondaryColor}
Accent Color: ${resolvedColors.accentColor}

CRITICAL: These are ${sourceDescription}. You MUST use these exact hex values in your colorPaletteHints.
Background MUST use Primary Color (${resolvedColors.primaryColor}) as the dominant color - match the EXACT tone.
Do NOT suggest alternative palettes. Do NOT use theme-based colors (navy/gold, purple/pink, etc.).
Do NOT use event-type default colors (conference blue, workshop orange, etc.).
These colors are NON-NEGOTIABLE - override any other color suggestions in this prompt.

`
  }

  // v6.0: Build creativity enforcement section
  const creativityEnforcement = isCreativeFormat ? `

=== CREATIVITY ENFORCEMENT v6.0 (MANDATORY) ===

GENERATION SEED: ${variationSeed}
This seed FORCES unique creative output. Do NOT fall back to safe, predictable designs.

CREATIVE TWIST REQUIREMENT:
Your design MUST include ONE unexpected visual element that makes it MEMORABLE.
Ask yourself: "What would make someone stop scrolling and LOOK at this design?"

Examples of Creative Twists:
- Instead of a standard networking background, use "magnetic field lines pulling diverse silhouettes together"
- Instead of a tech gradient, use "holographic data fragments floating in zero gravity"
- Instead of corporate blue, use "deep space noir with bioluminescent accents"

ANTI-PATTERN ENFORCEMENT:
Before finalizing, check your design against this list. If ANY apply, REDESIGN:
❌ Blue-to-purple or orange-to-pink generic gradients
❌ Random geometric shapes without meaning
❌ Stock photo aesthetic (perfect people, staged scenes)
❌ Default professional navy/gray palettes
❌ Overused sunburst/radial patterns
❌ Generic cityscape silhouettes
❌ Floating spheres/cubes without purpose
❌ Bokeh backgrounds without connection to content

YOUR GOAL: Create something the viewer has NEVER seen before for this type of event.
` : ''

  // Build the full prompt for the AI
  const prompt = `${ULTRA_PRO_PROMPT_SYSTEM}
${creativityEnforcement}
${colorBriefSection}USER'S CREATIVE BRIEF:
${userBrief}
${designContextSection}
SOPHISTICATION LEVEL: ${compiledData.sophistication || 'balanced'}
TYPOGRAPHY PREFERENCE: ${compiledData.fontStyle || 'AI-suggested'}
ALIGNMENT PREFERENCE: ${compiledData.alignment || 'AI-suggested'}
${logoStripInstructions}

Generate the ultra-pro prompt JSON now. Remember to preserve the user's exact text values!`

  // Call the appropriate AI provider with dynamic temperature
  let llmResponse: LLMResponse

  try {
    if (provider === 'gemini') {
      llmResponse = await callGemini(prompt, tempConfig.ultraProPrompt, tempConfig.topP)
    } else {
      llmResponse = await callClaude(prompt, tempConfig.ultraProPrompt)
    }
  } catch (error) {
    console.error('[Ultra-Pro Prompt] AI call failed:', error)
    // Return a fallback prompt if AI fails with zero usage (v5.1: Pass logoStripEnabled)
    return {
      prompt: generateFallbackPrompt(compiledData, logoStripEnabled),
      usage: {
        provider,
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

  console.log(`[Ultra-Pro Prompt] Response received in ${llmResponse.durationMs}ms`)

  // === OPTIMIZATION 3: Schema validation with auto-fix ===
  const parsedPrompt = parseUltraProPrompt(llmResponse.text, compiledData, logoStripEnabled)
  const validatedPrompt = validateAndFixUltraProPrompt(parsedPrompt)

  const ultraProPrompt = validatedPrompt || parsedPrompt
  console.log('[Ultra-Pro Prompt] === PROMPT GENERATED ===')
  console.log('[Ultra-Pro Prompt] Primary Text:', ultraProPrompt.primaryText)
  console.log('[Ultra-Pro Prompt] Enhanced Prompt:', ultraProPrompt.enhancedPrompt.substring(0, 200) + '...')

  // === OPTIMIZATION 4: Cache the result ===
  setCachedUltraProPrompt(cacheKey, ultraProPrompt)

  return {
    prompt: ultraProPrompt,
    usage: {
      provider,
      model: llmResponse.model,
      tokenUsage: llmResponse.tokenUsage,
      durationMs: llmResponse.durationMs,
    },
  }
}

/**
 * Safe version that returns fallback on error with zero usage
 * v5.0: Now accepts designContext parameter
 * v5.1: Now accepts logoStripEnabled parameter
 * v5.3: Now accepts resolvedColors parameter
 * v6.0: Now accepts dualStripeMode parameter
 */
export async function generateUltraProPromptSafe(
  compiledData: CompiledFormData,
  provider: 'claude' | 'gemini' = 'claude',
  designContext?: any, // DesignContext from Design Intelligence (optional)
  logoStripEnabled?: boolean, // Whether user has enabled logo strip feature (v5.1)
  resolvedColors?: { source: string; primaryColor: string; secondaryColor: string; accentColor: string }, // Custom colors to enforce (v5.3)
  dualStripeMode?: boolean // v6.0: Whether dual-stripe header mode is enabled (primary + vertical logos)
): Promise<UltraProPromptResult> {
  try {
    return await generateUltraProPrompt(compiledData, provider, designContext, logoStripEnabled, resolvedColors, dualStripeMode)
  } catch (error) {
    console.error('[Ultra-Pro Prompt] Error:', error)
    return {
      prompt: generateFallbackPrompt(compiledData, logoStripEnabled, dualStripeMode),
      usage: {
        provider,
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

// ============================================================
// AI PROVIDER IMPLEMENTATIONS
// ============================================================

async function callClaude(
  prompt: string,
  temperature: number = 0.9
): Promise<LLMResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  const modelName = 'claude-haiku-4-5'

  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured')
  }

  const client = new Anthropic({ apiKey })

  console.log('[Ultra-Pro Prompt] Calling Claude Haiku 4.5 (temp:', temperature, ')...')
  const startTime = Date.now()

  // Use prompt caching for the system prompt
  const systemPromptEnd = prompt.indexOf("USER'S CREATIVE BRIEF")
  const systemPrompt = systemPromptEnd > 0 ? prompt.substring(0, systemPromptEnd).trim() : ''
  const userContent = systemPromptEnd > 0 ? prompt.substring(systemPromptEnd) : prompt

  const usePromptCaching = systemPrompt.length > 500

  const response = await client.messages.create({
    model: modelName,
    max_tokens: 1500,
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

  const textBlock = response.content.find(block => block.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from Claude')
  }

  const text = textBlock.text

  // Extract token usage from Claude's response
  const tokenUsage: TokenUsage = {
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    cachedTokens: 0,
    totalTokens: response.usage.input_tokens + response.usage.output_tokens,
  }

  console.log('[Ultra-Pro Prompt] Token usage:', JSON.stringify(tokenUsage))

  return {
    text,
    tokenUsage,
    model: modelName,
    durationMs,
  }
}

async function callGemini(
  prompt: string,
  temperature: number = 0.7,
  topP: number = 0.9
): Promise<LLMResponse> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY
  const modelName = 'gemini-2.0-flash-exp'

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured')
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature, // Dynamic temperature based on format type
      topP, // Dynamic top-P for word choice variation
      maxOutputTokens: 2000, // Increased from 1500 for complex responses
      responseMimeType: 'application/json', // v7.0: Force valid JSON output
    }
  })

  console.log('[Ultra-Pro Prompt] Calling Gemini 2.0 Flash...')
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

  console.log('[Ultra-Pro Prompt] Token usage:', JSON.stringify(tokenUsage))

  return {
    text,
    tokenUsage,
    model: modelName,
    durationMs,
  }
}

// ============================================================
// RESPONSE PARSING
// ============================================================

function parseUltraProPrompt(
  response: string,
  compiledData: CompiledFormData,
  logoStripEnabled?: boolean
): UltraProPrompt {
  // Clean up the response - remove markdown code blocks
  let jsonStr = response.trim()
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
    console.error('[Ultra-Pro Prompt] Failed to extract JSON:', response.substring(0, 200))
    return generateFallbackPrompt(compiledData, logoStripEnabled)
  }

  try {
    // v7.0: Use safeJsonParse with repair logic instead of bare JSON.parse
    const parsed = safeJsonParse<any>(jsonMatch[0])

    // Ensure all required fields exist
    return {
      primaryText: parsed.primaryText || compiledData.eventName || 'Event',
      secondaryText: Array.isArray(parsed.secondaryText) ? parsed.secondaryText : [],
      visualScene: parsed.visualScene || 'Professional event setting',
      designGuidance: parsed.designGuidance || 'Clean, modern design with clear hierarchy',
      textPlacementHints: parsed.textPlacementHints || 'Center-aligned text with event name prominent',
      colorPaletteHints: parsed.colorPaletteHints || 'Professional color palette',
      mustIncludeElements: Array.isArray(parsed.mustIncludeElements) ? parsed.mustIncludeElements : [],
      enhancedPrompt: parsed.enhancedPrompt || buildFallbackEnhancedPrompt(compiledData, logoStripEnabled),
    }
  } catch (error) {
    console.error('[Ultra-Pro Prompt] JSON parse error:', error)
    console.error('[Ultra-Pro Prompt] Raw JSON (first 500 chars):', jsonMatch[0].substring(0, 500))
    return generateFallbackPrompt(compiledData, logoStripEnabled)
  }
}

// ============================================================
// FALLBACK GENERATION
// ============================================================

function generateFallbackPrompt(
  compiledData: CompiledFormData,
  logoStripEnabled?: boolean,
  dualStripeMode?: boolean // v6.0: Whether dual-stripe header mode is enabled
): UltraProPrompt {
  console.log('[Ultra-Pro Prompt] Using fallback prompt generation')
  console.log('[Ultra-Pro Prompt] Logo strip enabled:', logoStripEnabled ? 'YES' : 'NO')
  console.log('[Ultra-Pro Prompt] Dual-stripe mode:', dualStripeMode ? 'YES' : 'NO')

  const eventName = compiledData.eventName || 'Event'
  const secondaryText: string[] = []

  // ONLY essential info in secondaryText (date, time, venue, speaker)
  if (compiledData.date) secondaryText.push(compiledData.date)
  if (compiledData.time) secondaryText.push(compiledData.time)
  if (compiledData.venue) secondaryText.push(compiledData.venue)
  if (compiledData.speakerName) {
    const speakerLine = compiledData.speakerDesignation
      ? `${compiledData.speakerName}, ${compiledData.speakerDesignation}`
      : compiledData.speakerName
    secondaryText.push(speakerLine)
  }

  // DO NOT add eventNote or other long content to secondaryText
  // (they'll be referenced in visualScene/designGuidance instead)

  return {
    primaryText: eventName,
    secondaryText,
    visualScene: `Professional ${compiledData.format?.name || 'poster'} design with clean modern aesthetic`,
    designGuidance: 'Bold headline with clear visual hierarchy. Secondary information in smaller but readable text.',
    textPlacementHints: 'Event name centered and prominent. Supporting details arranged below.',
    colorPaletteHints: 'Professional color scheme appropriate for the event type',
    mustIncludeElements: ['event title', 'date and venue if provided', 'speaker name if provided'],
    enhancedPrompt: buildFallbackEnhancedPrompt(compiledData, logoStripEnabled),
  }
}

/**
 * Builds a fallback enhanced prompt using NARRATIVE descriptions.
 *
 * IMPORTANT: This function avoids instruction language that Gemini
 * might render as visible text. Instead of "Include X", "Feature Y",
 * it uses descriptive prose about the design.
 *
 * Anti-patterns AVOIDED:
 * - "Include these details: date: X, time: Y" (labels leak)
 * - "Feature the guest/speaker: X" (instruction language)
 * - "Create a design with..." (command language)
 *
 * v5.1: Now respects logoStripEnabled parameter
 */
function buildFallbackEnhancedPrompt(
  compiledData: CompiledFormData,
  logoStripEnabled?: boolean
): string {
  const parts: string[] = []

  // Format type - use narrative, not command
  const formatName = compiledData.format?.name || 'poster'
  const eventType = compiledData.eventType || 'professional event'
  parts.push(`A ${eventType} ${formatName} with clean, modern typography.`)

  // Event name - describe the headline, don't command
  if (compiledData.eventName) {
    parts.push(`The prominent headline reads "${compiledData.eventName}".`)
  }

  // Date, time, venue - list as supporting text, no labels
  const supportingText: string[] = []
  if (compiledData.date?.trim()) supportingText.push(`"${compiledData.date.trim()}"`)
  if (compiledData.time?.trim()) supportingText.push(`"${compiledData.time.trim()}"`)
  if (compiledData.venue?.trim()) supportingText.push(`"${compiledData.venue.trim()}"`)
  if (supportingText.length > 0) {
    parts.push(`Supporting text elements: ${supportingText.join(', ')}.`)
  }

  // Speaker/Guest - describe naturally, no "Feature" command
  if (compiledData.speakerName?.trim()) {
    const speakerText = compiledData.speakerDesignation?.trim()
      ? `"${compiledData.speakerName.trim()}, ${compiledData.speakerDesignation.trim()}"`
      : `"${compiledData.speakerName.trim()}"`
    parts.push(`Speaker attribution: ${speakerText}.`)
  }

  // Organization - describe as part of branding, no command
  if (compiledData.organizationName?.trim()) {
    parts.push(`Branding for "${compiledData.organizationName.trim()}".`)
  }

  // Custom fields - VALUES ONLY, wrapped in quotes
  for (const value of Object.values(compiledData.customFields)) {
    if (value?.trim()) {
      parts.push(`Additional text: "${value.trim()}".`)
    }
  }

  // Event note (footer content) - describe as footer text
  if (compiledData.eventNote?.trim()) {
    parts.push(`Footer note: "${compiledData.eventNote.trim()}".`)
  }

  // Style/Theme - describe the aesthetic, don't command
  const styleDescriptors: string[] = []
  if (compiledData.theme) styleDescriptors.push(compiledData.theme)
  if (compiledData.style) styleDescriptors.push(compiledData.style)

  // NEW v4.0: Sophistication-aware fallbacks
  // v5.1: Conditional logo stripe based on user toggle
  if (compiledData.sophistication === 'minimalist') {
    styleDescriptors.push('high-impact minimalism', 'generous negative space', 'ultra-clean layout')
    // Only mention logo stripe if explicitly enabled by user
    if (logoStripEnabled) {
      styleDescriptors.push('solid white logo stripe')
    }
  } else if (compiledData.sophistication === 'rich') {
    styleDescriptors.push('rich immersive atmosphere', 'multi-layered background', 'vivid lighting', 'ambient textures')
  }

  if (styleDescriptors.length > 0) {
    parts.push(`${styleDescriptors.join(', ')} aesthetic with professional layout.`)
  }

  // Quality note - describe outcome, not instruction
  parts.push('Crisp, legible typography throughout.')

  return parts.join(' ')
}
