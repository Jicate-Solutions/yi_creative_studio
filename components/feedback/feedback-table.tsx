'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getFormatLabel } from '@/lib/config/creative-formats'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { FeedbackStatusBadge } from './feedback-status-badge'
import { FeedbackPriorityBadge } from './feedback-priority-badge'
import {
  Star,
  MoreHorizontal,
  Eye,
  MessageSquare,
  Archive,
  Image as ImageIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CreativeFeedbackWithDetails, FeedbackStatus, FeedbackPriority } from '@/types/feedback'

interface FeedbackTableProps {
  feedback: CreativeFeedbackWithDetails[]
  selectedIds: string[]
  onSelectionChange: (ids: string[]) => void
  onStatusChange: (id: string, status: FeedbackStatus) => void
  onPriorityChange: (id: string, priority: FeedbackPriority) => void
  onViewDetails: (feedback: CreativeFeedbackWithDetails) => void
  onRespond: (feedback: CreativeFeedbackWithDetails) => void
  onArchive: (id: string) => void
  isLoading?: boolean
}

export function FeedbackTable({
  feedback,
  selectedIds,
  onSelectionChange,
  onStatusChange,
  onPriorityChange,
  onViewDetails,
  onRespond,
  onArchive,
  isLoading = false,
}: FeedbackTableProps) {
  const allSelected = feedback.length > 0 && selectedIds.length === feedback.length
  const someSelected = selectedIds.length > 0 && selectedIds.length < feedback.length

  const toggleAll = () => {
    if (allSelected) {
      onSelectionChange([])
    } else {
      onSelectionChange(feedback.map((f) => f.id))
    }
  }

  const toggleOne = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((i) => i !== id))
    } else {
      onSelectionChange([...selectedIds, id])
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-lg border">
        <div className="p-8 text-center">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/3 mx-auto" />
            <div className="h-4 bg-muted rounded w-1/2 mx-auto" />
          </div>
        </div>
      </div>
    )
  }

  if (feedback.length === 0) {
    return (
      <div className="rounded-lg border">
        <div className="p-8 text-center">
          <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No feedback found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30">
            <TableHead className="w-12">
              <Checkbox
                checked={someSelected ? "indeterminate" : allSelected}
                onCheckedChange={toggleAll}
              />
            </TableHead>
            <TableHead className="w-16">Creative</TableHead>
            <TableHead>Details</TableHead>
            <TableHead className="w-28">Rating</TableHead>
            <TableHead className="w-28">Status</TableHead>
            <TableHead className="w-24">Priority</TableHead>
            <TableHead className="w-32">Date</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {feedback.map((item) => {
            const isSelected = selectedIds.includes(item.id)
            const timeAgo = formatDistanceToNow(new Date(item.created_at), { addSuffix: true })

            return (
              <TableRow
                key={item.id}
                className={cn(
                  'cursor-pointer hover:bg-muted/50 transition-colors',
                  isSelected && 'bg-primary/5'
                )}
                onClick={() => onViewDetails(item)}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleOne(item.id)}
                  />
                </TableCell>

                <TableCell>
                  <div className="w-12 h-12 rounded-md overflow-hidden bg-muted">
                    {item.creative?.thumbnail_url || item.creative?.image_url ? (
                      <img
                        src={item.creative.thumbnail_url || item.creative.image_url || ''}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                </TableCell>

                <TableCell>
                  <div className="space-y-1">
                    <p className="font-medium truncate max-w-[200px]">
                      {item.creative?.title || 'Untitled'}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] h-5">
                        {getFormatLabel(item.creative_type)}
                      </Badge>
                      {item.issue_categories?.length > 0 && (
                        <span className="text-[10px] text-orange-500">
                          {item.issue_categories.length} issue(s)
                        </span>
                      )}
                      {item.admin_response && (
                        <MessageSquare className="h-3.5 w-3.5 text-green-500" />
                      )}
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={cn(
                          'h-3.5 w-3.5',
                          star <= item.rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-muted-foreground/30'
                        )}
                      />
                    ))}
                  </div>
                </TableCell>

                <TableCell onClick={(e) => e.stopPropagation()}>
                  <FeedbackStatusBadge
                    status={item.status}
                    editable
                    onStatusChange={(status) => onStatusChange(item.id, status)}
                  />
                </TableCell>

                <TableCell onClick={(e) => e.stopPropagation()}>
                  <FeedbackPriorityBadge
                    priority={item.priority}
                    editable
                    onPriorityChange={(priority) => onPriorityChange(item.id, priority)}
                    compact
                  />
                </TableCell>

                <TableCell>
                  <span className="text-xs text-muted-foreground">{timeAgo}</span>
                </TableCell>

                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onViewDetails(item)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onRespond(item)}>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        {item.admin_response ? 'Edit Response' : 'Add Response'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onArchive(item.id)}
                        className="text-destructive"
                      >
                        <Archive className="h-4 w-4 mr-2" />
                        Archive
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
