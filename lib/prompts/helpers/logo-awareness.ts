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
      (z) => z.position.startsWith('mid-') || z.position === 'center'
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
    if (zone.position.endsWith('-left')) positions.push('left')
    if (zone.position.endsWith('-center') || zone.position === 'center') positions.push('center')
    if (zone.position.endsWith('-right')) positions.push('right')
  })

  // Remove duplicates and join
  return [...new Set(positions)].join(' and ')
}

/**
 * Build comprehensive layout guidance string for AI prompt
 * This is the main text that tells the AI where NOT to place content
 *
 * IMPORTANT: Avoid using technical keywords, pixel values, or instruction-like
 * text that AI image models might render as actual text in the design.
 * Use natural, descriptive language about spatial composition instead.
 */
export function buildLogoLayoutGuidance(safeZones: LogoSafeZone[]): string {
  if (safeZones.length === 0) {
    return ''
  }

  const { top, middle, bottom } = groupZonesByRegion(safeZones)
  const lines: string[] = []

  // Use natural composition language, not technical instructions
  lines.push('Reserve clear space for branding elements:')

  // Top region guidance - semantic description only
  if (top.length > 0) {
    const horizontalPos = getHorizontalPositions(top)
    lines.push(
      `Use simple, uncluttered background in the upper ${horizontalPos} area.`
    )
  }

  // Bottom region guidance - semantic description only
  if (bottom.length > 0) {
    const horizontalPos = getHorizontalPositions(bottom)
    lines.push(
      `Keep the lower ${horizontalPos} area clean with minimal elements.`
    )
  }

  // Middle region guidance - semantic description only
  if (middle.length > 0) {
    const hasCenter = middle.some((z) => z.position === 'center')
    if (hasCenter) {
      lines.push(
        `Design with breathing room at the center for branding.`
      )
    } else {
      const horizontalPos = getHorizontalPositions(middle)
      lines.push(
        `Maintain clear space on the ${horizontalPos} side at mid-height.`
      )
    }
  }

  // General composition guidance - natural language
  lines.push('Position main content and headlines away from these reserved areas.')
  lines.push('Use solid or gradient backgrounds in branding spaces for best visibility.')

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
