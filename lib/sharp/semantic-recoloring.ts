/**
 * Semantic Recoloring with Sharp and HSL Transformation
 *
 * Core image processing for color shuffle feature. Uses HSL hue-shifting to
 * recolor images while preserving gradients, transparency, and visual structure.
 *
 * Features:
 * - Content zone targeting (40%-70% of canvas)
 * - HSL hue-shifting (preserves saturation and lightness)
 * - Gradient preservation
 * - Transparent logo bar protection
 * - Fast processing (~500ms per image)
 */

import sharp from 'sharp'
import type { ColorMapping } from '@/lib/utils/color-mapping'
import {
  rgbToHsl,
  hslToRgb,
  hexToHsl,
  colorDistance,
  hexToRgb,
  type RGB,
  type HSL
} from '@/lib/utils/hsl-transform'

// ============================================================
// TYPES
// ============================================================

export interface ContentZoneBounds {
  topPercent: number // e.g., 40
  bottomPercent: number // e.g., 70
}

export interface RecolorOptions {
  colorMappings: ColorMapping[]
  contentZone: ContentZoneBounds
  toleranceThreshold?: number // Color matching tolerance (0-255, default: 70)
  fullCanvas?: boolean // Override zone restriction (default: true) - recolor entire canvas
  logoMask?: Array<{ topPixel: number; bottomPixel: number }> // Logo strip regions to exclude from recoloring
  adaptiveTolerance?: boolean // Enable adaptive tolerance scaling based on confidence (default: true)
}

export interface RecolorResult {
  buffer: Buffer
  pixelsChanged: number
  processingTimeMs: number
}

// ============================================================
// CONSTANTS
// ============================================================

const DEFAULT_TOLERANCE = 70 // RGB distance threshold - increased to catch anti-aliased text pixels (distance up to ~46)
const POSTER_WIDTH = 1080
const POSTER_HEIGHT = 1440

// ============================================================
// MAIN FUNCTION
// ============================================================

/**
 * Recolor image using HSL hue-shifting while preserving gradients
 * @param imageBuffer Original image buffer
 * @param options Recoloring options (mappings and zone bounds)
 * @returns Recolored image buffer and statistics
 */
export async function recolorImage(
  imageBuffer: Buffer,
  options: RecolorOptions
): Promise<RecolorResult> {
  console.log('[Semantic Recolor] Starting recolor with', options.colorMappings.length, 'mappings')
  const startTime = Date.now()

  const tolerance = options.toleranceThreshold || DEFAULT_TOLERANCE
  const useFullCanvas = options.fullCanvas ?? true // Default to full canvas recoloring

  // Get image metadata
  const metadata = await sharp(imageBuffer).metadata()
  const width = metadata.width || POSTER_WIDTH
  const height = metadata.height || POSTER_HEIGHT

  // Calculate content zone pixel bounds
  const topPixel = useFullCanvas ? 0 : Math.round(height * (options.contentZone.topPercent / 100))
  const bottomPixel = useFullCanvas ? height : Math.round(height * (options.contentZone.bottomPercent / 100))
  const zoneHeight = bottomPixel - topPixel

  console.log('[Semantic Recolor] Content zone:', {
    topPixel,
    bottomPixel,
    zoneHeight,
    percentage: useFullCanvas ? '0%-100% (full canvas)' : `${options.contentZone.topPercent}%-${options.contentZone.bottomPercent}%`,
    fullCanvas: useFullCanvas,
    logoMaskRegions: options.logoMask?.length || 0
  })

  // Extract content zone
  const contentZoneBuffer = await sharp(imageBuffer)
    .extract({
      left: 0,
      top: topPixel,
      width,
      height: zoneHeight
    })
    .raw()
    .toBuffer()

  // Transform pixels
  const { transformedBuffer, pixelsChanged } = transformPixels(
    contentZoneBuffer,
    width,
    zoneHeight,
    options.colorMappings,
    tolerance,
    topPixel, // Pass offset for logo mask calculation
    options.logoMask,
    options.adaptiveTolerance ?? true
  )

  // Convert transformed buffer back to image
  const recoloredZone = await sharp(transformedBuffer, {
    raw: {
      width,
      height: zoneHeight,
      channels: 4 // RGBA
    }
  })
    .png()
    .toBuffer()

  // Composite recolored zone back into original image
  const finalImage = await sharp(imageBuffer)
    .composite([
      {
        input: recoloredZone,
        top: topPixel,
        left: 0
      }
    ])
    .png()
    .toBuffer()

  const processingTimeMs = Date.now() - startTime

  console.log('[Semantic Recolor] Complete:', {
    pixelsChanged,
    processingTimeMs,
    changeRate: ((pixelsChanged / (width * zoneHeight)) * 100).toFixed(2) + '%'
  })

  return {
    buffer: finalImage,
    pixelsChanged,
    processingTimeMs
  }
}

// ============================================================
// PIXEL TRANSFORMATION
// ============================================================

/**
 * Transform pixels using HSL hue-shifting
 * This is where the magic happens - we shift hue while preserving saturation and lightness
 * Includes gray color handling and logo masking
 */
function transformPixels(
  buffer: Buffer,
  width: number,
  height: number,
  mappings: ColorMapping[],
  baseTolerance: number,
  zoneTopPixel: number = 0, // Offset for logo mask calculation
  logoMask?: Array<{ topPixel: number; bottomPixel: number }>,
  adaptiveTolerance: boolean = true
): {
  transformedBuffer: Buffer
  pixelsChanged: number
} {
  const pixels = new Uint8ClampedArray(buffer)
  let pixelsChanged = 0

  // Pre-calculate target hues and colors for each mapping
  const mappingData = mappings.map(mapping => {
    const fromRgb = hexToRgb(mapping.fromColor)
    const toRgb = hexToRgb(mapping.toColor)
    const toHsl = hexToHsl(mapping.toColor)

    return {
      fromRgb,
      toRgb,
      toHue: toHsl.h,
      toHsl,
      toColor: mapping.toColor,
      preserveContrast: mapping.preserveContrast,
      zone: mapping.zone,
      confidence: mapping.confidence // For adaptive tolerance
    }
  })

  // Process each pixel
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i]
    const g = pixels[i + 1]
    const b = pixels[i + 2]
    const a = pixels[i + 3]

    // Skip fully transparent pixels
    if (a === 0) {
      continue
    }

    // Calculate pixel position for logo masking
    const pixelIndex = i / 4
    const y = Math.floor(pixelIndex / width) + zoneTopPixel // Absolute Y position

    // Skip pixels in logo strip regions
    if (logoMask) {
      const inLogoStrip = logoMask.some(region => y >= region.topPixel && y < region.bottomPixel)
      if (inLogoStrip) {
        continue
      }
    }

    // Find best matching color mapping with adaptive tolerance
    let bestMatch = null
    let bestDistance = Infinity

    for (const mapping of mappingData) {
      // Calculate tolerance for this mapping
      let tolerance = baseTolerance

      // Apply adaptive tolerance based on confidence
      if (adaptiveTolerance && mapping.confidence) {
        // Low confidence → increase tolerance (more permissive)
        // High confidence → use base tolerance (more selective)
        const confidenceValue = parseFloat(mapping.confidence)
        if (!isNaN(confidenceValue)) {
          tolerance = baseTolerance + (50 * (1 - confidenceValue))
        }
      }

      const distance = colorDistance(
        { r, g, b },
        mapping.fromRgb
      )

      if (distance < tolerance && distance < bestDistance) {
        bestDistance = distance
        bestMatch = mapping
      }
    }

    // Apply transformation if match found
    if (bestMatch) {
      const currentHsl = rgbToHsl(r, g, b)

      // Check if this is a gray/desaturated color (saturation < 15%)
      const isGrayColor = currentHsl.s < 15

      let newHsl: HSL

      if (isGrayColor) {
        // Gray colors can't be hue-shifted effectively
        // Strategy: Add saturation and blend lightness with target

        // Calculate lightness ratio (how light/dark is this gray)
        const lightnessRatio = currentHsl.l / 100 // 0.0 (black) to 1.0 (white)

        newHsl = {
          h: bestMatch.toHsl.h, // Use target hue
          s: Math.max(bestMatch.toHsl.s * 0.8, 25), // Add saturation (at least 25%)
          l: bestMatch.toHsl.l * (0.4 + lightnessRatio * 0.6) // Blend: 40% target + 60% scaled by gray position
        }

        // For very dark grays (L < 20), use darker version
        if (currentHsl.l < 20) {
          newHsl.l = Math.min(newHsl.l, 30)
        }
        // For very light grays (L > 80), use lighter version
        else if (currentHsl.l > 80) {
          newHsl.l = Math.max(newHsl.l, 70)
        }
      } else {
        // Normal colors: Shift hue, preserve saturation and lightness
        // This is KEY for gradient preservation
        newHsl = {
          h: bestMatch.toHue,
          s: currentHsl.s,
          l: currentHsl.l
        }

        // For text zones, optionally adjust lightness for contrast
        if (bestMatch.preserveContrast && bestMatch.zone === 'text') {
          // Keep text light/dark polarity
          if (currentHsl.l > 50 && newHsl.l < 50) {
            newHsl.l = Math.max(80, newHsl.l)
          } else if (currentHsl.l < 50 && newHsl.l > 50) {
            newHsl.l = Math.min(20, newHsl.l)
          }
        }
      }

      const newRgb = hslToRgb(newHsl.h, newHsl.s, newHsl.l)

      pixels[i] = newRgb.r
      pixels[i + 1] = newRgb.g
      pixels[i + 2] = newRgb.b
      // Keep original alpha

      pixelsChanged++
    }
  }

  return {
    transformedBuffer: Buffer.from(pixels),
    pixelsChanged
  }
}

// ============================================================
// THUMBNAIL GENERATION
// ============================================================

/**
 * Generate thumbnail for carousel preview
 * @param imageBuffer Recolored full-size image
 * @param width Target width (default: 80px)
 * @param height Target height (default: 107px)
 * @returns Thumbnail buffer
 */
export async function generateThumbnail(
  imageBuffer: Buffer,
  width: number = 80,
  height: number = 107
): Promise<Buffer> {
  return await sharp(imageBuffer)
    .resize(width, height, {
      fit: 'cover',
      position: 'center'
    })
    .jpeg({ quality: 80 })
    .toBuffer()
}

// ============================================================
// BATCH RECOLORING
// ============================================================

/**
 * Recolor image with multiple color combinations in parallel
 * Used by color-shuffle API to generate 5 variants quickly
 */
export async function recolorImageBatch(
  imageBuffer: Buffer,
  colorCombinations: Array<{
    mappings: ColorMapping[]
    combinationIndex: number
  }>,
  contentZone: ContentZoneBounds,
  options?: {
    fullCanvas?: boolean
    logoMask?: Array<{ topPixel: number; bottomPixel: number }>
    adaptiveTolerance?: boolean
    toleranceThreshold?: number
  }
): Promise<Array<{
  buffer: Buffer
  thumbnail: Buffer
  combinationIndex: number
  processingTimeMs: number
}>> {
  console.log('[Semantic Recolor] Batch processing', colorCombinations.length, 'variants')

  const results = await Promise.all(
    colorCombinations.map(async (combination) => {
      const startTime = Date.now()

      const recolorResult = await recolorImage(imageBuffer, {
        colorMappings: combination.mappings,
        contentZone,
        fullCanvas: options?.fullCanvas,
        logoMask: options?.logoMask,
        adaptiveTolerance: options?.adaptiveTolerance,
        toleranceThreshold: options?.toleranceThreshold
      })

      const thumbnail = await generateThumbnail(recolorResult.buffer)

      return {
        buffer: recolorResult.buffer,
        thumbnail,
        combinationIndex: combination.combinationIndex,
        processingTimeMs: Date.now() - startTime
      }
    })
  )

  console.log('[Semantic Recolor] Batch complete:', {
    totalVariants: results.length,
    avgProcessingTime: (results.reduce((sum, r) => sum + r.processingTimeMs, 0) / results.length).toFixed(0) + 'ms'
  })

  return results
}

// ============================================================
// VALIDATION
// ============================================================

/**
 * Validate image dimensions and format
 * @param imageBuffer Image buffer to validate
 * @returns true if valid, throws error if invalid
 */
export async function validateImage(imageBuffer: Buffer): Promise<boolean> {
  const metadata = await sharp(imageBuffer).metadata()

  if (!metadata.width || !metadata.height) {
    throw new Error('Could not determine image dimensions')
  }

  // Check if image is reasonably sized (not too small, not too large)
  if (metadata.width < 500 || metadata.height < 500) {
    throw new Error('Image too small (minimum 500x500)')
  }

  if (metadata.width > 5000 || metadata.height > 5000) {
    throw new Error('Image too large (maximum 5000x5000)')
  }

  // Check format
  if (!['jpeg', 'png', 'webp'].includes(metadata.format || '')) {
    throw new Error('Unsupported image format (use JPEG, PNG, or WebP)')
  }

  return true
}

// ============================================================
// DEBUG HELPERS
// ============================================================

/**
 * Generate a side-by-side comparison image for debugging
 * @param originalBuffer Original image
 * @param recoloredBuffer Recolored image
 * @returns Side-by-side comparison buffer
 */
export async function createComparisonImage(
  originalBuffer: Buffer,
  recoloredBuffer: Buffer
): Promise<Buffer> {
  const original = sharp(originalBuffer)
  const recolored = sharp(recoloredBuffer)

  const metadata = await original.metadata()
  const width = metadata.width || POSTER_WIDTH
  const height = metadata.height || POSTER_HEIGHT

  // Create canvas with double width
  return await sharp({
    create: {
      width: width * 2 + 10, // 10px gap
      height,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 1 }
    }
  })
    .composite([
      { input: await original.toBuffer(), left: 0, top: 0 },
      { input: await recolored.toBuffer(), left: width + 10, top: 0 }
    ])
    .png()
    .toBuffer()
}
