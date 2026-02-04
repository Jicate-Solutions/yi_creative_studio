import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import {
  FIELD_EXTRACTION_SYSTEM_PROMPT,
  buildExtractionPrompt,
  normalizeExtractedDate,
  normalizeExtractedTime,
  generateExtractionWarnings,
} from '@/lib/prompts/extract-fields-prompt'
import {
  FIELD_LABELS,
  EXTRACTION_CONFIG,
} from '@/types/extraction.types'
import type {
  ExtractFieldsRequest,
  ExtractionResult,
  ExtractFieldsError,
  ExtractedField,
  ExtractedSpeaker,
} from '@/types/extraction.types'

// Simple in-memory rate limiting
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = EXTRACTION_CONFIG.rateLimitPerMinute
const RATE_WINDOW = 60 * 1000 // 1 minute
const CLEANUP_INTERVAL = 5 * 60 * 1000

// Simple in-memory cache
const extractionCache = new Map<
  string,
  { data: ExtractionResult; expiresAt: number }
>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// Cleanup expired entries
let lastCleanup = Date.now()
function cleanupExpiredEntries(): void {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return

  lastCleanup = now
  for (const [key, value] of rateLimitMap.entries()) {
    if (value.resetAt < now) {
      rateLimitMap.delete(key)
    }
  }
  for (const [key, value] of extractionCache.entries()) {
    if (value.expiresAt < now) {
      extractionCache.delete(key)
    }
  }
}

function getCacheKey(rawText: string): string {
  // Normalize text for caching: lowercase, collapse whitespace, take first 500 chars
  const normalized = rawText
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .substring(0, 500)
  // Simple hash for cache key
  let hash = 0
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return `extract:${hash}`
}

function getCachedExtraction(key: string): ExtractionResult | null {
  cleanupExpiredEntries()
  const cached = extractionCache.get(key)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data
  }
  extractionCache.delete(key)
  return null
}

function setCachedExtraction(key: string, data: ExtractionResult): void {
  extractionCache.set(key, {
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
        } as ExtractFieldsError,
        { status: 401 }
      )
    }

    // 2. Rate limiting
    const rateLimitKey = `extract:${user.id}`
    const now = Date.now()
    const rateLimit = rateLimitMap.get(rateLimitKey)

    if (rateLimit && rateLimit.resetAt > now) {
      if (rateLimit.count >= RATE_LIMIT) {
        return NextResponse.json(
          {
            success: false,
            error: 'Too many extraction requests. Please wait a moment.',
            code: 'RATE_LIMITED',
          } as ExtractFieldsError,
          { status: 429 }
        )
      }
      rateLimit.count++
    } else {
      rateLimitMap.set(rateLimitKey, { count: 1, resetAt: now + RATE_WINDOW })
    }

    // 3. Parse and validate request
    const body: ExtractFieldsRequest = await request.json()

    if (!body.rawText || body.rawText.trim().length < EXTRACTION_CONFIG.minTextLength) {
      return NextResponse.json(
        {
          success: false,
          error: `Please provide at least ${EXTRACTION_CONFIG.minTextLength} characters of text`,
          code: 'TEXT_TOO_SHORT',
        } as ExtractFieldsError,
        { status: 400 }
      )
    }

    if (body.rawText.length > EXTRACTION_CONFIG.maxTextLength) {
      return NextResponse.json(
        {
          success: false,
          error: `Text is too long. Maximum ${EXTRACTION_CONFIG.maxTextLength} characters allowed.`,
          code: 'VALIDATION_ERROR',
        } as ExtractFieldsError,
        { status: 400 }
      )
    }

    // 4. Check cache first
    const cacheKey = getCacheKey(body.rawText)
    const cachedResult = getCachedExtraction(cacheKey)

    if (cachedResult) {
      // Update metadata for cached response
      return NextResponse.json({
        ...cachedResult,
        metadata: {
          ...cachedResult.metadata,
          processingTimeMs: Date.now() - startTime,
          cached: true,
        },
      } as ExtractionResult)
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
        } as ExtractFieldsError,
        { status: 403 }
      )
    }

    // 6. Get vertical details if provided
    let verticalName: string | undefined
    if (body.verticalSlug) {
      const { data: vertical } = await supabase
        .from('vertical_presets')
        .select('name')
        .eq('slug', body.verticalSlug)
        .single()
      verticalName = vertical?.name
    }

    // 7. Build AI prompt
    const prompt = buildExtractionPrompt({
      rawText: body.rawText.trim(),
      verticalSlug: body.verticalSlug,
      verticalName,
      formatId: body.formatId,
    })

    // 8. Call Claude API with timeout
    const extractionData = await callClaudeForExtraction(
      prompt,
      EXTRACTION_CONFIG.timeoutMs
    )

    // 9. Post-process and validate extracted data
    const processedFields = processExtractedFields(extractionData.fields || [])
    const processedSpeakers = processExtractedSpeakers(extractionData.speakers || [])

    // 10. Generate warnings
    const warnings = [
      ...(extractionData.warnings || []),
      ...generateExtractionWarnings(processedFields),
    ]

    // 11. Build response
    const result: ExtractionResult = {
      success: true,
      fields: processedFields,
      speakers: processedSpeakers,
      metadata: {
        model: 'claude-haiku-4-5',
        processingTimeMs: Date.now() - startTime,
        rawTextLength: body.rawText.length,
        confidence: calculateOverallConfidence(processedFields),
      },
      warnings: warnings.length > 0 ? warnings : undefined,
    }

    // 12. Cache the result
    setCachedExtraction(cacheKey, result)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Extract fields error:', error)

    if (error instanceof Error && error.message === 'AI_TIMEOUT') {
      return NextResponse.json(
        {
          success: false,
          error: 'Extraction timed out. Try with shorter text.',
          code: 'TIMEOUT',
        } as ExtractFieldsError,
        { status: 504 }
      )
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Detailed error:', errorMessage)

    return NextResponse.json(
      {
        success: false,
        error: `Failed to extract fields: ${errorMessage}`,
        code: 'AI_ERROR',
      } as ExtractFieldsError,
      { status: 500 }
    )
  }
}

interface RawExtractionData {
  fields?: Array<{
    fieldId: string
    value: string
    confidence: number
  }>
  speakers?: Array<{
    name: string
    designation?: string
    organization?: string
    confidence: number
  }>
  warnings?: string[]
}

async function callClaudeForExtraction(
  prompt: string,
  timeoutMs: number
): Promise<RawExtractionData> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('Anthropic API key not configured')
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const client = new Anthropic({ apiKey })

    const responsePromise = client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 2048,
      temperature: 0.3, // Lower temperature for more accurate extraction
      system:
        FIELD_EXTRACTION_SYSTEM_PROMPT +
        '\n\nIMPORTANT: Respond with valid JSON only. No markdown, no code blocks, just raw JSON.',
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
    return parsed as RawExtractionData
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.message === 'AI_TIMEOUT') {
      throw error
    }
    throw error
  }
}

function processExtractedFields(
  rawFields: Array<{ fieldId: string; value: string; confidence: number }>
): ExtractedField[] {
  return rawFields
    .filter((f) => f.value && f.confidence >= 0.2) // Filter out very low confidence
    .map((f) => {
      let value = f.value

      // Normalize dates
      if (f.fieldId.toLowerCase().includes('date')) {
        const normalized = normalizeExtractedDate(value)
        if (normalized) value = normalized
      }

      // Normalize times
      if (f.fieldId.toLowerCase().includes('time')) {
        const normalized = normalizeExtractedTime(value)
        if (normalized) value = normalized
      }

      return {
        fieldId: f.fieldId,
        label: FIELD_LABELS[f.fieldId] || formatFieldId(f.fieldId),
        value,
        confidence: Math.max(0, Math.min(1, f.confidence)),
        needsReview: f.confidence < 0.6,
      }
    })
}

function processExtractedSpeakers(
  rawSpeakers: Array<{
    name: string
    designation?: string
    organization?: string
    confidence: number
  }>
): ExtractedSpeaker[] {
  return rawSpeakers
    .filter((s) => s.name && s.confidence >= 0.3)
    .map((s) => ({
      name: s.name,
      designation: s.designation || s.organization,
      confidence: Math.max(0, Math.min(1, s.confidence)),
    }))
}

function calculateOverallConfidence(fields: ExtractedField[]): number {
  if (fields.length === 0) return 0
  const sum = fields.reduce((acc, f) => acc + f.confidence, 0)
  return Math.round((sum / fields.length) * 100) / 100
}

function formatFieldId(fieldId: string): string {
  return fieldId
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim()
}
