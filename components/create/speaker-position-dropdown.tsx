'use client'

import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { PhotoPosition, PhotoVerticalPosition } from '@/lib/config/design-constants'

// Combined position type for simpler UX
export type CombinedPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'middle-left'
  | 'middle-center'
  | 'middle-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'

interface SpeakerPositionDropdownProps {
  position?: PhotoPosition
  verticalPosition?: PhotoVerticalPosition
  onChange: (position: PhotoPosition, verticalPosition: PhotoVerticalPosition) => void
  disabled?: boolean
}

// Map combined position to separate horizontal and vertical
function splitPosition(combined: CombinedPosition): {
  position: PhotoPosition
  verticalPosition: PhotoVerticalPosition
} {
  const [vertical, horizontal] = combined.split('-') as [string, string]

  // Map vertical names
  const verticalMap: Record<string, PhotoVerticalPosition> = {
    top: 'top',
    middle: 'middle',
    bottom: 'lower', // User-friendly "bottom" maps to "lower" (65% from top)
  }

  // Map horizontal names
  const horizontalMap: Record<string, PhotoPosition> = {
    left: 'left',
    center: 'center',
    right: 'right',
  }

  return {
    position: horizontalMap[horizontal] || 'center',
    verticalPosition: verticalMap[vertical] || 'lower',
  }
}

// Map separate positions to combined
function combinePosition(
  position: PhotoPosition | undefined,
  verticalPosition: PhotoVerticalPosition | undefined
): CombinedPosition {
  const h = position || 'center'
  const v = verticalPosition || 'lower'

  // Map vertical position to user-friendly names
  const verticalName = v === 'lower' || v === 'bottom' ? 'bottom' : v === 'upper' || v === 'top' ? 'top' : 'middle'

  return `${verticalName}-${h}` as CombinedPosition
}

const POSITION_OPTIONS: Array<{ value: CombinedPosition; label: string }> = [
  { value: 'top-left', label: 'Top Left' },
  { value: 'top-center', label: 'Top Center' },
  { value: 'top-right', label: 'Top Right' },
  { value: 'middle-left', label: 'Middle Left' },
  { value: 'middle-center', label: 'Center' },
  { value: 'middle-right', label: 'Middle Right' },
  { value: 'bottom-left', label: 'Bottom Left' },
  { value: 'bottom-center', label: 'Bottom Center' },
  { value: 'bottom-right', label: 'Bottom Right' },
]

// Mini preview component showing where photos will appear
function PositionPreview({ position }: { position: CombinedPosition }) {
  const [vertical, horizontal] = position.split('-')

  // Map position to CSS positioning
  const getPositionClasses = () => {
    const classes: string[] = []

    // Vertical alignment
    if (vertical === 'top') classes.push('items-start')
    else if (vertical === 'bottom') classes.push('items-end')
    else classes.push('items-center')

    // Horizontal alignment
    if (horizontal === 'left') classes.push('justify-start')
    else if (horizontal === 'right') classes.push('justify-end')
    else classes.push('justify-center')

    return classes.join(' ')
  }

  return (
    <div className="w-10 h-14 bg-muted/50 border border-border rounded relative overflow-hidden flex">
      <div className={cn('flex w-full h-full p-1', getPositionClasses())}>
        <div className="w-2 h-2 rounded-full bg-primary/80" />
      </div>
    </div>
  )
}

export function SpeakerPositionDropdown({
  position,
  verticalPosition,
  onChange,
  disabled = false,
}: SpeakerPositionDropdownProps) {
  const currentValue = combinePosition(position, verticalPosition)

  const handleChange = (value: string) => {
    const { position: newPos, verticalPosition: newVertical } = splitPosition(
      value as CombinedPosition
    )
    onChange(newPos, newVertical)
  }

  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium">Photo Position</Label>
      <div className="flex gap-3 items-start">
        {/* Dropdown */}
        <div className="flex-1">
          <Select value={currentValue} onValueChange={handleChange} disabled={disabled}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Select position" />
            </SelectTrigger>
            <SelectContent>
              {POSITION_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Mini Preview */}
        <PositionPreview position={currentValue} />
      </div>
      <p className="text-[11px] text-muted-foreground">
        Where the speaker photo(s) will appear
      </p>
    </div>
  )
}
