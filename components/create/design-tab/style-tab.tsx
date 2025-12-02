'use client'

import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Check } from 'lucide-react'
import {
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
} from 'lucide-react'
import { POSTER_STYLES } from '@/lib/config/design-constants'

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
}

export function StyleTab({ selectedStyle, onStyleChange }: StyleTabProps) {
  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Choose a visual style for your poster. This determines the overall aesthetic treatment.
      </div>

      <ScrollArea className="h-[450px] pr-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {POSTER_STYLES.map((style) => {
            const Icon = STYLE_ICONS[style.icon] || Square
            const isSelected = selectedStyle === style.value

            return (
              <button
                key={style.value}
                onClick={() => onStyleChange(style.value)}
                className={cn(
                  'relative flex flex-col items-center p-4 rounded-xl border transition-all',
                  isSelected
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                )}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                )}

                <div
                  className={cn(
                    'p-3 rounded-lg mb-3',
                    isSelected ? 'bg-primary/10 text-primary' : 'bg-muted'
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
