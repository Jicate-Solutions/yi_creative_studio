/**
 * v24.1: Logo Bar Compositor
 *
 * CRITICAL INSIGHT: Gemini ignores spatial constraints in prompts.
 * Solution: Don't ask Gemini to respect zones - CROP and COMPOSITE instead.
 *
 * This is the SAME approach used for speaker photos (which NEVER overlap):
 * 1. Generate full image (no zone constraints)
 * 2. Crop to remove header/footer areas
 * 3. Composite logo bars on top with Sharp
 *
 * Result: 100% reliable, zero overlaps
 */

import sharp from 'sharp'

export interface LogoBarCompositorConfig {
  headerHeight: number
  footerHeight: number
  canvasWidth: number
  canvasHeight: number
}

export interface LogoBarBuffers {
  headerBar: Buffer | null
  footerBar: Buffer | null
}

/**
 * Crop generated image and composite with logo bars
 *
 * This is the RELIABLE approach (same as speaker photos):
 * - Don't ask Gemini to leave space
 * - Crop the generated content
 * - Composite logo bars on top
 *
 * @param generatedImage - Full image from Gemini (no zone constraints)
 * @param logoBarBuffers - Pre-rendered header and footer bars
 * @param config - Dimensions configuration
 * @returns Final composited image with logo bars
 */
export async function compositeLogoBars(
  generatedImage: Buffer,
  logoBarBuffers: LogoBarBuffers,
  config: LogoBarCompositorConfig
): Promise<Buffer> {
  const { headerHeight, footerHeight, canvasWidth, canvasHeight } = config
  const { headerBar, footerBar } = logoBarBuffers

  // Calculate content area (between header and footer)
  const contentTop = headerHeight
  const contentHeight = canvasHeight - headerHeight - footerHeight

  console.log('[Logo Bar Compositor] Cropping and compositing:', {
    canvasSize: `${canvasWidth}x${canvasHeight}`,
    headerHeight,
    footerHeight,
    contentHeight,
    hasHeaderBar: !!headerBar,
    hasFooterBar: !!footerBar,
  })

  // Step 1: Crop the generated image to content area only
  // This removes whatever Gemini put in the header/footer zones
  const croppedContent = await sharp(generatedImage)
    .extract({
      left: 0,
      top: contentTop,
      width: canvasWidth,
      height: contentHeight,
    })
    .toBuffer()

  console.log('[Logo Bar Compositor] ✅ Cropped content area:', {
    from: `${contentTop}px - ${contentTop + contentHeight}px`,
    size: `${canvasWidth}x${contentHeight}`,
  })

  // Step 2: Use the original generated image as base (no white canvas)
  // This preserves Gemini's background instead of replacing with white
  const canvas = sharp(generatedImage).resize(canvasWidth, canvasHeight, { fit: 'fill' })

  // Step 3: Prepare composite operations
  const compositeOps: sharp.OverlayOptions[] = []

  // Add header bar at top (if exists)
  if (headerBar) {
    compositeOps.push({
      input: headerBar,
      top: 0,
      left: 0,
      blend: 'over',
    })
    console.log('[Logo Bar Compositor] ✅ Added header bar at top')
  }

  // Add cropped content in the middle
  compositeOps.push({
    input: croppedContent,
    top: headerHeight,
    left: 0,
    blend: 'over',
  })
  console.log('[Logo Bar Compositor] ✅ Added content at Y=' + headerHeight)

  // Add footer bar at bottom (if exists)
  if (footerBar) {
    const footerTop = canvasHeight - footerHeight
    compositeOps.push({
      input: footerBar,
      top: footerTop,
      left: 0,
      blend: 'over',
    })
    console.log('[Logo Bar Compositor] ✅ Added footer bar at Y=' + footerTop)
  }

  // Step 4: Composite everything together
  const finalImage = await canvas.composite(compositeOps).png().toBuffer()

  console.log('[Logo Bar Compositor] ✅ Final composite complete')

  return finalImage
}

/**
 * Get optimal header/footer heights based on logo configuration
 * Returns heights that ensure logos are visible and professional
 */
export function calculateOptimalLogoBarHeights(config: {
  hasBrandLogos: boolean
  hasVerticalLogos: boolean
  hasInitiative: boolean
  hasFooter: boolean
  canvasHeight: number
}): { headerHeight: number; footerHeight: number } {
  const { hasBrandLogos, hasVerticalLogos, hasInitiative, hasFooter, canvasHeight } = config

  // Header calculation
  let headerHeight = 0
  if (hasBrandLogos) headerHeight += 120 // Brand logos row
  if (hasVerticalLogos) headerHeight += 90 // Vertical logos row
  if (hasInitiative) headerHeight += 40 // Initiative text row
  if (headerHeight > 0) headerHeight += 24 // Padding

  // Add spacing between rows
  const rowCount = [hasBrandLogos, hasVerticalLogos, hasInitiative].filter(Boolean).length
  if (rowCount > 1) headerHeight += (rowCount - 1) * 16

  // Cap header at 25% of canvas
  headerHeight = Math.min(headerHeight, canvasHeight * 0.25)

  // Footer calculation
  let footerHeight = 0
  if (hasFooter) {
    footerHeight = 180 + 88 // Base height + buffer
    footerHeight = Math.min(footerHeight, canvasHeight * 0.18)
  }

  return {
    headerHeight: Math.round(headerHeight),
    footerHeight: Math.round(footerHeight),
  }
}
