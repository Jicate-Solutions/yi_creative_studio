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
import { ChevronDown, ChevronUp, User, Sparkles, Check, X, AlertCircle, ClipboardPaste } from 'lucide-react'
import { SmartPasteSheet } from './SmartPasteSheet'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { DynamicSchemaField } from '@/lib/prompts/generate-fields-prompt'
import type { SpeakerPhotoCustomization } from '@/lib/config/design-constants'
import type { SuggestableField } from '@/types/suggestions'
import { getFormatCustomizationOptions } from '@/lib/config/format-customization'
import { getFormatFields } from '@/lib/schemas/formatFieldSchemas'
import { resolveFieldId, getField } from '@/lib/config/field-registry'
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
  const [smartPasteOpen, setSmartPasteOpen] = useState(false)

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
    eventTitle:  'eventName',
    title:       'eventName',
    description: 'eventDescription',
    date:        'eventDate',
    time:        'eventTime',
    startTime:   'eventTime',
    location:    'venue',
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
        if (value.trim()) return value.trim()
      }
    }

    // Priority 2: Try all possible IDs in order
    for (const id of possibleIds) {
      const value = (formData.formData[id] as string) || ''
      if (value.trim()) return value.trim()
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
      <div key={field.id} className="space-y-1">
        <div className="flex items-center justify-between">
          <Label htmlFor={field.id} className={cn(
            "text-xs font-medium",
            showError ? "text-destructive" : "text-muted-foreground"
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
              "resize-none text-sm min-h-[60px]",
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
              "h-9 text-sm",
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
              "h-9 text-sm",
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
              "w-full h-9 px-3 rounded-md border border-input bg-background text-sm",
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
              "h-9 text-sm",
              showError && "border-destructive focus-visible:ring-destructive"
            )}
          />
        )}

        {/* Validation error message */}
        {showError && (
          <p className="text-[10px] text-destructive flex items-center gap-1 mt-1">
            <AlertCircle className="h-3 w-3" />
            This field is required
          </p>
        )}

        {/* Character counter */}
        {field.maxLength && value.length > 0 && !showError && (
          <p className="text-[10px] text-muted-foreground text-right">
            {value.length}/{field.maxLength}
          </p>
        )}

        {/* AI Suggestion Display */}
        {isSuggestable && suggestion && !value && (
          <div className="p-2 bg-purple-50 border border-purple-200 rounded-md space-y-2">
            <p className="text-xs text-purple-900 italic">
              {suggestion.value}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="default"
                className="h-7 px-3 text-xs bg-purple-600 hover:bg-purple-700"
                onClick={handleAcceptSuggestion}
              >
                <Check className="h-3 w-3 mr-1" />
                Accept
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 px-3 text-xs"
                onClick={handleDismissSuggestion}
              >
                <X className="h-3 w-3 mr-1" />
                Dismiss
              </Button>
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
    <div className="h-full flex flex-col">
      {/* Scrollable Content Area */}
      <div className="flex-1 p-3 space-y-3 overflow-y-auto">
        {/* Compact Panel Header */}
        <div className="pb-2 border-b flex items-center justify-between">
          <h2 className="text-base font-semibold">{selectedFormat?.label || 'Details'}</h2>
          {organizationId && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setSmartPasteOpen(true)}
                  >
                    <ClipboardPaste className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Smart Paste - Extract from text</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {/* Required Fields - Compact spacing */}
        <div className="space-y-3">
          {requiredFields.map(renderField)}
        </div>

        {/* Optional Fields Toggle - More compact */}
        {optionalFields.length > 0 && (
          <Collapsible open={showMore} onOpenChange={setShowMore}>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <span className="flex items-center gap-1">
                {showMore ? 'Show less' : `+ ${optionalFields.length} optional`}
              </span>
              {showMore ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-3 pt-2 border-t">
                {optionalFields.map(renderField)}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Speaker Photo Section (if format supports it) */}
        {supportsSpeakerPhoto && (
          <Collapsible
            open={speakerSectionOpen}
            onOpenChange={setSpeakerSectionOpen}
            className="mt-6 border-t pt-4"
          >
            <CollapsibleTrigger className="flex items-center justify-between w-full text-left">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Speaker Photo</span>
                {speakerPhotoValue?.speakers && speakerPhotoValue.speakers.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    ({speakerPhotoValue.speakers.length} speaker{speakerPhotoValue.speakers.length > 1 ? 's' : ''})
                  </span>
                )}
              </div>
              {speakerSectionOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4">
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
        <div className="flex-none p-3 border-t bg-card/95 backdrop-blur">
          <Button
            onClick={onReviewClick}
            className="w-full h-11 gap-2 gradient-yi text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:brightness-110 transition-all duration-200"
          >
            <Sparkles className="h-4 w-4" />
            Review & Generate
          </Button>
        </div>
      )}

      {/* Smart Paste Sheet */}
      {organizationId && (
        <SmartPasteSheet
          open={smartPasteOpen}
          onOpenChange={setSmartPasteOpen}
          organizationId={organizationId}
          verticalSlug={selectedVertical?.slug}
          formatId={selectedFormat?.id}
        />
      )}
    </div>
  )
}
