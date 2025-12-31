'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
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
import { Button } from '@/components/ui/button'
import { POSTER_STYLES } from '@/lib/config/design-constants'
import type { AIDesignSuggestion } from '@/stores/creative-store'

// Note: Collapsible removed - content is always visible when this section's tab is active

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
    <motion.button
      whileHover={{ scale: 1.01, translateY: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      aria-label={isSelected ? 'AI style selected' : 'Let AI choose the best style'}
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
            {recommendation ? `Suggests: ${recommendation}` : 'Let AI choose the best style'}
          </p>
        </div>
        <Sparkles className={cn(
          'h-4 w-4 shrink-0 transition-all duration-500',
          isSelected ? 'text-primary animate-pulse' : 'text-primary/40 group-hover:text-primary'
        )} />
      </div>
    </motion.button>
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
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      role="option"
      aria-selected={isSelected}
      aria-label={`${style.label} style`}
      className={cn(
        'flex items-center gap-2 px-4 py-2 rounded-full',
        'border transition-all duration-200 text-xs font-bold tracking-tight',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        isSelected
          ? 'border-primary bg-primary text-primary-foreground shadow-lg'
          : 'glass border-none hover:bg-white/40 dark:hover:bg-white/10'
      )}
    >
      <Icon className={cn('h-3.5 w-3.5', isSelected ? '' : 'text-muted-foreground')} />
      <span>{style.label}</span>
      {isSelected && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
          <Check className="h-3 w-3" />
        </motion.div>
      )}
    </motion.button>
  )
}

export function StyleSection({
  selectedStyle,
  onStyleChange,
  aiSuggestions = [],
}: StyleSectionProps) {
  const [showAll, setShowAll] = useState(false)

  // Show 8 styles by default, all when expanded
  const displayedStyles = showAll ? POSTER_STYLES : POSTER_STYLES.slice(0, 8)

  // Find selected style label
  const selectedStyleLabel = selectedStyle === 'ai'
    ? 'AI Auto'
    : POSTER_STYLES.find((s) => s.value === selectedStyle)?.label || 'None'

  // Get first AI suggestion label for hint
  const aiRecommendation = aiSuggestions[0]?.label

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10">
          <Wand2 className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold tracking-tight">Visual Style</h3>
          <p className="text-xs text-foreground/60">Current: {selectedStyleLabel}</p>
        </div>
      </div>

      {/* AI Auto Option - Prominent at top */}
      <AIAutoStyleCard
        isSelected={selectedStyle === 'ai'}
        onClick={() => onStyleChange('ai')}
        recommendation={aiRecommendation}
      />

      {/* Divider */}
      <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-bold uppercase tracking-widest px-2">
        <div className="flex-1 h-px bg-slate-200/50 dark:bg-slate-700/50" />
        <span>or choose manually</span>
        <div className="flex-1 h-px bg-slate-200/50 dark:bg-slate-700/50" />
      </div>

      {/* Compact Style Pills Grid */}
      <div className="flex flex-wrap gap-2" role="listbox" aria-label="Available visual styles">
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
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-xl glass border-none shadow-sm dark:bg-white/5"
        >
          <p className="text-[11px] text-muted-foreground font-medium leading-relaxed italic opacity-90">
            {POSTER_STYLES.find((s) => s.value === selectedStyle)?.description}
          </p>
        </motion.div>
      )}
    </div>
  )
}
