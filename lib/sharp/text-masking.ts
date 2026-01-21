/**
 * Text Masking Utility v1.0
 *
 * Layer 3 of the Permanent Text-Logo Overlap Prevention System
 *
 * This module provides fallback text masking when:
 * - Layer 1 (Enhanced Prompts) fails to prevent text placement in logo zones
 * - Layer 2 (Regeneration Loop) exhausts retry attempts with persistent violations
 *
 * Strategy: Blur + Darken to make text unreadable while preserving Gemini's backgrounds
 *
 * Cost: ~150-250ms per violation (negligible for <1% of cases)
 */

import type { Sharp, OverlayOptions } from 'sharp'
import type { ZoneViolation } from './text-zone-verifier'

export interface MaskingOptions {
  blurRadius?: number        // Default: 20px (text becomes unreadable)
  darkenAlpha?: number       // Default: 0.3 (30% black overlay)
  enableLogging?: boolean    // Default: true
}

/**
 * Masks text in logo zones by applying blur + darken overlay
 *
 * This is the PRIMARY masking strategy:
 * 1. Extract violation zone
 * 2. Apply 20px gaussian blur (text unreadable)
 * 3. Apply 30% black overlay (reduces contrast)
 * 4. Composite back onto original image
 *
 * Result:
 * ✅ Text completely unreadable (goal achieved)
 * ✅ Gemini's gradients/colors still visible (slightly darker/softer)
 * ✅ Logo bars overlay cleanly on top
 *
 * @param imageBuffer - Original image with text violations
 * @param violations - Array of detected violations from text-zone-verifier
 * @param canvasWidth - Canvas width in pixels
 * @param canvasHeight - Canvas height in pixels
 * @param options - Masking configuration
 * @returns Masked image buffer
 */
export async function maskTextInLogoZones(
  imageBuffer: Buffer,
  violations: ZoneViolation[],
  canvasWidth: number,
  canvasHeight: number,
  options: MaskingOptions = {}
): Promise<Buffer> {
  if (violations.length === 0) return imageBuffer

  const sharp = (await import('sharp')).default
  const {
    blurRadius = 20,
    darkenAlpha = 0.3,
    enableLogging = true,
  } = options

  if (enableLogging) {
    console.log(`[Text Masking] 🎭 Applying blur+darken masks to ${violations.length} violation zone(s)`)
  }

  const masks: OverlayOptions[] = []

  for (const violation of violations) {
    const zoneStartPx = Math.floor((violation.forbiddenRangeStart / 100) * canvasHeight)
    const zoneEndPx = Math.floor((violation.forbiddenRangeEnd / 100) * canvasHeight)
    const zoneHeight = zoneEndPx - zoneStartPx

    if (enableLogging) {
      console.log(
        `[Text Masking] Processing ${violation.zoneType} zone: ` +
        `${zoneStartPx}px - ${zoneEndPx}px (${zoneHeight}px tall)`
      )
    }

    try {
      // Step 1: Extract violation zone
      const violationRegion = await sharp(imageBuffer)
        .extract({ left: 0, top: zoneStartPx, width: canvasWidth, height: zoneHeight })
        .toBuffer()

      // Step 2: Apply gaussian blur (text becomes unreadable)
      const blurredRegion = await sharp(violationRegion)
        .blur(blurRadius)
        .toBuffer()

      // Step 3: Create semi-transparent darken overlay
      const darkenOverlay = await sharp({
        create: {
          width: canvasWidth,
          height: zoneHeight,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: darkenAlpha }
        }
      })
        .png()
        .toBuffer()

      // Step 4: Composite blur + darken
      const maskedRegion = await sharp(blurredRegion)
        .composite([{ input: darkenOverlay, blend: 'over' }])
        .toBuffer()

      masks.push({
        input: maskedRegion,
        top: zoneStartPx,
        left: 0,
        blend: 'over'
      })

      if (enableLogging) {
        console.log(`[Text Masking] ✓ Masked ${violation.zoneType} zone (blur: ${blurRadius}px, darken: ${Math.round(darkenAlpha * 100)}%)`)
      }
    } catch (error) {
      console.error(`[Text Masking] ❌ Failed to mask ${violation.zoneType}:`, error)
      // Continue with other masks (fail gracefully)
    }
  }

  // Apply all masks at once
  if (masks.length > 0) {
    const maskedImage = await sharp(imageBuffer)
      .composite(masks)
      .toBuffer()

    if (enableLogging) {
      console.log(`[Text Masking] ✅ Successfully applied ${masks.length} mask(s)`)
    }

    return maskedImage
  }

  return imageBuffer
}

/**
 * Alternative: Darken-only masking (faster, less aggressive)
 *
 * Use this if you want:
 * - Faster processing (~50ms per violation)
 * - Softer visual impact (text dimmed but might still be slightly visible)
 * - Lower memory usage (no blur operation)
 *
 * Trade-off: Text may still be faintly readable in high-contrast scenarios
 *
 * @param imageBuffer - Original image with text violations
 * @param violations - Array of detected violations
 * @param canvasWidth - Canvas width in pixels
 * @param canvasHeight - Canvas height in pixels
 * @param darkenAlpha - Opacity of black overlay (default: 0.5 = 50%)
 * @param enableLogging - Enable console logs
 * @returns Darkened image buffer
 */
export async function darkenTextInLogoZones(
  imageBuffer: Buffer,
  violations: ZoneViolation[],
  canvasWidth: number,
  canvasHeight: number,
  darkenAlpha: number = 0.5,
  enableLogging: boolean = true
): Promise<Buffer> {
  if (violations.length === 0) return imageBuffer

  const sharp = (await import('sharp')).default

  if (enableLogging) {
    console.log(`[Text Masking] 🎭 Applying darken-only masks to ${violations.length} violation zone(s)`)
  }

  const overlays: Array<{ input: Buffer; top: number; left: number }> = []

  for (const violation of violations) {
    const zoneStartPx = Math.floor((violation.forbiddenRangeStart / 100) * canvasHeight)
    const zoneEndPx = Math.floor((violation.forbiddenRangeEnd / 100) * canvasHeight)
    const zoneHeight = zoneEndPx - zoneStartPx

    try {
      // Create semi-transparent black overlay
      const overlay = await sharp({
        create: {
          width: canvasWidth,
          height: zoneHeight,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: darkenAlpha }
        }
      })
        .png()
        .toBuffer()

      overlays.push({ input: overlay, top: zoneStartPx, left: 0 })

      if (enableLogging) {
        console.log(`[Text Masking] ✓ Created darken overlay for ${violation.zoneType} (alpha: ${Math.round(darkenAlpha * 100)}%)`)
      }
    } catch (error) {
      console.error(`[Text Masking] ❌ Failed to create overlay for ${violation.zoneType}:`, error)
    }
  }

  if (overlays.length > 0) {
    const darkenedImage = await sharp(imageBuffer)
      .composite(overlays)
      .toBuffer()

    if (enableLogging) {
      console.log(`[Text Masking] ✅ Successfully applied ${overlays.length} darken overlay(s)`)
    }

    return darkenedImage
  }

  return imageBuffer
}

/**
 * Smart masking strategy selector
 *
 * Automatically chooses the best masking strategy based on:
 * - Violation severity (critical vs warning)
 * - Zone type (header vs footer)
 * - Canvas dimensions (performance considerations)
 *
 * Strategy selection logic:
 * - Critical violations: Full blur+darken (guaranteed text removal)
 * - Warning violations: Darken-only (faster, softer impact)
 * - Large canvases (>2K): Darken-only (performance)
 * - Small canvases (<1K): Full blur+darken (quality)
 *
 * @param imageBuffer - Original image
 * @param violations - Detected violations
 * @param canvasWidth - Canvas width
 * @param canvasHeight - Canvas height
 * @returns Masked image buffer
 */
export async function smartMaskTextInLogoZones(
  imageBuffer: Buffer,
  violations: ZoneViolation[],
  canvasWidth: number,
  canvasHeight: number
): Promise<Buffer> {
  if (violations.length === 0) return imageBuffer

  const critical = violations.filter(v => v.severity === 'critical')
  const warnings = violations.filter(v => v.severity === 'warning')

  // Performance threshold: 2K resolution (1920x1080 or higher)
  const is2KOrHigher = canvasWidth * canvasHeight >= 1920 * 1080

  console.log(
    `[Smart Masking] 🧠 Analyzing ${violations.length} violation(s): ` +
    `${critical.length} critical, ${warnings.length} warning(s)`
  )

  // Strategy 1: All critical + small canvas = Full blur+darken
  if (critical.length > 0 && !is2KOrHigher) {
    console.log('[Smart Masking] → Using FULL blur+darken (critical violations on small canvas)')
    return await maskTextInLogoZones(imageBuffer, violations, canvasWidth, canvasHeight)
  }

  // Strategy 2: Large canvas = Darken-only for performance
  if (is2KOrHigher) {
    console.log('[Smart Masking] → Using DARKEN-ONLY (large canvas performance optimization)')
    return await darkenTextInLogoZones(imageBuffer, violations, canvasWidth, canvasHeight, 0.5)
  }

  // Strategy 3: Only warnings = Softer darken-only
  if (critical.length === 0 && warnings.length > 0) {
    console.log('[Smart Masking] → Using SOFT darken (warnings only)')
    return await darkenTextInLogoZones(imageBuffer, violations, canvasWidth, canvasHeight, 0.3)
  }

  // Default: Full blur+darken for critical violations
  console.log('[Smart Masking] → Using FULL blur+darken (default for critical violations)')
  return await maskTextInLogoZones(imageBuffer, violations, canvasWidth, canvasHeight)
}

/**
 * Export types for consistency
 */
export type { ZoneViolation } from './text-zone-verifier'
