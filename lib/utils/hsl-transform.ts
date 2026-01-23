/**
 * HSL Color Transformation Utilities
 *
 * Used by the color shuffle feature to transform image colors while preserving
 * gradients and visual structure. HSL (Hue, Saturation, Lightness) transformations
 * maintain the relative relationships between colors better than direct RGB replacement.
 */

export interface RGB {
  r: number // 0-255
  g: number // 0-255
  b: number // 0-255
}

export interface HSL {
  h: number // 0-360 degrees
  s: number // 0-100 percent
  l: number // 0-100 percent
}

/**
 * Convert RGB color to HSL color space
 * @param r Red (0-255)
 * @param g Green (0-255)
 * @param b Blue (0-255)
 * @returns HSL object
 */
export function rgbToHsl(r: number, g: number, b: number): HSL {
  // Normalize RGB values to 0-1
  r /= 255
  g /= 255
  b /= 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min

  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (delta !== 0) {
    // Calculate saturation
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min)

    // Calculate hue
    switch (max) {
      case r:
        h = ((g - b) / delta + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / delta + 2) / 6
        break
      case b:
        h = ((r - g) / delta + 4) / 6
        break
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  }
}

/**
 * Convert HSL color to RGB color space
 * @param h Hue (0-360 degrees)
 * @param s Saturation (0-100 percent)
 * @param l Lightness (0-100 percent)
 * @returns RGB object
 */
export function hslToRgb(h: number, s: number, l: number): RGB {
  // Normalize HSL values
  h = h / 360
  s = s / 100
  l = l / 100

  let r: number, g: number, b: number

  if (s === 0) {
    // Achromatic (gray)
    r = g = b = l
  } else {
    const hue2rgb = (p: number, q: number, t: number): number => {
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
    b: Math.round(b * 255)
  }
}

/**
 * Convert hex color to RGB
 * @param hex Hex color string (e.g., "#FF6B35" or "FF6B35")
 * @returns RGB object
 */
export function hexToRgb(hex: string): RGB {
  // Remove # if present
  hex = hex.replace(/^#/, '')

  // Parse hex values
  const bigint = parseInt(hex, 16)
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255

  return { r, g, b }
}

/**
 * Convert RGB to hex color
 * @param r Red (0-255)
 * @param g Green (0-255)
 * @param b Blue (0-255)
 * @returns Hex color string (e.g., "#FF6B35")
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b]
    .map(x => {
      const hex = Math.round(x).toString(16)
      return hex.length === 1 ? '0' + hex : hex
    })
    .join('')
}

/**
 * Convert hex color to HSL
 * @param hex Hex color string (e.g., "#FF6B35")
 * @returns HSL object
 */
export function hexToHsl(hex: string): HSL {
  const rgb = hexToRgb(hex)
  return rgbToHsl(rgb.r, rgb.g, rgb.b)
}

/**
 * Convert HSL to hex color
 * @param h Hue (0-360 degrees)
 * @param s Saturation (0-100 percent)
 * @param l Lightness (0-100 percent)
 * @returns Hex color string (e.g., "#FF6B35")
 */
export function hslToHex(h: number, s: number, l: number): string {
  const rgb = hslToRgb(h, s, l)
  return rgbToHex(rgb.r, rgb.g, rgb.b)
}

/**
 * Calculate color distance using Delta E (CIE76)
 * Simpler version for quick color matching
 * @param rgb1 First RGB color
 * @param rgb2 Second RGB color
 * @returns Distance value (lower = more similar)
 */
export function colorDistance(rgb1: RGB, rgb2: RGB): number {
  const rDiff = rgb1.r - rgb2.r
  const gDiff = rgb1.g - rgb2.g
  const bDiff = rgb1.b - rgb2.b

  return Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff)
}

/**
 * Calculate luminance of an RGB color (perceived brightness)
 * Uses relative luminance formula from WCAG
 * @param r Red (0-255)
 * @param g Green (0-255)
 * @param b Blue (0-255)
 * @returns Luminance value (0-1, higher = brighter)
 */
export function calculateLuminance(r: number, g: number, b: number): number {
  // Normalize to 0-1
  const [rs, gs, bs] = [r, g, b].map(c => {
    const normalized = c / 255
    return normalized <= 0.03928
      ? normalized / 12.92
      : Math.pow((normalized + 0.055) / 1.055, 2.4)
  })

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

/**
 * Determine if a color is dark or light based on luminance
 * @param hex Hex color string
 * @returns true if dark, false if light
 */
export function isColorDark(hex: string): boolean {
  const rgb = hexToRgb(hex)
  const luminance = calculateLuminance(rgb.r, rgb.g, rgb.b)
  return luminance < 0.5
}

/**
 * Shift hue while preserving saturation and lightness
 * This is the key function for color shuffle that maintains gradients
 * @param sourceHex Source color hex
 * @param targetHex Target color hex (provides target hue)
 * @returns New hex color with shifted hue
 */
export function shiftHue(sourceHex: string, targetHex: string): string {
  const sourceHsl = hexToHsl(sourceHex)
  const targetHsl = hexToHsl(targetHex)

  // Shift hue to target, but keep original saturation and lightness
  // This preserves gradients and tonal variations
  return hslToHex(targetHsl.h, sourceHsl.s, sourceHsl.l)
}

/**
 * Calculate contrast ratio between two colors
 * @param hex1 First hex color
 * @param hex2 Second hex color
 * @returns Contrast ratio (1-21, higher = more contrast)
 */
export function contrastRatio(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1)
  const rgb2 = hexToRgb(hex2)

  const lum1 = calculateLuminance(rgb1.r, rgb1.g, rgb1.b)
  const lum2 = calculateLuminance(rgb2.r, rgb2.g, rgb2.b)

  const lighter = Math.max(lum1, lum2)
  const darker = Math.min(lum1, lum2)

  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Adjust lightness of a color to ensure minimum contrast
 * @param textHex Text color hex
 * @param bgHex Background color hex
 * @param minContrast Minimum contrast ratio (4.5 for WCAG AA)
 * @returns Adjusted text color hex
 */
export function ensureContrast(
  textHex: string,
  bgHex: string,
  minContrast: number = 4.5
): string {
  let currentContrast = contrastRatio(textHex, bgHex)

  if (currentContrast >= minContrast) {
    return textHex // Already meets contrast
  }

  const hsl = hexToHsl(textHex)
  const bgHsl = hexToHsl(bgHex)

  // Determine if we should lighten or darken
  const shouldLighten = bgHsl.l < 50

  let adjustedL = hsl.l

  // Iteratively adjust lightness
  for (let i = 0; i < 100; i++) {
    if (shouldLighten) {
      adjustedL = Math.min(100, adjustedL + 1)
    } else {
      adjustedL = Math.max(0, adjustedL - 1)
    }

    const adjustedHex = hslToHex(hsl.h, hsl.s, adjustedL)
    currentContrast = contrastRatio(adjustedHex, bgHex)

    if (currentContrast >= minContrast) {
      return adjustedHex
    }

    // Prevent infinite loop
    if (adjustedL === 0 || adjustedL === 100) {
      break
    }
  }

  // If still not enough contrast, return pure white or black
  return shouldLighten ? '#FFFFFF' : '#000000'
}
