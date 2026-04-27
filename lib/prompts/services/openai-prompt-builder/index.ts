/**
 * OpenAI Prompt Builder
 *
 * Builds plain-text prompts optimized for GPT-image-1 (ChatGPT Images 2.0).
 * Unlike Gemini, OpenAI does not use XML instruction tags — all guidance must
 * be written as natural-language directives in a single coherent prompt.
 *
 * Pipeline position: runs AFTER Form Data Compiler → Design Intelligence → Ultra-Pro Prompt
 * Takes the Ultra-Pro prompt output as the creative foundation and appends
 * brand context, composition guidance, and logo placement instructions.
 */

import type { UltraProPrompt } from '../ultra-pro-prompt'
import type { DesignContextForPrompt } from '../yi-prompt-builder/types'
import type { CompiledFormData } from '../form-data-compiler'
import type { CreativeFormat } from '@/lib/config/creative-formats'

export type GptImageSize = '1024x1024' | '1024x1536' | '1536x1024'

export interface OpenAIPromptInput {
  ultraProPrompt: UltraProPrompt
  designContext: DesignContextForPrompt | null
  compiledData: CompiledFormData
  format: CreativeFormat
  logoConfig: {
    hasLogo: boolean
    positions: string[]          // e.g. ['top-left', 'bottom-right']
    barHeight?: number           // pixel height of logo bar areas to keep clear
  }
  imageQuality: 'low' | 'medium' | 'high'
}

// ─── Orientation helper ───────────────────────────────────────────────────────

function getOrientationLabel(size: GptImageSize): string {
  if (size === '1024x1024') return 'square'
  if (size === '1024x1536') return 'portrait (taller than wide)'
  return 'landscape (wider than tall)'
}

// ─── Explicit "must render" text block ───────────────────────────────────────
//
// Ultra-Pro was designed for Gemini's XML-tagged prompts, and its system prompt
// deliberately drops taglines / long descriptions from `secondaryText` so Gemini
// doesn't paint them as text. gpt-image-1 has no such shield — it renders ANY
// text it sees, good or bad — so we build our own list of fields that MUST be
// rendered, in priority order, and hand it to OpenAI alongside the scene.
function buildTextRenderingBlock(
  compiledData: CompiledFormData,
  ultraProPrompt: UltraProPrompt
): string {
  const mustRender: string[] = []

  if (ultraProPrompt.primaryText?.trim()) {
    mustRender.push(`HEADLINE: "${ultraProPrompt.primaryText.trim()}"`)
  }
  if (compiledData.tagline?.trim()) {
    mustRender.push(`TAGLINE (beneath or near the headline): "${compiledData.tagline.trim()}"`)
  }

  const dateTimeParts: string[] = []
  if (compiledData.date?.trim()) dateTimeParts.push(compiledData.date.trim())
  const timeRange = [compiledData.time?.trim(), compiledData.endTime?.trim()]
    .filter(Boolean)
    .join(' - ')
  if (timeRange) dateTimeParts.push(timeRange)
  if (dateTimeParts.length > 0) {
    mustRender.push(`DATE & TIME: "${dateTimeParts.join(' | ')}"`)
  }

  if (compiledData.venue?.trim()) {
    mustRender.push(`VENUE: "${compiledData.venue.trim()}"`)
  }

  const speakerLines: string[] = []
  const multi = compiledData.speakers?.filter((s) => s?.name?.trim()) ?? []
  if (multi.length > 0) {
    for (const s of multi) {
      speakerLines.push(
        s.designation?.trim() ? `${s.name!.trim()}, ${s.designation.trim()}` : s.name!.trim()
      )
    }
  } else if (compiledData.speakerName?.trim()) {
    speakerLines.push(
      compiledData.speakerDesignation?.trim()
        ? `${compiledData.speakerName.trim()}, ${compiledData.speakerDesignation.trim()}`
        : compiledData.speakerName.trim()
    )
  }
  if (speakerLines.length > 0) {
    mustRender.push(`SPEAKER(S): "${speakerLines.join('; ')}"`)
  }

  if (mustRender.length === 0) return ''

  return [
    'TEXT TO RENDER — these exact strings MUST appear as clearly legible, correctly spelled text on the poster. Do NOT paraphrase, translate, shorten, or drop any of them:',
    ...mustRender.map((line) => `• ${line}`),
    'Arrange them in a clear visual hierarchy (headline largest, supporting details smaller) with strong contrast against the background.',
  ].join('\n')
}

// ─── Aspect-ratio crop safe-zone ──────────────────────────────────────────────
//
// gpt-image-1 only outputs 1024x1024 / 1024x1536 / 1536x1024. Our formats
// often use 3:4 or similar, so the post-processor uses `cover` resize and
// crops ~10–15% off the long edge. Without warning, gpt-image-1 places
// headline/date text flush against that edge and it gets chopped.
//
// This directive is placed FIRST in the final prompt (prepended to the
// Ultra-Pro scene) because gpt-image-1 weights earlier tokens more heavily.
// The "PRIMARY CONSTRAINT — OVERRIDES ..." preamble neutralizes any
// percentage-based placement hints that may have leaked from Ultra-Pro's
// Gemini-tuned system prompt (40–83% content zone, text at 42%, etc.).
function buildSafeZoneDirective(
  format: CreativeFormat,
  gptSize: GptImageSize
): string | null {
  const [gw, gh] = gptSize.split('x').map(Number)
  const sourceAR = gw / gh
  const targetAR = format.width / format.height
  const drift = Math.abs(sourceAR - targetAR) / targetAR
  if (drift <= 0.03) return null // negligible — no meaningful crop

  const sourceIsTaller = sourceAR < targetAR
  const cropSide = sourceIsTaller ? 'top and bottom' : 'left and right'
  const cropPctPerSide = Math.round((drift * 100) / 2)

  // Exact pixel safe zone on the SOURCE canvas gpt-image-1 is generating into.
  // gpt-image-1 follows concrete numbers better than fractional shorthand.
  const sourcePxCrop = Math.round(
    sourceIsTaller ? (gh * drift) / 2 : (gw * drift) / 2
  )
  const safeMin = sourcePxCrop
  const safeMaxDim = sourceIsTaller ? gh : gw
  const safeMax = safeMaxDim - sourcePxCrop
  const axis = sourceIsTaller ? 'y (vertical)' : 'x (horizontal)'

  return [
    'PRIMARY CONSTRAINT — OVERRIDES any zone, percentage, or placement guidance that appears later in this prompt:',
    '',
    `CROP SAFE ZONE: This ${gw}x${gh} output will be cropped by ~${cropPctPerSide}% from the ${cropSide} edges during post-processing to fit the final ${format.width}x${format.height} poster canvas.`,
    '',
    `• Anything outside ${axis} = ${safeMin} to ${safeMax} WILL BE ERASED.`,
    `• Imagine a horizontal line across the ${cropSide.split(' and ')[0]} at ${safeMin}px from that edge, and another at ${safeMin}px from the opposite edge — these are the hard crop lines. Every pixel past them is removed.`,
    `• ALL rendered text (headline, tagline, date, time, venue, speaker names), faces, and important visual elements MUST sit fully inside the CENTER ${100 - cropPctPerSide * 2}% safe band (${axis} in [${safeMin}, ${safeMax}]).`,
    `• Leave visible breathing room — do NOT push headline letters flush against the top of the safe band. Aim for at least ${Math.round(safeMaxDim * 0.05)}px margin inside the safe zone.`,
    `• IGNORE any later instruction that places text at specific percentages (e.g. "headline at 42%", "text in the 40–83% band", "top 25% logo bar", "mid-section text zone"). Those are for a different pipeline and do NOT apply here.`,
  ].join('\n')
}

// ─── Logo placement language ──────────────────────────────────────────────────

function buildLogoGuidance(logoConfig: OpenAIPromptInput['logoConfig']): string {
  if (!logoConfig.hasLogo) return ''
  const areas = logoConfig.positions.map((p) => {
    switch (p) {
      case 'top-left':     return 'top-left corner'
      case 'top-right':    return 'top-right corner'
      case 'bottom-left':  return 'bottom-left corner'
      case 'bottom-right': return 'bottom-right corner'
      case 'top-center':   return 'top center'
      case 'bottom-center': return 'bottom center'
      default:             return p
    }
  })
  const areaList = areas.join(' and ')
  return `Keep the ${areaList} of the image uncluttered with a clear, visually neutral area — logo overlays will be added in post-processing. Do not place important design elements or heavy textures in these zones.`
}

// ─── Main builder ─────────────────────────────────────────────────────────────

/**
 * Builds a plain-text prompt for GPT-image-1.
 *
 * The prompt combines:
 * 1. The Ultra-Pro enhanced prompt as the creative scene description
 * 2. Composition and orientation directives for the target format
 * 3. Logo placement guidance (areas to keep clear for post-processing overlays)
 * 4. Brand color and mood context from Design Intelligence
 * 5. A quality statement calibrated to the selected quality tier
 *
 * TODO: Customize the assembly logic below to tune how these sections are
 * weighted and ordered. The `designContext` fields most useful for OpenAI are:
 *   - designContext.moodDirection (overall feel/energy)
 *   - designContext.colorStrategy (palette guidance)
 *   - designContext.designStrategy (visual approach)
 *   - designContext.backgroundSetting (scene or abstract)
 * Adjust the prompt assembly to emphasize what produces the best GPT-image-1 results.
 */
export function buildOpenAIPrompt(input: OpenAIPromptInput): string {
  const { ultraProPrompt, designContext, compiledData, format, logoConfig, imageQuality } = input
  const gptSize = (format.gptImageSize ?? '1024x1024') as GptImageSize
  const orientation = getOrientationLabel(gptSize)

  const sections: string[] = []

  // 1. PRIMARY CONSTRAINT — safe-zone first so it anchors attention and
  //    its "ignore later percentage hints" override lands before any
  //    Gemini-tuned placement language leaks through from Ultra-Pro.
  const safeZone = buildSafeZoneDirective(format, gptSize)
  if (safeZone) sections.push(safeZone)

  // 2. Explicit text rendering list (tagline, full time range, speakers —
  //    fields the Ultra-Pro stage drops because its system prompt was tuned
  //    for Gemini). gpt-image-1 needs every rendered string spelled out.
  const textBlock = buildTextRenderingBlock(compiledData, ultraProPrompt)
  if (textBlock) sections.push(textBlock)

  // 3. Creative scene — Ultra-Pro output. With targetProvider='openai' in
  //    the route, the Ultra-Pro override block has already neutralized the
  //    40–83% zone language, but we still gate this AFTER the safe-zone so
  //    the hard constraint wins on any residual conflict.
  sections.push(ultraProPrompt.enhancedPrompt)

  // 4. Orientation & composition
  sections.push(
    `The image is ${orientation} format. Compose all elements to fit this orientation naturally — headline text "${ultraProPrompt.primaryText}" should be prominently legible.`
  )

  // 5. Logo area protection
  const logoGuidance = buildLogoGuidance(logoConfig)
  if (logoGuidance) sections.push(logoGuidance)

  // 6. Design context — mood, color, background
  if (designContext) {
    const contextLines: string[] = []
    if (designContext.moodDirection) contextLines.push(`Mood: ${designContext.moodDirection}.`)
    if (designContext.colorStrategy) contextLines.push(`Color palette: ${designContext.colorStrategy}.`)
    if (designContext.designStrategy) contextLines.push(`Visual approach: ${designContext.designStrategy}.`)
    if (designContext.backgroundSetting) contextLines.push(`Background: ${designContext.backgroundSetting}.`)
    if (contextLines.length > 0) sections.push(contextLines.join(' '))
  }

  // 7. Quality statement
  const qualityStatement =
    imageQuality === 'high'
      ? 'Ultra-high detail, professional print quality, sharp typography, photorealistic rendering.'
      : imageQuality === 'medium'
      ? 'Professional quality, clean composition, clear typography.'
      : 'Clean composition with clear text placement.'
  sections.push(qualityStatement)

  // 8. Format/use context from compiled data
  if (compiledData.eventType || compiledData.eventName) {
    const context = [compiledData.eventType, compiledData.eventName].filter(Boolean).join(' — ')
    sections.push(`This is for: ${context}.`)
  }

  return sections.join('\n\n')
}

// ─── Format compatibility helper ─────────────────────────────────────────────

/**
 * Returns true if this format can be generated by GPT-image-1.
 * Formats without a gptImageSize (extreme ratios like 4:1, 8:1) are excluded.
 */
export function isCompatibleWithOpenAI(format: CreativeFormat): boolean {
  return format.gptImageSize != null
}

/**
 * Returns the GPT-image-1 native size for a format.
 * Throws if the format is not compatible — call isCompatibleWithOpenAI first.
 */
export function getGptImageSize(format: CreativeFormat): GptImageSize {
  if (!format.gptImageSize) {
    throw new Error(`Format "${format.id}" is not compatible with GPT-image-1`)
  }
  return format.gptImageSize as GptImageSize
}
