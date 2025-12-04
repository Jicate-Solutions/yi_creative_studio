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
  if (Math.abs(ratio - 1) < 0.05) return 'square (1:1)'
  if (Math.abs(ratio - 16/9) < 0.05) return 'widescreen (16:9)'
  if (Math.abs(ratio - 9/16) < 0.05) return 'vertical story (9:16)'
  if (Math.abs(ratio - 4/5) < 0.05) return 'portrait (4:5)'
  if (Math.abs(ratio - 5/4) < 0.05) return 'landscape (5:4)'
  if (Math.abs(ratio - 4/3) < 0.05) return 'standard (4:3)'
  if (Math.abs(ratio - 3/4) < 0.05) return 'portrait (3:4)'
  if (Math.abs(ratio - 2/3) < 0.05) return 'tall portrait (2:3)'
  if (Math.abs(ratio - 3/2) < 0.05) return 'landscape (3:2)'
  if (Math.abs(ratio - 1.91) < 0.05) return 'Facebook cover (1.91:1)'

  // Calculate closest simple ratio
  const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b)
  const divisor = gcd(width, height)
  return `${width/divisor}:${height/divisor}`
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

  // Determine resize direction if original dimensions provided
  let resizeGuidance = ''
  if (originalWidth && originalHeight) {
    const direction = getResizeDirection(originalWidth, originalHeight, targetWidth, targetHeight)

    switch (direction) {
      case 'taller':
        resizeGuidance = `
RESIZE DIRECTION: Making design TALLER (more vertical)
- Extend the background/patterns vertically to fill new space
- Add breathing room between elements - don't stretch them
- Consider adding decorative elements at top or bottom
- Keep the main content centered or positioned strategically
- Maintain proportions of text and graphics - scale if needed`
        break
      case 'wider':
        resizeGuidance = `
RESIZE DIRECTION: Making design WIDER (more horizontal)
- Extend the background/patterns horizontally to fill new space
- Spread elements horizontally for better balance
- Consider centering content or using rule of thirds
- Add visual elements or patterns to fill side areas naturally
- Keep text at readable sizes - widen spacing between elements`
        break
      case 'smaller':
        resizeGuidance = `
RESIZE DIRECTION: Making design more COMPACT
- Prioritize the most important elements
- Scale down proportionally while maintaining readability
- May need to simplify or reorganize layout
- Keep visual hierarchy clear despite smaller canvas
- Text must remain legible - use minimum readable sizes`
        break
      default:
        resizeGuidance = `
RESIZE DIRECTION: Similar aspect ratio
- Scale content proportionally
- Minor adjustments to fit new dimensions
- Maintain overall layout structure`
    }
  }

  return `TASK: RESIZE THIS DESIGN to ${targetWidth}×${targetHeight} pixels (${aspectRatio} aspect ratio).

You are performing a "Magic Resize" operation like Canva. Your goal is to intelligently adapt this design to the new dimensions while preserving its visual identity.

CRITICAL REQUIREMENTS:
1. EXACT DIMENSIONS: Output must be EXACTLY ${targetWidth}×${targetHeight} pixels
2. PRESERVE VISUAL STYLE: Keep the exact same color palette, fonts, and design aesthetic
3. MAINTAIN BRAND FEEL: The resized version should look like it belongs to the same design system
${preserveText ? '4. PRESERVE ALL TEXT: Keep text content exactly as shown - do not modify, truncate, or remove any text' : '4. TEXT FLEXIBILITY: Text can be repositioned or resized to fit the new layout'}
5. FILL THE CANVAS: The design must extend to ALL FOUR EDGES - no gray bars, no letterboxing
6. INTELLIGENT LAYOUT: Reposition elements thoughtfully, don't just stretch or crop
${resizeGuidance}

LAYOUT ADAPTATION RULES:
- If going TALLER: Extend backgrounds vertically, add breathing room, don't stretch elements
- If going WIDER: Spread elements horizontally, extend backgrounds, maintain visual balance
- If going SMALLER: Prioritize key elements, maintain hierarchy, ensure readability
- NEVER distort proportions of logos, icons, or images
- NEVER cut off important content
- ALWAYS maintain the visual hierarchy (headline > subheading > details)

BACKGROUND HANDLING:
- Extend background colors, gradients, or patterns naturally
- If the background has a pattern, continue it seamlessly
- If there's a photo background, extend it using content-aware fill approach
- Keep any border/frame designs consistent at new dimensions

TEXT HANDLING:
${preserveText
  ? `- Keep ALL text exactly as shown - same wording, same hierarchy
- Resize text proportionally if needed for readability
- Reposition text blocks to fit new layout naturally
- Ensure proper contrast and legibility at new size`
  : `- Maintain the same information hierarchy
- Text can be repositioned or resized
- Ensure readability at new dimensions`}

QUALITY REQUIREMENTS:
- Professional, polished output
- Sharp edges and clean lines
- Consistent spacing and alignment
- No artifacts or quality loss

OUTPUT: A complete, polished design at exactly ${targetWidth}×${targetHeight} pixels that looks like a native design for this format, not a stretched or cropped version of the original.`
}

/**
 * Build a compact resize prompt for faster processing
 */
export function buildCompactResizePrompt(
  targetWidth: number,
  targetHeight: number,
  preserveText: boolean = true
): string {
  const aspectRatio = getAspectRatioLabel(targetWidth, targetHeight)

  return `MAGIC RESIZE to ${targetWidth}×${targetHeight}px (${aspectRatio}).

RULES:
- EXACTLY ${targetWidth}×${targetHeight}px output - no gray bars/margins
- Keep exact same colors, fonts, style
- ${preserveText ? 'Preserve all text exactly as shown' : 'Text can be repositioned'}
- Extend backgrounds naturally, don't stretch elements
- Reposition layout intelligently for new aspect ratio
- Fill entire canvas edge-to-edge
- Professional quality output

Create a native-looking design for this format, not a stretched/cropped version.`
}
