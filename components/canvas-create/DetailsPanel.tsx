'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useCreativeStore } from '@/stores/creative-store'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { User, Sparkles, Check, X, AlertCircle, Camera, Plus, Loader2, Upload } from 'lucide-react'
import { SmartPasteInput } from '@/components/create/smart-paste'
import { useFieldExtraction } from '@/hooks/use-field-extraction'
import { cn } from '@/lib/utils'
import type { DynamicSchemaField } from '@/lib/prompts/generate-fields-prompt'
import type { SpeakerPhotoCustomization, SpeakerItem } from '@/lib/config/design-constants'
import type { SuggestableField } from '@/types/suggestions'
import { getFormatCustomizationOptions } from '@/lib/config/format-customization'
import { getFormatFields } from '@/lib/schemas/formatFieldSchemas'
import { resolveFieldId } from '@/lib/config/field-registry'
import { toast } from 'sonner'

// API field names used by suggestion system (from wizard page)
const API_TO_SCHEMA_MAP: Record<string, string[]> = {
  'date': ['eventDate', 'date', 'certificateDate', 'postDate'],
  'time': ['eventTime', 'time'],
  'venue': ['venue', 'eventVenue', 'location'],
  'speaker': ['speaker', 'speakerName', 'guestSpeaker', 'recipientName'],
  'description': ['eventDescription', 'description', 'achievementDescription', 'postDescription'],
  'eventTagline': ['eventTagline', 'tagline', 'subtitle', 'eventSubtitle', 'postTagline'],
  'title': ['eventName', 'eventTitle', 'title', 'postTitle', 'certificateTitle'],
}

// Only these fields get AI suggestions (from types/suggestions.ts)
const AI_TEXT_FIELDS = ['description', 'eventTagline'] as const

const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

interface DetailsPanelProps {
  suggestionsLoading?: boolean
  onRequestSuggestions?: (title: string) => Promise<void>
  onAcceptSuggestion?: (field: SuggestableField) => void
  onDismissSuggestion?: (field: SuggestableField) => void
  getSuggestion?: (field: SuggestableField) => { value: string; confidence: number } | null
  onValidationChange?: (isValid: boolean, missingFields: string[]) => void
  // Review mode props
  showReviewButton?: boolean
  onReviewClick?: () => void
  // Smart Paste props
  organizationId?: string
  // When true: natural height, no internal scroll — parent container handles scrolling
  embedded?: boolean
}

export function DetailsPanel({
  suggestionsLoading = false,
  onRequestSuggestions,
  onAcceptSuggestion,
  onDismissSuggestion,
  getSuggestion,
  onValidationChange,
  showReviewButton = false,
  onReviewClick,
  organizationId,
  embedded = false,
}: DetailsPanelProps = {}) {
  const {
    selectedFormat,
    formData,
    updateFormData,
    updateCustomization,
    dynamicSchema,
    selectedVertical,
  } = useCreativeStore()

  // v24.26: Fix - use dynamicSchema.isLoading instead of non-existent dynamicSchemaLoading
  const dynamicSchemaLoading = dynamicSchema.isLoading

  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set())
  // After AI extraction is applied, switch to form view so user can see/fill missing fields
  const [postExtraction, setPostExtraction] = useState(false)

  const {
    isExtracting,
    extractionError,
    extractionResult,
    extractFields,
    applyExtractedFields,
    applyExtractedSpeakers,
    clearExtraction,
  } = useFieldExtraction({ organizationId: organizationId || '' })

  const handleExtract = useCallback(async (text: string) => {
    await extractFields(text, selectedVertical?.slug, selectedFormat?.id)
  }, [extractFields, selectedVertical?.slug, selectedFormat?.id])

  // Auto-apply all extracted fields immediately — no preview step
  useEffect(() => {
    if (!extractionResult) return
    applyExtractedFields() // apply all fields
    if (extractionResult.speakers?.length) {
      applyExtractedSpeakers()
    }
    clearExtraction()
    setPostExtraction(true)
    toast.success('Fields applied — fill any missing required fields below')
  }, [extractionResult]) // eslint-disable-line react-hooks/exhaustive-deps

  // Check if format supports speaker photo
  const supportsSpeakerPhoto = selectedFormat
    ? getFormatCustomizationOptions(selectedFormat.id).speakerPhoto
    : false

  // Get speaker photo customization from designData
  const speakerPhotoValue = formData.designData?.customization?.speakerPhoto as SpeakerPhotoCustomization | undefined

  // Handler for speaker photo changes
  const handleSpeakerPhotoChange = useCallback((updates: Partial<SpeakerPhotoCustomization>) => {
    updateCustomization({
      speakerPhoto: {
        ...(speakerPhotoValue || {
          enabled: false,
          shape: 'circle',
          size: 200,
          border: { width: 3, color: '#005B96' },
          shadow: true,
          speakers: [],
        }),
        ...updates,
      }
    })
  }, [speakerPhotoValue, updateCustomization])

  // Schema is now loaded by CanvasCreatePage via generateDynamicSchema()
  // We just use the store's dynamicSchema and dynamicSchemaLoading state

  // Get fields from dynamic schema, supplemented by any static format fields the AI omitted.
  // The AI-generated schema (/api/generate-fields) does not reliably include every field
  // defined in formatFieldSchemas.ts (e.g. targetAudience). We merge the two so no
  // format-specific field is ever silently missing from the form.
  //
  // FIELD_ID_NORMALIZER: the AI sometimes generates variant IDs (e.g. 'eventTitle')
  // that differ from the canonical static schema IDs ('eventName'). Normalising before
  // dedup prevents them from appearing as two separate form fields.
  const FIELD_ID_NORMALIZER: Record<string, string> = {
    eventTitle:    'eventName',
    title:         'eventName',
    description:   'eventDescription',
    date:          'eventDate',
    time:          'eventTime',
    startTime:     'eventTime',
    location:      'venue',
    tagline:       'eventTagline',
    subtitle:      'eventTagline',
    eventSubtitle: 'eventTagline',
    postTagline:   'eventTagline',
  }
  const rawDynamicFields = dynamicSchema.schema?.fields || []
  const seenNormIds = new Set<string>()
  const dynamicFields = rawDynamicFields
    .map((f) => ({ ...f, id: FIELD_ID_NORMALIZER[f.id] ?? f.id }))
    .filter((f) => { if (seenNormIds.has(f.id)) return false; seenNormIds.add(f.id); return true })

  const staticFormatFields = selectedFormat ? getFormatFields(selectedFormat.id) : []
  const dynamicFieldIds = new Set(dynamicFields.map((f) => f.id))
  const missingStaticFields = staticFormatFields
    .filter((f) => !dynamicFieldIds.has(f.id))
    .map((f) => ({ ...f, placeholder: f.placeholder || '' }))
  const fields = [...dynamicFields, ...missingStaticFields]

  const requiredFields = fields.filter((f) => f.required)
  const optionalFields = fields.filter((f) => !f.required)

  // After AI extraction: only show optional fields that have a value (hide empty ones).
  // Required fields always show regardless. In manual mode, show everything.
  const getFieldRawValue = (fieldId: string): string => {
    // Try all possible IDs for this field via the API map
    for (const [, ids] of Object.entries(API_TO_SCHEMA_MAP)) {
      if (ids.includes(fieldId)) {
        for (const id of ids) {
          const v = (formData.formData[id] as string) || ''
          if (v.trim()) return v
        }
      }
    }
    return (formData.formData[fieldId] as string) || ''
  }
  const visibleFields = postExtraction
    ? fields.filter(f => f.required || !!getFieldRawValue(f.id).trim())
    : fields

  // When switching to post-extraction form view, mark all required fields as touched
  // so validation errors surface immediately for any fields the AI missed
  useEffect(() => {
    if (postExtraction && requiredFields.length > 0) {
      setTouchedFields(new Set(requiredFields.map(f => f.id)))
    }
  }, [postExtraction]) // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Find field value by trying multiple possible IDs
   * Same logic as wizard's findFieldValueBySchemaName
   */
  const findFieldValue = useCallback((
    apiFieldName: string,
    schemaFieldIds: string[]
  ): string => {
    const possibleIds = API_TO_SCHEMA_MAP[apiFieldName]
    if (!possibleIds) return ''

    // Priority 1: Try IDs that match current schema
    for (const id of possibleIds) {
      if (schemaFieldIds.includes(id)) {
        const value = (formData.formData[id] as string) || ''
        if (value.trim()) return value
      }
    }

    // Priority 2: Try all possible IDs in order
    for (const id of possibleIds) {
      const value = (formData.formData[id] as string) || ''
      if (value.trim()) return value
    }

    return ''
  }, [formData.formData])

  /**
   * Map schema field ID to API field name
   * Example: 'eventDescription' → 'description'
   */
  const mapSchemaFieldToApiField = useCallback((schemaFieldId: string): string | null => {
    for (const [apiField, schemaIds] of Object.entries(API_TO_SCHEMA_MAP)) {
      if (schemaIds.includes(schemaFieldId)) {
        return apiField
      }
    }
    return null
  }, [])

  const handleFieldChange = useCallback(
    (fieldId: string, value: string) => {
      // Store using canonical ID for consistency
      const canonicalId = resolveFieldId(fieldId)
      updateFormData({ [canonicalId]: value })
      // Mark field as touched when user interacts with it
      setTouchedFields(prev => new Set(prev).add(fieldId))
    },
    [updateFormData]
  )

  // Validate required fields and notify parent
  // Note: eventDate, eventTime, venue are always optional for poster generation
  const optionalOverrideFields = ['eventDate', 'eventTime', 'venue']

  useEffect(() => {
    if (!onValidationChange) return

    const fields = dynamicSchema.schema?.fields || []
    const schemaFieldIds = fields.map(f => f.id)
    const requiredFieldIds = fields
      .filter(f => f.required && !optionalOverrideFields.includes(f.id))
      .map(f => f.id)

    const missingFields = requiredFieldIds.filter(fieldId => {
      // Try to map to API field and find value
      const apiField = mapSchemaFieldToApiField(fieldId)
      const value = apiField
        ? findFieldValue(apiField, schemaFieldIds)
        : (formData.formData[fieldId] as string) || ''

      return !value || !value.trim()
    })

    const isValid = missingFields.length === 0
    onValidationChange(isValid, missingFields)
  }, [formData.formData, dynamicSchema.schema?.fields, onValidationChange, mapSchemaFieldToApiField, findFieldValue])

  // Render a single field - compact version
  const renderField = (field: DynamicSchemaField) => {
    const schemaFieldIds = fields.map(f => f.id)

    // Try to find value using API field mapping first
    const getFormValue = (fieldId: string): string => {
      // Map to API field name and try to find value
      const apiField = mapSchemaFieldToApiField(fieldId)
      if (apiField) {
        const value = findFieldValue(apiField, schemaFieldIds)
        if (value) return value
      }

      // Fallback: try direct access (for non-mapped fields)
      return (formData.formData[fieldId] as string) || ''
    }

    const value = getFormValue(field.id)

    // Validation state
    const isFieldTouched = touchedFields.has(field.id)
    const isEmpty = !value || !value.trim()
    const showError = field.required && isEmpty && isFieldTouched

    // Check if field is AI-suggestable using API field names
    const apiFieldName = mapSchemaFieldToApiField(field.id)
    const isSuggestable = apiFieldName ? AI_TEXT_FIELDS.includes(apiFieldName as any) : false

    // Get suggestion using API field name
    const suggestion = isSuggestable && apiFieldName && getSuggestion
      ? getSuggestion(apiFieldName as SuggestableField)
      : null

    // Request suggestion when user clicks the button
    const handleRequestSuggestion = async () => {
      if (onRequestSuggestions) {
        // Find title value using API field mapping
        const titleValue = findFieldValue('title', schemaFieldIds)

        if (titleValue && titleValue.length >= 5) {
          await onRequestSuggestions(titleValue)
        } else {
          toast.error('Enter at least 5 characters in the title to get suggestions')
        }
      }
    }

    // Accept suggestion
    const handleAcceptSuggestion = () => {
      if (suggestion && onAcceptSuggestion && apiFieldName) {
        onAcceptSuggestion(apiFieldName as SuggestableField)
      }
    }

    // Dismiss suggestion
    const handleDismissSuggestion = () => {
      if (onDismissSuggestion && apiFieldName) {
        onDismissSuggestion(apiFieldName as SuggestableField)
      }
    }

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor={field.id} className={cn(
            "text-sm font-semibold leading-none tracking-wide",
            showError ? "text-destructive" : "text-foreground/80"
          )}>
            <span className="flex items-center gap-1">
              {showError && <AlertCircle className="h-3 w-3" />}
              {field.label}
              {field.required && !['eventDate', 'eventTime', 'venue'].includes(field.id) && (
                <span className="text-destructive ml-0.5">*</span>
              )}
            </span>
          </Label>

          {/* AI Suggestion Button - Only for description/tagline */}
          {isSuggestable && !suggestion && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={handleRequestSuggestion}
              disabled={suggestionsLoading || !findFieldValue('title', schemaFieldIds)}
            >
              <Sparkles className="h-3 w-3 mr-1" />
              {suggestionsLoading ? 'Loading...' : 'Get AI Suggestion'}
            </Button>
          )}

          {/* Suggestion confidence indicator */}
          {isSuggestable && suggestion && (
            <div className="flex items-center gap-1 text-xs">
              <Sparkles className="h-3 w-3 text-purple-500" />
              <span className={cn(
                suggestion.confidence >= 0.7 ? 'text-green-600' :
                suggestion.confidence >= 0.5 ? 'text-yellow-600' :
                'text-gray-400'
              )}>
                {Math.round(suggestion.confidence * 100)}% confident
              </span>
            </div>
          )}
        </div>

        {field.type === 'textarea' ? (
          <Textarea
            id={field.id}
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            onBlur={() => setTouchedFields(prev => new Set(prev).add(field.id))}
            placeholder={field.placeholder}
            rows={field.rows || 3}
            maxLength={field.maxLength}
            className={cn(
              "resize-none text-sm min-h-[80px] bg-muted/30 border-border/60",
              showError && "border-destructive focus-visible:ring-destructive bg-destructive/5"
            )}
          />
        ) : field.type === 'date' ? (
          <Input
            id={field.id}
            type="date"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            onBlur={() => setTouchedFields(prev => new Set(prev).add(field.id))}
            className={cn(
              "h-10 text-sm bg-muted/30 border-border/60",
              showError && "border-destructive focus-visible:ring-destructive bg-destructive/5"
            )}
          />
        ) : field.type === 'time' ? (
          <Input
            id={field.id}
            type="time"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            onBlur={() => setTouchedFields(prev => new Set(prev).add(field.id))}
            className={cn(
              "h-10 text-sm bg-muted/30 border-border/60",
              showError && "border-destructive focus-visible:ring-destructive bg-destructive/5"
            )}
          />
        ) : field.type === 'select' && field.options ? (
          <select
            id={field.id}
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            onBlur={() => setTouchedFields(prev => new Set(prev).add(field.id))}
            className={cn(
              "w-full h-10 px-3 rounded-lg border border-border/60 bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-ring",
              showError && "border-destructive bg-destructive/5"
            )}
          >
            <option value="">{field.placeholder || 'Select...'}</option>
            {field.options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        ) : (
          <Input
            id={field.id}
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            onBlur={() => setTouchedFields(prev => new Set(prev).add(field.id))}
            placeholder={field.placeholder}
            maxLength={field.maxLength}
            className={cn(
              "h-10 text-sm bg-muted/30 border-border/60",
              showError && "border-destructive focus-visible:ring-destructive bg-destructive/5"
            )}
          />
        )}

        {/* Validation error message */}
        {showError && (
          <p className="text-xs text-destructive flex items-center gap-1 mt-1">
            <AlertCircle className="h-3 w-3" />
            This field is required
          </p>
        )}

        {/* Character counter */}
        {field.maxLength && value.length > 0 && !showError && (
          <p className="text-[11px] text-muted-foreground text-right tabular-nums">
            {value.length}/{field.maxLength}
          </p>
        )}

        {/* AI Suggestion Display */}
        {isSuggestable && suggestion && !value && (
          <div className="rounded-xl border border-violet-200/80 bg-violet-50/60 overflow-hidden">
            <div className="flex items-center gap-1.5 px-3 py-2 border-b border-violet-200/60 bg-violet-100/40">
              <Sparkles className="h-3 w-3 text-violet-600" />
              <span className="text-[11px] font-medium text-violet-700">AI Suggestion</span>
              <span className="ml-auto text-[10px] text-violet-500">
                {Math.round(suggestion.confidence * 100)}% confident
              </span>
            </div>
            <p className="px-3 py-2.5 text-xs text-violet-900/90 leading-relaxed italic">
              {suggestion.value}
            </p>
            <div className="flex border-t border-violet-200/60">
              <button
                onClick={handleAcceptSuggestion}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[12px] font-medium text-violet-700 hover:bg-violet-100/60 transition-colors"
              >
                <Check className="h-3.5 w-3.5" />
                Use this
              </button>
              <div className="w-px bg-violet-200/60" />
              <button
                onClick={handleDismissSuggestion}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[12px] font-medium text-muted-foreground hover:bg-muted/40 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (dynamicSchemaLoading) {
    return (
      <div className="h-full p-4 space-y-4 overflow-y-auto">
        <Skeleton className="h-8 w-32" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={embedded ? "flex flex-col" : "h-full flex flex-col overflow-hidden"}>
      {/* Content Area */}
      <div className={embedded ? "px-3 py-3 space-y-3" : "flex-1 overflow-y-auto px-3 py-3 space-y-3"}>
        {/* Smart Paste Mode (always active when organizationId present) */}
        {organizationId && !postExtraction ? (
          <div className="space-y-3">
            <SmartPasteInput
              onExtract={handleExtract}
              isExtracting={isExtracting}
              error={extractionError}
              compact
            />
          </div>
        ) : (
          <>
            {/* Post-extraction banner — only shown after AI paste */}
            {postExtraction && (
              <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-violet-500/8 border border-violet-400/30">
                <Sparkles className="h-3.5 w-3.5 text-violet-500 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-violet-700">AI filled your details</p>
                  <p className="text-[10px] text-violet-600/70 mt-0.5">Review below and fill in any missing fields</p>
                </div>
                <button
                  onClick={() => setPostExtraction(false)}
                  className="text-[10px] text-violet-500 hover:text-violet-700 font-medium underline underline-offset-2 shrink-0"
                >
                  Re-paste
                </button>
              </div>
            )}

            {/* All fields — single flat card, no section split */}
            {visibleFields.length > 0 && (
              <div className="rounded-2xl border border-border/50 bg-card shadow-sm overflow-hidden">
                <div className="divide-y divide-border/40">
                  {visibleFields.map((field) => (
                    <div key={field.id} className="px-3.5 py-3">
                      {renderField(field)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Speaker Section — always-open inline, no nesting */}
        {supportsSpeakerPhoto && (
          <InlineSpeakerSection
            speakers={speakerPhotoValue?.speakers || []}
            onAddSpeaker={() => {
              const current = speakerPhotoValue?.speakers || []
              handleSpeakerPhotoChange({ speakers: [...current, { id: crypto.randomUUID(), name: '', designation: '' }] })
            }}
            onRemoveSpeaker={(id) => {
              const updated = (speakerPhotoValue?.speakers || []).filter(s => s.id !== id)
              handleSpeakerPhotoChange({ speakers: updated, enabled: updated.some(s => s.name?.trim()) })
            }}
            onUpdateSpeaker={(id, updates) => {
              const updated = (speakerPhotoValue?.speakers || []).map(s => s.id === id ? { ...s, ...updates } : s)
              handleSpeakerPhotoChange({ speakers: updated, enabled: updated.some(s => s.name?.trim()) })
            }}
          />
        )}

        {/* Empty State */}
        {fields.length === 0 && !dynamicSchemaLoading && !supportsSpeakerPhoto && (
          <div className="text-center py-8 text-muted-foreground">
            <p>Select a format to see available fields</p>
          </div>
        )}
      </div>

      {/* Review Button - Fixed at bottom when form is valid */}
      {showReviewButton && onReviewClick && (
        <div className="shrink-0 px-4 py-3 border-t border-border/60 bg-card/95">
          <Button
            onClick={onReviewClick}
            className="w-full h-10 gap-2 text-sm font-semibold bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 hover:from-violet-600 hover:via-purple-600 hover:to-indigo-600 text-white shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-150"
          >
            <Sparkles className="h-4 w-4" />
            Review
          </Button>
        </div>
      )}

    </div>
  )
}

// ─── Inline Speaker Section ───────────────────────────────────────────────────
// Renders speaker fields directly — no nested expand/collapse, no separate step.
interface InlineSpeakerSectionProps {
  speakers: SpeakerItem[]
  onAddSpeaker: () => void
  onRemoveSpeaker: (id: string) => void
  onUpdateSpeaker: (id: string, updates: Partial<SpeakerItem>) => void
}

function InlineSpeakerSection({ speakers, onAddSpeaker, onRemoveSpeaker, onUpdateSpeaker }: InlineSpeakerSectionProps) {
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const [uploading, setUploading] = useState<string | null>(null)

  const handlePhotoUpload = async (speakerId: string, file: File) => {
    if (file.size > 5 * 1024 * 1024) { toast.error('Max 5MB'); return }
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) { toast.error('Use PNG, JPG, or WebP'); return }
    setUploading(speakerId)
    try {
      const url = await fileToDataUrl(file)
      onUpdateSpeaker(speakerId, { photoUrl: url })
    } catch { toast.error('Upload failed') }
    setUploading(null)
  }

  return (
    <div className="rounded-2xl border border-border/50 bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 pt-2.5 pb-2 border-b border-border/40">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-muted/60">
            <User className="h-3.5 w-3.5 text-foreground/60" />
          </div>
          <p className="text-[11px] font-bold tracking-widest uppercase text-muted-foreground/60">Speaker</p>
          {speakers.length > 0 && (
            <span className="bg-violet-500/10 text-violet-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {speakers.length}
            </span>
          )}
        </div>
        {speakers.length > 0 && speakers.length < 4 && (
          <button
            onClick={onAddSpeaker}
            className="flex items-center gap-1 text-[11px] font-semibold text-violet-600 hover:text-violet-700 px-2 py-1 rounded-lg hover:bg-violet-500/8 transition-colors"
          >
            <Plus className="h-3 w-3" /> Add
          </button>
        )}
      </div>

      {/* Body */}
      {speakers.length === 0 ? (
        /* Empty nudge */
        <button
          onClick={onAddSpeaker}
          className="w-full flex flex-col items-center gap-1.5 px-3.5 py-5 hover:bg-muted/20 transition-colors group"
        >
          <div className="h-10 w-10 rounded-full border-2 border-dashed border-border/50 flex items-center justify-center group-hover:border-violet-400/60 transition-colors">
            <User className="h-4 w-4 text-muted-foreground/30 group-hover:text-violet-400/70 transition-colors" />
          </div>
          <p className="text-[11px] text-muted-foreground/50 group-hover:text-muted-foreground/70 transition-colors">
            Tap to add speaker name &amp; photo
          </p>
        </button>
      ) : (
        /* Speaker rows — always expanded, no toggle */
        <div className="divide-y divide-border/30">
          {speakers.map((speaker, idx) => (
            <div key={speaker.id} className="px-3.5 py-3 space-y-2.5">
              {/* Row header: number + remove */}
              {speakers.length > 1 && (
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                    Speaker {idx + 1}
                  </span>
                  <button
                    onClick={() => onRemoveSpeaker(speaker.id)}
                    className="h-5 w-5 flex items-center justify-center rounded text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}

              {/* Name + Designation inline */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-muted-foreground/60">Name</label>
                  <Input
                    placeholder="Dr. Jane Smith"
                    value={speaker.name}
                    onChange={(e) => onUpdateSpeaker(speaker.id, { name: e.target.value })}
                    className="h-8 text-xs bg-muted/30 border-border/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-muted-foreground/60">Role</label>
                  <Input
                    placeholder="CEO, Company"
                    value={speaker.designation || ''}
                    onChange={(e) => onUpdateSpeaker(speaker.id, { designation: e.target.value })}
                    className="h-8 text-xs bg-muted/30 border-border/50"
                  />
                </div>
              </div>

              {/* Photo upload */}
              <input
                ref={(el) => { fileRefs.current[speaker.id] = el }}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (file) await handlePhotoUpload(speaker.id, file)
                  e.target.value = ''
                }}
              />
              {speaker.photoUrl ? (
                <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl border border-emerald-200/60 bg-emerald-50/40">
                  <div className="relative group shrink-0">
                    <img src={speaker.photoUrl} alt={speaker.name || 'Speaker'} className="w-10 h-10 rounded-lg object-cover ring-1 ring-emerald-300/50" />
                    <button
                      onClick={() => onUpdateSpeaker(speaker.id, { photoUrl: undefined })}
                      className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                      <Check className="h-3 w-3" /> Photo added
                    </p>
                    <button
                      onClick={() => fileRefs.current[speaker.id]?.click()}
                      className="text-[10px] text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
                    >
                      Change
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => fileRefs.current[speaker.id]?.click()}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl border-2 border-dashed border-border/40 hover:border-violet-300 hover:bg-violet-50/30 transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center shrink-0">
                    {uploading === speaker.id
                      ? <Loader2 className="h-3.5 w-3.5 text-violet-500 animate-spin" />
                      : <Camera className="h-3.5 w-3.5 text-muted-foreground group-hover:text-violet-500 transition-colors" />
                    }
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-medium text-foreground/70 group-hover:text-foreground transition-colors">
                      {uploading === speaker.id ? 'Uploading…' : 'Upload photo'}
                    </p>
                    <p className="text-[10px] text-muted-foreground">PNG, JPG · max 5MB</p>
                  </div>
                  <Upload className="h-3 w-3 text-muted-foreground/30 ml-auto shrink-0" />
                </button>
              )}

              {/* Remove button for single speaker */}
              {speakers.length === 1 && (
                <button
                  onClick={() => onRemoveSpeaker(speaker.id)}
                  className="text-[10px] text-muted-foreground/40 hover:text-destructive transition-colors"
                >
                  Remove speaker
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
