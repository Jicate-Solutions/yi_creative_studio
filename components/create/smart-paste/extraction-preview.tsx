'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Check, X, Edit2, Users, AlertCircle, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ExtractionResult } from '@/types/extraction.types'
import { getConfidenceLevel, getConfidenceDisplay } from '@/types/extraction.types'

interface ExtractionPreviewProps {
  result: ExtractionResult
  onApply: (selectedFieldIds: string[]) => void
  onApplySpeakers: () => void
  onCancel: () => void
  onEditField: (fieldId: string, newValue: string) => void
}

export function ExtractionPreview({
  result,
  onApply,
  onApplySpeakers,
  onCancel,
  onEditField,
}: ExtractionPreviewProps) {
  const [selectedFields, setSelectedFields] = useState<Set<string>>(
    new Set(result.fields.map((f) => f.fieldId))
  )
  const [editingField, setEditingField] = useState<string | null>(null)
  const [speakersApplied, setSpeakersApplied] = useState(false)

  const toggleField = (fieldId: string) => {
    const next = new Set(selectedFields)
    next.has(fieldId) ? next.delete(fieldId) : next.add(fieldId)
    setSelectedFields(next)
  }

  const handleApply = () => {
    // Auto-apply speakers if detected and not already applied
    if (hasSpeakers && !speakersApplied) {
      onApplySpeakers()
      setSpeakersApplied(true)
    }
    onApply([...selectedFields])
  }

  const handleApplySpeakers = () => {
    onApplySpeakers()
    setSpeakersApplied(true)
  }

  const handleEditSubmit = (fieldId: string, value: string) => {
    onEditField(fieldId, value)
    setEditingField(null)
  }

  const hasSpeakers = result.speakers && result.speakers.length > 0

  return (
    <div className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-muted/20">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-violet-500/10 flex items-center justify-center">
            <Sparkles className="h-3.5 w-3.5 text-violet-500" />
          </div>
          <span className="text-sm font-semibold text-foreground">
            {result.fields.length} field{result.fields.length !== 1 ? 's' : ''} extracted
          </span>
        </div>
        <button onClick={onCancel} className="h-6 w-6 rounded-full flex items-center justify-center hover:bg-muted transition-colors">
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>

      <div className="p-3 space-y-3">
        {/* Warnings */}
        {result.warnings && result.warnings.length > 0 && (
          <div className="flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <div className="text-xs text-amber-800 space-y-0.5">
              {result.warnings.map((w, i) => <p key={i}>{w}</p>)}
            </div>
          </div>
        )}

        {/* Select all / deselect all */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {selectedFields.size} of {result.fields.length} selected
          </span>
          <div className="flex gap-2">
            <button onClick={() => setSelectedFields(new Set(result.fields.map(f => f.fieldId)))} className="text-violet-600 hover:underline">
              Select all
            </button>
            <span className="text-muted-foreground">|</span>
            <button onClick={() => setSelectedFields(new Set())} className="text-muted-foreground hover:text-foreground hover:underline">
              Deselect all
            </button>
          </div>
        </div>

        {/* Field list */}
        <div className="space-y-1.5 max-h-[240px] overflow-y-auto pr-0.5">
          {result.fields.map((field) => {
            const level = getConfidenceLevel(field.confidence)
            const style = getConfidenceDisplay(level)
            const isEditing = editingField === field.fieldId
            const isSelected = selectedFields.has(field.fieldId)

            return (
              <div
                key={field.fieldId}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all',
                  isSelected
                    ? 'bg-violet-500/5 border-violet-500/20 ring-1 ring-violet-500/10'
                    : 'bg-muted/20 border-border/40 opacity-60'
                )}
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggleField(field.fieldId)}
                  id={`field-${field.fieldId}`}
                  className="shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <label
                      htmlFor={`field-${field.fieldId}`}
                      className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider cursor-pointer"
                    >
                      {field.label}
                    </label>
                    <Badge className={cn('text-[10px] h-4 px-1.5', style.bg, style.text)}>
                      {style.label}
                    </Badge>
                  </div>
                  {isEditing ? (
                    <Input
                      defaultValue={field.value}
                      onBlur={(e) => handleEditSubmit(field.fieldId, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleEditSubmit(field.fieldId, (e.target as HTMLInputElement).value)
                        if (e.key === 'Escape') setEditingField(null)
                      }}
                      autoFocus
                      className="h-7 text-xs mt-0.5"
                    />
                  ) : (
                    <p className="text-xs text-foreground font-medium truncate" title={field.value}>
                      {field.value}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setEditingField(isEditing ? null : field.fieldId)}
                  className="h-6 w-6 rounded-md flex items-center justify-center hover:bg-muted transition-colors shrink-0"
                  title="Edit value"
                >
                  <Edit2 className="h-3 w-3 text-muted-foreground" />
                </button>
              </div>
            )
          })}
        </div>

        {/* Speakers — prominent, can't miss it */}
        {hasSpeakers && (
          <div className={cn(
            'rounded-xl border-2 overflow-hidden transition-colors',
            speakersApplied ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-violet-500/30 bg-violet-500/5'
          )}>
            <div className="flex items-center justify-between px-3 py-2 border-b border-border/30">
              <div className="flex items-center gap-2">
                <Users className={cn('h-3.5 w-3.5', speakersApplied ? 'text-emerald-500' : 'text-violet-500')} />
                <span className="text-xs font-bold text-foreground">
                  {result.speakers!.length} Speaker{result.speakers!.length !== 1 ? 's' : ''} Detected
                </span>
              </div>
              <Button
                size="sm"
                onClick={handleApplySpeakers}
                disabled={speakersApplied}
                className={cn(
                  'h-7 text-xs gap-1.5 transition-all',
                  speakersApplied
                    ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10 border border-emerald-500/30'
                    : 'bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-sm'
                )}
              >
                {speakersApplied ? (
                  <><Check className="h-3 w-3" /> Added</>
                ) : (
                  <><Sparkles className="h-3 w-3" /> Add to Speakers</>
                )}
              </Button>
            </div>
            <div className="px-3 py-2 space-y-1">
              {result.speakers!.map((s, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="mt-0.5 h-4 w-4 rounded-full bg-violet-500/15 flex items-center justify-center shrink-0 text-[9px] font-bold text-violet-600">
                    {i + 1}
                  </div>
                  <div className="text-xs leading-snug">
                    <span className="font-semibold text-foreground">{s.name}</span>
                    {s.designation && (
                      <span className="text-muted-foreground"> — {s.designation}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action bar */}
        <div className="flex items-center gap-2 pt-1">
          <Button
            onClick={handleApply}
            disabled={selectedFields.size === 0}
            className="flex-1 h-10 gap-1.5 text-sm font-semibold bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 hover:from-violet-600 hover:via-purple-600 hover:to-indigo-600 text-white shadow-sm active:scale-[0.98] transition-all"
          >
            <Check className="h-4 w-4" />
            Apply {selectedFields.size} Field{selectedFields.size !== 1 ? 's' : ''}
          </Button>
          <Button variant="outline" onClick={onCancel} className="h-10 px-3 text-sm">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
