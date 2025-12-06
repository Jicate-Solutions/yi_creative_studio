'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { MessageSquare, Loader2, Send } from 'lucide-react'
import type { CreativeFeedbackWithDetails } from '@/types/feedback'

interface FeedbackResponseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  feedback: CreativeFeedbackWithDetails | null
  onSubmit: (id: string, response: string) => Promise<boolean>
}

export function FeedbackResponseDialog({
  open,
  onOpenChange,
  feedback,
  onSubmit,
}: FeedbackResponseDialogProps) {
  const [response, setResponse] = useState(feedback?.admin_response || '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!feedback || !response.trim()) return

    setIsSubmitting(true)
    const success = await onSubmit(feedback.id, response.trim())
    setIsSubmitting(false)

    if (success) {
      onOpenChange(false)
    }
  }

  // Reset response when dialog opens with new feedback
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && feedback) {
      setResponse(feedback.admin_response || '')
    }
    onOpenChange(isOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-yi-blue/20 to-yi-teal/20 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-yi-blue" />
            </div>
            <div>
              <DialogTitle>Respond to Feedback</DialogTitle>
              <DialogDescription>
                Add an admin response to this feedback
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {feedback && (
          <div className="space-y-4">
            {/* Original Feedback Summary */}
            <div className="rounded-lg bg-muted/50 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Original Feedback</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={star <= feedback.rating ? 'text-yellow-500' : 'text-muted-foreground/30'}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>
              {feedback.comment && (
                <p className="text-sm text-foreground">{feedback.comment}</p>
              )}
              {feedback.issue_categories?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {feedback.issue_categories.map((issue: string) => (
                    <span
                      key={issue}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                    >
                      {issue}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Response Input */}
            <div className="space-y-2">
              <Label htmlFor="response">Your Response</Label>
              <Textarea
                id="response"
                placeholder="Type your response here..."
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                This response will be recorded for internal tracking.
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="flex-row gap-2 sm:justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !response.trim()}
            className="gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Save Response
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
