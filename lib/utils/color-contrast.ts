/**
 * Color Contrast Utility (WCAG Compliance)
 * Calculates contrast ratios and validates text readability per WCAG standards
 *
 * WCAG 2.1 Standards:
 * - AA (Normal Text): ≥ 4.5:1
 * - AA (Large Text 18pt+): ≥ 3:1
 * - AAA (Normal Text): ≥ 7:1
 * - AAA (Large Text): ≥ 4.5:1
 */

/**
 * RGB color representation
 */
export interface RGB {
  r: number
  g: number
  b: number
}

/**
 * Contrast validation result
 */
export interface ContrastResult {
  ratio: number
  meetsWCAG_AA: boolean  // ≥4.5:1 for normal text
  meetsWCAG_AAA: boolean // ≥7:1 for normal text
}

/**
 * Initiative text contrast info for AI prompt generation
 * v15.2: Added adjustedColor for automatic contrast fixing
 */
export interface InitiativeContrastInfo {
  color: string  // Original user-specified color
  adjustedColor: string  // Auto-adjusted color for visibility (if needed)
  contrastRatio: number
  needsAdjustment: boolean
  recommendedBgTone: 'light' | 'dark' | 'medium'
}

/**
 * Convert hex color to RGB
 *
 * @param hex - Color in hex format (#RRGGBB or RRGGBB)
 * @returns RGB object or null if invalid
 */
export function hexToRgb(hex: string): RGB | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null
}

/**
 * Convert RGB to hex color
 *
 * @param rgb - RGB color values (0-255)
 * @returns Hex color string (#RRGGBB)
 */
export function rgbToHex(rgb: RGB): string {
  const toHex = (n: number) => {
    const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`.toUpperCase()
}

/**
 * Calculate relative luminance of a color
 * Per WCAG 2.1 formula: https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 *
 * @param rgb - RGB color values (0-255)
 * @returns Relative luminance (0.0-1.0)
 */
export function calculateLuminance(rgb: RGB): number {
  // Convert RGB to sRGB (0-1 range)
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(val => {
    val = val / 255
    // Apply sRGB gamma correction
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4)
  })

  // Calculate relative luminance using ITU-R BT.709 coefficients
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/**
 * Calculate contrast ratio between two luminance values
 * Per WCAG 2.1 formula: (L1 + 0.05) / (L2 + 0.05)
 *
 * @param l1 - First luminance value
 * @param l2 - Second luminance value
 * @returns Contrast ratio (1:1 to 21:1)
 */
export function calculateContrast(l1: number, l2: number): number {
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Automatically adjust a color to meet WCAG AA contrast (4.5:1) against a background
 * v15.2: New function for automatic contrast fixing
 *
 * @param textColor - Original text color in hex
 * @param backgroundColor - Background color in hex
 * @returns Adjusted color that meets WCAG AA, or original if already compliant
 */
export function adjustColorForContrast(
  textColor: string,
  backgroundColor: string
): string {
  const textRgb = hexToRgb(textColor)
  const bgRgb = hexToRgb(backgroundColor)

  if (!textRgb || !bgRgb) {
    return textColor // Return original if parsing fails
  }

  const bgLuminance = calculateLuminance(bgRgb)
  const targetContrast = 4.5 // WCAG AA standard

  // Check if current contrast is already sufficient
  const currentLuminance = calculateLuminance(textRgb)
  const currentContrast = calculateContrast(currentLuminance, bgLuminance)
  if (currentContrast >= targetContrast) {
    return textColor // Already compliant
  }

  // Determine if we need to lighten or darken
  const shouldLighten = bgLuminance < 0.5

  // Binary search for the right lightness level
  let low = 0
  let high = 255
  let bestColor = textColor
  let bestContrast = currentContrast

  for (let i = 0; i < 20; i++) { // Max 20 iterations
    const mid = Math.floor((low + high) / 2)
    const factor = mid / 255

    // Adjust RGB values
    const adjustedRgb: RGB = shouldLighten
      ? {
          // Lighten: move towards white
          r: textRgb.r + (255 - textRgb.r) * factor,
          g: textRgb.g + (255 - textRgb.g) * factor,
          b: textRgb.b + (255 - textRgb.b) * factor,
        }
      : {
          // Darken: move towards black
          r: textRgb.r * (1 - factor),
          g: textRgb.g * (1 - factor),
          b: textRgb.b * (1 - factor),
        }

    const adjustedLuminance = calculateLuminance(adjustedRgb)
    const adjustedContrast = calculateContrast(adjustedLuminance, bgLuminance)

    if (adjustedContrast >= targetContrast) {
      bestColor = rgbToHex(adjustedRgb)
      bestContrast = adjustedContrast
      high = mid - 1 // Try less adjustment
    } else {
      low = mid + 1 // Need more adjustment
    }
  }

  return bestContrast >= targetContrast ? bestColor : textColor
}

/**
 * Validate text contrast against WCAG standards
 *
 * @param textColor - Text color in hex format
 * @param backgroundColor - Background color in hex format
 * @returns Contrast validation result
 */
export function validateTextContrast(
  textColor: string,
  backgroundColor: string
): ContrastResult {
  const textRgb = hexToRgb(textColor)
  const bgRgb = hexToRgb(backgroundColor)

  if (!textRgb || !bgRgb) {
    // Invalid colors - return worst case
    return {
      ratio: 1.0,
      meetsWCAG_AA: false,
      meetsWCAG_AAA: false
    }
  }

  const textLuminance = calculateLuminance(textRgb)
  const bgLuminance = calculateLuminance(bgRgb)
  const ratio = calculateContrast(textLuminance, bgLuminance)

  return {
    ratio,
    meetsWCAG_AA: ratio >= 4.5,
    meetsWCAG_AAA: ratio >= 7.0
  }
}

/**
 * Calculate initiative text contrast info for AI prompt generation
 * v15.2: Now automatically adjusts text color for visibility
 *
 * @param initiativeColor - Initiative text color in hex
 * @param actualPrimaryBackground - The actual primary color that will be used (e.g., #0b6d41)
 * @returns Contrast information for AI with auto-adjusted color
 */
export function calculateInitiativeContrast(
  initiativeColor: string,
  actualPrimaryBackground?: string
): InitiativeContrastInfo {
  const textRgb = hexToRgb(initiativeColor)

  if (!textRgb) {
    // Invalid color - return safe defaults
    return {
      color: initiativeColor,
      adjustedColor: '#FFFFFF',  // Default to white for safety
      contrastRatio: 1.0,
      needsAdjustment: true,
      recommendedBgTone: 'light'
    }
  }

  // v15.2: Calculate against ACTUAL background color if provided
  const backgroundToTest = actualPrimaryBackground || '#FFFFFF'  // Fallback to white
  const bgRgb = hexToRgb(backgroundToTest)

  if (!bgRgb) {
    // Invalid background - use white as fallback
    const textLuminance = calculateLuminance(textRgb)
    const isLightColor = textLuminance > 0.5

    return {
      color: initiativeColor,
      adjustedColor: isLightColor ? '#000000' : '#FFFFFF',
      contrastRatio: isLightColor ? calculateContrast(textLuminance, 0.1) : calculateContrast(textLuminance, 1.0),
      needsAdjustment: true,
      recommendedBgTone: isLightColor ? 'dark' : 'light'
    }
  }

  // Calculate luminance for both text and background
  const textLuminance = calculateLuminance(textRgb)
  const bgLuminance = calculateLuminance(bgRgb)

  // Calculate actual contrast between text and background
  const actualContrast = calculateContrast(textLuminance, bgLuminance)

  // WCAG AA requires 4.5:1 for normal text
  const WCAG_AA = 4.5

  // Determine if contrast is sufficient
  const needsAdjustment = actualContrast < WCAG_AA

  // v15.2: Automatically adjust color if needed
  const adjustedColor = needsAdjustment
    ? adjustColorForContrast(initiativeColor, backgroundToTest)
    : initiativeColor

  // Determine recommended background tone based on background luminance
  let recommendedBgTone: 'light' | 'dark' | 'medium'

  if (bgLuminance > 0.6) {
    recommendedBgTone = 'light'
  } else if (bgLuminance < 0.3) {
    recommendedBgTone = 'dark'
  } else {
    recommendedBgTone = 'medium'
  }

  return {
    color: initiativeColor,
    adjustedColor,
    contrastRatio: actualContrast,
    needsAdjustment,
    recommendedBgTone
  }
}

/**
 * Format contrast ratio for display
 *
 * @param ratio - Contrast ratio (1:1 to 21:1)
 * @returns Formatted string (e.g., "4.8:1")
 */
export function formatContrastRatio(ratio: number): string {
  return `${ratio.toFixed(1)}:1`
}

/**
 * Get WCAG compliance level
 *
 * @param ratio - Contrast ratio
 * @returns Compliance level string
 */
export function getWCAGLevel(ratio: number): 'AAA' | 'AA' | 'Fail' {
  if (ratio >= 7.0) return 'AAA'
  if (ratio >= 4.5) return 'AA'
  return 'Fail'
}
