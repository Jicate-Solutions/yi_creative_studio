'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { useCreativeStore } from '@/stores/creative-store'
import { useVerticals, useAIModels, useLogos, useCredits, useOnlineStatus } from '@/hooks'
import { useEventSuggestions } from '@/hooks/use-event-suggestions'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import type { TablesInsert, Json } from '@/types/database.types'
import type { SuggestableField } from '@/types/suggestions'
import { getCreativeSchema } from '@/lib/schemas/creativeSchemas'
import { getFormatFields } from '@/lib/schemas/formatFieldSchemas'
import { FormatSelectionInline } from '@/components/create/format-selection'
import { CustomSizeForm } from '@/components/create/format-selection/custom-size-form'
import type { CreativeFormat } from '@/lib/config/creative-formats'
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
} from 'lucide-react'
import { VerticalIcon } from '@/components/ui/vertical-icon'
import { Stepper, type Step } from '@/components/ui/stepper'
import {
  AISuggestionField,
  AISuggestionActions,
  AITriggerButton,
} from '@/components/create/ai-suggestion-field'
import { PastDateWarningDialog } from '@/components/create/past-date-warning-dialog'
import { DynamicDetailsForm } from '@/components/create/DynamicDetailsForm'
import { SaveTemplateDialog } from '@/components/create/SaveTemplateDialog'
import { CreateSidebar } from '@/components/create/create-sidebar'
import { useUIStore } from '@/stores/ui-store'

// Dynamic imports for heavy components - improves initial load time
const LogoPositionGrid = dynamic(
  () => import('@/components/create/logo-position-grid').then(mod => ({ default: mod.LogoPositionGrid })),
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

const DesignTab = dynamic(
  () => import('@/components/create/design-tab').then(mod => ({ default: mod.DesignTab })),
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

// Loading skeleton for dynamically imported components
function ComponentLoadingSkeleton({ type }: { type: 'preview' | 'grid' | 'template' | 'mode' | 'design' | 'upload' }) {
  const skeletonClasses = "animate-pulse bg-muted rounded-lg"

  switch (type) {
    case 'preview':
      return (
        <div className="space-y-4">
          <div className={`${skeletonClasses} aspect-[3/4] w-full`} />
          <div className={`${skeletonClasses} h-10 w-full`} />
        </div>
      )
    case 'template':
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={`${skeletonClasses} aspect-[3/4]`} />
          ))}
        </div>
      )
    case 'mode':
      return (
        <div className="grid grid-cols-2 gap-4">
          <div className={`${skeletonClasses} h-40`} />
          <div className={`${skeletonClasses} h-40`} />
        </div>
      )
    case 'design':
      return (
        <div className="space-y-4">
          <div className={`${skeletonClasses} h-12 w-full`} />
          <div className={`${skeletonClasses} h-64 w-full`} />
        </div>
      )
    case 'grid':
      return (
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className={`${skeletonClasses} aspect-square`} />
          ))}
        </div>
      )
    case 'upload':
      return <div className={`${skeletonClasses} h-32 w-full`} />
    default:
      return <div className={`${skeletonClasses} h-24 w-full`} />
  }
}

import { ROUTES } from '@/lib/config/constants'
import { isPastDate } from '@/lib/utils/date-utils'
import type { CreationMode } from '@/types/design.types'
import type { SpeakerPhotoCustomization, CustomColors } from '@/lib/config/design-constants'
import { cn } from '@/lib/utils'

// Display-friendly names for AI models (hide technical names from users)
const getModelDisplayName = (provider: string) => {
  const displayNames: Record<string, string> = {
    'ideogram': 'Smart Design',
    'google': 'Poster Perfect',
  }
  return displayNames[provider] || provider
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
}

// Step definitions - Logos moved to Step 4 for Smart Layout (AI knows logo positions before designing)
const STEPS: Step[] = [
  { id: 1, title: 'Format', icon: <LayoutGrid className="h-4 w-4" /> },
  { id: 2, title: 'Vertical', icon: <Palette className="h-4 w-4" /> },
  { id: 3, title: 'Mode', icon: <Sparkles className="h-4 w-4" /> },
  { id: 4, title: 'Logos', icon: <ImageIcon className="h-4 w-4" /> },
  { id: 5, title: 'Template', icon: <FileImage className="h-4 w-4" /> },
  { id: 6, title: 'Details', icon: <FileText className="h-4 w-4" /> },
  { id: 7, title: 'Generate', icon: <Wand2 className="h-4 w-4" /> },
]

export default function CreatePage() {
  const router = useRouter()
  const supabase = createClient()
  const { currentOrganization } = useAuthStore()

  const { verticals, selectedVertical, selectVertical, isLoading: isVerticalsLoading, error: verticalsError, fetchVerticals } = useVerticals()
  const { models, selectedModel, selectModel, getModelCost } = useAIModels()
  const { logos, fetchLogos } = useLogos()
  const { canAfford, deductCredits } = useCredits()
  const { isOnline } = useOnlineStatus()

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
  } = useCreativeStore()

  // UI Store for create mode sidebar
  const { enterCreateMode, exitCreateMode, createModeActive } = useUIStore()

  // Enter create mode on mount (hides parent sidebar, shows create sidebar)
  useEffect(() => {
    enterCreateMode()
    return () => exitCreateMode()
  }, [enterCreateMode, exitCreateMode])

  // Always start at step 1 (format selection) when visiting create page
  const [step, setStep] = useState(1)
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [saveTemplateDialogOpen, setSaveTemplateDialogOpen] = useState(false)
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [creativeId, setCreativeId] = useState<string | null>(null)
  const [showPastDateWarning, setShowPastDateWarning] = useState(false)

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

  // Handle AI suggestion trigger
  const handleRequestSuggestions = useCallback(async () => {
    const title = (formData.formData as { title?: string }).title || ''
    if (title.length < 5) {
      toast.error('Enter at least 5 characters in the title to get suggestions')
      return
    }
    await requestSuggestions(title)
  }, [formData.formData, requestSuggestions])

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

  // Clear resized template when format changes (user selected a different format)
  useEffect(() => {
    clearResizedTemplate()
  }, [selectedFormat?.id, clearResizedTemplate])

  // Auto-resize template when format mismatches (Canva-style Magic Resize)
  useEffect(() => {
    const shouldResize = checkTemplateFormatMismatch()
    if (shouldResize && selectedTemplate && selectedFormat && !templateResize.isResizing) {
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

  async function handleGenerate() {
    if (!canGenerate || !currentOrganization) {
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

      // Call generation API with format info
      const formatDimensions = getFormatDimensions()
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          model: selectedModel.model_id,
          provider: selectedModel.provider,
          verticalSlug: selectedVertical.slug,
          logosPlacements: formData.logosPlacements,
          organizationId: currentOrganization.id,
          templateId: selectedTemplate?.id || null,
          templateUrl: selectedTemplate?.image_url || null,
          // Include design data for scratch mode, or just speaker photo for template mode
          creationMode: formData.creationMode,
          designData: formData.creationMode === 'scratch'
            ? formData.designData
            : { customization: { speakerPhoto: formData.designData?.customization?.speakerPhoto } },
          // Include format info for proper dimensions
          formatId: formData.formatId || null,
          customDimensions: formData.customDimensions || null,
          // Language selection (PRD Section 10.2)
          language: formData.formData?.language || 'en',
          // Pass form data directly for reliable value extraction (bypasses template placeholder issues)
          userFormData: formData.formData,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Generation failed')
      }

      setGeneratedImage(data.imageUrl)

      // Save creative to database
      const creativeInsert: TablesInsert<'creatives'> = {
        organization_id: currentOrganization.id,
        ai_model: selectedModel.name,
        ai_model_id: selectedModel.id,
        creative_type: 'event_poster',
        vertical: selectedVertical.slug,
        credits_used: creditCost,
        image_url: data.imageUrl,
        form_data: formData.formData as Json,
        prompt_used: prompt,
        title: (formData.formData as { title?: string }).title || `${selectedVertical.name} Creative`,
        logo_config: formData.logosPlacements as unknown as Json,
      }
      const { data: creativeData } = await supabase
        .from('creatives')
        .insert(creativeInsert)
        .select('id')
        .single()

      if (creativeData?.id) {
        setCreativeId(creativeData.id)
      }

      toast.success('Creative generated successfully!')
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
    setExportModalOpen(false)
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

  const handleNext = () => {
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
        return true // Template is optional
      case 6:
        // Match DynamicDetailsForm's field priority: dynamicSchema > formatFields > staticSchema
        const dynamicFields = dynamicSchema.schema?.fields
        const formatFields = getFormatFields(selectedFormat?.id || '', selectedVertical?.slug)
        const staticSchema = getCreativeSchema(selectedFormat?.id || null)

        // Priority: AI-generated > format-specific > static
        let fieldsToValidate: Array<{ id: string; required: boolean }>
        if (dynamicFields && dynamicFields.length > 0) {
          fieldsToValidate = dynamicFields
        } else if (formatFields && formatFields.length > 0) {
          fieldsToValidate = formatFields
        } else {
          fieldsToValidate = staticSchema.fields
        }

        const firstRequiredField = fieldsToValidate.find(f => f.required)
        if (!firstRequiredField) return true
        const fieldValue = (formData.formData as Record<string, unknown>)[firstRequiredField.id]
        return !!fieldValue && String(fieldValue).trim().length > 0
      default:
        return true
    }
  }

  return (
    <TooltipProvider>
      <div className="flex min-h-screen">
        {/* Create Sidebar - Left (Desktop only) */}
        {createModeActive && (
          <CreateSidebar
            steps={STEPS}
            currentStep={step}
            onStepClick={(stepId) => {
              if (stepId < step && !isGenerating) setStep(stepId)
            }}
          />
        )}

        {/* Main Content Area */}
        <div className={cn(
          "flex-1 flex flex-col min-w-0",
          createModeActive && "md:ml-64"
        )}>
          {/* Step Content Area - pb-24 ensures content isn't hidden behind sticky footer */}
          <div className={cn(
            "flex-1 py-6 pb-24",
            (step === 1 || step === 3 || step === 4) ? "px-6" : "container"
          )}>
          <div className="grid grid-cols-1 gap-6">
            {/* Step Content */}
            <div className={cn(
              (step === 1 || step === 3 || step === 4) ? "w-full" : "max-w-4xl mx-auto w-full"
            )}>
              {/* Step 1: Select Format */}
              {step === 1 && (
                <Card>
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
                        onClear={() => {}}
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
                  <Card>
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
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ImageIcon className="h-5 w-5 text-primary" />
                        Smart Logo Placement
                        <Badge variant="secondary" className="ml-2 text-xs">
                          <Sparkles className="h-3 w-3 mr-1" />
                          AI-Aware
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        Position your logos - AI will structure the design to keep these areas clear
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <LogoPositionGrid />
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Step 5: Choose Template or Design Options */}
              {step === 5 && selectedVertical && (
                formData.creationMode === 'template' ? (
                  <Card>
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
                  <div className="space-y-6">
                    <DesignTab
                      designData={formData.designData}
                      onThemeChange={updateTheme}
                      onStyleChange={updateStyle}
                      onToggleBrandColors={setUseBrandColors}
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
                      eventType={selectedVertical.slug}
                      eventName={(formData.formData as { title?: string }).title}
                    />
                  </div>
                )
              )}

              {/* Step 6: Fill Details - Dynamic form based on format type */}
              {step === 6 && selectedVertical && (
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
                      const suggestionMap: Record<string, { value: string; confidence: number }> = {}
                      const suggestableFields = ['title', 'date', 'time', 'venue', 'speaker', 'description',
                        'postTitle', 'postDescription', 'callToAction', 'hashtags',
                        'certificateTitle', 'achievementDescription', 'subjectLine', 'brandMessage',
                        'articleTitle', 'articleSummary', 'campaignName', 'campaignMessage']
                      suggestableFields.forEach(field => {
                        const suggestion = getSuggestion(field as SuggestableField)
                        if (suggestion) {
                          suggestionMap[field] = suggestion
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
                    onAcceptAllSuggestions={acceptAllSuggestions}
                    onDismissAllSuggestions={dismissAllSuggestions}
                    languageValue={(formData.formData?.language as string) || 'en'}
                    onLanguageChange={(value) => updateFormData({ language: value })}
                    showLanguageSelector={true}
                  />

                  {/* Optional Settings: Speaker Photo & Footer */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Optional Settings</CardTitle>
                      <CardDescription>
                        Additional customization options for your creative
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                    <Accordion type="multiple" className="space-y-2">
                      {/* Speaker Photo - Optional */}
                      <AccordionItem value="speaker-photo" className="border rounded-lg px-4">
                        <AccordionTrigger className="hover:no-underline py-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-muted">
                              <User className="h-4 w-4" />
                            </div>
                            <div className="text-left">
                              <span className="font-medium">Speaker Photo</span>
                              <p className="text-xs text-muted-foreground">Add a photo of the speaker or guest</p>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-4">
                          <SpeakerPhotoUpload
                            value={formData.designData?.customization?.speakerPhoto || DEFAULT_SPEAKER_PHOTO}
                            onChange={(data) =>
                              updateCustomization({
                                speakerPhoto: { ...(formData.designData?.customization?.speakerPhoto || DEFAULT_SPEAKER_PHOTO), ...data },
                              })
                            }
                          />
                        </AccordionContent>
                      </AccordionItem>

                      {/* Footer Settings - Optional */}
                      <AccordionItem value="footer" className="border rounded-lg px-4">
                        <AccordionTrigger className="hover:no-underline py-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-muted">
                              <LayoutTemplate className="h-4 w-4" />
                            </div>
                            <div className="text-left">
                              <span className="font-medium">Footer Settings</span>
                              <p className="text-xs text-muted-foreground">Configure footer content visibility</p>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-4 space-y-4">
                          <div className="space-y-2">
                            <Label>Footer Style</Label>
                            <Select
                              value={formData.designData?.customization?.footer?.style || 'minimal'}
                              onValueChange={(v) => updateCustomization({
                                footer: { ...(formData.designData?.customization?.footer || {}), style: v as 'minimal' | 'full' | 'branded' }
                              })}
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

                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Label>Show Website</Label>
                              <Switch
                                checked={formData.designData?.customization?.footer?.showWebsite ?? true}
                                onCheckedChange={(checked) => updateCustomization({
                                  footer: { ...(formData.designData?.customization?.footer || {}), showWebsite: checked }
                                })}
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <Label>Show Phone</Label>
                              <Switch
                                checked={formData.designData?.customization?.footer?.showPhone ?? true}
                                onCheckedChange={(checked) => updateCustomization({
                                  footer: { ...(formData.designData?.customization?.footer || {}), showPhone: checked }
                                })}
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <Label>Show Email</Label>
                              <Switch
                                checked={formData.designData?.customization?.footer?.showEmail ?? true}
                                onCheckedChange={(checked) => updateCustomization({
                                  footer: { ...(formData.designData?.customization?.footer || {}), showEmail: checked }
                                })}
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <Label>Show Social Links</Label>
                              <Switch
                                checked={formData.designData?.customization?.footer?.showSocial ?? false}
                                onCheckedChange={(checked) => updateCustomization({
                                  footer: { ...(formData.designData?.customization?.footer || {}), showSocial: checked }
                                })}
                              />
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </CardContent>
                </Card>
                </div>
              )}

              {/* Step 7: Generate & Result - Compact Two-Column Layout */}
              {step === 7 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column - Summary & Controls */}
                  <Card>
                    <CardHeader className="pb-4">
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
                    <CardContent className="space-y-4">
                      {/* Summary Info */}
                      <div className="space-y-3">
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
                        <div className="flex items-center justify-between gap-4 p-3 bg-muted/50 rounded-lg">
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
                                    <span>{getModelDisplayName(model.provider)}</span>
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
                        <div className="flex flex-col gap-2 pt-2">
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
                  <Card className="flex flex-col">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Preview
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 flex items-center justify-center p-4">
                      <div
                        className="relative rounded-lg bg-gradient-to-br from-muted/30 to-muted/60 border border-dashed border-muted-foreground/20 flex items-center justify-center overflow-hidden"
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
                          maxHeight: '320px',
                          maxWidth: '100%',
                          width: 'auto',
                          height: '320px',
                        }}
                      >
                        {generatedImage ? (
                          <>
                            <img
                              src={generatedImage}
                              alt="Generated creative"
                              className="w-full h-full object-contain"
                            />
                            {/* Full View button - top left */}
                            <Button
                              variant="secondary"
                              size="icon"
                              className="absolute top-2 left-2 h-7 w-7 bg-background/80 backdrop-blur-sm hover:bg-background/90"
                              onClick={() => setPreviewModalOpen(true)}
                              title="Full View"
                            >
                              <Maximize2 className="h-3.5 w-3.5" />
                            </Button>
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
                        ) : generationError ? (
                          <div className="flex flex-col items-center justify-center p-6">
                            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center mb-2">
                              <RefreshCw className="h-5 w-5 text-destructive" />
                            </div>
                            <p className="text-destructive text-xs text-center mb-2">{generationError}</p>
                            <Button onClick={handleGenerate} disabled={isGenerating} size="sm" variant="outline">
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

        {/* Footer Navigation - Sticky for better UX */}
        {(step !== 7 || !generatedImage) && (
          <div className="sticky bottom-0 z-40 bg-background/95 backdrop-blur-sm border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <div className="container py-4">
              <div className="flex items-center justify-between">
                {/* Back Button - Canva style with hover border */}
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={step === 1 || isGenerating}
                  className={cn(
                    "gap-2 border-2 transition-all duration-300",
                    "hover:border-[#005B96] hover:text-[#005B96]"
                  )}
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Back</span>
                </Button>

                {/* Step info for mobile */}
                <div className="text-sm text-muted-foreground lg:hidden font-medium">
                  Step {step} of 7
                </div>

                {step === 7 ? (
                  /* Generate Button - Canva gradient style */
                  <Button
                    onClick={handleGenerateWithDateCheck}
                    disabled={!canGenerate || isGenerating}
                    className={cn(
                      "gap-2 px-6 transition-all duration-300",
                      "bg-gradient-to-r from-[#005B96] to-[#1B998B]",
                      "text-white font-semibold",
                      "shadow-[0_4px_12px_rgba(0,91,150,0.25)]",
                      "hover:shadow-[0_6px_20px_rgba(0,91,150,0.35)]",
                      "hover:-translate-y-0.5",
                      "disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-[0_4px_12px_rgba(0,91,150,0.25)]"
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
                    disabled={!canProceed()}
                    className={cn(
                      "gap-2 px-6 transition-all duration-300",
                      "bg-gradient-to-r from-[#005B96] to-[#1B998B]",
                      "text-white font-semibold",
                      "shadow-[0_4px_12px_rgba(0,91,150,0.25)]",
                      "hover:shadow-[0_6px_20px_rgba(0,91,150,0.35)]",
                      "hover:-translate-y-0.5",
                      "disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-[0_4px_12px_rgba(0,91,150,0.25)]"
                    )}
                  >
                    <span className="hidden sm:inline">Continue</span>
                    <ArrowRight className="h-4 w-4" />
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

        {/* Past Date Warning Dialog (Edge Case E07) */}
        <PastDateWarningDialog
          open={showPastDateWarning}
          onOpenChange={setShowPastDateWarning}
          onContinue={handleGenerate}
          date={(formData.formData as { date?: string }).date || ''}
        />
      </div>
    </TooltipProvider>
  )
}
