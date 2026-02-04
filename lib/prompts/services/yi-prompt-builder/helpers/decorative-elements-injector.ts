/**
 * Decorative Elements Injector v3.3
 *
 * Ensures visual elements from Design Intelligence stage actually reach the final prompt.
 * These elements provide event-type-specific decorative imagery (neural networks for tech,
 * medical symbols for health events, etc.) that makes designs contextually relevant.
 *
 * v3.3 PHILOSOPHY: Give AI creative freedom for rich, immersive backgrounds
 * - AI should create Google AI Studio quality backgrounds with depth and atmosphere
 * - Visual elements should be INTEGRATED into the design, not just in corners
 * - Only restrict areas where user content will be overlaid (speaker photo, logos)
 *
 * Priority order:
 * 1. AI-generated visualElements from Design Intelligence (most contextual)
 * 2. Curated elements from visual-elements-guide (fallback)
 *
 * @version 3.3
 */

import {
  getVisualElements,
  hasVisualElements,
} from '@/lib/prompts/data/visual-elements-guide'
import type { DesignContextForPrompt } from '../types'

export interface DecorativeElementsConfig {
  /** Event type for fallback element lookup (e.g., 'workshop', 'seminar', 'blood_donation') */
  eventType?: string
  /** Design context from Design Intelligence stage */
  designContext?: DesignContextForPrompt
  /** Maximum number of elements to include (default: 5) */
  maxElements?: number
  /** Whether to include iconic imagery from design context */
  includeIconicImagery?: boolean
  /** NEW v4.0: Level of design sophistication (default: 'balanced')
   * 'minimalist': Deep focus on negative space, subtle textures, single focal point
   * 'balanced': Standard high-quality AI generation
   * 'rich': Immersive, multi-layered backgrounds for festive/party events
   */
  sophistication?: 'minimalist' | 'balanced' | 'rich'
}

/**
 * Build decorative elements section for AI image generation prompt
 * v4.2: Enhanced with story-driven decorative elements from Design Intelligence
 */
export function buildDecorativeElementsSection(
  config: DecorativeElementsConfig
): string {
  const {
    eventType,
    designContext,
    maxElements = 5,
    includeIconicImagery = true,
    sophistication = 'balanced'
  } = config

  let elements: string[] = []
  let source = 'none'

  // === PRIORITY 1: STORY-DRIVEN THEMATIC ELEMENTS (v4.2) ===
  // Use AI-analyzed story-specific decorations with placement and reasoning
  const hasStoryDecorations = designContext?.decorativeElementsContext?.thematicElements &&
    designContext.decorativeElementsContext.thematicElements.length > 0

  if (hasStoryDecorations) {
    // Story-driven decorations are handled separately below
    source = 'story_driven'
  }
  // Priority 2: AI-generated visual elements from Design Intelligence (contextual)
  else if (designContext?.visualElements && designContext.visualElements.length > 0) {
    elements = designContext.visualElements.slice(0, maxElements)
    source = 'design_intelligence'
  }
  // Priority 3: Generic visual pool (v5.5 - NOT event-specific)
  else if (eventType) {
    const genericPool = [
      'dynamic composition with depth',
      'modern professional setting',
      'engaging visual hierarchy',
      'bold graphic elements',
      'contemporary design aesthetic',
      'clean geometric patterns',
      'sophisticated visual balance',
      'layered design elements',
      'refined spatial composition',
      'strategic focal points'
    ]

    // Randomize selection for variety
    const shuffled = [...genericPool].sort(() => Math.random() - 0.5)
    elements = shuffled.slice(0, maxElements)
    source = 'generic_visual_pool'
    console.log('[Decorative Elements] Using generic visual pool (avoiding event-type stereotypes)')
  }
  // Priority 4: Curated elements from visual-elements-guide (EMERGENCY FALLBACK ONLY - v5.5)
  else if (eventType && hasVisualElements(eventType)) {
    elements = getVisualElements(eventType).slice(0, maxElements)
    source = 'visual_elements_guide_fallback'
    console.warn('[Decorative Elements] WARNING: Using hardcoded event-type elements as emergency fallback')
  }

  // Optionally add iconic imagery if available
  const contextIconicImagery = designContext?.iconicImagery
  const iconicImagery: string[] = []
  if (
    includeIconicImagery &&
    contextIconicImagery &&
    contextIconicImagery.length > 0
  ) {
    // Add up to 3 iconic imagery items
    iconicImagery.push(...contextIconicImagery.slice(0, 3))
  }

  // If no elements found (and no story decorations), return empty string
  if (elements.length === 0 && iconicImagery.length === 0 && !hasStoryDecorations) {
    return ''
  }

  // === BUILD SECTIONS ===

  // Story-driven thematic elements section (v4.2)
  let storyDecorationsSection = ''
  if (hasStoryDecorations && designContext?.decorativeElementsContext) {
    const { thematicElements, sophisticationLevel, placementStrategy } = designContext.decorativeElementsContext
    const storyContext = designContext.storyAnalysis?.narrative || 'Event narrative'

    storyDecorationsSection = `
STORY-DRIVEN DECORATIVE ELEMENTS (AI-Analyzed):

Story Context: ${storyContext}
Sophistication Level: ${sophisticationLevel}
${placementStrategy ? `Placement Strategy: ${placementStrategy}` : ''}

Thematic Elements (designed for this specific story):
${thematicElements.map((el, i) =>
      `  ${i + 1}. ${el.element}
     - Placement: ${el.placement}
     - Opacity: ${(el.opacity * 100).toFixed(0)}%
     - Story Role: ${el.reasoning}`
    ).join('\n')}

DESIGN SUGGESTIONS (AI-Generated):
- These decorations were chosen to enhance this event's narrative
- Use as creative guidance, but prioritize user-specified elements and colors
- If user provided custom colors/design preferences, those take precedence over these suggestions
- Adapt placement and opacity as needed for visual harmony with user's requirements
- Each element has a contextual reason - they're not random decorations

`
  }

  // Legacy visual elements section
  const elementsSection =
    elements.length > 0
      ? `Visual Elements to INTEGRATE into the design:
${elements.map((el, i) => `  ${i + 1}. ${el}`).join('\n')}`
      : ''

  const imagerySection =
    iconicImagery.length > 0
      ? `\nIconic Imagery to feature prominently:
${iconicImagery.map((el, i) => `  ${i + 1}. ${el}`).join('\n')}`
      : ''

  // Use sophistication from AI if available, otherwise use config
  const finalSophistication = designContext?.decorativeElementsContext?.sophisticationLevel || sophistication

  const strategyGuidance = finalSophistication === 'refined' || finalSophistication === 'minimalist'
    ? `DESIGN STRATEGY: PROFESSIONAL MINIMALISM
- NEGATIVE SPACE: Maintain 40%+ of the canvas as clean "breathing space"
- SUBTLETY: Use these elements as very low-opacity (8-15%) background textures or single sharp accents
- CLARITY: Ensure no element competes with or touches the text headlines or upper corner areas
- IMPACT: One large, high-quality focal element is better than many small busy ones`
    : finalSophistication === 'playful' || sophistication === 'rich'
      ? `DESIGN STRATEGY: IMMERSIVE RICHNESS
- FULL CANVAS: These elements should define the visual atmosphere of the entire design
- MULTIPLE LAYERS: Combine elements at different opacities and scales for visual depth
- DYNAMIC: Create energy through color transitions, organic shapes, and depth WITHOUT lines or dividers
- AMBIENT ATMOSPHERE: Include subtle high-end textures like "fine architectural grain," "photographic noise," or "subtle textured patterns (paper grain, fabric texture, fine noise)" to fill the voids and add premium depth`
      : `DESIGN STRATEGY: BALANCED ELEGANCE
- VISUAL HARMONY: Elements support the design without overwhelming it
- LAYERED DEPTH: Use 2-3 opacity layers for visual interest
- CONTEXTUAL: Elements reinforce the event theme naturally
- PROFESSIONAL QUALITY: Crisp, high-resolution rendering`;

  return `
<visual_design_elements source="${source}" mode="${finalSophistication}">
${storyDecorationsSection}${elementsSection}${imagerySection}

${strategyGuidance}
- COLOR HARMONY: Elements must blend perfectly with the primary color palette
- CLEAR AREAS: Do NOT place prominent elements in the upper 15% or lower 10% of the design

The goal is a SOPHISTICATED, CONTEXTUALLY-RELEVANT design that immediately tells viewers the event domain through professional visual language.
</visual_design_elements>
`.trim()
}

/**
 * Build background setting guidance from Design Intelligence
 * v4.0: Enhanced with sophistication-aware background rules
 * v4.2: Story-driven background treatment with AI-specified gradients
 */
export function buildBackgroundSettingSection(
  designContext?: DesignContextForPrompt,
  sophistication: 'minimalist' | 'balanced' | 'rich' = 'balanced'
): string {
  if (!designContext?.backgroundSetting && !designContext?.backgroundTreatment) {
    return ''
  }

  // === v4.2: PRIORITY 1 - Story-driven background treatment ===
  if (designContext?.backgroundTreatment) {
    const { type, specification, atmosphericEffects, colorStops } = designContext.backgroundTreatment
    const storyContext = designContext.storyAnalysis?.narrative || 'Event atmosphere'
    const mood = designContext.vibeAndMood?.moodAtmosphere || 'Visual atmosphere'

    let atmosphericSection = ''
    if (atmosphericEffects) {
      const effects = []
      if (atmosphericEffects.depth) effects.push('Layered depth')
      if (atmosphericEffects.lightRays) effects.push('Emanating light rays')
      if (atmosphericEffects.particles) effects.push('Subtle atmospheric particles')

      if (effects.length > 0) {
        atmosphericSection = `\nAtmospheric Effects: ${effects.join(', ')}`
      }
    }

    let colorStopsSection = ''
    if (colorStops && colorStops.length > 0) {
      colorStopsSection = `\nColor Stops:
${colorStops.map(stop => `  - ${stop.position}: ${stop.color}`).join('\n')}`
    }

    return `
<background_atmosphere mode="story_driven" gradient_type="${type}">
STORY-DRIVEN BACKGROUND (AI-Analyzed):

Story Context: ${storyContext}
Mood: ${mood}

GRADIENT SPECIFICATION:
${specification}${atmosphericSection}${colorStopsSection}

CRITICAL INSTRUCTIONS:
- This gradient was SPECIFICALLY DESIGNED to tell this event's story
- Use the EXACT gradient specification provided (type, direction, color stops)
- Apply atmospheric effects AS SPECIFIED (they create the right mood)
- The background is part of the narrative - it's not just decoration
- HIGHEST FIDELITY: Ensure crisp, high-resolution rendering
</background_atmosphere>
`.trim()
  }

  // === FALLBACK: Legacy background setting ===
  const moodGuidance = designContext.moodDirection
    ? `\nMood Direction: ${designContext.moodDirection}`
    : ''

  const colorGuidance = designContext.colorStrategy
    ? `\nColor Strategy: ${designContext.colorStrategy}`
    : ''

  const backgroundApproach = sophistication === 'minimalist'
    ? `- MINIMALIST CANVAS: Clean solid-color or very soft two-tone gradients
- SOPHISTICATED MATTE: AVOID busy textures; use smooth, high-end "Apple-style" finishes
- FOCUS: The background acts as a stage for the single focal element and text`
    : `- DEPTH and DIMENSION: Use layers, gradients, lighting effects
- ATMOSPHERIC QUALITY: The background should feel like a rich environment
- PROFESSIONAL RICHNESS: Multi-layered textures and ambient particles`;

  return `
<background_atmosphere mode="${sophistication}">
Setting: ${designContext?.backgroundSetting || 'Professional atmosphere'}
${moodGuidance}${colorGuidance}

Background Design Approach:
${backgroundApproach}
- VISUAL STORYTELLING: The background alone should hint at what kind of event this is
- HIGHEST FIDELITY: Ensure crisp, high-resolution rendering of all background elements
</background_atmosphere>
`.trim()
}

/**
 * Build combined design context section
 */
export function buildFullDesignContextSection(
  config: DecorativeElementsConfig
): string {
  const decorativeSection = buildDecorativeElementsSection(config)
  const backgroundSection = buildBackgroundSettingSection(config.designContext, config.sophistication)

  const sections = [decorativeSection, backgroundSection].filter(Boolean)

  if (sections.length === 0) {
    return ''
  }

  return sections.join('\n\n')
}
