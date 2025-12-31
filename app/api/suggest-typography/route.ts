/**
 * Typography Suggestions API Endpoint
 * AI-powered font recommendations using Claude Haiku 4.5
 */

import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { z } from 'zod'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { trackApiUsage } from '@/lib/services/api-usage'
import { calculateTokenCost } from '@/lib/config/ai-pricing'
import { buildTypographySuggestionPrompt, isValidFontId, normalizeFontId, getFontFamilyList } from '@/lib/prompts/services/typography-suggestion-prompt'
import type {
  TypographySuggestion,
  TypographySuggestionRequest,
  TypographySuggestionResponse,
} from '@/types/typography-suggestions'

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY || '')
const GEMINI_MODEL = 'gemini-2.0-flash'

// In-memory cache for typography suggestions
// TODO: This won't work properly in serverless environments (Vercel, AWS Lambda, etc.)
// where each request may run on a different instance. Consider using:
// - Redis or Vercel KV for distributed caching
// - Next.js unstable_cache with appropriate revalidation
// - Remove caching if not critical for performance
// For now, this provides basic caching in development and single-instance deployments
const typographyCache = new Map<
  string,
  { data: TypographySuggestion; timestamp: number }
>()

// Cache TTL: 5 minutes
const CACHE_TTL = 5 * 60 * 1000

// Rate limiting: 20 requests per minute per user
// TODO: Same serverless limitation as cache above - consider distributed solution
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT = 20
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute

// Cleanup expired cache entries every 5 minutes
// TODO: setInterval won't work in serverless - cleanup happens on module load only
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of typographyCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      typographyCache.delete(key)
    }
  }
}, CACHE_TTL)

// Zod validation schema for typography suggestion request (CLAUDE.md compliance)
const typographyContextSchema = z.object({
  eventType: z.string().min(1, 'Event type is required'),
  verticalSlug: z.string().min(1, 'Vertical slug is required'),
  formatId: z.string().min(1, 'Format ID is required'),
  audience: z.string().optional(),
  brandColors: z.array(z.string()).optional(),
  hasSpeakerPhoto: z.boolean().optional(),
  // formData removed - not used by typography prompt builder
  // (all required data is extracted to individual fields in hook)
})

const typographySuggestionRequestSchema = z.object({
  context: typographyContextSchema,
  targetLevel: z.enum(['AA', 'AAA']).optional(),
})

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
  // Declare context at function scope for error logging access
  let context: z.infer<typeof typographyContextSchema> | undefined

  try {
    // Parse and validate request body with Zod (CLAUDE.md compliance)
    const rawBody = await req.json()
    const validationResult = typographySuggestionRequestSchema.safeParse(rawBody)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid request: ${validationResult.error.issues.map(e => e.message).join(', ')}`,
        } as TypographySuggestionResponse,
        { status: 400 }
      )
    }

    const body = validationResult.data
    context = body.context

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

    // Call Gemini 2.0 Flash
    const startTime = Date.now()
    const model = genAI.getGenerativeModel({
      model: GEMINI_MODEL,
      generationConfig: {
        temperature: 0.3,
        responseMimeType: 'application/json',
      },
    })

    const result = await model.generateContent(prompt)
    const response = result.response
    const duration = Date.now() - startTime

    // Extract response
    const jsonText = response.text()
    if (!jsonText) {
      throw new Error('Empty response from Gemini API')
    }

    // Parse JSON response
    let suggestion: any
    try {
      const parsed = JSON.parse(jsonText.trim())
      // Handle if AI returns an array instead of single object (take first element)
      suggestion = Array.isArray(parsed) ? parsed[0] : parsed
    } catch (parseError) {
      console.error('[Typography API] Failed to parse Gemini response:', {
        error: parseError instanceof Error ? parseError.message : String(parseError),
        rawResponse: jsonText.substring(0, 500),
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
        const usageMetadata = response.usageMetadata
        const inputTokens = usageMetadata?.promptTokenCount || 0
        const outputTokens = usageMetadata?.candidatesTokenCount || 0

        await trackApiUsage({
          organizationId: orgMember.organization_id,
          userId: user.id,
          provider: 'gemini',
          model: GEMINI_MODEL,
          requestType: 'typography_suggestion',
          inputTokens,
          outputTokens,
          estimatedCostUsd: calculateTokenCost(
            'gemini',
            GEMINI_MODEL,
            inputTokens,
            outputTokens
          ),
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
    // Enhanced error logging for debugging
    console.error('[Typography API] Detailed error:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      context: context ? {
        eventType: context.eventType,
        verticalSlug: context.verticalSlug,
        formatId: context.formatId,
        hasAudience: !!context.audience,
        hasBrandColors: !!context.brandColors,
      } : 'Context not available',
    })

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

// Removed duplicate calculateCost function - now using shared utility from @/lib/config/ai-pricing
