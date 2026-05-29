'use client'

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
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
import {
  FileText,
  Sparkles,
  Check,
  X,
  AlertCircle,
  Calendar,
  Clock,
  MapPin,
  AlignLeft,
  ClipboardList,
  Phone,
  Globe,
  Users,
  Info,
  Quote,
  Building2,
  Hash,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useCreativeStore } from '@/stores/creative-store'
import { useFieldExtraction } from '@/hooks/use-field-extraction'
import {
  SmartPasteToggle,
  SmartPasteInput,
  ExtractionPreview,
} from '@/components/create/smart-paste'
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
import { FormSection } from '@/components/creative-form/FormSection'
import {
  FIELD_REGISTRY,
  getField,
  resolveFieldId,
  type CanonicalField,
} from '@/lib/config/field-registry'
import {
  getFormatSections,
  getFormatFieldsBySection,
  getDefaultExpandedSections,
  type FormSection as FormSectionType,
} from '@/lib/config/form-sections'
import type { DynamicField as ExternalDynamicField } from '@/types/external-event.types'
import { getFormatCustomizationOptions } from '@/lib/config/format-customization'
import type { SpeakerPhotoCustomization, SpeakerRole } from '@/lib/config/design-constants'

// Lazy import for SpeakerPhotoUpload to avoid circular dependencies
const SpeakerPhotoUpload = dynamic(
  () => import('@/components/create/speaker-photo-upload').then(mod => ({ default: mod.SpeakerPhotoUpload })),
  { ssr: false }
)

// Lazy import for MultiSpeakerInput
const MultiSpeakerInput = dynamic(
  () => import('@/components/create/multi-speaker-input').then(mod => ({ default: mod.MultiSpeakerInput })),
  { ssr: false }
)

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

// Convert CanonicalField to SchemaField for compatibility
function canonicalToSchemaField(field: CanonicalField): SchemaField {
  return {
    id: field.id,
    label: field.label,
    type: field.type,
    required: field.required || false,
    placeholder: field.placeholder,
    maxLength: field.maxLength,
    rows: field.rows,
    options: field.options,
    suggestable: field.suggestable || false,
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

/** Speaker photo configuration type matching create page */
interface SpeakerPhotoValue {
  enabled: boolean
  photoUrl?: string
  position?: 'left' | 'right' | 'center'
  size?: number
  shape?: 'circle' | 'rounded' | 'square'
  verticalPosition?: 'top' | 'upper' | 'middle' | 'lower' | 'bottom'
  border?: { width: number; color: string }
  shadow?: boolean
  speakers?: Array<{ id: string; name: string; designation?: string; role?: SpeakerRole; photoUrl?: string }>
  layoutMode?: 'auto' | 'manual'
  layoutStrategy?: 'side-by-side' | 'stacked' | 'grid'
  spacing?: number
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
  /** Enable section-based layout with collapsible cards */
  useSections?: boolean
  /** Speaker photo configuration - for integration into Speaker Details section */
  speakerPhotoValue?: SpeakerPhotoValue
  /** Callback when speaker photo settings change */
  onSpeakerPhotoChange?: (data: Partial<SpeakerPhotoValue>) => void
  /** Organization ID for Smart Paste feature */
  organizationId?: string
  /** Dynamic fields from external event source (v3.0) */
  externalDynamicFields?: ExternalDynamicField[]
}

// ============================================================================
// Field Icon Mapping
// ============================================================================

const FIELD_ICONS: Record<string, LucideIcon> = {
  // Core event fields
  eventName: FileText,
  eventTitle: FileText,
  title: FileText,
  posterTitle: FileText,
  eventTagline: Quote,
  tagline: Quote,
  eventDate: Calendar,
  date: Calendar,
  eventTime: Clock,
  startTime: Clock,
  eventEndTime: Clock,
  endTime: Clock,
  venue: MapPin,
  location: MapPin,
  eventVenue: MapPin,

  // Content fields
  eventDescription: AlignLeft,
  description: AlignLeft,
  additionalDetails: Info,

  // Contact fields
  registrationInfo: ClipboardList,
  registrationDetails: ClipboardList,
  contactNumber: Phone,
  phone: Phone,
  websiteUrl: Globe,
  website: Globe,

  // Social/branding
  hashtag: Hash,
  socialHandle: Hash,
  organizationName: Building2,
  organization: Building2,

  // Audience
  targetAudience: Users,
  audience: Users,
}

function getFieldIcon(fieldId: string): LucideIcon {
  return FIELD_ICONS[fieldId] || FileText
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

  // Get the icon for this field
  const FieldIcon = getFieldIcon(field.id)

  return (
    <div className="space-y-1">
      {/* Label with suggestion indicator */}
      <div className="flex items-center justify-between">
        <Label htmlFor={field.id} className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          {field.label}
          {field.required && <span className="text-destructive ml-0.5">*</span>}
        </Label>
        {suggestion && showSuggestion && (
          <div className="flex items-center gap-1 text-[10px]">
            <Sparkles className="h-2.5 w-2.5 text-primary" />
            <span className={confidenceColor}>
              {Math.round((suggestion.confidence || 0) * 100)}%
            </span>
          </div>
        )}
      </div>

      {/* Field Input */}
      <div className="relative">
        {/* Ghost text suggestion layer - adjusted for icon padding */}
        {showSuggestion && suggestion && !value && (
          <div
            className={cn(
              'absolute inset-0 pointer-events-none pl-8 pr-3 py-2 text-muted-foreground/70 italic text-xs truncate',
              field.type === 'textarea' ? 'min-h-[60px] whitespace-pre-wrap' : ''
            )}
          >
            {suggestion.value}
          </div>
        )}

        {field.type === 'text' && (
          <div className="relative">
            <FieldIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50 z-20" />
            <Input
              id={field.id}
              value={value}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={showSuggestion && suggestion ? '' : field.placeholder}
              maxLength={field.maxLength}
              className={cn(
                'relative z-10 h-8 text-xs pl-8 rounded-lg bg-muted/30 border-muted-foreground/10 focus:bg-background focus-visible:ring-1 focus-visible:ring-primary/30 transition-all',
                showSuggestion && suggestion && !value ? 'bg-transparent' : '',
                isLoading ? 'animate-pulse' : '',
                error ? 'border-destructive focus-visible:ring-destructive/30' : ''
              )}
              disabled={isLoading}
            />
          </div>
        )}

        {field.type === 'textarea' && (
          <div className="relative">
            <FieldIcon className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground/50 z-20" />
            <Textarea
              id={field.id}
              value={value}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={showSuggestion && suggestion ? '' : field.placeholder}
              rows={field.rows || 2}
              className={cn(
                'relative z-10 text-xs pl-8 rounded-lg bg-muted/30 border-muted-foreground/10 focus:bg-background focus-visible:ring-1 focus-visible:ring-primary/30 transition-all resize-y min-h-[60px]',
                showSuggestion && suggestion && !value ? 'bg-transparent' : '',
                isLoading ? 'animate-pulse' : '',
                error ? 'border-destructive focus-visible:ring-destructive/30' : ''
              )}
              disabled={isLoading}
            />
          </div>
        )}

        {field.type === 'date' && (
          <div className="relative">
            <DatePicker
              value={value}
              onChange={handleChange}
              placeholder={field.placeholder || 'Select date'}
              error={!!error}
              disabled={isLoading}
              className="h-8 text-xs rounded-lg bg-muted/30 border-muted-foreground/10 focus:bg-background"
            />
          </div>
        )}

        {field.type === 'time' && (
          <div className="relative">
            <TimePicker
              value={value}
              onChange={handleChange}
              error={!!error}
              disabled={isLoading}
              className="h-8 text-xs rounded-lg bg-muted/30 border-muted-foreground/10 focus:bg-background"
            />
          </div>
        )}

        {field.type === 'select' && field.options && (
          <div className="relative">
            <FieldIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50 z-20 pointer-events-none" />
            <Select value={value} onValueChange={handleChange} disabled={isLoading}>
              <SelectTrigger className={cn(
                "h-8 text-xs pl-8 rounded-lg bg-muted/30 border-muted-foreground/10 focus:bg-background focus:ring-1 focus:ring-primary/30",
                error ? 'border-destructive' : ''
              )}>
                <SelectValue placeholder={field.placeholder || `Select ${field.label}`} />
              </SelectTrigger>
              <SelectContent>
                {field.options.map((option) => (
                  <SelectItem key={option} value={option} className="text-xs">
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Loading shimmer */}
        {isLoading && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-200/50 to-transparent animate-shimmer rounded-lg" />
        )}
      </div>

      {/* Character counter */}
      {field.maxLength && (isNearLimit || value.length > 0) && (
        <div
          className={cn(
            'flex items-center justify-end text-[10px]',
            isOverLimit
              ? 'text-destructive font-medium'
              : isNearLimit
                ? 'text-amber-600'
                : 'text-muted-foreground'
          )}
        >
          <span>
            {value.length}/{field.maxLength}
            {isOverLimit && ' (limit)'}
          </span>
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="text-[10px] text-destructive flex items-center gap-1">
          <AlertCircle className="h-2.5 w-2.5" />
          {error}
        </p>
      )}

      {/* Accept/Dismiss buttons for suggestions */}
      {showSuggestion && suggestion && !value && (
        <div className="flex items-center gap-1.5 pt-0.5">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleAccept}
            className="h-6 px-2 text-[10px] bg-green-50 border-green-200 hover:bg-green-100 text-green-700"
          >
            <Check className="h-2.5 w-2.5 mr-1" />
            Accept
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={handleDismiss}
            className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground"
          >
            <X className="h-2.5 w-2.5 mr-1" />
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
  useSections = true, // Enable sections by default
  speakerPhotoValue,
  onSpeakerPhotoChange,
  organizationId,
  externalDynamicFields = [],
}: DynamicDetailsFormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const fallbackToastShownRef = useRef(false)

  // Smart Paste state
  const [smartPasteMode, setSmartPasteMode] = useState(false)
  const [hasAppliedExtraction, setHasAppliedExtraction] = useState(false)

  // Smart Paste hook - only initialize if organizationId is available
  const {
    isExtracting,
    extractionError,
    extractionResult,
    extractFields,
    applyExtractedFields,
    applyExtractedSpeakers,
    clearExtraction,
    editExtractedField,
  } = useFieldExtraction({
    organizationId: organizationId || '',
  })

  // Get vertical slug from name
  const verticalSlug = useMemo(() => {
    if (!verticalName) return undefined
    return verticalName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  }, [verticalName])

  // Handle extraction
  const handleExtract = useCallback(async (rawText: string) => {
    await extractFields(rawText, verticalSlug, formatId || undefined)
  }, [extractFields, verticalSlug, formatId])

  // Handle apply extracted fields
  const handleApplyExtraction = useCallback((selectedFieldIds: string[]) => {
    applyExtractedFields(selectedFieldIds)
    setSmartPasteMode(false)
    setHasAppliedExtraction(true)
    clearExtraction()
    toast.success('Fields populated from extracted data', {
      description: `${selectedFieldIds.length} field${selectedFieldIds.length !== 1 ? 's' : ''} applied`,
    })
  }, [applyExtractedFields, clearExtraction])

  // Handle apply speakers
  const handleApplySpeakers = useCallback(() => {
    applyExtractedSpeakers()
    toast.success('Speakers added to form')
  }, [applyExtractedSpeakers])

  // Handle cancel extraction
  const handleCancelExtraction = useCallback(() => {
    clearExtraction()
    setSmartPasteMode(false)
  }, [clearExtraction])

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
  // Priority: suggestable + required text > required text > first text field
  const titleField = useMemo(() => {
    // First try: required + suggestable text field
    const suggestableField = effectiveFields.find(
      (f) => f.suggestable && f.type === 'text' && f.required
    )
    if (suggestableField) return suggestableField

    // Fallback: any required text field (AI-generated schemas may not set suggestable)
    const requiredTextField = effectiveFields.find(
      (f) => f.type === 'text' && f.required
    )
    if (requiredTextField) return requiredTextField

    // Last resort: first text field
    return effectiveFields.find((f) => f.type === 'text')
  }, [effectiveFields])

  // For AI trigger message - find first text field that needs more input
  const firstUnfilledTextField = useMemo(() => {
    return effectiveFields.find((f) => {
      if (f.type !== 'text') return false
      const value = formData[f.id]
      return !value || (typeof value === 'string' && value.length < 5)
    })
  }, [effectiveFields, formData])

  // Check if AI trigger button should be enabled
  // Check ALL text fields (not just one) to handle field ID mismatches between AI and format schemas
  const canTriggerAI = useMemo(() => {
    // Get all required text fields
    const requiredTextFields = effectiveFields.filter(
      (f) => f.type === 'text' && f.required
    )

    // Fallback to any text field if no required ones
    const textFieldsToCheck = requiredTextFields.length > 0
      ? requiredTextFields
      : effectiveFields.filter((f) => f.type === 'text')

    // Enable AI if ANY of these fields has >= 5 chars
    return textFieldsToCheck.some((field) => {
      const value = formData[field.id]
      return typeof value === 'string' && value.length >= 5
    })
  }, [effectiveFields, formData])

  // Is using AI-generated schema (for badge display)
  const isUsingAISchema = schemaSource === 'ai-generated'
  const isUsingFormatSchema = schemaSource === 'format-specific'

  // ============================================================================
  // Section-based rendering data
  // ============================================================================

  // Get sections for the current format
  const sectionConfig = useMemo(() => {
    if (!formatId || !useSections) return null
    return getFormatFieldsBySection(formatId)
  }, [formatId, useSections])

  // Build field lookup map for quick access
  const fieldMap = useMemo(() => {
    const map = new Map<string, SchemaField>()
    effectiveFields.forEach((field) => {
      map.set(field.id, field)
    })
    return map
  }, [effectiveFields])

  // Calculate section completion data
  const sectionData = useMemo(() => {
    if (!sectionConfig) return []

    return sectionConfig.map(({ section, fieldIds }) => {
      // Get fields for this section from field registry (canonical) or effectiveFields (legacy)
      const sectionFields: SchemaField[] = fieldIds
        .map((id) => {
          // First try to get from effective fields (includes AI-generated)
          const effectiveField = fieldMap.get(id)
          if (effectiveField) return effectiveField

          // Fall back to canonical field registry
          const canonicalField = getField(id)
          if (canonicalField) return canonicalToSchemaField(canonicalField)

          return null
        })
        .filter((f): f is SchemaField => f !== null)

      // Count completed and required fields
      const requiredFields = sectionFields.filter((f) => f.required).length
      const completedFields = sectionFields.filter((f) => {
        const value = formData[f.id]
        return value && String(value).trim().length > 0
      }).length

      // Check for errors in this section
      const hasErrors = sectionFields.some((f) => errors[f.id])

      return {
        section,
        fields: sectionFields,
        fieldIds,
        requiredFields,
        completedFields,
        totalFields: sectionFields.length,
        hasErrors,
      }
    }).filter((s) => {
      // Always show section if it has fields
      if (s.fields.length > 0) return true

      // Special case: Speaker section with MultiSpeakerInput support
      // Even though it has no traditional form fields, it uses the MultiSpeakerInput component
      if (s.section.id === 'speaker' && formatId) {
        const customizationOptions = getFormatCustomizationOptions(formatId)
        return customizationOptions.speakerPhoto
      }

      // Filter out sections with no fields and no special components
      return false
    })
  }, [sectionConfig, fieldMap, formData, errors, formatId])

  // Initialize expanded sections based on defaults
  useEffect(() => {
    if (formatId && useSections) {
      const defaults = getDefaultExpandedSections(formatId)
      setExpandedSections(new Set(defaults))
    }
  }, [formatId, useSections])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              {displayName} Details
              {isUsingAISchema && !isDynamicSchemaFallback && (
                <Badge variant="secondary" className="ml-2 bg-primary/10 text-primary text-xs">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI Fields
                </Badge>
              )}
              {isUsingFormatSchema && (
                <Badge variant="secondary" className="ml-2 bg-primary/10 text-primary text-xs">
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

        {/* Progress Indicator */}
        {!isDynamicSchemaLoading && (
          <div className="mt-4 mb-2 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Required fields completion</span>
              <span>{Math.round((effectiveFields.filter(f => f.required && getFieldValue(f.id)).length / effectiveFields.filter(f => f.required).length) * 100) || 0}%</span>
            </div>
            <div className="h-1 w-full bg-muted/30 rounded-full overflow-hidden">
              <div
                className="h-full gradient-yi shadow-[0_0_10px_rgba(0,91,150,0.3)] transition-all duration-500 ease-out"
                style={{ width: `${Math.round((effectiveFields.filter(f => f.required && getFieldValue(f.id)).length / effectiveFields.filter(f => f.required).length) * 100) || 0}%` }}
              />
            </div>
          </div>
        )}

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
        {/* Smart Paste Toggle - only show when organizationId is available */}
        {organizationId && !isDynamicSchemaLoading && (
          <SmartPasteToggle
            enabled={smartPasteMode}
            onToggle={setSmartPasteMode}
            hasExtractedData={hasAppliedExtraction}
          />
        )}

        {/* Smart Paste Mode Content */}
        {smartPasteMode && organizationId && (
          <>
            {extractionResult ? (
              <ExtractionPreview
                result={extractionResult}
                onApply={handleApplyExtraction}
                onApplySpeakers={handleApplySpeakers}
                onCancel={handleCancelExtraction}
                onEditField={editExtractedField}
              />
            ) : (
              <SmartPasteInput
                onExtract={handleExtract}
                isExtracting={isExtracting}
                error={extractionError}
              />
            )}
          </>
        )}

        {/* Regular Form Mode - hide when in Smart Paste mode */}
        {!smartPasteMode && (
          <>
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
            {/* First field with AI trigger button - only show when NOT using sections */}
        {!isDynamicSchemaLoading && titleField && !useSections && (
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
                  className="h-10 w-10 shrink-0 border-primary/20 hover:bg-primary/5 hover:border-primary/30"
                  title="Get AI suggestions for form fields"
                >
                  <Sparkles
                    className={cn(
                      'h-4 w-4 text-primary',
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

        {/* AI Trigger Button for section mode - shown above sections */}
        {!isDynamicSchemaLoading && useSections && onRequestSuggestions && (
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/5 via-primary/10 to-secondary/5 border border-primary/10 rounded-xl shadow-sm relative overflow-hidden group">
            <div className="absolute inset-0 bg-white/40 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            <div className="flex items-center gap-3 relative z-10">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <Sparkles className="h-4 w-4 text-primary animate-pulse" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-primary">
                  AI Content Assistant
                </span>
                <span className="text-xs text-foreground/70">
                  {canTriggerAI
                    ? 'Ready to generate smart suggestions for you'
                    : `Start typing in "${firstUnfilledTextField?.label || 'Title'}" to unlock AI help`}
                </span>
              </div>
            </div>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={onRequestSuggestions}
              disabled={!canTriggerAI || isSuggestionsLoading}
              className="relative z-10 gradient-yi hover:opacity-90 text-white border-0 shadow-md hover:shadow-lg transition-all"
            >
              <Sparkles
                className={cn(
                  'h-4 w-4 mr-2',
                  isSuggestionsLoading ? 'animate-spin' : ''
                )}
              />
              {isSuggestionsLoading ? 'Generating...' : 'Get AI Suggestions'}
            </Button>
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
          <div className="flex items-center justify-end gap-2 py-2 px-1 border-t border-dashed border-primary/20 bg-primary/5 rounded-b-lg">
            <span className="text-xs text-primary flex items-center gap-1 mr-auto">
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

        {/* Dynamic form fields - Section-based or Flat layout */}
        {!isDynamicSchemaLoading && useSections && sectionData.length > 0 ? (
          // Section-based layout with collapsible cards
          <div className="space-y-4">
            {sectionData.map(({ section, fields, requiredFields, completedFields, totalFields, hasErrors }) => {
              // Check if this format supports speaker photo for the speaker section
              const customizationOptions = getFormatCustomizationOptions(formatId || '')
              const showSpeakerPhotoInSection = section.id === 'speaker' &&
                customizationOptions.speakerPhoto &&
                speakerPhotoValue &&
                onSpeakerPhotoChange

              return (
                <FormSection
                  key={section.id}
                  sectionId={section.id}
                  title={section.title}
                  icon={section.icon}
                  description={section.description}
                  defaultExpanded={section.defaultExpanded}
                  completedFields={completedFields}
                  requiredFields={requiredFields}
                  totalFields={totalFields}
                  hasErrors={hasErrors}
                >
                  {fields.map((field) => (
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
                  {/* Multi-Speaker Input - Integrated into Speaker Details section */}
                  {showSpeakerPhotoInSection && (
                    <div className={cn(
                      "md:col-span-2",
                      fields.length > 0 && "mt-4 pt-4 border-t border-dashed border-border/50"
                    )}>
                      <MultiSpeakerInput
                        speakers={(speakerPhotoValue as SpeakerPhotoCustomization)?.speakers || []}
                        sharedSettings={{
                          shape: (speakerPhotoValue as SpeakerPhotoCustomization)?.shape || 'circle',
                          size: (speakerPhotoValue as SpeakerPhotoCustomization)?.size || 200,
                          border: (speakerPhotoValue as SpeakerPhotoCustomization)?.border || { width: 3, color: '#005B96' },
                          shadow: (speakerPhotoValue as SpeakerPhotoCustomization)?.shadow ?? true,
                          position: (speakerPhotoValue as SpeakerPhotoCustomization)?.position || 'center',
                          verticalPosition: (speakerPhotoValue as SpeakerPhotoCustomization)?.verticalPosition || 'middle',
                        }}
                        layoutMode={(speakerPhotoValue as SpeakerPhotoCustomization)?.layoutMode || 'auto'}
                        layoutStrategy={(speakerPhotoValue as SpeakerPhotoCustomization)?.layoutStrategy}
                        spacing={(speakerPhotoValue as SpeakerPhotoCustomization)?.spacing || 20}
                        onAddSpeaker={() => {
                          // Read LATEST state directly from Zustand (not stale prop)
                          const { formData } = useCreativeStore.getState()
                          const currentSpeakers = formData?.designData?.customization?.speakerPhoto?.speakers || []

                          onSpeakerPhotoChange?.({
                            speakers: [
                              ...currentSpeakers,
                              {
                                id: crypto.randomUUID(),
                                name: '',
                                designation: '',
                                role: 'speaker',
                              }
                            ]
                          })
                        }}
                        onRemoveSpeaker={(speakerId) => {
                          // Read LATEST state directly from Zustand (not stale prop)
                          const { formData } = useCreativeStore.getState()
                          const currentSpeakers = formData?.designData?.customization?.speakerPhoto?.speakers || []

                          const updatedSpeakers = currentSpeakers.filter(s => s.id !== speakerId)
                          // Auto-disable when all speakers with photos are removed
                          const hasAnyPhoto = updatedSpeakers.some(s => s.photoUrl)

                          onSpeakerPhotoChange?.({
                            speakers: updatedSpeakers,
                            enabled: hasAnyPhoto
                          })
                        }}
                        onUpdateSpeaker={(speakerId, updates) => {
                          // Read LATEST state directly from Zustand (not stale prop)
                          const { formData } = useCreativeStore.getState()
                          const currentSpeakers = formData?.designData?.customization?.speakerPhoto?.speakers || []

                          const updatedSpeakers = currentSpeakers.map(s =>
                            s.id === speakerId ? { ...s, ...updates } : s
                          )

                          // Auto-enable speaker photos when a photo is uploaded
                          const hasAnyPhoto = updatedSpeakers.some(s => s.photoUrl)

                          onSpeakerPhotoChange?.({
                            speakers: updatedSpeakers,
                            // Auto-enable when photo is added, auto-disable when all photos removed
                            enabled: hasAnyPhoto
                          })
                        }}
                        onUpdateSettings={(settings) => {
                          onSpeakerPhotoChange?.(settings)
                        }}
                        onUpdateLayout={(layoutMode, layoutStrategy) => {
                          onSpeakerPhotoChange?.({ layoutMode, layoutStrategy })
                        }}
                      />
                    </div>
                  )}
                </FormSection>
              )
            })}
          </div>
        ) : (
          // Flat layout (legacy or when sections not available)
          !isDynamicSchemaLoading && (
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
          )
        )}

        {/* Additional Information - External Dynamic Fields (v3.0) */}
        {!isDynamicSchemaLoading && externalDynamicFields && externalDynamicFields.length > 0 && (
          <FormSection
            sectionId="additional-info"
            title="Additional Information"
            icon="Sparkles"
            description="Custom fields from external event source"
            defaultExpanded={true}
            completedFields={externalDynamicFields.filter(f => {
              const value = formData[f.fieldId]
              return value && String(value).trim().length > 0
            }).length}
            requiredFields={0}
            totalFields={externalDynamicFields.length}
            hasErrors={false}
          >
            {externalDynamicFields.map((field) => (
              <div key={field.fieldId} className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary">
                    from {field.source}
                  </Badge>
                </div>
                <DynamicField
                  field={{
                    id: field.fieldId,
                    label: field.inferredLabel,
                    // Convert dynamic field types to compatible SchemaField types
                    // 'boolean' and 'number' are not in FieldType, so use 'text'
                    type: ['boolean', 'number'].includes(field.inferredType) ? 'text' : field.inferredType as 'text' | 'textarea' | 'date' | 'time' | 'select',
                    required: false,
                    placeholder: `Enter ${field.inferredLabel.toLowerCase()}`,
                    suggestable: false,
                    ...(field.inferredType === 'textarea' && { rows: 3 }),
                    ...(field.inferredType === 'text' && { maxLength: 200 }),
                  }}
                  value={String(formData[field.fieldId] ?? field.value ?? '')}
                  isLoading={false}
                  onChange={(value) => handleFieldChange(field.fieldId, value)}
                  error={errors[field.fieldId]}
                />
              </div>
            ))}
          </FormSection>
        )}

        {/* Schema badge */}
        {!isDynamicSchemaLoading && (
          <div className="flex justify-end pt-2">
            <Badge
              variant="outline"
              className={cn(
                "text-xs",
                isUsingAISchema && !isDynamicSchemaFallback && "bg-primary/5 border-primary/20",
                isUsingFormatSchema && "bg-primary/5 border-primary/20"
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
          </>
        )}

      </CardContent>
    </Card >
  )
}

export default DynamicDetailsForm
