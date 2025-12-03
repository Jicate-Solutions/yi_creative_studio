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
        // Base format card with Canva-style effects
        'format-card-canva group relative flex flex-col items-center p-4 rounded-xl',
        'hover:shadow-[0_12px_32px_rgba(0,91,150,0.2)] hover:-translate-y-2',
        isSelected && 'selected',
        className
      )}
    >
      {/* Selection indicator - gradient checkmark badge */}
      {isSelected && (
        <div className="selection-checkmark z-10">
          <Check className="w-3.5 h-3.5" />
        </div>
      )}

      {/* Aspect ratio preview box - Enhanced */}
      <div
        className={cn(
          'w-full max-w-[90px] rounded-lg border-2 transition-all duration-300',
          'flex items-center justify-center shadow-sm',
          isSelected
            ? 'border-[#005B96]/60 bg-gradient-to-br from-[#005B96]/10 to-[#1B998B]/10'
            : 'border-muted bg-gradient-to-br from-muted/30 to-muted/50',
          'group-hover:border-[#005B96]/40 group-hover:bg-gradient-to-br group-hover:from-[#005B96]/5 group-hover:to-[#1B998B]/5'
        )}
        style={getAspectStyle()}
      >
        <span className={cn(
          'text-[11px] font-semibold transition-colors',
          isSelected ? 'text-[#005B96]' : 'text-muted-foreground',
          'group-hover:text-[#005B96]'
        )}>
          {format.aspectRatio === 'custom' ? '?' : format.aspectRatio}
        </span>
      </div>

      {/* Format info - Enhanced typography */}
      <div className="mt-3 text-center w-full">
        <p
          className={cn(
            'text-sm font-semibold truncate transition-colors',
            isSelected ? 'text-[#005B96]' : 'text-foreground',
            'group-hover:text-[#005B96]'
          )}
        >
          {format.label}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {format.width} x {format.height}
        </p>
      </div>

      {/* Badges - Canva style */}
      <div className="mt-3 flex gap-1.5 flex-wrap justify-center">
        {format.popular && (
          <span className="badge-popular">Popular</span>
        )}
        {format.new && (
          <Badge variant="secondary" className="text-[10px] px-2 py-0.5 rounded-full">
            New
          </Badge>
        )}
      </div>
    </button>
  )
}
