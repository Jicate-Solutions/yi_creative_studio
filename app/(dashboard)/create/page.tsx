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
} from 'lucide-react'
import { LogoPositionGrid } from '@/components/create/logo-position-grid'
import {
  AISuggestionField,
  AISuggestionActions,
  AITriggerButton,
} from '@/components/create/ai-suggestion-field'
import { TemplateSelector } from '@/components/create/template-selector'
import { ExportModal } from '@/components/export'
import { ROUTES } from '@/lib/config/constants'

export default function CreatePage() {
  const router = useRouter()
  const supabase = createClient()
  const { currentOrganization } = useAuthStore()

  const { verticals, selectedVertical, selectVertical } = useVerticals()
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
  } = useCreativeStore()

  const [step, setStep] = useState(1)
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [creativeId, setCreativeId] = useState<string | null>(null)

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

      // Replace template variables with form data
      Object.entries(formData.formData).forEach(([key, value]) => {
        prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), String(value))
      })

      // Call generation API
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Creative</h1>
          <p className="text-muted-foreground">
            Generate AI-powered brand creatives in a few simple steps
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="gap-2">
            <Coins className="h-4 w-4 text-yellow-500" />
            {balance.toLocaleString()} credits
          </Badge>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3, 4, 5].map((s) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                step >= s
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {step > s ? <Check className="h-4 w-4" /> : s}
            </div>
            {s < 5 && (
              <div
                className={`w-10 h-0.5 ${
                  step > s ? 'bg-primary' : 'bg-muted'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="max-w-4xl mx-auto">
        {/* Step 1: Select Vertical */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Step 1: Select Vertical</CardTitle>
              <CardDescription>
                Choose the Yi initiative category for your creative
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {verticals.map((vertical) => (
                  <button
                    key={vertical.id}
                    onClick={() => selectVertical(vertical.id)}
                    className={`p-4 rounded-lg border-2 text-left transition-all hover:border-primary ${
                      selectedVertical?.id === vertical.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border'
                    }`}
                  >
                    <div className="text-2xl mb-2">{vertical.icon}</div>
                    <div className="font-medium">{vertical.name}</div>
                    <div className="text-xs text-muted-foreground line-clamp-2">
                      {vertical.description}
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex justify-end mt-6">
                <Button
                  onClick={() => setStep(2)}
                  disabled={!selectedVertical}
                >
                  Continue
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Choose Template */}
        {step === 2 && selectedVertical && (
          <TemplateSelector
            verticalId={selectedVertical.id}
            verticalName={selectedVertical.name}
            onSelect={selectTemplate}
            onBack={() => setStep(1)}
            onContinue={() => setStep(3)}
            selectedTemplate={selectedTemplate}
          />
        )}

        {/* Step 3: Fill Details */}
        {step === 3 && selectedVertical && (
          <Card>
            <CardHeader>
              <CardTitle>Step 3: Event Details</CardTitle>
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
                  <AITriggerButton
                    onClick={handleRequestSuggestions}
                    isLoading={isSuggestionsLoading}
                    disabled={((formData.formData as { title?: string }).title || '').length < 5}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter a descriptive title, then click the magic wand to get AI suggestions for other fields
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

              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => setStep(2)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button onClick={() => setStep(4)}>
                  Continue
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Logo Placement & AI Model */}
        {step === 4 && (
          <div className="space-y-6">
            {/* Logo Placement */}
            <Card>
              <CardHeader>
                <CardTitle>Step 4: Logo Placement</CardTitle>
                <CardDescription>
                  Select and position your logos on the creative
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LogoPositionGrid />
              </CardContent>
            </Card>

            {/* AI Model Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Select AI Model</CardTitle>
                <CardDescription>
                  Choose the AI model for generation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={selectedModel?.id || ''}
                  onValueChange={(value) => selectModel(value)}
                >
                  {models.map((model) => (
                    <div
                      key={model.id}
                      className={`flex items-center justify-between p-4 rounded-lg border-2 transition-colors ${
                        selectedModel?.id === model.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border'
                      }`}
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
                            <Badge variant="secondary" className="mt-1 text-xs">
                              Best for: {model.best_for}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold flex items-center gap-1">
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

                <div className="flex justify-between mt-6">
                  <Button variant="outline" onClick={() => setStep(3)}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    onClick={handleGenerate}
                    disabled={!canGenerate || isGenerating}
                    className="gradient-yi"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate ({creditCost} credits)
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 5: Result */}
        {step === 5 && (
          <Card>
            <CardHeader>
              <CardTitle>Your Creative is Ready!</CardTitle>
              <CardDescription>
                Download or regenerate your creative
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {generatedImage ? (
                <div className="relative aspect-[4/5] max-w-md mx-auto rounded-lg overflow-hidden border shadow-lg">
                  <img
                    src={generatedImage}
                    alt="Generated creative"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : generationError ? (
                <div className="text-center py-12">
                  <p className="text-destructive mb-4">{generationError}</p>
                </div>
              ) : null}

              <div className="flex flex-col sm:flex-row justify-center gap-4">
                {generatedImage && (
                  <Button
                    size="lg"
                    onClick={() => setExportModalOpen(true)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Regenerate
                </Button>
                <Button variant="ghost" size="lg" onClick={handleStartOver}>
                  Start Over
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

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
  )
}
