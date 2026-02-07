'use client'

import { useState } from 'react'
import { useCreativeStore } from '@/stores/creative-store'
import { useAuthStore } from '@/stores/auth-store'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Layers, Palette, Paintbrush, Check } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { EnhancedStripCanvas } from '@/components/create/logo-step/enhanced-strip-canvas'
import { HeaderStripSettings } from './HeaderStripSettings'
import { FooterBarSettings } from './FooterBarSettings'
import { InlineStyleSection } from './InlineStyleSection'
import { InlineTypographySection } from './InlineTypographySection'
import { useLogos } from '@/hooks'
import { detectLogoType } from '@/lib/config/logo-locks'
import { ColorPickerCompact } from '@/components/create/color-picker'


// Quick color palette options
// Note: id must match COLOR_PALETTES keys from design-constants.ts or special values (ai, brand, custom)
const COLOR_PRESETS = [
  { id: 'ai', label: 'AI Auto', description: 'AI picks colors based on event context' },
  { id: 'brand', label: 'Yi Brand', description: 'Official Yi blue and orange' },
  { id: 'navy_gold', label: 'Corporate', description: 'Professional blues and grays' },
  { id: 'teal_orange', label: 'Vibrant', description: 'Bold, energetic colors' },
  { id: 'purple_pink', label: 'Elegant', description: 'Sophisticated neutrals' },
  { id: 'green_yellow_cream', label: 'Festive', description: 'Celebratory warm tones' },
  { id: 'custom', label: 'Custom', description: 'Pick your own colors' },
]

// Quick theme options
const THEME_PRESETS = [
  { id: 'ai', label: 'AI Auto', description: 'AI analyzes your event context' },
  { id: 'modern', label: 'Modern', description: 'Clean, contemporary design' },
  { id: 'corporate', label: 'Corporate', description: 'Professional and formal' },
  { id: 'bold', label: 'Bold', description: 'Strong, impactful visuals' },
  { id: 'elegant', label: 'Elegant', description: 'Sophisticated and refined' },
  { id: 'playful', label: 'Playful', description: 'Fun and energetic' },
]

export function LogosStylePanel() {
  const { formData, updateTheme, setColorPalette, setUseBrandColors, setUseBrandFont, setEnhanced4RowEnabled, updateFormData, setCustomColors } = useCreativeStore()
  const { currentOrganization } = useAuthStore()
  const { logos } = useLogos()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [selectedStyle, setSelectedStyle] = useState<string>(
    formData.designData?.style || 'gradient'
  )

  const currentTheme = formData.designData?.theme || 'ai'
  const colorConfig = formData.designData?.colorConfig
  const currentColorMode = colorConfig?.useBrandColors
    ? 'brand'
    : colorConfig?.selectedPalette || 'ai'

  // Custom colors state
  const customColors = colorConfig?.customColors || { primary: '#005B96', secondary: '#FF6B35', accent: '#00A0B0' }
  const isCustomMode = colorConfig?.selectedPalette === 'custom'

  // Brand font from organization config
  const brandFont = (currentOrganization?.brand_config as Record<string, any> | null)?.fontPrimary as string | null

  // Get brand logos count for display
  const brandLogos = logos.filter(l => detectLogoType(l.name || '') === 'brand')
  const enhanced4Row = formData.enhanced4RowStrip
  const logoStripEnabled = enhanced4Row?.enabled !== false

  const handleThemeChange = (themeId: string) => {
    updateTheme(themeId)
  }

  const handleColorChange = (colorId: string) => {
    if (colorId === 'brand') {
      setUseBrandColors(true)
      // Note: Don't call setColorPalette(null) here - setUseBrandColors already clears palette
    } else if (colorId === 'ai') {
      setUseBrandColors(false)
      setColorPalette('ai_auto')
    } else if (colorId === 'custom') {
      setUseBrandColors(false)
      setColorPalette('custom')
      // Initialize with default custom colors if not set
      if (!colorConfig?.customColors) {
        setCustomColors({ primary: '#005B96', secondary: '#FF6B35', accent: '#00A0B0' })
      }
    } else {
      setUseBrandColors(false)
      setColorPalette(colorId)
    }
  }

  return (
    <div className="p-3 space-y-3 overflow-y-auto">
      {/* Logo Strip - Toggle to enable, click to edit when enabled */}
      <div className="rounded-lg border bg-card p-2.5" data-tour="logo-strip">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Logo Strip</span>
          </div>
          <Switch
            checked={logoStripEnabled}
            onCheckedChange={(enabled) => {
              setEnhanced4RowEnabled(enabled)
              // Auto-open dialog when enabling
              if (enabled) {
                setSettingsOpen(true)
              }
            }}
          />
        </div>

        {/* Show edit button when enabled */}
        {logoStripEnabled && (
          <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 w-full h-8 text-xs gap-2"
              >
                <Layers className="h-3.5 w-3.5" />
                Edit Logo Strip & Footer
              </Button>
            </DialogTrigger>
            <DialogContent
              className={cn(
                // Override shadcn defaults: change from grid to flex, disable parent scroll
                "!flex !flex-col !gap-0 !overflow-hidden !p-0",
                // Position: fixed to viewport edges instead of centered
                "!top-[7.5vh] !left-[20px] !right-[20px] !bottom-auto",
                "!translate-x-0 !translate-y-0",
                // Dimensions
                "!w-[calc(100vw-40px)] !max-w-[calc(100vw-40px)] !h-[85vh] !max-h-[85vh]"
              )}
            >
              {/* Grid takes remaining space */}
              <div className="grid grid-cols-3 flex-1 min-h-0 overflow-hidden">
                {/* Panel 1: Header Strip Settings (Left) */}
                <div className="border-r flex flex-col min-h-0 overflow-hidden">
                  <div className="px-3 py-2 border-b bg-card shrink-0">
                    <h3 className="text-sm font-semibold">🔝 Header Strip</h3>
                    <p className="text-[10px] text-muted-foreground">Logos & title at top of poster</p>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2">
                    <HeaderStripSettings />
                  </div>
                </div>

                {/* Panel 2: Live Preview (Center) */}
                <div className="bg-muted/30 flex flex-col min-h-0 overflow-hidden">
                  <div className="px-3 py-2 border-b bg-card shrink-0">
                    <DialogHeader className="p-0">
                      <DialogTitle className="text-sm">Live Preview</DialogTitle>
                    </DialogHeader>
                  </div>
                  <div className="flex-1 overflow-auto p-4 pt-8 flex items-start justify-center">
                    <div className="transform scale-[0.65] origin-top">
                      <EnhancedStripCanvas className="w-[500px]" />
                    </div>
                  </div>
                </div>

                {/* Panel 3: Footer Bar Settings (Right) */}
                <div className="border-l flex flex-col min-h-0 overflow-hidden">
                  <div className="px-3 py-2 border-b bg-card shrink-0">
                    <h3 className="text-sm font-semibold">🔻 Footer Bar</h3>
                    <p className="text-[10px] text-muted-foreground">Branding info at bottom of poster</p>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2">
                    <FooterBarSettings />
                  </div>
                </div>
              </div>

              {/* Fixed footer - ALWAYS visible */}
              <div className="h-[60px] px-4 border-t bg-card flex justify-end items-center shrink-0">
                <Button
                  onClick={() => {
                    setSettingsOpen(false)
                    toast.success('Logo strip settings saved')
                  }}
                  className="gap-2"
                >
                  <Check className="h-4 w-4" />
                  Save & Apply
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Theme - Card style matching Logo Strip */}
      <div className="rounded-lg border bg-card p-2.5" data-tour="theme-selector">
        <div className="flex items-center gap-2 mb-2">
          <Paintbrush className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Theme</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {THEME_PRESETS.map((theme) => (
            <button
              key={theme.id}
              onClick={() => handleThemeChange(theme.id)}
              className={`px-2 py-0.5 text-[11px] rounded-full transition-all ${
                currentTheme === theme.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/60 hover:bg-muted text-foreground'
              }`}
            >
              {theme.label}
            </button>
          ))}
        </div>
      </div>

      {/* Style - Inline style selector */}
      <div className="rounded-lg border bg-card p-2.5">
        <InlineStyleSection
          selectedStyle={selectedStyle}
          onStyleChange={(style) => {
            setSelectedStyle(style)
            updateFormData({
              designData: {
                ...formData.designData,
                style: style,
              },
            })
          }}
        />
      </div>

      {/* Typography - Inline typography controls */}
      <div className="rounded-lg border bg-card p-2.5">
        <InlineTypographySection
          useBrandFont={formData.designData?.colorConfig?.useBrandFont ?? true}
          onToggleBrandFont={(value) => {
            setUseBrandFont(value)
          }}
          brandFont={brandFont}
        />
      </div>

      {/* Colors - Card style matching Logo Strip */}
      <div className="rounded-lg border bg-card p-2.5">
        <div className="flex items-center gap-2 mb-2">
          <Palette className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Colors</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {COLOR_PRESETS.map((color) => (
            <button
              key={color.id}
              onClick={() => handleColorChange(color.id)}
              className={`px-2 py-0.5 text-[11px] rounded-full transition-all ${
                currentColorMode === color.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/60 hover:bg-muted text-foreground'
              }`}
            >
              {color.label}
            </button>
          ))}
        </div>

        {/* Custom Color Pickers - Show when custom is selected */}
        {isCustomMode && (
          <div className="mt-3 pt-3 border-t space-y-2">
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground">Primary</span>
                <ColorPickerCompact
                  value={customColors.primary}
                  onChange={(color) => setCustomColors({ ...customColors, primary: color })}
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground">Secondary</span>
                <ColorPickerCompact
                  value={customColors.secondary}
                  onChange={(color) => setCustomColors({ ...customColors, secondary: color })}
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground">Accent</span>
                <ColorPickerCompact
                  value={customColors.accent}
                  onChange={(color) => setCustomColors({ ...customColors, accent: color })}
                />
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
