'use client'

import { cn } from '@/lib/utils'
import { Check, Gauge, Monitor, Image, Maximize2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  RESOLUTIONS,
  DIMENSION_QUALITY,
  type ResolutionId,
  type AspectRatioId,
} from '@/lib/config/design-constants'

// Note: Collapsible removed - content is always visible when this section's tab is active

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
}

export function QualitySection({
  selectedResolution,
  onResolutionChange,
  aspectRatio = '4:5',
}: QualitySectionProps) {
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
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 dark:from-amber-500/20 dark:to-orange-500/20">
          <Gauge className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold tracking-tight">Output Quality</h3>
          <p className="text-xs text-foreground/60">
            Current: {selectedConfig.label} {selectedDimensions && `• ${selectedDimensions}px`}
          </p>
        </div>
      </div>

      {/* Resolution Options */}
      <div className="space-y-3" role="radiogroup" aria-label="Select output resolution">
        {resolutionEntries.map(([id, config]) => {
          const isSelected = selectedResolution === id
          const Icon = RESOLUTION_ICONS[id]
          const colors = RESOLUTION_COLORS[id]
          const dimensions = getDimensions(id)

          return (
            <button
              key={id}
              onClick={() => onResolutionChange(id)}
              role="radio"
              aria-checked={isSelected}
              aria-label={`${config.label} resolution${id === '1K' ? ', recommended' : ''}`}
              className={cn(
                'relative flex items-center gap-4 w-full p-4 rounded-xl text-left transition-all duration-200',
                'glass-interactive',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                'hover:shadow-md hover:-translate-y-0.5',
                isSelected
                  ? 'ring-2 ring-primary shadow-md bg-primary/5'
                  : 'border-none hover:bg-white/40 dark:hover:bg-white/10'
              )}
            >
              {/* Icon */}
              <div className={cn('flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center', colors.bg)}>
                <Icon className={cn('h-5 w-5', colors.text)} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm tracking-tight">{config.label}</span>
                  {id === '1K' && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-bold">
                      Recommended
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-foreground/60 mt-0.5">{config.description}</p>
                {dimensions && (
                  <p className="text-xs text-foreground/50 mt-0.5 font-mono">{dimensions}px</p>
                )}
              </div>

              {/* Selection indicator */}
              {isSelected && (
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-lg">
                  <Check className="h-3 w-3 text-primary-foreground" />
                </div>
              )}
            </button>
          )
        })}

        {/* Note */}
        <p className="text-xs text-foreground/60 px-1 italic">
          AI generates at 1K. Higher quality upscales for print.
        </p>
      </div>
    </div>
  )
}
