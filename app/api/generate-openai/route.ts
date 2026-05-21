import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createUsageTracker } from '@/lib/services/api-usage'
import { convertToINR } from '@/lib/services/currency'
import type { AIProvider } from '@/lib/config/ai-pricing'
import { resolveColorConfig, isValidHex } from '@/lib/utils/resolve-color-config'
import { getFormatById, type CreativeFormatId } from '@/lib/config/creative-formats'
import { getBackgroundStyleHint } from '@/lib/config/background-styles'
import type { DesignData, Enhanced4RowStripMode } from '@/lib/config/design-constants'
import type { LogoPlacement } from '@/stores/creative-store'
import type { LogoSizePreset, LogoBackgroundShape, LogoBackgroundStyle } from '@/lib/constants/logoConstants'

// Shared AI stages — re-used verbatim from the Gemini pipeline.
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
import {
  generateDesignContextSafe,
  type DesignBrief,
} from '@/lib/prompts/services/design-intelligence'
import { sanitizeDesignContext } from '@/lib/prompts/helpers/design-context-sanitizer'
import { compileFormData, summarizeCompiledData } from '@/lib/prompts/services/form-data-compiler'
import { generateUltraProPromptSafe } from '@/lib/prompts/services/ultra-pro-prompt'
import { buildLogoAwarenessContext, buildLogoSummary } from '@/lib/prompts/helpers/logo-awareness'
import { buildOpenAIPrompt, isCompatibleWithOpenAI } from '@/lib/prompts/services/openai-prompt-builder'
import { getTemplateForFormat } from '@/lib/prompts/knowledge-base'
import { sanitizeUserFormDataForOpenAI } from '@/lib/pipelines/openai-metadata-sanitizer'

// Hardened OpenAI pipeline.
import {
  generateWithOpenAI,
  OpenAITimeoutError,
  OpenAIConfigurationError,
  OPENAI_MODEL_CAPABILITIES,
} from '@/lib/pipelines/openai-pipeline'
import { applyMinimumPostProcessing } from '@/lib/pipelines/creative-post-processing'

// Route config: 800s is the Next 16 Pro ceiling. Our AbortSignal hard cap is 9 min (540s),
// so the route will always surface a clean error before the platform kills it.
export const maxDuration = 800
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const routeStartMs = Date.now()

  try {
    const supabase = await createClient()

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
      logoBackgroundColor,
      logoStripMode,
      enhanced4RowStrip,
      organizationId,
      designData,
      formatId,
      customDimensions,
      language,
      userFormData,
      imageQuality,
      backgroundStyle, // v48.0: User-selected background style id (photo-real, product, abstract, etc.)
    } = body as {
      prompt: string
      model: string
      provider: string
      verticalSlug: string
      logosPlacements: Array<{
        logoId: string
        position: string
        size?: LogoSizePreset | number
        backgroundShape?: LogoBackgroundShape
        backgroundStyle?: LogoBackgroundStyle
        logo?: { file_url: string; name?: string }
      }>
      logoBackgroundColor?: string
      logoStripMode?: {
        enabled: boolean
        rows: Array<'header' | 'middle' | 'footer'>
        opacity?: number
        logoBound?: boolean
      }
      enhanced4RowStrip?: Enhanced4RowStripMode
      organizationId: string
      designData?: DesignData | null
      formatId?: CreativeFormatId
      customDimensions?: { width: number; height: number } | null
      language?: string
      userFormData?: Record<string, unknown>
      imageQuality?: 'low' | 'medium' | 'high'
      backgroundStyle?: string // v48.0: id from BACKGROUND_STYLES
    }

    console.log(
      `[OpenAI Pipeline] Request: provider=${provider} model=${model} quality=${imageQuality ?? 'high'} format=${formatId}`
    )

    // ── Quality guardrail (v44.1) ────────────────────────────────────────────
    // gpt-image-1 at `low` quality produces hallucinated text glyphs (e.g. "Healthy
    // Teeth" renders as "Healthy Fockl"), distorted faces, and ignores spatial
    // constraints like our safe-zone directive. Every format that runs through
    // Ultra-Pro has rendered text (headline, tagline, date, venue). Auto-promote
    // `low` → `medium` so output is usable; log prominently so billing surprise
    // is auditable. Users who genuinely want cheap abstract output should use
    // Gemini (Nano Banana) which handles text differently.
    let effectiveQuality: 'low' | 'medium' | 'high' = imageQuality ?? 'high'
    if (effectiveQuality === 'low') {
      console.warn(
        '[OpenAI Pipeline] ⚠️ quality=low auto-promoted to medium — gpt-image-1 at `low` produces garbled text, distorted anatomy, and ignores placement constraints. Every Ultra-Pro format (event_poster, flyer, certificate, etc.) renders text, so `low` is a foot-gun. If you need cheap abstract backgrounds, use Gemini.'
      )
      effectiveQuality = 'medium'
    }

    // ── Provider guard: this route ONLY handles OpenAI ───────────────────────
    if (provider !== 'openai') {
      return NextResponse.json(
        {
          error: `This endpoint only handles provider='openai' (got '${provider}'). Use /api/generate for Gemini/Ideogram.`,
        },
        { status: 400 }
      )
    }
    if (!OPENAI_MODEL_CAPABILITIES[model]) {
      return NextResponse.json(
        {
          error: `Unsupported OpenAI model: ${model}. Supported: ${Object.keys(OPENAI_MODEL_CAPABILITIES).join(', ')}.`,
        },
        { status: 400 }
      )
    }

    // ── Permission check (mirrors /api/generate:350-392) ─────────────────────
    const isSuperAdmin = (user as { is_super_admin?: boolean }).is_super_admin === true
    if (!isSuperAdmin) {
      const { data: membership, error: membershipError } = await supabase
        .from('organization_members')
        .select('role')
        .eq('user_id', user.id)
        .eq('organization_id', organizationId)
        .single()

      if (membershipError || !membership) {
        return NextResponse.json(
          {
            error: 'You do not have access to this organization',
            code: 'NO_ORG_MEMBERSHIP',
            hint: 'Please refresh the page or switch to a valid organization in settings',
          },
          { status: 403 }
        )
      }
      if (membership.role === 'viewer') {
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

    // ── Format validation ────────────────────────────────────────────────────
    if (!formatId && !customDimensions) {
      return NextResponse.json(
        {
          error: 'Format selection required',
          code: 'FORMAT_REQUIRED',
          message: 'Please select a creative format or specify custom dimensions before generating.',
        },
        { status: 400 }
      )
    }

    const selectedFormat = formatId ? getFormatById(formatId) : null
    if (formatId && !selectedFormat) {
      return NextResponse.json({ error: `Unknown format: ${formatId}` }, { status: 400 })
    }
    if (selectedFormat && !isCompatibleWithOpenAI(selectedFormat)) {
      return NextResponse.json(
        {
          error: `Format "${selectedFormat.label}" is not compatible with gpt-image-1 (no native size mapping).`,
          code: 'FORMAT_INCOMPATIBLE_OPENAI',
          hint: 'Use a format with a standard aspect ratio (1:1, 2:3, 3:2) or switch to Gemini.',
        },
        { status: 400 }
      )
    }

    const formatDimensions =
      customDimensions ??
      (selectedFormat ? { width: selectedFormat.width, height: selectedFormat.height } : null)

    // ── Brand config + color resolution (mirrors /api/generate:449-507) ──────
    const colorConfig = designData?.colorConfig || null

    const { data: orgData } = await supabase
      .from('organizations')
      .select('name, brand_config')
      .eq('id', organizationId)
      .single()

    const brandConfig = (orgData?.brand_config || null) as {
      fontPrimary?: string
      fontSecondary?: string
      primaryColor?: string
      secondaryColor?: string
      accentColor?: string
    } | null
    const fontPreference = brandConfig?.fontPrimary || undefined

    const resolvedColors = resolveColorConfig(colorConfig, brandConfig || undefined)

    if (!isValidHex(resolvedColors.primaryColor)) {
      return NextResponse.json(
        { error: 'Invalid color configuration: Primary color must be a valid hex code' },
        { status: 400 }
      )
    }
    if (!isValidHex(resolvedColors.secondaryColor)) {
      return NextResponse.json(
        { error: 'Invalid color configuration: Secondary color must be a valid hex code' },
        { status: 400 }
      )
    }

    console.log('[OpenAI Pipeline] Resolved colors:', {
      primary: resolvedColors.primaryColor,
      secondary: resolvedColors.secondaryColor,
      source: resolvedColors.source,
    })

    // ── Usage tracker ────────────────────────────────────────────────────────
    const usageTracker = createUsageTracker({ organizationId, userId: user.id })

    // ── Shared stages (same Claude-based services the Gemini route uses) ─────
    // Strip design-metadata fields (theme/style/backgroundStyle/...) so gpt-image-1
    // doesn't paint them as visible text on the poster.
    const cleanUserFormData = sanitizeUserFormDataForOpenAI(userFormData)

    const speakerPhotoEnabled = designData?.customization?.speakerPhoto?.enabled ?? false
    const compiledData = compileFormData(
      cleanUserFormData,
      formatId,
      designData,
      language || 'en',
      speakerPhotoEnabled,
      enhanced4RowStrip
    )

    console.log('[OpenAI Pipeline] === COMPILED FORM DATA ===')
    console.log('[OpenAI Pipeline]\n' + summarizeCompiledData(compiledData))

    const eventName = (cleanUserFormData?.eventName as string) || compiledData.eventName || ''

    const speakers: Array<{ name: string; designation?: string }> = []
    if (Array.isArray(cleanUserFormData?.speakers)) {
      for (const s of cleanUserFormData.speakers as Array<{ name?: string; designation?: string }>) {
        if (s.name?.trim()) {
          speakers.push({ name: s.name.trim(), designation: s.designation?.trim() || undefined })
        }
      }
    }
    if (speakers.length === 0 && compiledData.speakerName) {
      speakers.push({
        name: compiledData.speakerName,
        designation: compiledData.speakerDesignation ?? undefined,
      })
    }

    // Stage 1: Event Understanding
    let eventProfile: EventProfile | null = null
    if (formatId && shouldUseEventUnderstanding(formatId, eventName)) {
      console.log('[OpenAI Pipeline] === STAGE 1: EVENT UNDERSTANDING ===')
      try {
        eventProfile = await generateEventUnderstanding(
          {
            eventName,
            description:
              [compiledData.tagline, compiledData.description].filter(Boolean).join('. ') ||
              undefined,
            venue: compiledData.venue ?? undefined,
            eventType:
              (cleanUserFormData?.eventType as string) || compiledData.eventType || undefined,
            speakers: speakers.length > 0 ? speakers : undefined,
            organizationContext: {
              name: compiledData.organizationName || orgData?.name || 'Yi Creatives',
              industry: 'Business Leadership',
              brandPersonality: designData?.theme || 'professional',
            },
          },
          { userId: user.id, organizationId, temperature: 1.0 }
        )
      } catch (err) {
        console.error('[OpenAI Pipeline] Event Understanding failed — using fallback', err)
        eventProfile = generateFallbackEventProfile({
          eventName,
          description: compiledData.description || undefined,
          venue: compiledData.venue ?? undefined,
          eventType:
            (userFormData?.eventType as string) || compiledData.eventType || undefined,
        })
      }
    }

    // Stage 1.5: Typography Intelligence
    let typographyProfile: TypographyProfile | null = null
    if (formatId && shouldUseTypographyIntelligence(formatId, eventProfile !== null)) {
      console.log('[OpenAI Pipeline] === STAGE 1.5: TYPOGRAPHY INTELLIGENCE ===')
      try {
        typographyProfile = await generateTypographyIntelligence(
          {
            eventName,
            eventProfile,
            formatId,
            formality: eventProfile?.formality,
            energyLevel: eventProfile?.energyLevel,
            emotionalTone: eventProfile?.emotionalTone,
            brandFont: designData?.typography
              ? {
                  headline: designData.typography.headingFont,
                  body: designData.typography.bodyFont,
                }
              : undefined,
            language: (language as 'en' | 'ta' | 'hi') || 'en',
          },
          { userId: user.id, organizationId, temperature: 0.8 }
        )
      } catch (err) {
        console.error('[OpenAI Pipeline] Typography Intelligence failed — using fallback', err)
        typographyProfile = generateFallbackTypography({
          eventName,
          eventProfile,
          formatId,
          formality: eventProfile?.formality,
          energyLevel: eventProfile?.energyLevel,
          emotionalTone: eventProfile?.emotionalTone,
        })
      }
    }

    // Logo awareness
    const logoAwarenessContext = buildLogoAwarenessContext(
      logosPlacements as LogoPlacement[] | undefined
    )
    if (logoAwarenessContext.hasLogos) {
      console.log('[OpenAI Pipeline] Logo placements:', buildLogoSummary(logosPlacements as LogoPlacement[]))
    } else {
      console.log('[OpenAI Pipeline] No logos provided — skipping logo overlay and safe-zone guidance')
    }

    // Stage 0.5: Design Intelligence
    console.log('[OpenAI Pipeline] === STAGE 0.5: DESIGN INTELLIGENCE ===')
    const formatTemplate = formatId ? getTemplateForFormat(formatId) : null
    const speakerPhotoConfig = designData?.customization?.speakerPhoto
    const layoutConfig = designData?.customization?.layout

    const designBrief: DesignBrief = {
      eventType: (cleanUserFormData?.eventType as string) || compiledData.eventType || undefined,
      eventName: compiledData.eventName || 'Event',
      organizationName: orgData?.name || compiledData.organizationName || 'Yi Creatives',
      details:
        [compiledData.tagline, compiledData.description].filter(Boolean).join('. ') ||
        (prompt as string) ||
        '',
      theme: designData?.theme,
      style: designData?.style,
      guestName: compiledData.speakerName ?? undefined,
      guestDesignation: compiledData.speakerDesignation ?? undefined,
      venue: compiledData.venue ?? undefined,
      additionalContext: compiledData.tagline || compiledData.description || '',
      brandContext: {
        organizationName: orgData?.name || compiledData.organizationName || 'Organization',
        primaryColor: resolvedColors.primaryColor,
        secondaryColor: resolvedColors.secondaryColor,
        accentColor: resolvedColors.accentColor,
        fontPreference,
        useBrandColors: colorConfig?.useBrandColors ?? false,
        useBrandFont: colorConfig?.useBrandFont ?? true,
        colorSource: resolvedColors.source as NonNullable<DesignBrief['brandContext']>['colorSource'],
      },
      formatId,
      formatName: selectedFormat?.label,
      formatCategory: formatTemplate?.basePattern,
      formatGuidance: formatTemplate?.promptTemplate?.substring(0, 300),
      hasSpeakerPhoto: speakerPhotoConfig?.enabled ?? false,
      speakerPhotoPosition: speakerPhotoConfig?.position,
      speakerPhotoShape: speakerPhotoConfig?.shape,
      speakerPhotoSize: speakerPhotoConfig?.size as DesignBrief['speakerPhotoSize'],
      hasHeaderLogo: (layoutConfig?.headerHeight ?? 0) > 0,
      headerHeight: layoutConfig?.headerHeight,
      hasFooterLogo: (layoutConfig?.footerHeight ?? 0) > 0,
      footerHeight: layoutConfig?.footerHeight,
      logoSafeZoneGuidance: logoAwarenessContext.layoutGuidance || undefined,
      targetAudience: compiledData.targetAudience || undefined,
      additionalVisualBrief: compiledData.visualDirection || undefined,
    }

    // v48.0: Background style → inject DI hint into the brief BEFORE Design Intelligence runs.
    // Mirrors the Gemini pattern at app/api/generate/route.ts:1218-1228.
    // The raw `backgroundStyle` id is already stripped from `userFormData` by
    // sanitizeUserFormDataForOpenAI so gpt-image-1 doesn't paint it as visible text.
    // The hint is interpreted by Claude in Design Intelligence — never reaches gpt-image-1
    // directly — so the style guidance lands on composition without leaking as text.
    if (backgroundStyle && backgroundStyle !== 'scene' && !designBrief.additionalVisualBrief) {
      const hint = getBackgroundStyleHint(backgroundStyle)
      if (hint) {
        designBrief.additionalVisualBrief = hint
        console.log(`[OpenAI Pipeline] Background style: ${backgroundStyle} → applying DI hint`)
      }
    }

    const designContextResult = await generateDesignContextSafe(
      designBrief,
      resolvedColors,
      eventProfile,
      undefined,
      null
    )
    const designContext = sanitizeDesignContext(designContextResult.context)

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
          promptLength: (prompt || '').length,
        }
      )
    }

    // Stage 2: Ultra-Pro Prompt (Claude)
    console.log('[OpenAI Pipeline] === STAGE 2: ULTRA-PRO PROMPT ===')
    const dualStripeMode = (logoStripMode?.enabled || false) && !!verticalSlug
    const ultraProResult = await generateUltraProPromptSafe(
      compiledData,
      'claude',
      designContext,
      logoStripMode?.enabled || false,
      resolvedColors,
      dualStripeMode,
      undefined,   // promptStyleOptions — not yet wired in OpenAI route
      undefined,   // recentOrgPrompts — not yet wired in OpenAI route
      'openai',    // v44.0: targetProvider — activates the gpt-image-1 override block that nullifies Gemini's 40–83% zone rules
    )
    const ultraProPrompt = ultraProResult.prompt

    if (ultraProResult.usage.model !== 'fallback' && ultraProResult.usage.model !== 'cached') {
      await usageTracker.track(
        'design_intelligence',
        ultraProResult.usage.provider as AIProvider,
        ultraProResult.usage.model,
        {
          inputTokens: ultraProResult.usage.tokenUsage.inputTokens,
          outputTokens: ultraProResult.usage.tokenUsage.outputTokens,
          cachedTokens: ultraProResult.usage.tokenUsage.cachedTokens,
          durationMs: ultraProResult.usage.durationMs,
          promptLength: 0,
        }
      )
    }

    // Stage 3: Build OpenAI prompt
    if (!selectedFormat) {
      return NextResponse.json(
        { error: 'Format required for OpenAI generation', code: 'FORMAT_REQUIRED' },
        { status: 400 }
      )
    }

    const openAIPromptText = buildOpenAIPrompt({
      ultraProPrompt,
      designContext,
      compiledData,
      format: selectedFormat,
      logoConfig: {
        hasLogo: logoAwarenessContext.hasLogos,
        positions: logoAwarenessContext.activeLogos.map((l) => l.position),
      },
      imageQuality: effectiveQuality,
      // v48.1: pass user's background style for the medium-first STYLE block.
      backgroundStyle,
      // v48.2: pass resolved brand colors so the COLORS section anchors hex
      // values prominently (per OpenAI guide — concrete palette > abstract mood).
      brandColors: {
        primary: resolvedColors.primaryColor,
        secondary: resolvedColors.secondaryColor,
        accent: resolvedColors.accentColor,
      },
    })

    console.log(
      `[OpenAI Pipeline] Compact prompt: ${openAIPromptText.length} chars (~${Math.round(openAIPromptText.length / 4)} tokens) — target: 700-1200 chars`
    )

    if (typographyProfile) {
      console.log(
        `[OpenAI Pipeline] Typography: ${typographyProfile.headline.characteristics.style}/${typographyProfile.body.characteristics.style} (confidence ${typographyProfile.confidence})`
      )
    }

    // Stage 4: Hardened image generation
    const genResult = await generateWithOpenAI({
      prompt: openAIPromptText,
      format: selectedFormat,
      quality: effectiveQuality,
      modelId: model,
      signal: request.signal,
    })

    // Stage 5: Post-processing
    if (designData?.customization?.speakerPhoto?.enabled) {
      console.warn(
        '[OpenAI Pipeline] speakerPhoto overlay is NOT yet supported in the OpenAI pipeline — ignoring. Follow-up needed.'
      )
    }

    // v25.0 alignment with Gemini route (app/api/generate/route.ts:2500-2525):
    //   - config absent            → legacy: overlay individual logos
    //   - config present, enabled  → 4-row strip handles logos (not yet supported in OpenAI pipeline)
    //   - config present, disabled → USER EXPLICITLY TURNED OFF — skip all logo overlays
    const hasEnhanced4RowConfig = enhanced4RowStrip !== undefined
    const stripExplicitlyDisabled = hasEnhanced4RowConfig && !enhanced4RowStrip?.enabled
    const shouldOverlayLogos =
      !!logosPlacements && logosPlacements.length > 0 && !hasEnhanced4RowConfig

    if (stripExplicitlyDisabled) {
      console.log('[OpenAI Pipeline] Logo Strip toggle OFF — skipping all logo overlays')
    } else if (enhanced4RowStrip?.enabled) {
      console.warn(
        '[OpenAI Pipeline] enhanced4RowStrip is NOT yet supported in the OpenAI pipeline — no logos will be rendered. Follow-up needed.'
      )
    }

    const { finalImageUrl, thumbnailUrl } = await applyMinimumPostProcessing({
      imageBase64: genResult.imageBase64,
      formatDimensions,
      logoPlacements: shouldOverlayLogos ? logosPlacements : undefined,
      logoBackgroundColor,
      logoStripMode,
      // gpt-image-1 fills the top of the image with scene content, which swallows
      // the transparent logo bars used for Gemini output. Force a solid header
      // strip so the logos sit on a readable band — only when we're actually overlaying.
      forceSolidLogoStrip: shouldOverlayLogos,
      stripShape: (designData as { stripShape?: string } | null | undefined)?.stripShape,
      organizationId,
      supabase,
    })

    // Stage 6: Track image-generation usage
    const estimatedInputTokens = Math.ceil(openAIPromptText.length / 4)
    await usageTracker.track('image_generation', 'openai' as AIProvider, genResult.actualModel, {
      inputTokens: estimatedInputTokens,
      outputTokens: 0,
      imageCount: 1,
      durationMs: genResult.durationMs,
      promptLength: openAIPromptText.length,
      resolution: '1K',
      imageQuality: effectiveQuality,
    })

    // Stage 7: Build response (identical shape to /api/generate)
    const costSummary = usageTracker.getSummary()
    const stages = costSummary.records.map((r) => ({
      stage: r.requestType,
      provider: r.provider,
      model: r.model,
      inputTokens: r.inputTokens,
      outputTokens: r.outputTokens,
      cachedTokens: r.cachedTokens || 0,
      imageCount: r.imageCount || 0,
      costUsd: r.estimatedCostUsd,
      costInr: convertToINR(r.estimatedCostUsd),
      durationMs: r.durationMs || 0,
    }))

    const totalRouteMs = Date.now() - routeStartMs
    console.log('[OpenAI Pipeline] === API USAGE SUMMARY ===')
    console.log(
      `[OpenAI Pipeline] Total Cost: ${costSummary.formatted.usd} | ${costSummary.formatted.inr}`
    )
    console.log(`[OpenAI Pipeline] Total Input Tokens:  ${costSummary.totalInputTokens}`)
    console.log(`[OpenAI Pipeline] Total Output Tokens: ${costSummary.totalOutputTokens}`)
    console.log(`[OpenAI Pipeline] Request Count:       ${costSummary.requestCount}`)
    console.log('[OpenAI Pipeline] Stage breakdown:')
    for (const s of stages) {
      const inr = s.costInr.toFixed(2)
      const usd = s.costUsd.toFixed(4)
      const imgPart = s.imageCount > 0 ? `, ${s.imageCount} image(s)` : ''
      console.log(
        `[OpenAI Pipeline]   • ${s.stage} (${s.provider}/${s.model}): $${usd} | ₹${inr} — ${s.inputTokens} in / ${s.outputTokens} out${imgPart} — ${(s.durationMs / 1000).toFixed(1)}s`
      )
    }
    console.log(
      `[OpenAI Pipeline] ✅ Total route time ${(totalRouteMs / 1000).toFixed(1)}s — ${costSummary.formatted.usd} | ${costSummary.formatted.inr}`
    )

    return NextResponse.json({
      success: true,
      imageUrl: finalImageUrl,
      thumbnailUrl,
      promptUsed: openAIPromptText.slice(0, 3000),
      preventionActionId: undefined,
      preventionHoldout: false,
      preventionApplied: false,
      usage: {
        costUsd: costSummary.totalCostUsd,
        costInr: costSummary.totalCostInr,
        formatted: costSummary.formatted,
        inputTokens: costSummary.totalInputTokens,
        outputTokens: costSummary.totalOutputTokens,
        requestCount: costSummary.requestCount,
        stages,
      },
      colorVerification: null,
    })
  } catch (error) {
    const durationMs = Date.now() - routeStartMs
    console.error(
      `[OpenAI Pipeline] ✗ Route failed after ${(durationMs / 1000).toFixed(1)}s`,
      error
    )

    if (error instanceof OpenAITimeoutError) {
      return NextResponse.json(
        { error: error.message, code: 'OPENAI_TIMEOUT' },
        { status: 504 }
      )
    }
    if (error instanceof OpenAIConfigurationError) {
      return NextResponse.json(
        { error: error.message, code: 'OPENAI_CONFIG' },
        { status: 500 }
      )
    }

    const message = error instanceof Error ? error.message : 'Generation failed'
    if (
      message.includes('429') ||
      message.toLowerCase().includes('too many requests') ||
      message.toLowerCase().includes('quota') ||
      message.toLowerCase().includes('billing_hard_limit_reached')
    ) {
      return NextResponse.json(
        {
          error:
            'OpenAI rate limit or billing limit reached. Please wait, top up your OpenAI account, or try again later.',
        },
        { status: 429 }
      )
    }

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
