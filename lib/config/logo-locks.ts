/**
 * Logo Position Locking Configuration
 * PRD Section 8.4 - Brand Rules (Yi-Specific - CRITICAL)
 *
 * Non-negotiable position requirements:
 * - Yi logo: TOP-LEFT
 * - CII logo: TOP-RIGHT
 */

import type { LogoPosition } from './constants'

export interface LogoPositionLock {
  /** The locked position for this logo type */
  position: LogoPosition
  /** Regex patterns to match logo names */
  patterns: RegExp[]
  /** Display name for UI */
  displayName: string
  /** Description for tooltips */
  description: string
}

/**
 * Logo position locks configuration
 * Logos matching these patterns will be automatically assigned to their locked positions
 */
export const LOGO_POSITION_LOCKS: Record<string, LogoPositionLock> = {
  'yi-logo': {
    position: 'top-left',
    patterns: [
      /^yi$/i,                    // Exact match "Yi"
      /^yi\s/i,                   // Starts with "Yi "
      /\syi$/i,                   // Ends with " Yi"
      /yi\s*logo/i,               // "Yi Logo" or "YiLogo"
      /young\s*indians/i,         // "Young Indians"
      /yi[-_]?erode/i,            // "Yi Erode", "Yi-Erode", "Yi_Erode"
      /yi[-_]?chapter/i,          // "Yi Chapter"
    ],
    displayName: 'Yi Logo',
    description: 'Yi logo must be positioned in top-left (brand requirement)',
  },
  'cii-logo': {
    position: 'top-right',
    patterns: [
      /^cii$/i,                   // Exact match "CII"
      /^cii\s/i,                  // Starts with "CII "
      /\scii$/i,                  // Ends with " CII"
      /cii\s*logo/i,              // "CII Logo" or "CIILogo"
      /confederation.*india/i,    // "Confederation of Indian Industry"
    ],
    displayName: 'CII Logo',
    description: 'CII logo must be positioned in top-right (brand requirement)',
  },
}

/**
 * Check if a logo name matches any locked position pattern
 *
 * @param logoName - Name of the logo to check
 * @returns The locked position if logo matches a lock pattern, null otherwise
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
 * Check if a logo has a locked position
 *
 * @param logoName - Name of the logo to check
 * @returns true if logo has a locked position
 */
export function isPositionLocked(logoName: string): boolean {
  return getLockedPosition(logoName) !== null
}

/**
 * Get the lock configuration for a logo
 *
 * @param logoName - Name of the logo to check
 * @returns Lock configuration or null if not locked
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
 * Get the lock key (yi-logo, cii-logo) for a logo name
 *
 * @param logoName - Name of the logo to check
 * @returns Lock key or null if not locked
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
 * Validate logo placements against lock requirements
 *
 * @param placements - Array of logo placements with name and position
 * @returns Array of validation errors, empty if all valid
 */
export function validateLogoPositions(
  placements: Array<{ logoName: string; position: LogoPosition }>
): string[] {
  const errors: string[] = []

  for (const placement of placements) {
    const lockedPosition = getLockedPosition(placement.logoName)
    if (lockedPosition && placement.position !== lockedPosition) {
      const lockConfig = getLogoLockConfig(placement.logoName)
      errors.push(
        `${lockConfig?.displayName || placement.logoName} must be in ${lockedPosition} position (currently in ${placement.position})`
      )
    }
  }

  return errors
}
