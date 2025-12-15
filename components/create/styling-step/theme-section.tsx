'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Check, ChevronDown, Sparkles, Star, Wand2 } from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'
import {
  THEME_CATEGORIES,
  getSuggestedThemes,
  type Theme,
  type ThemeCategoryId,
} from '@/lib/config/design-constants'
import type { AIDesignSuggestion } from '@/stores/creative-store'
import { useCreativeStore } from '@/stores/creative-store'

interface ThemeWithCategory extends Theme {
  categoryId: ThemeCategoryId
  categoryLabel: string
}

interface ThemeSectionProps {
  selectedTheme: string
  onThemeChange: (theme: string) => void
  aiSuggestions?: AIDesignSuggestion[]
  defaultOpen?: boolean
}

// AI Auto Card - Clear, prominent option at top
function AIAutoCard({
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
        'hover:shadow-md group',
        isSelected
          ? 'border-violet-500 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/50 dark:to-purple-950/50 shadow-md'
          : 'border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-900/60 hover:border-violet-300'
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          'p-2.5 rounded-lg transition-all',
          isSelected
            ? 'bg-gradient-to-r from-violet-500 to-purple-500'
            : 'bg-gradient-to-r from-violet-100 to-purple-100 dark:from-violet-900/50 dark:to-purple-900/50 group-hover:from-violet-200 group-hover:to-purple-200'
        )}>
          <Wand2 className={cn('h-5 w-5', isSelected ? 'text-white' : 'text-violet-600 dark:text-violet-400')} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">
              {isSelected ? 'AI Selected' : 'Let AI Choose'}
            </span>
            {isSelected && (
              <div className="w-4 h-4 rounded-full bg-violet-500 flex items-center justify-center">
                <Check className="h-2.5 w-2.5 text-white" />
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {recommendation
              ? `Best match: ${recommendation}`
              : 'AI analyzes your content & picks the best theme'}
          </p>
        </div>
        <Sparkles className={cn(
          'h-4 w-4 shrink-0 transition-all',
          isSelected ? 'text-violet-500' : 'text-violet-400 group-hover:text-violet-500'
        )} />
      </div>
    </button>
  )
}

// Compact Theme Card
function CompactThemeCard({
  theme,
  isSelected,
  isSuggested,
  onClick,
}: {
  theme: ThemeWithCategory
  isSelected: boolean
  isSuggested?: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative w-full rounded-lg border-2 text-left transition-all duration-200 overflow-hidden',
        'hover:shadow-md hover:scale-[1.02]',
        isSelected
          ? 'border-primary ring-1 ring-primary/30 shadow-md'
          : 'border-transparent bg-white/60 dark:bg-slate-900/60 hover:border-primary/30'
      )}
    >
      <div className="relative aspect-[16/10] w-full">
        <Image
          src={theme.thumbnail}
          alt={`${theme.label} theme`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 20vw, 10vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        {/* Theme name */}
        <div className="absolute bottom-0 left-0 right-0 p-1">
          <div className="flex items-center justify-between gap-1">
            <span className="font-medium text-white text-[11px] drop-shadow-md truncate">
              {theme.label}
            </span>
            {isSelected && (
              <div className="shrink-0 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                <Check className="h-2.5 w-2.5 text-primary-foreground" />
              </div>
            )}
          </div>
        </div>

        {/* Recommended star */}
        {isSuggested && (
          <div className="absolute top-1 right-1 p-0.5 rounded-full bg-black/40">
            <Star className="h-2.5 w-2.5 text-yellow-400 fill-yellow-400" />
          </div>
        )}
      </div>
    </button>
  )
}

export function ThemeSection({
  selectedTheme,
  onThemeChange,
  aiSuggestions = [],
  defaultOpen = true,
}: ThemeSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [showAll, setShowAll] = useState(false)

  // Read eventType from store instead of props
  const { formData } = useCreativeStore()
  const eventData = formData.formData as { eventType?: string }
  const eventType = eventData.eventType

  const aiSuggestedThemeIds = aiSuggestions.map((s) => s.id)

  const suggestedThemes = useMemo(
    () => (eventType ? getSuggestedThemes(eventType) : []),
    [eventType]
  )

  // Flatten all themes - EXCLUDE 'ai' since it's shown separately in AIAutoCard
  const allThemes = useMemo<ThemeWithCategory[]>(() => {
    return THEME_CATEGORIES.flatMap((category) =>
      category.themes
        .filter((theme) => theme.value !== 'ai') // AI Auto has its own card above
        .map((theme) => ({
          ...theme,
          categoryId: category.id,
          categoryLabel: category.label,
        }))
    )
  }, [])

  // Get recommended themes (AI + event-based) - show 8 by default
  const recommendedThemes = useMemo(() => {
    const recommended: ThemeWithCategory[] = []
    const addedIds = new Set<string>()

    // Add AI suggestions first
    aiSuggestedThemeIds.forEach((id) => {
      const theme = allThemes.find((t) => t.value === id)
      if (theme && !addedIds.has(id)) {
        recommended.push(theme)
        addedIds.add(id)
      }
    })

    // Add event-based suggestions
    suggestedThemes.forEach((id) => {
      const theme = allThemes.find((t) => t.value === id)
      if (theme && !addedIds.has(id)) {
        recommended.push(theme)
        addedIds.add(id)
      }
    })

    // Fill with remaining themes if needed
    if (recommended.length < 10) {
      allThemes.forEach((theme) => {
        if (!addedIds.has(theme.value) && recommended.length < 10) {
          recommended.push(theme)
          addedIds.add(theme.value)
        }
      })
    }

    return recommended.slice(0, 10)
  }, [allThemes, aiSuggestedThemeIds, suggestedThemes])

  // Themes to display (10 compact or all)
  const displayedThemes = showAll ? allThemes : recommendedThemes

  // Find selected theme label
  const selectedThemeLabel = selectedTheme === 'ai'
    ? 'AI Auto'
    : allThemes.find((t) => t.value === selectedTheme)?.label || 'Select'

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
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50">
              <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-left">
              <h3 className="text-sm font-semibold">Theme & Mood</h3>
              <p className="text-xs text-muted-foreground">{selectedThemeLabel}</p>
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
        <div className="space-y-2 p-3 rounded-xl bg-white/50 dark:bg-slate-900/50 border border-slate-200/30 dark:border-slate-700/30 backdrop-blur-sm">
          {/* AI Auto Option - Prominent at top */}
          <AIAutoCard
            isSelected={selectedTheme === 'ai'}
            onClick={() => onThemeChange('ai')}
            recommendation={aiRecommendation}
          />

          {/* Divider */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
            <span>or pick a specific theme</span>
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
          </div>

          {/* Compact Theme Grid (2x5) */}
          <div className="grid grid-cols-5 gap-1.5">
            {displayedThemes.map((theme) => (
              <CompactThemeCard
                key={theme.value}
                theme={theme}
                isSelected={selectedTheme === theme.value}
                isSuggested={suggestedThemes.includes(theme.value)}
                onClick={() => onThemeChange(theme.value)}
              />
            ))}
          </div>

          {/* See All / Show Less Button */}
          {allThemes.length > 10 && (
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
                  +{allThemes.length - 10} more themes
                  <ChevronDown className="ml-1 h-4 w-4" />
                </>
              )}
            </Button>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
