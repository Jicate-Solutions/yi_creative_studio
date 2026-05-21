/**
 * OpenAI Prompt Builder — Compact Mode (v48.2)
 *
 * Produces a tight, ChatGPT-style prompt for gpt-image-1 in the format
 * OpenAI's own prompting guide recommends:
 *
 *   SUBJECT → STYLE → LAYOUT → COLORS → TEXT → DO NOT
 *
 * Why compact: research from OpenAI's cookbook + community shows
 * gpt-image-1 was trained on prompts of ~150 words / ~200 tokens. Long,
 * dense prompts (we previously sent ~1,250 tokens across 9 sections)
 * dilute critical constraints because the model's attention degrades
 * over length and competing sections fight for priority. ChatGPT's
 * internal rewriter produces SHORT structured prompts and that's why
 * its outputs look polished.
 *
 *   Old format: ~5,000 chars / ~1,250 tokens, 9 dense sections
 *   New format: ~700-1,200 chars / ~200-300 tokens, 6 labeled segments
 *
 * Every constraint is preserved — safe-zone, text rendering, style
 * assertion, brand colors, logo zones, exclusions — just compressed
 * into the structure gpt-image-1 expects.
 *
 * IMPORTANT: This is OpenAI-only. Gemini's pipeline is untouched.
 *
 * References:
 *   • https://developers.openai.com/cookbook/examples/multimodal/image-gen-1.5-prompting_guide
 *   • https://developers.openai.com/cookbook/examples/multimodal/image-gen-models-prompting-guide
 */

import type { UltraProPrompt } from '../ultra-pro-prompt'
import type { DesignContextForPrompt, BackgroundStyleId } from '../yi-prompt-builder/types'
import type { CompiledFormData } from '../form-data-compiler'
import type { CreativeFormat } from '@/lib/config/creative-formats'
import { getOpenAIStyleBlock } from './style-translator'

export type GptImageSize = '1024x1024' | '1024x1536' | '1536x1024'

export interface OpenAIPromptInput {
  ultraProPrompt: UltraProPrompt
  designContext: DesignContextForPrompt | null
  compiledData: CompiledFormData
  format: CreativeFormat
  logoConfig: {
    hasLogo: boolean
    positions: string[]
    barHeight?: number
  }
  imageQuality: 'low' | 'medium' | 'high'
  /** v48.1: User's background style for medium-first STYLE assertion. */
  backgroundStyle?: BackgroundStyleId | string
  /** v48.2: Brand colors for COLORS section hex anchoring. */
  brandColors?: {
    primary: string
    secondary: string
    accent?: string
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getOrientationLabel(size: GptImageSize): string {
  if (size === '1024x1024') return 'square'
  if (size === '1024x1536') return 'portrait'
  return 'landscape'
}

/**
 * Compute the post-crop safe band on the source canvas. Returns null when
 * the aspect drift is negligible (no meaningful crop).
 */
interface SafeZone {
  cropPctPerSide: number
  cropSide: 'top and bottom' | 'left and right'
  axis: 'y' | 'x'
  safeMin: number
  safeMax: number
}
function computeSafeZone(format: CreativeFormat, gptSize: GptImageSize): SafeZone | null {
  const [gw, gh] = gptSize.split('x').map(Number)
  const sourceAR = gw / gh
  const targetAR = format.width / format.height
  const drift = Math.abs(sourceAR - targetAR) / targetAR
  if (drift <= 0.03) return null

  const sourceIsTaller = sourceAR < targetAR
  const sourcePxCrop = Math.round(sourceIsTaller ? (gh * drift) / 2 : (gw * drift) / 2)
  const safeMaxDim = sourceIsTaller ? gh : gw

  return {
    cropPctPerSide: Math.round((drift * 100) / 2),
    cropSide: sourceIsTaller ? 'top and bottom' : 'left and right',
    axis: sourceIsTaller ? 'y' : 'x',
    safeMin: sourcePxCrop,
    safeMax: safeMaxDim - sourcePxCrop,
  }
}

/**
 * SUBJECT — the scene description.
 *
 * Prefer Ultra-Pro's `visualScene` field (a tight scene-only description
 * built for image gen) over `enhancedPrompt` (which is the bloated
 * combined prompt with placement hints and meta-instructions baked in).
 */
function buildSubjectLine(ultraProPrompt: UltraProPrompt): string {
  const scene = ultraProPrompt.visualScene?.trim() || ultraProPrompt.enhancedPrompt?.trim() || ''
  return `SUBJECT: ${scene}`
}

/**
 * LAYOUT — orientation + safe-zone + logo corner protection on one or two
 * lines. Replaces the old 8-line buildSafeZoneDirective block.
 */
function buildLayoutLine(
  format: CreativeFormat,
  gptSize: GptImageSize,
  safeZone: SafeZone | null,
  logoConfig: OpenAIPromptInput['logoConfig']
): string {
  const orient = getOrientationLabel(gptSize)
  const parts: string[] = [`${orient} ${gptSize} canvas`]

  if (safeZone) {
    // Concrete pixel coords + "will be cropped" cue, in ONE sentence.
    parts.push(
      `output cropped ~${safeZone.cropPctPerSide}% off the ${safeZone.cropSide} to ${format.width}×${format.height} — keep ALL text, faces and key elements inside ${safeZone.axis}=[${safeZone.safeMin}, ${safeZone.safeMax}]`
    )
  }

  if (logoConfig.hasLogo && logoConfig.positions.length > 0) {
    const corners = logoConfig.positions
      .map((p) => p.replace('-', ' '))
      .join(', ')
    parts.push(`leave the ${corners} clear — logo overlays add later`)
  }

  parts.push('headline largest, supporting details smaller, strong contrast against background')

  return `LAYOUT: ${parts.join('; ')}.`
}

/**
 * COLORS — brand hex anchoring as a single line.
 */
function buildColorsLine(brandColors: NonNullable<OpenAIPromptInput['brandColors']>): string {
  const parts = [`primary ${brandColors.primary}`, `secondary ${brandColors.secondary}`]
  if (brandColors.accent && brandColors.accent !== brandColors.primary) {
    parts.push(`accent ${brandColors.accent}`)
  }
  return `COLORS: brand palette — ${parts.join(', ')}. Use these exact hex values; do not substitute alternatives.`
}

/**
 * TEXT TO RENDER — bulleted list of exact strings, no verbose wrapper.
 */
function buildTextRenderingBlock(
  compiledData: CompiledFormData,
  ultraProPrompt: UltraProPrompt
): string {
  const items: string[] = []

  if (ultraProPrompt.primaryText?.trim()) {
    items.push(`HEADLINE: "${ultraProPrompt.primaryText.trim()}"`)
  }
  if (compiledData.tagline?.trim()) {
    items.push(`TAGLINE: "${compiledData.tagline.trim()}"`)
  }

  const dateTimeParts: string[] = []
  if (compiledData.date?.trim()) dateTimeParts.push(compiledData.date.trim())
  const timeRange = [compiledData.time?.trim(), compiledData.endTime?.trim()]
    .filter(Boolean)
    .join(' – ')
  if (timeRange) dateTimeParts.push(timeRange)
  if (dateTimeParts.length > 0) {
    items.push(`DATE & TIME: "${dateTimeParts.join(' | ')}"`)
  }

  if (compiledData.venue?.trim()) {
    items.push(`VENUE: "${compiledData.venue.trim()}"`)
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
    items.push(`SPEAKER(S): "${speakerLines.join('; ')}"`)
  }

  if (items.length === 0) return ''

  return [
    'TEXT TO RENDER (verbatim, exact spelling):',
    ...items.map((line) => `• ${line}`),
  ].join('\n')
}

// ─── Main builder ─────────────────────────────────────────────────────────────

/**
 * Builds the compact gpt-image-1 prompt. Six labeled segments, each tight.
 * Total length target: ~700-1,200 chars (200-300 tokens).
 */
export function buildOpenAIPrompt(input: OpenAIPromptInput): string {
  const {
    ultraProPrompt,
    compiledData,
    format,
    logoConfig,
    backgroundStyle,
    brandColors,
  } = input
  const gptSize = (format.gptImageSize ?? '1024x1024') as GptImageSize
  const safeZone = computeSafeZone(format, gptSize)

  const sections: string[] = []

  // 1. SUBJECT — scene description (Ultra-Pro visualScene field).
  sections.push(buildSubjectLine(ultraProPrompt))

  // 2. STYLE — medium-first assertion per backgroundStyle. Skipped for
  //    'scene' (default — let the SUBJECT define the medium implicitly).
  const styleBlock = getOpenAIStyleBlock(backgroundStyle)
  if (styleBlock) sections.push(styleBlock)

  // 3. LAYOUT — orientation + safe-zone + logo corners on one line.
  sections.push(buildLayoutLine(format, gptSize, safeZone, logoConfig))

  // 4. COLORS — brand hex anchoring (when provided by route).
  if (brandColors) {
    sections.push(buildColorsLine(brandColors))
  }

  // 5. TEXT TO RENDER — exact strings, bulleted.
  const textBlock = buildTextRenderingBlock(compiledData, ultraProPrompt)
  if (textBlock) sections.push(textBlock)

  // 6. DO NOT — explicit exclusions (per OpenAI guide: "no watermarks,
  //    no extra text" suppresses common hallucinations).
  sections.push(
    'DO NOT: render any text other than the strings listed above. No watermarks, no extra captions, no fake logos, no decorative letters. No date stamps, page numbers, or signature marks.'
  )

  return sections.join('\n\n')
}

// ─── Format compatibility helpers (unchanged) ────────────────────────────────

/** Returns true if this format can be generated by GPT-image-1. */
export function isCompatibleWithOpenAI(format: CreativeFormat): boolean {
  return format.gptImageSize != null
}

/** Returns the GPT-image-1 native size for a format. */
export function getGptImageSize(format: CreativeFormat): GptImageSize {
  if (!format.gptImageSize) {
    throw new Error(`Format "${format.id}" is not compatible with GPT-image-1`)
  }
  return format.gptImageSize as GptImageSize
}
