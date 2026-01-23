/**
 * Color Mapping Algorithm
 *
 * Maps detected semantic zones to user colors intelligently while preserving:
 * - Luminance relationships (dark→dark, light→light)
 * - Contrast ratios (especially for text)
 * - Visual hierarchy (background vs accent separation)
 *
 * Generates multiple unique color combinations for carousel navigation.
 */

import type { SemanticZone } from '@/lib/ai/vision/semantic-color-detector'
import {
  hexToRgb,
  calculateLuminance,
  isColorDark,
  contrastRatio,
  ensureContrast,
  hexToHsl,
  hslToHex
} from './hsl-transform'

// ============================================================
// TYPES
// ============================================================

export interface UserColors {
  primary: string // Hex color (e.g., "#FF6B35")
  secondary: string // Hex color (e.g., "#005B96")
  accent?: string // Optional hex color (e.g., "#FFD700")
}

export interface ColorMapping {
  fromColor: string // Original hex color from detected zone
  toColor: string // Target hex color from user palette
  zone: 'background' | 'text' | 'accent'
  preserveContrast: boolean // If true, adjust lightness to maintain readability
  description: string
}

export interface ColorCombination {
  mappings: ColorMapping[]
  combinationIndex: number
  description: string
}

// ============================================================
// MAIN FUNCTION
// ============================================================

/**
 * Generate multiple unique color combinations for carousel
 * @param userColors User's selected colors (primary, secondary, accent)
 * @param zones Detected semantic zones from Claude Vision
 * @param variantCount Number of unique combinations to generate (default: 5)
 * @returns Array of color combinations
 */
export function generateColorCombinations(
  userColors: UserColors,
  zones: SemanticZone[],
  variantCount: number = 5
): ColorCombination[] {
  console.log('[Color Mapping] Generating', variantCount, 'combinations for', zones.length, 'zones')

  // Separate zones by role
  const backgroundZones = zones.filter(z => z.role === 'background')
  const textZones = zones.filter(z => z.role === 'text')
  const accentZones = zones.filter(z => z.role === 'accent')

  // Prepare user color palette (primary, secondary, accent if available)
  const palette = [
    userColors.primary,
    userColors.secondary,
    ...(userColors.accent ? [userColors.accent] : [])
  ]

  // Generate variant mapping strategies
  const strategies = generateMappingStrategies(palette, variantCount)

  // Create combinations using different strategies
  const combinations: ColorCombination[] = []

  for (let i = 0; i < strategies.length; i++) {
    const strategy = strategies[i]
    const mappings: ColorMapping[] = []

    // Map background zones
    for (const zone of backgroundZones) {
      mappings.push({
        fromColor: zone.color,
        toColor: strategy.background,
        zone: 'background',
        preserveContrast: false,
        description: `Background: ${zone.description}`
      })
    }

    // Map text zones with contrast preservation
    for (const zone of textZones) {
      const bgColor = strategy.background
      let textColor = strategy.text

      // Ensure minimum contrast ratio for readability (WCAG AA: 4.5:1)
      textColor = ensureContrast(textColor, bgColor, 4.5)

      mappings.push({
        fromColor: zone.color,
        toColor: textColor,
        zone: 'text',
        preserveContrast: true,
        description: `Text: ${zone.description}`
      })
    }

    // Map accent zones
    for (const zone of accentZones) {
      mappings.push({
        fromColor: zone.color,
        toColor: strategy.accent,
        zone: 'accent',
        preserveContrast: false,
        description: `Accent: ${zone.description}`
      })
    }

    combinations.push({
      mappings,
      combinationIndex: i + 1,
      description: strategy.description
    })
  }

  console.log('[Color Mapping] Generated', combinations.length, 'unique combinations')
  return combinations
}

// ============================================================
// MAPPING STRATEGIES
// ============================================================

interface MappingStrategy {
  background: string
  text: string
  accent: string
  description: string
}

/**
 * Generate different mapping strategies for variety
 * Each strategy assigns user colors to zones in different ways
 */
function generateMappingStrategies(
  palette: string[],
  count: number
): MappingStrategy[] {
  const strategies: MappingStrategy[] = []

  // Ensure we have at least 2 colors in palette
  if (palette.length < 2) {
    throw new Error('User colors must have at least primary and secondary colors')
  }

  const [primary, secondary, accent] = palette

  // Strategy 1: Classic (Primary bg, white text, secondary accent)
  strategies.push({
    background: primary,
    text: '#FFFFFF',
    accent: secondary,
    description: 'Classic: Primary background with white text'
  })

  // Strategy 2: Inverted (Secondary bg, white text, primary accent)
  strategies.push({
    background: secondary,
    text: '#FFFFFF',
    accent: accent || primary,
    description: 'Inverted: Secondary background with primary accent'
  })

  // Strategy 3: Light mode (White bg, primary text, secondary accent)
  if (isColorDark(primary)) {
    strategies.push({
      background: '#FFFFFF',
      text: primary,
      accent: secondary,
      description: 'Light mode: White background with dark text'
    })
  }

  // Strategy 4: Accent-forward (Accent bg if available, primary text)
  if (accent) {
    strategies.push({
      background: accent,
      text: isColorDark(accent) ? '#FFFFFF' : primary,
      accent: primary,
      description: 'Accent-forward: Accent color as primary background'
    })
  }

  // Strategy 5: Gradient split (Alternate between primary and secondary)
  strategies.push({
    background: primary,
    text: '#FFFFFF',
    accent: accent || lightenColor(secondary, 20),
    description: 'Gradient split: Primary with lightened accents'
  })

  // Strategy 6: Monochromatic variations (Different shades of primary)
  if (strategies.length < count) {
    strategies.push({
      background: darkenColor(primary, 15),
      text: '#FFFFFF',
      accent: lightenColor(primary, 25),
      description: 'Monochromatic: Dark and light variations of primary'
    })
  }

  // Strategy 7: High contrast (Black/white with color accents)
  if (strategies.length < count) {
    strategies.push({
      background: '#000000',
      text: '#FFFFFF',
      accent: primary,
      description: 'High contrast: Black background with vibrant accents'
    })
  }

  // Trim to requested count
  return strategies.slice(0, count)
}

// ============================================================
// COLOR ADJUSTMENT HELPERS
// ============================================================

/**
 * Lighten a color by adjusting its lightness in HSL space
 */
function lightenColor(hex: string, amount: number): string {
  const hsl = hexToHsl(hex)
  const newL = Math.min(100, hsl.l + amount)
  return hslToHex(hsl.h, hsl.s, newL)
}

/**
 * Darken a color by adjusting its lightness in HSL space
 */
function darkenColor(hex: string, amount: number): string {
  const hsl = hexToHsl(hex)
  const newL = Math.max(0, hsl.l - amount)
  return hslToHex(hsl.h, hsl.s, newL)
}

// ============================================================
// LUMINANCE-BASED MAPPING
// ============================================================

/**
 * Map colors based on luminance similarity
 * Dark detected colors → Dark user colors
 * Light detected colors → Light user colors
 */
export function mapByLuminance(
  detectedColor: string,
  userColors: UserColors
): string {
  const detectedRgb = hexToRgb(detectedColor)
  const detectedLum = calculateLuminance(detectedRgb.r, detectedRgb.g, detectedRgb.b)

  const palette = [
    userColors.primary,
    userColors.secondary,
    ...(userColors.accent ? [userColors.accent] : [])
  ]

  // Calculate luminance for each user color
  const luminances = palette.map(color => {
    const rgb = hexToRgb(color)
    return {
      color,
      luminance: calculateLuminance(rgb.r, rgb.g, rgb.b)
    }
  })

  // Find the user color with closest luminance
  let closestColor = luminances[0]
  let minDiff = Math.abs(detectedLum - closestColor.luminance)

  for (const item of luminances) {
    const diff = Math.abs(detectedLum - item.luminance)
    if (diff < minDiff) {
      minDiff = diff
      closestColor = item
    }
  }

  return closestColor.color
}

// ============================================================
// FALLBACK MAPPING
// ============================================================

/**
 * Simple fallback mapping when semantic detection fails
 * Uses basic role-based assignment
 */
export function generateFallbackMapping(
  userColors: UserColors
): ColorMapping[] {
  return [
    {
      fromColor: '#005B96', // Default YI blue
      toColor: userColors.primary,
      zone: 'background',
      preserveContrast: false,
      description: 'Background fallback mapping'
    },
    {
      fromColor: '#FFFFFF',
      toColor: '#FFFFFF',
      zone: 'text',
      preserveContrast: true,
      description: 'Text fallback mapping (preserved white)'
    },
    {
      fromColor: '#FF6B35', // Default YI orange
      toColor: userColors.secondary,
      zone: 'accent',
      preserveContrast: false,
      description: 'Accent fallback mapping'
    }
  ]
}

// ============================================================
// VALIDATION
// ============================================================

/**
 * Validate that a color combination meets accessibility standards
 */
export function validateCombination(mappings: ColorMapping[]): {
  valid: boolean
  issues: string[]
} {
  const issues: string[] = []

  // Find background and text mappings
  const bgMapping = mappings.find(m => m.zone === 'background')
  const textMapping = mappings.find(m => m.zone === 'text')

  if (bgMapping && textMapping) {
    const contrast = contrastRatio(textMapping.toColor, bgMapping.toColor)

    // WCAG AA requires 4.5:1 for normal text
    if (contrast < 4.5) {
      issues.push(`Low contrast ratio: ${contrast.toFixed(2)}:1 (minimum 4.5:1)`)
    }
  }

  // Check if accent is too similar to background
  const accentMapping = mappings.find(m => m.zone === 'accent')
  if (bgMapping && accentMapping) {
    const bgRgb = hexToRgb(bgMapping.toColor)
    const accentRgb = hexToRgb(accentMapping.toColor)

    const bgLum = calculateLuminance(bgRgb.r, bgRgb.g, bgRgb.b)
    const accentLum = calculateLuminance(accentRgb.r, accentRgb.g, accentRgb.b)

    if (Math.abs(bgLum - accentLum) < 0.2) {
      issues.push('Accent color too similar to background (low visual separation)')
    }
  }

  return {
    valid: issues.length === 0,
    issues
  }
}
