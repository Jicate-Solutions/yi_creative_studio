/**
 * Format-to-Pattern Mapping
 *
 * Maps all 37+ creative formats to 10 base patterns.
 * This enables scalable prompt generation without maintaining
 * individual templates for each format.
 */

import type { BasePatternId } from './types'

// ============================================================================
// Format to Base Pattern Mapping
// ============================================================================

export const FORMAT_TO_PATTERN: Record<string, BasePatternId> = {
  // ---------------------------------------------------------------------------
  // SQUARE SOCIAL (1:1) - 3 formats
  // ---------------------------------------------------------------------------
  instagram_post: 'square_social',
  facebook_ad: 'square_social',
  square_ad: 'square_social',

  // ---------------------------------------------------------------------------
  // PORTRAIT STORY (9:16) - 5 formats
  // ---------------------------------------------------------------------------
  instagram_story: 'portrait_story',
  instagram_reel: 'portrait_story',
  tiktok_cover: 'portrait_story',
  whatsapp_status: 'portrait_story',
  portrait_poster: 'portrait_story',

  // ---------------------------------------------------------------------------
  // LANDSCAPE FEED (~16:9) - 4 formats
  // ---------------------------------------------------------------------------
  facebook_post: 'landscape_feed',
  linkedin_post: 'landscape_feed',
  twitter_post: 'landscape_feed',
  landscape_poster: 'landscape_feed',

  // ---------------------------------------------------------------------------
  // BANNER/HEADER (wide) - 7 formats
  // ---------------------------------------------------------------------------
  facebook_cover: 'banner_header',
  linkedin_banner: 'banner_header',
  twitter_header: 'banner_header',
  youtube_banner: 'banner_header',
  web_banner: 'banner_header',
  email_header: 'banner_header',
  billboard: 'banner_header',

  // ---------------------------------------------------------------------------
  // THUMBNAIL (click-worthy) - 2 formats
  // ---------------------------------------------------------------------------
  youtube_thumbnail: 'thumbnail_click',
  video_cover: 'thumbnail_click',

  // ---------------------------------------------------------------------------
  // PRINT PORTRAIT (A4/A5) - 5 formats
  // ---------------------------------------------------------------------------
  flyer_a5: 'print_portrait',
  flyer_a4: 'print_portrait',
  brochure: 'print_portrait',
  invitation: 'print_portrait',
  pinterest_pin: 'print_portrait',

  // ---------------------------------------------------------------------------
  // PRINT LANDSCAPE - 3 formats
  // ---------------------------------------------------------------------------
  certificate: 'print_landscape',
  presentation_16_9: 'print_landscape',
  presentation_4_3: 'print_landscape',

  // ---------------------------------------------------------------------------
  // EVENT POSTER (4:5) - 2 formats
  // ---------------------------------------------------------------------------
  event_poster: 'event_poster',
  announcement: 'event_poster',

  // ---------------------------------------------------------------------------
  // FORMAL DOCUMENT - 4 formats
  // ---------------------------------------------------------------------------
  letterhead: 'formal_document',
  resume: 'formal_document',
  report_cover: 'formal_document',
  book_cover: 'formal_document',

  // ---------------------------------------------------------------------------
  // AD UNIT - 2 formats
  // ---------------------------------------------------------------------------
  leaderboard_ad: 'ad_unit',
  business_card: 'ad_unit',

  // ---------------------------------------------------------------------------
  // CUSTOM - uses event_poster as default fallback
  // ---------------------------------------------------------------------------
  custom: 'event_poster',
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get the base pattern ID for a given format
 */
export function getPatternIdForFormat(formatId: string): BasePatternId {
  return FORMAT_TO_PATTERN[formatId] || 'event_poster'
}

/**
 * Get all formats that use a specific base pattern
 */
export function getFormatsForPattern(patternId: BasePatternId): string[] {
  return Object.entries(FORMAT_TO_PATTERN)
    .filter(([_, pattern]) => pattern === patternId)
    .map(([format]) => format)
}

/**
 * Check if a format ID is valid (exists in mapping)
 */
export function isValidFormatId(formatId: string): boolean {
  return formatId in FORMAT_TO_PATTERN
}

/**
 * Get all unique base pattern IDs
 */
export function getAllPatternIds(): BasePatternId[] {
  return [...new Set(Object.values(FORMAT_TO_PATTERN))]
}

/**
 * Get format count by pattern
 */
export function getFormatCountByPattern(): Record<BasePatternId, number> {
  const counts: Record<string, number> = {}

  for (const pattern of Object.values(FORMAT_TO_PATTERN)) {
    counts[pattern] = (counts[pattern] || 0) + 1
  }

  return counts as Record<BasePatternId, number>
}
