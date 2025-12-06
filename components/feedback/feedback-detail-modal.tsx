'use client'

import { formatDistanceToNow } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { FeedbackStatusBadge } from './feedback-status-badge'
import { FeedbackPriorityBadge } from './feedback-priority-badge'
import {
  Star,
  Calendar,
  User,
  FileText,
  MessageSquare,
  Image as ImageIcon,
  X,
  ExternalLink,
  AlertCircle,
} from 'lucide-react'
import type { CreativeFeedbackWithDetails, FeedbackStatus, FeedbackPriority } from '@/types/feedback'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface FeedbackDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  feedback: CreativeFeedbackWithDetails | null
  onStatusChange?: (id: string, status: FeedbackStatus) => void
  onPriorityChange?: (id: string, priority: FeedbackPriority) => void
  onRespond?: (feedback: CreativeFeedbackWithDetails) => void
}

export function FeedbackDetailModal({
  open,
  onOpenChange,
  feedback,
  onStatusChange,
  onPriorityChange,
  onRespond,
}: FeedbackDetailModalProps) {
  if (!feedback) return null

  const createdAt = new Date(feedback.created_at)
  const timeAgo = formatDistanceToNow(createdAt, { addSuffix: true })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0"
        showCloseButton={false}
      >
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <DialogTitle className="text-xl">Feedback Details</DialogTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{createdAt.toLocaleDateString()}</span>
                <span>({timeAgo})</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Creative Preview */}
          {feedback.creative && (
            <div className="flex gap-4 items-start">
              <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-muted shrink-0">
                {feedback.creative.thumbnail_url || feedback.creative.image_url ? (
                  <img
                    src={feedback.creative.thumbnail_url || feedback.creative.image_url || ''}
                    alt={feedback.creative.title || 'Creative'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">
                  {feedback.creative.title || 'Untitled Creative'}
                </h3>
                <p className="text-sm text-muted-foreground capitalize">
                  {feedback.creative_type?.replace(/_/g, ' ')}
                </p>
                {feedback.vertical && (
                  <Badge variant="outline" className="mt-1 text-xs">
                    {feedback.vertical}
                  </Badge>
                )}
                <Link
                  href={`/gallery?creative=${feedback.creative_id}`}
                  className="text-xs text-primary hover:underline flex items-center gap-1 mt-2"
                >
                  View Creative <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>
          )}

          <Separator />

          {/* Rating & Status Row */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Rating */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Rating:</span>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={cn(
                      'h-5 w-5',
                      star <= feedback.rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground/30'
                    )}
                  />
                ))}
              </div>
              <span className="text-sm font-medium">({feedback.rating}/5)</span>
            </div>

            <div className="flex-1" />

            {/* Status & Priority */}
            <div className="flex items-center gap-2">
              <FeedbackStatusBadge
                status={feedback.status}
                editable={!!onStatusChange}
                onStatusChange={(status) => onStatusChange?.(feedback.id, status)}
              />
              <FeedbackPriorityBadge
                priority={feedback.priority}
                editable={!!onPriorityChange}
                onPriorityChange={(priority) => onPriorityChange?.(feedback.id, priority)}
              />
            </div>
          </div>

          {/* Issues */}
          {feedback.issue_categories?.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                Issues Reported
              </div>
              <div className="flex flex-wrap gap-2">
                {feedback.issue_categories.map((issue: string) => (
                  <Badge key={issue} variant="secondary" className="text-xs">
                    {issue}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Comment */}
          {feedback.comment && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <MessageSquare className="h-4 w-4 text-blue-500" />
                User Comment
              </div>
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-sm whitespace-pre-wrap">{feedback.comment}</p>
              </div>
            </div>
          )}

          {/* Prompt Used */}
          {feedback.prompt_used && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <FileText className="h-4 w-4 text-purple-500" />
                Prompt Used
              </div>
              <div className="rounded-lg bg-muted/50 p-4 max-h-32 overflow-y-auto">
                <p className="text-xs font-mono text-muted-foreground whitespace-pre-wrap">
                  {feedback.prompt_used}
                </p>
              </div>
            </div>
          )}

          <Separator />

          {/* Admin Response Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                <MessageSquare className="h-4 w-4 text-green-500" />
                Admin Response
              </div>
              {onRespond && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRespond(feedback)}
                  className="gap-1.5"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  {feedback.admin_response ? 'Edit Response' : 'Add Response'}
                </Button>
              )}
            </div>

            {feedback.admin_response ? (
              <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 space-y-2">
                <p className="text-sm whitespace-pre-wrap">{feedback.admin_response}</p>
                {feedback.responded_at && (
                  <p className="text-xs text-muted-foreground">
                    Responded {formatDistanceToNow(new Date(feedback.responded_at), { addSuffix: true })}
                  </p>
                )}
              </div>
            ) : (
              <div className="rounded-lg bg-muted/50 p-4 text-center">
                <p className="text-sm text-muted-foreground">No response yet</p>
              </div>
            )}
          </div>

          {/* Form Data (Collapsible) */}
          {feedback.form_data && Object.keys(feedback.form_data).length > 0 && (
            <details className="group">
              <summary className="flex items-center gap-2 cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                <FileText className="h-4 w-4" />
                Form Data (Advanced)
              </summary>
              <div className="mt-2 rounded-lg bg-muted/30 p-3 overflow-x-auto">
                <pre className="text-xs font-mono">
                  {JSON.stringify(feedback.form_data, null, 2)}
                </pre>
              </div>
            </details>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
