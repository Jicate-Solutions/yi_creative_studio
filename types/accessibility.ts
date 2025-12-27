/**
 * Accessibility Type Definitions
 * Type definitions for WCAG 2.1 compliance validation and reporting
 */

/**
 * WCAG Compliance Level
 */
export type WCAGLevel = 'AAA' | 'AA' | 'A' | null

/**
 * Accessibility Check Category
 */
export type AccessibilityCategory =
  | 'contrast'
  | 'typography'
  | 'color-blindness'
  | 'readability'
  | 'layout'

/**
 * Check Status
 */
export type CheckStatus = 'pass' | 'warning' | 'fail'

/**
 * Impact Severity
 */
export type ImpactSeverity = 'critical' | 'serious' | 'moderate' | 'minor'

/**
 * Individual Accessibility Check
 */
export interface AccessibilityCheck {
  /** Unique identifier for this check */
  id: string

  /** Category of the check */
  category: AccessibilityCategory

  /** Status of the check */
  status: CheckStatus

  /** Human-readable message */
  message: string

  /** Impact severity */
  impact: ImpactSeverity

  /** Optional suggestion for fixing the issue */
  suggestion?: string

  /** WCAG Success Criterion (e.g., '1.4.3 Contrast (Minimum)') */
  wcagCriterion: string

  /** Current value that failed */
  currentValue?: string | number

  /** Recommended value */
  recommendedValue?: string | number
}

/**
 * Complete Accessibility Report
 */
export interface AccessibilityReport {
  /** Overall accessibility score (0-100) */
  overallScore: number

  /** Highest WCAG level achieved */
  wcagLevel: WCAGLevel

  /** Individual accessibility checks */
  checks: AccessibilityCheck[]

  /** Timestamp of the report */
  timestamp: string

  /** Number of critical issues */
  criticalIssues: number

  /** Number of serious issues */
  seriousIssues: number

  /** Number of moderate issues */
  moderateIssues: number

  /** Number of minor issues */
  minorIssues: number

  /** Whether all checks passed */
  allPassed: boolean
}

/**
 * Color Contrast Validation Result
 */
export interface ContrastValidation {
  /** Whether contrast meets requirements */
  passes: boolean

  /** Actual contrast ratio */
  ratio: number | null

  /** WCAG level achieved */
  level: WCAGLevel

  /** Foreground color */
  foreground: string

  /** Background color */
  background: string

  /** Whether text is large */
  isLargeText: boolean

  /** Target WCAG level */
  targetLevel: 'AA' | 'AAA'

  /** Suggested accessible colors */
  suggestions?: Array<{
    color: string
    type: 'lighter' | 'darker' | 'inverted'
    contrastRatio: number
    description: string
  }>
}

/**
 * Typography Validation Result
 */
export interface TypographyValidation {
  /** Whether typography meets requirements */
  passes: boolean

  /** Font size validation */
  fontSize: {
    current: number
    minimum: number
    passes: boolean
  }

  /** Line height validation */
  lineHeight?: {
    current: number
    minimum: number
    passes: boolean
  }

  /** Font weight */
  fontWeight?: number

  /** Text type */
  textType?: 'body' | 'heading' | 'caption' | 'label'

  /** Issues found */
  issues: string[]

  /** Suggestions for improvement */
  suggestions: string[]
}

/**
 * Design Element for Accessibility Validation
 */
export interface DesignElement {
  /** Element type */
  type: 'text' | 'background' | 'accent'

  /** Color in HEX */
  color?: string

  /** Font size in pixels */
  fontSize?: number

  /** Font weight */
  fontWeight?: number | string

  /** Line height */
  lineHeight?: number

  /** Background color (for contrast checks) */
  backgroundColor?: string

  /** Whether this is large text */
  isLargeText?: boolean
}

/**
 * Accessibility Validation Context
 */
export interface AccessibilityValidationContext {
  /** Primary brand color */
  primaryColor?: string

  /** Secondary brand color */
  secondaryColor?: string

  /** Accent color */
  accentColor?: string

  /** Background color */
  backgroundColor?: string

  /** Title typography */
  titleFont?: {
    size: number
    weight?: number | string
    lineHeight?: number
  }

  /** Body typography */
  bodyFont?: {
    size: number
    weight?: number | string
    lineHeight?: number
  }

  /** Target WCAG level */
  targetLevel?: 'AA' | 'AAA'

  /** Whether to enforce validation (block generation on failure) */
  enforce?: boolean
}

/**
 * Organization Accessibility Settings
 */
export interface AccessibilitySettings {
  /** Target WCAG compliance level */
  targetLevel: 'AA' | 'AAA'

  /** Whether to enforce validation (block generation on critical failures) */
  enforceValidation: boolean

  /** Whether to auto-fix accessibility issues */
  autoFix: boolean

  /** Whether to show accessibility warnings */
  showWarnings: boolean

  /** Minimum contrast ratio override (if different from WCAG standard) */
  minimumContrastRatio?: number

  /** Minimum font size override */
  minimumFontSize?: number
}

/**
 * Auto-Fix Result
 */
export interface AutoFixResult {
  /** Whether auto-fix was applied */
  applied: boolean

  /** Original values */
  original: Record<string, string | number>

  /** Fixed values */
  fixed: Record<string, string | number>

  /** Changes made */
  changes: Array<{
    property: string
    from: string | number
    to: string | number
    reason: string
  }>

  /** New accessibility score after fixes */
  newScore: number
}

/**
 * Accessibility Badge Props
 */
export interface AccessibilityBadgeData {
  /** WCAG level */
  level: WCAGLevel

  /** Overall score */
  score: number

  /** Variant */
  variant?: 'default' | 'compact' | 'detailed'

  /** Whether to show score */
  showScore?: boolean
}
