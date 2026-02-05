/**
 * Format Logo Bar Configuration
 * YiCreatives Studio v21.0
 *
 * Defines logo bar behavior per creative format.
 * This enables the logo overlay system to adapt to different format requirements.
 *
 * Logo bar modes:
 * - full: Complete 4-row strip (brand, vertical, initiative, partner)
 * - compact: 2-row strip (brand + vertical only)
 * - minimal: Brand logos only (Yi, CII)
 * - none: No logo bars applied
 */

import { getFormatCategory, type FormatCategory } from './format-zones'

// ============================================================================
// Types
// ============================================================================

/**
 * Logo bar display modes
 */
export type LogoBarMode = 'full' | 'compact' | 'minimal' | 'none'

/**
 * Strip configuration - where logo bars are placed
 */
export type StripConfig = 'header-only' | 'header-footer' | 'footer-only' | 'none'

/**
 * Complete logo bar configuration for a format
 */
export interface FormatLogoBarConfig {
  /** Display mode - determines which logo rows are shown */
  mode: LogoBarMode
  /** Strip placement configuration */
  stripConfig: StripConfig
  /** Scale factor relative to event_poster (1.0 = full size) */
  scaleFactor: number
  /** Maximum header height as percentage of canvas */
  maxHeaderPercent: number
  /** Maximum footer height as percentage of canvas */
  maxFooterPercent: number
  /** Minimum logo size in pixels (prevents logos from being too small) */
  minLogoSize: number
  /** Maximum logo size in pixels (prevents logos from being too large) */
  maxLogoSize: number
  /** Whether to use split layout (header at top, footer at bottom) */
  useSplitLayout: boolean
  /** Description for debugging/logging */
  description: string
}

// ============================================================================
// Logo Bar Configurations by Category
// ============================================================================

/**
 * Logo bar configurations per format category
 *
 * CRITICAL PRESERVED VALUES (user-approved):
 * - Row 1 (Brand): alpha 0.05
 * - Row 2 (Vertical): alpha 0
 * - Row 3 (Initiative): alpha 0.7
 * - Row 4 (Footer): alpha 0.7
 * These transparency values are preserved in logo-overlay.ts
 */
const LOGO_BAR_CONFIGS: Record<FormatCategory, FormatLogoBarConfig> = {
  // Full 4-row strip for portrait posters
  poster_portrait: {
    mode: 'full',
    stripConfig: 'header-footer',
    scaleFactor: 1.0,
    maxHeaderPercent: 25,
    maxFooterPercent: 15,
    minLogoSize: 60,
    maxLogoSize: 120,
    useSplitLayout: true,
    description: 'Full logo bars for portrait posters'
  },

  // Compact strip for landscape formats
  poster_landscape: {
    mode: 'compact',
    stripConfig: 'header-only',
    scaleFactor: 0.7,
    maxHeaderPercent: 15,
    maxFooterPercent: 10,
    minLogoSize: 40,
    maxLogoSize: 80,
    useSplitLayout: false,
    description: 'Compact header-only for landscape posters'
  },

  // Compact strip for square formats
  poster_square: {
    mode: 'compact',
    stripConfig: 'header-footer',
    scaleFactor: 0.8,
    maxHeaderPercent: 18,
    maxFooterPercent: 12,
    minLogoSize: 50,
    maxLogoSize: 90,
    useSplitLayout: true,
    description: 'Compact logo bars for square posters'
  },

  // No logo bars for certificates - formal documents
  certificate: {
    mode: 'none',
    stripConfig: 'none',
    scaleFactor: 0,
    maxHeaderPercent: 0,
    maxFooterPercent: 0,
    minLogoSize: 0,
    maxLogoSize: 0,
    useSplitLayout: false,
    description: 'No logo bars for certificates'
  },

  // No logo bars for social portrait (stories)
  social_portrait: {
    mode: 'none',
    stripConfig: 'none',
    scaleFactor: 0,
    maxHeaderPercent: 0,
    maxFooterPercent: 0,
    minLogoSize: 0,
    maxLogoSize: 0,
    useSplitLayout: false,
    description: 'No logo bars for social stories'
  },

  // Minimal branding for social landscape posts
  social_landscape: {
    mode: 'minimal',
    stripConfig: 'header-only',
    scaleFactor: 0.5,
    maxHeaderPercent: 10,
    maxFooterPercent: 0,
    minLogoSize: 30,
    maxLogoSize: 60,
    useSplitLayout: false,
    description: 'Minimal branding for social posts'
  },

  // Minimal strip for presentations
  presentation: {
    mode: 'minimal',
    stripConfig: 'header-only',
    scaleFactor: 0.5,
    maxHeaderPercent: 10,
    maxFooterPercent: 0,
    minLogoSize: 30,
    maxLogoSize: 60,
    useSplitLayout: false,
    description: 'Minimal branding for presentations'
  },

  // No logo bars for documents
  document: {
    mode: 'none',
    stripConfig: 'none',
    scaleFactor: 0,
    maxHeaderPercent: 0,
    maxFooterPercent: 0,
    minLogoSize: 0,
    maxLogoSize: 0,
    useSplitLayout: false,
    description: 'No logo bars for documents'
  },

  // No logo bars for cards (too small)
  card: {
    mode: 'none',
    stripConfig: 'none',
    scaleFactor: 0,
    maxHeaderPercent: 0,
    maxFooterPercent: 0,
    minLogoSize: 0,
    maxLogoSize: 0,
    useSplitLayout: false,
    description: 'No logo bars for small cards'
  },

  // Minimal strip for ultra-wide banners
  ultrawide: {
    mode: 'minimal',
    stripConfig: 'header-only',
    scaleFactor: 0.4,
    maxHeaderPercent: 12,
    maxFooterPercent: 0,
    minLogoSize: 25,
    maxLogoSize: 50,
    useSplitLayout: false,
    description: 'Minimal branding for ultra-wide banners'
  }
}

// ============================================================================
// Format-Specific Overrides
// ============================================================================

/**
 * Format-specific overrides for special cases
 * These override the category defaults when needed
 */
const FORMAT_OVERRIDES: Partial<Record<string, Partial<FormatLogoBarConfig>>> = {
  // Event poster - ensure full support (reference format)
  event_poster: {
    mode: 'full',
    scaleFactor: 1.0,
    description: 'Full logo bars for event posters (reference format)'
  },

  // YouTube thumbnail - no logo bars (focus on clickbait)
  youtube_thumbnail: {
    mode: 'none',
    stripConfig: 'none',
    scaleFactor: 0,
    description: 'No logo bars for YouTube thumbnails'
  },

  // Billboard - compact single row at top
  billboard: {
    mode: 'compact',
    stripConfig: 'header-only',
    scaleFactor: 0.5,
    maxHeaderPercent: 10,
    description: 'Compact header for billboards'
  },

  // Announcement - full support like event poster
  announcement: {
    mode: 'full',
    scaleFactor: 0.9,
    description: 'Full logo bars for announcements'
  },

  // Invitation - full support
  invitation: {
    mode: 'full',
    scaleFactor: 0.95,
    description: 'Full logo bars for invitations'
  },

  // Pinterest pin - no logo bars (vertical social)
  pinterest_pin: {
    mode: 'none',
    stripConfig: 'none',
    description: 'No logo bars for Pinterest pins'
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get logo bar configuration for a format
 * Merges category defaults with format-specific overrides
 */
export function getFormatLogoBarConfig(formatId: string): FormatLogoBarConfig {
  const category = getFormatCategory(formatId)
  const categoryConfig = LOGO_BAR_CONFIGS[category]
  const overrides = FORMAT_OVERRIDES[formatId]

  if (overrides) {
    return {
      ...categoryConfig,
      ...overrides
    } as FormatLogoBarConfig
  }

  return categoryConfig
}

/**
 * Check if logo bars should be applied for a format
 */
export function shouldApplyLogoBars(formatId: string): boolean {
  const config = getFormatLogoBarConfig(formatId)
  return config.mode !== 'none'
}

/**
 * Check if a format uses split layout (header top, footer bottom)
 */
export function usesSplitLayout(formatId: string): boolean {
  const config = getFormatLogoBarConfig(formatId)
  return config.useSplitLayout && config.stripConfig === 'header-footer'
}

/**
 * Get the logo bar mode for a format
 */
export function getLogoBarMode(formatId: string): LogoBarMode {
  return getFormatLogoBarConfig(formatId).mode
}

/**
 * Get scale factor for logo sizing
 */
export function getLogoScaleFactor(formatId: string): number {
  return getFormatLogoBarConfig(formatId).scaleFactor
}

/**
 * Get all formats that use full logo bars
 */
export function getFormatsWithFullLogoBars(): string[] {
  const formats: string[] = []

  // Check all formats in the override list first
  for (const [formatId, override] of Object.entries(FORMAT_OVERRIDES)) {
    if (override?.mode === 'full') {
      formats.push(formatId)
    }
  }

  // Check category defaults for poster_portrait (which uses full mode)
  const categoryFormats: Record<FormatCategory, string[]> = {
    poster_portrait: ['event_poster', 'portrait_poster', 'flyer_a4', 'flyer_a5', 'invitation', 'announcement', 'pinterest_pin'],
    poster_landscape: [],
    poster_square: [],
    certificate: [],
    social_portrait: [],
    social_landscape: [],
    presentation: [],
    document: [],
    card: [],
    ultrawide: []
  }

  // Add formats from categories that default to 'full' mode
  for (const [category, ids] of Object.entries(categoryFormats)) {
    if (LOGO_BAR_CONFIGS[category as FormatCategory].mode === 'full') {
      for (const id of ids) {
        // Only add if not overridden to something else
        if (!FORMAT_OVERRIDES[id] || FORMAT_OVERRIDES[id]?.mode === 'full') {
          if (!formats.includes(id)) {
            formats.push(id)
          }
        }
      }
    }
  }

  return formats
}

/**
 * Get all formats that have NO logo bars
 */
export function getFormatsWithoutLogoBars(): string[] {
  const formats: string[] = []

  // Get formats from categories with 'none' mode
  const noneCategories: FormatCategory[] = ['certificate', 'social_portrait', 'document', 'card']

  for (const category of noneCategories) {
    // This would require iterating FORMAT_CATEGORY_MAP from format-zones.ts
    // For now, return a hardcoded list
  }

  // Hardcoded list of formats without logo bars
  return [
    'certificate',
    'instagram_story',
    'instagram_reel',
    'tiktok_cover',
    'whatsapp_status',
    'youtube_thumbnail',
    'letterhead',
    'resume',
    'report_cover',
    'book_cover',
    'brochure',
    'business_card',
    'email_header',
    'pinterest_pin'
  ]
}

/**
 * Debug: Get logo bar config summary for all formats
 */
export function getLogoBarConfigSummary(): Record<string, { mode: LogoBarMode; stripConfig: StripConfig }> {
  const knownFormats = [
    'event_poster', 'portrait_poster', 'landscape_poster', 'flyer_a4', 'flyer_a5',
    'invitation', 'announcement', 'certificate', 'instagram_post', 'instagram_story',
    'instagram_reel', 'facebook_post', 'facebook_ad', 'facebook_cover', 'linkedin_post',
    'linkedin_banner', 'twitter_post', 'twitter_header', 'pinterest_pin', 'tiktok_cover',
    'whatsapp_status', 'youtube_thumbnail', 'youtube_banner', 'video_cover', 'web_banner',
    'billboard', 'leaderboard_ad', 'square_ad', 'presentation_16_9', 'presentation_4_3',
    'letterhead', 'resume', 'report_cover', 'book_cover', 'brochure', 'business_card',
    'email_header'
  ]

  const summary: Record<string, { mode: LogoBarMode; stripConfig: StripConfig }> = {}

  for (const formatId of knownFormats) {
    const config = getFormatLogoBarConfig(formatId)
    summary[formatId] = {
      mode: config.mode,
      stripConfig: config.stripConfig
    }
  }

  return summary
}
