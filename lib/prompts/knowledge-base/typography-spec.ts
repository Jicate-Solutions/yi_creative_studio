/**
 * Typography Specification System
 *
 * Precise typography specifications for AI image generation.
 * Provides exact weights, sizes, line heights, and letter spacing
 * instead of vague descriptions like "bold, clean sans-serif".
 *
 * This helps Gemini understand exact typography requirements.
 */

// ============================================================================
// TYPES
// ============================================================================

export type FontWeight = 300 | 400 | 500 | 600 | 700 | 800 | 900

export type TextRole =
  | 'hero'        // Main headline, largest text
  | 'headline'    // Secondary headline
  | 'subheadline' // Supporting headline
  | 'body'        // Main body text
  | 'caption'     // Small descriptive text
  | 'label'       // Form labels, category tags
  | 'cta'         // Call-to-action buttons

export type TypographySystem =
  | 'geometric-sans'     // Inter, Poppins, Montserrat - modern, clean
  | 'humanist-sans'      // Open Sans, Nunito - friendly, approachable
  | 'neo-grotesque'      // Helvetica, Roboto, Arial - neutral, universal
  | 'serif-classical'    // Times, Georgia - traditional, authoritative
  | 'serif-modern'       // Playfair, Lora - elegant, editorial
  | 'display'            // Impact, decorative - attention-grabbing
  | 'script'             // Handwriting styles - personal, creative

export interface TypographyVariant {
  role: TextRole
  weight: FontWeight
  sizeRatio: number           // Relative to base (1.0 = base size)
  lineHeight: number          // e.g., 1.1, 1.3, 1.5
  letterSpacing: number       // em units: -0.02, 0, 0.05
  maxChars: number            // Maximum recommended characters
  textTransform?: 'uppercase' | 'lowercase' | 'capitalize' | 'none'
  renderingPriority: 'highest' | 'high' | 'medium' | 'low'
}

export interface TypographySystemSpec {
  id: TypographySystem
  name: string
  description: string
  mood: string[]
  bestFor: string[]
  fontFamilies: string[]      // Recommended font families
  variants: TypographyVariant[]
  scriptSupport: string[]     // 'latin', 'devanagari', 'tamil'
  wcagMinimumContrast: number // 4.5 for AA, 7 for AAA
}

export interface FormatTypographySpec {
  format: string
  system: TypographySystem
  baseSizePixels: number      // Base font size for this format
  variants: TypographyVariant[]
  specialRules: string[]
}

// ============================================================================
// TYPOGRAPHY SYSTEMS
// ============================================================================

export const TYPOGRAPHY_SYSTEMS: Record<TypographySystem, TypographySystemSpec> = {
  'geometric-sans': {
    id: 'geometric-sans',
    name: 'Geometric Sans-Serif',
    description: 'Clean, modern, professional. Based on geometric shapes.',
    mood: ['modern', 'clean', 'professional', 'tech-forward'],
    bestFor: ['tech events', 'corporate conferences', 'modern brands', 'startups'],
    fontFamilies: ['Inter', 'Poppins', 'Montserrat', 'Gilroy', 'Proxima Nova'],
    variants: [
      {
        role: 'hero',
        weight: 800,
        sizeRatio: 3.0,
        lineHeight: 1.05,
        letterSpacing: -0.03,
        maxChars: 30,
        textTransform: 'none',
        renderingPriority: 'highest'
      },
      {
        role: 'headline',
        weight: 700,
        sizeRatio: 2.0,
        lineHeight: 1.15,
        letterSpacing: -0.02,
        maxChars: 50,
        textTransform: 'none',
        renderingPriority: 'highest'
      },
      {
        role: 'subheadline',
        weight: 600,
        sizeRatio: 1.25,
        lineHeight: 1.3,
        letterSpacing: -0.01,
        maxChars: 80,
        textTransform: 'none',
        renderingPriority: 'high'
      },
      {
        role: 'body',
        weight: 400,
        sizeRatio: 1.0,
        lineHeight: 1.5,
        letterSpacing: 0,
        maxChars: 120,
        textTransform: 'none',
        renderingPriority: 'medium'
      },
      {
        role: 'caption',
        weight: 400,
        sizeRatio: 0.75,
        lineHeight: 1.4,
        letterSpacing: 0.01,
        maxChars: 60,
        textTransform: 'none',
        renderingPriority: 'low'
      },
      {
        role: 'label',
        weight: 500,
        sizeRatio: 0.65,
        lineHeight: 1.2,
        letterSpacing: 0.05,
        maxChars: 20,
        textTransform: 'uppercase',
        renderingPriority: 'medium'
      },
      {
        role: 'cta',
        weight: 600,
        sizeRatio: 0.9,
        lineHeight: 1.2,
        letterSpacing: 0.02,
        maxChars: 25,
        textTransform: 'uppercase',
        renderingPriority: 'high'
      }
    ],
    scriptSupport: ['latin', 'devanagari', 'tamil'],
    wcagMinimumContrast: 7
  },

  'humanist-sans': {
    id: 'humanist-sans',
    name: 'Humanist Sans-Serif',
    description: 'Friendly, approachable, organic. Based on handwriting proportions.',
    mood: ['friendly', 'approachable', 'warm', 'community-focused'],
    bestFor: ['community events', 'wellness programs', 'educational workshops', 'youth events'],
    fontFamilies: ['Open Sans', 'Nunito', 'Source Sans Pro', 'Fira Sans'],
    variants: [
      {
        role: 'hero',
        weight: 700,
        sizeRatio: 2.75,
        lineHeight: 1.1,
        letterSpacing: -0.02,
        maxChars: 35,
        textTransform: 'none',
        renderingPriority: 'highest'
      },
      {
        role: 'headline',
        weight: 600,
        sizeRatio: 1.75,
        lineHeight: 1.2,
        letterSpacing: -0.01,
        maxChars: 55,
        textTransform: 'none',
        renderingPriority: 'highest'
      },
      {
        role: 'subheadline',
        weight: 500,
        sizeRatio: 1.15,
        lineHeight: 1.35,
        letterSpacing: 0,
        maxChars: 85,
        textTransform: 'none',
        renderingPriority: 'high'
      },
      {
        role: 'body',
        weight: 400,
        sizeRatio: 1.0,
        lineHeight: 1.6,
        letterSpacing: 0,
        maxChars: 130,
        textTransform: 'none',
        renderingPriority: 'medium'
      },
      {
        role: 'caption',
        weight: 400,
        sizeRatio: 0.8,
        lineHeight: 1.5,
        letterSpacing: 0.01,
        maxChars: 70,
        textTransform: 'none',
        renderingPriority: 'low'
      },
      {
        role: 'label',
        weight: 500,
        sizeRatio: 0.7,
        lineHeight: 1.3,
        letterSpacing: 0.03,
        maxChars: 25,
        textTransform: 'uppercase',
        renderingPriority: 'medium'
      },
      {
        role: 'cta',
        weight: 600,
        sizeRatio: 0.95,
        lineHeight: 1.25,
        letterSpacing: 0.01,
        maxChars: 30,
        textTransform: 'none',
        renderingPriority: 'high'
      }
    ],
    scriptSupport: ['latin', 'devanagari'],
    wcagMinimumContrast: 7
  },

  'neo-grotesque': {
    id: 'neo-grotesque',
    name: 'Neo-Grotesque',
    description: 'Neutral, universal, highly legible. Swiss design influence.',
    mood: ['neutral', 'professional', 'universal', 'timeless'],
    bestFor: ['international events', 'government functions', 'universal accessibility'],
    fontFamilies: ['Helvetica Neue', 'Roboto', 'Arial', 'SF Pro'],
    variants: [
      {
        role: 'hero',
        weight: 700,
        sizeRatio: 2.5,
        lineHeight: 1.1,
        letterSpacing: -0.02,
        maxChars: 40,
        textTransform: 'none',
        renderingPriority: 'highest'
      },
      {
        role: 'headline',
        weight: 600,
        sizeRatio: 1.6,
        lineHeight: 1.2,
        letterSpacing: -0.01,
        maxChars: 60,
        textTransform: 'none',
        renderingPriority: 'highest'
      },
      {
        role: 'subheadline',
        weight: 500,
        sizeRatio: 1.1,
        lineHeight: 1.35,
        letterSpacing: 0,
        maxChars: 90,
        textTransform: 'none',
        renderingPriority: 'high'
      },
      {
        role: 'body',
        weight: 400,
        sizeRatio: 1.0,
        lineHeight: 1.5,
        letterSpacing: 0,
        maxChars: 140,
        textTransform: 'none',
        renderingPriority: 'medium'
      },
      {
        role: 'caption',
        weight: 400,
        sizeRatio: 0.75,
        lineHeight: 1.4,
        letterSpacing: 0.01,
        maxChars: 65,
        textTransform: 'none',
        renderingPriority: 'low'
      },
      {
        role: 'label',
        weight: 500,
        sizeRatio: 0.65,
        lineHeight: 1.2,
        letterSpacing: 0.08,
        maxChars: 20,
        textTransform: 'uppercase',
        renderingPriority: 'medium'
      },
      {
        role: 'cta',
        weight: 600,
        sizeRatio: 0.85,
        lineHeight: 1.2,
        letterSpacing: 0.02,
        maxChars: 25,
        textTransform: 'uppercase',
        renderingPriority: 'high'
      }
    ],
    scriptSupport: ['latin', 'devanagari', 'tamil', 'arabic'],
    wcagMinimumContrast: 4.5
  },

  'serif-classical': {
    id: 'serif-classical',
    name: 'Classical Serif',
    description: 'Traditional, authoritative, trustworthy. Academic and formal.',
    mood: ['traditional', 'authoritative', 'trustworthy', 'academic'],
    bestFor: ['award ceremonies', 'academic events', 'government functions', 'certificates'],
    fontFamilies: ['Times New Roman', 'Georgia', 'Garamond', 'Palatino'],
    variants: [
      {
        role: 'hero',
        weight: 700,
        sizeRatio: 2.5,
        lineHeight: 1.15,
        letterSpacing: -0.01,
        maxChars: 35,
        textTransform: 'none',
        renderingPriority: 'highest'
      },
      {
        role: 'headline',
        weight: 600,
        sizeRatio: 1.75,
        lineHeight: 1.25,
        letterSpacing: 0,
        maxChars: 50,
        textTransform: 'none',
        renderingPriority: 'highest'
      },
      {
        role: 'subheadline',
        weight: 400,
        sizeRatio: 1.2,
        lineHeight: 1.4,
        letterSpacing: 0.01,
        maxChars: 75,
        textTransform: 'none',
        renderingPriority: 'high'
      },
      {
        role: 'body',
        weight: 400,
        sizeRatio: 1.0,
        lineHeight: 1.6,
        letterSpacing: 0,
        maxChars: 100,
        textTransform: 'none',
        renderingPriority: 'medium'
      },
      {
        role: 'caption',
        weight: 400,
        sizeRatio: 0.8,
        lineHeight: 1.5,
        letterSpacing: 0.01,
        maxChars: 60,
        textTransform: 'none',
        renderingPriority: 'low'
      },
      {
        role: 'label',
        weight: 400,
        sizeRatio: 0.7,
        lineHeight: 1.3,
        letterSpacing: 0.1,
        maxChars: 25,
        textTransform: 'uppercase',
        renderingPriority: 'medium'
      },
      {
        role: 'cta',
        weight: 600,
        sizeRatio: 0.9,
        lineHeight: 1.25,
        letterSpacing: 0.02,
        maxChars: 25,
        textTransform: 'none',
        renderingPriority: 'high'
      }
    ],
    scriptSupport: ['latin'],
    wcagMinimumContrast: 7
  },

  'serif-modern': {
    id: 'serif-modern',
    name: 'Modern Serif',
    description: 'Elegant, editorial, sophisticated. High contrast strokes.',
    mood: ['elegant', 'sophisticated', 'editorial', 'luxury'],
    bestFor: ['luxury events', 'fashion shows', 'editorial content', 'premium launches'],
    fontFamilies: ['Playfair Display', 'Lora', 'Crimson Text', 'Libre Baskerville'],
    variants: [
      {
        role: 'hero',
        weight: 700,
        sizeRatio: 3.0,
        lineHeight: 1.05,
        letterSpacing: -0.02,
        maxChars: 30,
        textTransform: 'none',
        renderingPriority: 'highest'
      },
      {
        role: 'headline',
        weight: 600,
        sizeRatio: 2.0,
        lineHeight: 1.15,
        letterSpacing: -0.01,
        maxChars: 45,
        textTransform: 'none',
        renderingPriority: 'highest'
      },
      {
        role: 'subheadline',
        weight: 400,
        sizeRatio: 1.3,
        lineHeight: 1.35,
        letterSpacing: 0,
        maxChars: 70,
        textTransform: 'none',
        renderingPriority: 'high'
      },
      {
        role: 'body',
        weight: 400,
        sizeRatio: 1.0,
        lineHeight: 1.7,
        letterSpacing: 0,
        maxChars: 90,
        textTransform: 'none',
        renderingPriority: 'medium'
      },
      {
        role: 'caption',
        weight: 400,
        sizeRatio: 0.75,
        lineHeight: 1.5,
        letterSpacing: 0.02,
        maxChars: 55,
        textTransform: 'none',
        renderingPriority: 'low'
      },
      {
        role: 'label',
        weight: 400,
        sizeRatio: 0.6,
        lineHeight: 1.2,
        letterSpacing: 0.15,
        maxChars: 20,
        textTransform: 'uppercase',
        renderingPriority: 'medium'
      },
      {
        role: 'cta',
        weight: 500,
        sizeRatio: 0.85,
        lineHeight: 1.2,
        letterSpacing: 0.05,
        maxChars: 20,
        textTransform: 'uppercase',
        renderingPriority: 'high'
      }
    ],
    scriptSupport: ['latin'],
    wcagMinimumContrast: 7
  },

  'display': {
    id: 'display',
    name: 'Display / Impact',
    description: 'Bold, attention-grabbing, statement-making. For headlines only.',
    mood: ['bold', 'impactful', 'attention-grabbing', 'statement'],
    bestFor: ['event announcements', 'product launches', 'sale promotions', 'sports events'],
    fontFamilies: ['Impact', 'Bebas Neue', 'Anton', 'Oswald'],
    variants: [
      {
        role: 'hero',
        weight: 900,
        sizeRatio: 4.0,
        lineHeight: 0.95,
        letterSpacing: -0.03,
        maxChars: 20,
        textTransform: 'uppercase',
        renderingPriority: 'highest'
      },
      {
        role: 'headline',
        weight: 700,
        sizeRatio: 2.5,
        lineHeight: 1.0,
        letterSpacing: -0.02,
        maxChars: 35,
        textTransform: 'uppercase',
        renderingPriority: 'highest'
      },
      {
        role: 'subheadline',
        weight: 600,
        sizeRatio: 1.5,
        lineHeight: 1.15,
        letterSpacing: 0,
        maxChars: 50,
        textTransform: 'none',
        renderingPriority: 'high'
      },
      {
        role: 'body',
        weight: 400,
        sizeRatio: 1.0,
        lineHeight: 1.5,
        letterSpacing: 0,
        maxChars: 100,
        textTransform: 'none',
        renderingPriority: 'medium'
      },
      {
        role: 'caption',
        weight: 400,
        sizeRatio: 0.75,
        lineHeight: 1.4,
        letterSpacing: 0.01,
        maxChars: 60,
        textTransform: 'none',
        renderingPriority: 'low'
      },
      {
        role: 'label',
        weight: 700,
        sizeRatio: 0.7,
        lineHeight: 1.1,
        letterSpacing: 0.1,
        maxChars: 15,
        textTransform: 'uppercase',
        renderingPriority: 'medium'
      },
      {
        role: 'cta',
        weight: 700,
        sizeRatio: 1.0,
        lineHeight: 1.1,
        letterSpacing: 0.05,
        maxChars: 15,
        textTransform: 'uppercase',
        renderingPriority: 'high'
      }
    ],
    scriptSupport: ['latin'],
    wcagMinimumContrast: 7
  },

  'script': {
    id: 'script',
    name: 'Script / Handwriting',
    description: 'Personal, creative, elegant. Use sparingly for accents.',
    mood: ['personal', 'creative', 'elegant', 'handcrafted'],
    bestFor: ['wedding invitations', 'personal celebrations', 'creative workshops', 'artistic events'],
    fontFamilies: ['Pacifico', 'Great Vibes', 'Dancing Script', 'Allura'],
    variants: [
      {
        role: 'hero',
        weight: 400,
        sizeRatio: 3.5,
        lineHeight: 1.2,
        letterSpacing: 0,
        maxChars: 25,
        textTransform: 'none',
        renderingPriority: 'highest'
      },
      {
        role: 'headline',
        weight: 400,
        sizeRatio: 2.25,
        lineHeight: 1.3,
        letterSpacing: 0.01,
        maxChars: 40,
        textTransform: 'none',
        renderingPriority: 'highest'
      },
      {
        role: 'subheadline',
        weight: 400,
        sizeRatio: 1.5,
        lineHeight: 1.4,
        letterSpacing: 0.01,
        maxChars: 60,
        textTransform: 'none',
        renderingPriority: 'high'
      },
      {
        role: 'body',
        weight: 400,
        sizeRatio: 1.0,
        lineHeight: 1.6,
        letterSpacing: 0,
        maxChars: 80,
        textTransform: 'none',
        renderingPriority: 'medium'
      },
      {
        role: 'caption',
        weight: 400,
        sizeRatio: 0.85,
        lineHeight: 1.5,
        letterSpacing: 0.01,
        maxChars: 50,
        textTransform: 'none',
        renderingPriority: 'low'
      },
      {
        role: 'label',
        weight: 400,
        sizeRatio: 0.75,
        lineHeight: 1.3,
        letterSpacing: 0.02,
        maxChars: 20,
        textTransform: 'none',
        renderingPriority: 'medium'
      },
      {
        role: 'cta',
        weight: 400,
        sizeRatio: 1.0,
        lineHeight: 1.3,
        letterSpacing: 0.01,
        maxChars: 20,
        textTransform: 'none',
        renderingPriority: 'high'
      }
    ],
    scriptSupport: ['latin'],
    wcagMinimumContrast: 7
  }
}

// ============================================================================
// FORMAT-SPECIFIC TYPOGRAPHY
// ============================================================================

export const FORMAT_TYPOGRAPHY: Record<string, FormatTypographySpec> = {
  event_poster: {
    format: 'event_poster',
    system: 'geometric-sans',
    baseSizePixels: 32,
    variants: TYPOGRAPHY_SYSTEMS['geometric-sans'].variants,
    specialRules: [
      'Event name must be the largest text element',
      'Date and venue should have equal visual weight',
      'Speaker name prominent but secondary to event name',
      'Minimum 60px for hero text at 1080px width'
    ]
  },

  instagram_story: {
    format: 'instagram_story',
    system: 'geometric-sans',
    baseSizePixels: 28,
    variants: TYPOGRAPHY_SYSTEMS['geometric-sans'].variants,
    specialRules: [
      'Keep text in middle 60% vertically (avoid top 14%, bottom 20%)',
      'Bold, high-contrast text for small mobile screens',
      'Maximum 3 lines of text for readability',
      'Minimum 48px for headline at 1080px width'
    ]
  },

  instagram_post: {
    format: 'instagram_post',
    system: 'geometric-sans',
    baseSizePixels: 30,
    variants: TYPOGRAPHY_SYSTEMS['geometric-sans'].variants,
    specialRules: [
      'Square format requires balanced text placement',
      'Headline should command attention',
      'Minimal text - let visuals speak',
      'Minimum 56px for hero text at 1080px'
    ]
  },

  certificate: {
    format: 'certificate',
    system: 'serif-classical',
    baseSizePixels: 24,
    variants: TYPOGRAPHY_SYSTEMS['serif-classical'].variants,
    specialRules: [
      'Recipient name is the hero element',
      'Achievement text should be elegant and readable',
      'Formal spacing between elements',
      'Script fonts acceptable for decorative elements only',
      'Minimum 36px for recipient name'
    ]
  },

  youtube_thumbnail: {
    format: 'youtube_thumbnail',
    system: 'display',
    baseSizePixels: 36,
    variants: TYPOGRAPHY_SYSTEMS['display'].variants,
    specialRules: [
      'Must be readable at 120x68px thumbnail size',
      'Maximum 4-6 words',
      'High contrast, bold text only',
      'Avoid bottom-right for text (duration badge)',
      'Minimum 72px for main text at 1280px'
    ]
  },

  linkedin_post: {
    format: 'linkedin_post',
    system: 'neo-grotesque',
    baseSizePixels: 26,
    variants: TYPOGRAPHY_SYSTEMS['neo-grotesque'].variants,
    specialRules: [
      'Professional, authoritative typography',
      'Clean, corporate aesthetics',
      'Data and stats should be prominent',
      'Minimum 48px for headline'
    ]
  },

  facebook_post: {
    format: 'facebook_post',
    system: 'humanist-sans',
    baseSizePixels: 28,
    variants: TYPOGRAPHY_SYSTEMS['humanist-sans'].variants,
    specialRules: [
      'Friendly, approachable typography',
      'Readable on mobile feeds',
      'Engaging but not aggressive',
      'Minimum 52px for headline'
    ]
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get typography system by ID
 */
export function getTypographySystem(systemId: TypographySystem): TypographySystemSpec {
  return TYPOGRAPHY_SYSTEMS[systemId]
}

/**
 * Get typography specs for a format
 */
export function getFormatTypography(format: string): FormatTypographySpec | undefined {
  return FORMAT_TYPOGRAPHY[format]
}

/**
 * Get variant specs for a specific role
 */
export function getVariantForRole(
  systemId: TypographySystem,
  role: TextRole
): TypographyVariant | undefined {
  const system = TYPOGRAPHY_SYSTEMS[systemId]
  return system.variants.find(v => v.role === role)
}

/**
 * Calculate actual pixel size for a variant
 */
export function calculatePixelSize(
  baseSize: number,
  sizeRatio: number
): number {
  return Math.round(baseSize * sizeRatio)
}

/**
 * Build typography context string for prompts
 */
export function buildTypographyContext(
  format: string,
  primaryText?: string
): string {
  const formatSpec = FORMAT_TYPOGRAPHY[format]
  const system = formatSpec
    ? TYPOGRAPHY_SYSTEMS[formatSpec.system]
    : TYPOGRAPHY_SYSTEMS['geometric-sans']

  let context = `TYPOGRAPHY SYSTEM: ${system.name}\n`
  context += `Mood: ${system.mood.join(', ')}\n`
  context += `Font families: ${system.fontFamilies.slice(0, 3).join(', ')}\n\n`

  context += 'HIERARCHY:\n'
  system.variants.slice(0, 4).forEach(v => {
    context += `- ${v.role.toUpperCase()}: weight ${v.weight}, `
    context += `line-height ${v.lineHeight}, `
    context += `max ${v.maxChars} chars\n`
  })

  if (formatSpec?.specialRules) {
    context += '\nFORMAT RULES:\n'
    formatSpec.specialRules.forEach(rule => {
      context += `- ${rule}\n`
    })
  }

  if (primaryText && primaryText.length > 0) {
    const heroVariant = system.variants.find(v => v.role === 'hero')
    if (heroVariant && primaryText.length > heroVariant.maxChars) {
      context += `\nWARNING: Primary text (${primaryText.length} chars) exceeds recommended ${heroVariant.maxChars} chars\n`
    }
  }

  return context
}

/**
 * Generate JSON typography specification for Gemini
 */
export function buildTypographyJSON(
  format: string,
  textContent?: { primary?: string; secondary?: string[] }
): object {
  const formatSpec = FORMAT_TYPOGRAPHY[format]
  const systemId = formatSpec?.system || 'geometric-sans'
  const system = TYPOGRAPHY_SYSTEMS[systemId]
  const baseSize = formatSpec?.baseSizePixels || 28

  const heroVariant = system.variants.find(v => v.role === 'hero')!
  const headlineVariant = system.variants.find(v => v.role === 'headline')!
  const bodyVariant = system.variants.find(v => v.role === 'body')!

  return {
    system: {
      id: systemId,
      name: system.name,
      mood: system.mood,
      fontFamilies: system.fontFamilies.slice(0, 3)
    },
    hierarchy: {
      hero: {
        weight: heroVariant.weight,
        sizePixels: calculatePixelSize(baseSize, heroVariant.sizeRatio),
        lineHeight: heroVariant.lineHeight,
        letterSpacing: `${heroVariant.letterSpacing}em`,
        maxChars: heroVariant.maxChars,
        textTransform: heroVariant.textTransform || 'none'
      },
      headline: {
        weight: headlineVariant.weight,
        sizePixels: calculatePixelSize(baseSize, headlineVariant.sizeRatio),
        lineHeight: headlineVariant.lineHeight,
        letterSpacing: `${headlineVariant.letterSpacing}em`,
        maxChars: headlineVariant.maxChars
      },
      body: {
        weight: bodyVariant.weight,
        sizePixels: calculatePixelSize(baseSize, bodyVariant.sizeRatio),
        lineHeight: bodyVariant.lineHeight,
        letterSpacing: `${bodyVariant.letterSpacing}em`,
        maxChars: bodyVariant.maxChars
      }
    },
    wcagContrast: {
      level: 'AAA',
      minimumRatio: system.wcagMinimumContrast
    },
    specialRules: formatSpec?.specialRules || [],
    validation: textContent ? {
      primaryTextLength: textContent.primary?.length || 0,
      primaryMaxAllowed: heroVariant.maxChars,
      primaryValid: (textContent.primary?.length || 0) <= heroVariant.maxChars
    } : undefined
  }
}
