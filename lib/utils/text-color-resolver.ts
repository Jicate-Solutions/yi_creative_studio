/**
 * Text Color Resolver for WCAG Contrast Compliance
 * Automatically selects high-contrast text colors based on background luminance
 *
 * Purpose:
 * - Ensures all text meets WCAG AA/AAA contrast requirements
 * - Prevents light gray text on white backgrounds
 * - Intelligently selects dark or light text based on background
 *
 * Strategy:
 * - Calculate background luminance (0-1 scale)
 * - If light background (>0.5) → use dark text
 * - If dark background (≤0.5) → use light text
 * - Fallback chain with WCAG validation
 * - Optional hue preservation for brand colors
 */

import { hexToRgb } from '@/lib/utils/color-names'
import {
  getRelativeLuminance,
  getContrastRatio,
  checkTextContrast as checkContrast,
  meetsWCAG_AA,
  meetsWCAG_AAA,
} from '@/lib/utils/accessibility/contrast'
import { suggestAccessibleColor } from '@/lib/utils/accessibility/color-suggestions'

/**
 * Validate if a hex color string is valid
 */
function isValidHex(hex: string): boolean {
  return /^#[0-9A-F]{6}$/i.test(hex)
}

/**
 * Determine if a background color is light or dark
 * Uses relative luminance threshold of 0.5
 *
 * @param hex - Background color in HEX format
 * @returns true if light background, false if dark
 */
export function isLightBackground(hex: string): boolean {
  const rgb = hexToRgb(hex)
  if (!rgb) return true // Default to light if invalid

  const luminance = getRelativeLuminance(rgb.r, rgb.g, rgb.b)
  return luminance > 0.5
}

/**
 * Get contrast-safe text color for a given background
 * Returns the first color from fallback chain that meets WCAG requirements
 *
 * Algorithm:
 * 1. Calculate background luminance
 * 2. Determine light vs dark (threshold: 0.5)
 * 3. Try preferred color first (if provided)
 * 4. If preserveHue=true, adjust lightness while keeping hue
 * 5. Fallback to guaranteed safe colors
 * 6. Return first color meeting WCAG target
 *
 * @param backgroundColor - Background color in HEX format
 * @param preferredTextColor - Optional preferred text color to try first
 * @param options - Configuration options
 * @returns WCAG-compliant text color in HEX format
 */
export function getContrastSafeTextColor(
  backgroundColor: string,
  preferredTextColor?: string,
  options?: {
    targetLevel?: 'AA' | 'AAA'
    isLargeText?: boolean
    preserveHue?: boolean
  }
): string {
  const { targetLevel = 'AA', isLargeText = false, preserveHue = false } = options || {}

  // Step 1: Calculate background luminance
  const bgRgb = hexToRgb(backgroundColor)
  if (!bgRgb) {
    console.warn('[Text Color Resolver] Invalid background color:', backgroundColor)
    return '#1A1A1A' // Safe fallback for invalid input
  }

  const bgLuminance = getRelativeLuminance(bgRgb.r, bgRgb.g, bgRgb.b)
  const isLight = bgLuminance > 0.5

  console.log(`[Text Color Resolver] Background ${backgroundColor} luminance: ${bgLuminance.toFixed(3)} (${isLight ? 'LIGHT' : 'DARK'})`)

  // Step 2: Try preferred color first (if provided and valid)
  if (preferredTextColor && isValidHex(preferredTextColor)) {
    const result = checkContrast(preferredTextColor, backgroundColor, isLargeText, targetLevel)

    if (result.passes && result.ratio) {
      console.log(`[Text Color Resolver] ✓ Preferred color ${preferredTextColor} passes (${result.ratio.toFixed(2)}:1)`)
      return preferredTextColor
    }

    // Step 3: If preserveHue=true, try adjusting lightness only
    if (preserveHue) {
      const adjusted = suggestAccessibleColor(
        preferredTextColor,
        backgroundColor,
        targetLevel,
        isLargeText,
        true // adjust foreground
      )

      if (adjusted) {
        const verifyResult = checkContrast(adjusted, backgroundColor, isLargeText, targetLevel)
        if (verifyResult.passes && verifyResult.ratio) {
          console.log(`[Text Color Resolver] ✓ Hue-preserved ${adjusted} (${verifyResult.ratio.toFixed(2)}:1 from ${preferredTextColor})`)
          return adjusted
        }
      }
    }

    console.log(`[Text Color Resolver] ✗ Preferred color ${preferredTextColor} fails (${result.ratio?.toFixed(2)}:1), trying fallbacks...`)
  }

  // Step 4: Use fallback chain based on background lightness
  const candidateColors = isLight
    ? ['#1A1A1A', '#000000'] // Dark text for light backgrounds
    : ['#FFFFFF', '#E0E0E0'] // Light text for dark backgrounds

  for (const candidate of candidateColors) {
    const result = checkContrast(candidate, backgroundColor, isLargeText, targetLevel)

    if (result.passes && result.ratio) {
      console.log(`[Text Color Resolver] ✓ Selected ${candidate} (${result.ratio.toFixed(2)}:1)`)
      return candidate
    }
  }

  // Step 5: Ultimate fallback (should never reach here with proper light/dark detection)
  const ultimateFallback = isLight ? '#000000' : '#FFFFFF'
  console.error('[Text Color Resolver] CRITICAL: All candidates failed - forcing', ultimateFallback)

  return ultimateFallback
}

/**
 * Validate single text/background combination
 * Wrapper around checkTextContrast with enhanced logging
 *
 * @param textColor - Text color in HEX
 * @param backgroundColor - Background color in HEX
 * @param role - Text role (for logging: 'body', 'headline', etc.)
 * @param isLargeText - Whether text is large (≥18pt or ≥14pt bold)
 * @returns Validation result with ratio and suggestions
 */
export function validateTextContrast(
  textColor: string,
  backgroundColor: string,
  role: string,
  isLargeText: boolean
): {
  passes: boolean
  ratio: number
  level: 'AAA' | 'AA' | 'A' | null
  suggestion?: string
} {
  const result = checkContrast(textColor, backgroundColor, isLargeText, 'AA')

  if (!result.ratio) {
    return {
      passes: false,
      ratio: 0,
      level: null,
      suggestion: 'Invalid color values'
    }
  }

  const targetRatio = isLargeText ? 3 : 4.5

  return {
    passes: result.passes,
    ratio: result.ratio,
    level: result.level,
    suggestion: result.passes
      ? undefined
      : `Use ${isLightBackground(backgroundColor) ? 'darker' : 'lighter'} text (need ${targetRatio}:1, have ${result.ratio.toFixed(2)}:1)`
  }
}

/**
 * Resolve full text color palette for all text roles
 * Validates each role and auto-corrects if needed
 *
 * @param cardBackground - Event details card background color
 * @param colorSource - Current color source with role definitions
 * @param wcagLevel - Target WCAG level (default: 'AA')
 * @returns Complete text color palette with contrast ratios and warnings
 */
export function resolveTextColorPalette(
  cardBackground: string,
  colorSource: any,
  wcagLevel: 'AA' | 'AAA' = 'AA'
): {
  hero: string
  headline: string
  body: string
  cta: string
  caption: string
  contrastRatios: Record<string, number>
  warnings: string[]
} {
  const warnings: string[] = []
  const contrastRatios: Record<string, number> = {}

  const isLight = isLightBackground(cardBackground)
  const safeFallback = isLight ? '#1A1A1A' : '#FFFFFF'

  // Define text roles with sizes
  const roles = [
    { key: 'hero', size: 'large', sourceColor: colorSource?.hero?.color },
    { key: 'headline', size: 'large', sourceColor: colorSource?.headline?.color },
    { key: 'body', size: 'normal', sourceColor: colorSource?.body?.color },
    { key: 'cta', size: 'normal', sourceColor: colorSource?.cta?.color },
    { key: 'caption', size: 'small', sourceColor: colorSource?.caption?.color },
  ]

  const resolved: Record<string, string> = {}

  for (const role of roles) {
    const isLargeText = role.size === 'large'
    const preferredColor = role.sourceColor

    // Get contrast-safe color
    const safeColor = getContrastSafeTextColor(
      cardBackground,
      preferredColor,
      {
        targetLevel: wcagLevel,
        isLargeText,
        preserveHue: !!preferredColor
      }
    )

    resolved[role.key] = safeColor

    // Calculate actual contrast ratio
    const ratio = getContrastRatio(safeColor, cardBackground)
    if (ratio) {
      contrastRatios[role.key] = ratio

      // Warn if we had to change the preferred color
      if (preferredColor && preferredColor !== safeColor) {
        warnings.push(`${role.key}: Changed ${preferredColor} → ${safeColor} (${ratio.toFixed(2)}:1)`)
      }
    }
  }

  return {
    hero: resolved.hero || safeFallback,
    headline: resolved.headline || safeFallback,
    body: resolved.body || safeFallback,
    cta: resolved.cta || safeFallback,
    caption: resolved.caption || safeFallback,
    contrastRatios,
    warnings
  }
}

/**
 * Quick check if a text color needs correction
 * Returns true if contrast is insufficient
 *
 * @param textColor - Text color to check
 * @param backgroundColor - Background color
 * @param isLargeText - Whether text is large
 * @returns true if correction needed
 */
export function needsContrastCorrection(
  textColor: string,
  backgroundColor: string,
  isLargeText = false
): boolean {
  const ratio = getContrastRatio(textColor, backgroundColor)
  if (!ratio) return true // Assume needs correction if invalid

  return !meetsWCAG_AA(ratio, isLargeText)
}

/**
 * Get minimum contrast ratio required for WCAG level
 *
 * @param level - WCAG level ('AA' or 'AAA')
 * @param isLargeText - Whether text is large
 * @returns Required contrast ratio
 */
export function getRequiredContrastRatio(level: 'AA' | 'AAA', isLargeText: boolean): number {
  if (level === 'AAA') {
    return isLargeText ? 4.5 : 7
  }
  return isLargeText ? 3 : 4.5
}
