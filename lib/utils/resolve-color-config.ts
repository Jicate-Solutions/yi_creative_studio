/**
 * Color Resolution Utility
 *
 * Resolves ColorConfig from frontend to actual hex color values for Gemini API.
 *
 * Priority order:
 * 1. Organization brand colors (when useBrandColors=true)
 * 2. Custom user colors (when selectedPalette='custom')
 * 3. Preset palette colors (when selectedPalette is a palette ID)
 * 4. Fallback to Yi brand colors
 *
 * @module resolve-color-config
 * @version 3.10
 */

import { COLOR_PALETTES, type ColorConfig, type CustomColors } from '@/lib/config/design-constants'

export type ColorSource = 'brand' | 'preset' | 'custom' | 'fallback'

export interface ResolvedColors {
  primaryColor: string
  secondaryColor: string
  accentColor: string
  source: ColorSource
}

/**
 * Resolve ColorConfig to actual hex color values
 *
 * @param colorConfig - ColorConfig from frontend design data
 * @param brandConfig - Organization brand colors from database
 * @returns Resolved colors with source tracking
 *
 * @example
 * ```typescript
 * // Custom colors
 * const resolved = resolveColorConfig(
 *   { useBrandColors: false, selectedPalette: 'custom', customColors: { primary: '#FF0000', ... } },
 *   undefined
 * )
 * // => { primaryColor: '#FF0000', ..., source: 'custom' }
 *
 * // Preset palette
 * const resolved = resolveColorConfig(
 *   { useBrandColors: false, selectedPalette: 'teal_orange', customColors: null },
 *   undefined
 * )
 * // => { primaryColor: '#1B998B', ..., source: 'preset' }
 * ```
 */
export function resolveColorConfig(
  colorConfig: ColorConfig | null | undefined,
  brandConfig?: {
    primaryColor?: string
    secondaryColor?: string
    accentColor?: string
  }
): ResolvedColors {
  // Priority 1: Brand colors (if enabled and available)
  if (colorConfig?.useBrandColors && brandConfig) {
    if (brandConfig.primaryColor && brandConfig.secondaryColor) {
      console.log('[Color Resolution] Using organization brand colors')
      return {
        primaryColor: brandConfig.primaryColor,
        secondaryColor: brandConfig.secondaryColor,
        accentColor: brandConfig.accentColor || brandConfig.secondaryColor,
        source: 'brand',
      }
    }

    // Brand colors requested but not available - log warning and continue to fallback
    console.warn('[Color Resolution] Brand colors requested but not available in brand_config')
  }

  // Priority 2: Custom colors
  if (colorConfig?.selectedPalette === 'custom' && colorConfig.customColors) {
    const { primary, secondary, accent } = colorConfig.customColors

    // Validate all custom colors
    if (isValidHex(primary) && isValidHex(secondary) && isValidHex(accent)) {
      console.log('[Color Resolution] Using custom user colors:', { primary, secondary, accent })
      return {
        primaryColor: primary,
        secondaryColor: secondary,
        accentColor: accent,
        source: 'custom',
      }
    }

    // Custom colors invalid - log warning and continue to fallback
    console.warn('[Color Resolution] Invalid custom colors detected:', { primary, secondary, accent })
  }

  // Priority 3: Preset palette
  if (colorConfig?.selectedPalette && colorConfig.selectedPalette !== 'custom') {
    const palette = COLOR_PALETTES[colorConfig.selectedPalette as keyof typeof COLOR_PALETTES]

    if (palette) {
      console.log('[Color Resolution] Using preset palette:', colorConfig.selectedPalette)
      return {
        primaryColor: palette.primary,
        secondaryColor: palette.secondary,
        accentColor: palette.accent,
        source: 'preset',
      }
    }

    // Palette not found - log warning and continue to fallback
    console.warn('[Color Resolution] Preset palette not found:', colorConfig.selectedPalette)
  }

  // Priority 4: Fallback to Yi brand colors
  console.log('[Color Resolution] Using fallback Yi brand colors')
  return {
    primaryColor: '#005B96',  // Yi primary (dark navy blue)
    secondaryColor: '#FF6B35', // Yi secondary (vibrant orange)
    accentColor: '#3366FF',    // Yi accent (blue)
    source: 'fallback',
  }
}

/**
 * Validate hex color format
 *
 * Accepts both 6-digit (#RRGGBB) and 3-digit (#RGB) formats
 *
 * @param color - Color string to validate
 * @returns true if valid hex color, false otherwise
 *
 * @example
 * ```typescript
 * isValidHex('#FF0000')  // => true
 * isValidHex('#F00')     // => true
 * isValidHex('FF0000')   // => false (missing #)
 * isValidHex('#GGGGGG')  // => false (invalid characters)
 * ```
 */
export function isValidHex(color: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)
}

/**
 * Build color narrative for resolved colors
 *
 * Generates a human-readable string describing the resolved colors and their source.
 *
 * @param resolved - Resolved colors object
 * @param includeSource - Whether to include the source label in the output
 * @returns Formatted color narrative string
 *
 * @example
 * ```typescript
 * buildResolvedColorNarrative(
 *   { primaryColor: '#005B96', secondaryColor: '#FF6B35', accentColor: '#3366FF', source: 'brand' },
 *   true
 * )
 * // => "Primary: #005B96, Secondary: #FF6B35, Accent: #3366FF (brand)"
 * ```
 */
export function buildResolvedColorNarrative(
  resolved: ResolvedColors,
  includeSource: boolean = true
): string {
  const sourceLabel = includeSource ? ` (${resolved.source})` : ''

  return `Primary: ${resolved.primaryColor}, Secondary: ${resolved.secondaryColor}, Accent: ${resolved.accentColor}${sourceLabel}`
}

/**
 * Get human-readable description of color source
 *
 * @param source - Color source identifier
 * @returns Descriptive label for the color source
 */
export function getColorSourceLabel(source: ColorSource): string {
  const labels: Record<ColorSource, string> = {
    brand: 'ORGANIZATION BRAND COLORS (MANDATORY)',
    preset: 'SELECTED COLOR PALETTE',
    custom: 'USER CUSTOM COLORS',
    fallback: 'DEFAULT COLORS',
  }

  return labels[source]
}
