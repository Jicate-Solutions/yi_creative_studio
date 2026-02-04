/**
 * Enhanced Form Field Component
 * Form field with inline validation icons and modern styling
 * Based on Modern Minimal design with inline icons for validation
 */

import * as React from 'react'
import { CheckCircle2, AlertCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

// Field state type
export type FieldState = 'idle' | 'valid' | 'invalid' | 'loading'

// Base props for all form fields
export interface BaseFormFieldProps {
  label: string
  helperText?: string
  error?: string
  state?: FieldState
  required?: boolean
  className?: string
  id?: string
}

// Input Field Props
export interface FormInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'id'>,
    BaseFormFieldProps {}

// Enhanced Input Field
export function FormInput({
  label,
  helperText,
  error,
  state = 'idle',
  required,
  className,
  id,
  ...props
}: FormInputProps) {
  const fieldId = id || `field-${label.toLowerCase().replace(/\s+/g, '-')}`
  const hasError = !!error || state === 'invalid'
  const isValid = state === 'valid'

  return (
    <div className={cn('space-y-2', className)}>
      {/* Label */}
      <Label
        htmlFor={fieldId}
        className="text-sm font-medium flex items-center gap-1"
      >
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>

      {/* Input with validation icon */}
      <div className="relative">
        <Input
          id={fieldId}
          className={cn(
            'pr-10 transition-all',
            hasError &&
              'border-destructive focus-visible:ring-destructive/20 focus-visible:border-destructive',
            isValid &&
              'border-green-500 focus-visible:ring-green-500/20 focus-visible:border-green-500'
          )}
          aria-invalid={hasError}
          aria-describedby={
            error ? `${fieldId}-error` : helperText ? `${fieldId}-helper` : undefined
          }
          {...props}
        />

        {/* Validation Icon */}
        {state !== 'idle' && state !== 'loading' && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            {isValid && (
              <CheckCircle2 className="h-5 w-5 text-green-500 animate-in fade-in zoom-in duration-200" />
            )}
            {hasError && (
              <AlertCircle className="h-5 w-5 text-destructive animate-in fade-in zoom-in duration-200" />
            )}
          </div>
        )}

        {/* Loading Spinner */}
        {state === 'loading' && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <p
          id={`${fieldId}-error`}
          className="text-sm text-destructive flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200"
        >
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </p>
      )}

      {/* Helper Text */}
      {helperText && !error && (
        <p
          id={`${fieldId}-helper`}
          className="text-sm text-muted-foreground flex items-center gap-1.5"
        >
          <Info className="h-4 w-4 flex-shrink-0 opacity-50" />
          <span>{helperText}</span>
        </p>
      )}
    </div>
  )
}

// Textarea Field Props
export interface FormTextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'>,
    BaseFormFieldProps {}

// Enhanced Textarea Field
export function FormTextarea({
  label,
  helperText,
  error,
  state = 'idle',
  required,
  className,
  id,
  ...props
}: FormTextareaProps) {
  const fieldId = id || `field-${label.toLowerCase().replace(/\s+/g, '-')}`
  const hasError = !!error || state === 'invalid'
  const isValid = state === 'valid'

  return (
    <div className={cn('space-y-2', className)}>
      {/* Label */}
      <Label
        htmlFor={fieldId}
        className="text-sm font-medium flex items-center gap-1"
      >
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>

      {/* Textarea with validation indicator */}
      <div className="relative">
        <Textarea
          id={fieldId}
          className={cn(
            'pr-10 transition-all',
            hasError &&
              'border-destructive focus-visible:ring-destructive/20 focus-visible:border-destructive',
            isValid &&
              'border-green-500 focus-visible:ring-green-500/20 focus-visible:border-green-500'
          )}
          aria-invalid={hasError}
          aria-describedby={
            error ? `${fieldId}-error` : helperText ? `${fieldId}-helper` : undefined
          }
          {...props}
        />

        {/* Validation Icon (Top Right) */}
        {state !== 'idle' && state !== 'loading' && (
          <div className="absolute right-3 top-3 pointer-events-none">
            {isValid && (
              <CheckCircle2 className="h-5 w-5 text-green-500 animate-in fade-in zoom-in duration-200" />
            )}
            {hasError && (
              <AlertCircle className="h-5 w-5 text-destructive animate-in fade-in zoom-in duration-200" />
            )}
          </div>
        )}

        {/* Loading Spinner */}
        {state === 'loading' && (
          <div className="absolute right-3 top-3">
            <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <p
          id={`${fieldId}-error`}
          className="text-sm text-destructive flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200"
        >
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </p>
      )}

      {/* Helper Text */}
      {helperText && !error && (
        <p
          id={`${fieldId}-helper`}
          className="text-sm text-muted-foreground flex items-center gap-1.5"
        >
          <Info className="h-4 w-4 flex-shrink-0 opacity-50" />
          <span>{helperText}</span>
        </p>
      )}
    </div>
  )
}

// Form Section Component
export interface FormSectionProps {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}

export function FormSection({
  title,
  description,
  children,
  className,
}: FormSectionProps) {
  return (
    <div className={cn('space-y-6', className)}>
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

// Form Actions (Save/Cancel buttons)
export interface FormActionsProps {
  onCancel?: () => void
  onSave?: () => void
  saveLabel?: string
  cancelLabel?: string
  isSaving?: boolean
  isDisabled?: boolean
  className?: string
}

export function FormActions({
  onCancel,
  onSave,
  saveLabel = 'Save Changes',
  cancelLabel = 'Cancel',
  isSaving = false,
  isDisabled = false,
  className,
}: FormActionsProps) {
  return (
    <div
      className={cn(
        'flex flex-col-reverse sm:flex-row items-center gap-3 pt-6 border-t',
        className
      )}
    >
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="w-full sm:w-auto px-6 py-2.5 rounded-lg border-2 border-border hover:bg-muted/50 transition-colors font-medium disabled:opacity-50"
        >
          {cancelLabel}
        </button>
      )}

      {onSave && (
        <button
          type="button"
          onClick={onSave}
          disabled={isDisabled || isSaving}
          className={cn(
            'w-full sm:w-auto px-6 py-2.5 rounded-lg',
            'bg-primary text-white font-medium',
            'shadow-md shadow-primary/20',
            'hover:shadow-lg hover:shadow-primary/30 hover:scale-[1.02]',
            'active:scale-[0.98]',
            'transition-all duration-200',
            'disabled:opacity-50 disabled:pointer-events-none',
            'flex items-center justify-center gap-2'
          )}
        >
          {isSaving && (
            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          )}
          <span>{isSaving ? 'Saving...' : saveLabel}</span>
        </button>
      )}
    </div>
  )
}

// Success Message Component
export interface SuccessMessageProps {
  title: string
  message?: string
  onDismiss?: () => void
  className?: string
}

export function SuccessMessage({
  title,
  message,
  onDismiss,
  className,
}: SuccessMessageProps) {
  return (
    <div
      className={cn(
        'p-4 rounded-xl border border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800',
        'animate-in fade-in slide-in-from-top-2 duration-300',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1 space-y-1">
          <p className="text-sm font-semibold text-green-900 dark:text-green-100">
            {title}
          </p>
          {message && (
            <p className="text-sm text-green-700 dark:text-green-300">
              {message}
            </p>
          )}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors"
          >
            ×
          </button>
        )}
      </div>
    </div>
  )
}
