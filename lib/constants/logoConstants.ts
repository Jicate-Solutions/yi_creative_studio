/**
 * Logo Size Constants and Configuration
 * Provides preset sizes and utilities for logo placement
 */

// ============================================================================
// Logo Size Presets
// ============================================================================

export type LogoSizePreset = 'small' | 'medium' | 'large' | 'xlarge'

export interface LogoSizeOption {
  value: LogoSizePreset
  label: string
  pixels: number
  description: string
  useCase: string
}

/**
 * Predefined logo size options
 * Sizes are designed for typical poster dimensions (1080x1350 and similar)
 */
export const LOGO_SIZE_OPTIONS: Record<LogoSizePreset, LogoSizeOption> = {
  small: {
    value: 'small',
    label: 'Small',
    pixels: 60,
    description: 'Subtle branding',
    useCase: 'Watermarks, corner marks',
  },
  medium: {
    value: 'medium',
    label: 'Medium',
    pixels: 100,
    description: 'Standard size',
    useCase: 'Default for most designs',
  },
  large: {
    value: 'large',
    label: 'Large',
    pixels: 150,
    description: 'Prominent branding',
    useCase: 'Header logos, primary branding',
  },
  xlarge: {
    value: 'xlarge',
    label: 'Extra Large',
    pixels: 200,
    description: 'Maximum visibility',
    useCase: 'Main brand focus, sponsor highlights',
  },
}

/**
 * Default logo size preset
 */
export const DEFAULT_LOGO_SIZE: LogoSizePreset = 'medium'

/**
 * Custom size constraints
 */
export const CUSTOM_SIZE_LIMITS = {
  min: 30,
  max: 300,
  step: 10,
}

// ============================================================================
// Logo Padding Constants
// ============================================================================

export type LogoPaddingPreset = 'tight' | 'normal' | 'loose'

export interface LogoPaddingOption {
  value: LogoPaddingPreset
  label: string
  pixels: number
  description: string
}

export const LOGO_PADDING_OPTIONS: Record<LogoPaddingPreset, LogoPaddingOption> = {
  tight: {
    value: 'tight',
    label: 'Tight',
    pixels: 10,
    description: 'Minimal edge spacing',
  },
  normal: {
    value: 'normal',
    label: 'Normal',
    pixels: 20,
    description: 'Standard edge spacing',
  },
  loose: {
    value: 'loose',
    label: 'Loose',
    pixels: 40,
    description: 'Generous edge spacing',
  },
}

export const DEFAULT_LOGO_PADDING: LogoPaddingPreset = 'normal'

// ============================================================================
// Logo Background Constants
// ============================================================================

/**
 * Background shape options for logos
 * - none: Transparent background (default)
 * - rectangle: White rectangle background
 * - rounded: White rounded rectangle background
 * - circle: White circular background
 */
export type LogoBackgroundShape = 'none' | 'rectangle' | 'rounded' | 'circle'

/**
 * Background style options (shadow and border)
 */
export interface LogoBackgroundStyle {
  shadow: boolean
  border: boolean
}

/**
 * Default logo background color (hex)
 */
export const DEFAULT_LOGO_BACKGROUND_COLOR = '#FFFFFF'

/**
 * Default logo background configuration
 */
export const DEFAULT_LOGO_BACKGROUND: {
  shape: LogoBackgroundShape
  style: LogoBackgroundStyle
} = {
  shape: 'none',
  style: { shadow: false, border: false },
}

/**
 * Background shape options for UI display
 */
export const BACKGROUND_SHAPE_OPTIONS: ReadonlyArray<{
  value: LogoBackgroundShape
  label: string
  description: string
}> = [
  { value: 'none', label: 'None', description: 'Transparent background' },
  { value: 'rectangle', label: 'Rectangle', description: 'White square background' },
  { value: 'rounded', label: 'Rounded', description: 'White rounded background' },
  { value: 'circle', label: 'Circle', description: 'White circular background' },
] as const

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get logo size in pixels from preset or custom value
 */
export function getLogoSizePixels(size: LogoSizePreset | number): number {
  if (typeof size === 'number') {
    // Clamp custom size to limits
    return Math.max(CUSTOM_SIZE_LIMITS.min, Math.min(CUSTOM_SIZE_LIMITS.max, size))
  }
  return LOGO_SIZE_OPTIONS[size]?.pixels || LOGO_SIZE_OPTIONS[DEFAULT_LOGO_SIZE].pixels
}

/**
 * Get logo padding in pixels from preset
 */
export function getLogoPaddingPixels(padding: LogoPaddingPreset): number {
  return LOGO_PADDING_OPTIONS[padding]?.pixels || LOGO_PADDING_OPTIONS[DEFAULT_LOGO_PADDING].pixels
}

/**
 * Get all size options as an array for select inputs
 */
export function getLogoSizeOptionsArray(): LogoSizeOption[] {
  return Object.values(LOGO_SIZE_OPTIONS)
}

/**
 * Get all padding options as an array for select inputs
 */
export function getLogoPaddingOptionsArray(): LogoPaddingOption[] {
  return Object.values(LOGO_PADDING_OPTIONS)
}

/**
 * Check if a size is a valid preset
 */
export function isLogoSizePreset(size: unknown): size is LogoSizePreset {
  return typeof size === 'string' && size in LOGO_SIZE_OPTIONS
}

/**
 * Calculate appropriate logo size based on image dimensions
 * Returns a recommended size that looks good relative to the canvas
 */
export function getRecommendedLogoSize(
  imageWidth: number,
  imageHeight: number,
  position: string
): LogoSizePreset {
  const smallerDimension = Math.min(imageWidth, imageHeight)

  // For corner positions, use smaller logos
  if (position.includes('corner') || position.includes('top-') || position.includes('bottom-')) {
    if (smallerDimension < 800) return 'small'
    if (smallerDimension < 1200) return 'medium'
    return 'medium'
  }

  // For center positions, can use larger logos
  if (position === 'center') {
    if (smallerDimension < 800) return 'medium'
    if (smallerDimension < 1200) return 'large'
    return 'large'
  }

  // Default
  return 'medium'
}

/**
 * Scale logo size proportionally based on target image dimensions
 * Useful when the final export size differs from the preview
 */
export function scaleLogoSize(
  baseSize: number,
  baseWidth: number,
  targetWidth: number
): number {
  const scaleFactor = targetWidth / baseWidth
  const scaledSize = Math.round(baseSize * scaleFactor)

  // Apply limits
  return Math.max(CUSTOM_SIZE_LIMITS.min, Math.min(CUSTOM_SIZE_LIMITS.max, scaledSize))
}
