'use client'

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { TimePicker } from '@/components/ui/time-picker'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Sparkles, Check, X, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  getCreativeSchema,
  validateFormData,
  getSuggestableFields,
  type CreativeSchema,
  type SchemaField,
} from '@/lib/schemas/creativeSchemas'
import {
  getFormatFields,
  getFormatSchema,
  validateFormatFormData,
  type DynamicField as FormatDynamicField,
} from '@/lib/schemas/formatFieldSchemas'
import type { CreativeFormatId } from '@/lib/config/creative-formats'

// ============================================================================
// Helpers
// ============================================================================

// Convert verticalName to verticalId (snake_case)
function getVerticalId(verticalName?: string): string | undefined {
  if (!verticalName) return undefined
  return verticalName
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
}

// Convert FormatDynamicField to SchemaField for compatibility
function formatFieldToSchemaField(field: FormatDynamicField): SchemaField {
  return {
    id: field.id,
    label: field.label,
    type: field.type,
    required: field.required,
    placeholder: field.placeholder,
    maxLength: field.maxLength,
    rows: field.rows,
    options: field.options,
    suggestable: field.suggestable,
  }
}
import type { GeneratedSchema, DynamicSchemaField } from '@/lib/prompts/generate-fields-prompt'
import { Skeleton } from '@/components/ui/skeleton'

// ============================================================================
// Types
// ============================================================================

interface Suggestion {
  value: string
  confidence: number
}

interface DynamicDetailsFormProps {
  formatId: CreativeFormatId | string | null
  verticalName?: string
  formData: Record<string, unknown>
  suggestions?: Record<string, Suggestion>
  isSuggestionsLoading?: boolean
  suggestionsError?: string | null
  onFormChange: (fieldId: string, value: unknown) => void
  onRequestSuggestions?: () => void
  onAcceptSuggestion?: (fieldId: string) => void
  onDismissSuggestion?: (fieldId: string) => void
  onAcceptAllSuggestions?: () => void
  onDismissAllSuggestions?: () => void
  languageValue?: string
  onLanguageChange?: (value: string) => void
  showLanguageSelector?: boolean
  // Dynamic schema props (AI-generated fields)
  dynamicSchema?: GeneratedSchema | null
  isDynamicSchemaLoading?: boolean
  dynamicSchemaError?: string | null
  isDynamicSchemaFallback?: boolean
}

// ============================================================================
// Dynamic Field Component
// ============================================================================

interface DynamicFieldProps {
  field: SchemaField
  value: string
  suggestion?: Suggestion | null
  isLoading?: boolean
  onChange: (value: string) => void
  onAccept?: () => void
  onDismiss?: () => void
  error?: string
}

function DynamicField({
  field,
  value,
  suggestion,
  isLoading,
  onChange,
  onAccept,
  onDismiss,
  error,
}: DynamicFieldProps) {
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
      onAccept?.()
      setShowSuggestion(false)
    }
  }

  const handleDismiss = () => {
    onDismiss?.()
    setShowSuggestion(false)
  }

  const handleChange = (newValue: string) => {
    onChange(newValue)
    if (newValue && suggestion) {
      setShowSuggestion(false)
    }
  }

  const isNearLimit = field.maxLength && value.length >= field.maxLength * 0.8
  const isOverLimit = field.maxLength && value.length > field.maxLength

  const confidenceColor =
    suggestion?.confidence && suggestion.confidence >= 0.7
      ? 'text-green-600'
      : suggestion?.confidence && suggestion.confidence >= 0.5
        ? 'text-yellow-600'
        : 'text-gray-400'

  return (
    <div className="space-y-2">
      {/* Label with suggestion indicator */}
      <div className="flex items-center justify-between">
        <Label htmlFor={field.id} className="text-sm font-medium">
          {field.label}
          {field.required && <span className="text-destructive ml-1">*</span>}
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

      {/* Field Input */}
      <div className="relative">
        {/* Ghost text suggestion layer */}
        {showSuggestion && suggestion && !value && (
          <div
            className={cn(
              'absolute inset-0 pointer-events-none px-3 py-2 text-muted-foreground/50 italic',
              field.type === 'textarea' ? 'min-h-[80px]' : ''
            )}
          >
            {suggestion.value}
          </div>
        )}

        {field.type === 'text' && (
          <Input
            id={field.id}
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={showSuggestion && suggestion ? '' : field.placeholder}
            maxLength={field.maxLength}
            className={cn(
              'relative z-10',
              showSuggestion && suggestion && !value ? 'bg-transparent' : '',
              isLoading ? 'animate-pulse' : '',
              error ? 'border-destructive' : ''
            )}
            disabled={isLoading}
          />
        )}

        {field.type === 'textarea' && (
          <Textarea
            id={field.id}
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={showSuggestion && suggestion ? '' : field.placeholder}
            rows={field.rows || 3}
            className={cn(
              'relative z-10',
              showSuggestion && suggestion && !value ? 'bg-transparent' : '',
              isLoading ? 'animate-pulse' : '',
              error ? 'border-destructive' : ''
            )}
            disabled={isLoading}
          />
        )}

        {field.type === 'date' && (
          <DatePicker
            value={value}
            onChange={handleChange}
            placeholder={field.placeholder || 'Select date'}
            error={!!error}
            disabled={isLoading}
          />
        )}

        {field.type === 'time' && (
          <TimePicker
            value={value}
            onChange={handleChange}
            error={!!error}
            disabled={isLoading}
          />
        )}

        {field.type === 'select' && field.options && (
          <Select value={value} onValueChange={handleChange} disabled={isLoading}>
            <SelectTrigger className={cn(error ? 'border-destructive' : '')}>
              <SelectValue placeholder={field.placeholder || `Select ${field.label}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Loading shimmer */}
        {isLoading && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-200/50 to-transparent animate-shimmer rounded-md" />
        )}
      </div>

      {/* Character counter */}
      {field.maxLength && (isNearLimit || value.length > 0) && (
        <div
          className={cn(
            'flex items-center justify-end text-xs',
            isOverLimit
              ? 'text-destructive font-medium'
              : isNearLimit
                ? 'text-amber-600'
                : 'text-muted-foreground'
          )}
        >
          <span>
            {value.length} / {field.maxLength}
            {isOverLimit && ' - Text may be truncated'}
          </span>
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}

      {/* Accept/Dismiss buttons for suggestions */}
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
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Main Form Component
// ============================================================================

// Helper to convert DynamicSchemaField to SchemaField
function dynamicToSchemaField(field: DynamicSchemaField): SchemaField {
  return {
    id: field.id,
    label: field.label,
    type: field.type,
    required: field.required,
    placeholder: field.placeholder,
    maxLength: field.maxLength,
    rows: field.rows,
    options: field.options,
    suggestable: field.suggestable,
  }
}

// Loading skeleton for form fields
function FormFieldSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-10 w-full" />
    </div>
  )
}

export function DynamicDetailsForm({
  formatId,
  verticalName,
  formData,
  suggestions = {},
  isSuggestionsLoading = false,
  suggestionsError,
  onFormChange,
  onRequestSuggestions,
  onAcceptSuggestion,
  onDismissSuggestion,
  onAcceptAllSuggestions,
  onDismissAllSuggestions,
  languageValue = 'en',
  onLanguageChange,
  showLanguageSelector = true,
  dynamicSchema,
  isDynamicSchemaLoading = false,
  dynamicSchemaError,
  isDynamicSchemaFallback = false,
}: DynamicDetailsFormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const fallbackToastShownRef = useRef(false)

  // Show toast notification when fallback schema is used
  useEffect(() => {
    if (isDynamicSchemaFallback && dynamicSchemaError && !fallbackToastShownRef.current) {
      fallbackToastShownRef.current = true
      toast.info('Using default fields', {
        description: 'AI field generation unavailable. Using standard fields for this format.',
        duration: 5000,
      })
    }
    // Reset when no longer fallback
    if (!isDynamicSchemaFallback) {
      fallbackToastShownRef.current = false
    }
  }, [isDynamicSchemaFallback, dynamicSchemaError])

  // Get static schema for current format (legacy fallback)
  const staticSchema = useMemo(() => getCreativeSchema(formatId), [formatId])

  // Get vertical ID from vertical name for format-specific field lookup
  const verticalId = useMemo(() => getVerticalId(verticalName), [verticalName])

  // Get format-specific fields (new system with per-format definitions)
  const formatSpecificFields = useMemo(() => {
    if (!formatId) return []
    return getFormatFields(formatId, verticalId)
  }, [formatId, verticalId])

  // Get format schema metadata
  const formatSchema = useMemo(() => formatId ? getFormatSchema(formatId) : null, [formatId])

  // Priority: AI-generated merged with Format-specific > Format-specific > Static schema (fallback)
  // IMPORTANT: AI schema is MERGED with format-specific fields, not replaced
  // This ensures new fields in formatFieldSchemas.ts always appear
  const effectiveFields = useMemo<SchemaField[]>(() => {
    // Get base fields: format-specific if available, otherwise static fallback
    const baseFields = formatSpecificFields.length > 0
      ? formatSpecificFields.map(formatFieldToSchemaField)
      : staticSchema.fields

    // 1. AI-generated schema merges WITH format-specific fields
    if (dynamicSchema?.fields && dynamicSchema.fields.length > 0) {
      // Create a map of base fields by ID for type lookup
      const baseFieldMap = new Map(baseFields.map(f => [f.id, f]))

      // Convert AI fields, but prefer base field types for date/time fields
      // This fixes AI generating "text" type for time fields
      const aiFields = dynamicSchema.fields.map(field => {
        const converted = dynamicToSchemaField(field)
        const baseField = baseFieldMap.get(field.id)

        // If base field exists and has date/time type, use that type
        // This ensures proper date/time picker rendering
        if (baseField && (baseField.type === 'date' || baseField.type === 'time')) {
          converted.type = baseField.type
        }

        return converted
      })

      const aiFieldIds = new Set(aiFields.map(f => f.id))

      // Append any base fields that are NOT in the AI schema
      // This ensures new format-specific fields always appear
      const missingBaseFields = baseFields.filter(f => !aiFieldIds.has(f.id))

      // Final safety deduplication to prevent React key errors
      const combined = [...aiFields, ...missingBaseFields]
      const seenIds = new Set<string>()
      return combined.filter(field => {
        if (seenIds.has(field.id)) return false
        seenIds.add(field.id)
        return true
      })
    }

    // 2. Format-specific fields only (no AI schema)
    if (formatSpecificFields.length > 0) {
      return baseFields
    }

    // 3. Static schema fallback (legacy)
    return staticSchema.fields
  }, [dynamicSchema, formatSpecificFields, staticSchema])

  // Determine which schema source is being used
  const schemaSource = useMemo(() => {
    if (dynamicSchema?.fields && dynamicSchema.fields.length > 0) {
      // Check if we merged format fields with AI fields
      if (formatSpecificFields.length > 0) {
        const aiFieldIds = new Set(dynamicSchema.fields.map(f => f.id))
        const hasMergedFields = formatSpecificFields.some(f => !aiFieldIds.has(f.id))
        return hasMergedFields ? 'ai-merged' : 'ai-generated'
      }
      return 'ai-generated'
    }
    if (formatSpecificFields.length > 0) {
      return 'format-specific'
    }
    return 'static-fallback'
  }, [dynamicSchema, formatSpecificFields])

  // Create an effective schema object for validation
  const schema = useMemo<CreativeSchema>(() => {
    // AI-generated schema
    if (dynamicSchema?.fields && dynamicSchema.fields.length > 0) {
      return {
        type: staticSchema.type,
        displayName: dynamicSchema.schemaType || staticSchema.displayName,
        description: staticSchema.description,
        fields: effectiveFields,
      }
    }

    // Format-specific schema
    if (formatSchema && formatSpecificFields.length > 0) {
      return {
        type: staticSchema.type,
        displayName: formatSchema.displayName,
        description: formatSchema.designNotes || staticSchema.description,
        fields: effectiveFields,
      }
    }

    // Static fallback
    return staticSchema
  }, [dynamicSchema, staticSchema, effectiveFields, formatSchema, formatSpecificFields])

  // Get display name for the form header
  const displayName = useMemo(() => {
    if (dynamicSchema?.schemaType) {
      return dynamicSchema.schemaType
    }
    if (formatSchema?.displayName) {
      return formatSchema.displayName
    }
    return staticSchema.displayName
  }, [dynamicSchema, formatSchema, staticSchema])

  // Get suggestable fields
  const suggestableFieldIds = useMemo(() => {
    return effectiveFields.filter(f => f.suggestable).map(f => f.id)
  }, [effectiveFields])

  // Check if there are any suggestions to show
  const hasSuggestions = useMemo(() => {
    return Object.keys(suggestions).some(
      (key) =>
        suggestableFieldIds.includes(key) &&
        suggestions[key] &&
        !formData[key]
    )
  }, [suggestions, suggestableFieldIds, formData])

  // Get field value helper
  const getFieldValue = useCallback(
    (fieldId: string): string => {
      const value = formData[fieldId]
      return typeof value === 'string' ? value : ''
    },
    [formData]
  )

  // Validate form on changes
  const validateForm = useCallback(() => {
    const validation = validateFormData(schema, formData)
    setErrors(validation.errors)
    return validation.valid
  }, [schema, formData])

  // Handle field change
  const handleFieldChange = useCallback(
    (fieldId: string, value: unknown) => {
      onFormChange(fieldId, value)
      // Clear error for this field
      if (errors[fieldId]) {
        setErrors((prev) => {
          const newErrors = { ...prev }
          delete newErrors[fieldId]
          return newErrors
        })
      }
    },
    [onFormChange, errors]
  )

  // Get suggestion for a field
  const getSuggestion = useCallback(
    (fieldId: string): Suggestion | null => {
      return suggestions[fieldId] || null
    },
    [suggestions]
  )

  // Get the first text field for AI trigger
  const titleField = useMemo(() => {
    return effectiveFields.find(
      (f) => f.suggestable && f.type === 'text' && f.required
    )
  }, [effectiveFields])

  // Check if AI trigger button should be enabled
  const canTriggerAI = useMemo(() => {
    if (!titleField) return false
    const titleValue = getFieldValue(titleField.id)
    return titleValue.length >= 5
  }, [titleField, getFieldValue])

  // Is using AI-generated schema (for badge display)
  const isUsingAISchema = schemaSource === 'ai-generated'
  const isUsingFormatSchema = schemaSource === 'format-specific'

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              {displayName} Details
              {isUsingAISchema && !isDynamicSchemaFallback && (
                <Badge variant="secondary" className="ml-2 bg-purple-100 text-purple-700 text-xs">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI Fields
                </Badge>
              )}
              {isUsingFormatSchema && (
                <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-700 text-xs">
                  Format Fields
                </Badge>
              )}
              {isDynamicSchemaFallback && (
                <Badge variant="outline" className="ml-2 text-xs">
                  Standard Fields
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="mt-1">
              {verticalName
                ? `Fill in the details for your ${verticalName} ${displayName.toLowerCase()}`
                : schema.description}
            </CardDescription>
          </div>
          {isDynamicSchemaLoading && (
            <Badge variant="outline" className="animate-pulse">
              <Sparkles className="h-3 w-3 mr-1 animate-spin" />
              Generating fields...
            </Badge>
          )}
        </div>
        {dynamicSchemaError && !isDynamicSchemaFallback && (
          <div className="mt-2 text-sm text-amber-600 bg-amber-50 p-2 rounded-lg">
            {dynamicSchemaError}
          </div>
        )}
        {isDynamicSchemaFallback && (
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-md">
            <AlertCircle className="h-3 w-3" />
            <span>Using default fields (AI unavailable)</span>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Loading skeleton when generating dynamic fields */}
        {isDynamicSchemaLoading && (
          <div className="grid gap-4 md:grid-cols-2">
            <FormFieldSkeleton />
            <FormFieldSkeleton />
            <div className="md:col-span-2">
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-24 w-full" />
            </div>
            <FormFieldSkeleton />
            <FormFieldSkeleton />
          </div>
        )}
        {/* First field with AI trigger button */}
        {!isDynamicSchemaLoading && titleField && (
          <div className="space-y-2">
            <Label htmlFor={titleField.id}>
              {titleField.label}
              {titleField.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <div className="flex gap-2">
              <Input
                id={titleField.id}
                placeholder={titleField.placeholder}
                value={getFieldValue(titleField.id)}
                onChange={(e) => handleFieldChange(titleField.id, e.target.value)}
                className={cn('flex-1', errors[titleField.id] ? 'border-destructive' : '')}
                maxLength={titleField.maxLength}
              />
              {onRequestSuggestions && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={onRequestSuggestions}
                  disabled={!canTriggerAI || isSuggestionsLoading}
                  className="h-10 w-10 shrink-0 border-purple-200 hover:bg-purple-50 hover:border-purple-300"
                  title="Get AI suggestions for form fields"
                >
                  <Sparkles
                    className={cn(
                      'h-4 w-4 text-purple-500',
                      isSuggestionsLoading ? 'animate-spin' : ''
                    )}
                  />
                </Button>
              )}
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Enter a descriptive title, then click the magic wand to get AI suggestions
              </p>
              {titleField.maxLength && (
                <span
                  className={cn(
                    'text-xs',
                    getFieldValue(titleField.id).length >= titleField.maxLength
                      ? 'text-destructive font-medium'
                      : getFieldValue(titleField.id).length >= titleField.maxLength * 0.8
                        ? 'text-amber-600'
                        : 'text-muted-foreground'
                  )}
                >
                  {getFieldValue(titleField.id).length} / {titleField.maxLength}
                </span>
              )}
            </div>
            {errors[titleField.id] && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors[titleField.id]}
              </p>
            )}
          </div>
        )}

        {/* AI Suggestions Error */}
        {suggestionsError && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
            {suggestionsError}
          </div>
        )}

        {/* Bulk AI Actions */}
        {!isDynamicSchemaLoading && hasSuggestions && !isSuggestionsLoading && (
          <div className="flex items-center justify-end gap-2 py-2 px-1 border-t border-dashed border-purple-200 bg-purple-50/50 rounded-b-lg">
            <span className="text-xs text-purple-600 flex items-center gap-1 mr-auto">
              <Sparkles className="h-3 w-3" />
              AI Suggestions available
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onAcceptAllSuggestions}
              className="h-7 px-3 text-xs bg-green-50 border-green-200 hover:bg-green-100 text-green-700"
            >
              <Check className="h-3 w-3 mr-1" />
              Accept All
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={onDismissAllSuggestions}
              className="h-7 px-3 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Dismiss All
            </Button>
          </div>
        )}

        {/* Dynamic form fields (excluding the first title field which is handled above) */}
        {!isDynamicSchemaLoading && (
        <div className="grid gap-4 md:grid-cols-2">
          {effectiveFields
            .filter((field) => field.id !== titleField?.id)
            .map((field) => (
              <div
                key={field.id}
                className={cn(
                  field.type === 'textarea' ? 'md:col-span-2' : ''
                )}
              >
                <DynamicField
                  field={field}
                  value={getFieldValue(field.id)}
                  suggestion={getSuggestion(field.id)}
                  isLoading={isSuggestionsLoading}
                  onChange={(value) => handleFieldChange(field.id, value)}
                  onAccept={() => onAcceptSuggestion?.(field.id)}
                  onDismiss={() => onDismissSuggestion?.(field.id)}
                  error={errors[field.id]}
                />
              </div>
            ))}
        </div>
        )}

        {/* Language Selector */}
        {showLanguageSelector && onLanguageChange && (
          <div className="pt-4 border-t">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label htmlFor="language" className="text-sm font-medium">
                  Language
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Text will be generated in this language
                </p>
              </div>
              <Select value={languageValue} onValueChange={onLanguageChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="hi">Hindi (हिंदी)</SelectItem>
                  <SelectItem value="ta">Tamil (தமிழ்)</SelectItem>
                  <SelectItem value="es">Spanish (Español)</SelectItem>
                  <SelectItem value="fr">French (Français)</SelectItem>
                  <SelectItem value="ar">Arabic (العربية)</SelectItem>
                  <SelectItem value="ja">Japanese (日本語)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Schema badge */}
        {!isDynamicSchemaLoading && (
        <div className="flex justify-end pt-2">
          <Badge
            variant="outline"
            className={cn(
              "text-xs",
              isUsingAISchema && !isDynamicSchemaFallback && "bg-purple-50 border-purple-200",
              isUsingFormatSchema && "bg-blue-50 border-blue-200"
            )}
          >
            {isUsingAISchema && !isDynamicSchemaFallback
              ? `AI: ${dynamicSchema?.schemaType || 'Generated'}`
              : isUsingFormatSchema
                ? `${displayName}${verticalId ? ` + ${verticalName}` : ''}`
                : `${staticSchema.displayName} Schema`
            }
          </Badge>
        </div>
        )}
      </CardContent>
    </Card>
  )
}

export default DynamicDetailsForm
