/**
 * Color Narrative Helpers
 * Natural language color descriptions for prompts
 */

import type { BrandContext, ColorPaletteIntent } from '../types'
import type { ColorConfig, CustomColors } from '@/lib/config/design-constants'
import { COLOR_PALETTES, type ColorPaletteId } from '@/lib/config/design-constants'

/**
 * Color scheme narratives - rich descriptions for each predefined scheme
 */
const COLOR_SCHEME_NARRATIVES: Record<string, string> = {
  teal_orange: `a dynamic gradient flowing from refreshing teal to energetic orange, creating visual movement and warmth that feels both professional and inviting. The cool teal grounds the design while the warm orange adds energy and approachability`,

  navy_gold: `sophisticated navy blues transitioning into luxurious gold accents, evoking trust, prestige, and timeless elegance. The deep navy provides authority while gold adds a touch of premium refinement suitable for distinguished events`,

  purple_pink: `vibrant purple flowing into energetic pink, creating a bold, contemporary palette that feels creative, youthful, and memorable. This gradient suggests innovation while maintaining approachability`,

  green_teal: `natural greens blending into calming teals, suggesting growth, harmony, and fresh perspectives. This organic palette feels modern yet grounded, perfect for wellness or environmental themes`,

  red_orange: `passionate reds warming into bright oranges, creating an energetic, attention-grabbing palette that communicates excitement, urgency, and action. This high-energy combination demands attention`,
}

/**
 * Build color narrative from scheme and brand
 */
export function buildColorNarrative(colorScheme: string, brand: BrandContext): string {
  if (colorScheme === 'brand_default') {
    return `a cohesive brand palette anchored by ${brand.primaryColor}, complemented by ${brand.secondaryColor}, with ${brand.accentColor} providing strategic highlights that draw attention to key information. These colors represent the organization's identity and should be used consistently throughout the design`
  }

  return COLOR_SCHEME_NARRATIVES[colorScheme] ||
    `${brand.primaryColor} and ${brand.secondaryColor} working in harmony to create a distinctive and memorable visual identity`
}

/**
 * Build color palette intent from scheme and brand
 * Now supports ColorConfig from UI for brand color toggle and custom colors
 */
export function buildColorPaletteIntent(
  colorScheme: string,
  brand: BrandContext,
  colorConfig?: ColorConfig
): ColorPaletteIntent {
  // If colorConfig is provided, use it to determine colors
  if (colorConfig) {
    // If using brand colors, use brand context
    if (colorConfig.useBrandColors) {
      return {
        scheme: 'brand_default',
        colors: {
          primary: brand.primaryColor,
          secondary: brand.secondaryColor,
          accent: brand.accentColor,
          background: brand.backgroundColor,
        },
        narrative: buildColorNarrative('brand_default', brand),
      }
    }

    // If using custom colors
    if (colorConfig.selectedPalette === 'custom' && colorConfig.customColors) {
      const customColors = colorConfig.customColors
      return {
        scheme: 'custom',
        colors: {
          primary: customColors.primary,
          secondary: customColors.secondary,
          accent: customColors.accent,
          background: brand.backgroundColor,
        },
        narrative: buildCustomColorNarrative(customColors),
      }
    }

    // If using a preset palette
    if (colorConfig.selectedPalette && colorConfig.selectedPalette !== 'custom') {
      const palette = COLOR_PALETTES[colorConfig.selectedPalette as ColorPaletteId]
      if (palette) {
        return {
          scheme: colorConfig.selectedPalette,
          colors: {
            primary: palette.primary,
            secondary: palette.secondary,
            accent: palette.accent,
            background: brand.backgroundColor,
          },
          narrative: buildColorNarrative(colorConfig.selectedPalette, {
            ...brand,
            primaryColor: palette.primary,
            secondaryColor: palette.secondary,
            accentColor: palette.accent,
          }),
        }
      }
    }
  }

  // Fallback to legacy behavior
  const colors = {
    primary: brand.primaryColor,
    secondary: brand.secondaryColor,
    accent: brand.accentColor,
    background: brand.backgroundColor,
  }

  // For non-brand schemes, update colors based on scheme
  if (colorScheme !== 'brand_default') {
    const schemeColors: Record<string, { primary: string; secondary: string }> = {
      teal_orange: { primary: '#1B998B', secondary: '#FF6B35' },
      navy_gold: { primary: '#1E3A5F', secondary: '#D4AF37' },
      purple_pink: { primary: '#8B5CF6', secondary: '#EC4899' },
      green_teal: { primary: '#22C55E', secondary: '#14B8A6' },
      red_orange: { primary: '#EF4444', secondary: '#F97316' },
    }

    if (schemeColors[colorScheme]) {
      colors.primary = schemeColors[colorScheme].primary
      colors.secondary = schemeColors[colorScheme].secondary
    }
  }

  return {
    scheme: colorScheme,
    colors,
    narrative: buildColorNarrative(colorScheme, brand),
  }
}

/**
 * Build narrative for custom user-defined colors
 */
export function buildCustomColorNarrative(colors: CustomColors): string {
  return `a custom color palette featuring ${colors.primary} as the dominant primary color, complemented by ${colors.secondary} as the secondary color, and ${colors.accent} providing strategic accent highlights. These user-selected colors create a unique and personalized visual identity`
}

/**
 * Get short color description for Ideogram (concise prompts)
 */
export function getColorDescriptionShort(colorScheme: string): string {
  const shortDescriptions: Record<string, string> = {
    brand_default: 'using brand colors',
    teal_orange: 'teal and orange gradient',
    navy_gold: 'navy blue and gold',
    purple_pink: 'purple and pink gradient',
    green_teal: 'green and teal',
    red_orange: 'red and orange energetic colors',
  }

  return shortDescriptions[colorScheme] || 'harmonious color palette'
}

/**
 * Build Ideogram color palette from brand context
 * Ideogram uses { hex: string, weight: number } format
 */
export function buildIdeogramColorPalette(
  colorScheme: string,
  brand: BrandContext
): { hex: string; weight: number }[] | undefined {
  // Only use explicit color palette for brand colors
  if (colorScheme !== 'brand_default') {
    return undefined
  }

  // Build weighted palette (weights should sum to 1.0)
  const palette = [
    { hex: brand.primaryColor.replace('#', ''), weight: 0.4 },
    { hex: brand.secondaryColor.replace('#', ''), weight: 0.3 },
    { hex: brand.accentColor.replace('#', ''), weight: 0.2 },
    { hex: brand.backgroundColor.replace('#', ''), weight: 0.1 },
  ]

  // Filter out invalid entries
  return palette.filter((c) => c.hex && c.hex !== 'undefined' && c.hex.length >= 3)
}

/**
 * Get color harmony description for visual hierarchy
 */
export function getColorHarmonyGuidance(colorScheme: string): string {
  return `Use these colors intentionally to create visual hierarchy and guide the viewer's attention from the main headline through the key details. Primary colors should anchor important elements, while accent colors highlight calls to action.`
}

/**
 * Determine if scheme is light or dark dominant
 * Helps with text contrast decisions
 */
export function getSchemeContrast(colorScheme: string): 'light' | 'dark' | 'balanced' {
  const darkSchemes = ['navy_gold', 'purple_pink']
  const lightSchemes = ['green_teal']

  if (darkSchemes.includes(colorScheme)) return 'dark'
  if (lightSchemes.includes(colorScheme)) return 'light'
  return 'balanced'
}
