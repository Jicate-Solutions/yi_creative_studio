/**
 * Intelligent Speaker Photo Positioning
 * v6.14: AI-powered safe zone detection to avoid content conflicts
 *
 * Purpose:
 * - Analyze generated poster to detect busy vs quiet zones
 * - Position speaker photo to avoid overlaying important content
 * - Prevent conflicts with graphics, text, and visual elements
 *
 * Strategy:
 * - Divide image into 9 zones (3x3 grid)
 * - Analyze each zone for visual complexity (edges, colors, brightness)
 * - Score zones: lower = safer
 * - Return position with highest confidence
 *
 * Performance: ~200-400ms overhead (Sharp image processing only)
 * Cost: $0.00 (no AI API calls)
 */

import sharp from 'sharp'
import {
  ZONE_GRID,
  extractZoneSample,
  detectEdgeDensity,
  calculateEntropy,
  calculateBusinessScore,
  applyZonePreferences,
  percentToPixels,
  enforceImageBoundaries,
  generatePositioningReasoning,
  type ZoneScore,
  type SafePosition
} from './positioning-helpers'

// ============================================================================
// Main Intelligent Positioning Function
// ============================================================================

/**
 * Find the safest zone for speaker photo overlay
 * Analyzes visual complexity across 9 grid zones
 *
 * @param baseImageBuffer - Generated poster image (before speaker overlay)
 * @param overlaySize - Speaker photo dimensions (including shadow/border)
 * @param options - Configuration options
 * @returns Safe position with confidence score
 */
export async function findSafeOverlayZone(
  baseImageBuffer: Buffer,
  overlaySize: { width: number; height: number },
  options?: {
    hasLogosAtTop?: boolean
    preferredSide?: 'left' | 'right' | 'center' | 'auto'
    minConfidence?: number
  }
): Promise<SafePosition> {
  const startTime = Date.now()

  const {
    hasLogosAtTop = true,
    preferredSide = 'auto',
    minConfidence = 0.4
  } = options || {}

  console.log('[Intelligent Positioning] 🎯 Analyzing image for safe overlay zones...')
  console.log(`[Intelligent Positioning] Overlay size: ${overlaySize.width}x${overlaySize.height}`)
  console.log(`[Intelligent Positioning] Logos at top: ${hasLogosAtTop}`)
  console.log(`[Intelligent Positioning] Preferred side: ${preferredSide}`)

  // Get image metadata
  const metadata = await sharp(baseImageBuffer).metadata()

  if (!metadata.width || !metadata.height) {
    throw new Error('Invalid image metadata')
  }

  console.log(`[Intelligent Positioning] Image size: ${metadata.width}x${metadata.height}`)

  // Step 1: Analyze all zones
  const zonedScores: ZoneScore[] = []

  for (const zone of ZONE_GRID) {
    try {
      // Extract zone sample
      const sample = await extractZoneSample(baseImageBuffer, zone, overlaySize)

      // Get basic statistics
      const stats = await sharp(sample).stats()

      // Calculate visual complexity metrics
      const edgeDensity = await detectEdgeDensity(sample)
      const entropy = await calculateEntropy(sample)

      // Extract color variance and brightness from stats
      const colorVariance = stats.channels.reduce((sum, ch) => sum + ch.stdev, 0) / stats.channels.length
      const brightness = stats.channels.reduce((sum, ch) => sum + ch.mean, 0) / stats.channels.length

      // Calculate raw business score
      const rawScore = calculateBusinessScore(
        edgeDensity,
        colorVariance,
        brightness,
        entropy
      )

      // Apply zone preferences
      const adjustedScore = applyZonePreferences(rawScore, zone.name, hasLogosAtTop)

      zonedScores.push({
        name: zone.name,
        x: zone.x,
        y: zone.y,
        businessScore: adjustedScore,
        edgeDensity,
        colorVariance,
        brightness,
        confidence: 1 - adjustedScore  // Invert: low business = high confidence
      })

      console.log(`[Intelligent Positioning]   ${zone.name}: score=${adjustedScore.toFixed(3)}, edges=${edgeDensity.toFixed(2)}, variance=${colorVariance.toFixed(1)}, confidence=${((1 - adjustedScore) * 100).toFixed(1)}%`)

    } catch (error) {
      console.error(`[Intelligent Positioning] Error analyzing zone ${zone.name}:`, error)

      // Add fallback score (medium complexity)
      zonedScores.push({
        name: zone.name,
        x: zone.x,
        y: zone.y,
        businessScore: 0.5,
        edgeDensity: 0.5,
        colorVariance: 50,
        brightness: 128,
        confidence: 0.5
      })
    }
  }

  // Step 2: Apply side preference filter if specified
  let candidateZones = zonedScores

  if (preferredSide !== 'auto') {
    const sideFilter = candidateZones.filter(z => {
      if (preferredSide === 'left') return z.name.includes('left')
      if (preferredSide === 'right') return z.name.includes('right')
      if (preferredSide === 'center') return z.name.includes('center')
      return true
    })

    // Only apply filter if we have candidates
    if (sideFilter.length > 0) {
      candidateZones = sideFilter
      console.log(`[Intelligent Positioning] 📍 Filtered to ${preferredSide} side: ${candidateZones.length} candidates`)
    }
  }

  // Step 3: Sort by business score (ascending = quietest first)
  candidateZones.sort((a, b) => a.businessScore - b.businessScore)

  // Step 4: Select safest zone
  const safest = candidateZones[0]

  // Step 5: Convert to absolute pixels
  const { x, y } = percentToPixels(
    safest.x,
    safest.y,
    metadata.width,
    metadata.height,
    overlaySize.width,
    overlaySize.height
  )

  // Step 6: Enforce image boundaries
  const bounded = enforceImageBoundaries(
    x,
    y,
    overlaySize.width,
    overlaySize.height,
    metadata.width,
    metadata.height,
    40  // 40px padding from edges
  )

  // Step 7: Generate reasoning
  const reasoning = generatePositioningReasoning(safest, zonedScores)

  const duration = Date.now() - startTime

  console.log(`[Intelligent Positioning] ✅ Analysis complete in ${duration}ms`)
  console.log(`[Intelligent Positioning] 🎯 Selected zone: ${safest.name}`)
  console.log(`[Intelligent Positioning] 📊 Confidence: ${(safest.confidence * 100).toFixed(1)}%`)
  console.log(`[Intelligent Positioning] 📍 Position: (${bounded.x}, ${bounded.y})`)
  console.log(`[Intelligent Positioning] 💡 Reasoning: ${reasoning}`)

  // Check if confidence meets minimum threshold
  if (safest.confidence < minConfidence) {
    console.warn(`[Intelligent Positioning] ⚠️ Low confidence (${(safest.confidence * 100).toFixed(1)}%) - all zones are busy`)
    console.warn(`[Intelligent Positioning] 💡 Consider using fallback positioning or AI vision analysis`)
  }

  return {
    x: bounded.x,
    y: bounded.y,
    confidence: safest.confidence,
    zone: safest.name,
    reasoning
  }
}

// ============================================================================
// Fallback: Default Position Calculator
// ============================================================================

/**
 * Calculate default position when intelligent positioning fails
 * Uses the original percentage-based system
 */
export function calculateDefaultPosition(
  imageWidth: number,
  imageHeight: number,
  overlaySize: { width: number; height: number },
  position: 'left' | 'center' | 'right' = 'right',
  vertical: 'top' | 'upper' | 'middle' | 'lower' | 'bottom' = 'lower'
): { x: number; y: number } {
  // Horizontal positions
  const horizontalPositions = {
    left: 0.20,
    center: 0.50,
    right: 0.80
  }

  // Vertical positions (percentage from top)
  const verticalPositions = {
    top: 0.15,
    upper: 0.30,
    middle: 0.50,
    lower: 0.65,
    bottom: 0.80
  }

  const { x, y } = percentToPixels(
    horizontalPositions[position],
    verticalPositions[vertical],
    imageWidth,
    imageHeight,
    overlaySize.width,
    overlaySize.height
  )

  return enforceImageBoundaries(
    x,
    y,
    overlaySize.width,
    overlaySize.height,
    imageWidth,
    imageHeight,
    40
  )
}

// ============================================================================
// Hybrid: Intelligent + User Preference
// ============================================================================

/**
 * Combine intelligent positioning with user preferences
 * Tries to honor user's preferred side/position while finding safest zone
 */
export async function findSafePositionWithPreference(
  baseImageBuffer: Buffer,
  overlaySize: { width: number; height: number },
  userPreference: {
    position?: 'left' | 'center' | 'right'
    vertical?: 'top' | 'upper' | 'middle' | 'lower' | 'bottom'
  },
  options?: {
    hasLogosAtTop?: boolean
    minConfidence?: number
    allowOverride?: boolean  // Allow intelligent system to override if user choice is very bad
  }
): Promise<SafePosition & { usedPreference: boolean }> {
  const { allowOverride = true, minConfidence = 0.4 } = options || {}

  // Try intelligent positioning with preferred side
  const intelligentResult = await findSafeOverlayZone(
    baseImageBuffer,
    overlaySize,
    {
      ...options,
      preferredSide: userPreference.position || 'auto'
    }
  )

  // If confidence is good, use intelligent result
  if (intelligentResult.confidence >= minConfidence) {
    console.log(`[Hybrid Positioning] ✅ Using intelligent positioning (confidence: ${(intelligentResult.confidence * 100).toFixed(1)}%)`)
    return {
      ...intelligentResult,
      usedPreference: false
    }
  }

  // If confidence is low and override is disabled, use user preference
  if (!allowOverride) {
    const metadata = await sharp(baseImageBuffer).metadata()
    const defaultPos = calculateDefaultPosition(
      metadata.width!,
      metadata.height!,
      overlaySize,
      userPreference.position,
      userPreference.vertical
    )

    console.log(`[Hybrid Positioning] 📌 Using user preference (override disabled)`)
    return {
      ...defaultPos,
      confidence: 0.5,  // Assume medium confidence for user preference
      zone: `${userPreference.vertical}-${userPreference.position}`,
      reasoning: 'User preference (intelligent analysis had low confidence)',
      usedPreference: true
    }
  }

  // Low confidence but override allowed - use intelligent result anyway
  console.log(`[Hybrid Positioning] ⚠️ Low confidence but using intelligent result (override enabled)`)
  return {
    ...intelligentResult,
    usedPreference: false
  }
}

// ============================================================================
// v6.15: Grouping-Aware Positioning (Text + Photo Cohesion)
// ============================================================================

/**
 * Find safe overlay zone NEAR detected speaker text for visual grouping
 * v6.15: Solves text/photo disconnect by constraining zone search to text proximity
 *
 * @param baseImageBuffer - Generated poster (before speaker overlay)
 * @param overlaySize - Speaker photo dimensions
 * @param textPosition - Detected text center coordinates
 * @param options - Grouping configuration
 * @returns Safe position within grouping radius of text
 */
export async function findSafeOverlayZoneNearText(
  baseImageBuffer: Buffer,
  overlaySize: { width: number; height: number },
  textPosition: { centerY: number; boundingBox?: { x: number; y: number; width: number; height: number } },
  options?: {
    hasLogosAtTop?: boolean
    preferredSide?: 'left' | 'right' | 'center' | 'auto'
    groupingRadius?: number
    minConfidence?: number
  }
): Promise<SafePosition & { withinGroupingRange: boolean }> {
  const startTime = Date.now()

  const {
    hasLogosAtTop = true,
    preferredSide = 'auto',
    groupingRadius = 150,  // Max 150px away from text center
    minConfidence = 0.4
  } = options || {}

  console.log('[Grouping Positioning v6.15] 🎯 Finding safe zone NEAR speaker text...')
  console.log(`[Grouping Positioning v6.15] Text center Y: ${textPosition.centerY}px`)
  console.log(`[Grouping Positioning v6.15] Grouping radius: ±${groupingRadius}px`)
  console.log(`[Grouping Positioning v6.15] Overlay size: ${overlaySize.width}x${overlaySize.height}`)

  // Get image metadata
  const metadata = await sharp(baseImageBuffer).metadata()

  if (!metadata.width || !metadata.height) {
    throw new Error('Invalid image metadata')
  }

  // Calculate grouping zone (Y-coordinate range where photo should be)
  const targetPhotoY = textPosition.centerY - Math.round(overlaySize.height / 2)
  const groupingZoneMinY = targetPhotoY - groupingRadius
  const groupingZoneMaxY = targetPhotoY + groupingRadius

  console.log(`[Grouping Positioning v6.15] Target photo Y: ${targetPhotoY}px (aligned with text)`)
  console.log(`[Grouping Positioning v6.15] Grouping zone: ${groupingZoneMinY}px - ${groupingZoneMaxY}px`)

  // v6.15.1: Add near-miss tolerance (25% of grouping radius)
  const tolerancePercent = 0.25 // 25% tolerance for near-misses
  const tolerancePixels = Math.round(groupingRadius * tolerancePercent)
  const groupingZoneMinYWithTolerance = groupingZoneMinY - tolerancePixels
  const groupingZoneMaxYWithTolerance = groupingZoneMaxY + tolerancePixels

  console.log(`[Grouping Positioning v6.15.1] 📏 Tolerance: ±${tolerancePixels}px (${tolerancePercent * 100}% of ${groupingRadius}px radius)`)
  console.log(`[Grouping Positioning v6.15.1] 📏 Extended range: ${groupingZoneMinYWithTolerance}px - ${groupingZoneMaxYWithTolerance}px`)

  // Step 1: Analyze all zones (same as standard intelligent positioning)
  const zonedScores: ZoneScore[] = []

  for (const zone of ZONE_GRID) {
    try {
      const sample = await extractZoneSample(baseImageBuffer, zone, overlaySize)
      const stats = await sharp(sample).stats()

      const edgeDensity = await detectEdgeDensity(sample)
      const entropy = await calculateEntropy(sample)

      const colorVariance = stats.channels.reduce((sum, ch) => sum + ch.stdev, 0) / stats.channels.length
      const brightness = stats.channels.reduce((sum, ch) => sum + ch.mean, 0) / stats.channels.length

      const rawScore = calculateBusinessScore(edgeDensity, colorVariance, brightness, entropy)
      const adjustedScore = applyZonePreferences(rawScore, zone.name, hasLogosAtTop)

      // Calculate zone's Y-coordinate
      const { y } = percentToPixels(
        zone.x,
        zone.y,
        metadata.width,
        metadata.height,
        overlaySize.width,
        overlaySize.height
      )

      // Check if zone is within grouping range (v6.15.1: with tolerance)
      const withinStrictRange = y >= groupingZoneMinY && y <= groupingZoneMaxY
      const withinToleranceRange = y >= groupingZoneMinYWithTolerance && y <= groupingZoneMaxYWithTolerance
      const distanceFromText = Math.abs(y - targetPhotoY)

      zonedScores.push({
        name: zone.name,
        x: zone.x,
        y: zone.y,
        businessScore: adjustedScore,
        edgeDensity,
        colorVariance,
        brightness,
        confidence: 1 - adjustedScore
      })

      // v6.15.1: Show tolerance status
      let groupingStatus
      if (withinStrictRange) {
        groupingStatus = '✓ Within strict range'
      } else if (withinToleranceRange) {
        const overage = Math.min(Math.abs(y - groupingZoneMinY), Math.abs(y - groupingZoneMaxY))
        groupingStatus = `✓ Within tolerance (${overage.toFixed(0)}px near-miss)`
      } else {
        const overage = Math.min(
          Math.abs(y - groupingZoneMinYWithTolerance),
          Math.abs(y - groupingZoneMaxYWithTolerance)
        )
        groupingStatus = `✗ Outside range (${overage.toFixed(0)}px beyond tolerance)`
      }

      console.log(`[Grouping Positioning v6.15.1]   ${zone.name}: score=${adjustedScore.toFixed(3)}, Y=${y}px, distance=${distanceFromText}px, ${groupingStatus}`)
    } catch (error) {
      console.error(`[Grouping Positioning v6.15] Error analyzing zone ${zone.name}:`, error)

      zonedScores.push({
        name: zone.name,
        x: zone.x,
        y: zone.y,
        businessScore: 0.5,
        edgeDensity: 0.5,
        colorVariance: 50,
        brightness: 128,
        confidence: 0.5
      })
    }
  }

  // Step 2: Filter zones to those within grouping range (v6.15.1: with tolerance)
  const candidateZonesWithY = zonedScores.map(zone => {
    const { y } = percentToPixels(
      zone.x,
      zone.y,
      metadata.width,
      metadata.height,
      overlaySize.width,
      overlaySize.height
    )
    return { ...zone, absoluteY: y }
  })

  // v6.15.1: Use tolerance-extended range to accept near-misses
  const zonesInGroupingRange = candidateZonesWithY.filter(z =>
    z.absoluteY >= groupingZoneMinYWithTolerance && z.absoluteY <= groupingZoneMaxYWithTolerance
  )

  console.log(`[Grouping Positioning v6.15.1] 📊 Zones in grouping range (with tolerance): ${zonesInGroupingRange.length} / ${zonedScores.length}`)

  // v6.15.1 Phase 2: Adaptive radius expansion if no zones found
  let expandedZones = zonesInGroupingRange

  if (expandedZones.length === 0) {
    console.log(`[Grouping Positioning v6.15.1] ⚠️ No zones with tolerance - trying adaptive radius expansion...`)

    let currentRadius = groupingRadius + tolerancePixels // Start from tolerance limit
    const expansionIncrement = 50 // Expand by 50px each iteration
    const maxExpansions = 3 // Try up to 3 expansions (total: 150 + 37.5 + 150 = 337.5px)
    let expansionCount = 0

    while (expandedZones.length === 0 && expansionCount < maxExpansions) {
      currentRadius += expansionIncrement
      expansionCount++

      const expandedMinY = targetPhotoY - currentRadius
      const expandedMaxY = targetPhotoY + currentRadius

      expandedZones = candidateZonesWithY.filter(z =>
        z.absoluteY >= expandedMinY && z.absoluteY <= expandedMaxY
      )

      console.log(`[Grouping Positioning v6.15.1] 🔄 Expansion ${expansionCount}/${maxExpansions}: radius ${currentRadius}px, range ${expandedMinY}-${expandedMaxY}px → ${expandedZones.length} zones`)

      if (expandedZones.length > 0) {
        console.log(`[Grouping Positioning v6.15.1] ✅ Found ${expandedZones.length} zones at ${currentRadius}px radius (${currentRadius - groupingRadius}px beyond base)`)
        break
      }
    }

    if (expandedZones.length === 0) {
      console.warn(`[Grouping Positioning v6.15.1] ⚠️ No zones found even at ${currentRadius}px radius - using best overall zone (catastrophic fallback)`)
      expandedZones = candidateZonesWithY // Final fallback: use all zones
    }
  } else {
    console.log(`[Grouping Positioning v6.15.1] ✅ Found ${expandedZones.length} zones within tolerance range`)
  }

  /**
   * v6.17: Calculate available space between photo and text bounding box
   * Returns gaps in all directions and identifies primary (largest) gap
   */
  function calculateAvailableSpace(
    photoX: number,
    photoY: number,
    photoSize: number,
    textBox: { x: number; y: number; width: number; height: number }
  ): {
    primaryGap: number
    direction: 'left' | 'right' | 'above' | 'below'
    gapLeft: number
    gapRight: number
    gapAbove: number
    gapBelow: number
  } {
    const photoRight = photoX + photoSize
    const photoBottom = photoY + photoSize
    const textRight = textBox.x + textBox.width
    const textBottom = textBox.y + textBox.height

    // Calculate gaps in each direction
    const gapLeft = Math.abs(photoX - textRight)      // Photo right of text
    const gapRight = Math.abs(textBox.x - photoRight) // Photo left of text
    const gapAbove = Math.abs(photoY - textBottom)    // Photo below text
    const gapBelow = Math.abs(textBox.y - photoBottom) // Photo above text

    // Find largest gap
    const gaps = [
      { gap: gapLeft, direction: 'left' as const },
      { gap: gapRight, direction: 'right' as const },
      { gap: gapAbove, direction: 'above' as const },
      { gap: gapBelow, direction: 'below' as const }
    ]

    const primary = gaps.reduce((max, current) => current.gap > max.gap ? current : max)

    return {
      primaryGap: primary.gap,
      direction: primary.direction,
      gapLeft,
      gapRight,
      gapAbove,
      gapBelow
    }
  }

  /**
   * v6.17: Calculate maximum photo size that fits without text collision
   * Considers:
   * - Available gap (distance to text)
   * - Image boundaries (don't exceed poster edges)
   * - Size constraints (min: 200px, max: 380px)
   */
  function calculateMaxPhotoSize(
    photoX: number,
    photoY: number,
    currentSize: number,
    textBox: { x: number; y: number; width: number; height: number },
    imageWidth: number,
    imageHeight: number,
    options: {
      safetyMargin?: number
      minSize?: number
      maxSize?: number
      imagePadding?: number
    } = {}
  ): { maxSize: number; reasoning: string; wouldFit: boolean } {

    const safetyMargin = options.safetyMargin ?? 50 // v6.17.1: Accounts for anti-aliasing + rendering variance
    const minSize = options.minSize ?? 200
    const maxSize = options.maxSize ?? 380
    const imagePadding = options.imagePadding ?? 40

    // Calculate available space
    const spaceInfo = calculateAvailableSpace(photoX, photoY, currentSize, textBox)
    const { primaryGap, direction } = spaceInfo

    // Strategy 1: Fill primary gap (with safety margin)
    const maxSizeFromGap = primaryGap - safetyMargin

    // Strategy 2: Consider image boundaries
    const maxSizeFromBoundary = Math.min(
      imageWidth - photoX - imagePadding,   // Right boundary
      imageHeight - photoY - imagePadding,  // Bottom boundary
      photoX - imagePadding,                // Left boundary
      photoY - imagePadding                 // Top boundary
    )

    // Combined constraint
    const maxAllowedSize = Math.min(
      maxSizeFromGap,
      maxSizeFromBoundary,
      maxSize  // Never exceed maximum tier
    )

    // v6.17.1 FIX: Reject zone if gap is smaller than minimum size
    if (primaryGap < minSize) {
      return {
        maxSize: 0,  // Signal rejection
        reasoning: `Rejected: gap ${Math.round(primaryGap)}px < minimum ${minSize}px`,
        wouldFit: false
      }
    }

    // Apply minimum threshold
    const finalSize = Math.max(maxAllowedSize, minSize)
    const wouldFit = finalSize >= minSize && finalSize <= currentSize

    const reasoning = finalSize < currentSize
      ? `Reduced from ${currentSize}px to ${finalSize}px to fit ${Math.round(primaryGap)}px gap (${direction} of text, ${safetyMargin}px margin)`
      : `Current size ${currentSize}px fits with ${Math.round(primaryGap)}px clearance (${direction})`

    return { maxSize: finalSize, reasoning, wouldFit }
  }

  // v6.17 Phase 3: Enhanced collision detection with dynamic photo sizing
  let collisionFreeCandidates = expandedZones

  if (textPosition.boundingBox && expandedZones.length > 0) {
    console.log(`[Grouping Positioning v6.17] 🔍 Checking for photo-text collisions with dynamic sizing...`)

    const textBox = textPosition.boundingBox
    const collisionThreshold = 0.05 // v6.17.1: Only 5% minor overlap allowed (for anti-aliasing tolerance)

    // v6.17: Map zones to include optimal photo sizes
    const zonesWithOptimalSize = expandedZones.map(zone => {
      // Calculate photo bounding box for this zone
      const photoX = zone.x * metadata.width - Math.round(overlaySize.width / 2) + Math.round(overlaySize.width * zone.x)
      const photoY = zone.absoluteY
      const photoRight = photoX + overlaySize.width
      const photoBottom = photoY + overlaySize.height

      const textBottom = textBox.y + textBox.height
      const textRight = textBox.x + textBox.width

      // Check for rectangle overlap
      const overlapX = Math.max(0, Math.min(photoRight, textRight) - Math.max(photoX, textBox.x))
      const overlapY = Math.max(0, Math.min(photoBottom, textBottom) - Math.max(photoY, textBox.y))
      const overlapArea = overlapX * overlapY

      const textArea = textBox.width * textBox.height
      const overlapPercent = textArea > 0 ? overlapArea / textArea : 0
      const wouldCollide = overlapPercent > collisionThreshold

      if (wouldCollide) {
        // v6.17: Instead of rejecting, try dynamic sizing
        const sizeResult = calculateMaxPhotoSize(
          photoX,
          photoY,
          overlaySize.height,  // Current size
          textBox,
          metadata.width,
          metadata.height
        )

        if (sizeResult.wouldFit && sizeResult.maxSize >= 200 && sizeResult.maxSize > 0) {
          // v6.17.1: maxSize=0 signals rejection
          // Viable zone with reduced size
          console.log(`[Grouping Positioning v6.17.1]   ✅ ${zone.name}: Viable with size reduction - ${sizeResult.reasoning}`)

          return {
            ...zone,
            finalSize: sizeResult.maxSize,
            sizeReduced: true,
            sizeReduction: overlaySize.height - sizeResult.maxSize,
            collisionAverted: true,
            rejected: false
          }
        } else {
          // Not enough space even with minimum size
          console.log(`[Grouping Positioning v6.17]   ✗ ${zone.name}: Insufficient space (${sizeResult.reasoning}) - REJECTED`)

          return {
            ...zone,
            finalSize: undefined,
            sizeReduced: false,
            rejected: true
          }
        }
      } else {
        // No collision at current size
        if (overlapPercent > 0) {
          console.log(`[Grouping Positioning v6.17]   ✓ ${zone.name}: Safe at current size ${overlaySize.height}px (${(overlapPercent * 100).toFixed(1)}% minor overlap)`)
        } else {
          console.log(`[Grouping Positioning v6.17]   ✓ ${zone.name}: Safe at current size ${overlaySize.height}px (no overlap)`)
        }

        return {
          ...zone,
          finalSize: overlaySize.height,  // Keep original size
          sizeReduced: false,
          collisionAverted: false,
          rejected: false
        }
      }
    })

    // Filter out rejected zones
    const viableZones = zonesWithOptimalSize.filter(z => !z.rejected)

    if (viableZones.length === 0) {
      console.warn(`[Grouping Positioning v6.17] ⚠️ All ${expandedZones.length} zones rejected (insufficient space) - using least-bad option`)

      // Fallback: Use zone with minimum overlap (v6.15.1 behavior)
      const zonesWithOverlap = expandedZones.map(zone => {
        const photoX = zone.x * metadata.width - Math.round(overlaySize.width / 2) + Math.round(overlaySize.width * zone.x)
        const photoY = zone.absoluteY
        const photoRight = photoX + overlaySize.width
        const photoBottom = photoY + overlaySize.height

        const textBottom = textBox.y + textBox.height
        const textRight = textBox.x + textBox.width

        const overlapX = Math.max(0, Math.min(photoRight, textRight) - Math.max(photoX, textBox.x))
        const overlapY = Math.max(0, Math.min(photoBottom, textBottom) - Math.max(photoY, textBox.y))
        const overlapArea = overlapX * overlapY
        const overlapPercent = textBox.width * textBox.height > 0 ? overlapArea / (textBox.width * textBox.height) : 1

        return {
          ...zone,
          overlapPercent,
          finalSize: overlaySize.height,
          sizeReduced: false,
          rejected: false
        }
      })

      zonesWithOverlap.sort((a, b) => a.overlapPercent - b.overlapPercent)
      collisionFreeCandidates = [zonesWithOverlap[0]]
      console.log(`[Grouping Positioning v6.17] Selected ${collisionFreeCandidates[0].name} with minimum overlap (${(zonesWithOverlap[0].overlapPercent * 100).toFixed(1)}%)`)
    } else {
      // v6.17: Prefer zones without size reduction
      const zonesWithoutReduction = viableZones.filter(z => !z.sizeReduced)

      if (zonesWithoutReduction.length > 0) {
        collisionFreeCandidates = zonesWithoutReduction
        console.log(`[Grouping Positioning v6.17] ✅ ${zonesWithoutReduction.length} zones safe at original size (no reduction needed)`)
      } else {
        collisionFreeCandidates = viableZones
        console.log(`[Grouping Positioning v6.17] ✅ ${viableZones.length} zones viable with size reduction`)
      }

      const reducedCount = viableZones.filter(z => z.sizeReduced).length
      if (reducedCount > 0) {
        console.log(`[Grouping Positioning v6.17] 📏 Dynamic sizing: ${reducedCount} zones required size reduction`)
      }
    }
  } else if (!textPosition.boundingBox) {
    console.log(`[Grouping Positioning v6.17] ⚠️ No bounding box available - skipping collision detection`)
    // Ensure all zones have finalSize field even without collision detection
    collisionFreeCandidates = expandedZones.map(z => ({
      ...z,
      finalSize: overlaySize.height,
      sizeReduced: false,
      rejected: false
    }))
  }

  // Step 3: Apply side preference filter if specified
  let finalCandidates = collisionFreeCandidates

  if (preferredSide !== 'auto') {
    const sideFilter = finalCandidates.filter(z => {
      if (preferredSide === 'left') return z.name.includes('left')
      if (preferredSide === 'right') return z.name.includes('right')
      if (preferredSide === 'center') return z.name.includes('center')
      return true
    })

    if (sideFilter.length > 0) {
      finalCandidates = sideFilter
      console.log(`[Grouping Positioning v6.15] 📍 Filtered to ${preferredSide} side: ${finalCandidates.length} candidates`)
    }
  }

  // Step 4: Sort by business score (quietest first)
  finalCandidates.sort((a, b) => a.businessScore - b.businessScore)

  // Step 5: Select safest zone
  const safest = finalCandidates[0]
  const withinGroupingRange = zonesInGroupingRange.includes(safest)

  // Step 6: Convert to absolute pixels
  const { x, y } = percentToPixels(
    safest.x,
    safest.y,
    metadata.width,
    metadata.height,
    overlaySize.width,
    overlaySize.height
  )

  // Step 7: Enforce image boundaries
  const bounded = enforceImageBoundaries(
    x,
    y,
    overlaySize.width,
    overlaySize.height,
    metadata.width,
    metadata.height,
    40
  )

  // Step 8: Generate reasoning
  const distanceFromText = Math.abs(bounded.y - targetPhotoY)
  const reasoning = withinGroupingRange
    ? `${generatePositioningReasoning(safest, zonedScores)}; positioned ${distanceFromText}px from speaker text for visual grouping`
    : `${generatePositioningReasoning(safest, zonedScores)}; WARNING: ${distanceFromText}px from text (outside ${groupingRadius}px grouping radius)`

  const duration = Date.now() - startTime

  console.log(`[Grouping Positioning v6.15] ✅ Analysis complete in ${duration}ms`)
  console.log(`[Grouping Positioning v6.15] 🎯 Selected zone: ${safest.name}`)
  console.log(`[Grouping Positioning v6.15] 📊 Confidence: ${(safest.confidence * 100).toFixed(1)}%`)
  console.log(`[Grouping Positioning v6.15] 📍 Position: (${bounded.x}, ${bounded.y})`)
  console.log(`[Grouping Positioning v6.15] 📏 Distance from text: ${distanceFromText}px`)
  console.log(`[Grouping Positioning v6.15] ${withinGroupingRange ? '✅' : '⚠️'} Within grouping range: ${withinGroupingRange}`)
  console.log(`[Grouping Positioning v6.15] 💡 Reasoning: ${reasoning}`)

  if (!withinGroupingRange) {
    console.warn(`[Grouping Positioning v6.15] ⚠️ Could not find safe zone within ${groupingRadius}px of text`)
    console.warn(`[Grouping Positioning v6.15] 💡 Using best available zone ${distanceFromText}px away`)
  }

  return {
    x: bounded.x,
    y: bounded.y,
    confidence: safest.confidence,
    zone: safest.name,
    reasoning,
    withinGroupingRange,
    finalSize: safest.finalSize,           // v6.17: Dynamic photo size
    sizeReduced: safest.sizeReduced,       // v6.17: Size reduction flag
    originalSize: overlaySize.height       // v6.17: Original requested size
  }
}
