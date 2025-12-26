'use client'

import { useState, useMemo } from 'react'
import { useCreativeStore } from '@/stores/creative-store'
import { useLogos } from '@/hooks'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { X, Image as ImageIcon, Check, Wand2, MousePointerClick, LayoutGrid, Circle, Square, RectangleHorizontal, CircleOff, Trash2, Settings2, Palette, Sparkles, Loader2, Rows3, Info, RotateCcw } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { LOGO_POSITIONS, LOGO_CATEGORIES, type LogoPosition, type LogoCategory, migrateLogoPosition } from '@/lib/config/constants'
import {
  type LogoSizePreset,
  type LogoBackgroundShape,
  type LogoBackgroundStyle,
  BACKGROUND_SHAPE_OPTIONS,
  DEFAULT_LOGO_BACKGROUND,
} from '@/lib/constants/logoConstants'
import { LogoPresetSelector } from './logo-preset-selector'
import { SavePresetDialog } from './save-preset-dialog'
import { LogoStripShapeSelector } from './logo-strip-shape-selector'

// Zone configuration for visual grouping
interface ZoneConfig {
  label: string
  description: string
  positions: LogoPosition[]
  color: string
  hoverColor: string
  badgeVariant: "default" | "secondary" | "outline" | "destructive" | null | undefined
}

const ZONES: Record<string, ZoneConfig> = {
  header: {
    label: 'Header Zone (Brand)',
    description: 'Best for main organization logos',
    positions: ['top-1', 'top-2', 'top-3', 'top-4', 'top-5', 'top-6'] as LogoPosition[],
    color: 'bg-indigo-50/50 border-indigo-200/50 text-indigo-700',
    hoverColor: 'hover:bg-indigo-50/80',
    badgeVariant: 'default',
  },
  middle: {
    label: 'Middle Zone (Content)',
    description: 'For program or event specific logos',
    positions: ['mid-1', 'mid-2', 'mid-3', 'mid-4', 'mid-5', 'mid-6'] as LogoPosition[],
    color: 'bg-slate-50/50 border-slate-200/50 text-slate-700',
    hoverColor: 'hover:bg-slate-50/80',
    badgeVariant: 'secondary',
  },
  footer: {
    label: 'Footer Zone (Partners)',
    description: 'Sponsors and supporting partners',
    positions: ['bottom-1', 'bottom-2', 'bottom-3', 'bottom-4', 'bottom-5', 'bottom-6'] as LogoPosition[],
    color: 'bg-orange-50/50 border-orange-200/50 text-orange-700',
    hoverColor: 'hover:bg-orange-50/80',
    badgeVariant: 'outline',
  },
}

// Brand logos that get auto-placed
const BRAND_LOGOS = [
  { pattern: /yi\s*(logo|main)?$/i, position: 'top-1' as LogoPosition },
  { pattern: /bharat\s*rising/i, position: 'top-3' as LogoPosition },
  { pattern: /cii|confederation/i, position: 'top-6' as LogoPosition },
]

type Logo = {
  id: string
  name: string
  thumbnail_url?: string | null
  file_url: string
  category?: string | null
}

export function LogoPositionGrid() {
  const { logos, isLoading } = useLogos()
  const {
    formData,
    addLogoPlacement,
    removeLogoPlacement,
    clearLogoPlacements,
    updateLogoPosition,
    updateLogoSize,
    updateLogoBackground,
    updateLogoBackgroundStyle,
    setLogoBackgroundColor,
    applyOptimizedPlacements,
    setLogoStripMode,
  } = useCreativeStore()

  // Click-to-place state
  const [selectedLogoId, setSelectedLogoId] = useState<string | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [isOptimizing, setIsOptimizing] = useState(false)

  const placedPositions = formData.logosPlacements.map((p) => migrateLogoPosition(p.position))
  const placedLogoIds = formData.logosPlacements.map((p) => p.logoId)

  // Filter logos by category
  const filteredLogos = useMemo(() => {
    if (categoryFilter === 'all') return logos
    return logos.filter(logo => logo.category === categoryFilter)
  }, [logos, categoryFilter])

  // Get counts for each category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: logos.length }
    Object.keys(LOGO_CATEGORIES).forEach(cat => {
      counts[cat] = logos.filter(l => l.category === cat).length
    })
    return counts
  }, [logos])

  // Get available categories (only those with logos)
  const availableCategories = useMemo(() => {
    return Object.entries(LOGO_CATEGORIES).filter(([key]) => categoryCounts[key] > 0)
  }, [categoryCounts])

  // Check if brand logos exist for auto-place
  const brandLogosAvailable = useMemo(() => {
    return BRAND_LOGOS.filter(brand =>
      logos.some(logo => brand.pattern.test(logo.name))
    )
  }, [logos])

  const getLogoAtPosition = (position: LogoPosition) => {
    return formData.logosPlacements.find((p) => migrateLogoPosition(p.position) === position)
  }

  const getSelectedLogo = () => {
    if (!selectedLogoId) return null
    return logos.find(l => l.id === selectedLogoId)
  }

  // Handle clicking a logo card to select it
  const handleLogoSelect = (logoId: string) => {
    if (placedLogoIds.includes(logoId)) {
      // If already placed, allow re-selecting to move
      setSelectedLogoId(logoId)
    } else if (placedPositions.length >= 18) {
      // Max logos reached
      return
    } else {
      setSelectedLogoId(selectedLogoId === logoId ? null : logoId)
    }
  }

  // Handle clicking a grid cell to place logo
  const handleCellClick = (position: LogoPosition) => {
    if (!selectedLogoId) return

    const existingAtPosition = getLogoAtPosition(position)

    // If cell is occupied by another logo, don't allow
    if (existingAtPosition && existingAtPosition.logoId !== selectedLogoId) {
      return
    }

    const existingPlacement = formData.logosPlacements.find(p => p.logoId === selectedLogoId)

    if (existingPlacement) {
      // Move to new position
      updateLogoPosition(selectedLogoId, position)
    } else {
      // Add new placement
      addLogoPlacement(selectedLogoId, position)
    }

    setSelectedLogoId(null)
  }

  // Auto-place brand logos
  const handleAutoPlace = () => {
    BRAND_LOGOS.forEach(brand => {
      const logo = logos.find(l => brand.pattern.test(l.name))
      if (logo && !placedLogoIds.includes(logo.id)) {
        // Check if position is free
        if (!placedPositions.includes(brand.position)) {
          addLogoPlacement(logo.id, brand.position)
        }
      }
    })
  }

  // AI-powered logo position optimization
  const handleAIOptimize = async () => {
    if (formData.logosPlacements.length === 0) {
      toast.error('Add logos first to optimize their positions')
      return
    }

    setIsOptimizing(true)
    try {
      const response = await fetch('/api/optimize-logo-positions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logos: formData.logosPlacements.map(p => ({
            id: p.logoId,
            name: p.logo?.name || '',
            type: p.logoType || 'other',
          })),
          formatId: formData.formatId || 'event_poster',
          useAI: false, // Use fast algorithm (set to true for AI-powered)
          currentPlacements: formData.logosPlacements.map(p => ({
            logoId: p.logoId,
            position: p.position,
            size: p.size,
            backgroundShape: p.backgroundShape,
            backgroundStyle: p.backgroundStyle,
          })),
        }),
      })

      const data = await response.json()

      if (data.success && data.placements) {
        // Apply optimized placements
        applyOptimizedPlacements(data.placements)
        toast.success(data.reasoning || 'Logos optimized for visual balance')
      } else {
        toast.error(data.error || 'Optimization failed')
      }
    } catch (error) {
      console.error('Logo optimization error:', error)
      toast.error('Failed to optimize logo positions')
    } finally {
      setIsOptimizing(false)
    }
  }

  if (isLoading) {
    return <LogoPositionGridSkeleton />
  }

  const selectedLogo = getSelectedLogo()

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-medium">Position Your Logos</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Select a logo from the left, then click a grid cell to place it.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {formData.logosPlacements.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (confirm('Remove all placed logos?')) {
                  clearLogoPlacements()
                }
              }}
              className="gap-2 text-muted-foreground hover:text-destructive"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Clear All</span>
            </Button>
          )}
          <LogoPresetSelector onSaveClick={() => setSaveDialogOpen(true)} />
          {/* AI Optimize Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleAIOptimize}
            disabled={formData.logosPlacements.length === 0 || isOptimizing}
            className="gap-2"
          >
            {isOptimizing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            <span className="hidden sm:inline">
              {isOptimizing ? 'Optimizing...' : 'AI Optimize'}
            </span>
            <span className="sm:hidden">
              {isOptimizing ? '...' : 'AI'}
            </span>
          </Button>
        </div>
      </div>

      {/* Save Preset Dialog */}
      <SavePresetDialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen} />

      {/* Helper Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg p-4 flex items-start gap-3 shadow-sm">
        <div className="p-2 bg-white rounded-full shadow-sm shrink-0">
          <Info className="h-4 w-4 text-blue-500" />
        </div>
        <div className="text-xs text-blue-900">
          <span className="font-semibold block mb-1 text-sm">Design Canvas Instructions</span>
          <ol className="list-decimal list-inside space-y-1 opacity-90">
            <li>Select a logo from the <strong>Your Logos</strong> rail on the left</li>
            <li>Tap any grid cell on the <strong>Canvas</strong> to place it instantly</li>
            <li>Click a placed logo to fine-tune its size or style</li>
          </ol>
        </div>
      </div>

      {/* SIDE-BY-SIDE LAYOUT: Logos (left) | Grid (right) */}
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">

        {/* LEFT PANEL - Logo Selection (40%) */}
        <div className="lg:w-[40%] space-y-3">
          {/* Panel Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Your Logos</span>
            </div>
            <Badge variant="outline" className="text-xs">
              {formData.logosPlacements.length} / 18
            </Badge>
          </div>

          {/* Category Filter */}
          {logos.length > 0 && availableCategories.length > 0 && (
            <ToggleGroup
              type="single"
              value={categoryFilter}
              onValueChange={(value) => value && setCategoryFilter(value)}
              className="justify-start flex-wrap"
            >
              <ToggleGroupItem value="all" className="text-xs px-2.5 h-7">
                All ({categoryCounts.all})
              </ToggleGroupItem>
              {availableCategories.map(([key, { label }]) => (
                <ToggleGroupItem key={key} value={key} className="text-xs px-2.5 h-7">
                  {label.replace(' Logo', '')} ({categoryCounts[key]})
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          )}

          {/* Logo Cards Grid */}
          {filteredLogos.length > 0 ? (
            <ScrollArea className="h-[280px] lg:h-[320px]">
              <div className="grid grid-cols-4 xl:grid-cols-5 gap-1.5 pr-3">
                {filteredLogos.map((logo) => {
                  const placement = formData.logosPlacements.find(p => p.logoId === logo.id)
                  const isPlaced = !!placement
                  const isSelected = selectedLogoId === logo.id
                  const migratedPosition = placement ? migrateLogoPosition(placement.position) : null

                  return (
                    <LogoCard
                      key={logo.id}
                      logo={logo}
                      isPlaced={isPlaced}
                      isSelected={isSelected}
                      position={migratedPosition}
                      size={placement?.size || 'medium'}
                      onSelect={() => handleLogoSelect(logo.id)}
                      onSizeChange={(size) => updateLogoSize(logo.id, size)}
                      onRemove={() => removeLogoPlacement(logo.id)}
                      isDisabled={placedPositions.length >= 18 && !isPlaced}
                    />
                  )
                })}
              </div>
            </ScrollArea>
          ) : logos.length > 0 ? (
            <EmptyState
              message="No logos in this category"
              action={
                <Button variant="link" size="sm" onClick={() => setCategoryFilter('all')}>
                  Show all logos
                </Button>
              }
            />
          ) : (
            <EmptyState
              message="No logos uploaded"
              submessage="Upload logos in Settings → Logo Management"
            />
          )}
        </div>

        {/* RIGHT PANEL - Poster Grid (60%) */}
        <div className="lg:w-[60%]">
          {/* Panel Header */}
          <div className="flex items-center gap-2 mb-3">
            <LayoutGrid className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Poster Preview</span>
          </div>

          {/* Logo Options - Combined Panel */}
          <div className="p-2 bg-muted/50 rounded-lg border space-y-2 mb-3">
            {/* Logo Bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Rows3 className="h-3.5 w-3.5 text-muted-foreground" />
                <Label className="text-xs font-medium">Add Logo Bar</Label>
              </div>
              <Switch
                checked={formData.logoStripMode?.enabled ?? false}
                onCheckedChange={(checked) => {
                  setLogoStripMode({
                    opacity: formData.logoStripMode?.opacity ?? 100,
                    logoBound: formData.logoStripMode?.logoBound ?? false,
                    enabled: checked,
                    rows: checked ? (formData.logoStripMode?.rows?.length ? formData.logoStripMode.rows : ['header']) : [],
                  })
                }}
              />
            </div>

            {/* Row Selection - only show when strip mode is enabled */}
            {formData.logoStripMode?.enabled && (
              <div className="flex items-center gap-2 pl-5">
                <span className="text-[10px] text-muted-foreground">Apply to:</span>
                <div className="flex gap-1.5">
                  {(['header', 'middle', 'footer'] as const).map((row) => {
                    const isActive = formData.logoStripMode?.rows?.includes(row)
                    return (
                      <button
                        key={row}
                        type="button"
                        onClick={() => {
                          const currentRows = formData.logoStripMode?.rows || []
                          const newRows = isActive
                            ? currentRows.filter(r => r !== row)
                            : [...currentRows, row]
                          if (newRows.length > 0) {
                            setLogoStripMode({
                              opacity: formData.logoStripMode?.opacity ?? 100,
                              logoBound: formData.logoStripMode?.logoBound ?? false,
                              enabled: true,
                              rows: newRows,
                            })
                          }
                        }}
                        className={cn(
                          'px-2 py-0.5 text-[10px] font-medium rounded transition-colors',
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                        )}
                      >
                        {row.charAt(0).toUpperCase() + row.slice(1)}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Logo Strip Shape Selector */}
            <LogoStripShapeSelector />

            {/* Divider */}
            <Separator className="my-1" />

            {/* Logo Background Color */}
            <div className="flex items-center gap-2">
              <Palette className="h-3.5 w-3.5 text-muted-foreground" />
              <Label className="text-xs font-medium">Logo Background:</Label>
              <Input
                type="color"
                value={formData.logoBackgroundColor}
                onChange={(e) => setLogoBackgroundColor(e.target.value)}
                className="w-7 h-7 p-0.5 cursor-pointer rounded border-0"
              />
              <span className="text-xs text-muted-foreground font-mono">
                {formData.logoBackgroundColor}
              </span>
            </div>
          </div>

          {/* Poster Preview with Dot Matrix Glass Canvas */}
          <div className="relative rounded-xl overflow-hidden shadow-2xl shadow-black/5 border border-white/20 dark:border-white/10">
            {/* Dot Matrix Background */}
            <div className="absolute inset-0 bg-white/40 dark:bg-black/40 backdrop-blur-xl z-0" />
            <div
              className="absolute inset-0 opacity-[0.15] dark:opacity-[0.2] pointer-events-none z-0"
              style={{
                backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
                backgroundSize: '20px 20px'
              }}
            />

            <div className="relative z-10 p-4 space-y-4">
              {/* Header Zone */}
              <ZoneRow
                zone={ZONES.header}
                selectedLogoId={selectedLogoId}
                logos={logos}
                getLogoAtPosition={getLogoAtPosition}
                onCellClick={handleCellClick}
                onRemove={removeLogoPlacement}
                onSizeChange={updateLogoSize}
                onBackgroundChange={updateLogoBackground}
                onBackgroundStyleChange={updateLogoBackgroundStyle}
                placedPositions={placedPositions}
              />

              {/* Middle Zone */}
              <ZoneRow
                zone={ZONES.middle}
                selectedLogoId={selectedLogoId}
                logos={logos}
                getLogoAtPosition={getLogoAtPosition}
                onCellClick={handleCellClick}
                onRemove={removeLogoPlacement}
                onSizeChange={updateLogoSize}
                onBackgroundChange={updateLogoBackground}
                onBackgroundStyleChange={updateLogoBackgroundStyle}
                placedPositions={placedPositions}
              />

              {/* Content placeholder - Glass Slab */}
              <div className="h-24 rounded-xl border border-dashed border-white/30 bg-white/10 flex items-center justify-center backdrop-blur-sm">
                <div className="text-center">
                  <div className="w-8 h-8 rounded-full bg-white/20 mx-auto mb-2 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white/70" />
                  </div>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">AI Content Generation Area</p>
                </div>
              </div>

              {/* Footer Zone */}
              <ZoneRow
                zone={ZONES.footer}
                selectedLogoId={selectedLogoId}
                logos={logos}
                getLogoAtPosition={getLogoAtPosition}
                onCellClick={handleCellClick}
                onRemove={removeLogoPlacement}
                onSizeChange={updateLogoSize}
                onBackgroundChange={updateLogoBackground}
                onBackgroundStyleChange={updateLogoBackgroundStyle}
                placedPositions={placedPositions}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Selection indicator - floating toast */}
      {selectedLogoId && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
          <div className="flex items-center gap-3 bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg animate-in slide-in-from-bottom-2">
            <MousePointerClick className="h-4 w-4" />
            <span className="text-sm font-medium">Click a cell to place logo</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedLogoId(null)}
              className="h-6 w-6 p-0 hover:bg-primary-foreground/20"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// Zone Row Component
function ZoneRow({
  zone,
  selectedLogoId,
  logos,
  getLogoAtPosition,
  onCellClick,
  onRemove,
  onSizeChange,
  onBackgroundChange,
  onBackgroundStyleChange,
  placedPositions,
}: {
  zone: typeof ZONES.header
  selectedLogoId: string | null
  logos: Logo[]
  getLogoAtPosition: (position: LogoPosition) => any
  onCellClick: (position: LogoPosition) => void
  onRemove: (logoId: string) => void
  onSizeChange: (logoId: string, size: LogoSizePreset) => void
  onBackgroundChange: (logoId: string, shape: LogoBackgroundShape) => void
  onBackgroundStyleChange: (logoId: string, style: Partial<LogoBackgroundStyle>) => void
  placedPositions: LogoPosition[]
}) {
  return (
    <div className={cn('rounded-lg p-2 transition-all duration-200', zone.color.replace('border-', 'border-0 ring-1 ring-inset ring-'))}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Badge variant={zone.badgeVariant as any} className="text-[10px] h-5 px-1.5 font-medium border-0 bg-white/50 dark:bg-black/20 backdrop-blur-sm shadow-none">
            {zone.label.split(' ')[0]}
          </Badge>
          <span className="text-[9px] text-muted-foreground/70 uppercase tracking-wider font-medium">{zone.description}</span>
        </div>
      </div>
      <div className="grid grid-cols-6 gap-1.5">
        {zone.positions.map((position) => {
          const placement = getLogoAtPosition(position)
          const logo = placement?.logo || logos.find((l) => l.id === placement?.logoId)
          const isOccupied = !!logo
          const isAvailable = selectedLogoId && !isOccupied
          const canPlace = selectedLogoId && (!isOccupied || placement?.logoId === selectedLogoId)

          // Background settings from placement
          const bgShape = placement?.backgroundShape || DEFAULT_LOGO_BACKGROUND.shape
          const bgStyle = placement?.backgroundStyle || DEFAULT_LOGO_BACKGROUND.style

          return (
            <div
              key={position}
              onClick={() => canPlace && onCellClick(position)}
              className={cn(
                'aspect-[2/1] rounded-lg transition-all duration-300 flex items-center justify-center relative overflow-hidden',
                // BASE STATE: Glass tile
                'bg-white/40 dark:bg-white/5 backdrop-blur-sm shadow-sm',
                // OCCUPIED: Clean look
                isOccupied && 'bg-white/60 dark:bg-white/10 shadow-md ring-1 ring-black/5 dark:ring-white/10',
                // AVAILABLE (Drafting Mode): Pulsing ring
                isAvailable && 'ring-2 ring-primary/50 bg-primary/5 animate-pulse cursor-pointer',
                // HOVER STATES
                canPlace && !isOccupied && 'hover:bg-primary/10 hover:ring-2 hover:ring-primary/30 cursor-pointer',
                !isOccupied && !isAvailable && 'opacity-60 grayscale-[0.5]'
              )}
            >
              {logo && placement ? (
                <Popover>
                  <PopoverTrigger asChild>
                    <div className="relative w-full h-full p-0.5 group cursor-pointer">
                      {/* Logo with background preview */}
                      <div
                        className={cn(
                          'w-full h-full flex items-center justify-center',
                          // Background shape classes
                          bgShape === 'rectangle' && 'bg-white',
                          bgShape === 'rounded' && 'bg-white rounded-md',
                          bgShape === 'circle' && 'bg-white rounded-full',
                          // Style modifiers
                          bgStyle?.shadow && 'shadow-md',
                          bgStyle?.border && 'ring-1 ring-gray-200'
                        )}
                      >
                        <img
                          src={logo.thumbnail_url || logo.file_url}
                          alt={logo.name}
                          className={cn(
                            'object-contain',
                            // Adjust image size based on background
                            bgShape !== 'none' ? 'w-[75%] h-[75%]' : 'w-full h-full'
                          )}
                        />
                      </div>
                      {/* Settings indicator */}
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-muted flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                        <Settings2 className="h-2 w-2 text-muted-foreground" />
                      </div>
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-3" align="center" side="top">
                    <LogoOptionsPopover
                      logo={logo}
                      placement={placement}
                      onShapeChange={(shape) => onBackgroundChange(logo.id, shape)}
                      onStyleChange={(style) => onBackgroundStyleChange(logo.id, style)}
                      onSizeChange={(size) => onSizeChange(logo.id, size)}
                      onRemove={() => onRemove(logo.id)}
                    />
                  </PopoverContent>
                </Popover>
              ) : (
                <span className="text-[7px] text-muted-foreground/40">
                  {position.split('-')[1]}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Logo Options Popover Content
function LogoOptionsPopover({
  logo,
  placement,
  onShapeChange,
  onStyleChange,
  onSizeChange,
  onRemove,
}: {
  logo: Logo
  placement: {
    size?: LogoSizePreset | number
    backgroundShape?: LogoBackgroundShape
    backgroundStyle?: LogoBackgroundStyle
  }
  onShapeChange: (shape: LogoBackgroundShape) => void
  onStyleChange: (style: Partial<LogoBackgroundStyle>) => void
  onSizeChange: (size: LogoSizePreset) => void
  onRemove: () => void
}) {
  const currentShape = placement.backgroundShape || DEFAULT_LOGO_BACKGROUND.shape
  const currentStyle = placement.backgroundStyle || DEFAULT_LOGO_BACKGROUND.style
  const currentSize = typeof placement.size === 'string' ? placement.size : 'medium'

  // Shape icons mapping
  const shapeIcons: Record<LogoBackgroundShape, React.ReactNode> = {
    none: <CircleOff className="h-3.5 w-3.5" />,
    rectangle: <Square className="h-3.5 w-3.5" />,
    rounded: <RectangleHorizontal className="h-3.5 w-3.5" />,
    circle: <Circle className="h-3.5 w-3.5" />,
  }

  return (
    <div className="space-y-3">
      {/* Logo name */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded overflow-hidden bg-muted">
          <img
            src={logo.thumbnail_url || logo.file_url}
            alt={logo.name}
            className="w-full h-full object-contain"
          />
        </div>
        <span className="text-sm font-medium truncate">{logo.name}</span>
      </div>

      <Separator />

      {/* Logo Shape */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Logo Shape</Label>
        <ToggleGroup
          type="single"
          value={currentShape}
          onValueChange={(value) => value && onShapeChange(value as LogoBackgroundShape)}
          className="justify-start"
        >
          {BACKGROUND_SHAPE_OPTIONS.map((option) => (
            <ToggleGroupItem
              key={option.value}
              value={option.value}
              className="h-8 w-8 p-0"
              title={option.description}
            >
              {shapeIcons[option.value]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {/* Shadow & Border (only if shape is not 'none') */}
      {currentShape !== 'none' && (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="shadow"
              checked={currentStyle.shadow}
              onCheckedChange={(checked) =>
                onStyleChange({ shadow: checked === true })
              }
            />
            <Label htmlFor="shadow" className="text-xs cursor-pointer">
              Shadow
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="border"
              checked={currentStyle.border}
              onCheckedChange={(checked) =>
                onStyleChange({ border: checked === true })
              }
            />
            <Label htmlFor="border" className="text-xs cursor-pointer">
              Border
            </Label>
          </div>
        </div>
      )}

      {/* Logo Size */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Logo Size</Label>
        <ToggleGroup
          type="single"
          value={currentSize}
          onValueChange={(value) => value && onSizeChange(value as LogoSizePreset)}
          className="justify-start"
        >
          <ToggleGroupItem value="small" className="h-7 px-2.5 text-xs">S</ToggleGroupItem>
          <ToggleGroupItem value="medium" className="h-7 px-2.5 text-xs">M</ToggleGroupItem>
          <ToggleGroupItem value="large" className="h-7 px-2.5 text-xs">L</ToggleGroupItem>
          <ToggleGroupItem value="xlarge" className="h-7 px-2.5 text-xs">XL</ToggleGroupItem>
        </ToggleGroup>
      </div>

      <Separator />

      {/* Remove */}
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 h-8"
        onClick={onRemove}
      >
        <Trash2 className="h-3.5 w-3.5 mr-2" />
        Remove from poster
      </Button>
    </div>
  )
}

// Logo Card Component - Ultra-compact version for side panel
function LogoCard({
  logo,
  isPlaced,
  isSelected,
  position,
  size,
  onSelect,
  onSizeChange,
  onRemove,
  isDisabled,
}: {
  logo: Logo
  isPlaced: boolean
  isSelected: boolean
  position: LogoPosition | null
  size: LogoSizePreset | number | string
  onSelect: () => void
  onSizeChange: (size: LogoSizePreset) => void
  onRemove: () => void
  isDisabled: boolean
}) {
  return (
    <div
      onClick={isDisabled ? undefined : onSelect}
      className={cn(
        'relative rounded-lg border transition-all duration-200 group overflow-hidden',
        // Selected State
        isSelected && 'ring-2 ring-primary ring-offset-1 border-primary shadow-md scale-[1.02] z-10',
        // Placed State
        isPlaced && !isSelected && 'border-primary/20 bg-primary/5',
        // Empty State
        !isPlaced && !isSelected && 'border-border/60 hover:border-primary/40 hover:bg-primary/5 hover:scale-[1.02]',
        // Disabled State
        isDisabled && 'opacity-40 cursor-not-allowed grayscale',
        !isDisabled && 'cursor-pointer'
      )}
    >
      {/* Logo thumbnail */}
      <div className="aspect-square rounded overflow-hidden bg-muted/30">
        <img
          src={logo.thumbnail_url || logo.file_url}
          alt={logo.name}
          className="w-full h-full object-contain"
        />
      </div>

      {/* Logo name - single line truncated */}
      <p className="text-[8px] font-medium truncate text-center mt-0.5 leading-tight">{logo.name}</p>

      {/* Placed indicator badge */}
      {isPlaced && (
        <div className="absolute top-0.5 left-0.5">
          <div className="w-3 h-3 rounded-full bg-primary flex items-center justify-center">
            <Check className="h-2 w-2 text-primary-foreground" />
          </div>
        </div>
      )}

      {/* Size badge (if placed) - compact */}
      {isPlaced && (
        <div className="absolute bottom-0.5 right-0.5 flex items-center gap-0.5">
          <Badge variant="secondary" className="text-[7px] px-1 py-0 h-3 font-medium">
            {typeof size === 'string' ? size.charAt(0).toUpperCase() : 'M'}
          </Badge>
        </div>
      )}

      {/* Remove button on hover */}
      {isPlaced && (
        <Button
          variant="destructive"
          size="icon"
          className="absolute -top-1 -right-1 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
        >
          <X className="h-2.5 w-2.5" />
        </Button>
      )}

      {/* Selection indicator */}
      {isSelected && !isPlaced && (
        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center shadow-md">
          <Check className="h-2.5 w-2.5 text-primary-foreground" />
        </div>
      )}
    </div>
  )
}

// Empty State Component
function EmptyState({
  message,
  submessage,
  action,
}: {
  message: string
  submessage?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-6 text-center">
      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-2">
        <ImageIcon className="h-5 w-5 text-muted-foreground/50" />
      </div>
      <p className="text-sm font-medium">{message}</p>
      {submessage && (
        <p className="text-xs text-muted-foreground mt-1">{submessage}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

// Skeleton loader - Side-by-side layout
export function LogoPositionGridSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-4 w-32 mb-1" />
          <Skeleton className="h-3 w-48" />
        </div>
        <Skeleton className="h-8 w-32 rounded-md" />
      </div>

      {/* Side-by-side skeleton */}
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
        {/* Left panel skeleton */}
        <div className="lg:w-[40%] space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-12 rounded-full" />
          </div>
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-7 w-16 rounded-md" />
            ))}
          </div>
          <div className="grid grid-cols-4 xl:grid-cols-5 gap-1.5">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-md" />
            ))}
          </div>
        </div>

        {/* Right panel skeleton */}
        <div className="lg:w-[60%]">
          <Skeleton className="h-4 w-28 mb-3" />
          <div className="rounded-xl border-2 border-dashed border-muted-foreground/20 p-2 space-y-1.5">
            <Skeleton className="h-8 rounded-lg" />
            <Skeleton className="h-8 rounded-lg" />
            <Skeleton className="h-12 rounded-lg" />
            <Skeleton className="h-8 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  )
}
