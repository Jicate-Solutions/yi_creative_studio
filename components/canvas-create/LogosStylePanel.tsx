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
import { Layers, Palette, Check, X, Zap, Wand2, Image as ImageIcon, Settings2, PanelBottom, LayoutPanelTop, ChevronDown, Eye, Pipette, Sparkles, Loader2, UserRound } from 'lucide-react'
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

// Yi Brand default colors
const YI_BRAND = { primary: '#005B96', secondary: '#FF6B35' }

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
  // Mobile generate button — shown after event details are filled
  showGenerateButton?: boolean
  isGenerating?: boolean
  onGenerate?: () => void
  // When true: natural height, no internal scroll — parent container handles scrolling
  embedded?: boolean
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
  showGenerateButton = false,
  isGenerating = false,
  onGenerate,
  embedded = false,
}: LogosStylePanelProps = {}) {
  const { formData, setColorPalette, setUseBrandColors, setEnhanced4RowEnabled, setCustomColors, setCreationMode, updateFormData, selectedVertical, selectVertical } = useCreativeStore()
  const { logos } = useLogos()
  const { verticals } = useVerticals()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [headerOpen, setHeaderOpen] = useState(true)
  const [footerOpen, setFooterOpen] = useState(true)
  // Mobile dialog active tab: 'header' | 'footer'
  const [mobileTab, setMobileTab] = useState<'header' | 'footer'>('header')
  const creationMode = formData.creationMode || 'scratch'
  const colorConfig = formData.designData?.colorConfig

  // Brand toggle: ON by default (useBrandColors true OR no palette set yet)
  const isBrandMode = colorConfig?.useBrandColors !== false && colorConfig?.selectedPalette !== 'custom'

  const customColors = colorConfig?.customColors || { primary: YI_BRAND.primary, secondary: YI_BRAND.secondary, accent: '' }

  // Local input state for custom color text fields
  const [primaryInput, setPrimaryInput] = useState(customColors.primary || '')
  const [secondaryInput, setSecondaryInput] = useState(customColors.secondary || '')
  const [tertiaryInput, setTertiaryInput] = useState(customColors.accent || '')

  const brandLogos = logos.filter(l => detectLogoType(l.name || '') === 'brand')
  const enhanced4Row = formData.enhanced4RowStrip
  const logoStripEnabled = enhanced4Row?.enabled !== false

  const handleBrandToggle = (enabled: boolean) => {
    if (enabled) {
      setUseBrandColors(true)
      setColorPalette('ai_auto') // clear custom palette
    } else {
      setUseBrandColors(false)
      setColorPalette('custom')
      // Seed inputs with brand colors if nothing set yet
      const p = customColors.primary || YI_BRAND.primary
      const s = customColors.secondary || YI_BRAND.secondary
      setPrimaryInput(p)
      setSecondaryInput(s)
      setTertiaryInput('')
      setCustomColors({ primary: p, secondary: s, accent: '' })
    }
  }

  const handleCustomColorCommit = (key: 'primary' | 'secondary' | 'accent', value: string) => {
    setCustomColors({ ...customColors, [key]: value })
  }

  return (
    <TooltipProvider>
    <div className={embedded ? "flex flex-col bg-muted/10" : "flex flex-col h-full bg-muted/10"}>
      <div className={embedded ? "p-2.5 space-y-2.5" : "flex-1 overflow-y-auto p-2.5 space-y-2.5"}>

        {/* ── Creative Setup ── */}
        <div className="rounded-xl border border-border/40 bg-card overflow-hidden">
          {/* Format + Mode in one compact row */}
          <div className="p-2 space-y-1.5">
            <FormatDropdown />
            <div className="flex items-center p-0.5 bg-muted/60 rounded-lg border border-border/30">
              {[
                { mode: 'scratch',   icon: Wand2,      label: 'AI Create' },
                { mode: 'template',  icon: ImageIcon,  label: 'Template' },
                { mode: 'spotlight', icon: UserRound,  label: 'Spotlight' },
              ].map(({ mode, icon: Icon, label }) => (
                <button
                  key={mode}
                  onClick={() => {
                    setCreationMode(mode as 'scratch' | 'template' | 'spotlight')
                  }}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-semibold transition-all duration-150',
                    creationMode === mode
                      ? 'bg-background text-primary shadow-sm border border-border/40'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon className={cn("h-3.5 w-3.5", creationMode === mode ? "text-primary" : "")} />
                  {label}
                </button>
              ))}
            </div>
            {(creationMode === 'template' || creationMode === 'spotlight') && (
              <Select value={selectedVertical?.id || ''} onValueChange={selectVertical}>
                <SelectTrigger className="h-7 text-[11px] w-full rounded-md">
                  <SelectValue placeholder="Select Vertical" />
                </SelectTrigger>
                <SelectContent>
                  {verticals.map((v) => (
                    <SelectItem key={v.id} value={v.id} className="text-xs">{v.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {creationMode === 'spotlight' && (() => {
              const spotlightTheme = ((formData.formData as any)?.spotlightTheme || 'tricolor') as 'tricolor' | 'brand' | 'gradient'
              const themes = [
                {
                  id: 'tricolor' as const,
                  label: 'Tricolor',
                  colors: ['#FF9933', '#FFFFFF', '#138808'],
                  desc: 'Saffron · White · Green',
                },
                {
                  id: 'brand' as const,
                  label: 'Yi Blue',
                  colors: ['#005B96', '#0071BC'],
                  desc: 'Professional blue',
                },
                {
                  id: 'gradient' as const,
                  label: 'Gradient',
                  colors: ['#005B96', '#1a2332'],
                  desc: 'Blue to navy',
                },
              ]
              return (
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 px-0.5">Background Theme</p>
                  <div className="grid grid-cols-3 gap-1">
                    {themes.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => updateFormData({ spotlightTheme: t.id })}
                        className={cn(
                          'flex flex-col items-center gap-1 p-1.5 rounded-lg border transition-all duration-150 text-center',
                          spotlightTheme === t.id
                            ? 'border-primary bg-primary/5 shadow-sm'
                            : 'border-border/40 hover:border-border/80 hover:bg-muted/30'
                        )}
                      >
                        <div className="flex h-5 w-full rounded overflow-hidden">
                          {t.colors.map((c, i) => (
                            <div key={i} className="flex-1 h-full" style={{ backgroundColor: c }} />
                          ))}
                        </div>
                        <span className={cn('text-[10px] font-semibold leading-tight', spotlightTheme === t.id ? 'text-primary' : 'text-muted-foreground')}>{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )
            })()}

            {/* ── Background Style ── */}
            {(() => {
              const bgStyle = ((formData.formData as any)?.backgroundStyle || 'scene') as string
              const bgStyles = [
                { id: 'scene',      label: 'Realistic',   icon: '🏞' },
                { id: 'abstract',   label: 'Abstract',    icon: '🎨' },
                { id: 'dark',       label: 'Cinematic',   icon: '🎬' },
                { id: 'illustrated',label: 'Illustrated', icon: '✏️' },
                { id: 'bokeh',      label: 'Bokeh',       icon: '✨' },
                { id: 'geometric',  label: 'Geometric',   icon: '🔷' },
                { id: 'texture',    label: 'Textured',    icon: '🪨' },
                { id: 'split',      label: 'Split',       icon: '▧' },
              ]
              return (
                <div className="rounded-xl border border-border/40 bg-card px-2.5 py-2 mt-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 block mb-1.5">Background Style</span>
                  <div className="grid grid-cols-4 gap-1">
                    {bgStyles.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => updateFormData({ backgroundStyle: s.id })}
                        className={cn(
                          'flex flex-col items-center gap-0.5 p-1.5 rounded-lg border transition-all duration-150 text-center',
                          bgStyle === s.id
                            ? 'border-primary bg-primary/5 shadow-sm'
                            : 'border-border/40 hover:border-border/80 hover:bg-muted/30'
                        )}
                      >
                        <span className="text-base leading-none">{s.icon}</span>
                        <span className={cn('text-[9px] font-semibold leading-tight', bgStyle === s.id ? 'text-primary' : 'text-muted-foreground')}>{s.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )
            })()}
          </div>
        </div>

        {/* ── AI Engine — Resolution inline ── */}
        {(models.length > 0 || isModelsLoading) && (
          <div className="rounded-xl border border-border/40 bg-card px-2.5 py-2">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 shrink-0">
                <Zap className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">Resolution</span>
              </div>
              <div className="flex-1 flex items-center p-0.5 bg-muted/50 rounded-lg border border-border/30">
                {(['1K', '2K', '4K'] as const).map((val) => (
                  <button
                    key={val}
                    onClick={() => onResolutionChange?.(val)}
                    className={cn(
                      'flex-1 py-1 rounded-md text-[11px] font-semibold transition-all duration-150',
                      resolution === val
                        ? 'bg-card text-primary shadow-sm border border-border/40'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Logo Strip ── */}
        <div className="rounded-xl border border-border/40 bg-card overflow-hidden">
          {/* Toggle row */}
          <div className="flex items-center justify-between px-2.5 py-2">
            <div className="flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-blue-500" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">Logo Strip</span>
            </div>
            <Switch
              aria-label="Enable logo strip"
              checked={logoStripEnabled}
              onCheckedChange={(enabled) => {
                setEnhanced4RowEnabled(enabled)
                if (enabled) setSettingsOpen(true)
              }}
            />
          </div>

          {logoStripEnabled ? (
            <div className="px-2 pb-2">
              <Dialog open={settingsOpen} onOpenChange={setSettingsOpen} modal={false}>
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
                    <Settings2 className="h-3.5 w-3.5 shrink-0" />
                  </button>
                </DialogTrigger>
                {/* Manual backdrop — needed because modal={false} removes the auto overlay */}
                {settingsOpen && (
                  <div
                    className="fixed inset-0 z-40 bg-black/50"
                    onClick={() => setSettingsOpen(false)}
                  />
                )}
                <DialogContent
                  className={cn(
                    "!flex !flex-col !gap-0 !overflow-hidden !p-0 !z-50",
                    // Hide the shadcn auto-close X button — we render our own in the title row
                    "[&>button.absolute]:hidden",
                    // Mobile: full bottom sheet
                    "!inset-x-0 !bottom-0 !top-auto !left-0 !right-0",
                    "!translate-x-0 !translate-y-0 !rounded-b-none !rounded-t-2xl",
                    "!w-full !max-w-full !h-[92vh] !max-h-[92vh]",
                    // Desktop: centered wide modal
                    "md:!inset-auto md:!top-[7.5vh] md:!left-[20px] md:!right-[20px] md:!bottom-auto",
                    "md:!w-[calc(100vw-40px)] md:!max-w-[calc(100vw-40px)] md:!h-[85vh] md:!max-h-[85vh]",
                    "md:!rounded-xl"
                  )}
                >
                  {/* Mobile drag handle */}
                  <div className="md:hidden flex justify-center pt-3 pb-1 shrink-0">
                    <div className="w-10 h-1 rounded-full bg-muted-foreground/20" />
                  </div>

                  {/* Mobile dialog title row: [X close] title [Apply] */}
                  <div className="md:hidden flex items-center gap-2 px-3 py-2.5 border-b bg-card/80 shrink-0">
                    {/* Close without saving */}
                    <button
                      onClick={() => setSettingsOpen(false)}
                      className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </button>

                    {/* Title */}
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="p-1.5 rounded-lg bg-primary/10 shrink-0">
                        <Layers className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground/60">Configure</p>
                        <p className="text-sm font-semibold text-foreground truncate">Logo Strip Settings</p>
                      </div>
                    </div>

                    {/* Apply & close */}
                    <Button
                      size="sm"
                      onClick={() => {
                        setSettingsOpen(false)
                        toast.success('Logo strip settings saved')
                      }}
                      className="gap-1.5 h-8 px-3 text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm shrink-0"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Apply
                    </Button>
                  </div>

                  {/* ── Desktop: 3-column grid / Mobile: accordion ── */}
                  {/* Desktop layout */}
                  <div className="hidden md:grid md:grid-cols-3 flex-1 min-h-0 overflow-hidden">
                    <div className="border-r flex flex-col min-h-0 overflow-hidden">
                      <div className="px-4 py-3 border-b bg-card/80 shrink-0">
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 rounded-lg bg-blue-500/10">
                            <LayoutPanelTop className="h-3.5 w-3.5 text-blue-500" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground/70">Header Strip</p>
                            <p className="text-xs font-semibold text-foreground">Logos & brand bar</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 overflow-y-auto p-2">
                        <HeaderStripSettings />
                      </div>
                    </div>

                    <div className="bg-muted/30 flex flex-col min-h-0 overflow-hidden">
                      <div className="px-4 py-3 border-b bg-card/80 shrink-0">
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 rounded-lg bg-primary/10">
                            <Eye className="h-3.5 w-3.5 text-primary" />
                          </div>
                          <div>
                            <DialogHeader className="p-0">
                              <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground/70">Preview</p>
                              <DialogTitle className="text-xs font-semibold text-foreground">Live Preview</DialogTitle>
                            </DialogHeader>
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 overflow-auto p-4 pt-8 flex items-start justify-center">
                        <div className="transform scale-[0.65] origin-top">
                          <EnhancedStripCanvas className="w-[500px]" />
                        </div>
                      </div>
                    </div>

                    <div className="border-l flex flex-col min-h-0 overflow-hidden">
                      <div className="px-4 py-3 border-b bg-card/80 shrink-0">
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 rounded-lg bg-orange-500/10">
                            <PanelBottom className="h-3.5 w-3.5 text-orange-500" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground/70">Footer Bar</p>
                            <p className="text-xs font-semibold text-foreground">Branding & contact</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 overflow-y-auto p-2">
                        <FooterBarSettings />
                      </div>
                    </div>
                  </div>

                  {/* Mobile layout — tab bar so both sections are always one tap away */}
                  <div className="md:hidden flex-1 min-h-0 overflow-hidden flex flex-col">

                    {/* Tab bar */}
                    <div className="shrink-0 flex items-center gap-1 px-3 py-2 border-b border-border/40 bg-muted/20">
                      <button
                        onClick={() => setMobileTab('header')}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all duration-150",
                          mobileTab === 'header'
                            ? "bg-blue-500/10 text-blue-600 shadow-sm"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                        )}
                      >
                        <LayoutPanelTop className="h-3.5 w-3.5 shrink-0" />
                        Header Strip
                      </button>
                      <button
                        onClick={() => setMobileTab('footer')}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all duration-150",
                          mobileTab === 'footer'
                            ? "bg-orange-500/10 text-orange-600 shadow-sm"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                        )}
                      >
                        <PanelBottom className="h-3.5 w-3.5 shrink-0" />
                        Footer Bar
                      </button>
                    </div>

                    {/* Tab content — scrollable */}
                    <div className="flex-1 overflow-y-auto">
                      {mobileTab === 'header' ? (
                        <div className="px-3 py-3">
                          <HeaderStripSettings />
                        </div>
                      ) : (
                        <div className="px-3 py-3">
                          <FooterBarSettings />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer — desktop only (mobile Apply is in the title bar above) */}
                  <div className="hidden md:flex px-4 py-3 border-t bg-card/80 justify-between items-center shrink-0">
                    <p className="text-xs text-muted-foreground">Logo strip settings are applied on next generation</p>
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
            <div className="px-2.5 pb-2">
              <p className="text-[10px] text-muted-foreground/50 italic">Enable to configure logo & footer</p>
            </div>
          )}
        </div>

        {/* ── Colors ── */}
        <div className="rounded-xl border border-border/40 bg-card overflow-hidden">
          {/* Header row: icon + label + brand swatches + toggle */}
          <div className="flex items-center justify-between px-2.5 py-2">
            <div className="flex items-center gap-1.5">
              <Palette className="h-3.5 w-3.5 text-pink-500" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">Colors</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="flex">
                <div className="w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: YI_BRAND.primary }} />
                <div className="w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm -ml-1" style={{ backgroundColor: YI_BRAND.secondary }} />
              </div>
              <span className="text-[10px] text-muted-foreground">Yi Brand</span>
              <Switch aria-label="Enable Yi brand colors" checked={isBrandMode} onCheckedChange={handleBrandToggle} />
            </div>
          </div>

          {/* Brand ON: compact confirmed bar */}
          {isBrandMode && (
            <div className="mx-2 mb-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary/5 border border-primary/15">
              <Check className="h-3 w-3 text-primary shrink-0" />
              <span className="text-[11px] text-primary font-medium">Yi Blue #005B96 · Orange #FF6B35</span>
            </div>
          )}

          {/* Brand OFF: 3 compact color rows */}
          {!isBrandMode && (
            <div className="px-2 pb-2 space-y-1.5">
              {([
                { key: 'primary', label: 'Primary', input: primaryInput, setInput: setPrimaryInput, fallback: YI_BRAND.primary, placeholder: '#1a2744 or navy blue' },
                { key: 'secondary', label: 'Secondary', input: secondaryInput, setInput: setSecondaryInput, fallback: YI_BRAND.secondary, placeholder: '#FF6B35 or coral' },
                { key: 'accent', label: 'Tertiary', input: tertiaryInput, setInput: setTertiaryInput, fallback: '#00A0B0', placeholder: '#00A0B0 or teal' },
              ] as const).map(({ key, label, input, setInput, fallback, placeholder }) => (
                <div key={key} className="flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-muted-foreground w-14 shrink-0">{label}</span>
                  <ColorPickerCompact
                    value={input.startsWith('#') && input.length >= 4 ? input : fallback}
                    onChange={(hex) => {
                      setInput(hex)
                      handleCustomColorCommit(key, hex)
                    }}
                    className="!w-7 !h-7 !rounded-md shrink-0"
                  />
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onBlur={() => handleCustomColorCommit(key, input)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCustomColorCommit(key, input)}
                    placeholder={placeholder}
                    className="flex-1 h-7 px-2 rounded-md border border-border/50 bg-background text-[11px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
                  />
                </div>
              ))}
              <p className="text-[9px] text-muted-foreground/40 pt-0.5">Type hex code or color name · click swatch to pick</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile Generate Button — shown after event details are filled ── */}
      {showGenerateButton && (
        <div className="shrink-0 px-3 pb-4 pt-2 border-t border-border/40 bg-card/95 backdrop-blur-sm">
          <Button
            onClick={onGenerate}
            disabled={isGenerating}
            className="w-full h-12 gap-2.5 text-sm font-bold bg-gradient-to-r from-violet-600 via-purple-500 to-indigo-500 hover:from-violet-700 hover:via-purple-600 hover:to-indigo-600 text-white shadow-lg shadow-violet-500/25 active:scale-[0.98] transition-all duration-150 rounded-xl disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate Creative
              </>
            )}
          </Button>
          <p className="text-center text-[10px] text-muted-foreground mt-1.5">
            Takes 30–60 seconds · uses 1 credit
          </p>
        </div>
      )}
    </div>
    </TooltipProvider>
  )
}
