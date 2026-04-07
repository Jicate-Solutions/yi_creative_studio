'use client'

import { useState, useCallback, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useCreativeStore } from '@/stores/creative-store'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { ChevronDown, ChevronUp, User, Sparkles, Check, X, AlertCircle } from 'lucide-react'
import { SmartPasteInput, ExtractionPreview } from '@/components/create/smart-paste'
import { useFieldExtraction } from '@/hooks/use-field-extraction'
import { cn } from '@/lib/utils'
import type { DynamicSchemaField } from '@/lib/prompts/generate-fields-prompt'
import type { SpeakerPhotoCustomization } from '@/lib/config/design-constants'
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

// Lazy load MultiSpeakerInput to reduce initial bundle size
const MultiSpeakerInput = dynamic(
  () => import('@/components/create/multi-speaker-input').then(mod => ({ default: mod.MultiSpeakerInput })),
  { ssr: false, loading: () => <Skeleton className="h-32 w-full" /> }
)

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

  const [showMore, setShowMore] = useState(false)
  const [speakerSectionOpen, setSpeakerSectionOpen] = useState(false)
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set())

  const {
    isExtracting,
    extractionError,
    extractionResult,
    extractFields,
    applyExtractedFields,
    applyExtractedSpeakers,
    clearExtraction,
    editExtractedField,
  } = useFieldExtraction({ organizationId: organizationId || '' })

  const handleExtract = useCallback(async (text: string) => {
    await extractFields(text, selectedVertical?.slug, selectedFormat?.id)
  }, [extractFields, selectedVertical?.slug, selectedFormat?.id])

  const handleApplyExtracted = useCallback((selectedFieldIds: string[]) => {
    applyExtractedFields(selectedFieldIds)
    toast.success('Fields applied — ready to generate!')
    clearExtraction()
  }, [applyExtractedFields, clearExtraction])

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
      <div key={field.id} className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor={field.id} className={cn(
            "text-[13px] font-medium leading-none",
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
            rows={field.rows || 2}
            maxLength={field.maxLength}
            className={cn(
              "resize-none text-sm min-h-[72px]",
              showError && "border-destructive focus-visible:ring-destructive"
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
              "h-10 text-sm",
              showError && "border-destructive focus-visible:ring-destructive"
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
              "h-10 text-sm",
              showError && "border-destructive focus-visible:ring-destructive"
            )}
          />
        ) : field.type === 'select' && field.options ? (
          <select
            id={field.id}
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            onBlur={() => setTouchedFields(prev => new Set(prev).add(field.id))}
            className={cn(
              "w-full h-10 px-3 rounded-md border border-input bg-background text-sm",
              showError && "border-destructive focus:ring-destructive"
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
              "h-10 text-sm",
              showError && "border-destructive focus-visible:ring-destructive"
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
    <div className="flex flex-col">
      {/* Content Area */}
      <div className="px-4 py-3 space-y-4">
        {/* Smart Paste Mode (always active when organizationId present) */}
        {organizationId ? (
          <div className="space-y-3">
            {!extractionResult ? (
              <SmartPasteInput
                onExtract={handleExtract}
                isExtracting={isExtracting}
                error={extractionError}
                compact
              />
            ) : (
              <ExtractionPreview
                result={extractionResult}
                onApply={handleApplyExtracted}
                onApplySpeakers={applyExtractedSpeakers}
                onCancel={clearExtraction}
                onEditField={editExtractedField}
              />
            )}
          </div>
        ) : (
          <>
            {/* Required Fields — card */}
            {requiredFields.length > 0 && (
              <div className="rounded-2xl border border-border/50 bg-card shadow-sm overflow-hidden">
                <div className="flex items-center gap-2.5 px-3.5 pt-3.5 pb-2.5">
                  <div className="p-1.5 rounded-lg bg-violet-500/10">
                    <Sparkles className="h-3.5 w-3.5 text-violet-500" />
                  </div>
                  <span className="text-[11px] font-bold tracking-widest uppercase text-muted-foreground/80">
                    {selectedFormat?.label || 'Event Details'}
                  </span>
                </div>
                <div className="px-3 pb-3 space-y-3">
                  {requiredFields.map(renderField)}
                </div>
              </div>
            )}

            {/* Optional Fields Toggle */}
            {optionalFields.length > 0 && (
              <Collapsible open={showMore} onOpenChange={setShowMore}>
                <CollapsibleTrigger className="flex items-center justify-between w-full py-2.5 px-3 rounded-xl bg-muted/40 hover:bg-muted/70 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-all duration-150 hover:scale-[1.01] border border-dashed border-border/60">
                  <span className="flex items-center gap-1.5">
                    {showMore ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    {showMore ? 'Hide optional fields' : `Show ${optionalFields.length} optional fields`}
                  </span>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="rounded-2xl border border-border/50 bg-card shadow-sm overflow-hidden mt-2">
                    <div className="px-3 pt-3 pb-3 space-y-3">
                      {optionalFields.map(renderField)}
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}
          </>
        )}

        {/* Speaker Photo Section (if format supports it) */}
        {supportsSpeakerPhoto && (
          <Collapsible
            open={speakerSectionOpen}
            onOpenChange={setSpeakerSectionOpen}
            className="mt-2 rounded-xl border border-border/60 overflow-hidden"
          >
            <CollapsibleTrigger className="flex items-center justify-between w-full text-left px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2.5">
                <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center">
                  <User className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="text-[13px] font-medium">Speaker Photo</span>
                {speakerPhotoValue?.speakers && speakerPhotoValue.speakers.length > 0 && (
                  <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                    {speakerPhotoValue.speakers.length}
                  </span>
                )}
              </div>
              {speakerSectionOpen ? (
                <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </CollapsibleTrigger>
            <CollapsibleContent className="border-t border-border/60">
              <div className="p-4">
              <MultiSpeakerInput
                speakers={speakerPhotoValue?.speakers || []}
                sharedSettings={{
                  shape: speakerPhotoValue?.shape || 'circle',
                  size: speakerPhotoValue?.size || 200,
                  border: speakerPhotoValue?.border || { width: 3, color: '#005B96' },
                  shadow: speakerPhotoValue?.shadow ?? true,
                  position: speakerPhotoValue?.position || 'center',
                  verticalPosition: speakerPhotoValue?.verticalPosition || 'middle',
                }}
                layoutMode={speakerPhotoValue?.layoutMode || 'auto'}
                layoutStrategy={speakerPhotoValue?.layoutStrategy}
                spacing={speakerPhotoValue?.spacing || 20}
                onAddSpeaker={() => {
                  const currentSpeakers = speakerPhotoValue?.speakers || []
                  handleSpeakerPhotoChange({
                    speakers: [
                      ...currentSpeakers,
                      {
                        id: crypto.randomUUID(),
                        name: '',
                        designation: '',
                      }
                    ]
                  })
                }}
                onRemoveSpeaker={(speakerId) => {
                  const currentSpeakers = speakerPhotoValue?.speakers || []
                  const updatedSpeakers = currentSpeakers.filter(s => s.id !== speakerId)
                  const hasAnyPhoto = updatedSpeakers.some(s => s.photoUrl)
                  handleSpeakerPhotoChange({
                    speakers: updatedSpeakers,
                    enabled: hasAnyPhoto
                  })
                }}
                onUpdateSpeaker={(speakerId, updates) => {
                  const currentSpeakers = speakerPhotoValue?.speakers || []
                  const updatedSpeakers = currentSpeakers.map(s =>
                    s.id === speakerId ? { ...s, ...updates } : s
                  )
                  const hasAnyPhoto = updatedSpeakers.some(s => s.photoUrl)
                  handleSpeakerPhotoChange({
                    speakers: updatedSpeakers,
                    enabled: hasAnyPhoto
                  })
                }}
                onUpdateSettings={(settings) => {
                  handleSpeakerPhotoChange(settings)
                }}
                onUpdateLayout={(layoutMode, layoutStrategy) => {
                  handleSpeakerPhotoChange({ layoutMode, layoutStrategy })
                }}
              />
              </div>
            </CollapsibleContent>
          </Collapsible>
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
        <div className="px-4 py-3 border-t border-border/60 bg-card/95">
          <Button
            onClick={onReviewClick}
            className="w-full h-10 gap-2 text-sm font-semibold bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 hover:from-violet-600 hover:via-purple-600 hover:to-indigo-600 text-white shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-150"
          >
            <Sparkles className="h-4 w-4" />
            Review & Generate
          </Button>
        </div>
      )}

    </div>
  )
}
