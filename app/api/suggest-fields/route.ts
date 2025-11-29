import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  FIELD_SUGGESTION_SYSTEM_PROMPT,
  buildFieldSuggestionPrompt,
  getVerticalContext,
} from '@/lib/prompts/suggest-fields-prompt'
import type {
  SuggestFieldsRequest,
  SuggestFieldsResponse,
  SuggestFieldsError,
  FieldSuggestion,
} from '@/types/suggestions'

// Simple in-memory rate limiting (use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 20 // requests per minute per user
const RATE_WINDOW = 60 * 1000 // 1 minute

// Simple in-memory cache for suggestions
const suggestionCache = new Map<
  string,
  { data: SuggestFieldsResponse['suggestions']; expiresAt: number }
>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

function getCacheKey(title: string, verticalSlug: string): string {
  const normalizedTitle = title.toLowerCase().trim().replace(/\s+/g, ' ')
  return `${verticalSlug}:${normalizedTitle}`
}

function getCachedSuggestion(key: string) {
  const cached = suggestionCache.get(key)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data
  }
  suggestionCache.delete(key)
  return null
}

function setCachedSuggestion(
  key: string,
  data: SuggestFieldsResponse['suggestions']
) {
  suggestionCache.set(key, {
    data,
    expiresAt: Date.now() + CACHE_TTL,
  })
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const supabase = await createClient()

    // 1. Verify authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          code: 'UNAUTHORIZED',
        } as SuggestFieldsError,
        { status: 401 }
      )
    }

    // 2. Rate limiting
    const rateLimitKey = `suggest:${user.id}`
    const now = Date.now()
    const rateLimit = rateLimitMap.get(rateLimitKey)

    if (rateLimit && rateLimit.resetAt > now) {
      if (rateLimit.count >= RATE_LIMIT) {
        return NextResponse.json(
          {
            success: false,
            error: 'Too many requests. Please wait a moment.',
            code: 'RATE_LIMITED',
          } as SuggestFieldsError,
          { status: 429 }
        )
      }
      rateLimit.count++
    } else {
      rateLimitMap.set(rateLimitKey, { count: 1, resetAt: now + RATE_WINDOW })
    }

    // 3. Parse and validate request
    const body: SuggestFieldsRequest = await request.json()

    if (!body.title || body.title.trim().length < 3) {
      return NextResponse.json(
        {
          success: false,
          error: 'Title must be at least 3 characters',
          code: 'VALIDATION_ERROR',
        } as SuggestFieldsError,
        { status: 400 }
      )
    }

    if (!body.verticalSlug) {
      return NextResponse.json(
        {
          success: false,
          error: 'Vertical is required',
          code: 'VALIDATION_ERROR',
        } as SuggestFieldsError,
        { status: 400 }
      )
    }

    // 4. Check cache first
    const cacheKey = getCacheKey(body.title, body.verticalSlug)
    const cachedSuggestions = getCachedSuggestion(cacheKey)

    if (cachedSuggestions) {
      const response: SuggestFieldsResponse = {
        success: true,
        suggestions: cachedSuggestions,
        metadata: {
          model: 'gemini-2.0-flash',
          processingTimeMs: Date.now() - startTime,
          cached: true,
        },
      }
      return NextResponse.json(response)
    }

    // 5. Verify organization membership
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', body.organizationId)
      .single()

    if (!membership) {
      return NextResponse.json(
        {
          success: false,
          error: 'Organization access denied',
          code: 'UNAUTHORIZED',
        } as SuggestFieldsError,
        { status: 403 }
      )
    }

    // 6. Get vertical details
    const { data: vertical } = await supabase
      .from('vertical_presets')
      .select('name, description, slug')
      .eq('slug', body.verticalSlug)
      .single()

    // Use vertical context even if not found in DB
    const verticalContext = getVerticalContext(body.verticalSlug)
    const verticalName = vertical?.name || formatVerticalSlug(body.verticalSlug)
    const verticalDescription = vertical?.description || ''

    // 7. Get organization name for context
    const { data: organization } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', body.organizationId)
      .single()

    // 8. Build AI prompt
    const prompt = buildFieldSuggestionPrompt({
      title: body.title.trim(),
      verticalName,
      verticalDescription,
      organizationType: body.organizationType,
      organizationName: organization?.name,
      existingFields: body.existingFields,
    })

    // 9. Call Gemini API with timeout
    const suggestions = await callGeminiWithTimeout(prompt, 8000)

    // 10. Cache the result
    setCachedSuggestion(cacheKey, suggestions)

    // 11. Return response
    const response: SuggestFieldsResponse = {
      success: true,
      suggestions,
      metadata: {
        model: 'gemini-2.0-flash',
        processingTimeMs: Date.now() - startTime,
        cached: false,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Suggest fields error:', error)

    if (error instanceof Error && error.message === 'AI_TIMEOUT') {
      return NextResponse.json(
        {
          success: false,
          error: 'AI suggestion timed out. Please try again.',
          code: 'TIMEOUT',
        } as SuggestFieldsError,
        { status: 504 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate suggestions',
        code: 'AI_ERROR',
      } as SuggestFieldsError,
      { status: 500 }
    )
  }
}

async function callGeminiWithTimeout(
  prompt: string,
  timeoutMs: number
): Promise<SuggestFieldsResponse['suggestions']> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('Gemini API key not configured')
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                { text: FIELD_SUGGESTION_SYSTEM_PROMPT + '\n\n' + prompt },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topP: 0.8,
            topK: 40,
            maxOutputTokens: 1024,
            responseMimeType: 'application/json',
          },
        }),
      }
    )

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Gemini API error:', errorText)
      throw new Error('Gemini API request failed')
    }

    const data = await response.json()
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!textContent) {
      throw new Error('No text content in Gemini response')
    }

    // Parse JSON response - handle potential markdown wrapping
    let jsonText = textContent.trim()
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\n?/, '').replace(/\n?```$/, '')
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\n?/, '').replace(/\n?```$/, '')
    }

    const parsed = JSON.parse(jsonText)

    // Validate and transform the response
    const suggestions: SuggestFieldsResponse['suggestions'] = {}

    const fields = ['date', 'time', 'venue', 'speaker', 'description'] as const

    for (const field of fields) {
      const suggestion = parsed.suggestions?.[field]
      if (suggestion && typeof suggestion.value === 'string') {
        suggestions[field] = {
          value: suggestion.value,
          confidence:
            typeof suggestion.confidence === 'number'
              ? Math.max(0, Math.min(1, suggestion.confidence))
              : 0.5,
          reasoning: suggestion.reasoning,
        }
      }
    }

    return suggestions
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('AI_TIMEOUT')
    }
    throw error
  }
}

function formatVerticalSlug(slug: string): string {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
