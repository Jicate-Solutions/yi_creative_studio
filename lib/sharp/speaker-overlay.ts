import sharp from 'sharp'
import type {
  SpeakerPhotoCustomization,
  PhotoPosition,
  PhotoShape,
  PhotoVerticalPosition,
  SpeakerItem,
  LayoutMode,
  LayoutStrategy,
} from '@/lib/config/design-constants'
import { normalizeSpeakerConfig, getSpeakerCount } from '@/lib/utils/speaker-migration'
import { findSafePositionWithPreference, findSafeOverlayZoneNearText } from './intelligent-positioning'
import { detectSpeakerTextPosition } from '@/lib/ai/vision/text-detector'
import type { MultiSpeakerLayout } from '@/lib/config/multi-speaker-layouts'

// Re-export types for use by other modules
export type { LayoutStrategy }

interface SpeakerOverlayConfig {
  baseImageBuffer: Buffer
  speakerPhoto: SpeakerPhotoCustomization
}

/**
 * Calculate x position based on PhotoPosition ('left', 'center', 'right')
 */
function calculateXPosition(
  position: PhotoPosition,
  imageWidth: number,
  photoSize: number,
  padding: number
): number {
  switch (position) {
    case 'left':
      return padding
    case 'center':
      return Math.floor((imageWidth - photoSize) / 2)
    case 'right':
      return imageWidth - photoSize - padding
    default:
      return Math.floor((imageWidth - photoSize) / 2)
  }
}

/**
 * Calculate y position based on PhotoVerticalPosition
 *
 * SEMANTIC BEHAVIOR (v6.6 clarification):
 * - Percentages represent where the photo CENTER should be positioned
 * - Function calculates TOP edge by subtracting half the photo size
 * - photoSize MUST include borders AND shadow padding for accurate positioning
 *
 * @param verticalPosition - Vertical position preset (top/upper/middle/lower/bottom)
 * @param imageHeight - Total image height in pixels
 * @param photoSize - TOTAL size including borders + shadow padding
 * @param padding - Minimum edge padding in pixels
 * @returns Y-coordinate for photo TOP edge
 *
 * @example
 * // "lower" position on 1350px image with 136px total photo size:
 * // - Center target: 1350 * 0.65 = 877px
 * // - Top edge: 877 - 68 = 809px
 * // - Bottom edge: 809 + 136 = 945px
 */
function calculateYPosition(
  verticalPosition: PhotoVerticalPosition | undefined,
  imageHeight: number,
  photoSize: number,  // CRITICAL: Must include shadow padding
  padding: number
): number {
  // Percentages define where photo CENTER should be
  const positionPercentages: Record<PhotoVerticalPosition, number> = {
    'top': 0.15,      // Center at 15% from top
    'upper': 0.30,    // Center at 30% from top
    'middle': 0.50,   // Center at 50% (exact middle)
    'lower': 0.65,    // Center at 65% from top
    'bottom': 0.80,   // Center at 80% from top
  }

  const percentage = positionPercentages[verticalPosition || 'lower'] || 0.65
  const baseY = Math.floor(imageHeight * percentage)

  // Ensure photo stays within bounds with padding
  const maxY = imageHeight - photoSize - padding
  const minY = padding

  return Math.max(minY, Math.min(baseY - Math.floor(photoSize / 2), maxY))
}

/**
 * Calculate exact speaker photo coordinates for pre-generation use
 * This function enables coordination between Gemini prompt generation and Sharp overlay
 *
 * @param config - Photo configuration
 * @param dimensions - Image dimensions
 * @returns Exact pixel coordinates and bounding box information
 */
export function calculateSpeakerPhotoCoordinates(
  config: {
    position: PhotoPosition
    verticalPosition?: PhotoVerticalPosition
    size: number
    borderWidth?: number
    shadow?: boolean  // NEW: Shadow toggle (defaults to true for backward compatibility)
  },
  dimensions: { width: number; height: number }
): {
  x: number
  y: number
  width: number
  height: number
  topEdge: number
  bottomEdge: number
  leftEdge: number
  rightEdge: number
} {
  const padding = 40
  const borderWidth = config.borderWidth || 0

  // v6.6 CRITICAL FIX: Include shadow padding to match actual buffer size
  // Shadow config from addSpeakerPhotoShadow(): { blur: 15, offset: 3 } → padding = 18px per side
  const shouldAddShadow = config.shadow !== false  // Default to true for backward compatibility
  const shadowPadding = shouldAddShadow ? 18 : 0
  const totalPhotoSize = config.size + borderWidth * 2 + shadowPadding * 2

  const x = calculateXPosition(config.position, dimensions.width, totalPhotoSize, padding)
  const y = calculateYPosition(config.verticalPosition, dimensions.height, totalPhotoSize, padding)

  // v6.7 DEBUG: Log coordinate calculation for System 1 (Gemini prompts)
  console.log('[Coord System 1] calculateSpeakerPhotoCoordinates():')
  console.log(`  - Input: position=${config.position}, vertical=${config.verticalPosition}, size=${config.size}`)
  console.log(`  - Shadow: shouldAdd=${shouldAddShadow}, padding=${shadowPadding}px`)
  console.log(`  - Total size: ${totalPhotoSize}px (size + border*2 + shadow*2)`)
  console.log(`  - Image dimensions: ${dimensions.width}x${dimensions.height}`)
  console.log(`  - Calculated X: ${x}, Y: ${y}`)
  console.log(`  - Base calculation: (${dimensions.width} - ${totalPhotoSize}) / 2 = ${(dimensions.width - totalPhotoSize) / 2}`)

  return {
    x,
    y,
    width: totalPhotoSize,
    height: totalPhotoSize,
    topEdge: y,
    bottomEdge: y + totalPhotoSize,
    leftEdge: x,
    rightEdge: x + totalPhotoSize,
  }
}

/**
 * Apply shape masking to a photo buffer
 */
async function applyShapeMask(
  photoBuffer: Buffer,
  size: number,
  shape: PhotoShape
): Promise<Buffer> {
  if (shape === 'square') {
    // No mask needed for square
    return photoBuffer
  }

  // Create mask based on shape
  let maskSvg: string

  if (shape === 'circle') {
    const radius = size / 2
    maskSvg = `
      <svg width="${size}" height="${size}">
        <circle cx="${radius}" cy="${radius}" r="${radius}" fill="white"/>
      </svg>
    `
  } else {
    // rounded - use rounded rectangle
    const borderRadius = Math.floor(size * 0.1) // 10% border radius
    maskSvg = `
      <svg width="${size}" height="${size}">
        <rect x="0" y="0" width="${size}" height="${size}" rx="${borderRadius}" ry="${borderRadius}" fill="white"/>
      </svg>
    `
  }

  // Create the mask buffer
  const maskBuffer = Buffer.from(maskSvg)

  // Apply mask using composite
  return await sharp(photoBuffer)
    .resize(size, size, { fit: 'cover' })
    .composite([
      {
        input: await sharp(maskBuffer).resize(size, size).png().toBuffer(),
        blend: 'dest-in',
      },
    ])
    .png()
    .toBuffer()
}

/**
 * DEPRECATED v6.0 Phase 5: Apply border to a shaped photo
 * This function created solid background behind speaker photos - replaced by addSpeakerPhotoShadow()
 * Kept for backward compatibility but should not be used in new code
 */
async function applyBorder(
  photoBuffer: Buffer,
  size: number,
  shape: PhotoShape,
  borderWidth: number,
  borderColor: string
): Promise<Buffer> {
  console.warn('[Speaker Photo] applyBorder() is DEPRECATED - use addSpeakerPhotoShadow() instead')

  if (borderWidth <= 0) {
    return photoBuffer
  }

  // Calculate total size with border
  const totalSize = size + borderWidth * 2

  // Create border SVG
  let borderSvg: string

  if (shape === 'circle') {
    const radius = totalSize / 2
    borderSvg = `
      <svg width="${totalSize}" height="${totalSize}">
        <circle cx="${radius}" cy="${radius}" r="${radius}" fill="${borderColor}"/>
      </svg>
    `
  } else if (shape === 'rounded') {
    const borderRadius = Math.floor(totalSize * 0.1)
    borderSvg = `
      <svg width="${totalSize}" height="${totalSize}">
        <rect x="0" y="0" width="${totalSize}" height="${totalSize}" rx="${borderRadius}" ry="${borderRadius}" fill="${borderColor}"/>
      </svg>
    `
  } else {
    // square
    borderSvg = `
      <svg width="${totalSize}" height="${totalSize}">
        <rect x="0" y="0" width="${totalSize}" height="${totalSize}" fill="${borderColor}"/>
      </svg>
    `
  }

  // Create border background
  const borderBuffer = await sharp(Buffer.from(borderSvg))
    .resize(totalSize, totalSize)
    .png()
    .toBuffer()

  // Composite photo onto border
  return await sharp(borderBuffer)
    .composite([
      {
        input: photoBuffer,
        top: borderWidth,
        left: borderWidth,
      },
    ])
    .png()
    .toBuffer()
}

/**
 * v6.0 Phase 5: Adds drop shadow to speaker photo (NO solid background)
 * Replaces applyBorder() to enable transparent speaker photos on AI backgrounds
 *
 * @param photoBuffer - Circular/rounded/square masked photo buffer
 * @param size - Photo size in pixels
 * @param shape - Photo shape (circle, rounded, square)
 * @param shadowConfig - Shadow configuration
 * @returns Buffer with photo and drop shadow on transparent background
 */
async function addSpeakerPhotoShadow(
  photoBuffer: Buffer,
  size: number,
  shape: PhotoShape,
  shadowConfig: { blur: number; opacity: number; offset: { x: number; y: number } } = {
    blur: 15,
    opacity: 0.5,
    offset: { x: 3, y: 3 }
  }
): Promise<Buffer> {
  const shadowPadding = shadowConfig.blur + Math.max(Math.abs(shadowConfig.offset.x), Math.abs(shadowConfig.offset.y))
  const totalSize = size + shadowPadding * 2

  try {
    // Create shadow using SVG filter matching photo shape
    let shadowMaskSvg: string

    if (shape === 'circle') {
      const radius = size / 2
      shadowMaskSvg = `
        <svg width="${size}" height="${size}">
          <defs>
            <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="${shadowConfig.blur}" />
              <feOffset dx="${shadowConfig.offset.x}" dy="${shadowConfig.offset.y}" result="offsetblur" />
              <feComponentTransfer>
                <feFuncA type="linear" slope="${shadowConfig.opacity}" />
              </feComponentTransfer>
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <circle cx="${radius}" cy="${radius}" r="${radius}" fill="black" filter="url(#shadow)" />
        </svg>
      `
    } else if (shape === 'rounded') {
      const borderRadius = Math.floor(size * 0.1)
      shadowMaskSvg = `
        <svg width="${size}" height="${size}">
          <defs>
            <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="${shadowConfig.blur}" />
              <feOffset dx="${shadowConfig.offset.x}" dy="${shadowConfig.offset.y}" result="offsetblur" />
              <feComponentTransfer>
                <feFuncA type="linear" slope="${shadowConfig.opacity}" />
              </feComponentTransfer>
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <rect width="${size}" height="${size}" rx="${borderRadius}" ry="${borderRadius}" fill="black" filter="url(#shadow)" />
        </svg>
      `
    } else {
      // square
      shadowMaskSvg = `
        <svg width="${size}" height="${size}">
          <defs>
            <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="${shadowConfig.blur}" />
              <feOffset dx="${shadowConfig.offset.x}" dy="${shadowConfig.offset.y}" result="offsetblur" />
              <feComponentTransfer>
                <feFuncA type="linear" slope="${shadowConfig.opacity}" />
              </feComponentTransfer>
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <rect width="${size}" height="${size}" fill="black" filter="url(#shadow)" />
        </svg>
      `
    }

    // Create canvas with shadow (transparent background)
    const result = await sharp({
      create: {
        width: totalSize,
        height: totalSize,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }  // Transparent background
      }
    })
    .composite([
      {
        input: photoBuffer,
        top: shadowPadding,
        left: shadowPadding,
      }
    ])
    .png()
    .toBuffer()

    console.log(`[Speaker Photo] Added drop shadow (${size}px → ${totalSize}px with ${shadowConfig.blur}px blur)`)
    return result
  } catch (error) {
    console.error('[Speaker Photo] Error creating shadow:', error)
    return photoBuffer  // Fallback to original
  }
}

/**
 * Add glow/halo effect around speaker photo (v6.10 Phase 3)
 * Creates a subtle light rim that helps photo blend with poster design
 * This effect is applied BEFORE shadow for optimal visual layering
 *
 * @param photoBuffer - The photo buffer with transparent background
 * @param size - Original photo size
 * @param shape - Photo shape (circle, rounded, square)
 * @param glowConfig - Glow configuration
 * @returns Promise<Buffer> - Photo with glow effect
 */
async function addPhotoGlow(
  photoBuffer: Buffer,
  size: number,
  shape: PhotoShape,
  glowConfig: {
    color: string    // Glow color in rgba format
    size: number     // Glow thickness in pixels
    blur: number     // Glow softness (higher = more diffused)
  } = {
    color: 'rgba(255,255,255,0.4)',  // Subtle white glow
    size: 12,
    blur: 20
  }
): Promise<Buffer> {
  const { color, size: glowSize, blur } = glowConfig
  const totalSize = size + glowSize * 2

  try {
    // Parse rgba color
    const rgbaMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/)
    if (!rgbaMatch) {
      console.warn('[Speaker Photo] Invalid glow color format, using white')
      // Fallback to white glow
      return photoBuffer
    }

    const r = parseInt(rgbaMatch[1])
    const g = parseInt(rgbaMatch[2])
    const b = parseInt(rgbaMatch[3])
    const a = parseFloat(rgbaMatch[4] || '1')

    // Create glow layer using SVG matching the photo shape
    let glowSvg: string

    if (shape === 'circle') {
      const radius = totalSize / 2
      glowSvg = `
        <svg width="${totalSize}" height="${totalSize}">
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="${blur}" />
            </filter>
          </defs>
          <circle cx="${radius}" cy="${radius}" r="${size / 2}"
                  fill="rgb(${r},${g},${b})"
                  opacity="${a}"
                  filter="url(#glow)" />
        </svg>
      `
    } else if (shape === 'rounded') {
      const borderRadius = Math.floor(size * 0.1)
      glowSvg = `
        <svg width="${totalSize}" height="${totalSize}">
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="${blur}" />
            </filter>
          </defs>
          <rect x="${glowSize}" y="${glowSize}"
                width="${size}" height="${size}"
                rx="${borderRadius}" ry="${borderRadius}"
                fill="rgb(${r},${g},${b})"
                opacity="${a}"
                filter="url(#glow)" />
        </svg>
      `
    } else {
      // square
      glowSvg = `
        <svg width="${totalSize}" height="${totalSize}">
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="${blur}" />
            </filter>
          </defs>
          <rect x="${glowSize}" y="${glowSize}"
                width="${size}" height="${size}"
                fill="rgb(${r},${g},${b})"
                opacity="${a}"
                filter="url(#glow)" />
        </svg>
      `
    }

    // Create glow layer
    const glowBuffer = await sharp(Buffer.from(glowSvg))
      .resize(totalSize, totalSize)
      .png()
      .toBuffer()

    // Composite photo on top of glow
    const result = await sharp(glowBuffer)
      .composite([{
        input: photoBuffer,
        top: glowSize,
        left: glowSize
      }])
      .png()
      .toBuffer()

    console.log(`[Speaker Photo] Added glow effect (${size}px → ${totalSize}px)`)
    return result
  } catch (error) {
    console.error('[Speaker Photo] Error creating glow:', error)
    return photoBuffer  // Fallback to original
  }
}

/**
 * Add thin visible border around speaker photo (v6.11)
 * Creates a subtle 2-3px border ring for better separation from background
 * This approach avoids dimension conflicts by adding border AFTER glow but BEFORE shadow
 *
 * @param photoBuffer - The photo buffer (already with glow if enabled)
 * @param size - Current photo size (including glow padding)
 * @param shape - Photo shape (circle, rounded, square)
 * @param borderConfig - Border configuration
 * @returns Promise<Buffer> - Photo with thin border ring
 */
async function addThinBorder(
  photoBuffer: Buffer,
  size: number,
  shape: PhotoShape,
  borderConfig: {
    width: number    // Border width in pixels (2-3px recommended)
    color: string    // Border color (hex or rgba)
  } = {
    width: 3,
    color: '#FFFFFF'  // White border by default
  }
): Promise<Buffer> {
  const { width, color } = borderConfig

  try {
    // Get current dimensions
    const metadata = await sharp(photoBuffer).metadata()
    const currentSize = metadata.width || size

    // Create border ring SVG matching the photo shape
    let borderSvg: string

    if (shape === 'circle') {
      const radius = currentSize / 2
      const innerRadius = radius - width
      borderSvg = `
        <svg width="${currentSize}" height="${currentSize}">
          <circle cx="${radius}" cy="${radius}" r="${radius}"
                  fill="none"
                  stroke="${color}"
                  stroke-width="${width}" />
        </svg>
      `
    } else if (shape === 'rounded') {
      const borderRadius = Math.floor(currentSize * 0.1)
      borderSvg = `
        <svg width="${currentSize}" height="${currentSize}">
          <rect x="${width / 2}" y="${width / 2}"
                width="${currentSize - width}" height="${currentSize - width}"
                rx="${borderRadius}" ry="${borderRadius}"
                fill="none"
                stroke="${color}"
                stroke-width="${width}" />
        </svg>
      `
    } else {
      // square
      borderSvg = `
        <svg width="${currentSize}" height="${currentSize}">
          <rect x="${width / 2}" y="${width / 2}"
                width="${currentSize - width}" height="${currentSize - width}"
                fill="none"
                stroke="${color}"
                stroke-width="${width}" />
        </svg>
      `
    }

    // Create border layer
    const borderBuffer = await sharp(Buffer.from(borderSvg))
      .resize(currentSize, currentSize)
      .png()
      .toBuffer()

    // Composite photo with border overlay
    const result = await sharp(photoBuffer)
      .composite([{
        input: borderBuffer,
        blend: 'over'
      }])
      .png()
      .toBuffer()

    console.log(`[Speaker Photo] Added thin border (${width}px ${color})`)
    return result
  } catch (error) {
    console.error('[Speaker Photo] Error adding border:', error)
    return photoBuffer  // Fallback to original
  }
}

/**
 * Apply drop shadow to an image
 */
async function applyShadow(
  photoBuffer: Buffer,
  totalSize: number
): Promise<{ buffer: Buffer; offset: number }> {
  const shadowOffset = 4
  const shadowBlur = 8
  const expandedSize = totalSize + shadowBlur * 2 + shadowOffset

  // Create shadow layer
  const shadowSvg = `
    <svg width="${expandedSize}" height="${expandedSize}">
      <defs>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="${shadowOffset}" dy="${shadowOffset}" stdDeviation="${shadowBlur / 2}" flood-color="rgba(0,0,0,0.3)"/>
        </filter>
      </defs>
      <rect x="${shadowBlur}" y="${shadowBlur}" width="${totalSize}" height="${totalSize}" fill="white" filter="url(#shadow)"/>
    </svg>
  `

  // This approach is simpler - just offset the photo and add transparency padding
  // Sharp doesn't support SVG filters well, so we'll use a simpler shadow approach

  // Create a canvas with padding for shadow effect
  const shadowCanvas = await sharp({
    create: {
      width: expandedSize,
      height: expandedSize,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .png()
    .toBuffer()

  // Composite the photo with offset to create shadow illusion
  const result = await sharp(shadowCanvas)
    .composite([
      {
        input: photoBuffer,
        top: shadowBlur,
        left: shadowBlur,
      },
    ])
    .png()
    .toBuffer()

  return { buffer: result, offset: shadowBlur }
}

/**
 * Process and prepare the speaker photo for overlay
 */
async function prepareSpeakerPhoto(
  photoDataUrl: string,
  config: SpeakerPhotoCustomization
): Promise<Buffer> {
  // Extract buffer from data URL
  const base64Data = photoDataUrl.split(',')[1]
  const photoBuffer = Buffer.from(base64Data, 'base64')

  // Resize and apply shape mask
  let processedBuffer = await sharp(photoBuffer)
    .resize(config.size, config.size, { fit: 'cover' })
    .png()
    .toBuffer()

  // v6.10 Phase 2: Remove background (light/white backgrounds)
  // This creates clean integration with poster backgrounds by removing photo studio backgrounds
  try {
    processedBuffer = await removeBackgroundByColor(processedBuffer, {
      targetColor: '#FFFFFF',  // Remove white/light backgrounds
      threshold: 60,           // Color similarity threshold (0-255)
      feather: 3              // Edge smoothing for natural transition
    })
    console.log('[Speaker Photo] Background removed using color threshold')
  } catch (error) {
    console.warn('[Speaker Photo] Background removal failed, continuing without it:', error)
    // Continue with original photo if background removal fails
  }

  // Apply shape mask (circular cutout)
  processedBuffer = await applyShapeMask(processedBuffer, config.size, config.shape)

  // v6.10 Phase 3: Add visual effects for better integration
  // Layered effects: glow (halo) + enhanced shadow for professional look
  const shouldAddShadow = config.shadow !== false  // Default to true if not specified

  if (shouldAddShadow) {
    // Step 1: Add glow/halo effect (helps photo blend with design)
    processedBuffer = await addPhotoGlow(
      processedBuffer,
      config.size,
      config.shape,
      {
        color: 'rgba(255,255,255,0.4)',  // Subtle white glow
        size: 12,                        // 12px glow thickness
        blur: 20                         // Soft, diffused glow
      }
    )

    // Step 1.5: Add thin visible border (v6.11)
    processedBuffer = await addThinBorder(
      processedBuffer,
      config.size,
      config.shape,
      {
        width: 3,           // 3px thin border
        color: '#FFFFFF'    // White border for separation
      }
    )

    // Step 2: Add enhanced shadow (v6.11: more visible)
    // v6.11 enhancement: blur 20→22, opacity 0.7→0.8, offset 6→8 for better visibility
    processedBuffer = await addSpeakerPhotoShadow(
      processedBuffer,
      config.size,
      config.shape,
      {
        blur: 22,           // More diffused shadow (v6.11)
        opacity: 0.8,       // More prominent - 80% visible (v6.11)
        offset: { x: 8, y: 8 }  // More depth - 8px offset (v6.11)
      }
    )
    console.log('[Speaker Photo] Applied glow + border + enhanced shadow (v6.11) for professional integration')
  } else {
    console.log('[Speaker Photo] Shadow disabled - photo will sit directly on AI background')
  }

  // DEPRECATED: Old border logic kept for backward compatibility
  // This creates solid backgrounds which override AI-generated backgrounds
  if (config.border.width > 0) {
    console.warn('[Speaker Photo] Border is DEPRECATED and creates visual conflicts with AI backgrounds')
    processedBuffer = await applyBorder(
      processedBuffer,
      config.size,
      config.shape,
      config.border.width,
      config.border.color
    )
  }

  return processedBuffer
}

/**
 * Remove background by color threshold (v6.10 Phase 2)
 * Replaces similar colors with transparency to remove photo backgrounds
 * Useful for removing white, gray, or beige backgrounds from speaker photos
 *
 * @param imageBuffer - The image buffer to process
 * @param options - Configuration for background removal
 * @param options.targetColor - Color to remove (hex format, e.g., '#FFFFFF')
 * @param options.threshold - Color similarity threshold (0-255, lower = more strict)
 * @param options.feather - Edge smoothing in pixels (0 = hard edge)
 * @returns Promise<Buffer> - Processed image with transparent background
 */
async function removeBackgroundByColor(
  imageBuffer: Buffer,
  options: {
    targetColor: string
    threshold: number
    feather: number
  }
): Promise<Buffer> {
  const { targetColor, threshold, feather } = options

  // Parse target color to RGB
  const target = {
    r: parseInt(targetColor.slice(1, 3), 16),
    g: parseInt(targetColor.slice(3, 5), 16),
    b: parseInt(targetColor.slice(5, 7), 16)
  }

  // Load image and get raw pixel data
  const image = sharp(imageBuffer)
  const { data, info } = await image
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  // Process each pixel
  const pixels = new Uint8ClampedArray(data)
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i]
    const g = pixels[i + 1]
    const b = pixels[i + 2]

    // Calculate Euclidean color distance
    const distance = Math.sqrt(
      Math.pow(r - target.r, 2) +
      Math.pow(g - target.g, 2) +
      Math.pow(b - target.b, 2)
    )

    // Make transparent if within threshold
    if (distance < threshold) {
      // Apply feathering for smooth edges
      if (feather > 0 && distance > threshold - feather) {
        // Gradual transparency near the edge
        const alpha = ((distance - (threshold - feather)) / feather) * 255
        pixels[i + 3] = Math.min(255, Math.max(0, Math.floor(alpha)))
      } else {
        // Full transparency
        pixels[i + 3] = 0
      }
    }
  }

  // Convert back to image
  return await sharp(pixels, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4
    }
  })
  .png()
  .toBuffer()
}

// ============================================================
// MULTI-SPEAKER SUPPORT (NEW v5.0)
// ============================================================

/**
 * Calculate the anchor point (base X/Y) based on user's position settings
 * This determines WHERE the photo block should be placed on the image
 */
function calculateAnchorPosition(config: {
  position: PhotoPosition
  verticalPosition: PhotoVerticalPosition | undefined
  imageWidth: number
  imageHeight: number
  blockWidth: number
  blockHeight: number
  padding: number
}): { anchorX: number; anchorY: number } {
  const { position, verticalPosition, imageWidth, imageHeight, blockWidth, blockHeight, padding } = config

  // Calculate X based on horizontal position
  let anchorX: number
  switch (position) {
    case 'left':
      anchorX = padding
      break
    case 'right':
      anchorX = imageWidth - blockWidth - padding
      break
    case 'center':
    default:
      anchorX = Math.floor((imageWidth - blockWidth) / 2)
      break
  }

  // Calculate Y based on vertical position
  // Use percentages to place photo group at the right vertical position
  const positionPercentages: Record<PhotoVerticalPosition, number> = {
    'top': 0.15,
    'upper': 0.30,
    'middle': 0.50,
    'lower': 0.65,
    'bottom': 0.80,
  }

  const percentage = positionPercentages[verticalPosition || 'lower'] || 0.65
  const baseY = Math.floor(imageHeight * percentage)

  // Center the block at the target Y position
  let anchorY = baseY - Math.floor(blockHeight / 2)

  // Clamp to stay within bounds
  const beforeClampingY = anchorY
  anchorY = Math.max(padding, Math.min(anchorY, imageHeight - blockHeight - padding))

  // v6.7 DEBUG: Log anchor calculation details
  console.log('[Anchor Calculation] Details:')
  console.log(`  - Block size: ${blockWidth}x${blockHeight}`)
  console.log(`  - Base X calculation: (${imageWidth} - ${blockWidth}) / 2 = ${(imageWidth - blockWidth) / 2}`)
  console.log(`  - Vertical percentage: ${percentage} (${verticalPosition})`)
  console.log(`  - Base Y: ${baseY}, offset: ${Math.floor(blockHeight / 2)}`)
  console.log(`  - Before clamping: anchorY=${beforeClampingY}`)
  console.log(`  - After clamping: anchorY=${anchorY}`)
  console.log(`  - Clamp range: [${padding}, ${imageHeight - blockHeight - padding}]`)

  return { anchorX, anchorY }
}

/**
 * Calculate speaker photo positions based on layout strategy AND user position settings
 * Supports 2-10 speakers with different layout modes
 *
 * @param config.position - Horizontal position (left/center/right) where the speaker block should be placed
 * @param config.verticalPosition - Vertical position (top/upper/middle/lower/bottom) where the block should be placed
 */
export function calculateMultiSpeakerPositions(config: {
  speakerCount: number
  layout: LayoutStrategy
  imageWidth: number
  imageHeight: number
  photoSize: number
  spacing: number
  position?: PhotoPosition
  verticalPosition?: PhotoVerticalPosition
  shadow?: boolean  // v6.6: Shadow toggle for accurate block size calculation
}): Array<{ x: number; y: number }> {
  const {
    speakerCount,
    layout,
    imageWidth,
    imageHeight,
    photoSize,
    spacing,
    position = 'center',
    verticalPosition = 'lower',
    shadow,
  } = config
  const positions: Array<{ x: number; y: number }> = []
  const padding = 40

  // v6.6 CRITICAL FIX: Include shadow padding in block dimensions
  // Shadow config from addSpeakerPhotoShadow(): { blur: 15, offset: 3 } → padding = 18px per side
  const shouldAddShadow = shadow !== false  // Default to true for backward compatibility
  const shadowPadding = shouldAddShadow ? 18 : 0
  const effectivePhotoSize = photoSize + shadowPadding * 2

  // Calculate block dimensions based on layout (using effective size with shadow)
  let blockWidth: number
  let blockHeight: number

  if (layout === 'side-by-side') {
    blockWidth = speakerCount * effectivePhotoSize + (speakerCount - 1) * spacing
    blockHeight = effectivePhotoSize
  } else if (layout === 'stacked') {
    blockWidth = effectivePhotoSize
    blockHeight = speakerCount * effectivePhotoSize + (speakerCount - 1) * spacing
  } else {
    // Grid layout
    const cols = 2
    const rows = Math.ceil(speakerCount / cols)
    blockWidth = cols * effectivePhotoSize + (cols - 1) * spacing
    blockHeight = rows * effectivePhotoSize + (rows - 1) * spacing
  }

  // Get the anchor position based on user settings
  const { anchorX, anchorY } = calculateAnchorPosition({
    position,
    verticalPosition,
    imageWidth,
    imageHeight,
    blockWidth,
    blockHeight,
    padding,
  })

  // v6.7 DEBUG: Log coordinate calculation for System 2 (Sharp overlay)
  console.log('[Coord System 2] calculateMultiSpeakerPositions():')
  console.log(`  - Input: position=${position}, vertical=${verticalPosition}, photoSize=${photoSize}`)
  console.log(`  - Shadow: shouldAdd=${shouldAddShadow}, padding=${shadowPadding}px`)
  console.log(`  - Effective size: ${effectivePhotoSize}px (photoSize + shadow*2)`)
  console.log(`  - Block dimensions: ${blockWidth}x${blockHeight}`)
  console.log(`  - Image dimensions: ${imageWidth}x${imageHeight}`)
  console.log(`  - Calculated anchor: x=${anchorX}, y=${anchorY}`)
  console.log(`[Speaker Positions] Anchor at x:${anchorX}, y:${anchorY} for position:${position}, vertical:${verticalPosition}`)

  if (layout === 'side-by-side') {
    // Horizontal row - place photos from anchor point
    for (let i = 0; i < speakerCount; i++) {
      positions.push({
        x: Math.floor(anchorX + i * (effectivePhotoSize + spacing)),
        y: anchorY,
      })
    }
  } else if (layout === 'stacked') {
    // Vertical stack - place photos from anchor point
    for (let i = 0; i < speakerCount; i++) {
      positions.push({
        x: anchorX,
        y: Math.floor(anchorY + i * (effectivePhotoSize + spacing)),
      })
    }
  } else if (layout === 'grid') {
    // 2-column grid
    const cols = 2

    for (let i = 0; i < speakerCount; i++) {
      const row = Math.floor(i / cols)
      const col = i % cols

      positions.push({
        x: Math.floor(anchorX + col * (effectivePhotoSize + spacing)),
        y: Math.floor(anchorY + row * (effectivePhotoSize + spacing)),
      })
    }
  }

  return positions
}

/**
 * Overlay multiple speaker photos onto base image
 * Uses shared settings with dynamic positioning based on layout strategy AND user position settings
 */
export async function overlayMultipleSpeakerPhotos(config: {
  baseImageBuffer: Buffer
  speakers: SpeakerItem[]
  sharedSettings: {
    shape: PhotoShape
    size: number
    border: { width: number; color: string }
    shadow: boolean
    position?: PhotoPosition
    verticalPosition?: PhotoVerticalPosition
  }
  layoutMode: LayoutMode
  layoutStrategy?: LayoutStrategy
  spacing?: number
  preCalculatedCoordinates?: { x: number; y: number; width: number; height: number }  // v20.4: Skip AI positioning when provided
}): Promise<Buffer> {
  const {
    baseImageBuffer,
    speakers,
    sharedSettings,
    layoutMode,
    layoutStrategy,
    spacing = 20,
    preCalculatedCoordinates,  // v20.4: Pre-calculated coordinates to skip AI positioning
  } = config

  if (!speakers || speakers.length === 0) {
    console.log('No speakers to overlay, returning original image')
    return baseImageBuffer
  }

  console.log(`Overlaying ${speakers.length} speaker photos with layout: ${layoutMode}`)

  // Get base image metadata
  const baseImage = sharp(baseImageBuffer)
  const metadata = await baseImage.metadata()
  const imageWidth = metadata.width || 1080
  const imageHeight = metadata.height || 1350

  // Auto-detect layout if needed
  const finalLayout = layoutMode === 'auto'
    ? autoDetectSpeakerLayout(speakers.length)
    : (layoutStrategy || 'side-by-side')

  // v6.14 INTELLIGENT POSITIONING: Analyze image to find safe overlay zones
  let positions: Array<{ x: number; y: number }>

  // v20.4: BYPASS AI POSITIONING when pre-calculated coordinates are provided
  // This ensures the user's selected position (left/right/center) and size (small/medium/large) are respected
  if (preCalculatedCoordinates && speakers.length === 1) {
    console.log('[Speaker Overlay v20.4] ✅ Using PRE-CALCULATED coordinates (skipping AI positioning)')
    console.log(`[Speaker Overlay v20.4] User's position: (${preCalculatedCoordinates.x}, ${preCalculatedCoordinates.y})`)
    console.log(`[Speaker Overlay v20.4] User's size: ${preCalculatedCoordinates.width}px (total with effects)`)
    positions = [{ x: preCalculatedCoordinates.x, y: preCalculatedCoordinates.y }]
  }
  else if (speakers.length === 1) {
    // v6.15: STEP 1 - Detect speaker text position using Gemini Vision
    const shouldAddShadow = sharedSettings.shadow !== false
    const shadowPadding = shouldAddShadow ? 18 : 0
    const borderWidth = sharedSettings.border?.width || 3
    let totalPhotoSize = sharedSettings.size + borderWidth * 2 + shadowPadding * 2

    console.log('[Speaker Overlay v6.15] 🎯 Starting AI-powered text detection + grouping...')
    console.log(`[Speaker Overlay v6.15] Speaker name: "${speakers[0].name}"`)
    console.log(`[Speaker Overlay v6.15] Photo size: ${sharedSettings.size}px, Total with shadow: ${totalPhotoSize}px`)

    try {
      // STEP 1: Detect where Gemini rendered speaker text
      const textDetection = await detectSpeakerTextPosition(
        baseImageBuffer,
        speakers[0].name,
        imageHeight
      )

      let safePosition: any

      if (textDetection.detected && textDetection.centerY) {
        // STEP 2a: Text detected - Use grouping-aware positioning
        console.log('[Speaker Overlay v6.15] ✅ Speaker text detected - using grouping positioning')

        const groupingResult = await findSafeOverlayZoneNearText(
          baseImageBuffer,
          {
            width: totalPhotoSize,
            height: totalPhotoSize
          },
          {
            centerY: textDetection.centerY,
            boundingBox: textDetection.boundingBox  // v6.15.1: Pass bounding box for collision detection
          },
          {
            hasLogosAtTop: true,
            preferredSide: sharedSettings.position || 'auto',
            groupingRadius: 150,  // Max 150px away from text
            minConfidence: 0.4
          }
        )

        safePosition = groupingResult

        // v6.17: Extract dynamic size from grouping result
        const effectiveSize = safePosition.finalSize ?? sharedSettings.size

        if (safePosition.sizeReduced) {
          console.log(`[Speaker Overlay v6.17.1] 📏 Dynamic sizing applied:`)
          console.log(`  - Original total size: ${safePosition.originalSize}px (with shadow+border)`)
          console.log(`  - Reduced to: ${effectiveSize}px (total, includes shadow+border)`)
          console.log(`  - Size reduction: ${safePosition.originalSize! - effectiveSize}px`)
          console.log(`  - Reason: ${safePosition.reasoning}`)

          // v6.17.1 FIX: finalSize is already TOTAL size (includes shadow+border)
          // Extract base size by reversing the calculation
          const borderWidth = sharedSettings.border?.width || 3
          const shadowPadding = sharedSettings.shadow !== false ? 18 : 0
          const baseSize = effectiveSize - borderWidth * 2 - shadowPadding * 2

          sharedSettings.size = baseSize  // Update base size
          totalPhotoSize = effectiveSize  // Use returned total size directly (no recalculation)

          console.log(`  - Extracted base size: ${baseSize}px`)
          console.log(`  - Final total size: ${totalPhotoSize}px (no double-counting)`)
        }

        console.log('[Speaker Overlay v6.17] ✅ Grouping positioning complete:')
        console.log(`  - Text center Y: ${textDetection.centerY}px`)
        console.log(`  - Photo Y: ${safePosition.y}px`)
        console.log(`  - Photo size: ${effectiveSize}px${safePosition.sizeReduced ? ' (dynamically reduced)' : ''}`)
        console.log(`  - Distance from text: ${Math.abs(safePosition.y + totalPhotoSize/2 - textDetection.centerY)}px`)
        console.log(`  - Within grouping range: ${groupingResult.withinGroupingRange ? 'YES ✅' : 'NO ⚠️'}`)
        console.log(`  - Selected zone: ${safePosition.zone}`)
        console.log(`  - Confidence: ${(safePosition.confidence * 100).toFixed(1)}%`)
      } else {
        // STEP 2b: Text not detected - Fall back to standard intelligent positioning
        console.warn('[Speaker Overlay v6.15] ⚠️ Speaker text NOT detected by Vision API')
        console.log('[Speaker Overlay v6.15] 🔄 Falling back to standard intelligent positioning (v6.14)')

        safePosition = await findSafePositionWithPreference(
          baseImageBuffer,
          {
            width: totalPhotoSize,
            height: totalPhotoSize
          },
          {
            position: sharedSettings.position || 'center',
            vertical: sharedSettings.verticalPosition || 'lower'
          },
          {
            hasLogosAtTop: true,
            minConfidence: 0.4,
            allowOverride: true
          }
        )

        console.log('[Speaker Overlay v6.15] ✅ Standard positioning complete (fallback):')
        console.log(`  - Selected zone: ${safePosition.zone}`)
        console.log(`  - Confidence: ${(safePosition.confidence * 100).toFixed(1)}%`)
        console.log(`  - Position: (${safePosition.x}, ${safePosition.y})`)
      }

      positions = [{ x: safePosition.x, y: safePosition.y }]

      // Final positioning summary
      console.log('[Speaker Overlay v6.15] 📍 Final Position Summary:')
      console.log(`  - Strategy: ${textDetection.detected ? 'GROUPING (text-aware)' : 'STANDARD (v6.14 fallback)'}`)
      console.log(`  - Position: (${safePosition.x}, ${safePosition.y})`)
      console.log(`  - Reasoning: ${safePosition.reasoning}`)

      if (safePosition.confidence < 0.4) {
        console.warn('[Speaker Overlay v6.15] ⚠️ Low confidence - all zones are busy!')
        console.warn('[Speaker Overlay v6.15] 💡 Consider repositioning or reducing visual complexity')
      }
    } catch (error) {
      // Fallback to hardcoded positioning if all AI systems fail
      console.error('[Speaker Overlay v6.15] ❌ AI positioning failed:', error)
      console.log('[Speaker Overlay v6.15] 🔄 Falling back to hardcoded positioning')

      const coords = calculateSpeakerPhotoCoordinates(
        {
          position: sharedSettings.position || 'center',
          verticalPosition: sharedSettings.verticalPosition || 'lower',
          size: sharedSettings.size,
          borderWidth: sharedSettings.border.width || 0,
          shadow: sharedSettings.shadow,
        },
        { width: imageWidth, height: imageHeight }
      )

      positions = [{ x: coords.x, y: coords.y }]
      console.log('[Speaker Overlay v6.15] Fallback position: (', coords.x, ',', coords.y, ')')
    }
  } else {
    // Multiple speakers: Use multi-speaker positioning
    positions = calculateMultiSpeakerPositions({
      speakerCount: speakers.length,
      layout: finalLayout,
      imageWidth,
      imageHeight,
      photoSize: sharedSettings.size,
      spacing,
      position: sharedSettings.position,
      verticalPosition: sharedSettings.verticalPosition,
      shadow: sharedSettings.shadow,  // v6.6: Pass shadow config for accurate positioning
    })
  }

  console.log(`[Speaker Overlay] Using position: ${sharedSettings.position || 'center'}, vertical: ${sharedSettings.verticalPosition || 'lower'}`)

  // Prepare all speaker photos in parallel
  const preparedPhotos = await Promise.all(
    speakers
      .filter(s => s.photoUrl)
      .map(async (speaker, index) => {
        try {
          // Create a temp config with shared settings for prepareSpeakerPhoto
          const tempConfig: SpeakerPhotoCustomization = {
            enabled: true,
            photoUrl: speaker.photoUrl!,
            size: sharedSettings.size,
            shape: sharedSettings.shape,
            border: sharedSettings.border,
            shadow: sharedSettings.shadow,
            position: 'center',
            verticalPosition: 'middle',
          }

          const photoBuffer = await prepareSpeakerPhoto(speaker.photoUrl!, tempConfig)

          // v6.6: Position already calculated with effectivePhotoSize by calculateMultiSpeakerPositions()
          // No additional shadow adjustment needed here - the position accounts for shadow padding
          return {
            buffer: photoBuffer,
            position: positions[index],
          }
        } catch (error) {
          console.error(`Failed to prepare speaker ${index + 1} photo:`, error)
          return null
        }
      })
  )

  // Filter out failed photos
  const validPhotos = preparedPhotos.filter(p => p !== null) as Array<{
    buffer: Buffer
    position: { x: number; y: number }
  }>

  if (validPhotos.length === 0) {
    console.log('No valid speaker photos to overlay, returning original image')
    return baseImageBuffer
  }

  // Create composite operations
  const compositeOps: sharp.OverlayOptions[] = validPhotos.map(photo => ({
    input: photo.buffer,
    top: Math.max(0, photo.position.y),
    left: Math.max(0, photo.position.x),
  }))

  console.log(`Compositing ${compositeOps.length} speaker photos onto base image`)

  try {
    // Single Sharp composite operation (efficient!)
    return await baseImage.composite(compositeOps).png().toBuffer()
  } catch (error) {
    console.error('Failed to composite speaker photos:', error)
    return baseImageBuffer
  }
}

/**
 * Auto-detect optimal speaker layout based on count
 * Matches the logic in speaker-zones.ts
 */
export function autoDetectSpeakerLayout(count: number): LayoutStrategy {
  if (count === 1) return 'side-by-side'  // Single speaker (legacy)
  if (count === 2) return 'side-by-side'  // Left + Right
  if (count === 3) return 'side-by-side'  // Horizontal row
  if (count <= 6) return 'grid'           // 2×2 or 2×3 grid
  return 'grid'                           // Default to grid for 7+
}

/**
 * Overlay speaker photo onto a base image using Sharp
 */
export async function overlaySpeakerPhotoOnImage(config: SpeakerOverlayConfig): Promise<Buffer> {
  const { baseImageBuffer, speakerPhoto } = config

  // Skip if not enabled or no photo URL
  if (!speakerPhoto.enabled || !speakerPhoto.photoUrl) {
    console.log('Speaker photo not enabled or no photo URL, returning original image')
    return baseImageBuffer
  }

  console.log('Processing speaker photo overlay')

  // Get base image metadata
  const baseImage = sharp(baseImageBuffer)
  const metadata = await baseImage.metadata()
  const imageWidth = metadata.width || 1080
  const imageHeight = metadata.height || 1350

  try {
    // Prepare the speaker photo with shape, border
    const preparedPhoto = await prepareSpeakerPhoto(speakerPhoto.photoUrl, speakerPhoto)

    // Calculate total photo size (including border)
    const totalPhotoSize = speakerPhoto.size + speakerPhoto.border.width * 2

    // Calculate position using user's settings
    const padding = 40
    const yPosition = calculateYPosition(speakerPhoto.verticalPosition, imageHeight, totalPhotoSize, padding)
    const xPosition = calculateXPosition(speakerPhoto.position || 'center', imageWidth, totalPhotoSize, padding)

    // Create composite operation
    const compositeOperations: sharp.OverlayOptions[] = [
      {
        input: preparedPhoto,
        top: Math.max(0, yPosition),
        left: Math.max(0, xPosition),
      },
    ]

    console.log(`Speaker photo positioned at x:${xPosition}, y:${yPosition}`)

    // Apply overlay
    return await baseImage.composite(compositeOperations).png().toBuffer()
  } catch (error) {
    console.error('Failed to process speaker photo:', error)
    // Return original image on error
    return baseImageBuffer
  }
}

/**
 * Process a base64 or data URL image and overlay speaker photo(s)
 * Handles both legacy single-speaker and new multi-speaker formats
 */
export async function processImageWithSpeakerPhoto(
  imageDataUrl: string,
  speakerPhoto: SpeakerPhotoCustomization,
  preCalculatedCoordinates?: { x: number; y: number; width: number; height: number }
): Promise<string> {
  // Normalize config (handles migration from legacy to new format)
  const normalized = normalizeSpeakerConfig(speakerPhoto)

  if (!normalized.enabled) {
    return imageDataUrl
  }

  // v20.1: Use size directly from config (already in pixels)
  // Size mapping happens in API route during coordinate calculation
  // Trust the size value from the config - no redundant mapping needed
  console.log(`[Speaker Overlay] v20.1: Using speaker photo size: ${normalized.size}px (from config)`)

  // Extract base64 data from data URL
  let imageBuffer: Buffer

  if (imageDataUrl.startsWith('data:')) {
    const base64Data = imageDataUrl.split(',')[1]
    imageBuffer = Buffer.from(base64Data, 'base64')
  } else if (imageDataUrl.startsWith('http')) {
    // Download image from URL
    const response = await fetch(imageDataUrl)
    if (!response.ok) {
      throw new Error(`Failed to download image: ${imageDataUrl}`)
    }
    const arrayBuffer = await response.arrayBuffer()
    imageBuffer = Buffer.from(arrayBuffer)
  } else {
    throw new Error('Invalid image format')
  }

  const speakerCount = getSpeakerCount(normalized)
  console.log(`[Speaker Overlay] Processing ${speakerCount} speaker(s)`)

  let resultBuffer: Buffer

  // Multi-speaker mode
  if (normalized.speakers && normalized.speakers.length > 0) {
    // CRITICAL: Filter to only speakers WITH photos
    // Some speakers may not have photos uploaded yet
    const speakersWithPhotos = normalized.speakers.filter(
      speaker => speaker.photoUrl && speaker.photoUrl.trim() !== ''
    )

    if (speakersWithPhotos.length === 0) {
      console.log('[Speaker Overlay] No speakers with photos to overlay')
      return imageDataUrl
    }

    console.log('[Speaker Overlay] Using multi-speaker overlay')
    console.log(`[Speaker Overlay] Overlaying ${speakersWithPhotos.length} of ${normalized.speakers.length} speakers (filtered to only those with photos)`)
    console.log('[Speaker Overlay] Position settings:', {
      position: normalized.position,
      verticalPosition: normalized.verticalPosition,
    })

    resultBuffer = await overlayMultipleSpeakerPhotos({
      baseImageBuffer: imageBuffer,
      speakers: speakersWithPhotos,  // Pass only speakers WITH photos
      sharedSettings: {
        shape: normalized.shape,
        size: normalized.size,
        border: normalized.border,
        shadow: normalized.shadow,
        position: normalized.position,
        verticalPosition: normalized.verticalPosition,
      },
      layoutMode: normalized.layoutMode || 'auto',
      layoutStrategy: normalized.layoutStrategy,
      spacing: normalized.spacing || 20,
      preCalculatedCoordinates,  // v20.4: Pass pre-calculated coordinates to skip AI positioning
    })
  }
  // Legacy single speaker mode (backward compatibility)
  else if (normalized.photoUrl) {
    console.log('[Speaker Overlay] Using legacy single-speaker overlay')
    resultBuffer = await overlaySpeakerPhotoOnImage({
      baseImageBuffer: imageBuffer,
      speakerPhoto: normalized,
    })
  }
  // No speakers to overlay
  else {
    console.log('[Speaker Overlay] No speakers to overlay')
    return imageDataUrl
  }

  // Return as data URL
  return `data:image/png;base64,${resultBuffer.toString('base64')}`
}

/**
 * Process image with multi-speaker layout using AI-calculated positions
 *
 * This function bypasses the basic grid/side-by-side positioning and uses
 * the intelligent layout engine's calculated positions with:
 * - Speaker hierarchy (featured speaker 20% larger)
 * - Footer zone validation (photos stop before 85%)
 * - Context-aware sizing based on aspect ratio and sophistication
 *
 * @param imageDataUrl - Base64 data URL of the generated image
 * @param speakerConfig - Normalized speaker configuration
 * @param layout - Pre-calculated multi-speaker layout with AI-driven positions
 * @returns Base64 data URL with speaker photos overlaid using layout positions
 */
export async function processImageWithMultiSpeakerLayout(
  imageDataUrl: string,
  speakerConfig: SpeakerPhotoCustomization,
  layout: MultiSpeakerLayout
): Promise<string> {
  console.log('[Multi-Speaker Layout] Processing with AI-calculated positions')
  console.log(`[Multi-Speaker Layout] Layout key: ${layout.layoutKey}`)
  console.log(`[Multi-Speaker Layout] Speakers: ${layout.positions.length}`)

  // Extract base64 image data
  const base64Data = imageDataUrl.replace(/^data:image\/\w+;base64,/, '')
  const imageBuffer = Buffer.from(base64Data, 'base64')

  // Normalize speaker config for consistent interface
  const normalized = normalizeSpeakerConfig(speakerConfig)

  if (!normalized.speakers || normalized.speakers.length === 0) {
    console.log('[Multi-Speaker Layout] No speakers to overlay')
    return imageDataUrl
  }

  // Get base image dimensions
  const baseImage = sharp(imageBuffer)
  const metadata = await baseImage.metadata()
  const imageWidth = metadata.width || 1080
  const imageHeight = metadata.height || 1350

  console.log('[Multi-Speaker Layout] Canvas:', `${imageWidth}×${imageHeight}px`)

  // CRITICAL: Filter to only speakers WITH photos before mapping to positions
  // Example: [speaker1WithPhoto, speaker2NoPhoto, speaker3WithPhoto]
  // → Filter to: [speaker1WithPhoto, speaker3WithPhoto]
  // → Map to: position[0] → speaker1, position[1] → speaker3
  const speakersWithPhotos = normalized.speakers.filter(
    speaker => speaker.photoUrl && speaker.photoUrl.trim() !== ''
  )

  console.log(`[Multi-Speaker Layout] Mapping ${layout.positions.length} positions to ${speakersWithPhotos.length} speakers with photos`)

  if (speakersWithPhotos.length !== layout.positions.length) {
    console.warn(`[Multi-Speaker Layout] ⚠️ Mismatch: ${layout.positions.length} positions but ${speakersWithPhotos.length} speakers with photos`)
  }

  // Apply each speaker photo using layout-calculated positions
  let resultBuffer = imageBuffer

  for (let i = 0; i < layout.positions.length && i < speakersWithPhotos.length; i++) {
    const position = layout.positions[i]
    const speaker = speakersWithPhotos[i]  // Guaranteed to have photoUrl

    // Use AI-calculated size for this speaker (hierarchy-aware)
    const photoSize = position.size
    const shape = position.shape || normalized.shape
    const borderWidth = normalized.border?.width || 3
    const shouldAddShadow = normalized.shadow !== false

    console.log(`[Multi-Speaker Layout] Speaker ${i + 1}:`, {
      name: speaker.name || `Speaker ${i + 1}`,
      size: `${photoSize}px`,
      position: `(${position.x}, ${position.y})`,
      shape,
      isFeatured: i === 0 ? '✨ Featured (+20%)' : 'Supporting'
    })

    try {
      // Fetch speaker photo
      const photoResponse = await fetch(speaker.photoUrl)
      if (!photoResponse.ok) {
        console.error(`[Multi-Speaker Layout] Failed to fetch photo for speaker ${i + 1}`)
        continue
      }

      const photoBuffer = Buffer.from(await photoResponse.arrayBuffer())

      // Process speaker photo with circular mask and border
      const processedPhoto = await sharp(photoBuffer)
        .resize(photoSize, photoSize, { fit: 'cover' })
        .composite([
          {
            input: Buffer.from(
              `<svg><rect x="0" y="0" width="${photoSize}" height="${photoSize}" rx="${shape === 'circle' ? photoSize / 2 : 8}" ry="${shape === 'circle' ? photoSize / 2 : 8}"/></svg>`
            ),
            blend: 'dest-in',
          },
        ])
        .toBuffer()

      // Add border if specified
      let finalPhoto = processedPhoto
      if (borderWidth > 0) {
        const borderColor = normalized.border?.color || '#FFFFFF'
        const totalSize = photoSize + borderWidth * 2

        finalPhoto = await sharp({
          create: {
            width: totalSize,
            height: totalSize,
            channels: 4,
            background: borderColor,
          },
        })
          .composite([
            {
              input: Buffer.from(
                `<svg><rect x="0" y="0" width="${totalSize}" height="${totalSize}" rx="${shape === 'circle' ? totalSize / 2 : 10}" ry="${shape === 'circle' ? totalSize / 2 : 10}"/></svg>`
              ),
              blend: 'dest-in',
            },
            {
              input: processedPhoto,
              top: borderWidth,
              left: borderWidth,
            },
          ])
          .toBuffer()
      }

      // Calculate overlay position (AI-calculated coordinates are for photo CENTER)
      const totalPhotoSize = photoSize + (borderWidth * 2)
      const overlayX = Math.max(0, position.x - Math.floor(totalPhotoSize / 2))
      const overlayY = Math.max(0, position.y - Math.floor(totalPhotoSize / 2))

      // Validate position is within canvas bounds
      if (overlayX + totalPhotoSize > imageWidth || overlayY + totalPhotoSize > imageHeight) {
        console.warn(`[Multi-Speaker Layout] Speaker ${i + 1} position out of bounds, adjusting`)
      }

      // Apply drop shadow if enabled
      const compositeInput: any = shouldAddShadow
        ? await sharp(finalPhoto)
            .extend({
              top: 10,
              bottom: 10,
              left: 10,
              right: 10,
              background: { r: 0, g: 0, b: 0, alpha: 0 },
            })
            .composite([
              {
                input: Buffer.from(
                  `<svg><ellipse cx="${totalPhotoSize / 2 + 10}" cy="${totalPhotoSize / 2 + 12}" rx="${totalPhotoSize / 2}" ry="${totalPhotoSize / 2}" fill="rgba(0,0,0,0.3)"/></svg>`
                ),
                top: 0,
                left: 0,
                blend: 'dest-over',
              },
            ])
            .toBuffer()
        : finalPhoto

      // Overlay on result image
      resultBuffer = await sharp(resultBuffer)
        .composite([
          {
            input: compositeInput,
            top: overlayY - (shouldAddShadow ? 10 : 0),
            left: overlayX - (shouldAddShadow ? 10 : 0),
          },
        ])
        .toBuffer()

      console.log(`[Multi-Speaker Layout] ✅ Speaker ${i + 1} overlaid successfully`)
    } catch (error) {
      console.error(`[Multi-Speaker Layout] Error overlaying speaker ${i + 1}:`, error)
      // Continue with next speaker
    }
  }

  // Validation: Check footer zone is clear
  const footerZoneClear = layout.positions.every(pos => {
    const bottomEdge = ((pos.y + pos.size / 2) / imageHeight) * 100
    return bottomEdge < 85
  })

  if (footerZoneClear) {
    console.log('[Multi-Speaker Layout] ✅ Footer zone validated: All photos above 85%')
  } else {
    console.warn('[Multi-Speaker Layout] ⚠️ Warning: Some photos may overlap footer zone')
  }

  // Return as data URL
  return `data:image/png;base64,${resultBuffer.toString('base64')}`
}
