/**
 * Multi-Format Layout Agent Types
 *
 * TypeScript interfaces for the Layout Agent with Actor-Critic thinking.
 * Handles layout decisions across all 35 creative formats.
 *
 * @module layout-agent.types
 */

// Note: CreativeFormatId and FormatCategoryId are defined in lib/config/creative-formats.ts
// but for loose coupling, we use string types here

// ============================================================
// LAYOUT ELEMENT TYPES
// ============================================================

/**
 * Layout element categories that the agent positions
 */
export type LayoutElementType =
  | 'headline'
  | 'tagline'
  | 'body_text'
  | 'date_time'
  | 'venue'
  | 'speaker_zone'
  | 'cta_button'
  | 'logo_primary'
  | 'logo_secondary'
  | 'decorative_element'
  | 'background_zone'
  | 'footer_contact'
  | 'qr_code'
  | 'custom_field'

/**
 * Visual hierarchy levels for elements
 */
export type HierarchyLevel = 'dominant' | 'prominent' | 'supporting' | 'subtle'

/**
 * Composition styles for layout
 */
export type CompositionStyle =
  | 'centered'
  | 'asymmetric'
  | 'rule_of_thirds'
  | 'golden_ratio'
  | 'grid'

/**
 * Sophistication levels affecting density and spacing
 */
export type SophisticationLevel = 'minimalist' | 'balanced' | 'rich'

// ============================================================
// ELEMENT POSITIONING
// ============================================================

/**
 * Element position specification (percentages 0-100)
 */
export interface ElementPosition {
  /** Horizontal position (0 = left edge) */
  xPercent: number
  /** Vertical position (0 = top edge) */
  yPercent: number
  /** Element width as % of canvas */
  widthPercent: number
  /** Element height as % of canvas */
  heightPercent: number
  /** Horizontal anchor point */
  anchorX: 'left' | 'center' | 'right'
  /** Vertical anchor point */
  anchorY: 'top' | 'center' | 'bottom'
}

/**
 * Pixel-based position (calculated from percentages)
 */
export interface PixelPosition {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Reserved zone that cannot contain elements
 */
export interface ReservedZone {
  id: string
  name: string
  xStart: number
  xEnd: number
  yStart: number
  yEnd: number
  reason: string
}

/**
 * Constraints on element placement
 */
export interface ElementConstraints {
  minWidthPercent?: number
  maxWidthPercent?: number
  minYPercent?: number
  maxYPercent?: number
  mustBeAbove?: string[]
  mustBeBelow?: string[]
  avoidOverlapWith?: string[]
}

// ============================================================
// LAYOUT AGENT INPUT
// ============================================================

/**
 * Individual element to be positioned
 */
export interface LayoutElement {
  id: string
  type: LayoutElementType
  content: string
  hierarchy: HierarchyLevel
  required: boolean
  preferredPosition?: ElementPosition
  constraints?: ElementConstraints
}

/**
 * Brand context for layout decisions
 */
export interface BrandContext {
  primaryColor: string
  secondaryColor: string
  accentColor?: string
  logoPosition?: 'top-left' | 'top-right' | 'top-center'
}

/**
 * Main input to the Layout Agent
 */
export interface LayoutAgentInput {
  // Format context
  formatId: string
  formatCategory: string
  aspectRatio: string
  canvasWidth: number
  canvasHeight: number

  // Content to layout
  elements: LayoutElement[]

  // Brand constraints
  brandContext?: BrandContext

  // Zone reservations
  reservedZones: ReservedZone[]

  // Design preferences
  sophistication: SophisticationLevel
  alignment?: 'center' | 'left' | 'right' | 'asymmetric'

  // Tracking
  organizationId: string
  userId?: string
  creativeId?: string
}

// ============================================================
// ACTOR PERSPECTIVE - CREATIVE LAYOUT PROPOSAL
// ============================================================

/**
 * Actor's proposed placement for a single element
 */
export interface ActorElementPlacement {
  elementId: string
  position: ElementPosition
  reasoning: string
  alternativePositions?: ElementPosition[]
  visualRelationships: string[]
}

/**
 * Actor's creative vision for layout
 */
export interface ActorLayoutProposal {
  // Creative rationale
  designPhilosophy: string
  visualFlow: string
  emotionalImpact: string
  uniqueApproach: string

  // Proposed element positions
  elementPlacements: ActorElementPlacement[]

  // Composition metadata
  compositionStyle: CompositionStyle
  negativeSpaceUsage: 'minimal' | 'balanced' | 'generous'
  visualWeight: 'top_heavy' | 'bottom_heavy' | 'balanced' | 'dynamic'

  // Innovation suggestions
  innovativeElements: string[]
  formatSpecificEnhancements: string[]
}

// ============================================================
// CRITIC PERSPECTIVE - CONSTRAINT VALIDATION
// ============================================================

/**
 * Hard constraint violation (must fix)
 */
export interface LayoutViolation {
  severity: 'critical' | 'major'
  elementId: string
  constraint: string
  message: string
  suggestedFix?: ElementPosition
}

/**
 * Soft constraint warning (should fix)
 */
export interface LayoutWarning {
  severity: 'minor' | 'info'
  elementId: string
  issue: string
  recommendation: string
}

/**
 * Improvement suggestion
 */
export interface LayoutImprovement {
  elementId: string
  currentScore: number
  potentialScore: number
  suggestion: string
  suggestedPosition?: ElementPosition
}

/**
 * Format-specific validation check
 */
export interface FormatSpecificCheck {
  checkName: string
  passed: boolean
  details: string
  formatId: string
}

/**
 * Critic's validation of layout proposal
 */
export interface CriticLayoutReview {
  // Overall assessment
  overallScore: number

  // Category scores (0-100)
  brandComplianceScore: number
  zoneComplianceScore: number
  hierarchyScore: number
  accessibilityScore: number
  balanceScore: number
  formatOptimizationScore: number

  // Detailed findings
  violations: LayoutViolation[]
  warnings: LayoutWarning[]
  improvements: LayoutImprovement[]
  formatChecks: FormatSpecificCheck[]
}

// ============================================================
// SYNTHESIS - FINAL LAYOUT DECISION
// ============================================================

/**
 * Text zone adjustments compatible with existing system
 */
export interface TextZoneAdjustments {
  headline: { start: number; end: number }
  tagline: { start: number; end: number }
  dateVenue: { start: number; end: number }
  speakers: { start: number; end: number }
  additionalDetails: { start: number; end: number }
}

/**
 * Final element placement after synthesis
 */
export interface FinalElementPlacement {
  elementId: string
  elementType: LayoutElementType
  position: ElementPosition
  pixelPosition: PixelPosition
  confidence: number
  wasModified: boolean
  modificationReason?: string
}

/**
 * Layout decision metadata
 */
export interface LayoutDecisionMeta {
  actorRounds: number
  criticRounds: number
  totalDurationMs: number
  model: string
  source: 'ai' | 'fallback'
}

/**
 * Final synthesized layout decision
 */
export interface LayoutDecision {
  success: boolean
  confidenceScore: number
  finalPlacements: FinalElementPlacement[]
  textZoneAdjustments: TextZoneAdjustments
  compositionGuidance: string
  zoneReminderContext: string
  meta: LayoutDecisionMeta
  layoutNotes: string[]
}

// ============================================================
// FORMAT-SPECIFIC CONFIGURATION
// ============================================================

/**
 * Format-specific layout configuration
 */
export interface FormatLayoutConfig {
  formatId: string
  category: string

  // Zone reservations
  headerZone: { start: number; end: number }
  footerZone: { start: number; end: number }
  logoZone: { position: string; size: string }

  // Element hierarchy for this format
  elementPriority: LayoutElementType[]

  // Composition defaults
  defaultComposition: CompositionStyle
  defaultAlignment: 'center' | 'left' | 'right'

  // Speaker support
  supportsSpeakers: boolean
  maxSpeakers: number

  // Special constraints
  specialConstraints: string[]

  // Safe zones (for platform-specific cropping)
  safeZones?: ReservedZone[]
}

// ============================================================
// ACTOR-CRITIC ANALYSIS ROUND
// ============================================================

/**
 * Single round of Actor-Critic analysis
 */
export interface ActorCriticRound {
  roundNumber: number
  actor: ActorLayoutProposal
  critic: CriticLayoutReview
  hasViolations: boolean
  violationCount: number
}

/**
 * Complete Actor-Critic analysis result
 */
export interface ActorCriticAnalysisResult {
  rounds: ActorCriticRound[]
  finalProposal: ActorLayoutProposal
  finalReview: CriticLayoutReview
  synthesis: LayoutDecision
  totalRounds: number
  converged: boolean
}
