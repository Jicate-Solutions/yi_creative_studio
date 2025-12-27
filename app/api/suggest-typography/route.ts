/**
 * Typography Suggestions API Endpoint
 * AI-powered font recommendations using Claude Haiku 4.5
 */

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { trackApiUsage } from '@/lib/services/api-usage'
import { buildTypographySuggestionPrompt, isValidFontId, normalizeFontId, getFontFamilyList } from '@/lib/prompts/services/typography-suggestion-prompt'
import type {
  TypographySuggestion,
  TypographySuggestionRequest,
  TypographySuggestionResponse,
} from '@/types/typography-suggestions'

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// In-memory cache for typography suggestions
const typographyCache = new Map<
  string,
  { data: TypographySuggestion; timestamp: number }
>()

// Cache TTL: 5 minutes
const CACHE_TTL = 5 * 60 * 1000

// Rate limiting: 20 requests per minute per user
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT = 20
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute

// Cleanup expired cache entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of typographyCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      typographyCache.delete(key)
    }
  }
}, CACHE_TTL)

/**
 * Generate cache key from context
 */
function generateCacheKey(
  verticalSlug: string,
  formatId: string,
  eventType: string
): string {
  // Normalize event type for better cache hits
  const normalizedType = eventType.toLowerCase().trim().replace(/\s+/g, '-')
  return `${verticalSlug}:${formatId}:${normalizedType}`
}

/**
 * Check rate limit for user
 */
function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const userLimit = rateLimitMap.get(userId)

  if (!userLimit || now > userLimit.resetTime) {
    // Reset rate limit window
    rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }

  if (userLimit.count >= RATE_LIMIT) {
    return false
  }

  userLimit.count++
  return true
}

/**
 * Validate typography suggestion response from AI
 */
function validateSuggestion(data: any): data is TypographySuggestion {
  return (
    data &&
    typeof data === 'object' &&
    data.headingFont &&
    typeof data.headingFont.value === 'string' &&
    isValidFontId(data.headingFont.value) &&
    data.bodyFont &&
    typeof data.bodyFont.value === 'string' &&
    isValidFontId(data.bodyFont.value) &&
    typeof data.scale === 'number' &&
    data.scale >= 0.8 &&
    data.scale <= 1.5 &&
    typeof data.confidence === 'number' &&
    data.confidence >= 0 &&
    data.confidence <= 1
  )
}

/**
 * POST /api/suggest-typography
 * Generate AI-powered typography suggestions
 */
export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body: TypographySuggestionRequest = await req.json()
    const { context } = body

    // Validate required fields
    if (!context?.eventType || !context?.verticalSlug || !context?.formatId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required context fields: eventType, verticalSlug, formatId',
        } as TypographySuggestionResponse,
        { status: 400 }
      )
    }

    // Get authenticated user
    const supabase = await createServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized. Please log in.',
        } as TypographySuggestionResponse,
        { status: 401 }
      )
    }

    // Check rate limit
    if (!checkRateLimit(user.id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded. Please try again in a minute.',
        } as TypographySuggestionResponse,
        { status: 429 }
      )
    }

    // Check cache
    const cacheKey = generateCacheKey(
      context.verticalSlug,
      context.formatId,
      context.eventType
    )
    const cached = typographyCache.get(cacheKey)

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json({
        success: true,
        data: cached.data,
        cached: true,
      } as TypographySuggestionResponse)
    }

    // Build prompt
    const prompt = buildTypographySuggestionPrompt(context)

    // Call Claude Haiku 4.5
    const startTime = Date.now()
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      temperature: 0.3, // Low temperature for strict JSON adherence
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const duration = Date.now() - startTime

    // Extract response
    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    // Parse JSON response
    let suggestion: any
    try {
      let jsonText = content.text

      // Remove markdown code blocks if present (```json ... ```)
      const codeBlockMatch = jsonText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/)
      if (codeBlockMatch) {
        jsonText = codeBlockMatch[1]
      } else {
        // Try to extract JSON object
        const jsonMatch = jsonText.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          jsonText = jsonMatch[0]
        }
      }

      // Parse JSON
      suggestion = JSON.parse(jsonText.trim())
    } catch (parseError) {
      console.error('[Typography API] Failed to parse Claude response:', {
        error: parseError instanceof Error ? parseError.message : String(parseError),
        rawResponse: content.text.substring(0, 500), // First 500 chars for debugging
      })
      throw new Error('Failed to parse AI response')
    }

    // Normalize font IDs (handle label format from Claude)
    if (suggestion?.headingFont?.value) {
      const normalizedHeading = normalizeFontId(suggestion.headingFont.value)
      if (normalizedHeading) {
        suggestion.headingFont.value = normalizedHeading
      }
    }

    if (suggestion?.bodyFont?.value) {
      const normalizedBody = normalizeFontId(suggestion.bodyFont.value)
      if (normalizedBody) {
        suggestion.bodyFont.value = normalizedBody
      }
    }

    // Validate suggestion
    if (!validateSuggestion(suggestion)) {
      console.error('[Typography API] Validation failed:', {
        suggestion,
        headingFontValue: suggestion?.headingFont?.value,
        bodyFontValue: suggestion?.bodyFont?.value,
        isHeadingValid: suggestion?.headingFont?.value ? isValidFontId(suggestion.headingFont.value) : false,
        isBodyValid: suggestion?.bodyFont?.value ? isValidFontId(suggestion.bodyFont.value) : false,
        validFonts: getFontFamilyList(),
      })
      throw new Error('AI returned invalid suggestion format')
    }

    // Track API usage
    try {
      // Get organization ID
      const { data: orgMember } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single()

      if (orgMember?.organization_id) {
        await trackApiUsage({
          organizationId: orgMember.organization_id,
          userId: user.id,
          provider: 'claude',
          model: 'claude-haiku-4.5',
          requestType: 'typography_suggestion',
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
          estimatedCostUsd: calculateCost(response.usage),
          metadata: {
            eventType: context.eventType,
            verticalSlug: context.verticalSlug,
            formatId: context.formatId,
            cached: false,
            duration,
          },
          success: true,
        })
      }
    } catch (trackingError) {
      console.error('Failed to track API usage:', trackingError)
      // Don't fail the request if tracking fails
    }

    // Cache the result
    typographyCache.set(cacheKey, {
      data: suggestion,
      timestamp: Date.now(),
    })

    return NextResponse.json({
      success: true,
      data: suggestion,
      cached: false,
    } as TypographySuggestionResponse)
  } catch (error) {
    console.error('Typography suggestion error:', error)

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Request timeout. Please try again.',
          } as TypographySuggestionResponse,
          { status: 504 }
        )
      }

      if (error.message.includes('API key')) {
        return NextResponse.json(
          {
            success: false,
            error: 'AI service configuration error.',
          } as TypographySuggestionResponse,
          { status: 500 }
        )
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate typography suggestions. Please try again.',
      } as TypographySuggestionResponse,
      { status: 500 }
    )
  }
}

/**
 * Calculate cost for Claude Haiku 4.5
 * Pricing (as of Jan 2025):
 * - Input: $1.00 / 1M tokens
 * - Output: $5.00 / 1M tokens
 */
function calculateCost(usage: {
  input_tokens: number
  output_tokens: number
}): number {
  const INPUT_COST_PER_MILLION = 1.0
  const OUTPUT_COST_PER_MILLION = 5.0

  const inputCost = (usage.input_tokens / 1_000_000) * INPUT_COST_PER_MILLION
  const outputCost = (usage.output_tokens / 1_000_000) * OUTPUT_COST_PER_MILLION

  return inputCost + outputCost
}
