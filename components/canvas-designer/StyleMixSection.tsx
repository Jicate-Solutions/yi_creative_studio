'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, X } from 'lucide-react'
import { getGroupedBackgroundStyles, getBackgroundStyle } from '@/lib/config/background-styles'
import { getStyleSwatch } from '@/lib/config/style-swatches'
import { getStackRoles, RECIPE_STACKS } from '@/lib/designer-pipeline/s06-style-blend'
import type { StyleAxis } from '@/lib/designer-pipeline/contracts'
import { cn } from '@/lib/utils'

interface StyleMixSectionProps {
  selectedStack?: string[]
  onStackChange: (stack: string[]) => void
}

const QUICK_LOOK_PRESETS: { id: keyof typeof RECIPE_STACKS; label: string }[] = [
  { id: 'cinematic-human-luxury', label: 'Bold & Cinematic' },
  { id: 'premium-social-campaign', label: 'Premium Social' },
  { id: 'documentary-advertising', label: 'Documentary' },
  { id: 'conceptual-luxury', label: 'Concept Luxury' },
  { id: 'institutional-premium', label: 'Event Spotlight' },
]

const AXIS_VERB: Record<StyleAxis, string> = {
  lighting: 'sets the mood',
  people: 'adds real people',
  color: 'drives the colour',
  spacing: 'controls the space',
  composition: 'frames the scene',
  finish: 'adds the finish',
}

// Abbreviated category labels so pills fit the narrow panel
const SHORT_CAT: Record<string, string> = {
  All: 'All',
  Photographic: 'Photo',
  Illustration: 'Illus.',
  'Graphic & Type': 'Graphic',
  'Abstract & Atmospheric': 'Abstract',
  'Cultural & Heritage': 'Cultural',
  'Premium & Bold': 'Premium',
  'Campus & Academic': 'Campus',
  Custom: 'Custom',
}

function toPlainSummary(roles: ReturnType<typeof getStackRoles>): string {
  return roles
    .map((r) => {
      if (r.isLead) return `${r.label} sets the mood`
      const axis = r.ownedAxes[0] as StyleAxis | undefined
      return axis ? `${r.label} ${AXIS_VERB[axis]}` : `${r.label} accents the look`
    })
    .join(' · ')
}

function matchedPresetId(stack: string[]): string | null {
  for (const { id } of QUICK_LOOK_PRESETS) {
    const preset = RECIPE_STACKS[id]
    if (preset.length === stack.length && preset.every((sid, i) => sid === stack[i])) return id
  }
  return null
}

export function StyleMixSection({ selectedStack = [], onStackChange }: StyleMixSectionProps) {
  const [browsing, setBrowsing] = useState(false)
  const [activeCategory, setActiveCategory] = useState('All')

  const groups = getGroupedBackgroundStyles()
  const categories = ['All', ...groups.map((g) => g.label)]

  const roles = getStackRoles(selectedStack)
  const summary = selectedStack.length > 1 ? toPlainSummary(roles) : null
  const activePreset = matchedPresetId(selectedStack)
  const canAdd = selectedStack.length < 3

  const labelOf = (id: string) => getBackgroundStyle(id)?.label ?? id

  const toggle = (id: string) => {
    const i = selectedStack.indexOf(id)
    if (i !== -1) onStackChange(selectedStack.filter((s) => s !== id))
    else if (canAdd) onStackChange([...selectedStack, id])
  }

  const moveUp = (i: number) => {
    if (i === 0) return
    const next = [...selectedStack]
    ;[next[i - 1], next[i]] = [next[i], next[i - 1]]
    onStackChange(next)
  }

  const moveDown = (i: number) => {
    if (i === selectedStack.length - 1) return
    const next = [...selectedStack]
    ;[next[i], next[i + 1]] = [next[i + 1], next[i]]
    onStackChange(next)
  }

  const visibleGroups = groups
    .filter((g) => activeCategory === 'All' || g.label === activeCategory)
    .map((g) => ({ label: g.label, styles: g.styles }))
    .filter((g) => g.styles.length > 0)

  return (
    <div className="space-y-2">

      {/* ── 1. YOUR MIX — top priority, shown when stack has items ── */}
      {selectedStack.length > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/50">
              Your Mix
            </p>
            <button
              type="button"
              onClick={() => onStackChange([])}
              className="text-[9px] text-muted-foreground/50 transition-colors hover:text-foreground"
            >
              Clear
            </button>
          </div>

          <div className="space-y-0.5">
            {selectedStack.map((id, i) => {
              const role = roles[i]
              return (
                <div
                  key={id}
                  className="flex items-center gap-1 rounded border border-border/30 bg-card/50 px-1.5 py-1"
                >
                  <span className="w-3.5 shrink-0 text-center text-[9px] font-bold text-muted-foreground/50">
                    {i + 1}
                  </span>
                  <span
                    className="h-4 w-4 shrink-0 rounded-sm"
                    style={{ background: getStyleSwatch(id) }}
                    aria-hidden
                  />
                  <span className="flex-1 truncate text-[11px] font-medium">{labelOf(id)}</span>
                  {role?.isLead && (
                    <span className="shrink-0 rounded bg-primary/15 px-1 text-[8px] font-bold uppercase leading-tight text-primary">
                      Lead
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => moveUp(i)}
                    disabled={i === 0}
                    aria-label="Move up"
                    className="rounded p-0.5 text-muted-foreground/40 hover:text-foreground disabled:opacity-20"
                  >
                    <ChevronUp className="h-2.5 w-2.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveDown(i)}
                    disabled={i === selectedStack.length - 1}
                    aria-label="Move down"
                    className="rounded p-0.5 text-muted-foreground/40 hover:text-foreground disabled:opacity-20"
                  >
                    <ChevronDown className="h-2.5 w-2.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggle(id)}
                    aria-label={`Remove ${labelOf(id)}`}
                    className="rounded p-0.5 text-muted-foreground/40 hover:text-foreground"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
              )
            })}
          </div>

          {summary && (
            <p className="pt-0.5 text-[9px] leading-snug text-muted-foreground/60">{summary}</p>
          )}
        </div>
      )}

      {/* ── 2. QUICK LOOKS — compact pill row, always visible ── */}
      {selectedStack.length === 0 && (
        <p className="text-[9px] italic text-muted-foreground/40">
          AI picks the style · or choose a look:
        </p>
      )}
      <div className="flex gap-1.5 overflow-x-auto [&::-webkit-scrollbar]:hidden">
        {QUICK_LOOK_PRESETS.map(({ id, label }) => {
          const stack = RECIPE_STACKS[id]
          const isActive = activePreset === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => onStackChange(isActive ? [] : stack)}
              className={cn(
                'flex h-7 shrink-0 items-center gap-1 whitespace-nowrap rounded-full border pl-0.5 pr-2 text-[10px] font-medium transition-all',
                isActive
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border/50 text-muted-foreground hover:border-border hover:text-foreground'
              )}
            >
              {/* 3-colour swatch strip */}
              <div className="flex h-5 w-6 shrink-0 overflow-hidden rounded-full">
                {stack.slice(0, 3).map((sid) => (
                  <div key={sid} className="flex-1" style={{ background: getStyleSwatch(sid) }} />
                ))}
              </div>
              {label}
            </button>
          )
        })}
      </div>

      {/* ── 3. BROWSE TOGGLE — subtle text-link, not a heavy button ── */}
      <div className="border-t border-border/20 pt-1.5">
        <button
          type="button"
          onClick={() => setBrowsing((b) => !b)}
          className="flex w-full items-center gap-1 text-[10px] text-muted-foreground/50 transition-colors hover:text-muted-foreground"
        >
          {browsing ? (
            <ChevronUp className="h-3 w-3 shrink-0" />
          ) : (
            <ChevronDown className="h-3 w-3 shrink-0" />
          )}
          <span className="flex-1 text-left">Browse all styles</span>
          {!canAdd && (
            <span className="rounded bg-amber-500/15 px-1 text-[8px] font-semibold text-amber-500">
              max 3
            </span>
          )}
        </button>

        {/* ── 4. INLINE BROWSER — max-height so it never pushes Your Mix off screen ── */}
        {browsing && (
          <div className="mt-1.5 space-y-1.5">
            <p className="text-[9px] text-muted-foreground/40 italic">
              Tap once for a single style · tap more to blend up to 3
            </p>
            {/* Category pills — short labels */}
            <div className="flex gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    'shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-medium transition-colors',
                    activeCategory === cat
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                  )}
                >
                  {SHORT_CAT[cat] ?? cat}
                </button>
              ))}
            </div>

            {/* Style grid — scrolls internally, never overflows the panel */}
            <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-border/30 bg-muted/10 p-1.5 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:bg-border/60">
              {visibleGroups.map((group) => (
                <div key={group.label} className="space-y-1">
                  {activeCategory === 'All' && (
                    <p className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground/40">
                      {group.label}
                    </p>
                  )}
                  <div className="grid grid-cols-3 gap-1">
                    {group.styles.map((style) => {
                      const order = selectedStack.indexOf(style.id)
                      const isSelected = order !== -1
                      const disabled = !isSelected && !canAdd
                      return (
                        <button
                          key={style.id}
                          type="button"
                          onClick={() => toggle(style.id)}
                          disabled={disabled}
                          title={
                            disabled ? 'Max 3 styles — remove one first' : style.label
                          }
                          className={cn(
                            'group relative overflow-hidden rounded border text-left transition-all',
                            isSelected
                              ? 'border-primary ring-1 ring-primary'
                              : 'border-border/30 hover:border-border/60',
                            disabled && 'cursor-not-allowed opacity-30'
                          )}
                        >
                          <div
                            className="flex h-8 items-center justify-center text-sm"
                            style={{ background: getStyleSwatch(style.id) }}
                          >
                            <span className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                              {style.icon}
                            </span>
                          </div>
                          <div className="truncate px-1 py-0.5 text-[8px] font-medium leading-tight">
                            {style.label}
                          </div>
                          {isSelected && (
                            <span className="absolute right-0.5 top-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-primary text-[7px] font-bold text-primary-foreground">
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
        )}
      </div>
    </div>
  )
}
