'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useCreativeStore } from '@/stores/creative-store'
import { useVerticals, useAIModels, useLogos, useCredits } from '@/hooks'
import { useEventSuggestions } from '@/hooks/use-event-suggestions'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import type { TablesInsert, Json } from '@/types/database.types'
import type { SuggestableField } from '@/types/suggestions'
import { FormatSelectionInline } from '@/components/create/format-selection'
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
} from 'lucide-react'
import { VerticalIcon } from '@/components/ui/vertical-icon'
import { Stepper, type Step } from '@/components/ui/stepper'
import { PreviewPanel } from '@/components/create/preview-panel'
import { LogoPositionGrid } from '@/components/create/logo-position-grid'
import {
  AISuggestionField,
  AISuggestionActions,
  AITriggerButton,
} from '@/components/create/ai-suggestion-field'
import { TemplateSelector } from '@/components/create/template-selector'
import { ModeSelector } from '@/components/create/mode-selector'
import { DesignTab } from '@/components/create/design-tab'
import { SpeakerPhotoUpload } from '@/components/create/speaker-photo-upload'
import { ExportModal } from '@/components/export'
import { ROUTES } from '@/lib/config/constants'
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
  { id: 0, title: 'Format', icon: <LayoutGrid className="h-4 w-4" /> },
  { id: 1, title: 'Vertical', icon: <Palette className="h-4 w-4" /> },
  { id: 2, title: 'Mode', icon: <Sparkles className="h-4 w-4" /> },
  { id: 3, title: 'Template', icon: <FileImage className="h-4 w-4" /> },
  { id: 4, title: 'Details', icon: <FileText className="h-4 w-4" /> },
  { id: 5, title: 'Logos', icon: <ImageIcon className="h-4 w-4" /> },
  { id: 6, title: 'Generate', icon: <Wand2 className="h-4 w-4" /> },
]

export default function CreatePage() {
  const router = useRouter()
  const supabase = createClient()
  const { currentOrganization } = useAuthStore()

  const { verticals, selectedVertical, selectVertical, isLoading: isVerticalsLoading, error: verticalsError, fetchVerticals } = useVerticals()
  const { models, selectedModel, selectModel, getModelCost } = useAIModels()
  const { logos, fetchLogos } = useLogos()
  const { balance, canAfford, deductCredits } = useCredits()

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
    getFormatDimensions,
  } = useCreativeStore()

  // Always start at step 0 (format selection) when visiting create page
  const [step, setStep] = useState(0)
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [creativeId, setCreativeId] = useState<string | null>(null)

  // Handle format selection - auto advance to step 1
  const handleSelectFormat = useCallback((format: CreativeFormat) => {
    selectFormat(format.id)
    setStep(1)
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

  const creditCost = getModelCost()
  const canGenerate = selectedVertical && selectedModel && canAfford(creditCost)

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
      setStep(5)
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

  // Navigation handlers
  const handleBack = () => {
    if (step > 0) setStep(step - 1)
  }

  const handleNext = () => {
    if (step < 6) setStep(step + 1)
  }

  const canProceed = () => {
    switch (step) {
      case 0:
        return !!selectedFormat
      case 1:
        return !!selectedVertical
      case 2:
        return !!formData.creationMode
      case 3:
        return true // Template is optional
      case 4:
        return !!(formData.formData as { title?: string }).title
      case 5:
        return true // Logos are optional, model selection happens in Step 6
      default:
        return true
    }
  }

  return (
    <TooltipProvider>
      <div className="min-h-[calc(100vh-4rem)] flex flex-col">
        {/* Sticky Header with Stepper */}
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b">
          <div className="container py-4">
            {/* Header Row */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  {step === 0
                    ? 'What would you like to create?'
                    : selectedFormat
                    ? `Create ${selectedFormat.label}`
                    : 'Create Poster'}
                </h1>
                <p className="text-sm text-muted-foreground hidden sm:block">
                  {step === 0
                    ? 'Choose a format to get started with AI-powered creative generation'
                    : selectedFormat
                    ? `${selectedFormat.width} × ${selectedFormat.height} px • ${selectedFormat.aspectRatio}`
                    : 'Generate AI-powered brand creatives'}
                </p>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="gap-2 cursor-help">
                    <Coins className="h-4 w-4 text-yellow-500" />
                    <span className="font-semibold">{balance.toLocaleString()}</span>
                    <span className="hidden sm:inline text-muted-foreground">credits</span>
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Your available credits for generating creatives</p>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Stepper */}
            <Stepper
              steps={STEPS}
              currentStep={step}
              onStepClick={(stepId) => {
                if (stepId < step) setStep(stepId)
              }}
            />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 container py-6">
          <div className={cn(
            "grid grid-cols-1 gap-6",
            step === 6 && "lg:grid-cols-12"
          )}>
            {/* Step Content - Left Panel */}
            <div className={cn(
              step === 6 ? "lg:col-span-6" : "max-w-4xl mx-auto w-full"
            )}>
              {/* Step 0: Select Format */}
              {step === 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <LayoutGrid className="h-5 w-5 text-primary" />
                      Choose Format
                    </CardTitle>
                    <CardDescription>
                      Select the canvas size and format for your creative
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FormatSelectionInline onSelect={handleSelectFormat} />
                  </CardContent>
                </Card>
              )}

              {/* Step 1: Select Vertical & Creation Mode */}
              {step === 1 && (
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

              {/* Step 2: How would you like to create? */}
              {step === 2 && selectedVertical && (
                <ModeSelector
                  mode={formData.creationMode}
                  onModeChange={setCreationMode}
                />
              )}

              {/* Step 3: Choose Template or Design Options */}
              {step === 3 && selectedVertical && (
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
                    />
                  </div>
                )
              )}

              {/* Step 4: Fill Details */}
              {step === 4 && selectedVertical && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Event Details
                    </CardTitle>
                    <CardDescription>
                      Fill in the details for your {selectedVertical.name} creative
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Event Title with AI Trigger Button */}
                    <div className="space-y-2">
                      <Label htmlFor="title">Event Title</Label>
                      <div className="flex gap-2">
                        <Input
                          id="title"
                          placeholder="Enter event title (e.g., Annual Traffic Awareness Campaign)"
                          value={(formData.formData as { title?: string }).title || ''}
                          onChange={(e) => updateFormData({ title: e.target.value })}
                          className="flex-1"
                        />
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>
                              <AITriggerButton
                                onClick={handleRequestSuggestions}
                                isLoading={isSuggestionsLoading}
                                disabled={((formData.formData as { title?: string }).title || '').length < 5}
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Get AI suggestions for all fields based on the title</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Enter a descriptive title, then click the magic wand to get AI suggestions
                      </p>
                    </div>

                    {/* AI Suggestions Error */}
                    {suggestionsError && (
                      <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                        {suggestionsError}
                      </div>
                    )}

                    {/* Bulk AI Actions */}
                    <AISuggestionActions
                      hasSuggestions={hasSuggestions}
                      onAcceptAll={acceptAllSuggestions}
                      onDismissAll={dismissAllSuggestions}
                      isLoading={isSuggestionsLoading}
                    />

                    {/* Dynamic form fields with AI suggestions */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <AISuggestionField
                        field="date"
                        label="Event Date"
                        value={getFieldValue('date')}
                        suggestion={getSuggestion('date')}
                        onChange={(value) => setFieldValue('date', value)}
                        onAccept={() => acceptSuggestion('date')}
                        onDismiss={() => dismissSuggestion('date')}
                        isLoading={isSuggestionsLoading}
                        placeholder="e.g., March 15, 2025"
                      />

                      <AISuggestionField
                        field="time"
                        label="Event Time"
                        value={getFieldValue('time')}
                        suggestion={getSuggestion('time')}
                        onChange={(value) => setFieldValue('time', value)}
                        onAccept={() => acceptSuggestion('time')}
                        onDismiss={() => dismissSuggestion('time')}
                        isLoading={isSuggestionsLoading}
                        placeholder="e.g., 6:00 PM onwards"
                      />

                      <AISuggestionField
                        field="venue"
                        label="Venue"
                        value={getFieldValue('venue')}
                        suggestion={getSuggestion('venue')}
                        onChange={(value) => setFieldValue('venue', value)}
                        onAccept={() => acceptSuggestion('venue')}
                        onDismiss={() => dismissSuggestion('venue')}
                        isLoading={isSuggestionsLoading}
                        placeholder="Event venue"
                      />

                      <AISuggestionField
                        field="speaker"
                        label="Speaker/Guest (Optional)"
                        value={getFieldValue('speaker')}
                        suggestion={getSuggestion('speaker')}
                        onChange={(value) => setFieldValue('speaker', value)}
                        onAccept={() => acceptSuggestion('speaker')}
                        onDismiss={() => dismissSuggestion('speaker')}
                        isLoading={isSuggestionsLoading}
                        placeholder="Chief guest or speaker name"
                      />
                    </div>

                    <AISuggestionField
                      field="description"
                      label="Additional Details (Optional)"
                      value={getFieldValue('description')}
                      suggestion={getSuggestion('description')}
                      onChange={(value) => setFieldValue('description', value)}
                      onAccept={() => acceptSuggestion('description')}
                      onDismiss={() => dismissSuggestion('description')}
                      isLoading={isSuggestionsLoading}
                      placeholder="Any additional information to include"
                      multiline
                    />

                    {/* Optional Settings: Speaker Photo & Footer */}
                    <Separator className="my-6" />
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
              )}

              {/* Step 5: Logo Placement */}
              {step === 5 && (
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

              {/* Step 6: Generate & Result */}
              {step === 6 && (
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
                          <Button
                            size="lg"
                            onClick={() => setExportModalOpen(true)}
                            className="gap-2"
                          >
                            <Download className="h-4 w-4" />
                            Download
                          </Button>
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

            {/* Preview Panel - Right Sidebar (Step 6 only) */}
            {step === 6 && (
              <div className="lg:col-span-6">
                <PreviewPanel
                  isGenerating={isGenerating}
                  generatedImage={generatedImage}
                />
              </div>
            )}
          </div>
        </div>

        {/* Sticky Footer Navigation */}
        {(step !== 6 || !generatedImage) && (
          <div className="sticky bottom-0 z-20 bg-background/95 backdrop-blur-md border-t">
            <div className="container py-4">
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={step === 0}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Back</span>
                </Button>

                {/* Step info for mobile */}
                <div className="text-sm text-muted-foreground lg:hidden">
                  Step {step} of 6
                </div>

                {step === 6 ? (
                  <Button
                    onClick={handleGenerate}
                    disabled={!canGenerate || isGenerating}
                    className="gap-2 gradient-yi"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="hidden sm:inline">Generating...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        <span className="hidden sm:inline">Generate</span>
                        <Badge variant="secondary" className="ml-1 text-xs">
                          {creditCost} credits
                        </Badge>
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={handleNext}
                    disabled={!canProceed()}
                    className="gap-2"
                  >
                    <span className="hidden sm:inline">Continue</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

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
      </div>
    </TooltipProvider>
  )
}
