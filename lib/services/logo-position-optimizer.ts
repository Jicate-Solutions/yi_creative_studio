/**
 * Logo Position Optimizer Service
 * Intelligently distributes logos across the 6-column × 3-row grid for visual balance
 *
 * Yi Brand Guidelines 2025:
 * - Brand logos (Yi, CII, Bharat Rising) are AUTO-LOCKED
 * - Other logos should be distributed evenly within their strip
 * - Visual balance prevents clustering and blank spaces
 */

import type { LogoPosition } from '@/lib/config/constants'
import type { LogoSizePreset, LogoBackgroundShape, LogoBackgroundStyle } from '@/lib/constants/logoConstants'
import {
  detectLogoType,
  getLogoStrip,
  isLogoAutoLocked,
  getAutoLockedPosition,
  type LogoType,
  type LogoStrip,
  STRIP_POSITIONS,
} from '@/lib/config/logo-locks'

// ============================================================================
// Types
// ============================================================================

export interface LogoInput {
  id: string
  name: string
  type?: LogoType
  category?: string
}

export interface OptimizedPlacement {
  logoId: string
  position: LogoPosition
  size?: LogoSizePreset
  backgroundShape?: LogoBackgroundShape
  backgroundStyle?: LogoBackgroundStyle
}

export interface OptimizationInput {
  logos: LogoInput[]
  currentPlacements?: Array<{
    logoId: string
    position: LogoPosition
    size?: LogoSizePreset
    backgroundShape?: LogoBackgroundShape
    backgroundStyle?: LogoBackgroundStyle
  }>
}

export interface OptimizationResult {
  placements: OptimizedPlacement[]
  reasoning: {
    strategy: 'even' | 'weighted' | 'locked_only'
    changes: string[]
    stripBreakdown: {
      header: number
      second: number
      footer: number
    }
  }
}

// ============================================================================
// Distribution Maps
// ============================================================================

/**
 * Balanced distribution patterns for N logos in a 6-column strip
 *
 * Visual reference:
 * 1 logo:   [  ][  ][  ][✓][  ][  ]  → center
 * 2 logos:  [✓][  ][  ][  ][  ][✓]  → edges
 * 3 logos:  [✓][  ][✓][  ][  ][✓]  → left, center-left, right
 * 4 logos:  [✓][✓][  ][  ][✓][✓]  → weighted edges
 * 5 logos:  [✓][✓][✓][  ][✓][✓]  → near-full
 * 6 logos:  [✓][✓][✓][✓][✓][✓]  → all
 */
const DISTRIBUTION_PATTERNS: Record<number, number[]> = {
  1: [3],                    // Center (0-indexed column 3 = position 4)
  2: [0, 5],                 // Edges
  3: [0, 2, 5],              // Left, center-left, right
  4: [0, 2, 3, 5],           // Evenly spread (uses center slots 3&4)
  5: [0, 1, 2, 4, 5],        // Skip one near center
  6: [0, 1, 2, 3, 4, 5],     // All positions
}

/**
 * Recommended sizes based on logo count in a strip
 * More logos = smaller sizes to prevent crowding
 */
const SIZE_BY_COUNT: Record<number, LogoSizePreset> = {
  1: 'large',
  2: 'large',
  3: 'medium',
  4: 'medium',
  5: 'small',
  6: 'small',
}

// ============================================================================
// Core Algorithm
// ============================================================================

/**
 * Get column indices for balanced distribution
 */
function getBalancedColumnIndices(count: number): number[] {
  if (count <= 0) return []
  if (count >= 6) return [0, 1, 2, 3, 4, 5]
  return DISTRIBUTION_PATTERNS[count] || DISTRIBUTION_PATTERNS[6]
}

/**
 * Convert column index to position string
 */
function columnToPosition(column: number, strip: LogoStrip): LogoPosition {
  const positionNumber = column + 1 // 0-indexed to 1-indexed
  const stripPrefix = strip === 'header' ? 'top' : strip === 'second' ? 'mid' : 'bottom'
  return `${stripPrefix}-${positionNumber}` as LogoPosition
}

/**
 * Group logos by their strip (header, second, footer)
 *
 * CRITICAL FIX: Respects user's current placement position when determining strip.
 * Previously, this only used name-based detection which caused logos placed
 * in footer by user to be moved to 'second' strip if the name didn't match patterns.
 *
 * Logic:
 * 1. If user has placed the logo (currentPlacements provided), use THAT position's strip
 * 2. Otherwise, fall back to name-based detection for new logos
 */
function groupLogosByStrip(
  logos: LogoInput[],
  currentPlacements?: Array<{ logoId: string; position: LogoPosition }>
): Record<LogoStrip, LogoInput[]> {
  const groups: Record<LogoStrip, LogoInput[]> = {
    header: [],
    second: [],
    footer: [],
  }

  for (const logo of logos) {
    let strip: LogoStrip

    // First check if user has manually placed this logo (respect their choice)
    const currentPlacement = currentPlacements?.find(p => p.logoId === logo.id)

    if (currentPlacement) {
      // Extract strip from user's current position
      const pos = currentPlacement.position
      if (pos.startsWith('top')) {
        strip = 'header'
      } else if (pos.startsWith('mid')) {
        strip = 'second'
      } else {
        strip = 'footer'
      }
    } else {
      // Fallback to name-based detection for new logos
      strip = getLogoStrip(logo.name)
    }

    groups[strip].push(logo)
  }

  return groups
}

/**
 * Separate locked logos from optimizable logos
 */
function separateLockedLogos(logos: LogoInput[]): {
  locked: Array<{ logo: LogoInput; position: LogoPosition }>
  optimizable: LogoInput[]
} {
  const locked: Array<{ logo: LogoInput; position: LogoPosition }> = []
  const optimizable: LogoInput[] = []

  for (const logo of logos) {
    const lockedPosition = getAutoLockedPosition(logo.name)
    if (lockedPosition) {
      locked.push({ logo, position: lockedPosition })
    } else {
      optimizable.push(logo)
    }
  }

  return { locked, optimizable }
}

/**
 * Optimize positions within a single strip
 */
function optimizeStrip(
  logos: LogoInput[],
  strip: LogoStrip,
  lockedColumns: number[]
): OptimizedPlacement[] {
  if (logos.length === 0) return []

  const { locked, optimizable } = separateLockedLogos(logos)
  const placements: OptimizedPlacement[] = []

  // Add locked logos first
  for (const { logo, position } of locked) {
    const column = parseInt(position.split('-')[1]) - 1
    lockedColumns.push(column)
    placements.push({
      logoId: logo.id,
      position,
      size: SIZE_BY_COUNT[logos.length] || 'medium',
    })
  }

  if (optimizable.length === 0) {
    return placements
  }

  // Get available columns (exclude locked)
  const availableColumns = [0, 1, 2, 3, 4, 5].filter(col => !lockedColumns.includes(col))

  // Get balanced positions for optimizable logos
  const distributionPattern = getBalancedColumnIndices(optimizable.length)

  // Map pattern to available columns
  const selectedColumns: number[] = []
  for (const patternCol of distributionPattern) {
    // Find the closest available column to the ideal pattern position
    const idealPosition = (patternCol / 5) * (availableColumns.length - 1)
    const closestIndex = Math.round(idealPosition)
    const column = availableColumns[Math.min(closestIndex, availableColumns.length - 1)]

    if (column !== undefined && !selectedColumns.includes(column)) {
      selectedColumns.push(column)
    }
  }

  // If we couldn't map all logos, fill remaining with available columns
  while (selectedColumns.length < optimizable.length && selectedColumns.length < availableColumns.length) {
    for (const col of availableColumns) {
      if (!selectedColumns.includes(col)) {
        selectedColumns.push(col)
        break
      }
    }
  }

  // Sort columns for consistent left-to-right order
  selectedColumns.sort((a, b) => a - b)

  // Assign positions to optimizable logos
  const suggestedSize = SIZE_BY_COUNT[logos.length] || 'medium'

  for (let i = 0; i < optimizable.length; i++) {
    const logo = optimizable[i]
    const column = selectedColumns[i]

    if (column !== undefined) {
      placements.push({
        logoId: logo.id,
        position: columnToPosition(column, strip),
        size: suggestedSize,
      })
    }
  }

  return placements
}

// ============================================================================
// Main Export Functions
// ============================================================================

/**
 * Calculate optimal logo positions using algorithmic distribution
 *
 * Strategy:
 * 1. Group logos by strip (header/second/footer)
 * 2. For each strip, separate locked from optimizable logos
 * 3. Distribute optimizable logos evenly in remaining slots
 * 4. Suggest appropriate sizes based on logo count
 */
export function calculateOptimalPositions(input: OptimizationInput): OptimizationResult {
  const { logos, currentPlacements } = input

  if (logos.length === 0) {
    return {
      placements: [],
      reasoning: {
        strategy: 'even',
        changes: ['No logos to optimize'],
        stripBreakdown: { header: 0, second: 0, footer: 0 },
      },
    }
  }

  // Group logos by their strip - PASS currentPlacements to respect user's positions
  const logosByStrip = groupLogosByStrip(logos, currentPlacements)
  const allPlacements: OptimizedPlacement[] = []
  const changes: string[] = []

  // Track locked columns per strip
  const lockedColumnsByStrip: Record<LogoStrip, number[]> = {
    header: [],
    second: [],
    footer: [],
  }

  // Process each strip
  for (const strip of ['header', 'second', 'footer'] as LogoStrip[]) {
    const stripLogos = logosByStrip[strip]
    if (stripLogos.length > 0) {
      const stripPlacements = optimizeStrip(stripLogos, strip, lockedColumnsByStrip[strip])
      allPlacements.push(...stripPlacements)

      const lockedCount = stripPlacements.filter(p =>
        stripLogos.some(l => l.id === p.logoId && isLogoAutoLocked(l.name))
      ).length
      const optimizedCount = stripPlacements.length - lockedCount

      if (optimizedCount > 0) {
        changes.push(`${strip}: distributed ${optimizedCount} logo${optimizedCount > 1 ? 's' : ''} evenly`)
      }
      if (lockedCount > 0) {
        changes.push(`${strip}: ${lockedCount} brand logo${lockedCount > 1 ? 's' : ''} auto-locked`)
      }
    }
  }

  // Preserve existing settings (background shape/style) from current placements
  if (currentPlacements) {
    for (const placement of allPlacements) {
      const existing = currentPlacements.find(p => p.logoId === placement.logoId)
      if (existing) {
        placement.backgroundShape = existing.backgroundShape
        placement.backgroundStyle = existing.backgroundStyle
      }
    }
  }

  // Determine strategy
  const hasOptimizableLogos = logos.some(l => !isLogoAutoLocked(l.name))
  const strategy = hasOptimizableLogos ? 'even' : 'locked_only'

  return {
    placements: allPlacements,
    reasoning: {
      strategy,
      changes: changes.length > 0 ? changes : ['Positions optimized for visual balance'],
      stripBreakdown: {
        header: logosByStrip.header.length,
        second: logosByStrip.second.length,
        footer: logosByStrip.footer.length,
      },
    },
  }
}

/**
 * Quick check if optimization would make any changes
 */
export function wouldOptimizationChange(input: OptimizationInput): boolean {
  const { logos, currentPlacements } = input

  if (!currentPlacements || currentPlacements.length === 0) {
    return true
  }

  // Check if any non-locked logo could have a better position
  const optimized = calculateOptimalPositions(input)

  for (const newPlacement of optimized.placements) {
    const current = currentPlacements.find(p => p.logoId === newPlacement.logoId)
    if (!current || current.position !== newPlacement.position) {
      return true
    }
  }

  return false
}

/**
 * Get a human-readable summary of the optimization
 */
export function getOptimizationSummary(result: OptimizationResult): string {
  const { reasoning, placements } = result

  if (placements.length === 0) {
    return 'No logos to optimize'
  }

  const parts: string[] = []

  if (reasoning.stripBreakdown.header > 0) {
    parts.push(`${reasoning.stripBreakdown.header} in header`)
  }
  if (reasoning.stripBreakdown.second > 0) {
    parts.push(`${reasoning.stripBreakdown.second} in middle`)
  }
  if (reasoning.stripBreakdown.footer > 0) {
    parts.push(`${reasoning.stripBreakdown.footer} in footer`)
  }

  return `Optimized ${placements.length} logos (${parts.join(', ')}) for visual balance`
}
