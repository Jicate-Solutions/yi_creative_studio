/**
 * WCAG Contrast Calculator
 * Implements WCAG 2.1 contrast ratio calculations for accessibility compliance
 *
 * Standards:
 * - WCAG AA: 4.5:1 for normal text, 3:1 for large text (≥18pt or ≥14pt bold)
 * - WCAG AAA: 7:1 for normal text, 4.5:1 for large text
 *
 * References:
 * - https://www.w3.org/TR/WCAG21/#contrast-minimum
 * - https://www.w3.org/TR/WCAG21/#contrast-enhanced
 */

import { hexToRgb } from '@/lib/utils/color-names'

/**
 * Linearize an sRGB color component for luminance calculation
 * Formula: if RsRGB <= 0.03928 then R = RsRGB/12.92 else R = ((RsRGB+0.055)/1.055)^2.4
 */
function linearizeColorComponent(component: number): number {
  const normalized = component / 255
  return normalized <= 0.03928
    ? normalized / 12.92
    : Math.pow((normalized + 0.055) / 1.055, 2.4)
}

/**
 * Calculate relative luminance of an RGB color
 * Formula: L = 0.2126 * R + 0.7152 * G + 0.0722 * B (using linearized RGB values)
 *
 * @param r - Red component (0-255)
 * @param g - Green component (0-255)
 * @param b - Blue component (0-255)
 * @returns Relative luminance (0-1)
 */
export function getRelativeLuminance(r: number, g: number, b: number): number {
  const R = linearizeColorComponent(r)
  const G = linearizeColorComponent(g)
  const B = linearizeColorComponent(b)

  return 0.2126 * R + 0.7152 * G + 0.0722 * B
}

/**
 * Calculate contrast ratio between two colors
 * Formula: (L1 + 0.05) / (L2 + 0.05) where L1 is the lighter color
 *
 * @param color1 - First color in HEX format (#RRGGBB)
 * @param color2 - Second color in HEX format (#RRGGBB)
 * @returns Contrast ratio (1-21) or null if invalid colors
 */
export function getContrastRatio(color1: string, color2: string): number | null {
  const rgb1 = hexToRgb(color1)
  const rgb2 = hexToRgb(color2)

  if (!rgb1 || !rgb2) {
    return null
  }

  const L1 = getRelativeLuminance(rgb1.r, rgb1.g, rgb1.b)
  const L2 = getRelativeLuminance(rgb2.r, rgb2.g, rgb2.b)

  // L1 should be the lighter color (higher luminance)
  const lighter = Math.max(L1, L2)
  const darker = Math.min(L1, L2)

  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Check if contrast ratio meets WCAG AA standards
 * - Normal text: 4.5:1
 * - Large text (≥18pt or ≥14pt bold): 3:1
 *
 * @param contrastRatio - Contrast ratio to check
 * @param isLargeText - Whether the text is considered large (≥18pt or ≥14pt bold)
 * @returns true if meets WCAG AA
 */
export function meetsWCAG_AA(contrastRatio: number, isLargeText = false): boolean {
  const threshold = isLargeText ? 3 : 4.5
  return contrastRatio >= threshold
}

/**
 * Check if contrast ratio meets WCAG AAA standards
 * - Normal text: 7:1
 * - Large text (≥18pt or ≥14pt bold): 4.5:1
 *
 * @param contrastRatio - Contrast ratio to check
 * @param isLargeText - Whether the text is considered large (≥18pt or ≥14pt bold)
 * @returns true if meets WCAG AAA
 */
export function meetsWCAG_AAA(contrastRatio: number, isLargeText = false): boolean {
  const threshold = isLargeText ? 4.5 : 7
  return contrastRatio >= threshold
}

/**
 * Get WCAG compliance level for a contrast ratio
 *
 * @param contrastRatio - Contrast ratio to check
 * @param isLargeText - Whether the text is considered large
 * @returns 'AAA' | 'AA' | 'A' | null
 */
export function getWCAGLevel(
  contrastRatio: number,
  isLargeText = false
): 'AAA' | 'AA' | 'A' | null {
  if (meetsWCAG_AAA(contrastRatio, isLargeText)) {
    return 'AAA'
  }
  if (meetsWCAG_AA(contrastRatio, isLargeText)) {
    return 'AA'
  }
  // WCAG Level A doesn't have specific contrast requirements
  // If it doesn't meet AA, it fails
  return null
}

/**
 * Check if two colors have sufficient contrast for text
 *
 * @param foreground - Foreground color (text) in HEX
 * @param background - Background color in HEX
 * @param isLargeText - Whether the text is large
 * @param level - Target WCAG level ('AA' or 'AAA')
 * @returns { passes: boolean, ratio: number, level: string | null }
 */
export function checkTextContrast(
  foreground: string,
  background: string,
  isLargeText = false,
  level: 'AA' | 'AAA' = 'AA'
): {
  passes: boolean
  ratio: number | null
  level: 'AAA' | 'AA' | 'A' | null
} {
  const ratio = getContrastRatio(foreground, background)

  if (ratio === null) {
    return { passes: false, ratio: null, level: null }
  }

  const actualLevel = getWCAGLevel(ratio, isLargeText)
  const passes = level === 'AA'
    ? meetsWCAG_AA(ratio, isLargeText)
    : meetsWCAG_AAA(ratio, isLargeText)

  return {
    passes,
    ratio: Math.round(ratio * 100) / 100, // Round to 2 decimal places
    level: actualLevel,
  }
}
