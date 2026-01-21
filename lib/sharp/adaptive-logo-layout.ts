/**
 * v24.0: Adaptive Logo Layout Compression
 * Calculates optimal logo layout mode based on available header height
 *
 * Adapts logo strip layout when text is detected closer to top than expected,
 * preventing text-logo overlap by compressing or simplifying the logo layout.
 */

export type LogoLayoutMode = 'full' | 'compressed' | 'emergency'

export interface LogoLayout {
  mode: LogoLayoutMode
  brandHeight: number
  verticalHeight: number
  initiativeHeight: number
  rowSpacing: number
  verticalPadding: number
  skipVertical: boolean
  skipInitiative: boolean
}

export interface AdaptiveLayoutConfig {
  headerHeight: number
  brandLogos: number
  verticalLogos: number
  hasInitiative: boolean
}

/**
 * Calculate adaptive logo layout based on available header height
 *
 * @param config - Configuration with available header height and logo counts
 * @returns Layout configuration with row heights and mode
 *
 * BUG FIX v24.0.1: Fixed threshold calculations to prevent overlaps
 * - Compressed mode now requires >= 226px (was >= 214px which caused overlaps)
 * - Added super-compressed mode for tight spaces (165-225px)
 * - Reduced emergency mode size for extreme cases
 */
export function calculateAdaptiveLogoLayout(config: AdaptiveLayoutConfig): LogoLayout {
  const { headerHeight, brandLogos, verticalLogos, hasInitiative } = config

  // Full layout (requires 290px minimum)
  // Brand: 120px, Vertical: 90px, Initiative: 40px
  // Spacing: 16px x 2 (between 3 rows) = 32px
  // Padding: 24px (top) + 24px (bottom) = 48px
  // Total: 120 + 90 + 40 + 32 + 48 = 330px
  // But we cap at 25% so typically around 350px for 1440px canvas
  if (headerHeight >= 290) {
    return {
      mode: 'full',
      brandHeight: 120,
      verticalHeight: 90,
      initiativeHeight: 40,
      rowSpacing: 16,
      verticalPadding: 24,
      skipVertical: false,
      skipInitiative: false,
    }
  }

  // Compressed layout (requires 226px minimum)
  // Brand: 80px, Vertical: 60px, Initiative: 30px
  // Spacing: 12px x 2 = 24px
  // Padding: 16px x 2 = 32px
  // Total: 80 + 60 + 30 + 24 + 32 = 226px
  // BUG FIX: Changed threshold from >= 214 to >= 226 (was causing overlaps when available space was 214-225px)
  if (headerHeight >= 226) {
    return {
      mode: 'compressed',
      brandHeight: 80,
      verticalHeight: 60,
      initiativeHeight: 30,
      rowSpacing: 12,
      verticalPadding: 16,
      skipVertical: false,
      skipInitiative: false,
    }
  }

  // Super-compressed layout (requires 165px minimum)
  // Brand: 60px, Vertical: 45px, Initiative: 20px
  // Spacing: 10px x 2 = 20px
  // Padding: 10px x 2 = 20px
  // Total: 60 + 45 + 20 + 20 + 20 = 165px
  // Used when text is very close to top (e.g., 16-17% violations)
  if (headerHeight >= 165) {
    return {
      mode: 'compressed',  // Keep mode name same for backward compatibility
      brandHeight: 60,
      verticalHeight: 45,
      initiativeHeight: 20,
      rowSpacing: 10,
      verticalPadding: 10,
      skipVertical: false,
      skipInitiative: false,
    }
  }

  // Emergency layout (brand logos only)
  // Brand: 60px (reduced from 80px to fit tighter spaces)
  // Padding: 10px x 2 = 20px
  // Total: 80px (minimum viable branding)
  return {
    mode: 'emergency',
    brandHeight: 60,
    verticalHeight: 0, // Skip vertical row
    initiativeHeight: 0, // Skip initiative row
    rowSpacing: 0,
    verticalPadding: 10,
    skipVertical: true,
    skipInitiative: true,
  }
}

/**
 * Get human-readable description of layout mode
 */
export function getLayoutModeDescription(mode: LogoLayoutMode): string {
  switch (mode) {
    case 'full':
      return 'Full layout with all rows at standard size'
    case 'compressed':
      return 'Compressed layout with reduced row heights'
    case 'emergency':
      return 'Emergency layout (brand logos only)'
  }
}

/**
 * Calculate total header height for a given layout
 */
export function calculateLayoutHeight(layout: LogoLayout): number {
  let total = layout.verticalPadding * 2 // Top and bottom padding

  // Add brand row
  total += layout.brandHeight

  // Add vertical row if not skipped
  if (!layout.skipVertical) {
    total += layout.verticalHeight
    total += layout.rowSpacing
  }

  // Add initiative row if not skipped
  if (!layout.skipInitiative) {
    total += layout.initiativeHeight
    total += layout.rowSpacing
  }

  return total
}
