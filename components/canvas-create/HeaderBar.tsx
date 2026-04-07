'use client'

import { useCreativeStore } from '@/stores/creative-store'
import { useVerticals } from '@/hooks'
import { Sparkles, Wand2, Image, LayoutGrid, FileText, Palette } from 'lucide-react'
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
  // Mobile panel control (Bar 2)
  activePanel?: 'details' | 'style' | 'generate' | null
  onPanelChange?: (panel: 'details' | 'style' | 'generate' | null) => void
}

export function HeaderBar({
  onGenerate,
  isGenerating,
  canGenerate = true,
  hasGeneratedImage = false,
  verticals: propVerticals,
  selectedVertical: propSelectedVertical,
  onVerticalChange,
  activePanel,
  onPanelChange,
}: HeaderBarProps) {

  // Use hook verticals as fallback if props not provided
  const { verticals: hookVerticals } = useVerticals()
  const verticals = propVerticals || hookVerticals
  const {
    selectedFormat,
    selectFormat,
    formData,
    selectedVertical: storeSelectedVertical,
    selectVertical: storeSelectVertical,
    setCreationMode,
  } = useCreativeStore()

  // Use prop-based vertical if provided, otherwise fall back to store
  const currentSelectedVertical = propSelectedVertical || storeSelectedVertical
  const handleVerticalChange = onVerticalChange || storeSelectVertical

  const creationMode = formData.creationMode || 'scratch'

  return (
      <header className="border-b bg-card px-3 py-1.5">
        {/* Mobile Layout: Status strip + 3-tab bar */}
        <div className="flex flex-col gap-1.5 md:hidden">
          {/* Status strip — shows current format + mode at a glance */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="p-1 rounded-md bg-primary/10">
                <LayoutGrid className="h-3 w-3 text-primary" />
              </div>
              <span className="text-xs font-semibold text-foreground truncate max-w-[140px]">
                {selectedFormat?.label || 'Select Format'}
              </span>
            </div>
            <div className="flex items-center gap-1 p-0.5 bg-muted/50 rounded-lg border" data-tour="creation-mode">
              <button
                onClick={() => setCreationMode('scratch')}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all",
                  creationMode === 'scratch'
                    ? "bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Wand2 className="h-3 w-3" />
                AI
              </button>
              <button
                onClick={() => setCreationMode('template')}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all",
                  creationMode === 'template'
                    ? "bg-white shadow-sm text-primary border border-border/40"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Image className="h-3 w-3" />
                Template
              </button>
            </div>
          </div>

          {/* 3-tab bar: Setup | Details | Generate */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onPanelChange?.(activePanel === 'style' ? null : 'style')}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl text-xs font-semibold transition-all duration-150",
                activePanel === 'style'
                  ? "bg-white shadow-sm text-primary border border-primary/20"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              )}
            >
              <Palette className="h-3.5 w-3.5" />
              <span>Setup</span>
            </button>
            <button
              onClick={() => onPanelChange?.(activePanel === 'details' ? null : 'details')}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl text-xs font-semibold transition-all duration-150",
                activePanel === 'details'
                  ? "bg-white shadow-sm text-primary border border-primary/20"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              )}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Details</span>
            </button>
            <button
              onClick={() => onPanelChange?.(activePanel === 'generate' ? null : 'generate')}
              className={cn(
                "flex-[1.5] flex items-center justify-center gap-1.5 h-9 rounded-xl text-xs font-semibold transition-all duration-150 shadow-sm",
                activePanel === 'generate'
                  ? "bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white shadow-md"
                  : "bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 text-white hover:from-violet-600 hover:to-indigo-600"
              )}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Generate</span>
            </button>
          </div>
        </div>

        {/* Desktop Layout: empty — Generate button moved to bottom of right panel */}
        <div className="hidden md:flex" />
      </header>
  )
}
