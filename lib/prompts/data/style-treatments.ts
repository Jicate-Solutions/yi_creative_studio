/**
 * Rich visual treatment narratives for all 16 poster styles
 * Based on "Nano Banana Pro" guide: Describe HOW the design should be executed
 */

import type { IdeogramStyleType, IdeogramMagicPrompt } from '../types'

/**
 * Style to visual treatment narrative
 * Describes the visual execution style in rich detail
 */
export const STYLE_TREATMENTS: Record<string, string> = {
  gradient: `Smooth, flowing color transitions that create depth and movement. The colors blend naturally like a sunset sky, with no harsh boundaries between hues. Use gradients to guide the eye through the composition, creating a sense of visual flow and modern sophistication.`,

  flat: `Clean, solid color blocks with no gradients or shadows. Each element is defined by its distinct color area, creating a modern, minimalist aesthetic. The beauty lies in the confident simplicity and bold color choices. Sharp edges define each shape clearly without any depth effects.`,

  glass: `Sophisticated glassmorphism effect with frosted, translucent panels floating above a softly blurred background. Include subtle light refractions along edges and a sense of depth through layered transparency. The glass elements should feel premium, modern, and distinctly contemporary.`,

  geometric: `Bold geometric shapes and patterns creating visual interest through repetition and arrangement. Triangles, circles, hexagons, and abstract forms compose the design. Each shape is precisely placed for maximum visual impact, creating a structured yet dynamic composition.`,

  'neon-glow': `Bold, electric colors glowing against a deep, dark background. Neon elements appear to emit their own light, with soft bloom effects and color bleeding that creates an energetic, cyberpunk atmosphere. Think Tokyo at midnight - vibrant, electric, and alive with color.`,

  duotone: `Two-color harmony creating depth through layered tones. One color handles shadows while another handles highlights, creating a striking, modern, and distinctly stylized aesthetic. The result is bold, memorable, and visually sophisticated.`,

  watercolor: `Soft, organic edges where colors bleed and blend naturally like real watercolor paint. Include subtle paper texture and the characteristic translucency of watercolor pigments. Areas feel hand-painted with controlled yet organic color distribution and artistic imperfection.`,

  'line-art': `Elegant, clean outlines defining forms without fills. The beauty lies in the precision and flow of each stroke. White space becomes a design element. The overall feel is sophisticated, artistic, and timeless - like a skilled illustrator's hand-drawn work.`,

  '3d-isometric': `Elements appear to lift off the surface with realistic three-dimensional depth. Objects have volume, weight, and presence in space. Careful attention to light sources creates believable dimensionality with clean isometric perspective throughout the design.`,

  typography: `Text as the primary visual element, with creative typography driving the design. Large, expressive fonts create impact while maintaining readability. The arrangement of text creates visual hierarchy and artistic composition. Minimal imagery - the words themselves are the design.`,

  photographic: `Real-world photographic elements with professional quality. Sharp focus, proper exposure, and realistic lighting. The imagery feels authentic and high-quality, as if captured by a professional photographer. Depth of field and natural lighting enhance the composition.`,

  illustration: `Hand-crafted illustrated elements with character and warmth. Each element feels personally created rather than computer-generated. Includes artistic flourishes and human touches that add personality and charm. The style is friendly, approachable, and distinctly artistic.`,

  metallic: `Luxurious metallic finishes with realistic reflections and highlights. Gold gleams warmly, silver shimmers coolly, and chrome catches environmental reflections. Include subtle surface variations that catch light differently, creating depth and premium appeal.`,

  'paper-cut': `Layered paper elements creating depth through shadows and overlaps. Each layer is distinct, with subtle shadows suggesting physical separation and tactile depth. The aesthetic is craft-inspired, handmade, and warmly tactile - as if physically cut and assembled.`,

  monochrome: `Shades of a single color creating elegant simplicity. The limited palette forces creative use of tone and contrast. Light and shadow become the primary tools for creating visual interest. The result is sophisticated, refined, and timelessly elegant.`,

  'high-contrast': `Dramatic black and white compositions with minimal gray tones. Maximum visual impact through stark opposites. Shadows are deep black, highlights are pure white. The effect is bold, attention-grabbing, and undeniably powerful.`,
}

/**
 * Get visual treatment narrative for a style
 */
export function getStyleTreatment(style: string): string {
  return STYLE_TREATMENTS[style] || STYLE_TREATMENTS['gradient']
}

// ============================================================
// IDEOGRAM-SPECIFIC MAPPINGS
// ============================================================

/**
 * Map app's 16 styles to Ideogram's 6 style_type values
 */
export const STYLE_TO_IDEOGRAM_MAP: Record<string, IdeogramStyleType> = {
  // Design-focused styles -> DESIGN
  gradient: 'DESIGN',
  flat: 'DESIGN',
  glass: 'DESIGN',
  geometric: 'DESIGN',
  duotone: 'DESIGN',
  'line-art': 'DESIGN',
  typography: 'DESIGN',
  'paper-cut': 'DESIGN',
  monochrome: 'DESIGN',
  'high-contrast': 'DESIGN',

  // Realistic/photographic styles -> REALISTIC
  photographic: 'REALISTIC',
  metallic: 'REALISTIC',

  // 3D styles -> RENDER_3D
  '3d-isometric': 'RENDER_3D',

  // Artistic/illustrated styles -> GENERAL (most versatile)
  'neon-glow': 'GENERAL',
  watercolor: 'GENERAL',
  illustration: 'GENERAL',
}

/**
 * Recommended magic prompt settings per style
 * AUTO = let Ideogram enhance, ON = always enhance, OFF = keep precise control
 */
export const STYLE_MAGIC_PROMPT_MAP: Record<string, IdeogramMagicPrompt> = {
  // Let AI enhance these styles
  gradient: 'AUTO',
  photographic: 'ON',
  illustration: 'ON',
  watercolor: 'ON',
  'neon-glow': 'AUTO',

  // Keep precise control for design-heavy styles
  flat: 'OFF',
  geometric: 'OFF',
  typography: 'OFF',
  'line-art': 'OFF',
  'high-contrast': 'OFF',

  // Auto for others
  glass: 'AUTO',
  duotone: 'AUTO',
  '3d-isometric': 'AUTO',
  metallic: 'AUTO',
  'paper-cut': 'AUTO',
  monochrome: 'AUTO',
}

/**
 * Styles that work better with specific models
 * "google" = Gemini excels, "ideogram" = Ideogram excels, "either" = both good
 */
export const MODEL_STYLE_PREFERENCES: Record<string, 'google' | 'ideogram' | 'either'> = {
  // Gemini excels at photorealistic
  photographic: 'google',

  // Ideogram excels at design/typography
  typography: 'ideogram',
  flat: 'ideogram',
  geometric: 'ideogram',
  'line-art': 'ideogram',

  // Either works well
  gradient: 'either',
  glass: 'either',
  'neon-glow': 'either',
  duotone: 'either',
  watercolor: 'either',
  '3d-isometric': 'either',
  illustration: 'either',
  metallic: 'either',
  'paper-cut': 'either',
  monochrome: 'either',
  'high-contrast': 'either',
}

/**
 * Get Ideogram style_type for an app style
 */
export function getIdeogramStyleType(appStyle: string): IdeogramStyleType {
  return STYLE_TO_IDEOGRAM_MAP[appStyle] || 'DESIGN'
}

/**
 * Get magic prompt setting for a style
 */
export function getMagicPromptSetting(appStyle: string): IdeogramMagicPrompt {
  return STYLE_MAGIC_PROMPT_MAP[appStyle] || 'AUTO'
}

/**
 * Get preferred model for a style
 */
export function getPreferredModelForStyle(appStyle: string): 'google' | 'ideogram' | 'either' {
  return MODEL_STYLE_PREFERENCES[appStyle] || 'either'
}

/**
 * Check if a style has a defined treatment
 */
export function hasStyleTreatment(style: string): boolean {
  return style in STYLE_TREATMENTS
}
