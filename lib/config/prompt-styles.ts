/**
 * Prompt Style Definitions (v31.0)
 *
 * Named creative modes that configure the entire AI pipeline.
 * Each style sets different temperatures, creative direction,
 * and model-specific prompt tuning at every stage.
 *
 * Styles affect HOW the AI thinks, not WHAT event data it uses.
 * All event details flow identically regardless of style.
 */

// ============================================================================
// TYPES
// ============================================================================

export type PromptStyleId =
  | 'auto'
  | 'creative'
  | 'stunning'
  | 'cinematic'
  | 'bold'
  | 'elegant'
  | 'minimal'

export interface PromptStyleConfig {
  id: PromptStyleId
  name: string
  description: string
  icon: string // Lucide icon name
  temperatures: {
    eventContext: number | null // null = use stage default
    storytelling: number | null
    ultraPro: number | null
  }
  /** Injected into each AI stage prompt to guide creative approach */
  creativeDirection: string
  /** Model ID → prompt tuning guidance for that specific model */
  modelGuidance: Record<string, string>
}

// ============================================================================
// STYLE DEFINITIONS
// ============================================================================

export const PROMPT_STYLES: Record<PromptStyleId, PromptStyleConfig> = {
  auto: {
    id: 'auto',
    name: 'Auto',
    description: 'Balanced AI choice',
    icon: 'Wand2',
    temperatures: {
      eventContext: null,
      storytelling: null,
      ultraPro: null,
    },
    creativeDirection: '',
    modelGuidance: {},
  },

  creative: {
    id: 'creative',
    name: 'Creative',
    description: 'Artistic & experimental',
    icon: 'Palette',
    temperatures: {
      eventContext: 1.3,
      storytelling: 1.2,
      ultraPro: 1.0,
    },
    creativeDirection:
      'Think artistically. Use unexpected compositions, unusual perspectives, creative visual metaphors. ' +
      'Break conventional poster layouts. Surprise the viewer with originality. ' +
      'Mix textures, use asymmetric balance, try unconventional color pairings. ' +
      'The poster should feel like a gallery piece, not a corporate template.',
    modelGuidance: {
      'gemini-2.5-flash-image':
        'Keep to 2-3 bold creative ideas. One strong unconventional concept. Simple but surprising.',
      'gemini-3.1-flash-image-preview':
        'Use thinking to explore 3+ artistic concepts. Experiment with unusual color combos, ' +
        'creative typography placement, mixed-media textures. Pick the most original approach.',
      'gemini-3-pro-image-preview':
        'One bold artistic concept with precise execution. Trust the model for creative details. ' +
        'Focus on composition and color — let quality handle the rest.',
    },
  },

  stunning: {
    id: 'stunning',
    name: 'Stunning',
    description: 'High-impact & dramatic',
    icon: 'Sparkles',
    temperatures: {
      eventContext: 1.0,
      storytelling: 1.0,
      ultraPro: 0.9,
    },
    creativeDirection:
      'Create MAXIMUM visual impact. Bold, commanding colors with dramatic lighting. ' +
      'Strong contrasts between light and dark. Every element demands attention. ' +
      'Think magazine cover quality — polished, powerful, impossible to ignore. ' +
      'Rich textures, deep shadows, gleaming highlights. Premium feel throughout.',
    modelGuidance: {
      'gemini-2.5-flash-image':
        'Focus on one hero visual with strong contrast. Bold colors, clean composition. Impact over complexity.',
      'gemini-3.1-flash-image-preview':
        'Use thinking to maximize visual drama. Layer lighting effects, rich textures, ' +
        'and color depth. Every element should contribute to the overall impact.',
      'gemini-3-pro-image-preview':
        'Premium magazine-cover quality. Rich color depth, dramatic lighting, flawless execution. ' +
        'Concise prompt — let the model deliver maximum polish.',
    },
  },

  cinematic: {
    id: 'cinematic',
    name: 'Cinematic',
    description: 'Movie-poster drama',
    icon: 'Film',
    temperatures: {
      eventContext: 1.0,
      storytelling: 1.1,
      ultraPro: 0.9,
    },
    creativeDirection:
      'Think like a movie poster director. Dramatic depth of field with foreground, midground, background layers. ' +
      'Cinematic lighting — rim lights, volumetric rays, dramatic shadows. ' +
      'Heroic framing with slight low-angle perspective. Lens flare and bokeh effects. ' +
      'Create a sense of epic scale. The viewer should feel like they are looking at a film poster.',
    modelGuidance: {
      'gemini-2.5-flash-image':
        'One cinematic hero shot. Dramatic lighting, slight low angle. Simple but epic.',
      'gemini-3.1-flash-image-preview':
        'Use thinking to build cinematic depth. Layer foreground elements, dramatic backlighting, ' +
        'volumetric atmosphere. Think about camera angle and lens choice.',
      'gemini-3-pro-image-preview':
        'Cinematic depth and drama. Specify exact lighting setup (rim light, key light, fill). ' +
        'One powerful composition with movie-poster framing.',
    },
  },

  bold: {
    id: 'bold',
    name: 'Bold',
    description: 'Strong & energetic',
    icon: 'Zap',
    temperatures: {
      eventContext: 1.1,
      storytelling: 1.0,
      ultraPro: 0.8,
    },
    creativeDirection:
      'Go BOLD. Oversized typography as a design element. Strong geometric shapes and patterns. ' +
      'Vivid saturated colors with high contrast. Dynamic diagonal compositions. ' +
      'Make it impossible to scroll past. Think street poster meets premium design. ' +
      'Energy and movement in every element. No subtlety — pure visual power.',
    modelGuidance: {
      'gemini-2.5-flash-image':
        'Big, bold, simple. Oversized text, strong colors, geometric shapes. Maximum energy, minimum complexity.',
      'gemini-3.1-flash-image-preview':
        'Use thinking to build bold compositions. Layer geometric patterns, dynamic angles, ' +
        'and high-saturation colors. Typography as the hero element.',
      'gemini-3-pro-image-preview':
        'Bold and precise. Strong geometric composition, vivid colors, impactful typography. ' +
        'Clean execution with maximum energy.',
    },
  },

  elegant: {
    id: 'elegant',
    name: 'Elegant',
    description: 'Refined & sophisticated',
    icon: 'Crown',
    temperatures: {
      eventContext: 0.8,
      storytelling: 0.9,
      ultraPro: 0.8,
    },
    creativeDirection:
      'Refined sophistication. Subtle color gradients with muted, desaturated tones. ' +
      'Generous whitespace — let elements breathe. Understated luxury with fine details. ' +
      'Think Vogue editorial meets Swiss design. Serif or refined sans-serif typography. ' +
      'Every element precisely placed with intentional breathing room. Less is more.',
    modelGuidance: {
      'gemini-2.5-flash-image':
        'Restrained elegance. Muted colors, clean space, refined typography. Quality through simplicity.',
      'gemini-3.1-flash-image-preview':
        'Use thinking to achieve perfect balance. Subtle gradient transitions, precise spacing, ' +
        'refined color palette (3-4 muted tones). Focus on proportion and harmony.',
      'gemini-3-pro-image-preview':
        'Understated luxury. Precise composition, refined palette, generous whitespace. ' +
        'Trust the model for subtle texture and detail work.',
    },
  },

  minimal: {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean & modern',
    icon: 'Minus',
    temperatures: {
      eventContext: 0.7,
      storytelling: 0.8,
      ultraPro: 0.7,
    },
    creativeDirection:
      'Less is more. Maximum negative space — at least 40% of the canvas should be empty. ' +
      'ONE focal element only. Limited color palette (2-3 colors maximum). ' +
      'Clean sans-serif typography with generous letter-spacing. No decorative elements. ' +
      'Think Apple product launch meets Japanese minimalism. ' +
      'If you can remove an element and the design still works, remove it.',
    modelGuidance: {
      'gemini-2.5-flash-image':
        'Ultra-simple. One element, two colors, clean type. Maximum empty space. Nothing extra.',
      'gemini-3.1-flash-image-preview':
        'Use thinking to achieve true minimalism. Remove everything non-essential. ' +
        'Focus on perfect alignment, precise color selection (2-3 max), and intentional empty space.',
      'gemini-3-pro-image-preview':
        'Precise minimalism. One focal point, 2-3 colors, clean geometry. ' +
        'Every pixel intentional. Trust the model for clean execution.',
    },
  },
}

// ============================================================================
// HELPERS
// ============================================================================

/** All styles as an ordered array for UI rendering */
export const PROMPT_STYLE_OPTIONS: PromptStyleConfig[] = Object.values(PROMPT_STYLES)

/** Get style config by ID with fallback to 'auto' */
export function getPromptStyleConfig(id: string): PromptStyleConfig {
  return PROMPT_STYLES[id as PromptStyleId] || PROMPT_STYLES.auto
}

/** Check if a style ID is valid */
export function isValidPromptStyle(id: string): id is PromptStyleId {
  return id in PROMPT_STYLES
}
