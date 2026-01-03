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
import { processImageWithLogos, resizeImageToExactDimensions, type LogoPosition } from '@/lib/sharp/logo-overlay'
import type { LogoSizePreset, LogoBackgroundShape, LogoBackgroundStyle } from '@/lib/constants/logoConstants'
import { processImageWithSpeakerPhoto, calculateSpeakerPhotoCoordinates } from '@/lib/sharp/speaker-overlay'
import { normalizeSpeakerConfig, getSpeakerCount } from '@/lib/utils/speaker-migration'
import type { DesignData, CustomizationData } from '@/lib/config/design-constants'
import {
  ASPECT_RATIOS,
  DIMENSION_QUALITY,
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
import { compileFormData, summarizeCompiledData } from '@/lib/prompts/services/form-data-compiler'
import { generateUltraProPromptSafe } from '@/lib/prompts/services/ultra-pro-prompt'
import { buildLogoAwarenessContext, buildLogoSummary } from '@/lib/prompts/helpers/logo-awareness'
import type { LogoPlacement } from '@/stores/creative-store'
import { YiPromptBuilder, injectVerticalContext, type EnhancedBuildOptions } from '@/lib/prompts/services/yi-prompt-builder'
import { inferThemeFromDetails, type EventDetails } from '@/lib/services/theme-inference'
import { sanitizeForGemini, detectLabelLeaks, stripFieldLabelsOnly, isXmlStructuredPrompt } from '@/lib/prompts/services/prompt-sanitizer'
import { sanitizeForLogging } from '@/lib/utils/sanitize-log-data'
import { randomUUID } from 'crypto'

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
  try {
    const supabase = await createClient()

    // Verify user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      prompt,
      model,
      provider,
      verticalSlug,
      logosPlacements,
      logoBackgroundColor, // Global background color for all logos
      logoStripMode, // Unified strip layout mode
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

    // Get format if specified
    const selectedFormat = formatId ? getFormatById(formatId) : null
    const formatDimensions = customDimensions || (selectedFormat ? { width: selectedFormat.width, height: selectedFormat.height } : null)

    // Verify user belongs to the organization
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .single()

    if (!membership) {
      return NextResponse.json(
        { error: 'You do not have access to this organization' },
        { status: 403 }
      )
    }

    // Check role permissions
    if (membership.role === 'viewer') {
      return NextResponse.json(
        { error: 'Viewers cannot generate creatives' },
        { status: 403 }
      )
    }

    // NEW v3.2: Fetch organization brand_config to get font preference
    // This implements the hybrid approach: font family from org settings, AI controls sizing
    const { data: orgData } = await supabase
      .from('organizations')
      .select('brand_config')
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
      const compiledData = compileFormData(adjustedUserFormData, formatId, effectiveDesignData, language, speakerPhotoEnabled)
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
      const speakers: Array<{ name: string, designation?: string }> = []
      const speakerName = formDataContent.guestName || compiledData.speakerName
      const speakerDesignation = formDataContent.guestDesignation || compiledData.speakerDesignation

      if (speakerName) {
        speakers.push({
          name: speakerName,
          designation: speakerDesignation ?? undefined
        })
      }

      if (formatId && shouldUseEventUnderstanding(formatId, eventName)) {
        console.log('[Generate] === STAGE 1: EVENT UNDERSTANDING ===')
        console.log('[Generate] Event:', eventName)
        console.log('[Generate] Analyzing event concept semantically...')

        try {

          eventProfile = await generateEventUnderstanding({
            eventName,
            description: compiledData.description || formDataContent.description || undefined,
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

      if (effectiveDesignData?.theme === 'ai' || !effectiveDesignData?.theme) {
        // User wants AI to generate custom theme OR hasn't selected any theme
        finalTheme = 'ai-custom'  // Signal to Design Intelligence
        finalStyle = effectiveDesignData?.style || 'modern'
        useCustomThemeGeneration = true
        console.log('[Generate] 🎨 AI Custom Theme Mode - Design Intelligence will generate unique theme')
      } else {
        // User manually selected a theme from the predefined options
        finalTheme = effectiveDesignData.theme
        finalStyle = effectiveDesignData?.style || 'modern'
        console.log(`[Generate] User-selected theme: ${finalTheme}`)
      }

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

      const designBrief: DesignBrief = {
        // Event content - PRIORITY: User form data > Compiled data > Parsed
        // v5.0: REMOVED Ultra-Pro dependencies - Design Intelligence runs FIRST now
        eventType: formDataContent.eventType || parsedContent.eventType,
        eventName: formDataContent.eventName || compiledData.eventName || parsedContent.eventName || 'Event',
        organizationName: compiledData.organizationName || 'Yi Creatives',
        details: cleanedPrompt || compiledData.description || '', // Use compiled description for design context
        theme: useCustomThemeGeneration ? undefined : finalTheme,  // Don't pass theme if AI generating custom
        style: finalStyle,
        requestCustomTheme: useCustomThemeGeneration,  // v6.0 Phase 3: NEW flag for AI custom theme
        // Speaker/Guest data - flows freely for TEXT rendering
        // v4.3: Reverted from v4.1 gating - speaker TEXT should render, only PHOTO PLACEHOLDER should be prevented
        guestName: formDataContent.guestName || compiledData.speakerName || parsedContent.guestName,
        guestDesignation: formDataContent.guestDesignation || compiledData.speakerDesignation || parsedContent.guestDesignation,
        venue: formDataContent.venue || compiledData.venue || parsedContent.venue,
        additionalContext: compiledData.tagline || compiledData.description || '',

        // v4.2: Brand context for color-aware intelligence
        brandContext: {
          organizationName: compiledData.organizationName || 'Organization',
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
      }

      // Generate AI-powered design context
      // v6.0 Phase 2: Pass resolvedColors for color-aware background generation
      // v6.5 Phase 1: Pass eventProfile from Stage 1 for concept-driven design
      const designContextResult = await generateDesignContextSafe(designBrief, resolvedColors, eventProfile)

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

      const ultraProResult = await generateUltraProPromptSafe(compiledData, 'gemini', designContext, logoStripMode?.enabled || false, resolvedColors)
      const ultraProPrompt = ultraProResult.prompt

      console.log('[Generate] === ULTRA-PRO RESULT ===')
      console.log('[Generate] Primary Text:', ultraProPrompt.primaryText)
      console.log('[Generate] Enhanced Prompt (first 200 chars):', ultraProPrompt.enhancedPrompt?.substring(0, 200))
      console.log('[Generate] Visual Scene:', ultraProPrompt.visualScene)
      console.log('[Generate] Design Guidance:', ultraProPrompt.designGuidance)

      // v5.5: VARIATION DEBUGGING - Track cache behavior for creative formats
      console.log('[VARIATION DEBUG] Ultra-Pro Cache Status:', ultraProResult.usage.model === 'cached' ? '🔄 HIT (reused)' : '✅ MISS (fresh)')
      console.log('[VARIATION DEBUG] Format:', formatId)
      console.log('[VARIATION DEBUG] Is Creative Format:', ['event_poster', 'flyer', 'instagram_post', 'youtube_thumbnail'].includes(formatId || ''))

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
              eventDescription: cleanedPrompt || compiledData.description || undefined,
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
            size: (
              originalSpeakerPhotoConfig.size
                ? (originalSpeakerPhotoConfig.size <= 80 ? 'small' : originalSpeakerPhotoConfig.size <= 100 ? 'medium' : 'large')
                : 'large'
            ) as 'small' | 'medium' | 'large',
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
        }

        console.log('[Generate] EnhancedBuildOptions:', JSON.stringify(sanitizeForLogging(buildOptions), null, 2))

        // v6.5: Pre-calculate speaker photo coordinates for Gemini prompt injection
        // This enables coordination between Gemini generation and Sharp overlay
        // v6.5.1: Added selectedFormat null check to prevent crash
        // v6.5.2: Added explicit width/height checks to prevent undefined property access
        let speakerPhotoZoneCoordinates: ReturnType<typeof calculateSpeakerPhotoCoordinates> | undefined
        if (buildOptions.speakerPhotoConfig && originalSpeakerPhotoConfig && selectedFormat?.width && selectedFormat?.height) {
          // v6.9: Updated to match design spec (25-40% of poster width)
          // For 1080px width: small=26%, medium=30%, large=35%
          // This provides proper visual prominence for speaker photos
          const photoSizeMap = { small: 280, medium: 320, large: 380 }
          const photoSize = (buildOptions.speakerPhotoConfig.size && photoSizeMap[buildOptions.speakerPhotoConfig.size as keyof typeof photoSizeMap]) || 100
          const borderWidth = originalSpeakerPhotoConfig.border?.width || 0

          speakerPhotoZoneCoordinates = calculateSpeakerPhotoCoordinates(
            {
              position: buildOptions.speakerPhotoConfig.position || 'left',
              verticalPosition: originalSpeakerPhotoConfig.verticalPosition || 'top',
              size: photoSize,
              borderWidth: borderWidth,
              shadow: originalSpeakerPhotoConfig.shadow,  // v6.6: Pass shadow config for accurate positioning
            },
            {
              width: selectedFormat.width,
              height: selectedFormat.height,
            }
          )

          console.log('[Generate] Speaker photo zone coordinates calculated:', speakerPhotoZoneCoordinates)
        }

        // v4.3: Removed form data sanitization - speaker TEXT should flow through for rendering
        // The "no placeholder" instruction is added in format builders instead

        // Build XML-structured prompt using YiPromptBuilder
        const xmlPrompt = YiPromptBuilder.buildPrompt(formatId, userFormData || {}, {
          ...buildOptions,
          // v6.5: Pass calculated speaker photo coordinates to prompt builder
          speakerPhotoZoneCoordinates,
        })

        // Inject vertical context if applicable (redundant with buildOptions.verticalId but kept for compatibility)
        const finalXmlPrompt = verticalSlug
          ? injectVerticalContext(xmlPrompt, verticalSlug)
          : xmlPrompt

        // CRITICAL: Validate speaker text presence in XML tags
        const formSpeakers = (userFormData as any)?.speakers || (formDataContent as any)?.speakers || [];
        if (formSpeakers && formSpeakers.length > 0) {
          const speakerNameMatch = finalXmlPrompt.match(/<text role="speaker_name[^"]*"[^>]*>([^<]+)<\/text>/);

          if (!speakerNameMatch) {
            console.error('[Generation] 🚨 SPEAKER TEXT NOT IN <text role> TAGS!');
            console.error('[Generation] ⚠️ Speaker will NOT render in image');
            console.error('[Generation] Expected speaker:', formSpeakers[0]?.name);
            console.error('[Generation] Speakers array length:', formSpeakers.length);
          } else {
            console.log('[Generation] ✅ Speaker text found in XML tags:', speakerNameMatch[1]);
          }
        }

        // v5.5: Validate that user colors made it into the final prompt
        if (resolvedColors.source !== 'fallback') {
          const promptIncludesPrimary = finalXmlPrompt.includes(resolvedColors.primaryColor)
          const promptIncludesSecondary = finalXmlPrompt.includes(resolvedColors.secondaryColor)

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

        // Generate with Gemini using the new prompt
        imageUrl = await generateWithGemini(
          finalXmlPrompt,
          promptDesignData,
          systemInstruction,
          selectedFormat,
          resolution,
          model  // Pass model from request
        )
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
          logoAwarenessContext // Pass logo awareness for Smart Layout
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
          imageUrl = await generateWithGemini(promptData.prompt, promptDesignData, promptData.systemPrompt, selectedFormat, resolution, model)
        } else if (provider === 'ideogram') {
          imageUrl = await generateWithIdeogram(
            promptData.prompt,
            promptDesignData,
            promptData.styleType,
            promptData.magicPrompt,
            promptData.negativePrompt,
            selectedFormat
          )
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
      imageUrl = await generateWithGemini(enhancedPrompt, null, undefined, selectedFormat, '1K', model)
    } else if (provider === 'ideogram') {
      imageUrl = await generateWithIdeogram(enhancedPrompt, null, undefined, undefined, undefined, selectedFormat)
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

    // If logos need to be overlaid, process with Sharp
    if (logosPlacements && logosPlacements.length > 0) {
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
    }

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
      const speakerCount = getSpeakerCount(normalizedSpeakerPhoto)

      console.log(`[Generate API] Applying speaker photo overlays (${speakerCount} speaker${speakerCount > 1 ? 's' : ''})`)

      try {
        imageUrl = await processImageWithSpeakerPhoto(imageUrl, normalizedSpeakerPhoto)
        console.log(`[Generate API] Successfully overlaid ${speakerCount} speaker photo${speakerCount > 1 ? 's' : ''}`)
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

      try {
        imageUrl = await uploadImageToStorage(base64Data, mimeType, organizationId, supabase)
        console.log('[Generate] Image uploaded successfully to Storage')
      } catch (uploadError) {
        console.error('[Generate] Failed to upload to Storage, falling back to base64:', uploadError)
        // Keep base64 as fallback - don't fail generation due to storage issues
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

    // Track image generation (estimated tokens for Gemini)
    // Cost calculation: Input tokens (text prompt) + flat image rate
    // Image cost is NOT based on output tokens - it's a flat rate per image:
    // - gemini-2.5-flash-image: $0.039/image (1290 tokens @ $30/1M)
    // - gemini-3-pro-image-preview: $0.1344/image (1K/2K), $0.24/image (4K)
    if (creationMode === 'scratch' || templateUrl) {
      const imageProvider: AIProvider = provider === 'google' ? 'gemini' : 'gemini' // All image gen uses Gemini now
      // Use actual model from request, default to Flash
      const imageModel = model || 'gemini-2.5-flash-image'
      // Estimate input tokens from prompt length (~4 chars per token)
      const estimatedInputTokens = Math.ceil(prompt.length / 4)
      const requestedResolution = (effectiveDesignData?.resolution || '1K') as '1K' | '2K' | '4K'

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
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Generation failed' },
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
  logoAwareness?: import('@/lib/prompts/helpers/logo-awareness').LogoAwarenessContext // Logo awareness for Smart Layout
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
  }

  // Generate the prompt (now includes design intelligence if available)
  const promptOutput = generatePrompt(params)

  if (isGeminiPrompt(promptOutput)) {
    return {
      prompt: promptOutput.userPrompt,
      systemPrompt: promptOutput.systemPrompt,
    }
  } else if (isIdeogramPrompt(promptOutput)) {
    const apiFormat = toIdeogramApiFormat(promptOutput)
    return {
      prompt: apiFormat.prompt,
      styleType: apiFormat.styleType,
      magicPrompt: apiFormat.magicPrompt,
      negativePrompt: apiFormat.negativePrompt,
    }
  }

  // Fallback
  return { prompt: basePrompt }
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
    return generateWithGemini(prompt, null, undefined, format, resolution || '1K')
  }

  const data = await response.json()

  // Extract image from response
  const parts = data.candidates?.[0]?.content?.parts
  const imagePart = parts?.find((p: { inlineData?: { data: string } }) => p.inlineData)

  if (!imagePart?.inlineData?.data) {
    console.log('No image in template adaptation response, falling back with proper context')
    return generateWithGemini(prompt, null, undefined, format, resolution || '1K')
  }

  // Convert base64 to data URL
  const imageData = imagePart.inlineData.data
  const mimeType = imagePart.inlineData.mimeType || 'image/png'

  return `data:${mimeType};base64,${imageData}`
}

async function generateWithGemini(
  prompt: string,
  designData?: DesignData | null,
  systemPrompt?: string,
  format?: import('@/lib/config/creative-formats').CreativeFormat | null,
  resolution?: string,
  modelId?: string  // Model ID from request (e.g., 'gemini-3-pro-image-preview')
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('Gemini API key not configured')
  }

  // Get aspect ratio for imageConfig - format now uses Gemini-supported ratios
  const geminiAspectRatio = format?.aspectRatio || '1:1'

  // Model capability constraints with their API endpoints
  // Note: Only gemini-3-pro-image-preview supports generationConfig.imageConfig
  // Flash models require simple request structure without imageConfig
  const GEMINI_MODEL_CAPABILITIES: Record<string, { supportedSizes: string[]; endpoint: string; supportsImageConfig: boolean }> = {
    'gemini-2.5-flash-image': { supportedSizes: ['1K'], endpoint: 'gemini-2.5-flash-image', supportsImageConfig: false },
    'gemini-2.0-flash-preview-image-generation': { supportedSizes: ['1K'], endpoint: 'gemini-2.0-flash-preview-image-generation', supportsImageConfig: false },
    'gemini-3-pro-image-preview': { supportedSizes: ['1K', '2K', '4K'], endpoint: 'gemini-3-pro-image-preview', supportsImageConfig: true },
  }

  // Validate and constrain resolution based on model capabilities
  // Use requested model or default to Flash
  const currentModel = modelId && GEMINI_MODEL_CAPABILITIES[modelId] ? modelId : 'gemini-2.5-flash-image'
  const requestedSize = (resolution || '1K').toUpperCase()
  const supportedSizes = GEMINI_MODEL_CAPABILITIES[currentModel]?.supportedSizes || ['1K']
  const geminiImageSize = supportedSizes.includes(requestedSize) ? requestedSize : supportedSizes[0]

  if (requestedSize !== geminiImageSize) {
    console.warn(`[Generate] Resolution ${requestedSize} not supported by ${currentModel}, using ${geminiImageSize}`)
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

  // Build request body based on model capabilities
  // Flash models (gemini-2.5-flash-image): Simple request without generationConfig.imageConfig
  // Pro model (gemini-3-pro-image-preview): Full request with imageConfig for aspect ratio and resolution
  let requestBody: Record<string, unknown>

  if (GEMINI_MODEL_CAPABILITIES[currentModel]?.supportsImageConfig) {
    // gemini-3-pro-image-preview: Use full generationConfig with imageConfig
    console.log('[Generate] Using Pro model with imageConfig - aspectRatio:', geminiAspectRatio, ', imageSize:', geminiImageSize)
    requestBody = {
      contents: [
        {
          role: 'user',
          parts: [{ text: sanitizedPrompt }],
        },
      ],
      generationConfig: {
        responseModalities: ['TEXT', 'IMAGE'],
        imageConfig: {
          aspectRatio: geminiAspectRatio,
          imageSize: geminiImageSize,
        },
      },
    }
  } else {
    // gemini-2.5-flash-image: Simple request without imageConfig (model generates images by default)
    // CRITICAL FIX: Flash model doesn't support imageConfig.aspectRatio, so we embed
    // aspect ratio instructions directly in the prompt to prevent gaps/distortion
    console.log('[Generate] Using Flash model with simple request structure (no imageConfig)')

    // Build aspect ratio instruction for Flash model
    const aspectRatioInstruction = format
      ? `\n\nCRITICAL ASPECT RATIO REQUIREMENT: Generate this image at EXACTLY ${format.aspectRatio} aspect ratio (${format.width}x${format.height} pixels). The image MUST fill the entire canvas edge-to-edge with NO empty borders, NO letterboxing, NO white gaps, and NO padding. The design content should extend to ALL four edges of the image.`
      : ''

    console.log('[Generate] Flash model aspect ratio instruction:', format ? `${format.aspectRatio} (${format.width}x${format.height})` : 'none')

    requestBody = {
      contents: [
        {
          role: 'user',
          parts: [{ text: sanitizedPrompt + aspectRatioInstruction }],
        },
      ],
    }
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

  // Use the selected Gemini model for image generation
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelEndpoint}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(requestBody),
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    console.error('=== GEMINI API ERROR ===')
    console.error('Status:', response.status)
    console.error('Status Text:', response.statusText)
    console.error('Response Body:', errorText)
    console.error('API Key (last 4 chars):', apiKey.slice(-4))
    console.error('========================')

    // Parse error for more specific message
    let errorMessage = 'Failed to generate image with Gemini'
    try {
      const errorJson = JSON.parse(errorText)
      if (errorJson.error?.message) {
        errorMessage = `Gemini API: ${errorJson.error.message}`
      }
    } catch {
      // Keep default message if parse fails
    }

    throw new Error(errorMessage)
  }

  const data = await response.json()

  // Extract image from response
  const parts = data.candidates?.[0]?.content?.parts
  const imagePart = parts?.find((p: { inlineData?: { data: string } }) => p.inlineData)

  if (!imagePart?.inlineData?.data) {
    throw new Error('No image generated')
  }

  // Convert base64 to data URL
  const imageData = imagePart.inlineData.data
  const mimeType = imagePart.inlineData.mimeType || 'image/png'

  // For production, upload to Supabase Storage instead
  return `data:${mimeType};base64,${imageData}`
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

  const response = await fetch('https://api.ideogram.ai/generate', {
    method: 'POST',
    headers: {
      'Api-Key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image_request: imageRequest,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Ideogram API error:', errorText)
    throw new Error('Failed to generate image with Ideogram')
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
