'use client'

import { Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { CreativeFormat, CreativeFormatId } from '@/lib/config/creative-formats'
import { getFormatById } from '@/lib/config/creative-formats'

interface RecentFormatsProps {
  recentFormatIds: CreativeFormatId[]
  selectedFormatId?: CreativeFormatId | null
  onSelect: (format: CreativeFormat) => void
  className?: string
}

/**
 * Horizontal row of recently used formats
 */
export function RecentFormats({
  recentFormatIds,
  selectedFormatId,
  onSelect,
  className,
}: RecentFormatsProps) {
  if (recentFormatIds.length === 0) {
    return null
  }

  // Get format objects from IDs
  const recentFormats = recentFormatIds
    .map((id) => getFormatById(id))
    .filter((f): f is CreativeFormat => f !== undefined)

  if (recentFormats.length === 0) {
    return null
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="w-4 h-4" />
        <span>Recent</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {recentFormats.map((format) => {
          const isSelected = selectedFormatId === format.id

          return (
            <button
              key={format.id}
              type="button"
              onClick={() => onSelect(format)}
              className={cn(
                'inline-flex items-center gap-2 px-3 py-1.5 rounded-full transition-all',
                'text-sm font-medium shadow-sm',
                isSelected
                  ? 'bg-primary/10 text-primary ring-2 ring-primary/20'
                  : 'bg-card hover:bg-accent/50 text-foreground hover:shadow-md'
              )}
            >
              <span className="text-xs text-muted-foreground">{format.aspectRatio}</span>
              <span>{format.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
