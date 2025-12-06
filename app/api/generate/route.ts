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
import { processImageWithSpeakerPhoto } from '@/lib/sharp/speaker-overlay'
import type { DesignData, CustomizationData } from '@/lib/config/design-constants'
import { ASPECT_RATIOS, DIMENSION_QUALITY } from '@/lib/config/design-constants'
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
import { validateLogoPositions } from '@/lib/config/logo-locks'
import { getTemplateForFormat } from '@/lib/prompts/knowledge-base'
import { compileFormData, summarizeCompiledData } from '@/lib/prompts/services/form-data-compiler'
import { generateUltraProPromptSafe } from '@/lib/prompts/services/ultra-pro-prompt'
import { buildLogoAwarenessContext, buildLogoSummary } from '@/lib/prompts/helpers/logo-awareness'
import type { LogoPlacement } from '@/stores/creative-store'
import { YiPromptBuilder, injectVerticalContext, type EnhancedBuildOptions } from '@/lib/prompts/services/yi-prompt-builder'

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

    // ========================================================
    // API USAGE TRACKING - Track token usage and costs
    // ========================================================
    const usageTracker = createUsageTracker({
      organizationId,
      userId: user.id,
      // creativeId will be set after creation if needed
    })

    // Validate logo positions (PRD Section 8.4 - Brand Rules)
    // Yi logo MUST be top-left, CII logo MUST be top-right
    if (logosPlacements && logosPlacements.length > 0) {
      // Get logo names from database to validate positions
      const logoIds = logosPlacements.map((p) => p.logoId)
      const { data: logos } = await supabase
        .from('organization_logos')
        .select('id, name')
        .in('id', logoIds)

      if (logos && logos.length > 0) {
        const placementsToValidate = logosPlacements.map((p) => {
          const logo = logos.find((l) => l.id === p.logoId)
          return {
            logoName: logo?.name || p.logo?.name || '',
            position: p.position as import('@/lib/config/constants').LogoPosition,
          }
        })

        const validationErrors = validateLogoPositions(placementsToValidate)
        if (validationErrors.length > 0) {
          return NextResponse.json(
            { error: `Logo position error: ${validationErrors[0]}` },
            { status: 400 }
          )
        }
      }
    }

    let imageUrl: string

    // Determine if user has their own speaker photo to overlay
    // If yes, we don't want AI to generate placeholder speaker in the design
    const speakerPhoto = designData?.customization?.speakerPhoto
    const userHasSpeakerPhoto = speakerPhoto?.enabled && speakerPhoto?.photoUrl

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
      const promptDesignData = userHasSpeakerPhoto
        ? {
            ...designData,
            customization: {
              ...designData.customization,
              speakerPhoto: {
                ...designData.customization.speakerPhoto,
                enabled: false, // Don't tell AI about speaker photo if user will overlay their own
              },
            },
          }
        : designData

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
      const formDataContent = extractFromFormData(userFormData)

      // Log for debugging - helps verify form data is being received
      console.log('[Generate] === USER FORM DATA ===')
      console.log('[Generate] Raw Form Data:', JSON.stringify(userFormData, null, 2))
      console.log('[Generate] Extracted Event Name:', formDataContent.eventName || '(not found)')
      console.log('[Generate] Extracted Guest Name:', formDataContent.guestName || '(not found)')
      console.log('[Generate] Fallback (parsed) Event Name:', parsedContent.eventName || '(not found)')

      // ========================================================
      // STAGE 0.5: COMPILE FORM DATA & GENERATE ULTRA-PRO PROMPT
      // Uses Claude AI to transform user values into optimized prompt
      // ========================================================
      const compiledData = compileFormData(userFormData, formatId, designData, language)
      console.log('[Generate] === COMPILED FORM DATA ===')
      console.log('[Generate] Summary:\n' + summarizeCompiledData(compiledData))

      // Generate ultra-pro prompt using Claude AI
      const ultraProResult = await generateUltraProPromptSafe(compiledData, 'claude')
      const ultraProPrompt = ultraProResult.prompt

      // Track Ultra-Pro Prompt API usage
      if (ultraProResult.usage.model !== 'fallback') {
        await usageTracker.track(
          'ultra_pro_prompt',
          ultraProResult.usage.provider as AIProvider,
          ultraProResult.usage.model,
          {
            inputTokens: ultraProResult.usage.tokenUsage.inputTokens,
            outputTokens: ultraProResult.usage.tokenUsage.outputTokens,
            cachedTokens: ultraProResult.usage.tokenUsage.cachedTokens,
            durationMs: ultraProResult.usage.durationMs,
            promptLength: compiledData.eventName?.length || 0,
          }
        )
      }

      console.log('[Generate] === ULTRA-PRO PROMPT ===')
      console.log('[Generate] Primary Text:', ultraProPrompt.primaryText)
      console.log('[Generate] Secondary Text:', ultraProPrompt.secondaryText.join(', '))
      console.log('[Generate] Visual Scene:', ultraProPrompt.visualScene.substring(0, 100) + '...')

      // Clean instruction text from the prompt before passing to design intelligence
      // This prevents instruction text like "Create a striking..." from being analyzed
      // Also sanitize any remaining {{placeholders}} that weren't replaced
      const cleanedPrompt = sanitizePlaceholders(cleanPromptInstructions(prompt), 'cleanedPrompt')

      // Extract visual layout context from customization
      const speakerPhotoConfig = designData.customization?.speakerPhoto
      const layoutConfig = designData.customization?.layout

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
        console.log('[Generate] === LOGO AWARENESS (Smart Layout) ===')
        console.log('[Generate] Logo Placements:', buildLogoSummary(logosPlacements as LogoPlacement[]))
        console.log('[Generate] Safe Zones:', logoAwarenessContext.safeZoneDescriptions.join(', '))
      }

      const designBrief: DesignBrief = {
        // Event content - PRIORITY: User form data > Compiled data > AI-refined > Parsed
        // This ensures actual user input is never overwritten by AI-generated values
        eventType: formDataContent.eventType || parsedContent.eventType,
        eventName: formDataContent.eventName || compiledData.eventName || ultraProPrompt.primaryText || parsedContent.eventName,
        organizationName: compiledData.organizationName || 'Yi Creatives',
        details: ultraProPrompt.enhancedPrompt || cleanedPrompt, // Use Claude-generated enhanced prompt for visual guidance
        theme: designData.theme,
        style: designData.style,
        guestName: formDataContent.guestName || compiledData.speakerName || parsedContent.guestName,
        guestDesignation: formDataContent.guestDesignation || compiledData.speakerDesignation || parsedContent.guestDesignation,
        venue: formDataContent.venue || compiledData.venue || parsedContent.venue,
        additionalContext: `${ultraProPrompt.visualScene}. ${ultraProPrompt.designGuidance}`,

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
        speakerPhotoSize: speakerPhotoConfig?.size,
        // Logo zone configuration
        hasHeaderLogo: (layoutConfig?.headerHeight ?? 0) > 0,
        headerHeight: layoutConfig?.headerHeight,
        hasFooterLogo: (layoutConfig?.footerHeight ?? 0) > 0,
        footerHeight: layoutConfig?.footerHeight,

        // === LOGO AWARENESS (Smart Layout) ===
        logoSafeZoneGuidance: logoAwarenessContext.layoutGuidance || undefined,
      }

      // Generate AI-powered design context
      const designContextResult = await generateDesignContextSafe(designBrief)
      const designContext = designContextResult.context

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

      // Check if fallback was used (generic fallback starts with "Create an engaging")
      const usedFallback = designContext.corePurpose.startsWith('Create an engaging')

      console.log('[Generate] === DESIGN CONTEXT RESULT ===')
      console.log('[Generate] Used Fallback:', usedFallback ? 'YES (AI failed)' : 'NO (AI succeeded)')
      console.log('[Generate] Core Purpose:', designContext.corePurpose)
      console.log('[Generate] Visual Elements:', designContext.visualElements.join(', '))
      console.log('[Generate] Background Setting:', designContext.backgroundSetting)
      console.log('[Generate] Iconic Imagery:', designContext.iconicImagery.join(', '))

      if (usedFallback) {
        console.warn('[Generate] WARNING: Using generic fallback context - results may be less contextual!')
      }

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
        console.log('[Generate] User Form Data:', JSON.stringify(userFormData, null, 2))

        // Determine resolution
        const resolution = (promptDesignData?.resolution || '1K') as '1K' | '2K' | '4K'

        // Build EnhancedBuildOptions for v3.0 prompts
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
          // useBrandColors flag determines if colors should be applied
          brandContext: {
            organizationName: designBrief.organizationName || 'Yi Creatives',
            brandName: designBrief.organizationName,
            // Include colors when available
            primaryColor: promptDesignData?.customization?.background?.primaryColor,
            secondaryColor: promptDesignData?.customization?.background?.secondaryColor,
            accentColor: promptDesignData?.customization?.title?.color,
            // Flag to control color application
            useBrandColors: promptDesignData?.colorConfig?.useBrandColors ?? false,
          },
        }

        console.log('[Generate] EnhancedBuildOptions:', JSON.stringify(buildOptions, null, 2))

        // Build XML-structured prompt using YiPromptBuilder with enhanced options
        const xmlPrompt = YiPromptBuilder.buildPrompt(formatId, userFormData || {}, buildOptions)

        // Inject vertical context if applicable (redundant with buildOptions.verticalId but kept for compatibility)
        const finalXmlPrompt = verticalSlug
          ? injectVerticalContext(xmlPrompt, verticalSlug)
          : xmlPrompt

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
          resolution
        )
      } else {
        // ========================================================
        // LEGACY: Original prompt generation path
        // ========================================================
        const promptData = buildDesignPromptWithFormat(
          enhancedPrompt,
          promptDesignData,
          providerType,
          'Yi Creatives',
          selectedFormat,
          designContext, // Pass AI-generated design context
          language || 'en', // Pass language from request (PRD Section 10.2)
          logoAwarenessContext // Pass logo awareness for Smart Layout
        )

        if (provider === 'google') {
          // Extract resolution from designData or use default
          const resolution = promptDesignData?.resolution || '1K'
          imageUrl = await generateWithGemini(promptData.prompt, promptDesignData, promptData.systemPrompt, selectedFormat, resolution)
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
      console.log('[Template Mode] Raw Form Data:', JSON.stringify(userFormData, null, 2))
      console.log('[Template Mode] Field Count:', Object.keys(userFormData || {}).length)
      console.log('[Template Mode] Fields:', Object.keys(userFormData || {}).join(', '))

      // Build logo awareness context for template mode (v3.0)
      const templateLogoContext = buildLogoAwarenessContext(
        logosPlacements as LogoPlacement[] | undefined
      )
      if (templateLogoContext.hasLogos) {
        console.log('[Template Mode] Logo Awareness:', buildLogoSummary(logosPlacements as LogoPlacement[]))
      }

      // Build v3.0 prompt if format is supported
      let templatePrompt = prompt
      if (formatId && YiPromptBuilder.isSupportedFormat(formatId)) {
        console.log('[Template Mode] Using YiPromptBuilder v3.0 for format:', formatId)

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
          },
        }

        // Build v3.0 prompt for template adaptation
        templatePrompt = YiPromptBuilder.buildPrompt(formatId, userFormData || {}, templateBuildOptions)
        console.log('[Template Mode] v3.0 Prompt Preview:', templatePrompt.substring(0, 500))
      }

      // Template mode uses '1K' resolution since Gemini Vision only supports 1K
      imageUrl = await generateFromTemplate(templatePrompt, templateUrl, verticalSlug, userFormData, formatDimensions || undefined, selectedFormat, '1K')

      // Increment template use count
      if (templateId) {
        await supabase.rpc('increment_template_use_count', { template_id: templateId })
      }
    } else if (provider === 'google') {
      imageUrl = await generateWithGemini(enhancedPrompt, null, undefined, selectedFormat, '1K')
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
      console.log(`Processing ${logosPlacements.length} logo placements`)
      imageUrl = await overlayLogos(imageUrl, logosPlacements, supabase)
    }

    // If speaker photo is enabled and user has uploaded a photo, overlay it
    // Note: speakerPhoto is already defined above (line 88)
    if (userHasSpeakerPhoto && speakerPhoto) {
      console.log('Processing speaker photo overlay')
      imageUrl = await processImageWithSpeakerPhoto(imageUrl, speakerPhoto)
    }

    // Track image generation (estimated tokens for Gemini)
    // Gemini image generation has fixed cost per image + token cost for prompt
    if (creationMode === 'scratch' || templateUrl) {
      const imageProvider: AIProvider = provider === 'google' ? 'gemini' : 'gemini' // All image gen uses Gemini now
      const imageModel = 'gemini-2.5-flash-image'
      const estimatedInputTokens = Math.ceil(prompt.length / 4)
      const estimatedOutputTokens = 100 // Minimal text output for image gen

      await usageTracker.track(
        'image_generation',
        imageProvider,
        imageModel,
        {
          inputTokens: estimatedInputTokens,
          outputTokens: estimatedOutputTokens,
          imageCount: 1, // Always 1 image per generation
          durationMs: 0, // We don't have duration here
          promptLength: prompt.length,
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
 */
function extractFromFormData(formData: Record<string, unknown> | undefined): Partial<CreativeContent> {
  if (!formData) return {}

  return {
    // Event name: check multiple possible field names
    eventName: String(
      formData.title ||
      formData.eventName ||
      formData.eventTitle ||
      formData.name ||
      ''
    ).trim() || undefined,

    // Event type: infer from explicit field
    eventType: String(formData.eventType || formData.type || '').trim() || undefined,

    // Date/Time (CreativeContent uses 'date' and 'time', not 'eventDate')
    date: String(formData.date || formData.eventDate || '').trim() || undefined,
    time: String(formData.time || formData.eventTime || '').trim() || undefined,

    // Venue
    venue: String(formData.venue || formData.location || formData.venueName || '').trim() || undefined,

    // Speaker/Guest
    guestName: String(
      formData.speaker ||
      formData.guestName ||
      formData.speakerName ||
      formData.guest ||
      ''
    ).trim() || undefined,
    guestDesignation: String(
      formData.designation ||
      formData.guestDesignation ||
      formData.speakerDesignation ||
      ''
    ).trim() || undefined,

    // Description
    additionalText: String(
      formData.description ||
      formData.additionalInfo ||
      formData.details ||
      ''
    ).trim() || undefined,
  }
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
    type: 'event_poster',
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
  resolution?: string  // For fallback generation
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
      exactTextSection = `

=== TEXT CONTENT TO RENDER (VALUES ONLY) ===
${textLines.join('\n')}

CRITICAL TEXT RENDERING INSTRUCTIONS:
1. Render ONLY the quoted text content shown above - no labels or field names
2. Each quoted string is a separate text element to place in the design
3. DO NOT include words like "Title:", "Type:", or any field identifiers
4. DO NOT generate placeholder text like "[Insert Date]" or "Insert Time"
5. DO NOT use any text from the template image - ONLY use my provided values
6. Copy exact spelling, capitalization, and punctuation from inside the quotes
===============================================`
    }
  }

  // Build the template adaptation prompt - MUCH STRONGER rejection of template text
  // Include aspect ratio guidance if dimensions differ significantly
  const adaptationPrompt = `You are recreating a poster using ONLY the text I provide below.

${exactTextSection}
${aspectRatioGuidance}

STRICT REQUIREMENTS - READ CAREFULLY:
1. REPLACE ALL text in the template with ONLY the text I provided above
2. The template image is ONLY for visual style reference - COMPLETELY IGNORE its text content
3. DO NOT copy ANY text from the template image like "Helmet Awareness", "Road Safety", "[Insert Date]", "Insert Time", etc.
4. ONLY render the exact text I specified in my list above - nothing else

Visual style instructions:
- Maintain the template's color palette, fonts, and overall aesthetic
- Keep the decorative elements, backgrounds, patterns, and design structure
- Place my provided text in logical positions following the template's hierarchy
- Ensure all text is readable with appropriate contrast
- Preserve brand logos and their positions

Additional context:
${prompt}

Generate a poster that uses the template's visual style but contains ONLY my specified text content. The template text like "Helmet Awareness Campaign" must NOT appear in your output.`

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
  resolution?: string
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('Gemini API key not configured')
  }

  // Get aspect ratio for imageConfig - format now uses Gemini-supported ratios
  const geminiAspectRatio = format?.aspectRatio || '1:1'

  // Model capability constraints - gemini-2.5-flash-image only supports 1K
  const GEMINI_MODEL_CAPABILITIES: Record<string, { supportedSizes: string[] }> = {
    'gemini-2.5-flash-image': { supportedSizes: ['1K'] },
    'gemini-3-pro-image-preview': { supportedSizes: ['1K', '2K', '4K'] },
  }

  // Validate and constrain resolution based on model capabilities
  const currentModel = 'gemini-2.5-flash-image'
  const requestedSize = (resolution || '1K').toUpperCase()
  const supportedSizes = GEMINI_MODEL_CAPABILITIES[currentModel]?.supportedSizes || ['1K']
  const geminiImageSize = supportedSizes.includes(requestedSize) ? requestedSize : supportedSizes[0]

  if (requestedSize !== geminiImageSize) {
    console.warn(`[Generate] Resolution ${requestedSize} not supported by ${currentModel}, using ${geminiImageSize}`)
  }

  console.log('[Generate] Gemini imageConfig - aspectRatio:', geminiAspectRatio, ', imageSize:', geminiImageSize)

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
    // Fallback for template mode
    userPrompt = `Create a professional marketing poster image. ${prompt}.
    Style: Clean, modern, professional.
    Format: ${aspectRatioText}.
    Include realistic photo elements where appropriate.
    Make text clearly readable and well-designed.`
  }

  // Log the prompt for debugging
  console.log('[Generate] === FINAL PROMPT TO GEMINI ===')
  console.log('[Generate] User Prompt Length:', userPrompt.length, 'chars')
  console.log('[Generate] Estimated Tokens:', Math.ceil(userPrompt.length / 4))
  console.log('[Generate] Has System Instruction:', !!systemPrompt)
  if (systemPrompt) {
    console.log('[Generate] System Instruction Length:', systemPrompt.length, 'chars')
  }
  console.log('[Generate] User Prompt Preview (first 800 chars):')
  console.log(userPrompt.substring(0, 800))
  console.log('[Generate] ... (truncated)')

  // Build request body with proper Gemini API structure
  // System instruction is sent as a separate field, not concatenated with user prompt
  const requestBody: Record<string, unknown> = {
    contents: [
      {
        role: 'user',
        parts: [{ text: userPrompt }],
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

  // Add system instruction if provided (proper Gemini API format)
  if (systemPrompt) {
    requestBody.systemInstruction = {
      parts: [{ text: systemPrompt }],
    }
  }

  // Use the latest Gemini 2.5 Flash Image model for image generation
  const response = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent',
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
    console.error('Gemini API error:', response.status, errorText)
    throw new Error('Failed to generate image with Gemini')
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
  logosPlacements: Array<{ logoId: string; position: string; logo?: { file_url: string } }>,
  supabase: Awaited<ReturnType<typeof createClient>>
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
          logo: logo,
        }
      })
      .filter(p => p.logo?.file_url) // Only include logos with file URLs

    console.log(`[overlayLogos] Valid placements after filtering: ${placementsWithLogos.length}`)

    if (placementsWithLogos.length === 0) {
      console.log('[overlayLogos] No valid logo placements, returning original image')
      return imageUrl
    }

    // Process image with logo overlays using Sharp
    const processedImageUrl = await processImageWithLogos(imageUrl, placementsWithLogos)

    return processedImageUrl
  } catch (error) {
    console.error('[overlayLogos] Error:', error)
    // Return original image if logo overlay fails
    return imageUrl
  }
}
