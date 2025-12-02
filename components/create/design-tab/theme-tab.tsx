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
} from 'lucide-react'
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
}

// Theme Card Component with thumbnail preview
function ThemeCard({
  theme,
  isSelected,
  isSuggested,
  onClick,
}: {
  theme: ThemeWithCategory
  isSelected: boolean
  isSuggested: boolean
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

            {/* Suggested Star */}
            {isSuggested && (
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
            {isSuggested && (
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

export function ThemeTab({ selectedTheme, onThemeChange, eventType }: ThemeTabProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('all')

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
