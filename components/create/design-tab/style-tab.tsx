'use client'

import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Check,
  Blend,
  Square,
  Layers,
  Triangle,
  Lightbulb,
  Contrast,
  Droplets,
  Pen,
  Box,
  Type,
  Camera,
  PenTool,
  Sparkles,
  Scissors,
  Circle,
  SunMoon,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'
import { POSTER_STYLES } from '@/lib/config/design-constants'
import type { AIDesignSuggestion } from '@/stores/creative-store'

const STYLE_ICONS: Record<string, React.ElementType> = {
  Blend,
  Square,
  Layers,
  Triangle,
  Lightbulb,
  Contrast,
  Droplets,
  Pen,
  Box,
  Type,
  Camera,
  PenTool,
  Sparkles,
  Scissors,
  Circle,
  SunMoon,
}

interface StyleTabProps {
  selectedStyle: string
  onStyleChange: (style: string) => void
  eventName?: string
  // AI props
  enableAI?: boolean
  isGenerating?: boolean
  aiSuggestions?: AIDesignSuggestion[]
  aiError?: string | null
  onToggleAI?: (enabled: boolean) => void
  onRefreshAI?: () => void
  creativeTips?: string[]
}

export function StyleTab({
  selectedStyle,
  onStyleChange,
  eventName,
  // AI props
  enableAI = false,
  isGenerating = false,
  aiSuggestions = [],
  aiError = null,
  onToggleAI,
  onRefreshAI,
  creativeTips = [],
}: StyleTabProps) {
  // Get AI-suggested style IDs
  const aiSuggestedStyleIds = aiSuggestions.map((s) => s.id)

  return (
    <div className="space-y-4">
      {/* AI Toggle for Style Tab */}
      <div className="p-4 rounded-xl border bg-gradient-to-r from-purple-50/50 to-pink-50/50 dark:from-purple-950/20 dark:to-pink-950/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/50">
              <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <Label htmlFor="ai-style-toggle" className="text-sm font-medium cursor-pointer">
                AI Style Suggestions
              </Label>
              <p className="text-xs text-muted-foreground">
                Get AI-powered style recommendations
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {enableAI && onRefreshAI && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onRefreshAI}
                disabled={isGenerating}
                className="h-8 w-8"
              >
                <RefreshCw className={cn('h-4 w-4', isGenerating && 'animate-spin')} />
              </Button>
            )}
            <Switch
              id="ai-style-toggle"
              checked={enableAI}
              onCheckedChange={(checked) => onToggleAI?.(checked)}
            />
          </div>
        </div>

        {/* AI Suggestions Panel */}
        {enableAI && (
          <div className="mt-4 space-y-3">
            {/* Loading State */}
            {isGenerating && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Generating style suggestions...</span>
              </div>
            )}

            {/* Error State */}
            {aiError && (
              <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4" />
                <span>{aiError}</span>
              </div>
            )}

            {/* AI Suggested Styles */}
            {!isGenerating && aiSuggestions.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  AI Recommends
                </p>
                <div className="flex flex-wrap gap-2">
                  {aiSuggestions.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      onClick={() => onStyleChange(suggestion.id)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                        selectedStyle === suggestion.id
                          ? 'bg-purple-500 text-white'
                          : 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-800/50'
                      )}
                      title={suggestion.reason}
                    >
                      <Sparkles className="h-3 w-3" />
                      {suggestion.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Creative Tips */}
            {!isGenerating && creativeTips.length > 1 && (
              <div className="p-3 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30">
                <div className="flex items-start gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5" />
                  <div className="text-xs text-amber-800 dark:text-amber-200">
                    <span className="font-medium">Style Tip: </span>
                    {creativeTips[1] || creativeTips[0]}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="text-sm text-muted-foreground">
        Choose a visual style for your poster. This sets the overall look and feel.
      </div>

      <ScrollArea className="h-[400px] pr-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {POSTER_STYLES.map((style) => {
            const Icon = STYLE_ICONS[style.icon] || Square
            const isSelected = selectedStyle === style.value
            const isAISuggested = enableAI && aiSuggestedStyleIds.includes(style.value)

            return (
              <button
                key={style.value}
                onClick={() => onStyleChange(style.value)}
                className={cn(
                  'relative flex flex-col items-center p-4 rounded-xl border transition-all',
                  isSelected
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                    : isAISuggested
                    ? 'border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/30 hover:border-blue-400'
                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                )}
              >
                {/* AI Badge */}
                {isAISuggested && !isSelected && (
                  <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-full bg-blue-500 flex items-center gap-0.5">
                    <Sparkles className="h-2.5 w-2.5 text-white" />
                    <span className="text-[9px] font-medium text-white">AI</span>
                  </div>
                )}

                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                )}

                <div
                  className={cn(
                    'p-3 rounded-lg mb-3',
                    isSelected ? 'bg-primary/10 text-primary' : isAISuggested ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400' : 'bg-muted'
                  )}
                >
                  <Icon className="h-6 w-6" />
                </div>

                <div className="font-medium text-sm text-center">{style.label}</div>
                <div className="text-xs text-muted-foreground text-center mt-1 line-clamp-2">
                  {style.description}
                </div>
              </button>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
