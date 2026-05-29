'use client'

import { useMemo, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getGroupedBackgroundStyles } from '@/lib/config/background-styles'

/**
 * Collapsible, category-grouped background-style picker. Shared by the create / lab /
 * forge canvas panels so the grouping logic lives in one place. Presentation-only —
 * the selected id is passed straight back via onSelect. The category containing the
 * current value opens by default; clicking a header toggles its section.
 */
export function BackgroundStylePicker({
  value,
  onSelect,
}: {
  value: string
  onSelect: (id: string) => void
}) {
  const groups = useMemo(() => getGroupedBackgroundStyles(), [])
  const activeGroupLabel = useMemo(
    () => groups.find((g) => g.styles.some((s) => s.id === value))?.label ?? groups[0]?.label ?? null,
    [groups, value]
  )
  const [openLabel, setOpenLabel] = useState<string | null>(activeGroupLabel)

  return (
    <div className="space-y-1">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50">Background Style</p>
      <div className="space-y-1">
        {groups.map((group) => {
          const isOpen = openLabel === group.label
          const hasActive = group.styles.some((s) => s.id === value)
          return (
            <div key={group.label} className="rounded-lg border border-border/40 overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenLabel(isOpen ? null : group.label)}
                className={cn(
                  'flex w-full items-center justify-between px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors',
                  hasActive ? 'text-primary' : 'text-muted-foreground/70',
                  'hover:bg-muted/30'
                )}
              >
                <span className="flex items-center gap-1.5">
                  {group.label}
                  {hasActive && <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />}
                  <span className="text-muted-foreground/40 font-medium normal-case tracking-normal">
                    ({group.styles.length})
                  </span>
                </span>
                <ChevronDown className={cn('h-3.5 w-3.5 shrink-0 transition-transform', isOpen && 'rotate-180')} />
              </button>
              {isOpen && (
                <div className="grid grid-cols-4 gap-1 p-1.5 pt-0">
                  {group.styles.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => onSelect(s.id)}
                      className={cn(
                        'flex flex-col items-center gap-0.5 p-1.5 rounded-lg border transition-all duration-150',
                        value === s.id
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-border/40 hover:border-border/70 hover:bg-muted/30'
                      )}
                    >
                      <span className="text-base leading-none">{s.icon}</span>
                      <span
                        className={cn(
                          'text-[9px] font-semibold text-center leading-tight',
                          value === s.id ? 'text-primary' : 'text-muted-foreground'
                        )}
                      >
                        {s.label}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
