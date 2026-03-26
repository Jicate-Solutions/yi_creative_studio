/**
 * Logo Awareness Helpers for AI-Aware Generation
 *
 * These functions convert logo placements from the Zustand store into
 * natural language guidance that the AI can understand, ensuring it
 * creates designs that leave appropriate space for logo overlays.
 */

import type { LogoPlacement } from '@/stores/creative-store'
import { getLogoSizePixels } from '@/lib/constants/logoConstants'
import type { LogoSafeZone, LogoAwarenessContext } from '../types/logo-awareness'
import {
  LOGO_POSITION_DESCRIPTIONS,
  SAFE_ZONE_BUFFER,
  MIN_SAFE_ZONE_SIZE,
  EDGE_PADDING,
} from '../types/logo-awareness'
import type { LogoPosition } from '@/lib/config/constants'

// Re-export types for convenience
export type { LogoSafeZone, LogoAwarenessContext } from '../types/logo-awareness'

/**
 * Convert logo placements from store into safe zone definitions
 * Adds buffer space around each logo for visual breathing room
 */
export function buildLogoSafeZones(placements: LogoPlacement[]): LogoSafeZone[] {
  if (!placements || placements.length === 0) {
    return []
  }

  return placements.map((placement) => {
    // Get base size in pixels
    const baseSize =
      typeof placement.size === 'number'
        ? placement.size
        : getLogoSizePixels(placement.size || 'medium')

    // Add buffer for visual breathing room
    const bufferedSize = Math.ceil(baseSize * (1 + SAFE_ZONE_BUFFER))

    // Ensure minimum safe zone size
    const finalSize = Math.max(bufferedSize, MIN_SAFE_ZONE_SIZE)

    return {
      position: placement.position,
      sizePreset: placement.size || 'medium',
      sizePixels: finalSize,
      description: `${LOGO_POSITION_DESCRIPTIONS[placement.position]} (approximately ${finalSize}px safe zone)`,
    }
  })
}

/**
 * Group safe zones by region (top, middle, bottom)
 */
function groupZonesByRegion(safeZones: LogoSafeZone[]): {
  top: LogoSafeZone[]
  middle: LogoSafeZone[]
  bottom: LogoSafeZone[]
} {
  return {
    top: safeZones.filter((z) => z.position.startsWith('top-')),
    middle: safeZones.filter(
      (z) => z.position.startsWith('mid-')
    ),
    bottom: safeZones.filter((z) => z.position.startsWith('bottom-')),
  }
}

/**
 * Get horizontal position descriptors from logo position
 */
function getHorizontalPositions(zones: LogoSafeZone[]): string {
  const positions: string[] = []

  zones.forEach((zone) => {
    // 18-position grid uses positions like top-1, mid-3, bottom-5
    // Left positions: 1, 2 | Center positions: 3, 4 | Right positions: 5, 6
    const posNum = parseInt(zone.position.split('-')[1] || '0', 10)
    if (posNum === 1 || posNum === 2) positions.push('left')
    if (posNum === 3 || posNum === 4) positions.push('center')
    if (posNum === 5 || posNum === 6) positions.push('right')
  })

  // Remove duplicates and join
  return [...new Set(positions)].join(' and ')
}

/**
 * v38.0: Build comprehensive layout guidance with concrete logo position awareness.
 *
 * IMPORTANT: Uses compositional language (not "logo" keywords) to avoid text rendering leaks.
 * Describes the SPATIAL COMPOSITION needed, not the technical reason.
 *
 * Yi Brand Guidelines 2025 - Two-Strip Layout:
 * - HEADER STRIP (top): Brand overlays (Yi, Bharat Rising, CII)
 * - SECOND STRIP (just below header): Vertical overlays (Yi Learning, etc.)
 * - FOOTER STRIP (bottom): Sponsor/Partner overlays
 */
export function buildLogoLayoutGuidance(safeZones: LogoSafeZone[]): string {
  if (safeZones.length === 0) {
    return ''
  }

  const { top, middle, bottom } = groupZonesByRegion(safeZones)
  const lines: string[] = []

  if (top.length > 0) {
    const topCount = top.length
    const topPositions = getHorizontalPositions(top)
    lines.push(
      `The top edge has ${topCount} small branded overlay elements (${topPositions}). The upper 10% should be clean atmospheric background — smooth sky, ambient light, or soft gradient — with no text or detailed faces at these positions.`
    )
  }

  if (middle.length > 0) {
    const midCount = middle.length
    const midPositions = getHorizontalPositions(middle)
    lines.push(
      `Just below the top strip (10-20% height), ${midCount} smaller overlay elements appear (${midPositions}). Keep these spots as clean background artwork.`
    )
  }

  if (bottom.length > 0) {
    const bottomCount = bottom.length
    const bottomPositions = getHorizontalPositions(bottom)
    lines.push(
      `The bottom 30% has ${bottomCount} footer overlay elements (${bottomPositions}). Keep this area as clean background — ground texture, subtle gradient, or ambient base.`
    )
  }

  // Content zone guidance
  lines.push('ALL text, headlines, event title, date, venue, and speaker info MUST be placed in the CENTER BAND (40% to 65% from top). This is the ONLY safe zone for visible text.')

  return lines.join(' ')
}

/**
 * Build compact summary for logging/debugging
 */
export function buildLogoSummary(placements: LogoPlacement[]): string {
  if (!placements || placements.length === 0) {
    return 'No logos'
  }

  return placements
    .map((p) => `${p.position}(${typeof p.size === 'number' ? p.size + 'px' : p.size || 'medium'})`)
    .join(', ')
}

/**
 * Build complete logo awareness context
 * This is the main entry point for getting logo awareness data
 */
export function buildLogoAwarenessContext(
  placements: LogoPlacement[] | undefined | null
): LogoAwarenessContext {
  const validPlacements = placements || []
  const safeZones = buildLogoSafeZones(validPlacements)

  return {
    activeLogos: safeZones,
    safeZoneDescriptions: safeZones.map((z) => z.description),
    layoutGuidance: buildLogoLayoutGuidance(safeZones),
    hasLogos: safeZones.length > 0,
  }
}

/**
 * Check if a given position has a logo placement
 */
export function hasLogoAtPosition(
  placements: LogoPlacement[] | undefined | null,
  position: LogoPosition
): boolean {
  if (!placements) return false
  return placements.some((p) => p.position === position)
}

/**
 * Get positions that have logos for quick reference
 */
export function getOccupiedPositions(
  placements: LogoPlacement[] | undefined | null
): LogoPosition[] {
  if (!placements) return []
  return placements.map((p) => p.position)
}
