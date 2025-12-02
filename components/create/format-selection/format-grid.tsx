'use client'

import { FormatCard } from './format-card'
import type { CreativeFormat, CreativeFormatId } from '@/lib/config/creative-formats'
import { cn } from '@/lib/utils'

interface FormatGridProps {
  formats: CreativeFormat[]
  selectedFormatId?: CreativeFormatId | null
  onSelect: (format: CreativeFormat) => void
  className?: string
}

/**
 * Responsive grid of format cards
 */
export function FormatGrid({ formats, selectedFormatId, onSelect, className }: FormatGridProps) {
  if (formats.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No formats found. Try a different search or category.
      </div>
    )
  }

  return (
    <div
      className={cn(
        'grid gap-3',
        'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5',
        className
      )}
    >
      {formats.map((format) => (
        <FormatCard
          key={format.id}
          format={format}
          isSelected={selectedFormatId === format.id}
          onClick={() => onSelect(format)}
        />
      ))}
    </div>
  )
}
