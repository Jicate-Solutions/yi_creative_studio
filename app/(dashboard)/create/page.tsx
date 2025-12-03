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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
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
  Coins,
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
  Globe,
  Save,
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
const PreviewPanel = dynamic(
  () => import('@/components/create/preview-panel').then(mod => ({ default: mod.PreviewPanel })),
  { ssr: false, loading: () => <ComponentLoadingSkeleton type="preview" /> }
)

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

// Step definitions - Format is step 0, then workflow continues 1-6
const STEPS: Step[] = [
  { id: 1, title: 'Format', icon: <LayoutGrid className="h-4 w-4" /> },
  { id: 2, title: 'Vertical', icon: <Palette className="h-4 w-4" /> },
  { id: 3, title: 'Mode', icon: <Sparkles className="h-4 w-4" /> },
  { id: 4, title: 'Template', icon: <FileImage className="h-4 w-4" /> },
  { id: 5, title: 'Details', icon: <FileText className="h-4 w-4" /> },
  { id: 6, title: 'Logos', icon: <ImageIcon className="h-4 w-4" /> },
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

      // Map form field names to template variable names
      const fieldToTemplateVar: Record<string, string> = {
        title: 'eventName',
        date: 'eventDate',
        time: 'eventTime',
        venue: 'venueName',
        speaker: 'speakerName',
        description: 'description',
      }

      // Replace template variables with form data (handling both mappings and direct names)
      Object.entries(formData.formData).forEach(([key, value]) => {
        const templateVar = fieldToTemplateVar[key] || key
        // Replace mapped variable (e.g., {{eventName}})
        prompt = prompt.replace(new RegExp(`{{${templateVar}}}`, 'g'), String(value))
        // Also replace direct variable name (e.g., {{title}}) for backwards compatibility
        prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), String(value))
      })

      // Handle vertical-specific fields from form_fields
      if (selectedVertical.form_fields) {
        const verticalFields = selectedVertical.form_fields as Array<{ name: string }>
        verticalFields.forEach((field) => {
          const value = (formData.formData as Record<string, unknown>)[field.name]
          if (value) {
            prompt = prompt.replace(new RegExp(`{{${field.name}}}`, 'g'), String(value))
          }
        })
      }

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
        return true // Template is optional
      case 5:
        // Dynamically validate based on current schema's first required field
        // Use dynamic schema if available (AI-generated), otherwise fall back to static
        const dynamicFields = dynamicSchema.schema?.fields
        const staticSchema = getCreativeSchema(selectedFormat?.id || null)
        const fieldsToValidate = dynamicFields || staticSchema.fields

        const firstRequiredField = fieldsToValidate.find(f => f.required)
        if (!firstRequiredField) return true
        const fieldValue = (formData.formData as Record<string, unknown>)[firstRequiredField.id]
        return !!fieldValue && String(fieldValue).trim().length > 0
      case 6:
        return true // Logos are optional, model selection happens in Step 7
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
          {/* Step Content Area */}
          <div className={cn(
            "flex-1 py-6",
            (step === 1 || step === 4) ? "px-6" : "container"
          )}>
          <div className={cn(
            "grid grid-cols-1 gap-6",
            step === 7 && "lg:grid-cols-12"
          )}>
            {/* Step Content - Left Panel */}
            <div className={cn(
              step === 7 ? "lg:col-span-6" : (step === 1 || step === 4) ? "w-full" : "max-w-4xl mx-auto w-full"
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

              {/* Step 4: Choose Template or Design Options */}
              {step === 4 && selectedVertical && (
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

              {/* Step 5: Fill Details - Dynamic form based on format type */}
              {step === 5 && selectedVertical && (
                <div className="space-y-6">
                  {/* Dynamic Details Form - renders fields based on selected format */}
                  <DynamicDetailsForm
                    formatId={formData.formatId || null}
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

              {/* Step 6: Logo Placement */}
              {step === 6 && (
                <div className="space-y-6">
                  {/* Logo Placement */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ImageIcon className="h-5 w-5 text-primary" />
                        Logo Placement
                      </CardTitle>
                      <CardDescription>
                        Select and position your logos on the creative
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <LogoPositionGrid />
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Step 7: Generate & Result */}
              {step === 7 && (
                <div className="space-y-6">
                  {/* AI Model Selection - Show before generation */}
                  {!generatedImage && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Wand2 className="h-5 w-5 text-primary" />
                          AI Model
                        </CardTitle>
                        <CardDescription>
                          Choose the AI model for generation
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <RadioGroup
                          value={selectedModel?.id || ''}
                          onValueChange={(value) => selectModel(value)}
                          className="space-y-3"
                        >
                          {models.map((model) => (
                            <div
                              key={model.id}
                              className={cn(
                                'relative flex items-center justify-between p-4 rounded-xl border-2 transition-all cursor-pointer',
                                'hover:border-primary/50 hover:shadow-sm',
                                selectedModel?.id === model.id
                                  ? 'border-primary bg-primary/5 shadow-sm'
                                  : 'border-border'
                              )}
                              onClick={() => selectModel(model.id)}
                            >
                              <div className="flex items-center gap-3">
                                <RadioGroupItem value={model.id} id={model.id} />
                                <div>
                                  <Label htmlFor={model.id} className="font-medium cursor-pointer">
                                    {model.name}
                                  </Label>
                                  <p className="text-sm text-muted-foreground">
                                    {model.description}
                                  </p>
                                  {model.best_for && (
                                    <Badge variant="secondary" className="mt-1.5 text-xs">
                                      Best for: {model.best_for}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold flex items-center gap-1 justify-end">
                                  <Coins className="h-4 w-4 text-yellow-500" />
                                  {model.credits_cost}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  ~{model.avg_generation_time_seconds}s
                                </div>
                              </div>
                            </div>
                          ))}
                        </RadioGroup>
                      </CardContent>
                    </Card>
                  )}

                  {/* Result Card - Show after generation */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        {generatedImage ? 'Your Creative is Ready!' : 'Generate Your Creative'}
                      </CardTitle>
                      <CardDescription>
                        {generatedImage ? 'Download or regenerate your creative' : 'Click the Generate button to create your poster'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {generatedImage ? (
                        <div className="relative aspect-[4/5] max-w-md mx-auto rounded-xl overflow-hidden border-2 shadow-xl">
                          <img
                            src={generatedImage}
                            alt="Generated creative"
                            className="w-full h-full object-cover"
                          />
                          {/* Hover overlay */}
                          <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                            <Button
                              size="lg"
                              onClick={() => setExportModalOpen(true)}
                              className="gap-2"
                            >
                              <Download className="h-5 w-5" />
                              Download
                            </Button>
                          </div>
                        </div>
                      ) : generationError ? (
                        <div className="text-center py-12">
                          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                            <RefreshCw className="h-8 w-8 text-destructive" />
                          </div>
                          <p className="text-destructive mb-4">{generationError}</p>
                          <Button onClick={handleGenerate} disabled={isGenerating}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Try Again
                          </Button>
                        </div>
                      ) : null}

                      <div className="flex flex-col sm:flex-row justify-center gap-3">
                        {generatedImage && (
                          <>
                            <Button
                              size="lg"
                              onClick={() => setExportModalOpen(true)}
                              className="gap-2"
                            >
                              <Download className="h-4 w-4" />
                              Download
                            </Button>
                            <Button
                              variant="outline"
                              size="lg"
                              onClick={() => setSaveTemplateDialogOpen(true)}
                              className="gap-2"
                            >
                              <Save className="h-4 w-4" />
                              Save as Template
                            </Button>
                          </>
                        )}
                        <Button
                          variant="outline"
                          size="lg"
                          onClick={handleGenerate}
                          disabled={isGenerating}
                          className="gap-2"
                        >
                          <RefreshCw className={cn("h-4 w-4", isGenerating && "animate-spin")} />
                          Regenerate
                        </Button>
                        <Button variant="ghost" size="lg" onClick={handleStartOver}>
                          Start Over
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>

            {/* Preview Panel - Right Sidebar (Step 7 only) */}
            {step === 7 && (
              <div className="lg:col-span-6">
                <PreviewPanel
                  isGenerating={isGenerating}
                  generatedImage={generatedImage}
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer Navigation */}
        {(step !== 7 || !generatedImage) && (
          <div className="bg-background border-t">
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
