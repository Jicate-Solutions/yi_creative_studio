/**
 * Type definitions for the multi-model prompting system
 * Supports both Gemini and Ideogram AI models
 */

import type { CustomizationData, ColorConfig } from '@/lib/config/design-constants'
import type { CreativeTemplate } from './knowledge-base/types'
import type { LogoSafeZone } from './types/logo-awareness'
import type { DesignContext, EnhancedBuildOptions } from './services/yi-prompt-builder/types'

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
  /**
   * Dynamic fields not in the standard set above.
   * Captures format-specific fields like videoTitle, hookText, recipientName, etc.
   * v4.0: Added to support all 37 creative formats with their unique field requirements.
   */
  customFields?: Record<string, string>
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
// SPEAKER CONTEXT (NEW)
// ============================================================

export interface SpeakerContext {
  hasSpeakerPhoto: boolean
  count: number
  layout: 'side-by-side' | 'stacked' | 'grid' | 'single'
  // v6.5: Position and shape for zone restriction instructions
  speakerPhotoPosition?: 'left' | 'right' | 'center' | 'bottom-left' | 'bottom-right'
  speakerPhotoShape?: 'circle' | 'rounded' | 'square'
}

// ============================================================
// DESIGN CONTEXT (AI-Generated Design Intelligence)
// ============================================================

// Re-map DesignContext for consistency
export type { DesignContext };

// ============================================================
// EVENT UNDERSTANDING (AI-Generated Event Analysis - Stage 1)
// ============================================================

/**
 * Event Understanding result from Stage 1 AI analysis
 * Re-exported from event-understanding.ts for convenience
 */
export type {
  EventProfile,
  VisualConcept,
  EventUnderstandingInput
} from './services/event-understanding';

// ============================================================
// TYPOGRAPHY INTELLIGENCE (AI-Generated Typography Guidance - Stage 1.5)
// ============================================================

/**
 * Typography Intelligence result from Stage 1.5 AI analysis
 * Re-exported from typography-intelligence.ts for convenience
 */
export type {
  TypographyProfile,
  TypographyAnalysisInput,
  FontCharacteristics
} from './services/typography-intelligence';

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
  /** Ultra-Pro Design context (Direct from Claude) */
  ultraProContext?: EnhancedBuildOptions['ultraProContext']
  /** Speaker context for background suppression */
  speakerContext?: SpeakerContext
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
  /** Speaker photo configuration */
  speakerPhotoConfig?: {
    enabled?: boolean
    position?: string
    size?: string
    shape?: string
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
