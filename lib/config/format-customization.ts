/**
 * Format Customization Config
 * YiCreatives Studio
 *
 * Defines which customization options are available for each creative format.
 * This ensures Optional Settings (Speaker Photo, Footer) only appear when relevant.
 */

// ============================================================================
// Types
// ============================================================================

export interface FormatCustomizationOptions {
  /** Whether format supports speaker photo upload & overlay */
  speakerPhoto: boolean
  /** Whether format supports footer settings */
  footer: boolean
}

// ============================================================================
// Format Customization Mappings
// ============================================================================

/**
 * Defines which customization options are available per format
 *
 * Guidelines:
 * - speakerPhoto: true for formats with speakers/presenters (events, presentations)
 * - footer: true for formats with enough space for footer area (posters, flyers)
 * - Both false: social media (too small), certificates (use signatories instead)
 */
export const FORMAT_CUSTOMIZATION: Record<string, FormatCustomizationOptions> = {
  // ---------------------------------------------------------------------------
  // EVENT FORMATS - Full customization
  // ---------------------------------------------------------------------------
  event_poster: { speakerPhoto: true, footer: true },
  portrait_poster: { speakerPhoto: true, footer: true },
  landscape_poster: { speakerPhoto: true, footer: true },
  invitation: { speakerPhoto: true, footer: true },
  announcement: { speakerPhoto: false, footer: true }, // Announcements rarely have speaker photos

  // ---------------------------------------------------------------------------
  // PRINT FORMATS - Varies by type
  // ---------------------------------------------------------------------------
  flyer_a4: { speakerPhoto: true, footer: true },
  flyer_a5: { speakerPhoto: true, footer: true },
  brochure: { speakerPhoto: false, footer: true },
  letterhead: { speakerPhoto: false, footer: true },
  business_card: { speakerPhoto: false, footer: false }, // Too small
  resume: { speakerPhoto: false, footer: false }, // Resume has its own structure

  // ---------------------------------------------------------------------------
  // PRESENTATION FORMATS - Speaker photo only
  // ---------------------------------------------------------------------------
  presentation_16_9: { speakerPhoto: true, footer: false },
  presentation_4_3: { speakerPhoto: true, footer: false },

  // ---------------------------------------------------------------------------
  // VIDEO FORMATS - Varies
  // ---------------------------------------------------------------------------
  video_cover: { speakerPhoto: true, footer: false },
  youtube_thumbnail: { speakerPhoto: false, footer: false }, // Thumbnails are self-contained
  youtube_banner: { speakerPhoto: false, footer: false },

  // ---------------------------------------------------------------------------
  // SOCIAL MEDIA FORMATS - NO customization (too small, specific layouts)
  // ---------------------------------------------------------------------------
  instagram_post: { speakerPhoto: false, footer: false },
  instagram_story: { speakerPhoto: false, footer: false },
  instagram_reel: { speakerPhoto: false, footer: false },
  facebook_post: { speakerPhoto: false, footer: false },
  facebook_cover: { speakerPhoto: false, footer: false },
  facebook_ad: { speakerPhoto: false, footer: false },
  linkedin_post: { speakerPhoto: false, footer: false },
  linkedin_banner: { speakerPhoto: false, footer: false },
  twitter_post: { speakerPhoto: false, footer: false },
  twitter_header: { speakerPhoto: false, footer: false },
  pinterest_pin: { speakerPhoto: false, footer: false },
  tiktok_cover: { speakerPhoto: false, footer: false },
  whatsapp_status: { speakerPhoto: false, footer: false },

  // ---------------------------------------------------------------------------
  // CERTIFICATE FORMATS - NO speaker photo (uses signatories instead)
  // ---------------------------------------------------------------------------
  certificate: { speakerPhoto: false, footer: false },

  // ---------------------------------------------------------------------------
  // MARKETING FORMATS - Minimal customization
  // ---------------------------------------------------------------------------
  web_banner: { speakerPhoto: false, footer: false },
  email_header: { speakerPhoto: false, footer: false },
  billboard: { speakerPhoto: false, footer: true },
  leaderboard_ad: { speakerPhoto: false, footer: false },
  square_ad: { speakerPhoto: false, footer: false },

  // ---------------------------------------------------------------------------
  // DOCUMENT FORMATS - Minimal customization
  // ---------------------------------------------------------------------------
  report_cover: { speakerPhoto: false, footer: false },
  book_cover: { speakerPhoto: false, footer: false },
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get customization options for a specific format
 * Returns safe defaults if format is not found
 */
export function getFormatCustomizationOptions(formatId: string): FormatCustomizationOptions {
  return FORMAT_CUSTOMIZATION[formatId] || { speakerPhoto: false, footer: false }
}

/**
 * Check if a format supports any customization options
 */
export function formatHasCustomization(formatId: string): boolean {
  const options = getFormatCustomizationOptions(formatId)
  return options.speakerPhoto || options.footer
}

/**
 * Check if a format supports speaker photo
 */
export function formatSupportsSpeakerPhoto(formatId: string): boolean {
  return getFormatCustomizationOptions(formatId).speakerPhoto
}

/**
 * Check if a format supports footer settings
 */
export function formatSupportsFooter(formatId: string): boolean {
  return getFormatCustomizationOptions(formatId).footer
}

/**
 * Get all format IDs that support speaker photo
 */
export function getFormatsWithSpeakerPhoto(): string[] {
  return Object.entries(FORMAT_CUSTOMIZATION)
    .filter(([, options]) => options.speakerPhoto)
    .map(([formatId]) => formatId)
}

/**
 * Get all format IDs that support footer
 */
export function getFormatsWithFooter(): string[] {
  return Object.entries(FORMAT_CUSTOMIZATION)
    .filter(([, options]) => options.footer)
    .map(([formatId]) => formatId)
}
