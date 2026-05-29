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

/**
 * Director-facing profile for the Forge Creative Director (lib/agents/forge-creative-director.ts).
 *
 * The Director's system prompt is written for a 1080×1440 vertical poster — it tells Gemini to
 * keep the "top 40% / bottom 18%" empty for composited logo bars. That layout is WRONG for a square
 * Instagram post or a wide Facebook cover. This profile gives the Director (and the assembler) the
 * canvas SHAPE, the format's JOB, and the EXACT reserve bands to keep atmospheric — so every format
 * composes to its own shape instead of a tall poster.
 *
 * `event_poster` (poster_portrait) reproduces the current behaviour exactly: reserveTopPct=40 →
 * 1440×0.40 = 576px, reserveBottomPct=18. Other categories get shape-appropriate bands.
 */
export interface DirectorProfile {
  /** One-line canvas shape, e.g. "a square 1:1 social post". Used in the Director's FORMAT PROFILE block. */
  shape: string
  /** One-line statement of the format's job, e.g. a scroll-stopping feed post vs a formal certificate. */
  purpose: string
  /**
   * % of canvas HEIGHT to keep as quiet atmospheric background at the TOP (for a composited logo bar).
   * Anchored to headerZone.end so the Director's reserve aligns with the spatial verifier's detection zone.
   */
  reserveTopPct: number
  /**
   * % of canvas HEIGHT to keep quiet at the BOTTOM (for a composited footer strip).
   * Explicit per category; the route's forbidden-zone footer threshold is 100 - reserveBottomPct.
   */
  reserveBottomPct: number
  /**
   * Whether a Yi footer strip (hashtag / website / social handle / partner logos) is composited for
   * this format. When false, the assembler does NOT tell Gemini to avoid that content — formats like
   * business cards and thumbnails legitimately carry their own contact / CTA text.
   */
  footerStripActive: boolean
  /** Optional extra composition guidance unique to the shape (e.g. Facebook cover profile-photo occlusion). */
  safeZoneNotes?: string
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

/**
 * Director profiles per format category.
 *
 * reserveTopPct mirrors each category's headerZone.end (keeps Director reserve aligned with the
 * spatial verifier's header detection zone). reserveBottomPct is set explicitly — poster_portrait
 * MUST stay 18 so event_poster output is unchanged (the forbidden-zone footer threshold derives from
 * 100 - reserveBottomPct = 82, matching the legacy value).
 */
const DIRECTOR_PROFILES: Record<FormatCategory, DirectorProfile> = {
  poster_portrait: {
    shape: 'a tall vertical poster (portrait, roughly 3:4 to 4:5)',
    purpose:
      'a premium event/announcement poster — a clear hero, a dominant headline, and supporting details stacked in the lower-middle band.',
    reserveTopPct: 40,
    reserveBottomPct: 18,
    footerStripActive: true,
  },
  poster_landscape: {
    shape: 'a wide landscape key visual (roughly 16:9)',
    purpose:
      'a wide, punchy key visual — ONE strong focal point (an expressive face or object) plus a few genuinely LARGE words, instantly readable even at small thumbnail size.',
    reserveTopPct: 20,
    reserveBottomPct: 14,
    footerStripActive: false,
    safeZoneNotes:
      'Landscape: keep the composition horizontally balanced; the focal subject can sit to one side with the headline filling the other.',
  },
  poster_square: {
    shape: 'a square 1:1 social feed post',
    purpose:
      'a scroll-stopping square feed post — one bold central focal point, breathing room for a short punchy headline, legible as a small thumbnail.',
    reserveTopPct: 30,
    reserveBottomPct: 14,
    footerStripActive: true,
  },
  certificate: {
    shape: 'a formal landscape certificate (roughly 4:3)',
    purpose:
      'a formal certificate — a centred, symmetrical, ornate-but-restrained layout with generous margins and an elegant border; calm, official, ceremonial.',
    reserveTopPct: 15,
    reserveBottomPct: 12,
    footerStripActive: false,
    safeZoneNotes:
      'Certificate: centre the composition symmetrically; leave clear horizontal space mid-lower for the recipient name and signatory lines.',
  },
  social_portrait: {
    shape: 'a tall 9:16 vertical story / reel cover',
    purpose:
      'a full-screen vertical mobile story — one immersive focal subject filling the frame, a short bold headline, designed to be glanced at in seconds.',
    reserveTopPct: 20,
    reserveBottomPct: 14,
    footerStripActive: true,
    safeZoneNotes:
      'Story: keep the very top and very bottom clear of essential content — platform UI (profile chip, reply bar) overlays those edges.',
  },
  social_landscape: {
    shape: 'a wide landscape social post (roughly 1.91:1)',
    purpose:
      'a wide feed post / link card — a confident horizontal composition with the focal subject on one side and a strong headline on the other.',
    reserveTopPct: 15,
    reserveBottomPct: 12,
    footerStripActive: true,
  },
  presentation: {
    shape: 'a 16:9 presentation slide',
    purpose:
      'a clean presentation slide — generous content space, a clear title area, restrained decoration, professional and legible from a distance.',
    reserveTopPct: 10,
    reserveBottomPct: 10,
    footerStripActive: false,
  },
  document: {
    shape: 'an A4/A5 document page (portrait)',
    purpose:
      'a formal document cover/page — structured margins, a clear title block, restrained professional layout.',
    reserveTopPct: 10,
    reserveBottomPct: 8,
    footerStripActive: false,
  },
  card: {
    shape: 'a small card (e.g. a business card)',
    purpose:
      'a compact card — minimal, precise, high-contrast; a small number of elements with deliberate spacing. Contact details are part of the design here.',
    reserveTopPct: 15,
    reserveBottomPct: 12,
    footerStripActive: false,
  },
  ultrawide: {
    shape: 'an ultra-wide cover / banner (roughly 21:9 or wider)',
    purpose:
      'a wide cinematic cover banner — a panoramic horizontal scene with the headline and focal interest weighted to one region, lots of calm negative space elsewhere.',
    reserveTopPct: 12,
    reserveBottomPct: 10,
    footerStripActive: false,
    safeZoneNotes:
      'Cover banner: keep the lower-left region calmer — on Facebook/LinkedIn the profile photo and page name overlap that corner.',
  },
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
 * Get the Director profile (canvas shape, format job, reserve bands) for a format ID.
 * Falls back to poster_portrait for unknown formats — same default as getFormatCategory, so an
 * unmapped format behaves exactly like event_poster (the historical default).
 */
export function getFormatProfile(formatId: string): DirectorProfile {
  const category = getFormatCategory(formatId)
  return DIRECTOR_PROFILES[category]
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
