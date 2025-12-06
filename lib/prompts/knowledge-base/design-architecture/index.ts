/**
 * Design Architecture Module
 * Comprehensive design rules for ultra-pro image generation
 *
 * This module provides professional design architecture for:
 * - Certificate borders and zone layouts
 * - Speaker photo integration zones
 * - Typography hierarchy systems
 * - Platform-specific scroll-stop patterns
 *
 * Usage:
 * Import specific functions or constants needed by format builders
 * to inject professional design guidance into image generation prompts.
 */

// ============================================================
// TYPE EXPORTS
// ============================================================

export type {
  // Border types
  BorderStyle,
  BorderCategory,
  BorderStyleId,
  CornerStyle,
  BorderLine,
  DecorativeElement,

  // Zone types
  ZoneArchitecture,
  DesignZone,
  ZonePosition,
  ZoneDimensions,
  ZoneAnchor,
  ZonePurpose,

  // Speaker zone types
  SpeakerZoneConfig,
  SpeakerZoneLayout,
  SpeakerPosition,
  SpeakerSize,
  SpeakerShape,
  ContentFlow,

  // Typography types
  TextHierarchySystem,
  TypographyHierarchy,
  TypographyLevel,
  FontWeight,
  FontStyle,
  LetterSpacing,

  // Visual weight types
  VisualWeightRule,
  WeightDistribution,
  FocalPoint,
  FlowPattern,

  // Platform types
  PlatformPattern,
  ScrollStopTechnique,
  ColorPsychologyRule,
  SafeZoneRule,
  PlatformId,
  FormatId,
} from './types'

// ============================================================
// BORDER EXPORTS
// ============================================================

export {
  CERTIFICATE_BORDER_STYLES,
  getBorderStyle,
  getBorderStylePromptFragment,
  getAvailableBorderStyles,
  normalizeStyleId,
} from './borders/certificate-borders'

// ============================================================
// ZONE EXPORTS
// ============================================================

export {
  CERTIFICATE_ZONE_ARCHITECTURE,
  getCertificateZonePromptFragment,
  getCertificateZone,
  getCertificateZonesByPurpose,
} from './zones/certificate-zones'

export {
  SPEAKER_ZONE_CONFIGS,
  getSpeakerZoneConfig,
  getSpeakerZonePromptFragment,
  getAvailableSpeakerZones,
  shouldIncludeSpeakerZone,
  buildSpeakerZoneContext,
} from './zones/speaker-zones'

// ============================================================
// TYPOGRAPHY EXPORTS
// ============================================================

export {
  TYPOGRAPHY_HIERARCHY_SYSTEMS,
  getTypographySystem,
  getTypographyPromptFragment,
  getVisualWeight,
  getAvailableTypographySystems,
} from './typography/hierarchy-rules'

// ============================================================
// PLATFORM PATTERN EXPORTS
// ============================================================

export {
  PLATFORM_SCROLL_STOP_PATTERNS,
  getPlatformPattern,
  getScrollStopPromptFragment,
  getPlatformAntiPatterns,
  getPlatformColorPsychology,
  getAvailablePlatformPatterns,
} from './platform-patterns/scroll-stopping'

// ============================================================
// CONVENIENCE FUNCTIONS
// ============================================================

/**
 * Get all design architecture for a specific format
 * Returns combined prompt fragments for the format
 */
export function getDesignArchitectureForFormat(formatId: string): {
  borders?: string
  zones?: string
  typography?: string
  platformPatterns?: string
} {
  const result: {
    borders?: string
    zones?: string
    typography?: string
    platformPatterns?: string
  } = {}

  // Certificate-specific architecture
  if (formatId === 'certificate') {
    const { getBorderStylePromptFragment } = require('./borders/certificate-borders')
    const { getCertificateZonePromptFragment } = require('./zones/certificate-zones')
    result.borders = getBorderStylePromptFragment('classic_ornate')
    result.zones = getCertificateZonePromptFragment()
  }

  // Typography for all formats
  const { getTypographyPromptFragment } = require('./typography/hierarchy-rules')
  const typography = getTypographyPromptFragment(formatId)
  if (typography) {
    result.typography = typography
  }

  // Platform patterns for social formats
  const socialFormats = ['instagram', 'instagram_post', 'youtube_thumbnail', 'linkedin', 'linkedin_post']
  if (socialFormats.includes(formatId.toLowerCase())) {
    const { getScrollStopPromptFragment } = require('./platform-patterns/scroll-stopping')
    result.platformPatterns = getScrollStopPromptFragment(formatId)
  }

  return result
}

/**
 * Check if design architecture exists for a format
 */
export function hasDesignArchitecture(formatId: string): boolean {
  const supported = [
    'certificate',
    'event_poster',
    'instagram',
    'instagram_post',
    'youtube_thumbnail',
    'linkedin',
    'linkedin_post',
  ]
  return supported.includes(formatId.toLowerCase())
}
