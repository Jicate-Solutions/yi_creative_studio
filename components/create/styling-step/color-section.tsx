'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Check, ChevronDown, Droplets, Paintbrush, Palette, Sparkles } from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  COLOR_PALETTES,
  type ColorConfig,
  type CustomColors,
  type ColorPaletteId,
} from '@/lib/config/design-constants'

interface BrandColors {
  primary_color?: string | null
  secondary_color?: string | null
  accent_color?: string | null
}

interface ColorSectionProps {
  colorConfig: ColorConfig
  brandColors?: BrandColors
  onToggleBrandColors: (enabled: boolean) => void
  onSelectPalette: (paletteId: string | null) => void
  onCustomColorChange: (colors: CustomColors) => void
  colorMood?: string
  defaultOpen?: boolean
}

function ColorSwatches({ colors }: { colors: { primary: string; secondary: string; accent: string } }) {
  return (
    <div className="flex -space-x-1.5">
      <div
        className="w-5 h-5 rounded-full border-2 border-white shadow-sm"
        style={{ backgroundColor: colors.primary }}
      />
      <div
        className="w-5 h-5 rounded-full border-2 border-white shadow-sm"
        style={{ backgroundColor: colors.secondary }}
      />
      <div
        className="w-5 h-5 rounded-full border-2 border-white shadow-sm"
        style={{ backgroundColor: colors.accent }}
      />
    </div>
  )
}

function PaletteCard({
  palette,
  isSelected,
  onSelect,
}: {
  palette: (typeof COLOR_PALETTES)[ColorPaletteId]
  isSelected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'relative flex flex-col items-center p-3 rounded-xl border-2 transition-all',
        'hover:shadow-md hover:scale-[1.02]',
        isSelected
          ? 'border-primary bg-primary/5 shadow-md ring-2 ring-primary/20'
          : 'border-transparent bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm hover:border-primary/30'
      )}
    >
      {isSelected && (
        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-lg">
          <Check className="w-3 h-3 text-primary-foreground" />
        </div>
      )}
      <div className="flex -space-x-2 mb-2">
        {[palette.primary, palette.secondary, palette.accent].map((color, i) => (
          <div
            key={i}
            className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
      <span className="text-xs font-medium text-center">{palette.name}</span>
    </button>
  )
}

function CustomPaletteCard({
  isSelected,
  customColors,
  onSelect,
}: {
  isSelected: boolean
  customColors: CustomColors | null
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'relative flex flex-col items-center p-3 rounded-xl border-2 transition-all',
        'hover:shadow-md hover:scale-[1.02]',
        isSelected
          ? 'border-primary bg-primary/5 shadow-md ring-2 ring-primary/20'
          : 'border-dashed border-slate-300 dark:border-slate-600 bg-white/60 dark:bg-slate-900/60 hover:border-primary/30'
      )}
    >
      {isSelected && (
        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-lg">
          <Check className="w-3 h-3 text-primary-foreground" />
        </div>
      )}
      <div className="flex -space-x-2 mb-2">
        {customColors ? (
          [customColors.primary, customColors.secondary, customColors.accent].map((color, i) => (
            <div
              key={i}
              className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
              style={{ backgroundColor: color }}
            />
          ))
        ) : (
          <div className="w-8 h-8 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center bg-slate-50 dark:bg-slate-800">
            <Paintbrush className="w-4 h-4 text-slate-400" />
          </div>
        )}
      </div>
      <span className="text-xs font-medium text-center">Custom</span>
    </button>
  )
}

export function ColorSection({
  colorConfig,
  brandColors = {},
  onToggleBrandColors,
  onSelectPalette,
  onCustomColorChange,
  colorMood,
  defaultOpen = false,
}: ColorSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [showAllPalettes, setShowAllPalettes] = useState(false)

  const hasBrandColors = brandColors.primary_color || brandColors.secondary_color
  const palettes = Object.values(COLOR_PALETTES)
  const displayedPalettes = showAllPalettes ? palettes : palettes.slice(0, 4)

  // Get display colors for header
  const getDisplayColors = () => {
    if (colorConfig.useBrandColors && hasBrandColors) {
      return {
        primary: brandColors.primary_color || '#000',
        secondary: brandColors.secondary_color || '#666',
        accent: brandColors.accent_color || '#999',
      }
    }
    if (colorConfig.selectedPalette === 'custom' && colorConfig.customColors) {
      return colorConfig.customColors
    }
    if (colorConfig.selectedPalette && colorConfig.selectedPalette !== 'custom') {
      return COLOR_PALETTES[colorConfig.selectedPalette as ColorPaletteId]
    }
    return null
  }

  const displayColors = getDisplayColors()

  // Get display text for header
  const getDisplayText = () => {
    if (colorConfig.useBrandColors) return 'Brand Colors'
    if (colorConfig.selectedPalette === 'custom') return 'Custom Colors'
    if (colorConfig.selectedPalette) {
      return COLOR_PALETTES[colorConfig.selectedPalette as ColorPaletteId]?.name || 'Palette'
    }
    return 'AI Color Mood'
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="w-full">
        <div
          className={cn(
            'flex items-center justify-between p-4 rounded-xl transition-all',
            'bg-gradient-to-br from-slate-50/80 to-white/90 dark:from-slate-900/80 dark:to-slate-800/90',
            'border border-slate-200/50 dark:border-slate-700/50',
            'hover:shadow-md cursor-pointer',
            isOpen && 'shadow-sm bg-slate-50/90 dark:bg-slate-800/90'
          )}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/50 dark:to-teal-900/50">
              <Droplets className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-left">
              <h3 className="text-sm font-semibold">Colors</h3>
              <p className="text-xs text-muted-foreground">{getDisplayText()}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {displayColors && <ColorSwatches colors={displayColors} />}
            <ChevronDown
              className={cn(
                'h-5 w-5 text-muted-foreground transition-transform duration-200',
                isOpen && 'rotate-180'
              )}
            />
          </div>
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent className="mt-3">
        <div className="space-y-4 p-4 rounded-xl bg-white/50 dark:bg-slate-900/50 border border-slate-200/30 dark:border-slate-700/30 backdrop-blur-sm">
          {/* Brand Colors Toggle */}
          {hasBrandColors && (
            <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200/50 dark:border-slate-700/50 bg-white/60 dark:bg-slate-900/60">
              <div className="flex items-center gap-3">
                {brandColors.primary_color && (
                  <ColorSwatches
                    colors={{
                      primary: brandColors.primary_color,
                      secondary: brandColors.secondary_color || '#666',
                      accent: brandColors.accent_color || '#999',
                    }}
                  />
                )}
                <div>
                  <Label className="text-sm font-medium cursor-pointer">Use Brand Colors</Label>
                  <p className="text-xs text-muted-foreground">Your organization colors</p>
                </div>
              </div>
              <Switch
                checked={colorConfig.useBrandColors}
                onCheckedChange={onToggleBrandColors}
              />
            </div>
          )}

          {/* Palette Selection (when not using brand colors) */}
          {!colorConfig.useBrandColors && (
            <div className="space-y-3">
              {/* AI Mood hint */}
              {colorMood && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200/30 dark:border-emerald-800/30">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs text-emerald-800 dark:text-emerald-200">
                    <span className="font-medium">AI suggests: </span>{colorMood}
                  </span>
                </div>
              )}

              {/* Palette header */}
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium">Choose Palette</Label>
              </div>

              {/* Palette Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {displayedPalettes.map((palette) => (
                  <PaletteCard
                    key={palette.id}
                    palette={palette}
                    isSelected={colorConfig.selectedPalette === palette.id}
                    onSelect={() => onSelectPalette(palette.id)}
                  />
                ))}
                {/* Custom Color Option */}
                <CustomPaletteCard
                  isSelected={colorConfig.selectedPalette === 'custom'}
                  customColors={colorConfig.customColors}
                  onSelect={() => onSelectPalette('custom')}
                />
              </div>

              {/* See All / Show Less button */}
              {palettes.length > 4 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllPalettes(!showAllPalettes)}
                  className="w-full text-muted-foreground hover:text-foreground"
                >
                  {showAllPalettes ? (
                    <>
                      Show Less
                      <ChevronDown className="ml-1 h-4 w-4 rotate-180" />
                    </>
                  ) : (
                    <>
                      +{palettes.length - 4} more palettes
                      <ChevronDown className="ml-1 h-4 w-4" />
                    </>
                  )}
                </Button>
              )}

              {/* Custom Color Picker */}
              {colorConfig.selectedPalette === 'custom' && (
                <div className="p-4 rounded-xl border border-slate-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-900/80 space-y-3">
                  <div className="flex items-center gap-2">
                    <Paintbrush className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-sm font-medium">Pick Your Colors</Label>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {(['primary', 'secondary', 'accent'] as const).map((colorType) => (
                      <div key={colorType} className="space-y-2">
                        <Label className="text-xs capitalize text-muted-foreground">{colorType}</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="color"
                            value={colorConfig.customColors?.[colorType] || (colorType === 'primary' ? '#1B998B' : colorType === 'secondary' ? '#FF6B35' : '#3366FF')}
                            onChange={(e) => onCustomColorChange({
                              primary: colorConfig.customColors?.primary || '#1B998B',
                              secondary: colorConfig.customColors?.secondary || '#FF6B35',
                              accent: colorConfig.customColors?.accent || '#3366FF',
                              [colorType]: e.target.value,
                            })}
                            className="w-10 h-10 p-1 cursor-pointer rounded-lg border-2 hover:border-primary/50 transition-colors"
                          />
                          <span className="text-xs font-mono text-muted-foreground uppercase">
                            {colorConfig.customColors?.[colorType] || (colorType === 'primary' ? '#1B998B' : colorType === 'secondary' ? '#FF6B35' : '#3366FF')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
