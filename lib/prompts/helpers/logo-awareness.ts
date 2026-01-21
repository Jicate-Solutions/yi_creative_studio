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
 * Build comprehensive layout guidance string for AI prompt
 * This is the main text that tells the AI where NOT to place content
 *
 * IMPORTANT: Avoid using technical keywords, pixel values, or instruction-like
 * text that AI image models might render as actual text in the design.
 * Use natural, descriptive language about spatial composition instead.
 *
 * Yi Brand Guidelines 2025 - Two-Strip Layout:
 * - HEADER STRIP (top): Brand logos (Yi, Bharat Rising, CII)
 * - SECOND STRIP (just below header): Vertical logos (Yi Learning, etc.)
 * - FOOTER STRIP (bottom): Sponsor/Partner logos
 *
 * The "middle" positions (mid-left, center, mid-right) are rendered
 * JUST BELOW the header strip, not at the vertical center of the image.
 */
export function buildLogoLayoutGuidance(safeZones: LogoSafeZone[]): string {
  if (safeZones.length === 0) {
    return ''
  }

  const { top, middle, bottom } = groupZonesByRegion(safeZones)
  const lines: string[] = []

  // v24.3: Use ONLY neutral spatial language - describe WHAT to show, not what to avoid
  // Gemini renders any "DO NOT" or "forbidden" language as visible labels

  if (top.length > 0 || middle.length > 0) {
    // Top area - describe positively what should be there
    lines.push(
      `The upper portion shows open sky, clouds, or soft ambient lighting.`
    )
  }

  if (bottom.length > 0) {
    // Bottom area - describe positively what should be there
    lines.push(
      `The lower portion shows ground, floor, or subtle gradient fading out.`
    )
  }

  // General composition guidance - focus on CENTER for content
  lines.push('Place the event title and all text content in the CENTER portion of the image (between 38% and 80% from top).')

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
