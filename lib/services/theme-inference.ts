/**
 * Theme Inference Service
 *
 * Analyzes event details (title, description, venue, etc.) to infer
 * the most appropriate theme for the creative design.
 *
 * This provides event-details-based theme suggestions rather than
 * relying solely on the vertical/event type category.
 */

import { THEMES, type ThemeSlug, getSuggestedThemes, POSTER_STYLES } from '@/lib/config/design-constants'

// ============================================================
// TYPES
// ============================================================

export interface EventDetails {
  title?: string
  description?: string
  venue?: string
  speakerName?: string
  speakerDesignation?: string
  tagline?: string
  eventType?: string
  organizationName?: string
  customFields?: Record<string, string>
}

export interface ThemeInferenceResult {
  suggestedTheme: ThemeSlug
  confidence: 'high' | 'medium' | 'low'
  reason: string
  alternativeThemes: ThemeSlug[]
  inferredMood: string
  inferredStyle: string
}

// ============================================================
// KEYWORD MAPPINGS
// ============================================================

/**
 * Keywords that strongly indicate a specific theme
 * Priority: Exact match > Strong match > Soft match
 */
const THEME_KEYWORDS: Record<ThemeSlug, {
  strong: string[] // High confidence indicators
  soft: string[]   // Moderate confidence indicators
}> = {
  // Professional themes
  corporate: {
    strong: ['corporate', 'business', 'enterprise', 'b2b', 'cxo', 'boardroom', 'executive', 'annual meeting', 'agm', 'shareholders'],
    soft: ['professional', 'company', 'organization', 'office', 'industry', 'sector', 'management', 'leadership'],
  },
  modern: {
    strong: ['modern', 'contemporary', 'cutting-edge', 'innovative', 'digital transformation', 'disruption'],
    soft: ['new', 'latest', 'innovative', 'advanced', 'tech', 'digital', 'smart', 'ai', 'automation'],
  },
  classic: {
    strong: ['classic', 'timeless', 'heritage', 'legacy', 'tradition', 'anniversary', 'centennial'],
    soft: ['established', 'renowned', 'prestigious', 'historic', 'founding', 'traditional'],
  },
  minimalist: {
    strong: ['minimalist', 'minimal', 'clean', 'simple', 'zen-like'],
    soft: ['simplicity', 'clarity', 'focused', 'streamlined', 'essential'],
  },

  // Creative themes
  bold: {
    strong: ['bold', 'impactful', 'disruptive', 'revolutionary', 'game-changing', 'breakthrough'],
    soft: ['powerful', 'strong', 'dynamic', 'energetic', 'vibrant', 'exciting'],
  },
  playful: {
    strong: ['playful', 'fun', 'kids', 'children', 'youth', 'gaming', 'entertainment'],
    soft: ['enjoyment', 'joy', 'happy', 'cheerful', 'lively', 'interactive'],
  },
  artistic: {
    strong: ['artistic', 'art', 'creative', 'design', 'aesthetic', 'gallery', 'exhibition'],
    soft: ['visual', 'artistic', 'creativity', 'expression', 'imagination'],
  },
  retro: {
    strong: ['retro', 'vintage', '80s', '90s', 'nostalgic', 'throwback', 'classic rock'],
    soft: ['old-school', 'nostalgia', 'memories', 'golden era', 'revival'],
  },

  // Elegant themes
  elegant: {
    strong: ['elegant', 'sophisticated', 'luxury', 'premium', 'exclusive', 'gala', 'black-tie'],
    soft: ['refined', 'classy', 'upscale', 'high-end', 'deluxe', 'exquisite'],
  },
  royal: {
    strong: ['royal', 'regal', 'majestic', 'grand', 'imperial', 'coronation', 'palace'],
    soft: ['prestigious', 'dignified', 'noble', 'stately', 'magnificent', 'inauguration'],
  },
  glamorous: {
    strong: ['glamorous', 'glitzy', 'fashion', 'runway', 'celebrity', 'red carpet', 'star-studded'],
    soft: ['stylish', 'chic', 'trendy', 'fashionable', 'dazzling', 'sparkling'],
  },

  // Dynamic themes
  sporty: {
    strong: ['sports', 'athletic', 'fitness', 'marathon', 'tournament', 'championship', 'olympics'],
    soft: ['active', 'competition', 'game', 'match', 'league', 'team', 'player', 'workout'],
  },
  futuristic: {
    strong: ['futuristic', 'sci-fi', 'space', 'robotics', 'ai summit', 'tech summit', 'future'],
    soft: ['innovation', 'next-gen', 'advanced', 'frontier', 'visionary', 'tomorrow'],
  },
  neon: {
    strong: ['neon', 'glow', 'cyberpunk', 'night club', 'rave', 'edm', 'electronic music'],
    soft: ['night', 'electric', 'vibrant', 'party', 'dj', 'dance'],
  },

  // Cultural themes
  traditional: {
    strong: ['traditional', 'cultural', 'heritage', 'ethnic', 'folk', 'classical music', 'carnatic', 'bharatanatyam'],
    soft: ['customs', 'rituals', 'ceremony', 'indigenous', 'roots', 'ancestral'],
  },
  festive: {
    strong: ['festive', 'festival', 'celebration', 'diwali', 'christmas', 'eid', 'pongal', 'onam', 'holi'],
    soft: ['celebrate', 'joy', 'gathering', 'carnival', 'fair', 'mela'],
  },
  spiritual: {
    strong: ['spiritual', 'meditation', 'yoga', 'wellness', 'retreat', 'ashram', 'mindfulness'],
    soft: ['peace', 'harmony', 'inner', 'soul', 'enlightenment', 'tranquility'],
  },

  // Nature themes
  organic: {
    strong: ['organic', 'natural', 'eco', 'sustainable', 'green', 'environmental', 'earth day'],
    soft: ['nature', 'plant', 'garden', 'forest', 'wildlife', 'conservation'],
  },
  zen: {
    strong: ['zen', 'peaceful', 'calm', 'meditation', 'mindfulness', 'balance'],
    soft: ['relaxation', 'serenity', 'tranquil', 'harmony', 'well-being'],
  },

  // Academic themes
  scholarly: {
    strong: ['scholarly', 'academic', 'research', 'university', 'phd', 'thesis', 'symposium', 'journal'],
    soft: ['study', 'education', 'learning', 'school', 'college', 'institute', 'professor', 'lecture'],
  },
  scientific: {
    strong: ['scientific', 'science', 'research', 'laboratory', 'experiment', 'discovery', 'stem'],
    soft: ['data', 'analysis', 'study', 'findings', 'innovation', 'technology'],
  },
}

/**
 * Venue keywords that influence theme selection
 */
const VENUE_THEME_HINTS: Record<string, ThemeSlug[]> = {
  // Luxury venues
  'hotel': ['elegant', 'corporate', 'modern'],
  'resort': ['elegant', 'zen', 'organic'],
  'palace': ['royal', 'elegant', 'traditional'],
  'ballroom': ['elegant', 'glamorous', 'royal'],
  'banquet': ['elegant', 'festive', 'corporate'],

  // Academic venues
  'university': ['scholarly', 'scientific', 'modern'],
  'college': ['scholarly', 'modern', 'corporate'],
  'auditorium': ['corporate', 'scholarly', 'modern'],
  'convention center': ['corporate', 'modern', 'futuristic'],

  // Cultural venues
  'temple': ['spiritual', 'traditional', 'zen'],
  'church': ['spiritual', 'elegant', 'classic'],
  'cultural center': ['traditional', 'festive', 'artistic'],

  // Modern venues
  'tech park': ['modern', 'futuristic', 'corporate'],
  'startup hub': ['modern', 'bold', 'futuristic'],
  'coworking': ['modern', 'minimalist', 'corporate'],

  // Nature venues
  'garden': ['organic', 'zen', 'elegant'],
  'beach': ['organic', 'zen', 'playful'],
  'farm': ['organic', 'traditional', 'playful'],

  // Sports venues
  'stadium': ['sporty', 'bold', 'futuristic'],
  'arena': ['sporty', 'bold', 'neon'],
  'gym': ['sporty', 'bold', 'modern'],
}

/**
 * Speaker/guest designations that hint at formality
 */
const DESIGNATION_FORMALITY: Record<string, 'formal' | 'semi-formal' | 'casual'> = {
  // Highly formal
  'minister': 'formal',
  'governor': 'formal',
  'mp': 'formal',
  'mla': 'formal',
  'ceo': 'formal',
  'chairman': 'formal',
  'director': 'formal',
  'president': 'formal',
  'chancellor': 'formal',
  'chief guest': 'formal',
  'guest of honor': 'formal',

  // Semi-formal
  'professor': 'semi-formal',
  'doctor': 'semi-formal',
  'manager': 'semi-formal',
  'expert': 'semi-formal',
  'speaker': 'semi-formal',
  'panelist': 'semi-formal',

  // Casual
  'influencer': 'casual',
  'artist': 'casual',
  'performer': 'casual',
  'host': 'casual',
}

// ============================================================
// INFERENCE LOGIC
// ============================================================

/**
 * Normalize text for keyword matching
 */
function normalizeText(text: string): string {
  return text.toLowerCase().trim()
}

/**
 * Check if any keyword from the list is present in the text
 */
function findMatchingKeywords(text: string, keywords: string[]): string[] {
  const normalized = normalizeText(text)
  return keywords.filter(keyword => normalized.includes(normalizeText(keyword)))
}

/**
 * Calculate theme score based on keyword matches
 */
function calculateThemeScore(
  details: EventDetails
): Record<ThemeSlug, { score: number; matches: string[] }> {
  const scores: Record<string, { score: number; matches: string[] }> = {}

  // Initialize all themes with 0 score
  for (const theme of Object.keys(THEME_KEYWORDS)) {
    scores[theme] = { score: 0, matches: [] }
  }

  // Combine all text for analysis
  const allText = [
    details.title || '',
    details.description || '',
    details.tagline || '',
    details.venue || '',
    details.speakerDesignation || '',
    ...Object.values(details.customFields || {}),
  ].join(' ')

  // Check each theme's keywords
  for (const [theme, keywords] of Object.entries(THEME_KEYWORDS)) {
    // Strong matches (3 points each)
    const strongMatches = findMatchingKeywords(allText, keywords.strong)
    scores[theme].score += strongMatches.length * 3
    scores[theme].matches.push(...strongMatches.map(m => `strong: ${m}`))

    // Soft matches (1 point each)
    const softMatches = findMatchingKeywords(allText, keywords.soft)
    scores[theme].score += softMatches.length * 1
    scores[theme].matches.push(...softMatches.map(m => `soft: ${m}`))
  }

  // Venue bonus (2 points)
  if (details.venue) {
    const venueLower = normalizeText(details.venue)
    for (const [venueKeyword, themes] of Object.entries(VENUE_THEME_HINTS)) {
      if (venueLower.includes(venueKeyword)) {
        themes.forEach(theme => {
          scores[theme].score += 2
          scores[theme].matches.push(`venue: ${venueKeyword}`)
        })
      }
    }
  }

  // Designation formality bonus
  if (details.speakerDesignation) {
    const designationLower = normalizeText(details.speakerDesignation)
    for (const [designation, formality] of Object.entries(DESIGNATION_FORMALITY)) {
      if (designationLower.includes(designation)) {
        if (formality === 'formal') {
          // Boost formal themes
          scores['corporate'].score += 2
          scores['elegant'].score += 2
          scores['royal'].score += 1
          scores['corporate'].matches.push(`designation: ${designation} (formal)`)
        } else if (formality === 'casual') {
          // Boost casual themes
          scores['playful'].score += 1
          scores['modern'].score += 1
          scores['playful'].matches.push(`designation: ${designation} (casual)`)
        }
        break
      }
    }
  }

  return scores as Record<ThemeSlug, { score: number; matches: string[] }>
}

/**
 * Infer mood from event details
 */
function inferMood(details: EventDetails): string {
  const text = [
    details.title || '',
    details.description || '',
    details.tagline || '',
  ].join(' ').toLowerCase()

  // Mood keywords
  const moodPatterns = [
    { mood: 'Celebratory', keywords: ['celebration', 'celebrate', 'festival', 'anniversary', 'milestone'] },
    { mood: 'Professional', keywords: ['summit', 'conference', 'meeting', 'corporate', 'business'] },
    { mood: 'Inspiring', keywords: ['inspire', 'motivate', 'empower', 'transform', 'vision'] },
    { mood: 'Educational', keywords: ['learn', 'workshop', 'training', 'seminar', 'course'] },
    { mood: 'Urgent', keywords: ['urgent', 'immediate', 'critical', 'emergency', 'deadline'] },
    { mood: 'Welcoming', keywords: ['welcome', 'invite', 'join', 'together', 'community'] },
    { mood: 'Prestigious', keywords: ['award', 'honor', 'excellence', 'achievement', 'recognition'] },
    { mood: 'Energetic', keywords: ['energy', 'dynamic', 'exciting', 'thrilling', 'action'] },
  ]

  for (const { mood, keywords } of moodPatterns) {
    if (keywords.some(k => text.includes(k))) {
      return mood
    }
  }

  return 'Professional' // Default mood
}

/**
 * Infer visual style from event details
 * Returns a valid POSTER_STYLES value (e.g., 'gradient', 'flat', 'glass')
 */
function inferStyle(details: EventDetails, theme: ThemeSlug): string {
  const themeData = THEMES.find(t => t.value === theme)
  const text = [
    details.title || '',
    details.description || '',
    details.tagline || '',
  ].join(' ').toLowerCase()

  // Check for explicit style keywords in content
  const styleKeywords: Record<string, string[]> = {
    'gradient': ['gradient', 'smooth', 'blend', 'modern'],
    'glass': ['glass', 'transparent', 'blur', 'frosted', 'premium'],
    'neon-glow': ['neon', 'glow', 'night', 'club', 'party', 'edm'],
    'geometric': ['geometric', 'shapes', 'abstract', 'tech', 'digital'],
    'duotone': ['duotone', 'contrast', 'artistic'],
    'watercolor': ['watercolor', 'painted', 'organic', 'artistic'],
    'flat': ['flat', 'simple', 'clean', 'minimal'],
    'vintage': ['vintage', 'retro', 'classic', 'nostalgic'],
  }

  // Check for keyword matches
  for (const [style, keywords] of Object.entries(styleKeywords)) {
    if (keywords.some(k => text.includes(k))) {
      return style
    }
  }

  // Default style based on theme's color tendency
  switch (themeData?.colorTendency) {
    case 'cool':
      return 'gradient'  // Professional, modern
    case 'warm':
      return 'gradient'  // Rich, inviting
    case 'vibrant':
      return 'geometric' // Bold, eye-catching
    case 'neutral':
      return 'flat'      // Clean, sophisticated
    default:
      return 'gradient'  // Safe default
  }
}

// ============================================================
// MAIN EXPORT
// ============================================================

/**
 * Infer the most appropriate theme from event details
 *
 * @param details - Event details from the form
 * @param fallbackEventType - The vertical/event type to use as fallback
 * @returns Theme inference result with suggestions
 */
export function inferThemeFromDetails(
  details: EventDetails,
  fallbackEventType?: string
): ThemeInferenceResult {
  // Check if we have any meaningful content to analyze
  const hasContent = [
    details.title,
    details.description,
    details.tagline,
    details.venue,
    details.speakerDesignation,
    ...Object.values(details.customFields || {}),
  ].some(v => v && v.trim().length > 0)

  // If no content and we have an event type, use event type suggestions directly
  if (!hasContent && fallbackEventType) {
    const eventTypeSuggestions = getSuggestedThemes(fallbackEventType)
    const defaultTheme = (eventTypeSuggestions[0] || 'modern') as ThemeSlug
    return {
      suggestedTheme: defaultTheme,
      confidence: 'low',
      reason: `Based on event type: ${fallbackEventType}`,
      alternativeThemes: (eventTypeSuggestions.slice(1, 4) || []) as ThemeSlug[],
      inferredMood: 'Professional',
      inferredStyle: inferStyle(details, defaultTheme),
    }
  }

  // Calculate scores for all themes
  const scores = calculateThemeScore(details)

  // Sort themes by score (descending), with stable secondary sort by theme name
  const sortedThemes = Object.entries(scores)
    .sort(([themeA, a], [themeB, b]) => {
      if (b.score !== a.score) return b.score - a.score
      return themeA.localeCompare(themeB) // Stable sort for equal scores
    })
    .map(([theme, data]) => ({ theme: theme as ThemeSlug, ...data }))

  const topTheme = sortedThemes[0]
  const topScore = topTheme.score

  // If no matches at all, fall back to event type suggestions
  if (topScore === 0 && fallbackEventType) {
    const eventTypeSuggestions = getSuggestedThemes(fallbackEventType)
    const defaultTheme = (eventTypeSuggestions[0] || 'modern') as ThemeSlug
    return {
      suggestedTheme: defaultTheme,
      confidence: 'low',
      reason: `No keyword matches, using event type: ${fallbackEventType}`,
      alternativeThemes: (eventTypeSuggestions.slice(1, 4) || []) as ThemeSlug[],
      inferredMood: inferMood(details),
      inferredStyle: inferStyle(details, defaultTheme),
    }
  }

  // Determine confidence based on score distribution
  let confidence: 'high' | 'medium' | 'low'
  if (topScore >= 6) {
    confidence = 'high'
  } else if (topScore >= 3) {
    confidence = 'medium'
  } else {
    confidence = 'low'
  }

  // Build reason string
  let reason: string
  if (topTheme.matches.length > 0) {
    const keyMatches = topTheme.matches.slice(0, 3).map(m => m.split(': ')[1]).join(', ')
    reason = `Based on: ${keyMatches}`
  } else {
    reason = 'Default selection based on general content'
  }

  // Get alternative themes (next 3 highest scoring with score > 0)
  const alternativeThemes = sortedThemes
    .slice(1, 4)
    .filter(t => t.score > 0)
    .map(t => t.theme)

  // Infer mood and style
  const inferredMood = inferMood(details)
  const inferredStyle = inferStyle(details, topTheme.theme)

  return {
    suggestedTheme: topTheme.theme,
    confidence,
    reason,
    alternativeThemes,
    inferredMood,
    inferredStyle,
  }
}

/**
 * Get theme inference with fallback to event type suggestions
 */
export function getThemeWithFallback(
  details: EventDetails,
  eventType?: string
): {
  theme: ThemeSlug
  source: 'inferred' | 'event_type' | 'default'
  inference?: ThemeInferenceResult
} {
  // First try to infer from details
  const inference = inferThemeFromDetails(details, eventType)

  if (inference.confidence === 'high' || inference.confidence === 'medium') {
    return {
      theme: inference.suggestedTheme,
      source: 'inferred',
      inference,
    }
  }

  // Fall back to event type suggestions (already imported at top)
  if (eventType) {
    const suggestions = getSuggestedThemes(eventType)
    if (suggestions.length > 0) {
      return {
        theme: suggestions[0] as ThemeSlug,
        source: 'event_type',
        inference,
      }
    }
  }

  // Ultimate fallback
  return {
    theme: 'modern',
    source: 'default',
    inference,
  }
}
