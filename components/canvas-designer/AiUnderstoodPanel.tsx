'use client'

import { useState } from 'react'
import { Sparkles, X, Loader2, Layers } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getStyleSwatch } from '@/lib/config/style-swatches'
import type { StyleBlendPlan, StructuredUnderstanding } from '@/lib/designer-pipeline'

/**
 * "AI understood this" panel.
 *
 * Surfaces the Designer Pipeline's userFacingSummary so the user can confirm how
 * the AI interpreted their brief — the deterministic bridge between user
 * expectation and AI interpretation, made visible.
 *
 * Two variants:
 *   - 'overlay' (default): a dismissible floating card above the generated preview.
 *     It stops click propagation so interacting with it never triggers the preview's
 *     open-full-view handler underneath.
 *   - 'inline': a non-floating card for the PRE-generation form area, fed by
 *     /api/designer-preview, so the user can confirm/edit BEFORE spending a generation.
 */
export function AiUnderstoodPanel({
  summary,
  structured = null,
  className,
  variant = 'overlay',
  loading = false,
  dismissible = true,
  styleBlendPlan = null,
}: {
  summary: string
  /**
   * v1.1: the structured "AI understood this" breakdown (Hero, background motifs,
   * colour direction, typography, text effects, style mix, rendering mode, will
   * avoid). When present it replaces the plain-text summary with a labelled field
   * list; when absent the panel falls back to `summary`.
   */
  structured?: StructuredUnderstanding | null
  className?: string
  variant?: 'overlay' | 'inline'
  /** Inline only: show a "reading your brief…" loading state while the preview fetches. */
  loading?: boolean
  dismissible?: boolean
  /** v2: the resolved role-based style blend. Renders a "Style Mix" block when active. */
  styleBlendPlan?: StyleBlendPlan | null
}) {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null
  if (!summary && !structured && !loading) return null

  const isOverlay = variant === 'overlay'

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={cn(
        isOverlay
          ? 'pointer-events-auto absolute left-1/2 top-3 z-20 w-[min(92%,640px)] -translate-x-1/2 shadow-lg backdrop-blur dark:bg-zinc-900/90 bg-white/95'
          : 'w-full bg-violet-50/70 dark:bg-violet-500/5',
        'rounded-xl border border-violet-200/70 dark:border-violet-400/20',
        className
      )}
    >
      <div className="flex items-start gap-2.5 p-3">
        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/15 to-indigo-500/15">
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-600 dark:text-violet-300" />
          ) : (
            <Sparkles className="h-3.5 w-3.5 text-violet-600 dark:text-violet-300" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-600 dark:text-violet-300">
            {loading ? 'Reading your brief…' : 'AI understood this'}
          </p>
          {!loading && structured ? (
            <StructuredUnderstandingFields structured={structured} />
          ) : (
            !loading &&
            summary && (
              <p className="mt-0.5 text-xs leading-relaxed text-zinc-700 dark:text-zinc-200">
                {summary}
              </p>
            )
          )}
          {/* Style Mix block — only when the user picked one or more styles. */}
          {!loading &&
            styleBlendPlan &&
            styleBlendPlan.mode !== 'auto' &&
            styleBlendPlan.understoodBullets.length > 0 && (
              <div className="mt-2 rounded-lg border border-violet-200/60 bg-violet-100/40 p-2 dark:border-violet-400/15 dark:bg-violet-500/10">
                <p className="flex items-center gap-1 text-[11px] font-semibold text-violet-700 dark:text-violet-200">
                  <Layers className="h-3 w-3" />
                  {styleBlendPlan.mode === 'single' ? 'Style' : 'Style Mix'}: {styleBlendPlan.stackLabel}
                </p>
                <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-violet-600/80 dark:text-violet-300/80">
                  AI will use:
                </p>
                <ul className="mt-0.5 space-y-0.5">
                  {styleBlendPlan.understoodBullets.map((b, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-1.5 text-[11px] leading-snug text-zinc-700 dark:text-zinc-200"
                    >
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ background: getStyleSwatch(styleBlendPlan.styleStack[i]?.id ?? '') }}
                        aria-hidden
                      />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          {variant === 'inline' && !loading && (
            <p className="mt-1 text-[10px] italic text-muted-foreground">
              If this is wrong, edit your details or visual idea — it updates automatically.
            </p>
          )}
        </div>
        {dismissible && (
          <button
            type="button"
            aria-label="Dismiss"
            onClick={(e) => {
              e.stopPropagation()
              setDismissed(true)
            }}
            className="shrink-0 rounded-md p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * Renders the structured "AI understood this" breakdown as a compact labelled
 * field list. Each row is skipped when its value is empty, so a sparse brief shows
 * only the fields the AI actually resolved.
 */
function StructuredUnderstandingFields({
  structured,
}: {
  structured: StructuredUnderstanding
}) {
  const rows: { label: string; value: string }[] = [
    { label: 'Hero', value: structured.hero?.trim() ?? '' },
    { label: 'Background', value: joinList(structured.backgroundMotifs) },
    { label: 'Color', value: structured.colorDirection?.trim() ?? '' },
    // v1.3 — prefer the rich designed-typography direction; fall back to role labels.
    { label: 'Typography', value: (structured.typographyDirection || '').trim() || joinList(structured.typography) },
    { label: 'Text effects', value: joinList(structured.textEffects) },
    { label: 'Style mix', value: structured.styleMix?.trim() ?? '' },
    { label: 'Rendering', value: formatRenderingMode(structured.renderingMode) },
    { label: 'Will avoid', value: joinList(structured.willAvoid) },
  ].filter((r) => r.value.length > 0)

  if (rows.length === 0) return null

  return (
    <dl className="mt-1 space-y-1">
      {rows.map((row) => (
        <div key={row.label} className="flex gap-2 text-xs leading-relaxed">
          <dt className="w-20 shrink-0 font-medium text-violet-700/90 dark:text-violet-300/90">
            {row.label}
          </dt>
          <dd className="min-w-0 flex-1 text-zinc-700 dark:text-zinc-200">{row.value}</dd>
        </div>
      ))}
    </dl>
  )
}

/** Join a string list into a comma-separated value, dropping empties. */
function joinList(items: string[] | undefined): string {
  if (!Array.isArray(items)) return ''
  return items.map((s) => (typeof s === 'string' ? s.trim() : '')).filter(Boolean).join(', ')
}

/** Humanise the rendering-mode token, e.g. "ai_native" -> "AI native". */
function formatRenderingMode(mode: string | undefined): string {
  if (!mode || !mode.trim()) return ''
  return mode
    .trim()
    .replace(/[_-]+/g, ' ')
    .replace(/\bai\b/gi, 'AI')
}
