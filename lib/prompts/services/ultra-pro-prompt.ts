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
  "secondaryText": ["Array of secondary text elements - date, venue, speaker, etc."],
  "visualScene": "Description of the visual scene/background that complements the event type",
  "designGuidance": "Creative direction for layout, typography, and visual treatment",
  "textPlacementHints": "Where text should be positioned in the image",
  "colorPaletteHints": "Color suggestions based on event type and mood",
  "mustIncludeElements": ["Array of visual elements that must appear"],
  "enhancedPrompt": "A complete, detailed prompt combining all the above for image generation"
}

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
 */
export async function generateUltraProPrompt(
  compiledData: CompiledFormData,
  provider: 'claude' | 'gemini' = 'claude'
): Promise<UltraProPromptResult> {
  console.log('[Ultra-Pro Prompt] === GENERATING OPTIMIZED PROMPT ===')
  console.log('[Ultra-Pro Prompt] Event Name:', compiledData.eventName || '(not provided)')
  console.log('[Ultra-Pro Prompt] Format:', compiledData.format?.name || 'default')
  console.log('[Ultra-Pro Prompt] Provider:', provider)

  // Build the user brief from compiled data
  const userBrief = buildTextBriefFromCompiled(compiledData)
  console.log('[Ultra-Pro Prompt] User Brief:', userBrief.substring(0, 200) + '...')

  // Build the full prompt for the AI
  const prompt = `${ULTRA_PRO_PROMPT_SYSTEM}

USER'S CREATIVE BRIEF:
${userBrief}

Generate the ultra-pro prompt JSON now. Remember to preserve the user's exact text values!`

  // Call the appropriate AI provider
  let llmResponse: LLMResponse

  try {
    if (provider === 'gemini') {
      llmResponse = await callGemini(prompt)
    } else {
      llmResponse = await callClaude(prompt)
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

  // Parse the response
  const ultraProPrompt = parseUltraProPrompt(llmResponse.text, compiledData)
  console.log('[Ultra-Pro Prompt] === PROMPT GENERATED ===')
  console.log('[Ultra-Pro Prompt] Primary Text:', ultraProPrompt.primaryText)
  console.log('[Ultra-Pro Prompt] Enhanced Prompt:', ultraProPrompt.enhancedPrompt.substring(0, 200) + '...')

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

async function callClaude(prompt: string): Promise<LLMResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  const modelName = 'claude-3-5-haiku-latest'

  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured')
  }

  const client = new Anthropic({ apiKey })

  console.log('[Ultra-Pro Prompt] Calling Claude 3.5 Haiku...')
  const startTime = Date.now()

  const response = await client.messages.create({
    model: modelName,
    max_tokens: 1500,
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ]
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

async function callGemini(prompt: string): Promise<LLMResponse> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY
  const modelName = 'gemini-2.0-flash-exp'

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured')
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: 0.7,
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

  if (compiledData.date) secondaryText.push(compiledData.date)
  if (compiledData.time) secondaryText.push(compiledData.time)
  if (compiledData.venue) secondaryText.push(compiledData.venue)
  if (compiledData.speakerName) {
    const speakerLine = compiledData.speakerDesignation
      ? `${compiledData.speakerName}, ${compiledData.speakerDesignation}`
      : compiledData.speakerName
    secondaryText.push(speakerLine)
  }

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

function buildFallbackEnhancedPrompt(compiledData: CompiledFormData): string {
  const parts: string[] = []

  // Format type
  const formatName = compiledData.format?.name || 'poster'
  parts.push(`Create a professional ${formatName} design.`)

  // Event name - MUST be prominent
  if (compiledData.eventName) {
    parts.push(`The main headline text "${compiledData.eventName}" must appear prominently and be clearly readable.`)
  }

  // Date, time, venue
  const detailParts: string[] = []
  if (compiledData.date) detailParts.push(`date: ${compiledData.date}`)
  if (compiledData.time) detailParts.push(`time: ${compiledData.time}`)
  if (compiledData.venue) detailParts.push(`venue: ${compiledData.venue}`)
  if (detailParts.length > 0) {
    parts.push(`Include these details in the design: ${detailParts.join(', ')}.`)
  }

  // Speaker/Guest
  if (compiledData.speakerName) {
    const speakerInfo = compiledData.speakerDesignation
      ? `${compiledData.speakerName} (${compiledData.speakerDesignation})`
      : compiledData.speakerName
    parts.push(`Feature the guest/speaker: ${speakerInfo}.`)
  }

  // Organization
  if (compiledData.organizationName) {
    parts.push(`Include organization branding for: ${compiledData.organizationName}.`)
  }

  // Custom fields - CRITICAL FIX: Only include values, not field names
  // The AI was rendering "postTitle: Monthly YI Gathering" literally
  for (const [key, value] of Object.entries(compiledData.customFields)) {
    if (value && String(value).trim()) {
      parts.push(`Also include this text element: "${value}".`)
    }
  }

  // Style/Theme
  if (compiledData.theme) {
    parts.push(`Use a ${compiledData.theme} theme.`)
  }
  if (compiledData.style) {
    parts.push(`Apply a ${compiledData.style} style.`)
  }

  parts.push('Ensure all text is clearly readable and professionally laid out.')

  return parts.join(' ')
}
