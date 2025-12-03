/**
 * Ideogram Prompt Adapter
 * Transforms PromptIntent into Ideogram-optimized prompts
 *
 * ULTRA-PRO DESIGNER approach:
 * - Uses AI-generated design context for PURPOSE-DRIVEN design
 * - Includes RELEVANT visual elements (not generic backgrounds)
 * - Creates CONTEXTUAL imagery based on event type
 *
 * Ideogram 3.0 excels at:
 * - Typography and text rendering
 * - Design-focused imagery
 * - Brand color adherence
 *
 * Ideogram prompts should be:
 * - More concise than Gemini prompts
 * - Focused on visual description
 * - Include explicit text in quotes
 * - Use style_type and magic_prompt settings strategically
 */

import type { PromptIntent, IdeogramPromptOutput, PromptAdapter, IdeogramStyleType, IdeogramMagicPrompt, DesignContext } from '../types'
import type { CreativeTemplate } from '../knowledge-base/types'
import { buildTextListForIdeogram } from '../helpers/text-rendering'
import { getColorDescriptionShort, buildIdeogramColorPalette } from '../helpers/color-narrative'
import { getIdeogramStyleType, getMagicPromptSetting } from '../data/style-treatments'
import { buildCustomizationSummaryShort, getCustomizationNegativePrompts } from '../helpers/customization'
import { buildCompactLanguageInstruction, isRTLLanguage } from '../languageConfigs'

// ============================================================
// NEGATIVE PROMPTS
// ============================================================

/**
 * Base negative prompts for all Ideogram generations
 * Avoids common AI image issues
 */
const BASE_NEGATIVE_PROMPTS = [
  // Text quality issues
  'blurry text',
  'misspelled text',
  'illegible text',
  'distorted letters',
  'cut off text',
  'truncated words',
  // General quality issues
  'low quality',
  'amateur design',
  'clipart',
  'watermarks',
  'ugly',
  'disfigured',
  // Anti-mockup prompts - prevent "poster on wall" style rendering
  'poster on wall',
  'mockup presentation',
  'pinned to board',
  'framed poster',
  'white border',
  'mat frame',
  'gap around design',
  'clip holding poster',
  'poster preview',
  'design mockup',
  'floating poster',
  'poster hanging',
  'wall background',
  'presentation context',
  // Additional anti-mockup prompts
  'room interior',
  'office setting',
  'poster displayed',
  'exhibition',
  'gallery wall',
  'photo of poster',
  'poster photograph',
  'mockup scene',
  'interior background',
  'hanging on wall',
  'pinboard',
  'cork board',
  'bulletin board',
]

/**
 * Style-specific negative prompts
 */
const STYLE_NEGATIVES: Record<string, string[]> = {
  flat: ['gradients', 'shadows', '3d effects', 'depth', 'textures'],
  minimalist: ['busy', 'cluttered', 'ornate', 'decorative patterns', 'heavy textures'],
  'line-art': ['filled shapes', 'solid colors', 'photographs', 'gradients'],
  geometric: ['organic shapes', 'hand-drawn elements', 'photographic elements'],
  photographic: ['illustrated elements', 'cartoon', 'anime style', 'flat design'],
  'neon-glow': ['bright backgrounds', 'pastel colors', 'muted tones'],
  watercolor: ['sharp edges', 'digital look', 'flat colors', 'geometric patterns'],
  '3d-isometric': ['flat design', '2d only', 'no depth'],
  monochrome: ['multiple colors', 'colorful', 'vibrant colors'],
  'high-contrast': ['gray tones', 'muted colors', 'soft edges'],
}

/**
 * Build negative prompt from style, customization, and creative template
 */
function buildNegativePrompt(intent: PromptIntent): string {
  const negatives: string[] = [...BASE_NEGATIVE_PROMPTS]

  // Add style-specific negatives
  const styleNegatives = STYLE_NEGATIVES[intent.style.value] || []
  negatives.push(...styleNegatives)

  // Add template-specific negatives from knowledge base
  if (intent.creativeTemplate) {
    negatives.push(...intent.creativeTemplate.negativePrompts.base)
    negatives.push(...intent.creativeTemplate.negativePrompts.typeSpecific)
  }

  // Add customization negatives
  if (intent.customization) {
    const customNegatives = getCustomizationNegativePrompts(intent.customization)
    negatives.push(...customNegatives)
  }

  // Remove duplicates and join
  return [...new Set(negatives)].join(', ')
}

// ============================================================
// PROMPT BUILDER
// ============================================================

/**
 * Build concise design context section for Ideogram
 * Extracts key visual elements from AI-generated context
 */
function buildDesignContextSection(context: DesignContext): string {
  const parts: string[] = []

  // Core purpose as design directive
  parts.push(context.corePurpose)

  // Visual elements (top 3-4 for conciseness)
  const topElements = context.visualElements.slice(0, 4).join(', ')
  parts.push(`featuring ${topElements}`)

  // Background setting
  parts.push(`set in ${context.backgroundSetting}`)

  // Iconic imagery (concise)
  if (context.iconicImagery.length > 0) {
    parts.push(`with ${context.iconicImagery.slice(0, 2).join(' and ')}`)
  }

  return parts.join(', ')
}

/**
 * Build template-specific prompt additions from knowledge base
 */
function buildTemplateSpecificGuidance(template: CreativeTemplate): string {
  const parts: string[] = []

  // Add template's typography mood
  if (template.typography?.mood) {
    parts.push(template.typography.mood)
  }

  // Add visual recommendations (top 2)
  if (template.visuals?.recommended?.length > 0) {
    parts.push(template.visuals.recommended.slice(0, 2).join(', '))
  }

  // Add safe area guidance if present
  if (template.safeAreas && template.safeAreas.length > 0) {
    const safeAreaGuidance = template.safeAreas
      .map(sa => `avoid ${sa.description.toLowerCase()} (${sa.reason})`)
      .join(', ')
    parts.push(safeAreaGuidance)
  }

  return parts.join(', ')
}

/**
 * Build concise Ideogram prompt
 * Now integrates AI-generated design context AND creative template from knowledge base
 */
function buildIdeogramPrompt(intent: PromptIntent): string {
  const parts: string[] = []
  const template = intent.creativeTemplate

  // Opening with quality keywords from template (if available)
  const qualityPrefix = template?.qualityKeywords?.slice(0, 2).join(' ') || 'Award-winning'
  parts.push(
    `${qualityPrefix} ${intent.style.label.toLowerCase()} ${intent.creativeType.replace(/_/g, ' ')} design`
  )

  // CRITICAL: AI-Generated Design Context (if available)
  // This transforms generic prompts into purpose-driven, contextual ones
  if (intent.designContext) {
    parts.push(buildDesignContextSection(intent.designContext))
  } else {
    // Fallback to theme atmosphere
    parts.push(`with ${intent.theme.atmosphere.mood} mood`)
  }

  // Color description (enhanced with AI context if available)
  if (intent.designContext?.colorMood) {
    parts.push(intent.designContext.colorMood)
  } else {
    const colorDesc = getColorDescriptionShort(intent.colorPalette.scheme)
    parts.push(`featuring ${colorDesc}`)
  }

  // Text elements with explicit quotes
  const textElements = buildTextListForIdeogram(intent.content)
  if (textElements.length > 0) {
    parts.push(textElements.join(', '))
  }

  // Style treatment (condensed)
  const styleTreatment = getStyleTreatmentShort(intent.style.value)
  parts.push(styleTreatment)

  // Template-specific guidance from knowledge base
  if (template) {
    const templateGuidance = buildTemplateSpecificGuidance(template)
    if (templateGuidance) {
      parts.push(templateGuidance)
    }
  }

  // Lighting hint
  const lightingHint = getLightingHint(intent.theme.value)
  if (lightingHint) {
    parts.push(lightingHint)
  }

  // Organization branding
  parts.push(`for ${intent.organizationName}`)

  // Customization summary (if present)
  if (intent.customization) {
    const customSummary = buildCustomizationSummaryShort(intent.customization)
    if (customSummary) {
      parts.push(customSummary)
    }
  }

  // Quality modifiers based on resolution
  const qualityModifiers = getQualityModifiers(intent.resolution)
  parts.push(qualityModifiers)

  // Final typography reminder with emotional goal
  if (intent.designContext?.emotionalJob) {
    parts.push(`design that makes viewers feel ${intent.designContext.emotionalJob}`)
  }

  // Language instruction (compact version for Ideogram)
  const languageInstruction = buildCompactLanguageInstruction(intent.language)
  parts.push(languageInstruction)

  // RTL guidance if applicable
  if (isRTLLanguage(intent.language)) {
    parts.push('right-to-left text alignment and layout flow')
  }

  // CRITICAL: Edge-to-edge and anti-mockup instructions
  parts.push('full bleed design filling entire canvas edge-to-edge')
  parts.push('NOT a mockup or poster on wall')
  parts.push('all text perfectly legible, professional typography, magazine-quality design')

  return parts.join(', ')
}

/**
 * Get condensed style treatment for Ideogram
 */
function getStyleTreatmentShort(style: string): string {
  const treatments: Record<string, string> = {
    gradient: 'smooth flowing color transitions',
    flat: 'clean solid colors no shadows',
    glass: 'frosted glass effect with subtle blur',
    geometric: 'bold geometric shapes and patterns',
    'neon-glow': 'glowing neon elements dark background',
    duotone: 'two-color artistic treatment',
    watercolor: 'soft watercolor texture painted feel',
    'line-art': 'elegant clean outlines minimal fills',
    '3d-isometric': 'isometric 3D perspective with depth',
    typography: 'bold creative typography as main design',
    photographic: 'photorealistic professional imagery',
    illustration: 'hand-illustrated artistic elements',
    metallic: 'shiny metallic gold silver chrome effects',
    'paper-cut': 'layered paper craft shadows depth',
    monochrome: 'elegant single color shades',
    'high-contrast': 'stark black white high contrast',
  }

  return treatments[style] || 'modern professional design'
}

/**
 * Get lighting hint based on theme
 */
function getLightingHint(theme: string): string | null {
  const lightingHints: Record<string, string> = {
    corporate: 'clean professional lighting',
    elegant: 'soft diffused gallery lighting',
    royal: 'warm golden ambient light',
    glamorous: 'sparkle highlight effects',
    neon: 'neon glow dark environment',
    futuristic: 'cool blue technological glow',
    festive: 'warm celebratory lighting',
    spiritual: 'soft divine rays',
    scientific: 'clean clinical blue tones',
  }

  return lightingHints[theme] || null
}

/**
 * Get quality modifiers based on resolution
 */
function getQualityModifiers(resolution: string): string {
  const modifiers: Record<string, string> = {
    '1K': 'crisp clean web-quality output',
    '2K': 'high detail sharp rendering',
    '4K': 'ultra detailed print-ready maximum quality',
  }

  return modifiers[resolution] || modifiers['1K']
}

// ============================================================
// ADAPTER CLASS
// ============================================================

/**
 * Ideogram Prompt Adapter
 * Implements the PromptAdapter interface for Ideogram
 */
export class IdeogramAdapter implements PromptAdapter<IdeogramPromptOutput> {
  adapt(intent: PromptIntent): IdeogramPromptOutput {
    // Get Ideogram-specific settings from style
    const styleType = getIdeogramStyleType(intent.style.value)
    const magicPrompt = getMagicPromptSetting(intent.style.value)

    // Build color palette for brand colors
    const colorPalette = buildIdeogramColorPalette(
      intent.colorPalette.scheme,
      intent.brand
    )

    return {
      provider: 'ideogram',
      prompt: buildIdeogramPrompt(intent),
      styleType,
      magicPrompt,
      negativePrompt: buildNegativePrompt(intent),
      colorPalette,
    }
  }
}

/**
 * Functional adapter for direct use
 */
export function adaptForIdeogram(intent: PromptIntent): IdeogramPromptOutput {
  const adapter = new IdeogramAdapter()
  return adapter.adapt(intent)
}

/**
 * Convert IdeogramPromptOutput to API-ready format
 * Matches the format expected by the Ideogram client
 */
export function toIdeogramApiFormat(output: IdeogramPromptOutput): {
  prompt: string
  styleType: IdeogramStyleType
  magicPrompt: IdeogramMagicPrompt
  negativePrompt: string
  brandColors?: string[]
} {
  // Convert color palette to brand colors array if present
  const brandColors = output.colorPalette?.map((c) => `#${c.hex}`) || undefined

  return {
    prompt: output.prompt,
    styleType: output.styleType,
    magicPrompt: output.magicPrompt,
    negativePrompt: output.negativePrompt,
    brandColors,
  }
}

/**
 * Get estimated character count for the prompt
 * Ideogram has prompt length limits
 */
export function estimateIdeogramPromptLength(output: IdeogramPromptOutput): {
  promptLength: number
  negativeLength: number
  withinLimits: boolean
} {
  const MAX_PROMPT_LENGTH = 10000
  const MAX_NEGATIVE_LENGTH = 1000

  return {
    promptLength: output.prompt.length,
    negativeLength: output.negativePrompt.length,
    withinLimits:
      output.prompt.length <= MAX_PROMPT_LENGTH &&
      output.negativePrompt.length <= MAX_NEGATIVE_LENGTH,
  }
}
