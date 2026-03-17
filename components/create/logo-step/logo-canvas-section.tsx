'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import {
    LayoutGrid,
    MousePointerClick,
    X,
    Settings2,
    GripVertical,
    Lock
} from 'lucide-react'
import {
    DndContext,
    DragEndEvent,
    DragStartEvent,
    DragOverlay,
    useSensor,
    useSensors,
    PointerSensor,
    KeyboardSensor,
    closestCenter,
} from '@dnd-kit/core'
import {
    SortableContext,
    useSortable,
    horizontalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'
import { LogoPosition } from '@/lib/config/constants'
import {
    LogoSizePreset,
    LogoBackgroundShape,
    LogoBackgroundStyle,
    DEFAULT_LOGO_BACKGROUND,
    BACKGROUND_SHAPE_OPTIONS
} from '@/lib/constants/logoConstants'
import { isLogoAutoLocked } from '@/lib/config/logo-locks'
import type { OrganizationLogo } from '@/types/database.types'
import type { LogoPlacement } from '@/stores/creative-store'
import { useCreativeStore } from '@/stores/creative-store'

// Re-using types from original component logic
interface CreativeFormData {
    logosPlacements: LogoPlacement[]
}

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
        color: 'bg-primary/5 border-primary/20 text-primary',
        hoverColor: 'hover:bg-primary/10',
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

// TODO: Consider reducing props drilling by extracting from useCreativeStore:
// - formData.logosPlacements can be accessed via store.formData.logosPlacements
// - removeLogoPlacement, updateLogoSize, updateLogoBackground, updateLogoBackgroundStyle
//   can be accessed from store methods
// This would reduce props from 12 to ~6-7, improving maintainability
interface LogoCanvasSectionProps {
    logos: OrganizationLogo[]
    formData: CreativeFormData
    selectedLogoId: string | null
    setSelectedLogoId: (id: string | null) => void
    handleCellClick: (position: LogoPosition) => void
    removeLogoPlacement: (logoId: string) => void
    updateLogoSize: (logoId: string, size: LogoSizePreset) => void
    updateLogoBackground: (logoId: string, shape: LogoBackgroundShape) => void
    updateLogoBackgroundStyle: (logoId: string, style: Partial<LogoBackgroundStyle>) => void
    migrateLogoPosition: (pos: LogoPosition | string) => LogoPosition
    getLogoAtPosition: (position: LogoPosition) => LogoPlacement | undefined
    // v25.0: Drag-and-drop functionality
    updateLogoPosition: (logoId: string, position: LogoPosition) => void
    swapLogoPositions?: (logoId1: string, logoId2: string) => void
}

export function LogoCanvasSection({
    logos,
    formData,
    selectedLogoId,
    setSelectedLogoId,
    handleCellClick,
    removeLogoPlacement,
    updateLogoSize,
    updateLogoBackground,
    updateLogoBackgroundStyle,
    migrateLogoPosition,
    getLogoAtPosition,
    updateLogoPosition,
    swapLogoPositions
}: LogoCanvasSectionProps) {
    // institution logoMode: admission formats bypass Yi/CII position locks
    const isInstitutionMode = useCreativeStore(s => s.selectedFormat?.logoMode === 'institution')

    // v25.0: Drag-and-drop state
    const [activeId, setActiveId] = useState<string | null>(null)
    const [activeRow, setActiveRow] = useState<string | null>(null)

    // Configure drag sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // Require 5px movement before drag starts
            },
        }),
        useSensor(KeyboardSensor)
    )

    // Handle drag start
    const handleDragStart = useCallback((event: DragStartEvent) => {
        const { active } = event
        const placement = formData.logosPlacements.find(p => p.logoId === active.id)

        if (placement) {
            // Check if logo is auto-locked (skip in institution mode)
            const logo = logos.find(l => l.id === placement.logoId)
            if (!isInstitutionMode && logo?.name && isLogoAutoLocked(logo.name)) {
                return
            }

            setActiveId(active.id as string)
            // Extract row from position (top-1 -> 'top')
            const row = placement.position.split('-')[0]
            setActiveRow(row)
        }
    }, [formData.logosPlacements, logos])

    // Handle drag end
    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event

        // Reset drag state
        setActiveId(null)
        setActiveRow(null)

        if (!over || active.id === over.id) {
            return
        }

        // Get source placement
        const sourcePlacement = formData.logosPlacements.find(p => p.logoId === active.id)
        if (!sourcePlacement) {
            return
        }

        // Extract rows
        const sourceRow = sourcePlacement.position.split('-')[0]
        const targetPosition = over.id as string

        // Check if target is a position or a logo
        const targetPlacement = formData.logosPlacements.find(p => p.logoId === targetPosition)
        const finalTargetPosition = targetPlacement ? targetPlacement.position : targetPosition
        const targetRow = finalTargetPosition.split('-')[0]

        // Validate same row constraint
        if (sourceRow !== targetRow) {
            toast.error('Can only move logos within the same row')
            return
        }

        // Check if target is occupied
        const targetLogoPlacement = getLogoAtPosition(finalTargetPosition as LogoPosition)

        if (targetLogoPlacement && targetLogoPlacement.logoId !== active.id) {
            // Swap positions
            swapLogoPositions?.(active.id as string, targetLogoPlacement.logoId)
            toast.success('Logos swapped')
        } else if (!targetLogoPlacement) {
            // Move to empty cell
            updateLogoPosition(active.id as string, finalTargetPosition as LogoPosition)
            toast.success('Logo moved')
        }
    }, [formData.logosPlacements, getLogoAtPosition, updateLogoPosition, swapLogoPositions])

    // Get active logo for DragOverlay
    const activeLogo = activeId ? logos.find(l => l.id === activeId) : null

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="relative w-full max-w-full rounded-xl overflow-hidden shadow-2xl shadow-black/10 group min-h-[400px] flex flex-col justify-start">
                {/* Dot Matrix Background */}
                <div className="absolute inset-0 bg-white/40 dark:bg-black/40 backdrop-blur-xl z-0" />
                <div
                    className="absolute inset-0 opacity-[0.1] dark:opacity-[0.15] pointer-events-none z-0"
                    style={{
                        backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
                        backgroundSize: '20px 20px'
                    }}
                />

                <div className="relative z-10 p-5 space-y-6 max-w-5xl mx-auto w-full" role="region" aria-label="Logo placement canvas">
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
                        activeId={activeId}
                        activeRow={activeRow}
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
                        activeId={activeId}
                        activeRow={activeRow}
                    />

                    {/* Content placeholder - Glass Slab */}
                    <div className="h-24 rounded-xl border-2 border-dashed border-muted-foreground/10 bg-white/5 flex flex-col items-center justify-center backdrop-blur-sm">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center mb-1.5">
                            <LayoutGrid className="h-4 w-4 text-primary/60" />
                        </div>
                        <p className="text-[10px] font-medium text-muted-foreground">Content Area</p>
                        <p className="text-[9px] text-muted-foreground/60">(Auto-generated)</p>
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
                        activeId={activeId}
                        activeRow={activeRow}
                    />
                </div>

                {/* Helper Overlay (only when empty) */}
                {formData.logosPlacements.length === 0 && !selectedLogoId && !activeId && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                        <div className="bg-background/80 backdrop-blur-md border px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                            <MousePointerClick className="h-4 w-4 text-primary animate-bounce" />
                            <span className="text-sm font-medium text-foreground">Select a logo to start placing</span>
                        </div>
                    </div>
                )}

                {/* Selection indicator - floating toast */}
                {selectedLogoId && !activeId && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50">
                    <div className="flex items-center gap-3 bg-foreground text-background px-5 py-3 rounded-full shadow-xl animate-in slide-in-from-bottom-2 border border-white/20">
                        <MousePointerClick className="h-4 w-4 text-primary-foreground" />
                        <span className="text-sm font-medium">Click any grid cell to place logo</span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedLogoId(null)}
                            className="h-6 w-6 p-0 hover:bg-white/20 text-background hover:text-white rounded-full ml-2"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* v25.0: Drag indicator */}
            {activeId && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50">
                    <div className="flex items-center gap-3 bg-blue-600 text-white px-5 py-3 rounded-full shadow-xl animate-in slide-in-from-bottom-2 border border-blue-400/30">
                        <GripVertical className="h-4 w-4 animate-pulse" />
                        <span className="text-sm font-medium">Drop on another cell in the same row to reposition</span>
                    </div>
                </div>
            )}
        </div>

            {/* Drag Overlay - shows dragging logo */}
            <DragOverlay dropAnimation={null}>
                {activeLogo && (
                    <div className="w-32 h-16 bg-white shadow-2xl rounded-lg border-2 border-primary/50 flex items-center justify-center opacity-90">
                        <Image
                            src={activeLogo.thumbnail_url || activeLogo.file_url || ''}
                            alt={activeLogo.name || 'Logo'}
                            width={80}
                            height={80}
                            className="object-contain w-3/4 h-3/4"
                            unoptimized={true}
                        />
                    </div>
                )}
            </DragOverlay>
        </DndContext>
    )
}

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
    // v25.0: Drag props
    activeId,
    activeRow,
}: {
    zone: ZoneConfig
    selectedLogoId: string | null
    logos: OrganizationLogo[]
    getLogoAtPosition: (position: LogoPosition) => LogoPlacement | undefined
    onCellClick: (position: LogoPosition) => void
    onRemove: (logoId: string) => void
    onSizeChange: (logoId: string, size: LogoSizePreset) => void
    onBackgroundChange: (logoId: string, shape: LogoBackgroundShape) => void
    onBackgroundStyleChange: (logoId: string, style: Partial<LogoBackgroundStyle>) => void
    // v25.0: Drag props
    activeId?: string | null
    activeRow?: string | null
}) {
    const isInstitutionMode = useCreativeStore(s => s.selectedFormat?.logoMode === 'institution')
    // Determine if this zone's row matches the active drag row
    const zoneRowName = zone.positions[0]?.split('-')[0] // 'top', 'mid', or 'bottom'
    const isActiveRow = activeId && activeRow === zoneRowName

    // Get all droppable IDs (positions and logo IDs in this row)
    const droppableIds = zone.positions.map(pos => {
        const placement = getLogoAtPosition(pos)
        return placement?.logoId || pos
    })
    return (
        <SortableContext items={droppableIds} strategy={horizontalListSortingStrategy}>
            <div className={cn('rounded-xl p-2 transition-all duration-200 group/zone hover:bg-white/50 dark:hover:bg-white/5', zone.color.replace('border-', 'border-0 ring-1 ring-inset ring-'))}>
                <div className="flex items-center justify-between mb-2 px-1">
                    <div className="flex items-center gap-2">
                        <Badge variant={zone.badgeVariant ?? 'default'} className="text-[10px] h-5 px-1.5 font-medium border-0 bg-white/50 dark:bg-black/20 backdrop-blur-sm shadow-none">
                            {zone.label.split(' ')[0]}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground/70 uppercase tracking-wider font-medium">{zone.description}</span>
                    </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6 gap-1.5" role="grid" aria-label={`${zone.label} grid`}>
                {zone.positions.map((position) => {
                    const placement = getLogoAtPosition(position)
                    const logo = placement?.logo || logos.find((l) => l.id === placement?.logoId)
                    const isOccupied = !!logo
                    const isAvailable = !!selectedLogoId && !isOccupied
                    const canPlace = !!selectedLogoId && (!isOccupied || placement?.logoId === selectedLogoId)

                    // Background settings from placement
                    const bgShape = placement?.backgroundShape || DEFAULT_LOGO_BACKGROUND.shape
                    const bgStyle = placement?.backgroundStyle || DEFAULT_LOGO_BACKGROUND.style

                    const positionLabel = position.replace('-', ' slot ')

                    // v25.0: Drag state calculations
                    const isAutoLocked = !isInstitutionMode && !!(logo?.name && isLogoAutoLocked(logo.name))
                    const isDragging = !!(activeId && placement?.logoId === activeId)
                    const canDropHere = !!(isActiveRow && !isDragging)
                    const isDraggable = !!(isOccupied && !isAutoLocked)

                    return (
                        <DroppableLogoCell
                            key={position}
                            position={position}
                            placement={placement}
                            logo={logo}
                            isOccupied={isOccupied}
                            isAvailable={isAvailable}
                            canPlace={canPlace}
                            isDragging={isDragging}
                            canDropHere={canDropHere}
                            isDraggable={isDraggable}
                            isAutoLocked={isAutoLocked}
                            bgShape={bgShape}
                            bgStyle={bgStyle}
                            positionLabel={positionLabel}
                            selectedLogoId={selectedLogoId}
                            onCellClick={onCellClick}
                            onRemove={onRemove}
                            onSizeChange={onSizeChange}
                            onBackgroundChange={onBackgroundChange}
                            onBackgroundStyleChange={onBackgroundStyleChange}
                        />
                    )
                })}
            </div>
        </div>
        </SortableContext>
    )
}

// Droppable Logo Cell Component with Drag-and-Drop
function DroppableLogoCell({
    position,
    placement,
    logo,
    isOccupied,
    isAvailable,
    canPlace,
    isDragging,
    canDropHere,
    isDraggable,
    isAutoLocked,
    bgShape,
    bgStyle,
    positionLabel,
    selectedLogoId,
    onCellClick,
    onRemove,
    onSizeChange,
    onBackgroundChange,
    onBackgroundStyleChange,
}: {
    position: LogoPosition
    placement: LogoPlacement | undefined
    logo: OrganizationLogo | undefined
    isOccupied: boolean
    isAvailable: boolean
    canPlace: boolean
    isDragging: boolean
    canDropHere: boolean
    isDraggable: boolean
    isAutoLocked: boolean
    bgShape: LogoBackgroundShape
    bgStyle: LogoBackgroundStyle
    positionLabel: string
    selectedLogoId: string | null
    onCellClick: (position: LogoPosition) => void
    onRemove: (logoId: string) => void
    onSizeChange: (logoId: string, size: LogoSizePreset) => void
    onBackgroundChange: (logoId: string, shape: LogoBackgroundShape) => void
    onBackgroundStyleChange: (logoId: string, style: Partial<LogoBackgroundStyle>) => void
}) {
    // Use the logo ID or position as the draggable/droppable ID
    const id = placement?.logoId || position

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging: isDraggingFromHook,
    } = useSortable({
        id,
        disabled: !isDraggable,
    })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDraggingFromHook ? 0.5 : 1,
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                'aspect-[2/1] min-w-0 rounded-lg transition-all duration-200 flex items-center justify-center relative overflow-visible',
                // BASE STATE: Glass tile
                'bg-white/40 dark:bg-white/5 backdrop-blur-sm shadow-sm border border-white/20',
                // FOCUS STATE
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                // OCCUPIED: Clean look
                isOccupied && 'bg-white/80 dark:bg-white/10 shadow-md ring-1 ring-black/5 dark:ring-white/10',
                // AVAILABLE (Drafting Mode): Pulsing ring
                isAvailable && 'ring-2 ring-primary/50 bg-primary/5 animate-pulse cursor-pointer hover:bg-primary/10',
                // HOVER STATES
                canPlace && !isOccupied && 'hover:bg-primary/10 hover:ring-2 hover:ring-primary/30 cursor-pointer',
                !isOccupied && !isAvailable && 'opacity-60 grayscale-[0.5] hover:opacity-100 hover:grayscale-0',
                // v25.0: Drag visual states
                isDragging && 'opacity-30',
                canDropHere && isOccupied && 'ring-2 ring-blue-400/50 bg-blue-50/50',
                canDropHere && !isOccupied && 'ring-2 ring-blue-400/50 bg-blue-50/20 animate-pulse'
            )}
            onClick={() => {
                if (canPlace && !isOccupied) {
                    onCellClick(position)
                }
            }}
            role="gridcell"
            aria-label={isOccupied ? `${logo?.name || 'Logo'} at ${positionLabel}` : `Empty ${positionLabel}${isAvailable ? ', click to place logo' : ''}`}
            aria-selected={isOccupied}
        >
            {logo && placement ? (
                <Popover>
                    <PopoverTrigger asChild>
                        <div className="relative w-full h-full p-1 group cursor-pointer" {...attributes} {...listeners}>
                            {/* Logo with background preview */}
                            <div
                                className={cn(
                                    'w-full h-full flex items-center justify-center transition-transform group-hover:scale-105',
                                    // Background shape classes
                                    bgShape === 'rectangle' && 'bg-white shadow-sm',
                                    bgShape === 'rounded' && 'bg-white rounded-md shadow-sm',
                                    bgShape === 'circle' && 'bg-white rounded-full shadow-sm',
                                    // Style modifiers
                                    bgStyle?.shadow && 'shadow-md',
                                    bgStyle?.border && 'ring-1 ring-gray-200'
                                )}
                            >
                                <Image
                                    src={logo.thumbnail_url || logo.file_url || ''}
                                    alt={logo.name || 'Logo'}
                                    width={80}
                                    height={80}
                                    className={cn(
                                        'object-contain',
                                        // Adjust image size based on background
                                        bgShape !== 'none' ? 'w-[75%] h-[75%]' : 'w-full h-full'
                                    )}
                                    unoptimized={true}
                                />
                            </div>
                            {/* Settings indicator */}
                            <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-white shadow-md border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 scale-0 group-hover:scale-100 duration-200">
                                <Settings2 className="h-3 w-3 text-muted-foreground" />
                            </div>
                            {/* v25.0: Drag handle - only for draggable logos */}
                            {isDraggable && (
                                <div className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-blue-500 shadow-md border border-blue-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-20 scale-0 group-hover:scale-100 duration-200 cursor-grab active:cursor-grabbing">
                                    <GripVertical className="h-2.5 w-2.5 text-white" />
                                </div>
                            )}
                            {/* Lock indicator for auto-locked logos */}
                            {isAutoLocked && (
                                <div className="absolute -bottom-2 -right-2 w-5 h-5 rounded-full bg-slate-500 shadow-md border border-slate-400 flex items-center justify-center opacity-60 z-20">
                                    <Lock className="h-2.5 w-2.5 text-white" />
                                </div>
                            )}
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
                <span className="text-[8px] text-muted-foreground/30 font-mono" aria-hidden="true">
                    {position.split('-')[1]}
                </span>
            )}
        </div>
    )
}

function LogoOptionsPopover({
    logo,
    placement,
    onShapeChange,
    onStyleChange,
    onSizeChange,
    onRemove,
}: {
    logo: OrganizationLogo
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

    return (
        <div className="space-y-3">
            {/* Logo name */}
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded border p-0.5 bg-white">
                    <Image
                        src={logo.thumbnail_url || logo.file_url || ''}
                        alt={logo.name || 'Logo'}
                        width={32}
                        height={32}
                        className="w-full h-full object-contain"
                        unoptimized={true}
                    />
                </div>
                <div className="min-w-0 flex-1">
                    <span className="text-xs font-medium truncate block">{logo.name}</span>
                    <span className="text-[10px] text-muted-foreground block">Adjust styling</span>
                </div>
            </div>

            <Separator />

            {/* Logo Shape */}
            <div className="space-y-1.5">
                <Label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Shape</Label>
                <ToggleGroup
                    type="single"
                    value={currentShape}
                    onValueChange={(value) => value && onShapeChange(value as LogoBackgroundShape)}
                    className="justify-start gap-1"
                >
                    {BACKGROUND_SHAPE_OPTIONS.map((option) => (
                        <ToggleGroupItem
                            key={option.value}
                            value={option.value}
                            aria-label={option.label}
                            className="h-8 w-8 p-0 data-[state=on]:bg-primary/10 data-[state=on]:text-primary data-[state=on]:border-primary/20 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
                            title={option.label}
                        >
                            {/* Icons here would need to be imported or conditional */}
                            <span className="text-[10px]" aria-hidden="true">{option.label.slice(0, 1)}</span>
                        </ToggleGroupItem>
                    ))}
                </ToggleGroup>
            </div>
            {/* Remove button */}
            <Button
                variant="ghost"
                size="sm"
                onClick={onRemove}
                aria-label={`Remove ${logo.name || 'logo'} from placement`}
                className="w-full h-8 text-destructive hover:text-destructive hover:bg-destructive/10 focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-1"
            >
                Remove
            </Button>
        </div>
    )
}
