'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Check, ChevronDown, Droplets, Paintbrush, Palette, Sparkles, Brain } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { ColorPicker } from '@/components/create/color-picker'
import {
  COLOR_PALETTES,
  type ColorConfig,
  type CustomColors,
  type ColorPaletteId,
} from '@/lib/config/design-constants'

// Note: Outer Collapsible removed - content is always visible when this section's tab is active
// Custom color picker section still animates in/out when selected

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
    <motion.button
      whileHover={{ scale: 1.02, translateY: -2 }}
      whileTap={{ scale: 0.98 }}
      type="button"
      onClick={onSelect}
      role="option"
      aria-selected={isSelected}
      aria-label={`${palette.name} color palette`}
      className={cn(
        'relative flex flex-col items-center p-4 rounded-xl transition-all duration-200',
        'glass-interactive group',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        isSelected
          ? 'ring-2 ring-primary shadow-lg dark:shadow-primary/10'
          : 'border-none'
      )}
    >
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-lg z-10"
        >
          <Check className="w-3 h-3 text-primary-foreground" />
        </motion.div>
      )}
      <div className="flex -space-x-2.5 mb-3 group-hover:-space-x-1.5 transition-all duration-300">
        {[palette.primary, palette.secondary, palette.accent].map((color, i) => (
          <div
            key={i}
            className="w-9 h-9 rounded-full border-2 border-white dark:border-slate-800 shadow-md transform group-hover:scale-110 transition-transform"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
      <span className="text-[11px] font-bold tracking-tight text-center opacity-90 group-hover:opacity-100 transition-opacity">
        {palette.name}
      </span>
    </motion.button>
  )
}

function AIColorCard({
  isSelected,
  onSelect,
}: {
  isSelected: boolean
  onSelect: () => void
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.02, translateY: -2 }}
      whileTap={{ scale: 0.98 }}
      type="button"
      onClick={onSelect}
      role="option"
      aria-selected={isSelected}
      aria-label="AI automatic color selection"
      className={cn(
        'relative flex flex-col items-center p-4 rounded-xl transition-all duration-200 overflow-hidden group',
        'glass-interactive',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        isSelected
          ? 'ring-2 ring-primary shadow-lg shadow-primary/10'
          : 'border-none'
      )}
    >
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-lg z-10"
        >
          <Check className="w-3 h-3 text-white" />
        </motion.div>
      )}

      {/* Animated Gradient Background Effect */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-tr from-primary/10 via-secondary/10 to-transparent transition-opacity duration-500",
        isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
      )} />

      <div className="relative flex -space-x-2.5 mb-3 group-hover:-space-x-1.5 transition-all duration-300">
        <div className="w-9 h-9 rounded-full border-2 border-white dark:border-slate-800 shadow-md flex items-center justify-center bg-gradient-to-br from-primary to-primary/80 text-white transform group-hover:scale-110 transition-transform">
          <Brain className="w-4 h-4" />
        </div>
        <div className="w-9 h-9 rounded-full border-2 border-white dark:border-slate-800 shadow-md flex items-center justify-center bg-gradient-to-br from-primary/80 to-secondary opacity-90 transform group-hover:scale-110 transition-transform">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div className="w-9 h-9 rounded-full border-2 border-white dark:border-slate-800 shadow-md flex items-center justify-center bg-gradient-to-br from-secondary to-secondary/80 opacity-80 transform group-hover:scale-110 transition-transform">
          <Palette className="w-4 h-4 text-white" />
        </div>
      </div>
      <span className="relative text-[11px] font-bold tracking-tight text-center bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary dark:from-primary dark:to-secondary">
        AI Auto
      </span>
    </motion.button>
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
    <motion.button
      whileHover={{ scale: 1.02, translateY: -2 }}
      whileTap={{ scale: 0.98 }}
      type="button"
      onClick={onSelect}
      role="option"
      aria-selected={isSelected}
      aria-label="Custom color palette"
      className={cn(
        'relative flex flex-col items-center p-4 rounded-xl transition-all duration-200',
        'glass-interactive',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        isSelected
          ? 'ring-2 ring-primary shadow-lg dark:shadow-primary/10'
          : 'border-none'
      )}
    >
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-lg z-10"
        >
          <Check className="w-3 h-3 text-primary-foreground" />
        </motion.div>
      )}
      <div className="flex -space-x-2.5 mb-3 group-hover:-space-x-1.5 transition-all duration-300">
        {customColors ? (
          [customColors.primary, customColors.secondary, customColors.accent].map((color, i) => (
            <div
              key={i}
              className="w-9 h-9 rounded-full border-2 border-white dark:border-slate-800 shadow-md transform group-hover:scale-110 transition-transform"
              style={{ backgroundColor: color }}
            />
          ))
        ) : (
          <div className="w-9 h-9 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center bg-slate-50 dark:bg-slate-800">
            <Paintbrush className="w-4 h-4 text-slate-400" />
          </div>
        )}
      </div>
      <span className="text-[11px] font-bold tracking-tight text-center opacity-90 group-hover:opacity-100 transition-opacity">Custom</span>
    </motion.button>
  )
}

export function ColorSection({
  colorConfig,
  brandColors = {},
  onToggleBrandColors,
  onSelectPalette,
  onCustomColorChange,
  colorMood,
}: ColorSectionProps) {
  const [showAllPalettes, setShowAllPalettes] = useState(false)

  // Debug logging when colors change
  useEffect(() => {
    console.log('[ColorSection] Current ColorConfig:', {
      useBrandColors: colorConfig.useBrandColors,
      selectedPalette: colorConfig.selectedPalette,
      hasCustomColors: !!colorConfig.customColors,
      customColors: colorConfig.customColors,
    })
  }, [colorConfig])

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
    if (colorConfig.selectedPalette === 'ai_auto') {
      return {
        primary: '#005B96',    // Yi Blue (brand primary)
        secondary: '#FF6B35',  // Yi Orange (brand secondary)
        accent: '#00A86B',     // Yi Green (brand accent)
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
    if (colorConfig.selectedPalette === 'ai_auto') return 'AI Auto'
    if (colorConfig.selectedPalette === 'custom') return 'Custom'
    if (colorConfig.selectedPalette) {
      return COLOR_PALETTES[colorConfig.selectedPalette as ColorPaletteId]?.name || 'Palette'
    }
    return 'None'
  }

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10">
            <Droplets className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-tight">Colors</h3>
            <p className="text-xs text-foreground/60">Current: {getDisplayText()}</p>
          </div>
        </div>
        {displayColors && <ColorSwatches colors={displayColors} />}
      </div>

      {/* Brand Colors Toggle */}
      {hasBrandColors && (
        <div className="flex items-center justify-between p-4 rounded-xl glass-panel border-none shadow-sm dark:bg-white/5">
          <div className="flex items-center gap-4">
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
              <Label className="text-sm font-semibold cursor-pointer">Use Brand Colors</Label>
              <p className="text-xs text-foreground/60">Sync with organization profile</p>
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
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-primary/5 dark:bg-primary/10 shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs text-foreground/80 dark:text-foreground/70">
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
          <div
            className="grid grid-cols-2 sm:grid-cols-4 gap-2"
            role="listbox"
            aria-label="Color palette options"
          >
            {/* AI Auto Option */}
            <AIColorCard
              isSelected={colorConfig.selectedPalette === 'ai_auto'}
              onSelect={() => onSelectPalette('ai_auto')}
            />

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
          {palettes.length > 3 && (
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
                  +{palettes.length - 3} more palettes
                  <ChevronDown className="ml-1 h-4 w-4" />
                </>
              )}
            </Button>
          )}

          {/* Custom Color Picker - animates in when custom is selected */}
          {colorConfig.selectedPalette === 'custom' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 rounded-2xl glass-panel border-none shadow-lg mt-4 space-y-4"
            >
              <div className="flex items-center gap-2">
                <Paintbrush className="h-4 w-4 text-primary" />
                <Label className="text-sm font-bold tracking-tight">Fine-tune Colors</Label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                {(['primary', 'secondary', 'accent'] as const).map((colorType) => (
                  <ColorPicker
                    key={colorType}
                    label={colorType}
                    value={colorConfig.customColors?.[colorType] || (colorType === 'primary' ? '#1B998B' : colorType === 'secondary' ? '#FF6B35' : '#3366FF')}
                    onChange={(color) => onCustomColorChange({
                      primary: colorConfig.customColors?.primary || '#1B998B',
                      secondary: colorConfig.customColors?.secondary || '#FF6B35',
                      accent: colorConfig.customColors?.accent || '#3366FF',
                      [colorType]: color,
                    })}
                    brandColors={brandColors}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  )
}
