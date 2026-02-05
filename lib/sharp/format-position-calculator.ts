/**
 * Format Position Calculator
 * YiCreatives Studio v21.0
 *
 * Dynamic position and size calculations for logo overlays based on
 * canvas dimensions and format configuration.
 *
 * Reference format: event_poster (1080x1440)
 * All other formats scale proportionally from this reference.
 */

import { getFormatLogoBarConfig, type FormatLogoBarConfig } from '@/lib/config/format-logo-bar-config'

// ============================================================================
// Types
// ============================================================================

/**
 * Input configuration for dimension calculation
 */
export interface PositionCalculatorConfig {
  /** Canvas width in pixels */
  canvasWidth: number
  /** Canvas height in pixels */
  canvasHeight: number
  /** Format ID (e.g., 'event_poster', 'instagram_post') */
  formatId: string
  /** Optional override for logo bar config */
  logoBarConfig?: FormatLogoBarConfig
}

/**
 * Calculated dimensions for logo bar rendering
 */
export interface CalculatedDimensions {
  // Row heights (scaled from reference)
  /** Brand logo row height */
  brandRowHeight: number
  /** Vertical logo row height */
  verticalRowHeight: number
  /** Initiative text row height */
  initiativeRowHeight: number
  /** Footer/partner row height */
  footerRowHeight: number

  // Spacing (scaled from reference)
  /** Gap between rows */
  rowSpacing: number
  /** Horizontal padding from edges */
  horizontalPadding: number
  /** Vertical padding within rows */
  verticalPadding: number

  // Logo sizes (scaled and clamped)
  /** Brand logo size (Yi, CII, Bharat Rising) */
  brandLogoSize: number
  /** Vertical/chapter logo size */
  verticalLogoSize: number
  /** Partner/sponsor logo size */
  partnerLogoSize: number

  // Total heights
  /** Total header strip height (brand + vertical + initiative + spacing) */
  headerTotalHeight: number
  /** Total footer strip height (partner + padding) */
  footerTotalHeight: number

  // Scale factors (for debugging)
  /** Width scale relative to reference */
  widthScale: number
  /** Height scale relative to reference */
  heightScale: number
  /** Combined scale factor used */
  combinedScale: number
}

// ============================================================================
// Reference Constants
// ============================================================================

/**
 * Reference dimensions (event_poster)
 * All scaling is relative to these values
 */
const REFERENCE = {
  width: 1080,
  height: 1440
} as const

/**
 * Base row heights (from design-constants.ts ENHANCED_STRIP_ROW_HEIGHTS)
 * These are the pixel values for the reference format
 */
const BASE_ROW_HEIGHTS = {
  brand: 120,      // v16.3: Brand logo row
  vertical: 90,    // v19.0: Vertical/chapter logo row
  initiative: 40,  // Initiative text row
  partner: 120     // v25.0: Partner/footer row
} as const

/**
 * Base spacing values for reference format
 */
const BASE_SPACING = {
  rowGap: 16,          // Gap between rows
  horizontalPadding: 20,
  verticalPadding: 12
} as const

/**
 * Base logo sizes for reference format
 */
const BASE_LOGO_SIZES = {
  brand: 100,      // Brand logos (Yi, CII)
  vertical: 75,    // Vertical/chapter logos
  partner: 80      // Partner/sponsor logos
} as const

// ============================================================================
// Main Calculator
// ============================================================================

/**
 * Calculate format-specific dimensions for logo bar rendering
 *
 * @param config - Position calculator configuration
 * @returns Calculated dimensions for logo rendering
 */
export function calculateFormatDimensions(config: PositionCalculatorConfig): CalculatedDimensions {
  const { canvasWidth, canvasHeight, formatId } = config
  const logoBarConfig = config.logoBarConfig || getFormatLogoBarConfig(formatId)

  // Calculate scale factors
  const widthScale = canvasWidth / REFERENCE.width
  const heightScale = canvasHeight / REFERENCE.height

  // Use the smaller scale to ensure logos fit, then apply format-specific scale factor
  const baseScale = Math.min(widthScale, heightScale)
  const combinedScale = baseScale * logoBarConfig.scaleFactor

  // Handle formats with no logo bars
  if (logoBarConfig.mode === 'none' || combinedScale === 0) {
    return createZeroDimensions(widthScale, heightScale, 0)
  }

  // Scale row heights
  const brandRowHeight = Math.round(BASE_ROW_HEIGHTS.brand * combinedScale)
  const verticalRowHeight = Math.round(BASE_ROW_HEIGHTS.vertical * combinedScale)
  const initiativeRowHeight = Math.round(BASE_ROW_HEIGHTS.initiative * combinedScale)
  const footerRowHeight = Math.round(BASE_ROW_HEIGHTS.partner * combinedScale)

  // Scale spacing
  const rowSpacing = Math.round(BASE_SPACING.rowGap * combinedScale)
  const horizontalPadding = Math.round(BASE_SPACING.horizontalPadding * widthScale)
  const verticalPadding = Math.round(BASE_SPACING.verticalPadding * combinedScale)

  // Calculate and clamp logo sizes
  const brandLogoSize = clampLogoSize(
    Math.round(BASE_LOGO_SIZES.brand * combinedScale),
    logoBarConfig.minLogoSize,
    logoBarConfig.maxLogoSize
  )
  const verticalLogoSize = clampLogoSize(
    Math.round(BASE_LOGO_SIZES.vertical * combinedScale),
    Math.round(logoBarConfig.minLogoSize * 0.75),
    Math.round(logoBarConfig.maxLogoSize * 0.75)
  )
  const partnerLogoSize = clampLogoSize(
    Math.round(BASE_LOGO_SIZES.partner * combinedScale),
    Math.round(logoBarConfig.minLogoSize * 0.8),
    Math.round(logoBarConfig.maxLogoSize * 0.8)
  )

  // Calculate total heights based on mode
  let headerTotalHeight: number
  let footerTotalHeight: number

  switch (logoBarConfig.mode) {
    case 'full':
      // All 4 rows in header (split layout) or all rows
      headerTotalHeight = brandRowHeight + verticalRowHeight + initiativeRowHeight + (rowSpacing * 2) + verticalPadding
      footerTotalHeight = logoBarConfig.stripConfig === 'header-footer'
        ? footerRowHeight + verticalPadding
        : 0
      break

    case 'compact':
      // 2 rows only (brand + vertical)
      headerTotalHeight = brandRowHeight + verticalRowHeight + rowSpacing + verticalPadding
      footerTotalHeight = logoBarConfig.stripConfig === 'header-footer'
        ? footerRowHeight + verticalPadding
        : 0
      break

    case 'minimal':
      // Brand logos only
      headerTotalHeight = brandRowHeight + verticalPadding
      footerTotalHeight = 0
      break

    default:
      headerTotalHeight = 0
      footerTotalHeight = 0
  }

  // Cap heights based on format config
  const maxHeader = canvasHeight * (logoBarConfig.maxHeaderPercent / 100)
  const maxFooter = canvasHeight * (logoBarConfig.maxFooterPercent / 100)

  headerTotalHeight = Math.min(headerTotalHeight, maxHeader)
  footerTotalHeight = Math.min(footerTotalHeight, maxFooter)

  return {
    brandRowHeight,
    verticalRowHeight,
    initiativeRowHeight,
    footerRowHeight,
    rowSpacing,
    horizontalPadding,
    verticalPadding,
    brandLogoSize,
    verticalLogoSize,
    partnerLogoSize,
    headerTotalHeight,
    footerTotalHeight,
    widthScale,
    heightScale,
    combinedScale
  }
}

/**
 * Create zero dimensions for formats with no logo bars
 */
function createZeroDimensions(
  widthScale: number,
  heightScale: number,
  combinedScale: number
): CalculatedDimensions {
  return {
    brandRowHeight: 0,
    verticalRowHeight: 0,
    initiativeRowHeight: 0,
    footerRowHeight: 0,
    rowSpacing: 0,
    horizontalPadding: 0,
    verticalPadding: 0,
    brandLogoSize: 0,
    verticalLogoSize: 0,
    partnerLogoSize: 0,
    headerTotalHeight: 0,
    footerTotalHeight: 0,
    widthScale,
    heightScale,
    combinedScale
  }
}

/**
 * Clamp logo size to min/max bounds
 */
function clampLogoSize(size: number, min: number, max: number): number {
  if (max === 0) return 0
  return Math.max(min, Math.min(max, size))
}

// ============================================================================
// Additional Helpers
// ============================================================================

/**
 * Calculate column positions for logo placement
 * Returns x-coordinates for 6-column grid
 */
export function calculateColumnPositions(
  canvasWidth: number,
  horizontalPadding: number
): number[] {
  const usableWidth = canvasWidth - (horizontalPadding * 2)
  const columnWidth = usableWidth / 6

  return [
    horizontalPadding + columnWidth * 0.5,  // Column 1 (left)
    horizontalPadding + columnWidth * 1.5,  // Column 2
    horizontalPadding + columnWidth * 2.5,  // Column 3 (center-left)
    horizontalPadding + columnWidth * 3.5,  // Column 4 (center-right)
    horizontalPadding + columnWidth * 4.5,  // Column 5
    horizontalPadding + columnWidth * 5.5   // Column 6 (right)
  ]
}

/**
 * Calculate row Y positions based on dimensions
 */
export function calculateRowPositions(
  dimensions: CalculatedDimensions
): { brand: number; vertical: number; initiative: number; footer: number } {
  const { brandRowHeight, verticalRowHeight, initiativeRowHeight, rowSpacing, verticalPadding } = dimensions

  // Calculate cumulative Y positions (from top)
  const brandY = verticalPadding + brandRowHeight / 2
  const verticalY = verticalPadding + brandRowHeight + rowSpacing + verticalRowHeight / 2
  const initiativeY = verticalPadding + brandRowHeight + rowSpacing + verticalRowHeight + rowSpacing + initiativeRowHeight / 2

  return {
    brand: brandY,
    vertical: verticalY,
    initiative: initiativeY,
    footer: 0 // Footer Y is calculated separately (from bottom)
  }
}

/**
 * Check if dimensions indicate logo bars should be applied
 */
export function shouldApplyLogoBarsFromDimensions(dimensions: CalculatedDimensions): boolean {
  return dimensions.headerTotalHeight > 0 || dimensions.footerTotalHeight > 0
}

/**
 * Get dimensions summary for logging
 */
export function getDimensionsSummary(dimensions: CalculatedDimensions): string {
  const { headerTotalHeight, footerTotalHeight, brandLogoSize, combinedScale } = dimensions

  return `Header: ${headerTotalHeight}px, Footer: ${footerTotalHeight}px, Logo: ${brandLogoSize}px, Scale: ${combinedScale.toFixed(2)}`
}

/**
 * Calculate dimensions with explicit canvas override
 * Useful for testing or preview generation
 */
export function calculateDimensionsForCanvas(
  formatId: string,
  width: number,
  height: number
): CalculatedDimensions {
  return calculateFormatDimensions({
    canvasWidth: width,
    canvasHeight: height,
    formatId
  })
}
