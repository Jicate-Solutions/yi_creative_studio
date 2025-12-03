'use client'

import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Check, Palette, Pipette, Sparkles, RefreshCw, AlertCircle, Lightbulb } from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
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

interface ColorTabProps {
  colorConfig: ColorConfig
  brandColors?: BrandColors
  onToggleBrandColors: (enabled: boolean) => void
  onSelectPalette: (paletteId: string | null) => void
  onCustomColorChange: (colors: CustomColors) => void
  eventName?: string
  // AI props
  enableAI?: boolean
  isGenerating?: boolean
  colorMood?: string
  aiError?: string | null
  onToggleAI?: (enabled: boolean) => void
  onRefreshAI?: () => void
  creativeTips?: string[]
}

// Color swatch preview component
function ColorSwatches({
  colors,
  size = 'md',
}: {
  colors: { primary: string; secondary: string; accent: string }
  size?: 'sm' | 'md'
}) {
  const sizeClass = size === 'sm' ? 'w-4 h-4' : 'w-6 h-6'
  return (
    <div className="flex -space-x-1">
      <div
        className={cn(sizeClass, 'rounded-full border-2 border-background')}
        style={{ backgroundColor: colors.primary }}
      />
      <div
        className={cn(sizeClass, 'rounded-full border-2 border-background')}
        style={{ backgroundColor: colors.secondary }}
      />
      <div
        className={cn(sizeClass, 'rounded-full border-2 border-background')}
        style={{ backgroundColor: colors.accent }}
      />
    </div>
  )
}

// Brand colors preview
function BrandColorPreview({ brandColors }: { brandColors: BrandColors }) {
  const hasColors = brandColors.primary_color || brandColors.secondary_color

  if (!hasColors) {
    return (
      <div className="p-4 rounded-lg bg-muted/50 text-center">
        <p className="text-sm text-muted-foreground">
          No brand colors configured for your organization.
        </p>
      </div>
    )
  }

  return (
    <div className="p-4 rounded-lg bg-muted/50 space-y-3">
      <p className="text-sm font-medium">Your Brand Colors</p>
      <div className="flex gap-4">
        {brandColors.primary_color && (
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg border shadow-sm"
              style={{ backgroundColor: brandColors.primary_color }}
            />
            <div>
              <p className="text-xs font-medium">Primary</p>
              <p className="text-xs text-muted-foreground font-mono">
                {brandColors.primary_color}
              </p>
            </div>
          </div>
        )}
        {brandColors.secondary_color && (
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg border shadow-sm"
              style={{ backgroundColor: brandColors.secondary_color }}
            />
            <div>
              <p className="text-xs font-medium">Secondary</p>
              <p className="text-xs text-muted-foreground font-mono">
                {brandColors.secondary_color}
              </p>
            </div>
          </div>
        )}
        {brandColors.accent_color && (
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg border shadow-sm"
              style={{ backgroundColor: brandColors.accent_color }}
            />
            <div>
              <p className="text-xs font-medium">Accent</p>
              <p className="text-xs text-muted-foreground font-mono">
                {brandColors.accent_color}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Preset palette card
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
        'relative p-3 rounded-lg border-2 transition-all hover:shadow-md',
        isSelected
          ? 'border-primary bg-primary/5 shadow-sm'
          : 'border-muted hover:border-muted-foreground/30'
      )}
    >
      {isSelected && (
        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
          <Check className="w-3 h-3 text-primary-foreground" />
        </div>
      )}
      <div className="flex flex-col items-center gap-2">
        <div className="flex -space-x-2">
          <div
            className="w-8 h-8 rounded-full border-2 border-background shadow-sm"
            style={{ backgroundColor: palette.primary }}
          />
          <div
            className="w-8 h-8 rounded-full border-2 border-background shadow-sm"
            style={{ backgroundColor: palette.secondary }}
          />
          <div
            className="w-8 h-8 rounded-full border-2 border-background shadow-sm"
            style={{ backgroundColor: palette.accent }}
          />
        </div>
        <span className="text-xs font-medium text-center">{palette.name}</span>
      </div>
    </button>
  )
}

// Custom color picker
function ColorPicker({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (color: string) => void
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-lg [&::-webkit-color-swatch]:border-2 [&::-webkit-color-swatch]:border-border"
        />
      </div>
      <div className="flex-1 space-y-1">
        <Label className="text-xs">{label}</Label>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="h-8 font-mono text-xs"
        />
      </div>
    </div>
  )
}

export function ColorTab({
  colorConfig,
  brandColors = {},
  onToggleBrandColors,
  onSelectPalette,
  onCustomColorChange,
  eventName,
  // AI props
  enableAI = false,
  isGenerating = false,
  colorMood = '',
  aiError = null,
  onToggleAI,
  onRefreshAI,
  creativeTips = [],
}: ColorTabProps) {
  const palettes = Object.values(COLOR_PALETTES)

  // Get current custom colors or defaults
  const currentCustomColors = colorConfig.customColors || {
    primary: '#3B82F6',
    secondary: '#8B5CF6',
    accent: '#EC4899',
  }

  const handleCustomColorChange = (
    key: keyof CustomColors,
    value: string
  ) => {
    onCustomColorChange({
      ...currentCustomColors,
      [key]: value,
    })
  }

  return (
    <div className="space-y-6">
      {/* AI Toggle for Color Tab */}
      <div className="p-4 rounded-xl border bg-gradient-to-r from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
              <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <Label htmlFor="ai-color-toggle" className="text-sm font-medium cursor-pointer">
                AI Color Suggestions
              </Label>
              <p className="text-xs text-muted-foreground">
                Get AI-powered color mood guidance
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {enableAI && onRefreshAI && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onRefreshAI}
                disabled={isGenerating}
                className="h-8 w-8"
              >
                <RefreshCw className={cn('h-4 w-4', isGenerating && 'animate-spin')} />
              </Button>
            )}
            <Switch
              id="ai-color-toggle"
              checked={enableAI}
              onCheckedChange={(checked) => onToggleAI?.(checked)}
            />
          </div>
        </div>

        {/* AI Suggestions Panel */}
        {enableAI && (
          <div className="mt-4 space-y-3">
            {/* Loading State */}
            {isGenerating && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Generating color suggestions...</span>
              </div>
            )}

            {/* Error State */}
            {aiError && (
              <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4" />
                <span>{aiError}</span>
              </div>
            )}

            {/* Color Mood Guidance */}
            {!isGenerating && colorMood && (
              <div className="p-3 rounded-lg bg-emerald-100/50 dark:bg-emerald-900/30 border border-emerald-200/50 dark:border-emerald-800/30">
                <div className="flex items-start gap-2">
                  <Palette className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                  <div className="text-sm text-emerald-800 dark:text-emerald-200">
                    <span className="font-medium">Color Mood: </span>
                    {colorMood}
                  </div>
                </div>
              </div>
            )}

            {/* Creative Tips */}
            {!isGenerating && creativeTips.length > 2 && (
              <div className="p-3 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30">
                <div className="flex items-start gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5" />
                  <div className="text-xs text-amber-800 dark:text-amber-200">
                    <span className="font-medium">Color Tip: </span>
                    {creativeTips[2] || creativeTips[0]}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Brand Colors Toggle */}
      <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
        <div className="space-y-0.5">
          <Label htmlFor="brand-colors" className="text-sm font-medium">
            Use Brand Colors
          </Label>
          <p className="text-xs text-muted-foreground">
            Apply your organization&apos;s brand colors to the design
          </p>
        </div>
        <Switch
          id="brand-colors"
          checked={colorConfig.useBrandColors}
          onCheckedChange={onToggleBrandColors}
        />
      </div>

      {/* Brand Colors Preview (when enabled) */}
      {colorConfig.useBrandColors && (
        <BrandColorPreview brandColors={brandColors} />
      )}

      {/* Custom Color Selection (when brand colors disabled) */}
      {!colorConfig.useBrandColors && (
        <>
          {/* Preset Palettes */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm font-medium">Color Palettes</Label>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {palettes.map((palette) => (
                <PaletteCard
                  key={palette.id}
                  palette={palette}
                  isSelected={colorConfig.selectedPalette === palette.id}
                  onSelect={() => onSelectPalette(palette.id)}
                />
              ))}
            </div>
          </div>

          {/* Custom Colors Section */}
          <Collapsible className="space-y-2">
            <CollapsibleTrigger className="flex items-center gap-2 w-full p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
              <Pipette className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium flex-1 text-left">
                Custom Colors
              </span>
              {colorConfig.selectedPalette === 'custom' && (
                <Badge variant="secondary" className="text-xs">
                  Active
                </Badge>
              )}
              {colorConfig.customColors && (
                <ColorSwatches
                  colors={colorConfig.customColors}
                  size="sm"
                />
              )}
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-2">
              <div className="p-4 rounded-lg border bg-card/50 space-y-4">
                <ColorPicker
                  label="Primary Color"
                  value={currentCustomColors.primary}
                  onChange={(color) =>
                    handleCustomColorChange('primary', color)
                  }
                />
                <ColorPicker
                  label="Secondary Color"
                  value={currentCustomColors.secondary}
                  onChange={(color) =>
                    handleCustomColorChange('secondary', color)
                  }
                />
                <ColorPicker
                  label="Accent Color"
                  value={currentCustomColors.accent}
                  onChange={(color) =>
                    handleCustomColorChange('accent', color)
                  }
                />
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Selected Colors Preview */}
          {(colorConfig.selectedPalette || colorConfig.customColors) && (
            <div className="p-4 rounded-lg bg-muted/50 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                Selected Colors
              </p>
              <div className="flex gap-3">
                {(() => {
                  const colors =
                    colorConfig.selectedPalette === 'custom'
                      ? colorConfig.customColors
                      : colorConfig.selectedPalette
                        ? COLOR_PALETTES[
                            colorConfig.selectedPalette as ColorPaletteId
                          ]
                        : null

                  if (!colors) return null

                  return (
                    <>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-md border"
                          style={{ backgroundColor: colors.primary }}
                        />
                        <span className="text-xs font-mono">
                          {colors.primary}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-md border"
                          style={{ backgroundColor: colors.secondary }}
                        />
                        <span className="text-xs font-mono">
                          {colors.secondary}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-md border"
                          style={{ backgroundColor: colors.accent }}
                        />
                        <span className="text-xs font-mono">
                          {colors.accent}
                        </span>
                      </div>
                    </>
                  )
                })()}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
