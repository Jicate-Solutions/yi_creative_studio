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
import { Label } from '@/components/ui/label'
import { RefreshCcw, Coins, Loader2, Sparkles } from 'lucide-react'
import type { AIModel } from '@/types/database.types'
import { cn } from '@/lib/utils'

export interface RegenerateOptions {
  modelId: string
}

interface RegenerateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentModelId: string | undefined
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

export function RegenerateModal({
  open,
  onOpenChange,
  currentModelId,
  models,
  onRegenerate,
  isRegenerating,
  currentBalance,
}: RegenerateModalProps) {
  const [selectedModelId, setSelectedModelId] = useState(currentModelId || '')

  // Reset state when modal opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setSelectedModelId(currentModelId || models[0]?.id || '')
    }
    onOpenChange(isOpen)
  }

  const selectedModel = useMemo(() =>
    models.find(m => m.id === selectedModelId),
    [models, selectedModelId]
  )

  const modelCost = selectedModel?.credits_cost ?? 0
  const canAfford = currentBalance >= modelCost

  const handleRegenerate = () => {
    if (!selectedModelId || !canAfford) return
    onRegenerate({ modelId: selectedModelId })
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
