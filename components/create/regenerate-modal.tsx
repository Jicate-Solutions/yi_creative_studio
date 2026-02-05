'use client'

import { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { RefreshCcw, Coins, Loader2, Sparkles, Palette, Settings2 } from 'lucide-react'
import type { AIModel } from '@/types/database.types'
import type { ResolutionId } from '@/lib/config/design-constants'
import { THEMES, POSTER_STYLES, RESOLUTIONS } from '@/lib/config/design-constants'
import { cn } from '@/lib/utils'

export interface RegenerateOptions {
  modelId: string
  theme?: string
  style?: string
  resolution?: ResolutionId
}

interface RegenerateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentModelId: string | undefined
  currentTheme?: string
  currentStyle?: string
  currentResolution?: ResolutionId
  creationMode: 'scratch' | 'template'
  models: AIModel[]
  onRegenerate: (options: RegenerateOptions) => void
  isRegenerating: boolean
  currentBalance: number
}

// Display-friendly names for AI models - Stylish labels for UI
const getModelDisplayName = (model: AIModel) => {
  const displayNames: Record<string, string> = {
    'ideogram': 'Design Forge',
    'google': 'Vision Studio',
    'gemini': 'Vision Studio',
    'gemini-3-pro-image-preview': 'Vision Pro',
  }
  // Check slug first, then provider, then fallback to name
  return displayNames[model.slug] || displayNames[model.provider] || model.name
}

// Subset of popular themes for quick selection
const QUICK_THEMES = [
  'ai', 'corporate', 'modern', 'bold', 'elegant', 'festive', 'futuristic', 'minimalist'
]

// Subset of popular styles for quick selection
const QUICK_STYLES = [
  'gradient', 'flat', 'glass', 'geometric', 'neon-glow', 'photographic', 'illustration', 'typography'
]

export function RegenerateModal({
  open,
  onOpenChange,
  currentModelId,
  currentTheme,
  currentStyle,
  currentResolution,
  creationMode,
  models,
  onRegenerate,
  isRegenerating,
  currentBalance,
}: RegenerateModalProps) {
  const [selectedModelId, setSelectedModelId] = useState(currentModelId || '')
  const [selectedTheme, setSelectedTheme] = useState(currentTheme || '')
  const [selectedStyle, setSelectedStyle] = useState(currentStyle || '')
  const [selectedResolution, setSelectedResolution] = useState<ResolutionId>(currentResolution || '1K')

  // Reset state when modal opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setSelectedModelId(currentModelId || models[0]?.id || '')
      setSelectedTheme(currentTheme || '')
      setSelectedStyle(currentStyle || '')
      setSelectedResolution(currentResolution || '1K')
    }
    onOpenChange(isOpen)
  }

  const selectedModel = useMemo(() =>
    models.find(m => m.id === selectedModelId),
    [models, selectedModelId]
  )

  const modelCost = selectedModel?.credits_cost ?? 0
  const canAfford = currentBalance >= modelCost

  // Get theme and style details
  const getThemeLabel = (value: string) =>
    THEMES.find(t => t.value === value)?.label || value

  const getStyleLabel = (value: string) =>
    POSTER_STYLES.find(s => s.value === value)?.label || value

  const handleRegenerate = () => {
    if (!selectedModelId || !canAfford) return

    onRegenerate({
      modelId: selectedModelId,
      theme: creationMode === 'scratch' ? selectedTheme : undefined,
      style: creationMode === 'scratch' ? selectedStyle : undefined,
      resolution: creationMode === 'scratch' ? selectedResolution : undefined,
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCcw className="h-5 w-5 text-primary" />
            Regenerate Creative
          </DialogTitle>
          <DialogDescription>
            Choose a different AI model or adjust settings to regenerate
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Model Selector */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              AI Model
            </Label>
            <Select value={selectedModelId} onValueChange={setSelectedModelId}>
              <SelectTrigger>
                <SelectValue placeholder="Select AI model" />
              </SelectTrigger>
              <SelectContent>
                {models.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    <div className="flex items-center justify-between w-full gap-3">
                      <span>{getModelDisplayName(model)}</span>
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {model.credits_cost} credits
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedModel?.description && (
              <p className="text-xs text-muted-foreground">
                {selectedModel.description}
              </p>
            )}
          </div>

          {/* Advanced Settings (scratch mode only) */}
          {creationMode === 'scratch' && (
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="advanced" className="border rounded-lg px-3">
                <AccordionTrigger className="hover:no-underline py-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Settings2 className="h-4 w-4" />
                    Advanced Settings
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pb-4">
                  {/* Theme Quick Picker */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <Palette className="h-3 w-3" />
                      Theme
                    </Label>
                    <div className="flex flex-wrap gap-1.5">
                      {QUICK_THEMES.map((themeValue) => {
                        const theme = THEMES.find(t => t.value === themeValue)
                        if (!theme) return null
                        return (
                          <button
                            key={theme.value}
                            type="button"
                            onClick={() => setSelectedTheme(
                              selectedTheme === theme.value ? '' : theme.value
                            )}
                            className={cn(
                              'px-2.5 py-1 text-xs rounded-full border transition-colors',
                              selectedTheme === theme.value
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-muted/50 hover:bg-muted border-transparent'
                            )}
                          >
                            {theme.label}
                          </button>
                        )
                      })}
                    </div>
                    {selectedTheme && (
                      <p className="text-xs text-muted-foreground">
                        Selected: {getThemeLabel(selectedTheme)}
                      </p>
                    )}
                  </div>

                  {/* Style Quick Picker */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      Visual Style
                    </Label>
                    <div className="flex flex-wrap gap-1.5">
                      {QUICK_STYLES.map((styleValue) => {
                        const style = POSTER_STYLES.find(s => s.value === styleValue)
                        if (!style) return null
                        return (
                          <button
                            key={style.value}
                            type="button"
                            onClick={() => setSelectedStyle(
                              selectedStyle === style.value ? '' : style.value
                            )}
                            className={cn(
                              'px-2.5 py-1 text-xs rounded-full border transition-colors',
                              selectedStyle === style.value
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-muted/50 hover:bg-muted border-transparent'
                            )}
                          >
                            {style.label}
                          </button>
                        )
                      })}
                    </div>
                    {selectedStyle && (
                      <p className="text-xs text-muted-foreground">
                        Selected: {getStyleLabel(selectedStyle)}
                      </p>
                    )}
                  </div>

                  {/* Resolution Radio */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Resolution</Label>
                    <RadioGroup
                      value={selectedResolution}
                      onValueChange={(value) => setSelectedResolution(value as ResolutionId)}
                      className="flex gap-3"
                    >
                      {(Object.keys(RESOLUTIONS) as ResolutionId[]).map((resId) => {
                        const res = RESOLUTIONS[resId]
                        return (
                          <div key={resId} className="flex items-center space-x-2">
                            <RadioGroupItem value={resId} id={`res-${resId}`} />
                            <Label
                              htmlFor={`res-${resId}`}
                              className="text-xs font-normal cursor-pointer"
                            >
                              {res.label}
                            </Label>
                          </div>
                        )
                      })}
                    </RadioGroup>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}

          {/* Credit Info */}
          <div className={cn(
            'flex items-center justify-between p-3 rounded-lg border',
            canAfford
              ? 'bg-muted/30 border-muted'
              : 'bg-destructive/10 border-destructive/30'
          )}>
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-amber-500" />
              <span className="text-sm">
                Cost: <strong>{modelCost}</strong> credits
              </span>
            </div>
            <Badge
              variant={canAfford ? 'secondary' : 'destructive'}
              className="gap-1"
            >
              Balance: {currentBalance}
            </Badge>
          </div>

          {!canAfford && (
            <p className="text-xs text-destructive text-center">
              Insufficient credits. Please purchase more credits to regenerate.
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isRegenerating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleRegenerate}
            disabled={!canAfford || isRegenerating || !selectedModelId}
            className="gap-2"
          >
            {isRegenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Regenerating...
              </>
            ) : (
              <>
                <RefreshCcw className="h-4 w-4" />
                Regenerate
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
