/**
 * Logo Position Locking Configuration
 * Yi Brand Guidelines 2025 - Logo Hierarchy System
 *
 * Layout: TWO-STRIP SYSTEM (per brand guidelines pages 15-16)
 *
 * HEADER STRIP (Brand Logos - Fixed & Auto-Locked):
 * - LEFT: Yi Logo (Young Indians) - MANDATORY
 * - CENTER: Bharat Rising (2025 theme) - MANDATORY
 * - RIGHT: CII Logo - MANDATORY
 *
 * SECOND STRIP (Vertical Logos - Flexible):
 * - Yi Learning, Yi Innovation, Yi Yuva, etc.
 * - Positioned JUST BELOW the header strip (like subtitle)
 * - Default: below Yi logo (left position)
 *
 * FOOTER (Sponsors/Partners):
 * - Bottom section for sponsor/partner logos
 *
 * Maximum 9 logos per creative (3 per strip × 3 strips)
 */

import type { LogoPosition } from './constants'

// Logo Types based on Yi Brand Guidelines 2025
export type LogoType = 'brand' | 'vertical' | 'sponsor' | 'partner' | 'other'

// Logo strip/row for the two-strip layout system
export type LogoStrip = 'header' | 'second' | 'footer'

export interface LogoTypeConfig {
  type: LogoType
  patterns: RegExp[]
  defaultPosition: LogoPosition | null
  displayName: string
  description: string
  strip: LogoStrip           // Which strip this logo type belongs to
  isAutoLocked: boolean      // Brand logos are auto-locked, others are not
}

/**
 * Logo type configurations with pattern matching
 * Order matters - more specific patterns should come first
 *
 * Yi Brand Guidelines 2025:
 * - Brand logos (Yi, Bharat Rising, CII) are AUTO-LOCKED to header strip
 * - Vertical logos go to second strip (below header)
 * - Sponsor/Partner logos go to footer
 */
export const LOGO_TYPE_CONFIGS: Record<string, LogoTypeConfig> = {
  // BRAND LOGOS - Header Strip (mandatory fixed positions - AUTO-LOCKED)
  // Updated for 6-column grid: top-1 (left), top-3/top-4 (center), top-6 (right)
  // Note: \s* added at start/end of patterns to handle trailing/leading whitespace in logo names
  'yi-main': {
    type: 'brand',
    patterns: [
      /^\s*yi\s*$/i,              // Exact match "Yi" (with whitespace tolerance)
      /^\s*yi\s*logo\s*$/i,       // "Yi Logo" or "YiLogo"
      /^\s*young\s*indians\s*$/i, // "Young Indians" (main org)
    ],
    defaultPosition: 'top-1',     // Left edge in 6-column grid
    displayName: 'Yi Logo',
    description: 'Main Yi brand logo - always top-left per brand guidelines',
    strip: 'header',
    isAutoLocked: true,           // Brand logos are auto-locked
  },
  'bharat-rising': {
    type: 'brand',
    patterns: [
      /^\s*bharat\s*rising\s*$/i,
      /^\s*bharatrising\s*$/i,
      /^\s*bharat\s*one\s*$/i,     // "Bharat ONE" theme variant
      /^\s*bharatone\s*$/i,
      /^\s*one\s*$/i,              // Short form "ONE"
    ],
    defaultPosition: 'top-2',     // Second from left in 6-column grid (Yi → Bharat → ... → CII)
    displayName: 'Bharat Rising',
    description: '2025 theme logo - second position per brand guidelines',
    strip: 'header',
    isAutoLocked: true,           // Brand logos are auto-locked
  },
  'cii-main': {
    type: 'brand',
    patterns: [
      /^\s*cii\s*$/i,             // Exact match "CII" (with whitespace tolerance)
      /^\s*cii\s*logo\s*$/i,      // "CII Logo"
      /confederation.*india/i,    // "Confederation of Indian Industry"
    ],
    defaultPosition: 'top-6',     // Right edge in 6-column grid
    displayName: 'CII Logo',
    description: 'CII brand logo - always top-right per brand guidelines',
    strip: 'header',
    isAutoLocked: true,           // Brand logos are auto-locked
  },

  // VERTICAL LOGOS - Second Strip (below header, flexible positions)
  // Updated for 6-column grid
  'yi-vertical': {
    type: 'vertical',
    patterns: [
      /yi\s+learning/i,           // "Yi Learning"
      /yi\s+innovation/i,         // "Yi Innovation"
      /yi\s+yuva/i,               // "Yi Yuva"
      /yi\s+net/i,                // "Yi Net"
      /yi\s+aspire/i,             // "Yi Aspire"
      /yi\s+entrepreneurship/i,   // "Yi Entrepreneurship"
      /yi\s+health/i,             // "Yi Health"
      /yi\s+accessibility/i,      // "Yi Accessibility"
      /yi\s+road\s*safety/i,      // "Yi Road Safety"
      /yi[-_]?erode/i,            // "Yi Erode", "Yi-Erode" (chapter)
      /yi[-_]?chapter/i,          // "Yi Chapter"
      /climate\s*change/i,        // Climate Change logo (program)
      /masoom/i,                  // MASOOM - Keeping Children Safe
      /thalir/i,                  // Thalir - school students program
      /yuva/i,                    // Yuva - college students program
      /rural\s*initiatives/i,    // Rural Initiatives
      /leadership\s*academy/i,   // Leadership Academy
    ],
    defaultPosition: 'mid-1',     // Left edge of second strip (below Yi logo)
    displayName: 'Yi Vertical',
    description: 'Yi vertical program logo - second strip below header',
    strip: 'second',
    isAutoLocked: false,          // Users can adjust position within strip
  },

  // SPONSOR LOGOS - Footer Strip
  // Updated for 6-column grid
  'sponsor': {
    type: 'sponsor',
    patterns: [
      /sponsor/i,
      /powered\s*by/i,
      /presenting\s*partner/i,
      /title\s*sponsor/i,
    ],
    defaultPosition: 'bottom-3',  // Center-left of footer strip
    displayName: 'Sponsor',
    description: 'Sponsor logo - footer section',
    strip: 'footer',
    isAutoLocked: false,
  },

  // PARTNER LOGOS - Footer Strip
  // Updated for 6-column grid
  'partner': {
    type: 'partner',
    patterns: [
      /partner/i,
      /associate/i,
      /supporter/i,
      /collaborat/i,              // collaboration, collaborator
    ],
    defaultPosition: 'bottom-1',  // Left edge of footer strip
    displayName: 'Partner',
    description: 'Partner logo - footer section',
    strip: 'footer',
    isAutoLocked: false,
  },
}

/**
 * Positions available for each strip in the 6-column layout
 * Yi Brand Guidelines 2025: Header strip + Second strip for verticals + Footer strip
 * Updated to 6 columns per row (18 total positions)
 */
export const STRIP_POSITIONS: Record<LogoStrip, LogoPosition[]> = {
  header: ['top-1', 'top-2', 'top-3', 'top-4', 'top-5', 'top-6'],
  second: ['mid-1', 'mid-2', 'mid-3', 'mid-4', 'mid-5', 'mid-6'],
  footer: ['bottom-1', 'bottom-2', 'bottom-3', 'bottom-4', 'bottom-5', 'bottom-6'],
}

/**
 * Recommended positions by logo type (maps to strip positions)
 */
export const LOGO_TYPE_ROWS: Record<LogoType, LogoPosition[]> = {
  brand: STRIP_POSITIONS.header,
  vertical: STRIP_POSITIONS.second,
  sponsor: STRIP_POSITIONS.footer,
  partner: STRIP_POSITIONS.footer,
  other: STRIP_POSITIONS.second,  // Unrecognized logos go to second strip
}

/**
 * Detect logo type from name
 *
 * @param logoName - Name of the logo to check
 * @returns The detected logo type
 */
export function detectLogoType(logoName: string): LogoType {
  if (!logoName) return 'other'

  for (const config of Object.values(LOGO_TYPE_CONFIGS)) {
    if (config.patterns.some(pattern => pattern.test(logoName))) {
      return config.type
    }
  }
  return 'other'
}

/**
 * Get suggested default position for a logo based on its type
 *
 * @param logoName - Name of the logo
 * @param usedPositions - Positions already taken
 * @returns Best available position for this logo type
 */
export function getSuggestedPosition(
  logoName: string,
  usedPositions: LogoPosition[]
): LogoPosition {
  if (!logoName) {
    const midRow = LOGO_TYPE_ROWS.other
    return midRow.find(p => !usedPositions.includes(p)) || 'mid-3'
  }

  for (const config of Object.values(LOGO_TYPE_CONFIGS)) {
    if (config.patterns.some(pattern => pattern.test(logoName))) {
      // If has fixed default position and it's available, use it
      if (config.defaultPosition && !usedPositions.includes(config.defaultPosition)) {
        return config.defaultPosition
      }
      // Otherwise find first available in this type's row
      const row = LOGO_TYPE_ROWS[config.type]
      const available = row.find(p => !usedPositions.includes(p))
      if (available) return available
    }
  }

  // Fallback: first available position in any row (6-column grid)
  const allPositions: LogoPosition[] = [
    'top-1', 'top-2', 'top-3', 'top-4', 'top-5', 'top-6',
    'mid-1', 'mid-2', 'mid-3', 'mid-4', 'mid-5', 'mid-6',
    'bottom-1', 'bottom-2', 'bottom-3', 'bottom-4', 'bottom-5', 'bottom-6',
  ]
  return allPositions.find(p => !usedPositions.includes(p)) || 'mid-3'
}

/**
 * Check if position is brand-compliant for a logo
 *
 * @param logoName - Name of the logo
 * @param position - Current position
 * @returns true if position follows brand guidelines
 */
export function isPositionCompliant(logoName: string, position: LogoPosition): boolean {
  if (!logoName) return true

  for (const config of Object.values(LOGO_TYPE_CONFIGS)) {
    if (config.patterns.some(pattern => pattern.test(logoName))) {
      // Brand logos must be in their exact position
      if (config.defaultPosition) {
        return position === config.defaultPosition
      }
      // Other logos should be in their type's row
      return LOGO_TYPE_ROWS[config.type].includes(position)
    }
  }
  return true // Uncategorized logos are always compliant
}

/**
 * Get compliance warning for a logo placement
 *
 * @param logoName - Name of the logo
 * @param position - Current position
 * @returns Warning message or null if compliant
 */
export function getComplianceWarning(logoName: string, position: LogoPosition): string | null {
  if (!logoName) return null

  for (const config of Object.values(LOGO_TYPE_CONFIGS)) {
    if (config.patterns.some(pattern => pattern.test(logoName))) {
      // Brand logos have strict position requirements
      if (config.defaultPosition && position !== config.defaultPosition) {
        return `${config.displayName} should be in ${config.defaultPosition} per brand guidelines`
      }
      // Other logos should be in appropriate row
      if (!LOGO_TYPE_ROWS[config.type].includes(position)) {
        const rowName = config.type === 'vertical' ? 'middle' : config.type === 'sponsor' ? 'bottom' : config.type
        return `${config.displayName} typically goes in ${rowName} row`
      }
    }
  }
  return null
}

/**
 * Get the type config for a logo
 *
 * @param logoName - Name of the logo to check
 * @returns Type configuration or null if not matched
 */
export function getLogoTypeConfig(logoName: string): LogoTypeConfig | null {
  if (!logoName) return null

  for (const config of Object.values(LOGO_TYPE_CONFIGS)) {
    if (config.patterns.some(pattern => pattern.test(logoName))) {
      return config
    }
  }
  return null
}

/**
 * Check if a logo should be auto-locked to its position
 * Brand logos (Yi, Bharat Rising, CII) are auto-locked per Yi Brand Guidelines 2025
 *
 * @param logoName - Name of the logo to check
 * @returns true if logo should be auto-locked
 */
export function isLogoAutoLocked(logoName: string): boolean {
  if (!logoName) return false

  const config = getLogoTypeConfig(logoName)
  return config?.isAutoLocked ?? false
}

/**
 * Get the strip for a logo based on its type
 *
 * @param logoName - Name of the logo
 * @returns The strip this logo belongs to
 */
export function getLogoStrip(logoName: string): LogoStrip {
  if (!logoName) return 'second'

  const config = getLogoTypeConfig(logoName)
  return config?.strip ?? 'second'
}

/**
 * Get the auto-locked position for a brand logo
 * Returns null for non-auto-locked logos
 *
 * @param logoName - Name of the logo
 * @returns Fixed position for auto-locked logos, null otherwise
 */
export function getAutoLockedPosition(logoName: string): LogoPosition | null {
  if (!logoName) return null

  const config = getLogoTypeConfig(logoName)
  if (config?.isAutoLocked && config.defaultPosition) {
    return config.defaultPosition
  }
  return null
}

// ============================================================================
// LEGACY EXPORTS (kept for backward compatibility, may be deprecated)
// ============================================================================

export interface LogoPositionLock {
  position: LogoPosition
  patterns: RegExp[]
  displayName: string
  description: string
}

/**
 * @deprecated Use LOGO_TYPE_CONFIGS instead
 * Updated for 6-column grid
 */
export const LOGO_POSITION_LOCKS: Record<string, LogoPositionLock> = {
  'yi-logo': {
    position: 'top-1',  // Left edge in 6-column grid
    patterns: LOGO_TYPE_CONFIGS['yi-main'].patterns,
    displayName: 'Yi Logo',
    description: 'Yi logo must be positioned in top-left (brand requirement)',
  },
  'cii-logo': {
    position: 'top-6',  // Right edge in 6-column grid
    patterns: LOGO_TYPE_CONFIGS['cii-main'].patterns,
    displayName: 'CII Logo',
    description: 'CII logo must be positioned in top-right (brand requirement)',
  },
}

/**
 * @deprecated Use getSuggestedPosition instead
 */
export function getLockedPosition(logoName: string): LogoPosition | null {
  if (!logoName) return null

  for (const lock of Object.values(LOGO_POSITION_LOCKS)) {
    if (lock.patterns.some(pattern => pattern.test(logoName))) {
      return lock.position
    }
  }
  return null
}

/**
 * @deprecated Use getComplianceWarning instead
 */
export function isPositionLocked(logoName: string): boolean {
  return getLockedPosition(logoName) !== null
}

/**
 * @deprecated Use getLogoTypeConfig instead
 */
export function getLogoLockConfig(logoName: string): LogoPositionLock | null {
  if (!logoName) return null

  for (const lock of Object.values(LOGO_POSITION_LOCKS)) {
    if (lock.patterns.some(pattern => pattern.test(logoName))) {
      return lock
    }
  }
  return null
}

/**
 * @deprecated
 */
export function getLogoLockKey(logoName: string): string | null {
  if (!logoName) return null

  for (const [key, lock] of Object.entries(LOGO_POSITION_LOCKS)) {
    if (lock.patterns.some(pattern => pattern.test(logoName))) {
      return key
    }
  }
  return null
}

/**
 * @deprecated Validation is now soft (warnings only)
 */
export function validateLogoPositions(
  placements: Array<{ logoName: string; position: LogoPosition }>
): string[] {
  const errors: string[] = []

  for (const placement of placements) {
    const warning = getComplianceWarning(placement.logoName, placement.position)
    if (warning) {
      errors.push(warning)
    }
  }

  return errors
}
