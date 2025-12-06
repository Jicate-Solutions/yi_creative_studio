/**
 * Design Architecture Types
 * TypeScript interfaces for professional design rules
 *
 * Used by format builders to inject comprehensive design guidance
 * into image generation prompts.
 */

// ============================================================
// BORDER & FRAME TYPES
// ============================================================

export type BorderCategory = 'ornate' | 'modern' | 'corporate' | 'academic' | 'minimal'
export type CornerType = 'flourish' | 'geometric' | 'laurel' | 'minimal' | 'none'
export type BorderLineStyle = 'solid' | 'double' | 'ornate' | 'dashed'
export type ColorRole = 'primary' | 'secondary' | 'accent' | 'gold' | 'silver' | 'bronze'

export interface CornerStyle {
  type: CornerType
  description: string
  size: string // Relative to border width, e.g., "15-20%"
}

export interface BorderLine {
  position: 'outer' | 'inner' | 'accent'
  style: BorderLineStyle
  thickness: string
  colorRole: ColorRole
}

export interface DecorativeElement {
  type: 'flourish' | 'seal' | 'ribbon' | 'laurel' | 'pattern' | 'geometric'
  position: string
  description: string
}

export interface BorderStyle {
  id: string
  name: string
  category: BorderCategory
  description: string
  innerPadding: string // e.g., "8-12% of width"
  outerBorder: string // e.g., "2-4% of width"
  cornerTreatment: CornerStyle
  lineStyles: BorderLine[]
  decorativeElements: DecorativeElement[]
  colorGuidance: string
  promptFragment: string // Ready-to-use prompt text
}

// ============================================================
// ZONE ARCHITECTURE TYPES
// ============================================================

export type ZoneAnchor =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'center-left'
  | 'center'
  | 'center-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'
  | 'full-bleed'

export type ZonePurpose = 'content' | 'reserved' | 'integration' | 'safe'

export interface ZonePosition {
  anchor: ZoneAnchor
  offsetX?: string
  offsetY?: string
}

export interface ZoneDimensions {
  widthPercent?: number
  heightPercent?: number
  aspectRatio?: string
  minSize?: string
  maxSize?: string
}

export interface DesignZone {
  id: string
  name: string
  position: ZonePosition
  dimensions: ZoneDimensions
  purpose: ZonePurpose
  reservedFor?: string
  backgroundGuidance: string
  contentRules: string[]
}

export interface ZoneArchitecture {
  formatId: string
  aspectRatio: string
  zones: DesignZone[]
  proportionalRules: Record<string, string>
  promptFragment: string // Ready-to-use prompt text
}

// ============================================================
// SPEAKER/PHOTO INTEGRATION TYPES
// ============================================================

export type SpeakerPosition = 'left' | 'center' | 'right'
export type SpeakerSize = 'small' | 'medium' | 'large'
export type SpeakerShape = 'circle' | 'rounded' | 'square'
export type ContentFlow = 'opposite' | 'around' | 'below'

export interface SpeakerZoneLayout {
  photoZone: DesignZone
  contentFlow: ContentFlow
  backgroundTreatment: string
  integrationRules: string[]
  promptFragment: string
}

export interface SpeakerZoneConfig {
  id: string
  position: SpeakerPosition
  size: SpeakerSize
  shape: SpeakerShape
  zoneArchitecture: SpeakerZoneLayout
}

// ============================================================
// TYPOGRAPHY HIERARCHY TYPES
// ============================================================

export type TypographyLevel = 'hero' | 'primary' | 'secondary' | 'tertiary' | 'caption'
export type FontWeight = 'thin' | 'light' | 'regular' | 'medium' | 'semibold' | 'bold' | 'black'
export type FontStyle = 'serif' | 'sans-serif' | 'script' | 'display' | 'monospace'
export type LetterSpacing = 'tight' | 'normal' | 'wide' | 'extra-wide'

export interface TypographyHierarchy {
  level: TypographyLevel
  role: string // e.g., 'event_name', 'recipient_name', 'date'
  relativeSize: number // Multiplier, e.g., hero = 3.0x base
  weight: FontWeight
  style: FontStyle
  spacing: LetterSpacing
  visualWeight: number // 0-100 attention score
  description: string
}

export interface TextHierarchySystem {
  formatId: string
  baseSize: string // e.g., '14pt equivalent'
  mood: string // e.g., 'prestigious, formal, elegant'
  levels: TypographyHierarchy[]
  contrast: 'high' | 'medium' | 'subtle'
  readabilityRules: string[]
  promptFragment: string
}

// ============================================================
// VISUAL WEIGHT TYPES
// ============================================================

export interface WeightDistribution {
  top: number // 0-100
  center: number
  bottom: number
  left: number
  right: number
}

export interface FocalPoint {
  priority: 1 | 2 | 3
  zone: string
  element: string
  attentionWeight: number // 0-100
}

export type FlowPattern = 'Z' | 'F' | 'radial' | 'center-out' | 'top-down'

export interface VisualWeightRule {
  formatId: string
  distribution: WeightDistribution
  focalPoints: FocalPoint[]
  flowPattern: FlowPattern
  proportionalGuidelines: Record<string, string>
  promptFragment: string
}

// ============================================================
// PLATFORM PATTERN TYPES
// ============================================================

export interface ScrollStopTechnique {
  technique: string
  description: string
  implementation: string
  effectiveness: 'Very High' | 'High' | 'Medium-High' | 'Medium'
}

export interface ColorPsychologyRule {
  emotion: string
  colors: string[]
  usage: string
}

export interface SafeZoneRule {
  area: string
  reason: string
  avoidance: string[]
}

export interface PlatformPattern {
  platform: string
  psychology: string
  scrollStopTechniques: ScrollStopTechnique[]
  colorPsychology: ColorPsychologyRule[]
  safeZones: SafeZoneRule[]
  antiPatterns: string[]
  promptFragment: string
}

// ============================================================
// HELPER FUNCTION TYPES
// ============================================================

export type BorderStyleId = 'classic_ornate' | 'modern_minimal' | 'corporate_professional' | 'academic_traditional'
export type FormatId = 'certificate' | 'event_poster' | 'youtube_thumbnail' | 'instagram_post' | 'linkedin_post' | 'story' | 'flyer' | 'business_card' | 'presentation' | 'web_banner' | 'social_post'
export type PlatformId = 'instagram' | 'youtube_thumbnail' | 'linkedin' | 'facebook' | 'twitter' | 'pinterest' | 'tiktok'
