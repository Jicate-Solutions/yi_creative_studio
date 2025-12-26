/**
 * Style Archetypes for Event-Aware Typography Intelligence
 * Maps event context to typography styles that Gemini can interpret
 */

export type StyleArchetype =
  | 'modern-professional'
  | 'classic-elegant'
  | 'bold-energetic'
  | 'minimal-clean'
  | 'creative-artistic'
  | 'formal-traditional'
  | 'youth-vibrant'
  | 'balanced-general'

export interface TypographyStyle {
  headlineStyle: string
  headlineWeight: string
  headlineSize: string
  bodyStyle: string
  bodyWeight: string
  letterSpacing: string
  textTransform: string
  alignment: string
  fonts: {
    latin: string
    devanagari: string
    tamil: string
    telugu: string
    kannada: string
    malayalam: string
    bengali: string
  }
}

export interface ArchetypeDefinition {
  name: string
  description: string
  matchKeywords: string[]
  typography: TypographyStyle
  sizeMultipliers: {
    headline: number
    body: number
    accent: number
  }
}

export const STYLE_ARCHETYPES: Record<StyleArchetype, ArchetypeDefinition> = {
  'modern-professional': {
    name: 'Modern Professional',
    description: 'Clean sans-serif fonts with bold headlines for corporate and tech events',
    matchKeywords: [
      'conference', 'summit', 'corporate', 'technology', 'business',
      'professional', 'enterprise', 'innovation', 'tech', 'startup',
      'industry', 'leadership', 'executive', 'strategy'
    ],
    typography: {
      headlineStyle: 'clean sans-serif',
      headlineWeight: 'bold',
      headlineSize: 'large',
      bodyStyle: 'readable sans-serif',
      bodyWeight: 'normal',
      letterSpacing: 'tight',
      textTransform: 'uppercase for headlines',
      alignment: 'centered headlines, left-aligned body',
      fonts: {
        latin: 'Montserrat or Inter',
        devanagari: 'Noto Sans Devanagari',
        tamil: 'Noto Sans Tamil',
        telugu: 'Noto Sans Telugu',
        kannada: 'Noto Sans Kannada',
        malayalam: 'Noto Sans Malayalam',
        bengali: 'Noto Sans Bengali'
      }
    },
    sizeMultipliers: { headline: 1.0, body: 1.0, accent: 1.0 }
  },

  'classic-elegant': {
    name: 'Classic Elegant',
    description: 'Sophisticated serif fonts for formal galas, awards, and ceremonies',
    matchKeywords: [
      'gala', 'award', 'ceremony', 'classical', 'formal', 'elegant',
      'prestige', 'excellence', 'honor', 'celebration', 'anniversary',
      'dinner', 'banquet', 'reception', 'tribute'
    ],
    typography: {
      headlineStyle: 'sophisticated serif',
      headlineWeight: 'medium',
      headlineSize: 'extra-large',
      bodyStyle: 'refined serif',
      bodyWeight: 'light',
      letterSpacing: 'normal',
      textTransform: 'sentence case',
      alignment: 'centered',
      fonts: {
        latin: 'Playfair Display or Cormorant',
        devanagari: 'Noto Serif Devanagari',
        tamil: 'Noto Serif Tamil',
        telugu: 'Noto Serif Telugu',
        kannada: 'Noto Serif Kannada',
        malayalam: 'Noto Serif Malayalam',
        bengali: 'Noto Serif Bengali'
      }
    },
    sizeMultipliers: { headline: 1.1, body: 0.95, accent: 0.9 }
  },

  'bold-energetic': {
    name: 'Bold Energetic',
    description: 'High-impact display fonts for festivals, sports, and energetic events',
    matchKeywords: [
      'festival', 'concert', 'music', 'sports', 'championship', 'race',
      'tournament', 'competition', 'match', 'game', 'party', 'celebration',
      'energy', 'power', 'action', 'dynamic', 'blast', 'mega'
    ],
    typography: {
      headlineStyle: 'impact display font',
      headlineWeight: 'extra-bold',
      headlineSize: 'extra-large',
      bodyStyle: 'strong sans-serif',
      bodyWeight: 'bold',
      letterSpacing: 'wide',
      textTransform: 'uppercase',
      alignment: 'dynamic diagonal or centered',
      fonts: {
        latin: 'Bebas Neue or Oswald',
        devanagari: 'Mukta ExtraBold',
        tamil: 'Noto Sans Tamil Bold',
        telugu: 'Noto Sans Telugu Bold',
        kannada: 'Noto Sans Kannada Bold',
        malayalam: 'Noto Sans Malayalam Bold',
        bengali: 'Noto Sans Bengali Bold'
      }
    },
    sizeMultipliers: { headline: 1.3, body: 1.1, accent: 1.05 }
  },

  'minimal-clean': {
    name: 'Minimal Clean',
    description: 'Simple, uncluttered sans-serif for workshops, training, and educational events',
    matchKeywords: [
      'workshop', 'training', 'seminar', 'webinar', 'class', 'course',
      'session', 'tutorial', 'learning', 'education', 'skill', 'program',
      'bootcamp', 'masterclass', 'teach', 'study'
    ],
    typography: {
      headlineStyle: 'simple sans-serif',
      headlineWeight: 'medium',
      headlineSize: 'medium',
      bodyStyle: 'clean sans-serif',
      bodyWeight: 'normal',
      letterSpacing: 'normal',
      textTransform: 'sentence case',
      alignment: 'left-aligned',
      fonts: {
        latin: 'Poppins or Inter',
        devanagari: 'Noto Sans Devanagari',
        tamil: 'Noto Sans Tamil',
        telugu: 'Noto Sans Telugu',
        kannada: 'Noto Sans Kannada',
        malayalam: 'Noto Sans Malayalam',
        bengali: 'Noto Sans Bengali'
      }
    },
    sizeMultipliers: { headline: 0.9, body: 1.0, accent: 0.95 }
  },

  'creative-artistic': {
    name: 'Creative Artistic',
    description: 'Expressive, artistic fonts for exhibitions, cultural events, and performances',
    matchKeywords: [
      'exhibition', 'art', 'gallery', 'cultural', 'performance', 'show',
      'theater', 'dance', 'drama', 'creative', 'design', 'showcase',
      'installation', 'artist', 'painting', 'sculpture', 'craft'
    ],
    typography: {
      headlineStyle: 'expressive artistic font',
      headlineWeight: 'medium',
      headlineSize: 'large',
      bodyStyle: 'elegant serif or artistic sans',
      bodyWeight: 'normal',
      letterSpacing: 'balanced',
      textTransform: 'mixed case',
      alignment: 'creative asymmetric',
      fonts: {
        latin: 'Libre Baskerville or Playfair Display',
        devanagari: 'Noto Serif Devanagari',
        tamil: 'Noto Serif Tamil',
        telugu: 'Noto Serif Telugu',
        kannada: 'Noto Serif Kannada',
        malayalam: 'Noto Serif Malayalam',
        bengali: 'Noto Serif Bengali'
      }
    },
    sizeMultipliers: { headline: 1.05, body: 1.0, accent: 1.0 }
  },

  'formal-traditional': {
    name: 'Formal Traditional',
    description: 'Traditional serif fonts for academic, government, and institutional events',
    matchKeywords: [
      'symposium', 'convocation', 'graduation', 'inauguration', 'conference',
      'academic', 'research', 'scholar', 'university', 'institute',
      'government', 'official', 'ceremony', 'commencement', 'lecture'
    ],
    typography: {
      headlineStyle: 'traditional serif',
      headlineWeight: 'normal',
      headlineSize: 'medium',
      bodyStyle: 'traditional serif',
      bodyWeight: 'normal',
      letterSpacing: 'normal',
      textTransform: 'title case',
      alignment: 'centered',
      fonts: {
        latin: 'Cormorant or Merriweather',
        devanagari: 'Noto Serif Devanagari',
        tamil: 'Noto Serif Tamil',
        telugu: 'Noto Serif Telugu',
        kannada: 'Noto Serif Kannada',
        malayalam: 'Noto Serif Malayalam',
        bengali: 'Noto Serif Bengali'
      }
    },
    sizeMultipliers: { headline: 0.95, body: 0.95, accent: 0.9 }
  },

  'youth-vibrant': {
    name: 'Youth Vibrant',
    description: 'Playful, rounded fonts for children, youth, and fun events',
    matchKeywords: [
      'kids', 'children', 'youth', 'camp', 'club', 'fun', 'play',
      'junior', 'young', 'teen', 'student', 'school', 'playful',
      'colorful', 'creative', 'adventure', 'explore'
    ],
    typography: {
      headlineStyle: 'playful rounded font',
      headlineWeight: 'bold',
      headlineSize: 'large',
      bodyStyle: 'friendly rounded sans',
      bodyWeight: 'normal',
      letterSpacing: 'relaxed',
      textTransform: 'mixed case',
      alignment: 'centered',
      fonts: {
        latin: 'Quicksand or Nunito',
        devanagari: 'Hind or Mukta',
        tamil: 'Noto Sans Tamil',
        telugu: 'Noto Sans Telugu',
        kannada: 'Noto Sans Kannada',
        malayalam: 'Noto Sans Malayalam',
        bengali: 'Noto Sans Bengali'
      }
    },
    sizeMultipliers: { headline: 1.15, body: 1.05, accent: 1.0 }
  },

  'balanced-general': {
    name: 'Balanced General',
    description: 'Versatile, neutral typography suitable for any event type',
    matchKeywords: ['*'], // Universal fallback
    typography: {
      headlineStyle: 'clean sans-serif',
      headlineWeight: 'medium',
      headlineSize: 'medium-large',
      bodyStyle: 'readable sans-serif',
      bodyWeight: 'normal',
      letterSpacing: 'normal',
      textTransform: 'sentence case',
      alignment: 'centered',
      fonts: {
        latin: 'Inter or Roboto',
        devanagari: 'Noto Sans Devanagari',
        tamil: 'Noto Sans Tamil',
        telugu: 'Noto Sans Telugu',
        kannada: 'Noto Sans Kannada',
        malayalam: 'Noto Sans Malayalam',
        bengali: 'Noto Sans Bengali'
      }
    },
    sizeMultipliers: { headline: 1.0, body: 1.0, accent: 1.0 }
  }
}

/**
 * Calculate confidence score for archetype match based on keyword matching
 */
export function calculateArchetypeConfidence(
  eventData: Record<string, any>,
  archetype: StyleArchetype
): number {
  const definition = STYLE_ARCHETYPES[archetype]
  if (definition.matchKeywords[0] === '*') return 0.5 // Fallback has medium confidence

  // Combine all event data into searchable text
  const searchText = Object.values(eventData)
    .filter(val => typeof val === 'string')
    .join(' ')
    .toLowerCase()

  // Count keyword matches
  let matches = 0
  for (const keyword of definition.matchKeywords) {
    if (searchText.includes(keyword.toLowerCase())) {
      matches++
    }
  }

  // Calculate confidence (0.0 to 1.0)
  const maxMatches = Math.min(definition.matchKeywords.length, 5) // Cap at 5 keywords
  const confidence = Math.min(matches / maxMatches, 1.0)

  // Boost confidence slightly if multiple matches
  return matches > 0 ? Math.min(confidence + 0.1, 1.0) : 0.0
}

/**
 * Find best matching archetype based on keywords
 */
export function findBestArchetype(eventData: Record<string, any>): {
  archetype: StyleArchetype
  confidence: number
} {
  const scores: Array<{ archetype: StyleArchetype; confidence: number }> = []

  // Calculate confidence for each archetype (except fallback)
  const archetypes = Object.keys(STYLE_ARCHETYPES).filter(
    a => a !== 'balanced-general'
  ) as StyleArchetype[]

  for (const archetype of archetypes) {
    const confidence = calculateArchetypeConfidence(eventData, archetype)
    if (confidence > 0) {
      scores.push({ archetype, confidence })
    }
  }

  // Sort by confidence
  scores.sort((a, b) => b.confidence - a.confidence)

  // Return best match or fallback
  if (scores.length > 0 && scores[0].confidence >= 0.4) {
    return scores[0]
  }

  return { archetype: 'balanced-general', confidence: 0.5 }
}
