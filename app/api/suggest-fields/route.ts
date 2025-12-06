import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
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
const CLEANUP_INTERVAL = 5 * 60 * 1000 // Clean up every 5 minutes

// Simple in-memory cache for suggestions
const suggestionCache = new Map<
  string,
  { data: SuggestFieldsResponse['suggestions']; expiresAt: number }
>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// Cleanup expired entries to prevent memory leak
let lastCleanup = Date.now()
function cleanupExpiredEntries(): void {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return

  lastCleanup = now
  // Clean up rate limit entries
  for (const [key, value] of rateLimitMap.entries()) {
    if (value.resetAt < now) {
      rateLimitMap.delete(key)
    }
  }
  // Clean up cache entries
  for (const [key, value] of suggestionCache.entries()) {
    if (value.expiresAt < now) {
      suggestionCache.delete(key)
    }
  }
}

function getCacheKey(title: string, verticalSlug: string): string {
  const normalizedTitle = title.toLowerCase().trim().replace(/\s+/g, ' ')
  return `${verticalSlug}:${normalizedTitle}`
}

function getCachedSuggestion(key: string) {
  // Periodically clean up expired entries
  cleanupExpiredEntries()

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
          model: 'claude-haiku-4-5-20251001',
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

    // 9. Call Claude API with timeout
    const suggestions = await callClaudeWithTimeout(prompt, 8000)

    // 10. Cache the result
    setCachedSuggestion(cacheKey, suggestions)

    // 11. Return response
    const response: SuggestFieldsResponse = {
      success: true,
      suggestions,
      metadata: {
        model: 'claude-haiku-4-5-20251001',
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

    // Provide more detailed error for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Detailed error:', errorMessage)

    return NextResponse.json(
      {
        success: false,
        error: `Failed to generate suggestions: ${errorMessage}`,
        code: 'AI_ERROR',
      } as SuggestFieldsError,
      { status: 500 }
    )
  }
}

async function callClaudeWithTimeout(
  prompt: string,
  timeoutMs: number
): Promise<SuggestFieldsResponse['suggestions']> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('Anthropic API key not configured')
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const client = new Anthropic({ apiKey })

    const responsePromise = client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      temperature: 0.7,
      system: FIELD_SUGGESTION_SYSTEM_PROMPT + '\n\nIMPORTANT: Respond with valid JSON only. No markdown, no code blocks, just raw JSON.',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    // Race between API call and timeout
    const response = await Promise.race([
      responsePromise,
      new Promise<never>((_, reject) => {
        controller.signal.addEventListener('abort', () => {
          reject(new Error('AI_TIMEOUT'))
        })
      }),
    ])

    clearTimeout(timeoutId)

    // Extract text content from response
    const textBlock = response.content.find((block) => block.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text content in Claude response')
    }

    const textContent = textBlock.text

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
    if (error instanceof Error && error.message === 'AI_TIMEOUT') {
      throw error
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
