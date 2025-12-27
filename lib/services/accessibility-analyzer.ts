/**
 * Accessibility Analyzer Service
 * Deep analysis and auto-fix for accessibility issues
 * Automatically adjusts colors and typography to meet WCAG standards
 */

import { validateDesignAccessibility, getCriticalIssues } from './accessibility-validator'
import { suggestAccessibleColor } from '@/lib/utils/accessibility/color-suggestions'
import { autoFixTextReadability } from '@/lib/utils/accessibility/readability'
import type {
  AccessibilityValidationContext,
  AccessibilityReport,
  AutoFixResult,
} from '@/types/accessibility'

/**
 * Analyze creative accessibility
 * Provides detailed analysis with actionable recommendations
 *
 * @param context - Design context to analyze
 * @returns Comprehensive accessibility report with recommendations
 */
export function analyzeCreativeAccessibility(
  context: AccessibilityValidationContext
): AccessibilityReport & { recommendations: string[] } {
  const report = validateDesignAccessibility(context)
  const recommendations: string[] = []

  // Generate actionable recommendations based on issues
  for (const check of report.checks) {
    if (check.status === 'fail' && check.suggestion) {
      recommendations.push(check.suggestion)
    }
  }

  // Add general recommendations based on score
  if (report.overallScore < 50) {
    recommendations.push(
      'Consider enabling auto-fix to automatically adjust colors and typography for better accessibility'
    )
  }

  if (report.wcagLevel === null) {
    recommendations.push(
      'This design does not meet minimum WCAG standards. Critical issues must be resolved.'
    )
  } else if (report.wcagLevel === 'AA') {
    recommendations.push(
      'Good! This design meets WCAG AA standards. Consider aiming for AAA for even better accessibility.'
    )
  } else if (report.wcagLevel === 'AAA') {
    recommendations.push(
      'Excellent! This design meets the highest WCAG AAA standards.'
    )
  }

  return {
    ...report,
    recommendations: Array.from(new Set(recommendations)), // Remove duplicates
  }
}

/**
 * Auto-fix design for accessibility
 * Automatically adjusts colors and typography to meet WCAG standards
 *
 * @param context - Design context to fix
 * @param targetLevel - Target WCAG level ('AA' or 'AAA')
 * @returns Fixed design context and change log
 */
export function autoFixDesign(
  context: AccessibilityValidationContext,
  targetLevel: 'AA' | 'AAA' = 'AA'
): AutoFixResult {
  const original: Record<string, string | number> = {}
  const fixed: Record<string, string | number> = {}
  const changes: AutoFixResult['changes'] = []

  const backgroundColor = context.backgroundColor || '#FFFFFF'
  let appliedFixes = false

  // Fix primary color if needed
  if (context.primaryColor) {
    original.primaryColor = context.primaryColor
    const fixedPrimary = suggestAccessibleColor(
      context.primaryColor,
      backgroundColor,
      targetLevel,
      false,
      true
    )

    if (fixedPrimary && fixedPrimary !== context.primaryColor) {
      fixed.primaryColor = fixedPrimary
      changes.push({
        property: 'primaryColor',
        from: context.primaryColor,
        to: fixedPrimary,
        reason: `Adjusted to meet WCAG ${targetLevel} contrast requirements`,
      })
      context.primaryColor = fixedPrimary
      appliedFixes = true
    } else {
      fixed.primaryColor = context.primaryColor
    }
  }

  // Fix secondary color if needed
  if (context.secondaryColor) {
    original.secondaryColor = context.secondaryColor
    const fixedSecondary = suggestAccessibleColor(
      context.secondaryColor,
      backgroundColor,
      targetLevel,
      false,
      true
    )

    if (fixedSecondary && fixedSecondary !== context.secondaryColor) {
      fixed.secondaryColor = fixedSecondary
      changes.push({
        property: 'secondaryColor',
        from: context.secondaryColor,
        to: fixedSecondary,
        reason: `Adjusted to meet WCAG ${targetLevel} contrast requirements`,
      })
      context.secondaryColor = fixedSecondary
      appliedFixes = true
    } else {
      fixed.secondaryColor = context.secondaryColor
    }
  }

  // Fix accent color if needed
  if (context.accentColor) {
    original.accentColor = context.accentColor
    const fixedAccent = suggestAccessibleColor(
      context.accentColor,
      backgroundColor,
      targetLevel,
      false,
      true
    )

    if (fixedAccent && fixedAccent !== context.accentColor) {
      fixed.accentColor = fixedAccent
      changes.push({
        property: 'accentColor',
        from: context.accentColor,
        to: fixedAccent,
        reason: `Adjusted to meet WCAG ${targetLevel} contrast requirements`,
      })
      context.accentColor = fixedAccent
      appliedFixes = true
    } else {
      fixed.accentColor = context.accentColor
    }
  }

  // Fix title typography if needed
  if (context.titleFont) {
    original.titleFontSize = context.titleFont.size
    if (context.titleFont.lineHeight) {
      original.titleLineHeight = context.titleFont.lineHeight
    }

    const fixedTitleFont = autoFixTextReadability({
      fontSize: context.titleFont.size,
      fontWeight: context.titleFont.weight,
      lineHeight: context.titleFont.lineHeight,
      textType: 'heading',
    })

    if (fixedTitleFont.fontSize !== context.titleFont.size) {
      fixed.titleFontSize = fixedTitleFont.fontSize
      changes.push({
        property: 'titleFont.size',
        from: context.titleFont.size,
        to: fixedTitleFont.fontSize,
        reason: 'Increased to meet minimum readable font size for headings',
      })
      context.titleFont.size = fixedTitleFont.fontSize
      appliedFixes = true
    } else {
      fixed.titleFontSize = context.titleFont.size
    }

    if (fixedTitleFont.lineHeight !== context.titleFont.lineHeight) {
      fixed.titleLineHeight = fixedTitleFont.lineHeight || 1.5
      changes.push({
        property: 'titleFont.lineHeight',
        from: context.titleFont.lineHeight || 'default',
        to: fixedTitleFont.lineHeight || 1.5,
        reason: 'Adjusted to meet minimum line height for readability',
      })
      context.titleFont.lineHeight = fixedTitleFont.lineHeight
      appliedFixes = true
    } else if (fixedTitleFont.lineHeight) {
      fixed.titleLineHeight = fixedTitleFont.lineHeight
    }
  }

  // Fix body typography if needed
  if (context.bodyFont) {
    original.bodyFontSize = context.bodyFont.size
    if (context.bodyFont.lineHeight) {
      original.bodyLineHeight = context.bodyFont.lineHeight
    }

    const fixedBodyFont = autoFixTextReadability({
      fontSize: context.bodyFont.size,
      fontWeight: context.bodyFont.weight,
      lineHeight: context.bodyFont.lineHeight,
      textType: 'body',
    })

    if (fixedBodyFont.fontSize !== context.bodyFont.size) {
      fixed.bodyFontSize = fixedBodyFont.fontSize
      changes.push({
        property: 'bodyFont.size',
        from: context.bodyFont.size,
        to: fixedBodyFont.fontSize,
        reason: 'Increased to meet minimum readable font size for body text',
      })
      context.bodyFont.size = fixedBodyFont.fontSize
      appliedFixes = true
    } else {
      fixed.bodyFontSize = context.bodyFont.size
    }

    if (fixedBodyFont.lineHeight !== context.bodyFont.lineHeight) {
      fixed.bodyLineHeight = fixedBodyFont.lineHeight || 1.5
      changes.push({
        property: 'bodyFont.lineHeight',
        from: context.bodyFont.lineHeight || 'default',
        to: fixedBodyFont.lineHeight || 1.5,
        reason: 'Adjusted to meet minimum line height for readability',
      })
      context.bodyFont.lineHeight = fixedBodyFont.lineHeight
      appliedFixes = true
    } else if (fixedBodyFont.lineHeight) {
      fixed.bodyLineHeight = fixedBodyFont.lineHeight
    }
  }

  // Calculate new score after fixes
  const newReport = validateDesignAccessibility(context)
  const newScore = newReport.overallScore

  return {
    applied: appliedFixes,
    original,
    fixed,
    changes,
    newScore,
  }
}

/**
 * Validate and auto-fix if necessary
 * Convenience function that validates, and auto-fixes if score is too low
 *
 * @param context - Design context
 * @param options - Validation options
 * @returns Validation report and auto-fix result if applied
 */
export function validateAndFix(
  context: AccessibilityValidationContext,
  options: {
    autoFix?: boolean
    minimumScore?: number
    targetLevel?: 'AA' | 'AAA'
  } = {}
): {
  report: AccessibilityReport
  autoFixResult?: AutoFixResult
  fixed: boolean
} {
  const { autoFix = false, minimumScore = 70, targetLevel = 'AA' } = options

  // Initial validation
  let report = validateDesignAccessibility(context)

  // Check if auto-fix is needed
  if (autoFix && (report.overallScore < minimumScore || report.criticalIssues > 0)) {
    const autoFixResult = autoFixDesign(context, targetLevel)

    // Re-validate after fixes
    report = validateDesignAccessibility(context)

    return {
      report,
      autoFixResult,
      fixed: autoFixResult.applied,
    }
  }

  return {
    report,
    fixed: false,
  }
}

/**
 * Check if design needs accessibility improvements
 *
 * @param context - Design context
 * @param minimumScore - Minimum acceptable score (default: 70)
 * @returns true if improvements are needed
 */
export function needsAccessibilityImprovements(
  context: AccessibilityValidationContext,
  minimumScore = 70
): boolean {
  const report = validateDesignAccessibility(context)
  return report.overallScore < minimumScore || report.criticalIssues > 0
}

/**
 * Get accessibility improvement preview
 * Shows what would happen if auto-fix is applied (without actually applying)
 *
 * @param context - Design context
 * @param targetLevel - Target WCAG level
 * @returns Preview of changes that would be made
 */
export function previewAccessibilityFixes(
  context: AccessibilityValidationContext,
  targetLevel: 'AA' | 'AAA' = 'AA'
): {
  currentScore: number
  projectedScore: number
  changes: AutoFixResult['changes']
} {
  const currentReport = validateDesignAccessibility(context)

  // Create a copy of context to test fixes without modifying original
  const testContext = JSON.parse(JSON.stringify(context))
  const autoFixResult = autoFixDesign(testContext, targetLevel)

  return {
    currentScore: currentReport.overallScore,
    projectedScore: autoFixResult.newScore,
    changes: autoFixResult.changes,
  }
}
