'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Check, ChevronDown, Gauge, Monitor, Image, Maximize2 } from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Badge } from '@/components/ui/badge'
import {
  RESOLUTIONS,
  DIMENSION_QUALITY,
  type ResolutionId,
  type AspectRatioId,
} from '@/lib/config/design-constants'

const RESOLUTION_ICONS: Record<ResolutionId, React.ElementType> = {
  '1K': Monitor,
  '2K': Image,
  '4K': Maximize2,
}

const RESOLUTION_COLORS: Record<ResolutionId, { bg: string; text: string }> = {
  '1K': {
    bg: 'bg-blue-100 dark:bg-blue-900/50',
    text: 'text-blue-600 dark:text-blue-400',
  },
  '2K': {
    bg: 'bg-purple-100 dark:bg-purple-900/50',
    text: 'text-purple-600 dark:text-purple-400',
  },
  '4K': {
    bg: 'bg-amber-100 dark:bg-amber-900/50',
    text: 'text-amber-600 dark:text-amber-400',
  },
}

interface QualitySectionProps {
  selectedResolution: ResolutionId
  onResolutionChange: (resolution: ResolutionId) => void
  aspectRatio?: AspectRatioId
  defaultOpen?: boolean
}

export function QualitySection({
  selectedResolution,
  onResolutionChange,
  aspectRatio = '4:5',
  defaultOpen = false,
}: QualitySectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  const resolutionEntries = Object.entries(RESOLUTIONS) as [
    ResolutionId,
    (typeof RESOLUTIONS)[ResolutionId],
  ][]

  const getDimensions = (resolutionId: ResolutionId) => {
    const dims = DIMENSION_QUALITY[aspectRatio]?.[resolutionId]
    if (dims) {
      return `${dims.width} × ${dims.height}`
    }
    return null
  }

  const selectedConfig = RESOLUTIONS[selectedResolution]
  const selectedDimensions = getDimensions(selectedResolution)

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
            <div className="p-2 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/50 dark:to-orange-900/50">
              <Gauge className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="text-left">
              <h3 className="text-sm font-semibold">Output Quality</h3>
              <p className="text-xs text-muted-foreground">
                {selectedConfig.label} {selectedDimensions && `• ${selectedDimensions}px`}
              </p>
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
          {resolutionEntries.map(([id, config]) => {
            const isSelected = selectedResolution === id
            const Icon = RESOLUTION_ICONS[id]
            const colors = RESOLUTION_COLORS[id]
            const dimensions = getDimensions(id)

            return (
              <button
                key={id}
                onClick={() => onResolutionChange(id)}
                className={cn(
                  'relative flex items-center gap-4 w-full p-4 rounded-xl border-2 text-left transition-all duration-200',
                  'hover:shadow-md hover:-translate-y-0.5',
                  isSelected
                    ? 'border-primary ring-2 ring-primary/20 shadow-md bg-primary/5'
                    : 'border-transparent bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm hover:border-primary/30'
                )}
              >
                {/* Icon */}
                <div className={cn('flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center', colors.bg)}>
                  <Icon className={cn('h-5 w-5', colors.text)} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{config.label}</span>
                    {id === '1K' && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        Recommended
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{config.description}</p>
                  {dimensions && (
                    <p className="text-xs text-muted-foreground/70 mt-0.5 font-mono">{dimensions}px</p>
                  )}
                </div>

                {/* Selection indicator */}
                {isSelected && (
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
              </button>
            )
          })}

          {/* Note */}
          <p className="text-xs text-muted-foreground px-1">
            AI generates at 1K. Higher quality upscales for print.
          </p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
