'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Check,
  X,
  Edit2,
  Users,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ExtractionResult, ConfidenceLevel } from '@/types/extraction.types'
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
    const newSelected = new Set(selectedFields)
    if (newSelected.has(fieldId)) {
      newSelected.delete(fieldId)
    } else {
      newSelected.add(fieldId)
    }
    setSelectedFields(newSelected)
  }

  const selectAll = () => {
    setSelectedFields(new Set(result.fields.map((f) => f.fieldId)))
  }

  const deselectAll = () => {
    setSelectedFields(new Set())
  }

  const handleApply = () => {
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

  const overallConfidence = Math.round(result.metadata.confidence * 100)

  return (
    <Card className="border-green-200 bg-green-50/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Extracted {result.fields.length} Field
            {result.fields.length !== 1 ? 's' : ''}
          </CardTitle>
          <Badge
            variant="outline"
            className={cn(
              'text-xs',
              overallConfidence >= 80
                ? 'bg-green-100 text-green-700 border-green-200'
                : overallConfidence >= 50
                  ? 'bg-amber-100 text-amber-700 border-amber-200'
                  : 'bg-red-100 text-red-700 border-red-200'
            )}
          >
            {overallConfidence}% overall confidence
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Warnings */}
        {result.warnings && result.warnings.length > 0 && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <div className="text-sm text-amber-800 space-y-1">
              {result.warnings.map((w, i) => (
                <p key={i}>{w}</p>
              ))}
            </div>
          </div>
        )}

        {/* Selection actions */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {selectedFields.size} of {result.fields.length} fields selected
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={selectAll}
              className="text-primary hover:underline"
            >
              Select all
            </button>
            <span className="text-muted-foreground">|</span>
            <button
              type="button"
              onClick={deselectAll}
              className="text-muted-foreground hover:text-foreground hover:underline"
            >
              Deselect all
            </button>
          </div>
        </div>

        {/* Extracted Fields */}
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
          {result.fields.map((field) => {
            const level = getConfidenceLevel(field.confidence)
            const style = getConfidenceDisplay(level)
            const isEditing = editingField === field.fieldId
            const isSelected = selectedFields.has(field.fieldId)

            return (
              <div
                key={field.fieldId}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border bg-background transition-all',
                  isSelected
                    ? 'ring-2 ring-primary/20 border-primary/30'
                    : 'opacity-60'
                )}
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggleField(field.fieldId)}
                  id={`field-${field.fieldId}`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <label
                      htmlFor={`field-${field.fieldId}`}
                      className="text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer"
                    >
                      {field.label}
                    </label>
                    <Badge className={cn('text-xs h-5', style.bg, style.text)}>
                      {style.label}
                    </Badge>
                    {field.needsReview && (
                      <Badge
                        variant="outline"
                        className="text-xs h-5 border-amber-300 text-amber-600"
                      >
                        Review
                      </Badge>
                    )}
                  </div>
                  {isEditing ? (
                    <Input
                      defaultValue={field.value}
                      onBlur={(e) =>
                        handleEditSubmit(field.fieldId, e.target.value)
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleEditSubmit(
                            field.fieldId,
                            (e.target as HTMLInputElement).value
                          )
                        }
                        if (e.key === 'Escape') {
                          setEditingField(null)
                        }
                      }}
                      autoFocus
                      className="h-8 text-sm"
                    />
                  ) : (
                    <p className="text-sm truncate" title={field.value}>
                      {field.value}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setEditingField(isEditing ? null : field.fieldId)
                  }
                  className="h-8 w-8 p-0 shrink-0"
                  title="Edit value"
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
              </div>
            )
          })}
        </div>

        {/* Speakers Section */}
        {result.speakers && result.speakers.length > 0 && (
          <div className="p-3 border rounded-lg bg-background">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">
                  {result.speakers.length} Speaker
                  {result.speakers.length !== 1 ? 's' : ''} Detected
                </span>
              </div>
              <Button
                variant={speakersApplied ? 'ghost' : 'outline'}
                size="sm"
                onClick={handleApplySpeakers}
                disabled={speakersApplied}
                className={cn(
                  'h-7 text-xs',
                  speakersApplied && 'text-green-600'
                )}
              >
                {speakersApplied ? (
                  <>
                    <Check className="h-3 w-3 mr-1" />
                    Added
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3 w-3 mr-1" />
                    Add to Speakers
                  </>
                )}
              </Button>
            </div>
            <div className="space-y-1.5">
              {result.speakers.map((s, i) => (
                <div
                  key={i}
                  className="text-sm text-muted-foreground flex items-start gap-2"
                >
                  <span className="text-primary">-</span>
                  <span>
                    <span className="text-foreground font-medium">{s.name}</span>
                    {s.designation && (
                      <span className="text-muted-foreground">
                        {' '}
                        - {s.designation}
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-3 border-t">
          <Button variant="ghost" onClick={onCancel} className="text-muted-foreground">
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            disabled={selectedFields.size === 0}
            className="bg-primary hover:bg-primary/90"
          >
            <Check className="h-4 w-4 mr-2" />
            Apply {selectedFields.size} Field{selectedFields.size !== 1 ? 's' : ''}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
