'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Check, ChevronDown, Sparkles, Star, Wand2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  THEME_CATEGORIES,
  getSuggestedThemes,
  type Theme,
  type ThemeCategoryId,
} from '@/lib/config/design-constants'
import type { AIDesignSuggestion } from '@/stores/creative-store'
import { useCreativeStore } from '@/stores/creative-store'

// Note: Collapsible removed - content is always visible when this section's tab is active

interface ThemeWithCategory extends Theme {
  categoryId: ThemeCategoryId
  categoryLabel: string
}

interface ThemeSectionProps {
  selectedTheme: string
  onThemeChange: (theme: string) => void
  aiSuggestions?: AIDesignSuggestion[]
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
    <motion.button
      whileHover={{ scale: 1.01, translateY: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      aria-label={isSelected ? 'AI theme selected' : 'Let AI choose the best theme'}
      aria-pressed={isSelected}
      className={cn(
        'relative w-full p-4 rounded-xl text-left transition-all duration-200',
        'glass-interactive overflow-hidden group',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        isSelected
          ? 'ring-2 ring-primary bg-gradient-to-r from-primary/10 to-secondary/10 dark:from-primary/20 dark:to-secondary/20 shadow-lg'
          : 'border-none'
      )}
    >
      <div className="flex items-center gap-4 relative z-10">
        <div className={cn(
          'p-3 rounded-xl transition-all duration-500',
          isSelected
            ? 'bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/20'
            : 'bg-primary/10 dark:bg-primary/20 group-hover:bg-primary/20 dark:group-hover:bg-primary/30'
        )}>
          <Wand2 className={cn('h-5 w-5', isSelected ? 'text-white' : 'text-primary dark:text-primary')} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn(
              "font-bold text-sm tracking-tight",
              isSelected ? "text-primary dark:text-primary" : "text-foreground"
            )}>
              {isSelected ? 'AI Selected' : 'Let AI Choose'}
            </span>
            {isSelected && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-4 h-4 rounded-full bg-primary flex items-center justify-center"
              >
                <Check className="h-2.5 w-2.5 text-white" />
              </motion.div>
            )}
          </div>
          <p className="text-xs text-muted-foreground font-medium mt-0.5 opacity-80">
            {recommendation
              ? `Best match: ${recommendation}`
              : 'AI analyzes your content & picks the best theme'}
          </p>
        </div>
        <Sparkles className={cn(
          'h-4 w-4 shrink-0 transition-all duration-500',
          isSelected ? 'text-primary animate-pulse' : 'text-primary/40 group-hover:text-primary'
        )} />
      </div>

      {/* Background Glow */}
      {isSelected && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 pointer-events-none" />
      )}
    </motion.button>
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
    <motion.button
      whileHover={{ scale: 1.03, translateY: -2 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      role="option"
      aria-selected={isSelected}
      aria-label={`${theme.label} theme${isSuggested ? ', recommended' : ''}`}
      className={cn(
        'relative w-full rounded-xl transition-all duration-200 overflow-hidden',
        'glass-interactive',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        isSelected
          ? 'ring-2 ring-primary shadow-xl z-10'
          : 'border-none'
      )}
    >
      <div className="relative aspect-[16/10] w-full">
        <Image
          src={theme.thumbnail}
          alt={`${theme.label} theme`}
          fill
          loading="lazy"
          className={cn(
            "object-cover transition-transform duration-300",
            isSelected ? "scale-105" : "group-hover:scale-105"
          )}
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Theme name */}
        <div className="absolute bottom-0 left-0 right-0 p-2">
          <div className="flex items-center justify-between gap-1">
            <span className="font-bold text-white text-[11px] tracking-tight truncate drop-shadow-lg">
              {theme.label}
            </span>
            {isSelected && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="shrink-0 w-4 h-4 rounded-full bg-primary flex items-center justify-center shadow-lg"
              >
                <Check className="h-2.5 w-2.5 text-primary-foreground" />
              </motion.div>
            )}
          </div>
        </div>

        {/* Recommended star */}
        {isSuggested && (
          <div className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 backdrop-blur-md shadow-lg border border-white/10">
            <Star className="h-2.5 w-2.5 text-yellow-400 fill-yellow-400" />
          </div>
        )}
      </div>
    </motion.button>
  )
}

export function ThemeSection({
  selectedTheme,
  onThemeChange,
  aiSuggestions = [],
}: ThemeSectionProps) {
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

  // Get recommended themes (AI + event-based) - show 10 by default
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

  // Find selected theme label for header display
  const selectedThemeLabel = selectedTheme === 'ai'
    ? 'AI Auto'
    : allThemes.find((t) => t.value === selectedTheme)?.label || 'None'

  // Get first AI suggestion label for hint
  const aiRecommendation = aiSuggestions[0]?.label

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold tracking-tight">Theme & Mood</h3>
          <p className="text-xs text-foreground/60">Current: {selectedThemeLabel}</p>
        </div>
      </div>

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

      {/* Responsive Theme Grid */}
      <div
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2"
        role="listbox"
        aria-label="Available themes"
      >
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
  )
}
