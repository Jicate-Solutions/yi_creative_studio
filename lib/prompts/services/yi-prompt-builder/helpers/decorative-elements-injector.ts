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
}

/**
 * Build decorative elements section for AI image generation prompt
 *
 * v3.3: CREATIVE FREEDOM approach - AI should create rich, immersive backgrounds
 * like Google AI Studio, not just corner decorations
 *
 * @example
 * // For an AI workshop event
 * buildDecorativeElementsSection({
 *   eventType: 'workshop',
 *   designContext: {
 *     visualElements: ['neural network nodes', 'circuit patterns', 'data flow visualization'],
 *   },
 * })
 * // Returns XML section encouraging rich, integrated visual design
 */
export function buildDecorativeElementsSection(
  config: DecorativeElementsConfig
): string {
  const { eventType, designContext, maxElements = 5, includeIconicImagery = true } = config

  let elements: string[] = []
  let source = 'none'

  // Priority 1: AI-generated visual elements from Design Intelligence (most contextual)
  if (designContext?.visualElements && designContext.visualElements.length > 0) {
    elements = designContext.visualElements.slice(0, maxElements)
    source = 'design_intelligence'
  }
  // Priority 2: Curated elements from visual-elements-guide (fallback)
  else if (eventType && hasVisualElements(eventType)) {
    elements = getVisualElements(eventType).slice(0, maxElements)
    source = 'visual_elements_guide'
  }

  // Optionally add iconic imagery if available
  const iconicImagery: string[] = []
  if (
    includeIconicImagery &&
    designContext?.iconicImagery &&
    designContext.iconicImagery.length > 0
  ) {
    // Add up to 3 iconic imagery items
    iconicImagery.push(...designContext.iconicImagery.slice(0, 3))
  }

  // If no elements found, return empty string
  if (elements.length === 0 && iconicImagery.length === 0) {
    return ''
  }

  // Build the XML section with CREATIVE FREEDOM approach
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

  return `
<visual_design_elements source="${source}">
${elementsSection}${imagerySection}

CREATIVE FREEDOM - How to use these elements:
- CREATE IMMERSIVE BACKGROUNDS: These elements should define the visual atmosphere of the entire design
- INTEGRATE THROUGHOUT: Use as background patterns, gradient overlays, ambient lighting effects, depth layers
- BUILD ATMOSPHERE: Neural networks can flow across the background, medical symbols can create ambient patterns
- MULTIPLE LAYERS: Combine elements at different opacities and scales for visual depth (e.g., large blurred in back, smaller crisp in mid-ground)
- FULL CANVAS: Elements can span the entire design, not just corners - create Google AI Studio quality richness
- DYNAMIC COMPOSITION: Let elements create visual flow and movement across the poster
- COLOR INTEGRATION: Elements can influence and blend with the color palette

ONLY AVOID placing prominent elements in:
- Text content areas (where headlines, dates, venue text will appear)
- Speaker photo zone (if enabled)
- Logo overlay zones (header/footer if specified)

The goal is a RICH, CONTEXTUALLY-RELEVANT design that immediately tells viewers what kind of event this is through visual language.
</visual_design_elements>
`.trim()
}

/**
 * Build background setting guidance from Design Intelligence
 *
 * v3.3: Enhanced to encourage rich, atmospheric backgrounds
 * Extracts and formats the AI-generated background setting for the prompt.
 */
export function buildBackgroundSettingSection(
  designContext?: DesignContextForPrompt
): string {
  if (!designContext?.backgroundSetting) {
    return ''
  }

  // Build additional mood/color guidance if available
  const moodGuidance = designContext.moodDirection
    ? `\nMood Direction: ${designContext.moodDirection}`
    : ''

  const colorGuidance = designContext.colorStrategy
    ? `\nColor Strategy: ${designContext.colorStrategy}`
    : ''

  return `
<background_atmosphere>
Setting: ${designContext.backgroundSetting}
${moodGuidance}${colorGuidance}

Background Design Approach:
- Create DEPTH and DIMENSION: Use layers, gradients, lighting effects
- ATMOSPHERIC QUALITY: The background should feel like an environment, not a flat color
- PROFESSIONAL RICHNESS: Think high-end marketing agency quality, not simple templates
- VISUAL STORYTELLING: The background alone should hint at what kind of event this is
</background_atmosphere>
`.trim()
}

/**
 * Build combined design context section
 *
 * Combines decorative elements and background setting into a single prompt section.
 */
export function buildFullDesignContextSection(
  config: DecorativeElementsConfig
): string {
  const decorativeSection = buildDecorativeElementsSection(config)
  const backgroundSection = buildBackgroundSettingSection(config.designContext)

  const sections = [decorativeSection, backgroundSection].filter(Boolean)

  if (sections.length === 0) {
    return ''
  }

  return sections.join('\n\n')
}
