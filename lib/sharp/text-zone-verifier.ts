import type { Sharp } from 'sharp'

export interface ZoneViolation {
  zoneType: 'header' | 'footer'
  detectedTextY: number
  forbiddenRangeStart: number
  forbiddenRangeEnd: number
  severity: 'critical' | 'warning'
}

/**
 * Detects if text appears in forbidden zones using edge detection
 * Returns violations found
 */
export async function detectTextInForbiddenZones(
  imageBuffer: Buffer,
  headerEndPercent: number,
  footerStartPercent: number
): Promise<ZoneViolation[]> {
  const sharp = (await import('sharp')).default
  const { width, height } = await sharp(imageBuffer).metadata()

  if (!width || !height) return []

  const violations: ZoneViolation[] = []

  // Tolerance to avoid false positives at zone boundaries.
  // Math.floor pixel rounding can place the extraction edge slightly below the
  // exact percentage boundary, so content right at the edge (e.g. 77.99% vs 78%)
  // would be incorrectly flagged. A 0.5% tolerance ensures only content that is
  // clearly inside the forbidden zone triggers a violation.
  const BOUNDARY_TOLERANCE_PERCENT = 0.15

  // Convert percentages to pixel coordinates
  const headerEndPx = Math.floor((height * headerEndPercent) / 100)
  const footerStartPx = Math.floor((height * footerStartPercent) / 100)

  // Extract header region and analyze for text-like patterns
  const headerRegion = await sharp(imageBuffer)
    .extract({ left: 0, top: 0, width, height: headerEndPx })
    .greyscale()
    .threshold(128) // Binarize
    .raw()
    .toBuffer()

  // Detect high-contrast horizontal patterns (text indicators)
  // Skip first 1% of canvas height (first ~14px on 1440h) — these rows are almost always
  // background art (sky, gradient) that creates white horizontal runs, not real text.
  // "firstTextRow" below the 1% threshold is a near-certain false positive.
  const MIN_DETECTION_ROW = Math.max(1, Math.floor(height * 0.01))
  const headerTextInfo = detectTextPatternWithPosition(headerRegion, width, headerEndPx, MIN_DETECTION_ROW)

  if (headerTextInfo.hasText) {
    // Calculate actual text Y position as percentage
    const actualTextY = (headerTextInfo.firstTextRow / height) * 100

    // Only flag if text is clearly inside the header forbidden zone (not at the boundary edge)
    if (actualTextY < headerEndPercent - BOUNDARY_TOLERANCE_PERCENT) {
      violations.push({
        zoneType: 'header',
        detectedTextY: actualTextY, // Actual position where text starts
        forbiddenRangeStart: 0,
        forbiddenRangeEnd: headerEndPercent,
        severity: 'critical',
      })
    }
  }

  // Repeat for footer zone
  const footerHeight = height - footerStartPx
  const footerRegion = await sharp(imageBuffer)
    .extract({ left: 0, top: footerStartPx, width, height: footerHeight })
    .greyscale()
    .threshold(128)
    .raw()
    .toBuffer()

  // Use detectTextPatternWithPosition to get actual text position (not midpoint)
  const footerTextInfo = detectTextPatternWithPosition(footerRegion, width, footerHeight)

  if (footerTextInfo.hasText) {
    // Calculate actual text Y position relative to full canvas
    // footerTextInfo.firstTextRow is relative to footer region, so add footerStartPx offset
    const actualTextY = ((footerStartPx + footerTextInfo.firstTextRow) / height) * 100

    // Only flag if text is clearly inside the footer forbidden zone (not at the boundary edge)
    // Content at footerStartPercent - 0.5% to footerStartPercent + 0.5% is "at the boundary"
    if (actualTextY > footerStartPercent + BOUNDARY_TOLERANCE_PERCENT) {
      violations.push({
        zoneType: 'footer',
        detectedTextY: actualTextY, // Actual position where text starts, not midpoint
        forbiddenRangeStart: footerStartPercent,
        forbiddenRangeEnd: 100,
        severity: 'critical',
      })
    }
  }

  return violations
}

interface TextDetectionResult {
  hasText: boolean
  firstTextRow: number // Y coordinate of first detected text row
  textRowCount: number
}

function detectTextPatternWithPosition(buffer: Buffer, width: number, height: number, startRow = 0): TextDetectionResult {
  // Simplified text detection with position tracking:
  // Text creates horizontal runs of white pixels (in threshold image)
  // Count horizontal runs above threshold length and track first occurrence
  // startRow: skip this many rows at the start (avoids false positives from background art at very top)

  let textRunCount = 0
  let firstTextRow = -1
  const minRunLength = width * 0.1 // 10% of width

  for (let y = startRow; y < height; y++) {
    let runLength = 0
    let rowHasText = false

    for (let x = 0; x < width; x++) {
      const idx = y * width + x
      const pixel = buffer[idx]

      if (pixel > 128) {
        // White pixel (potential text)
        runLength++
      } else {
        if (runLength >= minRunLength) {
          textRunCount++
          rowHasText = true
        }
        runLength = 0
      }
    }

    // Check end of row
    if (runLength >= minRunLength) {
      textRunCount++
      rowHasText = true
    }

    // Track first row with text
    if (rowHasText && firstTextRow === -1) {
      firstTextRow = y
    }
  }

  // If 3+ rows have long white runs, likely text
  return {
    hasText: textRunCount >= 3,
    firstTextRow: firstTextRow >= 0 ? firstTextRow : 0,
    textRowCount: textRunCount,
  }
}

function detectTextPattern(buffer: Buffer, width: number, height: number): boolean {
  // Legacy function for backward compatibility
  const result = detectTextPatternWithPosition(buffer, width, height)
  return result.hasText
}

/**
 * v24.0: Calculate safe header height based on detected text position
 * Returns optimal header dimensions to avoid text overlap
 *
 * @param violations - Array of zone violations from detectTextInForbiddenZones
 * @param canvasHeight - Total canvas height in pixels
 * @param options - Configuration options
 * @returns Recommended header height in pixels and percentage
 */
export function getSuggestedHeaderHeight(
  violations: ZoneViolation[],
  canvasHeight: number,
  options: {
    minimumHeaderPercent?: number // Minimum acceptable header (default: 15%)
    safetyBufferPercent?: number   // Gap between logo bar and text (default: 3%)
    defaultHeaderPercent?: number  // Default when no violations (default: 24%)
  } = {}
): {
  headerHeight: number
  headerPercent: number
  dynamicAdjustment: boolean
  detectedTextY: number | null
} {
  const {
    minimumHeaderPercent = 15,
    safetyBufferPercent = 3,
    defaultHeaderPercent = 24,
  } = options

  const headerViolation = violations.find(v => v.zoneType === 'header')

  if (!headerViolation) {
    // No violations - use default header height
    return {
      headerHeight: Math.floor(canvasHeight * (defaultHeaderPercent / 100)),
      headerPercent: defaultHeaderPercent,
      dynamicAdjustment: false,
      detectedTextY: null,
    }
  }

  // Text detected in header zone - calculate safe header height
  const actualTextY = headerViolation.detectedTextY

  // Calculate safe header percent (text position minus safety buffer)
  const safeHeaderPercent = Math.max(
    minimumHeaderPercent,
    actualTextY - safetyBufferPercent
  )

  const safeHeaderHeight = Math.floor(canvasHeight * (safeHeaderPercent / 100))

  return {
    headerHeight: safeHeaderHeight,
    headerPercent: safeHeaderPercent,
    dynamicAdjustment: true,
    detectedTextY: actualTextY,
  }
}
