/**
 * Color Verification Utility (v5.4)
 * Verifies that AI-generated images actually use the requested colors
 *
 * Approach: Sample pixels from generated image, extract dominant colors,
 * compare against expected colors with tolerance threshold
 */

/**
 * RGB color representation
 */
interface RGB {
  r: number
  g: number
  b: number
}

/**
 * Color verification result
 */
export interface ColorVerificationResult {
  verified: boolean
  confidence: number // 0.0 - 1.0
  dominantColors: string[] // Hex codes of dominant colors found
  expectedColors: string[] // Hex codes of colors we were looking for
  matches: {
    color: string
    found: boolean
    closestMatch?: string
    distance?: number
  }[]
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): RGB | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null
}

/**
 * Convert RGB to hex
 */
function rgbToHex(rgb: RGB): string {
  const toHex = (n: number) => {
    const hex = Math.round(n).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`
}

/**
 * Calculate perceptual color distance using weighted Euclidean distance
 * Returns 0.0 (identical) to 1.0 (opposite ends of color space)
 *
 * Uses weighted RGB distance (weights from color science research):
 * - Red: 0.3 (less perceptually important)
 * - Green: 0.59 (most perceptually important)
 * - Blue: 0.11 (least perceptually important)
 */
export function calculateColorDistance(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1)
  const rgb2 = hexToRgb(hex2)

  if (!rgb1 || !rgb2) return 1.0 // Max distance if invalid

  // Weighted Euclidean distance (perceptual weighting)
  const rDiff = (rgb1.r - rgb2.r) * 0.3
  const gDiff = (rgb1.g - rgb2.g) * 0.59
  const bDiff = (rgb1.b - rgb2.b) * 0.11

  const distance = Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff)

  // Normalize to 0-1 range (max weighted distance is ~150)
  return Math.min(distance / 150, 1.0)
}

/**
 * Extract dominant colors from image data
 * Uses simple frequency-based clustering
 *
 * @param imageData - Raw pixel data from Canvas API
 * @param topN - Number of dominant colors to return
 * @returns Array of hex color codes
 */
export function extractDominantColors(
  imageData: Uint8ClampedArray,
  topN: number = 5
): string[] {
  // Quantize colors to reduce noise (group similar colors)
  // Quantize to 16 levels per channel (16^3 = 4096 possible colors)
  const quantize = (value: number) => Math.floor(value / 16) * 16

  const colorCounts = new Map<string, number>()

  // Count pixel occurrences (skip alpha channel)
  for (let i = 0; i < imageData.length; i += 4) {
    const r = quantize(imageData[i])
    const g = quantize(imageData[i + 1])
    const b = quantize(imageData[i + 2])

    // Skip very dark (likely shadows) and very light (likely highlights) pixels
    const brightness = (r + g + b) / 3
    if (brightness < 20 || brightness > 235) continue

    const hex = rgbToHex({ r, g, b })
    colorCounts.set(hex, (colorCounts.get(hex) || 0) + 1)
  }

  // Sort by frequency and return top N
  return Array.from(colorCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([hex]) => hex)
}

/**
 * Verify if expected colors appear in generated image
 *
 * @param imageBuffer - Buffer containing the generated image
 * @param expectedColors - Colors we expect to find (hex codes)
 * @param tolerance - Maximum allowed color distance (0.0 - 1.0, default 0.15 = ±15%)
 * @returns Verification result with confidence score
 */
export async function verifyImageColors(
  imageBuffer: Buffer,
  expectedColors: {
    primary: string
    secondary: string
    accent: string
  },
  tolerance: number = 0.15
): Promise<ColorVerificationResult> {
  try {
    // Dynamic import of sharp (server-side only)
    const sharp = (await import('sharp')).default

    // Get image metadata
    const metadata = await sharp(imageBuffer).metadata()
    const { width = 1024, height = 1024 } = metadata

    // Sample pixels from the image (we don't need all pixels, just a representative sample)
    // Sample every 10th pixel for performance (still gives us ~10,000 pixels for a 1024x1024 image)
    const sampleFactor = 10
    const sampledWidth = Math.floor(width / sampleFactor)
    const sampledHeight = Math.floor(height / sampleFactor)

    // Resize to sample size and extract raw pixel data
    const { data: imageData } = await sharp(imageBuffer)
      .resize(sampledWidth, sampledHeight, {
        fit: 'fill',
        kernel: 'nearest' // Preserve colors, don't blend
      })
      .raw()
      .toBuffer({ resolveWithObject: true })

    // Extract dominant colors from sampled pixels
    const dominantColors = extractDominantColors(new Uint8ClampedArray(imageData), 8)

    // Check each expected color against dominant colors
    const expectedArray = [
      expectedColors.primary,
      expectedColors.secondary,
      expectedColors.accent
    ]

    const matches = expectedArray.map(expectedHex => {
      let closestMatch = dominantColors[0]
      let minDistance = 1.0

      // Find closest matching color in dominant colors
      for (const dominantHex of dominantColors) {
        const distance = calculateColorDistance(expectedHex, dominantHex)
        if (distance < minDistance) {
          minDistance = distance
          closestMatch = dominantHex
        }
      }

      const found = minDistance <= tolerance

      return {
        color: expectedHex,
        found,
        closestMatch,
        distance: minDistance
      }
    })

    // Calculate confidence score (percentage of expected colors found)
    const foundCount = matches.filter(m => m.found).length
    const confidence = foundCount / expectedArray.length

    return {
      verified: confidence >= 0.67, // At least 2 out of 3 colors must match
      confidence,
      dominantColors: dominantColors.slice(0, 5), // Return top 5 for logging
      expectedColors: expectedArray,
      matches
    }
  } catch (error) {
    console.error('[COLOR VERIFICATION] Error:', error)

    // Return neutral result on error (don't block generation)
    return {
      verified: false,
      confidence: 0,
      dominantColors: [],
      expectedColors: [expectedColors.primary, expectedColors.secondary, expectedColors.accent],
      matches: [
        { color: expectedColors.primary, found: false },
        { color: expectedColors.secondary, found: false },
        { color: expectedColors.accent, found: false }
      ]
    }
  }
}

/**
 * Format verification result for logging
 */
export function formatVerificationLog(result: ColorVerificationResult): string {
  const { verified, confidence, matches } = result

  const status = verified ? '✅ VERIFIED' : '⚠️ LOW CONFIDENCE'
  const score = `${(confidence * 100).toFixed(0)}%`

  const matchDetails = matches.map(m => {
    const icon = m.found ? '✓' : '✗'
    const distance = m.distance !== undefined ? `(Δ ${(m.distance * 100).toFixed(0)}%)` : ''
    return `${icon} ${m.color} → ${m.closestMatch} ${distance}`
  }).join(', ')

  return `[COLOR VERIFICATION] ${status} ${score} | ${matchDetails}`
}
