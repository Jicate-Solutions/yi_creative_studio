/**
 * Text Boundary Validator v20.10 (Phase 2)
 *
 * Validates text elements don't extend into footer zone
 * Clips or adjusts text that violates boundaries
 *
 * This is a POST-GENERATION validation layer that acts as a safety net
 * when Gemini ignores spatial layout constraints.
 *
 * Works in tandem with:
 * - Phase 1: Strengthened Gemini prompt constraints
 * - Phase 4: SVG text renderer Y-axis clamping
 */

/**
 * Represents a text element with position and dimensions
 */
export interface TextElement {
  y: number // Y-coordinate (top edge) in pixels
  height: number // Height of text element in pixels
  content: string // Text content for logging
  id?: string // Optional identifier for debugging
}

/**
 * Result of text boundary validation
 */
export interface ValidatedTextElement extends TextElement {
  adjusted: boolean // True if element was moved/clipped
  originalY?: number // Original Y position before adjustment
  violation?: string // Description of boundary violation
}

/**
 * Configuration for text boundary validation
 */
export interface TextBoundaryConfig {
  canvasHeight: number // Total canvas height in pixels
  footerHeight: number // Footer zone height in pixels
  bufferPercent?: number // Buffer zone percentage (default: 5%)
  strictMode?: boolean // If true, throws error on violation instead of adjusting
}

/**
 * Validates text elements don't extend into footer zone
 * Clips or adjusts text that violates boundaries
 *
 * @param textElements Array of text elements to validate
 * @param config Validation configuration
 * @returns Array of validated elements with adjustment flags
 *
 * @example
 * ```typescript
 * const elements = [
 *   { y: 1200, height: 50, content: 'Additional Details' },
 *   { y: 1300, height: 40, content: 'Contact Info' }
 * ]
 *
 * const validated = validateTextBoundaries(elements, {
 *   canvasHeight: 1440,
 *   footerHeight: 268,
 *   bufferPercent: 5
 * })
 *
 * validated.forEach(el => {
 *   if (el.adjusted) {
 *     console.log(`Adjusted "${el.content}" from ${el.originalY} to ${el.y}`)
 *   }
 * })
 * ```
 */
export function validateTextBoundaries(
  textElements: TextElement[],
  config: TextBoundaryConfig
): ValidatedTextElement[] {
  const {
    canvasHeight,
    footerHeight,
    bufferPercent = 5, // Default 5% buffer
    strictMode = false,
  } = config

  // Calculate footer start position with buffer
  const bufferSize = canvasHeight * (bufferPercent / 100)
  const footerStartY = canvasHeight - footerHeight - bufferSize

  console.log('[Text Boundary Validator] Validation Configuration:')
  console.log(`  Canvas height: ${canvasHeight}px`)
  console.log(`  Footer height: ${footerHeight}px`)
  console.log(`  Buffer zone: ${bufferPercent}% (${bufferSize.toFixed(0)}px)`)
  console.log(`  Footer start: ${footerStartY.toFixed(0)}px`)
  console.log(`  Safe zone: 0px - ${footerStartY.toFixed(0)}px`)

  const validatedElements: ValidatedTextElement[] = []
  let violationCount = 0

  for (const element of textElements) {
    const elementBottom = element.y + element.height

    // Check if element extends into footer zone
    if (elementBottom > footerStartY) {
      violationCount++
      const violation = `Element "${element.content}" (id: ${element.id || 'unknown'}) extends into footer zone`
      const details = `Bottom at ${elementBottom.toFixed(0)}px > safe boundary ${footerStartY.toFixed(0)}px (overlap: ${(elementBottom - footerStartY).toFixed(0)}px)`

      console.warn(`[Text Boundary] ⚠️ VIOLATION DETECTED:`)
      console.warn(`  ${violation}`)
      console.warn(`  ${details}`)

      if (strictMode) {
        throw new Error(`Text boundary violation: ${violation}. ${details}`)
      }

      // Calculate adjusted Y position
      // Move element up so its bottom aligns with safe boundary
      const adjustedY = Math.max(0, footerStartY - element.height)

      // Ensure we're not pushing element off the top of canvas
      if (adjustedY < 0) {
        console.error(`[Text Boundary] ❌ CRITICAL: Cannot fit element within safe zone`)
        console.error(`  Element height: ${element.height}px`)
        console.error(`  Available space: ${footerStartY.toFixed(0)}px`)
        console.error(`  Element will be clipped or truncated`)
      }

      const clampedY = Math.max(0, adjustedY)

      console.warn(`  ✓ Adjusted: Y=${element.y.toFixed(0)} → ${clampedY.toFixed(0)}`)

      validatedElements.push({
        ...element,
        y: clampedY,
        originalY: element.y,
        adjusted: true,
        violation: violation,
      })
    } else {
      // Element is within safe zone
      validatedElements.push({
        ...element,
        adjusted: false,
      })
    }
  }

  if (violationCount > 0) {
    console.warn(`[Text Boundary] Summary: ${violationCount} violation(s) detected and adjusted`)
  } else {
    console.log(`[Text Boundary] ✓ All text elements within safe zone`)
  }

  return validatedElements
}

/**
 * Quick check if a Y-coordinate is within safe zone
 *
 * @param y Y-coordinate to check
 * @param canvasHeight Total canvas height
 * @param footerHeight Footer zone height
 * @param bufferPercent Buffer zone percentage (default: 5%)
 * @returns True if Y is within safe zone
 */
export function isWithinSafeZone(
  y: number,
  canvasHeight: number,
  footerHeight: number,
  bufferPercent: number = 5
): boolean {
  const bufferSize = canvasHeight * (bufferPercent / 100)
  const footerStartY = canvasHeight - footerHeight - bufferSize
  return y <= footerStartY
}

/**
 * Calculate safe zone boundaries
 *
 * @param canvasHeight Total canvas height
 * @param footerHeight Footer zone height
 * @param bufferPercent Buffer zone percentage (default: 5%)
 * @returns Object with safe zone start and end Y-coordinates
 */
export function getSafeZoneBoundaries(
  canvasHeight: number,
  footerHeight: number,
  bufferPercent: number = 5
): {
  safeZoneStart: number
  safeZoneEnd: number
  bufferZoneStart: number
  bufferZoneEnd: number
  footerZoneStart: number
  footerZoneEnd: number
} {
  const bufferSize = canvasHeight * (bufferPercent / 100)
  const footerStartY = canvasHeight - footerHeight

  return {
    safeZoneStart: 0,
    safeZoneEnd: footerStartY - bufferSize,
    bufferZoneStart: footerStartY - bufferSize,
    bufferZoneEnd: footerStartY,
    footerZoneStart: footerStartY,
    footerZoneEnd: canvasHeight,
  }
}

/**
 * Validate a single text element
 *
 * @param element Text element to validate
 * @param config Validation configuration
 * @returns Validated element with adjustment flag
 */
export function validateSingleTextElement(
  element: TextElement,
  config: TextBoundaryConfig
): ValidatedTextElement {
  const [validated] = validateTextBoundaries([element], config)
  return validated
}
