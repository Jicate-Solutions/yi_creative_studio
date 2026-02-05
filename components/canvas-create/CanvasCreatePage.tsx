'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useCreativeStore } from '@/stores/creative-store'
import { useUIStore } from '@/stores/ui-store'
import { useVerticals, useLogos, useAIModels, useCredits, useOnlineStatus } from '@/hooks'
import { useAuthStore } from '@/stores/auth-store'
import { useExternalEvent } from '@/hooks/use-external-events'
import { useEventSuggestions } from '@/hooks/use-event-suggestions'
import { mapExternalEventToForm, createExternalEventMeta } from '@/lib/services/external-event-mapper'
import { HeaderBar } from './HeaderBar'
import { DetailsPanel } from './DetailsPanel'
import { ReviewSummaryPanel } from './ReviewSummaryPanel'
import { CanvasPreview } from './CanvasPreview'
import { LogosStylePanel } from './LogosStylePanel'
import { MobileBottomSheet } from './MobileBottomSheet'
import { TemplateBrowserPanel } from './TemplateBrowserPanel'
import { cn } from '@/lib/utils'
import { isPastDate } from '@/lib/utils/date-utils'
import { toast } from 'sonner'
import { FileText, Palette, RefreshCcw, Loader2, Download } from 'lucide-react'
import { PastDateWarningDialog } from '@/components/create/past-date-warning-dialog'
import { CreatePageTour } from '@/components/onboarding/CreatePageTour'
import { RegenerateModal, type RegenerateOptions } from '@/components/create/regenerate-modal'
import { ExportModal } from '@/components/export/export-modal'
import { ShuffleButton } from '@/components/create/shuffle-button'
import { ColorShuffleModal } from '@/components/create/color-shuffle-modal'
import { ImagePreviewModal } from '@/components/create/image-preview-modal'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import type { Json } from '@/types/database.types'

export function CanvasCreatePage() {
  const { currentOrganization, user } = useAuthStore()
  const { verticals } = useVerticals()
  const { logos } = useLogos()
  const { models, selectedModel, selectModel, isLoading: isModelsLoading } = useAIModels()
  const { canAfford, deductCredits, balance: creditsBalance } = useCredits()
  const { isOnline } = useOnlineStatus()

  // Sidebar control - collapse on this page only
  const { setSidebarCollapsed } = useUIStore()

  // Collapse sidebar on mount, restore on unmount (create page only)
  // Also add body class for toast positioning
  useEffect(() => {
    setSidebarCollapsed(true)
    document.body.classList.add('create-page-active')
    return () => {
      setSidebarCollapsed(false)
      document.body.classList.remove('create-page-active')
    }
  }, [setSidebarCollapsed])

  // External Event Integration - URL params (?eventId=xxx&source=yyy)
  const searchParams = useSearchParams()
  const eventId = searchParams.get('eventId')
  const eventSource = searchParams.get('source')
  const { event: externalEvent, isLoading: isLoadingEvent, error: eventError } = useExternalEvent(eventId, eventSource || undefined)

  // AI Suggestions
  const {
    isLoading: suggestionsLoading,
    requestSuggestions,
    acceptSuggestion,
    dismissSuggestion,
    getSuggestion,
  } = useEventSuggestions({
    organizationId: currentOrganization?.id || '',
    organizationType: currentOrganization?.type || 'yi_chapter',
  })

  // External event auto-config flag
  const [externalEventAutoConfigured, setExternalEventAutoConfigured] = useState(false)

  // Reset auto-config flag when eventId changes - allows re-import for new events
  // This fixes the bug where switching events quickly shows stale data
  useEffect(() => {
    setExternalEventAutoConfigured(false)
  }, [eventId])

  // Validation state
  const [isFormValid, setIsFormValid] = useState(false)
  const [missingRequiredFields, setMissingRequiredFields] = useState<string[]>([])
  const [showPastDateWarning, setShowPastDateWarning] = useState(false)
  const [regenerateModalOpen, setRegenerateModalOpen] = useState(false)

  // Panel mode: 'edit' = form view, 'review' = summary view
  const [panelMode, setPanelMode] = useState<'edit' | 'review'>('edit')

  // Selected model tracking
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null)

  // Post-generation modals and actions
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [shuffleModalOpen, setShuffleModalOpen] = useState(false)
  const [creativeId, setCreativeId] = useState<string | null>(null)
  const [previewModalOpen, setPreviewModalOpen] = useState(false)

  // Router for navigation
  const router = useRouter()

  // Handle validation changes from DetailsPanel
  const handleValidationChange = useCallback((isValid: boolean, missingFields: string[]) => {
    setIsFormValid(isValid)
    setMissingRequiredFields(missingFields)
  }, [])

  // Handle switching to review mode
  const handleReviewClick = useCallback(() => {
    setPanelMode('review')
  }, [])

  // Handle switching back to edit mode
  const handleBackToEdit = useCallback(() => {
    setPanelMode('edit')
  }, [])

  // Creative store state
  const {
    selectedFormat,
    selectFormat,
    formData,
    updateFormData,
    selectedVertical,
    selectVertical,
    selectedTemplate,
    initializeDefaultLogoPlacements,
    setLogos,  // ADD: Sync logos to store for use in HeaderStripSettings
    isGenerating,
    generatedImage,
    generationError,
    setGenerating,
    setGeneratedImage,
    setGenerationError,
    dynamicSchema,
    generateDynamicSchema,
    // External Event Import
    externalEventImport,
    importExternalEvent,
    clearExternalEventImport,
    setCreationMode,
    // Styling updates for regeneration
    updateTheme,
    updateStyle,
    updateResolution,
  } = useCreativeStore()

  // v24.26: Fix - use dynamicSchema.isLoading instead of non-existent dynamicSchemaLoading
  const dynamicSchemaLoading = dynamicSchema.isLoading

  // No SSE streaming - using original synchronous generation

  // Mobile panel state
  const [activePanel, setActivePanel] = useState<'details' | 'style' | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Initialize logos when available - sync to store for HeaderStripSettings
  useEffect(() => {
    if (logos.length > 0) {
      initializeDefaultLogoPlacements(logos)
      setLogos(logos)  // Sync logos to store so HeaderStripSettings can access them
    }
    // Note: initializeDefaultLogoPlacements and setLogos are stable Zustand actions
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logos])

  // Set default format if none selected
  useEffect(() => {
    if (!selectedFormat) {
      selectFormat('event_poster')
    }
  }, [selectedFormat, selectFormat])

  // Auto-select first vertical when verticals load (if none selected)
  useEffect(() => {
    if (verticals.length > 0 && !selectedVertical) {
      selectVertical(verticals[0].id)
    }
  }, [verticals, selectedVertical, selectVertical])

  // Trigger dynamic schema generation when format + vertical are ready
  useEffect(() => {
    if (selectedFormat && selectedVertical && currentOrganization?.id) {
      generateDynamicSchema(
        selectedFormat.id,
        selectedVertical.slug,
        currentOrganization.id
      )
    }
  }, [selectedFormat?.id, selectedVertical?.slug, currentOrganization?.id, generateDynamicSchema])

  // External Event Auto-Config & Import (Single Coordinated Effect)
  useEffect(() => {
    // Early exit if no event ID or already configured
    if (!eventId || externalEventAutoConfigured) return
    // Wait for event to load
    if (isLoadingEvent) return
    // Handle event fetch errors
    if (eventError) {
      toast.error('Failed to import event', {
        description: eventError,
        action: {
          label: 'Retry',
          onClick: () => {
            setExternalEventAutoConfigured(false)
            window.location.reload()
          },
        },
      })
      setExternalEventAutoConfigured(true) // Prevent retry loop
      return
    }
    // Wait for event data
    if (!externalEvent) return
    // Wait for dependencies
    if (!selectedVertical || verticals.length === 0) return

    // Perform auto-configuration
    console.log('[Canvas] Auto-configuring from external event:', externalEvent)

    // Set creation mode to scratch (no template for event imports)
    setCreationMode('scratch')

    // Map event to form fields
    const mappingResult = mapExternalEventToForm(externalEvent)

    // Create metadata
    const meta = createExternalEventMeta(
      externalEvent,
      eventSource || 'external',
      mappingResult.mappedFields
    )

    // Import into store with format inference
    importExternalEvent(
      meta,
      mappingResult.formData,
      mappingResult.mappedFields,
      mappingResult.dynamicFields,
      mappingResult.recommendedFormatId
    )

    // Auto-switch format with toast notification
    if (mappingResult.recommendedFormatId && mappingResult.recommendedFormatId !== selectedFormat?.id) {
      selectFormat(mappingResult.recommendedFormatId)
      toast.success(`Switched to ${mappingResult.formatReasoning || 'recommended format'}`, {
        description: `Based on event type: ${externalEvent.eventType || 'general'}`,
      })
    }

    // Show success toast
    const dynamicFieldCount = mappingResult.dynamicFields?.length || 0
    const totalFields = Object.keys(mappingResult.formData).length
    toast.success('Event imported successfully!', {
      description: `${totalFields} fields imported${dynamicFieldCount > 0 ? ` (${dynamicFieldCount} dynamic)` : ''}`,
    })

    // Show warnings if any
    mappingResult.warnings?.forEach(warning => {
      toast.warning(warning)
    })

    // Mark as configured
    setExternalEventAutoConfigured(true)
  }, [
    eventId,
    eventSource,
    externalEvent,
    isLoadingEvent,
    eventError,
    externalEventAutoConfigured,
    selectedVertical,
    verticals,
    selectedFormat?.id,
    importExternalEvent,
    selectFormat,
    setCreationMode,
  ])

  // Handle generate click
  const handleGenerate = useCallback(async () => {
    if (!selectedFormat || !currentOrganization) {
      toast.error('Please select a format and ensure you are logged in')
      return
    }

    // Validate required fields
    if (!isFormValid && missingRequiredFields.length > 0) {
      toast.error('Please fill in all required fields', {
        description: `Missing: ${missingRequiredFields.join(', ')}`,
      })
      return
    }

    // Use selected model or fallback to default (Gemini 2.5 Flash)
    const modelToUse = selectedModel || models.find(m => m.model_id === 'gemini-2.5-flash-image') || models[0]
    if (!modelToUse) {
      toast.error('No AI model available')
      return
    }

    // Credit validation
    const creditCost = modelToUse.credits_cost || 1
    if (!canAfford(creditCost)) {
      toast.error('Insufficient credits', {
        description: `You need ${creditCost} credits but only have ${creditsBalance}. Please add more credits to continue.`,
      })
      return
    }

    // Online check
    if (!isOnline) {
      toast.error('You are offline', {
        description: 'Please check your internet connection and try again.',
      })
      return
    }

    setGenerating(true)
    setGenerationError(null)

    try {
      // Deduct credits first
      const creditCost = modelToUse.credits_cost || 1
      const deductResult = await deductCredits(
        creditCost,
        `Generated ${selectedVertical?.name || 'creative'} - ${selectedFormat.label}`,
      )

      if (!deductResult) {
        setGenerating(false)
        return
      }

      // Determine creation mode from store
      const creationMode = formData.creationMode || 'scratch'
      const isTemplateMode = creationMode === 'template' && selectedTemplate

      // Build generation payload matching the existing API structure
      const generationPayload = {
        prompt: '', // Will be generated server-side from form data
        model: modelToUse.model_id,
        provider: modelToUse.provider,
        verticalSlug: selectedVertical?.slug || 'events',
        logosPlacements: formData.logosPlacements,
        logoBackgroundColor: formData.logoBackgroundColor,
        logoStripMode: formData.logoStripMode,
        enhanced4RowStrip: formData.enhanced4RowStrip,
        organizationId: currentOrganization.id,
        templateId: isTemplateMode ? selectedTemplate.id : null,
        templateUrl: isTemplateMode ? selectedTemplate.image_url : null,
        creationMode: creationMode as 'template' | 'scratch',
        designData: formData.designData,
        formatId: selectedFormat.id,
        customDimensions: formData.customDimensions || null,
        language: (formData.formData?.language as string) || 'en',
        userFormData: formData.formData,
      }

      // Call original /api/generate endpoint
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(generationPayload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Generation failed')
      }

      const result = await response.json()

      // Set the generated image
      setGeneratedImage(result.imageUrl)

      // Save creative to database to get creativeId
      // Reference: page.wizard-backup.tsx:1013-1033
      const supabase = createClient()
      const creativeInsert = {
        organization_id: currentOrganization!.id,
        created_by: user?.id ?? null,
        ai_model: modelToUse.name ?? modelToUse.model_id,
        ai_model_id: modelToUse.id ?? modelToUse.model_id,
        creative_type: selectedFormat?.id || 'event_poster',
        vertical: selectedVertical?.slug,
        credits_used: creditCost,
        image_url: result.imageUrl,
        thumbnail_url: result.thumbnailUrl,
        form_data: {
          formData: formData.formData,
          designData: formData.designData,
        } as unknown as Json,
        prompt_used: '', // Prompt is generated server-side
        title: (formData.formData as any)?.eventName || `${selectedVertical?.name || 'Creative'}`,
        logo_config: formData.logosPlacements as unknown as Json,
        prevention_applied: result.preventionApplied ?? null,
        prevention_holdout: result.preventionHoldout ?? false,
      }

      const { data: creativeData, error: saveError } = await supabase
        .from('creatives')
        .insert(creativeInsert)
        .select('id')
        .single()

      if (saveError) {
        console.error('Failed to save creative to database:', saveError)
        console.error('Creative insert attempted:', JSON.stringify(creativeInsert, null, 2))
        toast.error('Image generated but failed to save to gallery', {
          description: 'Please check the console for details or contact support.',
        })
      } else if (creativeData?.id) {
        setCreativeId(creativeData.id)
        console.log('Creative saved successfully with ID:', creativeData.id)
        toast.success('Creative generated and saved to gallery!')
      }
    } catch (err) {
      console.error('Generation error:', err)
      const message = err instanceof Error ? err.message : 'Generation failed'
      setGenerationError(message)
      toast.error(message)
    } finally {
      setGenerating(false)
    }
  }, [
    selectedFormat,
    currentOrganization,
    formData,
    selectedVertical,
    selectedTemplate,
    models,
    setGeneratedImage,
    setGenerating,
    setGenerationError,
    canAfford,
    deductCredits,
    creditsBalance,
    isOnline,
    isFormValid,
    missingRequiredFields,
  ])

  // Check for past date before generating
  const handleGenerateWithDateCheck = useCallback(() => {
    const eventDate = (formData.formData as { date?: string }).date
    if (eventDate && isPastDate(eventDate)) {
      setShowPastDateWarning(true)
    } else {
      handleGenerate()
    }
  }, [formData.formData, handleGenerate])

  // Handle regeneration with different model/settings
  const handleRegenerate = useCallback(async (options: RegenerateOptions) => {
    setRegenerateModalOpen(false)

    const regenerateModel = models.find(m => m.id === options.modelId)
    if (!regenerateModel) {
      toast.error('Invalid model selected')
      return
    }

    const modelCreditCost = regenerateModel.credits_cost || 1
    if (!canAfford(modelCreditCost)) {
      toast.error('Insufficient credits')
      return
    }

    // Update model selection
    setSelectedModelId(options.modelId)

    // Update theme/style/resolution if provided (scratch mode only)
    if (formData.creationMode === 'scratch') {
      if (options.theme) updateTheme(options.theme)
      if (options.style) updateStyle(options.style)
      if (options.resolution) updateResolution(options.resolution as '1K' | '2K' | '4K')
    }

    // Clear previous image
    setGeneratedImage(null)

    // Trigger generation with updated settings
    // We need to pass the new model directly to avoid closure issues
    setGenerating(true)
    setGenerationError(null)

    try {
      // Deduct credits first
      const deductResult = await deductCredits(
        modelCreditCost,
        `Regenerated ${selectedVertical?.name || 'creative'} - ${selectedFormat?.label}`,
      )

      if (!deductResult) {
        setGenerating(false)
        return
      }

      // Build generation payload with the new model
      const creationMode = formData.creationMode || 'scratch'
      const isTemplateMode = creationMode === 'template' && selectedTemplate

      const generationPayload = {
        prompt: '',
        model: regenerateModel.model_id,
        provider: regenerateModel.provider,
        verticalSlug: selectedVertical?.slug || 'events',
        logosPlacements: formData.logosPlacements,
        logoBackgroundColor: formData.logoBackgroundColor,
        logoStripMode: formData.logoStripMode,
        enhanced4RowStrip: formData.enhanced4RowStrip,
        organizationId: currentOrganization?.id,
        templateId: isTemplateMode ? selectedTemplate.id : null,
        templateUrl: isTemplateMode ? selectedTemplate.image_url : null,
        creationMode: creationMode as 'template' | 'scratch',
        designData: formData.designData,
        formatId: selectedFormat?.id,
        customDimensions: formData.customDimensions || null,
        language: (formData.formData?.language as string) || 'en',
        userFormData: formData.formData,
      }

      // Call original /api/generate endpoint
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(generationPayload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Regeneration failed')
      }

      const result = await response.json()

      // Set the generated image
      setGeneratedImage(result.imageUrl)

      // Save creative to database to get creativeId
      const supabase = createClient()
      const creativeInsert = {
        organization_id: currentOrganization!.id,
        created_by: user?.id ?? null,
        ai_model: regenerateModel.name ?? regenerateModel.model_id,
        ai_model_id: regenerateModel.id ?? regenerateModel.model_id,
        creative_type: selectedFormat?.id || 'event_poster',
        vertical: selectedVertical?.slug,
        credits_used: modelCreditCost,
        image_url: result.imageUrl,
        thumbnail_url: result.thumbnailUrl,
        form_data: {
          formData: formData.formData,
          designData: formData.designData,
        } as unknown as Json,
        prompt_used: '', // Prompt is generated server-side
        title: (formData.formData as any)?.eventName || `${selectedVertical?.name || 'Creative'}`,
        logo_config: formData.logosPlacements as unknown as Json,
        prevention_applied: result.preventionApplied ?? null,
        prevention_holdout: result.preventionHoldout ?? false,
      }

      const { data: creativeData, error: saveError } = await supabase
        .from('creatives')
        .insert(creativeInsert)
        .select('id')
        .single()

      if (saveError) {
        console.error('Failed to save regenerated creative to database:', saveError)
        console.error('Creative insert attempted:', JSON.stringify(creativeInsert, null, 2))
        toast.error('Image regenerated but failed to save to gallery', {
          description: 'Please check the console for details or contact support.',
        })
      } else if (creativeData?.id) {
        setCreativeId(creativeData.id)
        console.log('Regenerated creative saved successfully with ID:', creativeData.id)
        toast.success('Creative regenerated and saved to gallery!')
      }
    } catch (err) {
      console.error('Regeneration error:', err)
      const message = err instanceof Error ? err.message : 'Regeneration failed'
      setGenerationError(message)
      toast.error(message)
    } finally {
      setGenerating(false)
    }
  }, [
    models,
    canAfford,
    formData,
    updateTheme,
    updateStyle,
    updateResolution,
    setGeneratedImage,
    setGenerating,
    setGenerationError,
    deductCredits,
    selectedVertical,
    selectedFormat,
    currentOrganization,
    selectedTemplate,
    // streaming removed - using synchronous fetch now
  ])

  // Desktop layout - Canva-style tight panels
  if (!isMobile) {
    return (
      <div className="flex flex-col h-screen bg-muted/40">
        {/* Header Bar */}
        <HeaderBar
          onGenerate={handleGenerateWithDateCheck}
          isGenerating={isGenerating}
          models={models}
          selectedModel={selectedModel}
          onModelChange={selectModel}
          isModelsLoading={isModelsLoading}
          canGenerate={panelMode === 'review' && isFormValid}
          hasGeneratedImage={!!generatedImage}
        />

        {/* Main Content - Canva-style layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Details or Review Summary */}
          <div className="w-[375px] min-w-[375px] border-r bg-card overflow-y-auto h-full flex flex-col" data-tour="details-panel">
            {panelMode === 'edit' ? (
              <DetailsPanel
                suggestionsLoading={suggestionsLoading}
                onRequestSuggestions={requestSuggestions}
                onAcceptSuggestion={acceptSuggestion}
                onDismissSuggestion={dismissSuggestion}
                getSuggestion={getSuggestion}
                onValidationChange={handleValidationChange}
                showReviewButton={isFormValid}
                onReviewClick={handleReviewClick}
                organizationId={currentOrganization?.id}
              />
            ) : (
              <ReviewSummaryPanel onBackToEdit={handleBackToEdit} />
            )}
          </div>

          {/* Center - Canvas Preview OR Template Browser (no scroll, fit to screen) */}
          <div className="flex-1 flex flex-col items-center justify-center px-2 overflow-hidden relative" id="preview-panel">
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Generating your creative...</p>
              </div>
            ) : formData.creationMode === 'template' && !generatedImage ? (
              <div className="w-full h-full max-w-4xl">
                <TemplateBrowserPanel />
              </div>
            ) : (
              <div className="w-full max-w-2xl flex flex-col items-center">
                {/* Clickable wrapper for full-view modal */}
                <div
                  onClick={() => {
                    if (generatedImage || selectedTemplate?.image_url) {
                      setPreviewModalOpen(true)
                    }
                  }}
                  className={cn(
                    generatedImage || selectedTemplate?.image_url
                      ? 'cursor-pointer hover:scale-[1.02] hover:shadow-xl transition-all duration-200'
                      : ''
                  )}
                >
                  <CanvasPreview
                    onExpandClick={
                      generatedImage || selectedTemplate?.image_url
                        ? () => setPreviewModalOpen(true)
                        : undefined
                    }
                  />
                </div>
                {/* Action buttons when image exists */}
                {generatedImage && !isGenerating && (
                  <div className="w-full max-w-sm grid grid-cols-2 gap-2 mt-3 px-4">
                    <Button
                      size="sm"
                      onClick={() => setExportModalOpen(true)}
                      className="w-full gap-2"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </Button>

                    <ShuffleButton
                      creativeId={creativeId}
                      onShuffleClick={() => setShuffleModalOpen(true)}
                    />

                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => router.push('/gallery')}
                      className="w-full gap-2"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      View in Gallery
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setRegenerateModalOpen(true)}
                      className="w-full gap-2"
                    >
                      <RefreshCcw className="h-3.5 w-3.5" />
                      Regenerate
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Panel - Logos & Style */}
          <div className="w-[375px] min-w-[375px] border-l bg-card overflow-y-auto" data-tour="style-panel">
            <LogosStylePanel />
          </div>
        </div>

        {/* Past Date Warning Dialog */}
        <PastDateWarningDialog
          open={showPastDateWarning}
          onOpenChange={setShowPastDateWarning}
          onContinue={() => {
            setShowPastDateWarning(false)
            handleGenerate()
          }}
          date={(formData.formData as { date?: string }).date || ''}
        />

        {/* Full View Preview Modal */}
        {(generatedImage || selectedTemplate?.image_url) && (
          <ImagePreviewModal
            open={previewModalOpen}
            onOpenChange={setPreviewModalOpen}
            imageUrl={generatedImage || selectedTemplate?.image_url || ''}
            imageName={
              (formData.formData.eventName as string) ||
              (formData.formData.title as string) ||
              (formData.formData.postTitle as string) ||
              (selectedTemplate ? 'Template Preview' : 'Generated Creative')
            }
            onDownloadClick={() => {
              setPreviewModalOpen(false)
              setExportModalOpen(true)
            }}
          />
        )}

        {/* Regenerate Modal */}
        {generatedImage && (
          <RegenerateModal
            open={regenerateModalOpen}
            onOpenChange={setRegenerateModalOpen}
            currentModelId={selectedModelId || (models.find(m => m.model_id === 'gemini-2.5-flash-image')?.id)}
            currentTheme={formData.designData?.theme}
            currentStyle={formData.designData?.style}
            currentResolution={formData.designData?.resolution}
            creationMode={formData.creationMode as 'template' | 'scratch'}
            models={models}
            isRegenerating={isGenerating}
            currentBalance={creditsBalance}
            onRegenerate={handleRegenerate}
          />
        )}

        {/* Export Modal */}
        <ExportModal
          open={exportModalOpen}
          onOpenChange={setExportModalOpen}
          creativeId={creativeId || ''}
          creativeName={formData.formData?.eventName as string || 'Creative'}
          previewUrl={generatedImage || undefined}
          creativeType={selectedFormat?.id}
          vertical={selectedVertical?.name}
        />

        {/* Color Shuffle Modal */}
        <ColorShuffleModal
          open={shuffleModalOpen}
          onOpenChange={setShuffleModalOpen}
          creativeId={creativeId}
        />

        {/* Spotlight Tour for first-time users */}
        <CreatePageTour />
      </div>
    )
  }

  // Mobile layout
  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header Bar */}
      <HeaderBar
        onGenerate={handleGenerateWithDateCheck}
        isGenerating={isGenerating}
        models={models}
        selectedModel={selectedModel}
        onModelChange={selectModel}
        isModelsLoading={isModelsLoading}
        canGenerate={panelMode === 'review' && isFormValid}
        hasGeneratedImage={!!generatedImage}
      />

      {/* Canvas Preview OR Template Browser - Full Width with bottom padding for nav */}
      <div className="flex-1 flex flex-col items-center justify-center px-2 py-4 pb-2 bg-muted/30 overflow-auto">
        {isGenerating ? (
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Generating your creative...</p>
          </div>
        ) : formData.creationMode === 'template' && !generatedImage ? (
          <div className="w-full h-full">
            <TemplateBrowserPanel />
          </div>
        ) : (
          <div className="w-full flex flex-col items-center pb-20">
            {/* Clickable wrapper for full-view modal */}
            <div
              onClick={() => {
                if (generatedImage || selectedTemplate?.image_url) {
                  setPreviewModalOpen(true)
                }
              }}
              className={cn(
                generatedImage || selectedTemplate?.image_url
                  ? 'cursor-pointer active:scale-[0.98] transition-all duration-200'
                  : ''
              )}
            >
              <CanvasPreview
                onExpandClick={
                  generatedImage || selectedTemplate?.image_url
                    ? () => setPreviewModalOpen(true)
                    : undefined
                }
              />
            </div>
            {/* Action buttons when image exists */}
            {generatedImage && !isGenerating && (
              <div className="w-full max-w-sm grid grid-cols-2 gap-2 mt-4 px-4">
                <Button
                  size="sm"
                  onClick={() => setExportModalOpen(true)}
                  className="w-full gap-2"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </Button>

                <ShuffleButton
                  creativeId={creativeId}
                  onShuffleClick={() => setShuffleModalOpen(true)}
                />

                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => router.push('/gallery')}
                  className="w-full gap-2"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  View in Gallery
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setRegenerateModalOpen(true)}
                  className="w-full gap-2"
                >
                  <RefreshCcw className="h-3.5 w-3.5" />
                  Regenerate
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile Action Bar - More Prominent with Icons */}
      {!activePanel && (
        <div className="border-t bg-card/95 backdrop-blur-sm px-4 py-3 flex justify-around shadow-[0_-2px_10px_rgba(0,0,0,0.08)]">
          <button
            onClick={() => setActivePanel('details')}
            className={cn(
              'flex flex-col items-center gap-1.5 px-6 py-2.5 rounded-xl transition-all',
              activePanel === 'details'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground'
            )}
          >
            <FileText className="h-5 w-5" />
            <span className="text-xs font-medium">Details</span>
          </button>
          <button
            onClick={() => setActivePanel('style')}
            className={cn(
              'flex flex-col items-center gap-1.5 px-6 py-2.5 rounded-xl transition-all',
              activePanel === 'style'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground'
            )}
          >
            <Palette className="h-5 w-5" />
            <span className="text-xs font-medium">Style</span>
          </button>
        </div>
      )}

      {/* Mobile Bottom Sheets */}
      <MobileBottomSheet
        isOpen={activePanel === 'details'}
        onClose={() => setActivePanel(null)}
        title={panelMode === 'edit' ? 'Event Details' : 'Review Summary'}
      >
        {panelMode === 'edit' ? (
          <DetailsPanel
            suggestionsLoading={suggestionsLoading}
            onRequestSuggestions={requestSuggestions}
            onAcceptSuggestion={acceptSuggestion}
            onDismissSuggestion={dismissSuggestion}
            getSuggestion={getSuggestion}
            onValidationChange={handleValidationChange}
            showReviewButton={isFormValid}
            onReviewClick={handleReviewClick}
            organizationId={currentOrganization?.id}
          />
        ) : (
          <ReviewSummaryPanel onBackToEdit={handleBackToEdit} />
        )}
      </MobileBottomSheet>

      <MobileBottomSheet
        isOpen={activePanel === 'style'}
        onClose={() => setActivePanel(null)}
        title="Logos & Style"
      >
        <LogosStylePanel />
      </MobileBottomSheet>

      {/* Past Date Warning Dialog */}
      <PastDateWarningDialog
        open={showPastDateWarning}
        onOpenChange={setShowPastDateWarning}
        onContinue={() => {
          setShowPastDateWarning(false)
          handleGenerate()
        }}
        date={(formData.formData as { date?: string }).date || ''}
      />

      {/* Regenerate Modal */}
      {generatedImage && (
        <RegenerateModal
          open={regenerateModalOpen}
          onOpenChange={setRegenerateModalOpen}
          currentModelId={selectedModelId || (models.find(m => m.model_id === 'gemini-2.5-flash-image')?.id)}
          currentTheme={formData.designData?.theme}
          currentStyle={formData.designData?.style}
          currentResolution={formData.designData?.resolution}
          creationMode={formData.creationMode as 'template' | 'scratch'}
          models={models}
          isRegenerating={isGenerating}
          currentBalance={creditsBalance}
          onRegenerate={handleRegenerate}
        />
      )}

      {/* Export Modal */}
      <ExportModal
        open={exportModalOpen}
        onOpenChange={setExportModalOpen}
        creativeId={creativeId || ''}
        creativeName={formData.formData?.eventName as string || 'Creative'}
        previewUrl={generatedImage || undefined}
        creativeType={selectedFormat?.id}
        vertical={selectedVertical?.name}
      />

      {/* Color Shuffle Modal */}
      <ColorShuffleModal
        open={shuffleModalOpen}
        onOpenChange={setShuffleModalOpen}
        creativeId={creativeId}
      />
    </div>
  )
}
