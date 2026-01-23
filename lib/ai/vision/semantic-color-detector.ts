/**
 * Semantic Color Detector using Claude 3.5 Haiku Vision
 *
 * Analyzes event poster images to identify semantic color zones (background, text, accent)
 * for intelligent color shuffling while preserving gradients and visual structure.
 *
 * Features:
 * - Claude 3.5 Haiku Vision for semantic understanding
 * - Image downsampling (4x) for cost optimization
 * - Content zone focus (40%-70% of canvas)
 * - 7-day cache with 90% expected hit rate
 * - ~$0.001 per analysis
 */

import Anthropic from '@anthropic-ai/sdk'
import sharp from 'sharp'
import { createClient } from '@/lib/supabase/server'
import { trackApiUsage } from '@/lib/services/api-usage'
import type { Json } from '@/types/database.types'

// ============================================================
// TYPES
// ============================================================

export interface SemanticZone {
  role: 'background' | 'text' | 'accent'
  color: string // Hex color (e.g., "#005B96")
  coverage: number // Percentage of content zone (0-100)
  pattern: 'solid' | 'gradient' | 'textured'
  confidence: number // 0-1
  description: string
}

export interface ContentZoneBounds {
  topPercent: number // e.g., 40
  bottomPercent: number // e.g., 70
}

export interface ColorAnalysisResult {
  zones: SemanticZone[]
  contentZoneBounds: ContentZoneBounds
  detectionQuality: 'high' | 'medium' | 'low'
  reasoning: string
  cacheHit: boolean
  usage?: {
    model: string
    inputTokens: number
    outputTokens: number
    estimatedCostUsd: number
    durationMs: number
  }
}

interface ClaudeVisionResponse {
  zones: SemanticZone[]
  contentZoneBounds: ContentZoneBounds
  detectionQuality: 'high' | 'medium' | 'low'
  reasoning: string
}

// ============================================================
// CONSTANTS
// ============================================================

const MODEL = 'claude-3-5-haiku-20241022'
const CONTENT_ZONE_TOP_PERCENT = 40
const CONTENT_ZONE_BOTTOM_PERCENT = 70
const DOWNSAMPLE_WIDTH = 540 // 4x smaller for cost optimization
const DOWNSAMPLE_HEIGHT = 720
const CACHE_TTL_DAYS = 7

const VISION_PROMPT = `You are analyzing an event poster (1080x1440px) to identify color zones for intelligent recoloring.

CRITICAL: Analyze ONLY pixels between Y: ${Math.round(1440 * CONTENT_ZONE_TOP_PERCENT / 100)}px - ${Math.round(1440 * CONTENT_ZONE_BOTTOM_PERCENT / 100)}px (${CONTENT_ZONE_TOP_PERCENT}%-${CONTENT_ZONE_BOTTOM_PERCENT}% of canvas).
IGNORE: Top ${CONTENT_ZONE_TOP_PERCENT}% and bottom ${100 - CONTENT_ZONE_BOTTOM_PERCENT}% (logo bars with transparent overlays).

DETECT:
1. **Background zones** (>20% coverage, solid/gradient)
2. **Text zones** (readable text areas - headlines, body text, captions)
3. **Accent zones** (decorative elements, shapes, icons, borders)

For each zone, identify:
- Dominant color (hex code)
- Coverage percentage in content zone
- Pattern type (solid, gradient, textured)
- Confidence level (0-1)
- Brief description

RESPONSE FORMAT (JSON only, no markdown):
{
  "zones": [
    {
      "role": "background",
      "color": "#005B96",
      "coverage": 60,
      "pattern": "gradient",
      "confidence": 0.95,
      "description": "Blue gradient background spanning top to bottom"
    },
    {
      "role": "text",
      "color": "#FFFFFF",
      "coverage": 25,
      "pattern": "solid",
      "confidence": 0.90,
      "description": "White headline text in upper portion"
    },
    {
      "role": "accent",
      "color": "#FFD700",
      "coverage": 15,
      "pattern": "solid",
      "confidence": 0.85,
      "description": "Gold decorative elements and borders"
    }
  ],
  "contentZoneBounds": {
    "topPercent": ${CONTENT_ZONE_TOP_PERCENT},
    "bottomPercent": ${CONTENT_ZONE_BOTTOM_PERCENT}
  },
  "detectionQuality": "high",
  "reasoning": "Clear color separation with distinct background, text, and accent zones. High confidence in all detections."
}

IMPORTANT:
- Return ONLY valid JSON (no markdown, no code blocks)
- Include 1-4 zones (at least background, ideally text and accent too)
- Hex colors must start with #
- Coverage should sum to approximately 100%
- Detection quality: "high" if clear separation, "medium" if some ambiguity, "low" if very complex`

// ============================================================
// MAIN FUNCTION
// ============================================================

/**
 * Analyze image colors using Claude Haiku Vision
 * Checks cache first, falls back to API call if needed
 */
export async function analyzeImageColors(
  imageUrl: string,
  creativeId: string,
  organizationId: string,
  userId: string
): Promise<ColorAnalysisResult> {
  console.log('[Color Detector] Starting analysis for creative:', creativeId)

  // Check cache first
  const cachedResult = await getCachedAnalysis(creativeId)
  if (cachedResult) {
    console.log('[Color Detector] Cache hit! Skipping API call')
    return {
      ...cachedResult,
      cacheHit: true
    }
  }

  console.log('[Color Detector] Cache miss, calling Claude Haiku Vision...')

  const startTime = Date.now()

  try {
    // Download and process image
    const imageBuffer = await downloadImage(imageUrl)
    const processedImage = await preprocessImage(imageBuffer)

    // Call Claude Vision API
    const visionResult = await callClaudeVision(processedImage.base64)
    const durationMs = Date.now() - startTime

    // Calculate cost (using Haiku Vision pricing)
    const estimatedCostUsd = calculateCost(
      visionResult.inputTokens,
      visionResult.outputTokens
    )

    // Cache the result
    await cacheAnalysis(
      creativeId,
      imageUrl,
      visionResult.analysis,
      MODEL,
      visionResult.inputTokens,
      visionResult.outputTokens,
      estimatedCostUsd
    )

    // Track API usage
    await trackApiUsage({
      provider: 'claude',
      model: MODEL,
      requestType: 'color_analysis',
      inputTokens: visionResult.inputTokens,
      outputTokens: visionResult.outputTokens,
      cachedTokens: 0,
      estimatedCostUsd,
      durationMs,
      success: true,
      organizationId,
      userId,
      creativeId,
      metadata: {
        imageUrl,
        downsampledSize: `${DOWNSAMPLE_WIDTH}x${DOWNSAMPLE_HEIGHT}`,
        contentZone: `${CONTENT_ZONE_TOP_PERCENT}%-${CONTENT_ZONE_BOTTOM_PERCENT}%`,
        zonesDetected: visionResult.analysis.zones.length
      }
    })

    console.log('[Color Detector] Analysis complete:', {
      zones: visionResult.analysis.zones.length,
      quality: visionResult.analysis.detectionQuality,
      cost: estimatedCostUsd.toFixed(4),
      durationMs
    })

    return {
      ...visionResult.analysis,
      cacheHit: false,
      usage: {
        model: MODEL,
        inputTokens: visionResult.inputTokens,
        outputTokens: visionResult.outputTokens,
        estimatedCostUsd,
        durationMs
      }
    }
  } catch (error) {
    const durationMs = Date.now() - startTime

    console.error('[Color Detector] Error:', error)

    // Track failed API usage
    await trackApiUsage({
      provider: 'claude',
      model: MODEL,
      requestType: 'color_analysis',
      inputTokens: 0,
      outputTokens: 0,
      cachedTokens: 0,
      estimatedCostUsd: 0,
      durationMs,
      success: false,
      organizationId,
      userId,
      creativeId,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      metadata: { imageUrl }
    })

    throw error
  }
}

// ============================================================
// IMAGE PROCESSING
// ============================================================

async function downloadImage(url: string): Promise<Buffer> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`)
  }
  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

async function preprocessImage(imageBuffer: Buffer): Promise<{
  base64: string
  width: number
  height: number
}> {
  // Downsample to 540x720 (4x smaller) for cost optimization
  const resized = await sharp(imageBuffer)
    .resize(DOWNSAMPLE_WIDTH, DOWNSAMPLE_HEIGHT, {
      fit: 'cover',
      position: 'center'
    })
    .jpeg({ quality: 85 })
    .toBuffer()

  const base64 = resized.toString('base64')

  return {
    base64,
    width: DOWNSAMPLE_WIDTH,
    height: DOWNSAMPLE_HEIGHT
  }
}

// ============================================================
// CLAUDE VISION API
// ============================================================

async function callClaudeVision(base64Image: string): Promise<{
  analysis: ClaudeVisionResponse
  inputTokens: number
  outputTokens: number
}> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured')
  }

  const client = new Anthropic({ apiKey })

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1000,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: base64Image
            }
          },
          {
            type: 'text',
            text: VISION_PROMPT
          }
        ]
      }
    ]
  })

  const textBlock = response.content.find(block => block.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from Claude Vision')
  }

  const text = textBlock.text.trim()

  // Parse JSON response
  let analysis: ClaudeVisionResponse
  try {
    // Remove markdown code blocks if present
    const jsonText = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
    analysis = JSON.parse(jsonText)
  } catch (parseError) {
    console.error('[Color Detector] Failed to parse Claude response:', text)
    throw new Error('Failed to parse Claude Vision response as JSON')
  }

  // Validate response structure
  if (!analysis.zones || !Array.isArray(analysis.zones) || analysis.zones.length === 0) {
    throw new Error('Invalid Claude Vision response: missing or empty zones array')
  }

  return {
    analysis,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens
  }
}

// ============================================================
// CACHING
// ============================================================

async function getCachedAnalysis(creativeId: string): Promise<ClaudeVisionResponse | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('color_analysis_cache')
    .select('*')
    .eq('creative_id', creativeId)
    .eq('status', 'completed')
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  if (error) {
    console.error('[Color Detector] Cache fetch error:', error)
    return null
  }

  if (!data) {
    return null
  }

  return {
    zones: data.detected_zones as unknown as SemanticZone[],
    contentZoneBounds: data.content_zone_bounds as unknown as ContentZoneBounds,
    detectionQuality: (data.analysis_result as any).detectionQuality || 'medium',
    reasoning: (data.analysis_result as any).reasoning || 'Cached result'
  }
}

async function cacheAnalysis(
  creativeId: string,
  imageUrl: string,
  analysis: ClaudeVisionResponse,
  model: string,
  inputTokens: number,
  outputTokens: number,
  estimatedCostUsd: number
): Promise<void> {
  const supabase = await createClient()

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + CACHE_TTL_DAYS)

  const { error } = await supabase
    .from('color_analysis_cache')
    .upsert({
      creative_id: creativeId,
      image_url: imageUrl,
      analysis_result: analysis as unknown as Json,
      detected_zones: analysis.zones as unknown as Json,
      content_zone_bounds: analysis.contentZoneBounds as unknown as Json,
      model_used: model,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      estimated_cost_usd: estimatedCostUsd,
      status: 'completed',
      expires_at: expiresAt.toISOString()
    }, {
      onConflict: 'creative_id'
    })

  if (error) {
    console.error('[Color Detector] Cache save error:', error)
    // Don't throw - caching failure shouldn't break the analysis
  }
}

// ============================================================
// COST CALCULATION
// ============================================================

/**
 * Calculate cost using Claude Haiku Vision pricing
 * Input: $0.80 per MTok
 * Output: $4.00 per MTok
 * (Prices as of Jan 2025)
 */
function calculateCost(inputTokens: number, outputTokens: number): number {
  const INPUT_COST_PER_MTOK = 0.80
  const OUTPUT_COST_PER_MTOK = 4.00

  const inputCost = (inputTokens / 1_000_000) * INPUT_COST_PER_MTOK
  const outputCost = (outputTokens / 1_000_000) * OUTPUT_COST_PER_MTOK

  return inputCost + outputCost
}
