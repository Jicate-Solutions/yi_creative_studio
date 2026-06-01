'use client'

import { useState } from 'react'
import { Layers, Pencil, Sparkles } from 'lucide-react'
import { getStyleSwatch } from '@/lib/config/style-swatches'
import { getBackgroundStyle } from '@/lib/config/background-styles'
import { getStackRoles, RECIPE_STACKS, AXIS_PHRASE } from '@/lib/designer-pipeline/s06-style-blend'
import { StyleMixStudio } from './StyleMixStudio'

interface StyleMixSectionProps {
  /** The user's ordered style stack (background-style ids). Empty = AI Auto. */
  selectedStack?: string[]
  onStackChange: (stack: string[]) => void
}

const PRESET_LABELS: Record<string, string> = {
  'cinematic-human-luxury': 'Cinematic Human Luxury',
  'premium-social-campaign': 'Premium Social Campaign',
  'documentary-advertising': 'Documentary Advertising',
  'conceptual-luxury': 'Conceptual Luxury',
  'institutional-premium': 'Institutional Premium',
}

/**
 * "Choose Style Mix" — compact inline summary (Designer Pipeline v2).
 *
 * Shows the current ordered mix as numbered swatch chips + a live role line, and an
 * "Edit mix" button that opens the spacious StyleMixStudio. When empty, offers AI Auto
 * plus quick-start presets (each shown with a mini 3-swatch preview).
 */
export function StyleMixSection({ selectedStack = [], onStackChange }: StyleMixSectionProps) {
  const [studioOpen, setStudioOpen] = useState(false)
  const roles = getStackRoles(selectedStack)
  const labelOf = (id: string) => getBackgroundStyle(id)?.label ?? id

  // One-line live summary, e.g. "Movie Poster leads · realistic people · finish".
  const roleLine = roles
    .map((r) => {
      const phrases = r.ownedAxes.map((a) => AXIS_PHRASE[a]).join(', ')
      if (r.isLead) return phrases ? `${r.label} leads · ${phrases}` : `${r.label} leads`
      return phrases || r.label
    })
    .join(' · ')

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Choose Style Mix</span>
        </div>
        {selectedStack.length > 0 && (
          <button
            type="button"
            onClick={() => onStackChange([])}
            className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground"
          >
            <Sparkles className="h-3 w-3" /> AI Auto
          </button>
        )}
      </div>

      {selectedStack.length > 0 ? (
        <>
          {/* Ordered swatch chips */}
          <div className="flex flex-wrap gap-1">
            {selectedStack.map((id, i) => (
              <span
                key={id}
                className="flex items-center gap-1 rounded-full bg-muted/60 py-0.5 pl-0.5 pr-2 text-[11px] font-medium"
              >
                <span
                  className="flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold text-white drop-shadow"
                  style={{ background: getStyleSwatch(id) }}
                >
                  {i + 1}
                </span>
                {labelOf(id)}
              </span>
            ))}
          </div>
          {roleLine && <p className="text-[10px] leading-snug text-muted-foreground">{roleLine}</p>}
          <button
            type="button"
            onClick={() => setStudioOpen(true)}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-primary/40 bg-primary/5 py-1.5 text-xs font-medium text-primary hover:bg-primary/10"
          >
            <Pencil className="h-3 w-3" /> Edit mix
          </button>
        </>
      ) : (
        <>
          <p className="text-[10px] italic text-muted-foreground">
            AI Auto — or build your own: pick one style, or several in order to blend them.
          </p>
          {/* Quick-start presets with a mini 3-swatch preview */}
          <div className="flex flex-wrap gap-1">
            {Object.entries(RECIPE_STACKS).map(([id, stack]) => (
              <button
                key={id}
                type="button"
                onClick={() => onStackChange(stack)}
                title={stack.map(labelOf).join(' + ')}
                className="flex items-center gap-1.5 rounded-full border border-border bg-muted/40 py-0.5 pl-1 pr-2 text-[10px] hover:bg-muted"
              >
                <span className="flex">
                  {stack.slice(0, 3).map((sid, idx) => (
                    <span
                      key={sid}
                      className="h-3.5 w-3.5 rounded-full ring-1 ring-background"
                      style={{ background: getStyleSwatch(sid), marginLeft: idx === 0 ? 0 : -5 }}
                    />
                  ))}
                </span>
                {PRESET_LABELS[id] ?? id}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setStudioOpen(true)}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-primary/40 bg-primary/5 py-1.5 text-xs font-medium text-primary hover:bg-primary/10"
          >
            <Layers className="h-3 w-3" /> Browse styles
          </button>
        </>
      )}

      <StyleMixStudio
        open={studioOpen}
        onOpenChange={setStudioOpen}
        stack={selectedStack}
        onChange={onStackChange}
      />
    </div>
  )
}
