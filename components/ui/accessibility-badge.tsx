'use client'

/**
 * Accessibility Badge Component
 * Displays WCAG compliance level and accessibility score
 * Color-coded: Green (AAA), Blue (AA), Yellow (A), Red (FAIL)
 */

import { Shield, ShieldAlert, ShieldCheck, ShieldX } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { WCAGLevel } from '@/types/accessibility'

export interface AccessibilityBadgeProps {
  /** WCAG compliance level */
  level: WCAGLevel
  /** Accessibility score (0-100) */
  score: number
  /** Display variant */
  variant?: 'default' | 'compact' | 'detailed'
  /** Whether to show the score */
  showScore?: boolean
  /** Additional CSS classes */
  className?: string
  /** Click handler */
  onClick?: () => void
}

export function AccessibilityBadge({
  level,
  score,
  variant = 'default',
  showScore = true,
  className,
  onClick,
}: AccessibilityBadgeProps) {
  // Determine styling based on level
  const getLevelConfig = () => {
    switch (level) {
      case 'AAA':
        return {
          color: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800',
          icon: ShieldCheck,
          label: 'WCAG AAA',
          description: 'Excellent accessibility',
        }
      case 'AA':
        return {
          color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800',
          icon: Shield,
          label: 'WCAG AA',
          description: 'Good accessibility',
        }
      case 'A':
        return {
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-400 dark:border-yellow-800',
          icon: ShieldAlert,
          label: 'WCAG A',
          description: 'Basic accessibility',
        }
      default:
        return {
          color: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800',
          icon: ShieldX,
          label: 'Not Compliant',
          description: 'Fails WCAG standards',
        }
    }
  }

  const config = getLevelConfig()
  const Icon = config.icon

  // Compact variant (just level badge)
  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold',
          config.color,
          onClick && 'cursor-pointer hover:opacity-80',
          className
        )}
        onClick={onClick}
      >
        <Icon className="h-3 w-3" />
        <span>{config.label}</span>
      </div>
    )
  }

  // Detailed variant (with description)
  if (variant === 'detailed') {
    return (
      <div
        className={cn(
          'inline-flex flex-col gap-1 rounded-lg border p-3',
          config.color,
          onClick && 'cursor-pointer hover:opacity-80',
          className
        )}
        onClick={onClick}
      >
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" />
          <span className="font-semibold">{config.label}</span>
          {showScore && (
            <span className="ml-auto font-mono text-sm">
              {score}/100
            </span>
          )}
        </div>
        <p className="text-xs opacity-90">{config.description}</p>
      </div>
    )
  }

  // Default variant
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium',
        config.color,
        onClick && 'cursor-pointer hover:opacity-80',
        className
      )}
      onClick={onClick}
    >
      <Icon className="h-4 w-4" />
      <span>{config.label}</span>
      {showScore && (
        <>
          <span className="opacity-50">•</span>
          <span className="font-mono">{score}/100</span>
        </>
      )}
    </div>
  )
}

/**
 * Score indicator with color gradient
 */
export function AccessibilityScore({ score }: { score: number }) {
  const getScoreColor = () => {
    if (score >= 90) return 'text-green-600 dark:text-green-400'
    if (score >= 70) return 'text-blue-600 dark:text-blue-400'
    if (score >= 50) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-32 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className={cn(
            'h-full transition-all duration-500',
            score >= 90 && 'bg-green-500',
            score >= 70 && score < 90 && 'bg-blue-500',
            score >= 50 && score < 70 && 'bg-yellow-500',
            score < 50 && 'bg-red-500'
          )}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={cn('font-mono text-sm font-medium', getScoreColor())}>
        {score}/100
      </span>
    </div>
  )
}
