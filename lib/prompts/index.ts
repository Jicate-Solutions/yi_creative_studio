/**
 * Multi-Model Prompting System
 * Main entry point
 *
 * Based on "Nano Banana Pro" guide principles:
 * - Natural language descriptions (not tag soups)
 * - Be specific and descriptive (subject, setting, lighting, mood, materiality)
 * - Provide context (for whom, why it matters)
 * - SOTA text rendering with explicit quoting
 * - Resolution-aware detail levels
 */

// ============================================================
// TYPE EXPORTS
// ============================================================

export type {
  // Core types
  ResolutionQuality,
  ColorTendency,
  VisualAtmosphere,
  ThemeIntent,
  StyleIntent,
  ColorPaletteIntent,
  AudienceContext,
  BrandContext,
  ResolutionModifiers,
  PromptIntent,
  CreativeContent,
  DesignCustomization,
  // Design Intelligence (AI-Generated Context)
  DesignContext,
  // Output types
  GeminiPromptOutput,
  IdeogramPromptOutput,
  IdeogramStyleType,
  IdeogramMagicPrompt,
  PromptOutput,
  // Interface types
  PromptAdapter,
  AIProvider,
  GeneratePromptParams,
} from './types'

// Type guards
export { isGeminiPrompt, isIdeogramPrompt } from './types'

// ============================================================
// DATA EXPORTS
// ============================================================

// Theme atmospheres
export {
  THEME_ATMOSPHERES,
  getThemeAtmosphere,
  hasThemeAtmosphere,
} from './data/theme-atmospheres'

// Style treatments
export {
  STYLE_TREATMENTS,
  getStyleTreatment,
  hasStyleTreatment,
  STYLE_TO_IDEOGRAM_MAP,
  STYLE_MAGIC_PROMPT_MAP,
  MODEL_STYLE_PREFERENCES,
  getIdeogramStyleType,
  getMagicPromptSetting,
  getPreferredModelForStyle,
} from './data/style-treatments'

// Audience contexts
export {
  EVENT_AUDIENCE_CONTEXTS,
  getAudienceContext,
  hasAudienceContext,
  getEventTypesWithContexts,
} from './data/audience-contexts'

// Resolution modifiers
export {
  RESOLUTION_MODIFIERS,
  RESOLUTION_LABELS,
  getResolutionModifiers,
  getResolutionLabel,
  buildResolutionInstructions,
  getTextureRecommendations,
} from './data/resolution-modifiers'

// ============================================================
// HELPER EXPORTS
// ============================================================

// Text rendering
export {
  quoteTextForRendering,
  buildTextRenderingSection,
  buildTextListForIdeogram,
  getTypographyDirection,
  validateTextContent,
} from './helpers/text-rendering'

// Color narrative
export {
  buildColorNarrative,
  buildColorPaletteIntent,
  getColorDescriptionShort,
  buildIdeogramColorPalette,
  getColorHarmonyGuidance,
  getSchemeContrast,
} from './helpers/color-narrative'

// Customization
export {
  buildTitleNarrative,
  buildBackgroundNarrative,
  buildSpeakerPhotoNarrative,
  buildFooterNarrative,
  buildCustomizationNarrative,
  buildCustomizationSummaryShort,
  getCustomizationNegativePrompts,
} from './helpers/customization'

// ============================================================
// CORE EXPORTS
// ============================================================

// Prompt builder
export {
  buildPromptIntent,
  getPromptIntentMetadata,
  validatePromptIntent,
} from './core/prompt-builder'

// ============================================================
// ADAPTER EXPORTS
// ============================================================

// Gemini adapter
export {
  GeminiAdapter,
  adaptForGemini,
  adaptForGeminiCompact,
  estimateGeminiTokens,
} from './adapters/gemini-adapter'

// Ideogram adapter
export {
  IdeogramAdapter,
  adaptForIdeogram,
  toIdeogramApiFormat,
  estimateIdeogramPromptLength,
} from './adapters/ideogram-adapter'

// ============================================================
// LEGACY EXPORTS
// ============================================================

export {
  buildGenerationPromptLegacy,
  BRAND_SYSTEM_PROMPT_LEGACY,
} from './legacy'

// ============================================================
// MAIN API
// ============================================================

import type { GeneratePromptParams, PromptOutput, AIProvider } from './types'
import { buildPromptIntent, getPromptIntentMetadata } from './core/prompt-builder'
import { adaptForGemini } from './adapters/gemini-adapter'
import { adaptForIdeogram } from './adapters/ideogram-adapter'
import { getPreferredModelForStyle } from './data/style-treatments'

/**
 * Generate prompt for AI image generation
 * Main entry point for the prompting system
 *
 * @param params - Generation parameters
 * @returns Model-specific prompt output
 *
 * @example
 * ```ts
 * const prompt = generatePrompt({
 *   provider: "google",
 *   type: "event_poster",
 *   content: { eventName: "Tech Summit 2024", ... },
 *   theme: "corporate",
 *   style: "gradient",
 *   colorScheme: "brand_default",
 *   resolution: "2K",
 *   // ... other params
 * });
 *
 * if (prompt.provider === "google") {
 *   // Use prompt.systemPrompt and prompt.userPrompt
 * } else {
 *   // Use prompt.prompt, prompt.styleType, etc.
 * }
 * ```
 */
export function generatePrompt(params: GeneratePromptParams): PromptOutput {
  // Build model-agnostic intent
  const intent = buildPromptIntent(params)

  // Adapt for specific provider
  if (params.provider === 'google') {
    return adaptForGemini(intent)
  } else {
    return adaptForIdeogram(intent)
  }
}

/**
 * Generate prompts for both models at once
 * Useful for comparison or fallback strategies
 */
export function generatePromptsForBothModels(
  params: Omit<GeneratePromptParams, 'provider'>
): {
  gemini: ReturnType<typeof adaptForGemini>
  ideogram: ReturnType<typeof adaptForIdeogram>
  intent: ReturnType<typeof buildPromptIntent>
} {
  // Build model-agnostic intent once
  const intent = buildPromptIntent({ ...params, provider: 'google' })

  // Adapt for both providers
  return {
    gemini: adaptForGemini(intent),
    ideogram: adaptForIdeogram(intent),
    intent,
  }
}

/**
 * Get recommended provider for a style
 * Some styles work better with specific AI models
 */
export function getRecommendedProvider(
  style: string
): AIProvider | 'either' {
  const preference = getPreferredModelForStyle(style)

  if (preference === 'google') return 'google'
  if (preference === 'ideogram') return 'ideogram'
  return 'either'
}

/**
 * Quick prompt generation for simple use cases
 * Returns just the prompt strings without full configuration
 */
export function generateQuickPrompt(params: GeneratePromptParams): {
  provider: AIProvider
  prompt: string
  systemPrompt?: string
  metadata: ReturnType<typeof getPromptIntentMetadata>
} {
  const intent = buildPromptIntent(params)
  const metadata = getPromptIntentMetadata(intent)

  if (params.provider === 'google') {
    const output = adaptForGemini(intent)
    return {
      provider: 'google',
      prompt: output.userPrompt,
      systemPrompt: output.systemPrompt,
      metadata,
    }
  } else {
    const output = adaptForIdeogram(intent)
    return {
      provider: 'ideogram',
      prompt: output.prompt,
      metadata,
    }
  }
}
