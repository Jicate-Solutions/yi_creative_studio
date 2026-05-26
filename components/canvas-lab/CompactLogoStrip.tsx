'use client'

import { useState, useMemo } from 'react'
import { useCreativeStore, type LogoPlacement } from '@/stores/creative-store'
import { useLogos } from '@/hooks'
import { cn } from '@/lib/utils'
import { Plus, GripVertical, X } from 'lucide-react'
import { LOGO_POSITIONS, type LogoPosition } from '@/lib/config/constants'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import Image from 'next/image'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface SortableLogoProps {
  placement: LogoPlacement
  logo?: {
    id: string
    name: string
    file_url: string
  }
  onRemove: (logoId: string) => void
}

function SortableLogo({ placement, logo, onRemove }: SortableLogoProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: placement.logoId })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  if (!logo) return null

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative group flex flex-col items-center gap-1',
        isDragging && 'opacity-50'
      )}
    >
      {/* Logo Image */}
      <div
        className={cn(
          'w-12 h-12 rounded-lg border bg-white overflow-hidden',
          'flex items-center justify-center',
          'cursor-grab active:cursor-grabbing'
        )}
        {...attributes}
        {...listeners}
      >
        <Image
          src={logo.file_url}
          alt={logo.name}
          width={40}
          height={40}
          className="object-contain"
        />
      </div>

      {/* Remove Button */}
      <button
        onClick={() => onRemove(placement.logoId)}
        className={cn(
          'absolute -top-1 -right-1 w-5 h-5 rounded-full',
          'bg-destructive text-destructive-foreground',
          'flex items-center justify-center',
          'opacity-0 group-hover:opacity-100 transition-opacity'
        )}
      >
        <X className="h-3 w-3" />
      </button>

      {/* Logo Name */}
      <span className="text-[10px] text-muted-foreground truncate max-w-[48px]">
        {logo.name}
      </span>
    </div>
  )
}

export function CompactLogoStrip() {
  const { logos } = useLogos()
  const { formData, removeLogoPlacement, swapLogoPositions, addLogoPlacement } = useCreativeStore()
  const [showLogoSelector, setShowLogoSelector] = useState(false)

  const placements = formData.logosPlacements || []

  // Get logos that are not already placed
  const availableLogos = logos.filter(
    (logo) => !placements.some((p) => p.logoId === logo.id)
  )

  // Find next available position (prefer bottom row, then mid row, then top row)
  const getNextAvailablePosition = useMemo((): LogoPosition => {
    const usedPositions = new Set(placements.map((p) => p.position))

    // Priority order: bottom row (for user logos), then mid row, then remaining top positions
    const preferredOrder: LogoPosition[] = [
      // Bottom row first (user-added logos typically go here)
      'bottom-1', 'bottom-2', 'bottom-3', 'bottom-4', 'bottom-5', 'bottom-6',
      // Mid row next
      'mid-1', 'mid-2', 'mid-3', 'mid-4', 'mid-5', 'mid-6',
      // Top row last (usually reserved for brand logos)
      'top-3', 'top-4', 'top-5', // Avoid top-1 (Yi), top-2 (Bharat ONE), top-6 (CII)
      'top-1', 'top-2', 'top-6',
    ]

    for (const pos of preferredOrder) {
      if (!usedPositions.has(pos)) {
        return pos
      }
    }

    // Fallback to first position if all are taken (shouldn't happen with max 18)
    return 'bottom-1'
  }, [placements])

  const handleAddLogo = (logoId: string) => {
    addLogoPlacement(logoId, getNextAvailablePosition)
    setShowLogoSelector(false)
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      swapLogoPositions(active.id as string, over.id as string)
    }
  }

  const handleRemove = (logoId: string) => {
    removeLogoPlacement(logoId)
  }

  // Get logo data for each placement
  const getLogoData = (logoId: string) => {
    return logos.find((l) => l.id === logoId)
  }

  return (
    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg min-h-[80px]">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={placements.map((p) => p.logoId)}
          strategy={horizontalListSortingStrategy}
        >
          {placements.map((placement) => (
            <SortableLogo
              key={placement.logoId}
              placement={placement}
              logo={getLogoData(placement.logoId)}
              onRemove={handleRemove}
            />
          ))}
        </SortableContext>
      </DndContext>

      {/* Add Logo Button */}
      {placements.length < 6 && availableLogos.length > 0 && (
        <Popover open={showLogoSelector} onOpenChange={setShowLogoSelector}>
          <PopoverTrigger asChild>
            <button
              className={cn(
                'w-12 h-12 rounded-lg border-2 border-dashed border-muted-foreground/30',
                'flex items-center justify-center',
                'hover:border-primary hover:bg-primary/5 transition-colors'
              )}
            >
              <Plus className="h-5 w-5 text-muted-foreground" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2" align="start">
            <p className="text-xs font-medium text-muted-foreground mb-2 px-1">
              Select a logo to add
            </p>
            <div className="grid grid-cols-3 gap-2">
              {availableLogos.map((logo) => (
                <button
                  key={logo.id}
                  onClick={() => handleAddLogo(logo.id)}
                  className="p-2 border rounded-lg hover:bg-muted transition-colors flex flex-col items-center gap-1"
                >
                  <Image
                    src={logo.file_url}
                    alt={logo.name}
                    width={32}
                    height={32}
                    className="object-contain"
                  />
                  <span className="text-[10px] text-muted-foreground truncate max-w-full">
                    {logo.name}
                  </span>
                </button>
              ))}
            </div>
            {availableLogos.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">
                All logos are already added
              </p>
            )}
          </PopoverContent>
        </Popover>
      )}

      {/* Empty State */}
      {placements.length === 0 && (
        <p className="text-xs text-muted-foreground">
          No logos added. Click + to add.
        </p>
      )}

      {/* Drag Hint */}
      {placements.length > 1 && (
        <div className="flex items-center gap-1 ml-auto text-[10px] text-muted-foreground">
          <GripVertical className="h-3 w-3" />
          <span>Drag to reorder</span>
        </div>
      )}
    </div>
  )
}
