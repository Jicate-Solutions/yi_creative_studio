'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Sparkles, Loader2, Check, AlertCircle, X, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import { useCreativeStore } from '@/stores/creative-store'
import { useAuthStore } from '@/stores/auth-store'
import { useSSEGeneration } from '@/hooks/use-sse-generation'
import { DynamicDetailsForm } from '@/components/create/DynamicDetailsForm'
import { mapExternalEventToForm } from '@/lib/services/external-event-mapper'
import type { ExternalEvent, ExternalEventMeta } from '@/types/external-event.types'
import type { AIModel } from '@/types/database.types'
import { cn } from '@/lib/utils'

interface InlineGenerationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  event: ExternalEvent | null
  onGenerationComplete?: (imageUrl: string) => void
  models: AIModel[]
  currentBalance: number
}

// Hook for responsive breakpoint
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)
    if (media.matches !== matches) {
      setMatches(media.matches)
    }
    const listener = () => setMatches(media.matches)
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [matches, query])

  return matches
}

export function InlineGenerationModal({
  open,
  onOpenChange,
  event,
  onGenerationComplete,
  models,
  currentBalance,
}: InlineGenerationModalProps) {
  const isMobile = useMediaQuery('(max-width: 768px)')

  // Zustand stores
  const {
    importExternalEvent,
    formData,
    updateFormData,
    selectedFormat,
    dynamicSchema,
    generateDynamicSchema,
  } = useCreativeStore()

  const { currentOrganization } = useAuthStore()

  // Generation state
  const {
    isGenerating,
    currentStage,
    progress,
    finalResult,
    error: generationError,
    startGeneration,
    reset: resetGeneration,
  } = useSSEGeneration({
    onComplete: (result) => {
      toast.success('Poster generated successfully!')
      onGenerationComplete?.(result.finalImageUrl)
      // Keep modal open to show result
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to generate poster')
    },
  })

  // Local state
  const [isInitializing, setIsInitializing] = useState(false)
  const [mappedFormatId, setMappedFormatId] = useState<string | null>(null)

  // Get primary model (cheapest)
  const primaryModel = useMemo(() => {
    return models.find(m => m.provider === 'google') || models[0]
  }, [models])

  const modelCost = primaryModel?.credits_cost ?? 0
  const canAfford = currentBalance >= modelCost

  // Initialize form data when event changes
  useEffect(() => {
    if (!open || !event) return

    const initializeForm = async () => {
      setIsInitializing(true)
      try {
        // Map external event to form data
        const mapped = mapExternalEventToForm(event)

        // Construct external event metadata
        const externalEventMeta: ExternalEventMeta = {
          id: event.id,
          source: event._sourceAppId || 'unknown',
          importedAt: new Date().toISOString(),
          mappedFields: mapped.mappedFields,
          eventName: event.name,
          eventUpdatedAt: event.updatedAt
        }

        // Import into creative store
        importExternalEvent(
          externalEventMeta,
          mapped.formData,
          mapped.mappedFields,
          mapped.dynamicFields,
          mapped.recommendedFormatId
        )

        // Store the recommended format
        setMappedFormatId(mapped.recommendedFormatId || null)

        // Generate dynamic schema if AI is available
        if (mapped.recommendedFormatId && mapped.formData.vertical && currentOrganization?.id) {
          await generateDynamicSchema(
            mapped.recommendedFormatId,
            mapped.formData.vertical as string,
            currentOrganization.id
          )
        }

        toast.success('Event data loaded', {
          description: `Format: ${mapped.formatReasoning}`,
        })
      } catch (error) {
        console.error('Failed to initialize form:', error)
        toast.error('Failed to load event data')
      } finally {
        setIsInitializing(false)
      }
    }

    initializeForm()
  }, [open, event, importExternalEvent, generateDynamicSchema, currentOrganization])

  // Handle form field changes
  const handleFormChange = useCallback((fieldId: string, value: unknown) => {
    updateFormData({ [fieldId]: value })
  }, [updateFormData])

  // Handle generation
  const handleGenerate = useCallback(async () => {
    if (!canAfford || !primaryModel || !selectedFormat) {
      toast.error('Cannot generate poster')
      return
    }

    try {
      await startGeneration({
        formData: formData.formData,
        model: primaryModel.model_id,
        provider: primaryModel.provider,
        organizationId: currentOrganization?.id,
      })
    } catch (error) {
      console.error('Generation failed:', error)
    }
  }, [canAfford, primaryModel, selectedFormat, formData, startGeneration, currentOrganization])

  // Handle close
  const handleClose = useCallback(() => {
    if (!isGenerating) {
      resetGeneration()
      onOpenChange(false)
    }
  }, [isGenerating, resetGeneration, onOpenChange])

  // Get stage display name
  const getStageDisplayName = (stage: string | null) => {
    const stageNames: Record<string, string> = {
      design_intelligence: 'Analyzing design...',
      prompt_building: 'Building prompt...',
      image_generation: 'Generating image...',
      logo_overlay: 'Adding logos...',
      upload: 'Uploading...',
    }
    return stage ? stageNames[stage] || 'Processing...' : 'Initializing...'
  }

  // Render content (shared between Dialog and Drawer)
  const content = (
    <div className="space-y-4 overflow-y-auto max-h-[70vh] px-1">
      {/* Event Info Badge */}
      {event && (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            <Sparkles className="w-3 h-3 mr-1" />
            {event.name}
          </Badge>
          {mappedFormatId && (
            <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
              {selectedFormat?.label || 'Event Poster'}
            </Badge>
          )}
        </div>
      )}

      {/* Loading State */}
      {isInitializing && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">Loading event data...</span>
        </div>
      )}

      {/* Generation Progress */}
      {isGenerating && (
        <div className="space-y-3 py-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{getStageDisplayName(currentStage)}</span>
            <span className="font-medium text-primary">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* Generation Error */}
      {generationError && !isGenerating && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{generationError.message}</AlertDescription>
        </Alert>
      )}

      {/* Generation Result */}
      {finalResult && !isGenerating && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-green-600">
            <Check className="h-4 w-4" />
            <span className="font-medium">Poster generated successfully!</span>
          </div>
          <div className="relative rounded-lg overflow-hidden border bg-muted/30">
            <img
              src={finalResult.finalImageUrl}
              alt="Generated poster"
              className="w-full h-auto"
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => window.open(finalResult.finalImageUrl, '_blank')}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              View Full Size
            </Button>
            <Button
              onClick={handleClose}
              size="sm"
              className="flex-1"
            >
              Done
            </Button>
          </div>
        </div>
      )}

      {/* Form */}
      {!isInitializing && !isGenerating && !finalResult && selectedFormat && (
        <>
          <DynamicDetailsForm
            formatId={selectedFormat.id}
            verticalName={formData.formData?.vertical as string | undefined}
            formData={formData.formData || {}}
            onFormChange={handleFormChange}
            useSections={true}
            dynamicSchema={dynamicSchema.schema}
            isDynamicSchemaLoading={dynamicSchema.isLoading}
            dynamicSchemaError={dynamicSchema.error}
            organizationId={currentOrganization?.id}
          />

          {/* Credit Info & Generate Button */}
          <div className="space-y-3 pt-4 border-t">
            <div className={cn(
              'flex items-center justify-between p-3 rounded-lg border text-sm',
              canAfford
                ? 'bg-muted/30 border-muted'
                : 'bg-destructive/10 border-destructive/30'
            )}>
              <span>Cost: <strong>{modelCost}</strong> credits</span>
              <Badge variant={canAfford ? 'secondary' : 'destructive'}>
                Balance: {currentBalance}
              </Badge>
            </div>

            {!canAfford && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Insufficient credits. Please purchase more credits to generate.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1"
                disabled={isGenerating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleGenerate}
                className="flex-1 gradient-yi"
                disabled={!canAfford || isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Poster
                  </>
                )}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )

  // Render as Drawer on mobile, Dialog on desktop
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleClose}>
        <DrawerContent className="h-[90vh] px-4">
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Generate Poster
            </DrawerTitle>
            <DrawerDescription>
              Create a promotional poster from this event
            </DrawerDescription>
          </DrawerHeader>
          {content}
        </DrawerContent>
      </Drawer>
    )
  }

  // Desktop: Dialog
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Generate Poster
          </DialogTitle>
          <DialogDescription>
            Create a promotional poster from this event
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  )
}
