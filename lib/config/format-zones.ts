/**
 * Format Zone Configuration
 * YiCreatives Studio v21.0
 *
 * Central configuration for format-specific zone percentages.
 * This enables the generation system to work with ALL creative formats,
 * not just event_poster.
 *
 * Zone percentages define where content can be placed:
 * - headerZone: Reserved for logo bars (no text content)
 * - contentZone: Where main text/visual content should be placed
 * - footerZone: Reserved for partner logos/footer (no text content)
 * - speakerPhotoZone: Where speaker photos can be overlaid (optional)
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Format categories for zone calculation
 * Each category has different zone proportions optimized for that format type
 */
export type FormatCategory =
  | 'poster_portrait'    // 3:4, 4:5, 9:16 - tall formats (event_poster, flyer, invitation)
  | 'poster_landscape'   // 16:9 - wide formats (youtube_thumbnail, web_banner)
  | 'poster_square'      // 1:1 - square formats (instagram_post, facebook_ad)
  | 'certificate'        // 4:3 landscape, formal documents
  | 'social_portrait'    // 9:16 stories (instagram_story, tiktok_cover)
  | 'social_landscape'   // 16:9 posts (facebook_post, linkedin_post)
  | 'presentation'       // 16:9, 4:3 slides
  | 'document'           // A4/A5 documents (letterhead, resume)
  | 'card'               // Small formats (business_card)
  | 'ultrawide'          // 21:9 and wider (billboard, leaderboard)

/**
 * Zone boundaries as percentages of canvas height
 */
export interface ZoneBoundary {
  start: number // Start percentage (0-100)
  end: number   // End percentage (0-100)
}

/**
 * Complete zone configuration for a format
 */
export interface FormatZones {
  /** Header zone - reserved for brand logos (no content) */
  headerZone: ZoneBoundary
  /** Content zone - where main text/visuals should be placed */
  contentZone: ZoneBoundary
  /** Footer zone - reserved for partner logos (no content) */
  footerZone: ZoneBoundary
  /** Speaker photo zone - where photos can be overlaid (optional) */
  speakerPhotoZone?: ZoneBoundary
}

// ============================================================================
// Zone Configurations
// ============================================================================

/**
 * Zone configurations per format category
 *
 * CRITICAL: poster_portrait zones (40-70%) must match existing event_poster
 * behavior for backward compatibility.
 */
const ZONE_CONFIGS: Record<FormatCategory, FormatZones> = {
  // Portrait formats - full logo bars with generous header/footer
  // Used for: event_poster, portrait_poster, flyer_a4, flyer_a5, invitation
  poster_portrait: {
    headerZone: { start: 0, end: 40 },
    contentZone: { start: 40, end: 70 },
    footerZone: { start: 70, end: 100 },
    speakerPhotoZone: { start: 62, end: 78 }
  },

  // Landscape formats - minimal header, more content space
  // Used for: youtube_thumbnail, landscape_poster, video_cover, web_banner
  poster_landscape: {
    headerZone: { start: 0, end: 20 },
    contentZone: { start: 20, end: 75 },
    footerZone: { start: 75, end: 100 },
    speakerPhotoZone: { start: 55, end: 72 }
  },

  // Square formats - balanced header and content
  // Used for: instagram_post, facebook_ad, square_ad
  poster_square: {
    headerZone: { start: 0, end: 30 },
    contentZone: { start: 30, end: 70 },
    footerZone: { start: 70, end: 100 },
    speakerPhotoZone: { start: 55, end: 75 }
  },

  // Certificate - minimal header/footer, maximum content for formal layout
  // Used for: certificate
  certificate: {
    headerZone: { start: 0, end: 15 },
    contentZone: { start: 15, end: 85 },
    footerZone: { start: 85, end: 100 }
    // No speaker photo zone - certificates use signatories instead
  },

  // Social portrait (stories) - tight layout for mobile
  // Used for: instagram_story, instagram_reel, tiktok_cover, whatsapp_status
  social_portrait: {
    headerZone: { start: 0, end: 20 },
    contentZone: { start: 20, end: 80 },
    footerZone: { start: 80, end: 100 }
    // No speaker photo zone - too compact
  },

  // Social landscape (posts) - wide with minimal branding
  // Used for: facebook_post, linkedin_post, twitter_post
  social_landscape: {
    headerZone: { start: 0, end: 15 },
    contentZone: { start: 15, end: 80 },
    footerZone: { start: 80, end: 100 }
    // No speaker photo zone - typically not used
  },

  // Presentations - maximum content space
  // Used for: presentation_16_9, presentation_4_3
  presentation: {
    headerZone: { start: 0, end: 10 },
    contentZone: { start: 10, end: 90 },
    footerZone: { start: 90, end: 100 },
    speakerPhotoZone: { start: 70, end: 88 }
  },

  // Documents - A4/A5 formal layout
  // Used for: letterhead, resume, report_cover, book_cover, brochure
  document: {
    headerZone: { start: 0, end: 10 },
    contentZone: { start: 10, end: 92 },
    footerZone: { start: 92, end: 100 }
    // No speaker photo zone
  },

  // Cards - small formats with compact layout
  // Used for: business_card, email_header
  card: {
    headerZone: { start: 0, end: 15 },
    contentZone: { start: 15, end: 85 },
    footerZone: { start: 85, end: 100 }
    // No speaker photo zone - too small
  },

  // Ultra-wide formats - horizontal composition
  // Used for: billboard, leaderboard_ad, facebook_cover, linkedin_banner
  ultrawide: {
    headerZone: { start: 0, end: 12 },
    contentZone: { start: 12, end: 88 },
    footerZone: { start: 88, end: 100 }
    // No speaker photo zone - horizontal layouts use different positioning
  }
}

// ============================================================================
// Format to Category Mapping
// ============================================================================

/**
 * Maps each format ID to its category
 * This determines which zone configuration is used for each format
 */
const FORMAT_CATEGORY_MAP: Record<string, FormatCategory> = {
  // Portrait poster formats
  event_poster: 'poster_portrait',
  portrait_poster: 'poster_portrait',
  flyer_a4: 'poster_portrait',
  flyer_a5: 'poster_portrait',
  invitation: 'poster_portrait',
  announcement: 'poster_portrait',
  pinterest_pin: 'poster_portrait', // 2:3 ratio, treated as portrait

  // Landscape poster formats
  landscape_poster: 'poster_landscape',
  youtube_thumbnail: 'poster_landscape',
  video_cover: 'poster_landscape',
  web_banner: 'poster_landscape',

  // Square poster formats
  instagram_post: 'poster_square',
  facebook_ad: 'poster_square',
  square_ad: 'poster_square',

  // Certificate
  certificate: 'certificate',

  // Social portrait (stories)
  instagram_story: 'social_portrait',
  instagram_reel: 'social_portrait',
  tiktok_cover: 'social_portrait',
  whatsapp_status: 'social_portrait',

  // Social landscape (posts)
  facebook_post: 'social_landscape',
  linkedin_post: 'social_landscape',
  twitter_post: 'social_landscape',

  // Presentations
  presentation_16_9: 'presentation',
  presentation_4_3: 'presentation',

  // Documents
  letterhead: 'document',
  resume: 'document',
  report_cover: 'document',
  book_cover: 'document',
  brochure: 'document',

  // Cards
  business_card: 'card',
  email_header: 'card',

  // Ultra-wide
  billboard: 'ultrawide',
  leaderboard_ad: 'ultrawide',
  facebook_cover: 'ultrawide',
  linkedin_banner: 'ultrawide',
  twitter_header: 'ultrawide',
  youtube_banner: 'ultrawide',
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get the format category for a given format ID
 * Falls back to 'poster_portrait' for unknown formats (most common)
 */
export function getFormatCategory(formatId: string): FormatCategory {
  return FORMAT_CATEGORY_MAP[formatId] || 'poster_portrait'
}

/**
 * Get zone configuration for a format ID
 */
export function getFormatZones(formatId: string): FormatZones {
  const category = getFormatCategory(formatId)
  return ZONE_CONFIGS[category]
}

/**
 * Get zone configuration with dimension-based category inference
 * Useful when format ID might not match actual dimensions (e.g., custom formats)
 */
export function getFormatZonesWithDimensions(
  formatId: string,
  width: number,
  height: number
): FormatZones & { category: FormatCategory; inferred: boolean } {
  const ratio = width / height

  // Start with format-based category
  let category = getFormatCategory(formatId)
  let inferred = false

  // Override category if dimensions significantly differ from expected
  // This handles custom formats and edge cases
  if (ratio > 2.0 && category !== 'ultrawide') {
    category = 'ultrawide'
    inferred = true
  } else if (ratio > 1.4 && !['poster_landscape', 'social_landscape', 'presentation', 'ultrawide'].includes(category)) {
    category = 'poster_landscape'
    inferred = true
  } else if (ratio < 0.75 && !['poster_portrait', 'social_portrait'].includes(category)) {
    category = 'poster_portrait'
    inferred = true
  } else if (ratio >= 0.95 && ratio <= 1.05 && !['poster_square'].includes(category)) {
    category = 'poster_square'
    inferred = true
  }

  return {
    ...ZONE_CONFIGS[category],
    category,
    inferred
  }
}

/**
 * Check if a format supports speaker photos based on its zone configuration
 */
export function formatHasSpeakerPhotoZone(formatId: string): boolean {
  const zones = getFormatZones(formatId)
  return !!zones.speakerPhotoZone
}

/**
 * Get the content zone boundaries for prompt building
 * Returns values suitable for THREE-BAND COMPOSITION instructions
 */
export function getContentZoneBoundaries(formatId: string): {
  headerEnd: number
  contentStart: number
  contentEnd: number
  footerStart: number
} {
  const zones = getFormatZones(formatId)
  return {
    headerEnd: zones.headerZone.end,
    contentStart: zones.contentZone.start,
    contentEnd: zones.contentZone.end,
    footerStart: zones.footerZone.start
  }
}

/**
 * Get all format IDs for a specific category
 */
export function getFormatsByCategory(category: FormatCategory): string[] {
  return Object.entries(FORMAT_CATEGORY_MAP)
    .filter(([, cat]) => cat === category)
    .map(([formatId]) => formatId)
}

/**
 * Get all available format categories
 */
export function getAllCategories(): FormatCategory[] {
  return Object.keys(ZONE_CONFIGS) as FormatCategory[]
}

/**
 * Check if zones should be applied for a format
 * v7.0: Expanded to enforce zones for all formats that have meaningful zone configs
 * Social media stories and cards skip enforcement (too compact)
 */
export function shouldEnforceZones(formatId: string): boolean {
  const category = getFormatCategory(formatId)
  // v7.0: Enforce zones for most formats except very compact ones
  // These categories need zone enforcement for proper text/logo placement
  const categoriesNeedingEnforcement: FormatCategory[] = [
    'poster_portrait',
    'poster_landscape',
    'poster_square',
    'presentation',       // Slides need header/footer zones
    'ultrawide',          // Banners need safe zones
    'document',           // Documents have header/footer margins
  ]
  return categoriesNeedingEnforcement.includes(category)
}
