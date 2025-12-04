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
 */
export const LOGO_POSITION_DESCRIPTIONS: Record<LogoPosition, string> = {
  'top-left': 'upper left corner',
  'top-center': 'top center area',
  'top-right': 'upper right corner',
  'mid-left': 'left side, vertically centered',
  'center': 'center of the design',
  'mid-right': 'right side, vertically centered',
  'bottom-left': 'lower left corner',
  'bottom-center': 'bottom center area',
  'bottom-right': 'lower right corner',
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
