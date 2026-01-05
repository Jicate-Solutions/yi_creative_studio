'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { useOrganization } from '@/hooks/use-organization'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import {
  Layers,
  Plus,
  Trash2,
  Play,
  Pause,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  AlertTriangle,
  Sparkles,
} from 'lucide-react'
import type { Template, VerticalPreset, AIModel } from '@/types/database.types'

interface BulkItem {
  id: string
  title: string
  variations: Record<string, string>
  status: 'pending' | 'processing' | 'completed' | 'failed'
  resultUrl?: string
  error?: string
}

export default function BulkGenerationPage() {
  const supabase = useMemo(() => createClient(), [])
  const { currentOrganization, user } = useAuthStore()
  const { creditsBalance, canAfford } = useOrganization()

  const [templates, setTemplates] = useState<Template[]>([])
  const [verticals, setVerticals] = useState<VerticalPreset[]>([])
  const [aiModels, setAIModels] = useState<AIModel[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Form state
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [selectedVertical, setSelectedVertical] = useState<string>('')
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [bulkItems, setBulkItems] = useState<BulkItem[]>([
    { id: '1', title: '', variations: {}, status: 'pending' },
  ])

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [completedCount, setCompletedCount] = useState(0)
  const [failedCount, setFailedCount] = useState(0)

  // Load data
  useEffect(() => {
    const loadData = async () => {
      if (!currentOrganization?.id) return

      const [templatesRes, verticalsRes, modelsRes] = await Promise.all([
        supabase
          .from('templates')
          .select('*')
          .or(`organization_id.eq.${currentOrganization.id},is_public.eq.true`)
          .order('name'),
        supabase
          .from('vertical_presets')
          .select('*')
          .eq('is_active', true)
          .order('display_order'),
        supabase
          .from('ai_models')
          .select('*')
          .eq('is_active', true)
          .order('display_order'),
      ])

      setTemplates(templatesRes.data || [])
      setVerticals(verticalsRes.data || [])
      setAIModels(modelsRes.data || [])
      setIsLoading(false)

      // Set default AI model
      if (modelsRes.data && modelsRes.data.length > 0) {
        setSelectedModel(modelsRes.data[0].id)
      }
    }

    loadData()
  }, [currentOrganization?.id, supabase])

  const selectedModelData = aiModels.find((m) => m.id === selectedModel)
  const totalCreditsNeeded = (selectedModelData?.credits_cost || 1) * bulkItems.length
  const canGenerate = canAfford(totalCreditsNeeded) && bulkItems.length > 0

  const addItem = () => {
    setBulkItems((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        title: '',
        variations: {},
        status: 'pending',
      },
    ])
  }

  const removeItem = (id: string) => {
    if (bulkItems.length <= 1) {
      toast.error('At least one item is required')
      return
    }
    setBulkItems((prev) => prev.filter((item) => item.id !== id))
  }

  const updateItem = (id: string, field: string, value: string) => {
    setBulkItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? field === 'title'
            ? { ...item, title: value }
            : { ...item, variations: { ...item.variations, [field]: value } }
          : item
      )
    )
  }

  const generateAll = async () => {
    if (!currentOrganization?.id || !user?.id || !selectedModel) {
      toast.error('Please configure all required settings')
      return
    }

    if (!canGenerate) {
      toast.error('Insufficient credits for bulk generation')
      return
    }

    setIsGenerating(true)
    setProgress(0)
    setCompletedCount(0)
    setFailedCount(0)

    // Reset all items to pending
    setBulkItems((prev) =>
      prev.map((item) => ({
        ...item,
        status: 'pending',
        resultUrl: undefined,
        error: undefined,
      }))
    )

    const total = bulkItems.length

    for (let i = 0; i < bulkItems.length; i++) {
      const item = bulkItems[i]

      // Update status to processing
      setBulkItems((prev) =>
        prev.map((it) =>
          it.id === item.id ? { ...it, status: 'processing' } : it
        )
      )

      try {
        // Build form data with variations
        const template = templates.find((t) => t.id === selectedTemplate)
        const baseFormData = (template?.form_data || {}) as Record<string, unknown>
        const formData = {
          ...baseFormData,
          ...item.variations,
          title: item.title || baseFormData.title,
        }

        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            organizationId: currentOrganization.id,
            userId: user.id,
            verticalSlug: selectedVertical || template?.vertical,
            aiModelId: selectedModel,
            creativeType: template?.category || 'event_poster',
            formData,
            logoConfig: template?.logo_config || [],
          }),
        })

        if (!response.ok) {
          throw new Error('Generation failed')
        }

        const result = await response.json()

        setBulkItems((prev) =>
          prev.map((it) =>
            it.id === item.id
              ? { ...it, status: 'completed', resultUrl: result.imageUrl }
              : it
          )
        )
        setCompletedCount((prev) => prev + 1)
      } catch (error) {
        setBulkItems((prev) =>
          prev.map((it) =>
            it.id === item.id
              ? { ...it, status: 'failed', error: 'Generation failed' }
              : it
          )
        )
        setFailedCount((prev) => prev + 1)
      }

      setProgress(((i + 1) / total) * 100)

      // Small delay between generations to avoid rate limiting
      if (i < bulkItems.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }

    setIsGenerating(false)
    toast.success(
      `Bulk generation complete: ${completedCount + 1} succeeded, ${failedCount} failed`
    )
  }

  const getStatusIcon = (status: BulkItem['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-muted-foreground" />
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-primary" />
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-destructive" />
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Layers className="h-6 w-6 sm:h-8 sm:w-8" />
            Bulk Generation
          </h1>
          <p className="text-muted-foreground">
            Generate multiple creatives at once with variations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-base sm:text-lg px-2 py-1 sm:px-3">
            {creditsBalance} credits
          </Badge>
        </div>
      </div>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
          <CardDescription>
            Select a template and AI model for bulk generation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Template (Optional)</Label>
              <Select
                value={selectedTemplate || '__none__'}
                onValueChange={(value) => setSelectedTemplate(value === '__none__' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No template</SelectItem>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Vertical</Label>
              <Select value={selectedVertical} onValueChange={setSelectedVertical}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a vertical" />
                </SelectTrigger>
                <SelectContent>
                  {verticals.map((vertical) => (
                    <SelectItem key={vertical.id} value={vertical.slug}>
                      {vertical.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>AI Model</Label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select AI model" />
                </SelectTrigger>
                <SelectContent>
                  {aiModels.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name} ({model.credits_cost} credits)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items List */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Generation Items</CardTitle>
            <CardDescription>
              Add items with different titles/variations
            </CardDescription>
          </div>
          <Button onClick={addItem} disabled={isGenerating} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {bulkItems.map((item, index) => (
            <div
              key={item.id}
              className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg"
            >
              <div className="flex items-center gap-2 w-full sm:w-auto sm:min-w-[80px]">
                <span className="text-sm font-medium text-muted-foreground">
                  #{index + 1}
                </span>
                {getStatusIcon(item.status)}
              </div>

              <div className="flex-1 w-full space-y-2">
                <Input
                  placeholder="Title / Headline"
                  value={item.title}
                  onChange={(e) => updateItem(item.id, 'title', e.target.value)}
                  disabled={isGenerating}
                />
                <div className="grid gap-2 md:grid-cols-2">
                  <Input
                    placeholder="Event Date (variation)"
                    value={item.variations.eventDate || ''}
                    onChange={(e) => updateItem(item.id, 'eventDate', e.target.value)}
                    disabled={isGenerating}
                  />
                  <Input
                    placeholder="Location (variation)"
                    value={item.variations.location || ''}
                    onChange={(e) => updateItem(item.id, 'location', e.target.value)}
                    disabled={isGenerating}
                  />
                </div>
              </div>

              {item.resultUrl && (
                <div className="w-16 h-16 rounded overflow-hidden border">
                  <img
                    src={item.resultUrl}
                    alt={`Result ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeItem(item.id)}
                disabled={isGenerating || bulkItems.length <= 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Progress and Actions */}
      <Card>
        <CardContent className="pt-6">
          {isGenerating && (
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} />
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  {completedCount} completed
                </span>
                <span className="flex items-center gap-1">
                  <XCircle className="h-4 w-4 text-destructive" />
                  {failedCount} failed
                </span>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">
                Total Cost: {totalCreditsNeeded} credits
              </p>
              {!canGenerate && bulkItems.length > 0 && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  Insufficient credits
                </p>
              )}
            </div>

            <Button
              size="lg"
              onClick={generateAll}
              disabled={isGenerating || !canGenerate || !selectedModel}
              className="gap-2 w-full sm:w-auto"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate All ({bulkItems.length} items)
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
