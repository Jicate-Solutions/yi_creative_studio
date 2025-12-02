/**
 * Resolution-aware detail modifiers for 1K, 2K, and 4K outputs
 * Based on "Nano Banana Pro" guide: High-Resolution & Textures
 * - Native 1K to 4K image generation with appropriate detail levels
 */

import type { ResolutionQuality, ResolutionModifiers } from '../types'

/**
 * Resolution-specific modifier sets
 * Different detail levels appropriate for each resolution
 */
export const RESOLUTION_MODIFIERS: Record<ResolutionQuality, ResolutionModifiers> = {
  '1K': {
    textureDetail: 'clean and simple textures with solid color areas, optimized for web display',
    edgeQuality: 'crisp edges without excessive detail, ensuring clarity at standard screen sizes',
    microDetail: 'focus on bold, readable elements over fine details - prioritize impact and clarity'
  },

  '2K': {
    textureDetail: 'refined textures with subtle variations and depth, balancing detail with performance',
    edgeQuality: 'sharp, precise edges with subtle anti-aliasing for smooth rendering at high resolutions',
    microDetail: 'include medium-level details that enhance close inspection - visible but not overwhelming'
  },

  '4K': {
    textureDetail: 'highly detailed textures with intricate patterns and material surfaces, suitable for large format',
    edgeQuality: 'ultra-crisp edges with perfect precision, subtle refinements visible at full zoom',
    microDetail: 'include fine micro-details: fabric weave, subtle noise, light reflections, material imperfections'
  }
}

/**
 * Get resolution modifiers for a quality level
 */
export function getResolutionModifiers(resolution: ResolutionQuality): ResolutionModifiers {
  return RESOLUTION_MODIFIERS[resolution] || RESOLUTION_MODIFIERS['1K']
}

/**
 * Build resolution-specific instructions for prompts
 */
export function buildResolutionInstructions(resolution: ResolutionQuality): string {
  const mods = RESOLUTION_MODIFIERS[resolution]

  const baseInstructions = `RESOLUTION QUALITY (${resolution} Output):
This image will be rendered at ${resolution} resolution. Apply the following detail levels:

- TEXTURES: ${mods.textureDetail}
- EDGES: ${mods.edgeQuality}
- DETAIL LEVEL: ${mods.microDetail}`

  // Add 4K-specific enhancements
  if (resolution === '4K') {
    return `${baseInstructions}

4K ENHANCEMENT:
- Add subtle grain or texture to prevent color banding in gradients
- Include fine highlight and shadow details in surfaces
- Consider print-quality sharpness suitable for large format output
- Maximize texture resolution and material fidelity`
  }

  // Add 2K-specific notes
  if (resolution === '2K') {
    return `${baseInstructions}

2K QUALITY:
- Balance between detail richness and clean rendering
- Suitable for high-quality presentations and close viewing
- Ensure gradients are smooth without visible stepping`
  }

  return baseInstructions
}

/**
 * Get texture recommendations based on resolution and style
 * Combines resolution awareness with style-specific guidance
 */
export function getTextureRecommendations(
  resolution: ResolutionQuality,
  style: string
): string {
  const styleTextures: Record<string, Record<ResolutionQuality, string>> = {
    gradient: {
      '1K': 'smooth digital gradients with clean color transitions',
      '2K': 'rich layered gradients with subtle depth and tonal variation',
      '4K': 'cinema-grade gradients with imperceptible transitions and subtle noise'
    },
    glass: {
      '1K': 'simulated frosted glass effect with simple blur',
      '2K': 'refined glassmorphism with subtle blur layers and depth',
      '4K': 'ultra-realistic frosted glass with accurate light refraction and subtle imperfections'
    },
    metallic: {
      '1K': 'shiny metallic surfaces with basic reflections',
      '2K': 'realistic metal with detailed reflections and surface variation',
      '4K': 'photorealistic metal with micro-scratches, environment reflections, and subtle oxidation'
    },
    watercolor: {
      '1K': 'soft watercolor washes with organic color areas',
      '2K': 'visible brush strokes with color bleeding and paper interaction',
      '4K': 'detailed paint strokes with visible paper texture, pigment variation, and water marks'
    },
    'paper-cut': {
      '1K': 'layered paper effect with soft shadows',
      '2K': 'distinct paper layers with realistic shadows and depth',
      '4K': 'visible paper fiber edges with subtle shadow layers, texture, and craft details'
    },
    photographic: {
      '1K': 'clean photographic rendering with good focus',
      '2K': 'professional photography quality with proper depth of field',
      '4K': 'ultra-high-definition photographic quality with fine grain and maximum sharpness'
    },
    illustration: {
      '1K': 'clean illustrated elements with defined lines',
      '2K': 'detailed illustrations with subtle line variation and texture',
      '4K': 'hand-crafted illustration quality with brush texture and artistic imperfections'
    }
  }

  // Return style-specific texture or fallback to resolution defaults
  return styleTextures[style]?.[resolution] || RESOLUTION_MODIFIERS[resolution].textureDetail
}

/**
 * Resolution labels for display
 */
export const RESOLUTION_LABELS: Record<ResolutionQuality, { label: string; description: string }> = {
  '1K': { label: 'Standard (1K)', description: 'Web & Social Media' },
  '2K': { label: 'High (2K)', description: 'Print & Presentations' },
  '4K': { label: 'Ultra (4K)', description: 'Large Format & Banners' }
}

/**
 * Get resolution label for display
 */
export function getResolutionLabel(resolution: ResolutionQuality): string {
  return RESOLUTION_LABELS[resolution]?.label || 'Standard (1K)'
}
