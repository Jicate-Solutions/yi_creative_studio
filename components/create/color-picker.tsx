'use client'

import { useState, useEffect, useCallback } from 'react'
import { HexColorPicker, HexColorInput } from 'react-colorful'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Palette, Droplets, Hash } from 'lucide-react'
import { COLOR_PALETTES, type ColorPaletteId } from '@/lib/config/design-constants'

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  label?: string
  brandColors?: {
    primary_color?: string | null
    secondary_color?: string | null
    accent_color?: string | null
  }
  className?: string
  disabled?: boolean
}

// Preset color swatches for quick access
const QUICK_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
  '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788'
]

export function ColorPicker({
  value,
  onChange,
  label,
  brandColors,
  className,
  disabled = false
}: ColorPickerProps) {
  const [color, setColor] = useState(value)
  const [isOpen, setIsOpen] = useState(false)

  // Sync with external value changes
  useEffect(() => {
    setColor(value)
  }, [value])

  // Debounced onChange to avoid excessive updates
  const handleColorChange = useCallback((newColor: string) => {
    setColor(newColor)
    onChange(newColor)
  }, [onChange])

  // Brand colors array (filter out null/undefined)
  const brandColorsList = brandColors ? [
    brandColors.primary_color,
    brandColors.secondary_color,
    brandColors.accent_color,
  ].filter((c): c is string => !!c) : []

  // Preset palettes - extract colors from COLOR_PALETTES
  const paletteColors = Object.values(COLOR_PALETTES).flatMap(palette => [
    palette.primary,
    palette.secondary,
    palette.accent
  ]).filter((c, i, arr) => arr.indexOf(c) === i) // Remove duplicates

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label className="text-xs capitalize text-muted-foreground">
          {label}
        </Label>
      )}

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-full justify-start text-left font-normal gap-3',
              !color && 'text-muted-foreground'
            )}
            disabled={disabled}
          >
            <div
              className="w-6 h-6 rounded-md border-2 border-white shadow-sm ring-1 ring-black/10"
              style={{ backgroundColor: color }}
            />
            <span className="flex-1 text-xs font-mono uppercase">{color}</span>
            <Palette className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className="w-80 p-0"
          align="start"
          side="bottom"
        >
          <Tabs defaultValue="picker" className="w-full">
            <TabsList className="grid w-full grid-cols-3 rounded-b-none">
              <TabsTrigger value="picker" className="text-xs gap-1.5">
                <Droplets className="h-3.5 w-3.5" />
                Picker
              </TabsTrigger>
              {brandColorsList.length > 0 && (
                <TabsTrigger value="brand" className="text-xs gap-1.5">
                  <Palette className="h-3.5 w-3.5" />
                  Brand
                </TabsTrigger>
              )}
              <TabsTrigger value="presets" className="text-xs gap-1.5">
                <Hash className="h-3.5 w-3.5" />
                Presets
              </TabsTrigger>
            </TabsList>

            {/* Color Picker Tab */}
            <TabsContent value="picker" className="p-4 space-y-4 mt-0">
              <div className="space-y-3">
                {/* Main Color Picker */}
                <div className="flex justify-center">
                  <HexColorPicker
                    color={color}
                    onChange={handleColorChange}
                    style={{ width: '100%', height: '180px' }}
                  />
                </div>

                {/* Hex Input */}
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <HexColorInput
                      color={color}
                      onChange={handleColorChange}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 font-mono uppercase"
                      prefixed
                    />
                  </div>
                  <div
                    className="w-12 h-9 rounded-md border-2 border-white shadow-sm ring-1 ring-black/10"
                    style={{ backgroundColor: color }}
                  />
                </div>

                {/* Quick Colors */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Quick Colors</Label>
                  <div className="grid grid-cols-10 gap-1.5">
                    {QUICK_COLORS.map((quickColor) => (
                      <button
                        key={quickColor}
                        type="button"
                        className={cn(
                          'w-full aspect-square rounded-md border-2 transition-all hover:scale-110',
                          color.toUpperCase() === quickColor.toUpperCase()
                            ? 'border-primary ring-2 ring-primary/20'
                            : 'border-white hover:border-primary/50'
                        )}
                        style={{ backgroundColor: quickColor }}
                        onClick={() => handleColorChange(quickColor)}
                        title={quickColor}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Brand Colors Tab */}
            {brandColorsList.length > 0 && (
              <TabsContent value="brand" className="p-4 space-y-3 mt-0">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    Your Organization Colors
                  </Label>
                  <div className="grid grid-cols-3 gap-3">
                    {brandColorsList.map((brandColor, index) => (
                      <button
                        key={index}
                        type="button"
                        className={cn(
                          'group relative flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all hover:shadow-md',
                          color.toUpperCase() === brandColor.toUpperCase()
                            ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                            : 'border-muted hover:border-primary/50 bg-muted/30'
                        )}
                        onClick={() => handleColorChange(brandColor)}
                      >
                        <div
                          className="w-full aspect-square rounded-md border-2 border-white shadow-sm"
                          style={{ backgroundColor: brandColor }}
                        />
                        <span className="text-[10px] font-mono text-muted-foreground uppercase">
                          {brandColor}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </TabsContent>
            )}

            {/* Preset Palettes Tab */}
            <TabsContent value="presets" className="p-4 space-y-3 mt-0 max-h-[300px] overflow-y-auto">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Palette Colors
                </Label>
                <div className="grid grid-cols-8 gap-1.5">
                  {paletteColors.map((paletteColor, index) => (
                    <button
                      key={`${paletteColor}-${index}`}
                      type="button"
                      className={cn(
                        'w-full aspect-square rounded-md border-2 transition-all hover:scale-110',
                        color.toUpperCase() === paletteColor.toUpperCase()
                          ? 'border-primary ring-2 ring-primary/20'
                          : 'border-white hover:border-primary/50'
                      )}
                      style={{ backgroundColor: paletteColor }}
                      onClick={() => handleColorChange(paletteColor)}
                      title={paletteColor}
                    />
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </PopoverContent>
      </Popover>
    </div>
  )
}

// Compact version for inline use
export function ColorPickerCompact({
  value,
  onChange,
  className,
  disabled = false
}: Omit<ColorPickerProps, 'label' | 'brandColors'>) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'w-10 h-10 rounded-lg border-2 transition-all hover:scale-105 hover:border-primary/50 disabled:opacity-50 disabled:cursor-not-allowed',
            'border-white shadow-sm ring-1 ring-black/10',
            className
          )}
          style={{ backgroundColor: value }}
          disabled={disabled}
          title={value}
        />
      </PopoverTrigger>

      <PopoverContent className="w-64 p-3" align="start">
        <div className="space-y-3">
          <HexColorPicker
            color={value}
            onChange={onChange}
            style={{ width: '100%', height: '150px' }}
          />
          <div className="flex items-center gap-2">
            <HexColorInput
              color={value}
              onChange={onChange}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 font-mono uppercase"
              prefixed
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
