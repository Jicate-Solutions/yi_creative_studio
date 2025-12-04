/**
 * Type definitions for the multi-model prompting system
 * Supports both Gemini and Ideogram AI models
 */

import type { CustomizationData, ColorConfig } from '@/lib/config/design-constants'
import type { CreativeTemplate } from './knowledge-base/types'
import type { LogoSafeZone } from './types/logo-awareness'

// ============================================================
// CREATIVE CONTENT (Event data for poster generation)
// ============================================================

export interface CreativeContent {
  title?: string
  eventName?: string
  eventType?: string
  guestName?: string
  guestDesignation?: string
  date?: string
  time?: string
  venue?: string
  hall?: string
  additionalText?: string
  description?: string
}

// Re-export for convenience
export type DesignCustomization = CustomizationData

// ============================================================
// RESOLUTION TYPES
// ============================================================

export type ResolutionQuality = '1K' | '2K' | '4K'

// ============================================================
// THEME & STYLE INTENT TYPES
// ============================================================

export type ColorTendency = 'cool' | 'warm' | 'neutral' | 'vibrant'

export interface VisualAtmosphere {
  mood: string
  lighting: string
  ambiance: string
  materiality: string[]
}

export interface ThemeIntent {
  value: string
  label: string
  keywords: string[]
  colorTendency: ColorTendency
  description: string
  atmosphere: VisualAtmosphere
}

export interface StyleIntent {
  value: string
  label: string
  keywords: string[]
  description: string
  treatment: string // Rich visual treatment narrative
}

export interface ColorPaletteIntent {
  scheme: string
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
  }
  narrative: string // Natural language color description
}

// ============================================================
// AUDIENCE & CONTEXT TYPES
// ============================================================

export interface AudienceContext {
  primaryAudience: string
  occasion: string
  emotionalResponse: string
}

// ============================================================
// BRAND CONTEXT
// ============================================================

export interface BrandContext {
  primaryColor: string
  secondaryColor: string
  accentColor: string
  backgroundColor: string
  headlineFont: string
  bodyFont: string
  headerHeight: number
  footerHeight: number
}

// ============================================================
// RESOLUTION MODIFIERS
// ============================================================

export interface ResolutionModifiers {
  textureDetail: string
  edgeQuality: string
  microDetail: string
}

// ============================================================
// DESIGN CONTEXT (AI-Generated Design Intelligence)
// ============================================================

/**
 * AI-generated design context from Stage 1 analysis
 * Contains the core purpose, visual elements, and design strategy
 * that the image generation AI needs to create contextual designs
 */
export interface DesignContext {
  /** The emotional job this design must accomplish */
  corePurpose: string
  /** What viewers should DO after seeing this */
  desiredAction: string
  /** How viewers should FEEL */
  emotionalJob: string
  /** Visual elements that BELONG in this type of design */
  visualElements: string[]
  /** Appropriate environment/backdrop description */
  backgroundSetting: string
  /** Iconic imagery that reinforces the message */
  iconicImagery: string[]
  /** Color psychology guidance for this design */
  colorMood: string
  /** Strategic visual approach */
  designStrategy: string
  /** How to know the design worked */
  successMetric: string
  /** Specific layout guidance based on speaker photo position and logo requirements */
  layoutGuidance?: string
}

// ============================================================
// PROMPT INTENT (Model-Agnostic)
// ============================================================

export interface PromptIntent {
  creativeType: 'event_poster' | 'social_post' | 'banner'
  /** Format ID for template resolution (e.g., 'instagram_story', 'youtube_thumbnail') */
  format?: string
  content: CreativeContent
  theme: ThemeIntent
  style: StyleIntent
  colorPalette: ColorPaletteIntent
  audienceContext: AudienceContext
  aspectRatio: string
  resolution: ResolutionQuality
  resolutionModifiers: ResolutionModifiers
  dimensions: { width: number; height: number }
  brand: BrandContext
  organizationName: string
  customization?: DesignCustomization
  language: string
  languageLabel: string
  /** AI-generated design intelligence (Stage 1 output) */
  designContext?: DesignContext
  /** Resolved creative template from knowledge base */
  creativeTemplate?: CreativeTemplate
  /** Logo awareness context for safe zone generation */
  logoAwareness?: {
    activeLogos: LogoSafeZone[]
    layoutGuidance: string
    hasLogos: boolean
  }
}

// ============================================================
// MODEL-SPECIFIC OUTPUT TYPES
// ============================================================

export interface GeminiPromptOutput {
  provider: 'google'
  systemPrompt: string
  userPrompt: string
}

export type IdeogramStyleType = 'AUTO' | 'GENERAL' | 'REALISTIC' | 'DESIGN' | 'RENDER_3D' | 'ANIME'
export type IdeogramMagicPrompt = 'AUTO' | 'ON' | 'OFF'

export interface IdeogramPromptOutput {
  provider: 'ideogram'
  prompt: string
  styleType: IdeogramStyleType
  magicPrompt: IdeogramMagicPrompt
  negativePrompt: string
  colorPalette?: { hex: string; weight: number }[]
}

export type PromptOutput = GeminiPromptOutput | IdeogramPromptOutput

// ============================================================
// ADAPTER INTERFACE
// ============================================================

export interface PromptAdapter<T extends PromptOutput> {
  adapt(intent: PromptIntent): T
}

// ============================================================
// GENERATE PROMPT PARAMS
// ============================================================

export type AIProvider = 'google' | 'ideogram'

export interface GeneratePromptParams {
  provider: AIProvider
  type: 'event_poster' | 'social_post' | 'banner'
  /** Format ID for template resolution (e.g., 'instagram_story', 'youtube_thumbnail') */
  format?: string
  content: CreativeContent
  brand: {
    primary_color: string
    secondary_color: string
    accent_color: string
    background_color: string
    headline_font: string
    body_font: string
    header_height: number
    footer_height: number
  } | null
  theme: string
  style: string
  colorScheme: string
  /** Color configuration from UI (useBrandColors toggle, palette, custom colors) */
  colorConfig?: ColorConfig
  language: string
  aspectRatio: string
  resolution: ResolutionQuality
  dimensions: { width: number; height: number }
  organizationName: string
  customization?: DesignCustomization
  /** AI-generated design context from Stage 1 */
  designContext?: DesignContext
  /** Logo awareness context for safe zone generation */
  logoAwareness?: {
    activeLogos: LogoSafeZone[]
    layoutGuidance: string
    hasLogos: boolean
  }
}

// ============================================================
// TYPE GUARDS
// ============================================================

export function isGeminiPrompt(output: PromptOutput): output is GeminiPromptOutput {
  return output.provider === 'google'
}

export function isIdeogramPrompt(output: PromptOutput): output is IdeogramPromptOutput {
  return output.provider === 'ideogram'
}
