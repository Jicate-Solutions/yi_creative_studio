'use client'

import { useCreativeStore } from '@/stores/creative-store'
import { useVerticals } from '@/hooks'
import { Button } from '@/components/ui/button'
import { FormatDropdown } from './FormatDropdown'
import { Sparkles, Loader2, Wand2, Image, Info, LayoutGrid, FileText, Palette, Building2, Globe } from 'lucide-react'
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { CREATIVE_FORMATS, type CreativeFormatId } from '@/lib/config/creative-formats'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { AIModel } from '@/types/database.types'

// Helper function for model display names - Stylish labels for UI
const getModelDisplayName = (slug: string) => {
  const names: Record<string, string> = {
    'ideogram': 'Design Forge',
    'google': 'Vision Studio',
    'gemini': 'Vision Studio',
    'nano-banana-2': 'Vision 2',
    'gemini-3-pro-image-preview': 'Vision Pro',
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
  hasGeneratedImage?: boolean // Hide button when image exists
  // Mobile dropdown props
  verticals?: Array<{ id: string; name: string; slug: string }>
  selectedVertical?: { id: string; name: string; slug: string } | null
  onVerticalChange?: (id: string) => void
  resolution?: string
  onResolutionChange?: (value: string) => void
  // Mobile panel control (Bar 3)
  activePanel?: 'details' | 'style' | 'generate' | null
  onPanelChange?: (panel: 'details' | 'style' | 'generate' | null) => void
  // Flash 3.1 (Nano Banana 2) thinking level
  thinkingLevel?: 'minimal' | 'High'
  onThinkingLevelChange?: (level: 'minimal' | 'High') => void
  // Flash 3.1 (Nano Banana 2) image search toggle
  useImageSearch?: boolean
  onImageSearchChange?: (value: boolean) => void
}

export function HeaderBar({
  onGenerate,
  isGenerating,
  models,
  selectedModel,
  onModelChange,
  isModelsLoading,
  canGenerate = true, // Default to true for backward compatibility
  hasGeneratedImage = false,
  // Mobile dropdown props
  verticals: propVerticals,
  selectedVertical: propSelectedVertical,
  onVerticalChange,
  resolution: propResolution,
  onResolutionChange,
  // Mobile panel control (Bar 3)
  activePanel,
  onPanelChange,
  // Flash 3.1 thinking level
  thinkingLevel = 'minimal',
  onThinkingLevelChange,
  // Flash 3.1 image search toggle
  useImageSearch = true,
  onImageSearchChange,
}: HeaderBarProps) {

  // Flash 3.1 model check — show Quality/Speed toggle only for Nano Banana 2
  const isFlash31 = selectedModel?.model_id === 'gemini-3.1-flash-image-preview'
  // Use hook verticals as fallback if props not provided
  const { verticals: hookVerticals } = useVerticals()
  const verticals = propVerticals || hookVerticals
  const {
    selectedFormat,
    selectFormat,
    formData,
    selectedVertical: storeSelectedVertical,
    selectVertical: storeSelectVertical,
    setCreationMode,
  } = useCreativeStore()

  // Use prop-based vertical if provided, otherwise fall back to store
  const currentSelectedVertical = propSelectedVertical || storeSelectedVertical
  const handleVerticalChange = onVerticalChange || storeSelectVertical

  const updateResolution = useCreativeStore((state) => state.updateResolution)
  const storeResolution = formData.designData?.resolution || '2K'
  const resolution = propResolution || storeResolution
  const creationMode = formData.creationMode || 'scratch'

  const handleResolutionChange = (value: string) => {
    if (onResolutionChange) {
      onResolutionChange(value)
    } else {
      updateResolution(value as '1K' | '2K' | '4K')
    }
  }

  return (
    <TooltipProvider>
      <header className="border-b bg-card px-3 py-1.5">
        {/* Mobile Layout: Two bars (Improved UX) */}
        <div className="flex flex-col gap-1.5 md:hidden">
          {/* Bar 1: Format, Vertical, Mode toggle - with STACKED LABELS */}
          <div className="flex items-center justify-between gap-2">
            {/* Format Popover - Stacked: Label on top, Value below */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-10 px-2.5 gap-1.5 border border-primary/20 bg-primary/5 hover:bg-primary/10">
                  <LayoutGrid className="h-4 w-4 text-primary shrink-0" />
                  <div className="flex flex-col items-start min-w-0">
                    <span className="text-[9px] text-muted-foreground leading-none">Type</span>
                    <span className="text-xs font-medium leading-tight truncate max-w-[70px]">
                      {selectedFormat?.label || 'Select'}
                    </span>
                  </div>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-2" align="start">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground px-1">Select Format</p>
                  <div className="max-h-[300px] overflow-y-auto space-y-0.5">
                    {Object.values(CREATIVE_FORMATS).slice(0, 12).map((format) => (
                      <button
                        key={format.id}
                        onClick={() => selectFormat(format.id)}
                        className={cn(
                          'w-full text-left px-2 py-1.5 rounded-md text-xs hover:bg-muted transition-colors',
                          selectedFormat?.id === format.id && 'bg-primary/10 text-primary'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{format.label}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {format.width}x{format.height}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Vertical Popover - Stacked: Label on top, Value below */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-10 px-2.5 gap-1.5 border border-primary/20 bg-primary/5 hover:bg-primary/10">
                  <Building2 className="h-4 w-4 text-primary shrink-0" />
                  <div className="flex flex-col items-start min-w-0">
                    <span className="text-[9px] text-muted-foreground leading-none">Vertical</span>
                    <span className="text-xs font-medium leading-tight truncate max-w-[70px]">
                      {currentSelectedVertical?.name || 'Select'}
                    </span>
                  </div>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2" align="center">
                <div className="space-y-1">
                  {verticals.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => handleVerticalChange(v.id)}
                      className={cn(
                        'w-full text-left px-2 py-1.5 rounded-md text-xs hover:bg-muted transition-colors',
                        currentSelectedVertical?.id === v.id && 'bg-primary/10 text-primary'
                      )}
                    >
                      {v.name}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Mode toggle - icon-only for compact design */}
            <div className="flex items-center p-0.5 bg-muted/50 rounded-lg border" data-tour="creation-mode">
              <button
                onClick={() => setCreationMode('template')}
                className={cn(
                  "p-1.5 rounded-md transition-all",
                  creationMode === 'template'
                    ? "bg-white shadow-sm text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title="Use Template"
              >
                <Image className="h-4 w-4" />
              </button>
              <button
                onClick={() => setCreationMode('scratch')}
                className={cn(
                  "p-1.5 rounded-md transition-all",
                  creationMode === 'scratch'
                    ? "bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title="AI Create"
              >
                <Wand2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Bar 2: Actions with prominent Generate button */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onPanelChange?.(activePanel === 'details' ? null : 'details')}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg text-xs font-medium transition-all",
                activePanel === 'details'
                  ? "bg-white shadow-sm text-primary border border-primary/20"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              )}
            >
              <FileText className="h-4 w-4" />
              <span>Details</span>
            </button>
            <button
              onClick={() => onPanelChange?.(activePanel === 'style' ? null : 'style')}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg text-xs font-medium transition-all",
                activePanel === 'style'
                  ? "bg-white shadow-sm text-primary border border-primary/20"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              )}
            >
              <Palette className="h-4 w-4" />
              <span>Style</span>
            </button>
            {/* Generate - Prominent CTA (1.5x wider with gradient always visible) */}
            <button
              onClick={() => onPanelChange?.(activePanel === 'generate' ? null : 'generate')}
              className={cn(
                "flex-[1.5] flex items-center justify-center gap-1.5 h-9 rounded-lg text-xs font-semibold transition-all shadow-md",
                activePanel === 'generate'
                  ? "bg-gradient-to-r from-violet-700 to-indigo-700 text-white"
                  : "bg-gradient-to-r from-violet-500 to-indigo-500 text-white hover:from-violet-600 hover:to-indigo-600"
              )}
            >
              <Sparkles className="h-4 w-4" />
              <span>Generate</span>
            </button>
          </div>
        </div>

        {/* Desktop Layout: Single row */}
        <div className="hidden md:flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div data-tour="format-selector" className="shrink-0">
              <FormatDropdown />
            </div>

            {/* Creation Mode Toggle */}
            <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg border" data-tour="creation-mode">
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

            {/* Vertical - Desktop only */}
            <Select
              value={currentSelectedVertical?.id || ''}
              onValueChange={handleVerticalChange}
            >
              <SelectTrigger className="w-[100px] h-8 text-xs" data-tour="vertical-selector">
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

            {/* AI Model Selector - Desktop only */}
            <div>
              {isModelsLoading ? (
                <Skeleton className="h-8 w-[140px]" />
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="relative" data-tour="model-selector">
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
            </div>

            {/* Resolution - Desktop only */}
            <Select value={resolution} onValueChange={handleResolutionChange}>
              <SelectTrigger className="w-[75px] h-8 text-xs" data-tour="resolution-selector">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {isFlash31 && (
                  <SelectItem value="512px" className="text-xs">512px</SelectItem>
                )}
                <SelectItem value="1K" className="text-xs">1K</SelectItem>
                <SelectItem value="2K" className="text-xs">2K</SelectItem>
                <SelectItem value="4K" className="text-xs">4K</SelectItem>
              </SelectContent>
            </Select>

            {/* Quality/Speed Toggle — Flash 3.1 (Nano Banana 2) only */}
            {isFlash31 && onThinkingLevelChange && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center p-0.5 bg-muted/50 rounded-lg border">
                    <button
                      onClick={() => onThinkingLevelChange('minimal')}
                      className={cn(
                        'px-2 py-1 rounded-md text-[11px] font-medium transition-all',
                        thinkingLevel === 'minimal'
                          ? 'bg-white shadow-sm text-primary'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      Fast
                    </button>
                    <button
                      onClick={() => onThinkingLevelChange('High')}
                      className={cn(
                        'px-2 py-1 rounded-md text-[11px] font-medium transition-all',
                        thinkingLevel === 'High'
                          ? 'bg-white shadow-sm text-violet-600'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      Quality
                    </button>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs max-w-[200px]">
                    Fast: quick generation · Quality: deeper thinking for complex layouts
                  </p>
                </TooltipContent>
              </Tooltip>
            )}

            {/* Web Search Toggle — Flash 3.1 (Nano Banana 2) only */}
            {isFlash31 && onImageSearchChange && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onImageSearchChange(!useImageSearch)}
                    className={cn(
                      'flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all border',
                      useImageSearch
                        ? 'bg-white shadow-sm text-primary border-primary/30'
                        : 'text-muted-foreground border-transparent hover:text-foreground'
                    )}
                  >
                    <Globe className="h-3 w-3" />
                    <span>Web</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs max-w-[200px]">
                    Web Search: AI looks up real-world images before generating for more accurate visuals
                  </p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>

          {/* Right: Generate Button - Desktop only */}
          <div className="flex items-center gap-1.5 shrink-0">
            {!hasGeneratedImage && (
              <Button
                onClick={onGenerate}
                disabled={isGenerating || !selectedFormat || !canGenerate}
                className="h-9 gap-2 px-5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                title={!canGenerate ? 'Review your details first' : undefined}
                data-tour="generate-btn"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="font-medium text-sm">Creating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span className="font-medium text-sm">Generate</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </header>
    </TooltipProvider>
  )
}
