'use client'

import { cn } from '@/lib/utils'
import type { CreativeFormat } from '@/lib/config/creative-formats'
import { Badge } from '@/components/ui/badge'
import { Check } from 'lucide-react'

interface FormatCardProps {
  format: CreativeFormat
  isSelected?: boolean
  onClick?: () => void
  className?: string
}

/**
 * Individual format card with visual aspect ratio preview
 */
export function FormatCard({ format, isSelected, onClick, className }: FormatCardProps) {
  // Calculate aspect ratio for the preview box
  const getAspectStyle = (): React.CSSProperties => {
    if (format.aspectRatio === 'custom') {
      return { aspectRatio: '1/1' }
    }

    const [w, h] = format.aspectRatio.split(':').map(Number)
    // Cap the aspect ratio to avoid extreme shapes
    const ratio = w / h
    const cappedRatio = Math.max(0.5, Math.min(2, ratio))

    return { aspectRatio: `${cappedRatio}` }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative flex flex-col items-center p-3 rounded-lg border-2 transition-all duration-200',
        'hover:border-primary/50 hover:bg-accent/50',
        isSelected
          ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
          : 'border-border bg-card',
        className
      )}
    >
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
          <Check className="w-3 h-3 text-primary-foreground" />
        </div>
      )}

      {/* Aspect ratio preview box */}
      <div
        className={cn(
          'w-full max-w-[80px] rounded-md border transition-colors',
          'flex items-center justify-center',
          isSelected ? 'border-primary/50 bg-primary/10' : 'border-muted bg-muted/50',
          'group-hover:border-primary/30 group-hover:bg-primary/5'
        )}
        style={getAspectStyle()}
      >
        <span className="text-[10px] text-muted-foreground font-medium">
          {format.aspectRatio === 'custom' ? '?' : format.aspectRatio}
        </span>
      </div>

      {/* Format info */}
      <div className="mt-2 text-center w-full">
        <p
          className={cn(
            'text-sm font-medium truncate',
            isSelected ? 'text-primary' : 'text-foreground'
          )}
        >
          {format.label}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {format.width} x {format.height}
        </p>
      </div>

      {/* Badges */}
      <div className="mt-2 flex gap-1 flex-wrap justify-center">
        {format.popular && (
          <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4">
            Popular
          </Badge>
        )}
        {format.new && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
            New
          </Badge>
        )}
      </div>
    </button>
  )
}
