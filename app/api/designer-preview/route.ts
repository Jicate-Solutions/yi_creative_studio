/**
 * POST /api/designer-preview
 *
 * Pre-generation "AI understood this" endpoint. Accepts the SAME form payload as
 * /api/generate-designer and runs ONLY the deterministic Designer Pipeline
 * (buildDesignerPipeline). It does NOT call the Claude Director, does NOT call
 * Gemini/Nano-Banana, and does NOT generate an image — so it is fast and costs
 * nothing (no LLM / no image tokens).
 *
 * It lets the user CONFIRM how the AI interpreted their brief — including their own
 * `userVisualIdea` / `creativeDirection` — before spending a generation, and edit
 * the form/idea if the interpretation is wrong.
 *
 * Returns: { success, bridge, designIntent, colorPlan, layoutPlan, stylePlan,
 *            userFacingSummary, designerUnderstanding }.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { compileFormData } from '@/lib/prompts/services/form-data-compiler'
import { resolveColorConfig, isValidHex } from '@/lib/utils/resolve-color-config'
import {
  buildDesignerPipeline,
  type StyleIntent,
  type StyleRecipeId,
} from '@/lib/designer-pipeline'
import type { CreativeFormatId } from '@/lib/config/creative-formats'
import type { DesignData } from '@/lib/config/design-constants'

export const runtime = 'nodejs'

/**
 * Detect aborted/disconnected requests. The preview is fired on a debounce as the
 * user types, so the client routinely cancels in-flight requests (AbortController)
 * or the socket resets (ECONNRESET). These are normal, not errors — recognise them
 * so we can log quietly instead of spamming scary stack traces.
 */
function isAbortLike(error: unknown): boolean {
  if (!error) return false
  const name = (error as { name?: string }).name
  if (name === 'AbortError') return true
  const code = (error as { code?: string }).code
  if (code === 'ECONNRESET' || code === 'ABORT_ERR') return true
  const message = error instanceof Error ? error.message : String(error)
  return /\baborted\b|ECONNRESET/i.test(message)
}

/** Map a chosen background style to the pipeline's high-level style intent. */
function styleIntentFromBackground(backgroundStyle?: string): StyleIntent {
  if (backgroundStyle === 'advertising') return 'advertising'
  if (backgroundStyle === 'spotlight-event') return 'institutional'
  return 'auto'
}

/**
 * Collect natural colour requests: the raw custom-colour values the hex validator
 * rejected (e.g. "Magenta", "Gold gradient") plus any explicit colour fields.
 */
function readColorRequests(
  userFormData: Record<string, unknown> | undefined,
  colorConfig: { customColors?: { primary?: string; secondary?: string; accent?: string } | null } | null | undefined
): string[] {
  const out: string[] = []
  const cc = colorConfig?.customColors
  if (cc) {
    for (const v of [cc.primary, cc.secondary, cc.accent]) {
      if (typeof v === 'string' && v.trim() && !isValidHex(v.trim())) out.push(v.trim())
    }
  }
  const fd = userFormData || {}
  for (const k of ['colorRequests', 'colourRequests', 'colors', 'colours', 'colorWords', 'palette']) {
    const v = fd[k]
    if (typeof v === 'string' && v.trim()) out.push(v.trim())
    else if (Array.isArray(v)) out.push(...v.filter((x): x is string => typeof x === 'string' && !!x.trim()))
  }
  return out
}

/** Read the user's free-text visual idea from any of the accepted field names. */
function readUserVisualIdea(
  userFormData: Record<string, unknown> | undefined,
  compiledVisualDirection: string | null
): string | undefined {
  const fd = userFormData || {}
  const keys = ['userVisualIdea', 'creativeDirection', 'visualDirection', 'visualIdea', 'idea']
  for (const k of keys) {
    const v = fd[k]
    if (typeof v === 'string' && v.trim()) return v.trim()
  }
  return compiledVisualDirection?.trim() || undefined
}

export async function POST(request: NextRequest) {
  try {
    // Auth (cheap — no LLM/image work happens regardless).
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Guard the body parse — the preview is fired on a debounce as the user types,
    // so we routinely receive empty bodies (no-op debounce) and aborted requests.
    let rawBody: string
    try {
      rawBody = await request.text()
    } catch (readError) {
      // Aborted reads (debounce cancel / client disconnect) are expected — stay quiet.
      if (isAbortLike(readError)) {
        console.log('[designer-preview] request aborted (debounce) — ignored')
        return NextResponse.json({ aborted: true })
      }
      throw readError
    }

    if (!rawBody || !rawBody.trim()) {
      return NextResponse.json({ error: 'Empty request body' }, { status: 400 })
    }

    let body: Record<string, unknown>
    try {
      body = JSON.parse(rawBody) as Record<string, unknown>
    } catch {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
    }

    const {
      designData,
      formatId,
      language,
      userFormData,
      backgroundStyle,
      customDimensions,
      styleRecipe,
      styleStack,
    } = body as {
      designData?: DesignData | null
      formatId?: CreativeFormatId
      language?: 'en' | 'ta' | 'hi'
      userFormData?: Record<string, unknown>
      backgroundStyle?: string
      customDimensions?: { width: number; height: number } | null
      requestedHighContrast?: boolean
      styleRecipe?: StyleRecipeId | 'auto'
      styleStack?: string[]
    }

    // Style Blend Engine — the user's ordered style stack (top-level or in form data),
    // with an optional preset name as a fallback quick-start.
    const effectiveStyleStack: string[] = Array.isArray(styleStack)
      ? styleStack
      : Array.isArray(userFormData?.styleStack)
        ? (userFormData!.styleStack as string[])
        : []
    const effectiveStyleRecipe =
      styleRecipe ||
      ((userFormData?.styleRecipe as StyleRecipeId | 'auto' | undefined) ?? 'auto')

    const effectiveFormatId = (formatId as string) || 'event_poster'

    // Same field compilation the generation route uses → identical interpretation.
    const compiledData = compileFormData(
      userFormData,
      formatId,
      designData ?? undefined,
      language || 'en'
    )

    // Resolve colours from the design data (no org DB fetch — keep the preview light).
    const resolvedColors = resolveColorConfig(designData?.colorConfig || null, undefined)

    const userVisualIdea = readUserVisualIdea(userFormData, compiledData.visualDirection)

    const plan = buildDesignerPipeline({
      eventName: compiledData.eventName ?? '',
      description: compiledData.description ?? undefined,
      tagline: compiledData.tagline ?? undefined,
      targetAudience: compiledData.targetAudience ?? undefined,
      organizationName: compiledData.organizationName ?? undefined,
      formatId: effectiveFormatId,
      canvasDimensions: customDimensions ?? undefined,
      brandColors: {
        primary: resolvedColors.primaryColor,
        secondary: resolvedColors.secondaryColor,
        accent: resolvedColors.accentColor,
      },
      backgroundStyle,
      styleIntent: styleIntentFromBackground(backgroundStyle),
      languageHint: language || 'en',
      requestedHighContrast:
        typeof (body as { requestedHighContrast?: boolean }).requestedHighContrast === 'boolean'
          ? (body as { requestedHighContrast?: boolean }).requestedHighContrast
          : undefined,
      userVisualIdea,
      colorRequests: readColorRequests(userFormData, designData?.colorConfig),
      styleBlend: { styleStack: effectiveStyleStack, styleRecipe: effectiveStyleRecipe },
    })

    return NextResponse.json({
      success: true,
      bridge: plan.bridge,
      designIntent: plan.designIntent,
      colorPlan: plan.colorPlan,
      layoutPlan: plan.layoutPlan,
      stylePlan: plan.stylePlan,
      styleBlendPlan: plan.styleBlendPlan,
      creativeDirectives: plan.creativeDirectives,
      // Structured "AI understood this" fields (Hero, motifs, colour, typography,
      // text effects, style mix, rendering mode, will-avoid). May be undefined on
      // older pipeline builds — the UI falls back to userFacingSummary then.
      structuredUnderstanding: plan.structuredUnderstanding,
      userFacingSummary: plan.userFacingSummary,
      // Alias kept identical to /api/generate-designer's response field name so the
      // UI can render the same "AI understood this" card from either source.
      designerUnderstanding: plan.userFacingSummary,
    })
  } catch (error) {
    // Debounce cancels / client disconnects surface here too — keep them quiet.
    if (isAbortLike(error)) {
      console.log('[designer-preview] request aborted (debounce) — ignored')
      return NextResponse.json({ aborted: true }, { status: 204 })
    }
    console.error('[designer-preview] error:', error)
    const message = error instanceof Error ? error.message : 'Preview failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
