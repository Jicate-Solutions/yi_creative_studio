'use client'

import { forwardRef, useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Check, X, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SuggestableField } from '@/types/suggestions'

interface AISuggestionFieldProps {
  field: SuggestableField
  label: string
  value: string
  suggestion: { value: string; confidence: number } | null
  onChange: (value: string) => void
  onAccept: () => void
  onDismiss: () => void
  isLoading?: boolean
  placeholder?: string
  multiline?: boolean
  className?: string
}

export const AISuggestionField = forwardRef<
  HTMLInputElement | HTMLTextAreaElement,
  AISuggestionFieldProps
>(
  (
    {
      field,
      label,
      value,
      suggestion,
      onChange,
      onAccept,
      onDismiss,
      isLoading = false,
      placeholder,
      multiline = false,
      className,
    },
    ref
  ) => {
    const [showSuggestion, setShowSuggestion] = useState(false)

    // Show suggestion when it arrives and field is empty
    useEffect(() => {
      if (suggestion && !value) {
        setShowSuggestion(true)
      } else if (!suggestion) {
        setShowSuggestion(false)
      }
    }, [suggestion, value])

    const handleAccept = () => {
      if (suggestion) {
        onChange(suggestion.value)
        onAccept()
        setShowSuggestion(false)
      }
    }

    const handleDismiss = () => {
      onDismiss()
      setShowSuggestion(false)
    }

    const handleChange = (newValue: string) => {
      onChange(newValue)
      // If user starts typing, hide the suggestion ghost text
      if (newValue && suggestion) {
        setShowSuggestion(false)
      }
    }

    const confidenceColor =
      suggestion?.confidence && suggestion.confidence >= 0.7
        ? 'text-green-600'
        : suggestion?.confidence && suggestion.confidence >= 0.5
          ? 'text-yellow-600'
          : 'text-gray-400'

    const InputComponent = multiline ? Textarea : Input

    return (
      <div className={cn('space-y-2', className)}>
        <div className="flex items-center justify-between">
          <Label htmlFor={field} className="text-sm font-medium">
            {label}
          </Label>
          {suggestion && showSuggestion && (
            <div className="flex items-center gap-1 text-xs">
              <Sparkles className="h-3 w-3 text-purple-500" />
              <span className={confidenceColor}>
                {Math.round((suggestion.confidence || 0) * 100)}% confident
              </span>
            </div>
          )}
        </div>

        <div className="relative">
          {/* Ghost text suggestion layer */}
          {showSuggestion && suggestion && !value && (
            <div
              className={cn(
                'absolute inset-0 pointer-events-none px-3 py-2 text-muted-foreground/50 italic',
                multiline ? 'min-h-[80px]' : ''
              )}
            >
              {suggestion.value}
            </div>
          )}

          {/* Actual input */}
          <InputComponent
            ref={ref as React.Ref<HTMLInputElement & HTMLTextAreaElement>}
            id={field}
            name={field}
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={showSuggestion && suggestion ? '' : placeholder}
            className={cn(
              'relative z-10',
              showSuggestion && suggestion && !value ? 'bg-transparent' : '',
              isLoading ? 'animate-pulse' : ''
            )}
            disabled={isLoading}
            rows={multiline ? 3 : undefined}
          />

          {/* Loading shimmer */}
          {isLoading && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-200/50 to-transparent animate-shimmer" />
          )}
        </div>

        {/* Accept/Dismiss buttons */}
        {showSuggestion && suggestion && !value && (
          <div className="flex items-center gap-2 pt-1">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleAccept}
              className="h-7 px-2 text-xs bg-green-50 border-green-200 hover:bg-green-100 text-green-700"
            >
              <Check className="h-3 w-3 mr-1" />
              Accept
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={handleDismiss}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3 mr-1" />
              Dismiss
            </Button>
            <button
              type="button"
              onClick={handleAccept}
              className="text-xs text-muted-foreground hover:text-foreground ml-auto"
            >
              Press Tab to accept
            </button>
          </div>
        )}
      </div>
    )
  }
)

AISuggestionField.displayName = 'AISuggestionField'

// Bulk actions component for accept/dismiss all
interface AISuggestionActionsProps {
  hasSuggestions: boolean
  onAcceptAll: () => void
  onDismissAll: () => void
  isLoading?: boolean
}

export function AISuggestionActions({
  hasSuggestions,
  onAcceptAll,
  onDismissAll,
  isLoading = false,
}: AISuggestionActionsProps) {
  if (!hasSuggestions || isLoading) return null

  return (
    <div className="flex items-center justify-end gap-2 py-2 px-1 border-t border-dashed border-purple-200 bg-purple-50/50 rounded-b-lg">
      <span className="text-xs text-purple-600 flex items-center gap-1 mr-auto">
        <Sparkles className="h-3 w-3" />
        AI Suggestions available
      </span>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={onAcceptAll}
        className="h-7 px-3 text-xs bg-green-50 border-green-200 hover:bg-green-100 text-green-700"
      >
        <Check className="h-3 w-3 mr-1" />
        Accept All
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={onDismissAll}
        className="h-7 px-3 text-xs"
      >
        <X className="h-3 w-3 mr-1" />
        Dismiss All
      </Button>
    </div>
  )
}

// Magic wand button to trigger AI suggestions
interface AITriggerButtonProps {
  onClick: () => void
  isLoading?: boolean
  disabled?: boolean
  className?: string
}

export function AITriggerButton({
  onClick,
  isLoading = false,
  disabled = false,
  className,
}: AITriggerButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={onClick}
      disabled={disabled || isLoading}
      className={cn(
        'h-10 w-10 shrink-0 border-purple-200 hover:bg-purple-50 hover:border-purple-300',
        isLoading ? 'animate-pulse' : '',
        className
      )}
      title="Get AI suggestions for form fields"
      aria-label="Get AI suggestions"
    >
      <Sparkles
        className={cn(
          'h-4 w-4 text-purple-500',
          isLoading ? 'animate-spin' : ''
        )}
      />
    </Button>
  )
}
