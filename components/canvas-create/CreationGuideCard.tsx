'use client'

import { Sparkles, FileText, Palette, Check, ChevronRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CreationGuideCardProps {
  formatLabel: string
  isDetailsDone: boolean
  isReviewed: boolean
  isGenerating: boolean
  onOpenSetup: () => void
  onOpenDetails: () => void
  onReview: () => void
  onGenerate: () => void
}

export function CreationGuideCard({
  formatLabel,
  isDetailsDone,
  isReviewed,
  isGenerating,
  onOpenSetup,
  onOpenDetails,
  onReview,
  onGenerate,
}: CreationGuideCardProps) {
  return (
    <div className="w-full max-w-[320px] mx-auto flex flex-col gap-4 py-5 px-2">

      {/* Header */}
      <div className="flex flex-col items-center gap-0.5 text-center">
        <h2 className="text-sm font-bold text-foreground">
          {isReviewed ? 'Ready to generate!' : isDetailsDone ? 'Review your details' : 'Fill event details'}
        </h2>
      </div>

      {/* Completed state card — shown after details are filled */}
      {isDetailsDone && (
        <button
          onClick={onOpenDetails}
          className="w-full flex items-center gap-3 px-3.5 py-3.5 rounded-xl border border-emerald-400/40 bg-emerald-500/5 hover:bg-emerald-500/10 shadow-sm transition-all duration-200 text-left group"
        >
          <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0 bg-emerald-500/15">
            <Check className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-emerald-600">Event Details</p>
            <p className="text-[10px] mt-0.5 leading-snug text-muted-foreground">Name, date, venue &amp; more — all set</p>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
        </button>
      )}

      {/* Primary CTA — three states */}
      {isReviewed ? (
        /* State 3: Generate (unlocked after review) */
        <Button
          onClick={onGenerate}
          disabled={isGenerating}
          className="w-full h-12 gap-2 text-sm font-semibold rounded-xl shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/40 transition-all duration-200 active:scale-[0.98] bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 hover:from-violet-600 hover:via-purple-600 hover:to-indigo-600 text-white"
        >
          {isGenerating ? (
            <><Loader2 className="h-4 w-4 animate-spin" /><span>Creating your design…</span></>
          ) : (
            <><Sparkles className="h-4 w-4" /><span>Generate Now</span></>
          )}
        </Button>
      ) : isDetailsDone ? (
        /* State 2: Review (details filled, not yet reviewed) */
        <Button
          onClick={onReview}
          className="w-full h-12 gap-2 text-sm font-semibold rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/40 transition-all duration-200 active:scale-[0.98] bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
        >
          <Check className="h-4 w-4" />
          <span>Review Details</span>
          <ChevronRight className="h-4 w-4 ml-auto opacity-70" />
        </Button>
      ) : (
        /* State 1: Fill details */
        <Button
          onClick={onOpenDetails}
          className="w-full h-12 gap-2 text-sm font-semibold rounded-xl shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/40 transition-all duration-200 active:scale-[0.98] bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white"
        >
          <FileText className="h-4 w-4" />
          <span>Fill Event Details</span>
          <ChevronRight className="h-4 w-4 ml-auto opacity-70" />
        </Button>
      )}

      {/* Style note */}
      <div className="flex items-center justify-center gap-1.5">
        <div className="h-px flex-1 bg-border/50" />
        <button
          onClick={onOpenSetup}
          className="flex items-center gap-1 text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted/40"
        >
          <Palette className="h-3 w-3" />
          Adjust style &amp; AI engine
        </button>
        <div className="h-px flex-1 bg-border/50" />
      </div>

    </div>
  )
}
