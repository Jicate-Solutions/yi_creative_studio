'use client'

import { useState } from 'react'
import { useCreativeStore } from '@/stores/creative-store'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Layers, Palette, Check, Zap, Wand2, Image as ImageIcon, ChevronRight, Settings2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { EnhancedStripCanvas } from '@/components/create/logo-step/enhanced-strip-canvas'
import { HeaderStripSettings } from './HeaderStripSettings'
import { FooterBarSettings } from './FooterBarSettings'
import { FormatDropdown } from './FormatDropdown'
import { useLogos, useVerticals } from '@/hooks'
import { detectLogoType } from '@/lib/config/logo-locks'
import { ColorPickerCompact } from '@/components/create/color-picker'
import type { AIModel } from '@/types/database.types'

// Color presets with visual swatch data
const COLOR_PRESETS = [
  {
    id: 'ai',
    label: 'AI Auto',
    description: 'AI picks colors based on event context',
    swatches: ['#7c3aed', '#ec4899', '#f59e0b'],
    gradient: 'from-violet-500 via-pink-500 to-amber-400',
  },
  {
    id: 'brand',
    label: 'Yi Brand',
    description: 'Official Yi blue and orange',
    swatches: ['#005B96', '#FF6B35'],
    gradient: null,
  },
  {
    id: 'navy_gold',
    label: 'Corporate',
    description: 'Professional blues and golds',
    swatches: ['#1a2744', '#c9a84c'],
    gradient: null,
  },
  {
    id: 'teal_orange',
    label: 'Vibrant',
    description: 'Bold, energetic colors',
    swatches: ['#0d9488', '#f97316'],
    gradient: null,
  },
  {
    id: 'purple_pink',
    label: 'Elegant',
    description: 'Sophisticated neutrals',
    swatches: ['#7c3aed', '#ec4899'],
    gradient: null,
  },
  {
    id: 'green_yellow_cream',
    label: 'Festive',
    description: 'Celebratory warm tones',
    swatches: ['#16a34a', '#fbbf24'],
    gradient: null,
  },
  {
    id: 'custom',
    label: 'Custom',
    description: 'Pick your own colors',
    swatches: [],
    gradient: 'from-rose-400 via-fuchsia-500 to-indigo-500',
  },
]

interface LogosStylePanelProps {
  models?: AIModel[]
  selectedModel?: AIModel | null
  onModelChange?: (modelId: string) => void
  isModelsLoading?: boolean
  resolution?: string
  onResolutionChange?: (val: string) => void
  thinkingLevel?: 'minimal' | 'High'
  onThinkingLevelChange?: (level: 'minimal' | 'High') => void
  useImageSearch?: boolean
  onImageSearchChange?: (val: boolean) => void
}

// Professional section card wrapper
function SectionCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn(
      "rounded-2xl border border-border/50 bg-card shadow-sm overflow-hidden",
      className
    )}>
      {children}
    </div>
  )
}

// Section header strip inside a card
function SectionHeader({
  icon: Icon,
  label,
  iconColor = 'text-primary',
  iconBg = 'bg-primary/10',
  action,
}: {
  icon: React.ElementType
  label: string
  iconColor?: string
  iconBg?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between px-3.5 pt-3.5 pb-2.5">
      <div className="flex items-center gap-2.5">
        <div className={cn("p-1.5 rounded-lg", iconBg)}>
          <Icon className={cn("h-3.5 w-3.5", iconColor)} />
        </div>
        <span className="text-[11px] font-bold tracking-widest uppercase text-muted-foreground/80">
          {label}
        </span>
      </div>
      {action}
    </div>
  )
}

export function LogosStylePanel({
  models = [],
  selectedModel = null,
  onModelChange,
  isModelsLoading = false,
  resolution = '2K',
  onResolutionChange,
  thinkingLevel = 'minimal',
  onThinkingLevelChange,
  useImageSearch = true,
  onImageSearchChange,
}: LogosStylePanelProps = {}) {
  const { formData, setColorPalette, setUseBrandColors, setEnhanced4RowEnabled, setCustomColors, setCreationMode, selectedVertical, selectVertical } = useCreativeStore()
  const { logos } = useLogos()
  const { verticals } = useVerticals()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const creationMode = formData.creationMode || 'scratch'
  const colorConfig = formData.designData?.colorConfig
  const currentColorMode = colorConfig?.useBrandColors
    ? 'brand'
    : colorConfig?.selectedPalette || 'ai'

  const customColors = colorConfig?.customColors || { primary: '#005B96', secondary: '#FF6B35', accent: '#00A0B0' }
  const isCustomMode = colorConfig?.selectedPalette === 'custom'

  const brandLogos = logos.filter(l => detectLogoType(l.name || '') === 'brand')
  const enhanced4Row = formData.enhanced4RowStrip
  const logoStripEnabled = enhanced4Row?.enabled !== false

  const handleColorChange = (colorId: string) => {
    if (colorId === 'brand') {
      setUseBrandColors(true)
    } else if (colorId === 'ai') {
      setUseBrandColors(false)
      setColorPalette('ai_auto')
    } else if (colorId === 'custom') {
      setUseBrandColors(false)
      setColorPalette('custom')
      if (!colorConfig?.customColors) {
        setCustomColors({ primary: '#005B96', secondary: '#FF6B35', accent: '#00A0B0' })
      }
    } else {
      setUseBrandColors(false)
      setColorPalette(colorId)
    }
  }

  const resolutionOptions = [
    { value: '1K', label: '1K', sublabel: 'Standard', size: '~2MB' },
    { value: '2K', label: '2K', sublabel: 'High-Res', size: '~6MB' },
    { value: '4K', label: '4K', sublabel: 'Ultra', size: '~18MB' },
  ]

  return (
    <TooltipProvider>
    <div className="flex flex-col h-full bg-muted/20">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">

        {/* ── Creative Setup ─────────────────────────── */}
        <SectionCard>
          <SectionHeader icon={Wand2} label="Creative Setup" iconBg="bg-violet-500/10" iconColor="text-violet-500" />
          <div className="px-3 pb-3 space-y-2.5">
            {/* Format selector */}
            <FormatDropdown />

            {/* Mode toggle */}
            <div className="flex items-center p-1 bg-muted/50 rounded-xl border border-border/40">
              {[
                { mode: 'scratch', icon: Wand2, label: 'AI Create' },
                { mode: 'template', icon: ImageIcon, label: 'Template' },
              ].map(({ mode, icon: Icon, label }) => (
                <button
                  key={mode}
                  onClick={() => setCreationMode(mode as 'scratch' | 'template')}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]',
                    creationMode === mode
                      ? 'bg-white text-foreground shadow-sm border border-border/50'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon className={cn("h-3.5 w-3.5", creationMode === mode ? "text-primary" : "")} />
                  {label}
                </button>
              ))}
            </div>

            {/* Vertical — only in Template mode */}
            {creationMode === 'template' && (
              <Select value={selectedVertical?.id || ''} onValueChange={selectVertical}>
                <SelectTrigger className="h-9 text-xs w-full rounded-lg">
                  <SelectValue placeholder="Select Vertical / Membership" />
                </SelectTrigger>
                <SelectContent>
                  {verticals.map((v) => (
                    <SelectItem key={v.id} value={v.id} className="text-xs">
                      {v.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </SectionCard>

        {/* ── AI Engine ──────────────────────────────── */}
        {(models.length > 0 || isModelsLoading) && (
          <SectionCard>
            <SectionHeader icon={Zap} label="AI Engine" iconBg="bg-amber-500/10" iconColor="text-amber-500" />
            <div className="px-3 pb-3">
              {/* Resolution — segmented control */}
              <div className="flex items-center p-1 bg-muted/50 rounded-xl border border-border/40">
                {resolutionOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => onResolutionChange?.(opt.value)}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-semibold transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]',
                      resolution === opt.value
                        ? 'bg-white text-foreground shadow-sm border border-border/50'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <span className={cn(resolution === opt.value ? "text-primary" : "")}>{opt.label}</span>
                    <span className={cn("text-[10px] font-normal", resolution === opt.value ? "text-muted-foreground" : "opacity-50")}>{opt.sublabel}</span>
                  </button>
                ))}
              </div>
            </div>
          </SectionCard>
        )}

        {/* ── Logo Strip ─────────────────────────────── */}
        <SectionCard>
          <SectionHeader
            icon={Layers}
            label="Logo Strip"
            iconBg="bg-blue-500/10"
            iconColor="text-blue-500"
            action={
              <Switch
                checked={logoStripEnabled}
                onCheckedChange={(enabled) => {
                  setEnhanced4RowEnabled(enabled)
                  if (enabled) setSettingsOpen(true)
                }}
              />
            }
          />

          {logoStripEnabled ? (
            <div className="px-3 pb-3">
              <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                <DialogTrigger asChild>
                  <button
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg border border-border/40 bg-muted/30 hover:bg-muted/60 hover:text-foreground text-muted-foreground text-xs font-semibold transition-all duration-200"
                    data-tour="logo-strip"
                  >
                    <div className="flex shrink-0">
                      {brandLogos.length > 0 ? (
                        [...Array(Math.min(brandLogos.length, 3))].map((_, i) => (
                          <div key={i} className="w-3.5 h-3.5 rounded-full bg-primary/40 border-2 border-white" style={{ marginLeft: i > 0 ? '-4px' : 0 }} />
                        ))
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full bg-muted-foreground/20 border-2 border-white" />
                      )}
                    </div>
                    <span className="flex-1 text-left">
                      {brandLogos.length > 0 ? `${brandLogos.length} logo${brandLogos.length > 1 ? 's' : ''} configured` : 'Configure Logo Strip'}
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                  </button>
                </DialogTrigger>
                <DialogContent
                  className={cn(
                    "!flex !flex-col !gap-0 !overflow-hidden !p-0",
                    "!top-[7.5vh] !left-[20px] !right-[20px] !bottom-auto",
                    "!translate-x-0 !translate-y-0",
                    "!w-[calc(100vw-40px)] !max-w-[calc(100vw-40px)] !h-[85vh] !max-h-[85vh]"
                  )}
                >
                  <div className="grid grid-cols-3 flex-1 min-h-0 overflow-hidden">
                    <div className="border-r flex flex-col min-h-0 overflow-hidden">
                      <div className="px-3 py-2 border-b bg-card shrink-0">
                        <h3 className="text-sm font-semibold">🔝 Header Strip</h3>
                        <p className="text-[10px] text-muted-foreground">Logos & title at top of poster</p>
                      </div>
                      <div className="flex-1 overflow-y-auto p-2">
                        <HeaderStripSettings />
                      </div>
                    </div>

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
            </div>
          ) : (
            <div className="px-3 pb-3">
              <p className="text-[11px] text-muted-foreground/60 italic">
                Enable to configure logo placement & footer branding
              </p>
            </div>
          )}
        </SectionCard>

        {/* ── Colors ─────────────────────────────────── */}
        <SectionCard>
          <SectionHeader icon={Palette} label="Color Palette" iconBg="bg-pink-500/10" iconColor="text-pink-500" />
          <div className="px-3 pb-3 space-y-2">
            <div className="grid grid-cols-2 gap-1.5">
              {COLOR_PRESETS.map((color) => {
                const isActive = currentColorMode === color.id
                return (
                  <Tooltip key={color.id}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => handleColorChange(color.id)}
                        className={cn(
                          'flex items-center gap-2 px-2.5 py-2 rounded-lg border text-xs font-semibold transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]',
                          isActive
                            ? 'bg-white border-border/50 shadow-sm text-foreground'
                            : 'bg-muted/30 border-border/40 text-muted-foreground hover:text-foreground hover:bg-muted/60'
                        )}
                      >
                        {/* Color swatch */}
                        <div className="flex shrink-0">
                          {color.gradient ? (
                            <div className={cn("w-4 h-4 rounded-full bg-gradient-to-br shadow-sm", color.gradient)} />
                          ) : (
                            color.swatches.map((swatch, i) => (
                              <div
                                key={i}
                                className="w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm"
                                style={{ backgroundColor: swatch, marginLeft: i > 0 ? '-4px' : 0 }}
                              />
                            ))
                          )}
                        </div>
                        <span className={cn("truncate flex-1 text-left", isActive ? "text-primary" : "")}>
                          {color.label}
                        </span>
                        {isActive && <Check className="w-3 h-3 text-primary shrink-0" />}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="text-xs max-w-[160px]">
                      {color.description}
                    </TooltipContent>
                  </Tooltip>
                )
              })}
            </div>

            {/* Custom Color Pickers */}
            {isCustomMode && (
              <div className="pt-2.5 border-t border-border/40 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Custom Colors</p>
                <div className="grid grid-cols-3 gap-2">
                  {['primary', 'secondary', 'accent'].map((key) => (
                    <div key={key} className="space-y-1">
                      <span className="text-[10px] text-muted-foreground capitalize font-medium">{key}</span>
                      <ColorPickerCompact
                        value={customColors[key as keyof typeof customColors]}
                        onChange={(color) => setCustomColors({ ...customColors, [key]: color })}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </SectionCard>

        {/* Bottom spacer */}
        <div className="h-2" />
      </div>
    </div>
    </TooltipProvider>
  )
}
