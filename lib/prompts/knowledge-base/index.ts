/**
 * Dynamic Prompt Knowledge Base - Main Registry
 *
 * Central registry that resolves creative formats to merged templates
 * by combining base patterns with format-specific overrides.
 *
 * Architecture:
 * Format ID → Base Pattern → Format Override → Merged CreativeTemplate
 */

import type {
  BasePattern,
  BasePatternId,
  CreativeTemplate,
  FormatOverride,
  TextElement,
  TypographyPreset,
  VisualGuidance,
  NegativePromptSet,
  LayoutPattern,
  SafeArea,
  TemplateResolutionInput,
} from './types'

// Base Patterns
import { SQUARE_SOCIAL_PATTERN } from './base-patterns/square-social'
import { PORTRAIT_STORY_PATTERN } from './base-patterns/portrait-story'
import { LANDSCAPE_FEED_PATTERN } from './base-patterns/landscape-feed'
import { BANNER_HEADER_PATTERN } from './base-patterns/banner-header'
import { THUMBNAIL_CLICK_PATTERN } from './base-patterns/thumbnail-click'
import { PRINT_PORTRAIT_PATTERN } from './base-patterns/print-portrait'
import { PRINT_LANDSCAPE_PATTERN } from './base-patterns/print-landscape'
import { EVENT_POSTER_PATTERN } from './base-patterns/event-poster'
import { FORMAL_DOCUMENT_PATTERN } from './base-patterns/formal-document'
import { AD_UNIT_PATTERN } from './base-patterns/ad-unit'

// Format Overrides
import { FORMAT_OVERRIDES, getFormatOverride } from './format-overrides/overrides'

// Format Mapping
import { FORMAT_TO_PATTERN, getPatternIdForFormat } from './format-mapping'

// ============================================================================
// Base Pattern Registry
// ============================================================================

const BASE_PATTERNS: Record<BasePatternId, BasePattern> = {
  square_social: SQUARE_SOCIAL_PATTERN,
  portrait_story: PORTRAIT_STORY_PATTERN,
  landscape_feed: LANDSCAPE_FEED_PATTERN,
  banner_header: BANNER_HEADER_PATTERN,
  thumbnail_click: THUMBNAIL_CLICK_PATTERN,
  print_portrait: PRINT_PORTRAIT_PATTERN,
  print_landscape: PRINT_LANDSCAPE_PATTERN,
  event_poster: EVENT_POSTER_PATTERN,
  formal_document: FORMAL_DOCUMENT_PATTERN,
  ad_unit: AD_UNIT_PATTERN,
}

// ============================================================================
// Category Mapping
// ============================================================================

const FORMAT_CATEGORIES: Record<string, string> = {
  // Social Media
  instagram_post: 'social_media',
  instagram_story: 'social_media',
  instagram_reel: 'social_media',
  facebook_post: 'social_media',
  facebook_ad: 'social_media',
  facebook_cover: 'social_media',
  linkedin_post: 'social_media',
  linkedin_banner: 'social_media',
  twitter_post: 'social_media',
  twitter_header: 'social_media',
  pinterest_pin: 'social_media',
  tiktok_cover: 'social_media',
  whatsapp_status: 'social_media',

  // Video
  youtube_thumbnail: 'video',
  youtube_banner: 'video',
  video_cover: 'video',

  // Print
  event_poster: 'print',
  portrait_poster: 'print',
  landscape_poster: 'print',
  flyer_a4: 'print',
  flyer_a5: 'print',
  business_card: 'print',
  invitation: 'print',
  certificate: 'print',
  brochure: 'print',

  // Presentations
  presentation_16_9: 'presentation',
  presentation_4_3: 'presentation',

  // Marketing
  web_banner: 'marketing',
  email_header: 'marketing',
  billboard: 'marketing',
  announcement: 'marketing',
  leaderboard_ad: 'marketing',
  square_ad: 'marketing',

  // Documents
  letterhead: 'document',
  resume: 'document',
  report_cover: 'document',
  book_cover: 'document',

  // Custom
  custom: 'custom',
}

// ============================================================================
// Template Merging Functions
// ============================================================================

/**
 * Merge text elements from base pattern with override
 */
function mergeTextElements(
  base: TextElement[],
  override?: Partial<TextElement>[]
): TextElement[] {
  if (!override || override.length === 0) return base

  return base.map((element) => {
    const overrideElement = override.find((o) => o.id === element.id)
    if (overrideElement) {
      return { ...element, ...overrideElement }
    }
    return element
  })
}

/**
 * Merge typography preset with override
 */
function mergeTypography(
  base: TypographyPreset,
  override?: Partial<TypographyPreset>
): TypographyPreset {
  if (!override) return base
  return { ...base, ...override }
}

/**
 * Merge visual guidance with override
 */
function mergeVisuals(
  base: VisualGuidance,
  override?: Partial<VisualGuidance>
): VisualGuidance {
  if (!override) return base

  return {
    recommended: override.recommended || base.recommended,
    backgrounds: override.backgrounds || base.backgrounds,
    avoid: override.avoid || base.avoid,
  }
}

/**
 * Merge negative prompts with override
 */
function mergeNegativePrompts(
  base: NegativePromptSet,
  override?: Partial<NegativePromptSet>
): NegativePromptSet {
  if (!override) return base

  return {
    base: [...base.base, ...(override.base || [])],
    typeSpecific: [...base.typeSpecific, ...(override.typeSpecific || [])],
  }
}

/**
 * Merge quality keywords with override
 */
function mergeQualityKeywords(base: string[], override?: string[]): string[] {
  if (!override || override.length === 0) return base
  return [...new Set([...base, ...override])]
}

/**
 * Merge safe areas from layout and override
 */
function mergeSafeAreas(
  layoutSafeAreas?: SafeArea[],
  overrideSafeAreas?: SafeArea[]
): SafeArea[] | undefined {
  const safeAreas: SafeArea[] = []

  if (layoutSafeAreas) safeAreas.push(...layoutSafeAreas)
  if (overrideSafeAreas) safeAreas.push(...overrideSafeAreas)

  return safeAreas.length > 0 ? safeAreas : undefined
}

/**
 * Build final prompt template with additions
 */
function buildPromptTemplate(base: string, additions?: string): string {
  if (!additions) return base
  return `${base}\n\n${additions}`
}

// ============================================================================
// Main Template Resolution
// ============================================================================

/**
 * Get the base pattern for a format
 */
export function getBasePattern(formatId: string): BasePattern {
  const patternId = getPatternIdForFormat(formatId)
  return BASE_PATTERNS[patternId] || BASE_PATTERNS.event_poster
}

/**
 * Resolve a format ID to a fully merged CreativeTemplate
 *
 * This is the main entry point for the knowledge base.
 * It combines the base pattern with any format-specific overrides.
 */
export function getTemplateForFormat(
  formatId: string
): CreativeTemplate {
  // Get the base pattern
  const patternId = getPatternIdForFormat(formatId)
  const basePattern = BASE_PATTERNS[patternId] || BASE_PATTERNS.event_poster

  // Get format override if exists
  const override = getFormatOverride(formatId)

  // Get category
  const category = FORMAT_CATEGORIES[formatId] || 'custom'

  // Merge everything into a CreativeTemplate
  const template: CreativeTemplate = {
    id: formatId,
    basePattern: patternId,
    name: override?.formatId
      ? formatIdToDisplayName(formatId)
      : basePattern.name,
    category,

    // Merge all configuration
    textElements: mergeTextElements(basePattern.textElements, override?.textElements),
    textHierarchy: override?.textHierarchy || basePattern.textHierarchy,
    layout: basePattern.layout,
    typography: mergeTypography(basePattern.typography, override?.typography),
    visuals: mergeVisuals(basePattern.visuals, override?.visuals),
    negativePrompts: mergeNegativePrompts(
      basePattern.negativePrompts,
      override?.negativePrompts
    ),
    promptTemplate: buildPromptTemplate(
      basePattern.promptTemplate,
      override?.promptTemplateAdditions
    ),
    qualityKeywords: mergeQualityKeywords(
      basePattern.qualityKeywords,
      override?.qualityKeywords
    ),
    safeAreas: mergeSafeAreas(basePattern.layout.safeAreas, override?.safeAreas),
  }

  return template
}

/**
 * Get template with additional context (vertical, organization type)
 */
export function resolveTemplate(
  input: TemplateResolutionInput
): CreativeTemplate {
  // Get base template
  const template = getTemplateForFormat(input.formatId)

  // Future: Apply vertical-specific adjustments
  // Future: Apply organization type adjustments

  return template
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convert format ID to display name
 */
function formatIdToDisplayName(formatId: string): string {
  return formatId
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Get all available format IDs
 */
export function getAllFormatIds(): string[] {
  return Object.keys(FORMAT_TO_PATTERN)
}

/**
 * Get all formats in a category
 */
export function getFormatsByCategory(category: string): string[] {
  return Object.entries(FORMAT_CATEGORIES)
    .filter(([_, cat]) => cat === category)
    .map(([format]) => format)
}

/**
 * Get all categories
 */
export function getAllCategories(): string[] {
  return [...new Set(Object.values(FORMAT_CATEGORIES))]
}

/**
 * Check if a format has overrides
 */
export function hasFormatOverride(formatId: string): boolean {
  return formatId in FORMAT_OVERRIDES
}

/**
 * Get pattern statistics
 */
export function getPatternStats(): {
  totalFormats: number
  totalPatterns: number
  formatsWithOverrides: number
  categories: number
} {
  return {
    totalFormats: Object.keys(FORMAT_TO_PATTERN).length,
    totalPatterns: Object.keys(BASE_PATTERNS).length,
    formatsWithOverrides: Object.keys(FORMAT_OVERRIDES).length,
    categories: getAllCategories().length,
  }
}

// ============================================================================
// Re-exports
// ============================================================================

// Types
export * from './types'

// Format mapping utilities
export {
  FORMAT_TO_PATTERN,
  getPatternIdForFormat,
  getFormatsForPattern,
  isValidFormatId,
  getAllPatternIds,
} from './format-mapping'

// Format overrides
export { FORMAT_OVERRIDES, getFormatOverride } from './format-overrides/overrides'

// Base patterns (for direct access if needed)
export { BASE_PATTERNS }
