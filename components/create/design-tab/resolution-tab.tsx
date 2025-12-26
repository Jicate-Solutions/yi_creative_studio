'use client'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Check, Monitor, Image, Maximize2, Info } from 'lucide-react'
import {
  RESOLUTIONS,
  DIMENSION_QUALITY,
  type ResolutionId,
  type AspectRatioId,
} from '@/lib/config/design-constants'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const RESOLUTION_ICONS: Record<ResolutionId, React.ElementType> = {
  '1K': Monitor,
  '2K': Image,
  '4K': Maximize2,
}

const RESOLUTION_COLORS: Record<ResolutionId, { bg: string; border: string; text: string }> = {
  '1K': {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-600 dark:text-blue-400',
  },
  '2K': {
    bg: 'bg-purple-50 dark:bg-purple-950/30',
    border: 'border-purple-200 dark:border-purple-800',
    text: 'text-purple-600 dark:text-purple-400',
  },
  '4K': {
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-800',
    text: 'text-amber-600 dark:text-amber-400',
  },
}

interface ResolutionTabProps {
  selectedResolution: ResolutionId
  onResolutionChange: (resolution: ResolutionId) => void
  aspectRatio?: AspectRatioId
}

export function ResolutionTab({
  selectedResolution,
  onResolutionChange,
  aspectRatio = '4:5',
}: ResolutionTabProps) {
  const resolutionEntries = Object.entries(RESOLUTIONS) as [
    ResolutionId,
    (typeof RESOLUTIONS)[ResolutionId],
  ][]

  // Get dimensions for the current aspect ratio
  const getDimensions = (resolutionId: ResolutionId) => {
    const dims = DIMENSION_QUALITY[aspectRatio]?.[resolutionId]
    if (dims) {
      return `${dims.width} × ${dims.height}px`
    }
    return null
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Image Quality</h3>
          <p className="text-xs text-muted-foreground">
            Higher quality for printing, standard for sharing online
          </p>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="p-1 rounded-md hover:bg-muted">
                <Info className="h-4 w-4 text-muted-foreground" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-xs">
              <p className="text-xs">
                AI generates at 1K resolution. Higher quality settings will upscale the output for
                print use.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Resolution Cards */}
      <div className="grid grid-cols-1 gap-3">
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
                'relative flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all duration-200',
                'hover:shadow-md hover:-translate-y-0.5',
                isSelected
                  ? 'border-primary ring-2 ring-primary/20 shadow-md bg-primary/5'
                  : 'border-border hover:border-primary/50 bg-card'
              )}
            >
              {/* Icon */}
              <div
                className={cn(
                  'flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center',
                  colors.bg,
                  colors.border,
                  'border'
                )}
              >
                <Icon className={cn('h-6 w-6', colors.text)} />
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
                  <p className="text-xs text-muted-foreground/70 mt-1 font-mono">{dimensions}</p>
                )}
              </div>

              {/* Selection indicator */}
              {isSelected && (
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <Check className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Model Constraint Notice */}
      <div className="p-3 rounded-lg bg-muted/50 border border-border">
        <p className="text-xs text-muted-foreground">
          <span className="font-medium">Note:</span> Current AI model (Gemini Flash) generates at 1K
          resolution. 2K/4K settings will upscale the output for higher quality exports.
        </p>
      </div>
    </div>
  )
}
