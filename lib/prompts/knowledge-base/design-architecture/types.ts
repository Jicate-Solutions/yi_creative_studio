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

export interface TypographyColorSpec {
  primary: string // Main color for this text role (e.g., "white", "#FFFFFF")
  contrast?: string // Alternative contrast color for variety
  wcagMinimum: number // Minimum contrast ratio (4.5 or 7)
  darkMode?: string // Dark mode color override
  description: string // Description of color usage (e.g., "High contrast white for readability")
}

export interface TypographyHierarchy {
  level: TypographyLevel
  role: string // e.g., 'event_name', 'recipient_name', 'date'
  relativeSize: number // Multiplier, e.g., hero = 3.0x base
  weight: FontWeight
  style: FontStyle
  spacing: LetterSpacing
  visualWeight: number // 0-100 attention score
  description: string
  colorSpec?: TypographyColorSpec // NEW: Color specifications for this text role
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

// ============================================================
// STORY-DRIVEN DESIGN INTELLIGENCE TYPES (v4.2)
// ============================================================

/**
 * Story analysis - understanding the narrative this event is telling
 */
export interface StoryAnalysis {
  narrative: string // Core story in one sentence
  emotionalArc: string // Beginning → Middle → End
  themes: string[] // ["primary theme", "secondary theme"]
  transformation?: string // Before state → After state
  context?: {
    formality: 'casual' | 'professional' | 'premium' | 'exclusive'
    energyLevel: 'calm' | 'moderate' | 'high' | 'explosive'
    timeHorizon: 'past' | 'present' | 'future'
    scope: 'personal' | 'community' | 'regional' | 'global' | 'universal'
  }
}

/**
 * Vibe and mood - the emotional feeling this design should evoke
 */
export interface VibeAndMood {
  vibeKeywords: string[] // 3-5 descriptive words like "empowering, authoritative, urgent"
  moodAtmosphere: string // Visual atmosphere description
  emotionalTemperature: 'warm' | 'neutral' | 'cool'
  energyDynamics: 'static' | 'flowing' | 'explosive' | 'pulsing'
  audienceResonance?: string // What will make audience connect emotionally
}

/**
 * Multi-color word strategy for headlines
 */
export interface MultiColorWord {
  word: string // The word to color
  color: string // Hex color code
  reasoning: string // Why this color for this word
}

/**
 * Typography strategy - fonts and hierarchy that tell the story
 */
export interface TypographyStrategy {
  headlinePersonality: string // Font character description
  fontRecommendations: {
    headline: string // Font name (reasoning)
    subheading: string
    body: string
  }
  multiColorStrategy?: {
    words: MultiColorWord[]
    colorRhythm: 'alternating' | 'gradient' | 'emphasis-based'
  }
  hierarchyFlow: string // How eye travels through text
  sizingStrategy: 'dominant' | 'balanced' | 'subtle'
}

/**
 * Color storytelling - colors that convey the story's emotion
 */
export interface DominantHue {
  color: string // Hex code
  role: string // e.g., "Leadership/achievement"
  usage: string // e.g., "Primary headlines"
}

export interface ColorStorytelling {
  dominantHues: DominantHue[]
  colorPsychology: string // How colors convey the story emotion
  paletteStrategy?: string // Overall color palette approach
}

/**
 * Background treatment - gradient types and atmospheric effects
 */
export type GradientType = 'linear' | 'radial' | 'sunburst' | 'mesh' | 'atmospheric'

export interface AtmosphericEffects {
  depth?: boolean // Layered depth
  lightRays?: boolean // Emanating light rays
  particles?: boolean // Subtle atmospheric particles
}

export interface BackgroundTreatment {
  type: GradientType
  specification: string // Detailed gradient description with color stops, direction, effects
  atmosphericEffects?: AtmosphericEffects
  colorStops?: Array<{ position: string; color: string }>
}

/**
 * Thematic decorative element
 */
export interface ThematicElement {
  element: string // Element description (e.g., "Refined leaf geometry")
  placement: string // Where to place it (e.g., "top-right corner")
  opacity: number // Opacity level (0-1)
  reasoning: string // Why this element for this story
}

/**
 * Decorative elements context - story-specific decorations
 */
export interface DecorativeElementsContext {
  thematicElements: ThematicElement[]
  sophisticationLevel: 'refined' | 'balanced' | 'playful'
  placementStrategy?: string
}

/**
 * Layout narrative - content flow that tells the story
 */
export interface LayoutNarrative {
  visualHierarchy: string[] // Storytelling order ["Impact headline", "Speaker photos", "Event details", "CTA"]
  contentAreaStyle: string // Container styling that matches vibe
  logoStripTreatment: 'sophisticated' | 'modern' | 'classic' | 'minimal'
  spatialDensity: 'minimal' | 'balanced' | 'rich'
}
