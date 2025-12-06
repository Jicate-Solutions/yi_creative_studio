/**
 * Platform Scroll-Stop Patterns
 * Platform-specific engagement techniques for social media
 *
 * Defines psychology, techniques, and anti-patterns for each
 * major social platform to maximize engagement and visibility.
 */

import type { PlatformPattern, PlatformId } from '../types'

// ============================================================
// INSTAGRAM PATTERNS
// ============================================================

const INSTAGRAM_PATTERNS: PlatformPattern = {
  platform: 'instagram',
  psychology: 'Visual-first platform, aesthetic-driven engagement. Users scroll quickly with thumb.',

  scrollStopTechniques: [
    {
      technique: 'Color Pop',
      description: 'Use one unexpected bright color against neutral background',
      implementation: 'Vibrant coral (#FF6B6B), electric blue (#00BFFF), or lime green accent on white/gray',
      effectiveness: 'High',
    },
    {
      technique: 'Bold Typography',
      description: 'Oversized bold text that fills 40%+ of frame',
      implementation: 'Thick sans-serif, high contrast, readable while scrolling',
      effectiveness: 'High',
    },
    {
      technique: 'Human Face with Emotion',
      description: 'Expressive face making direct eye contact',
      implementation: 'Face fills 50%+ of frame, genuine emotional expression',
      effectiveness: 'Very High',
    },
    {
      technique: 'Pattern Break',
      description: 'Design that looks different from typical feed content',
      implementation: 'Bold graphics, unusual color combinations, generous white space',
      effectiveness: 'High',
    },
    {
      technique: 'Unexpected Scale',
      description: 'Objects at unusual scale create curiosity',
      implementation: 'Macro shots, extreme close-ups, unusual perspectives',
      effectiveness: 'Medium-High',
    },
  ],

  colorPsychology: [
    { emotion: 'energy', colors: ['#FF6B6B', '#FF8E72', '#FFA07A'], usage: 'CTAs, highlights, urgency' },
    { emotion: 'trust', colors: ['#4ECDC4', '#45B7D1', '#96CEB4'], usage: 'Professional content, testimonials' },
    { emotion: 'luxury', colors: ['#2C3E50', '#8E44AD', '#C0B283'], usage: 'Premium offerings, exclusive content' },
    { emotion: 'optimism', colors: ['#F7DC6F', '#F8B500', '#FFD93D'], usage: 'Announcements, celebrations' },
    { emotion: 'calm', colors: ['#A8E6CF', '#B5EAD7', '#E8F8F5'], usage: 'Wellness, mindfulness content' },
  ],

  safeZones: [
    { area: 'Center 70%', reason: 'Primary content zone for all views', avoidance: [] },
    { area: 'Corners', reason: 'Avatar/like overlays on some views', avoidance: ['critical text', 'small details'] },
  ],

  antiPatterns: [
    'Tiny text requiring zoom to read',
    'Cluttered compositions with 5+ competing elements',
    'Low contrast that blends into typical feed',
    'Stock photo aesthetic (looks generic)',
    'Thin/light fonts that disappear',
    'Muted/pastel colors that dont pop',
    'Horizontal layouts in square frame',
  ],

  promptFragment: `
INSTAGRAM SCROLL-STOP DESIGN RULES:
═══════════════════════════════════════════════════════════════════════════════

PSYCHOLOGY: Visual-first, thumb-scrolling, aesthetic-driven

SCROLL-STOP TECHNIQUES:
1. COLOR POP: Use ONE vibrant accent color against clean background
   - Coral (#FF6B6B), electric blue (#00BFFF), lime green
   - Creates pattern interrupt in monotonous feed

2. BOLD TYPOGRAPHY: Text fills 40%+ of frame height
   - Thick sans-serif, high contrast
   - Readable while thumb is moving

3. PATTERN BREAK: Look DIFFERENT from typical feed
   - Bold graphics, unusual compositions
   - Generous white space stands out

4. SINGLE FOCAL POINT: One clear thing to look at
   - Not 5 competing elements
   - Eye knows exactly where to go

COLOR PSYCHOLOGY:
- Energy/Urgency: Coral, orange, red tones → CTAs
- Trust: Teal, blue-green → Professional content
- Optimism: Yellow, gold → Announcements
- AVOID: Muddy browns, muted grays that blend into feed

MOBILE-FIRST RULES:
- All text readable on phone WITHOUT zooming
- High contrast between text and background
- Simple, clean compositions
- Touch-friendly visual hierarchy

ANTI-PATTERNS TO AVOID:
- Tiny text, low contrast, cluttered layouts
- Stock photo aesthetic, thin fonts
- Muted colors that disappear in feed
`,
}

// ============================================================
// YOUTUBE THUMBNAIL PATTERNS
// ============================================================

const YOUTUBE_THUMBNAIL_PATTERNS: PlatformPattern = {
  platform: 'youtube_thumbnail',
  psychology: 'Click-competition with 100s of other videos. CTR is king. Must work at 160x90px.',

  scrollStopTechniques: [
    {
      technique: 'Expressive Face',
      description: 'Exaggerated human expression filling 50%+ of frame',
      implementation: 'Surprised, excited, shocked expressions with wide eyes, open mouth',
      effectiveness: 'Very High',
    },
    {
      technique: 'Bold Outlined Text',
      description: '3-5 words max with thick black outline',
      implementation: 'ALL CAPS, thick sans-serif (Impact-style), 3-4px black stroke',
      effectiveness: 'High',
    },
    {
      technique: 'High Saturation Colors',
      description: 'Bright, saturated colors that pop in search results',
      implementation: 'Yellow (#FFFF00), red (#FF0000), blue (#00BFFF) - NO pastels',
      effectiveness: 'High',
    },
    {
      technique: 'Curiosity Gap',
      description: 'Visual that creates question in viewer mind',
      implementation: 'Partial reveals, unexpected juxtapositions, before/after hints',
      effectiveness: 'High',
    },
    {
      technique: 'Contrast Split',
      description: 'Clear visual separation between face and text zones',
      implementation: 'Face on left 60%, text on right 40% with contrasting backgrounds',
      effectiveness: 'Medium-High',
    },
  ],

  colorPsychology: [
    { emotion: 'click_trigger', colors: ['#FFFF00', '#FF0000', '#00BFFF'], usage: 'Text, accents, highlights' },
    { emotion: 'authority', colors: ['#1A1A2E', '#16213E', '#0F3460'], usage: 'Backgrounds' },
    { emotion: 'excitement', colors: ['#E94560', '#FF6B6B', '#FF8E72'], usage: 'Urgency indicators, arrows' },
  ],

  safeZones: [
    { area: 'Bottom-right 15%', reason: 'YouTube duration badge overlay', avoidance: ['all content'] },
    { area: 'Bottom 10%', reason: 'Progress bar on hover', avoidance: ['critical text'] },
  ],

  antiPatterns: [
    'Small faces that dont fill frame',
    'More than 5 words of text',
    'Thin fonts without outline',
    'Muted/pastel colors',
    'Complex or busy backgrounds',
    'Content in bottom-right corner (duration badge)',
    'Neutral facial expressions',
    'Text that cant be read at 160x90px',
  ],

  promptFragment: `
YOUTUBE THUMBNAIL SCROLL-STOP DESIGN RULES:
═══════════════════════════════════════════════════════════════════════════════

PSYCHOLOGY: Click-competition, CTR is everything, works at 160x90px

COMPOSITION FORMULA:
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│   ┌──────────────────────┐   ┌────────────────────────┐                    │
│   │                      │   │                        │                    │
│   │   EXPRESSIVE FACE    │   │    HOOK TEXT           │                    │
│   │   (50-60% of frame)  │   │    3-5 WORDS           │                    │
│   │                      │   │    ALL CAPS            │                    │
│   │   - Wide eyes        │   │    BLACK OUTLINE       │                    │
│   │   - Emotion showing  │   │                        │                    │
│   │   - Direct eye       │   │    BRIGHT COLOR        │                    │
│   │     contact          │   │    (Yellow/White)      │                    │
│   │                      │   │                        │                    │
│   └──────────────────────┘   └────────────────────────┘                    │
│                                                                              │
│   LEFT 60%                    RIGHT 40%           [KEEP EMPTY - duration]   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

CRITICAL RULES:
1. FACE: Expressive face fills 50-60% of frame (LEFT side)
   - Expression: Surprised, excited, shocked (wide eyes, open mouth)
   - Eye contact: Looking at viewer

2. TEXT: 3-5 words MAXIMUM
   - Style: Extra-bold sans-serif (Impact-style)
   - Case: ALL CAPS
   - Outline: Thick black stroke (3-4px)
   - Color: Bright yellow, white, or vibrant accent

3. COLORS: Bright, saturated (NO pastels)
   - Yellow (#FFFF00), Red (#FF0000), Blue (#00BFFF)
   - High contrast between face and background

4. BOTTOM-RIGHT: KEEP COMPLETELY EMPTY
   - YouTube places duration badge here
   - Any content will be covered

READABLE AT: 160x90 pixels (YouTube search result size)
`,
}

// ============================================================
// LINKEDIN PATTERNS
// ============================================================

const LINKEDIN_PATTERNS: PlatformPattern = {
  platform: 'linkedin',
  psychology: 'Professional context, thought-leadership driven. Users seek insights and credibility.',

  scrollStopTechniques: [
    {
      technique: 'Data Visualization',
      description: 'Charts, statistics that showcase insight',
      implementation: 'Clean graphs with highlighted key numbers, minimal decoration',
      effectiveness: 'High',
    },
    {
      technique: 'Professional Minimalism',
      description: 'Clean, sophisticated design that respects viewers time',
      implementation: 'White space, single message, quality imagery, no clutter',
      effectiveness: 'High',
    },
    {
      technique: 'Authority Statement',
      description: 'Bold statement that positions thought leadership',
      implementation: 'Clean serif or sans-serif, not shouty, professional tone',
      effectiveness: 'Medium-High',
    },
    {
      technique: 'Quote Card',
      description: 'Attributed insight or wisdom',
      implementation: 'Large quote marks, clean typography, author attribution',
      effectiveness: 'Medium-High',
    },
  ],

  colorPsychology: [
    { emotion: 'professional', colors: ['#0077B5', '#004182', '#283E4A'], usage: 'Primary elements, LinkedIn blue' },
    { emotion: 'credibility', colors: ['#2C3E50', '#34495E', '#5D6D7E'], usage: 'Text, backgrounds' },
    { emotion: 'insight', colors: ['#F39C12', '#D4AC0D', '#B7950B'], usage: 'Highlight key data, gold accents' },
    { emotion: 'success', colors: ['#27AE60', '#2ECC71', '#58D68D'], usage: 'Growth indicators, positive stats' },
  ],

  safeZones: [
    { area: 'Full frame', reason: 'Clean professional space', avoidance: ['casual elements'] },
  ],

  antiPatterns: [
    'Flashy/salesy graphics',
    'Casual or playful fonts',
    'Meme-style content',
    'Aggressive CTAs (BUY NOW, LIMITED TIME)',
    'Stock photo cliches (handshake, team high-five)',
    'Rainbow colors or neon',
    'Emoji overuse',
    'Cluttered layouts',
  ],

  promptFragment: `
LINKEDIN PROFESSIONAL DESIGN RULES:
═══════════════════════════════════════════════════════════════════════════════

PSYCHOLOGY: Professional context, thought-leadership, credibility-focused

DESIGN PRINCIPLES:
1. SOPHISTICATED MINIMALISM
   - Generous white space shows respect for viewer
   - Single clear message, not cluttered
   - Quality over quantity of visual elements

2. PROFESSIONAL TYPOGRAPHY
   - Clean sans-serif or elegant serif
   - NOT casual or playful fonts
   - NOT shouty ALL CAPS for main text
   - Semibold for headlines, not extra-bold

3. CREDIBLE COLOR PALETTE
   - Professional blues (#0077B5, #004182)
   - Sophisticated grays (#2C3E50, #34495E)
   - Subtle gold accents (#F39C12) for highlights
   - AVOID: Rainbow, neon, overly bright

4. DATA AS HERO (when applicable)
   - Clean charts and graphs
   - Highlighted statistics
   - Minimal decoration around data

SIGNALS CREDIBILITY:
Design should look like it came from:
- McKinsey or Boston Consulting Group
- Harvard Business Review
- Fortune 500 annual report
- Wall Street Journal infographic

ANTI-PATTERNS TO AVOID:
- Salesy/promotional graphics
- Meme aesthetics
- Handshake stock photos
- Aggressive CTAs
- Casual or playful elements
- Emoji overuse
`,
}

// ============================================================
// PLATFORM PATTERNS REGISTRY
// ============================================================

export const PLATFORM_SCROLL_STOP_PATTERNS: Record<string, PlatformPattern> = {
  instagram: INSTAGRAM_PATTERNS,
  instagram_post: INSTAGRAM_PATTERNS,
  instagram_story: INSTAGRAM_PATTERNS,
  youtube_thumbnail: YOUTUBE_THUMBNAIL_PATTERNS,
  youtube: YOUTUBE_THUMBNAIL_PATTERNS,
  linkedin: LINKEDIN_PATTERNS,
  linkedin_post: LINKEDIN_PATTERNS,
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Get platform pattern by platform ID
 */
export function getPlatformPattern(platformId: string): PlatformPattern | undefined {
  const normalized = platformId.toLowerCase().replace(/[-\s]/g, '_')
  return PLATFORM_SCROLL_STOP_PATTERNS[normalized]
}

/**
 * Get scroll-stop prompt fragment for a platform
 */
export function getScrollStopPromptFragment(platformId: string): string {
  const pattern = getPlatformPattern(platformId)
  return pattern?.promptFragment || ''
}

/**
 * Get anti-patterns for a platform
 */
export function getPlatformAntiPatterns(platformId: string): string[] {
  const pattern = getPlatformPattern(platformId)
  return pattern?.antiPatterns || []
}

/**
 * Get color psychology rules for a platform
 */
export function getPlatformColorPsychology(platformId: string) {
  const pattern = getPlatformPattern(platformId)
  return pattern?.colorPsychology || []
}

/**
 * Get all available platform patterns
 */
export function getAvailablePlatformPatterns(): string[] {
  return Object.keys(PLATFORM_SCROLL_STOP_PATTERNS)
}
