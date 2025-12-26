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

DESIGN SOPHISTICATION RULES (CRITICAL):
The user can specify a "sophistication" level which MUST dictate your visual strategy:

1. MINIMALIST MODE (Default for Professional/Tech/Climate):
   - Focus on HIGH-IMPACT MINIMALISM and VAST NEGATIVE SPACE (at least 40% of canvas).
   - Use clean, solid backgrounds (matte white, light gray, or deep slate).
   - Use ONE primary high-quality visual symbol instead of busy patterns.
   - LOGO STRIPE: Always suggest a solid white or light-color "Logo Stripe" band at the top for branding.
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
 */
export async function generateUltraProPrompt(
  compiledData: CompiledFormData,
  provider: 'claude' | 'gemini' = 'claude'
): Promise<UltraProPromptResult> {
  console.log('[Ultra-Pro Prompt] === GENERATING OPTIMIZED PROMPT ===')
  console.log('[Ultra-Pro Prompt] Event Name:', compiledData.eventName || '(not provided)')
  console.log('[Ultra-Pro Prompt] Format:', compiledData.format?.name || 'default')
  console.log('[Ultra-Pro Prompt] Provider:', provider)

  // === OPTIMIZATION 1: Check cache first ===
  const formatId = compiledData.format?.id
  const cacheKey = generateUltraProCacheKey({
    formatId,
    eventName: compiledData.eventName || undefined,
    eventType: compiledData.eventType || undefined,
    hasSpeaker: !!compiledData.speakerName,
    hasVenue: !!compiledData.venue,
  })

  const cachedPrompt = getCachedUltraProPrompt(cacheKey) as UltraProPrompt | null
  if (cachedPrompt) {
    console.log('[Ultra-Pro Prompt] Using CACHED prompt')
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

  // === OPTIMIZATION 2: Get dynamic temperature config ===
  const tempConfig = getTemperatureConfig(formatId)
  console.log('[Ultra-Pro Prompt] Temperature config:', tempConfig.description)

  // Build the user brief from compiled data
  const userBrief = buildTextBriefFromCompiled(compiledData)
  console.log('[Ultra-Pro Prompt] User Brief:', userBrief.substring(0, 200) + '...')

  // Build the full prompt for the AI
  const prompt = `${ULTRA_PRO_PROMPT_SYSTEM}

USER'S CREATIVE BRIEF:
${userBrief}

SOPHISTICATION LEVEL: ${compiledData.sophistication || 'balanced'}
TYPOGRAPHY PREFERENCE: ${compiledData.fontStyle || 'AI-suggested'}
ALIGNMENT PREFERENCE: ${compiledData.alignment || 'AI-suggested'}

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
    // Return a fallback prompt if AI fails with zero usage
    return {
      prompt: generateFallbackPrompt(compiledData),
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
  const parsedPrompt = parseUltraProPrompt(llmResponse.text, compiledData)
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
 */
export async function generateUltraProPromptSafe(
  compiledData: CompiledFormData,
  provider: 'claude' | 'gemini' = 'claude'
): Promise<UltraProPromptResult> {
  try {
    return await generateUltraProPrompt(compiledData, provider)
  } catch (error) {
    console.error('[Ultra-Pro Prompt] Error:', error)
    return {
      prompt: generateFallbackPrompt(compiledData),
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
  const modelName = 'claude-haiku-4-5-20251001'

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
      maxOutputTokens: 1500,
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

function parseUltraProPrompt(response: string, compiledData: CompiledFormData): UltraProPrompt {
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
    return generateFallbackPrompt(compiledData)
  }

  try {
    const parsed = JSON.parse(jsonMatch[0])

    // Ensure all required fields exist
    return {
      primaryText: parsed.primaryText || compiledData.eventName || 'Event',
      secondaryText: Array.isArray(parsed.secondaryText) ? parsed.secondaryText : [],
      visualScene: parsed.visualScene || 'Professional event setting',
      designGuidance: parsed.designGuidance || 'Clean, modern design with clear hierarchy',
      textPlacementHints: parsed.textPlacementHints || 'Center-aligned text with event name prominent',
      colorPaletteHints: parsed.colorPaletteHints || 'Professional color palette',
      mustIncludeElements: Array.isArray(parsed.mustIncludeElements) ? parsed.mustIncludeElements : [],
      enhancedPrompt: parsed.enhancedPrompt || buildFallbackEnhancedPrompt(compiledData),
    }
  } catch (error) {
    console.error('[Ultra-Pro Prompt] JSON parse error:', error)
    return generateFallbackPrompt(compiledData)
  }
}

// ============================================================
// FALLBACK GENERATION
// ============================================================

function generateFallbackPrompt(compiledData: CompiledFormData): UltraProPrompt {
  console.log('[Ultra-Pro Prompt] Using fallback prompt generation')

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
    enhancedPrompt: buildFallbackEnhancedPrompt(compiledData),
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
 */
function buildFallbackEnhancedPrompt(compiledData: CompiledFormData): string {
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
  if (compiledData.sophistication === 'minimalist') {
    styleDescriptors.push('high-impact minimalism', 'generous negative space', 'ultra-clean layout', 'solid white logo stripe')
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
