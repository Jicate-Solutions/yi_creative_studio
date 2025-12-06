/**
 * Typography Hierarchy Rules
 * Per-format typography systems with visual weight scores
 *
 * Defines the relative sizes, weights, and prominence of text elements
 * to ensure proper visual hierarchy in generated designs.
 */

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
CERTIFICATE TYPOGRAPHY HIERARCHY:
═══════════════════════════════════════════════════════════════════════════════

VISUAL WEIGHT DISTRIBUTION:
┌─────────────────────────────────────────────────────────────────────────────┐
│ RECIPIENT NAME (Hero, Weight: 100)                                          │
│ - Size: 3x base (LARGEST element on entire document)                        │
│ - Style: Elegant script/calligraphy for classic, bold serif for modern      │
│ - Treatment: Decorative flourishes above/below, may have underline          │
│                                                                              │
│ CERTIFICATE TITLE (Primary, Weight: 70)                                     │
│ - Size: 2x base                                                              │
│ - Style: Bold serif, ALL CAPS or Title Case                                 │
│ - Treatment: Wide letter spacing, optional decorative underline             │
│                                                                              │
│ ACHIEVEMENT TEXT (Secondary, Weight: 50)                                    │
│ - Size: 1.2x base                                                            │
│ - Style: Regular serif, readable                                             │
│ - Treatment: Center-aligned, may wrap 2-3 lines                             │
│                                                                              │
│ PREFACE "This is to certify that" (Tertiary, Weight: 30)                   │
│ - Size: 1x base                                                              │
│ - Style: Italic serif, light weight                                         │
│ - Treatment: Subtle, introduces recipient name                              │
│                                                                              │
│ DATE/NUMBER/SIGNATORIES (Caption, Weight: 20)                              │
│ - Size: 0.8x base                                                            │
│ - Style: Small caps or regular serif                                        │
│ - Treatment: Footer placement, supporting information                       │
└─────────────────────────────────────────────────────────────────────────────┘

FONT PAIRING: Script (recipient) + Elegant Serif (all other text)
MOOD: Prestigious, authoritative, worthy of framing
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
EVENT POSTER TYPOGRAPHY HIERARCHY:
═══════════════════════════════════════════════════════════════════════════════

VISUAL WEIGHT DISTRIBUTION (3-SECOND TEST):
┌─────────────────────────────────────────────────────────────────────────────┐
│ EVENT NAME (Hero, Weight: 100) - DOMINANT                                   │
│ - Size: 3.5x base (LARGEST, readable from distance)                         │
│ - Style: Bold impact sans-serif, may be ALL CAPS                            │
│ - Position: Upper-center, hero zone                                         │
│ - Viewer sees this FIRST - answers WHAT                                     │
│                                                                              │
│ SPEAKER NAME (Primary, Weight: 75)                                          │
│ - Size: 2x base                                                              │
│ - Style: Semibold sans-serif with designation                               │
│ - Position: Below headline or with photo zone                               │
│ - Answers WHO - credibility and authority                                   │
│                                                                              │
│ CTA BUTTON (Tertiary, Weight: 70)                                           │
│ - Size: 1.5x base, bold                                                      │
│ - Style: ALL CAPS on high-contrast button background                        │
│ - Position: Bottom action zone, prominent                                   │
│ - Drives action: "REGISTER NOW", "JOIN US", etc.                            │
│                                                                              │
│ DATE/TIME/VENUE (Secondary, Weight: 60)                                     │
│ - Size: 1.5x base                                                            │
│ - Style: Medium weight with icons (📅 🕐 📍)                                 │
│ - Position: Details zone, stacked or inline                                 │
│ - Answers WHEN and WHERE - instantly scannable                              │
│                                                                              │
│ ORGANIZATION (Caption, Weight: 40)                                          │
│ - Size: 1x base                                                              │
│ - Style: Regular, brand-consistent                                          │
│ - Position: Header (with logo) or footer                                    │
│ - Present but not competing with event content                              │
└─────────────────────────────────────────────────────────────────────────────┘

EYE FLOW: Event Name → Speaker → Date/Venue → CTA
3-SECOND TEST: WHAT, WHO, WHEN, WHERE understood in 3 seconds
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
YOUTUBE THUMBNAIL TYPOGRAPHY:
═══════════════════════════════════════════════════════════════════════════════

SINGLE TEXT ELEMENT - HOOK TEXT ONLY:
┌─────────────────────────────────────────────────────────────────────────────┐
│ HOOK TEXT (Hero, Weight: 100) - THE ONLY TEXT                               │
│                                                                              │
│ - Words: 3-5 MAXIMUM (fewer is better)                                      │
│ - Style: Extra-bold/black sans-serif (Impact-style)                         │
│ - Case: ALL CAPS                                                             │
│ - Outline: Thick black stroke (3-4px) for visibility                        │
│ - Color: Bright yellow (#FFFF00), white, or vibrant accent                  │
│ - Position: Right 40% of frame (face on left 60%)                           │
│                                                                              │
│ READABLE AT: 160x90 pixels (YouTube search result thumbnail)                │
│ This text must be visible and legible even at tiny sizes                    │
└─────────────────────────────────────────────────────────────────────────────┘

CRITICAL: No other text elements. Face is the primary visual.
Text supports but doesn't compete with expressive face.
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
INSTAGRAM POST TYPOGRAPHY:
═══════════════════════════════════════════════════════════════════════════════

SCROLL-STOPPING TEXT HIERARCHY:
┌─────────────────────────────────────────────────────────────────────────────┐
│ HEADLINE (Hero, Weight: 100)                                                 │
│ - Size: 2.5x base (fills 40%+ of frame height)                              │
│ - Style: Bold sans-serif, may be ALL CAPS                                   │
│ - Treatment: High contrast, centered or dynamic placement                   │
│ - Purpose: STOP THE SCROLL - first thing thumb notices                      │
│                                                                              │
│ SUPPORTING TEXT (Secondary, Weight: 50)                                     │
│ - Size: 1.2x base                                                            │
│ - Style: Medium sans-serif                                                   │
│ - Treatment: Below headline, context or detail                              │
│                                                                              │
│ CTA/HASHTAG (Tertiary, Weight: 40)                                          │
│ - Size: 1x base                                                              │
│ - Treatment: Bottom of frame, branded element                               │
└─────────────────────────────────────────────────────────────────────────────┘

MOBILE RULE: All text readable on phone screen without zooming
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
LINKEDIN POST TYPOGRAPHY:
═══════════════════════════════════════════════════════════════════════════════

PROFESSIONAL THOUGHT-LEADERSHIP HIERARCHY:
┌─────────────────────────────────────────────────────────────────────────────┐
│ HEADLINE (Hero, Weight: 100)                                                 │
│ - Size: 2x base                                                              │
│ - Style: Semibold professional sans-serif (NOT bold/shouty)                 │
│ - Treatment: Clean, sophisticated, authoritative                            │
│                                                                              │
│ KEY INSIGHT (Secondary, Weight: 60)                                         │
│ - Size: 1.3x base                                                            │
│ - Style: Regular sans-serif                                                  │
│ - Treatment: Supporting the headline with data or context                   │
│                                                                              │
│ AUTHOR/SOURCE (Caption, Weight: 30)                                         │
│ - Size: 0.9x base                                                            │
│ - Style: Subtle, professional                                                │
│ - Treatment: Attribution or credibility indicator                           │
└─────────────────────────────────────────────────────────────────────────────┘

PROFESSIONAL RULE: Design should look like it came from
McKinsey, Harvard Business Review, or Fortune 500 company
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
