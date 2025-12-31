'use client'

import { useState, useMemo } from 'react'
import { ChevronDown, ChevronUp, Check, AlertCircle } from 'lucide-react'
import * as Icons from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

// ============================================================================
// Types
// ============================================================================

interface FormSectionProps {
  /** Section title */
  title: string
  /** Lucide icon name */
  icon: string
  /** Description shown in header */
  description?: string
  /** Whether section starts expanded */
  defaultExpanded?: boolean
  /** Number of fields with values */
  completedFields?: number
  /** Total number of required fields in section */
  requiredFields?: number
  /** Total number of fields in section */
  totalFields?: number
  /** Section content (form fields) */
  children: React.ReactNode
  /** Custom class names */
  className?: string
  /** Section ID for tracking */
  sectionId?: string
  /** Whether section has validation errors */
  hasErrors?: boolean
}

// ============================================================================
// Component
// ============================================================================

export function FormSection({
  title,
  icon,
  description,
  defaultExpanded = false,
  completedFields = 0,
  requiredFields = 0,
  totalFields = 0,
  children,
  className,
  sectionId,
  hasErrors = false,
}: FormSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  // Get icon component dynamically
  const IconComponent = useMemo(() => {
    const iconMap = Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>
    return iconMap[icon] || Icons.FileText
  }, [icon])

  // Calculate completion state
  const isComplete = requiredFields > 0 && completedFields >= requiredFields
  const hasProgress = completedFields > 0
  const isEmpty = totalFields === 0

  // Progress percentage for visual indicator
  const progressPercent = requiredFields > 0
    ? Math.min(100, Math.round((completedFields / requiredFields) * 100))
    : totalFields > 0
      ? Math.min(100, Math.round((completedFields / totalFields) * 100))
      : 0

  return (
    <div
      className={cn(
        'rounded-xl transition-all duration-200 overflow-hidden',
        isExpanded
          ? 'bg-card shadow-md ring-2 ring-primary/20'
          : 'bg-card/50 shadow-sm hover:shadow-md',
        isComplete && !hasErrors && 'ring-2 ring-green-500/30 bg-green-50/30',
        hasErrors && 'ring-2 ring-destructive/30 bg-destructive/5',
        className
      )}
      data-section-id={sectionId}
    >
      {/* Header - Always visible */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'w-full px-4 py-2 flex items-center justify-between transition-colors',
          'hover:bg-muted/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset',
          isExpanded && 'border-b border-border/30'
        )}
        aria-expanded={isExpanded}
        aria-controls={sectionId ? `${sectionId}-content` : undefined}
      >
        <div className="flex items-center gap-3">
          {/* Icon container with state indicator */}
          <div
            className={cn(
              'p-2 rounded-lg transition-colors',
              isComplete && !hasErrors
                ? 'bg-green-100 text-green-600'
                : hasErrors
                  ? 'bg-destructive/10 text-destructive'
                  : hasProgress
                    ? 'bg-amber-100 text-amber-600'
                    : 'bg-primary/10 text-primary'
            )}
          >
            {isComplete && !hasErrors ? (
              <Check className="h-4 w-4" />
            ) : hasErrors ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <IconComponent className="h-4 w-4" />
            )}
          </div>

          {/* Title and description */}
          <div className="text-left">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              {title}
              {requiredFields > 0 && (
                <span className="text-destructive text-sm">*</span>
              )}
            </h3>
            {description && !isExpanded && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                {description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Progress indicator */}
          {!isEmpty && (
            <Badge
              variant="outline"
              className={cn(
                'text-xs px-2 py-0.5 font-medium transition-colors',
                isComplete && !hasErrors
                  ? 'bg-green-100 text-green-700 border-green-200'
                  : hasErrors
                    ? 'bg-destructive/10 text-destructive border-destructive/20'
                    : hasProgress
                      ? 'bg-amber-100 text-amber-700 border-amber-200'
                      : 'bg-muted text-muted-foreground'
              )}
            >
              {requiredFields > 0 ? (
                <>
                  {completedFields}/{requiredFields}
                  {isComplete && ' complete'}
                </>
              ) : (
                <>
                  {completedFields}/{totalFields} filled
                </>
              )}
            </Badge>
          )}

          {/* Optional badge */}
          {isEmpty && !requiredFields && (
            <Badge variant="outline" className="text-xs text-muted-foreground">
              Optional
            </Badge>
          )}

          {/* Chevron */}
          <div className="text-muted-foreground">
            {isExpanded ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </div>
        </div>
      </button>

      {/* Content - Collapsible */}
      {isExpanded && (
        <div
          id={sectionId ? `${sectionId}-content` : undefined}
          className="px-4 pb-3 pt-3"
        >
          {/* Progress bar for sections with multiple fields */}
          {requiredFields > 1 && (
            <div className="mb-4">
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full transition-all duration-300 rounded-full',
                    isComplete && !hasErrors
                      ? 'bg-green-500'
                      : hasErrors
                        ? 'bg-destructive'
                        : hasProgress
                          ? 'bg-amber-500'
                          : 'bg-primary'
                  )}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Form fields grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {children}
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Exports
// ============================================================================

export default FormSection
