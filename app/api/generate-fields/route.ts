/**
 * Dynamic Field Generation API Route
 * Uses Claude Haiku with context caching for cost-effective AI field generation
 *
 * POST /api/generate-fields
 * Body: { formatId, verticalSlug, organizationId? }
 * Response: { success, schema, cached, metadata }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  claudeCacheManager,
  getCacheKey,
} from '@/lib/claude/cache-manager'
import {
  FIELD_GENERATION_SYSTEM_PROMPT,
  buildFieldGenerationPrompt,
  validateGeneratedSchema,
  getDefaultSchemaForFormat,
  type GeneratedSchema,
  type GenerateFieldsInput,
} from '@/lib/prompts/generate-fields-prompt'

// ============================================================================
// Types
// ============================================================================

interface GenerateFieldsRequest {
  formatId: string
  verticalSlug: string
  organizationId?: string
  organizationType?: string
}

interface GenerateFieldsResponse {
  success: true
  schema: GeneratedSchema
  metadata: {
    model: string
    processingTimeMs: number
    cached: boolean
    cacheKey: string
  }
}

interface GenerateFieldsError {
  success: false
  error: string
  code: 'UNAUTHORIZED' | 'VALIDATION_ERROR' | 'AI_ERROR' | 'TIMEOUT' | 'FALLBACK' | 'RATE_LIMITED'
  fallbackSchema?: GeneratedSchema
}

// ============================================================================
// Rate Limiting (simple in-memory for dev, use Redis in production)
// ============================================================================

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 30 // requests per minute per user
const RATE_WINDOW = 60 * 1000 // 1 minute
const CLEANUP_INTERVAL = 5 * 60 * 1000 // Clean up every 5 minutes

// Cleanup expired entries to prevent memory leak
let lastCleanup = Date.now()
function cleanupExpiredEntries(): void {
  const now = Date.now()
  // Only run cleanup if enough time has passed
  if (now - lastCleanup < CLEANUP_INTERVAL) return

  lastCleanup = now
  for (const [key, value] of rateLimitMap.entries()) {
    if (value.resetAt < now) {
      rateLimitMap.delete(key)
    }
  }
}

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const key = `generate-fields:${userId}`

  // Periodically clean up expired entries
  cleanupExpiredEntries()

  const rateLimit = rateLimitMap.get(key)

  if (rateLimit && rateLimit.resetAt > now) {
    if (rateLimit.count >= RATE_LIMIT) {
      return false
    }
    rateLimit.count++
  } else {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_WINDOW })
  }

  return true
}

// ============================================================================
// API Handler
// ============================================================================

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
        } as GenerateFieldsError,
        { status: 401 }
      )
    }

    // 2. Rate limiting
    if (!checkRateLimit(user.id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many requests. Please wait a moment.',
          code: 'RATE_LIMITED',
        } as GenerateFieldsError,
        { status: 429 }
      )
    }

    // 3. Parse and validate request
    const body: GenerateFieldsRequest = await request.json()

    if (!body.formatId || typeof body.formatId !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Format ID is required',
          code: 'VALIDATION_ERROR',
        } as GenerateFieldsError,
        { status: 400 }
      )
    }

    if (!body.verticalSlug || typeof body.verticalSlug !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Vertical slug is required',
          code: 'VALIDATION_ERROR',
        } as GenerateFieldsError,
        { status: 400 }
      )
    }

    // 4. Get vertical details from database (optional enhancement)
    let verticalName = body.verticalSlug
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
    let verticalDescription = ''

    const { data: vertical } = await supabase
      .from('vertical_presets')
      .select('name, description')
      .eq('slug', body.verticalSlug)
      .single()

    if (vertical) {
      verticalName = vertical.name || verticalName
      verticalDescription = vertical.description || ''
    }

    // 5. Build cache key
    const cacheKey = getCacheKey(body.formatId, body.verticalSlug)

    // 6. Build prompts
    const input: GenerateFieldsInput = {
      formatId: body.formatId,
      verticalSlug: body.verticalSlug,
      verticalName,
      verticalDescription,
      organizationType: body.organizationType,
    }

    const userPrompt = buildFieldGenerationPrompt(input)

    // 7. Generate with Claude Haiku (with timeout and caching)
    try {
      const result = await claudeCacheManager.generateContentWithTimeout<GeneratedSchema>(
        FIELD_GENERATION_SYSTEM_PROMPT,
        userPrompt,
        12000, // 12 second timeout (increased from 8s to handle cold starts)
        {
          temperature: 0.7,
          maxTokens: 2048,
          cacheKey,
        }
      )

      // 8. Validate the generated schema
      const validatedSchema = validateGeneratedSchema(result.data)

      if (!validatedSchema) {
        console.error('Invalid schema generated:', result.data)
        // Return fallback schema
        const fallbackSchema = getDefaultSchemaForFormat(body.formatId)
        return NextResponse.json(
          {
            success: false,
            error: 'Generated schema was invalid, using fallback',
            code: 'FALLBACK',
            fallbackSchema,
          } as GenerateFieldsError,
          { status: 200 } // Still 200 because we have usable data
        )
      }

      // 9. Return success response
      const response: GenerateFieldsResponse = {
        success: true,
        schema: validatedSchema,
        metadata: {
          model: 'claude-haiku-4-5',
          processingTimeMs: Date.now() - startTime,
          cached: result.cached,
          cacheKey,
        },
      }

      return NextResponse.json(response)
    } catch (aiError) {
      console.error('AI generation error:', aiError)

      // Check if it's a timeout
      if (aiError instanceof Error && aiError.message === 'AI_TIMEOUT') {
        const fallbackSchema = getDefaultSchemaForFormat(body.formatId)
        return NextResponse.json(
          {
            success: false,
            error: 'AI generation timed out, using fallback schema',
            code: 'TIMEOUT',
            fallbackSchema,
          } as GenerateFieldsError,
          { status: 200 }
        )
      }

      // Other AI errors - return fallback
      const fallbackSchema = getDefaultSchemaForFormat(body.formatId)
      return NextResponse.json(
        {
          success: false,
          error: 'AI generation failed, using fallback schema',
          code: 'AI_ERROR',
          fallbackSchema,
        } as GenerateFieldsError,
        { status: 200 }
      )
    }
  } catch (error) {
    console.error('Generate fields error:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    return NextResponse.json(
      {
        success: false,
        error: `Failed to generate fields: ${errorMessage}`,
        code: 'AI_ERROR',
      } as GenerateFieldsError,
      { status: 500 }
    )
  }
}

// ============================================================================
// GET - Check cache status (optional utility endpoint)
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Return cache stats
    const stats = claudeCacheManager.getCacheStats()

    return NextResponse.json({
      success: true,
      cacheStats: stats,
      isInitialized: claudeCacheManager.isInitialized(),
    })
  } catch (error) {
    console.error('Get cache stats error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get cache stats' },
      { status: 500 }
    )
  }
}
