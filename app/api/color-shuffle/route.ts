/**
 * Color Shuffle API Endpoint
 *
 * Generates multiple color variants of a creative using semantic color detection
 * and HSL-based recoloring. Returns variants as base64 data URLs (not saved to DB).
 *
 * POST /api/color-shuffle
 * Body: { creativeId: string, variantCount?: number, forceReanalysis?: boolean }
 * Response: { variants: [...], analysisUsed: {...} }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { analyzeImageColors } from '@/lib/ai/vision/semantic-color-detector'
import { generateColorCombinations, generateFallbackMapping } from '@/lib/utils/color-mapping'
import { recolorImageBatch } from '@/lib/sharp/semantic-recoloring'
import { COLOR_PALETTES } from '@/lib/config/design-constants'
import { z } from 'zod'

// ============================================================
// REQUEST VALIDATION
// ============================================================

const RequestSchema = z.object({
  creativeId: z.string().uuid(),
  variantCount: z.number().int().min(1).max(10).default(5),
  forceReanalysis: z.boolean().default(false)
})

// ============================================================
// HANDLER
// ============================================================

export async function POST(request: NextRequest) {
  console.log('[Color Shuffle API] Request received')
  const startTime = Date.now()

  try {
    // Parse and validate request body
    const body = await request.json()
    const { creativeId, variantCount, forceReanalysis } = RequestSchema.parse(body)

    // Authenticate user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch creative and verify ownership
    const { data: creative, error: creativeError } = await supabase
      .from('creatives')
      .select('*, organization_id')
      .eq('id', creativeId)
      .single()

    if (creativeError || !creative) {
      return NextResponse.json(
        { error: 'Creative not found' },
        { status: 404 }
      )
    }

    // Verify user belongs to organization
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', creative.organization_id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!membership) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    console.log('[Color Shuffle API] User authorized for creative:', creativeId)

    // Extract user colors from form_data
    const userColors = extractUserColors(creative.form_data)
    if (!userColors) {
      // Detect if this is a legacy creative (flat structure with direct fields)
      const hasDesignData = !!(creative.form_data as any)?.designData
      const hasDirectFields = !!(creative.form_data as any)?.title || !!(creative.form_data as any)?.date
      const isLegacyCreative = !hasDesignData && hasDirectFields

      return NextResponse.json(
        {
          error: 'No custom or preset colors found',
          message: isLegacyCreative
            ? 'This creative was generated before color shuffle support was added.'
            : 'Color shuffle requires custom colors or a color palette. Brand colors are not supported.',
          hint: isLegacyCreative
            ? 'Please regenerate this creative with custom colors to enable color shuffling.'
            : 'Please regenerate this creative with custom colors or select a color palette.',
          isLegacyCreative,
          debugInfo: {
            hasFormData: !!creative.form_data,
            hasDesignData,
            hasColorConfig: !!(creative.form_data as any)?.designData?.colorConfig,
            useBrandColors: !!(creative.form_data as any)?.designData?.colorConfig?.useBrandColors,
            formDataKeys: creative.form_data ? Object.keys(creative.form_data).slice(0, 5) : []
          }
        },
        { status: 400 }
      )
    }

    console.log('[Color Shuffle API] User colors:', userColors)

    // Analyze image colors (with caching)
    let analysisResult
    try {
      if (forceReanalysis) {
        console.log('[Color Shuffle API] Force reanalysis requested, skipping cache')
        // Delete cache first
        await supabase
          .from('color_analysis_cache')
          .delete()
          .eq('creative_id', creativeId)
      }

      analysisResult = await analyzeImageColors(
        creative.image_url,
        creativeId,
        creative.organization_id,
        user.id
      )
    } catch (analysisError) {
      console.error('[Color Shuffle API] Analysis failed:', analysisError)

      // Try fallback mapping without semantic analysis
      console.log('[Color Shuffle API] Using fallback mapping')
      const fallbackMappings = generateFallbackMapping(userColors)

      return NextResponse.json(
        {
          success: false,
          error: 'Color analysis unavailable',
          fallbackUsed: true,
          analysisError: analysisError instanceof Error ? analysisError.message : 'Unknown error'
        },
        { status: 500 }
      )
    }

    console.log('[Color Shuffle API] Detected zones:', {
      count: analysisResult.zones.length,
      quality: analysisResult.detectionQuality,
      cacheHit: analysisResult.cacheHit
    })

    // Generate color combinations
    const combinations = generateColorCombinations(
      userColors,
      analysisResult.zones,
      variantCount
    )

    console.log('[Color Shuffle API] Generated', combinations.length, 'combinations')

    // Download original image
    const imageResponse = await fetch(creative.image_url)
    if (!imageResponse.ok) {
      throw new Error('Failed to download image')
    }
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer())

    // Recolor image with all combinations (parallel)
    const recolorResults = await recolorImageBatch(
      imageBuffer,
      combinations.map(c => ({
        mappings: c.mappings,
        combinationIndex: c.combinationIndex
      })),
      analysisResult.contentZoneBounds
    )

    // Convert to base64 data URLs for frontend
    const variants = recolorResults.map((result, idx) => {
      const imageDataUrl = `data:image/png;base64,${result.buffer.toString('base64')}`
      const thumbnailDataUrl = `data:image/jpeg;base64,${result.thumbnail.toString('base64')}`

      return {
        id: `${creativeId}-variant-${result.combinationIndex}`, // Temporary ID (not in DB)
        variantIndex: result.combinationIndex,
        imageDataUrl,
        thumbnailDataUrl,
        colorMapping: combinations[idx].mappings.map(m => ({
          zone: m.zone,
          fromColor: m.fromColor,
          toColor: m.toColor
        })),
        description: combinations[idx].description,
        processingTimeMs: result.processingTimeMs
      }
    })

    const totalDurationMs = Date.now() - startTime

    console.log('[Color Shuffle API] Success:', {
      variants: variants.length,
      totalDurationMs,
      avgProcessingTime: Math.round(totalDurationMs / variants.length)
    })

    return NextResponse.json({
      success: true,
      parentCreativeId: creativeId,
      variants,
      analysisUsed: {
        cacheHit: analysisResult.cacheHit,
        model: analysisResult.usage?.model || 'cached',
        costUsd: analysisResult.usage?.estimatedCostUsd || 0,
        detectionQuality: analysisResult.detectionQuality,
        zonesDetected: analysisResult.zones.length
      },
      meta: {
        totalDurationMs,
        variantCount: variants.length,
        userColors
      }
    })
  } catch (error) {
    console.error('[Color Shuffle API] Error:', error)

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.issues },
        { status: 400 }
      )
    }

    // Generic error
    return NextResponse.json(
      {
        error: 'Color shuffle failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// ============================================================
// HELPERS
// ============================================================

/**
 * Extract user colors from creative form_data
 * Supports multiple data structures for backward compatibility
 */
function extractUserColors(formData: any): {
  primary: string
  secondary: string
  accent?: string
} | null {
  try {
    console.log('[Color Shuffle API] 🔍 Starting color extraction...')
    console.log('[Color Shuffle API] formData keys:', Object.keys(formData || {}))

    // Step 1: Navigate to designData (support nested structure from fix)
    let designData = formData?.designData

    // Fallback: Check if formData IS the designData (legacy direct structure)
    if (!designData && formData?.colorConfig) {
      console.log('[Color Shuffle API] Using formData as designData (legacy structure)')
      designData = formData
    }

    if (!designData) {
      console.log('[Color Shuffle API] ❌ No designData found')
      return null
    }

    console.log('[Color Shuffle API] designData keys:', Object.keys(designData))

    const colorConfig = designData.colorConfig

    if (!colorConfig) {
      console.log('[Color Shuffle API] ❌ No colorConfig found')
      return null
    }

    console.log('[Color Shuffle API] colorConfig:', JSON.stringify(colorConfig, null, 2))

    // Step 2: Check if brand colors enabled (not supported)
    if (colorConfig.useBrandColors) {
      console.log('[Color Shuffle API] ❌ Brand colors enabled - not supported for shuffle')
      return null
    }

    console.log('[Color Shuffle API] ✓ Brand colors disabled')

    // Step 3: Try customColors (NEW structure - highest priority)
    if (colorConfig.customColors) {
      const { primary, secondary, accent } = colorConfig.customColors

      if (primary && secondary) {
        console.log('[Color Shuffle API] ✓ Using customColors:', { primary, secondary, accent })
        return { primary, secondary, accent: accent || undefined }
      }
    }

    console.log('[Color Shuffle API] customColors not available or incomplete')

    // Step 4: Try selectedPalette (resolve from COLOR_PALETTES)
    console.log('[Color Shuffle API] Checking selectedPalette:', colorConfig.selectedPalette)
    console.log('[Color Shuffle API] Available palettes:', Object.keys(COLOR_PALETTES))

    if (colorConfig.selectedPalette && colorConfig.selectedPalette !== 'custom') {
      const palette = COLOR_PALETTES[colorConfig.selectedPalette as keyof typeof COLOR_PALETTES]

      console.log('[Color Shuffle API] Palette lookup result:', palette ? 'FOUND' : 'NOT FOUND')

      if (palette) {
        console.log('[Color Shuffle API] ✓ Using palette:', colorConfig.selectedPalette)
        console.log('[Color Shuffle API] Palette colors:', { primary: palette.primary, secondary: palette.secondary, accent: palette.accent })
        return {
          primary: palette.primary,
          secondary: palette.secondary,
          accent: palette.accent || undefined
        }
      } else {
        console.log('[Color Shuffle API] ❌ Palette not found:', colorConfig.selectedPalette)
      }
    }

    console.log('[Color Shuffle API] selectedPalette not available or invalid')

    // Step 5: Try legacy direct fields (backward compatibility)
    const primary = colorConfig.primaryColor || colorConfig.primary
    const secondary = colorConfig.secondaryColor || colorConfig.secondary
    const accent = colorConfig.accentColor || colorConfig.accent

    console.log('[Color Shuffle API] Legacy fields check:', { primary, secondary, accent })

    if (primary && secondary) {
      console.log('[Color Shuffle API] ✓ Using legacy fields:', { primary, secondary, accent })
      return { primary, secondary, accent: accent || undefined }
    }

    console.log('[Color Shuffle API] ❌ No usable colors found in colorConfig')
    return null

  } catch (error) {
    console.error('[Color Shuffle API] Error extracting colors:', error)
    return null
  }
}
