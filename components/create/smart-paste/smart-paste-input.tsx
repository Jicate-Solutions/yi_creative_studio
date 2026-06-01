'use client'

import { useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Sparkles, ClipboardPaste, Trash2, AlertCircle, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EXTRACTION_CONFIG } from '@/types/extraction.types'

interface SmartPasteInputProps {
  onExtract: (text: string) => Promise<void>
  isExtracting: boolean
  error?: string | null
  /** Compact mode for inline panel use — smaller textarea, slim loading bar */
  compact?: boolean
}

const PLACEHOLDER_TEXT = `Paste or type your event details here…

Include: event name, date, time, venue, and speaker names.

Example:
Tech Summit 2026 · Date: 15 Mar · 10 AM
Venue: Main Auditorium
Speaker: Dr. A. Kumar, IIT Madras`

export function SmartPasteInput({
  onExtract,
  isExtracting,
  error,
  compact = false,
}: SmartPasteInputProps) {
  const [rawText, setRawText] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [isApproved, setIsApproved] = useState(false)

  const isValidLength = rawText.trim().length >= EXTRACTION_CONFIG.minTextLength
  const isTooLong = rawText.length > EXTRACTION_CONFIG.maxTextLength
  const hasContent = rawText.trim().length > 0

  const handleApprove = () => {
    if (!isValidLength || isTooLong || isExtracting) return
    setIsApproved(true)
    onExtract(rawText)
  }

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      setIsApproved(false)
      setRawText(text)
    } catch {
      // Clipboard access denied — user can paste manually
    }
  }

  const handleTextareaPaste = () => {
    setIsApproved(false)
  }

  const handleClear = () => {
    setRawText('')
    setIsApproved(false)
  }

  return (
    <div className={cn("space-y-3", !compact && "space-y-5")}>
      {/* Textarea Container */}
      <div
        className={cn(
          "relative rounded-xl transition-all duration-300",
          isFocused
            ? "ring-2 ring-primary/50 shadow-lg shadow-primary/10"
            : "ring-1 ring-border/50",
          isExtracting && !compact && "opacity-75 pointer-events-none"
        )}
      >
        {/* Textarea Header
            Compact: only action buttons (outer section already shows "Event Details" label)
            Full:    icon + label + action buttons */}
        <div className={cn(
          "flex items-center bg-muted/20 border-b border-border/30 rounded-t-xl",
          compact ? "justify-end gap-1 px-2 py-1.5" : "justify-between px-4 py-2.5"
        )}>
          {!compact && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground/70">
              <FileText className="h-4 w-4" />
              <span className="font-medium">Event Details</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handlePaste}
              disabled={isExtracting}
              className={cn(
                "gap-1 hover:bg-primary/10 hover:text-primary",
                compact ? "h-6 px-2 text-[11px]" : "h-8 px-3 text-xs gap-1.5"
              )}
            >
              <ClipboardPaste className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
              Paste
            </Button>
            {hasContent && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                disabled={isExtracting}
                className={cn(
                  "text-muted-foreground hover:text-destructive hover:bg-destructive/10",
                  compact ? "h-6 px-1.5" : "h-8 px-2 text-xs"
                )}
              >
                <Trash2 className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
              </Button>
            )}
          </div>
        </div>

        {/* Textarea */}
        <Textarea
          placeholder={PLACEHOLDER_TEXT}
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          onPaste={handleTextareaPaste}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          rows={compact ? 5 : 10}
          className={cn(
            "border-0 rounded-t-none rounded-b-xl text-sm leading-relaxed",
            "bg-background focus-visible:ring-0 focus-visible:ring-offset-0",
            "placeholder:text-muted-foreground/40 placeholder:text-[13px]",
            compact ? "resize-none min-h-[120px] text-[13px]" : "resize-y min-h-[220px]",
            isTooLong && 'text-destructive'
          )}
        />

        {/* Extracting Overlay */}
        {isExtracting && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/90 backdrop-blur-[2px] rounded-xl gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                <Sparkles className="h-5 w-5 text-white animate-pulse" />
              </div>
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 animate-ping opacity-20" />
            </div>
            <div className="text-center">
              <p className="text-[13px] font-semibold text-foreground">Reading your event…</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">AI is extracting fields</p>
            </div>
            <div className="w-32 h-1 bg-muted rounded-full overflow-hidden">
              <div className="h-full w-1/2 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full animate-[shimmer_1.2s_ease-in-out_infinite] bg-[length:200%_100%]" />
            </div>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className={cn(
          "flex items-start gap-2 text-destructive bg-destructive/10 border border-destructive/20 rounded-lg",
          compact ? "p-2 text-xs" : "p-4 text-sm gap-3 rounded-xl"
        )}>
          <AlertCircle className={cn("shrink-0", compact ? "h-3.5 w-3.5 mt-0.5" : "h-5 w-5 mt-0.5")} />
          <div>
            <p className="font-medium">Extraction Failed</p>
            <p className={cn("opacity-90", compact ? "text-[10px] mt-0.5" : "text-xs mt-0.5")}>{error}</p>
          </div>
        </div>
      )}

      {/* Footer: Progress bar + character count */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 h-1 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              "absolute inset-y-0 left-0 rounded-full transition-all duration-300",
              isTooLong ? "bg-destructive" : isValidLength ? "bg-emerald-500" : "bg-amber-500"
            )}
            style={{ width: `${Math.min((rawText.length / EXTRACTION_CONFIG.maxTextLength) * 100, 100)}%` }}
          />
        </div>
        <span className={cn(
          "tabular-nums shrink-0",
          compact ? "text-[10px]" : "text-xs",
          isTooLong ? "text-destructive font-medium" : "text-muted-foreground"
        )}>
          {rawText.length}/{EXTRACTION_CONFIG.maxTextLength.toLocaleString()}
        </span>
        {hasContent && !isValidLength && (
          <span className={cn(
            "shrink-0 text-amber-600 bg-amber-500/10 rounded-full",
            compact ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-0.5"
          )}>
            +{EXTRACTION_CONFIG.minTextLength - rawText.length}
          </span>
        )}
      </div>

      {isValidLength && !isTooLong && (
        <Button
          type="button"
          onClick={handleApprove}
          disabled={isExtracting || isApproved}
          className={cn(
            "w-full gap-2 shadow-md",
            isApproved
              ? "bg-emerald-500 hover:bg-emerald-500 text-white shadow-emerald-500/20"
              : "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-violet-500/20",
            compact ? "h-8 text-[12px]" : "h-10 text-sm"
          )}
        >
          <Sparkles className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
          {isApproved ? 'Approved — Extracting…' : 'Approve & Extract'}
        </Button>
      )}
    </div>
  )
}
