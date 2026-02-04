'use client'

import { useCreativeStore } from '@/stores/creative-store'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Layers, X, ImageIcon, Bookmark, GripVertical } from 'lucide-react'
import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { toast } from 'sonner'
import { VerticalPresetSelector } from '@/components/create/vertical-preset-selector'
import { InitiativePresetSelector } from '@/components/create/initiative-preset-selector'
import { SaveInitiativePresetDialog } from '@/components/create/save-initiative-preset-dialog'
import { SaveVerticalPresetDialog } from '@/components/create/save-vertical-preset-dialog'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { detectLogoType, LOGO_TYPE_CONFIGS } from '@/lib/config/logo-locks'

interface HeaderStripSettingsProps {
  className?: string
}

// Sortable Logo Component for ROW 2 drag-and-drop
interface SortableLogoProps {
  logoId: string
  logo: { id: string; name: string | null; file_url: string | null }
  onRemove: (logoId: string) => void
}

function SortableLogo({ logoId, logo, onRemove }: SortableLogoProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: logoId })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative flex items-center justify-center bg-slate-50 rounded p-1.5 h-14 min-w-[70px] transition-all group',
        isDragging && 'ring-2 ring-primary shadow-lg'
      )}
      title={logo.name || 'Logo'}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="absolute top-0.5 left-0.5 p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-slate-200 cursor-grab active:cursor-grabbing transition-opacity"
        title="Drag to reorder"
      >
        <GripVertical className="h-2 w-2 text-slate-400" />
      </button>

      {/* Logo Image */}
      {logo.file_url ? (
        <Image
          src={logo.file_url}
          alt={logo.name || 'Logo'}
          width={60}
          height={40}
          className="object-contain max-h-10"
          unoptimized
        />
      ) : (
        <span className="text-[6px] text-slate-400 truncate">{logo.name}</span>
      )}

      {/* Remove button */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onRemove(logoId)
        }}
        className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
      >
        <X className="h-2 w-2" />
      </button>
    </div>
  )
}

export function HeaderStripSettings({ className }: HeaderStripSettingsProps) {
  const {
    formData,
    logos,
    setEnhanced4RowEnabled,
    updateInitiativeText,
    setEnhanced4RowVersion,
    setFooterEnabled,
    addVerticalLogo4Row,
    removeVerticalLogo4Row,
    set4RowVerticalEnabled,
    reorderVerticalLogos4Row,
  } = useCreativeStore()

  const [showSaveVerticalPresetDialog, setShowSaveVerticalPresetDialog] = useState(false)
  const [showSaveInitiativePresetDialog, setShowSaveInitiativePresetDialog] = useState(false)

  // Drag-and-drop sensors for ROW 2
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = enhanced4Row.rows.vertical.logoIds.indexOf(active.id as string)
      const newIndex = enhanced4Row.rows.vertical.logoIds.indexOf(over.id as string)
      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(enhanced4Row.rows.vertical.logoIds, oldIndex, newIndex)
        reorderVerticalLogos4Row(newOrder)
        toast.success('Logo order updated')
      }
    }
  }

  const enhanced4Row = formData.enhanced4RowStrip
  const footer = enhanced4Row.footer

  // Get unique brand logos
  const brandLogosByType = new Map<string, typeof logos[0]>()
  const CONFIG_KEY_ORDER = ['yi-main', 'bharat-rising', 'cii-main']

  logos.forEach((logo) => {
    const logoType = detectLogoType(logo.name || '')
    if (logoType !== 'brand') return
    for (const [key, config] of Object.entries(LOGO_TYPE_CONFIGS)) {
      if (config.type === 'brand' && config.patterns.some(p => p.test(logo.name || ''))) {
        if (!brandLogosByType.has(key)) {
          brandLogosByType.set(key, logo)
        }
        break
      }
    }
  })

  const brandLogos = CONFIG_KEY_ORDER
    .map(key => brandLogosByType.get(key))
    .filter((logo): logo is typeof logos[0] => logo !== undefined)

  return (
    <div className={cn('space-y-2', className)}>
      {/* Master Toggle */}
      <div className={cn(
        'rounded-lg border transition-all p-2',
        enhanced4Row.enabled ? 'border-primary bg-primary/5' : 'border-muted'
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-3 w-3 text-primary" />
            <Label className="text-[10px] font-medium">Logo Strip</Label>
          </div>
          <Switch
            checked={enhanced4Row.enabled}
            onCheckedChange={(enabled) => {
              setEnhanced4RowEnabled(enabled)
              if (enabled) {
                setEnhanced4RowVersion('4-row-split')
                setFooterEnabled(true)
              }
            }}
          />
        </div>
      </div>

      {enhanced4Row.enabled && (
        <>
          {/* ROW 1 - Brand Logos */}
          <div className="rounded-lg border bg-card p-2">
            <div className="flex items-center justify-between mb-1">
              <div>
                <span className="text-[9px] font-medium">🏢 Official Brand Logos</span>
                <p className="text-[8px] text-muted-foreground">Yi, Bharat ONE, CII - auto-detected</p>
              </div>
              <span className="text-[7px] bg-green-100 text-green-700 px-1 rounded">AUTO</span>
            </div>
            {brandLogos.length > 0 ? (
              <div className="flex items-center gap-1">
                {brandLogos.map((logo) => (
                  <div key={logo.id} className="flex-1 flex items-center justify-center bg-slate-50 rounded p-1 h-10">
                    {logo.file_url && (
                      <Image
                        src={logo.file_url}
                        alt={logo.name || ''}
                        width={60}
                        height={35}
                        className="object-contain max-h-8"
                        unoptimized
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[8px] text-muted-foreground text-center py-1">
                Upload Yi, Bharat ONE, or CII logos
              </p>
            )}
          </div>

          {/* ROW 2 - Program Logos */}
          <div className="rounded-lg border bg-card p-2">
            <div className="flex items-center justify-between mb-1">
              <div>
                <span className="text-[9px] font-medium">🏷️ Program/Initiative Logos</span>
                <p className="text-[8px] text-muted-foreground">Add logos for your event (max 6, drag to reorder)</p>
              </div>
              <div className="flex items-center gap-1">
                {enhanced4Row.rows.vertical.enabled ? (
                  <span className="text-[7px] bg-green-100 text-green-700 px-1 rounded">VISIBLE</span>
                ) : (
                  <span className="text-[7px] bg-gray-100 text-gray-500 px-1 rounded">HIDDEN</span>
                )}
                <VerticalPresetSelector onSaveClick={() => setShowSaveVerticalPresetDialog(true)} />
                <Switch
                  checked={enhanced4Row.rows.vertical.enabled}
                  onCheckedChange={set4RowVerticalEnabled}
                />
              </div>
            </div>
            {enhanced4Row.rows.vertical.enabled && (
              <div className="space-y-1">
                <Select onValueChange={addVerticalLogo4Row}>
                  <SelectTrigger className="h-6 text-[9px]">
                    <SelectValue placeholder="Add program logo (max 6)" />
                  </SelectTrigger>
                  <SelectContent>
                    {logos
                      .filter(l => !enhanced4Row.rows.vertical.logoIds.includes(l.id))
                      .filter(l => l.id !== footer.digitalPartner.logoId)
                      .map((logo) => (
                        <SelectItem key={logo.id} value={logo.id}>
                          <div className="flex items-center gap-1">
                            {logo.file_url ? (
                              <Image src={logo.file_url} alt="" width={20} height={20} className="object-contain" unoptimized />
                            ) : (
                              <ImageIcon className="h-3 w-3 text-slate-300" />
                            )}
                            <span className="text-[9px] truncate">{logo.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {enhanced4Row.rows.vertical.logoIds.length > 0 && (
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={enhanced4Row.rows.vertical.logoIds} strategy={horizontalListSortingStrategy}>
                      <div className="flex items-center gap-1 flex-wrap">
                        {enhanced4Row.rows.vertical.logoIds.map((logoId) => {
                          const logo = logos.find(l => l.id === logoId)
                          return logo ? (
                            <SortableLogo key={logoId} logoId={logoId} logo={logo} onRemove={removeVerticalLogo4Row} />
                          ) : null
                        })}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
                <p className="text-[8px] text-muted-foreground">
                  {enhanced4Row.rows.vertical.logoIds.length}/6 logos
                </p>
              </div>
            )}
          </div>

          {/* ROW 3 - Chapter Name */}
          <div className="rounded-lg border bg-card p-2">
            <div className="flex items-center justify-between mb-1">
              <div>
                <span className="text-[9px] font-medium">📝 Chapter/Event Title</span>
                <p className="text-[8px] text-muted-foreground">Text displayed below logos (e.g., "Yi Erode")</p>
              </div>
              <div className="flex items-center gap-1">
                {enhanced4Row.rows.initiative.enabled ? (
                  <span className="text-[7px] bg-green-100 text-green-700 px-1 rounded">VISIBLE</span>
                ) : (
                  <span className="text-[7px] bg-gray-100 text-gray-500 px-1 rounded">HIDDEN</span>
                )}
                <Switch
                  checked={enhanced4Row.rows.initiative.enabled}
                  onCheckedChange={(enabled) => updateInitiativeText({ enabled })}
                />
              </div>
            </div>
            {enhanced4Row.rows.initiative.enabled && (
              <div className="space-y-1">
                <div className="flex items-center justify-between bg-muted/50 rounded p-1">
                  <div className="flex items-center gap-1">
                    <Bookmark className="h-2.5 w-2.5 text-muted-foreground" />
                    <span className="text-[8px] text-muted-foreground">Saved Texts</span>
                  </div>
                  <InitiativePresetSelector onSaveClick={() => setShowSaveInitiativePresetDialog(true)} />
                </div>
                <Input
                  value={enhanced4Row.rows.initiative.text}
                  onChange={(e) => updateInitiativeText({ text: e.target.value })}
                  placeholder="Yi Erode Initiative"
                  className="h-6 text-[9px]"
                />
              </div>
            )}
          </div>
        </>
      )}

      {/* Dialogs */}
      <SaveVerticalPresetDialog open={showSaveVerticalPresetDialog} onOpenChange={setShowSaveVerticalPresetDialog} />
      <SaveInitiativePresetDialog open={showSaveInitiativePresetDialog} onOpenChange={setShowSaveInitiativePresetDialog} />
    </div>
  )
}
