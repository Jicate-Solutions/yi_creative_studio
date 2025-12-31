/**
 * Color Narrative Helpers
 * Natural language color descriptions for prompts
 */

import type { BrandContext, ColorPaletteIntent } from '../types'
import type { ColorConfig, CustomColors } from '@/lib/config/design-constants'
import { COLOR_PALETTES, type ColorPaletteId } from '@/lib/config/design-constants'
import { describeColor, buildColorNarrative as buildAIColorNarrative } from '@/lib/utils/color-names'
import type { ResolvedColors } from '@/lib/utils/resolve-color-config'

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
    // Use AI-powered color descriptions for better understanding
    const primaryDesc = describeColor(brand.primaryColor)
    const secondaryDesc = describeColor(brand.secondaryColor)
    const accentDesc = describeColor(brand.accentColor)

    return `a cohesive brand palette anchored by ${primaryDesc.name} (${brand.primaryColor}), a ${primaryDesc.personality.slice(0, 3).join(', ')} color that conveys ${primaryDesc.mood.toLowerCase()}. Complemented by ${secondaryDesc.name} (${brand.secondaryColor}), which adds ${secondaryDesc.mood.toLowerCase()}, and ${accentDesc.name} (${brand.accentColor}) providing strategic highlights that draw attention to key information. These colors represent the organization's identity and should be used consistently throughout the design. Visual references: Primary = ${primaryDesc.visualEquivalents[0]}; Secondary = ${secondaryDesc.visualEquivalents[0]}.`
  }

  return COLOR_SCHEME_NARRATIVES[colorScheme] ||
    `${brand.primaryColor} and ${brand.secondaryColor} working in harmony to create a distinctive and memorable visual identity`
}

/**
 * Build color palette intent from scheme and brand
 * v3.10: Now accepts pre-resolved colors for consistency across prompt pipeline
 * Now supports ColorConfig from UI for brand color toggle and custom colors
 */
export function buildColorPaletteIntent(
  colorScheme: string,
  brand: BrandContext,
  colorConfig?: ColorConfig,
  resolvedColors?: ResolvedColors  // NEW v3.10: Accept pre-resolved colors
): ColorPaletteIntent {
  // NEW v3.10: If resolved colors provided, use them directly
  if (resolvedColors) {
    const narrative = buildColorNarrative(
      resolvedColors.source === 'brand' ? 'brand_default' : 'custom',
      {
        ...brand,
        primaryColor: resolvedColors.primaryColor,
        secondaryColor: resolvedColors.secondaryColor,
        accentColor: resolvedColors.accentColor,
      }
    )

    return {
      scheme: resolvedColors.source,
      colors: {
        primary: resolvedColors.primaryColor,
        secondary: resolvedColors.secondaryColor,
        accent: resolvedColors.accentColor,
        background: brand.backgroundColor,
      },
      narrative,
    }
  }

  // Legacy logic below (for backward compatibility when resolvedColors not provided)
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

  // Fallback to legacy behavior (only reached when no user color selection provided)
  // v3.10: REMOVED hardcoded scheme color injection - this was overriding user selections
  // Now we ONLY use brand colors as fallback, never inject hardcoded preset colors
  const colors = {
    primary: brand.primaryColor,
    secondary: brand.secondaryColor,
    accent: brand.accentColor,
    background: brand.backgroundColor,
  }

  // NOTE: Previously, lines 143-156 would inject hardcoded scheme colors (teal_orange, navy_gold, etc.)
  // This has been removed to prevent overriding user color selections.
  // If specific palette colors are needed, they should come through resolvedColors parameter
  // or colorConfig.selectedPalette path (lines 112-131) which properly uses COLOR_PALETTES

  console.log(`[Color Narrative] Using fallback brand colors - colorScheme: ${colorScheme}`)

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
  // Use AI-powered color descriptions for custom colors too
  const primaryDesc = describeColor(colors.primary)
  const secondaryDesc = describeColor(colors.secondary)
  const accentDesc = describeColor(colors.accent)

  return `a custom color palette featuring ${primaryDesc.name} (${colors.primary}) as the dominant primary color, a ${primaryDesc.personality.slice(0, 2).join(', ')} tone that ${primaryDesc.mood.toLowerCase()}. Complemented by ${secondaryDesc.name} (${colors.secondary}) as the secondary color, and ${accentDesc.name} (${colors.accent}) providing strategic accent highlights. These user-selected colors create a unique and personalized visual identity.`
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

/**
 * Build color description from resolved colors (v5.4)
 * Use this instead of hardcoded event-type colors
 *
 * @param resolvedColors - The resolved color configuration from resolveColorConfig()
 * @returns A descriptive string like "Deep green (#1c9924), Gold (#f8ff36), White (#f6f6f6)"
 */
export function buildColorDescriptionFromResolved(
  resolvedColors: { source: string; primaryColor: string; secondaryColor: string; accentColor: string }
): string {
  const { primaryColor, secondaryColor, accentColor } = resolvedColors

  // Convert hex to descriptive names
  const primaryName = getColorName(primaryColor)
  const secondaryName = getColorName(secondaryColor)
  const accentName = getColorName(accentColor)

  return `${primaryName} (${primaryColor}), ${secondaryName} (${secondaryColor}), ${accentName} (${accentColor})`
}

/**
 * Convert hex color to approximate descriptive color name
 *
 * @param hex - Hex color code (e.g., "#1c9924")
 * @returns Descriptive color name (e.g., "Deep green")
 */
function getColorName(hex: string): string {
  // Simple heuristic based on RGB values
  const rgb = hexToRgb(hex)
  if (!rgb) return 'custom color'

  const { r, g, b } = rgb
  const brightness = (r + g + b) / 3

  // Determine dominant channel
  if (r > g && r > b) return brightness > 128 ? 'Bright red' : 'Deep red'
  if (g > r && g > b) return brightness > 128 ? 'Bright green' : 'Deep green'
  if (b > r && b > g) return brightness > 128 ? 'Bright blue' : 'Deep blue'
  if (r > 200 && g > 200 && b < 100) return 'Gold'
  if (r > 200 && g > 100 && b < 100) return 'Orange'
  if (r > 150 && g < 100 && b > 150) return 'Purple'
  if (brightness > 200) return 'White'
  if (brightness < 50) return 'Black'

  return 'Custom color'
}

/**
 * Convert hex color to RGB values
 *
 * @param hex - Hex color code (e.g., "#1c9924")
 * @returns RGB object with r, g, b values, or null if invalid hex
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null
}
