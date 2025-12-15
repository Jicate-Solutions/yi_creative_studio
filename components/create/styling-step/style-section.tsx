'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  Check,
  ChevronDown,
  Wand2,
  Sparkles,
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
  Scissors,
  Circle,
  SunMoon,
} from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'
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

interface StyleSectionProps {
  selectedStyle: string
  onStyleChange: (style: string) => void
  aiSuggestions?: AIDesignSuggestion[]
  defaultOpen?: boolean
}

// AI Auto Card for Style
function AIAutoStyleCard({
  isSelected,
  onClick,
  recommendation,
}: {
  isSelected: boolean
  onClick: () => void
  recommendation?: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative w-full p-3 rounded-xl border-2 text-left transition-all duration-200',
        'hover:shadow-md',
        isSelected
          ? 'border-purple-500 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50 shadow-md'
          : 'border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-900/60 hover:border-purple-300'
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          'p-2.5 rounded-lg',
          isSelected
            ? 'bg-gradient-to-r from-purple-500 to-pink-500'
            : 'bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50'
        )}>
          <Wand2 className={cn('h-5 w-5', isSelected ? 'text-white' : 'text-purple-600 dark:text-purple-400')} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">AI Auto</span>
            {isSelected && (
              <div className="w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center">
                <Check className="h-2.5 w-2.5 text-white" />
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {recommendation ? `Suggests: ${recommendation}` : 'Let AI choose the best style'}
          </p>
        </div>
        <Sparkles className="h-4 w-4 text-purple-500 shrink-0" />
      </div>
    </button>
  )
}

// Compact Style Pill
function StylePill({
  style,
  isSelected,
  onClick,
}: {
  style: typeof POSTER_STYLES[number]
  isSelected: boolean
  onClick: () => void
}) {
  const Icon = STYLE_ICONS[style.icon] || Square

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-full',
        'border transition-all duration-200',
        'hover:scale-[1.02] hover:shadow-sm text-xs font-medium',
        isSelected
          ? 'border-primary bg-primary text-primary-foreground shadow-sm'
          : 'border-border bg-card hover:border-primary/50 hover:bg-accent/50'
      )}
    >
      <Icon className={cn('h-3 w-3', isSelected ? '' : 'text-muted-foreground')} />
      <span>{style.label}</span>
      {isSelected && <Check className="h-3 w-3" />}
    </button>
  )
}

export function StyleSection({
  selectedStyle,
  onStyleChange,
  aiSuggestions = [],
  defaultOpen = false,
}: StyleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [showAll, setShowAll] = useState(false)

  const aiSuggestedStyleIds = aiSuggestions.map((s) => s.id)

  // Show 8 styles by default, all when expanded
  const displayedStyles = showAll ? POSTER_STYLES : POSTER_STYLES.slice(0, 8)

  // Find selected style label
  const selectedStyleLabel = selectedStyle === 'ai'
    ? 'AI Auto'
    : POSTER_STYLES.find((s) => s.value === selectedStyle)?.label || 'Select'

  // Get first AI suggestion label for hint
  const aiRecommendation = aiSuggestions[0]?.label

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="w-full">
        <div
          className={cn(
            'flex items-center justify-between p-4 rounded-xl transition-all',
            'bg-gradient-to-br from-slate-50/80 to-white/90 dark:from-slate-900/80 dark:to-slate-800/90',
            'border border-slate-200/50 dark:border-slate-700/50',
            'hover:shadow-md cursor-pointer',
            isOpen && 'shadow-sm bg-slate-50/90 dark:bg-slate-800/90'
          )}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50">
              <Wand2 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="text-left">
              <h3 className="text-sm font-semibold">Visual Style</h3>
              <p className="text-xs text-muted-foreground">{selectedStyleLabel}</p>
            </div>
          </div>
          <ChevronDown
            className={cn(
              'h-5 w-5 text-muted-foreground transition-transform duration-200',
              isOpen && 'rotate-180'
            )}
          />
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent className="mt-3">
        <div className="space-y-3 p-4 rounded-xl bg-white/50 dark:bg-slate-900/50 border border-slate-200/30 dark:border-slate-700/30 backdrop-blur-sm">
          {/* AI Auto Option - Prominent at top */}
          <AIAutoStyleCard
            isSelected={selectedStyle === 'ai'}
            onClick={() => onStyleChange('ai')}
            recommendation={aiRecommendation}
          />

          {/* Divider */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
            <span>or choose manually</span>
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
          </div>

          {/* Compact Style Pills Grid */}
          <div className="flex flex-wrap gap-2">
            {displayedStyles.map((style) => (
              <StylePill
                key={style.value}
                style={style}
                isSelected={selectedStyle === style.value}
                onClick={() => onStyleChange(style.value)}
              />
            ))}
          </div>

          {/* See More / Show Less button */}
          {POSTER_STYLES.length > 8 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAll(!showAll)}
              className="w-full text-muted-foreground hover:text-foreground"
            >
              {showAll ? (
                <>
                  Show Less
                  <ChevronDown className="ml-1 h-4 w-4 rotate-180" />
                </>
              ) : (
                <>
                  +{POSTER_STYLES.length - 8} more styles
                  <ChevronDown className="ml-1 h-4 w-4" />
                </>
              )}
            </Button>
          )}

          {/* Style Description */}
          {selectedStyle && selectedStyle !== 'ai' && (
            <div className="p-2.5 rounded-lg bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200/30 dark:border-slate-700/30">
              <p className="text-xs text-muted-foreground">
                {POSTER_STYLES.find((s) => s.value === selectedStyle)?.description}
              </p>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
