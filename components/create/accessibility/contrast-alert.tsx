'use client'

/**
 * Contrast Alert Component
 * Real-time warning for low color contrast with suggested fixes
 * Displays when colors don't meet WCAG contrast requirements
 */

import { AlertTriangle, Check } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { checkTextContrast } from '@/lib/utils/accessibility/contrast'
import { suggestAccessibleColors } from '@/lib/utils/accessibility/color-suggestions'

interface ContrastAlertProps {
  /** Foreground color (text) in HEX */
  foreground: string
  /** Background color in HEX */
  background: string
  /** Whether the text is large (≥18pt or ≥14pt bold) */
  isLargeText?: boolean
  /** Target WCAG level */
  targetLevel?: 'AA' | 'AAA'
  /** Callback when user accepts suggestion */
  onApplySuggestion?: (suggestedColor: string) => void
  /** Label for the color being checked (e.g., "Primary color") */
  colorLabel?: string
  /** Whether to show in compact mode */
  compact?: boolean
}

export function ContrastAlert({
  foreground,
  background,
  isLargeText = false,
  targetLevel = 'AA',
  onApplySuggestion,
  colorLabel = 'This color',
  compact = false,
}: ContrastAlertProps) {
  // Check contrast
  const contrastResult = checkTextContrast(foreground, background, isLargeText, targetLevel)

  // If contrast is sufficient, show success message (optional)
  if (contrastResult.passes) {
    if (compact) return null

    return (
      <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
        <Check className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-800 dark:text-green-400">
          Good contrast
        </AlertTitle>
        <AlertDescription className="text-green-700 dark:text-green-500">
          {colorLabel} has sufficient contrast ({contrastResult.ratio}:1) and meets WCAG{' '}
          {contrastResult.level} standards.
        </AlertDescription>
      </Alert>
    )
  }

  // Get suggested accessible colors
  const suggestions = suggestAccessibleColors(foreground, background, targetLevel, isLargeText)
  const topSuggestion = suggestions[0]

  // Calculate required ratio
  const requiredRatio =
    targetLevel === 'AAA' ? (isLargeText ? '4.5:1' : '7:1') : isLargeText ? '3:1' : '4.5:1'

  return (
    <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertTitle className="text-amber-800 dark:text-amber-400">
        Low contrast detected
      </AlertTitle>
      <AlertDescription className="space-y-3 text-amber-700 dark:text-amber-500">
        <p>
          {colorLabel} has insufficient contrast for {targetLevel} compliance.
        </p>

        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium">Current:</span>
          <span className="rounded bg-white px-2 py-1 font-mono text-xs text-gray-900">
            {contrastResult.ratio}:1
          </span>
          <span className="text-amber-600">→</span>
          <span className="font-medium">Required:</span>
          <span className="rounded bg-white px-2 py-1 font-mono text-xs text-gray-900">
            {requiredRatio}
          </span>
        </div>

        {topSuggestion && onApplySuggestion && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Suggested fix:</p>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div
                  className="h-8 w-8 rounded border border-gray-300"
                  style={{ backgroundColor: foreground }}
                  title={`Current: ${foreground}`}
                />
                <span className="text-xs text-gray-500">→</span>
                <div
                  className="h-8 w-8 rounded border border-gray-300"
                  style={{ backgroundColor: topSuggestion.color }}
                  title={`Suggested: ${topSuggestion.color}`}
                />
              </div>

              <Button
                size="sm"
                onClick={() => onApplySuggestion(topSuggestion.color)}
                className="ml-auto"
              >
                Use {topSuggestion.color}
              </Button>
            </div>

            <p className="text-xs">
              {topSuggestion.description} ({topSuggestion.contrastRatio.toFixed(2)}:1 contrast)
            </p>
          </div>
        )}

        {!topSuggestion && (
          <p className="text-sm">
            Try increasing the lightness difference between the text and background colors.
          </p>
        )}
      </AlertDescription>
    </Alert>
  )
}

/**
 * Compact version - just icon and ratio
 */
export function ContrastIndicator({
  foreground,
  background,
  isLargeText = false,
  targetLevel = 'AA',
}: Pick<ContrastAlertProps, 'foreground' | 'background' | 'isLargeText' | 'targetLevel'>) {
  const contrastResult = checkTextContrast(foreground, background, isLargeText, targetLevel)

  if (!contrastResult.ratio) return null

  const passes = contrastResult.passes

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium ${
        passes
          ? 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400'
          : 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
      }`}
    >
      {passes ? (
        <Check className="h-3 w-3" />
      ) : (
        <AlertTriangle className="h-3 w-3" />
      )}
      <span>{contrastResult.ratio}:1</span>
      {contrastResult.level && (
        <span className="ml-1 opacity-75">({contrastResult.level})</span>
      )}
    </div>
  )
}
