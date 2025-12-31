/**
 * Typography Hierarchy Rules
 * Per-format typography systems with visual weight scores
 *
 * Defines the relative sizes, weights, and prominence of text elements
 * to ensure proper visual hierarchy in generated designs.
 */

export type { TextHierarchySystem, TypographyHierarchy, FormatId } from '../types'
import type { TextHierarchySystem, TypographyHierarchy, FormatId } from '../types'

// ============================================================
// CERTIFICATE TYPOGRAPHY SYSTEM
// ============================================================

const CERTIFICATE_TYPOGRAPHY: TextHierarchySystem = {
  formatId: 'certificate',
  baseSize: '14pt equivalent',
  mood: 'prestigious, formal, elegant',
  contrast: 'high',
  levels: [
    {
      level: 'hero',
      role: 'recipient_name',
      relativeSize: 3.0,
      weight: 'regular',
      style: 'script',
      spacing: 'normal',
      visualWeight: 100,
      description: 'Flowing calligraphy or elegant script - THE focal point of the certificate',
    },
    {
      level: 'primary',
      role: 'certificate_title',
      relativeSize: 2.0,
      weight: 'bold',
      style: 'serif',
      spacing: 'wide',
      visualWeight: 70,
      description: 'All caps or title case, elegant serif with optional decorative underline',
    },
    {
      level: 'secondary',
      role: 'achievement',
      relativeSize: 1.2,
      weight: 'regular',
      style: 'serif',
      spacing: 'normal',
      visualWeight: 50,
      description: 'Readable serif for achievement/purpose description',
    },
    {
      level: 'tertiary',
      role: 'preface',
      relativeSize: 1.0,
      weight: 'light',
      style: 'serif',
      spacing: 'wide',
      visualWeight: 30,
      description: 'Italic "This is to certify that" preface text',
    },
    {
      level: 'caption',
      role: 'details',
      relativeSize: 0.8,
      weight: 'regular',
      style: 'serif',
      spacing: 'normal',
      visualWeight: 20,
      description: 'Date, certificate number, signatory names',
    },
  ],
  readabilityRules: [
    'Recipient name must be immediately identifiable as largest element',
    'Script fonts only for recipient name - all other text in readable serif',
    'Generous line height for formal documents (1.5-2x)',
    'Center alignment for all text elements',
  ],
  promptFragment: `
CERTIFICATE TYPOGRAPHY GUIDANCE:

The recipient name must be the LARGEST and most prominent text element, using elegant script or calligraphy styling. This is the hero element that the certificate celebrates.

The certificate title should use bold serif typography, smaller than the recipient name but clearly prominent.

Achievement text should be readable and center-aligned, describing what was accomplished.

Preface text like "This is to certify that" should be subtle and in italic serif styling.

Date, number, and signatory information should be the smallest text, placed in the footer area.

The overall mood should be prestigious, authoritative, and worthy of framing.
`,
}

// ============================================================
// EVENT POSTER TYPOGRAPHY SYSTEM
// ============================================================

const EVENT_POSTER_TYPOGRAPHY: TextHierarchySystem = {
  formatId: 'event_poster',
  baseSize: '16pt equivalent',
  mood: 'bold, clear, attention-grabbing',
  contrast: 'high',
  levels: [
    {
      level: 'hero',
      role: 'event_name',
      relativeSize: 3.5,
      weight: 'bold',
      style: 'sans-serif',
      spacing: 'tight',
      visualWeight: 100,
      description: 'Bold impact headline - readable from distance, first thing seen',
    },
    {
      level: 'primary',
      role: 'speaker_name',
      relativeSize: 2.0,
      weight: 'semibold',
      style: 'sans-serif',
      spacing: 'normal',
      visualWeight: 75,
      description: 'Speaker/guest name with designation - answers WHO',
    },
    {
      level: 'secondary',
      role: 'date_time_venue',
      relativeSize: 1.5,
      weight: 'medium',
      style: 'sans-serif',
      spacing: 'normal',
      visualWeight: 60,
      description: 'Event details with icons - answers WHEN and WHERE',
    },
    {
      level: 'tertiary',
      role: 'cta',
      relativeSize: 1.5,
      weight: 'bold',
      style: 'sans-serif',
      spacing: 'wide',
      visualWeight: 70,
      description: 'Call-to-action button text - drives registration/action',
    },
    {
      level: 'caption',
      role: 'organization',
      relativeSize: 1.0,
      weight: 'regular',
      style: 'sans-serif',
      spacing: 'normal',
      visualWeight: 40,
      description: 'Organization name/branding in header or footer',
    },
  ],
  readabilityRules: [
    'Event name must pass the 3-SECOND TEST - instantly readable',
    'Use icons with date/time/venue for quick scanning',
    'CTA must have high contrast background (button style)',
    'All text readable from 2 meters distance',
  ],
  promptFragment: `
EVENT POSTER TYPOGRAPHY GUIDANCE:

The event name must be the LARGEST and most dominant text element - viewers should see it first and understand WHAT the event is instantly. Use bold, impactful typography.

Speaker names should be prominent but clearly secondary to the event name. They establish WHO and credibility.

Date, time, and venue details should be grouped together with clear visual icons for quick scanning. They answer WHEN and WHERE.

The call-to-action text should be bold and high-contrast on a button background to drive action.

Organization or footer text should be subtle - present but not competing with event content.

The design should pass the 3-SECOND TEST where viewers instantly understand WHAT, WHO, WHEN, and WHERE.
`,
}

// ============================================================
// YOUTUBE THUMBNAIL TYPOGRAPHY SYSTEM
// ============================================================

const YOUTUBE_THUMBNAIL_TYPOGRAPHY: TextHierarchySystem = {
  formatId: 'youtube_thumbnail',
  baseSize: '48pt equivalent',
  mood: 'bold, urgent, click-worthy',
  contrast: 'high',
  levels: [
    {
      level: 'hero',
      role: 'hook_text',
      relativeSize: 1.0, // Already maximum - this is THE text
      weight: 'black',
      style: 'sans-serif',
      spacing: 'tight',
      visualWeight: 100,
      description: '3-5 words ONLY, ALL CAPS, thick black outline for readability',
    },
  ],
  readabilityRules: [
    'Maximum 3-5 words - no more',
    'Must be readable at 160x90px (YouTube search result size)',
    'Thick black outline (3-4px) around all text',
    'Yellow, white, or vibrant color only',
    'NO serif fonts, NO thin fonts',
  ],
  promptFragment: `
YOUTUBE THUMBNAIL TYPOGRAPHY GUIDANCE:

Use only 3-5 words maximum - this is hook text that must be instantly readable. Use extra-bold sans-serif typography in ALL CAPS with a thick black outline for visibility against any background. The text color should be bright yellow, white, or a vibrant accent color.

Position the text on the right 40% of the frame while an expressive face occupies the left side. The text must be readable even at 160x90 pixels (tiny thumbnail size).

No other text elements - the face is the primary visual and text supports but doesn't compete with it.
`,
}

// ============================================================
// INSTAGRAM POST TYPOGRAPHY SYSTEM
// ============================================================

const INSTAGRAM_POST_TYPOGRAPHY: TextHierarchySystem = {
  formatId: 'instagram_post',
  baseSize: '24pt equivalent',
  mood: 'bold, scroll-stopping, aesthetic',
  contrast: 'high',
  levels: [
    {
      level: 'hero',
      role: 'headline',
      relativeSize: 2.5,
      weight: 'bold',
      style: 'sans-serif',
      spacing: 'tight',
      visualWeight: 100,
      description: 'Bold headline that stops the scroll - 40%+ of frame height',
    },
    {
      level: 'secondary',
      role: 'supporting_text',
      relativeSize: 1.2,
      weight: 'medium',
      style: 'sans-serif',
      spacing: 'normal',
      visualWeight: 50,
      description: 'Supporting message or context',
    },
    {
      level: 'tertiary',
      role: 'cta_hashtag',
      relativeSize: 1.0,
      weight: 'regular',
      style: 'sans-serif',
      spacing: 'normal',
      visualWeight: 40,
      description: 'Call-to-action or branded hashtag',
    },
  ],
  readabilityRules: [
    'Headline must be readable while thumb-scrolling',
    'Text should cover 40%+ of frame for impact',
    'High contrast between text and background',
    'Mobile-first - readable without zooming',
  ],
  promptFragment: `
INSTAGRAM POST TYPOGRAPHY GUIDANCE:

The headline must be bold and scroll-stopping - it should fill approximately 40% of the frame height and be the first thing a thumb notices while scrolling. Use bold sans-serif typography with high contrast.

Supporting text below the headline provides context and should be noticeably smaller but still readable.

Call-to-action or branded hashtag text should be at the bottom, smaller and subtle.

All text must be readable on a mobile phone screen without zooming. Design mobile-first.
`,
}

// ============================================================
// LINKEDIN POST TYPOGRAPHY SYSTEM
// ============================================================

const LINKEDIN_POST_TYPOGRAPHY: TextHierarchySystem = {
  formatId: 'linkedin_post',
  baseSize: '18pt equivalent',
  mood: 'professional, credible, thought-leadership',
  contrast: 'medium',
  levels: [
    {
      level: 'hero',
      role: 'headline',
      relativeSize: 2.0,
      weight: 'semibold',
      style: 'sans-serif',
      spacing: 'normal',
      visualWeight: 100,
      description: 'Professional headline - thought-leadership statement',
    },
    {
      level: 'secondary',
      role: 'insight',
      relativeSize: 1.3,
      weight: 'regular',
      style: 'sans-serif',
      spacing: 'normal',
      visualWeight: 60,
      description: 'Key insight or supporting point',
    },
    {
      level: 'caption',
      role: 'author',
      relativeSize: 0.9,
      weight: 'regular',
      style: 'sans-serif',
      spacing: 'normal',
      visualWeight: 30,
      description: 'Author attribution or source',
    },
  ],
  readabilityRules: [
    'Professional tone - no shouty ALL CAPS',
    'Clean, sophisticated typography',
    'Data/statistics prominently displayed when relevant',
    'Avoid casual or playful fonts',
  ],
  promptFragment: `
LINKEDIN POST TYPOGRAPHY GUIDANCE:

The headline should use professional, medium-weight sans-serif typography - authoritative but not shouty (avoid ALL CAPS). Clean and sophisticated styling.

Key insight or supporting text should be clearly secondary to the headline but readable, providing data or context.

Author or source attribution should be subtle and small, adding credibility without distracting.

The overall design should feel like it comes from a professional business publication - sophisticated, credible, thought-leadership quality.
`,
}

// ============================================================
// TYPOGRAPHY SYSTEMS REGISTRY
// ============================================================

export const TYPOGRAPHY_HIERARCHY_SYSTEMS: Record<string, TextHierarchySystem> = {
  certificate: CERTIFICATE_TYPOGRAPHY,
  event_poster: EVENT_POSTER_TYPOGRAPHY,
  youtube_thumbnail: YOUTUBE_THUMBNAIL_TYPOGRAPHY,
  instagram_post: INSTAGRAM_POST_TYPOGRAPHY,
  instagram: INSTAGRAM_POST_TYPOGRAPHY,
  linkedin_post: LINKEDIN_POST_TYPOGRAPHY,
  linkedin: LINKEDIN_POST_TYPOGRAPHY,
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Get typography system for a format
 */
export function getTypographySystem(formatId: string): TextHierarchySystem | undefined {
  const normalized = formatId.toLowerCase().replace(/[-\s]/g, '_')
  return TYPOGRAPHY_HIERARCHY_SYSTEMS[normalized]
}

/**
 * Get typography prompt fragment for a format
 */
export function getTypographyPromptFragment(formatId: string): string {
  const system = getTypographySystem(formatId)
  return system?.promptFragment || ''
}

/**
 * Get visual weight for a specific role in a format
 */
export function getVisualWeight(formatId: string, role: string): number {
  const system = getTypographySystem(formatId)
  if (!system) return 50 // Default middle weight

  const level = system.levels.find((l) => l.role === role)
  return level?.visualWeight || 50
}

/**
 * Get all available format typography systems
 */
export function getAvailableTypographySystems(): string[] {
  return Object.keys(TYPOGRAPHY_HIERARCHY_SYSTEMS)
}
