'use client'

import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Check,
  Lightbulb,
  Sparkles,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'
import { POSTER_STYLES } from '@/lib/config/design-constants'
import { StylePreviews } from './style-previews'
import type { AIDesignSuggestion } from '@/stores/creative-store'

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
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {POSTER_STYLES.map((style) => {
            const isSelected = selectedStyle === style.value
            const isAISuggested = enableAI && aiSuggestedStyleIds.includes(style.value)
            const StylePreview = StylePreviews[style.value]

            return (
              <div
                key={style.value}
                onClick={() => onStyleChange(style.value)}
                className={cn(
                  'group relative overflow-hidden rounded-xl border-2 transition-all cursor-pointer',
                  isSelected
                    ? 'border-primary ring-2 ring-primary/20 shadow-lg'
                    : 'border-transparent hover:border-primary/50'
                )}
              >
                {/* Preview Container */}
                <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                  {/* Style Preview */}
                  {StylePreview && <StylePreview />}

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                  {/* AI Badge */}
                  {isAISuggested && (
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-blue-500 text-white gap-1">
                        <Sparkles className="h-3 w-3" />
                        AI
                      </Badge>
                    </div>
                  )}

                  {/* Selected Check Icon */}
                  {isSelected && (
                    <div className="absolute top-2 left-2">
                      <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                        <Check className="h-4 w-4 text-primary-foreground" />
                      </div>
                    </div>
                  )}

                  {/* Text Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 space-y-1">
                    <div className="font-semibold text-white drop-shadow-lg">
                      {style.label}
                    </div>
                    <div className="text-xs text-white/90 line-clamp-2 drop-shadow">
                      {style.description}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
