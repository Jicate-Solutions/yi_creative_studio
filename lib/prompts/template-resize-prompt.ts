/**
 * Template Resize Prompt Builder
 *
 * Generates AI prompts for Canva-style "Magic Resize" functionality.
 * Instructs Gemini Vision to intelligently adapt templates to new dimensions
 * while preserving style, colors, text, and visual hierarchy.
 */

/**
 * Get human-readable aspect ratio label from dimensions
 */
function getAspectRatioLabel(width: number, height: number): string {
  const ratio = width / height

  // Common aspect ratios
  if (Math.abs(ratio - 1) < 0.05) return 'square'
  if (Math.abs(ratio - 16/9) < 0.05) return 'widescreen'
  if (Math.abs(ratio - 9/16) < 0.05) return 'vertical story'
  if (Math.abs(ratio - 4/5) < 0.05) return 'portrait'
  if (Math.abs(ratio - 5/4) < 0.05) return 'landscape'
  if (Math.abs(ratio - 4/3) < 0.05) return 'standard'
  if (Math.abs(ratio - 3/4) < 0.05) return 'portrait'
  if (Math.abs(ratio - 2/3) < 0.05) return 'tall portrait'
  if (Math.abs(ratio - 3/2) < 0.05) return 'landscape'
  if (Math.abs(ratio - 21/9) < 0.05) return 'ultra-wide'

  // Generic description based on orientation
  if (ratio > 1.2) return 'wide landscape'
  if (ratio < 0.8) return 'tall portrait'
  return 'balanced'
}

/**
 * Determine the resize direction for better AI guidance
 */
function getResizeDirection(
  originalWidth: number,
  originalHeight: number,
  targetWidth: number,
  targetHeight: number
): 'taller' | 'wider' | 'smaller' | 'similar' {
  const originalRatio = originalWidth / originalHeight
  const targetRatio = targetWidth / targetHeight
  const ratioDiff = targetRatio - originalRatio

  if (Math.abs(ratioDiff) < 0.1) return 'similar'
  if (ratioDiff < -0.2) return 'taller' // Target is more vertical
  if (ratioDiff > 0.2) return 'wider'   // Target is more horizontal
  return 'similar'
}

/**
 * Build the resize adaptation prompt for Gemini Vision
 * Uses clean narrative language without capitalized headers or pixel values
 */
export function buildTemplateResizePrompt(
  targetWidth: number,
  targetHeight: number,
  options?: {
    preserveText?: boolean
    originalWidth?: number
    originalHeight?: number
  }
): string {
  const {
    preserveText = true,
    originalWidth,
    originalHeight
  } = options || {}

  const aspectRatio = getAspectRatioLabel(targetWidth, targetHeight)

  // Build resize guidance based on direction
  let resizeGuidance = ''
  if (originalWidth && originalHeight) {
    const direction = getResizeDirection(originalWidth, originalHeight, targetWidth, targetHeight)

    switch (direction) {
      case 'taller':
        resizeGuidance = `OUTPAINTING REQUIRED - The new canvas is taller than the original.

You MUST:
1. Keep ALL original content fully visible - DO NOT crop any part of the image
2. Extend the background VERTICALLY on both top and bottom edges
3. Continue patterns, gradients, textures, or solid colors seamlessly upward and downward
4. Add breathing room between elements if needed
5. Reposition text elements if necessary but NEVER truncate them

The original image content should remain completely intact - just with extended background above and below.`
        break
      case 'wider':
        resizeGuidance = `OUTPAINTING REQUIRED - The new canvas is wider than the original.

You MUST:
1. Keep ALL original content fully visible - DO NOT crop any part of the image
2. Extend the background HORIZONTALLY on both left and right edges
3. Continue patterns, gradients, textures, or solid colors seamlessly to the sides
4. Center the main content or reposition for better balance
5. All text, logos, and design elements from the original must remain completely visible

This is a background extension task (outpainting), NOT a cropping task. The original image content should remain completely intact - just with extended background on the sides.`
        break
      case 'smaller':
        resizeGuidance = `The new canvas is more compact. Scale down the content proportionally while maintaining readability. You may need to reorganize the layout slightly. Keep the visual hierarchy clear despite the smaller canvas, and ensure all text remains legible. Do NOT crop out any important content - scale and reposition instead.`
        break
      default:
        resizeGuidance = `The aspect ratios are similar, so scale the content proportionally with minor adjustments to fit the new dimensions. Maintain the overall layout structure while ensuring everything fills the canvas edge-to-edge.`
    }
  }

  const sections: string[] = []

  // Opening directive
  sections.push(`Resize this design to a ${aspectRatio} format while preserving its visual identity completely.`)

  // Core requirements as flowing narrative
  sections.push(`The resized design must fill the entire canvas edge-to-edge with no gray bars, margins, or letterboxing. Preserve the exact same color palette, fonts, and design aesthetic so the result looks like it belongs to the same design system as the original.`)

  // Text handling
  if (preserveText) {
    sections.push(`Keep all text content exactly as shown in the original, without modifying, truncating, or removing any words. The text may be repositioned or resized to fit the new layout, but the content itself must remain identical.`)
  } else {
    sections.push(`Text can be repositioned or resized as needed to fit the new layout while maintaining the same information hierarchy.`)
  }

  // Resize direction guidance
  if (resizeGuidance) {
    sections.push(resizeGuidance)
  }

  // CRITICAL: No-crop instruction
  sections.push(`CRITICAL - DO NOT CROP: Every element from the original design must remain fully visible in the output. This includes all text, logos, decorative elements, and background patterns. If the aspect ratio change is significant, extend the background rather than cropping content.`)

  // Layout adaptation guidance
  sections.push(`Reposition elements thoughtfully for the new format rather than simply stretching or cropping. Never distort the proportions of logos, icons, or images. Never cut off important content. Maintain the visual hierarchy where headlines have the most prominence, followed by subheadings, then details.`)

  // Background handling (outpainting)
  sections.push(`BACKGROUND EXTENSION (Outpainting): Extend background colors, gradients, or patterns naturally to fill any new space. If the background has a repeating pattern, continue it seamlessly in the extended areas. If there's a solid color, continue it. If there's a photo or textured background, extend it using content-aware generation that feels natural and consistent with the original.`)

  // Quality expectations
  sections.push(`Create a professional, polished result with sharp edges, clean lines, consistent spacing, and proper alignment. The output should look like a native design created specifically for this format - with the original content intact and background extended to fill the new dimensions.`)

  return sections.join('\n\n')
}

/**
 * Build a compact resize prompt for faster processing
 * Uses clean narrative language without capitalized headers
 */
export function buildCompactResizePrompt(
  targetWidth: number,
  targetHeight: number,
  preserveText: boolean = true
): string {
  const aspectRatio = getAspectRatioLabel(targetWidth, targetHeight)

  const parts: string[] = []

  parts.push(`Resize this design to a ${aspectRatio} format.`)

  parts.push(`Fill the entire canvas edge-to-edge with no gray bars or margins. Keep the exact same colors, fonts, and visual style.`)

  if (preserveText) {
    parts.push(`Preserve all text exactly as shown without modification.`)
  } else {
    parts.push(`Text can be repositioned as needed to fit the new layout.`)
  }

  parts.push(`Extend backgrounds naturally and reposition elements intelligently for the new aspect ratio. The result should look like a native design for this format, not a stretched or cropped version.`)

  return parts.join(' ')
}
