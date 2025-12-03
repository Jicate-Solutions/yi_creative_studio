/**
 * Dynamic Prompt Knowledge Base - Type Definitions
 *
 * Core TypeScript interfaces for the scalable prompt generation system
 * covering all 37+ creative formats through 10 base patterns.
 */

// ============================================================================
// Base Pattern Identifiers
// ============================================================================

export type BasePatternId =
  | 'square_social' // 1:1 Instagram post, Facebook ad, Square ad
  | 'portrait_story' // 9:16 Stories, Reels, TikTok, WhatsApp
  | 'landscape_feed' // ~16:9 Facebook, LinkedIn, Twitter posts
  | 'banner_header' // Wide banners, headers, covers
  | 'thumbnail_click' // YouTube thumbnail, video covers
  | 'print_portrait' // A4/A5 flyers, brochures, invitations
  | 'print_landscape' // Certificates, presentations
  | 'event_poster' // Event posters (4:5 ratio)
  | 'formal_document' // Letterhead, resume, book covers
  | 'ad_unit' // Leaderboard ads, display ads

// ============================================================================
// Text Element Types
// ============================================================================

export type TextRole =
  | 'headline'
  | 'subheadline'
  | 'body'
  | 'label'
  | 'cta'
  | 'caption'

export type EmphasisLevel = 'high' | 'medium' | 'low'

export interface TextElement {
  id: string
  role: TextRole
  emphasis: EmphasisLevel
  required: boolean
  maxLength?: number
  typographyHint?: string
  positionHint?: string
  renderingNote?: string
}

// ============================================================================
// Layout Types
// ============================================================================

export type ContentType = 'text' | 'image' | 'mixed' | 'reserved'

export interface LayoutZone {
  id: string
  position: string
  widthPercentage?: number
  heightPercentage?: number
  contentType: ContentType
  reservedFor?: string
}

export interface SafeArea {
  description: string
  reason: string
}

export interface LayoutPattern {
  name: string
  zones: LayoutZone[]
  safeAreas?: SafeArea[]
  compositionStyle: string
  visualFlow: string
}

// ============================================================================
// Typography Types
// ============================================================================

export interface TypographyPreset {
  primary: string
  secondary: string
  mood: string
}

// ============================================================================
// Visual Guidance Types
// ============================================================================

export interface VisualGuidance {
  recommended: string[]
  backgrounds: string[]
  avoid: string[]
}

// ============================================================================
// Negative Prompt Types
// ============================================================================

export interface NegativePromptSet {
  base: string[]
  typeSpecific: string[]
}

// ============================================================================
// Base Pattern Definition
// ============================================================================

export interface BasePattern {
  id: BasePatternId
  name: string
  aspectRatioRange: string

  // Text configuration
  textElements: TextElement[]
  textHierarchy: string[]

  // Layout configuration
  layout: LayoutPattern

  // Typography configuration
  typography: TypographyPreset

  // Visual guidance
  visuals: VisualGuidance

  // Negative prompts
  negativePrompts: NegativePromptSet

  // Prompt template with placeholders
  promptTemplate: string

  // Quality keywords for prompt enhancement
  qualityKeywords: string[]
}

// ============================================================================
// Format Override Definition
// ============================================================================

export interface FormatOverride {
  formatId: string

  // Optional overrides for any base pattern field
  textElements?: Partial<TextElement>[]
  textHierarchy?: string[]
  typography?: Partial<TypographyPreset>
  visuals?: Partial<VisualGuidance>
  negativePrompts?: Partial<NegativePromptSet>

  // Additions to the base prompt template
  promptTemplateAdditions?: string

  // Platform-specific quality keywords
  qualityKeywords?: string[]

  // Platform-specific safe zones
  safeAreas?: SafeArea[]
}

// ============================================================================
// Resolved Creative Template
// ============================================================================

export interface CreativeTemplate {
  id: string
  basePattern: BasePatternId
  name: string
  category: string

  // Resolved configuration (base + overrides merged)
  textElements: TextElement[]
  textHierarchy: string[]
  layout: LayoutPattern
  typography: TypographyPreset
  visuals: VisualGuidance
  negativePrompts: NegativePromptSet
  promptTemplate: string
  qualityKeywords: string[]
  safeAreas?: SafeArea[]
}

// ============================================================================
// Template Resolution Input
// ============================================================================

export interface TemplateResolutionInput {
  formatId: string
  verticalSlug?: string
  organizationType?: string
}

// ============================================================================
// Prompt Assembly Types
// ============================================================================

export interface PromptPlaceholders {
  headline?: string
  subheadline?: string
  organization_name?: string
  event_name?: string
  date_time?: string
  venue?: string
  guest_info?: string
  cta?: string
  title?: string
  recipient?: string
  description?: string
  visual_elements?: string
  color_scheme?: string
  color_description?: string
  background_color?: string
  theme?: string
  style_treatment?: string
  subject_description?: string
  [key: string]: string | undefined
}

export interface AssembledPrompt {
  mainPrompt: string
  negativePrompt: string
  qualityKeywords: string[]
  textHierarchy: string[]
  safeAreas?: SafeArea[]
}
