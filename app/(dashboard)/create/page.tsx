'use client'

import { useEffect, useState, useCallback, Suspense, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { useCreativeStore } from '@/stores/creative-store'
import { useVerticals, useAIModels, useLogos, useCredits, useOnlineStatus } from '@/hooks'
import { useEventSuggestions } from '@/hooks/use-event-suggestions'
import { useSSEGeneration } from '@/hooks/use-sse-generation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import type { TablesInsert, Json, BrandConfig } from '@/types/database.types'
import type { SuggestableField } from '@/types/suggestions'
import { getCreativeSchema } from '@/lib/schemas/creativeSchemas'
import { getFormatFields } from '@/lib/schemas/formatFieldSchemas'
import { FormatSelectionInline } from '@/components/create/format-selection'
import { CustomSizeForm } from '@/components/create/format-selection/custom-size-form'
import type { CreativeFormat } from '@/lib/config/creative-formats'
import { getFormatCustomizationOptions } from '@/lib/config/format-customization'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import {
  Sparkles,
  Loader2,
  Download,
  RefreshCw,
  RefreshCcw,
  ArrowLeft,
  ArrowRight,
  Check,
  Palette,
  FileImage,
  FileText,
  Image as ImageIcon,
  Wand2,
  LayoutGrid,
  User,
  LayoutTemplate,
  WifiOff,
  Save,
  Maximize2,
  ChevronDown,
} from 'lucide-react'
import { VerticalIcon } from '@/components/ui/vertical-icon'
import { Stepper, type Step } from '@/components/ui/stepper'
import {
  AISuggestionField,
  AISuggestionActions,
  AITriggerButton,
} from '@/components/create/ai-suggestion-field'
import { PastDateWarningDialog } from '@/components/create/past-date-warning-dialog'
import { SaveTemplateDialog } from '@/components/create/SaveTemplateDialog'
import { RegenerateModal, type RegenerateOptions } from '@/components/create/regenerate-modal'
import { CreateSidebar } from '@/components/create/create-sidebar'
import { useUIStore } from '@/stores/ui-store'

// Dynamic imports for heavy components - improves initial load time
const LogoStep = dynamic(
  () => import('@/components/create/logo-step').then(mod => ({ default: mod.LogoStep })),
  { loading: () => <ComponentLoadingSkeleton type="grid" /> }
)

const TemplateSelector = dynamic(
  () => import('@/components/create/template-selector').then(mod => ({ default: mod.TemplateSelector })),
  { loading: () => <ComponentLoadingSkeleton type="template" /> }
)

const ModeSelector = dynamic(
  () => import('@/components/create/mode-selector').then(mod => ({ default: mod.ModeSelector })),
  { loading: () => <ComponentLoadingSkeleton type="mode" /> }
)

const StylingStep = dynamic(
  () => import('@/components/create/styling-step').then(mod => ({ default: mod.StylingStep })),
  { loading: () => <ComponentLoadingSkeleton type="design" /> }
)

const SpeakerPhotoUpload = dynamic(
  () => import('@/components/create/speaker-photo-upload').then(mod => ({ default: mod.SpeakerPhotoUpload })),
  { loading: () => <ComponentLoadingSkeleton type="upload" /> }
)

const ExportModal = dynamic(
  () => import('@/components/export').then(mod => ({ default: mod.ExportModal })),
  { ssr: false }
)

const ImagePreviewModal = dynamic(
  () => import('@/components/create/image-preview-modal').then(mod => ({ default: mod.ImagePreviewModal })),
  { ssr: false }
)

const CreativeFeedbackDialog = dynamic(
  () => import('@/components/feedback/creative-feedback-dialog').then(mod => ({ default: mod.CreativeFeedbackDialog })),
  { ssr: false }
)

const DynamicDetailsForm = dynamic(
  () => import('@/components/create/DynamicDetailsForm').then(mod => ({ default: mod.DynamicDetailsForm })),
  { loading: () => <ComponentLoadingSkeleton type="design" /> }
)

const ProgressiveLoadingUI = dynamic(
  () => import('@/components/create/progressive-loading-ui').then(mod => ({ default: mod.ProgressiveLoadingUI })),
  { ssr: false }
)

// Loading skeleton for dynamically imported components
function ComponentLoadingSkeleton({ type }: { type: 'preview' | 'grid' | 'template' | 'mode' | 'design' | 'upload' }) {
  const skeletonClasses = "animate-pulse bg-muted/60 rounded-xl transition-colors"

  return (
    <div role="status" aria-label="Loading content" className="w-full">
      <span className="sr-only">Loading...</span>
      {type === 'preview' && (
        <div className="space-y-4">
          <div className={`${skeletonClasses} aspect-[3/4] w-full`} />
          <div className={`${skeletonClasses} h-10 w-full`} />
        </div>
      )}
      {type === 'template' && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={`${skeletonClasses} aspect-[3/4]`} />
          ))}
        </div>
      )}
      {type === 'mode' && (
        <div className="grid grid-cols-2 gap-4">
          <div className={`${skeletonClasses} h-40 rounded-2xl`} />
          <div className={`${skeletonClasses} h-40 rounded-2xl`} />
        </div>
      )}
      {type === 'design' && (
        <div className="space-y-4">
          <div className={`${skeletonClasses} h-12 w-full`} />
          <div className={`${skeletonClasses} h-64 w-full`} />
        </div>
      )}
      {type === 'grid' && (
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className={`${skeletonClasses} aspect-square`} />
          ))}
        </div>
      )}
      {type === 'upload' && (
        <div className={`${skeletonClasses} h-32 w-full`} />
      )}
      {!['preview', 'template', 'mode', 'design', 'grid', 'upload'].includes(type) && (
        <div className={`${skeletonClasses} h-24 w-full`} />
      )}
    </div>
  )
}

import { ROUTES } from '@/lib/config/constants'
import { isPastDate } from '@/lib/utils/date-utils'
import type { CreationMode } from '@/types/design.types'
import type { SpeakerPhotoCustomization, CustomColors } from '@/lib/config/design-constants'
import { cn } from '@/lib/utils'

// Display-friendly names for AI models (hide technical names from users)
const getModelDisplayName = (slug: string) => {
  const displayNames: Record<string, string> = {
    'ideogram': 'Smart Design',
    'gemini': 'Creative Poster',
    'gemini-3-pro-image-preview': 'Ultra PRO 10',
  }
  return displayNames[slug] || slug
}

// Default speaker photo configuration
const DEFAULT_SPEAKER_PHOTO: SpeakerPhotoCustomization = {
  enabled: false,
  shape: 'circle',
  size: 200,
  position: 'center',
  verticalPosition: 'lower',
  border: { width: 2, color: '#FFFFFF' },
  shadow: true,
  speakers: [], // FIX #3: Include speakers array to prevent update bugs
}

// Step definitions - Details moved before Styling so AI theme suggestions have event context
const STEPS: Step[] = [
  { id: 1, title: 'Format', icon: <LayoutGrid className="h-4 w-4" /> },
  { id: 2, title: 'Vertical', icon: <Palette className="h-4 w-4" /> },
  { id: 3, title: 'Mode', icon: <Sparkles className="h-4 w-4" /> },
  { id: 4, title: 'Logos', icon: <ImageIcon className="h-4 w-4" /> },
  { id: 5, title: 'Details', icon: <FileText className="h-4 w-4" /> },
  { id: 6, title: 'Styling', icon: <Palette className="h-4 w-4" /> },
  { id: 7, title: 'Generate', icon: <Wand2 className="h-4 w-4" /> },
]

export default function CreatePage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const { currentOrganization, user } = useAuthStore()

  // Feature flag: Enable streaming for progressive UI
  const STREAMING_ENABLED = process.env.NEXT_PUBLIC_ENABLE_STREAMING === 'true'

  const { verticals, selectedVertical, selectVertical, isLoading: isVerticalsLoading, error: verticalsError, fetchVerticals } = useVerticals()
  const { models, selectedModel, selectModel, getModelCost } = useAIModels()
  const { logos, fetchLogos } = useLogos()
  const { canAfford, deductCredits, balance: creditsBalance } = useCredits()
  const { isOnline } = useOnlineStatus()

  // SSE Streaming hook (Phase 2 optimization)
  const streaming = useSSEGeneration({
    onComplete: (result) => {
      setGeneratedImage(result.finalImageUrl)
      setCreativeId(result.creativeId)
      setGenerating(false)
      toast.success('Creative generated successfully!')
    },
    onError: (error) => {
      setGenerationError(error.message)
      setGenerating(false)
      toast.error('Generation failed: ' + error.message)
    },
  })

  const {
    formData,
    updateFormData,
    isGenerating,
    setGenerating,
    generatedImage,
    setGeneratedImage,
    generationError,
    setGenerationError,
    selectedTemplate,
    selectTemplate,
    resetForm,
    // Design mode actions
    setCreationMode,
    updateTheme,
    updateStyle,
    updateAspectRatio,
    updateResolution,
    updateCustomization,
    updateExportSettings,
    // Color configuration actions
    setUseBrandColors,
    updateTypography,
    setColorPalette,
    setCustomColors,
    // Format selection
    selectedFormat,
    selectFormat,
    setCustomDimensions,
    getFormatDimensions,
    // Dynamic schema (AI-generated form fields)
    dynamicSchema,
    generateDynamicSchema,
    clearDynamicSchema,
    // Template resize (Canva-style Magic Resize)
    templateResize,
    checkTemplateFormatMismatch,
    resizeTemplateToFormat,
    clearResizedTemplate,
    applyOptimizedPlacements,
  } = useCreativeStore()

  // UI Store for create mode sidebar
  const { enterCreateMode, exitCreateMode, createModeActive } = useUIStore()

  // Enter create mode on mount (hides parent sidebar, shows create sidebar)
  useEffect(() => {
    enterCreateMode()
    return () => exitCreateMode()
  }, [enterCreateMode, exitCreateMode])



  // Intelligent Start Logic
  // Stores a temporary state to ensure we only jump to step 5 once data is synced
  // Reset form when entering create page for a fresh start
  // This clears previous session data (logos, vertical, form fields)
  useEffect(() => {
    resetForm()
  }, [])

  // Always start at step 1 (format selection) when visiting create page
  const [step, setStep] = useState(1)
  const [isStepProcessing, setIsStepProcessing] = useState(false)
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [saveTemplateDialogOpen, setSaveTemplateDialogOpen] = useState(false)
  const [regenerateModalOpen, setRegenerateModalOpen] = useState(false)
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [creativeId, setCreativeId] = useState<string | null>(null)
  const [showPastDateWarning, setShowPastDateWarning] = useState(false)
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false)
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null)

  // Handle format selection - auto advance to step 2 (Vertical)
  const handleSelectFormat = useCallback((format: CreativeFormat) => {
    selectFormat(format.id)
    setStep(2)
  }, [selectFormat])

  // AI Suggestions hook
  const {
    isLoading: isSuggestionsLoading,
    error: suggestionsError,
    hasSuggestions,
    requestSuggestions,
    acceptSuggestion,
    dismissSuggestion,
    acceptAllSuggestions,
    dismissAllSuggestions,
    getSuggestion,
  } = useEventSuggestions({
    organizationId: currentOrganization?.id || '',
    organizationType: currentOrganization?.type || 'yi_chapter',
  })

  // Helper: Map API field names to all possible schema field IDs
  const API_TO_SCHEMA_MAP: Record<string, string[]> = {
    'date': ['eventDate', 'date', 'certificateDate', 'postDate'],
    'time': ['eventTime', 'time'],
    'venue': ['venue', 'eventVenue', 'location'],
    'speaker': ['speaker', 'speakerName', 'guestSpeaker', 'recipientName'],
    'description': ['eventDescription', 'description', 'achievementDescription', 'postDescription'],
    'title': ['eventName', 'eventTitle', 'title', 'postTitle', 'certificateTitle', 'articleTitle', 'linkedinHeadline', 'pinTitle', 'tweetText'],
  }

  /**
   * Finds the first non-empty value for a field by trying multiple possible IDs
   * @param schemaName - Semantic field name (e.g., 'title', 'date')
   * @param formDataObj - Form data to search
   * @param schemaFieldIds - Available field IDs from current schema
   * @returns { fieldId, value } or null if not found
   */
  const findFieldValueBySchemaName = useCallback(
    (
      schemaName: keyof typeof API_TO_SCHEMA_MAP,
      formDataObj: Record<string, unknown>,
      schemaFieldIds?: string[]
    ): { fieldId: string; value: string } | null => {
      const possibleIds = API_TO_SCHEMA_MAP[schemaName]
      if (!possibleIds || possibleIds.length === 0) return null

      // Priority 1: Match against schema field IDs if available
      if (schemaFieldIds && schemaFieldIds.length > 0) {
        const matchingId = possibleIds.find(id => schemaFieldIds.includes(id))
        if (matchingId) {
          const value = (formDataObj[matchingId] as string) || ''
          if (value.trim().length > 0) {
            return { fieldId: matchingId, value: value.trim() }
          }
        }
      }

      // Priority 2: Try all possible IDs in order
      for (const fieldId of possibleIds) {
        const value = (formDataObj[fieldId] as string) || ''
        if (value.trim().length > 0) {
          return { fieldId, value: value.trim() }
        }
      }

      return null
    },
    []
  )

  // Get the title field ID dynamically - uses smart field finder
  const getTitleFieldId = useCallback(() => {
    const formDataObj = formData.formData as Record<string, unknown>
    const schemaFieldIds = dynamicSchema.schema?.fields?.map(f => f.id) ||
      (selectedFormat?.id ? getFormatFields(selectedFormat.id, selectedVertical?.slug).map(f => f.id) : [])

    const result = findFieldValueBySchemaName('title', formDataObj, schemaFieldIds)
    return result?.fieldId || API_TO_SCHEMA_MAP['title'][0]
  }, [selectedFormat?.id, selectedVertical?.slug, dynamicSchema.schema, formData.formData])

  // Handle AI suggestion trigger
  const handleRequestSuggestions = useCallback(async () => {
    const formDataObj = formData.formData as Record<string, unknown>
    const schemaFieldIds = dynamicSchema.schema?.fields?.map(f => f.id) ||
      (selectedFormat?.id ? getFormatFields(selectedFormat.id, selectedVertical?.slug).map(f => f.id) : [])

    const titleResult = findFieldValueBySchemaName('title', formDataObj, schemaFieldIds)

    if (!titleResult || titleResult.value.length < 5) {
      toast.error('Enter at least 5 characters in the title to get suggestions')
      return
    }

    await requestSuggestions(titleResult.value)
  }, [formData.formData, selectedFormat?.id, selectedVertical?.slug, requestSuggestions, dynamicSchema.schema])

  // Get field value helper
  const getFieldValue = useCallback(
    (field: SuggestableField): string => {
      return ((formData.formData as Record<string, unknown>)[field] as string) || ''
    },
    [formData.formData]
  )

  // Update field value helper
  const setFieldValue = useCallback(
    (field: SuggestableField, value: string) => {
      updateFormData({ [field]: value })
    },
    [updateFormData]
  )

  useEffect(() => {
    fetchLogos()
  }, [fetchLogos])

  // Trigger dynamic schema generation when vertical is selected (background, non-blocking)
  useEffect(() => {
    if (selectedVertical && formData.formatId) {
      // Generate dynamic schema in background - user can continue through steps
      generateDynamicSchema(
        formData.formatId,
        selectedVertical.slug,
        currentOrganization?.id
      )
    } else {
      clearDynamicSchema()
    }
  }, [selectedVertical?.id, formData.formatId, generateDynamicSchema, clearDynamicSchema, currentOrganization?.id])

  // Track which template+format combinations have been resized to prevent duplicate calls
  const resizeAttemptedRef = useRef<string | null>(null)

  // Clear resized template when format changes (user selected a different format)
  useEffect(() => {
    clearResizedTemplate()
    // Reset the resize attempt tracker when format changes
    resizeAttemptedRef.current = null
  }, [selectedFormat?.id, clearResizedTemplate])

  // Auto-resize template when format mismatches (Canva-style Magic Resize)
  useEffect(() => {
    const currentKey = `${selectedTemplate?.id}-${selectedFormat?.id}`

    // Skip if we've already attempted this combination
    if (resizeAttemptedRef.current === currentKey) {
      return
    }

    const shouldResize = checkTemplateFormatMismatch()
    if (shouldResize && selectedTemplate && selectedFormat && !templateResize.isResizing) {
      resizeAttemptedRef.current = currentKey
      resizeTemplateToFormat()
    }
  }, [selectedTemplate?.id, selectedFormat?.id, checkTemplateFormatMismatch, resizeTemplateToFormat, templateResize.isResizing])

  // Show toast notification for resize errors
  useEffect(() => {
    if (templateResize.resizeError) {
      toast.error(`Template resize failed: ${templateResize.resizeError}`, {
        description: 'Using original template instead.',
      })
    }
  }, [templateResize.resizeError])

  const creditCost = getModelCost()
  const canGenerate = selectedVertical && selectedModel && canAfford(creditCost) && isOnline

  async function handleGenerate(overrideModel?: { model_id: string; provider: string }) {
    // Use override model if provided (from regenerate), otherwise use selected model
    const modelToUse = overrideModel || selectedModel

    if (!modelToUse || !selectedVertical || !currentOrganization || !isOnline) {
      toast.error('Please complete all fields and ensure you have enough credits')
      return
    }

    setGenerating(true)
    setGenerationError(null)

    try {
      // Deduct credits first
      const result = await deductCredits(
        creditCost,
        `Generated ${selectedVertical.name} creative`,
      )

      if (!result) {
        setGenerating(false)
        return
      }

      // Logo positions optimization
      // The optimizer now respects user's strip placement (row) while distributing
      // logos evenly WITHIN each strip for visual balance
      let optimizedPlacements = formData.logosPlacements

      if (formData.logosPlacements.length > 0) {
        // Run optimization - it will respect the user's strip (row) choices
        try {
          const optimizeResponse = await fetch('/api/optimize-logo-positions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              logos: formData.logosPlacements.map(p => ({
                id: p.logoId,
                name: p.logo?.name || '',
                type: p.logoType || 'other',
              })),
              formatId: formData.formatId || 'event_poster',
              useAI: false, // Fast algorithm, no AI cost
              currentPlacements: formData.logosPlacements.map(p => ({
                logoId: p.logoId,
                position: p.position,
                size: p.size,
                backgroundShape: p.backgroundShape,
                backgroundStyle: p.backgroundStyle,
              })),
            }),
          })

          const optimizeData = await optimizeResponse.json()

          if (optimizeData.success && optimizeData.placements) {
            // Merge optimized positions with current placement data
            optimizedPlacements = formData.logosPlacements.map(current => {
              const optimized = optimizeData.placements.find((o: { logoId: string }) => o.logoId === current.logoId)
              if (optimized) {
                return {
                  ...current,
                  position: optimized.position || current.position,
                  size: optimized.size || current.size,
                }
              }
              return current
            })
          }
        } catch (optimizeError) {
          // Silently continue with original placements if optimization fails
          console.warn('Logo optimization failed, using original placements:', optimizeError)
        }
      }

      // Build prompt from vertical template and form data
      let prompt = selectedVertical.prompt_template

      // Map form field names to template variable names (comprehensive mapping)
      const fieldToTemplateVar: Record<string, string> = {
        // Event name variations
        title: 'eventName',
        eventName: 'eventName',
        name: 'eventName',
        eventTitle: 'eventName',
        // Date variations
        date: 'eventDate',
        eventDate: 'eventDate',
        // Time variations
        time: 'eventTime',
        eventTime: 'eventTime',
        // Venue variations
        venue: 'venueName',
        venueName: 'venueName',
        location: 'venueName',
        // Speaker variations
        speaker: 'speakerName',
        speakerName: 'speakerName',
        guest: 'speakerName',
        guestName: 'speakerName',
        chiefGuest: 'speakerName',
        // Designation variations
        designation: 'speakerDesignation',
        speakerDesignation: 'speakerDesignation',
        guestDesignation: 'speakerDesignation',
        // Description
        description: 'description',
        additionalInfo: 'description',
      }

      // Helper: Check if value is valid for replacement
      const isValidValue = (value: unknown): value is string | number => {
        return value !== undefined && value !== null && value !== '' && String(value).trim() !== ''
      }

      // Replace template variables with form data (handling both mappings and direct names)
      Object.entries(formData.formData).forEach(([key, value]) => {
        if (isValidValue(value)) {
          const templateVar = fieldToTemplateVar[key] || key
          const safeValue = String(value).trim()
          // Replace mapped variable (e.g., {{eventName}})
          prompt = prompt.replace(new RegExp(`{{${templateVar}}}`, 'g'), safeValue)
          // Also replace direct variable name (e.g., {{title}}) for backwards compatibility
          prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), safeValue)
        }
      })

      // Handle vertical-specific fields from form_fields
      if (selectedVertical.form_fields) {
        const verticalFields = selectedVertical.form_fields as Array<{ name: string }>
        verticalFields.forEach((field) => {
          const value = (formData.formData as Record<string, unknown>)[field.name]
          if (isValidValue(value)) {
            prompt = prompt.replace(new RegExp(`{{${field.name}}}`, 'g'), String(value).trim())
          }
        })
      }

      // CRITICAL: Clean any remaining unreplaced placeholders to prevent them from appearing in images
      prompt = prompt.replace(/\{\{[a-zA-Z_]+\}\}/g, '').replace(/\s+/g, ' ').trim()

      // === SPEAKER DATA EXTRACTION ===
      // MultiSpeakerInput stores speakers in designData.customization.speakerPhoto
      // Extract and add to userFormData for AI prompt building
      const speakerPhotoData = formData.designData?.customization?.speakerPhoto
      const speakers = speakerPhotoData?.speakers || []

      // DIAGNOSTIC: Log speaker photo data before submission
      console.log('[CREATE PAGE] Speaker Photo Data Check:', {
        enabled: speakerPhotoData?.enabled,
        speakerCount: speakers.length,
        speakersWithPhotos: speakers.filter(s => s.photoUrl).length,
        speakers: speakers.map(s => ({
          id: s.id,
          name: s.name,
          designation: s.designation,
          hasPhoto: !!s.photoUrl,
          photoUrlPrefix: s.photoUrl?.substring(0, 50) + '...' // First 50 chars
        }))
      })

      // Enrich form data with organization name from branding settings
      // Organization name ALWAYS comes from branding - prevents users from accidentally
      // overwriting it with RSVP/contact info in the form
      const enrichedFormData = {
        ...formData.formData,
        // ALWAYS use organization name from branding settings (ignore any form field value)
        organizationName: currentOrganization?.name || 'Yi',

        // Include speakers array if present (for multi-speaker support)
        ...(speakers.length > 0 && {
          speakers: speakers.map(s => ({
            name: s.name,
            designation: s.designation,
            photoUrl: s.photoUrl, // Include photo data URL for speaker photo overlay
          }))
        }),
      }

      // FIX #3: PRE-API diagnostic - Show EXACT speaker photo data being sent to API
      console.log('[CREATE PAGE] PRE-API Speaker Diagnostic:', {
        fromDesignData: formData.designData?.customization?.speakerPhoto?.speakers?.map(s => ({
          id: s.id,
          name: s.name,
          designation: s.designation,
          hasPhotoUrl: !!s.photoUrl,
          photoUrlPrefix: s.photoUrl?.substring(0, 50) || 'NONE',
          photoUrlLength: s.photoUrl?.length || 0
        })),
        fromUserFormData: enrichedFormData.speakers?.map(s => ({
          name: s.name,
          designation: s.designation,
          hasPhotoUrl: !!s.photoUrl,
          photoUrlLength: s.photoUrl?.length || 0
        }))
      })

      // Call generation API with format info
      const formatDimensions = getFormatDimensions()

      // DIAGNOSTIC: Log API request body structure before submission
      console.log('[CREATE PAGE] API Request Body:', {
        creationMode: formData.creationMode,
        hasDesignData: !!formData.designData,
        speakerPhotoPath: formData.creationMode === 'scratch'
          ? 'designData (full)'
          : 'designData.customization.speakerPhoto',
        speakerPhotoEnabled: formData.designData?.customization?.speakerPhoto?.enabled,
        speakerPhotoSpeakers: formData.designData?.customization?.speakerPhoto?.speakers?.length || 0
      })

      // SAFETY NET: Ensure speaker photos are enabled if speakers have photos
      // This catches cases where the MultiSpeakerInput component didn't auto-enable
      const speakerPhoto = formData.designData?.customization?.speakerPhoto
      if (speakerPhoto?.speakers && speakerPhoto.speakers.some(s => s.photoUrl)) {
        if (!speakerPhoto.enabled) {
          console.log('[CREATE PAGE] Auto-enabling speaker photos (fallback check)', {
            speakersWithPhotos: speakerPhoto.speakers.filter(s => s.photoUrl).length
          })
          formData.designData.customization.speakerPhoto.enabled = true
        }
      }

      // === PHASE 2: STREAMING vs LEGACY GENERATION ===
      // Use SSE streaming if feature flag enabled, otherwise use legacy endpoint
      const generationPayload = {
        prompt,
        model: modelToUse.model_id,
        provider: modelToUse.provider,
        verticalSlug: selectedVertical.slug,
        logosPlacements: optimizedPlacements,
        logoBackgroundColor: formData.logoBackgroundColor,
        logoStripMode: formData.logoStripMode,
        organizationId: currentOrganization.id,
        templateId: selectedTemplate?.id || null,
        templateUrl: selectedTemplate?.image_url || null,
        creationMode: formData.creationMode,
        designData: formData.creationMode === 'scratch'
          ? formData.designData
          : { customization: { speakerPhoto: formData.designData?.customization?.speakerPhoto } },
        formatId: formData.formatId || null,
        customDimensions: formData.customDimensions || null,
        language: formData.formData?.language || 'en',
        userFormData: enrichedFormData,
      }

      if (STREAMING_ENABLED) {
        // === PHASE 2: SSE STREAMING (Progressive UI) ===
        console.log('[Create] Using SSE streaming generation')
        await streaming.startGeneration({ formData: generationPayload })
        // Note: onComplete callback will handle setGeneratedImage and save to DB
        return // Exit early - streaming handles the rest
      }

      // === LEGACY: Traditional generation (fallback) ===
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(generationPayload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Generation failed')
      }

      setGeneratedImage(data.imageUrl)

      // Use server-generated thumbnail for gallery preview
      // Thumbnail is generated server-side to avoid CORS issues with client Canvas
      const thumbnailUrl: string | null = data.thumbnailUrl || null

      // Save creative to database
      // v4.1: Include A/B testing columns for prevention effectiveness measurement
      const creativeInsert: TablesInsert<'creatives'> = {
        organization_id: currentOrganization.id,
        created_by: user?.id ?? null,
        ai_model: selectedModel?.name ?? modelToUse.model_id,
        ai_model_id: selectedModel?.id ?? modelToUse.model_id,
        creative_type: 'event_poster',
        vertical: selectedVertical.slug,
        credits_used: creditCost,
        image_url: data.imageUrl,
        thumbnail_url: thumbnailUrl,
        form_data: formData.formData as Json,
        prompt_used: prompt,
        title: (formData.formData as { title?: string }).title || `${selectedVertical.name} Creative`,
        logo_config: formData.logosPlacements as unknown as Json,
        // A/B testing columns - tracks whether prevention was applied or creative was in holdout group
        prevention_applied: data.preventionApplied ?? null,
        prevention_holdout: data.preventionHoldout ?? false,
      }
      const { data: creativeData } = await supabase
        .from('creatives')
        .insert(creativeInsert)
        .select('id')
        .single()

      if (creativeData?.id) {
        setCreativeId(creativeData.id)
        setGeneratedPrompt(prompt)

        // Backfill api_usage records with the new creative_id
        // This links token consumption to the specific creative
        if (user?.id) {
          try {
            const { error: backfillError } = await supabase.rpc('backfill_api_usage_creative_id', {
              p_creative_id: creativeData.id,
              p_organization_id: currentOrganization.id,
              p_user_id: user.id,
              p_created_at: new Date().toISOString(),
              p_window_seconds: 120,
            })

            if (backfillError) {
              console.error('[API Usage] Failed to backfill creative_id:', backfillError)
            }
          } catch (err) {
            console.error('[API Usage] Backfill error:', err)
          }
        }
        // Feedback dialog is now triggered after download in export modal
      }

      toast.success('Creative generated successfully!')
      setTimeout(() => {
        setShowFeedbackDialog(true)
      }, 2500)
      // Stay on step 6 to show download options (don't change step)
    } catch (error) {
      console.error('Generation error:', error)
      setGenerationError(error instanceof Error ? error.message : 'Generation failed')
      toast.error('Failed to generate creative')
    } finally {
      setGenerating(false)
    }
  }

  function handleStartOver() {
    resetForm()
    setStep(1)
    setCreativeId(null)
    setGeneratedPrompt(null)
    setExportModalOpen(false)
    setShowFeedbackDialog(false)
  }

  // Handle regeneration with different model/settings
  async function handleRegenerate(options: RegenerateOptions) {
    setRegenerateModalOpen(false)

    const regenerateModel = models.find(m => m.id === options.modelId)
    if (!regenerateModel) {
      toast.error('Invalid model selected')
      return
    }

    const modelCreditCost = regenerateModel.credits_cost
    if (!canAfford(modelCreditCost)) {
      toast.error('Insufficient credits')
      return
    }

    // Update model selection
    selectModel(options.modelId)

    // Update theme/style/resolution if provided (scratch mode only)
    if (formData.creationMode === 'scratch') {
      if (options.theme) updateTheme(options.theme)
      if (options.style) updateStyle(options.style)
      if (options.resolution) updateResolution(options.resolution)
    }

    // Clear previous image and regenerate
    setGeneratedImage(null)
    setCreativeId(null)

    // Pass the model directly to avoid React closure issues
    // (state update from selectModel won't be captured by handleGenerate's closure)
    handleGenerate({
      model_id: regenerateModel.model_id,
      provider: regenerateModel.provider,
    })
  }

  // Check for past date before generating (Edge Case E07)
  function handleGenerateWithDateCheck() {
    const eventDate = (formData.formData as { date?: string }).date
    if (eventDate && isPastDate(eventDate)) {
      setShowPastDateWarning(true)
    } else {
      handleGenerate()
    }
  }

  // Navigation handlers
  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleNext = async () => {
    // Step 4: Auto-optimize logo placement before continuing
    if (step === 4 && formData.logosPlacements.length > 0) {
      setIsStepProcessing(true)
      try {
        const speakerPhotoConfig = formData.designData?.customization?.speakerPhoto

        const response = await fetch('/api/optimize-logo-positions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            logos: formData.logosPlacements.map(p => ({
              id: p.logoId,
              name: p.logo?.name || '',
              type: p.logoType || 'other',
            })),
            formatId: formData.formatId || 'event_poster',
            useAI: false, // Fast, deterministic algorithm
            currentPlacements: formData.logosPlacements.map(p => ({
              logoId: p.logoId,
              position: p.position,
              size: p.size,
              backgroundShape: p.backgroundShape,
              backgroundStyle: p.backgroundStyle,
            })),
            speakerPhoto: speakerPhotoConfig,
          }),
        })

        const data = await response.json()

        if (data.success && data.placements) {
          applyOptimizedPlacements(data.placements)
          toast.success('Logo layout optimized automatically')
        }
      } catch (error) {
        console.error('Auto-optimization failed:', error)
        // Fail silently and proceed - don't block user
      } finally {
        setIsStepProcessing(false)
      }
    }

    if (step < 7) setStep(step + 1)
  }

  const canProceed = () => {
    switch (step) {
      case 1:
        return !!selectedFormat
      case 2:
        return !!selectedVertical
      case 3:
        return !!formData.creationMode
      case 4:
        return true // Logos are optional (Smart Layout - AI knows positions)
      case 5:
        // Details step - Check if user has entered any form data
        // The form has its own validation, we just need to ensure the user has started filling it
        const userFormData = formData.formData as Record<string, unknown>
        const hasAnyFormData = Object.keys(userFormData).some(key => {
          const value = userFormData[key]
          if (value === undefined || value === null) return false
          if (typeof value === 'string') return value.trim().length > 0
          if (typeof value === 'object') return true // Date objects, arrays, etc.
          return !!value
        })
        return hasAnyFormData
      case 6:
        return true // Template is optional
      default:
        return true
    }
  }

  // Handle Enter key to proceed to next step (Continue button)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger on Enter key
      if (e.key !== 'Enter') return

      // Don't trigger if user is typing in an input field, textarea, or contenteditable
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        target.closest('[role="dialog"]') || // Don't trigger in modals
        target.closest('[role="combobox"]') // Don't trigger in dropdowns
      ) {
        return
      }

      // Only proceed if on steps 1-6 (Continue button visible) and can proceed
      if (step < 7 && !isGenerating && canProceed()) {
        e.preventDefault()
        handleNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [step, isGenerating, selectedFormat, selectedVertical, formData])

  return (
    <TooltipProvider>
      <div className="flex h-screen overflow-hidden">
        {/* Create Sidebar - Left (Desktop only) */}
        {createModeActive && (
          <CreateSidebar
            steps={STEPS}
            currentStep={step}
            onStepClick={(stepId) => {
              if (stepId < step && !isGenerating) setStep(stepId)
            }}
            isGenerating={isGenerating}
          />
        )}

        {/* Main Content Area */}
        <div className={cn(
          "flex-1 flex flex-col min-w-0 overflow-hidden",
          createModeActive && "md:ml-64"
        )}>
          {/* Mobile Step Indicator - Sticky on mobile, hidden on desktop */}
          <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b md:hidden">
            <div className="px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center",
                    isGenerating ? "bg-primary animate-pulse" : "bg-primary/10"
                  )}>
                    {isGenerating ? (
                      <Loader2 className="h-4 w-4 text-white animate-spin" />
                    ) : (
                      STEPS[step - 1]?.icon
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {isGenerating ? 'Creating your design...' : STEPS[step - 1]?.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isGenerating ? 'Please wait' : `Step ${step} of 7`}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground font-medium">
                  {isGenerating ? (
                    <span className="text-primary animate-pulse">Generating...</span>
                  ) : (
                    `${Math.round((step / 7) * 100)}%`
                  )}
                </span>
              </div>
              {/* Progress bar */}
              <div className="h-1 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-300 ease-out",
                    isGenerating ? "bg-primary animate-pulse" : "bg-primary"
                  )}
                  style={{ width: `${(step / 7) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Step Content Area - Scrollable */}
          <div className={cn(
            "flex-1 overflow-y-auto py-6 relative z-10",
            // Bottom padding for fixed footer: mobile (full-width ~70px) + desktop (floating ~90px)
            "pb-24 md:pb-28",
            (step === 1 || step === 3 || step === 4) ? "px-6" : "container"
          )}>
            <div className="grid grid-cols-1 gap-6">
              {/* Step Content */}
              <div className={cn(
                (step === 1 || step === 3 || step === 4) ? "w-full" : "max-w-4xl mx-auto w-full"
              )}>
                {/* Step 1: Select Format */}
                {step === 1 && (
                  <Card darkVariant="elevated">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <LayoutGrid className="h-5 w-5 text-primary" />
                            Choose Format
                          </CardTitle>
                          <CardDescription>
                            Select the canvas size and format for your creative
                          </CardDescription>
                        </div>
                        <CustomSizeForm
                          customDimensions={formData.customDimensions}
                          onApply={(width, height) => {
                            selectFormat('custom')
                            setCustomDimensions(width, height)
                          }}
                          onClear={() => { }}
                          className="shrink-0"
                        />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <FormatSelectionInline onSelect={handleSelectFormat} hideCustomSize />
                    </CardContent>
                  </Card>
                )}

                {/* Step 2: Select Vertical & Creation Mode */}
                {step === 2 && (
                  <div className="space-y-6">
                    <Card darkVariant="elevated">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Palette className="h-5 w-5 text-primary" />
                          Select Vertical
                        </CardTitle>
                        <CardDescription>
                          Choose the Yi initiative category for your creative
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {isVerticalsLoading ? (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {[...Array(6)].map((_, i) => (
                              <Skeleton key={i} className="h-28 rounded-xl" />
                            ))}
                          </div>
                        ) : verticalsError ? (
                          <div className="text-center py-12">
                            <p className="text-destructive mb-4">Failed to load verticals: {verticalsError}</p>
                            <Button variant="outline" onClick={() => fetchVerticals()}>
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Retry
                            </Button>
                          </div>
                        ) : verticals.length === 0 ? (
                          <div className="text-center py-12 text-muted-foreground">
                            <p>No verticals available.</p>
                            <Button variant="outline" className="mt-4" onClick={() => fetchVerticals()}>
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Refresh
                            </Button>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {verticals.map((vertical) => (
                              <Tooltip key={vertical.id}>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={() => selectVertical(vertical.id)}
                                    className={cn(
                                      'group relative p-4 rounded-xl border-2 text-left transition-all duration-200',
                                      'hover:border-primary hover:shadow-md hover:-translate-y-0.5',
                                      selectedVertical?.id === vertical.id
                                        ? 'border-primary bg-primary/5 shadow-md ring-2 ring-primary/20'
                                        : 'border-border bg-card'
                                    )}
                                  >
                                    {/* Selected indicator */}
                                    {selectedVertical?.id === vertical.id && (
                                      <div className="absolute top-2 right-2">
                                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                          <Check className="h-3 w-3 text-primary-foreground" />
                                        </div>
                                      </div>
                                    )}
                                    <div className="mb-3">
                                      <div className={cn(
                                        'w-12 h-12 rounded-lg flex items-center justify-center transition-colors',
                                        selectedVertical?.id === vertical.id
                                          ? 'bg-primary/10'
                                          : 'bg-muted group-hover:bg-primary/10'
                                      )}>
                                        <VerticalIcon
                                          icon={vertical.icon || 'help-circle'}
                                          className={cn(
                                            'h-6 w-6 transition-colors',
                                            selectedVertical?.id === vertical.id
                                              ? 'text-primary'
                                              : 'text-muted-foreground group-hover:text-primary'
                                          )}
                                        />
                                      </div>
                                    </div>
                                    <div className="font-medium">{vertical.name}</div>
                                    <div className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                      {vertical.description}
                                    </div>
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="max-w-xs">
                                  <p className="font-medium">{vertical.name}</p>
                                  <p className="text-xs text-muted-foreground">{vertical.description}</p>
                                </TooltipContent>
                              </Tooltip>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Step 3: How would you like to create? */}
                {step === 3 && selectedVertical && (
                  <ModeSelector
                    mode={formData.creationMode}
                    onModeChange={setCreationMode}
                  />
                )}

                {/* Step 4: Smart Logo Placement (AI will avoid these areas) */}
                {step === 4 && selectedVertical && (
                  <div className="space-y-6">
                    <div className="space-y-6">
                      <LogoStep />
                    </div>
                  </div>
                )}

                {/* Step 6: Choose Template or Styling Options (moved after Details for better AI context) */}
                {step === 6 && selectedVertical && (
                  formData.creationMode === 'template' ? (
                    <Card darkVariant="elevated">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileImage className="h-5 w-5 text-primary" />
                          Choose Template
                        </CardTitle>
                        <CardDescription>
                          Select an image template for your {selectedVertical.name} creative
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <TemplateSelector
                          verticalId={selectedVertical.id}
                          verticalName={selectedVertical.name}
                          onSelect={selectTemplate}
                          selectedTemplate={selectedTemplate}
                          selectedFormat={selectedFormat}
                          verticals={verticals}
                        />
                      </CardContent>
                    </Card>
                  ) : (
                    <StylingStep
                      designData={formData.designData}
                      onThemeChange={updateTheme}
                      onStyleChange={updateStyle}
                      onResolutionChange={updateResolution}
                      onToggleBrandColors={setUseBrandColors}
                      onTypographyChange={updateTypography}
                      onSelectPalette={setColorPalette}
                      onCustomColorChange={setCustomColors}
                      brandColors={(() => {
                        const brandConfig = currentOrganization?.brand_config as { primaryColor?: string; secondaryColor?: string; accentColor?: string } | null
                        return {
                          primary_color: brandConfig?.primaryColor,
                          secondary_color: brandConfig?.secondaryColor,
                          accent_color: brandConfig?.accentColor,
                        }
                      })()}
                      brandFont={(() => {
                        const brandConfig = currentOrganization?.brand_config as { fontPrimary?: string } | null
                        return brandConfig?.fontPrimary
                      })()}
                    />
                  )
                )}

                {/* Step 5: Fill Details - Dynamic form based on format type (moved before Template for better AI context) */}
                {step === 5 && selectedVertical && selectedFormat && (
                  <div className="space-y-6">
                    {/* Dynamic Details Form - renders fields based on selected format */}
                    <DynamicDetailsForm
                      formatId={selectedFormat?.id || null}
                      verticalName={selectedVertical.name}
                      formData={formData.formData as Record<string, unknown>}
                      // Dynamic schema props (AI-generated fields)
                      dynamicSchema={dynamicSchema.schema}
                      isDynamicSchemaLoading={dynamicSchema.isLoading}
                      dynamicSchemaError={dynamicSchema.error}
                      isDynamicSchemaFallback={dynamicSchema.isFallback}
                      suggestions={(() => {
                        // Convert suggestions to the format expected by DynamicDetailsForm
                        // Map API suggestion field IDs to AI-generated schema field IDs
                        const suggestionMap: Record<string, { value: string; confidence: number }> = {}

                        // API returns: date, time, venue, speaker, description
                        // AI schema may use: eventDate, eventTime, venue, eventDescription, etc.
                        // We need to map based on actual schema field IDs

                        const apiToSchemaMap: Record<string, string[]> = {
                          // API field -> possible schema field IDs (check in order)
                          'date': ['eventDate', 'date', 'certificateDate', 'postDate'],
                          'time': ['eventTime', 'time'],
                          'venue': ['venue', 'eventVenue', 'location'],
                          'speaker': ['speaker', 'speakerName', 'guestSpeaker', 'recipientName'],
                          'description': ['eventDescription', 'description', 'achievementDescription', 'postDescription'],
                          'title': ['eventTitle', 'title', 'postTitle', 'certificateTitle', 'articleTitle'],
                        }

                        // Get all field IDs from the dynamic schema
                        const schemaFieldIds = dynamicSchema.schema?.fields?.map(f => f.id) || []

                        // Map each API suggestion to the matching schema field ID
                        Object.entries(apiToSchemaMap).forEach(([apiField, possibleIds]) => {
                          const suggestion = getSuggestion(apiField as SuggestableField)
                          if (suggestion) {
                            // Find matching schema field ID
                            const matchingId = possibleIds.find(id => schemaFieldIds.includes(id)) || apiField
                            suggestionMap[matchingId] = suggestion
                          }
                        })

                        return suggestionMap
                      })()}
                      isSuggestionsLoading={isSuggestionsLoading}
                      suggestionsError={suggestionsError}
                      onFormChange={(fieldId, value) => updateFormData({ [fieldId]: value })}
                      onRequestSuggestions={handleRequestSuggestions}
                      onAcceptSuggestion={(fieldId) => acceptSuggestion(fieldId as SuggestableField)}
                      onDismissSuggestion={(fieldId) => dismissSuggestion(fieldId as SuggestableField)}
                      onAcceptAllSuggestions={() => {
                        // Custom handler that maps API field IDs to schema field IDs before accepting
                        const schemaFieldIds = dynamicSchema.schema?.fields?.map(f => f.id) || []
                        const updates: Record<string, string> = {}

                        Object.entries(API_TO_SCHEMA_MAP).forEach(([apiField, possibleIds]) => {
                          const suggestion = getSuggestion(apiField as SuggestableField)
                          if (suggestion?.value) {
                            const matchingId = possibleIds.find(id => schemaFieldIds.includes(id)) || apiField
                            updates[matchingId] = suggestion.value
                          }
                        })

                        // Update form data with mapped field IDs
                        if (Object.keys(updates).length > 0) {
                          updateFormData(updates)
                        }
                        // Clear suggestions from store
                        dismissAllSuggestions()
                      }}
                      onDismissAllSuggestions={dismissAllSuggestions}
                      // Speaker photo integration into Speaker Details section
                      speakerPhotoValue={formData.designData?.customization?.speakerPhoto || DEFAULT_SPEAKER_PHOTO}
                      onSpeakerPhotoChange={(data) => {
                        // Read LATEST state directly from Zustand (not stale closure)
                        const { formData: currentFormData } = useCreativeStore.getState()
                        return updateCustomization({
                          speakerPhoto: { ...(currentFormData.designData?.customization?.speakerPhoto || DEFAULT_SPEAKER_PHOTO), ...data },
                        })
                      }}
                    />

                    {/* Footer Settings - Format Aware (Speaker Photo is now in Speaker Details section) */}
                    {(() => {
                      const customizationOptions = getFormatCustomizationOptions(selectedFormat?.id || '')
                      // Only show card if footer is supported (speaker photo is now in Speaker Details section)
                      if (!customizationOptions.footer) return null

                      return (
                        <Card>
                          <Collapsible defaultOpen={false}>
                            <CollapsibleTrigger className="w-full">
                              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-muted">
                                      <LayoutTemplate className="h-4 w-4" />
                                    </div>
                                    <div className="text-left">
                                      <CardTitle className="text-base">Footer Settings</CardTitle>
                                      <CardDescription>
                                        Configure footer content visibility
                                      </CardDescription>
                                    </div>
                                  </div>
                                  <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
                                </div>
                              </CardHeader>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <CardContent className="space-y-4 pt-0">
                                <div className="space-y-2">
                                  <Label>Footer Style</Label>
                                  <Select
                                    value={formData.designData?.customization?.footer?.style || 'minimal'}
                                    onValueChange={(v) => {
                                      const { formData: currentFormData } = useCreativeStore.getState()
                                      return updateCustomization({
                                        footer: { ...(currentFormData.designData?.customization?.footer || {}), style: v as 'minimal' | 'full' | 'branded' }
                                      })
                                    }}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="minimal">Minimal</SelectItem>
                                      <SelectItem value="full">Full</SelectItem>
                                      <SelectItem value="branded">Branded</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                {(() => {
                                  const brandConfig = currentOrganization?.brand_config as BrandConfig | null
                                  const footerData = formData.designData?.customization?.footer || {}

                                  const updateFooterField = (field: string, value: string | boolean | object) => {
                                    const { formData: currentFormData } = useCreativeStore.getState()
                                    const currentFooterData = currentFormData.designData?.customization?.footer || {}
                                    updateCustomization({
                                      footer: { ...currentFooterData, [field]: value }
                                    })
                                  }

                                  return (
                                    <div className="space-y-4">
                                      {/* Website */}
                                      <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                          <Label>Website</Label>
                                          <div className="flex items-center gap-2">
                                            <span className="text-xs text-muted-foreground">Use Brand</span>
                                            <Switch
                                              checked={footerData.useBrandWebsite ?? false}
                                              onCheckedChange={(checked) => updateFooterField('useBrandWebsite', checked)}
                                            />
                                          </div>
                                        </div>
                                        {(footerData.useBrandWebsite ?? false) ? (
                                          brandConfig?.footerWebsite && (
                                            <p className="text-sm text-muted-foreground pl-2 border-l-2 border-muted">
                                              {brandConfig.footerWebsite}
                                            </p>
                                          )
                                        ) : (
                                          <Input
                                            placeholder="Enter custom website URL"
                                            value={footerData.customWebsite || ''}
                                            onChange={(e) => updateFooterField('customWebsite', e.target.value)}
                                          />
                                        )}
                                      </div>

                                      {/* Phone */}
                                      <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                          <Label>Phone</Label>
                                          <div className="flex items-center gap-2">
                                            <span className="text-xs text-muted-foreground">Use Brand</span>
                                            <Switch
                                              checked={footerData.useBrandPhone ?? false}
                                              onCheckedChange={(checked) => updateFooterField('useBrandPhone', checked)}
                                            />
                                          </div>
                                        </div>
                                        {(footerData.useBrandPhone ?? false) ? (
                                          brandConfig?.footerPhone && (
                                            <p className="text-sm text-muted-foreground pl-2 border-l-2 border-muted">
                                              {brandConfig.footerPhone}
                                            </p>
                                          )
                                        ) : (
                                          <Input
                                            placeholder="Enter custom phone number"
                                            type="tel"
                                            value={footerData.customPhone || ''}
                                            onChange={(e) => updateFooterField('customPhone', e.target.value)}
                                          />
                                        )}
                                      </div>

                                      {/* Email */}
                                      <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                          <Label>Email</Label>
                                          <div className="flex items-center gap-2">
                                            <span className="text-xs text-muted-foreground">Use Brand</span>
                                            <Switch
                                              checked={footerData.useBrandEmail ?? false}
                                              onCheckedChange={(checked) => updateFooterField('useBrandEmail', checked)}
                                            />
                                          </div>
                                        </div>
                                        {(footerData.useBrandEmail ?? false) ? (
                                          brandConfig?.footerEmail && (
                                            <p className="text-sm text-muted-foreground pl-2 border-l-2 border-muted">
                                              {brandConfig.footerEmail}
                                            </p>
                                          )
                                        ) : (
                                          <Input
                                            placeholder="Enter custom email address"
                                            type="email"
                                            value={footerData.customEmail || ''}
                                            onChange={(e) => updateFooterField('customEmail', e.target.value)}
                                          />
                                        )}
                                      </div>

                                      {/* Address */}
                                      <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                          <Label>Address</Label>
                                          <div className="flex items-center gap-2">
                                            <span className="text-xs text-muted-foreground">Use Brand</span>
                                            <Switch
                                              checked={footerData.useBrandAddress ?? false}
                                              onCheckedChange={(checked) => updateFooterField('useBrandAddress', checked)}
                                            />
                                          </div>
                                        </div>
                                        {(footerData.useBrandAddress ?? false) ? (
                                          brandConfig?.footerAddress && (
                                            <p className="text-sm text-muted-foreground pl-2 border-l-2 border-muted">
                                              {brandConfig.footerAddress}
                                            </p>
                                          )
                                        ) : (
                                          <Input
                                            placeholder="Enter custom address"
                                            value={footerData.customAddress || ''}
                                            onChange={(e) => updateFooterField('customAddress', e.target.value)}
                                          />
                                        )}
                                      </div>

                                      {/* Social Links */}
                                      <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                          <Label>Social Links</Label>
                                          <div className="flex items-center gap-2">
                                            <span className="text-xs text-muted-foreground">Use Brand</span>
                                            <Switch
                                              checked={footerData.useBrandSocial ?? false}
                                              onCheckedChange={(checked) => updateFooterField('useBrandSocial', checked)}
                                            />
                                          </div>
                                        </div>
                                        {(footerData.useBrandSocial ?? false) ? (
                                          (brandConfig?.footerSocial?.instagram || brandConfig?.footerSocial?.linkedin || brandConfig?.footerSocial?.facebook || brandConfig?.footerSocial?.twitter) && (
                                            <div className="text-sm text-muted-foreground pl-2 border-l-2 border-muted space-y-1">
                                              {brandConfig?.footerSocial?.instagram && <p>IG: {brandConfig.footerSocial.instagram}</p>}
                                              {brandConfig?.footerSocial?.linkedin && <p>LinkedIn: {brandConfig.footerSocial.linkedin}</p>}
                                              {brandConfig?.footerSocial?.facebook && <p>FB: {brandConfig.footerSocial.facebook}</p>}
                                              {brandConfig?.footerSocial?.twitter && <p>X: {brandConfig.footerSocial.twitter}</p>}
                                            </div>
                                          )
                                        ) : (
                                          <div className="space-y-2 pl-3 border-l-2 border-muted">
                                            <Input
                                              placeholder="Instagram (@handle)"
                                              value={footerData.customSocial?.instagram || ''}
                                              onChange={(e) => updateFooterField('customSocial', {
                                                ...footerData.customSocial,
                                                instagram: e.target.value
                                              })}
                                            />
                                            <Input
                                              placeholder="LinkedIn (URL or handle)"
                                              value={footerData.customSocial?.linkedin || ''}
                                              onChange={(e) => updateFooterField('customSocial', {
                                                ...footerData.customSocial,
                                                linkedin: e.target.value
                                              })}
                                            />
                                            <Input
                                              placeholder="Facebook (page name)"
                                              value={footerData.customSocial?.facebook || ''}
                                              onChange={(e) => updateFooterField('customSocial', {
                                                ...footerData.customSocial,
                                                facebook: e.target.value
                                              })}
                                            />
                                            <Input
                                              placeholder="X / Twitter (@handle)"
                                              value={footerData.customSocial?.twitter || ''}
                                              onChange={(e) => updateFooterField('customSocial', {
                                                ...footerData.customSocial,
                                                twitter: e.target.value
                                              })}
                                            />
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )
                                })()}

                                {/* Language Selector */}
                                <div className="pt-3 border-t space-y-2">
                                  <Label>Language</Label>
                                  <Select
                                    value={(formData.formData?.language as string) || 'en'}
                                    onValueChange={(value) => updateFormData({ language: value })}
                                  >
                                    <SelectTrigger>
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
                                  <p className="text-xs text-muted-foreground">
                                    Text will be generated in this language
                                  </p>
                                </div>
                              </CardContent>
                            </CollapsibleContent>
                          </Collapsible>
                        </Card>
                      )
                    })()}
                  </div>
                )}

                {/* Step 7: Generate & Result - Compact Two-Column Layout */}
                {step === 7 && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                    {/* Left Column - Summary & Controls */}
                    <Card darkVariant="elevated" className="h-full flex flex-col">
                      <CardHeader className="pb-4 flex-none">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Sparkles className="h-5 w-5 text-primary" />
                          {generatedImage ? 'Your Creative is Ready!' : 'Ready to Generate'}
                        </CardTitle>
                        <CardDescription>
                          {generatedImage
                            ? 'Download your creative or create another'
                            : 'Preview your design and generate when ready'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4 flex-1 flex flex-col">
                        {/* Summary Info */}
                        <div className="space-y-3 flex-1">
                          {/* Format */}
                          {selectedFormat && (
                            <div className="flex items-center justify-between py-2 border-b">
                              <span className="text-sm text-muted-foreground">Format</span>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs font-medium">
                                  {selectedFormat.label}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {formData.customDimensions
                                    ? `${formData.customDimensions.width}×${formData.customDimensions.height}`
                                    : `${selectedFormat.width}×${selectedFormat.height}`}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Vertical */}
                          {selectedVertical && (
                            <div className="flex items-center justify-between py-2 border-b">
                              <span className="text-sm text-muted-foreground">Category</span>
                              <Badge variant="secondary" className="text-xs">
                                {selectedVertical.name}
                              </Badge>
                            </div>
                          )}

                          {/* Mode */}
                          {formData.creationMode && (
                            <div className="flex items-center justify-between py-2 border-b">
                              <span className="text-sm text-muted-foreground">Mode</span>
                              <span className="text-sm font-medium">
                                {formData.creationMode === 'template' ? 'Template' : 'From Scratch'}
                              </span>
                            </div>
                          )}

                          {/* Template */}
                          {selectedTemplate && (
                            <div className="flex items-center justify-between py-2 border-b">
                              <span className="text-sm text-muted-foreground">Template</span>
                              <span className="text-sm font-medium truncate max-w-[150px]">
                                {selectedTemplate.name}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Model Selector - Compact */}
                        {!generatedImage && (
                          <div className="flex items-center justify-between gap-4 p-3 bg-muted/50 rounded-lg mt-auto">
                            <div className="flex items-center gap-2">
                              <Wand2 className="h-4 w-4 text-muted-foreground" />
                              <Label className="text-sm font-medium">AI Model</Label>
                            </div>
                            <Select value={selectedModel?.id || ''} onValueChange={selectModel}>
                              <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select model" />
                              </SelectTrigger>
                              <SelectContent>
                                {models.map((model) => (
                                  <SelectItem key={model.id} value={model.id}>
                                    <div className="flex items-center gap-2">
                                      <span>{getModelDisplayName(model.slug)}</span>
                                      <Badge variant="secondary" className="text-xs">
                                        {model.credits_cost}
                                      </Badge>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {/* Action Buttons */}
                        {generatedImage && (
                          <div className="flex flex-col gap-2 pt-2 mt-auto">
                            <Button
                              size="default"
                              onClick={() => setExportModalOpen(true)}
                              className="w-full gap-2"
                            >
                              <Download className="h-4 w-4" />
                              Download
                            </Button>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="default"
                                onClick={() => setSaveTemplateDialogOpen(true)}
                                className="flex-1 gap-2"
                              >
                                <Save className="h-4 w-4" />
                                Save
                              </Button>
                              <Button
                                variant="outline"
                                size="default"
                                onClick={() => setRegenerateModalOpen(true)}
                                className="flex-1 gap-2"
                              >
                                <RefreshCcw className="h-4 w-4" />
                                Regenerate
                              </Button>
                              <Button
                                variant="ghost"
                                size="default"
                                onClick={handleStartOver}
                                className="flex-1"
                              >
                                New
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Right Column - Compact Preview */}
                    <Card darkVariant="floating" className="flex flex-col h-full">
                      <CardHeader className="pb-2 flex-none">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Preview
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="flex-1 flex items-center justify-center p-4 min-h-[500px]">
                        <div
                          className="relative rounded-lg bg-gradient-to-br from-muted/30 to-muted/60 border border-dashed border-muted-foreground/20 flex items-center justify-center overflow-hidden w-full h-full"
                          style={{
                            aspectRatio: (() => {
                              if (formData.customDimensions) {
                                return `${formData.customDimensions.width}/${formData.customDimensions.height}`
                              }
                              if (selectedFormat) {
                                return `${selectedFormat.width}/${selectedFormat.height}`
                              }
                              return '4/5'
                            })(),
                            maxHeight: '100%',
                            maxWidth: '100%',
                          }}
                        >
                          {generatedImage ? (
                            <>
                              <img
                                src={generatedImage}
                                alt="Generated creative"
                                className="w-full h-full object-contain"
                              />
                              <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => setPreviewModalOpen(true)}
                                    className="gap-2"
                                  >
                                    <Maximize2 className="h-4 w-4" />
                                    Full View
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => setExportModalOpen(true)}
                                    className="gap-2"
                                  >
                                    <Download className="h-4 w-4" />
                                    Download
                                  </Button>
                                </div>
                              </div>
                            </>
                          ) : isGenerating ? (
                            STREAMING_ENABLED ? (
                              /* Phase 2: Progressive Loading UI with real-time updates */
                              <div className="p-6">
                                <ProgressiveLoadingUI
                                  currentStage={streaming.currentStage}
                                  progress={streaming.progress}
                                  stageData={streaming.stageData}
                                />
                              </div>
                            ) : (
                              /* Legacy: Binary loading state (fallback) */
                              <div className="flex flex-col items-center justify-center p-6">
                                <div className="relative">
                                  <Skeleton className="w-12 h-12 rounded-full" />
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                                  </div>
                                </div>
                                <p className="text-xs text-muted-foreground mt-3">Generating...</p>
                                <div className="flex gap-1 mt-2">
                                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                                </div>
                              </div>
                            )
                          ) : generationError ? (
                            <div className="flex flex-col items-center justify-center p-6">
                              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center mb-2">
                                <RefreshCw className="h-5 w-5 text-destructive" />
                              </div>
                              <p className="text-destructive text-xs text-center mb-2">{generationError}</p>
                              <Button onClick={() => handleGenerate()} disabled={isGenerating} size="sm" variant="outline">
                                <RefreshCw className="h-3 w-3 mr-1" />
                                Retry
                              </Button>
                            </div>
                          ) : selectedTemplate ? (
                            <img
                              src={selectedTemplate.image_url}
                              alt="Template preview"
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center p-6 text-center">
                              <div className="w-10 h-10 rounded-full bg-muted-foreground/10 flex items-center justify-center mb-2">
                                <ImageIcon className="h-5 w-5 opacity-40" />
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Click Generate to create
                              </p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer Navigation - Fixed at bottom */}
          {(step !== 7 || !generatedImage) && (
            <div className={cn(
              "fixed bottom-0 left-0 right-0 z-40",
              // Desktop: Adjust for sidebar (w-64 = 16rem)
              "md:left-64",
              // Clean solid background matching theme
              "bg-background",
              // Border styling
              "border-t border-border"
            )}>
              <div className="container py-3 md:py-4">
                <div className="flex items-center justify-between">
                  {/* Back Button - Canva style with hover border */}
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    disabled={step === 1 || isGenerating}
                    className={cn(
                      "gap-2 border-2 transition-all duration-300",
                      "hover:border-primary hover:text-primary"
                    )}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">Back</span>
                  </Button>

                  {/* Step info for mobile */}
                  <div className="text-sm text-slate-600 dark:text-slate-400 lg:hidden font-medium">
                    Step {step} of 7
                  </div>

                  {step === 7 ? (
                    /* Generate Button - Canva gradient style */
                    <Button
                      onClick={handleGenerateWithDateCheck}
                      disabled={!canGenerate || isGenerating}
                      className={cn(
                        "gap-2 px-6 transition-all duration-300",
                        "btn-primary",
                        "text-white font-semibold",
                        "hover:-translate-y-0.5",
                        "disabled:opacity-50 disabled:hover:translate-y-0"
                      )}
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="hidden sm:inline">Generating...</span>
                        </>
                      ) : !isOnline ? (
                        <>
                          <WifiOff className="h-4 w-4" />
                          <span className="hidden sm:inline">Offline</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          <span className="hidden sm:inline">Generate</span>
                          <Badge variant="secondary" className="ml-1 text-xs bg-white/20 text-white border-0">
                            {creditCost} credits
                          </Badge>
                        </>
                      )}
                    </Button>
                  ) : (
                    /* Continue Button - Canva gradient style */
                    <Button
                      onClick={handleNext}
                      disabled={!canProceed() || isStepProcessing}
                      className={cn(
                        "gap-2 px-6 transition-all duration-300",
                        "btn-primary",
                        "text-white font-semibold",
                        "hover:-translate-y-0.5",
                        "disabled:opacity-50 disabled:hover:translate-y-0"
                      )}
                    >
                      {isStepProcessing ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="hidden sm:inline">Optimizing...</span>
                        </>
                      ) : (
                        <>
                          <span className="hidden sm:inline">Continue</span>
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div> {/* End Main Content Area */}

        {/* Export Modal */}
        {creativeId && generatedImage && (
          <ExportModal
            open={exportModalOpen}
            onOpenChange={setExportModalOpen}
            creativeId={creativeId}
            creativeName={
              (formData.formData as { title?: string }).title ||
              selectedVertical?.name ||
              'Creative'
            }
            previewUrl={generatedImage}
            // Feedback context
            creativeType={selectedFormat?.id || 'creative'}
            vertical={selectedVertical?.slug}
            formData={formData.formData as Record<string, unknown>}
          />
        )}

        {/* Full View Preview Modal */}
        {generatedImage && (
          <ImagePreviewModal
            open={previewModalOpen}
            onOpenChange={setPreviewModalOpen}
            imageUrl={generatedImage}
            imageName={
              (formData.formData as { title?: string }).title ||
              selectedVertical?.name ||
              'Generated Creative'
            }
            onDownloadClick={() => {
              setPreviewModalOpen(false)
              setExportModalOpen(true)
            }}
          />
        )}

        {/* Save as Template Dialog */}
        {creativeId && generatedImage && (
          <SaveTemplateDialog
            open={saveTemplateDialogOpen}
            onOpenChange={setSaveTemplateDialogOpen}
            creativeId={creativeId}
            previewImageUrl={generatedImage}
            formData={formData.formData as Record<string, unknown>}
            logoConfig={formData.logosPlacements}
            currentVertical={selectedVertical?.id}
            onSaveComplete={(templateId) => {
              toast.success('Template saved! You can find it in your templates.')
            }}
          />
        )}

        {/* Regenerate Modal - allows changing model/settings and regenerating */}
        {generatedImage && (
          <RegenerateModal
            open={regenerateModalOpen}
            onOpenChange={setRegenerateModalOpen}
            currentModelId={selectedModel?.id}
            currentTheme={formData.designData?.theme}
            currentStyle={formData.designData?.style}
            currentResolution={formData.designData?.resolution}
            creationMode={formData.creationMode as 'template' | 'scratch'}
            models={models}
            onRegenerate={handleRegenerate}
            isRegenerating={isGenerating}
            currentBalance={creditsBalance}
          />
        )}

        {/* Past Date Warning Dialog (Edge Case E07) */}
        <PastDateWarningDialog
          open={showPastDateWarning}
          onOpenChange={setShowPastDateWarning}
          onContinue={handleGenerate}
          date={(formData.formData as { date?: string }).date || ''}
        />

        {/* Feedback Dialog - shows after generation */}
        {creativeId && generatedImage && (
          <CreativeFeedbackDialog
            open={showFeedbackDialog}
            onOpenChange={setShowFeedbackDialog}
            creativeId={creativeId}
            creativeType={selectedFormat?.id || 'event_poster'}
            vertical={selectedVertical?.slug}
            promptUsed={generatedPrompt || undefined}
            formData={formData.formData as Record<string, unknown>}
            onFeedbackSubmit={() => {
              toast.success('Thanks for your feedback!')
            }}
          />
        )}
      </div>
    </TooltipProvider>
  )
}
