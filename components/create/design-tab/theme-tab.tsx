'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import {
  Briefcase,
  Palette,
  Crown,
  Zap,
  Globe,
  Leaf,
  GraduationCap,
  Search,
  Star,
  Check,
  Sparkles,
  RefreshCw,
  AlertCircle,
  Lightbulb,
} from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import type { AIDesignSuggestion } from '@/stores/creative-store'
import {
  THEME_CATEGORIES,
  getSuggestedThemes,
  type ThemeCategoryId,
  type Theme,
} from '@/lib/config/design-constants'

const CATEGORY_ICONS: Record<ThemeCategoryId, React.ElementType> = {
  professional: Briefcase,
  creative: Palette,
  elegant: Crown,
  dynamic: Zap,
  cultural: Globe,
  nature: Leaf,
  academic: GraduationCap,
}

interface ThemeWithCategory extends Theme {
  categoryId: ThemeCategoryId
  categoryLabel: string
}

interface ThemeTabProps {
  selectedTheme: string
  onThemeChange: (theme: string) => void
  eventType?: string
  eventName?: string
  // AI props
  enableAI?: boolean
  isGenerating?: boolean
  aiSuggestions?: AIDesignSuggestion[]
  aiError?: string | null
  onToggleAI?: (enabled: boolean) => void
  onRefreshAI?: () => void
  visualElements?: string[]
  creativeTips?: string[]
}

// Theme Card Component with thumbnail preview
function ThemeCard({
  theme,
  isSelected,
  isSuggested,
  isAISuggested,
  onClick,
}: {
  theme: ThemeWithCategory
  isSelected: boolean
  isSuggested: boolean
  isAISuggested?: boolean
  onClick: () => void
}) {
  return (
    <HoverCard openDelay={400}>
      <HoverCardTrigger asChild>
        <button
          onClick={onClick}
          className={cn(
            'relative w-full rounded-xl border-2 text-left transition-all duration-200 overflow-hidden',
            'hover:shadow-md hover:-translate-y-0.5',
            isSelected
              ? 'border-primary ring-2 ring-primary/20 shadow-md'
              : 'border-border hover:border-primary/50 bg-card'
          )}
        >
          {/* Thumbnail Preview */}
          <div className="relative aspect-[4/3] w-full">
            <Image
              src={theme.thumbnail}
              alt={`${theme.label} theme preview`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, 33vw"
            />
            {/* Gradient overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

            {/* Theme name on image */}
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-white text-sm drop-shadow-md truncate">
                  {theme.label}
                </span>
                {isSelected && (
                  <div className="shrink-0 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
              </div>
              <span className="text-xs text-white/80 drop-shadow">{theme.mood}</span>
            </div>

            {/* AI Suggested Badge */}
            {isAISuggested && (
              <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-blue-500/90 backdrop-blur-sm flex items-center gap-0.5">
                <Sparkles className="h-3 w-3 text-white" />
                <span className="text-[10px] font-medium text-white">AI</span>
              </div>
            )}
            {/* Suggested Star (event-type based) */}
            {isSuggested && !isAISuggested && (
              <div className="absolute top-2 right-2 p-1 rounded-full bg-black/30 backdrop-blur-sm">
                <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
              </div>
            )}
          </div>
        </button>
      </HoverCardTrigger>
      <HoverCardContent side="top" align="center" className="w-64">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold">{theme.label}</h4>
            {isAISuggested && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-blue-100 dark:bg-blue-900/50">
                <Sparkles className="h-2.5 w-2.5 mr-0.5 text-blue-500" />
                AI Pick
              </Badge>
            )}
            {isSuggested && !isAISuggested && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                <Star className="h-2.5 w-2.5 mr-0.5 text-yellow-500 fill-yellow-500" />
                Recommended
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{theme.description}</p>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {theme.categoryLabel}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {theme.mood}
            </Badge>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}

export function ThemeTab({
  selectedTheme,
  onThemeChange,
  eventType,
  eventName,
  // AI props
  enableAI = false,
  isGenerating = false,
  aiSuggestions = [],
  aiError = null,
  onToggleAI,
  onRefreshAI,
  visualElements = [],
  creativeTips = [],
}: ThemeTabProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('all')

  // Get AI-suggested theme IDs
  const aiSuggestedThemeIds = aiSuggestions.map((s) => s.id)

  const suggestedThemes = useMemo(
    () => (eventType ? getSuggestedThemes(eventType) : []),
    [eventType]
  )

  // Flatten all themes with category info
  const allThemes = useMemo<ThemeWithCategory[]>(() => {
    return THEME_CATEGORIES.flatMap((category) =>
      category.themes.map((theme) => ({
        ...theme,
        categoryId: category.id,
        categoryLabel: category.label,
      }))
    )
  }, [])

  // Filter themes based on search and category
  const filteredThemes = useMemo(() => {
    let themes = allThemes

    // Category filter
    if (activeCategory !== 'all') {
      themes = themes.filter((t) => t.categoryId === activeCategory)
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      themes = themes.filter(
        (t) =>
          t.label.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query) ||
          t.keywords.some((k) => k.toLowerCase().includes(query)) ||
          t.mood.toLowerCase().includes(query)
      )
    }

    return themes
  }, [allThemes, searchQuery, activeCategory])

  // Get suggested theme objects for the recommended section
  const suggestedThemeObjects = useMemo(() => {
    return suggestedThemes
      .map((themeId) => allThemes.find((t) => t.value === themeId))
      .filter((t): t is ThemeWithCategory => t !== undefined)
  }, [suggestedThemes, allThemes])

  const showRecommended = suggestedThemeObjects.length > 0 && !searchQuery && activeCategory === 'all'

  return (
    <div className="space-y-4">
      {/* AI Toggle for Theme Tab */}
      <div className="p-4 rounded-xl border bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50">
              <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <Label htmlFor="ai-theme-toggle" className="text-sm font-medium cursor-pointer">
                AI Theme Suggestions
              </Label>
              <p className="text-xs text-muted-foreground">
                Get AI-powered theme recommendations for your event
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
              id="ai-theme-toggle"
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
                <span>Generating theme suggestions...</span>
              </div>
            )}

            {/* Error State */}
            {aiError && (
              <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4" />
                <span>{aiError}</span>
              </div>
            )}

            {/* AI Suggested Themes */}
            {!isGenerating && aiSuggestions.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  AI Recommends
                </p>
                <div className="flex flex-wrap gap-2">
                  {aiSuggestions.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      onClick={() => onThemeChange(suggestion.id)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                        selectedTheme === suggestion.id
                          ? 'bg-blue-500 text-white'
                          : 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800/50'
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

            {/* Visual Elements */}
            {!isGenerating && visualElements.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Visual Elements
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {visualElements.map((element, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {element}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Creative Tips */}
            {!isGenerating && creativeTips.length > 0 && (
              <div className="p-3 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30">
                <div className="flex items-start gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5" />
                  <div className="text-xs text-amber-800 dark:text-amber-200">
                    <span className="font-medium">Tip: </span>
                    {creativeTips[0]}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search themes by name, mood, or style..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Recommended Section */}
      {showRecommended && (
        <div className="space-y-3 p-4 rounded-xl bg-gradient-to-br from-yellow-50/80 to-orange-50/50 dark:from-yellow-950/20 dark:to-orange-950/10 border border-yellow-200/50 dark:border-yellow-800/30">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-yellow-100 dark:bg-yellow-900/50">
              <Sparkles className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <h4 className="text-sm font-semibold">Recommended for you</h4>
              <p className="text-xs text-muted-foreground">Based on your event type</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {suggestedThemeObjects.map((theme) => (
              <button
                key={theme.value}
                onClick={() => onThemeChange(theme.value)}
                className={cn(
                  'relative rounded-lg overflow-hidden border-2 transition-all',
                  selectedTheme === theme.value
                    ? 'border-primary shadow-sm ring-1 ring-primary/30'
                    : 'border-yellow-200/70 dark:border-yellow-800/50 hover:border-primary/50'
                )}
              >
                <div className="relative aspect-[4/3] w-full">
                  <Image
                    src={theme.thumbnail}
                    alt={theme.label}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 33vw, 20vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-2">
                    <span className="text-xs font-medium text-white drop-shadow">
                      {theme.label}
                    </span>
                  </div>
                  {selectedTheme === theme.value && (
                    <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-2.5 w-2.5 text-primary-foreground" />
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Category Filter */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Filter by category
        </p>
        <ToggleGroup
          type="single"
          value={activeCategory}
          onValueChange={(v) => v && setActiveCategory(v)}
          className="flex flex-wrap gap-1.5 justify-start"
        >
          <ToggleGroupItem
            value="all"
            size="sm"
            className="rounded-full px-3 h-8 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            All Themes
          </ToggleGroupItem>
          {THEME_CATEGORIES.map((cat) => {
            const Icon = CATEGORY_ICONS[cat.id]
            const count = cat.themes.length
            return (
              <ToggleGroupItem
                key={cat.id}
                value={cat.id}
                size="sm"
                className="rounded-full px-3 h-8 text-xs gap-1.5 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
              >
                <Icon className="h-3.5 w-3.5" />
                {cat.label}
                <span className="text-[10px] opacity-60">({count})</span>
              </ToggleGroupItem>
            )
          })}
        </ToggleGroup>
      </div>

      {/* Theme Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredThemes.map((theme) => (
          <ThemeCard
            key={theme.value}
            theme={theme}
            isSelected={selectedTheme === theme.value}
            isSuggested={suggestedThemes.includes(theme.value)}
            isAISuggested={enableAI && aiSuggestedThemeIds.includes(theme.value)}
            onClick={() => onThemeChange(theme.value)}
          />
        ))}
      </div>

      {/* Empty State */}
      {filteredThemes.length === 0 && (
        <div className="text-center py-12">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
            <Search className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            No themes found matching &ldquo;{searchQuery}&rdquo;
          </p>
          <button
            onClick={() => {
              setSearchQuery('')
              setActiveCategory('all')
            }}
            className="text-sm text-primary hover:underline mt-2"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  )
}
