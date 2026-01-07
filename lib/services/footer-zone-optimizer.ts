/**
 * Footer Zone Optimizer Service
 * Intelligently distributes footer zones for visual balance
 *
 * Applies the same space-evenly philosophy as the header logo strip:
 * - Algorithmic patterns based on enabled zones
 * - Even gap distribution between zones
 * - Dynamic width adjustment based on content
 *
 * Footer 3-Zone Layout:
 * Zone 1 (Left): Signature/illustration
 * Zone 2 (Center): Hashtag + Website URL + Social bar
 * Zone 3 (Right): Digital partner logo with label
 */

// ============================================================================
// Types
// ============================================================================

export interface FooterZoneConfig {
  zone1Enabled: boolean  // Signature illustration
  zone2Enabled: boolean  // Hashtag + Website + Social bar
  zone3Enabled: boolean  // Digital Partner
  // Optional: content density hints for smarter sizing
  zone2ContentCount?: number // 0-3: how many of hashtag/website/social are enabled
}

export interface ZoneWidthResult {
  zone1Width: number     // Percentage 0-100
  zone2Width: number     // Percentage 0-100
  zone3Width: number     // Percentage 0-100
  gapSize: number        // Pixels between zones
  alignment: 'spread' | 'center' | 'weighted'
  totalUsedWidth: number // Sum of zone widths (remaining is gap space)
}

export interface ZonePosition {
  x: number       // Starting X position in pixels
  width: number   // Width in pixels
}

// ============================================================================
// Distribution Patterns
// ============================================================================

/**
 * Balanced distribution patterns for footer zones
 *
 * Visual reference:
 * All 3:   [Zone1: 28%]---[Zone2: 47%]---[Zone3: 25%]
 * 1 + 2:  [Zone1: 35%]---[Zone2: 65%]
 * 2 + 3:  [Zone2: 68%]---[Zone3: 32%]
 * 1 + 3:  [Zone1: 45%]---[Zone3: 45%]  (center gap)
 * Single: [Zone: 60-80%] (centered)
 */
const FOOTER_ZONE_PATTERNS: Record<string, {
  zone1: number
  zone2: number
  zone3: number
  gap: number
  alignment: 'spread' | 'center' | 'weighted'
}> = {
  // All zones enabled - balanced tri-column
  'all-enabled': {
    zone1: 28,
    zone2: 47,
    zone3: 25,
    gap: 5,  // v16.8: 5px gap
    alignment: 'spread',
  },
  // Zone 1 + Zone 2 (no partner)
  'zone1-zone2': {
    zone1: 35,
    zone2: 65,
    zone3: 0,
    gap: 5,  // v16.8: 5px gap
    alignment: 'spread',
  },
  // Zone 2 + Zone 3 (no signature)
  'zone2-zone3': {
    zone1: 0,
    zone2: 68,
    zone3: 32,
    gap: 5,  // v16.8: 5px gap
    alignment: 'spread',
  },
  // Zone 1 + Zone 3 (no center content) - rare but supported
  'zone1-zone3': {
    zone1: 45,
    zone2: 0,
    zone3: 45,
    gap: 5,  // v16.8: 5px gap
    alignment: 'spread',
  },
  // Single zones - centered with generous width
  'zone1-only': {
    zone1: 60,
    zone2: 0,
    zone3: 0,
    gap: 0,
    alignment: 'center',
  },
  'zone2-only': {
    zone1: 0,
    zone2: 80,
    zone3: 0,
    gap: 0,
    alignment: 'center',
  },
  'zone3-only': {
    zone1: 0,
    zone2: 0,
    zone3: 60,
    gap: 0,
    alignment: 'center',
  },
  // No zones enabled
  'none': {
    zone1: 0,
    zone2: 0,
    zone3: 0,
    gap: 0,
    alignment: 'center',
  },
}

// ============================================================================
// Core Algorithm
// ============================================================================

/**
 * Get pattern key based on enabled zones
 */
function getZonePattern(zone1: boolean, zone2: boolean, zone3: boolean): string {
  const key = [
    zone1 ? 'zone1' : '',
    zone2 ? 'zone2' : '',
    zone3 ? 'zone3' : '',
  ].filter(Boolean).join('-')

  if (key === 'zone1-zone2-zone3') return 'all-enabled'
  if (key === '') return 'none'
  if (key === 'zone1') return 'zone1-only'
  if (key === 'zone2') return 'zone2-only'
  if (key === 'zone3') return 'zone3-only'

  return key
}

/**
 * Calculate optimal zone widths based on enabled zones
 * Uses pattern matching + space-evenly distribution
 *
 * @param config - Zone configuration
 * @param containerWidth - Total container width (use 100 for percentages)
 * @returns Zone widths and gap sizes
 */
export function calculateFooterZoneWidths(
  config: FooterZoneConfig,
  containerWidth: number = 100
): ZoneWidthResult {
  const patternKey = getZonePattern(
    config.zone1Enabled,
    config.zone2Enabled,
    config.zone3Enabled
  )

  const pattern = FOOTER_ZONE_PATTERNS[patternKey] || FOOTER_ZONE_PATTERNS['none']

  // Apply pattern percentages to container width
  const zone1Width = (pattern.zone1 * containerWidth) / 100
  const zone2Width = (pattern.zone2 * containerWidth) / 100
  const zone3Width = (pattern.zone3 * containerWidth) / 100

  // Adjust zone 2 width based on content density
  let adjustedZone2Width = zone2Width
  if (config.zone2Enabled && config.zone2ContentCount !== undefined) {
    // Scale zone 2 width based on content count (1-3 items)
    const contentMultiplier = config.zone2ContentCount === 1 ? 0.7 :
      config.zone2ContentCount === 2 ? 0.85 : 1.0
    adjustedZone2Width = zone2Width * contentMultiplier

    // Redistribute saved space to other zones if enabled
    const savedSpace = zone2Width - adjustedZone2Width
    if (savedSpace > 0 && (config.zone1Enabled || config.zone3Enabled)) {
      // Don't redistribute for now, let gap absorb it
    }
  }

  return {
    zone1Width: config.zone1Enabled ? zone1Width : 0,
    zone2Width: config.zone2Enabled ? adjustedZone2Width : 0,
    zone3Width: config.zone3Enabled ? zone3Width : 0,
    gapSize: pattern.gap,
    alignment: pattern.alignment,
    totalUsedWidth: (config.zone1Enabled ? zone1Width : 0) +
      (config.zone2Enabled ? adjustedZone2Width : 0) +
      (config.zone3Enabled ? zone3Width : 0),
  }
}

/**
 * Calculate space-evenly positions for footer zones (CSS justify-content: space-evenly)
 * v17.2: Implements true space-evenly distribution with equal gaps on ALL sides
 *
 * Algorithm: Distributes available space equally between ALL gaps (left edge, between zones, right edge)
 * Example: 1000px container, 3 zones [150px, 300px, 180px] → 4 gaps of 92.5px each
 *
 * @param zones - Array of zone configs with width
 * @param containerWidth - Total available width in pixels
 * @param horizontalPadding - Left/right padding in pixels (unused, kept for API compatibility)
 * @returns Array of zone positions (x, width)
 */
export function calculateSpaceEvenlyPositions(
  zones: Array<{ width: number; enabled: boolean }>,
  containerWidth: number,
  horizontalPadding: number = 40
): ZonePosition[] {
  const enabledZones = zones.filter(z => z.enabled)

  if (enabledZones.length === 0) return []

  // Single zone - center it
  if (enabledZones.length === 1) {
    const zone = enabledZones[0]
    return [{
      x: Math.round((containerWidth - zone.width) / 2),
      width: zone.width,
    }]
  }

  // Multiple zones - true space-evenly distribution (v17.2)
  // Step 1: Calculate total zone width (content only)
  const totalZoneWidth = enabledZones.reduce((sum, z) => sum + z.width, 0)

  // Step 2: Calculate available space for gaps
  const availableSpace = containerWidth - totalZoneWidth

  // Step 3: Number of gaps = numZones + 1 (includes left and right edges)
  const numGaps = enabledZones.length + 1

  // Step 4: Equal gap size for ALL gaps (space-evenly)
  let equalGapSize = availableSpace / numGaps

  // Edge case: Content overflow - use minimum 5px gaps and center
  const MIN_GAP = 5
  if (equalGapSize < MIN_GAP) {
    equalGapSize = MIN_GAP
    // Recalculate startX to center overflowing content
    const totalContentWidth = totalZoneWidth + (enabledZones.length - 1) * MIN_GAP
    const startX = Math.round((containerWidth - totalContentWidth) / 2)

    const positions: ZonePosition[] = []
    let currentX = startX

    for (const zone of enabledZones) {
      positions.push({
        x: Math.round(currentX),
        width: zone.width,
      })
      currentX += zone.width + MIN_GAP
    }

    return positions
  }

  // Step 5: Position zones starting from first gap
  const positions: ZonePosition[] = []
  let currentX = equalGapSize

  for (const zone of enabledZones) {
    positions.push({
      x: Math.round(currentX),
      width: zone.width,
    })
    currentX += zone.width + equalGapSize
  }

  return positions
}

/**
 * Calculate footer zone positions with pixel precision
 * Combines pattern-based widths with space-evenly positioning
 *
 * @param config - Zone configuration
 * @param containerWidth - Total container width in pixels
 * @param horizontalPadding - Left/right padding in pixels
 * @returns Positioned zones with x and width
 */
export function calculateFooterZonePositions(
  config: FooterZoneConfig,
  containerWidth: number,
  horizontalPadding: number = 40
): {
  zone1: ZonePosition | null
  zone2: ZonePosition | null
  zone3: ZonePosition | null
  gapSize: number
} {
  const widths = calculateFooterZoneWidths(config, containerWidth)

  const zones = [
    { width: widths.zone1Width, enabled: config.zone1Enabled },
    { width: widths.zone2Width, enabled: config.zone2Enabled },
    { width: widths.zone3Width, enabled: config.zone3Enabled },
  ]

  const positions = calculateSpaceEvenlyPositions(zones, containerWidth, horizontalPadding)

  // Map positions back to zones
  let posIndex = 0
  const result: {
    zone1: ZonePosition | null
    zone2: ZonePosition | null
    zone3: ZonePosition | null
    gapSize: number
  } = {
    zone1: null,
    zone2: null,
    zone3: null,
    gapSize: widths.gapSize,
  }

  if (config.zone1Enabled && positions[posIndex]) {
    result.zone1 = positions[posIndex]
    posIndex++
  }
  if (config.zone2Enabled && positions[posIndex]) {
    result.zone2 = positions[posIndex]
    posIndex++
  }
  if (config.zone3Enabled && positions[posIndex]) {
    result.zone3 = positions[posIndex]
  }

  return result
}

/**
 * Get recommended footer height based on enabled zones
 * Taller footer when more zones are active
 */
export function getRecommendedFooterHeight(config: FooterZoneConfig): number {
  const enabledCount = [config.zone1Enabled, config.zone2Enabled, config.zone3Enabled]
    .filter(Boolean).length

  switch (enabledCount) {
    case 0: return 60
    case 1: return 70
    case 2: return 80
    case 3: return 90
    default: return 80
  }
}

/**
 * Debug: Get human-readable pattern description
 */
export function getPatternDescription(config: FooterZoneConfig): string {
  const patternKey = getZonePattern(
    config.zone1Enabled,
    config.zone2Enabled,
    config.zone3Enabled
  )

  const descriptions: Record<string, string> = {
    'all-enabled': '3-zone balanced layout (Signature | Center | Partner)',
    'zone1-zone2': '2-zone left-weighted (Signature | Center)',
    'zone2-zone3': '2-zone right-weighted (Center | Partner)',
    'zone1-zone3': '2-zone split (Signature | Partner)',
    'zone1-only': 'Single zone (Signature only)',
    'zone2-only': 'Single zone (Center only)',
    'zone3-only': 'Single zone (Partner only)',
    'none': 'No zones enabled',
  }

  return descriptions[patternKey] || 'Unknown pattern'
}
