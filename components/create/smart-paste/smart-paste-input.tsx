'use client'

import { useState, useEffect, useRef } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Sparkles, ClipboardPaste, Trash2, AlertCircle, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EXTRACTION_CONFIG } from '@/types/extraction.types'

interface SmartPasteInputProps {
  onExtract: (text: string) => Promise<void>
  isExtracting: boolean
  error?: string | null
}

const PLACEHOLDER_TEXT = `Paste your event details here...

Example:
Alumni Insight Session - Journey of Our Alumni

Resource Persons:
- Mr. V. Velavan - V Teach Project Solutions, Erode
- Ms. A. Anandhavalli - Trainee, R&D, Royal Enfield, Chennai

Date: 28.01.2026
Time: 10.00 AM - 12.00 PM
Venue: E-Yantra Lab`

export function SmartPasteInput({
  onExtract,
  isExtracting,
  error,
}: SmartPasteInputProps) {
  const [rawText, setRawText] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const hasExtractedRef = useRef(false)

  // Auto-extract when valid text is pasted
  useEffect(() => {
    const isValidLength = rawText.trim().length >= EXTRACTION_CONFIG.minTextLength
    const isTooLong = rawText.length > EXTRACTION_CONFIG.maxTextLength

    if (isValidLength && !isTooLong && !isExtracting && !hasExtractedRef.current) {
      hasExtractedRef.current = true
      onExtract(rawText)
    }
  }, [rawText, isExtracting, onExtract])

  // Handle paste button click
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      hasExtractedRef.current = false // Reset to allow extraction
      setRawText(text)
    } catch {
      // Clipboard access denied - user will need to paste manually
    }
  }

  // Handle direct paste into textarea (Ctrl+V)
  const handleTextareaPaste = () => {
    hasExtractedRef.current = false // Reset to allow extraction
  }

  const handleClear = () => {
    setRawText('')
    hasExtractedRef.current = false
  }

  const isValidLength = rawText.trim().length >= EXTRACTION_CONFIG.minTextLength
  const isTooLong = rawText.length > EXTRACTION_CONFIG.maxTextLength
  const hasContent = rawText.trim().length > 0

  return (
    <div className="space-y-5">
      {/* Textarea Container */}
      <div
        className={cn(
          "relative rounded-xl transition-all duration-300",
          isFocused
            ? "ring-2 ring-primary/50 shadow-lg shadow-primary/10"
            : "ring-1 ring-border/50",
          isExtracting && "opacity-75 pointer-events-none"
        )}
      >
        {/* Textarea Header */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-muted/30 border-b rounded-t-xl">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span>Event Details</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handlePaste}
              disabled={isExtracting}
              className="h-8 px-3 text-xs gap-1.5 hover:bg-primary/10 hover:text-primary"
            >
              <ClipboardPaste className="h-3.5 w-3.5" />
              Paste
            </Button>
            {hasContent && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                disabled={isExtracting}
                className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
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
          rows={10}
          className={cn(
            "resize-y min-h-[220px] border-0 rounded-t-none rounded-b-xl font-mono text-sm",
            "bg-background focus-visible:ring-0 focus-visible:ring-offset-0",
            "placeholder:text-muted-foreground/60",
            isTooLong && 'text-destructive'
          )}
        />

        {/* Extracting Overlay */}
        {isExtracting && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-xl">
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center animate-pulse">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 animate-ping opacity-25" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">AI is extracting fields...</p>
            </div>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-start gap-3 text-sm text-destructive bg-destructive/10 p-4 rounded-xl border border-destructive/20">
          <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">Extraction Failed</p>
            <p className="text-xs mt-0.5 opacity-90">{error}</p>
          </div>
        </div>
      )}

      {/* Footer: Character count and status */}
      <div className="flex items-center gap-3">
        {/* Character Progress */}
        <div className="flex items-center gap-2">
          <div className="relative w-24 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                "absolute inset-y-0 left-0 rounded-full transition-all duration-300",
                isTooLong
                  ? "bg-destructive"
                  : isValidLength
                    ? "bg-gradient-to-r from-green-500 to-emerald-500"
                    : "bg-gradient-to-r from-amber-500 to-orange-500"
              )}
              style={{
                width: `${Math.min((rawText.length / EXTRACTION_CONFIG.maxTextLength) * 100, 100)}%`
              }}
            />
          </div>
          <span className={cn(
            "text-xs tabular-nums",
            isTooLong ? "text-destructive font-medium" : "text-muted-foreground"
          )}>
            {rawText.length.toLocaleString()} / {EXTRACTION_CONFIG.maxTextLength.toLocaleString()}
          </span>
        </div>

        {/* Status indicator */}
        {hasContent && !isValidLength && (
          <span className="text-xs text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full">
            Need {EXTRACTION_CONFIG.minTextLength - rawText.length} more chars
          </span>
        )}
        {isTooLong && (
          <span className="text-xs text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">
            Too long
          </span>
        )}
        {isValidLength && !isTooLong && !isExtracting && (
          <span className="text-xs text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
            Auto-extracting...
          </span>
        )}
      </div>
    </div>
  )
}
