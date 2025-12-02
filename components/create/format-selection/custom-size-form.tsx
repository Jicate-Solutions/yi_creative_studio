'use client'

import { useState, useEffect } from 'react'
import { Ruler, Check } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'

interface CustomSizeFormProps {
  customDimensions: { width: number; height: number } | null
  onApply: (width: number, height: number) => void
  onClear: () => void
  className?: string
}

// Common presets for quick selection
const PRESET_SIZES = [
  { label: 'HD', width: 1920, height: 1080 },
  { label: '4K', width: 3840, height: 2160 },
  { label: 'Square', width: 1080, height: 1080 },
  { label: 'A4', width: 2480, height: 3508 },
]

/**
 * Custom size input form
 */
export function CustomSizeForm({
  customDimensions,
  onApply,
  onClear,
  className,
}: CustomSizeFormProps) {
  const [isOpen, setIsOpen] = useState(!!customDimensions)
  const [width, setWidth] = useState(customDimensions?.width?.toString() || '1080')
  const [height, setHeight] = useState(customDimensions?.height?.toString() || '1080')
  const [error, setError] = useState<string | null>(null)

  // Sync with external dimensions
  useEffect(() => {
    if (customDimensions) {
      setWidth(customDimensions.width.toString())
      setHeight(customDimensions.height.toString())
      setIsOpen(true)
    }
  }, [customDimensions])

  const validateAndApply = () => {
    const w = parseInt(width, 10)
    const h = parseInt(height, 10)

    if (isNaN(w) || isNaN(h)) {
      setError('Please enter valid numbers')
      return
    }

    if (w < 100 || h < 100) {
      setError('Minimum size is 100x100 px')
      return
    }

    if (w > 10000 || h > 10000) {
      setError('Maximum size is 10000x10000 px')
      return
    }

    setError(null)
    onApply(w, h)
  }

  const handlePreset = (preset: (typeof PRESET_SIZES)[0]) => {
    setWidth(preset.width.toString())
    setHeight(preset.height.toString())
    setError(null)
    onApply(preset.width, preset.height)
  }

  const handleClear = () => {
    setWidth('1080')
    setHeight('1080')
    setError(null)
    onClear()
  }

  const isActive = customDimensions !== null

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className={className}>
      <CollapsibleTrigger asChild>
        <Button
          variant={isActive ? 'default' : 'outline'}
          className="w-full justify-between gap-2"
        >
          <div className="flex items-center gap-2">
            <Ruler className="w-4 h-4" />
            <span>Custom Size</span>
          </div>
          {isActive && (
            <span className="text-xs opacity-80">
              {customDimensions?.width} x {customDimensions?.height} px
            </span>
          )}
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className="mt-3 space-y-4 p-4 border rounded-lg bg-card">
        {/* Presets */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Quick presets</Label>
          <div className="flex flex-wrap gap-2">
            {PRESET_SIZES.map((preset) => (
              <Button
                key={preset.label}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handlePreset(preset)}
                className="text-xs"
              >
                {preset.label}
                <span className="ml-1 text-muted-foreground">
                  ({preset.width}x{preset.height})
                </span>
              </Button>
            ))}
          </div>
        </div>

        {/* Dimension inputs */}
        <div className="flex items-end gap-3">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="custom-width" className="text-xs">
              Width (px)
            </Label>
            <Input
              id="custom-width"
              type="number"
              value={width}
              onChange={(e) => setWidth(e.target.value)}
              min={100}
              max={10000}
              placeholder="1080"
            />
          </div>

          <span className="pb-2 text-muted-foreground">x</span>

          <div className="flex-1 space-y-1.5">
            <Label htmlFor="custom-height" className="text-xs">
              Height (px)
            </Label>
            <Input
              id="custom-height"
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              min={100}
              max={10000}
              placeholder="1080"
            />
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {/* Actions */}
        <div className="flex gap-2">
          <Button type="button" onClick={validateAndApply} className="flex-1">
            <Check className="w-4 h-4 mr-2" />
            Apply Size
          </Button>
          {isActive && (
            <Button type="button" variant="outline" onClick={handleClear}>
              Clear
            </Button>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
