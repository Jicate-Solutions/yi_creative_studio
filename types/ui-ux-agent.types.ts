/**
 * UI/UX Ultra Agent - Type Definitions
 *
 * Comprehensive types for the AI-powered UI/UX design agent that supports:
 * - Actor-Critic dual-perspective analysis
 * - Design from scratch, redesign, component library modes
 * - Glassmorphism, shadows, animations styling
 * - Chrome DevTools live preview integration
 */

// ============================================================
// AGENT MODES & STYLE PREFERENCES
// ============================================================

/**
 * Agent operation modes
 */
export type AgentMode = 'design' | 'redesign' | 'analyze' | 'component-library'

/**
 * Glassmorphism intensity levels
 * Maps to CSS classes in globals.css
 */
export type GlassmorphismLevel = 'none' | 'subtle' | 'medium' | 'strong' | 'premium'

/**
 * Shadow elevation levels
 * Maps to elevation-1 through elevation-5 + shadow-premium
 */
export type ShadowLevel = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'premium'

/**
 * Animation complexity levels
 */
export type AnimationLevel = 'none' | 'minimal' | 'standard' | 'enhanced' | 'premium'

/**
 * Border style options
 */
export type BorderStyle = 'solid' | 'none' | 'gradient' | 'glow'

/**
 * Color scheme preference
 */
export type ColorScheme = 'brand' | 'neutral' | 'vibrant' | 'custom'

/**
 * Target viewport for responsive design
 */
export type TargetViewport = 'mobile' | 'tablet' | 'desktop' | 'all'

/**
 * Style preferences for component generation
 */
export interface StylePreferences {
  /** Glassmorphism intensity - maps to glass-* classes */
  glassmorphism: GlassmorphismLevel
  /** Shadow elevation level - maps to elevation-* classes */
  shadowLevel: ShadowLevel
  /** Animation complexity */
  animations: AnimationLevel
  /** Border treatment */
  borderStyle: BorderStyle
  /** Color palette preference */
  colorScheme: ColorScheme
  /** Custom color palette (when colorScheme is 'custom') */
  customColors?: {
    primary?: string
    secondary?: string
    accent?: string
  }
}

// ============================================================
// DESIGN CONSTRAINTS
// ============================================================

/**
 * Yi Brand color palette
 */
export interface YiBrandColors {
  /** Yi Blue - Primary (#005B96) */
  primary: string
  /** Yi Orange - Secondary (#FF6B35) */
  secondary: string
  /** Yi Green - Accent (#00A86B) */
  accent: string
  /** Yi Teal - Supporting (#1B998B) */
  teal: string
  /** Yi Gold - Premium (#D4AF37) */
  gold: string
  /** Yi Navy - Dark (#1a2332) */
  navy: string
}

/**
 * Accessibility requirements
 */
export interface AccessibilityRequirements {
  /** Minimum contrast ratio (WCAG AA = 4.5:1) */
  minContrastRatio: number
  /** Require visible focus indicators */
  focusIndicators: boolean
  /** Require keyboard navigation support */
  keyboardNav: boolean
  /** Require screen reader support */
  screenReaderSupport: boolean
}

/**
 * Design constraints applied to component generation
 * Follows priority hierarchy:
 * 1. MANDATORY: Brand colors, accessibility
 * 2. HIGH PRIORITY: Style preferences
 * 3. CREATIVE: AI suggestions
 */
export interface UIDesignConstraints {
  /** Mandatory: Yi brand colors */
  brandColors: YiBrandColors
  /** Mandatory: Accessibility requirements */
  accessibility: AccessibilityRequirements
  /** High Priority: User style preferences */
  stylePreferences: StylePreferences
  /** High Priority: Target viewport for design */
  targetViewport: TargetViewport
  /** Optional: Existing design system reference */
  designSystemRef?: string
}

// ============================================================
// ACTOR-CRITIC ANALYSIS
// ============================================================

/**
 * Actor perspective - Creative/UX focused
 */
export interface ActorPerspective {
  /** Overall creative vision for the component */
  creativeVision: string
  /** How users will interact with and experience the component */
  userExperience: string
  /** Emotional response the design should evoke */
  emotionalTone: string
  /** Innovative or unique design elements suggested */
  innovativeElements: string[]
}

/**
 * Critic perspective - Technical/Quality focused
 */
export interface CriticPerspective {
  /** Accessibility score (0-100) */
  accessibilityScore: number
  /** Performance impact assessment */
  performanceImpact: 'low' | 'medium' | 'high'
  /** Code maintainability assessment */
  maintainability: 'low' | 'medium' | 'high'
  /** Code quality assessment */
  codeQuality: string
  /** Suggested improvements */
  improvements: string[]
}

/**
 * Synthesis - Balanced recommendation
 */
export interface AnalysisSynthesis {
  /** Final balanced recommendation */
  recommendation: string
  /** Implementation priority */
  priority: 'must-have' | 'should-have' | 'nice-to-have'
  /** Implementation complexity estimate */
  implementationComplexity: 'simple' | 'moderate' | 'complex'
}

/**
 * Complete Actor-Critic analysis result
 */
export interface ActorCriticAnalysis {
  /** Actor perspective: Creative vision and UX */
  actor: ActorPerspective
  /** Critic perspective: Technical evaluation */
  critic: CriticPerspective
  /** Synthesis: Balanced recommendation */
  synthesis: AnalysisSynthesis
  /** Analysis metadata */
  meta: {
    /** Number of analysis rounds */
    rounds: number
    /** Analysis duration in milliseconds */
    durationMs: number
    /** Model used for analysis */
    model: string
  }
}

// ============================================================
// COMPONENT SPECIFICATION
// ============================================================

/**
 * Animation keyframe definition
 */
export interface AnimationKeyframes {
  /** Animation name */
  name: string
  /** CSS keyframes definition */
  keyframes: string
}

/**
 * Accessibility features in component
 */
export interface ComponentA11y {
  /** ARIA labels used */
  ariaLabels: string[]
  /** Keyboard shortcuts if any */
  keyboardShortcuts?: string[]
  /** Focus management description */
  focusManagement: string
}

/**
 * Generated component specification
 */
export interface ComponentSpec {
  /** Component name in PascalCase */
  name: string
  /** Component description */
  description: string
  /** File path relative to project root */
  filePath: string
  /** TypeScript props interface definition */
  propsInterface: string
  /** Complete TypeScript/React code */
  code: string
  /** Tailwind CSS classes used */
  tailwindClasses: string[]
  /** CSS custom properties used */
  cssVariables: string[]
  /** NPM dependencies required */
  dependencies: string[]
  /** shadcn/ui components used (e.g., '@shadcn/button') */
  shadcnComponents: string[]
  /** Custom animation keyframes if any */
  animations?: AnimationKeyframes[]
  /** Accessibility features */
  a11y: ComponentA11y
}

// ============================================================
// PREVIEW SESSION
// ============================================================

/**
 * Screenshot capture
 */
export interface PreviewScreenshot {
  /** Capture timestamp */
  timestamp: string
  /** Base64 encoded image */
  base64: string
  /** Description of what was captured */
  description: string
}

/**
 * DOM snapshot
 */
export interface PreviewSnapshot {
  /** Snapshot timestamp */
  timestamp: string
  /** Accessibility tree content */
  content: string
}

/**
 * User interaction record
 */
export interface PreviewInteraction {
  /** Action performed (click, fill, navigate, etc.) */
  action: string
  /** Target element if applicable */
  element?: string
  /** Interaction timestamp */
  timestamp: string
  /** Result of the interaction */
  result: string
}

/**
 * Chrome DevTools preview session state
 */
export interface PreviewSession {
  /** Unique session ID */
  id: string
  /** Preview URL */
  url: string
  /** Current viewport dimensions */
  viewport: {
    width: number
    height: number
  }
  /** Screenshots captured during session */
  screenshots: PreviewScreenshot[]
  /** DOM snapshots captured */
  snapshots: PreviewSnapshot[]
  /** Interaction history */
  interactions: PreviewInteraction[]
}

// ============================================================
// AGENT STATE
// ============================================================

/**
 * Agent workflow stages
 */
export type AgentStage =
  | 'idle'
  | 'analyzing'
  | 'designing'
  | 'previewing'
  | 'iterating'
  | 'complete'
  | 'error'

/**
 * Agent input from user
 */
export interface AgentInput {
  /** Description of what to design/redesign */
  description: string
  /** Existing component code (for redesign mode) */
  existingComponent?: string
  /** Target element selector (for preview-based redesign) */
  targetElement?: string
  /** Reference images for inspiration */
  referenceImages?: string[]
}

/**
 * Iteration record
 */
export interface IterationRecord {
  /** Version number */
  version: number
  /** Changes made in this iteration */
  changes: string
  /** Iteration timestamp */
  timestamp: string
}

/**
 * Usage tracking
 */
export interface AgentUsage {
  /** Total tokens used */
  totalTokens: number
  /** Total duration in milliseconds */
  totalDurationMs: number
  /** Number of API calls made */
  apiCalls: number
}

/**
 * Complete agent workflow state
 */
export interface AgentState {
  /** Current workflow stage */
  stage: AgentStage
  /** Current operation mode */
  mode: AgentMode
  /** User input */
  input: AgentInput
  /** Design constraints */
  constraints: UIDesignConstraints
  /** Actor-Critic analysis result */
  analysis?: ActorCriticAnalysis
  /** Generated component specifications */
  components: ComponentSpec[]
  /** Preview session if active */
  preview?: PreviewSession
  /** Iteration history */
  iterations: IterationRecord[]
  /** Error message if stage is 'error' */
  error?: string
  /** Usage statistics */
  usage: AgentUsage
}

// ============================================================
// API REQUEST/RESPONSE
// ============================================================

/**
 * API request body for UI/UX agent
 */
export interface UIUXAgentRequest {
  /** Operation mode */
  mode: AgentMode
  /** User description of what to design/redesign */
  description: string
  /** Style preferences (optional, uses defaults if not provided) */
  stylePreferences?: Partial<StylePreferences>
  /** Existing component code (for redesign mode) */
  existingComponent?: string
  /** Target element selector (for preview-based redesign) */
  targetElement?: string
  /** Reference component names from shadcn registry */
  referenceComponents?: string[]
  /** Target viewport for responsive design */
  targetViewport?: TargetViewport
  /** Enable Chrome DevTools live preview */
  enablePreview?: boolean
  /** Preview URL (required if enablePreview is true) */
  previewUrl?: string
}

/**
 * API response from UI/UX agent
 */
export interface UIUXAgentResponse {
  /** Whether the request was successful */
  success: boolean
  /** Complete agent state */
  state: AgentState
  /** Generated components (convenience access) */
  components: ComponentSpec[]
  /** Analysis summary (human-readable) */
  analysisSummary?: string
  /** Preview screenshots if preview was enabled */
  previewScreenshots?: string[]
  /** Suggested next actions */
  suggestedActions: string[]
  /** Usage statistics */
  usage: {
    inputTokens: number
    outputTokens: number
    model: string
    durationMs: number
  }
}

// ============================================================
// CONSTANTS
// ============================================================

/**
 * Default Yi brand colors
 */
export const YI_BRAND_COLORS: YiBrandColors = {
  primary: '#005B96',
  secondary: '#FF6B35',
  accent: '#00A86B',
  teal: '#1B998B',
  gold: '#D4AF37',
  navy: '#1a2332',
}

/**
 * Default style preferences
 */
export const DEFAULT_STYLE_PREFERENCES: StylePreferences = {
  glassmorphism: 'medium',
  shadowLevel: 'md',
  animations: 'standard',
  borderStyle: 'none',
  colorScheme: 'brand',
}

/**
 * Default accessibility requirements (WCAG AA)
 */
export const DEFAULT_ACCESSIBILITY: AccessibilityRequirements = {
  minContrastRatio: 4.5,
  focusIndicators: true,
  keyboardNav: true,
  screenReaderSupport: true,
}

/**
 * Glassmorphism CSS class mapping
 */
export const GLASSMORPHISM_CLASSES: Record<GlassmorphismLevel, string> = {
  none: '',
  subtle: 'glass-subtle',
  medium: 'glass-medium',
  strong: 'glass-strong',
  premium: 'glass-premium',
}

/**
 * Shadow elevation CSS class mapping
 */
export const SHADOW_CLASSES: Record<ShadowLevel, string> = {
  xs: 'elevation-1',
  sm: 'elevation-2',
  md: 'elevation-3',
  lg: 'elevation-4',
  xl: 'elevation-5',
  premium: 'shadow-premium',
}

/**
 * Animation utility classes
 */
export const ANIMATION_UTILITIES = {
  float: 'animate-float',
  shimmer: 'animate-shimmer',
  pulseSlow: 'animate-pulse-slow',
  fadeInUp: 'animate-fade-in-up',
  staggerIn: 'stagger-children',
  hoverLift: 'hover-lift',
  activePress: 'active-press',
} as const
