'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

interface CreativeFeedbackDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  creativeId: string
  creativeType: string
  vertical?: string
  promptUsed?: string
  formData?: Record<string, unknown>
  onFeedbackSubmit?: () => void
}

const ISSUE_CATEGORIES = [
  { id: 'text_rendering', label: 'Text is hard to read or incorrect' },
  { id: 'layout', label: 'Layout or composition issues' },
  { id: 'colors', label: "Colors don't match brand/preferences" },
  { id: 'logo', label: 'Logo placement or visibility' },
  { id: 'style', label: "Overall style doesn't match request" },
  { id: 'other', label: 'Other issue' },
]

export function CreativeFeedbackDialog({
  open,
  onOpenChange,
  creativeId,
  creativeType,
  vertical,
  promptUsed,
  formData,
  onFeedbackSubmit,
}: CreativeFeedbackDialogProps) {
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState('')
  const [issueCategories, setIssueCategories] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const showIssueCategories = rating > 0 && rating <= 3

  async function handleSubmit() {
    if (rating === 0) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creativeId,
          rating,
          comment: comment.trim() || null,
          issueCategories: showIssueCategories ? issueCategories : [],
          creativeType,
          vertical,
          promptUsed,
          formData,
        }),
      })

      if (!response.ok) throw new Error('Failed to submit feedback')

      onFeedbackSubmit?.()
      onOpenChange(false)

      // Reset state
      setRating(0)
      setComment('')
      setIssueCategories([])
    } catch (error) {
      console.error('Feedback submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  function toggleCategory(categoryId: string) {
    setIssueCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  function getRatingLabel(value: number): string {
    switch (value) {
      case 1:
        return 'Poor'
      case 2:
        return 'Fair'
      case 3:
        return 'Good'
      case 4:
        return 'Very Good'
      case 5:
        return 'Excellent'
      default:
        return 'Tap to rate'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>How was your generated image?</DialogTitle>
          <DialogDescription>
            Your feedback helps improve future generations
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Star Rating */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoveredRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              {getRatingLabel(rating)}
            </p>
          </div>

          {/* Issue Categories (for low ratings) */}
          {showIssueCategories && (
            <div className="space-y-3">
              <Label>What could be improved?</Label>
              <div className="grid gap-2">
                {ISSUE_CATEGORIES.map((category) => (
                  <div key={category.id} className="flex items-center gap-2">
                    <Checkbox
                      id={category.id}
                      checked={issueCategories.includes(category.id)}
                      onCheckedChange={() => toggleCategory(category.id)}
                    />
                    <Label
                      htmlFor={category.id}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {category.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comment Box */}
          <div className="space-y-2">
            <Label htmlFor="comment">
              Additional comments {rating > 3 ? '(optional)' : ''}
            </Label>
            <Textarea
              id="comment"
              placeholder="Tell us more about your experience..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Skip
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={rating === 0 || isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
