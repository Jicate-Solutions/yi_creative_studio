'use client'

import { useCreativeStore } from '@/stores/creative-store'
import { Sparkles, FileText, Loader2, ClipboardCheck, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface HeaderBarProps {
  onGenerate: () => void
  isGenerating: boolean
  canGenerate?: boolean
  hasGeneratedImage?: boolean
  // Mobile dropdown props
  verticals?: Array<{ id: string; name: string; slug: string }>
  selectedVertical?: { id: string; name: string; slug: string } | null
  onVerticalChange?: (id: string) => void
  // Mobile panel control
  activePanel?: 'details' | 'style' | 'generate' | null
  onPanelChange?: (panel: 'details' | 'style' | 'generate' | null) => void
  panelMode?: 'edit' | 'review'
}

export function HeaderBar({
  onGenerate,
  isGenerating,
  canGenerate = true,
  hasGeneratedImage = false,
  activePanel,
  onPanelChange,
  panelMode = 'edit',
}: HeaderBarProps) {
  const { selectedFormat, formData } = useCreativeStore()
  const creationMode = formData.creationMode || 'scratch'

  return (
    <header className="border-b border-border/40 bg-card/90 backdrop-blur-md px-3 py-2.5 md:hidden shadow-sm">
      {/* Single compact row: Format pill | tabs | generate */}
      <div className="flex items-center gap-2">

        {/* Format pill — tappable to open Setup */}
        <button
          onClick={() => onPanelChange?.(activePanel === 'style' ? null : 'style')}
          className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-muted/50 border border-border/30 shadow-sm min-w-0 shrink hover:bg-muted/70 transition-colors"
        >
          <span className="text-[11px] font-semibold text-foreground/80 truncate max-w-[90px]">
            {selectedFormat?.label || 'Event Poster'}
          </span>
          <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
        </button>

        {/* Tabs row — Details/Review | Generate */}
        <div className="flex items-center gap-1 flex-1 min-w-0 p-0.5 bg-muted/50 rounded-xl border border-border/30">

          {/* Details / Review tab */}
          <button
            onClick={() => onPanelChange?.(activePanel === 'details' ? null : 'details')}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 h-9 rounded-[10px] text-[11px] font-semibold transition-all duration-200",
              activePanel === 'details'
                ? "bg-card shadow-sm text-primary border border-primary/20"
                : panelMode === 'review'
                  ? "text-violet-600 hover:text-violet-700"
                  : "text-muted-foreground hover:text-foreground"
            )}
          >
            {panelMode === 'review'
              ? <ClipboardCheck className="h-3.5 w-3.5 shrink-0" />
              : <FileText className="h-3.5 w-3.5 shrink-0" />
            }
            <span className="truncate">{panelMode === 'review' ? 'Review' : 'Details'}</span>
          </button>

          {/* Generate button — only enabled after user reviews */}
          <button
            onClick={() => onGenerate()}
            disabled={isGenerating || !canGenerate}
            className={cn(
              "flex-[1.4] flex items-center justify-center gap-1.5 h-9 rounded-[10px] text-xs font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
              isGenerating
                ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/30"
                : canGenerate
                  ? "bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-md shadow-violet-500/25 hover:from-violet-600 hover:to-indigo-600 hover:shadow-violet-500/40 active:scale-[0.97]"
                  : "bg-muted text-muted-foreground"
            )}
          >
            {isGenerating
              ? <><Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" /><span>Creating…</span></>
              : <><Sparkles className="h-3.5 w-3.5 shrink-0" /><span>Generate</span></>
            }
          </button>
        </div>
      </div>
    </header>
  )
}
