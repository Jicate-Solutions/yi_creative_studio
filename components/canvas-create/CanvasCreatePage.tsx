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
import { FileText, Palette, RefreshCcw, Loader2, Download, Sparkles, Images, Check } from 'lucide-react'
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
import type { ExternalEvent } from '@/types/external-event.types'

interface CanvasCreatePageProps {
  initialEventData?: ExternalEvent | null
  eventSource?: 'sso_token' | 'none'
}

export function CanvasCreatePage({
  initialEventData = null,
  eventSource: initialEventSource = 'none'
}: CanvasCreatePageProps = {}) {
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
  const { event: externalEvent, isLoading: isLoadingEvent, error: eventError } = useExternalEvent(
    eventId,
    eventSource || undefined,
    initialEventData // Pass initial data from SSO session
  )

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

  // Show success toast when using SSO event data
  useEffect(() => {
    if (initialEventSource === 'sso_token' && initialEventData && !externalEventAutoConfigured) {
      toast.success('Event details loaded from Yi Connect')
      console.log('[Create Page] Event loaded from SSO token:', initialEventData.name)
    }
  }, [initialEventSource, initialEventData, externalEventAutoConfigured])

  // Validation state
  const [isFormValid, setIsFormValid] = useState(false)
  const [missingRequiredFields, setMissingRequiredFields] = useState<string[]>([])
  const [showPastDateWarning, setShowPastDateWarning] = useState(false)
  const [regenerateModalOpen, setRegenerateModalOpen] = useState(false)

  // Panel mode: 'edit' = form view, 'review' = summary view
  const [panelMode, setPanelMode] = useState<'edit' | 'review'>('edit')

  // Selected model tracking
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null)

  // Flash 3.1 (Nano Banana 2) thinking level: 'minimal' = fast, 'High' = quality
  const [thinkingLevel, setThinkingLevel] = useState<'minimal' | 'High'>('High')
  // Flash 3.1 (Nano Banana 2) image search grounding — default ON
  const [useImageSearch, setUseImageSearch] = useState(true)
  // Post-generation modals and actions
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [shuffleModalOpen, setShuffleModalOpen] = useState(false)
  const [creativeId, setCreativeId] = useState<string | null>(null)
  const [previewModalOpen, setPreviewModalOpen] = useState(false)

  // Router for navigation
  const router = useRouter()

  // Handle validation changes from DetailsPanel
  // If form becomes invalid while in review mode, drop back to edit so Generate stays locked
  const handleValidationChange = useCallback((isValid: boolean, missingFields: string[]) => {
    setIsFormValid(isValid)
    setMissingRequiredFields(missingFields)
    if (!isValid) setPanelMode('edit')
  }, [])

  // Handle switching to review mode (desktop)
  const handleReviewClick = useCallback(() => {
    setPanelMode('review')
  }, [])

  // Mobile review: also close the Details sheet so header Generate button is visible
  const handleMobileReviewClick = useCallback(() => {
    setPanelMode('review')
    setActivePanel(null)
  }, [])

  // Handle switching back to edit mode
  const handleBackToEdit = useCallback(() => {
    setPanelMode('edit')
    // activePanel stays 'details' (sheet already open), so no change needed
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
    updateResolution,
  } = useCreativeStore()

  // v24.26: Fix - use dynamicSchema.isLoading instead of non-existent dynamicSchemaLoading
  const dynamicSchemaLoading = dynamicSchema.isLoading

  // Share generated image via Web Share API with clipboard fallback
  const handleShare = useCallback(async () => {
    if (!generatedImage) return
    if (navigator.share) {
      try {
        await navigator.share({ url: generatedImage, title: (formData.formData?.eventName as string) || 'Yi Creative' })
        return
      } catch {
        // User cancelled or share failed — fall through to clipboard
      }
    }
    await navigator.clipboard.writeText(generatedImage)
    toast.success('Image link copied to clipboard')
  }, [generatedImage, formData.formData?.eventName])

  // No SSE streaming - using original synchronous generation

  // Mobile panel state
  const [activePanel, setActivePanel] = useState<'details' | 'style' | 'generate' | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Auto-open Details panel when template is selected on mobile
  useEffect(() => {
    if (isMobile && selectedTemplate && formData.creationMode === 'template') {
      setActivePanel('details')
    }
  }, [selectedTemplate, isMobile, formData.creationMode])

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
        // Flash 3.1 only: thinkingLevel controls quality vs speed, useImageSearch enables grounding
        ...(modelToUse.model_id === 'gemini-3.1-flash-image-preview' && { thinkingLevel, useImageSearch }),
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
        prompt_used: result.promptUsed || '', // v36.0: Store server-generated prompt for generation memory
        title: (formData.formData as any)?.eventName || (formData.formData as any)?.postHeadline || (formData.formData as any)?.title || `${selectedVertical?.name || 'Creative'}`,
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
        console.error('Failed to save creative to database:', JSON.stringify(saveError, null, 2))
        console.error('DB error code:', saveError.code, '| message:', saveError.message, '| details:', saveError.details, '| hint:', saveError.hint)
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
        prompt_used: result.promptUsed || '', // v36.0: Store server-generated prompt for generation memory
        title: (formData.formData as any)?.eventName || (formData.formData as any)?.postHeadline || (formData.formData as any)?.title || `${selectedVertical?.name || 'Creative'}`,
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

  // Model change handler — auto-resets 512px resolution when switching away from NB2
  const handleModelChange = useCallback((modelId: string) => {
    const newModel = models.find(m => m.id === modelId)
    if (newModel?.model_id !== 'gemini-3.1-flash-image-preview' &&
        formData.designData?.resolution === '512px') {
      updateResolution('1K')
    }
    selectModel(modelId)
  }, [models, selectModel, formData.designData?.resolution, updateResolution])

  // Desktop layout - Canva-style tight panels
  if (!isMobile) {
    return (
      <div className="flex flex-col h-screen bg-gradient-to-br from-muted/50 via-background to-muted/30">
        {/* Header Bar */}
        <HeaderBar
          onGenerate={handleGenerateWithDateCheck}
          isGenerating={isGenerating}
          canGenerate={isFormValid}
          hasGeneratedImage={!!generatedImage}
          verticals={verticals}
          selectedVertical={selectedVertical}
          onVerticalChange={selectVertical}
        />

        {/* Main Content — 2-panel: sidebar + canvas */}
        <div className="flex-1 flex overflow-hidden">

          {/* ── LEFT SIDEBAR: single scroll (Details → Setup) + pinned footer ── */}
          <div className="w-[420px] min-w-[420px] border-r border-border/40 bg-card/95 h-full flex flex-col shadow-lg" data-tour="details-panel">

            {/* Single scrollable area — Setup on top, Event Details below */}
            <div className="flex-1 min-h-0 overflow-y-auto">
              {panelMode === 'review' ? (
                <ReviewSummaryPanel onBackToEdit={handleBackToEdit} />
              ) : (
                <>
                  {/* Setup section — always on top */}
                  <div>
                    <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-border/40">
                      <Palette className="h-3.5 w-3.5 text-muted-foreground/50" />
                      <p className="text-[11px] font-bold tracking-widest uppercase text-muted-foreground/50">Setup</p>
                    </div>
                    <LogosStylePanel
                      embedded
                      models={models}
                      selectedModel={selectedModel}
                      onModelChange={handleModelChange}
                      isModelsLoading={isModelsLoading}
                      resolution={formData.designData?.resolution || '2K'}
                      onResolutionChange={(val) => updateResolution(val as '512px' | '1K' | '2K' | '4K')}
                      thinkingLevel={thinkingLevel}
                      onThinkingLevelChange={setThinkingLevel}
                      useImageSearch={useImageSearch}
                      onImageSearchChange={setUseImageSearch}
                    />
                  </div>

                  {/* Event Details — below setup */}
                  <div className="border-t border-border/40">
                    <div className="flex items-center gap-2 px-3.5 py-2.5">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground/50" />
                      <p className="text-[11px] font-bold tracking-widest uppercase text-muted-foreground/50">Event Details</p>
                    </div>
                    <DetailsPanel
                      embedded
                      suggestionsLoading={suggestionsLoading}
                      onRequestSuggestions={requestSuggestions}
                      onAcceptSuggestion={acceptSuggestion}
                      onDismissSuggestion={dismissSuggestion}
                      getSuggestion={getSuggestion}
                      onValidationChange={handleValidationChange}
                      organizationId={currentOrganization?.id}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Pinned footer — Review → Generate flow */}
            <div className="shrink-0 p-3.5 border-t border-border/40 bg-card/80 backdrop-blur-sm">
              {generatedImage ? (
                /* Post-generation: Download + Regen + Gallery */
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setExportModalOpen(true)}
                    className="flex-1 h-11 gap-2 text-sm font-semibold bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                  <Button
                    onClick={() => setRegenerateModalOpen(true)}
                    variant="outline"
                    className="h-11 w-11 p-0 border-border/50 hover:bg-muted/60 transition-colors rounded-xl"
                    title="Regenerate"
                  >
                    <RefreshCcw className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => router.push('/gallery')}
                    variant="outline"
                    className="h-11 w-11 p-0 border-border/50 hover:bg-muted/60 transition-colors rounded-xl"
                    title="Gallery"
                  >
                    <Images className="h-4 w-4" />
                  </Button>
                </div>
              ) : panelMode === 'review' ? (
                /* Review confirmed — Generate is now unlocked */
                <Button
                  onClick={handleGenerateWithDateCheck}
                  disabled={isGenerating}
                  className="w-full h-12 gap-2 bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 hover:from-violet-600 hover:via-purple-600 hover:to-indigo-600 text-white shadow-lg shadow-violet-500/20 hover:shadow-xl hover:shadow-violet-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                  data-tour="generate-btn"
                >
                  {isGenerating ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /><span className="font-semibold">Creating…</span></>
                  ) : (
                    <><Sparkles className="h-4 w-4" /><span className="font-semibold">Generate Now</span></>
                  )}
                </Button>
              ) : (
                /* Edit mode — Review button gates Generate */
                <div className="space-y-2">
                  <Button
                    onClick={handleReviewClick}
                    disabled={!isFormValid}
                    className={cn(
                      "w-full h-12 gap-2 text-sm font-semibold transition-all duration-200",
                      isFormValid
                        ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98]"
                        : "bg-muted text-muted-foreground cursor-not-allowed"
                    )}
                  >
                    {isFormValid ? (
                      <><Check className="h-4 w-4" /><span>Review Details</span></>
                    ) : (
                      <><FileText className="h-4 w-4" /><span>Fill required fields to continue</span></>
                    )}
                  </Button>
                  {!isFormValid && (
                    <p className="text-center text-[10px] text-muted-foreground/50">
                      Complete the event details above
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Center - Canvas Preview OR Template Browser OR Empty State */}
          <div className="flex-1 flex flex-col items-center justify-center overflow-hidden relative bg-gradient-to-br from-violet-500/[0.03] via-muted/15 to-indigo-500/[0.03]" id="preview-panel">
            {isGenerating ? (
              /* Generating — show animated canvas-shaped placeholder */
              <div className="flex flex-col items-center gap-4">
                <div
                  className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-violet-500/10 via-indigo-500/8 to-purple-500/10 border border-violet-400/30 flex flex-col items-center justify-center gap-3 shadow-2xl shadow-violet-500/15"
                  style={{
                    width: 'min(320px, 45vw)',
                    aspectRatio: `${selectedFormat?.width || 1080} / ${selectedFormat?.height || 1350}`,
                    maxHeight: 'calc(100vh - 180px)',
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-violet-500/5 to-indigo-500/10 animate-pulse" />
                  <Loader2 className="h-8 w-8 animate-spin text-violet-400 relative z-10" />
                  <p className="text-xs font-semibold text-violet-500/80 relative z-10">Generating…</p>
                </div>
                <p className="text-xs text-muted-foreground">AI is crafting your {selectedFormat?.label || 'creative'}</p>
              </div>
            ) : formData.creationMode === 'template' && !generatedImage ? (
              <div className="w-full h-full max-w-4xl">
                <TemplateBrowserPanel />
              </div>
            ) : generatedImage ? (
              /* Generated image — fills full canvas area, clickable for full-view */
              <div
                onClick={() => setPreviewModalOpen(true)}
                className="w-full h-full cursor-pointer flex items-center justify-center p-6 hover:bg-muted/10 transition-colors duration-200"
              >
                <CanvasPreview onExpandClick={() => setPreviewModalOpen(true)} />
              </div>
            ) : (
              /* Desktop empty state — Canva-style: show the actual canvas frame */
              <div className="flex flex-col items-center gap-4">
                {/* Canvas frame — correct aspect ratio, fills center visually */}
                <div
                  className={cn(
                    "relative rounded-2xl overflow-hidden flex flex-col items-center justify-center",
                    "border-2 border-dashed transition-all duration-300",
                    isFormValid
                      ? "border-emerald-400/40 bg-gradient-to-br from-emerald-500/4 via-card to-indigo-500/4 shadow-xl shadow-emerald-500/10"
                      : "border-border/40 bg-card shadow-xl shadow-black/5"
                  )}
                  style={{
                    width: 'min(340px, 42vw)',
                    aspectRatio: `${selectedFormat?.width || 1080} / ${selectedFormat?.height || 1350}`,
                    maxHeight: 'calc(100vh - 200px)',
                  }}
                >
                  {/* Subtle dot grid */}
                  <div
                    className="absolute inset-0 opacity-20"
                    style={{
                      backgroundImage: 'radial-gradient(circle, hsl(var(--muted-foreground)/0.3) 1px, transparent 1px)',
                      backgroundSize: '28px 28px',
                    }}
                  />

                  {/* Center content */}
                  <div className="relative flex flex-col items-center gap-3 text-center p-6">
                    <div className={cn(
                      "h-14 w-14 rounded-2xl flex items-center justify-center shadow-sm",
                      isFormValid
                        ? "bg-gradient-to-br from-emerald-500/15 to-teal-500/15 border border-emerald-500/20"
                        : "bg-gradient-to-br from-violet-500/10 to-indigo-500/10 border border-violet-500/15"
                    )}>
                      {isFormValid
                        ? <Sparkles className="h-6 w-6 text-emerald-500" />
                        : <Sparkles className="h-6 w-6 text-violet-400" />
                      }
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">
                        {isFormValid ? 'Ready to generate!' : 'Your creative appears here'}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                        {isFormValid
                          ? 'Click Generate → to create your design'
                          : 'Fill event details on the left to get started'}
                      </p>
                    </div>
                    {isFormValid && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                        <Check className="h-3 w-3 text-emerald-500" />
                        <span className="text-[10px] font-semibold text-emerald-600">Details ready</span>
                      </div>
                    )}
                  </div>

                  {/* Format label — bottom of canvas */}
                  <div className="absolute bottom-3 left-0 right-0 flex justify-center">
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-background/70 backdrop-blur-sm border border-border/40 shadow-sm">
                      <span className="text-[10px] font-medium text-muted-foreground/70">
                        {selectedFormat?.label || 'Event Poster'} · {selectedFormat?.width}×{selectedFormat?.height}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
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
            currentModelId={selectedModelId || (models.find(m => m.model_id === 'gemini-3.1-flash-image-preview')?.id)}
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

  // Mobile layout — mirrors desktop: single scroll (Setup → Details) + pinned footer
  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">

      {/* Slim top bar — format pill only */}
      {!generatedImage && (
        <div className="shrink-0 border-b border-border/40 bg-card/90 backdrop-blur-md px-3 py-2 shadow-sm flex items-center gap-2">
          <Palette className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
          <span className="text-[11px] font-bold tracking-widest uppercase text-muted-foreground/50 flex-1">
            {selectedFormat?.label || 'Event Poster'}
          </span>
          {panelMode === 'review' && (
            <button
              onClick={handleBackToEdit}
              className="text-[11px] text-violet-500 hover:text-violet-700 font-semibold"
            >
              ← Edit
            </button>
          )}
        </div>
      )}

      {/* Main area: form scroll OR canvas preview after generation */}
      {generatedImage ? (
        <div className="flex-1 min-h-0 relative bg-background">
          <div
            onClick={() => setPreviewModalOpen(true)}
            className="absolute inset-0 cursor-pointer active:scale-[0.98] transition-transform duration-200"
          >
            <CanvasPreview isMobile={isMobile} onExpandClick={() => setPreviewModalOpen(true)} />
          </div>
        </div>
      ) : isGenerating ? (
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500/10 to-indigo-500/10 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
          </div>
          <div className="text-center space-y-0.5">
            <p className="text-sm font-semibold text-foreground">Crafting your design…</p>
            <p className="text-xs text-muted-foreground">This takes about 30–60 seconds</p>
          </div>
        </div>
      ) : (
        /* Single scrollable panel — same order as desktop */
        <div className="flex-1 min-h-0 overflow-y-auto">
          {/* Setup on top */}
          <div>
            <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-border/40">
              <Palette className="h-3.5 w-3.5 text-muted-foreground/50" />
              <p className="text-[11px] font-bold tracking-widest uppercase text-muted-foreground/50">Setup</p>
            </div>
            <LogosStylePanel
              embedded
              models={models}
              selectedModel={selectedModel}
              onModelChange={handleModelChange}
              isModelsLoading={isModelsLoading}
              resolution={formData.designData?.resolution || '2K'}
              onResolutionChange={(val) => updateResolution(val as '512px' | '1K' | '2K' | '4K')}
              thinkingLevel={thinkingLevel}
              onThinkingLevelChange={setThinkingLevel}
              useImageSearch={useImageSearch}
              onImageSearchChange={setUseImageSearch}
            />
          </div>

          {/* Event Details below */}
          <div className="border-t border-border/40">
            <div className="flex items-center gap-2 px-3.5 py-2.5">
              <FileText className="h-3.5 w-3.5 text-muted-foreground/50" />
              <p className="text-[11px] font-bold tracking-widest uppercase text-muted-foreground/50">Event Details</p>
            </div>
            <DetailsPanel
              embedded
              suggestionsLoading={suggestionsLoading}
              onRequestSuggestions={requestSuggestions}
              onAcceptSuggestion={acceptSuggestion}
              onDismissSuggestion={dismissSuggestion}
              getSuggestion={getSuggestion}
              onValidationChange={handleValidationChange}
              organizationId={currentOrganization?.id}
            />
          </div>
        </div>
      )}

      {/* Pinned footer — Review → Generate gate (same as desktop) */}
      <div className="shrink-0 p-3 border-t border-border/40 bg-card/90 backdrop-blur-sm">
        {generatedImage ? (
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setExportModalOpen(true)}
              className="flex-1 h-11 gap-2 text-sm font-bold bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white shadow-md shadow-violet-500/25 active:scale-[0.98] transition-all rounded-xl"
            >
              <Download className="h-4 w-4 shrink-0" />
              Download
            </Button>
            <Button
              onClick={() => setRegenerateModalOpen(true)}
              variant="outline"
              className="h-11 w-11 p-0 shrink-0 border-border/50 rounded-xl hover:bg-muted/60 transition-colors"
              title="Regenerate"
            >
              <RefreshCcw className="h-4 w-4 text-muted-foreground" />
            </Button>
            <Button
              onClick={() => router.push('/gallery')}
              variant="outline"
              className="h-11 w-11 p-0 shrink-0 border-border/50 rounded-xl hover:bg-muted/60 transition-colors"
              title="Gallery"
            >
              <Images className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        ) : panelMode === 'review' ? (
          <Button
            onClick={handleGenerateWithDateCheck}
            disabled={isGenerating}
            className="w-full h-12 gap-2 bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 hover:from-violet-600 hover:via-purple-600 hover:to-indigo-600 text-white shadow-lg shadow-violet-500/20 hover:shadow-xl hover:shadow-violet-500/40 active:scale-[0.98] transition-all duration-200 text-sm font-semibold rounded-xl"
          >
            {isGenerating
              ? <><Loader2 className="h-4 w-4 animate-spin" /><span>Creating…</span></>
              : <><Sparkles className="h-4 w-4" /><span>Generate Now</span></>
            }
          </Button>
        ) : (
          <div className="space-y-1.5">
            <Button
              onClick={handleMobileReviewClick}
              disabled={!isFormValid}
              className={cn(
                "w-full h-12 gap-2 text-sm font-semibold rounded-xl transition-all duration-200",
                isFormValid
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/25 active:scale-[0.98]"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
            >
              {isFormValid
                ? <><Check className="h-4 w-4" /><span>Review Details</span></>
                : <><FileText className="h-4 w-4" /><span>Fill required fields to continue</span></>
              }
            </Button>
            {!isFormValid && (
              <p className="text-center text-[10px] text-muted-foreground/50">Complete event details above</p>
            )}
          </div>
        )}
      </div>

      {/* Spacer for fixed bottom nav */}
      <div className="shrink-0 h-14" />

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
          currentModelId={selectedModelId || (models.find(m => m.model_id === 'gemini-3.1-flash-image-preview')?.id)}
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
