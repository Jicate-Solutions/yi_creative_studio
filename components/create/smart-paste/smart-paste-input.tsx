'use client'

import { useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Sparkles, Loader2, ClipboardPaste, Trash2, AlertCircle } from 'lucide-react'
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

  const handleExtract = () => {
    if (rawText.trim().length >= EXTRACTION_CONFIG.minTextLength) {
      onExtract(rawText)
    }
  }

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      setRawText(text)
    } catch {
      // Clipboard access denied - user will need to paste manually
    }
  }

  const handleClear = () => {
    setRawText('')
  }

  const isValidLength = rawText.trim().length >= EXTRACTION_CONFIG.minTextLength
  const isTooLong = rawText.length > EXTRACTION_CONFIG.maxTextLength

  return (
    <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Smart Paste - Auto Extract Event Details
        </CardTitle>
        <CardDescription>
          Paste raw event text from emails, WhatsApp, or any source. AI will
          extract event name, date, time, venue, speakers, and more.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Textarea
            placeholder={PLACEHOLDER_TEXT}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            rows={10}
            className={cn(
              'resize-y min-h-[200px] font-mono text-sm bg-background',
              isTooLong && 'border-destructive focus-visible:ring-destructive'
            )}
          />
          <div className="absolute top-2 right-2 flex gap-1">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handlePaste}
              className="h-7 px-2 text-xs"
            >
              <ClipboardPaste className="h-3 w-3 mr-1" />
              Paste
            </Button>
            {rawText && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Character count and extract button */}
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            <span
              className={cn(
                isTooLong && 'text-destructive font-medium',
                !isValidLength && rawText.length > 0 && 'text-amber-600'
              )}
            >
              {rawText.length.toLocaleString()}
            </span>
            {' / '}
            {EXTRACTION_CONFIG.maxTextLength.toLocaleString()} characters
            {!isValidLength && rawText.length > 0 && (
              <span className="text-amber-600 ml-1">
                (minimum {EXTRACTION_CONFIG.minTextLength})
              </span>
            )}
            {isTooLong && (
              <span className="text-destructive ml-1">(too long)</span>
            )}
          </div>
          <Button
            onClick={handleExtract}
            disabled={!isValidLength || isTooLong || isExtracting}
            className="bg-primary hover:bg-primary/90"
          >
            {isExtracting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Extracting...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Extract Fields
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
