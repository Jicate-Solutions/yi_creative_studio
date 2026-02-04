'use client'

import { useCreativeStore } from '@/stores/creative-store'
import { useVerticals } from '@/hooks'
import { Button } from '@/components/ui/button'
import { FormatDropdown } from './FormatDropdown'
import { Sparkles, Loader2, Wand2, Image, Info } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { AIModel } from '@/types/database.types'

// Helper function for model display names
const getModelDisplayName = (slug: string) => {
  const names: Record<string, string> = {
    'ideogram': 'Smart Design',
    'google': 'Creative Poster',
  }
  return names[slug] || slug
}

interface HeaderBarProps {
  onGenerate: () => void
  isGenerating: boolean
  models: AIModel[]
  selectedModel: AIModel | null
  onModelChange: (modelId: string) => void
  isModelsLoading: boolean
  canGenerate?: boolean // True when in review mode and form is valid
}

export function HeaderBar({
  onGenerate,
  isGenerating,
  models,
  selectedModel,
  onModelChange,
  isModelsLoading,
  canGenerate = true, // Default to true for backward compatibility
}: HeaderBarProps) {
  const { verticals } = useVerticals()
  const {
    selectedFormat,
    formData,
    selectedVertical,
    selectVertical,
    setCreationMode,
  } = useCreativeStore()

  const updateResolution = useCreativeStore((state) => state.updateResolution)
  const resolution = formData.designData?.resolution || '2K'
  const creationMode = formData.creationMode || 'scratch'

  const handleResolutionChange = (value: string) => {
    updateResolution(value as '1K' | '2K' | '4K')
  }

  return (
    <TooltipProvider>
      <header className="border-b bg-card px-3 py-2 flex items-center justify-between gap-2">
        {/* Left: Format & Mode */}
        <div className="flex items-center gap-2">
          <FormatDropdown />

          {/* Creation Mode Toggle - Enhanced visibility */}
          <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg border">
            <button
              onClick={() => setCreationMode('template')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                creationMode === 'template'
                  ? "bg-white shadow-sm text-primary border border-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/50"
              )}
            >
              <Image className="h-4 w-4" />
              <span>Template</span>
            </button>
            <button
              onClick={() => setCreationMode('scratch')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                creationMode === 'scratch'
                  ? "bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/50"
              )}
            >
              <Wand2 className="h-4 w-4" />
              <span>AI Create</span>
            </button>
          </div>

          {/* Vertical - Compact */}
          <Select
            value={selectedVertical?.id || ''}
            onValueChange={(id) => selectVertical(id)}
          >
            <SelectTrigger className="w-[100px] h-8 text-xs">
              <SelectValue placeholder="Vertical" />
            </SelectTrigger>
            <SelectContent>
              {verticals.map((v) => (
                <SelectItem key={v.id} value={v.id} className="text-xs">
                  {v.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* AI Model Selector */}
          {isModelsLoading ? (
            <Skeleton className="h-8 w-[140px]" />
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative">
                  <Select value={selectedModel?.id || ''} onValueChange={onModelChange}>
                    <SelectTrigger className="w-[140px] h-8 text-xs pr-7">
                      <SelectValue placeholder="AI Model" />
                    </SelectTrigger>
                    <SelectContent>
                      {models.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          <div className="flex items-center justify-between w-full gap-2">
                            <span className="text-xs">
                              {getModelDisplayName(model.slug)}
                            </span>
                            <Badge variant="secondary" className="text-[10px] px-1 py-0">
                              {model.credits_cost}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Info className="h-3 w-3 text-primary absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs max-w-[200px]">
                  Choose the AI model for generation. Each model has different strengths.
                </p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Resolution - Minimal */}
          <Select value={resolution} onValueChange={handleResolutionChange}>
            <SelectTrigger className="w-[75px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1K" className="text-xs">1K</SelectItem>
              <SelectItem value="2K" className="text-xs">2K</SelectItem>
              <SelectItem value="4K" className="text-xs">4K</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Right: Actions - Compact */}
        <div className="flex items-center gap-1.5">
          <Button
            onClick={onGenerate}
            disabled={isGenerating || !selectedFormat || !canGenerate}
            className="h-9 gap-2 px-5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title={!canGenerate ? 'Review your details first' : undefined}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="font-medium">Creating...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span className="font-medium">Generate</span>
              </>
            )}
          </Button>
        </div>
      </header>
    </TooltipProvider>
  )
}
