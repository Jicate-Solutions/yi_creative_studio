/**
 * Format-Specific Decorative Enhancements
 *
 * Defines smart enhancement rules for template mode.
 * AI will ADD these decorative elements if the template lacks them,
 * WITHOUT changing the core template design.
 *
 * Key Principle: ADD elements, DON'T CHANGE existing ones
 */

export interface FormatEnhancement {
  formatId: string
  category: 'formal' | 'event' | 'social' | 'document' | 'marketing'
  enhancementLevel: 'high' | 'medium' | 'low' | 'none'
  promptFragment: string
}

// ============================================================
// FORMAT ENHANCEMENT RULES
// ============================================================

export const FORMAT_ENHANCEMENTS: Record<string, FormatEnhancement> = {
  // ============================================================
  // FORMAL / CERTIFICATES - High Enhancement
  // ============================================================
  certificate: {
    formatId: 'certificate',
    category: 'formal',
    enhancementLevel: 'high',
    promptFragment: `
DECORATIVE ENHANCEMENT (add if template lacks these):
If this template does not have decorative borders, add an elegant border:
- Gold (#D4AF37) ornate outer border with embossed appearance
- Corner flourishes with classical scrollwork
- Inner accent line in a complementary color
- Keep 8-12% padding from border to content

If template lacks a seal or emblem area:
- Reserve space in corner for official seal
- Add subtle ribbon graphic element

Match the overall color scheme and style of the existing template.
DO NOT change existing colors, backgrounds, or layout - only ADD missing decorative elements.`,
  },

  invitation: {
    formatId: 'invitation',
    category: 'formal',
    enhancementLevel: 'high',
    promptFragment: `
DECORATIVE ENHANCEMENT (add if template lacks these):
If this template does not have decorative elements, add:
- Elegant corner flourishes or floral accents in corners
- Subtle decorative divider lines between text sections
- Delicate border frame that complements the template style

For wedding/formal invitations:
- Consider ornamental script-style dividers
- Add subtle texture or pattern to empty background areas

Match the template's existing color palette and mood.
DO NOT change existing colors or layout - only ADD missing decorative flourishes.`,
  },

  // ============================================================
  // EVENT / POSTERS - Medium Enhancement
  // ============================================================
  event_poster: {
    formatId: 'event_poster',
    category: 'event',
    enhancementLevel: 'medium',
    promptFragment: `
DECORATIVE ENHANCEMENT (add if template lacks these):
If this template lacks visual icons for event details, add small icons:
- Calendar icon near the date
- Clock icon near the time
- Location pin icon near the venue
- Icons should be subtle and match the template's style

If template has large empty spaces:
- Add subtle decorative accent lines or shapes
- Corner badges or decorative elements if appropriate

DO NOT change existing colors, backgrounds, or layout - only ADD helpful visual elements.`,
  },

  portrait_poster: {
    formatId: 'portrait_poster',
    category: 'event',
    enhancementLevel: 'medium',
    promptFragment: `
DECORATIVE ENHANCEMENT (add if template lacks these):
If template has sparse corners or edges:
- Add subtle corner accents or decorative elements
- Consider thin accent border if template has none

If template has a speaker/guest area:
- Ensure proper framing around photo areas
- Add subtle shadow or highlight effects if missing

DO NOT change existing design elements - only ENHANCE with subtle additions.`,
  },

  landscape_poster: {
    formatId: 'landscape_poster',
    category: 'event',
    enhancementLevel: 'medium',
    promptFragment: `
DECORATIVE ENHANCEMENT (add if template lacks these):
If template has wide empty spaces:
- Add subtle decorative dividers or accent lines
- Consider corner flourishes for formal events

If template lacks visual hierarchy helpers:
- Add subtle background shapes to separate sections
- Include accent elements that guide the eye

DO NOT change the core layout - only ADD visual enhancement elements.`,
  },

  // ============================================================
  // SOCIAL MEDIA - Low/No Enhancement
  // ============================================================
  instagram_post: {
    formatId: 'instagram_post',
    category: 'social',
    enhancementLevel: 'low',
    promptFragment: `
MINIMAL ENHANCEMENT:
Social media templates typically need less decoration.
Only add elements if the template looks too plain:
- Subtle corner frame or accent if completely missing
- Small decorative quotation marks for quote posts

Keep the design clean and scroll-stopping.
DO NOT over-decorate - Instagram favors clean, impactful visuals.`,
  },

  instagram_story: {
    formatId: 'instagram_story',
    category: 'social',
    enhancementLevel: 'none',
    promptFragment: `
NO ENHANCEMENT NEEDED:
Stories are fast, casual content. Keep the template as-is.
Only swap the text content without adding decorations.`,
  },

  facebook_post: {
    formatId: 'facebook_post',
    category: 'social',
    enhancementLevel: 'low',
    promptFragment: `
MINIMAL ENHANCEMENT:
Facebook posts should be clean and readable.
Only add subtle framing if the template looks unfinished.
DO NOT over-decorate.`,
  },

  linkedin_post: {
    formatId: 'linkedin_post',
    category: 'social',
    enhancementLevel: 'low',
    promptFragment: `
MINIMAL ENHANCEMENT:
LinkedIn requires professional, clean aesthetics.
If template lacks structure, add:
- Subtle geometric accents or lines
- Clean corner treatments

Keep it corporate and professional.`,
  },

  // ============================================================
  // VIDEO / THUMBNAILS - Low Enhancement
  // ============================================================
  youtube_thumbnail: {
    formatId: 'youtube_thumbnail',
    category: 'marketing',
    enhancementLevel: 'low',
    promptFragment: `
MINIMAL ENHANCEMENT:
Thumbnails need to be bold and eye-catching, not decorative.
If text lacks impact, ensure:
- Text has proper outline or shadow for readability
- High contrast between text and background

DO NOT add ornate decorations - keep it punchy and clickable.`,
  },

  // ============================================================
  // DOCUMENTS - Medium Enhancement
  // ============================================================
  letterhead: {
    formatId: 'letterhead',
    category: 'document',
    enhancementLevel: 'medium',
    promptFragment: `
DECORATIVE ENHANCEMENT (add if template lacks these):
If template lacks professional framing:
- Add subtle header/footer accent lines
- Include corner watermark area if missing
- Add thin border frame for formal appearance

Keep it professional and print-ready.`,
  },

  resume: {
    formatId: 'resume',
    category: 'document',
    enhancementLevel: 'low',
    promptFragment: `
MINIMAL ENHANCEMENT:
Resumes should be clean and readable.
Only add subtle section dividers if missing.
DO NOT add decorative elements that distract from content.`,
  },

  report_cover: {
    formatId: 'report_cover',
    category: 'document',
    enhancementLevel: 'medium',
    promptFragment: `
DECORATIVE ENHANCEMENT (add if template lacks these):
If template lacks professional polish:
- Add subtle corner accents or geometric elements
- Include thin border frame if appropriate
- Add shadow/depth effects to title areas

Keep it corporate and authoritative.`,
  },

  // ============================================================
  // MARKETING - Low Enhancement
  // ============================================================
  web_banner: {
    formatId: 'web_banner',
    category: 'marketing',
    enhancementLevel: 'low',
    promptFragment: `
MINIMAL ENHANCEMENT:
Web banners should be clean and fast-loading visually.
Only add subtle CTA button styling if missing.
Keep the design focused on the message.`,
  },

  flyer_a4: {
    formatId: 'flyer_a4',
    category: 'event',
    enhancementLevel: 'medium',
    promptFragment: `
DECORATIVE ENHANCEMENT (add if template lacks these):
If template looks plain:
- Add decorative border or frame
- Include corner flourishes for formal events
- Add subtle icons for event details (date, time, venue)

Balance decoration with readability.`,
  },

  flyer_a5: {
    formatId: 'flyer_a5',
    category: 'event',
    enhancementLevel: 'medium',
    promptFragment: `
DECORATIVE ENHANCEMENT (add if template lacks these):
Same as A4 flyer - add borders, corners, or icons if missing.
Keep proportions appropriate for smaller size.`,
  },
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Get enhancement prompt for a specific format
 * Returns empty string if format not found or has no enhancements
 */
export function getFormatEnhancement(formatId: string): string {
  const enhancement = FORMAT_ENHANCEMENTS[formatId]
  if (!enhancement || enhancement.enhancementLevel === 'none') {
    return ''
  }
  return enhancement.promptFragment
}

/**
 * Check if a format should receive enhancements
 */
export function shouldEnhanceFormat(formatId: string): boolean {
  const enhancement = FORMAT_ENHANCEMENTS[formatId]
  return enhancement ? enhancement.enhancementLevel !== 'none' : false
}

/**
 * Get enhancement level for a format
 */
export function getEnhancementLevel(formatId: string): 'high' | 'medium' | 'low' | 'none' {
  const enhancement = FORMAT_ENHANCEMENTS[formatId]
  return enhancement?.enhancementLevel || 'none'
}

/**
 * Get all formats in a category
 */
export function getFormatsByCategory(category: FormatEnhancement['category']): string[] {
  return Object.entries(FORMAT_ENHANCEMENTS)
    .filter(([, enhancement]) => enhancement.category === category)
    .map(([formatId]) => formatId)
}
