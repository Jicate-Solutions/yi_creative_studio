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
  toleranceThreshold?: number // Color matching tolerance (0-255, default: 30)
}

export interface RecolorResult {
  buffer: Buffer
  pixelsChanged: number
  processingTimeMs: number
}

// ============================================================
// CONSTANTS
// ============================================================

const DEFAULT_TOLERANCE = 30 // RGB distance threshold for color matching
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

  // Get image metadata
  const metadata = await sharp(imageBuffer).metadata()
  const width = metadata.width || POSTER_WIDTH
  const height = metadata.height || POSTER_HEIGHT

  // Calculate content zone pixel bounds
  const topPixel = Math.round(height * (options.contentZone.topPercent / 100))
  const bottomPixel = Math.round(height * (options.contentZone.bottomPercent / 100))
  const zoneHeight = bottomPixel - topPixel

  console.log('[Semantic Recolor] Content zone:', {
    topPixel,
    bottomPixel,
    zoneHeight,
    percentage: `${options.contentZone.topPercent}%-${options.contentZone.bottomPercent}%`
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
    tolerance
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
 */
function transformPixels(
  buffer: Buffer,
  width: number,
  height: number,
  mappings: ColorMapping[],
  tolerance: number
): {
  transformedBuffer: Buffer
  pixelsChanged: number
} {
  const pixels = new Uint8ClampedArray(buffer)
  let pixelsChanged = 0

  // Pre-calculate target hues for each mapping
  const mappingData = mappings.map(mapping => {
    const fromRgb = hexToRgb(mapping.fromColor)
    const toHsl = hexToHsl(mapping.toColor)

    return {
      fromRgb,
      toHue: toHsl.h,
      preserveContrast: mapping.preserveContrast,
      zone: mapping.zone
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

    // Find best matching color mapping
    let bestMatch = null
    let bestDistance = Infinity

    for (const mapping of mappingData) {
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

      // Shift hue to target, but preserve saturation and lightness
      // This is KEY for gradient preservation
      const newHsl: HSL = {
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
  contentZone: ContentZoneBounds
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
        contentZone
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
