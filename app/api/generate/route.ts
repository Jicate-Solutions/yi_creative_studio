import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type sharp from 'sharp'
import { createUsageTracker } from '@/lib/services/api-usage'
import { convertToINR } from '@/lib/services/currency'
import {
  estimateGenerationCost,
  checkCostLimits,
  calculateTokenCost,
  calculateImageCost,
  type AIProvider,
} from '@/lib/config/ai-pricing'
import { resolveColorConfig, buildResolvedColorNarrative, isValidHex, type ResolvedColors } from '@/lib/utils/resolve-color-config'
import { verifyImageColors, formatVerificationLog, type ColorVerificationResult } from '@/lib/utils/color-verification'
import { calculateInitiativeContrast, type InitiativeContrastInfo } from '@/lib/utils/color-contrast'
import { fetchWithRetry, NetworkError, TimeoutError } from '@/lib/utils/fetch-with-retry'
// Lazy load sharp to reduce cold start time (40-60MB native binary)
// Only loaded when actually needed for template processing
let sharpInstance: typeof sharp | null = null
async function getSharp(): Promise<typeof sharp> {
  if (!sharpInstance) {
    const sharpModule = await import('sharp')
    sharpInstance = sharpModule.default
  }
  return sharpInstance
}
import { processImageWithLogos, resizeImageToExactDimensions, applyEnhanced4RowStrip, applyEnhanced4RowStripSplit, type LogoPosition } from '@/lib/sharp/logo-overlay'
import type { LogoSizePreset, LogoBackgroundShape, LogoBackgroundStyle } from '@/lib/constants/logoConstants'
import { processImageWithSpeakerPhoto, processImageWithMultiSpeakerLayout, calculateSpeakerPhotoCoordinates, calculateMultiSpeakerExclusionZone, type LayoutStrategy } from '@/lib/sharp/speaker-overlay'
import { findSafePositionWithPreference } from '@/lib/sharp/intelligent-positioning'
import { detectTextInForbiddenZones, getSuggestedHeaderHeight, type ZoneViolation } from '@/lib/sharp/text-zone-verifier'
import { calculateAdaptiveLogoLayout, getLayoutModeDescription, calculateLayoutHeight } from '@/lib/sharp/adaptive-logo-layout'
import { compositeLogoBars, calculateOptimalLogoBarHeights, type LogoBarBuffers, type LogoBarCompositorConfig } from '@/lib/sharp/logo-bar-compositor'
import { normalizeSpeakerConfig, getSpeakerCount, getSpeakerCountWithPhotos, getSpeakersWithPhotos } from '@/lib/utils/speaker-migration'
import { calculateSpeakerCardDimensions, calculateBlockDimensions, scaleToFitSafeZone, getLayoutStrategy } from '@/lib/sharp/speaker-dimensions'
import { analyzeSpeakerLayout, type SpeakerLayoutDecision } from '@/lib/agents/speaker-layout-agent'
import { calculateIntelligentLayout, type MultiSpeakerLayout } from '@/lib/config/multi-speaker-layouts'
import type { DesignData, CustomizationData, Enhanced4RowStripMode, ResolutionId } from '@/lib/config/design-constants'
import {
  ASPECT_RATIOS,
  DIMENSION_QUALITY,
  ENHANCED_STRIP_ROW_HEIGHTS, // v12.3: Import actual row heights for accurate safe zone calculation
  getLogoStripStyleByVibe // NEW: for auto-selecting strip shape based on vibe
} from '@/lib/config/design-constants'
import {
  generatePrompt,
  isGeminiPrompt,
  isIdeogramPrompt,
  toIdeogramApiFormat,
  type GeneratePromptParams,
  type CreativeContent,
  type DesignContext,
} from '@/lib/prompts'
import { getFormatById, type CreativeFormatId } from '@/lib/config/creative-formats'
import { getPromptStyleConfig } from '@/lib/config/prompt-styles'
import { getFormatZones, getFormatCategory, shouldEnforceZones } from '@/lib/config/format-zones'
import { shouldApplyLogoBars } from '@/lib/config/format-logo-bar-config'
import { buildFormatPrompt, getStandardAspectRatio } from '@/lib/prompts/format-prompts'
import {
  generateDesignContextSafe,
  type DesignBrief,
} from '@/lib/prompts/services/design-intelligence'
import { sanitizeDesignContext } from '@/lib/prompts/helpers/design-context-sanitizer'
import {
  generateEventUnderstanding,
  generateFallbackEventProfile,
  shouldUseEventUnderstanding,
  type EventProfile,
} from '@/lib/prompts/services/event-understanding'
import {
  generateTypographyIntelligence,
  generateFallbackTypography,
  shouldUseTypographyIntelligence,
  type TypographyProfile,
} from '@/lib/prompts/services/typography-intelligence'
// validateLogoPositions removed - position locking is now user-controlled
import { getTemplateForFormat } from '@/lib/prompts/knowledge-base'
import { compileFormData, summarizeCompiledData, buildSceneNarrative } from '@/lib/prompts/services/form-data-compiler'
import { generateUltraProPromptSafe } from '@/lib/prompts/services/ultra-pro-prompt'
import { generateCreativeDirectorBrief, generateSpotlightCreativeBrief } from '@/lib/prompts/services/creative-director'
import { buildLogoAwarenessContext, buildLogoSummary } from '@/lib/prompts/helpers/logo-awareness'
import type { LogoPlacement } from '@/stores/creative-store'
import { YiPromptBuilder, injectVerticalContext, type EnhancedBuildOptions } from '@/lib/prompts/services/yi-prompt-builder'
import { inferThemeFromDetails, type EventDetails } from '@/lib/services/theme-inference'
import { resolveAutoDesignChoices } from '@/lib/services/auto-design-selector'
import { sanitizeForGemini, detectLabelLeaks, stripFieldLabelsOnly, isXmlStructuredPrompt } from '@/lib/prompts/services/prompt-sanitizer'
import { sanitizeForLogging } from '@/lib/utils/sanitize-log-data'
import { randomUUID } from 'crypto'
import type { FooterRowConfig } from '@/lib/config/design-constants'
import {
  analyzeEventContext,
  shouldUseAIEventAnalysis,
  type AIEventContext,
  type EventFormData,
} from '@/lib/ai/event-context-analyzer'
import OpenAI from 'openai'
import { buildOpenAIPrompt, getGptImageSize } from '@/lib/prompts/services/openai-prompt-builder'

// ============================================================================
// v24.6: FULL-CANVAS GENERATION PROTECTION
// ============================================================================
// ⚠️ WARNING: DO NOT CHANGE THESE VALUES WITHOUT USER APPROVAL ⚠️
//
// USER REQUIREMENT: Gemini must generate FULL canvas including header/footer design
// REASON: User wants AI-generated blue gradient header (NOT static, NOT blurred!)
//         Logo bars overlay with TRANSPARENT backgrounds (Gemini colors show through)
//
// HISTORY:
// - v24.4: Switched to content-only generation → BROKE user's working setup
// - v24.5: Added blurred backgrounds → Still broken (artificial, not real design)
// - v24.6: RESTORED full-canvas generation → Fixed (user confirmed working)
//
// If you're considering changes to spatial constraints or generation approach:
// 1. Read doc/v24.6-full-canvas-restoration.md
// 2. Understand the trade-offs (text-logo overlap vs Gemini creativity)
// 3. Get user approval before changing
// ============================================================================

/**
 * FULL-CANVAS GENERATION MODE (v24.6)
 *
 * When true: Gemini generates complete poster including header/footer design
 * When false: Reverts to v24.4 content-only generation (NOT recommended)
 *
 * ⚠️ DO NOT SET TO FALSE - User specifically wants full-canvas generation
 */
const USE_FULL_CANVAS_GENERATION = true

/**
 * GEMINI BACKGROUND PRESERVATION (v24.6)
 *
 * When true: Use Gemini's output directly (no artificial backgrounds)
 * When false: Reverts to v24.5 blurred backgrounds (NOT recommended)
 *
 * ⚠️ DO NOT SET TO FALSE - User wants Gemini's artistic header/footer intact
 */
const PRESERVE_GEMINI_BACKGROUNDS = true

/**
 * ZONE DEBUG OVERLAY (v40.6)
 * Set DEBUG_ZONE_OVERLAY=true in .env.local to overlay zone boundary markers on output.
 * Red = forbidden header/footer zones, Green = content zone, Blue dashed = Sharp render zone.
 * NEVER enable in production — debug only.
 */
const DEBUG_ZONE_OVERLAY = process.env.DEBUG_ZONE_OVERLAY === 'true'

/**
 * Check if footer has any content to render
 * Matches the logic in lib/sharp/logo-overlay.ts (createEnhanced4RowFooterStrip)
 * v12.1: Used for footer safe zone calculation
 * v14.0: Added signature check (signatureId OR logoId)
 *
 * @param footer - Footer configuration
 * @returns true if footer has content (signature, hashtag, website, or digital partner)
 */
function hasFooterContent(footer?: FooterRowConfig): boolean {
  if (!footer) return false

  return !!(
    // v14.0: Add signature check (signatureId OR logoId for backwards compatibility)
    (footer.signature?.enabled && (footer.signature?.signatureId || footer.signature?.logoId)) ||
    footer.hashtag.text.trim() ||
    footer.website.url.trim() ||
    footer.website.socialHandle?.trim() ||
    footer.digitalPartner.logoId ||
    footer.digitalPartner.labelText.trim()
  )
}

/**
 * Check if brand logos row has content to render
 * v12.2: Used for header safe zone calculation
 *
 * @param enhanced4RowStrip - Enhanced 4-row strip configuration
 * @returns true if brand logos exist
 */
function hasBrandLogos(enhanced4RowStrip: Enhanced4RowStripMode): boolean {
  return (enhanced4RowStrip?.rows?.brand?.logoIds?.length ?? 0) > 0
}

/**
 * Check if vertical logos row has content to render
 * v12.2: Used for header safe zone calculation
 *
 * @param enhanced4RowStrip - Enhanced 4-row strip configuration
 * @returns true if vertical logos exist
 */
function hasVerticalLogos(enhanced4RowStrip: Enhanced4RowStripMode): boolean {
  return (enhanced4RowStrip?.rows?.vertical?.logoIds?.length ?? 0) > 0
}

/**
 * Check if initiative text row has content to render
 * v12.2: Used for header safe zone calculation
 *
 * @param enhanced4RowStrip - Enhanced 4-row strip configuration
 * @returns true if initiative text exists
 */
function hasInitiativeText(enhanced4RowStrip: Enhanced4RowStripMode): boolean {
  return !!(enhanced4RowStrip?.rows?.initiative?.text?.trim())
}

/**
 * Upload base64 image data to Supabase Storage and return the public URL.
 * This prevents storing massive base64 strings in the database, which was
 * causing database bloat (181 MB for ~40 images) and resource exhaustion.
 *
 * @param base64Data - Raw base64 image data (without data URL prefix)
 * @param mimeType - Image MIME type (e.g., 'image/png')
 * @param organizationId - Organization ID for folder structure
 * @param supabase - Supabase client instance
 * @returns Public URL of the uploaded image
 */
async function uploadImageToStorage(
  base64Data: string,
  mimeType: string,
  organizationId: string,
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<string> {
  // Convert base64 to buffer
  const buffer = Buffer.from(base64Data, 'base64')

  // Generate unique filename with organization folder structure
  const extension = mimeType.split('/')[1] || 'png'
  const filename = `${organizationId}/${randomUUID()}.${extension}`

  // Upload to Supabase Storage 'creatives' bucket
  const { error: uploadError } = await supabase.storage
    .from('creatives')
    .upload(filename, buffer, {
      contentType: mimeType,
      cacheControl: '31536000', // 1 year cache
      upsert: false,
    })

  if (uploadError) {
    console.error('[uploadImageToStorage] Upload error:', uploadError)
    console.error('[uploadImageToStorage] Error details:', {
      message: uploadError.message,
      bucket: 'creatives',
      filename,
    })

    // Detect common error patterns and provide helpful guidance
    if (uploadError.message?.includes('<!DOCTYPE') || uploadError.message?.includes('<html')) {
      console.error('[uploadImageToStorage] 🔍 CRITICAL: Supabase returned HTML instead of JSON')
      console.error('[uploadImageToStorage] This indicates:')
      console.error('  1. Storage bucket "creatives" does not exist, OR')
      console.error('  2. Bucket has incorrect permissions/RLS policies')
      console.error('  → Solution: Create bucket in Supabase dashboard with public access')
      throw new Error(
        'Storage bucket not configured. Please create "creatives" bucket in Supabase dashboard with public access enabled.'
      )
    }

    throw new Error(`Failed to upload image to storage: ${uploadError.message}`)
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('creatives')
    .getPublicUrl(filename)

  console.log('[uploadImageToStorage] Uploaded image:', filename, '-> URL:', urlData.publicUrl.substring(0, 80) + '...')

  return urlData.publicUrl
}
import { getFormatEnhancement } from '@/lib/config/format-enhancements'

export async function POST(request: NextRequest) {
  // Declare speaker/layout variables at function scope to prevent Turbopack scope issues
  let speakerCount = 0
  let speakerCountWithPhotos = 0
  let multiSpeakerLayout: MultiSpeakerLayout | null = null
  let speakerPhotoZoneCoordinates: ReturnType<typeof calculateSpeakerPhotoCoordinates> | undefined
  let speakerLayoutDecision: SpeakerLayoutDecision | undefined  // v7.1: AI-analyzed layout decision

  try {
    const supabase = await createClient()

    // Verify user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body FIRST so we can use organizationId in permission check
    // This fixes the multi-org user bug where .single() fails without org filter
    const body = await request.json()
    const {
      prompt,
      model,
      provider,
      verticalSlug,
      logosPlacements,
      logoBackgroundColor, // Global background color for all logos
      logoStripMode, // Unified strip layout mode
      enhanced4RowStrip, // Enhanced 4-row strip mode (Yi Brand Guidelines 2025)
      organizationId,
      templateId,
      templateUrl,
      creationMode,
      designData,
      formatId,
      customDimensions,
      language,
      userFormData,
      useXmlPrompts, // New flag to opt-in to XML-structured prompts (Gemini-optimized)
      thinkingLevel, // Flash 3.1 only: 'minimal' (fast) | 'High' (quality)
      useImageSearch, // Flash 3.1 only: whether to enable Google Image Search grounding
      promptStyle, // v31.0: Named creative mode (auto, creative, stunning, cinematic, bold, elegant, minimal)
      creativeMode, // 'spotlight' — triggers Spotlight Creative Brief instead of Creative Director
      backgroundStyle, // v47.1: Background visual treatment (scene, abstract, dark, illustrated, bokeh, geometric, texture, split)
      imageQuality, // OpenAI GPT-image-1 only: 'low' | 'medium' | 'high'
    } = body as {
      prompt: string
      model: string
      provider: string
      verticalSlug: string
      logosPlacements: Array<{ logoId: string; position: string; logo?: { file_url: string; name?: string } }>
      logoBackgroundColor?: string // Global background color for all logos (hex)
      logoStripMode?: {
        enabled: boolean
        rows: ('header' | 'middle' | 'footer')[]
        opacity?: number // Strip opacity 0-100
        logoBound?: boolean // When true, strip only covers logo area
      } // Strip layout mode
      enhanced4RowStrip?: Enhanced4RowStripMode // Enhanced 4-row strip mode
      organizationId: string
      templateId: string | null
      templateUrl: string | null
      creationMode?: 'template' | 'scratch'
      designData?: DesignData | null
      formatId?: CreativeFormatId
      customDimensions?: { width: number; height: number } | null
      language?: 'en' | 'ta' | 'hi'
      userFormData?: Record<string, unknown>
      useXmlPrompts?: boolean // Enable XML-structured prompts (v2 Gemini-optimized system)
      thinkingLevel?: 'minimal' | 'High' // Flash 3.1 only: thinking mode control
      useImageSearch?: boolean // Flash 3.1 only: enable Google Image Search grounding (default true)
      promptStyle?: string // v31.0: Prompt style ID (auto, creative, stunning, cinematic, bold, elegant, minimal)
      creativeMode?: string // 'spotlight' | undefined
      backgroundStyle?: string // v47.1: background style id
      imageQuality?: 'low' | 'medium' | 'high' // OpenAI GPT-image-1 quality tier
    }

    // SECURITY: Verify user has editor+ role for this specific organization
    // Super Admins automatically pass this check
    // FIX: Use organizationId filter to support multi-org users (fixes .single() bug)
    const isSuperAdmin = (user as any).is_super_admin === true
    if (!isSuperAdmin) {
      const { data: membership, error: membershipError } = await supabase
        .from('organization_members')
        .select('role')
        .eq('user_id', user.id)
        .eq('organization_id', organizationId)
        .single()

      if (membershipError || !membership) {
        console.error('[Generate API] Permission denied:', {
          userId: user.id,
          organizationId,
          error: membershipError?.message,
          reason: 'No membership found for this organization'
        })
        return NextResponse.json(
          {
            error: 'You do not have access to this organization',
            code: 'NO_ORG_MEMBERSHIP',
            hint: 'Please refresh the page or switch to a valid organization in settings'
          },
          { status: 403 }
        )
      }

      if (membership.role === 'viewer') {
        console.error('[Generate API] Permission denied:', {
          userId: user.id,
          organizationId,
          role: membership.role,
          reason: 'Viewer role cannot generate creatives'
        })
        return NextResponse.json(
          {
            error: 'Insufficient permissions',
            code: 'EDITOR_REQUIRED',
            message: 'Editor or Admin role required to generate creatives',
          },
          { status: 403 }
        )
      }
    }

    // DIAGNOSTIC: Validate request body for speaker photos
    if (creationMode === 'scratch') {
      if (!designData) {
        console.error('[GENERATE API] CRITICAL: Scratch mode but no designData received')
      } else if (!designData.customization?.speakerPhoto) {
        console.warn('[GENERATE API] WARNING: designData exists but no speakerPhoto config')
      }
    }

    // NEW v3.10: Extract color configuration from design data
    const colorConfig = designData?.colorConfig || null

    console.log('[Generate API] Color Config Received:', {
      useBrandColors: colorConfig?.useBrandColors,
      selectedPalette: colorConfig?.selectedPalette,
      hasCustomColors: !!colorConfig?.customColors,
    })

    // v3.1: Validate format selection (required unless custom dimensions provided)
    if (!formatId && !customDimensions) {
      console.error('[Generate API] Missing format: formatId=null, customDimensions=null')
      return NextResponse.json(
        {
          error: 'Format selection required',
          code: 'FORMAT_REQUIRED',
          message: 'Please select a creative format or specify custom dimensions before generating.',
          hint: 'This usually means the external event import did not infer a format. Please select one manually.',
        },
        { status: 400 }
      )
    }

    // Get format if specified
    let selectedFormat = formatId ? getFormatById(formatId) : null
    const formatDimensions = customDimensions || (selectedFormat ? { width: selectedFormat.width, height: selectedFormat.height } : null)

    // v24.0: Declare logoStripZoneCoordinates at function level for accessibility
    let logoStripZoneCoordinates: EnhancedBuildOptions['logoStripZoneCoordinates'] | undefined

    // v24.3: Declare content-only generation variables at function level
    let originalFormat: typeof selectedFormat = null
    let contentOnlyWidth = 0
    let contentOnlyHeight = 0

    // NOTE: Permission check moved above (after body parsing) to use organizationId filter
    // This fixes the multi-org user bug where .single() fails without org filter

    // NOTE: Credit deduction is handled by the client (CanvasCreatePage.tsx)
    // using the correct model-based cost (modelToUse.credits_cost)
    // The client already validates balance and deducts credits BEFORE calling this API
    // Do NOT deduct credits here to avoid double-charging users

    // NEW v3.2: Fetch organization brand_config to get font preference
    // This implements the hybrid approach: font family from org settings, AI controls sizing
    // v36.0: Fetch org identity (name) for Context Bridge
    const { data: orgData } = await supabase
      .from('organizations')
      .select('name, brand_config')
      .eq('id', organizationId)
      .single()

    // Extract font preference AND brand colors from brand_config (JSON column)
    // v3.3: Now includes colors for proper useBrandColors support
    // v3.4: Now includes footer contact details for creative footers
    const brandConfig = orgData?.brand_config as {
      fontPrimary?: string
      fontSecondary?: string
      primaryColor?: string
      secondaryColor?: string
      accentColor?: string
      footerWebsite?: string
      footerPhone?: string
      footerEmail?: string
      footerAddress?: string
      footerSocial?: {
        instagram?: string
        linkedin?: string
        facebook?: string
        twitter?: string
      }
    } | null
    const fontPreference = brandConfig?.fontPrimary || undefined

    // NEW v3.10: Resolve actual color values from ColorConfig
    const resolvedColors = resolveColorConfig(colorConfig, brandConfig || undefined)

    console.log('[Generate API] Resolved Colors:', {
      primary: resolvedColors.primaryColor,
      secondary: resolvedColors.secondaryColor,
      accent: resolvedColors.accentColor,
      source: resolvedColors.source,
    })

    // NEW v3.10: Validate resolved colors before proceeding
    if (!resolvedColors.primaryColor || !resolvedColors.secondaryColor) {
      console.warn('[Generate API] WARNING: Color resolution failed, using fallback colors')
    }

    // Validate hex format for resolved colors
    if (!isValidHex(resolvedColors.primaryColor)) {
      console.error('[Generate API] Invalid primary color format:', resolvedColors.primaryColor)
      return NextResponse.json(
        { error: 'Invalid color configuration: Primary color must be a valid hex code' },
        { status: 400 }
      )
    }

    if (!isValidHex(resolvedColors.secondaryColor)) {
      console.error('[Generate API] Invalid secondary color format:', resolvedColors.secondaryColor)
      return NextResponse.json(
        { error: 'Invalid color configuration: Secondary color must be a valid hex code' },
        { status: 400 }
      )
    }

    // Extract effective footer contact values based on useBrand* toggle:
    // - useBrand* = true (or undefined/default) → use brand configured value
    // - useBrand* = false → use custom per-creative value
    const footerConfig = designData?.customization?.footer
    const footerContext = {
      website: (footerConfig?.useBrandWebsite ?? true)
        ? (brandConfig?.footerWebsite || '')
        : (footerConfig?.customWebsite || ''),
      phone: (footerConfig?.useBrandPhone ?? true)
        ? (brandConfig?.footerPhone || '')
        : (footerConfig?.customPhone || ''),
      email: (footerConfig?.useBrandEmail ?? true)
        ? (brandConfig?.footerEmail || '')
        : (footerConfig?.customEmail || ''),
      address: (footerConfig?.useBrandAddress ?? true)
        ? (brandConfig?.footerAddress || '')
        : (footerConfig?.customAddress || ''),
      social: (footerConfig?.useBrandSocial ?? true)
        ? (brandConfig?.footerSocial ? {
          instagram: brandConfig.footerSocial.instagram || '',
          linkedin: brandConfig.footerSocial.linkedin || '',
          facebook: brandConfig.footerSocial.facebook || '',
          twitter: brandConfig.footerSocial.twitter || '',
        } : null)
        : (footerConfig?.customSocial ? {
          instagram: footerConfig.customSocial.instagram || '',
          linkedin: footerConfig.customSocial.linkedin || '',
          facebook: footerConfig.customSocial.facebook || '',
          twitter: footerConfig.customSocial.twitter || '',
        } : null),
    }

    // v36.0 — Context Bridge: Fetch vertical visual DNA
    let verticalPresetContext: string | null = null
    if (verticalSlug) {
      try {
        const { data: vpData } = await supabase
          .from('vertical_presets')
          .select('prompt_template, theme_config')
          .eq('slug', verticalSlug)
          .single()
        if (vpData?.prompt_template) {
          verticalPresetContext = vpData.prompt_template as string
          console.log(`[v36.0 Context Bridge] Vertical DNA loaded for "${verticalSlug}" (${(verticalPresetContext as string).length} chars)`)
        }
      } catch { /* non-blocking — vertical context is optional enrichment */ }
    }

    // ========================================================
    // API USAGE TRACKING - Track token usage and costs
    // ========================================================
    let designContext: DesignContext | undefined // Hoisted for access in logo overlay logic
    const usageTracker = createUsageTracker({
      organizationId,
      userId: user.id,
      // creativeId will be set after creation if needed
    })

    // ========================================================
    // v31.0: PROMPT STYLE CONFIGURATION
    // ========================================================
    // Auto-select design choices from format + event context (rule-based, zero cost)
    const autoChoices = resolveAutoDesignChoices({
      formatId,
      eventType: (userFormData as Record<string, unknown>)?.eventType as string | undefined,
    })
    const styleConfig = getPromptStyleConfig(autoChoices.promptStyleId)
    console.log(`[AutoDesign] promptStyle="${autoChoices.promptStyleId}", style="${autoChoices.style}"`)
    const modelGuidance = styleConfig.modelGuidance[model] || ''
    if (styleConfig.id !== 'auto') {
      console.log(`[v31.0 Prompt Style] Active: "${styleConfig.name}" (${styleConfig.id})`)
      console.log(`[v31.0 Prompt Style] Model guidance for ${model}: ${modelGuidance.substring(0, 80)}...`)
    }

    // ========================================================
    // PREVENTION CHECK - Pre-check against learned patterns
    // ========================================================
    // This uses the Feedback Learning Agent to detect potential issues
    // before generation and apply adjustments to prevent known problems
    let preventionActionId: string | null = null
    let adjustedUserFormData = userFormData
    let promptEnhancements: string[] = []  // Collect prompt enhancements from prevention
    let configOverrides: Record<string, unknown> = {}  // Collect config overrides from prevention

    // A/B Testing: 10% holdout group for measuring prevention effectiveness
    const isHoldout = Math.random() < 0.10
    let preventionApplied = false

    // Skip prevention for holdout group (for A/B testing)
    if (isHoldout) {
      console.log('[Prevention] A/B Test: Creative is in holdout group, skipping prevention')
    }

    // Only run prevention for non-holdout group (A/B testing)
    if (!isHoldout) {
      try {
        const { preventIssuesSafe } = await import('@/lib/agents/feedback-learning-agent')
        const preventionResult = await preventIssuesSafe({
          formatId: formatId || 'unknown',
          formData: userFormData || {},
          designData: designData as unknown as Record<string, unknown>,
          logosPlacements: logosPlacements?.map((lp: { logoId: string; position: string }) => ({
            type: lp.logoId as 'yi' | 'cii' | 'custom',
            position: lp.position,
            size: 'medium' as const,
          })),
          organizationId,
          userId: user.id,
        })

        if (preventionResult.success && preventionResult.shouldAdjust) {
          console.log('[Prevention] Applying', preventionResult.adjustments.length, 'adjustments')
          console.log('[Prevention] Reasoning:', preventionResult.reasoning)

          // Mark that prevention was applied for A/B testing tracking
          preventionApplied = true

          // Apply adjustments based on type
          for (const adjustment of preventionResult.adjustments) {
            if (adjustment.type === 'field_modification' && adjustment.target) {
              // Direct field modification
              adjustedUserFormData = {
                ...adjustedUserFormData,
                [adjustment.target]: adjustment.suggestedValue,
              }
            } else if (adjustment.type === 'prompt_enhancement' && adjustment.suggestedValue) {
              // Collect prompt enhancements for injection into prompt building
              promptEnhancements.push(adjustment.suggestedValue as string)
              console.log('[Prevention] Collected prompt enhancement:', (adjustment.suggestedValue as string).substring(0, 100))
            } else if (adjustment.type === 'config_override' && adjustment.target) {
              // Collect config overrides to apply to designData
              configOverrides[adjustment.target] = adjustment.suggestedValue
              console.log('[Prevention] Collected config override:', adjustment.target, '=', adjustment.suggestedValue)
            }
          }

          preventionActionId = preventionResult.preventionActionId || null
        }
      } catch (preventionError) {
        // Prevention errors should not block generation
        console.warn('[Prevention] Check failed, continuing without adjustments:', preventionError)
      }
    }

    // Apply config overrides from prevention to designData
    // This allows learned patterns to modify design configuration
    // Create effectiveDesignData to avoid reassigning const
    const effectiveDesignData: DesignData | null | undefined =
      (Object.keys(configOverrides).length > 0 && designData)
        ? { ...designData, ...configOverrides } as DesignData
        : designData

    // Log collected prompt enhancements for debugging
    if (promptEnhancements.length > 0) {
      console.log('[Prevention] Collected', promptEnhancements.length, 'prompt enhancements for injection')
    }

    // Logo position validation removed - users can now place logos anywhere
    // Position locking is now user-controlled via the UI

    let imageUrl: string
    let imageActualModel: string | undefined = undefined  // Tracks which model actually ran (may differ after TIER 3 upgrade)
    let storedPromptForRegeneration: string | undefined = undefined  // v24.0: Store prompt for potential regeneration
    let zoneGuideBase64: string | undefined = undefined  // v40.3: Zone guide for visual zone enforcement (hoisted for retry access)

    // Determine if user has their own speaker photo(s) to overlay
    // If yes, we don't want AI to generate placeholder speaker in the design
    // NEW v5.0: Supports both legacy single-speaker and multi-speaker formats
    const speakerPhoto = effectiveDesignData?.customization?.speakerPhoto
    const userHasSpeakerPhoto = speakerPhoto?.enabled && (
      speakerPhoto?.photoUrl || // Legacy single speaker
      (speakerPhoto?.speakers && speakerPhoto.speakers.some(s => s.photoUrl)) // Multi-speaker
    )

    // DIAGNOSTIC: Log speaker photo detection
    console.log('[GENERATE API] Speaker Photo Detection:', {
      hasDesignData: !!designData,
      hasEffectiveDesignData: !!effectiveDesignData,
      hasCustomization: !!effectiveDesignData?.customization,
      hasSpeakerPhoto: !!speakerPhoto,
      speakerPhotoEnabled: speakerPhoto?.enabled,
      hasLegacyPhotoUrl: !!speakerPhoto?.photoUrl,
      hasSpeakersArray: !!speakerPhoto?.speakers,
      speakersArrayLength: speakerPhoto?.speakers?.length || 0,
      speakersWithPhotos: speakerPhoto?.speakers?.filter(s => s.photoUrl).length || 0,
      userHasSpeakerPhoto,
      rawSpeakerPhoto: speakerPhoto ? {
        enabled: speakerPhoto.enabled,
        speakers: speakerPhoto.speakers?.map(s => ({
          name: s.name,
          designation: s.designation,
          hasPhotoUrl: !!s.photoUrl,
          photoUrlLength: s.photoUrl?.length || 0
        }))
      } : null
    })

    // Enhance prompt with format context if a format is selected
    let enhancedPrompt = prompt
    if (selectedFormat) {
      enhancedPrompt = buildFormatPrompt(selectedFormat, prompt, {
        includeGuidelines: true,
        includeCompositionRules: true,
        includeDimensions: true,
      })
    }

    // Generate based on creation mode, provider and template
    if (creationMode === 'scratch' && designData) {
      // Scratch mode - build enhanced prompt from design data using new prompt system
      const providerType = provider === 'google' ? 'google' : 'ideogram'

      // Create a modified designData for prompt building
      // If user has their own photo, disable speaker photo in prompt to avoid AI generating placeholder
      const promptDesignData = userHasSpeakerPhoto && effectiveDesignData
        ? {
          ...effectiveDesignData,
          customization: {
            ...effectiveDesignData.customization,
            speakerPhoto: {
              ...effectiveDesignData.customization?.speakerPhoto,
              enabled: false, // Don't tell AI about speaker photo if user will overlay their own
            },
          },
        }
        : effectiveDesignData

      // ========================================================
      // STAGE 1: Design Intelligence (AI-Powered Context Generation)
      // ========================================================
      // This is the game-changer - use AI to analyze the brief and generate
      // contextual design guidance including:
      // - Core purpose & emotional job
      // - Relevant visual elements that BELONG in this design
      // - Contextual background setting
      // - Design strategy
      console.log('[Design Intelligence] Stage 1: Generating design context...')

      // Parse content for the brief (fallback for when form data is unavailable)
      const parsedContent = parseEventContent(prompt)

      // Extract from user form data (PRIMARY - more reliable than parsing prompt)
      // Note: Using adjustedUserFormData which may have prevention adjustments applied
      const formDataContent = extractFromFormData(adjustedUserFormData)

      // Log for debugging - helps verify form data is being received
      console.log('[Generate] === USER FORM DATA ===')
      console.log('[Generate] Raw Form Data:', JSON.stringify(sanitizeForLogging(adjustedUserFormData), null, 2))
      if (preventionActionId) {
        console.log('[Generate] Prevention Action ID:', preventionActionId)
      }
      console.log('[Generate] Extracted Event Name:', formDataContent.eventName || '(not found)')
      console.log('[Generate] Extracted Guest Name:', formDataContent.guestName || '(not found)')
      console.log('[Generate] Fallback (parsed) Event Name:', parsedContent.eventName || '(not found)')
      // v4.0: Log custom fields to verify format-specific fields are captured
      if (formDataContent.customFields && Object.keys(formDataContent.customFields).length > 0) {
        console.log('[Generate] Custom Fields:', Object.keys(formDataContent.customFields).join(', '))
      }

      // ========================================================
      // STAGE 0.5: COMPILE FORM DATA & GENERATE ULTRA-PRO PROMPT
      // Uses Claude AI to transform user values into optimized prompt
      // ========================================================
      // Pass speaker photo enabled flag to prevent speaker data leakage when disabled
      // Note: Using adjustedUserFormData which may have prevention adjustments applied
      const speakerPhotoEnabled = speakerPhoto?.enabled ?? false
      // v15.1: Pass enhanced4RowStrip to extract initiative text for AI prompt
      const compiledData = compileFormData(adjustedUserFormData, formatId, effectiveDesignData, language, speakerPhotoEnabled, enhanced4RowStrip)
      console.log('[Generate] === COMPILED FORM DATA ===')
      console.log('[Generate] Summary:\n' + summarizeCompiledData(compiledData))

      // ========================================================
      // STAGE 1: EVENT UNDERSTANDING (NEW - Multi-Stage AI Pipeline)
      // Deep semantic analysis of event concept before generation
      // Generates visual associations appropriate for the event theme
      // ========================================================
      let eventProfile: EventProfile | null = null

      const eventName = formDataContent.eventName || compiledData.eventName || parsedContent.eventName || ''

      // v6.6 FIX: Hoist speakers definition to main scope so it's available for validation later
      // v29.1 FIX: Collect from ALL sources — multi-speaker array, single speaker field, and compiledData
      const speakers: Array<{ name: string, designation?: string }> = []

      // Source 1: speakers array from userFormData (MultiSpeakerInput / designData injection)
      if (Array.isArray(adjustedUserFormData?.speakers)) {
        for (const s of adjustedUserFormData.speakers as Array<{ name?: string; designation?: string }>) {
          if (s.name?.trim()) {
            speakers.push({ name: s.name.trim(), designation: s.designation?.trim() || undefined })
          }
        }
      }

      // Source 2: Single speaker from extractFromFormData (backwards compat, only if no array)
      if (speakers.length === 0) {
        const speakerName = formDataContent.guestName || compiledData.speakerName
        const speakerDesignation = formDataContent.guestDesignation || compiledData.speakerDesignation
        if (speakerName) {
          speakers.push({ name: speakerName, designation: speakerDesignation ?? undefined })
        }
      }

      // ── NEBULA: Fire AI calls that don't depend on Stage 0 outputs ──────────
      // analyzeEventContext only needs raw form data — launch it now so it runs
      // in parallel with generateEventUnderstanding + typography intelligence (~10-16s overlap).
      const _nebulaFormData: EventFormData = {
        eventName,
        eventDescription: [compiledData.tagline, compiledData.description].filter(Boolean).join('. ') || formDataContent.description || '',
        venue: (formDataContent.venue || compiledData.venue) ?? undefined,
        date: (adjustedUserFormData as Record<string, unknown>)?.eventDate as string | undefined,
        time: (adjustedUserFormData as Record<string, unknown>)?.eventTime as string | undefined,
        speakers: speakers.length > 0 ? speakers : undefined,
        theme: (adjustedUserFormData as Record<string, unknown>)?.theme as string | undefined,
        style: (adjustedUserFormData as Record<string, unknown>)?.style as string | undefined,
        targetAudience: (adjustedUserFormData as Record<string, unknown>)?.targetAudience as string | undefined,
      }
      const _nebulaStyleOptions = styleConfig.id !== 'auto'
        ? { temperature: styleConfig.temperatures?.eventContext ?? undefined, creativeDirection: styleConfig.creativeDirection ?? undefined }
        : {}
      const analyzeEventContextPromise: Promise<AIEventContext | null> = shouldUseAIEventAnalysis()
        ? analyzeEventContext(_nebulaFormData, _nebulaStyleOptions).catch(() => null)
        : Promise.resolve(null)

      // recentOrgPrompts: Supabase DB fetch — fire early, await before Ultra-Pro
      const recentOrgPromptsPromise: Promise<string[]> = (organizationId && formatId)
        ? Promise.resolve(
            supabase
              .from('creatives')
              .select('prompt_used')
              .eq('organization_id', organizationId)
              .eq('creative_type', formatId)
              .not('prompt_used', 'is', null)
              .neq('prompt_used', '')
              .order('created_at', { ascending: false })
              .limit(3)
          ).then(({ data }) => (data ?? []).map(c => c.prompt_used as string).filter(Boolean))
           .catch(() => [])
        : Promise.resolve([])
      // ─────────────────────────────────────────────────────────────────────────

      if (formatId && shouldUseEventUnderstanding(formatId, eventName)) {
        console.log('[Generate] === STAGE 1: EVENT UNDERSTANDING ===')
        console.log('[Generate] Event:', eventName)
        console.log('[Generate] Analyzing event concept semantically...')

        try {

          eventProfile = await generateEventUnderstanding({
            eventName,
            description: [compiledData.tagline, compiledData.description].filter(Boolean).join('. ') || formDataContent.description || undefined,
            venue: (formDataContent.venue || compiledData.venue) ?? undefined,
            eventType: (formDataContent.eventType || parsedContent.eventType) ?? undefined,
            speakers: speakers.length > 0 ? speakers : undefined,
            organizationContext: {
              name: compiledData.organizationName || 'Yi Creatives',
              industry: 'Business Leadership',
              brandPersonality: effectiveDesignData?.theme || 'professional'
            }
          }, {
            userId: user.id,
            organizationId,
            temperature: 1.0  // High creativity for concept exploration
          })

          console.log('[Generate] ✅ Event Understanding complete')
          console.log('[Generate] Literal Meaning:', eventProfile.literalMeaning)
          console.log('[Generate] Selected Concept:', eventProfile.selectedConcept)
          console.log('[Generate] Primary Visuals:', eventProfile.visualAssociations.primary.slice(0, 5).join(', '))
          console.log('[Generate] Confidence:', eventProfile.confidence)
          console.log('[Generate] Formality:', eventProfile.formality)
          console.log('[Generate] Energy:', eventProfile.energyLevel)

        } catch (error) {
          console.error('[Generate] ❌ Event Understanding failed:', error)
          console.log('[Generate] Using fallback event profile...')

          eventProfile = generateFallbackEventProfile({
            eventName,
            description: compiledData.description || formDataContent.description || undefined,
            venue: (formDataContent.venue || compiledData.venue) ?? undefined,
            eventType: (formDataContent.eventType || parsedContent.eventType) ?? undefined
          })

          console.log('[Generate] Fallback profile generated with confidence:', eventProfile.confidence)
        }
      } else {
        console.log('[Generate] === STAGE 1: EVENT UNDERSTANDING ===')
        console.log('[Generate] Skipped - Format does not require event understanding')
        console.log('[Generate] Format:', formatId, '/ Event:', eventName)
      }

      // ========================================================
      // STAGE 1.5: TYPOGRAPHY INTELLIGENCE (NEW - Font Selection AI)
      // AI-powered typography selection that matches event concept
      // Generates font personality descriptions for Gemini interpretation
      // ========================================================
      let typographyProfile: TypographyProfile | null = null

      if (formatId && shouldUseTypographyIntelligence(formatId, eventProfile !== null)) {
        console.log('[Generate] === STAGE 1.5: TYPOGRAPHY INTELLIGENCE ===')
        console.log('[Generate] Analyzing typography requirements for:', eventName)

        try {
          typographyProfile = await generateTypographyIntelligence({
            eventName,
            eventProfile,
            formatId,
            formality: eventProfile?.formality,
            energyLevel: eventProfile?.energyLevel,
            emotionalTone: eventProfile?.emotionalTone,
            brandFont: effectiveDesignData?.typography ? {
              headline: effectiveDesignData.typography.headingFont,
              body: effectiveDesignData.typography.bodyFont
            } : undefined,
            language
          }, {
            userId: user.id,
            organizationId,
            temperature: 0.8  // Creative but focused
          })

          console.log('[Generate] ✅ Typography Intelligence complete')
          console.log('[Generate] Headline:', typographyProfile.headline.characteristics.style, typographyProfile.headline.characteristics.weight)
          console.log('[Generate] Body:', typographyProfile.body.characteristics.style, typographyProfile.body.characteristics.weight)
          console.log('[Generate] Pairing:', typographyProfile.pairingStrategy)
          console.log('[Generate] Confidence:', typographyProfile.confidence)

        } catch (error) {
          console.error('[Generate] ❌ Typography Intelligence failed:', error)
          console.log('[Generate] Using fallback typography profile...')

          typographyProfile = generateFallbackTypography({
            eventName,
            eventProfile,
            formatId,
            formality: eventProfile?.formality,
            energyLevel: eventProfile?.energyLevel,
            emotionalTone: eventProfile?.emotionalTone
          })

          console.log('[Generate] Fallback typography profile generated with confidence:', typographyProfile.confidence)
        }
      } else {
        console.log('[Generate] === STAGE 1.5: TYPOGRAPHY INTELLIGENCE ===')
        console.log('[Generate] Skipped - Format or event profile not suitable for typography intelligence')
        console.log('[Generate] Format:', formatId, '/ Has Event Profile:', eventProfile !== null)
      }

      // ========================================================
      // STAGE 0.5: DESIGN INTELLIGENCE (MOVED BEFORE ULTRA-PRO)
      // Generate story-driven design context FIRST so Ultra-Pro can enhance it
      // Now enhanced with EventProfile from Stage 1 and TypographyProfile from Stage 1.5
      // ========================================================
      console.log('[Generate] === STAGE 0.5: DESIGN INTELLIGENCE ===')
      console.log('[Generate] Generating story-driven design context...')
      if (eventProfile) {
        console.log('[Generate] Using Event Understanding insights from Stage 1')
      }
      if (typographyProfile) {
        console.log('[Generate] Using Typography Intelligence guidance from Stage 1.5')
      }

      // Clean instruction text from the prompt before passing to design intelligence
      // This prevents instruction text like "Create a striking..." from being analyzed
      // Also sanitize any remaining {{placeholders}} that weren't replaced
      const cleanedPrompt = sanitizePlaceholders(cleanPromptInstructions(prompt), 'cleanedPrompt')

      // Extract visual layout context from customization
      const speakerPhotoConfig = effectiveDesignData?.customization?.speakerPhoto
      const layoutConfig = effectiveDesignData?.customization?.layout

      // ========================================================
      // MULTI-SPEAKER AI LAYOUT: Calculate intelligent positioning
      // for 2+ speakers with hierarchy, footer zone validation
      // ========================================================
      let totalSpeakers = 0             // Local variable for speaker tracking

      if (speakerPhotoConfig) {
        // CRITICAL: Count only speakers WITH photos, not total speakers
        // Example: 3 speakers total, but only 1 has photo → count = 1
        speakerCountWithPhotos = getSpeakerCountWithPhotos(speakerPhotoConfig)
        totalSpeakers = speakerPhotoConfig.speakers?.length || (speakerPhotoConfig.photoUrl ? 1 : 0)

        // ========================================================
        // v7.1: SPEAKER LAYOUT AGENT - AI-Powered Pre-Generation Analysis
        // Analyzes TOTAL speakers vs speakers with photos to make intelligent
        // layout decisions. Prevents oversized photos when only some speakers
        // have uploaded photos.
        // ========================================================
        if (totalSpeakers > 0) {
          console.log(`[Speaker Layout Agent] Analyzing ${totalSpeakers} total speakers (${speakerCountWithPhotos} with photos)`)

          try {
            const speakerLayoutResult = await analyzeSpeakerLayout({
              speakerConfig: speakerPhotoConfig,
              formatId: (formatId as string) || 'event_poster',
              canvasWidth: formatDimensions?.width || selectedFormat?.width || 1080,
              canvasHeight: formatDimensions?.height || selectedFormat?.height || 1440,
              aspectRatio: selectedFormat?.aspectRatio || '4:5',
              eventType: formDataContent?.eventType || parsedContent?.eventType,
              organizationId,
              userId: user.id,
            })

            speakerLayoutDecision = speakerLayoutResult.decision
            console.log(`[Speaker Layout Agent] Decision: ${speakerLayoutResult.source} analysis completed in ${speakerLayoutResult.durationMs}ms`)
            console.log(`[Speaker Layout Agent] Layout: ${speakerLayoutDecision.layoutStrategy}, Photo size: ${speakerLayoutDecision.photoSizePercent}%`)
            console.log(`[Speaker Layout Agent] Reasoning: ${speakerLayoutDecision.reasoning}`)
          } catch (error) {
            console.warn('[Speaker Layout Agent] Analysis failed, continuing without agent decision:', error)
            // Continue without agent decision - existing flow will handle layout
          }
        }

        if (speakerCountWithPhotos > 1) {
          console.log(`[Multi-Speaker] Calculating intelligent layout for ${speakerCountWithPhotos} speakers WITH photos (${totalSpeakers} total speakers)`)

        try {
          multiSpeakerLayout = calculateIntelligentLayout({
            speakerCount: speakerCountWithPhotos,  // Use count WITH photos for positions
            formatId: (formatId as string) || 'event_poster',
            canvasWidth: formatDimensions?.width || selectedFormat?.width || 1080,
            canvasHeight: formatDimensions?.height || selectedFormat?.height || 1440,
            sophistication: (effectiveDesignData as any)?.sophistication as 'minimalist' | 'balanced' | 'rich' | undefined || 'balanced',
            // v7.1: Use TOTAL speakers for sizing (prevents oversized photos when only some have photos)
            totalSpeakersForSizing: totalSpeakers > speakerCountWithPhotos ? totalSpeakers : undefined,
          })

          // Validate layout
          if (!multiSpeakerLayout.isValid) {
            console.error('[Multi-Speaker] Layout validation failed:', multiSpeakerLayout.validationErrors)
            // Continue with basic layout (fallback to existing flow)
            multiSpeakerLayout = null
          } else {
            console.log('[Multi-Speaker] Layout calculated successfully:', {
              layoutKey: multiSpeakerLayout.layoutKey,
              positions: multiSpeakerLayout.positions.length,
              sizes: multiSpeakerLayout.positions.map(p => `${p.size}px`),
              footerZoneClear: multiSpeakerLayout.positions.every(p => {
                const bottomEdge = ((p.y + p.size / 2) / (formatDimensions?.height || 1440)) * 100
                return bottomEdge < 85 // Footer zone starts at 85%
              })
            })

            // Log any warnings
            if (multiSpeakerLayout.validationErrors.length > 0) {
              multiSpeakerLayout.validationErrors.forEach(err => {
                if (err.startsWith('⚠️')) {
                  console.warn('[Multi-Speaker]', err)
                }
              })
            }
          }
        } catch (error) {
          console.error('[Multi-Speaker] Layout calculation error:', error)
          multiSpeakerLayout = null
          // Continue with existing flow
        }
        } else if (totalSpeakers > speakerCountWithPhotos) {
          // Some speakers don't have photos - log for debugging
          console.log(`[Multi-Speaker] Skipping AI layout: Only ${speakerCountWithPhotos} of ${totalSpeakers} speakers have photos`)
        }
      }

      // Get format info for format-aware design intelligence
      const formatTemplate = formatId ? getTemplateForFormat(formatId) : null

      // ========================================================
      // LOGO AWARENESS: Build safe zone context for Smart Layout
      // This tells the AI where logos will be overlaid so it can
      // avoid placing text/content in those areas
      // ========================================================
      const logoAwarenessContext = buildLogoAwarenessContext(
        logosPlacements as LogoPlacement[] | undefined
      )
      if (logoAwarenessContext.hasLogos) {
        console.log('[Generate] Logo Awareness - Placements:', buildLogoSummary(logosPlacements as LogoPlacement[]))
        console.log('[Generate] Logo Awareness - Safe Zones:', logoAwarenessContext.safeZoneDescriptions.join(', '))
      }

      // ========================================================
      // THEME INFERENCE: Infer theme from event details
      // This analyzes the user's actual content to suggest better themes
      // Falls back to user-selected theme or event type defaults
      // ========================================================
      const eventDetails: EventDetails = {
        title: formDataContent.eventName || compiledData.eventName || '',
        description: compiledData.description || cleanedPrompt || '',
        venue: formDataContent.venue || compiledData.venue || '',
        // v4.3: Speaker data flows freely for TEXT rendering (reverted from v4.2 gating)
        speakerName: formDataContent.guestName || compiledData.speakerName || '',
        speakerDesignation: formDataContent.guestDesignation || compiledData.speakerDesignation || '',
        tagline: compiledData.tagline || '',
        eventType: formDataContent.eventType || parsedContent.eventType || '',
        organizationName: compiledData.organizationName || '',
        customFields: compiledData.customFields || {},
      }

      // v6.0 Phase 3: Custom AI theme generation
      let finalTheme: string
      let finalStyle: string
      let useCustomThemeGeneration = false

      // Always use AI-custom theme and auto-selected style (user controls removed from UI)
      finalTheme = 'ai-custom'
      finalStyle = autoChoices.style
      useCustomThemeGeneration = true
      console.log(`[AutoDesign] Theme: ai-custom, Style: ${autoChoices.style}`)

      // Only run theme inference for fallback/mood detection (not for theme selection)
      const themeInference = !useCustomThemeGeneration
        ? inferThemeFromDetails(
          eventDetails,
          formDataContent.eventType || parsedContent.eventType
        )
        : null

      // If using theme inference (manual theme selected), log the details
      if (themeInference) {
        console.log('[Generate] === THEME INFERENCE ===')
        console.log('[Generate] User Selected Theme:', effectiveDesignData?.theme || '(none)')
        console.log('[Generate] Inferred Theme:', themeInference.suggestedTheme, `(${themeInference.confidence})`)
        console.log('[Generate] Reason:', themeInference.reason)
        console.log('[Generate] Inferred Mood:', themeInference.inferredMood)
        console.log('[Generate] Final Theme:', finalTheme)
        if (themeInference.alternativeThemes.length > 0) {
          console.log('[Generate] Alternatives:', themeInference.alternativeThemes.join(', '))
        }
      }

      // v36.0 — Context Bridge: Build enriched context from org identity + vertical DNA
      const orgIdentityLines = [
        orgData?.name ? `Chapter: ${orgData.name}` : null,
      ].filter(Boolean)

      const bridgedAdditionalContext = [
        ...orgIdentityLines,
        verticalPresetContext,
        compiledData.tagline || compiledData.description || '',
      ].filter(Boolean).join('\n\n')

      if (orgIdentityLines.length > 0 || verticalPresetContext) {
        console.log(`[v36.0 Context Bridge] Org identity: ${orgIdentityLines.length} lines, Vertical DNA: ${verticalPresetContext ? 'YES' : 'NO'}`)
      }

      const designBrief: DesignBrief = {
        // Event content - PRIORITY: User form data > Compiled data > Parsed
        // v5.0: REMOVED Ultra-Pro dependencies - Design Intelligence runs FIRST now
        eventType: formDataContent.eventType || parsedContent.eventType,
        eventName: formDataContent.eventName || compiledData.eventName || parsedContent.eventName || 'Event',
        // v36.0: Use real org name from DB, fall back to form field
        organizationName: orgData?.name || compiledData.organizationName || 'Yi Creatives',
        details: cleanedPrompt
          || [compiledData.tagline, compiledData.description].filter(Boolean).join('. ')
          || '', // Use compiled description for design context; tagline injected for accurate visual context
        theme: useCustomThemeGeneration ? undefined : finalTheme,  // Don't pass theme if AI generating custom
        style: finalStyle,
        requestCustomTheme: useCustomThemeGeneration,  // v6.0 Phase 3: NEW flag for AI custom theme
        // Speaker/Guest data - flows freely for TEXT rendering
        // v4.3: Reverted from v4.1 gating - speaker TEXT should render, only PHOTO PLACEHOLDER should be prevented
        guestName: formDataContent.guestName || compiledData.speakerName || parsedContent.guestName,
        guestDesignation: formDataContent.guestDesignation || compiledData.speakerDesignation || parsedContent.guestDesignation,
        venue: formDataContent.venue || compiledData.venue || parsedContent.venue,
        // v36.0: Use bridged context (org identity + vertical DNA + tagline/description)
        additionalContext: bridgedAdditionalContext,

        // v4.2: Brand context for color-aware intelligence
        brandContext: {
          // v36.0: Use real org name from DB
          organizationName: orgData?.name || compiledData.organizationName || 'Organization',
          primaryColor: resolvedColors.primaryColor,
          secondaryColor: resolvedColors.secondaryColor,
          accentColor: resolvedColors.accentColor,
          fontPreference: fontPreference,
          useBrandColors: colorConfig?.useBrandColors ?? false,
          useBrandFont: colorConfig?.useBrandFont ?? true, // Pass user preference
          colorSource: resolvedColors.source as any,
        },

        // === FORMAT AWARENESS (CRITICAL - defines design TYPE) ===
        // Format takes PRIORITY over event type for design direction
        formatId: formatId,
        formatName: selectedFormat?.label,
        formatCategory: formatTemplate?.basePattern,
        formatGuidance: formatTemplate?.promptTemplate?.substring(0, 300),

        // === VISUAL LAYOUT CONTEXT (CRITICAL FOR BETTER IMAGE GENERATION) ===
        // Speaker photo configuration
        hasSpeakerPhoto: speakerPhotoConfig?.enabled ?? false,
        speakerPhotoPosition: speakerPhotoConfig?.position,
        speakerPhotoShape: speakerPhotoConfig?.shape,
        speakerPhotoSize: speakerPhotoConfig?.size as any,
        // Logo zone configuration
        hasHeaderLogo: (layoutConfig?.headerHeight ?? 0) > 0,
        headerHeight: layoutConfig?.headerHeight,
        hasFooterLogo: (layoutConfig?.footerHeight ?? 0) > 0,
        footerHeight: layoutConfig?.footerHeight,

        // === LOGO AWARENESS (Smart Layout) ===
        logoSafeZoneGuidance: logoAwarenessContext.layoutGuidance || undefined,

        // Target audience (flows from form → compiledData → design intelligence)
        targetAudience: compiledData.targetAudience || undefined,

        // v33.1: Pass visual direction to Design Intelligence for concept-aware background generation
        // v45.0 yi_spotlight: Creative Director brief overrides/augments user visual direction
        additionalVisualBrief: compiledData.visualDirection || undefined,
      }

      // v47.1: Background style → inject visual direction into DI brief BEFORE DI runs
      // Only set when no user visual direction already exists (don't override Spotlight Brief)
      if (backgroundStyle && backgroundStyle !== 'scene' && !designBrief.additionalVisualBrief) {
        const BG_STYLE_DI_HINTS: Record<string, string> = {
          abstract:    'STYLE OVERRIDE — USER SELECTED ABSTRACT: Ignore the SCENE-BASED concept preference. DO NOT generate real scenes or Indian people. Generate flowing color gradients, soft geometric shapes, and fluid art in the brand palette. Abstract gradients ARE acceptable here. Use CONCEPT 3 (CONCEPTUAL).',
          dark:        'STYLE OVERRIDE — USER SELECTED DARK CINEMATIC: Ignore the SCENE-BASED concept preference. Generate deep near-black atmosphere with dramatic light rays, glowing halos, and bokeh particles using the brand accent color. People are silhouettes or absent. Use CONCEPT 2 or CONCEPT 3.',
          illustrated: 'STYLE OVERRIDE — USER SELECTED ILLUSTRATED: Ignore the SCENE-BASED concept preference. Generate flat vector-style illustrated elements — bold icons, clean graphic shapes related to the event theme. Solid fills, no photorealism. Use CONCEPT 2 or CONCEPT 3.',
          bokeh:       'STYLE OVERRIDE — USER SELECTED BOKEH & LIGHT: Ignore the SCENE-BASED concept preference. Generate soft out-of-focus atmosphere with glowing light orbs and warm sparkle particles in the brand palette. All elements are blurred and dreamy, not sharp or photorealistic. Use CONCEPT 3.',
          geometric:   'STYLE OVERRIDE — USER SELECTED GEOMETRIC PATTERN: Ignore the SCENE-BASED concept preference AND the ban on geometric patterns. Generate bold geometric shapes (hexagons, triangles, diagonal bands, tessellation) in the brand palette. Geometric patterns ARE required here. Use CONCEPT 3.',
          texture:     'STYLE OVERRIDE — USER SELECTED TEXTURED MATERIAL: Ignore the SCENE-BASED concept preference. Generate a physical material surface (marble veining, woven fabric, paper grain, brushed metal) tinted in the brand palette. No scenes or people. Use CONCEPT 2.',
          split:       'STYLE OVERRIDE — USER SELECTED SPLIT LAYOUT: Left half is an event-relevant atmospheric scene; right half is a clean solid brand-color panel where all text will be placed. Sharp or soft diagonal edge separates them.',
          neon:        'STYLE OVERRIDE — USER SELECTED NEON GLOW: Ignore the SCENE-BASED concept preference. Generate deep near-black background with vivid electric neon light trails, glowing grid lines, bioluminescent halos, and pulsing light streaks in the brand accent color. No realistic scenes or Indian people. Use CONCEPT 3.',
          duotone:     'STYLE OVERRIDE — USER SELECTED DUOTONE: Ignore the SCENE-BASED concept preference. Generate imagery mapped to exactly TWO brand colors — shadows in primary, highlights in secondary/accent. Bold, high-contrast two-tone treatment. Abstract or silhouette forms only. Use CONCEPT 2 or CONCEPT 3.',
          glassmorphism: 'STYLE OVERRIDE — USER SELECTED GLASSMORPHISM: Ignore the SCENE-BASED concept preference. Generate translucent frosted-glass panels layered over soft gradient blobs or bokeh in brand colors. Clean modern depth, no realistic scenes. Use CONCEPT 3.',
          watercolor:  'STYLE OVERRIDE — USER SELECTED WATERCOLOR: Ignore the SCENE-BASED concept preference. Generate soft organic paint washes and flowing pigment spreads in the brand palette. Wet watercolor bleeds, brush strokes, visible paper grain. Purely painterly, no photorealism. Use CONCEPT 3.',
          mandala:     'STYLE OVERRIDE — USER SELECTED MANDALA: Ignore the SCENE-BASED concept preference. Generate intricate radial mandala pattern with Indian floral motifs, paisley elements, and traditional ornaments in the brand palette. Symmetrical, ornate, cultural. Gold accents on darker base. Use CONCEPT 3.',
          custom:      `STYLE OVERRIDE — AI CUSTOM THEME: Ignore the SCENE-BASED concept preference. Based ONLY on the event details provided (event name, tagline, description, theme, venue), you must creatively decide: (1) a gradient color palette that perfectly matches the event mood and theme, (2) a single thematic visual focal element (object, symbol, or motif) that represents the event, (3) a text style that fits the event energy. Layout: logo bar safe zone top → vivid full-canvas gradient (your chosen colors) → your chosen focal visual centred in upper content zone → event details (headline, tagline, date, venue) BELOW the focal visual → logo bar safe zone bottom. NO photorealistic Indian scenes. Use CONCEPT 2 or CONCEPT 3.`,
        }
        designBrief.additionalVisualBrief = BG_STYLE_DI_HINTS[backgroundStyle]
      }

      // Creative brief step — runs BEFORE Design Intelligence so brief is injected as HIGHEST PRIORITY
      // • creativeMode === 'spotlight' → Spotlight Creative Brief (single focal visual)
      // • verticalSlug === 'yi_spotlight' → legacy Creative Director (backward compat)
      if ((creativeMode === 'spotlight' || verticalSlug === 'yi_spotlight') && !compiledData.visualDirection) {
        const isSpotlight = creativeMode === 'spotlight'
        console.log(`[${isSpotlight ? 'Spotlight Brief' : 'Creative Director'}] Generating visual concept...`)
        try {
          const briefInput = {
            eventName: compiledData.eventName || '',
            eventDescription: compiledData.description || compiledData.tagline || '',
            venue: compiledData.venue || '',
            targetAudience: compiledData.targetAudience || '',
            tagline: compiledData.tagline || '',
            eventType: formDataContent.eventType || '',
          }

          const cdResult = isSpotlight
            ? await generateSpotlightCreativeBrief(
                briefInput,
                ((adjustedUserFormData as Record<string, unknown>)?.theme as 'tricolor' | 'brand' | 'gradient') || 'tricolor'
              )
            : await generateCreativeDirectorBrief(briefInput)

          // Inject as highest-priority visual brief
          designBrief.additionalVisualBrief = cdResult.fullBrief
          console.log(`[${isSpotlight ? 'Spotlight Brief' : 'Creative Director'}] Brief injected:`, cdResult.fullBrief.substring(0, 150) + '...')
        } catch (cdErr) {
          console.error(`[${isSpotlight ? 'Spotlight Brief' : 'Creative Director'}] Non-blocking error:`, cdErr)
          // Continue without brief — fallback to normal generation
        }
      }

      // Generate AI-powered design context
      // v6.0 Phase 2: Pass resolvedColors for color-aware background generation
      // v6.5 Phase 1: Pass eventProfile from Stage 1 for concept-driven design
      // Nebula: pass pre-computed AIEventContext so DI skips its internal analyzeEventContext call
      const preComputedAiEventContext = await analyzeEventContextPromise
      const designContextResult = await generateDesignContextSafe(
        designBrief,
        resolvedColors,
        eventProfile,
        styleConfig.id !== 'auto' ? {
          temperatures: {
            eventContext: styleConfig.temperatures.eventContext,
            storytelling: styleConfig.temperatures.storytelling,
          },
          creativeDirection: styleConfig.creativeDirection || undefined,
        } : undefined,
        preComputedAiEventContext
      )

      // CRITICAL: Sanitize Design Context to filter risky single-word keywords
      // Prevents Gemini from rendering visual guidance as visible text labels
      designContext = sanitizeDesignContext(designContextResult.context)

      // NEW: Context validation logging
      // v6.0: VALIDATION REMOVED - Trust Design Intelligence validation
      // Design Intelligence already validates with sophisticated logic:
      // - Semantic equivalents for 10 event types
      // - Length-based relaxation (>800 chars bypass)
      // - Greeting pattern detection
      // - Contradiction detection
      // - 3 retry attempts before fallback
      // No need for duplicate validation here.

      // v5.5: VARIATION DEBUGGING - Track Design Intelligence visual elements
      console.log('[VARIATION DEBUG] Design Intelligence visualElements:', designContext?.visualElements?.join(', ') || 'NONE')
      console.log('[VARIATION DEBUG] visualElements Count:', designContext?.visualElements?.length || 0)

      // Track Design Intelligence API usage
      if (designContextResult.usage.model !== 'fallback') {
        await usageTracker.track(
          'design_intelligence',
          designContextResult.usage.provider as AIProvider,
          designContextResult.usage.model,
          {
            inputTokens: designContextResult.usage.tokenUsage.inputTokens,
            outputTokens: designContextResult.usage.tokenUsage.outputTokens,
            cachedTokens: designContextResult.usage.tokenUsage.cachedTokens,
            durationMs: designContextResult.usage.durationMs,
            promptLength: prompt.length,
          }
        )
      }

      // v6.0: Check if fallback was used (using authoritative source from Design Intelligence)
      const usedFallback = designContextResult.usage.model === 'fallback'

      console.log('[Generate] === DESIGN CONTEXT RESULT ===')
      console.log('[Generate] Source:', designContextResult.usage.model)
      console.log('[Generate] Used Fallback:', usedFallback ? 'YES (AI failed/retries exhausted)' : 'NO (AI succeeded)')
      console.log('[Generate] Core Purpose:', designContext?.corePurpose)
      console.log('[Generate] Visual Elements:', designContext?.visualElements?.join(', ') ?? 'None')
      console.log('[Generate] Background Setting:', designContext?.backgroundSetting)
      console.log('[Generate] Iconic Imagery:', designContext?.iconicImagery?.join(', ') ?? 'None')

      if (usedFallback) {
        console.warn('[Generate] ⚠️ Using fallback context - Design Intelligence validation failed after retries')
      }

      // ========================================================
      // STAGE 1: ULTRA-PRO PROMPT ENHANCEMENT (NOW WITH DESIGN CONTEXT)
      // v5.0: Ultra-Pro now ENHANCES Design Intelligence context instead of working independently
      // Converts story-driven design context into Gemini 2.5 optimized narrative prompts
      // ========================================================
      console.log('[Generate] === STAGE 1: ULTRA-PRO ENHANCEMENT ===')
      console.log('[Generate] Enhancing Design Intelligence with Ultra-Pro prompt optimization...')
      console.log('[Generate] Logo Strip Mode:', logoStripMode?.enabled ? 'ENABLED' : 'disabled')

      // v6.0: Detect dual-stripe mode for ultra-pro-prompt text placement
      // Dual-stripe: primary logos (Yi/Bharat/CII) + vertical program logos = 18% header + 20% text start
      // Single-stripe: primary logos only = 8% header + 15% text start
      const dualStripeMode = (logoStripMode?.enabled || false) && !!verticalSlug
      console.log('[Generate] Dual-Stripe Mode:', dualStripeMode ? 'YES (20% text start)' : 'NO (15% text start)')

      // v36.0 — Generation Memory: fetch org's recent successful prompts (pre-launched in Nebula block)
      const recentOrgPrompts = await recentOrgPromptsPromise
      if (recentOrgPrompts.length > 0) {
        console.log(`[v36.0 Generation Memory] Found ${recentOrgPrompts.length} recent prompts for org=${organizationId}, format=${formatId}`)
      }

      const ultraProResult = await generateUltraProPromptSafe(
        compiledData, 'claude', designContext, logoStripMode?.enabled || false, resolvedColors, dualStripeMode,
        styleConfig.id !== 'auto' ? {
          temperatureOverride: styleConfig.temperatures.ultraPro,
          creativeDirection: styleConfig.creativeDirection || undefined,
          modelGuidance: modelGuidance || undefined,
        } : undefined,
        recentOrgPrompts.length > 0 ? recentOrgPrompts : undefined
      )
      const ultraProPrompt = ultraProResult.prompt

      console.log('[Generate] === ULTRA-PRO RESULT ===')
      console.log('[Generate] Primary Text:', ultraProPrompt.primaryText)
      console.log('[Generate] Enhanced Prompt (first 200 chars):', ultraProPrompt.enhancedPrompt?.substring(0, 200))
      console.log('[Generate] Visual Scene:', ultraProPrompt.visualScene)
      console.log('[Generate] Design Guidance:', ultraProPrompt.designGuidance)

      // v5.5: VARIATION DEBUGGING - Track cache behavior for creative formats
      // v7.0: All formats are creative formats - no hardcoded list
      console.log('[VARIATION DEBUG] Ultra-Pro Cache Status:', ultraProResult.usage.model === 'cached' ? '🔄 HIT (reused)' : '✅ MISS (fresh)')
      console.log('[VARIATION DEBUG] Format:', formatId)
      console.log('[VARIATION DEBUG] Is Creative Format:', !!formatId) // v7.0: All formats supported

      // ========================================================
      // STAGE 2: Build enhanced prompt with AI-generated context
      // ========================================================

      // Check if we should use the new XML-structured prompts (Gemini-optimized)
      // This path uses YiPromptBuilder for cleaner, more structured prompts
      const shouldUseXmlPrompts = useXmlPrompts || (
        provider === 'google' &&
        formatId &&
        YiPromptBuilder.isSupportedFormat(formatId)
      )

      if (shouldUseXmlPrompts && provider === 'google' && formatId) {
        // ========================================================
        // NEW: XML-STRUCTURED PROMPT GENERATION v3.0 (Gemini-optimized)
        // Uses YiPromptBuilder with enhanced options for:
        // - Logo awareness (keeping zones clear for overlay)
        // - Brand context (organization colors)
        // - Resolution/quality guidance
        // - Few-shot examples
        // ========================================================
        console.log('[Generate] === USING XML-STRUCTURED PROMPTS (v3.0) ===')
        console.log('[Generate] Format:', formatId)
        console.log('[Generate] User Form Data:', JSON.stringify(sanitizeForLogging(userFormData), null, 2))

        // Determine resolution
        const resolution = (promptDesignData?.resolution || '1K') as '1K' | '2K' | '4K'

        // ========================================================
        // STAGE 2.5: UNIFIED TYPOGRAPHY + COLOR OPTIMIZATION (v5.0)
        // Single AI call optimizes BOTH typography AND colors for maximum harmony
        // Only runs if user has enabled AI optimization (future UI toggle)
        // ========================================================
        let unifiedOptimization: Awaited<ReturnType<typeof import('@/lib/ai/typography/unified-optimization').optimizeTypographyAndColors>> | null = null

        // Check if AI optimization is enabled (currently always enabled, will add UI toggle in Phase 4.2)
        const enableAIOptimization = (userFormData?.enableAIOptimization as boolean) ?? false

        if (enableAIOptimization) {
          console.log('[Generate] === UNIFIED TYPOGRAPHY + COLOR OPTIMIZATION ===')
          console.log('[Generate] Running AI-powered typography and color optimization...')

          try {
            const { optimizeTypographyAndColors } = await import('@/lib/ai/typography/unified-optimization')

            unifiedOptimization = await optimizeTypographyAndColors({
              eventType: formDataContent.eventType || parsedContent.eventType || 'professional',
              eventName: formDataContent.eventName || compiledData.eventName || 'Event',
              eventDescription: cleanedPrompt
                || [compiledData.tagline, compiledData.description].filter(Boolean).join('. ')
                || undefined,
              targetMood: designContext?.moodDirection || themeInference?.inferredMood || 'professional',
              brandColors: {
                primary: resolvedColors.primaryColor,
                secondary: resolvedColors.secondaryColor,
                accent: resolvedColors.accentColor,
              },
            })

            console.log('[Generate] Unified Optimization Success:')
            console.log('  - Typography:', `${unifiedOptimization.typography.headingFont} + ${unifiedOptimization.typography.bodyFont}`)
            console.log('  - Scale:', unifiedOptimization.typography.scale)
            console.log('  - Color Strategy:', unifiedOptimization.colors.paletteStrategy)
            console.log('  - WCAG Compliance:', unifiedOptimization.colors.accessibilityReport.wcagCompliance)
            console.log('  - Overall Quality:', unifiedOptimization.harmony.overallQuality)
            console.log('  - Confidence:', unifiedOptimization.confidence)
          } catch (error) {
            console.error('[Generate] Unified Optimization Error:', error)
            // Continue without optimization - non-blocking failure
          }
        }

        // ========================================================
        // Build EnhancedBuildOptions v3.1 - Form Data Completeness
        // Passes ALL user data to format builders, including:
        // - Theme & style preferences
        // - Layout zone configuration
        // - Speaker photo config (for zone reservation, even if user has own photo)
        // - Organization context (name, tagline, industry)
        // - Content type and format size
        // - Multi-color typography (NEW v5.0 from unified optimization)
        // ========================================================

        // Store original speaker photo config BEFORE it was disabled for prompt
        // This allows builders to reserve the correct zone even when user overlays their own photo
        const originalSpeakerPhotoConfig = effectiveDesignData?.customization?.speakerPhoto

        const buildOptions: EnhancedBuildOptions = {
          verticalId: verticalSlug,
          resolution: resolution,
          language: language || 'en',

          // NEW v24.7: Pass engine for model-aware zone enforcement
          // Pro model needs STRICTER zone constraints than Flash model
          // Pro ignores percentage-based prose guidance, needs explicit boundaries
          engine: model === 'gemini-3-pro-image-preview' ? 'yi_craft' : 'yi_vision',  // Flash 2.5 and Flash 3.1 both use yi_vision zone semantics

          // Logo awareness - tells AI where to keep zones clear for overlay
          // Supports multiple logos with individual positions and sizes
          logoAwareness: logoAwarenessContext.hasLogos ? {
            hasLogo: true,
            // Primary logo (backward compatible)
            logoPosition: logoAwarenessContext.activeLogos[0]?.position as 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center-top' || 'top-left',
            logoSize: 'medium',
            clearZone: logoAwarenessContext.layoutGuidance || 'Keep logo area(s) clear for overlay',
            // All logos for multi-logo support
            logos: logoAwarenessContext.activeLogos.map(logo => ({
              position: (logo.position || 'top-left') as 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center-top',
              size: (typeof logo.sizePreset === 'string' ? logo.sizePreset : 'medium') as 'small' | 'medium' | 'large',
            })),
          } : undefined,

          // Brand context - always include organization info for awareness
          // v3.10: Now uses resolved colors from ColorConfig (brand/preset/custom/fallback)
          // fontPreference is ALWAYS applied when available (v3.2 - hybrid approach)
          brandContext: {
            organizationName: designBrief.organizationName || 'Yi Creatives',
            brandName: designBrief.organizationName,

            // NEW v3.10: Use resolved colors instead of conditional logic
            primaryColor: resolvedColors.primaryColor,
            secondaryColor: resolvedColors.secondaryColor,
            accentColor: resolvedColors.accentColor,

            // Keep flag for prompt builder logic
            useBrandColors: colorConfig?.useBrandColors ?? false,

            // NEW v3.10: Add color source for debugging
            colorSource: resolvedColors.source,

            // Font preference from organization settings (always applied when available)
            fontPreference: fontPreference,
            useBrandFont: colorConfig?.useBrandFont ?? true,
          },

          // NEW v5.5: Resolved colors for pipeline flow validation
          // Ensures user-selected colors are preserved throughout prompt generation
          // Prevents hardcoded event-type colors from overriding user selections
          resolvedColors: resolvedColors,

          // NEW v3.1: Theme & style preferences
          theme: effectiveDesignData?.theme,
          style: effectiveDesignData?.style,
          backgroundStyle: backgroundStyle as import('@/lib/prompts/services/yi-prompt-builder/types').BackgroundStyleId | undefined,
          // NEW v3.1: Layout zone configuration (header/footer heights)
          layout: layoutConfig ? {
            headerHeight: layoutConfig.headerHeight,
            footerHeight: layoutConfig.footerHeight,
          } : undefined,

          // v3.4: Only reserve speaker photo zone when user has ACTUALLY uploaded a photo
          // If enabled but no photo, don't send zone instructions (prevents AI from drawing placeholder frame)
          // Previous behavior: sent zone config with hasUserPhoto=false, causing AI to render a visible placeholder frame
          // v3.5: Support multi-speaker format (checks both legacy photoUrl and new speakers array)
          speakerPhotoConfig: (
            originalSpeakerPhotoConfig?.enabled && (
              originalSpeakerPhotoConfig?.photoUrl ||  // Legacy single speaker
              (originalSpeakerPhotoConfig?.speakers && originalSpeakerPhotoConfig.speakers.some(s => s.photoUrl))  // Multi-speaker
            )
          ) ? {
            enabled: true,
            position: (originalSpeakerPhotoConfig.position || 'left') as 'left' | 'right' | 'center',
            // v24.12: Pass vertical position to prompt builder for text zone calculation
            verticalPosition: (originalSpeakerPhotoConfig.verticalPosition || 'bottom') as 'top' | 'upper' | 'middle' | 'lower' | 'bottom',
            // v24.11: Use numeric size directly from slider (100-400px) instead of categorical conversion
            numericSize: originalSpeakerPhotoConfig.size || 380,
            shape: (originalSpeakerPhotoConfig.shape || 'circle') as 'circle' | 'rounded' | 'square',
            hasUserPhoto: true,  // Always true now since we only send config when photo exists
            // Multi-speaker context
            isSingleSpeaker: !!originalSpeakerPhotoConfig.photoUrl,
            speakerCount: originalSpeakerPhotoConfig.speakers?.length || 1,
          } : undefined,

          // NEW v3.1: Organization context for branding identity
          organizationContext: {
            name: designBrief.organizationName || 'Yi Creatives',
            tagline: (userFormData?.tagline as string) || undefined,
            industry: verticalSlug,
          },

          // NEW v3.1: Format-specific content type (e.g., LinkedIn article vs announcement)
          contentType: (userFormData?.contentType as string) || (userFormData?.postType as string) || undefined,

          // NEW v3.1: Format-specific size (e.g., A4/A5 for flyers, banner dimensions)
          formatSize: (userFormData?.size as string) || (userFormData?.bannerSize as string) || undefined,

          // NEW v3.2: Design context from Design Intelligence stage
          // Contains AI-generated visual elements, background setting, and iconic imagery
          // Used by format builders to inject decorative elements into prompts
          // v3.10: Skip AI color suggestions when user explicitly selected colors (brand/preset/custom)
          // v5.0: Pass FULL Design Intelligence context including v4.2 story-driven fields
          designContext: designContext ? {
            // Legacy fields (v3.x)
            corePurpose: designContext.corePurpose,
            visualElements: designContext.visualElements,
            backgroundSetting: designContext.backgroundSetting,
            iconicImagery: designContext.iconicImagery || [],
            // v3.4: Typography and decorative guidance
            typographyGuidance: designContext.typographyGuidance,
            decorativeElements: designContext.decorativeElements,
            // v3.10: Skip AI color suggestions when user explicitly selected colors
            colorStrategy: (resolvedColors.source !== 'fallback') ? undefined : designContext.colorMood,
            moodDirection: designContext.designStrategy,
            creativeTwist: designContext.creativeTwist,
            emotionalJob: designContext.emotionalJob,
            designStrategy: designContext.designStrategy,
            // v4.2: NEW Story-driven design intelligence fields
            storyAnalysis: designContext.storyAnalysis,
            vibeAndMood: designContext.vibeAndMood,
            typographyStrategy: designContext.typographyStrategy,
            colorStorytelling: designContext.colorStorytelling,
            backgroundTreatment: designContext.backgroundTreatment,
            decorativeElementsContext: designContext.decorativeElementsContext,
            layoutNarrative: designContext.layoutNarrative,
            overallDesignStrategy: designContext.overallDesignStrategy,
          } : undefined,

          // NEW v3.4: Footer contact information for creative footers
          // Contains effective values (custom per-creative OR brand defaults)
          footerContext: (footerContext.website || footerContext.phone || footerContext.email || footerContext.address || footerContext.social) ? footerContext : undefined,

          // NEW v4.0: Prevention enhancements from Feedback Learning Agent
          // Contains learned prompt improvements based on past user feedback
          preventionEnhancements: promptEnhancements.length > 0 ? promptEnhancements : undefined,

          // NEW v4.4: ULTRA-PRO CONTEXT (The Missing Link)
          // Direct pipe from Stage 0.5 Claude analysis to Stage 2 Image Generation
          // v5.0: Pass FULL Ultra-Pro result (all fields, not just 2)
          ultraProContext: {
            primaryText: ultraProPrompt.primaryText,
            secondaryText: ultraProPrompt.secondaryText,
            visualScene: ultraProPrompt.visualScene,
            designGuidance: ultraProPrompt.designGuidance,
            textPlacementHints: ultraProPrompt.textPlacementHints,
            colorPaletteHints: ultraProPrompt.colorPaletteHints,
            mustIncludeElements: ultraProPrompt.mustIncludeElements,
            enhancedPrompt: ultraProPrompt.enhancedPrompt,
          },

          // NEW v5.0: MULTI-COLOR TYPOGRAPHY from Unified Optimization
          // Role-based color configuration with WCAG accessibility validation
          // Only included when AI optimization is enabled
          multiColorTypography: unifiedOptimization?.colors,

          // NEW v7.1: SPEAKER LAYOUT AGENT CONTEXT
          // AI-analyzed layout decision for speaker photos based on TOTAL speakers
          // Prevents oversized photos when only some speakers have uploaded photos
          speakerLayoutContext: speakerLayoutDecision?.promptContext || undefined,

          // NEW v33.5b: SCENE NARRATIVE — Direct injection into format builders
          // buildSceneNarrative() maps venue/audience to specific Indian environment descriptions
          // Previously only fed into Ultra-Pro (Claude) but never reached the Yi Prompt Builder
          // Now Gemini directly sees "multi-story college buildings, seminar halls" etc.
          sceneNarrative: buildSceneNarrative(compiledData) || undefined,
        }

        console.log('[Generate] EnhancedBuildOptions:', JSON.stringify(sanitizeForLogging(buildOptions), null, 2))

        // v20.7: CRITICAL - Calculate logo zone heights BEFORE speaker coordinates
        // This prevents speaker photo from overlapping with header/footer logo bars
        // Previously, speaker coordinates were calculated first without knowing logo zone sizes
        let preCalculatedHeaderHeight = 0
        let preCalculatedFooterHeight = 0

        if (enhanced4RowStrip?.enabled && selectedFormat?.height) {
          const { height } = selectedFormat
          // Quick calculation of active rows (same logic as full calculation below)
          const activeRowsQuick = {
            brand: hasBrandLogos(enhanced4RowStrip),
            vertical: hasVerticalLogos(enhanced4RowStrip),
            initiative: hasInitiativeText(enhanced4RowStrip),
            footer: hasFooterContent(enhanced4RowStrip.footer),
          }
          const activeHeaderRowCount = [activeRowsQuick.brand, activeRowsQuick.vertical, activeRowsQuick.initiative].filter(Boolean).length

          // Calculate header height
          if (activeRowsQuick.brand) preCalculatedHeaderHeight += ENHANCED_STRIP_ROW_HEIGHTS.brand
          if (activeRowsQuick.vertical) preCalculatedHeaderHeight += ENHANCED_STRIP_ROW_HEIGHTS.vertical
          if (activeRowsQuick.initiative) preCalculatedHeaderHeight += ENHANCED_STRIP_ROW_HEIGHTS.initiative
          if (activeHeaderRowCount > 1) preCalculatedHeaderHeight += (activeHeaderRowCount - 1) * 8
          preCalculatedHeaderHeight += 24 // vertical padding
          if (activeRowsQuick.vertical) preCalculatedHeaderHeight += 60 // Row 2 card clearance
          preCalculatedHeaderHeight = Math.min(preCalculatedHeaderHeight, height * 0.25)

          // Calculate footer height
          if (activeRowsQuick.footer) {
            const baseFooterHeight = enhanced4RowStrip.footer?.height || 180
            preCalculatedFooterHeight = baseFooterHeight + 88
            preCalculatedFooterHeight = Math.min(preCalculatedFooterHeight, height * 0.18)
          }

          console.log('[Generate v20.7] Pre-calculated zone heights for speaker safety:', {
            headerHeight: Math.round(preCalculatedHeaderHeight),
            footerHeight: Math.round(preCalculatedFooterHeight),
          })
        }

        // v6.5: Pre-calculate speaker photo coordinates for Gemini prompt injection
        // This enables coordination between Gemini generation and Sharp overlay
        // v6.5.1: Added selectedFormat null check to prevent crash
        // v6.5.2: Added explicit width/height checks to prevent undefined property access
        // v20.2: speakerPhotoZoneCoordinates now declared at function scope (line 204)
        if (buildOptions.speakerPhotoConfig && originalSpeakerPhotoConfig && selectedFormat?.width && selectedFormat?.height) {
          // v24.11: Use numeric size directly from slider (100-400px)
          // Previous categorical mapping (small/medium/large) caused all values >100 to become 380px
          let photoSize = (buildOptions.speakerPhotoConfig as { numericSize?: number }).numericSize || originalSpeakerPhotoConfig.size || 380
          console.log(`[Generate v24.11] Speaker photo size from slider: ${photoSize}px`)
          const borderWidth = originalSpeakerPhotoConfig.border?.width || 0

          // v20.8: CRITICAL FIX - Scale photo size based on TOTAL speakers, not just count with photos
          // Scenario: 3 speakers (details) but only 1 photo uploaded
          // Problem: Without scaling, photo is 380px ('large') which overlaps with 3-speaker text zone
          // Solution: Scale photo to fit multi-speaker layout even if only 1 photo
          const totalSpeakersCount = originalSpeakerPhotoConfig.speakers?.length || 1
          const speakersWithPhotosCount = originalSpeakerPhotoConfig.speakers?.filter(s => s.photoUrl)?.length || (originalSpeakerPhotoConfig.photoUrl ? 1 : 0)

          if (totalSpeakersCount > 1 && speakersWithPhotosCount === 1) {
            // Use multi-speaker sizing to prevent overlap with speaker text zone
            // Multi-speaker sizes are smaller: 2 speakers ~324px, 3 speakers ~270px, 4 speakers ~240px
            const multiSpeakerSizeMap: Record<number, number> = {
              2: 300,  // 2 speakers → ~300px each
              3: 260,  // 3 speakers → ~260px each
              4: 220,  // 4 speakers → ~220px each
            }
            const scaledSize = multiSpeakerSizeMap[totalSpeakersCount] || multiSpeakerSizeMap[4]
            console.log(`[Generate v20.8] ⚠️ Photo size scaled for ${totalSpeakersCount}-speaker layout:`)
            console.log(`  - Original size: ${photoSize}px (user selected '${buildOptions.speakerPhotoConfig.size}')`)
            console.log(`  - Scaled size: ${scaledSize}px (to fit ${totalSpeakersCount} speaker text zones)`)
            console.log(`  - Reason: ${totalSpeakersCount} speakers with details, but only ${speakersWithPhotosCount} photo`)
            photoSize = scaledSize
          }

          // v24.26: Use calculateMultiSpeakerExclusionZone for accurate Gemini exclusion
          // This accounts for text dimensions and multi-speaker layouts, solving the coordinate mismatch
          // between the old calculateSpeakerPhotoCoordinates() (photo-only) and calculateMultiSpeakerPositions() (with text)
          const exclusionZoneSpeakerCount = totalSpeakersCount || 1
          const exclusionZoneLayout: LayoutStrategy = exclusionZoneSpeakerCount <= 3 ? 'side-by-side' : exclusionZoneSpeakerCount <= 6 ? 'grid' : 'stacked'

          speakerPhotoZoneCoordinates = calculateMultiSpeakerExclusionZone({
            speakerCount: exclusionZoneSpeakerCount,
            layout: exclusionZoneLayout,
            imageWidth: selectedFormat.width,
            imageHeight: selectedFormat.height,
            photoSize: photoSize,
            spacing: 40,  // v24.25 default spacing
            position: buildOptions.speakerPhotoConfig.position || 'left',
            // v24.28: CRITICAL FIX - Use 'bottom' as fallback to match design-constants.ts default
            // Previously 'top' was used, causing exclusion zone at 44% while Sharp overlaid at 60%
            verticalPosition: originalSpeakerPhotoConfig.verticalPosition || 'bottom',
            shadow: originalSpeakerPhotoConfig.shadow !== false,
            textEnabled: true,  // Always true for grouped speaker cards
          })

          console.log('[Generate] v24.26: Speaker exclusion zone (with text dimensions):', speakerPhotoZoneCoordinates)
        }

        // v7.0: Calculate logo strip zone coordinates for 4-Row Enhanced Strip
        // This tells Gemini AI to reserve space for logo strips (header and footer)
        // Similar to how speakerPhotoZoneCoordinates works for speaker photos
        // v24.0: Variable now declared at function level (line ~310) for global accessibility
        if (enhanced4RowStrip?.enabled && selectedFormat?.width && selectedFormat?.height) {
          const { width, height } = selectedFormat

          // v12.3: CRITICAL FIX - Use ACTUAL row heights from ENHANCED_STRIP_ROW_HEIGHTS constants
          // Previously used outdated hardcoded values (brand=80, vertical=70) causing ~30px overlap
          // Now uses actual rendering heights (brand=95, vertical=85) + correct spacing/padding

          // v12.2: CRITICAL FIX - ALL rows (header + footer) now use content-based checks
          // Previously used .enabled flags, causing AI content to overlap when enabled=false but content exists
          // v12.1 fixed footer, v12.2 extends fix to header rows (brand, vertical, initiative)
          // Determine which rows are active
          const activeRows = {
            brand: hasBrandLogos(enhanced4RowStrip),          // v12.2: Content-based check
            vertical: hasVerticalLogos(enhanced4RowStrip),    // v12.2: Content-based check
            initiative: hasInitiativeText(enhanced4RowStrip), // v12.2: Content-based check
            footer: hasFooterContent(enhanced4RowStrip.footer), // v12.1: Content-based check
          }

          // v12.2: Debug logging for ALL rows safe zone calculation
          console.log('[Logo Strip Safe Zone] Content checks:', {
            header: {
              brand: {
                enabled: enhanced4RowStrip.rows.brand?.enabled,
                hasLogos: hasBrandLogos(enhanced4RowStrip),
                willReserve: activeRows.brand,
              },
              vertical: {
                enabled: enhanced4RowStrip.rows.vertical?.enabled,
                hasLogos: hasVerticalLogos(enhanced4RowStrip),
                willReserve: activeRows.vertical,
              },
              initiative: {
                enabled: enhanced4RowStrip.rows.initiative?.enabled,
                hasText: hasInitiativeText(enhanced4RowStrip),
                willReserve: activeRows.initiative,
              },
            },
            footer: {
              enabled: enhanced4RowStrip.footer?.enabled,
              hasHashtag: !!enhanced4RowStrip.footer?.hashtag.text.trim(),
              hasWebsite: !!(enhanced4RowStrip.footer?.website.url.trim() || enhanced4RowStrip.footer?.website.socialHandle?.trim()),
              hasPartner: !!(enhanced4RowStrip.footer?.digitalPartner.logoId || enhanced4RowStrip.footer?.digitalPartner.labelText.trim()),
              willReserve: activeRows.footer,
            },
          })

          // Calculate header strip height (ROW 1 + ROW 2 + ROW 3)
          // v12.3: CRITICAL FIX - Use actual ENHANCED_STRIP_ROW_HEIGHTS constants instead of outdated hardcoded values
          // Previously: brand=80, vertical=70, initiative=40 (WRONG!)
          // Actual rendering: brand=95, vertical=85, initiative=40 (from design-constants.ts)
          // This mismatch caused AI content to overlap logo strips by ~30px

          // Count active rows for spacing calculation
          const activeHeaderRowCount = [activeRows.brand, activeRows.vertical, activeRows.initiative].filter(Boolean).length

          let headerHeight = 0
          if (activeRows.brand) headerHeight += ENHANCED_STRIP_ROW_HEIGHTS.brand       // 95px (was 80)
          if (activeRows.vertical) headerHeight += ENHANCED_STRIP_ROW_HEIGHTS.vertical    // 85px (was 70)
          if (activeRows.initiative) headerHeight += ENHANCED_STRIP_ROW_HEIGHTS.initiative  // 40px (unchanged)

          // Add row spacing between rows (8px between each row)
          if (activeHeaderRowCount > 1) {
            headerHeight += (activeHeaderRowCount - 1) * 8  // 8px spacing between rows
          }

          // Add vertical padding (12px top + 12px bottom = 24px total)
          headerHeight += 24

          // v19.0: Add clearance buffer for Row 2 visual bounds (card styling, padding, shadow)
          // Row 2 has a white card with rounded corners that extends beyond the base 85px height
          if (activeRows.vertical) {
            headerHeight += 60  // Extra clearance for Row 2 white card visual bounds
          }

          // Cap header at 25% of canvas height
          headerHeight = Math.min(headerHeight, height * 0.25)

          // Calculate footer height (ROW 4 - Footer Bar)
          // v12.4: CRITICAL - Increased footer reserve from ~10% to ~12% for better AI compliance
          // v17.0: CRITICAL - Increased footer cap from 15% to 18% for Zone 1 signature logo visibility
          // Footer bar height (80px default) + 88px buffer for guaranteed AI content clearance
          let footerHeight = 0
          if (activeRows.footer) {
            const baseFooterHeight = enhanced4RowStrip.footer?.height || 180 // v17.1: Updated from 80 to 180 to match DEFAULT_FOOTER_CONFIG
            // v12.4: Increased buffer from 60px to 88px for stronger AI compliance (168px total = ~12% of 1400px canvas)
            // This larger buffer creates a "reinforcement zone" that Gemini AI is more likely to respect
            footerHeight = baseFooterHeight + 88 // = 168px total reserve (~12% for standard 1400px canvas, ~13% for 1344px)
            // v17.0: Increased cap from 15% to 18% to prevent signature logo clipping in Zone 1
            footerHeight = Math.min(footerHeight, height * 0.18)
          }

          // v16.4 FIX: Calculate initiative text contrast against WHITE card background
          // Initiative text is rendered on white floating card (v16.4), NOT poster background
          // Previous logic used primaryColor causing light gray text on white = invisible
          let initiativeContrastInfo: InitiativeContrastInfo | null = null
          if (hasInitiativeText(enhanced4RowStrip)) {
            const WHITE_CARD_BG = '#FFFFFF'  // v16.4: Actual background color
            initiativeContrastInfo = calculateInitiativeContrast(
              enhanced4RowStrip.rows.initiative.color,
              WHITE_CARD_BG  // v16.4: White floating card, not primary color
            )
            console.log('[Color Contrast] Initiative Text (v16.4 - WHITE CARD BG):', {
              textColor: enhanced4RowStrip.rows.initiative.color,
              cardBackground: WHITE_CARD_BG,
              contrastRatio: `${initiativeContrastInfo.contrastRatio.toFixed(1)}:1`,
              meetsWCAG_AA: initiativeContrastInfo.contrastRatio >= 4.5,
            })

            // v16.4: Only adjust if contrast is poor against WHITE (most colors work fine on white)
            if (initiativeContrastInfo.needsAdjustment) {
              enhanced4RowStrip.rows.initiative.color = initiativeContrastInfo.adjustedColor
              console.log('[Color Contrast] ✅ Initiative text adjusted for white background:', {
                from: initiativeContrastInfo.color,
                to: initiativeContrastInfo.adjustedColor
              })
            }
          }

          logoStripZoneCoordinates = {
            headerHeight: Math.round(headerHeight),
            headerReservePercent: Math.round((headerHeight / height) * 100),
            footerHeight: Math.round(footerHeight),
            footerReservePercent: Math.round((footerHeight / height) * 100),
            activeRows,
            initiativeColorInfo: initiativeContrastInfo || undefined, // v13.0: Pass to AI
          }

          // v12.3: Enhanced logging to show header height breakdown
          console.log('[Generate] Logo strip zone coordinates calculated:', {
            ...logoStripZoneCoordinates,
            headerBreakdown: {
              brandHeight: activeRows.brand ? ENHANCED_STRIP_ROW_HEIGHTS.brand : 0,
              verticalHeight: activeRows.vertical ? ENHANCED_STRIP_ROW_HEIGHTS.vertical : 0,
              initiativeHeight: activeRows.initiative ? ENHANCED_STRIP_ROW_HEIGHTS.initiative : 0,
              rowSpacing: activeHeaderRowCount > 1 ? (activeHeaderRowCount - 1) * 8 : 0,
              verticalPadding: 24,
              totalBeforeCap: (activeRows.brand ? ENHANCED_STRIP_ROW_HEIGHTS.brand : 0) +
                              (activeRows.vertical ? ENHANCED_STRIP_ROW_HEIGHTS.vertical : 0) +
                              (activeRows.initiative ? ENHANCED_STRIP_ROW_HEIGHTS.initiative : 0) +
                              (activeHeaderRowCount > 1 ? (activeHeaderRowCount - 1) * 8 : 0) + 24,
              canvasHeight: height,
              capAt25Percent: height * 0.25,
            },
          })

          // ========================================================
          // v24.6: FULL-CANVAS GENERATION (REVERTED v24.4)
          // ========================================================
          // REVERTED: v24.4 content-only generation
          // REASON: User wants Gemini to generate FULL canvas including header/footer design
          //         Original working setup had Gemini-generated blue gradient header (not static!)
          //         Logo bars overlay with TRANSPARENT backgrounds (Gemini's colors show through)
          //
          // APPROACH: Generate at FULL canvas size (e.g., 1080x1440)
          //           Gemini creates complete poster including header/footer artistic design
          //           Logo bars overlay with transparent/semi-transparent backgrounds
          //           Accept potential text-logo overlaps (trade-off for Gemini creativity)
          //

          // ⚠️ PROTECTION: Verify full-canvas generation is enabled (v24.6)
          if (!USE_FULL_CANVAS_GENERATION) {
            throw new Error(
              '[v24.6 Protection] USE_FULL_CANVAS_GENERATION is disabled! ' +
              'User requires full-canvas generation with transparent logo overlays. ' +
              'Read doc/v24.6-full-canvas-restoration.md before changing this setting.'
            )
          }

          console.log('[v24.6 Full-Canvas] ✓ Protection verified: Full-canvas generation enabled')
          console.log('[v24.6 Full-Canvas] Generating at FULL canvas size:', {
            dimensions: `${width}x${height}`,
            aspectRatio: selectedFormat!.aspectRatio,
            approach: 'Let Gemini generate complete poster including header/footer design'
          })

          // Keep selectedFormat at original full-canvas dimensions
          // No content-only calculation needed
          // Logo bars will overlay with transparent backgrounds (alpha: 0 to 0.85)
        }

        // v4.3: Removed form data sanitization - speaker TEXT should flow through for rendering
        // The "no placeholder" instruction is added in format builders instead

        // v20.2: DO NOT filter speakers from formData
        // Keep ALL speakers for text rendering (names, designations)
        // Photo overlay zones are controlled separately via multiSpeakerLayout or speakerPhotoZoneCoordinates
        // The overlay function will filter to only speakers WITH photos using getSpeakersWithPhotos()

        // v29.1: Comprehensive speaker merge — collect from ALL sources and deduplicate.
        // Speakers can live in three places depending on how they were entered:
        //   A) userFormData.speakers  — from MultiSpeakerInput (direct form input)
        //   B) designData.customization.speakerPhoto.speakers — from smart-paste or design panel
        //   C) userFormData.speakerName / guestName — single-speaker backwards-compat fields
        const enrichedFormData: Record<string, unknown> = { ...(userFormData || {}) }
        const mergedSpeakers: Array<{ name: string; designation: string }> = []

        // Source A: multi-speaker array already in userFormData
        if (Array.isArray(enrichedFormData.speakers)) {
          for (const s of enrichedFormData.speakers as Array<{ name?: string; designation?: string }>) {
            if (s.name?.trim()) {
              mergedSpeakers.push({ name: s.name.trim(), designation: s.designation?.trim() || '' })
            }
          }
        }

        // Source B: designData.customization.speakerPhoto (from smart-paste or design panel)
        if (originalSpeakerPhotoConfig?.speakers?.length) {
          for (const s of originalSpeakerPhotoConfig.speakers) {
            const name = (s as any).name?.trim()
            if (name && !mergedSpeakers.some((m) => m.name === name)) {
              mergedSpeakers.push({ name, designation: (s as any).designation?.trim() || '' })
            }
          }
        }

        // Source C: single-speaker fields (backwards compat)
        const singleName = (enrichedFormData.speakerName || enrichedFormData.guestName || enrichedFormData.speaker) as string | undefined
        if (singleName?.trim() && !mergedSpeakers.some((m) => m.name === singleName.trim())) {
          mergedSpeakers.push({
            name: singleName.trim(),
            designation: (enrichedFormData.speakerDesignation || enrichedFormData.guestDesignation || '') as string,
          })
        }

        if (mergedSpeakers.length > 0) {
          enrichedFormData.speakers = mergedSpeakers
          console.log(`[Generate v29.1] Merged ${mergedSpeakers.length} speaker(s) from all sources into enrichedFormData`)
        }

        // Backward-compat single-speaker fields for builders that only read speakerName
        if (!enrichedFormData.speakerName && mergedSpeakers[0]?.name) {
          enrichedFormData.speakerName = mergedSpeakers[0].name
          enrichedFormData.speakerDesignation = mergedSpeakers[0].designation
        }

        // Build XML-structured prompt using YiPromptBuilder
        const xmlPrompt = YiPromptBuilder.buildPrompt(formatId, enrichedFormData, {
          ...buildOptions,
          // v6.5: Pass calculated speaker photo coordinates to prompt builder
          speakerPhotoZoneCoordinates,
          // v7.0: Pass calculated logo strip zone coordinates to prompt builder
          logoStripZoneCoordinates,
        })

        // Inject vertical context if applicable (redundant with buildOptions.verticalId but kept for compatibility)
        // v46.0: Pass brand colors so vertical's hardcoded Yi palette (jewel tones, Yi Orange,
        // tricolor accents) is overridden for non-Yi orgs that have their own brand colors.
        const verticalBrandColors = resolvedColors && resolvedColors.source !== 'fallback'
          ? { primary: resolvedColors.primaryColor, secondary: resolvedColors.secondaryColor, accent: resolvedColors.accentColor }
          : undefined
        const finalXmlPrompt = verticalSlug
          ? injectVerticalContext(xmlPrompt, verticalSlug, verticalBrandColors)
          : xmlPrompt

        // v24.0: Store prompt for potential regeneration if text violations are detected
        storedPromptForRegeneration = finalXmlPrompt

        // CRITICAL: Validate speaker text presence in prompt
        // v38.0: Support both XML tags (pre-sanitization) and parenthetical markers (post-sanitization)
        const formSpeakers = (enrichedFormData as any)?.speakers || (formDataContent as any)?.speakers || [];
        if (formSpeakers && formSpeakers.length > 0) {
          const speakerNameMatch = finalXmlPrompt.match(/<text role="speaker_name[^"]*"[^>]*>([^<]+)<\/text>/) ||
            finalXmlPrompt.match(/\(speaker_name[^)]*\)\s*"([^"]+)"/);

          if (!speakerNameMatch) {
            console.error('[Generation] 🚨 SPEAKER TEXT NOT IN PROMPT!');
            console.error('[Generation] ⚠️ Speaker will NOT render in image');
            console.error('[Generation] Expected speaker:', formSpeakers[0]?.name);
            console.error('[Generation] Speakers array length:', formSpeakers.length);
          } else {
            console.log('[Generation] ✅ Speaker text found in prompt:', speakerNameMatch[1]);
          }
        }

        // v5.5: Validate that user colors made it into the final prompt
        // Check for hex string OR color name (hex may be stripped by colorName() helper)
        if (resolvedColors.source !== 'fallback') {
          const { describeColor } = await import('@/lib/utils/color-names')
          const primaryName = describeColor(resolvedColors.primaryColor).name
          const secondaryName = describeColor(resolvedColors.secondaryColor).name
          const promptIncludesPrimary = finalXmlPrompt.includes(resolvedColors.primaryColor) || finalXmlPrompt.includes(primaryName)
          const promptIncludesSecondary = finalXmlPrompt.includes(resolvedColors.secondaryColor) || finalXmlPrompt.includes(secondaryName)

          if (!promptIncludesPrimary) {
            console.warn(`⚠️  [Color Flow] PRIMARY COLOR MISSING: ${resolvedColors.primaryColor} (${resolvedColors.source}) not found in final prompt`)
          }
          if (!promptIncludesSecondary) {
            console.warn(`⚠️  [Color Flow] SECONDARY COLOR MISSING: ${resolvedColors.secondaryColor} (${resolvedColors.source}) not found in final prompt`)
          }

          if (promptIncludesPrimary && promptIncludesSecondary) {
            console.log(`✅ [Color Flow] User colors preserved in final prompt: ${resolvedColors.primaryColor}, ${resolvedColors.secondaryColor} (${resolvedColors.source})`)
          }
        }

        console.log('[Generate] XML Prompt Preview (first 1000 chars):')
        console.log(finalXmlPrompt.substring(0, 1000))
        console.log('[Generate] ... (truncated)')

        // Get system instruction from YiPromptBuilder
        const systemInstruction = YiPromptBuilder.getSystemInstruction()

        // v41.0: Logo bar scaffold — replaces zone guide with a base image for Gemini editing mode
        // Gemini sees the actual blue bars and must design AROUND them (not just read instructions)
        // This makes zone violations physically impossible rather than just advisory
        // zoneGuideBase64 is hoisted to outer scope so retry blocks can access it
        try {
          const aspectKey = selectedFormat?.aspectRatio as keyof typeof DIMENSION_QUALITY
          const resKey = (resolution || '1K') as keyof (typeof DIMENSION_QUALITY)['3:4']
          const guideDims = DIMENSION_QUALITY[aspectKey]?.[resKey]
          if (guideDims) {
            const { createLogoBarScaffold } = await import('@/lib/sharp/logo-overlay')
            // v42.2: Scaffold shows ACTUAL bar height only (~24-25%).
            // Sharp now handles ALL text (headline/tagline/date/venue) — Gemini generates background only.
            // The old 40% scaffold was creating a large visual "empty upper zone" that made Gemini
            // generate a split composition (minimal top + main scene below). Now that Gemini doesn't
            // need to know where the headline goes, show the actual boundary so it fills the canvas uniformly.
            const actualHeaderH = logoStripZoneCoordinates?.headerHeight ?? 350
            const scaffoldHeaderPx = Math.round(actualHeaderH / 1440 * guideDims.height)  // actual bar height
            const scaffoldFooterPx = logoStripZoneCoordinates?.footerHeight ?? Math.round(guideDims.height * 0.18)
            const scaffoldBuffer = await createLogoBarScaffold(
              guideDims.width,
              guideDims.height,
              scaffoldHeaderPx,
              scaffoldFooterPx,
            )
            zoneGuideBase64 = scaffoldBuffer.toString('base64')
            console.log(`[Scaffold] ✅ Logo bar scaffold: ${guideDims.width}x${guideDims.height} header=${scaffoldHeaderPx}px (${Math.round(scaffoldHeaderPx/guideDims.height*100)}%) footer=${scaffoldFooterPx}px (${Math.round(scaffoldFooterPx/guideDims.height*100)}%)`)
          }
        } catch (zoneGuideErr) {
          console.warn('[Scaffold] ⚠️ Failed to create scaffold (non-critical, continuing without):', zoneGuideErr)
        }

        // Generate with Gemini — v43.3: preview model 429 → auto-fallback to stable
        try {
          ;({ imageBase64: imageUrl, actualModel: imageActualModel } = await generateWithGemini(
            finalXmlPrompt,
            promptDesignData,
            systemInstruction,
            selectedFormat,
            resolution,
            model,
            0,
            thinkingLevel,
            useImageSearch,
            zoneGuideBase64
          ))
        } catch (genErr: any) {
          const errMsg = (genErr?.message || '').toLowerCase()
          const is429 = errMsg.includes('429') || errMsg.includes('too many requests') || errMsg.includes('quota') || errMsg.includes('resource_exhausted')
          const isPreviewModel = model && model.includes('preview')
          if (is429 && isPreviewModel) {
            // v43.3: Preview model quota exhausted — silently retry with stable model
            console.warn(`[v43.3 Fallback] ⚠️ ${model} quota exceeded — retrying with gemini-2.5-flash-image (stable)`)
            ;({ imageBase64: imageUrl, actualModel: imageActualModel } = await generateWithGemini(
              finalXmlPrompt,
              promptDesignData,
              systemInstruction,
              selectedFormat,
              resolution,
              'gemini-2.5-flash-image', // stable model — no preview quota restriction
              0,
              undefined, // thinkingLevel not supported by stable
              false,     // imageSearch not supported by stable
              undefined  // scaffold not supported by stable (v43.2 gate)
            ))
            console.log(`[v43.3 Fallback] ✅ Stable model succeeded — image generated via gemini-2.5-flash-image`)
          } else {
            throw genErr
          }
        }
      } else {
        // ========================================================
        // LEGACY: Original prompt generation path
        // ========================================================
        const promptData = buildDesignPromptWithFormat(
          enhancedPrompt,
          promptDesignData || effectiveDesignData!,
          providerType,
          'Yi Creatives',
          selectedFormat,
          designContext, // Pass AI-generated design context
          language || 'en', // Pass language from request (PRD Section 10.2)
          logoAwarenessContext, // Pass logo awareness for Smart Layout
          multiSpeakerLayout, // Pass multi-speaker layout guidance
          speakerCount, // Pass total speaker count
          speakerCountWithPhotos, // Pass speakers with photos count
          speakerPhotoZoneCoordinates // Pass speaker photo zone coordinates
        )

        // ========================================================
        // INJECT TYPOGRAPHY INTELLIGENCE GUIDANCE (STAGE 1.5)
        // ========================================================
        if (typographyProfile && typographyProfile.confidence > 0.6) {
          // Inject typography guidance into system prompt for Gemini
          const typographyGuidance = `

========================================
TYPOGRAPHY GUIDANCE (AI-GENERATED):
========================================

${typographyProfile.geminiInstructions}

HEADLINE FONT:
${typographyProfile.headline.styleGuidance}
Visual References: ${typographyProfile.headline.visualReferences.join(', ')}
Avoid: ${typographyProfile.headline.avoidPatterns.join(', ')}

BODY FONT:
${typographyProfile.body.styleGuidance}

FONT PAIRING STRATEGY:
${typographyProfile.pairingStrategy}

HIERARCHY:
${typographyProfile.hierarchy}

⚠️ CRITICAL: Typography personality MUST match the event concept. Do not default to generic fonts.
`
          // Append to system prompt
          if (promptData.systemPrompt) {
            promptData.systemPrompt += typographyGuidance
          } else {
            promptData.systemPrompt = typographyGuidance
          }

          console.log('[Generate] ✅ Typography guidance injected into system prompt')
          console.log('[Generate] Typography confidence:', typographyProfile.confidence)
        } else if (typographyProfile) {
          console.log('[Generate] ⚠️ Typography Intelligence available but confidence too low:', typographyProfile.confidence)
        }

        if (provider === 'google') {
          // Extract resolution from designData or use default
          const resolution = promptDesignData?.resolution || '1K'
          ;({ imageBase64: imageUrl, actualModel: imageActualModel } = await generateWithGemini(promptData.prompt, promptDesignData, promptData.systemPrompt, selectedFormat, resolution, model, 0, thinkingLevel, useImageSearch))
        } else if (provider === 'ideogram') {
          imageUrl = await generateWithIdeogram(
            promptData.prompt,
            promptDesignData,
            promptData.styleType,
            promptData.magicPrompt,
            promptData.negativePrompt,
            selectedFormat
          )
        } else if (provider === 'openai') {
          const openAIPromptText = buildOpenAIPrompt({
            ultraProPrompt,
            designContext,
            compiledData,
            format: selectedFormat!,
            logoConfig: {
              hasLogo: logoAwarenessContext.hasLogos,
              positions: logoAwarenessContext.activeLogos.map((l: { position: string }) => l.position),
            },
            imageQuality: imageQuality || 'high',
          })
          ;({ imageBase64: imageUrl, actualModel: imageActualModel } = await generateWithOpenAI(
            openAIPromptText, selectedFormat, imageQuality || 'high', model
          ))
        } else {
          return NextResponse.json(
            { error: 'Invalid AI provider' },
            { status: 400 }
          )
        }
      }
    } else if (templateUrl) {
      // Template-based generation using Gemini Vision with v3.0 integration
      // CRITICAL FIX: Pass userFormData DIRECTLY - don't filter through extractFromFormData!
      // extractFromFormData() only knows hardcoded field names and IGNORES dynamic fields
      // like videoTitle, viewerHook, etc. that come from format-specific schemas.

      console.log('[Template Mode] === USER FORM DATA (RAW) ===')
      console.log('[Template Mode] Raw Form Data:', JSON.stringify(sanitizeForLogging(userFormData), null, 2))
      console.log('[Template Mode] Field Count:', Object.keys(userFormData || {}).length)
      console.log('[Template Mode] Fields:', Object.keys(userFormData || {}).join(', '))

      // Build logo awareness context for template mode (v3.0)
      const templateLogoContext = buildLogoAwarenessContext(
        logosPlacements as LogoPlacement[] | undefined
      )
      if (templateLogoContext.hasLogos) {
        console.log('[Template Mode] Logo Awareness:', buildLogoSummary(logosPlacements as LogoPlacement[]))
      }

      // v4.3: Speaker photo config for template mode (used for zone instructions, not data gating)
      const templateSpeakerPhoto = effectiveDesignData?.customization?.speakerPhoto
      const templateSpeakerPhotoEnabled = templateSpeakerPhoto?.enabled ?? false

      // v4.3: Removed form data sanitization - speaker TEXT should flow through for rendering
      // The "no placeholder" instruction is added in format builders instead

      // Build v3.0 prompt if format is supported
      let templatePrompt = prompt
      if (formatId && YiPromptBuilder.isSupportedFormat(formatId)) {
        console.log('[Template Mode] Using YiPromptBuilder v3.0 for format:', formatId)

        // Build v3.1 options for template mode
        const templateBuildOptions: EnhancedBuildOptions = {
          verticalId: verticalSlug,
          resolution: '1K', // Templates use 1K for Gemini Vision
          language: language || 'en',
          templateMode: true,

          logoAwareness: templateLogoContext.hasLogos ? {
            hasLogo: true,
            logoPosition: templateLogoContext.activeLogos[0]?.position as 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center-top' || 'top-left',
            logoSize: 'medium',
            clearZone: templateLogoContext.layoutGuidance || 'Keep logo area(s) clear for overlay',
            logos: templateLogoContext.activeLogos.map(logo => ({
              position: (logo.position || 'top-left') as 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center-top',
              size: (typeof logo.sizePreset === 'string' ? logo.sizePreset : 'medium') as 'small' | 'medium' | 'large',
            })),
          } : undefined,

          brandContext: {
            organizationName: 'Yi Creatives', // Template mode uses default
            brandName: 'Yi Creatives',
            useBrandColors: false, // Template mode uses template's colors
            useBrandFont: colorConfig?.useBrandFont ?? true,
          },

          // NEW v3.1: Pass content type and format size for template mode too
          contentType: (userFormData?.contentType as string) || (userFormData?.postType as string) || undefined,
          formatSize: (userFormData?.size as string) || (userFormData?.bannerSize as string) || undefined,
        }

        // v20.2: DO NOT filter speakers from formData (template mode)
        // Keep ALL speakers for text rendering - photo zones controlled separately
        // The overlay function filters to only speakers WITH photos

        // Build v3.0 prompt for template adaptation (v4.3: using raw userFormData)
        templatePrompt = YiPromptBuilder.buildPrompt(formatId, userFormData || {}, templateBuildOptions)
        console.log('[Template Mode] v3.0 Prompt Preview:', templatePrompt.substring(0, 500))
      }

      // Template mode uses '1K' resolution since Gemini Vision only supports 1K
      // v4.3: Using raw userFormData (sanitization removed - handled in format builders)
      imageUrl = await generateFromTemplate(templatePrompt, templateUrl, verticalSlug, userFormData, formatDimensions || undefined, selectedFormat, '1K', formatId)

      // Increment template use count
      if (templateId) {
        await supabase.rpc('increment_template_use_count', { template_id: templateId })
      }
    } else if (provider === 'google') {
      ;({ imageBase64: imageUrl, actualModel: imageActualModel } = await generateWithGemini(enhancedPrompt, null, undefined, selectedFormat, '1K', model, 0, thinkingLevel, useImageSearch))
    } else if (provider === 'ideogram') {
      imageUrl = await generateWithIdeogram(enhancedPrompt, null, undefined, undefined, undefined, selectedFormat)
    } else if (provider === 'openai') {
      ;({ imageBase64: imageUrl, actualModel: imageActualModel } = await generateWithOpenAI(
        enhancedPrompt, selectedFormat, imageQuality || 'high', model
      ))
    } else {
      return NextResponse.json(
        { error: 'Invalid AI provider' },
        { status: 400 }
      )
    }

    // Resize to exact format dimensions if format is selected
    // This ensures the output matches the user's selected format exactly
    // Use 'fill' mode to avoid cropping - AI/template has already handled composition
    if (formatDimensions) {
      console.log(`Resizing to exact format dimensions: ${formatDimensions.width}x${formatDimensions.height}`)
      imageUrl = await resizeImageToExactDimensions(
        imageUrl,
        formatDimensions.width,
        formatDimensions.height,
        'fill' // Use fill (stretch) to avoid cropping content
      )
    }

    // ========================================================
    // POST-GENERATION VERIFICATION: Spatial Constraint Validation
    // Detect text in forbidden zones (header/footer safe zones)
    // ========================================================
    try {
      console.log('[Spatial Verification] Checking for text in forbidden zones...')

      // Fetch image buffer for verification
      const imageResponse = await fetch(imageUrl)
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image for verification: ${imageResponse.status}`)
      }
      let imageBuffer = Buffer.from(await imageResponse.arrayBuffer())

      // ========================================================
      // v24.6: USE GEMINI OUTPUT DIRECTLY (REVERTED v24.4/v24.5)
      // ========================================================
      // REVERTED: v24.4 content-only expansion and v24.5 blurred backgrounds
      // REASON: User wants Gemini's FULL canvas output with header/footer design intact
      //         No artificial backgrounds, no expansion, no blurred edges
      //         Gemini generates complete poster including artistic header/footer
      //
      // Simply use Gemini's output as-is (no modifications)
      // Logo bars will overlay with transparent backgrounds (Gemini's design shows through)

      // ⚠️ PROTECTION: Verify Gemini background preservation is enabled (v24.6)
      if (!PRESERVE_GEMINI_BACKGROUNDS) {
        throw new Error(
          '[v24.6 Protection] PRESERVE_GEMINI_BACKGROUNDS is disabled! ' +
          'User requires Gemini\'s original output without artificial backgrounds. ' +
          'Read doc/v24.6-full-canvas-restoration.md before changing this setting.'
        )
      }

      console.log('[v24.6 Full-Canvas] ✓ Protection verified: Gemini backgrounds preserved')
      console.log('[v24.6 Full-Canvas] ✅ Using Gemini output directly (no artificial backgrounds)')

      // Use imageBuffer directly for all subsequent processing
      // No expansion, no blurred backgrounds, no content-only resizing

      // Import the verifier dynamically
      const { detectTextInForbiddenZones } = await import('@/lib/sharp/text-zone-verifier')

      // v41.5: Use FIXED 40% header threshold — matches scaffold (0–40% solid bar zone).
      // The 40% covers both: actual bar background (0–25%) + floating Row 2/3 cards (25–40%).
      // Footer uses actual bar height — no floating elements there.
      const canvasHForVerifier = formatDimensions?.height || 1440
      const actualFooterBarPx = logoStripZoneCoordinates?.footerHeight ?? 0
      const headerEndPercent = 40  // matches scaffold: bar (25%) + floating cards (25-40%)
      const footerStartPercent = actualFooterBarPx > 0
        ? Math.floor(((canvasHForVerifier - actualFooterBarPx) / canvasHForVerifier) * 100) - 2
        : 82  // fallback
      console.log(`[Spatial Verification] Thresholds v41.5: header=40% (bar+floats), footer=${actualFooterBarPx}px→${footerStartPercent}%`)

      const violations = await detectTextInForbiddenZones(
        imageBuffer,
        headerEndPercent,
        footerStartPercent
      )

      if (violations.length > 0) {
        console.warn('[Spatial Verification] ⚠️ VIOLATIONS DETECTED:', violations)

        // Log each violation for analytics tracking
        for (const violation of violations) {
          console.error(
            `[Spatial Verification] ${violation.severity.toUpperCase()}: ` +
            `Text detected in ${violation.zoneType} forbidden zone ` +
            `(${violation.forbiddenRangeStart}-${violation.forbiddenRangeEnd}%)`
          )
        }

        // v41.8: Header retry DISABLED — logo strip always covers 0–40% zone.
        // "Violations" here are stone/scene art texture false-positives (not Gemini text).
        // Gemini no longer renders text anywhere (v41.8 background-only prompt).
        // Retrying wastes 2+ minutes and always falls back to original anyway.
        // v41.8: HEADER_RETRY_ENABLED=false — logo strip covers 0–40% zone regardless.
        // Violations detected here are stone/scene texture false-positives (not Gemini text).
        // Gemini renders background-only (no text anywhere) so retrying serves no purpose.
        const HEADER_RETRY_ENABLED = false
        const headerViolation = violations.find(v => v.zoneType === 'header' && v.severity === 'critical')
        if (headerViolation) {
          console.log('[v41.8 Zone Retry] ℹ️ Header zone has scene art — logo strip will cover. Skipping retry (false positive).')
        }
        if (HEADER_RETRY_ENABLED && headerViolation && storedPromptForRegeneration) {
          console.log('[v32.1 Zone Retry] 🔄 Critical header violation detected — retrying generation with stronger zone instructions')

          // v40.6: Pixel-based boundary — concrete pixel values are more reliable than percentages
          const canvasW = formatDimensions?.width  || 1080
          const canvasH = formatDimensions?.height || 1440
          const headerEndPx   = Math.round(canvasH * headerEndPercent  / 100)  // e.g. 576px for 1440h
          const footerStartPx = Math.round(canvasH * footerStartPercent / 100)  // e.g. 936px for 1440h
          const detectedPx    = Math.round(canvasH * headerViolation.detectedTextY / 100)
          console.log(`[v32.1 Zone Retry] Canvas: ${canvasW}x${canvasH}px | Header forbidden: 0–${headerEndPx}px | Footer forbidden: ${footerStartPx}–${canvasH}px`)

          // PREPEND the retry instruction so it has highest attention weight (not append)
          const retryInstruction = `<instruction>(DO NOT RENDER) ⚠️ CRITICAL ZONE ENFORCEMENT — RETRY (v40.6):
CANVAS SIZE: ${canvasW}×${canvasH} pixels.
Your previous generation placed text/content at y≈${detectedPx}px (top ${headerViolation.detectedTextY.toFixed(1)}% of canvas).
This area is PHYSICALLY COVERED by a logo overlay bar — your content is COMPLETELY HIDDEN there.

PIXEL-EXACT FORBIDDEN ZONES:
  TOP FORBIDDEN:    y=0px    → y=${headerEndPx}px   (top ${headerEndPercent}%)  — NO TEXT, NO ICONS, NO LABELS
  BOTTOM FORBIDDEN: y=${footerStartPx}px → y=${canvasH}px (bottom ${100-footerStartPercent}%) — NO TEXT, NO ICONS, NO LABELS

PIXEL-EXACT CONTENT ZONE:
  PLACE ALL TEXT:   y=${headerEndPx}px → y=${footerStartPx}px ONLY

The zone reference image attached shows these exact pixel boundaries visually.
Do NOT render any text, title, date, venue, or label above y=${headerEndPx}px or below y=${footerStartPx}px.
</instruction>

`
          const zoneRetryPrompt = retryInstruction + storedPromptForRegeneration

          try {
            const retrySystemInstruction = YiPromptBuilder.getSystemInstruction()
            const retryResolution = (effectiveDesignData?.resolution || '1K') as '1K' | '2K' | '4K'

            const retryResult = await generateWithGemini(
              zoneRetryPrompt,
              effectiveDesignData || null,
              retrySystemInstruction,
              selectedFormat,
              retryResolution,
              model,
              0,
              thinkingLevel,
              useImageSearch,
              zoneGuideBase64 // v40.3: Pass zone guide through retries
            )

            // Resize retry result to exact format dimensions
            let retryImageUrl = retryResult.imageBase64
            if (formatDimensions) {
              retryImageUrl = await resizeImageToExactDimensions(
                retryImageUrl,
                formatDimensions.width,
                formatDimensions.height,
                'fill'
              )
            }

            // Verify retry result
            const retryResponse = await fetch(retryImageUrl)
            if (retryResponse.ok) {
              const retryBuffer = Buffer.from(await retryResponse.arrayBuffer())
              const retryViolations = await detectTextInForbiddenZones(retryBuffer, headerEndPercent, footerStartPercent)
              const retryHeaderViolation = retryViolations.find(v => v.zoneType === 'header')

              if (!retryHeaderViolation) {
                console.log('[v32.1 Zone Retry] ✅ Retry succeeded — no header violations')
                imageUrl = retryImageUrl
                imageBuffer = retryBuffer
                if (retryResult.actualModel) imageActualModel = retryResult.actualModel
              } else {
                console.warn('[v32.1 Zone Retry] ⚠️ Retry still has header violation — using original (logo bars will cover)')
              }
            }
          } catch (retryError) {
            console.error('[v32.1 Zone Retry] ❌ Retry failed, continuing with original:', retryError)
          }
        }

        // Footer zone violations are intentionally not retried — the logo overlay physically
        // covers the footer area, so any text there is hidden by the overlay anyway.
        // Retrying would double the API cost for no visible improvement.
      } else {
        console.log('[Spatial Verification] ✓ No violations detected')
      }
      // v41.8: Blur step removed entirely.
      // Header zone: logo bar rows (alpha 0.1/0/0.85) composite on top — Gemini art shows through.
      // Footer zone: footer strip composites on top — covers the full zone regardless of Gemini content.
      // Sharp renders ALL event text (headline/tagline/date/venue) — no Gemini text to hide.
      console.log('[v41.8] ✅ No blur applied — logo bars and footer strip cover both zones')

    } catch (verificationError) {
      // Don't fail the entire generation if verification fails
      console.error('[Spatial Verification] Verification failed (non-fatal):', verificationError)
    }

    // If logos need to be overlaid, process with Sharp
    // v14.2: Skip individual logo placement when enhanced 4-row strip is enabled
    // The 4-row strip fetches and places brand logos from logosPlacements automatically
    // v25.0: When enhanced4RowStrip exists but enabled=false, skip ALL logo overlays (user disabled the feature)
    // Only use legacy system for old creatives without enhanced4RowStrip config at all
    const hasEnhanced4RowConfig = enhanced4RowStrip !== undefined
    if (logosPlacements && logosPlacements.length > 0 && !hasEnhanced4RowConfig) {
      // NEW v4.8: Design Intelligence for Logo Strips
      // If user hasn't manually selected a strip shape, infer it from the AI's design strategy/vibe
      let stripShape = designData?.stripShape

      if (!stripShape && designContext?.designStrategy) {
        const inferredStyle = getLogoStripStyleByVibe(designContext.designStrategy)
        stripShape = inferredStyle.shape
        console.log(`[Design Intelligence] Auto-selected strip shape '${stripShape}' for vibe '${designContext.designStrategy}'`)
      }

      console.log(`Processing ${logosPlacements.length} logo placements with background color: ${logoBackgroundColor || '#FFFFFF'}`)
      console.log(`Logo strip mode: ${logoStripMode?.enabled ? 'ENABLED' : 'disabled'} for rows: ${logoStripMode?.rows?.join(', ') || 'none'}, opacity: ${logoStripMode?.opacity ?? 100}%, logoBound: ${logoStripMode?.logoBound ?? false}`)
      console.log(`Logo strip shape: ${stripShape || 'default (curved)'}`) // NEW v3.11
      imageUrl = await overlayLogos(imageUrl, logosPlacements, supabase, logoBackgroundColor, logoStripMode, stripShape)
    } else if (hasEnhanced4RowConfig) {
      // User has enhanced4RowStrip config - either enabled or explicitly disabled
      if (enhanced4RowStrip?.enabled) {
        console.log('[Logo Placement] Skipping individual logo placement - Enhanced 4-Row Strip will handle brand logos')
      } else {
        console.log('[Logo Placement] Logo Strip feature is DISABLED by user - skipping all logo overlays')
      }
    }

    // ========================================================
    // ENHANCED 4-ROW STRIP OVERLAY (Yi Brand Guidelines 2025)
    // 4-row unified logo stripe OR split layout (header + footer)
    // ========================================================
    if (enhanced4RowStrip?.enabled) {
      const isSplitLayout = enhanced4RowStrip.version === '4-row-split'
      console.log(`[Enhanced 4-Row Strip] Processing ${isSplitLayout ? 'SPLIT (header+footer)' : 'UNIFIED'} strip overlay...`)
      console.log('[Enhanced 4-Row Strip] Configuration:', {
        version: enhanced4RowStrip.version || '4-row',
        brandEnabled: enhanced4RowStrip.rows.brand.enabled,
        verticalEnabled: enhanced4RowStrip.rows.vertical.enabled,
        verticalLogoCount: enhanced4RowStrip.rows.vertical.logoIds.length,
        initiativeEnabled: enhanced4RowStrip.rows.initiative.enabled,
        initiativeText: enhanced4RowStrip.rows.initiative.text,
        partnerEnabled: enhanced4RowStrip.rows.partner.enabled,
        partnerLabel: enhanced4RowStrip.rows.partner.labelText,
        backgroundColor: enhanced4RowStrip.background.color,
        ...(isSplitLayout && {
          footerEnabled: enhanced4RowStrip.footer?.enabled,
          footerHashtag: enhanced4RowStrip.footer?.hashtag?.text,
          footerWebsite: enhanced4RowStrip.footer?.website?.url,
          footerDigitalPartner: enhanced4RowStrip.footer?.digitalPartner?.enabled,
        }),
      })

      try {
        // v7.1: Fetch logo buffers from Supabase storage
        // Enhanced with organization filter and better error logging
        const fetchLogoBuffer = async (logoId: string): Promise<{ logoId: string; buffer: Buffer; width: number; height: number } | null> => {
          // First: Try to get URL from logosPlacements (already sent in payload)
          let logoUrl = logosPlacements?.find(p => p.logoId === logoId)?.logo?.file_url
          let source = 'logosPlacements'

          // Second: If not in logosPlacements, query the organization_logos table with organization filter
          // This handles enhanced4RowStrip logos selected from the logos dropdown
          if (!logoUrl) {
            const { data: logoData, error } = await supabase
              .from('organization_logos')
              .select('file_url, organization_id, name')
              .eq('id', logoId)
              .eq('organization_id', organizationId) // Filter by organization for RLS
              .single()

            if (error) {
              console.warn(`[Enhanced 4-Row Strip] Supabase query error for logo ${logoId} (org: ${organizationId}):`, error.message)
            }

            if (logoData?.file_url) {
              logoUrl = logoData.file_url
              source = `logos table (org: ${organizationId})`
            }
          }

          // Third: Fallback - try without organization filter (for shared/global logos)
          if (!logoUrl) {
            const { data: sharedLogoData, error: sharedError } = await supabase
              .from('organization_logos')
              .select('file_url, name')
              .eq('id', logoId)
              .single()

            if (sharedError) {
              console.warn(`[Enhanced 4-Row Strip] Shared logo query error for ${logoId}:`, sharedError.message)
            }

            if (sharedLogoData?.file_url) {
              logoUrl = sharedLogoData.file_url
              source = 'shared logos (fallback)'
              console.log(`[Enhanced 4-Row Strip] Found logo ${logoId} in shared logos: ${sharedLogoData.name}`)
            }
          }

          if (!logoUrl) {
            console.warn(`[Enhanced 4-Row Strip] No URL found for logo ${logoId} - checked logosPlacements + logos table (org: ${organizationId}) + shared`)
            return null
          }

          console.log(`[Enhanced 4-Row Strip] Fetching logo ${logoId} from ${source}: ${logoUrl.substring(0, 80)}...`)

          try {
            const response = await fetch(logoUrl)
            if (!response.ok) {
              console.error(`[Enhanced 4-Row Strip] HTTP error fetching logo ${logoId}: ${response.status}`)
              return null
            }
            const buffer = Buffer.from(await response.arrayBuffer())
            const sharp = await getSharp()
            const metadata = await sharp(buffer).metadata()
            return {
              logoId,
              buffer,
              width: metadata.width || 100,
              height: metadata.height || 100,
            }
          } catch (err) {
            console.error(`[Enhanced 4-Row Strip] Failed to fetch logo ${logoId}:`, err)
            return null
          }
        }

        // Log vertical logo IDs for debugging
        console.log('[Enhanced 4-Row Strip] Vertical logo IDs to fetch:', enhanced4RowStrip.rows.vertical.logoIds)

        // Fetch brand, vertical, and partner logos all in parallel
        const brandLogoIds = enhanced4RowStrip.rows.brand.logoIds.length > 0
          ? enhanced4RowStrip.rows.brand.logoIds
          : logosPlacements?.slice(0, 3).map(p => p.logoId) || []

        const partnerLogoId = isSplitLayout
          ? enhanced4RowStrip.footer?.digitalPartner?.logoId
          : enhanced4RowStrip.rows.partner.logoId

        console.log('[Enhanced 4-Row Strip] Fetching brand, vertical, and partner logos in parallel...')
        const [brandLogosResults, verticalLogosResults, partnerLogoResult] = await Promise.all([
          Promise.all(brandLogoIds.map(fetchLogoBuffer)),
          Promise.all(enhanced4RowStrip.rows.vertical.logoIds.map(fetchLogoBuffer)),
          partnerLogoId ? fetchLogoBuffer(partnerLogoId) : Promise.resolve(null),
        ])

        const brandLogos = brandLogosResults.filter((l): l is NonNullable<typeof l> => l !== null)
        const verticalLogos = verticalLogosResults.filter((l): l is NonNullable<typeof l> => l !== null)
        let partnerLogo: { logoId: string; buffer: Buffer; width: number; height: number } | undefined = partnerLogoResult ?? undefined

        // v14.0: Fetch signature from landmark_signatures table (NEW) or logos table (legacy)
        let signatureLogo: { logoId: string; buffer: Buffer; width: number; height: number } | undefined
        if (isSplitLayout && enhanced4RowStrip.footer?.signature?.enabled) {
          // First try signatureId (new landmark_signatures table)
          if (enhanced4RowStrip.footer?.signature?.signatureId) {
            const signatureId = enhanced4RowStrip.footer.signature.signatureId
            try {
              // Fetch signature details from landmark_signatures table
              const { data: signatureData } = await supabase
                .from('landmark_signatures')
                .select('file_url, width, height')
                .eq('id', signatureId)
                .eq('organization_id', organizationId)
                .single()

              if (signatureData?.file_url) {
                const signatureResponse = await fetch(signatureData.file_url)
                if (signatureResponse.ok) {
                  const signatureBuffer = Buffer.from(await signatureResponse.arrayBuffer())
                  const { default: sharp } = await import('sharp')
                  const metadata = await sharp(signatureBuffer).metadata()
                  signatureLogo = {
                    logoId: signatureId,
                    buffer: signatureBuffer,
                    width: metadata.width || signatureData.width || 200,
                    height: metadata.height || signatureData.height || 100,
                  }
                  console.log('[Footer Zone 1] Landmark signature fetched:', {
                    signatureId,
                    width: signatureLogo.width,
                    height: signatureLogo.height,
                  })
                }
              }
            } catch (error) {
              console.error('[Footer Zone 1] Error fetching landmark signature:', error)
            }
          }
          // Fallback to logoId (legacy - from organization_logos table)
          else if (enhanced4RowStrip.footer?.signature?.logoId) {
            const signatureLogoId = enhanced4RowStrip.footer.signature.logoId
            const result = await fetchLogoBuffer(signatureLogoId)
            if (result) signatureLogo = result
            console.log('[Footer Zone 1] Legacy signature logo fetched:', {
              logoId: signatureLogoId,
              hasBuffer: !!result,
              width: result?.width,
              height: result?.height,
            })
          }
        }

        console.log('[Enhanced 4-Row Strip] Fetched logos:', {
          brandCount: brandLogos.length,
          verticalCount: verticalLogos.length,
          hasPartnerLogo: !!partnerLogo,
          hasSignatureLogo: !!signatureLogo,  // v9.0: Zone 1 signature
          layoutMode: isSplitLayout ? 'split' : 'unified',
        })

        // Convert image URL to buffer for processing
        const imageResponse = await fetch(imageUrl)
        if (!imageResponse.ok) {
          throw new Error(`Failed to fetch image for 4-row strip: ${imageResponse.status}`)
        }
        const imageBuffer = Buffer.from(await imageResponse.arrayBuffer())

        // v24.0: Adaptive row heights for text-logo overlap prevention
        // Will be set if violations are detected during spatial verification
        let adaptiveRowHeights: { brand: number; vertical: number; initiative: number } | undefined = undefined
        let footerOffset: number | undefined = undefined  // v24.0.1: Footer upward offset for footer violations

        // ========================================================
        // v24.0: HYBRID SPATIAL STRATEGY
        // Detect actual text position and adapt logo bar height
        // ========================================================
        // Note: logoStripZoneCoordinates may be undefined if not calculated earlier
        // Only proceed if it exists
        if (logoStripZoneCoordinates && selectedFormat) {
          let finalHeaderHeight = logoStripZoneCoordinates.headerHeight // Default from calculation
          let finalHeaderPercent = logoStripZoneCoordinates.headerReservePercent
          let regenerated = false
          let spatialAdjustmentInfo = {
            strategy: 'static' as 'static' | 'dynamic' | 'regenerated',
            detectedTextY: null as number | null,
            adjustedFrom: null as number | null,
          }
          try {
            // Step 1: Detect violations using format-zone boundaries (not logo strip pixel heights)
            // v26.2: Use format-zones.ts boundaries (40% header, 78% footer) to match prompt instructions
            const detectionZones = getFormatZones(formatId || 'event_poster')
            const violations = await detectTextInForbiddenZones(
              imageBuffer,
              detectionZones.headerZone.end,                    // 40% for poster_portrait
              Math.max(detectionZones.footerZone.start, 78)     // 78% (v26.1 CONTENT_END cap)
            )

            const headerViolation = violations.find(v => v.zoneType === 'header')

            if (headerViolation) {
              const actualTextY = headerViolation.detectedTextY
              const requiredSafeZone = detectionZones.headerZone.end  // 40% — matches prompt instructions

              console.log(`[v24.0 Spatial Strategy] Text detected at ${actualTextY.toFixed(1)}%, required safe zone: ${requiredSafeZone}%`)

              // v24.10: Smart decision tree aligned with unified 40%-70% content zone
              // Key insight: With unified zones, header is 0-40% (ALL forbidden for text)
              // ANY text in 0-40% should be overlaid by logo bars, NOT accommodated by compression
              // Only compress if text is in the 35-40% "near boundary" zone

              const DECORATIVE_HEADER_ZONE = 35 // 0-35%: All header content (overlay them with logo bars)
              const CONTENT_ENCROACHMENT_ZONE = 40 // 35-40%: Near content boundary (light compression only)

              if (actualTextY >= requiredSafeZone) {
                // ✅ PERFECT - No overlap
                console.log('[v24.0 Spatial Strategy] ✅ Text position safe, using static logo bar')
                spatialAdjustmentInfo.strategy = 'static'
                spatialAdjustmentInfo.detectedTextY = actualTextY

              } else if (actualTextY < DECORATIVE_HEADER_ZONE) {
                // 🎨 HEADER ZONE (0-35%) - Use FULL logo bars, overlay any content
                // v24.10: With unified 40% header zone, anything in 0-35% gets overlaid
                // Transparent logo bars will cover this - NO compression needed
                console.log(`[v24.10 Spatial Strategy] 🎨 Header zone content (${actualTextY.toFixed(1)}% < ${DECORATIVE_HEADER_ZONE}%)`)
                console.log('[v24.10 Spatial Strategy] Using FULL logo bars to overlay - NO compression')
                spatialAdjustmentInfo.strategy = 'static' // Use default full-size layout
                spatialAdjustmentInfo.detectedTextY = actualTextY

              } else if (actualTextY >= DECORATIVE_HEADER_ZONE && actualTextY < CONTENT_ENCROACHMENT_ZONE) {
                // ⚠️ NEAR BOUNDARY (35-40%) - Light compression only
                // Content is very close to the allowed zone, slight adjustment may help
                console.log(`[v24.10 Spatial Strategy] ⚠️ Near boundary zone (${DECORATIVE_HEADER_ZONE}%-${CONTENT_ENCROACHMENT_ZONE}%)`)
                console.log('[v24.10 Spatial Strategy] Content near 40% boundary, light compression')

                const suggestedHeight = getSuggestedHeaderHeight(
                  violations,
                  selectedFormat.height,
                  {
                    minimumHeaderPercent: 15,
                    safetyBufferPercent: 3,
                    defaultHeaderPercent: logoStripZoneCoordinates.headerReservePercent,
                  }
                )

                spatialAdjustmentInfo.strategy = 'dynamic'
                spatialAdjustmentInfo.detectedTextY = actualTextY
                spatialAdjustmentInfo.adjustedFrom = finalHeaderHeight

                finalHeaderHeight = suggestedHeight.headerHeight
                finalHeaderPercent = suggestedHeight.headerPercent

                console.log(`[v24.10 Spatial Strategy] Compressed header: ${finalHeaderPercent.toFixed(1)}% (${finalHeaderHeight}px) ← was ${requiredSafeZone}%`)

              } else {
                // ⚠️ MINOR OVERLAP (40%+) - This shouldn't happen with proper zone enforcement
                // actualTextY >= CONTENT_ENCROACHMENT_ZONE (40%) and < requiredSafeZone
                console.log('[v24.10 Spatial Strategy] ⚠️ Minor overlap at boundary, light compression')

                const suggestedHeight = getSuggestedHeaderHeight(
                  violations,
                  selectedFormat.height,
                  {
                    minimumHeaderPercent: 15,
                    safetyBufferPercent: 3,
                    defaultHeaderPercent: logoStripZoneCoordinates.headerReservePercent,
                  }
                )

                spatialAdjustmentInfo.strategy = 'dynamic'
                spatialAdjustmentInfo.detectedTextY = actualTextY
                spatialAdjustmentInfo.adjustedFrom = finalHeaderHeight

                finalHeaderHeight = suggestedHeight.headerHeight
                finalHeaderPercent = suggestedHeight.headerPercent

                console.log(`[v24.10 Spatial Strategy] Compressed header: ${finalHeaderPercent.toFixed(1)}% (${finalHeaderHeight}px) ← was ${requiredSafeZone}%`)
              }
            } else {
              console.log('[v24.10 Spatial Strategy] ✅ No header violations detected')
              spatialAdjustmentInfo.strategy = 'static'
            }

            // v24.0.1: Handle footer violations
            const footerViolation = violations.find(v => v.zoneType === 'footer')

            // DEBUG: Log footer violation detection
            console.log('[v24.0.1 Footer Strategy DEBUG]', {
              hasFooterViolation: !!footerViolation,
              footerViolationData: footerViolation,
              hasEnhanced4RowStripFooter: !!enhanced4RowStrip.footer,
              enhanced4RowStripVersion: enhanced4RowStrip.version,
              isSplitLayout: enhanced4RowStrip.version === '4-row-split',
            })

            // v24.8: DISABLED adaptive footer repositioning
            // Footer now stays FIXED at bottom (82-100%) regardless of violations
            // Logo bars will overlay any text that appears in footer zone
            // This prevents "footer moving to middle" issue
            if (footerViolation) {
              const detectedFooterTextY = footerViolation.detectedTextY
              const footerZoneStart = Math.max(detectionZones.footerZone.start, 78)
              console.log(`[v24.8 Footer Strategy] Text detected at ${detectedFooterTextY.toFixed(1)}% (footer zone: ${footerZoneStart}%-100%)`)
              console.log(`[v24.8 Footer Strategy] ✅ STATIC footer position - keeping at bottom, logo bar will overlay`)
              // footerOffset stays 0 - footer does NOT move
            } else {
              console.log('[v24.8 Footer Strategy] ✅ No footer violations - footer at bottom')
            }

          } catch (error) {
            console.error('[v24.0 Spatial Strategy] Error during spatial verification:', error)
            // Continue with original header height on error
          }

          // Log final spatial adjustment decision
          console.log('[v24.0 Spatial Strategy] Final decision:', {
            strategy: spatialAdjustmentInfo.strategy,
            detectedTextY: spatialAdjustmentInfo.detectedTextY,
            headerHeight: finalHeaderHeight,
            headerPercent: finalHeaderPercent,
            adjustedFrom: spatialAdjustmentInfo.adjustedFrom,
          })

          // v24.0: Calculate adaptive logo layout based on final header height
          const adaptiveLayout = calculateAdaptiveLogoLayout({
            headerHeight: finalHeaderHeight,
            brandLogos: brandLogos.length,
            verticalLogos: verticalLogos.length,
            hasInitiative: !!enhanced4RowStrip.rows.initiative.text.trim(),
          })

          const calculatedHeight = calculateLayoutHeight(adaptiveLayout)
          const fitsInAvailableSpace = calculatedHeight <= finalHeaderHeight

          console.log('[v24.0 Adaptive Layout] Layout mode selected:', {
            mode: adaptiveLayout.mode,
            description: getLayoutModeDescription(adaptiveLayout.mode),
            calculatedHeight: calculatedHeight,
            availableHeight: finalHeaderHeight,
            fitsInAvailableSpace: fitsInAvailableSpace,
            compressionLevel: adaptiveLayout.brandHeight === 120 ? 'none' : adaptiveLayout.brandHeight === 80 ? 'standard' : adaptiveLayout.brandHeight === 60 ? 'super' : 'emergency',
            rowHeights: {
              brand: adaptiveLayout.brandHeight,
              vertical: adaptiveLayout.verticalHeight,
              initiative: adaptiveLayout.initiativeHeight,
            },
            spacing: {
              rowSpacing: adaptiveLayout.rowSpacing,
              verticalPadding: adaptiveLayout.verticalPadding,
            },
            skipped: {
              vertical: adaptiveLayout.skipVertical,
              initiative: adaptiveLayout.skipInitiative,
            },
          })

          // v24.0.1: Verify that calculated layout actually fits (bug fix validation)
          if (!fitsInAvailableSpace) {
            console.error('[v24.0 Adaptive Layout] ❌ BUG: Calculated height exceeds available space!', {
              calculated: calculatedHeight,
              available: finalHeaderHeight,
              overflow: calculatedHeight - finalHeaderHeight,
              willStillOverlap: true,
            })
          }

          // v24.0: Convert adaptive layout to row heights format for rendering
          // Only apply adaptive layout when using dynamic strategy (text violations detected)
          adaptiveRowHeights = (spatialAdjustmentInfo.strategy === 'dynamic') ? {
            brand: adaptiveLayout.brandHeight,
            vertical: adaptiveLayout.verticalHeight,
            initiative: adaptiveLayout.initiativeHeight,
          } : undefined

          if (adaptiveRowHeights) {
            console.log('[v24.0 Adaptive Layout] ✅ Will apply adaptive row heights to rendering:', {
              ...adaptiveRowHeights,
              compressionLevel: adaptiveLayout.brandHeight === 120 ? 'none' : adaptiveLayout.brandHeight === 80 ? 'standard' : adaptiveLayout.brandHeight === 60 ? 'super' : 'emergency',
              fitsInSpace: fitsInAvailableSpace,
            })
          } else {
            console.log('[v24.0 Adaptive Layout] Using default row heights (no violations detected)')
          }
        }

        // ========================================================
        // v24.2: DIRECT OVERLAY APPROACH (EXACTLY like speaker photos)
        // ========================================================
        // Speaker photos work because they OVERLAY directly on the generated image
        // Logo bars should do the SAME - overlay WITH styled backgrounds that COVER text
        // NO cropping, NO transparent canvas - just direct overlay!
        //
        // The logo bars have opaque/semi-opaque styled backgrounds (glassmorphism, white cards)
        // Those backgrounds will COVER whatever Gemini put in the header/footer zones
        //
        console.log('[v24.2 Direct Overlay] Using generated image directly (like speaker photos)')
        console.log('[v24.2 Direct Overlay] Logo bars will overlay with styled backgrounds that cover text')

        // Use the generated image directly - NO cropping!
        const imageBufferForLogoOverlay = imageBuffer

        // Apply the enhanced 4-row strip (unified or split based on version)
        let processedBuffer: Buffer
        if (isSplitLayout) {
          // Split layout: Header at top, Footer at bottom
          console.log('[Enhanced 4-Row Strip] Using SPLIT layout (header at top, footer at bottom)')

          // v8.0: Debug footer configuration before rendering
          // v9.0: Added signature zone debug
          // v14.0: Added signatureId (landmark_signatures table)
          console.log('[Footer Debug - API Route] Footer config being passed to rendering:', {
            footerEnabled: enhanced4RowStrip.footer?.enabled,
            signature: {  // v9.0/v14.0: Zone 1
              enabled: enhanced4RowStrip.footer?.signature?.enabled,
              signatureId: enhanced4RowStrip.footer?.signature?.signatureId, // v14.0: New landmark_signatures
              logoId: enhanced4RowStrip.footer?.signature?.logoId, // Legacy
              width: enhanced4RowStrip.footer?.signature?.width,
            },
            hashtag: {
              text: enhanced4RowStrip.footer?.hashtag?.text,
              enabled: enhanced4RowStrip.footer?.hashtag?.enabled,
            },
            website: {
              url: enhanced4RowStrip.footer?.website?.url,
              socialHandle: enhanced4RowStrip.footer?.website?.socialHandle,
              enabled: enhanced4RowStrip.footer?.website?.enabled,
            },
            digitalPartner: {
              labelText: enhanced4RowStrip.footer?.digitalPartner?.labelText,
              logoId: enhanced4RowStrip.footer?.digitalPartner?.logoId,
              enabled: enhanced4RowStrip.footer?.digitalPartner?.enabled,
            },
          })

          processedBuffer = await applyEnhanced4RowStripSplit(
            imageBufferForLogoOverlay, // v24.1: Use cropped image (blank header/footer areas)
            enhanced4RowStrip,
            {
              brandLogos,
              verticalLogos,
              partnerLogo,
              signatureLogo,  // v9.0: Zone 1 signature illustration
              adaptiveLayout: adaptiveRowHeights,  // v24.0: Adaptive row heights for text-logo overlap prevention
              footerOffset: footerOffset,  // v24.0.1: Footer upward offset for footer violations
            }
          )
        } else {
          // Unified layout: All 4 rows at top
          console.log('[Enhanced 4-Row Strip] Using UNIFIED layout (all rows at top)')

          // v20.10: PHASE 2 - Text Boundary Validation Framework
          // NOTE: Text boundary validation occurs at multiple layers:
          // 1. Gemini prompt constraints (Phase 1) - prevents AI from generating content in footer
          // 2. SVG text renderer Y-axis clamping (Phase 4) - clips text elements during rendering
          // 3. Dynamic zone calculation (Phase 5) - ensures adequate spacing for all content
          //
          // Post-generation validation (lib/sharp/text-boundary-validator.ts) is available for
          // future integration when we have access to individual text element positions.
          // Current architecture: Gemini generates full image → we only have image buffer at this point.
          //
          // v21.0: Format-Aware Safe Zone Logging (replaces v20.11 event_poster-only check)
          // Now logs zone boundaries for ALL formats using format-zones configuration
          if (enhanced4RowStrip.footer && selectedFormat && formatId && shouldEnforceZones(formatId)) {
            const formatZones = getFormatZones(formatId)
            const category = getFormatCategory(formatId)
            const headerZoneEnd = formatZones.headerZone.end
            const footerHeight = enhanced4RowStrip.footer.height || 268
            const canvasHeight = selectedFormat.height
            const footerStartPercent = ((canvasHeight - footerHeight) / canvasHeight) * 100
            const footerBufferEnd = footerStartPercent - 8

            console.log(`[Text Boundary v21.0] FORMAT-AWARE SAFE ZONES (${formatId} / ${category}):`)
            console.log(`  Canvas: ${canvasHeight}px`)
            console.log(`  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
            console.log(`  ❌ FORBIDDEN HEADER: 0% - ${headerZoneEnd}%`)
            console.log(`     - Logo zone: 0-${Math.round(headerZoneEnd * 0.25)}%`)
            console.log(`     - Safety padding: ${Math.round(headerZoneEnd * 0.25)}-${headerZoneEnd}%`)
            console.log(`  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
            console.log(`  ✅ CONTENT AREA: ${formatZones.contentZone.start}% - ${formatZones.contentZone.end}%`)
            console.log(`     - Usable space: ${formatZones.contentZone.end - formatZones.contentZone.start}%`)
            console.log(`  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
            console.log(`  ❌ FORBIDDEN FOOTER: ${footerStartPercent.toFixed(1)}% - 100%`)
            console.log(`     - Safety buffer: ${footerBufferEnd.toFixed(1)}-${footerStartPercent.toFixed(1)}%`)
            console.log(`     - Footer overlay: ${footerStartPercent.toFixed(1)}-100%`)
            console.log(`  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
            console.log(`  Content MUST be within ${formatZones.contentZone.start}%-${footerBufferEnd.toFixed(1)}%`)
          }

          processedBuffer = await applyEnhanced4RowStrip(
            imageBufferForLogoOverlay, // v24.1: Use cropped image (blank header/footer areas)
            enhanced4RowStrip,
            {
              brandLogos,
              verticalLogos,
              partnerLogo,
              adaptiveLayout: adaptiveRowHeights,  // v24.0: Adaptive row heights for text-logo overlap prevention
            }
          )
        }

        // Convert back to base64 data URL for storage upload
        const base64 = processedBuffer.toString('base64')
        imageUrl = `data:image/png;base64,${base64}`
        console.log(`[Enhanced 4-Row Strip] Successfully applied ${isSplitLayout ? 'SPLIT' : 'UNIFIED'} strip`)
      } catch (error) {
        console.error('[Enhanced 4-Row Strip] Failed to apply strip overlay:', error)
        // Continue with original image on error
      }
    }

    // v46.0: Event text is now rendered by Gemini as part of the design (removed Sharp text overlay)
    // Gemini receives <text_content> tags with actual event data in the prompt builder

    // ========================================================
    // SPEAKER PHOTO OVERLAY (v5.0: Multi-Speaker Support)
    // Handles both legacy single-speaker and new multi-speaker formats
    // ========================================================

    // DIAGNOSTIC: Log pre-overlay check
    console.log('[GENERATE API] Pre-Overlay Check:', {
      userHasSpeakerPhoto,
      hasSpeakerPhoto: !!speakerPhoto,
      willAttemptOverlay: userHasSpeakerPhoto && !!speakerPhoto,
      speakerPhotoData: speakerPhoto ? {
        enabled: speakerPhoto.enabled,
        speakersCount: speakerPhoto.speakers?.length || 0,
        legacyPhotoUrl: !!speakerPhoto.photoUrl
      } : null
    })

    if (userHasSpeakerPhoto && speakerPhoto) {
      // Normalize speaker config (handles migration from legacy to new format)
      const normalizedSpeakerPhoto = normalizeSpeakerConfig(speakerPhoto)

      // v20.6: CRITICAL FIX - Use original photoSize directly (no reverse-calculation)
      // Previously, size was reverse-calculated from zone width, causing precision loss
      // Now, calculateSpeakerPhotoCoordinates() returns the original photoSize directly
      if (speakerPhotoZoneCoordinates && speakerPhotoZoneCoordinates.photoSize) {
        // Use the exact size that was used in coordinate calculation
        normalizedSpeakerPhoto.size = speakerPhotoZoneCoordinates.photoSize
        console.log(`[Generate API] v20.6: Using ORIGINAL photoSize directly: ${speakerPhotoZoneCoordinates.photoSize}px (no reverse-calculation)`)
      }

      speakerCount = getSpeakerCount(normalizedSpeakerPhoto)
      speakerCountWithPhotos = getSpeakerCountWithPhotos(normalizedSpeakerPhoto)

      console.log(`[Generate API] Applying speaker photo overlays (${speakerCountWithPhotos} WITH photos, ${speakerCount} total)`)

      // Validation: Warn if some speakers don't have photos
      if (speakerCount > speakerCountWithPhotos) {
        console.warn(`[Generate API] ⚠️ Photo mismatch: ${speakerCount} speakers defined, but only ${speakerCountWithPhotos} have photos`)
      }

      try {
        // v24.34: HYBRID AI + USER PREFERENCE POSITIONING
        // User selects side (left/right/auto), AI analyzes image and finds safest zone within that side
        // This replaces v24.28's fixed positioning which caused overlaps with text

        // v24.35: Default to RIGHT side for speaker photos
        // Rationale: Content (headlines, topics, date/venue) typically renders on LEFT
        // The RIGHT side usually has blank gradient/background - ideal for speaker overlays
        const userPreferredSide = normalizedSpeakerPhoto.position || 'right'
        const userVerticalPreference = normalizedSpeakerPhoto.verticalPosition || 'bottom'

        console.log(`[v24.34 Hybrid Position] User preference: side=${userPreferredSide}, vertical=${userVerticalPreference}`)

        // Convert imageUrl to buffer for AI analysis (if it's a data URL)
        let analysisBuffer: Buffer | null = null
        if (imageUrl.startsWith('data:')) {
          const base64Data = imageUrl.split(',')[1]
          analysisBuffer = Buffer.from(base64Data, 'base64')
        }

        // v24.47.5: Zone constants - aligned with Gemini prompt content zones
        // Gemini content zone ends at 65% when speaker photos enabled (see event-poster.ts CONTENT_END)
        const HEADER_END = 0.25      // 25% - logo bar header zone
        // v24.47.5: Footer at 90% - actual footer bar is small, gives more speaker space
        const FOOTER_START = 0.90   // 90% - footer bar position (gives 360px for speakers)
        // v24.47.5: Speaker zone at 65-90% = 360px (fits 361px cards)
        const SPEAKER_SAFE_START = 0.65  // Start at 65% - below content zone (40-65%)
        const IMAGE_WIDTH = 1080
        const IMAGE_HEIGHT = 1440
        const PADDING = 40
        const spacing = 40

        // Calculate safe Y bounds (hard constraints for entire poster)
        const minY = Math.floor(IMAGE_HEIGHT * HEADER_END) + PADDING  // 400px (below header)
        const maxY = Math.floor(IMAGE_HEIGHT * FOOTER_START) - PADDING  // 1256px (above footer)

        // v24.48: Calculate SPEAKER zone bounds (not entire safe zone)
        // Speaker zone: from SPEAKER_SAFE_START (65%) to FOOTER_START (90%)
        // This is the ACTUAL area where speakers should be placed
        const speakerZoneTop = Math.floor(IMAGE_HEIGHT * SPEAKER_SAFE_START)  // 936px (65%)
        const speakerZoneBottom = maxY  // 1256px (90% - padding)
        const speakerZoneHeight = speakerZoneBottom - speakerZoneTop  // 320px available for speakers

        console.log(`[v24.48] Speaker zone: ${speakerZoneTop}px (${Math.round(SPEAKER_SAFE_START * 100)}%) to ${speakerZoneBottom}px - ${speakerZoneHeight}px available`)

        // v24.48: Scale cards to fit SPEAKER zone (not entire safe zone)
        // This ensures cards are properly scaled to fit the 65%-90% area
        const scaledDims = scaleToFitSafeZone(speakerCountWithPhotos, speakerZoneHeight, spacing)
        const { photoSize, cardWidth, cardHeight, blockWidth, blockHeight, wasScaled, compactMode } = scaledDims
        const layout = getLayoutStrategy(speakerCountWithPhotos)

        console.log(`[v24.48] Speaker positioning: count=${speakerCountWithPhotos}, layout=${layout}`)
        console.log(`[v24.48] Card dimensions: ${cardWidth}x${cardHeight}px (photoSize=${photoSize}px)`)
        console.log(`[v24.48] Block dimensions: ${blockWidth}x${blockHeight}px`)
        if (wasScaled) {
          console.log(`[v24.48] ⚠️ Cards SCALED DOWN from 180px to ${photoSize}px to fit speaker zone (${speakerZoneHeight}px)`)
        }
        if (compactMode) {
          console.log(`[v24.48] 📦 COMPACT MODE: Zone too small (${speakerZoneHeight}px), using photo-only cards (no name/designation)`)
        }

        // v24.38: AI-PRIMARY SPEAKER POSITIONING
        // Let AI analyze the image and find truly empty areas FIRST
        // Fixed positioning is now the FALLBACK, not primary

        let useAIPosition = false

        if (analysisBuffer && speakerCountWithPhotos >= 1) {
          console.log('[v24.40] AI-PRIMARY: Analyzing image for optimal speaker position...')
          try {
            // v24.40: Use correct block dimensions from unified calculator
            // v24.46: Changed to center position - speakers below content, horizontally centered
            const aiPosition = await findSafePositionWithPreference(
              analysisBuffer,
              { width: blockWidth, height: blockHeight },  // v24.40: Layout-aware dimensions
              {
                position: 'center',  // v24.46: Center horizontally (below content)
                vertical: 'lower'    // v24.46: Always lower (below content zone)
              },
              {
                hasLogosAtTop: true,
                minConfidence: 0.35,  // v24.38: Lower threshold - trust AI more
                allowOverride: true
              }
            )

            console.log(`[v24.40] AI analysis result:`)
            console.log(`  - Zone: ${aiPosition.zone}`)
            console.log(`  - Position: (${aiPosition.x}, ${aiPosition.y})`)
            console.log(`  - Confidence: ${(aiPosition.confidence * 100).toFixed(1)}%`)
            console.log(`  - Reasoning: ${aiPosition.reasoning}`)

            // v24.44: TRUST HIGH-CONFIDENCE AI POSITIONS
            // When AI has ≥75% confidence, it has verified the zone is truly empty
            // Only enforce absolute boundaries (logos 0-20%, footer 85-100%)
            const ABSOLUTE_MIN_Y = Math.floor(IMAGE_HEIGHT * 0.20) + PADDING  // 328px (below logo zone)
            const ABSOLUTE_MAX_Y = Math.floor(IMAGE_HEIGHT * 0.85) - PADDING   // 1184px (above footer)

            // Determine which bounds to use based on confidence level
            const isHighConfidence = aiPosition.confidence >= 0.75
            const effectiveMinY = isHighConfidence ? ABSOLUTE_MIN_Y : minY
            const effectiveMaxY = isHighConfidence ? ABSOLUTE_MAX_Y : maxY

            console.log(`[v24.44] Confidence: ${(aiPosition.confidence * 100).toFixed(1)}% - using ${isHighConfidence ? 'RELAXED' : 'STANDARD'} bounds`)
            console.log(`[v24.44] Effective bounds: minY=${effectiveMinY}, maxY=${effectiveMaxY}`)

            // v24.44: Accept AI position with dynamic bounds based on confidence
            if (aiPosition.confidence >= 0.35 &&
                aiPosition.y >= effectiveMinY &&
                aiPosition.y + blockHeight <= effectiveMaxY + PADDING) {
              useAIPosition = true
              speakerPhotoZoneCoordinates = {
                x: aiPosition.x,
                y: aiPosition.y,
                width: blockWidth,  // v24.40: Layout-aware width
                height: blockHeight,  // v24.40: Layout-aware height
                topEdge: aiPosition.y,
                bottomEdge: aiPosition.y + blockHeight,
                leftEdge: aiPosition.x,
                rightEdge: aiPosition.x + blockWidth,
                photoSize: photoSize,  // v24.40: Scaled photo size
                compactMode: compactMode  // v24.45: Disable text when zone too small
              }
              console.log(`[v24.44] ✅ AI POSITION ACCEPTED: (${aiPosition.x}, ${aiPosition.y}) - ${isHighConfidence ? 'HIGH CONFIDENCE' : 'STANDARD'} mode, ${layout} layout ${blockWidth}x${blockHeight}px`)
            } else {
              console.log(`[v24.44] ⚠️ AI position rejected:`)
              console.log(`  - Confidence: ${(aiPosition.confidence * 100).toFixed(1)}% (need >= 35%)`)
              console.log(`  - Y bounds check: y=${aiPosition.y} >= minY=${effectiveMinY} && y+h=${aiPosition.y + blockHeight} <= maxY+P=${effectiveMaxY + PADDING}`)
            }
          } catch (aiError) {
            console.log('[v24.40] AI analysis failed:', aiError instanceof Error ? aiError.message : 'unknown error')
          }
        }

        // v24.40: Fall back to fixed positioning ONLY if AI failed or rejected
        // Now uses scaled dimensions from scaleToFitSafeZone()
        // v24.49: Simple positioning at BOTTOM of speaker zone (closer to footer)
        if (!useAIPosition) {
          console.log(`[v24.49] Using FALLBACK fixed positioning: ${layout} layout for ${speakerCountWithPhotos} speakers`)

          // v24.46: Center-aligned X position (horizontally centered below content)
          const x = Math.floor((IMAGE_WIDTH - blockWidth) / 2)

          // v24.49: Position speakers at BOTTOM of speaker zone (closer to footer)
          // Cards are already scaled to fit the zone, so place at bottom of zone
          // speakerZoneTop, speakerZoneBottom, speakerZoneHeight are already calculated above (lines 2693-2695)
          const startY = speakerZoneBottom - blockHeight  // Bottom-aligned in zone

          // Clamp to ensure stays within bounds (should rarely be needed now)
          const clampedStartY = Math.max(minY, Math.min(startY, speakerZoneBottom - blockHeight))

          speakerPhotoZoneCoordinates = {
            x,
            y: clampedStartY,
            width: blockWidth,
            height: blockHeight,
            topEdge: clampedStartY,
            bottomEdge: clampedStartY + blockHeight,
            leftEdge: x,
            rightEdge: x + blockWidth,
            photoSize: photoSize,
            compactMode: compactMode  // v24.45: Disable text when zone too small
          }
          console.log(`[v24.49] FALLBACK: ${speakerCountWithPhotos} speakers ${layout.toUpperCase()} BOTTOM-ALIGNED at (${x}, ${clampedStartY}) - ${blockWidth}x${blockHeight}px (zone: ${speakerZoneTop}-${speakerZoneBottom}px, ${speakerZoneHeight}px available)${compactMode ? ' [COMPACT]' : ''}`)
        }

        // v24.30: Pass poster colors for contrast-aware speaker text
        imageUrl = await processImageWithSpeakerPhoto(
          imageUrl,
          normalizedSpeakerPhoto,
          speakerPhotoZoneCoordinates,  // Now potentially updated by AI
          {
            primaryColor: resolvedColors.primaryColor,
            accentColor: resolvedColors.accentColor,
          }
        )
        console.log(`[Generate API] Successfully overlaid ${speakerCountWithPhotos} speaker photo${speakerCountWithPhotos > 1 ? 's' : ''}`)
      } catch (error) {
        console.error('[Generate API] Speaker photo overlay failed:', error)
        // Continue with original image on error
      }
    }

    // ========================================================
    // CRITICAL FIX: Upload to Supabase Storage instead of storing base64
    // This prevents database bloat (was 181 MB for ~40 images)
    // Only upload if the image is a data URL (base64)
    // ========================================================
    if (imageUrl.startsWith('data:')) {
      console.log('[Generate] Uploading generated image to Supabase Storage...')
      const [header, base64Data] = imageUrl.split(',')
      const mimeMatch = header.match(/data:([^;]+);/)
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/png'

      // v7.0: Retry logic for storage upload with exponential backoff
      const MAX_UPLOAD_ATTEMPTS = 3
      let uploadAttempts = 0
      let uploadSuccess = false
      const originalBase64 = imageUrl // Preserve original for fallback

      while (uploadAttempts < MAX_UPLOAD_ATTEMPTS && !uploadSuccess) {
        uploadAttempts++
        try {
          imageUrl = await uploadImageToStorage(base64Data, mimeType, organizationId, supabase)
          console.log(`[Generate] Image uploaded successfully to Storage (attempt ${uploadAttempts}/${MAX_UPLOAD_ATTEMPTS})`)
          uploadSuccess = true
        } catch (uploadError) {
          console.error(`[Generate] Upload attempt ${uploadAttempts}/${MAX_UPLOAD_ATTEMPTS} failed:`, uploadError)
          if (uploadAttempts < MAX_UPLOAD_ATTEMPTS) {
            // Exponential backoff: 1s, 2s, 4s
            const delayMs = 1000 * Math.pow(2, uploadAttempts - 1)
            console.log(`[Generate] Retrying upload in ${delayMs}ms...`)
            await new Promise(resolve => setTimeout(resolve, delayMs))
          }
        }
      }

      if (!uploadSuccess) {
        console.warn('[Generate] All upload attempts failed, falling back to base64')
        imageUrl = originalBase64 // Restore original base64 as fallback
      }
    }

    // ========================================================
    // PARALLEL POST-PROCESSING (v5.5 OPTIMIZATION):
    // Thumbnail generation + Color verification in parallel
    // BEFORE: Sequential (2 fetches, ~2s) | AFTER: Parallel (1 fetch, ~1s)
    // Savings: 1.5-2s per generation
    // ========================================================
    let thumbnailUrl: string | null = null
    let colorVerification: ColorVerificationResult | null = null

    if (imageUrl && !imageUrl.startsWith('data:')) {
      try {
        console.log('[Post-Processing] Starting parallel thumbnail + color verification...')

        // Single fetch for both operations (was 2 separate fetches before)
        const imageResponse = await fetch(imageUrl)
        if (!imageResponse.ok) {
          throw new Error(`Failed to fetch image: ${imageResponse.status}`)
        }
        const imageBuffer = Buffer.from(await imageResponse.arrayBuffer())

        // Execute both operations in parallel with Promise.allSettled
        // Benefits: 1) Single fetch, 2) Parallel processing, 3) Independent error handling
        const [thumbResult, colorResult] = await Promise.allSettled([
          // Operation 1: Thumbnail generation
          (async () => {
            console.log('[Thumbnail] Generating 400px preview for gallery...')
            const sharp = await getSharp()

            const thumbnailBuffer = await sharp(imageBuffer)
              .resize(400, null, { fit: 'inside', withoutEnlargement: true })
              .jpeg({ quality: 70 })
              .toBuffer()

            const thumbnailFilename = `${organizationId}/thumb_${randomUUID()}.jpg`
            const { error: thumbUploadError } = await supabase.storage
              .from('creatives')
              .upload(thumbnailFilename, thumbnailBuffer, {
                contentType: 'image/jpeg',
                cacheControl: '31536000', // 1 year cache
                upsert: false,
              })

            if (thumbUploadError) {
              throw new Error(`Thumbnail upload failed: ${thumbUploadError.message}`)
            }

            const { data: thumbUrlData } = supabase.storage
              .from('creatives')
              .getPublicUrl(thumbnailFilename)

            console.log('[Thumbnail] Generated successfully:', thumbUrlData.publicUrl.substring(0, 80) + '...')
            return thumbUrlData.publicUrl
          })(),

          // Operation 2: Color verification (only if user selected colors)
          (async () => {
            if (resolvedColors.source === 'fallback') {
              console.log('[Color Verification] Skipped - using fallback colors')
              return null
            }

            console.log('[Color Verification] Verifying color accuracy...')
            console.log('[Color Verification] Expected colors:', {
              primary: resolvedColors.primaryColor,
              secondary: resolvedColors.secondaryColor,
              accent: resolvedColors.accentColor,
              source: resolvedColors.source
            })

            const verification = await verifyImageColors(
              imageBuffer,
              {
                primary: resolvedColors.primaryColor,
                secondary: resolvedColors.secondaryColor,
                accent: resolvedColors.accentColor
              },
              0.15 // 15% tolerance
            )

            // Log verification result
            console.log(formatVerificationLog(verification))

            // Log detailed match information
            verification.matches.forEach(match => {
              const icon = match.found ? '✅' : '❌'
              console.log(`${icon} ${match.color} → Closest: ${match.closestMatch} (Distance: ${((match.distance || 0) * 100).toFixed(1)}%)`)
            })

            console.log(`[Color Verification] Dominant colors: ${verification.dominantColors.join(', ')}`)
            return verification
          })()
        ])

        // Extract results (Promise.allSettled ensures one failure doesn't block the other)
        if (thumbResult.status === 'fulfilled') {
          thumbnailUrl = thumbResult.value
        } else {
          console.warn('[Thumbnail] Generation failed (gallery will use full image):', thumbResult.reason)
        }

        if (colorResult.status === 'fulfilled') {
          colorVerification = colorResult.value
        } else {
          console.warn('[Color Verification] Verification failed (non-blocking):', colorResult.reason)
        }

        console.log('[Post-Processing] Completed parallel operations')
      } catch (parallelError) {
        console.error('[Post-Processing] Parallel processing failed:', parallelError)
        // Don't fail generation - both operations are non-critical
      }
    } else {
      console.log('[Post-Processing] Skipped - base64 image or no image URL')
    }

    // ========================================================
    // v40.6: ZONE DEBUG OVERLAY (development only)
    // Draws zone boundaries on the output image when DEBUG_ZONE_OVERLAY=true
    // ========================================================
    if (DEBUG_ZONE_OVERLAY && imageUrl && imageUrl.startsWith('data:image')) {
      try {
        const { addZoneDebugOverlay } = await import('@/lib/sharp/zone-debug-overlay')
        const { ENHANCED_STRIP_ROW_HEIGHTS } = await import('@/lib/config/design-constants')
        // Actual logo bar height: brand + spacing + vertical + spacing + initiative
        const rowSpacingPx = 3
        const actualHeaderBarPx =
          ENHANCED_STRIP_ROW_HEIGHTS.brand +
          rowSpacingPx +
          ENHANCED_STRIP_ROW_HEIGHTS.vertical +
          rowSpacingPx +
          ENHANCED_STRIP_ROW_HEIGHTS.initiative
        // Actual footer bar height: partner row + padding
        const actualFooterBarPx = ENHANCED_STRIP_ROW_HEIGHTS.partner + 40 // ~160px total

        const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, '')
        const debugBuffer = await addZoneDebugOverlay(
          Buffer.from(base64Data, 'base64'),
          {
            headerEndPercent: 50,
            footerStartPercent: 65,
            actualHeaderBarPx,   // e.g. 256px — shows Gap B on image
            actualFooterBarPx,   // e.g. 160px
            renderZoneStart: formatId === 'event_poster' ? 55 : undefined,
            renderZoneEnd:   formatId === 'event_poster' ? 70 : undefined,
          }
        )
        console.log(`[Zone Debug] Bar heights — header: ${actualHeaderBarPx}px, footer: ${actualFooterBarPx}px`)
        imageUrl = `data:image/png;base64,${debugBuffer.toString('base64')}`
        console.log('[Zone Debug] ✅ Zone boundary overlay applied to output image')
      } catch (dbgErr) {
        console.warn('[Zone Debug] Overlay failed (non-fatal):', dbgErr)
      }
    }

    // Track image generation (estimated tokens for Gemini)
    // Cost calculation: Input tokens (text prompt) + flat image rate
    // Image cost is NOT based on output tokens - it's a flat rate per image:
    // - gemini-2.5-flash-image: $0.039/image (1290 tokens @ $30/1M)
    // - gemini-3-pro-image-preview: $0.1344/image (1K/2K), $0.24/image (4K)
    if (creationMode === 'scratch' || templateUrl) {
      const imageProvider: AIProvider = provider === 'openai' ? 'openai' : 'gemini'
      // Use actual model that ran (may differ from request model after TIER 3 upgrade), default to Flash
      const imageModel = imageActualModel || model || 'gemini-2.5-flash-image'
      // Estimate input tokens from prompt length (~4 chars per token)
      const estimatedInputTokens = Math.ceil(prompt.length / 4)
      const rawResolution = effectiveDesignData?.resolution || '1K'
      const requestedResolution = (rawResolution === '512px' ? '1K' : rawResolution) as '1K' | '2K' | '4K'

      await usageTracker.track(
        'image_generation',
        imageProvider,
        imageModel,
        {
          inputTokens: estimatedInputTokens,
          outputTokens: 0, // Image output uses flat rate, not token-based pricing
          imageCount: 1, // Always 1 image per generation
          durationMs: 0, // We don't have duration here
          promptLength: prompt.length,
          resolution: requestedResolution, // Track resolution for cost calculation
          imageQuality: provider === 'openai' ? (imageQuality || 'high') : undefined,
        }
      )
    }

    // Get cost summary
    const costSummary = usageTracker.getSummary()
    console.log('[Generate] === API USAGE SUMMARY ===')
    console.log('[Generate] Total Cost:', costSummary.formatted.usd, '|', costSummary.formatted.inr)
    console.log('[Generate] Total Input Tokens:', costSummary.totalInputTokens)
    console.log('[Generate] Total Output Tokens:', costSummary.totalOutputTokens)
    console.log('[Generate] Request Count:', costSummary.requestCount)

    // Build stage-by-stage breakdown for frontend display
    const stages = costSummary.records.map((record) => ({
      stage: record.requestType,
      provider: record.provider,
      model: record.model,
      inputTokens: record.inputTokens,
      outputTokens: record.outputTokens,
      cachedTokens: record.cachedTokens || 0,
      imageCount: record.imageCount || 0,
      costUsd: record.estimatedCostUsd,
      costInr: convertToINR(record.estimatedCostUsd),
      durationMs: record.durationMs || 0,
    }))

    return NextResponse.json({
      success: true,
      imageUrl,
      thumbnailUrl, // Server-generated thumbnail for gallery preview
      // v36.0: Return prompt for generation memory (truncated to 3000 chars)
      promptUsed: storedPromptForRegeneration?.slice(0, 3000) || '',
      // v4.0: Include prevention action ID for fix validation tracking
      preventionActionId: preventionActionId || undefined,
      // v4.1: A/B testing data for prevention effectiveness measurement
      // These values should be stored with the creative for later analysis
      preventionHoldout: isHoldout,
      preventionApplied: preventionApplied,
      usage: {
        costUsd: costSummary.totalCostUsd,
        costInr: costSummary.totalCostInr,
        formatted: costSummary.formatted,
        inputTokens: costSummary.totalInputTokens,
        outputTokens: costSummary.totalOutputTokens,
        requestCount: costSummary.requestCount,
        // Stage-by-stage breakdown for detailed analytics
        stages,
      },
      // v5.4: Color verification result (null if not applicable)
      colorVerification: colorVerification ? {
        verified: colorVerification.verified,
        confidence: colorVerification.confidence,
        dominantColors: colorVerification.dominantColors,
        matches: colorVerification.matches.map(m => ({
          color: m.color,
          found: m.found,
          closestMatch: m.closestMatch,
          distance: m.distance
        }))
      } : null,
    })
  } catch (error) {
    console.error('Generation error:', error)

    const message = error instanceof Error ? error.message : 'Generation failed'

    // Gemini rate limit — return 429 so the client shows a friendly message
    if (message.includes('429') || message.toLowerCase().includes('too many requests') || message.toLowerCase().includes('quota')) {
      return NextResponse.json(
        { error: 'Gemini API rate limit reached. Please wait 60 seconds and try again, or contact your team leader to increase the API quota.' },
        { status: 429 }
      )
    }

    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

/**
 * Extract event content from user form data with multiple field name fallbacks.
 * This is more reliable than parsing prompt text with regex since it uses the actual user input.
 *
 * v4.0: Now captures ALL form fields, not just the standard 8.
 * Format-specific fields (videoTitle, hookText, recipientName, etc.) are stored in customFields.
 */
function extractFromFormData(formData: Record<string, unknown> | undefined): Partial<CreativeContent> {
  if (!formData) return {}

  // Track which keys we've already extracted to standard fields
  const extractedKeys = new Set<string>()

  // Helper to extract first matching value and track the key
  const extractFirst = (keys: string[]): string | undefined => {
    for (const key of keys) {
      const value = formData[key]
      if (value !== undefined && value !== null && value !== '') {
        extractedKeys.add(key)
        return String(value).trim() || undefined
      }
    }
    return undefined
  }

  // Standard field extractions (for backwards compatibility)
  const result: Partial<CreativeContent> = {
    // Event name: check multiple possible field names
    eventName: extractFirst(['title', 'eventName', 'eventTitle', 'name', 'postTitle']),

    // Event type: infer from explicit field
    eventType: extractFirst(['eventType', 'type']),

    // Date/Time (CreativeContent uses 'date' and 'time', not 'eventDate')
    date: extractFirst(['date', 'eventDate']),
    time: extractFirst(['time', 'eventTime']),

    // Venue
    venue: extractFirst(['venue', 'location', 'venueName']),

    // Speaker/Guest
    guestName: extractFirst(['speaker', 'guestName', 'speakerName', 'guest']),
    guestDesignation: extractFirst(['designation', 'guestDesignation', 'speakerDesignation']),

    // Description
    additionalText: extractFirst(['description', 'additionalInfo', 'details', 'postCaption']),
  }

  // v4.0: Capture ALL remaining fields in customFields
  // This ensures format-specific fields like videoTitle, hookText, recipientName, etc. are preserved
  const customFields: Record<string, string> = {}
  const skipFields = new Set([
    '_id', '_timestamp', '_version', '_cache',
    'language', 'style', 'colorScheme', 'theme',
    'formatId', 'format', 'organizationId', 'verticalSlug'
  ])

  for (const [key, value] of Object.entries(formData)) {
    // Skip already extracted fields, internal fields, and non-string values
    if (
      extractedKeys.has(key) ||
      skipFields.has(key) ||
      key.startsWith('_') ||
      typeof value !== 'string' ||
      !value.trim()
    ) {
      continue
    }
    customFields[key] = value.trim()
  }

  // Only add customFields if there are any
  if (Object.keys(customFields).length > 0) {
    result.customFields = customFields
    console.log('[extractFromFormData] Captured custom fields:', Object.keys(customFields))
  }

  return result
}

// Parse event content from the prompt text
function parseEventContent(prompt: string): CreativeContent {
  // Try to extract structured content from prompt
  // This handles both:
  // 1. Standard format: "Event: Name\nDate: ...\n"
  // 2. Template format: '...poster for "Event Name"...on March 16...'
  const content: CreativeContent = {}

  // ===== EVENT NAME EXTRACTION =====
  // First try standard format: "Event: Name" or "Title: Name"
  let titleMatch = prompt.match(/(?:Event|Title|Name):\s*(.+?)(?:\n|$)/i)

  // If not found, try template format: 'poster for "Event Name"' or 'called "Event Name"'
  if (!titleMatch) {
    titleMatch = prompt.match(/(?:poster|event|program|session|camp|seminar|workshop|conference)\s+(?:for|called|titled|named)\s*"([^"]+)"/i)
  }

  // Fallback: extract any quoted string that looks like an event name
  if (!titleMatch) {
    titleMatch = prompt.match(/"([^"]{5,80})"/i) // Quoted string between 5-80 chars
  }

  if (titleMatch) {
    content.eventName = titleMatch[1].trim()
    content.title = titleMatch[1].trim()
  }

  // ===== GUEST/SPEAKER EXTRACTION =====
  const guestMatch = prompt.match(/(?:Guest|Speaker|Chief Guest|Keynote):\s*(.+?)(?:\n|$)/i)
  if (guestMatch) {
    const guestText = guestMatch[1].trim()
    // Try to separate name from designation
    const commaIndex = guestText.lastIndexOf(',')
    if (commaIndex > 0) {
      content.guestName = guestText.substring(0, commaIndex).trim()
      content.guestDesignation = guestText.substring(commaIndex + 1).trim()
    } else {
      content.guestName = guestText
    }
  }

  // ===== DATE EXTRACTION =====
  // First try standard format: "Date: March 16, 2024"
  let dateMatch = prompt.match(/(?:Date):\s*(.+?)(?:\n|$)/i)

  // If not found, try template format: "on March 16, 2024" or "is on March 16"
  if (!dateMatch) {
    dateMatch = prompt.match(/(?:is\s+)?on\s+(\w+\s+\d{1,2},?\s*\d{4})/i)
  }

  // Try date formats like "16/03/2024" or "2024-03-16"
  if (!dateMatch) {
    dateMatch = prompt.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i)
  }

  if (dateMatch) {
    content.date = dateMatch[1].trim()
  }

  // ===== TIME EXTRACTION =====
  // First try standard format: "Time: 10:00 AM"
  let timeMatch = prompt.match(/(?:Time):\s*(.+?)(?:\n|$)/i)

  // If not found, try template format: "at 10:00 AM" (but not "at venue")
  if (!timeMatch) {
    timeMatch = prompt.match(/at\s+(\d{1,2}:\d{2}\s*(?:AM|PM)?(?:\s*[-–to]+\s*\d{1,2}:\d{2}\s*(?:AM|PM)?)?)/i)
  }

  if (timeMatch) {
    content.time = timeMatch[1].trim()
  }

  // ===== VENUE EXTRACTION =====
  // First try standard format: "Venue: Community Center"
  let venueMatch = prompt.match(/(?:Venue|Location|Place):\s*(.+?)(?:\n|$)/i)

  // If not found, try template format: "at {{venueName}}" → "at Community Center, Salem"
  // But skip if it looks like a time (starts with digit)
  if (!venueMatch) {
    venueMatch = prompt.match(/at\s+([A-Z][^.!?\n]+?(?:,\s*[A-Z][^.!?\n]+)?)\s*[.!?\n]/i)
    // Validate it's not a time
    if (venueMatch && venueMatch[1].match(/^\d/)) {
      venueMatch = null
    }
  }

  if (venueMatch) {
    content.venue = venueMatch[1].trim()
  }

  // ===== EVENT TYPE DETECTION =====
  const eventTypeKeywords: Record<string, string[]> = {
    seminar: ['seminar'],
    workshop: ['workshop'],
    conference: ['conference'],
    webinar: ['webinar'],
    hackathon: ['hackathon'],
    competition: ['competition', 'contest'],
    festival: ['fest', 'festival'],
    inauguration: ['inauguration', 'opening'],
    convocation: ['convocation', 'graduation'],
    awareness: ['awareness', 'safety', 'campaign'],
    camp: ['camp', 'donation'],
  }

  const lowerPrompt = prompt.toLowerCase()
  for (const [type, keywords] of Object.entries(eventTypeKeywords)) {
    if (keywords.some(kw => lowerPrompt.includes(kw))) {
      content.eventType = type
      break
    }
  }

  return content
}

// Clean instruction text from prompt templates
// The database templates contain instruction text like "Create a striking...", "IMPORTANT:..."
// that should NOT be rendered in the final image
function cleanPromptInstructions(prompt: string): string {
  // Remove common instruction patterns that shouldn't be rendered
  const instructionPatterns = [
    // Opening instructions like "Create a professional/striking/vibrant poster for..."
    /Create\s+(?:a|an)\s+(?:striking|professional|vibrant|elegant|beautiful|modern|inspiring|bright|playful|warm)[^"]*(?:poster|design|flyer)\s+for\s*/gi,
    // Color/style instructions like "Use bold yellow (#FFC107)..."
    /Use\s+(?:bold|vibrant|elegant|warm|nature-inspired|energetic)[^.]*(?:colors?|tones?|palette)[^.]*\./gi,
    // Visual element instructions
    /Include\s+(?:visual\s+elements?|imagery)[^.]*\./gi,
    // Style instructions like "Style: high-contrast..."
    /Style:\s*[^.]+\./gi,
    // Important instructions like "IMPORTANT: Leave 150px..."
    /IMPORTANT:\s*[^.]+\./gi,
    // Space/zone instructions
    /Leave\s+\d+px\s+(?:clear\s+)?space[^.]+\./gi,
    // Header/footer logo instructions that were leaking
    /the\s+top\s+for\s+header\s*logos?\s*(?:and\s+\d+px[^.]*)?[.!]?/gi,
    /header\s+logos?\s+and\s+\d+px\s+at\s+the\s+footer[.!]?/gi,
    /\d+px\s+(?:clear\s+)?(?:at\s+the\s+)?(?:top|bottom|header|footer)[^.]*[.!]?/gi,
  ]

  let cleaned = prompt
  for (const pattern of instructionPatterns) {
    cleaned = cleaned.replace(pattern, '')
  }

  // Clean up multiple spaces and trim
  return cleaned.replace(/\s+/g, ' ').trim()
}

// CRITICAL: Validate and clean any remaining template placeholders
// This prevents {{variableName}} from appearing literally in generated images
function sanitizePlaceholders(text: string, context: string = 'prompt'): string {
  // Check for any remaining {{variableName}} placeholders
  const placeholders = text.match(/\{\{[a-zA-Z_]+\}\}/g)

  if (placeholders) {
    console.warn(`[Generate] WARNING: Unreplaced placeholders found in ${context}:`, placeholders)
    // Strip them to prevent rendering in image
    return text.replace(/\{\{[a-zA-Z_]+\}\}/g, '').replace(/\s+/g, ' ').trim()
  }

  return text
}

// Convert Yi CreativeStudio customization to prompt system format
function convertCustomization(customization: CustomizationData): import('@/lib/prompts').DesignCustomization {
  return {
    title: {
      position: customization.title.position,
      alignment: customization.title.alignment,
      fontSize: customization.title.fontSize,
      fontWeight: customization.title.fontWeight,
      color: customization.title.color,
      shadow: customization.title.shadow,
    },
    background: {
      type: customization.background.type,
      primaryColor: customization.background.primaryColor,
      secondaryColor: customization.background.secondaryColor,
      overlay: customization.background.overlay,
      overlayOpacity: customization.background.overlayOpacity,
      blur: customization.background.blur,
      blurAmount: customization.background.blurAmount,
    },
    speakerPhoto: {
      enabled: customization.speakerPhoto.enabled,
      shape: customization.speakerPhoto.shape,
      size: customization.speakerPhoto.size,
      position: customization.speakerPhoto.position,
      verticalPosition: customization.speakerPhoto.verticalPosition || 'lower',
      border: customization.speakerPhoto.border,
      shadow: customization.speakerPhoto.shadow,
    },
    footer: customization.footer,
    layout: customization.layout || {
      edgeToEdge: true,
      headerHeight: 0,
      footerHeight: 0,
    },
  }
}

// Build prompt using the new multi-model prompt system with format support
// Now accepts AI-generated design context for purpose-driven designs
function buildDesignPromptWithFormat(
  basePrompt: string,
  designData: DesignData,
  provider: 'google' | 'ideogram',
  organizationName: string = 'Organization',
  format?: import('@/lib/config/creative-formats').CreativeFormat | null,
  designContext?: DesignContext, // AI-generated design intelligence
  language: 'en' | 'ta' | 'hi' = 'en', // Language for text content (PRD Section 10.2)
  logoAwareness?: import('@/lib/prompts/helpers/logo-awareness').LogoAwarenessContext, // Logo awareness for Smart Layout
  multiSpeakerLayout?: MultiSpeakerLayout | null, // Multi-speaker layout guidance
  speakerCount: number = 0, // Total speaker count
  speakerCountWithPhotos: number = 0, // Speakers with photos
  speakerPhotoZoneCoordinates?: ReturnType<typeof calculateSpeakerPhotoCoordinates> // Speaker photo zone coordinates
): { prompt: string; systemPrompt?: string; styleType?: string; magicPrompt?: string; negativePrompt?: string } {
  // Parse event content from the base prompt
  const content = parseEventContent(basePrompt)

  // Get dimensions - prefer format dimensions if available
  let dimensions: { width: number; height: number }
  let aspectRatio: string

  if (format) {
    dimensions = { width: format.width, height: format.height }
    aspectRatio = format.aspectRatio
  } else {
    const aspectRatioKey = designData.aspectRatio as keyof typeof DIMENSION_QUALITY
    const resolutionKey = designData.resolution as keyof typeof DIMENSION_QUALITY[typeof aspectRatioKey]
    dimensions = DIMENSION_QUALITY[aspectRatioKey]?.[resolutionKey] || { width: 1024, height: 1280 }
    aspectRatio = designData.aspectRatio
  }

  // Build generation params with AI-generated design context
  const params: GeneratePromptParams = {
    provider,
    type: (format?.id || 'event_poster') as any,
    content,
    brand: {
      primary_color: designData.customization.background.primaryColor || '#1B998B',
      secondary_color: designData.customization.background.secondaryColor || '#FF6B35',
      accent_color: designData.customization.title.color || '#3366FF',
      background_color: '#FFFFFF',
      headline_font: 'Inter',
      body_font: 'Inter',
      header_height: 100,
      footer_height: 80,
    },
    theme: designData.theme,
    style: designData.style,
    colorScheme: 'brand_default',
    // Pass colorConfig from UI (brand toggle, palette selection, custom colors)
    colorConfig: designData.colorConfig,
    language: language, // Pass language from request (PRD Section 10.2)
    aspectRatio: aspectRatio,
    resolution: designData.resolution as '1K' | '2K' | '4K',
    dimensions,
    organizationName,
    customization: convertCustomization(designData.customization),
    // Pass AI-generated design context for purpose-driven prompts
    designContext,
    // Pass logo awareness for Smart Layout (tells AI where to avoid placing content)
    logoAwareness: logoAwareness?.hasLogos ? {
      activeLogos: logoAwareness.activeLogos,
      layoutGuidance: logoAwareness.layoutGuidance,
      hasLogos: logoAwareness.hasLogos,
    } : undefined,
    // Pass multi-speaker layout guidance for intelligent positioning
    multiSpeakerGuidance: multiSpeakerLayout && multiSpeakerLayout.isValid ? {
      compositionGuidance: multiSpeakerLayout.compositionGuidance,
      textZoneAdjustments: multiSpeakerLayout.textZoneAdjustments,
      speakerCount: multiSpeakerLayout.positions.length,
      layoutKey: multiSpeakerLayout.layoutKey,
    } : undefined,
  }

  // Generate the prompt (now includes design intelligence if available)
  const promptOutput = generatePrompt(params)

  // Inject multi-speaker layout guidance into prompt (Phase 2)
  let enhancedPrompt = ''
  if (multiSpeakerLayout && multiSpeakerLayout.isValid) {
    enhancedPrompt = `\n\n${multiSpeakerLayout.compositionGuidance}\n\n`
    enhancedPrompt += `TEXT ZONE CONSTRAINTS (percentage from top):\n`
    enhancedPrompt += `- Headline: ${multiSpeakerLayout.textZoneAdjustments.headline.start}-${multiSpeakerLayout.textZoneAdjustments.headline.end}%\n`
    enhancedPrompt += `- Tagline: ${multiSpeakerLayout.textZoneAdjustments.tagline.start}-${multiSpeakerLayout.textZoneAdjustments.tagline.end}%\n`
    enhancedPrompt += `- Date/Venue: ${multiSpeakerLayout.textZoneAdjustments.dateVenue.start}-${multiSpeakerLayout.textZoneAdjustments.dateVenue.end}%\n`
    enhancedPrompt += `- Speaker Details: ${multiSpeakerLayout.textZoneAdjustments.speakers.start}-${multiSpeakerLayout.textZoneAdjustments.speakers.end}%\n`
    enhancedPrompt += `- Additional Details: ${multiSpeakerLayout.textZoneAdjustments.additionalDetails.start}-${multiSpeakerLayout.textZoneAdjustments.additionalDetails.end}%\n\n`

    // v20.3: Clarify text rendering for ALL speakers vs photo overlay for SOME
    if (speakerCount > speakerCountWithPhotos) {
      enhancedPrompt += `SPEAKER TEXT RENDERING: Render text details (name, designation) for ALL ${speakerCount} speakers listed in the content.\n`
      enhancedPrompt += `- Only ${speakerCountWithPhotos} speaker(s) will have photo overlays - the rest are text-only\n`
      enhancedPrompt += `- Position all speaker text details in the Speaker Details zone (${multiSpeakerLayout.textZoneAdjustments.speakers.start}-${multiSpeakerLayout.textZoneAdjustments.speakers.end}%)\n`
      enhancedPrompt += `- Use consistent typography and spacing for all speakers\n\n`
    }

    enhancedPrompt += `SPEAKER PHOTOS OVERLAY ZONES: ${multiSpeakerLayout.positions.length} circular speaker photos will be overlaid at calculated positions.\n`
    enhancedPrompt += `- These zones MUST have CLEAN, SIMPLE backgrounds (solid colors, subtle gradients, or soft blur)\n`
    enhancedPrompt += `- Do NOT place decorative elements, patterns, textures, or complex visuals in these circular zones\n`
    enhancedPrompt += `- Use light, neutral background colors in photo zones for professional integration\n`
    enhancedPrompt += `- Decorative elements should be placed AROUND the photo zones, not underneath them\n\n`

    console.log(`[Multi-Speaker] Injected composition guidance: ${speakerCountWithPhotos} photo overlays, ${speakerCount} total speakers`)
  }
  // Fallback: Always reserve footer zone even without multi-speaker layout
  else if (speakerCountWithPhotos > 0) {
    // Single speaker or speakers without AI layout - still need footer zone protection
    enhancedPrompt = `\n\nCRITICAL LAYOUT CONSTRAINT:\n`
    enhancedPrompt += `FOOTER ZONE (85-100% from top): MUST remain clear for footer overlay.\n`
    enhancedPrompt += `- Do NOT place speaker details, names, designations, or any text elements in this zone\n`
    enhancedPrompt += `- Speaker details (name, designation) should be positioned in the 60-80% zone\n`
    enhancedPrompt += `- Event details (date, time, venue) should be in the 35-55% zone\n`
    enhancedPrompt += `- This ensures clean footer overlay without text collision\n\n`

    if (speakerCountWithPhotos === 1) {
      // Use exact coordinates if available, otherwise use typical range
      if (speakerPhotoZoneCoordinates && dimensions) {
        const photoTopPercent = Math.round((speakerPhotoZoneCoordinates.topEdge / dimensions.height) * 100)
        const photoBottomPercent = Math.round((speakerPhotoZoneCoordinates.bottomEdge / dimensions.height) * 100)
        const photoCenterPercent = Math.round(((speakerPhotoZoneCoordinates.y + speakerPhotoZoneCoordinates.height / 2) / dimensions.height) * 100)

        // v20.8: CRITICAL - Position speaker text ABOVE photo zone to prevent overlap
        // Calculate dynamic text zone that ends before photo starts
        const speakerTextZoneStart = Math.max(35, photoTopPercent - 25) // At least 25% above photo top
        const speakerTextZoneEnd = Math.max(45, photoTopPercent - 5)    // End 5% above photo top

        // v20.3: Clarify text rendering for ALL speakers vs photo overlay for SOME
        if (speakerCount > speakerCountWithPhotos) {
          enhancedPrompt += `SPEAKER TEXT RENDERING: Render text details (name, designation) for ALL ${speakerCount} speakers listed in the content.\n`
          enhancedPrompt += `- Only ${speakerCountWithPhotos} speaker(s) will have a photo overlay - the rest are text-only\n`
          enhancedPrompt += `- CRITICAL: Position speaker text ABOVE photo zone (${speakerTextZoneStart}-${speakerTextZoneEnd}% vertical)\n`
          enhancedPrompt += `- DO NOT place speaker text in the photo zone (${photoTopPercent}-${photoBottomPercent}%)\n`
          enhancedPrompt += `- Use consistent typography and spacing for all speakers\n\n`
          console.log(`[Text Zones v20.8] Dynamic speaker text zone: ${speakerTextZoneStart}-${speakerTextZoneEnd}% (above photo at ${photoTopPercent}-${photoBottomPercent}%)`)
        }

        enhancedPrompt += `SPEAKER PHOTO OVERLAY ZONE: 1 circular speaker photo will be overlaid at ${photoCenterPercent}% vertical position (from ${photoTopPercent}% to ${photoBottomPercent}%).\n`
        enhancedPrompt += `- This circular zone MUST have a CLEAN, SIMPLE background (solid color, subtle gradient, or soft blur)\n`
        enhancedPrompt += `- Do NOT place decorative elements, patterns, textures, or complex visuals in this circular area\n`
        enhancedPrompt += `- Do NOT place speaker text/names in this zone - position them ABOVE the photo\n`
        enhancedPrompt += `- Use a light, neutral background color in the photo zone for professional photo integration\n`
        enhancedPrompt += `- Decorative elements should be placed AROUND the photo zone, not underneath it\n\n`

        console.log(`[Text Zones] Injected exact speaker photo coordinates: ${photoCenterPercent}% center (${photoTopPercent}-${photoBottomPercent}%)`)
        console.log(`[Text Zones] Speaker text guidance: Render ALL ${speakerCount} speakers, overlay photo for ${speakerCountWithPhotos}`)
      } else {
        enhancedPrompt += `SPEAKER PHOTO OVERLAY ZONE: 1 circular speaker photo will be overlaid (typically 60-75% vertical position).\n`
        enhancedPrompt += `- This circular zone MUST have a CLEAN, SIMPLE background (solid color, subtle gradient, or soft blur)\n`
        enhancedPrompt += `- Do NOT place decorative elements, patterns, or textures in the anticipated photo area\n`
        enhancedPrompt += `- Use a light, neutral background in the photo zone for professional integration\n\n`
      }
    }

    console.log(`[Text Zones] Injected footer zone constraint for ${speakerCountWithPhotos} speaker(s) without AI layout`)
  }

  if (isGeminiPrompt(promptOutput)) {
    return {
      prompt: promptOutput.userPrompt + enhancedPrompt,
      systemPrompt: promptOutput.systemPrompt,
    }
  } else if (isIdeogramPrompt(promptOutput)) {
    const apiFormat = toIdeogramApiFormat(promptOutput)
    return {
      prompt: apiFormat.prompt + enhancedPrompt,
      styleType: apiFormat.styleType,
      magicPrompt: apiFormat.magicPrompt,
      negativePrompt: apiFormat.negativePrompt,
    }
  }

  // Fallback
  return { prompt: basePrompt + enhancedPrompt }
}

// Get aspect ratio string for APIs
function getAspectRatioString(designData?: DesignData | null): string {
  if (!designData) return 'ASPECT_4_5'

  // Map to Ideogram aspect ratio format
  const ratioMap: Record<string, string> = {
    '1:1': 'ASPECT_1_1',
    '2:3': 'ASPECT_2_3',
    '3:2': 'ASPECT_3_2',
    '3:4': 'ASPECT_3_4',
    '4:3': 'ASPECT_4_3',
    '4:5': 'ASPECT_4_5',
    '5:4': 'ASPECT_5_4',
    '9:16': 'ASPECT_9_16',
    '16:9': 'ASPECT_16_9',
    '21:9': 'ASPECT_21_9',
  }

  return ratioMap[designData.aspectRatio] || 'ASPECT_4_5'
}

async function generateFromTemplate(
  prompt: string,
  templateUrl: string,
  verticalSlug: string,
  rawFormData?: Record<string, unknown>,  // Accept ANY fields - not just predefined ones
  targetDimensions?: { width: number; height: number },  // Target format dimensions for outpainting
  format?: import('@/lib/config/creative-formats').CreativeFormat | null,  // For fallback generation
  resolution?: string,  // For fallback generation
  formatId?: string  // Format ID for smart decorative enhancements
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('Gemini API key not configured')
  }

  // Download template image and convert to base64
  let templateBase64: string
  let templateMimeType: string

  try {
    const templateResponse = await fetch(templateUrl)
    if (!templateResponse.ok) {
      throw new Error('Failed to fetch template image')
    }
    const templateBuffer = await templateResponse.arrayBuffer()
    templateBase64 = Buffer.from(templateBuffer).toString('base64')
    templateMimeType = templateResponse.headers.get('content-type') || 'image/png'
  } catch (error) {
    console.error('Error fetching template:', error)
    throw new Error('Failed to load template image')
  }

  // ========================================================
  // ASPECT RATIO CHANGE DETECTION & OUTPAINTING GUIDANCE
  // If target format differs from template, instruct Gemini to EXTEND background
  // ========================================================
  let aspectRatioGuidance = ''
  if (targetDimensions) {
    try {
      // Get template dimensions from Sharp metadata (lazy loaded)
      const sharp = await getSharp()
      const templateMetadata = await sharp(Buffer.from(templateBase64, 'base64')).metadata()
      const templateWidth = templateMetadata.width || 1080
      const templateHeight = templateMetadata.height || 1350

      const templateRatio = templateWidth / templateHeight
      const targetRatio = targetDimensions.width / targetDimensions.height
      const ratioDiff = targetRatio - templateRatio

      console.log('[Template Mode] === ASPECT RATIO CHECK ===')
      console.log('[Template Mode] Template:', `${templateWidth}x${templateHeight} (ratio: ${templateRatio.toFixed(2)})`)
      console.log('[Template Mode] Target:', `${targetDimensions.width}x${targetDimensions.height} (ratio: ${targetRatio.toFixed(2)})`)
      console.log('[Template Mode] Ratio Diff:', ratioDiff.toFixed(2))

      if (ratioDiff > 0.2) {
        // Target is WIDER than template → need to extend LEFT/RIGHT (portrait → landscape)
        console.log('[Template Mode] OUTPAINTING NEEDED: Extend horizontally (portrait → landscape)')
        aspectRatioGuidance = `
ASPECT RATIO CHANGE - OUTPAINTING REQUIRED:
The output must be a ${targetDimensions.width}x${targetDimensions.height} LANDSCAPE format.
The template is portrait - you MUST extend the background HORIZONTALLY on LEFT and RIGHT sides.

CRITICAL OUTPAINTING INSTRUCTIONS:
1. Keep ALL original content fully visible - DO NOT crop or zoom any part of the image
2. Extend the background LEFT and RIGHT to fill the wider canvas
3. Continue patterns, gradients, textures, or solid colors seamlessly to the sides
4. Center the main content or reposition for better balance in landscape format
5. All text, logos, decorative elements must remain completely visible
6. DO NOT stretch or distort any elements - only ADD new background area

This is OUTPAINTING (extend/add background), NOT cropping, NOT zooming, NOT stretching.`
      } else if (ratioDiff < -0.2) {
        // Target is TALLER than template → need to extend TOP/BOTTOM (landscape → portrait)
        console.log('[Template Mode] OUTPAINTING NEEDED: Extend vertically (landscape → portrait)')
        aspectRatioGuidance = `
ASPECT RATIO CHANGE - OUTPAINTING REQUIRED:
The output must be a ${targetDimensions.width}x${targetDimensions.height} format (more vertical than the template).
You MUST extend the background VERTICALLY on TOP and BOTTOM.

CRITICAL OUTPAINTING INSTRUCTIONS:
1. Keep ALL original content fully visible - DO NOT crop or zoom any part of the image
2. Extend the background TOP and BOTTOM to fill the taller canvas
3. Continue patterns, gradients, textures, or solid colors seamlessly up and down
4. Add breathing room between elements if needed
5. All text, logos, decorative elements must remain completely visible
6. DO NOT stretch or distort any elements - only ADD new background area

This is OUTPAINTING (extend/add background), NOT cropping, NOT zooming, NOT stretching.`
      } else {
        console.log('[Template Mode] Aspect ratios similar - no major outpainting needed')
      }
    } catch (metadataError) {
      console.error('[Template Mode] Error getting template metadata:', metadataError)
      // Continue without aspect ratio guidance if metadata fails
    }
  }

  // Build explicit text rendering section from ALL form data fields
  // CRITICAL FIX: Iterate ALL fields dynamically - not just hardcoded names!
  // This supports dynamic fields like videoTitle, viewerHook from format-specific schemas
  let exactTextSection = ''
  if (rawFormData && Object.keys(rawFormData).length > 0) {
    const textLines: string[] = []

    for (const [key, value] of Object.entries(rawFormData)) {
      // Skip empty values
      if (value === undefined || value === null || String(value).trim() === '') {
        continue
      }

      // CRITICAL FIX: Only pass the VALUE, not the field name/label
      // The AI was rendering "Post Title: Monthly YI Gathering" literally
      // We want ONLY "Monthly YI Gathering" to appear in the image
      textLines.push(`- "${String(value).trim()}"`)
    }

    console.log('[Template Mode] === BUILT TEXT LINES ===')
    console.log('[Template Mode] Text Lines Count:', textLines.length)
    console.log('[Template Mode] Text Lines:', textLines.join(' | '))

    if (textLines.length > 0) {
      // FIXED: Removed section headers and instruction language that Gemini
      // was rendering as visible text in images. Now using simple quoted values only.
      exactTextSection = `

Text elements for this poster:
${textLines.join('\n')}
`
    }
  }

  // Build the template adaptation prompt
  // CRITICAL: This is an IMAGE EDITING task - keep template exactly, only swap text
  // The prompt instructs Gemini to preserve the template pixel-perfect and only change text content

  // Get format-specific decorative enhancements (e.g., borders for certificates)
  const formatEnhancement = formatId ? getFormatEnhancement(formatId) : ''
  if (formatEnhancement) {
    console.log('[Template Mode] Format enhancement enabled for:', formatId)
  }

  const adaptationPrompt = `Edit this template image. This is an image editing task, not generation.

Keep this template exactly as it is:
- Same background, colors, gradients, patterns
- Same existing decorative elements, shapes, borders, frames
- Same layout structure and composition
- Same photos and images in the template
${aspectRatioGuidance}

Only replace the text content with these new values:
${exactTextSection}

The output should look identical to the input template except for the text content.
Match the existing text styling, fonts, sizes, and positions.
${formatEnhancement ? `
${formatEnhancement}
` : ''}
${prompt}`

  // Use the latest Gemini 2.5 Flash Image model for image generation
  const response = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                inline_data: {
                  mime_type: templateMimeType,
                  data: templateBase64,
                },
              },
              {
                text: adaptationPrompt,
              },
            ],
          },
        ],
        generationConfig: {
          responseModalities: ['TEXT', 'IMAGE'],
        },
      }),
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Gemini Vision API error:', response.status, errorText)
    // Fallback to regular Gemini generation if template adaptation fails
    console.log('Falling back to regular Gemini generation with proper context')
    return (await generateWithGemini(prompt, null, undefined, format, resolution || '1K')).imageBase64
  }

  const data = await response.json()

  // Extract image from response
  const parts = data.candidates?.[0]?.content?.parts
  const imagePart = parts?.find((p: { inlineData?: { data: string } }) => p.inlineData)

  if (!imagePart?.inlineData?.data) {
    console.log('No image in template adaptation response, falling back with proper context')
    return (await generateWithGemini(prompt, null, undefined, format, resolution || '1K')).imageBase64
  }

  // Convert base64 to data URL
  const imageData = imagePart.inlineData.data
  const mimeType = imagePart.inlineData.mimeType || 'image/png'

  return `data:${mimeType};base64,${imageData}`
}

// ============================================================================
// OPENAI GPT-IMAGE-1 GENERATION
// ============================================================================

const OPENAI_MODEL_CAPABILITIES: Record<string, {
  supportedSizes: string[]
  supportsQualityTier: boolean
  supportsImageInput: boolean
  supportsThinking: boolean
  supportsImageSearch: boolean
}> = {
  'gpt-image-1': {
    supportedSizes: ['1024x1024', '1024x1536', '1536x1024'],
    supportsQualityTier: true,
    supportsImageInput: false,
    supportsThinking: false,
    supportsImageSearch: false,
  },
}

async function generateWithOpenAI(
  prompt: string,
  format: import('@/lib/config/creative-formats').CreativeFormat | null | undefined,
  quality: 'low' | 'medium' | 'high' = 'high',
  modelId: string = 'gpt-image-1'
): Promise<{ imageBase64: string; actualModel: string }> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('[OpenAI] OPENAI_API_KEY is not set')

  const client = new OpenAI({ apiKey })

  // Determine GPT-image-1 native size from format
  const gptSize = format?.gptImageSize || '1024x1024'

  console.log(`[OpenAI] Generating with model=${modelId} quality=${quality} size=${gptSize}`)
  console.log(`[OpenAI] Prompt (first 200 chars): ${prompt.substring(0, 200)}...`)

  const response = await client.images.generate({
    model: modelId,
    prompt,
    size: gptSize as '1024x1024' | '1024x1536' | '1536x1024',
    quality,
    n: 1,
  })

  const b64 = (response.data[0] as any).b64_json as string | undefined
  if (!b64) throw new Error('[OpenAI] No image data returned from GPT-image-1')

  const imageBase64 = `data:image/png;base64,${b64}`
  console.log(`[OpenAI] ✅ Generation complete — size=${gptSize} quality=${quality}`)

  return { imageBase64, actualModel: modelId }
}

async function generateWithGemini(
  prompt: string,
  designData?: DesignData | null,
  systemPrompt?: string,
  format?: import('@/lib/config/creative-formats').CreativeFormat | null,
  resolution?: string,
  modelId?: string,           // Model ID from request (e.g., 'gemini-3-pro-image-preview')
  retryCount: number = 0,     // Retry counter for dimension drift auto-upgrade (Tier 3)
  thinkingLevel?: 'minimal' | 'High',  // Flash 3.1 only: 'minimal' (fast) | 'High' (quality)
  useImageSearch?: boolean,            // Flash 3.1 only: enable Google Image Search grounding (default true)
  zoneGuideBase64?: string             // v40.3: Zone guide image — visual reference for logo overlay zones
): Promise<{ imageBase64: string; actualModel: string }> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('Gemini API key not configured')
  }

  // Get aspect ratio for imageConfig - format now uses Gemini-supported ratios
  const geminiAspectRatio = format?.aspectRatio || '1:1'

  // Model capability constraints with their API endpoints
  // All models support generationConfig.imageConfig for aspect ratio control
  const GEMINI_MODEL_CAPABILITIES: Record<string, {
    supportedSizes: string[]
    endpoint: string
    supportsImageConfig: boolean
    supportsImageSize: boolean     // Can use imageSize param (Flash 2.5 = false, others = true)
    supportsThinking: boolean      // Can control thinking level (Flash 3.1 only)
    supportsImageSearch: boolean   // Google Image Search grounding (Flash 3.1 only)
    supportsImageInput: boolean    // v40.3: Can accept image reference (zone guide / scaffold)
  }> = {
    'gemini-2.5-flash-image': {
      supportedSizes: ['1K'],
      endpoint: 'gemini-2.5-flash-image',
      supportsImageConfig: true,
      supportsImageSize: false,      // Confirmed: returns 400 if imageSize is sent
      supportsThinking: false,
      supportsImageSearch: false,
      supportsImageInput: false,     // Text-only generation
    },
    'gemini-2.0-flash-preview-image-generation': {
      supportedSizes: ['1K'],
      endpoint: 'gemini-2.0-flash-preview-image-generation',
      supportsImageConfig: true,
      supportsImageSize: false,
      supportsThinking: false,
      supportsImageSearch: false,
      supportsImageInput: false,
    },
    'gemini-3.1-flash-image-preview': {              // Nano Banana 2
      supportedSizes: ['512px', '1K', '2K', '4K'],
      endpoint: 'gemini-3.1-flash-image-preview',
      supportsImageConfig: true,
      supportsImageSize: true,
      supportsThinking: true,        // thinkingLevel: 'minimal' | 'High'
      supportsImageSearch: true,     // Google Image Search grounding (exclusive)
      supportsImageInput: true,      // v40.3: Accepts image reference for zone enforcement
    },
    'gemini-3-pro-image-preview': {
      supportedSizes: ['1K', '2K', '4K'],
      endpoint: 'gemini-3-pro-image-preview',
      supportsImageConfig: true,
      supportsImageSize: true,
      supportsThinking: false,       // Always thinks (level not configurable)
      supportsImageSearch: false,
      supportsImageInput: true,      // v40.3: Accepts image reference for zone enforcement
    },
  }

  // Auto-override model if the selected format requires a specific model (e.g., ultra aspect ratios)
  let effectiveModelId = format?.requiredModel || modelId

  // v43.2: Scaffold only attached when the SELECTED model already supports image input.
  // Previously (v41.4) stable gemini-2.5-flash-image was silently upgraded to the preview
  // model (gemini-3.1-flash-image-preview) whenever a scaffold was present. This caused
  // 429 errors because preview models have restricted quota even on paid accounts — every
  // "Nano Banana" generation was unknowingly burning the tightly-gated Flash 3.1 quota.
  // Fix: respect the user's model choice. Stable model → text zone instructions only.
  // Flash 3.1 / Pro (explicitly selected, support image input) → scaffold attached as before.
  const selectedModelSupportsImageInput = effectiveModelId ? (GEMINI_MODEL_CAPABILITIES[effectiveModelId]?.supportsImageInput ?? false) : false
  const activeZoneGuide = (zoneGuideBase64 && selectedModelSupportsImageInput) ? zoneGuideBase64 : undefined
  if (zoneGuideBase64 && !selectedModelSupportsImageInput) {
    console.log(`[Scaffold v43.2] ℹ️ ${effectiveModelId} does not support image input — scaffold skipped, text zone instructions used (stable model quota preserved)`)
  } else if (activeZoneGuide) {
    console.log(`[Scaffold v43.2] ✅ ${effectiveModelId} supports image input — scaffold attached`)
  }

  // Validate and constrain resolution based on model capabilities
  // Use effectiveModelId (may be overridden by format.requiredModel) or default to Flash
  const currentModel = effectiveModelId && GEMINI_MODEL_CAPABILITIES[effectiveModelId] ? effectiveModelId : 'gemini-2.5-flash-image'
  const requestedSize = resolution || '1K'
  const supportedSizes = GEMINI_MODEL_CAPABILITIES[currentModel]?.supportedSizes || ['1K']
  // Case-insensitive match — '1K'/'2K'/'4K' are uppercase; '512px' is lowercase
  const matchedSize = supportedSizes.find(s => s.toLowerCase() === requestedSize.toLowerCase())
  const geminiImageSize = matchedSize || supportedSizes[0]

  if (!matchedSize) {
    console.warn(`[Generate] Resolution "${requestedSize}" not supported by ${currentModel}, clamping to ${geminiImageSize}`)
  }

  const modelEndpoint = GEMINI_MODEL_CAPABILITIES[currentModel]?.endpoint || 'gemini-2.5-flash-image'
  console.log('[Generate] Gemini imageConfig - model:', currentModel, ', endpoint:', modelEndpoint, ', aspectRatio:', geminiAspectRatio, ', imageSize:', geminiImageSize)

  // Get aspect ratio for the prompt - prefer format if available
  let aspectRatioText = 'Portrait orientation (4:5 aspect ratio)'
  if (format) {
    aspectRatioText = `${format.label} format (${format.aspectRatio} aspect ratio, ${format.width}x${format.height}px)`
  } else if (designData) {
    const ratio = ASPECT_RATIOS[designData.aspectRatio as keyof typeof ASPECT_RATIOS]
    if (ratio) {
      aspectRatioText = `${ratio.label} (${designData.aspectRatio} aspect ratio)`
    }
  }

  // Build the user prompt - system instruction sent separately via Gemini API
  let userPrompt: string
  if (designData) {
    // Enhanced prompt with design data
    userPrompt = prompt
  } else {
    // Fallback for template mode - use narrative description, not command language
    userPrompt = `A professional marketing poster image. ${prompt}.
    Clean, modern, professional style.
    ${aspectRatioText}.
    Realistic photo elements where appropriate.
    All text clearly readable and well-designed.`
  }

  // SANITIZATION v6.5.1: Selective sanitization based on prompt structure
  // XML-structured prompts from YiPromptBuilder get gentle sanitization (field labels only)
  // Legacy prompts get full sanitization to prevent instruction leaks
  // This preserves AI agent insights (Event Understanding, Design Intelligence) while
  // still preventing field labels like "Event Name:", "Date:" from being rendered as text
  const sanitizedPrompt = isXmlStructuredPrompt(userPrompt)
    ? stripFieldLabelsOnly(userPrompt)  // Gentle: preserves XML, instructions, design terms
    : sanitizeForGemini(userPrompt)     // Aggressive: strips everything (legacy mode)

  // Debug: Check for any remaining leaks
  const detectedLeaks = detectLabelLeaks(sanitizedPrompt)
  if (detectedLeaks.length > 0) {
    console.warn('[Generate] Warning: Potential label leaks detected after sanitization:', detectedLeaks)
  }

  // Log the prompt for debugging
  console.log('[Generate] === FINAL PROMPT TO GEMINI ===')
  console.log('[Generate] Sanitization Mode:', isXmlStructuredPrompt(userPrompt) ? 'GENTLE (XML-preserved)' : 'AGGRESSIVE (legacy)')
  console.log('[Generate] Original Prompt Length:', userPrompt.length, 'chars')
  console.log('[Generate] Sanitized Prompt Length:', sanitizedPrompt.length, 'chars')
  console.log('[Generate] Reduction:', ((userPrompt.length - sanitizedPrompt.length) / userPrompt.length * 100).toFixed(1) + '%')
  console.log('[Generate] Estimated Tokens:', Math.ceil(sanitizedPrompt.length / 4))
  console.log('[Generate] Has System Instruction:', !!systemPrompt)
  if (systemPrompt) {
    console.log('[Generate] System Instruction Length:', systemPrompt.length, 'chars')
  }
  console.log('[Generate] Sanitized Prompt Preview (first 800 chars):')
  console.log(sanitizedPrompt.substring(0, 800))
  console.log('[Generate] ... (truncated)')

  // Build request body with imageConfig for aspect ratio control
  // Flash 2.5 ignores imageSize (always 1K). Flash 3.1 and Pro respect it.
  let requestBody: Record<string, unknown>

  console.log('[Generate] Using model with imageConfig - model:', currentModel, ', aspectRatio:', geminiAspectRatio, ', imageSize:', geminiImageSize)

  // Build imageConfig - Flash models don't support imageSize parameter (confirmed via API 400 error)
  const imageConfig: { aspectRatio: string; imageSize?: string } = {
    aspectRatio: geminiAspectRatio,
  }

  // Add imageSize only for models that respect it (Pro and Flash 3.1)
  // Flash 2.5 / Flash 2.0 silently ignore imageSize (always output 1K) — skip for clarity
  const modelCaps = GEMINI_MODEL_CAPABILITIES[currentModel]
  if (modelCaps?.supportsImageSize) {
    imageConfig.imageSize = geminiImageSize
    console.log(`[IMAGE SIZE] Adding imageSize="${geminiImageSize}" to ${currentModel}`)
  } else {
    console.log(`[IMAGE SIZE] ${currentModel} uses aspectRatio only (imageSize not supported)`)
  }

  // Build generationConfig — include thinkingConfig for Flash 3.1 when level is provided
  const generationConfig: Record<string, unknown> = {
    responseModalities: ['TEXT', 'IMAGE'],
    imageConfig: imageConfig,
  }
  if (modelCaps?.supportsThinking && thinkingLevel) {
    generationConfig.thinkingConfig = { thinkingLevel }
    console.log(`[THINKING] Adding thinkingConfig.thinkingLevel="${thinkingLevel}" to ${currentModel}`)
  }

  // Build tools array — Flash 3.1 gets Google Image Search grounding
  const tools: Record<string, unknown>[] = []
  if (modelCaps?.supportsImageSearch && useImageSearch !== false) {
    tools.push({
      google_search: {
        searchTypes: { webSearch: {}, imageSearch: {} },
      },
    })
    console.log(`[IMAGE SEARCH] Adding Google Image Search grounding tool for ${currentModel}`)
  }

  // v40.3: Include zone guide image in parts when supported (visual zone enforcement)
  const useZoneGuide = zoneGuideBase64 && modelCaps?.supportsImageInput
  const contentParts: Array<Record<string, unknown>> = []
  if (useZoneGuide) {
    contentParts.push({ inlineData: { mimeType: 'image/png', data: zoneGuideBase64 } })
    console.log('[Scaffold] ✅ Attaching logo bar scaffold to Gemini request (image-editing mode — bars physically occupy top/bottom)')
  }
  contentParts.push({ text: sanitizedPrompt })

  requestBody = {
    contents: [
      {
        role: 'user',
        parts: contentParts,
      },
    ],
    generationConfig,
    ...(tools.length > 0 && { tools }),
  }

  // Add system instruction if provided (works for both model types)
  if (systemPrompt) {
    requestBody.systemInstruction = {
      parts: [{ text: systemPrompt }],
    }
  }

  // CRITICAL: Add safety settings to prevent over-blocking of "Medical" or "People" content
  requestBody.safetySettings = [
    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
  ]

  // Use the selected Gemini model for image generation with retry logic.
  // Retry covers both the initial connection AND body reading — ECONNRESET can occur
  // during response.json() on large image payloads even after a 200 status is received.
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelEndpoint}:generateContent`
  const geminiHeaders = { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey }
  const geminiBody = JSON.stringify(requestBody)
  const MAX_BODY_RETRIES = 3

  let data: any
  for (let bodyAttempt = 0; bodyAttempt <= MAX_BODY_RETRIES; bodyAttempt++) {
    let response: Response

    try {
      response = await fetchWithRetry(
        geminiUrl,
        { method: 'POST', headers: geminiHeaders, body: geminiBody },
        {
          maxRetries: 3,
          baseDelay: 2000,
          timeout: 150000,      // 2.5 minutes — large image responses need more time
          retryableStatuses: [408, 500, 502, 503, 504],
          retryOn429: false,    // v43.4: quota errors fail immediately — 429 won't recover in 2-8s
          requestId: `gemini-${Date.now()}`
        }
      )
    } catch (error) {
      if (error instanceof NetworkError) {
        console.error('=== GEMINI NETWORK ERROR ===')
        console.error('After 3 retries with exponential backoff')
        console.error('Error:', (error as Error).message)
        console.error('============================')
        throw new Error('Network error connecting to Gemini API after 3 retries. Please check your internet connection and try again.')
      } else if (error instanceof TimeoutError) {
        console.error('=== GEMINI TIMEOUT ERROR ===')
        console.error('Error:', (error as Error).message)
        console.error('============================')
        throw new Error('Gemini API request timed out after 2.5 minutes. The service may be overloaded. Please try again.')
      } else {
        throw error
      }
    }

    if (!response.ok) {
      const errorText = await response.text()
      console.error('=== GEMINI API ERROR ===', response.status, errorText)
      let errorMessage = 'Failed to generate image with Gemini'
      try {
        const errorJson = JSON.parse(errorText)
        if (errorJson.error?.message) errorMessage = `Gemini API: ${errorJson.error.message}`
      } catch { /* keep default */ }
      throw new Error(errorMessage)
    }

    // Body read — retry on ECONNRESET (large image responses can drop mid-stream)
    try {
      data = await response.json()
      break  // success — exit retry loop
    } catch (bodyErr: any) {
      const isReset = bodyErr?.cause?.code === 'ECONNRESET' || bodyErr?.message?.includes('terminated') || bodyErr?.message?.includes('ECONNRESET')
      const isLast = bodyAttempt === MAX_BODY_RETRIES
      if (isReset && !isLast) {
        const delay = 3000 * (bodyAttempt + 1)
        console.warn(`[Gemini] ⚠️ Body read ECONNRESET (attempt ${bodyAttempt + 1}/${MAX_BODY_RETRIES + 1}), retrying in ${delay}ms...`)
        await new Promise(r => setTimeout(r, delay))
        continue
      }
      throw bodyErr
    }
  }

  // Extract image from response
  const parts = data.candidates?.[0]?.content?.parts
  const imagePart = parts?.find((p: { inlineData?: { data: string } }) => p.inlineData)

  if (!imagePart?.inlineData?.data) {
    throw new Error('No image generated')
  }

  // Convert base64 to data URL
  const imageData = imagePart.inlineData.data
  const mimeType = imagePart.inlineData.mimeType || 'image/png'

  // TIER 3: DIMENSION VALIDATION + AUTO-RETRY WITH PRO MODEL
  // Detect Flash model dimension drift and auto-upgrade to Pro for quality
  try {
    const sharp = await getSharp()
    const imageBuffer = Buffer.from(imageData, 'base64')
    const metadata = await sharp(imageBuffer).metadata()
    const actualWidth = metadata.width || 0
    const actualHeight = metadata.height || 0

    console.log(`[DIMENSION CHECK] ${currentModel} returned: ${actualWidth}x${actualHeight} for ${geminiAspectRatio} @ ${geminiImageSize}`)

    // DIMENSION_QUALITY reflects Gemini's actual native output sizes for all resolutions.
    // Sharp then resizes to the format's canonical dimensions (e.g. 1024 → 1080 for Instagram).
    // Always use DIMENSION_QUALITY as the TIER 3 expected baseline so drift = 0% for correct output.
    // Previously excluded 1K, causing a false 5.19% drift (format=1080 vs Gemini=1024) that
    // triggered a pointless 4x Pro upgrade — Pro also returns 1024px and Sharp resizes it anyway.
    let expectedWidth = format?.width || 1024
    let expectedHeight = format?.height || 1024
    const effectiveResolution = (resolution || '1K') as ResolutionId
    if (format?.aspectRatio && DIMENSION_QUALITY[format.aspectRatio as keyof typeof DIMENSION_QUALITY]) {
      const dqEntry = DIMENSION_QUALITY[format.aspectRatio as keyof typeof DIMENSION_QUALITY][effectiveResolution]
      if (dqEntry) {
        expectedWidth = dqEntry.width
        expectedHeight = dqEntry.height
      }
    }
    console.log(`[TIER 3] Expected dimensions: ${format?.label} @ ${effectiveResolution} = ${expectedWidth}x${expectedHeight}`)

    // Calculate drift percentage (width and height separately)
    const widthDrift = Math.abs(actualWidth - expectedWidth) / expectedWidth
    const heightDrift = Math.abs(actualHeight - expectedHeight) / expectedHeight
    const maxDrift = Math.max(widthDrift, heightDrift)

    console.log(`[TIER 3] Dimension drift analysis:`)
    console.log(`[TIER 3]   Expected: ${expectedWidth}x${expectedHeight}`)
    console.log(`[TIER 3]   Actual: ${actualWidth}x${actualHeight}`)
    console.log(`[TIER 3]   Width drift: ${(widthDrift * 100).toFixed(2)}%`)
    console.log(`[TIER 3]   Height drift: ${(heightDrift * 100).toFixed(2)}%`)
    console.log(`[TIER 3]   Max drift: ${(maxDrift * 100).toFixed(2)}%`)

    // TIER 3 AUTO-RETRY LOGIC
    // If drift exceeds 5% threshold AND this is a Flash model AND we haven't retried yet
    // Then auto-upgrade to Pro model for perfect quality
    // Exception: skip TIER 3 for 512px — user explicitly chose cheap/fast preview, not a drift bug
    const DRIFT_THRESHOLD = 0.05  // 5% - anything above this triggers Pro upgrade
    const isFlashModel = currentModel !== 'gemini-3-pro-image-preview' // Flash 2.5 and Flash 3.1 are both flash
    const is512px = resolution === '512px'  // User's intentional low-res choice — never upgrade
    const shouldRetry = maxDrift > DRIFT_THRESHOLD && isFlashModel && retryCount < 1 && !is512px

    if (shouldRetry) {
      console.warn(`[TIER 3] ⚠️ DIMENSION DRIFT TOO HIGH: ${(maxDrift * 100).toFixed(2)}% > ${(DRIFT_THRESHOLD * 100)}% threshold`)
      console.warn(`[TIER 3] 🔄 AUTO-UPGRADING to Pro model for quality (retry ${retryCount + 1}/1)`)
      const tierRes = (resolution === '512px' ? '1K' : resolution || '1K') as '1K' | '2K' | '4K'
      const tierSourceCost = calculateImageCost('gemini', currentModel, 1, tierRes)
      const tierTargetCost = calculateImageCost('gemini', 'gemini-3-pro-image-preview', 1, tierRes)
      const tierMultiplier = (tierTargetCost / tierSourceCost).toFixed(1)
      console.warn(`[TIER 3] 💰 Cost impact: $${tierSourceCost.toFixed(4)} → $${tierTargetCost.toFixed(4)} per image (${tierMultiplier}x increase justified by quality)`)

      // Recursive retry with Pro model (retryCount+1 prevents infinite loops)
      return await generateWithGemini(
        prompt,
        designData,
        systemPrompt,
        format,
        resolution,
        'gemini-3-pro-image-preview',  // Force Pro model
        retryCount + 1  // Increment retry counter (max 1 retry)
      )
    } else if (maxDrift > DRIFT_THRESHOLD) {
      // Drift is high but we've already retried or this is Pro model
      console.warn(`[TIER 3] ⚠️ High drift ${(maxDrift * 100).toFixed(2)}% but not retrying (retryCount=${retryCount}, model=${currentModel})`)
    } else {
      // Drift is acceptable
      console.log(`[TIER 3] ✅ Drift ${(maxDrift * 100).toFixed(2)}% is acceptable (threshold: ${(DRIFT_THRESHOLD * 100)}%)`)
    }
  } catch (error) {
    console.warn('[TIER 3] Failed to validate dimensions:', error)
    // Continue with generation even if validation fails
  }

  // For production, upload to Supabase Storage instead
  return { imageBase64: `data:${mimeType};base64,${imageData}`, actualModel: currentModel }
}

async function generateWithIdeogram(
  prompt: string,
  designData?: DesignData | null,
  styleType?: string,
  magicPrompt?: string,
  negativePrompt?: string,
  format?: import('@/lib/config/creative-formats').CreativeFormat | null
): Promise<string> {
  const apiKey = process.env.IDEOGRAM_API_KEY
  if (!apiKey) {
    throw new Error('Ideogram API key not configured')
  }

  // Get aspect ratio for Ideogram API - prefer format if available
  let aspectRatio: string
  if (format) {
    aspectRatio = getStandardAspectRatio(format).replace(':', '_').replace(/^/, 'ASPECT_')
  } else {
    aspectRatio = getAspectRatioString(designData)
  }

  // Build image request with new prompt system parameters
  const imageRequest: Record<string, unknown> = {
    prompt: designData
      ? prompt // Already enhanced with design data
      : `Professional marketing poster. ${prompt}. Clean modern design with excellent typography.`,
    aspect_ratio: aspectRatio,
    model: 'V_2',
    magic_prompt_option: magicPrompt || 'AUTO',
  }

  // Add style type if provided
  if (styleType) {
    imageRequest.style_type = styleType
  }

  // Add negative prompt if provided
  if (negativePrompt) {
    imageRequest.negative_prompt = negativePrompt
  }

  // Use Ideogram API with retry logic
  let response: Response

  try {
    response = await fetchWithRetry(
      'https://api.ideogram.ai/generate',
      {
        method: 'POST',
        headers: {
          'Api-Key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_request: imageRequest,
        }),
      },
      {
        maxRetries: 3,
        baseDelay: 2000,      // 2s, 4s, 8s exponential backoff
        timeout: 120000,      // 2 minutes for image generation
        retryableStatuses: [408, 429, 500, 502, 503, 504],
        requestId: `ideogram-${Date.now()}`
      }
    )
  } catch (error) {
    // Categorize error for better user feedback
    if (error instanceof NetworkError) {
      console.error('=== IDEOGRAM NETWORK ERROR ===')
      console.error('After 3 retries with exponential backoff')
      console.error('Error:', error.message)
      console.error('Cause:', error.cause)
      console.error('==============================')
      throw new Error('Network error connecting to Ideogram API after 3 retries. Please check your internet connection and try again.')
    } else if (error instanceof TimeoutError) {
      console.error('=== IDEOGRAM TIMEOUT ERROR ===')
      console.error('Request exceeded 2 minute timeout')
      console.error('Error:', error.message)
      console.error('==============================')
      throw new Error('Ideogram API request timed out after 2 minutes. The service may be overloaded. Please try again.')
    } else {
      // Re-throw other errors (auth, validation, etc.)
      throw error
    }
  }

  if (!response.ok) {
    const errorText = await response.text()
    console.error('=== IDEOGRAM API ERROR ===')
    console.error('Status:', response.status)
    console.error('Status Text:', response.statusText)
    console.error('Response Body:', errorText)
    console.error('API Key (last 4 chars):', apiKey.slice(-4))
    console.error('==========================')

    // Parse error for more specific message
    let errorMessage = 'Failed to generate image with Ideogram'
    try {
      const errorJson = JSON.parse(errorText)
      if (errorJson.error?.message) {
        errorMessage = `Ideogram API: ${errorJson.error.message}`
      }
    } catch {
      // Keep default message if parse fails
    }

    throw new Error(errorMessage)
  }

  const data = await response.json()

  if (!data.data?.[0]?.url) {
    throw new Error('No image URL in response')
  }

  return data.data[0].url
}

async function overlayLogos(
  imageUrl: string,
  logosPlacements: Array<{
    logoId: string
    position: string
    size?: LogoSizePreset | number
    backgroundShape?: LogoBackgroundShape
    backgroundStyle?: LogoBackgroundStyle
    logo?: { file_url: string }
  }>,
  supabase: Awaited<ReturnType<typeof createClient>>,
  backgroundColor?: string, // Global background color for all logos
  stripMode?: { enabled: boolean; rows: ('header' | 'middle' | 'footer')[] }, // Unified strip layout mode
  stripShape?: string // NEW v3.11: Logo strip shape (curved, angled, rounded, tapered)
): Promise<string> {
  try {
    console.log(`[overlayLogos] Received ${logosPlacements.length} logo placements`)
    console.log('[overlayLogos] Placements:', JSON.stringify(logosPlacements.map(p => ({
      logoId: p.logoId,
      position: p.position,
      hasLogo: !!p.logo,
      hasFileUrl: !!p.logo?.file_url
    }))))

    // Fetch logo URLs from database for all logos
    const logoIds = logosPlacements.map((p) => p.logoId)
    console.log(`[overlayLogos] Fetching logos for IDs: ${logoIds.join(', ')}`)

    const { data: logos, error } = await supabase
      .from('organization_logos')
      .select('id, file_url')
      .in('id', logoIds)

    if (error) {
      console.error('[overlayLogos] Database error:', error)
    }

    console.log(`[overlayLogos] Found ${logos?.length || 0} logos in database`)

    // Create a map of logo IDs to logo data
    const logoMap = new Map((logos || []).map((l) => [l.id, l]))

    // Build placements with logo data - prioritize database logos, fall back to passed logos
    const placementsWithLogos = logosPlacements
      .map((p) => {
        const dbLogo = logoMap.get(p.logoId)
        const passedLogo = p.logo
        const logo = dbLogo || passedLogo

        console.log(`[overlayLogos] Logo ${p.logoId}: dbLogo=${!!dbLogo}, passedLogo=${!!passedLogo}, final=${!!logo}, fileUrl=${logo?.file_url?.substring(0, 50)}...`)

        return {
          logoId: p.logoId,
          position: p.position as LogoPosition,
          size: p.size,                         // Preserve user's size selection
          backgroundShape: p.backgroundShape,   // Preserve background shape
          backgroundStyle: p.backgroundStyle,   // Preserve shadow/border settings
          logo: logo,
        }
      })
      .filter(p => p.logo?.file_url) // Only include logos with file URLs

    console.log(`[overlayLogos] Valid placements after filtering: ${placementsWithLogos.length}`)

    if (placementsWithLogos.length === 0) {
      console.log('[overlayLogos] No valid logo placements, returning original image')
      return imageUrl
    }

    // Process image with logo overlays using Sharp (pass background color, strip mode, and strip shape)
    const processedImageUrl = await processImageWithLogos(imageUrl, placementsWithLogos, backgroundColor, stripMode, stripShape)

    return processedImageUrl
  } catch (error) {
    console.error('[overlayLogos] Error:', error)
    // Return original image if logo overlay fails
    return imageUrl
  }
}
