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
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import { Slider } from '@/components/ui/slider'
import { X, Image as ImageIcon, Grid3X3, Check, Move, Filter, Lock, Maximize2, Sparkles, Info } from 'lucide-react'
import { LOGO_POSITIONS, LOGO_CATEGORIES, type LogoPosition, type LogoCategory } from '@/lib/config/constants'
import { isPositionLocked, getLockedPosition, getLogoLockConfig } from '@/lib/config/logo-locks'
import {
  LOGO_SIZE_OPTIONS,
  type LogoSizePreset,
  getLogoSizeOptionsArray,
} from '@/lib/constants/logoConstants'

const POSITION_LABELS: Record<LogoPosition, string> = {
  'top-left': 'Top Left',
  'top-center': 'Top Center',
  'top-right': 'Top Right',
  'mid-left': 'Mid Left',
  'center': 'Center',
  'mid-right': 'Mid Right',
  'bottom-left': 'Bottom Left',
  'bottom-center': 'Bottom Center',
  'bottom-right': 'Bottom Right',
}

export function LogoPositionGrid() {
  const { logos, isLoading } = useLogos()
  const {
    formData,
    addLogoPlacement,
    removeLogoPlacement,
    updateLogoPosition,
    updateLogoSize,
  } = useCreativeStore()

  // Category filter state
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  const placedPositions = formData.logosPlacements.map((p) => p.position)

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

  const getLogoAtPosition = (position: LogoPosition) => {
    return formData.logosPlacements.find((p) => p.position === position)
  }

  const handlePositionClick = (position: LogoPosition) => {
    const existing = getLogoAtPosition(position)

    if (existing) {
      removeLogoPlacement(existing.logoId)
    }
  }

  const handleAddLogo = (logoId: string) => {
    // Find first available position
    const availablePosition = LOGO_POSITIONS.find(
      (pos) => !placedPositions.includes(pos)
    )

    if (availablePosition) {
      addLogoPlacement(logoId, availablePosition)
    }
  }

  if (isLoading) {
    return <LogoPositionGridSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Smart Layout Info Banner */}
      <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
        <div className="p-1.5 rounded-full bg-primary/10 shrink-0">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-primary">Smart Layout Active</p>
          <p className="text-xs text-muted-foreground">
            AI will structure your design to keep these areas clear for logos. Place logos first, and the generated design will naturally avoid these zones.
          </p>
        </div>
      </div>

      {/* Position Grid Preview */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Grid3X3 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Position Grid</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="secondary" className="ml-2 text-xs cursor-help">
                <Info className="h-3 w-3 mr-1" />
                AI-Aware
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[250px]">
              <p>The AI will avoid placing important content in positions where you place logos</p>
            </TooltipContent>
          </Tooltip>
          <Badge variant="outline" className="ml-auto text-xs">
            {formData.logosPlacements.length} / 4
          </Badge>
        </div>

        <div className="relative aspect-[4/5] max-w-xs mx-auto bg-gradient-to-br from-muted/50 to-muted rounded-xl border-2 border-dashed border-muted-foreground/20 overflow-hidden">
          <div className="absolute inset-3 grid grid-cols-3 grid-rows-3 gap-2">
            {LOGO_POSITIONS.map((position) => {
              const placement = getLogoAtPosition(position)
              const logo = placement?.logo || logos.find((l) => l.id === placement?.logoId)

              return (
                <Tooltip key={position}>
                  <TooltipTrigger asChild>
                    <div
                      onClick={() => handlePositionClick(position)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          handlePositionClick(position)
                        }
                      }}
                      className={cn(
                        'rounded-lg border-2 transition-all flex items-center justify-center cursor-pointer group',
                        placement
                          ? 'border-primary bg-primary/10 hover:bg-primary/20 shadow-sm'
                          : 'border-dashed border-muted-foreground/30 hover:border-primary/50 hover:bg-muted-foreground/5'
                      )}
                    >
                      {logo ? (
                        <div className="relative w-full h-full p-1.5">
                          <img
                            src={logo.thumbnail_url || logo.file_url}
                            alt={logo.name}
                            className="w-full h-full object-contain"
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              removeLogoPlacement(logo.id)
                            }}
                            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-muted-foreground/50 text-center leading-tight">
                          {POSITION_LABELS[position].split(' ').join('\n')}
                        </span>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>{logo ? `${logo.name} - Click to remove` : `${POSITION_LABELS[position]} - Empty`}</p>
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </div>
        </div>
      </div>

      {/* Available Logos Section */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Available Logos</span>
        </div>

        {/* Category Filter with ToggleGroup */}
        {logos.length > 0 && availableCategories.length > 0 && (
          <ToggleGroup
            type="single"
            value={categoryFilter}
            onValueChange={(value) => value && setCategoryFilter(value)}
            className="justify-start flex-wrap mb-4"
          >
            <ToggleGroupItem value="all" className="text-xs px-3 h-8">
              All ({categoryCounts.all})
            </ToggleGroupItem>
            {availableCategories.map(([key, { label }]) => (
              <ToggleGroupItem key={key} value={key} className="text-xs px-3 h-8">
                {label.replace(' Logo', '')} ({categoryCounts[key]})
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        )}

        {/* Logo Grid */}
        {filteredLogos.length > 0 ? (
          <ScrollArea className="h-[200px]">
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 pr-4">
              {filteredLogos.map((logo) => {
                const isPlaced = formData.logosPlacements.some(
                  (p) => p.logoId === logo.id
                )

                return (
                  <HoverCard key={logo.id} openDelay={200} closeDelay={50}>
                    <HoverCardTrigger asChild>
                      <button
                        onClick={() => !isPlaced && handleAddLogo(logo.id)}
                        disabled={isPlaced || placedPositions.length >= 4}
                        className={cn(
                          'relative aspect-square rounded-lg border-2 p-2 transition-all group',
                          isPlaced
                            ? 'border-primary bg-primary/5 cursor-not-allowed'
                            : 'border-border hover:border-primary hover:bg-primary/5 hover:shadow-sm'
                        )}
                      >
                        <img
                          src={logo.thumbnail_url || logo.file_url}
                          alt={logo.name}
                          className={cn(
                            'w-full h-full object-contain transition-opacity',
                            isPlaced && 'opacity-50'
                          )}
                        />
                        {isPlaced && (
                          <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                            <Check className="h-3 w-3 text-primary-foreground" />
                          </div>
                        )}
                      </button>
                    </HoverCardTrigger>
                    <HoverCardContent side="top" className="w-48 p-3">
                      <div className="space-y-2">
                        <div className="aspect-square rounded-lg overflow-hidden bg-muted mb-2">
                          <img
                            src={logo.thumbnail_url || logo.file_url}
                            alt={logo.name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <p className="font-medium text-sm truncate">{logo.name}</p>
                        {logo.category && (
                          <Badge variant="secondary" className="text-xs">
                            {LOGO_CATEGORIES[logo.category as LogoCategory]?.label || logo.category}
                          </Badge>
                        )}
                        {isPlaced ? (
                          <p className="text-xs text-muted-foreground">Already placed</p>
                        ) : placedPositions.length >= 4 ? (
                          <p className="text-xs text-destructive">Maximum 4 logos allowed</p>
                        ) : (
                          <p className="text-xs text-muted-foreground">Click to add</p>
                        )}
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                )
              })}
            </div>
          </ScrollArea>
        ) : logos.length > 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <ImageIcon className="h-6 w-6 text-muted-foreground/50" />
            </div>
            <p className="text-sm text-muted-foreground">No logos in this category</p>
            <Button
              variant="link"
              size="sm"
              onClick={() => setCategoryFilter('all')}
              className="mt-1"
            >
              Show all logos
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <ImageIcon className="h-6 w-6 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-medium">No logos uploaded</p>
            <p className="text-xs text-muted-foreground">
              Upload logos in Settings → Logo Management
            </p>
          </div>
        )}
      </div>

      {/* Placed Logos Summary */}
      {formData.logosPlacements.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Move className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Placed Logos</span>
          </div>
          <div className="space-y-2">
            {formData.logosPlacements.map((placement) => {
              const logo = placement.logo || logos.find((l) => l.id === placement.logoId)
              if (!logo) return null

              // Check if this logo has a locked position (Yi/CII)
              const logoIsLocked = isPositionLocked(logo.name)
              const lockConfig = getLogoLockConfig(logo.name)

              // Get current size (default to 'medium' for backwards compatibility)
              const currentSize = placement.size || 'medium'

              return (
                <div
                  key={placement.logoId}
                  className="flex flex-col p-3 rounded-lg bg-muted/50 border gap-3"
                >
                  {/* Logo Info Header */}
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-background border p-1.5 flex-shrink-0">
                      <img
                        src={logo.thumbnail_url || logo.file_url}
                        alt={logo.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-sm font-medium truncate">{logo.name}</span>
                      {logoIsLocked && (
                        <span className="text-[10px] text-amber-600 dark:text-amber-500 flex items-center gap-1">
                          <Lock className="h-2.5 w-2.5" />
                          Position locked
                        </span>
                      )}
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                          onClick={() => removeLogoPlacement(placement.logoId)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Remove logo</TooltipContent>
                    </Tooltip>
                  </div>

                  {/* Size & Position Controls */}
                  <div className="flex flex-col gap-3">
                    {/* Size Selector - Enhanced with ToggleGroup + Slider */}
                    <div className="flex flex-col gap-2 p-3 rounded-lg bg-muted/30 border">
                      <div className="flex items-center gap-1.5">
                        <Maximize2 className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs font-medium">Size</span>
                        <Badge variant="secondary" className="text-[10px] ml-auto">
                          {typeof currentSize === 'number'
                            ? `${currentSize}px`
                            : `${LOGO_SIZE_OPTIONS[currentSize as LogoSizePreset]?.pixels || 100}px`}
                        </Badge>
                      </div>

                      {/* Preset Size ToggleGroup */}
                      <ToggleGroup
                        type="single"
                        value={typeof currentSize === 'string' ? currentSize : undefined}
                        onValueChange={(size) => size && updateLogoSize(placement.logoId, size as LogoSizePreset)}
                        className="justify-start"
                      >
                        {getLogoSizeOptionsArray().map((option) => (
                          <Tooltip key={option.value}>
                            <TooltipTrigger asChild>
                              <ToggleGroupItem
                                value={option.value}
                                className="text-xs px-3 h-7 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                              >
                                {option.label === 'Extra Large' ? 'XL' : option.label[0]}
                              </ToggleGroupItem>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              <p>{option.label} ({option.pixels}px) - {option.description}</p>
                            </TooltipContent>
                          </Tooltip>
                        ))}
                      </ToggleGroup>

                      {/* Custom Size Slider */}
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-muted-foreground shrink-0">Custom</span>
                        <Slider
                          value={[typeof currentSize === 'number'
                            ? currentSize
                            : LOGO_SIZE_OPTIONS[currentSize as LogoSizePreset]?.pixels || 100]}
                          min={30}
                          max={300}
                          step={10}
                          onValueChange={([value]) => updateLogoSize(placement.logoId, value)}
                          className="flex-1"
                        />
                      </div>
                    </div>

                    {/* Position Selector */}
                    <div className="flex items-center gap-2">
                      <Move className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs font-medium">Position</span>
                      {logoIsLocked ? (
                        // Show locked position indicator instead of dropdown
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1.5 px-3 h-8 rounded-md bg-amber-100 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-xs font-medium ml-auto">
                              <Lock className="h-3 w-3" />
                              {POSITION_LABELS[placement.position]}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[200px]">
                            <p>{lockConfig?.description || 'This logo position is locked per brand guidelines'}</p>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        // Show position dropdown for non-locked logos
                        <Select
                          value={placement.position}
                          onValueChange={(pos) =>
                            updateLogoPosition(placement.logoId, pos as LogoPosition)
                          }
                        >
                          <SelectTrigger className="w-[130px] h-8 text-xs ml-auto">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {LOGO_POSITIONS.map((pos) => (
                              <SelectItem
                                key={pos}
                                value={pos}
                                disabled={
                                  placedPositions.includes(pos) &&
                                  pos !== placement.position
                                }
                              >
                                {POSITION_LABELS[pos]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// Skeleton loader
export function LogoPositionGridSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-12 ml-auto rounded-full" />
        </div>
        <Skeleton className="aspect-[4/5] max-w-xs mx-auto rounded-xl" />
      </div>
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="flex gap-2 mb-4">
          <Skeleton className="h-8 w-16 rounded-md" />
          <Skeleton className="h-8 w-20 rounded-md" />
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  )
}
