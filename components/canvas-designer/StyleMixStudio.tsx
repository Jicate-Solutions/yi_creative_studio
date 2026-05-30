'use client'

import { useMemo, useState } from 'react'
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
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Layers, Search, Sparkles, X } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { getGroupedBackgroundStyles } from '@/lib/config/background-styles'
import { getStyleSwatch } from '@/lib/config/style-swatches'
import { getStackRoles, AXIS_PHRASE } from '@/lib/designer-pipeline/s06-style-blend'
import { cn } from '@/lib/utils'

/**
 * "Style Mix Studio" — the spacious builder for an ordered, role-based style stack.
 *
 *  • LEFT: searchable, category-filtered swatch grid (the full library). Click a tile
 *    to add it to the mix (appended) or remove it. Selected tiles show an order badge.
 *  • RIGHT: your mix as a drag-reorderable list (1st = lead). Each row shows the
 *    dimensions that style OWNS — recomputed live as you add / remove / reorder, so
 *    "order = priority" is visible (drag Luxury above the lead → ownership flips).
 *
 * Pure UI: ownership comes from getStackRoles() (the same engine the server runs).
 */
export function StyleMixStudio({
  open,
  onOpenChange,
  stack,
  onChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  stack: string[]
  onChange: (stack: string[]) => void
}) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string>('All')

  const groups = useMemo(() => getGroupedBackgroundStyles(), [])
  const categories = useMemo(() => ['All', ...groups.map((g) => g.label)], [groups])
  const roles = getStackRoles(stack)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const orderOf = (id: string) => stack.indexOf(id)
  const toggle = (id: string) => {
    const i = orderOf(id)
    if (i === -1) onChange([...stack, id])
    else onChange(stack.filter((s) => s !== id))
  }
  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const oldI = stack.indexOf(String(active.id))
    const newI = stack.indexOf(String(over.id))
    if (oldI !== -1 && newI !== -1) onChange(arrayMove(stack, oldI, newI))
  }

  // Library tiles for the active category + search filter.
  const visibleGroups = groups
    .filter((g) => category === 'All' || g.label === category)
    .map((g) => ({
      label: g.label,
      styles: g.styles.filter((s) => s.label.toLowerCase().includes(search.trim().toLowerCase())),
    }))
    .filter((g) => g.styles.length > 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        solidBackground
        className="flex h-[88vh] w-[calc(100%-1rem)] max-w-4xl flex-col overflow-hidden p-0 sm:max-w-4xl"
      >
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-border/40 px-4 py-3 pr-12">
          <Layers className="h-4 w-4 shrink-0 text-primary" />
          <div className="min-w-0">
            <DialogTitle className="text-sm font-semibold">Style Mix Studio</DialogTitle>
            <DialogDescription className="text-[11px] text-muted-foreground">
              Pick styles in order — the 1st leads, the rest fill the gaps.
            </DialogDescription>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          {/* RIGHT pane (your mix) — shown FIRST on mobile so it's always visible. */}
          <aside className="order-first flex shrink-0 flex-col border-b border-border/40 md:order-last md:w-[300px] md:border-b-0 md:border-l">
            <div className="flex items-center justify-between px-3 py-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">
                Your Mix {stack.length > 0 && `(${stack.length})`}
              </p>
              {stack.length > 0 && (
                <button
                  type="button"
                  onClick={() => onChange([])}
                  className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground"
                >
                  <Sparkles className="h-3 w-3" /> AI Auto
                </button>
              )}
            </div>

            {stack.length === 0 ? (
              <div className="flex flex-1 items-center justify-center px-4 py-6 text-center">
                <p className="text-[11px] italic text-muted-foreground">
                  AI Auto — pick a style to start, or several to blend them (1st leads).
                </p>
              </div>
            ) : (
              <div className="max-h-48 flex-1 overflow-y-auto px-2 pb-2 md:max-h-none">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                  <SortableContext items={stack} strategy={verticalListSortingStrategy}>
                    <div className="space-y-1.5">
                      {roles.map((r, i) => (
                        <MixRow
                          key={r.id}
                          id={r.id}
                          index={i}
                          label={r.label}
                          isLead={r.isLead}
                          ownedAxes={r.ownedAxes}
                          onRemove={() => toggle(r.id)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            )}
          </aside>

          {/* LEFT pane (library) */}
          <div className="flex min-h-0 flex-1 flex-col">
            {/* Search + category filter */}
            <div className="space-y-2 border-b border-border/40 p-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search styles…"
                  className="h-8 pl-8 text-xs"
                />
              </div>
              <div className="flex flex-wrap gap-1">
                {categories.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(c)}
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[10px] transition-colors',
                      category === c
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Swatch grid */}
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
              {visibleGroups.length === 0 && (
                <p className="py-8 text-center text-xs text-muted-foreground">No styles match “{search}”.</p>
              )}
              {visibleGroups.map((group) => (
                <div key={group.label} className="space-y-1.5">
                  {category === 'All' && (
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                      {group.label}
                    </p>
                  )}
                  <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
                    {group.styles.map((style) => {
                      const order = orderOf(style.id)
                      const active = order !== -1
                      return (
                        <button
                          key={style.id}
                          type="button"
                          onClick={() => toggle(style.id)}
                          className={cn(
                            'group relative overflow-hidden rounded-lg border text-left transition-all',
                            active
                              ? 'border-primary ring-2 ring-primary'
                              : 'border-border/40 hover:border-border'
                          )}
                        >
                          {/* Swatch */}
                          <div
                            className="flex h-12 items-center justify-center text-lg"
                            style={{ background: getStyleSwatch(style.id) }}
                          >
                            <span className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">{style.icon}</span>
                          </div>
                          {/* Label */}
                          <div className="truncate px-1.5 py-1 text-[10px] font-medium">{style.label}</div>
                          {/* Selection overlay */}
                          {active && (
                            <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                              {order + 1}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border/40 px-4 py-3">
          <p className="text-[11px] text-muted-foreground">
            {stack.length === 0
              ? 'AI Auto'
              : stack.length === 1
                ? '1 style selected'
                : `${stack.length}-style blend`}
          </p>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-lg bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Done
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/** A draggable row in the "Your Mix" list. */
function MixRow({
  id,
  index,
  label,
  isLead,
  ownedAxes,
  onRemove,
}: {
  id: string
  index: number
  label: string
  isLead: boolean
  ownedAxes: string[]
  onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-start gap-1.5 rounded-lg border border-border/40 bg-card p-1.5',
        isDragging && 'opacity-60 shadow-lg ring-1 ring-primary'
      )}
    >
      <button
        type="button"
        className="mt-0.5 cursor-grab touch-none text-muted-foreground/50 hover:text-foreground active:cursor-grabbing"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>

      {/* Mini swatch */}
      <span
        className="mt-0.5 h-5 w-5 shrink-0 rounded"
        style={{ background: getStyleSwatch(id) }}
        aria-hidden
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-muted text-[9px] font-bold text-muted-foreground">
            {index + 1}
          </span>
          <span className="truncate text-[11px] font-medium">{label}</span>
          {isLead && (
            <span className="shrink-0 rounded-full bg-primary/15 px-1.5 text-[9px] font-semibold uppercase text-primary">
              Leads
            </span>
          )}
        </div>
        {ownedAxes.length > 0 ? (
          <div className="mt-0.5 flex flex-wrap gap-0.5">
            {ownedAxes.map((axis) => (
              <span
                key={axis}
                className="rounded bg-violet-100 px-1 text-[9px] text-violet-700 dark:bg-violet-500/15 dark:text-violet-300"
              >
                {AXIS_PHRASE[axis as keyof typeof AXIS_PHRASE] ?? axis}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-0.5 text-[9px] italic text-muted-foreground">
            {isLead ? 'full style' : 'supporting accent'}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={onRemove}
        className="mt-0.5 shrink-0 rounded p-0.5 text-muted-foreground/60 hover:bg-muted hover:text-foreground"
        aria-label={`Remove ${label}`}
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  )
}
