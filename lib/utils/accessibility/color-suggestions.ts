/**
 * Accessible Color Suggestion Algorithm
 * Uses binary search to find accessible color alternatives
 * Preserves hue while adjusting lightness to meet WCAG contrast requirements
 *
 * Strategy:
 * - Keep hue and saturation constant (preserves color family)
 * - Adjust lightness using binary search
 * - Find minimum lightness change that meets target contrast
 */

import { hexToRgb } from '@/lib/utils/color-names'
import { getContrastRatio, meetsWCAG_AA, meetsWCAG_AAA } from './contrast'

/**
 * Convert RGB to HEX
 */
function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

/**
 * Convert RGB to HSL
 */
function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255
  g /= 255
  b /= 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }

  return {
    h: h * 360,
    s: s * 100,
    l: l * 100,
  }
}

/**
 * Convert HSL to RGB
 */
function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h /= 360
  s /= 100
  l /= 100

  let r: number, g: number, b: number

  if (s === 0) {
    r = g = b = l // Achromatic (gray)
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q

    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  }
}

/**
 * Convert HEX to HSL
 */
function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  const rgb = hexToRgb(hex)
  if (!rgb) return null
  return rgbToHsl(rgb.r, rgb.g, rgb.b)
}

/**
 * Convert HSL to HEX
 */
function hslToHex(h: number, s: number, l: number): string {
  const rgb = hslToRgb(h, s, l)
  return rgbToHex(rgb.r, rgb.g, rgb.b)
}

/**
 * Suggest an accessible color alternative using binary search
 * Preserves hue and saturation, adjusts lightness
 *
 * @param foreground - Foreground color (text) in HEX
 * @param background - Background color in HEX
 * @param targetLevel - Target WCAG level ('AA' or 'AAA')
 * @param isLargeText - Whether text is large
 * @param adjustForeground - Whether to adjust foreground (true) or background (false)
 * @returns Suggested accessible color or null if impossible
 */
export function suggestAccessibleColor(
  foreground: string,
  background: string,
  targetLevel: 'AA' | 'AAA' = 'AA',
  isLargeText = false,
  adjustForeground = true
): string | null {
  // Get target contrast ratio
  const targetRatio = targetLevel === 'AAA'
    ? (isLargeText ? 4.5 : 7)
    : (isLargeText ? 3 : 4.5)

  // Convert color to adjust to HSL
  const colorToAdjust = adjustForeground ? foreground : background
  const fixedColor = adjustForeground ? background : foreground
  const hsl = hexToHsl(colorToAdjust)

  if (!hsl) return null

  // Try binary search for lighter version
  let suggestedLight = binarySearchLightness(
    hsl.h,
    hsl.s,
    hsl.l,
    100,
    fixedColor,
    targetRatio,
    adjustForeground
  )

  // Try binary search for darker version
  let suggestedDark = binarySearchLightness(
    hsl.h,
    hsl.s,
    0,
    hsl.l,
    fixedColor,
    targetRatio,
    adjustForeground
  )

  // Choose the suggestion that requires less lightness change
  if (suggestedLight && suggestedDark) {
    const lightChange = Math.abs(100 - hsl.l)
    const darkChange = Math.abs(0 - hsl.l)
    return lightChange < darkChange ? suggestedLight : suggestedDark
  }

  return suggestedLight || suggestedDark
}

/**
 * Binary search for accessible lightness value
 *
 * @param h - Hue (0-360)
 * @param s - Saturation (0-100)
 * @param minL - Minimum lightness (0-100)
 * @param maxL - Maximum lightness (0-100)
 * @param otherColor - The color to contrast against
 * @param targetRatio - Target contrast ratio
 * @param adjustingForeground - Whether we're adjusting foreground color
 * @returns Accessible color in HEX or null
 */
function binarySearchLightness(
  h: number,
  s: number,
  minL: number,
  maxL: number,
  otherColor: string,
  targetRatio: number,
  adjustingForeground: boolean
): string | null {
  const MAX_ITERATIONS = 20
  const TOLERANCE = 0.1 // Accept ratio within 0.1 of target

  let low = minL
  let high = maxL
  let bestColor: string | null = null
  let bestRatio = 0

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const mid = (low + high) / 2
    const testColor = hslToHex(h, s, mid)

    const ratio = adjustingForeground
      ? getContrastRatio(testColor, otherColor)
      : getContrastRatio(otherColor, testColor)

    if (!ratio) return null

    // If we found a color that meets the target, save it
    if (ratio >= targetRatio - TOLERANCE) {
      if (!bestColor || Math.abs(ratio - targetRatio) < Math.abs(bestRatio - targetRatio)) {
        bestColor = testColor
        bestRatio = ratio
      }
    }

    // If ratio is too low, we need more contrast
    if (ratio < targetRatio) {
      // Move toward more extreme lightness
      if (mid > 50) {
        // Current color is light (mid > 50), need MORE contrast by going DARKER
        // Darker = lower lightness values, so search lower range
        high = mid  // Fixed: was incorrectly `low = mid`
      } else {
        // Current color is dark (mid <= 50), need MORE contrast by going LIGHTER
        // Lighter = higher lightness values, so search higher range
        low = mid
      }
    } else {
      // Ratio is sufficient, try to minimize change
      if (mid > 50) {
        // Current color is light, try to be less light (darker) to minimize change
        high = mid
      } else {
        // Current color is dark, try to be less dark (lighter) to minimize change
        low = mid
      }
    }

    // If range is too small, stop
    if (Math.abs(high - low) < 0.5) break
  }

  return bestColor
}

/**
 * Suggest multiple accessible color alternatives
 *
 * @param foreground - Foreground color in HEX
 * @param background - Background color in HEX
 * @param targetLevel - Target WCAG level
 * @param isLargeText - Whether text is large
 * @returns Array of suggested colors with metadata
 */
export function suggestAccessibleColors(
  foreground: string,
  background: string,
  targetLevel: 'AA' | 'AAA' = 'AA',
  isLargeText = false
): Array<{
  color: string
  type: 'lighter' | 'darker' | 'inverted'
  contrastRatio: number
  description: string
}> {
  const suggestions: Array<{
    color: string
    type: 'lighter' | 'darker' | 'inverted'
    contrastRatio: number
    description: string
  }> = []

  // Try adjusting foreground lighter
  const lighterFg = suggestAccessibleColor(foreground, background, targetLevel, isLargeText, true)
  if (lighterFg) {
    const ratio = getContrastRatio(lighterFg, background)
    if (ratio) {
      const fgHsl = hexToHsl(foreground)
      const suggestedHsl = hexToHsl(lighterFg)
      if (fgHsl && suggestedHsl && suggestedHsl.l > fgHsl.l) {
        suggestions.push({
          color: lighterFg,
          type: 'lighter',
          contrastRatio: ratio,
          description: 'Lighter version of your color',
        })
      }
    }
  }

  // Try adjusting foreground darker
  // Fixed: Use adjustForeground = false to get different suggestions by adjusting background
  const darkerFg = suggestAccessibleColor(foreground, background, targetLevel, isLargeText, false)
  if (darkerFg && darkerFg !== lighterFg) {
    const ratio = getContrastRatio(darkerFg, background)
    if (ratio) {
      const fgHsl = hexToHsl(foreground)
      const suggestedHsl = hexToHsl(darkerFg)
      if (fgHsl && suggestedHsl && suggestedHsl.l < fgHsl.l) {
        suggestions.push({
          color: darkerFg,
          type: 'darker',
          contrastRatio: ratio,
          description: 'Darker version of your color',
        })
      }
    }
  }

  // Try inverting colors (swap foreground and background)
  const invertedRatio = getContrastRatio(background, foreground)
  if (invertedRatio && invertedRatio >= (targetLevel === 'AAA' ? (isLargeText ? 4.5 : 7) : (isLargeText ? 3 : 4.5))) {
    suggestions.push({
      color: background,
      type: 'inverted',
      contrastRatio: invertedRatio,
      description: 'Swap text and background colors',
    })
  }

  return suggestions.sort((a, b) => b.contrastRatio - a.contrastRatio)
}

/**
 * Get a quick accessible alternative (lighter or darker)
 * Convenience function for simple use cases
 *
 * @param color - Color to adjust in HEX
 * @param background - Background color in HEX
 * @returns Accessible alternative or null
 */
export function getAccessibleAlternative(color: string, background: string): string | null {
  return suggestAccessibleColor(color, background, 'AA', false, true)
}
