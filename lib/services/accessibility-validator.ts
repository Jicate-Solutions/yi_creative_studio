/**
 * Accessibility Validator Service
 * Orchestrates WCAG 2.1 compliance validation for creative designs
 * Validates colors, typography, and overall accessibility
 */

import { checkTextContrast, getWCAGLevel } from '@/lib/utils/accessibility/contrast'
import { checkTextReadability } from '@/lib/utils/accessibility/readability'
import { suggestAccessibleColors } from '@/lib/utils/accessibility/color-suggestions'
import type {
  AccessibilityReport,
  AccessibilityCheck,
  AccessibilityValidationContext,
  ContrastValidation,
  TypographyValidation,
  WCAGLevel,
} from '@/types/accessibility'

/**
 * Calculate overall accessibility score (0-100)
 * Based on number and severity of issues
 */
function calculateAccessibilityScore(checks: AccessibilityCheck[]): number {
  const totalChecks = checks.length
  if (totalChecks === 0) return 100

  // Weight scores by severity
  const severityWeights = {
    critical: 25,
    serious: 15,
    moderate: 8,
    minor: 3,
  }

  let totalDeductions = 0
  for (const check of checks) {
    if (check.status === 'fail') {
      totalDeductions += severityWeights[check.impact]
    } else if (check.status === 'warning') {
      totalDeductions += severityWeights[check.impact] * 0.5
    }
  }

  const score = Math.max(0, 100 - totalDeductions)
  return Math.round(score)
}

/**
 * Determine highest WCAG level achieved
 * Fixed: Now checks both contrast AND typography for AAA compliance
 */
function determineWCAGLevel(checks: AccessibilityCheck[]): WCAGLevel {
  const criticalFailures = checks.filter(c => c.status === 'fail' && c.impact === 'critical')
  const seriousFailures = checks.filter(c => c.status === 'fail' && c.impact === 'serious')

  // Any critical failures = no compliance
  if (criticalFailures.length > 0) return null

  // For AAA: Check BOTH contrast AND typography
  const contrastChecks = checks.filter(c => c.category === 'contrast')
  const typographyChecks = checks.filter(c => c.category === 'typography')

  const allContrastAAA = contrastChecks.every(c =>
    c.status === 'pass' && c.wcagCriterion.includes('Enhanced')
  )

  // Typography must also pass for AAA
  const allTypographyPass = typographyChecks.every(c => c.status === 'pass')

  if (allContrastAAA && allTypographyPass && seriousFailures.length === 0) {
    return 'AAA'
  }

  // For AA: Check if all contrast and typography meet AA standards
  const allContrastAA = contrastChecks.every(c => c.status === 'pass')
  if (allContrastAA && allTypographyPass && seriousFailures.length === 0) {
    return 'AA'
  }

  return null
}

/**
 * Validate color contrast for a specific element
 */
function validateColorContrast(
  foreground: string,
  background: string,
  elementName: string,
  isLargeText: boolean,
  targetLevel: 'AA' | 'AAA'
): AccessibilityCheck[] {
  const checks: AccessibilityCheck[] = []
  const result = checkTextContrast(foreground, background, isLargeText, targetLevel)

  if (!result.ratio) {
    checks.push({
      id: `contrast-${elementName}-invalid`,
      category: 'contrast',
      status: 'fail',
      message: `Invalid color format for ${elementName}`,
      impact: 'critical',
      wcagCriterion: '1.4.3 Contrast (Minimum)',
      currentValue: `${foreground} / ${background}`,
    })
    return checks
  }

  if (!result.passes) {
    const suggestions = suggestAccessibleColors(foreground, background, targetLevel, isLargeText)
    const suggestionText = suggestions.length > 0
      ? `Try ${suggestions[0].color} (${suggestions[0].description})`
      : 'Increase contrast by adjusting lightness'

    checks.push({
      id: `contrast-${elementName}`,
      category: 'contrast',
      status: 'fail',
      message: `${elementName} contrast is too low (${result.ratio}:1)`,
      impact: result.ratio && result.ratio < 3 ? 'critical' : 'serious',
      suggestion: suggestionText,
      wcagCriterion: targetLevel === 'AAA'
        ? '1.4.6 Contrast (Enhanced)'
        : '1.4.3 Contrast (Minimum)',
      currentValue: `${result.ratio}:1`,
      recommendedValue: targetLevel === 'AAA'
        ? (isLargeText ? '4.5:1' : '7:1')
        : (isLargeText ? '3:1' : '4.5:1'),
    })
  } else {
    checks.push({
      id: `contrast-${elementName}`,
      category: 'contrast',
      status: 'pass',
      message: `${elementName} has sufficient contrast (${result.ratio}:1)`,
      impact: 'minor',
      wcagCriterion: result.level === 'AAA'
        ? '1.4.6 Contrast (Enhanced)'
        : '1.4.3 Contrast (Minimum)',
      currentValue: `${result.ratio}:1`,
    })
  }

  return checks
}

/**
 * Validate typography for readability
 */
function validateTypography(
  fontSize: number,
  fontWeight: number | string | undefined,
  lineHeight: number | undefined,
  elementName: string,
  textType: 'body' | 'heading' | 'caption' | 'label'
): AccessibilityCheck[] {
  const checks: AccessibilityCheck[] = []
  const result = checkTextReadability({
    fontSize,
    fontWeight,
    lineHeight,
    textType,
  })

  if (!result.passes) {
    for (const issue of result.issues) {
      checks.push({
        id: `typography-${elementName}-${issue.message.replace(/\s/g, '-').toLowerCase()}`,
        category: 'typography',
        status: 'fail',
        message: `${elementName}: ${issue.message}`,
        impact: issue.severity,
        suggestion: result.suggestions[0] || 'Adjust font size and line height',
        wcagCriterion: '1.4.8 Visual Presentation',
        currentValue: issue.currentValue,
        recommendedValue: issue.recommendedValue,
      })
    }
  } else {
    checks.push({
      id: `typography-${elementName}`,
      category: 'typography',
      status: 'pass',
      message: `${elementName} typography meets readability standards`,
      impact: 'minor',
      wcagCriterion: '1.4.8 Visual Presentation',
      currentValue: `${fontSize}px`,
    })
  }

  return checks
}

/**
 * Validate design accessibility
 * Main entry point for accessibility validation
 *
 * @param context - Accessibility validation context with design data
 * @returns Complete accessibility report
 */
export function validateDesignAccessibility(
  context: AccessibilityValidationContext
): AccessibilityReport {
  const checks: AccessibilityCheck[] = []
  const targetLevel = context.targetLevel || 'AA'
  const backgroundColor = context.backgroundColor || '#FFFFFF'

  // Validate primary color contrast
  if (context.primaryColor) {
    checks.push(
      ...validateColorContrast(
        context.primaryColor,
        backgroundColor,
        'Primary color',
        false,
        targetLevel
      )
    )
  }

  // Validate secondary color contrast
  if (context.secondaryColor) {
    checks.push(
      ...validateColorContrast(
        context.secondaryColor,
        backgroundColor,
        'Secondary color',
        false,
        targetLevel
      )
    )
  }

  // Validate accent color contrast
  if (context.accentColor) {
    checks.push(
      ...validateColorContrast(
        context.accentColor,
        backgroundColor,
        'Accent color',
        false,
        targetLevel
      )
    )
  }

  // Validate title typography
  if (context.titleFont) {
    const isLargeText = context.titleFont.size >= 24 ||
      (context.titleFont.size >= 18.67 && (context.titleFont.weight === 'bold' || context.titleFont.weight === 700))

    checks.push(
      ...validateTypography(
        context.titleFont.size,
        context.titleFont.weight,
        context.titleFont.lineHeight,
        'Title',
        'heading'
      )
    )

    // Also check title color contrast if primary color is used
    if (context.primaryColor) {
      checks.push(
        ...validateColorContrast(
          context.primaryColor,
          backgroundColor,
          'Title text',
          isLargeText,
          targetLevel
        )
      )
    }
  }

  // Validate body typography
  if (context.bodyFont) {
    checks.push(
      ...validateTypography(
        context.bodyFont.size,
        context.bodyFont.weight,
        context.bodyFont.lineHeight,
        'Body',
        'body'
      )
    )
  }

  // Calculate metrics
  const overallScore = calculateAccessibilityScore(checks)
  const wcagLevel = determineWCAGLevel(checks)

  const criticalIssues = checks.filter(c => c.status === 'fail' && c.impact === 'critical').length
  const seriousIssues = checks.filter(c => c.status === 'fail' && c.impact === 'serious').length
  const moderateIssues = checks.filter(c => c.status === 'fail' && c.impact === 'moderate').length
  const minorIssues = checks.filter(c => c.status === 'fail' && c.impact === 'minor').length

  const allPassed = checks.every(c => c.status === 'pass')

  return {
    overallScore,
    wcagLevel,
    checks,
    timestamp: new Date().toISOString(),
    criticalIssues,
    seriousIssues,
    moderateIssues,
    minorIssues,
    allPassed,
  }
}

/**
 * Quick validation check (returns boolean)
 * For simple pass/fail checks
 */
export function isAccessible(
  context: AccessibilityValidationContext,
  minimumScore = 70
): boolean {
  const report = validateDesignAccessibility(context)
  return report.overallScore >= minimumScore && report.criticalIssues === 0
}

/**
 * Get critical issues only
 * For blocking generation on critical failures
 */
export function getCriticalIssues(context: AccessibilityValidationContext): AccessibilityCheck[] {
  const report = validateDesignAccessibility(context)
  return report.checks.filter(c => c.status === 'fail' && c.impact === 'critical')
}
