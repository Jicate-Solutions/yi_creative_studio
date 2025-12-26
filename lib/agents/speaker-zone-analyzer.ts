/**
 * Speaker Zone Analyzer
 * YiCreatives Studio
 *
 * Translates speaker photo pixel positions to logo grid coordinates.
 * This enables the logo positioning AI agent to avoid placing logos
 * in zones occupied by speaker photos, preventing visual overlaps.
 *
 * Architecture:
 * 1. Receives speaker photo configuration with pixel coordinates
 * 2. Calculates speaker bounding boxes using Sharp positioning logic
 * 3. Maps pixel positions to 6×3 logo grid zones (top-1 to bottom-6)
 * 4. Returns occupied grid positions for AI agent consumption
 */

import type { SpeakerPhotoCustomization } from '@/types/design.types'
import type { LogoPosition } from '@/lib/config/constants'
import type { LayoutStrategy } from '@/lib/sharp/speaker-overlay'
import { getSpeakerCount } from '@/lib/utils/speaker-migration'
import { calculateMultiSpeakerPositions } from '@/lib/sharp/speaker-overlay'
import { autoDetectSpeakerLayout } from '@/lib/sharp/speaker-overlay'

// ============================================================================
// Types
// ============================================================================

export interface SpeakerZoneInput {
  speakerPhoto: SpeakerPhotoCustomization
  formatDimensions: { width: number; height: number }
}

export interface SpeakerZoneOccupancy {
  /** Grid positions occupied by speaker photos (e.g., ['mid-1', 'mid-5', 'mid-6']) */
  occupiedGridPositions: LogoPosition[]
  /** Layout strategy used for speakers */
  layout: LayoutStrategy
  /** Number of speakers */
  speakerCount: number
  /** AI-friendly description of speaker zones */
  description: string
}

interface PixelBoundingBox {
  x: number
  y: number
  width: number
  height: number
}

// ============================================================================
// Main Function
// ============================================================================

/**
 * Analyzes speaker photo positions and maps them to logo grid zones.
 *
 * @param input - Speaker photo configuration and format dimensions
 * @returns Speaker zone occupancy data, or null if speakers are disabled
 *
 * @example
 * ```typescript
 * const zones = analyzeSpeakerZones({
 *   speakerPhoto: {
 *     enabled: true,
 *     speakers: [
 *       { id: '1', name: 'John', photoUrl: 'data:...' },
 *       { id: '2', name: 'Jane', photoUrl: 'data:...' }
 *     ],
 *     layoutMode: 'auto',
 *     size: 200
 *   },
 *   formatDimensions: { width: 1080, height: 1350 }
 * })
 * // Returns: {
 * //   occupiedGridPositions: ['mid-1', 'mid-5', 'mid-6'],
 * //   layout: 'side-by-side',
 * //   speakerCount: 2,
 * //   description: '2 speakers in horizontal layout occupy: mid-1, mid-5, mid-6'
 * // }
 * ```
 */
export function analyzeSpeakerZones(
  input: SpeakerZoneInput
): SpeakerZoneOccupancy | null {
  // Guard: Return null if speakers disabled
  if (!input.speakerPhoto?.enabled) {
    return null
  }

  // Detect speaker count (handles both multi and legacy formats)
  const speakerCount = getSpeakerCount(input.speakerPhoto)
  if (speakerCount === 0) {
    return null
  }

  // Determine layout strategy (auto or manual)
  const layout = input.speakerPhoto.layoutMode === 'auto'
    ? autoDetectSpeakerLayout(speakerCount)
    : (input.speakerPhoto.layoutStrategy || 'side-by-side')

  // Calculate pixel positions using existing Sharp logic
  const positions = calculateMultiSpeakerPositions({
    speakerCount,
    layout,
    imageWidth: input.formatDimensions.width,
    imageHeight: input.formatDimensions.height,
    photoSize: input.speakerPhoto.size || 200,
    spacing: input.speakerPhoto.spacing || 20,
  })

  // Map each speaker position to grid zones
  const occupiedGridPositions: Set<LogoPosition> = new Set()

  for (const pos of positions) {
    const bbox: PixelBoundingBox = {
      x: pos.x,
      y: pos.y,
      width: input.speakerPhoto.size || 200,
      height: input.speakerPhoto.size || 200,
    }

    const gridZones = mapPixelPositionToGridZones(
      bbox,
      input.formatDimensions.width,
      input.formatDimensions.height
    )

    gridZones.forEach(zone => occupiedGridPositions.add(zone))
  }

  // Generate AI-friendly description
  const description = generateSpeakerZoneDescription(
    speakerCount,
    layout,
    Array.from(occupiedGridPositions)
  )

  return {
    occupiedGridPositions: Array.from(occupiedGridPositions),
    layout,
    speakerCount,
    description,
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Maps a pixel bounding box to logo grid positions.
 *
 * The logo grid is 6 columns × 3 rows:
 * - Columns: 1-6 (left to right)
 * - Rows: top, mid, bottom
 * - Positions: top-1, top-2, ..., mid-1, mid-2, ..., bottom-1, bottom-2, ...
 *
 * @param bbox - Pixel bounding box of speaker photo
 * @param imageWidth - Total image width in pixels
 * @param imageHeight - Total image height in pixels
 * @returns Array of occupied logo grid positions
 *
 * @example
 * ```typescript
 * // Speaker photo at x=90, y=600, size=200 in 1080×1350 image
 * const zones = mapPixelPositionToGridZones(
 *   { x: 90, y: 600, width: 200, height: 200 },
 *   1080,
 *   1350
 * )
 * // Returns: ['mid-1']
 * ```
 */
function mapPixelPositionToGridZones(
  bbox: PixelBoundingBox,
  imageWidth: number,
  imageHeight: number
): LogoPosition[] {
  const occupiedZones: LogoPosition[] = []

  // Grid dimensions
  const columnWidth = imageWidth / 6
  const rowHeight = imageHeight / 3

  // Determine row (top, mid, bottom) based on vertical center
  const centerY = bbox.y + bbox.height / 2
  const row = centerY < rowHeight ? 'top'
             : centerY < rowHeight * 2 ? 'mid'
             : 'bottom'

  // Determine columns (1-6) that overlap with bbox
  const startCol = Math.floor(bbox.x / columnWidth) + 1
  const endCol = Math.floor((bbox.x + bbox.width) / columnWidth) + 1

  // Generate position strings
  for (let col = Math.max(1, startCol); col <= Math.min(6, endCol); col++) {
    occupiedZones.push(`${row}-${col}` as LogoPosition)
  }

  return occupiedZones
}

/**
 * Generates a human-readable description of speaker zones for AI consumption.
 *
 * @param speakerCount - Number of speakers
 * @param layout - Layout strategy used
 * @param occupiedPositions - Grid positions occupied by speakers
 * @returns AI-friendly description string
 *
 * @example
 * ```typescript
 * const desc = generateSpeakerZoneDescription(
 *   2,
 *   'side-by-side',
 *   ['mid-1', 'mid-5', 'mid-6']
 * )
 * // Returns: "2 speakers in horizontal layout occupy: mid-1, mid-5, mid-6"
 * ```
 */
function generateSpeakerZoneDescription(
  speakerCount: number,
  layout: LayoutStrategy,
  occupiedPositions: LogoPosition[]
): string {
  const positionsStr = occupiedPositions.join(', ')

  if (speakerCount === 1) {
    return `One speaker photo occupies grid position(s): ${positionsStr}`
  }

  if (layout === 'side-by-side') {
    return `${speakerCount} speakers in horizontal layout occupy: ${positionsStr}`
  }

  if (layout === 'grid') {
    const rows = Math.ceil(speakerCount / 2)
    return `${speakerCount} speakers in ${rows}×2 grid occupy corners/zones: ${positionsStr}`
  }

  if (layout === 'stacked') {
    return `${speakerCount} speakers in vertical stack occupy: ${positionsStr}`
  }

  // Fallback for any other layout
  return `${speakerCount} speakers occupy grid positions: ${positionsStr}`
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Checks if a specific logo position is occupied by speaker photos.
 *
 * @param position - Logo position to check
 * @param speakerZones - Speaker zone occupancy data (or null if no speakers)
 * @returns True if position is occupied by a speaker photo
 *
 * @example
 * ```typescript
 * const zones = analyzeSpeakerZones(...)
 * const isOccupied = isPositionOccupiedBySpeaker('mid-1', zones)
 * // Returns: true if mid-1 is in zones.occupiedGridPositions
 * ```
 */
export function isPositionOccupiedBySpeaker(
  position: LogoPosition,
  speakerZones: SpeakerZoneOccupancy | null
): boolean {
  if (!speakerZones) return false
  return speakerZones.occupiedGridPositions.includes(position)
}

/**
 * Gets all available (non-occupied) logo positions for a given format.
 *
 * @param allPositions - All 18 logo grid positions
 * @param speakerZones - Speaker zone occupancy data (or null if no speakers)
 * @returns Array of available positions
 *
 * @example
 * ```typescript
 * const zones = analyzeSpeakerZones(...)
 * const available = getAvailablePositions(ALL_LOGO_POSITIONS, zones)
 * // Returns: All positions except those occupied by speakers
 * ```
 */
export function getAvailablePositions(
  allPositions: LogoPosition[],
  speakerZones: SpeakerZoneOccupancy | null
): LogoPosition[] {
  if (!speakerZones) return allPositions

  return allPositions.filter(
    position => !speakerZones.occupiedGridPositions.includes(position)
  )
}
