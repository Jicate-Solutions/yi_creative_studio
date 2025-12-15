/**
 * Logo Awareness Types for AI-Aware Generation
 * These types define safe zones where the AI should avoid placing content
 * so that overlaid logos remain visible and unobstructed.
 */

import type { LogoPosition } from '@/lib/config/constants'
import type { LogoSizePreset } from '@/lib/constants/logoConstants'

/**
 * Represents a safe zone where a logo will be overlaid
 * The AI should avoid placing text/content in these areas
 */
export interface LogoSafeZone {
  position: LogoPosition
  sizePreset: LogoSizePreset | number
  sizePixels: number
  /** Natural language description for AI prompt */
  description: string
}

/**
 * Complete context for logo-aware AI generation
 */
export interface LogoAwarenessContext {
  /** Active logo safe zones */
  activeLogos: LogoSafeZone[]
  /** Natural language descriptions of each zone */
  safeZoneDescriptions: string[]
  /** Complete layout guidance text for AI prompt */
  layoutGuidance: string
  /** Whether there are any active logos */
  hasLogos: boolean
}

/**
 * Maps logo positions to natural language descriptions
 * Used to help AI understand where content should not be placed
 *
 * Yi Brand Guidelines 2025 - 18-Position Grid (6×3):
 * - Header row (top-1 to top-6): Brand logos
 * - Second row (mid-1 to mid-6): Vertical logos, just below header
 * - Footer row (bottom-1 to bottom-6): Sponsors/Partners
 */
export const LOGO_POSITION_DESCRIPTIONS: Record<LogoPosition, string> = {
  // HEADER STRIP - Top row (Brand logos) - 6 positions
  'top-1': 'upper far-left corner',
  'top-2': 'upper left area',
  'top-3': 'upper center-left area',
  'top-4': 'upper center-right area',
  'top-5': 'upper right area',
  'top-6': 'upper far-right corner',
  // SECOND STRIP - Just below header (Vertical logos) - 6 positions
  'mid-1': 'left side, just below the top header area',
  'mid-2': 'left-center, just below the top header area',
  'mid-3': 'center-left, just below the top header area',
  'mid-4': 'center-right, just below the top header area',
  'mid-5': 'right-center, just below the top header area',
  'mid-6': 'right side, just below the top header area',
  // FOOTER STRIP - Bottom row (Sponsors/Partners) - 6 positions
  'bottom-1': 'lower far-left corner',
  'bottom-2': 'lower left area',
  'bottom-3': 'lower center-left area',
  'bottom-4': 'lower center-right area',
  'bottom-5': 'lower right area',
  'bottom-6': 'lower far-right corner',
}

/**
 * Buffer multiplier for safe zone calculation
 * Adds extra space around logos for visual breathing room
 */
export const SAFE_ZONE_BUFFER = 0.3 // 30% buffer around logo size

/**
 * Minimum safe zone size in pixels
 * Even small logos need some clear space
 */
export const MIN_SAFE_ZONE_SIZE = 80

/**
 * Default padding from edges in pixels
 */
export const EDGE_PADDING = 20
