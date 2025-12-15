'use client'

import { cn } from '@/lib/utils'
import { Sparkles, Zap, Crown, Palette, Undo2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

export interface StylePreset {
  id: string
  name: string
  icon: React.ElementType
  theme: string
  style: string
  paletteId: string | null
  isAI?: boolean
}

const DEFAULT_PRESETS: StylePreset[] = [
  {
    id: 'modern-corporate',
    name: 'Modern',
    icon: Zap,
    theme: 'corporate_modern',
    style: 'minimalist',
    paletteId: 'corporate',
  },
  {
    id: 'bold-vibrant',
    name: 'Bold',
    icon: Palette,
    theme: 'bold_impact',
    style: 'bold_typography',
    paletteId: 'vibrant',
  },
  {
    id: 'elegant-premium',
    name: 'Elegant',
    icon: Crown,
    theme: 'elegant_luxury',
    style: 'luxury_premium',
    paletteId: 'neutral',
  },
]

interface QuickPresetsProps {
  onApplyPreset: (preset: StylePreset) => void
  activePresetId?: string | null
  aiPresets?: StylePreset[]
  className?: string
}

export function QuickPresets({
  onApplyPreset,
  activePresetId,
  aiPresets = [],
  className,
}: QuickPresetsProps) {
  const [lastPreset, setLastPreset] = useState<StylePreset | null>(null)

  // Combine AI presets with defaults, prioritizing AI
  const allPresets = [
    ...aiPresets.slice(0, 2).map((p) => ({ ...p, isAI: true })),
    ...DEFAULT_PRESETS.slice(0, aiPresets.length > 0 ? 2 : 3),
  ].slice(0, 4)

  const handleApply = (preset: StylePreset) => {
    setLastPreset(activePresetId ? allPresets.find((p) => p.id === activePresetId) || null : null)
    onApplyPreset(preset)
  }

  const handleUndo = () => {
    if (lastPreset) {
      onApplyPreset(lastPreset)
      setLastPreset(null)
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Quick Presets
        </p>
        {lastPreset && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleUndo}
            className="h-6 text-xs gap-1 text-muted-foreground hover:text-foreground"
          >
            <Undo2 className="h-3 w-3" />
            Undo
          </Button>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {allPresets.map((preset) => {
          const Icon = preset.icon
          const isActive = activePresetId === preset.id

          return (
            <button
              key={preset.id}
              onClick={() => handleApply(preset)}
              className={cn(
                'group relative flex items-center gap-2 px-4 py-2.5 rounded-full',
                'border-2 transition-all duration-200 whitespace-nowrap',
                'hover:scale-[1.02] hover:shadow-md',
                isActive
                  ? 'border-primary bg-primary text-primary-foreground shadow-md'
                  : 'border-border bg-card hover:border-primary/50 hover:bg-accent/50'
              )}
            >
              {preset.isAI && !isActive && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-r from-violet-500 to-purple-500">
                  <Sparkles className="h-2.5 w-2.5 text-white" />
                </span>
              )}
              <Icon className={cn('h-4 w-4', isActive ? '' : 'text-muted-foreground group-hover:text-foreground')} />
              <span className="text-sm font-medium">{preset.name}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
