/**
 * Positioning Helper Functions
 * v6.14: Intelligent speaker photo positioning to avoid content conflicts
 *
 * Utilities for grid-based zone analysis and coordinate calculations
 */

import sharp from 'sharp'

// ============================================================================
// Types
// ============================================================================

export interface ZoneDefinition {
  name: string
  x: number  // Percentage 0-1
  y: number  // Percentage 0-1
}

export interface ZoneScore {
  name: string
  x: number
  y: number
  businessScore: number
  edgeDensity: number
  colorVariance: number
  brightness: number
  confidence: number
  absoluteY?: number        // v6.15: Absolute Y position in pixels (for grouping positioning)
  finalSize?: number        // v6.17: Dynamic photo size (if collision detection applied)
  sizeReduced?: boolean     // v6.17: Whether size was reduced to avoid collision
  sizeReduction?: number    // v6.17: Amount of size reduction in pixels
  collisionAverted?: boolean // v6.17: Whether collision was successfully averted
  rejected?: boolean        // v6.17: Whether zone was rejected (insufficient space)
  overlapPercent?: number   // v6.17: Percentage of text overlap (fallback scenarios)
}

export interface SafePosition {
  x: number
  y: number
  confidence: number
  zone: string
  reasoning: string
  finalSize?: number        // v6.17: Dynamic photo size (if reduced)
  sizeReduced?: boolean     // v6.17: Whether size was reduced
  originalSize?: number     // v6.17: Original requested size
}

// ============================================================================
// Zone Grid Definitions
// ============================================================================

/**
 * Standard 9-zone grid for intelligent positioning
 * Covers all common composition areas
 */
export const ZONE_GRID: ZoneDefinition[] = [
  // Top row (header area - usually has logos, avoid)
  { name: 'top-left', x: 0.20, y: 0.20 },
  { name: 'top-center', x: 0.50, y: 0.20 },
  { name: 'top-right', x: 0.80, y: 0.20 },

  // Middle row (content area - hero text usually here)
  { name: 'mid-left', x: 0.20, y: 0.50 },
  { name: 'mid-center', x: 0.50, y: 0.50 },
  { name: 'mid-right', x: 0.80, y: 0.50 },

  // Bottom row (details area - date/venue text)
  { name: 'bottom-left', x: 0.20, y: 0.75 },
  { name: 'bottom-center', x: 0.50, y: 0.75 },
  { name: 'bottom-right', x: 0.80, y: 0.75 }
]

// ============================================================================
// Coordinate Utilities
// ============================================================================

/**
 * Clamp value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/**
 * Convert percentage coordinates to absolute pixels
 * Accounts for overlay size to ensure proper centering
 */
export function percentToPixels(
  percentX: number,
  percentY: number,
  imageWidth: number,
  imageHeight: number,
  overlayWidth: number,
  overlayHeight: number
): { x: number; y: number } {
  // Calculate center point in pixels
  const centerX = Math.round(imageWidth * percentX)
  const centerY = Math.round(imageHeight * percentY)

  // Offset to top-left corner (Sharp uses top-left coordinates)
  const x = centerX - Math.round(overlayWidth / 2)
  const y = centerY - Math.round(overlayHeight / 2)

  return { x, y }
}

/**
 * Ensure coordinates stay within image boundaries with padding
 */
export function enforceImageBoundaries(
  x: number,
  y: number,
  overlayWidth: number,
  overlayHeight: number,
  imageWidth: number,
  imageHeight: number,
  padding: number = 40
): { x: number; y: number } {
  return {
    x: clamp(x, padding, imageWidth - overlayWidth - padding),
    y: clamp(y, padding, imageHeight - overlayHeight - padding)
  }
}

// ============================================================================
// Zone Extraction
// ============================================================================

/**
 * Extract a sample region from the image for analysis
 * Returns a Buffer containing just the zone pixels
 */
export async function extractZoneSample(
  imageBuffer: Buffer,
  zone: ZoneDefinition,
  overlaySize: { width: number; height: number }
): Promise<Buffer> {
  const metadata = await sharp(imageBuffer).metadata()

  if (!metadata.width || !metadata.height) {
    throw new Error('Invalid image metadata')
  }

  // Convert zone percentage to pixels
  const { x, y } = percentToPixels(
    zone.x,
    zone.y,
    metadata.width,
    metadata.height,
    overlaySize.width,
    overlaySize.height
  )

  // Ensure extraction stays within boundaries
  const bounded = enforceImageBoundaries(
    x,
    y,
    overlaySize.width,
    overlaySize.height,
    metadata.width,
    metadata.height,
    0  // No padding for extraction (we just want the exact zone)
  )

  // Extract the region
  return sharp(imageBuffer)
    .extract({
      left: bounded.x,
      top: bounded.y,
      width: overlaySize.width,
      height: overlaySize.height
    })
    .toBuffer()
}

// ============================================================================
// Visual Complexity Analysis
// ============================================================================

/**
 * Detect edge density in an image region using Sobel operator
 * High edge density = lots of graphics, text, or detailed content
 * Low edge density = solid colors, gradients, simple backgrounds
 *
 * Returns: 0-1 scale (0 = no edges, 1 = maximum edges)
 */
export async function detectEdgeDensity(sampleBuffer: Buffer): Promise<number> {
  try {
    // Convert to grayscale and apply edge detection
    const edgeImage = await sharp(sampleBuffer)
      .grayscale()
      .convolve({
        width: 3,
        height: 3,
        kernel: [-1, -1, -1, -1, 8, -1, -1, -1, -1]  // Laplacian edge detection
      })
      .raw()
      .toBuffer({ resolveWithObject: true })

    // Calculate average edge intensity
    const { data, info } = edgeImage
    let edgeSum = 0

    for (let i = 0; i < data.length; i++) {
      edgeSum += data[i]
    }

    const avgEdge = edgeSum / data.length

    // Normalize to 0-1 scale (255 is max intensity)
    return Math.min(avgEdge / 128, 1)  // Divide by 128 (half of 255) for sensitivity

  } catch (error) {
    console.error('[Edge Detection] Error:', error)
    return 0.5  // Default to medium complexity on error
  }
}

/**
 * Calculate entropy of an image region
 * High entropy = complex, varied content
 * Low entropy = uniform, simple content
 *
 * Returns: 0-1 scale (normalized)
 */
export async function calculateEntropy(sampleBuffer: Buffer): Promise<number> {
  try {
    const { data } = await sharp(sampleBuffer)
      .raw()
      .toBuffer({ resolveWithObject: true })

    // Build histogram (simplified - use brightness only)
    const histogram = new Array(256).fill(0)

    for (let i = 0; i < data.length; i += 3) {
      // Average RGB to get brightness
      const brightness = Math.round((data[i] + data[i + 1] + data[i + 2]) / 3)
      histogram[brightness]++
    }

    // Calculate Shannon entropy
    const totalPixels = data.length / 3
    let entropy = 0

    for (const count of histogram) {
      if (count > 0) {
        const probability = count / totalPixels
        entropy -= probability * Math.log2(probability)
      }
    }

    // Normalize to 0-1 (max entropy for 256 bins is 8)
    return Math.min(entropy / 8, 1)

  } catch (error) {
    console.error('[Entropy Calculation] Error:', error)
    return 0.5  // Default to medium complexity
  }
}

// ============================================================================
// Zone Scoring
// ============================================================================

/**
 * Calculate comprehensive business score for a zone
 * Lower score = safer/quieter zone for overlay
 *
 * Weights:
 * - 40% Edge density (graphics, text, details)
 * - 30% Color variance (complex patterns vs solid)
 * - 20% Brightness extremes (pure black/white are risky)
 * - 10% Entropy (overall complexity)
 */
export function calculateBusinessScore(
  edgeDensity: number,
  colorVariance: number,
  brightness: number,
  entropy: number
): number {
  // Normalize inputs to 0-1 scale
  const normalizedVariance = Math.min(colorVariance / 128, 1)  // 128 is typical max stdev
  const brightnessExtreme = Math.abs(brightness - 128) / 128  // Distance from middle gray

  // Weighted combination
  const score =
    edgeDensity * 0.40 +
    normalizedVariance * 0.30 +
    brightnessExtreme * 0.20 +
    entropy * 0.10

  return clamp(score, 0, 1)
}

/**
 * Apply zone preference adjustments
 * Some zones are inherently better/worse for speaker photos
 */
export function applyZonePreferences(
  score: number,
  zoneName: string,
  hasLogosAtTop: boolean = true
): number {
  let adjusted = score

  // Penalize top zones if logos are present (common in event posters)
  if (hasLogosAtTop && zoneName.startsWith('top-')) {
    adjusted += 0.15  // Increase business score = less preferred
  }

  // Slight preference for corner zones (better composition)
  if (zoneName.includes('left') || zoneName.includes('right')) {
    adjusted -= 0.05  // Decrease business score = more preferred
  }

  // Avoid center zones (usually reserved for headline text)
  if (zoneName.includes('center')) {
    adjusted += 0.10
  }

  return clamp(adjusted, 0, 1)
}

// ============================================================================
// Result Formatting
// ============================================================================

/**
 * Generate human-readable reasoning for position selection
 */
export function generatePositioningReasoning(
  selectedZone: ZoneScore,
  allZones: ZoneScore[]
): string {
  const reasons: string[] = []

  // Main reason based on score
  if (selectedZone.businessScore < 0.3) {
    reasons.push(`Very quiet zone with minimal visual complexity`)
  } else if (selectedZone.businessScore < 0.5) {
    reasons.push(`Moderately quiet zone suitable for overlay`)
  } else {
    reasons.push(`Best available zone (all areas have some complexity)`)
  }

  // Specific factors
  if (selectedZone.edgeDensity < 0.2) {
    reasons.push(`low edge density (simple background)`)
  }

  if (selectedZone.colorVariance < 30) {
    reasons.push(`low color variance (solid/gradient)`)
  }

  if (selectedZone.brightness > 100 && selectedZone.brightness < 200) {
    reasons.push(`good mid-range brightness for contrast`)
  }

  // Comparison to other zones
  const averageScore = allZones.reduce((sum, z) => sum + z.businessScore, 0) / allZones.length
  if (selectedZone.businessScore < averageScore - 0.15) {
    reasons.push(`significantly quieter than average (${(averageScore * 100).toFixed(0)}%)`)
  }

  return reasons.join('; ')
}
