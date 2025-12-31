'use client'

import { Label } from '@/components/ui/label'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PhotoPosition, PhotoVerticalPosition } from '@/lib/config/design-constants'

interface PositionGridSelectorProps {
  position?: PhotoPosition
  verticalPosition?: PhotoVerticalPosition
  onChange: (position: PhotoPosition, verticalPosition: PhotoVerticalPosition) => void
}

export function PositionGridSelector({
  position = 'center',
  verticalPosition = 'middle',
  onChange,
}: PositionGridSelectorProps) {
  // 3x5 grid = 15 positions (3 columns × 5 rows)
  const positions = [
    // Row 1 - Top
    { h: 'left' as PhotoPosition, v: 'top' as PhotoVerticalPosition, label: 'Top Left' },
    { h: 'center' as PhotoPosition, v: 'top' as PhotoVerticalPosition, label: 'Top Center' },
    { h: 'right' as PhotoPosition, v: 'top' as PhotoVerticalPosition, label: 'Top Right' },

    // Row 2 - Upper
    { h: 'left' as PhotoPosition, v: 'upper' as PhotoVerticalPosition, label: 'Upper Left' },
    { h: 'center' as PhotoPosition, v: 'upper' as PhotoVerticalPosition, label: 'Upper Center' },
    { h: 'right' as PhotoPosition, v: 'upper' as PhotoVerticalPosition, label: 'Upper Right' },

    // Row 3 - Middle
    { h: 'left' as PhotoPosition, v: 'middle' as PhotoVerticalPosition, label: 'Middle Left' },
    { h: 'center' as PhotoPosition, v: 'middle' as PhotoVerticalPosition, label: 'Center' },
    { h: 'right' as PhotoPosition, v: 'middle' as PhotoVerticalPosition, label: 'Middle Right' },

    // Row 4 - Lower
    { h: 'left' as PhotoPosition, v: 'lower' as PhotoVerticalPosition, label: 'Lower Left' },
    { h: 'center' as PhotoPosition, v: 'lower' as PhotoVerticalPosition, label: 'Lower Center' },
    { h: 'right' as PhotoPosition, v: 'lower' as PhotoVerticalPosition, label: 'Lower Right' },

    // Row 5 - Bottom
    { h: 'left' as PhotoPosition, v: 'bottom' as PhotoVerticalPosition, label: 'Bottom Left' },
    { h: 'center' as PhotoPosition, v: 'bottom' as PhotoVerticalPosition, label: 'Bottom Center' },
    { h: 'right' as PhotoPosition, v: 'bottom' as PhotoVerticalPosition, label: 'Bottom Right' },
  ]

  const isSelected = (h: PhotoPosition, v: PhotoVerticalPosition) =>
    h === position && v === verticalPosition

  const currentPositionLabel = positions.find(p => isSelected(p.h, p.v))?.label || 'Center'

  return (
    <div className="space-y-3">
      <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
        Photo Position
      </Label>
      <p className="text-[11px] text-muted-foreground">
        Click where you want the photo to appear
      </p>

      {/* 3x5 Grid - 15 position buttons */}
      <div className="grid grid-cols-3 gap-2 p-3 rounded-lg bg-muted/30 border border-border">
        {positions.map((pos) => (
          <button
            key={`${pos.h}-${pos.v}`}
            type="button"
            onClick={() => onChange(pos.h, pos.v)}
            className={cn(
              'aspect-square rounded-lg border-2 transition-all duration-200',
              'hover:scale-105 hover:shadow-md flex items-center justify-center',
              isSelected(pos.h, pos.v)
                ? 'border-primary bg-primary/10 ring-2 ring-primary/20 shadow-sm'
                : 'border-border bg-background hover:border-primary/50'
            )}
            title={pos.label}
            aria-label={pos.label}
          >
            {isSelected(pos.h, pos.v) && (
              <Check className="h-4 w-4 text-primary" aria-hidden="true" />
            )}
          </button>
        ))}
      </div>

      {/* Current Selection Label */}
      <p className="text-xs text-center text-muted-foreground">
        Currently: <span className="font-medium text-foreground">
          {currentPositionLabel}
        </span>
      </p>
    </div>
  )
}
