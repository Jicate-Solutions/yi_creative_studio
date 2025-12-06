'use client'

import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { ChevronDown, Circle, CheckCircle2, Eye, MessageSquare, Archive, Inbox } from 'lucide-react'
import type { FeedbackStatus } from '@/types/feedback'
import { FEEDBACK_STATUS_CONFIG } from '@/types/feedback'

interface FeedbackStatusBadgeProps {
  status: FeedbackStatus
  editable?: boolean
  onStatusChange?: (status: FeedbackStatus) => void
  className?: string
}

const STATUS_ICONS: Record<FeedbackStatus, React.ReactNode> = {
  new: <Inbox className="h-3 w-3" />,
  reviewed: <Eye className="h-3 w-3" />,
  acknowledged: <MessageSquare className="h-3 w-3" />,
  resolved: <CheckCircle2 className="h-3 w-3" />,
  archived: <Archive className="h-3 w-3" />,
}

export function FeedbackStatusBadge({
  status,
  editable = false,
  onStatusChange,
  className,
}: FeedbackStatusBadgeProps) {
  const config = FEEDBACK_STATUS_CONFIG[status]

  const badgeContent = (
    <Badge
      variant="outline"
      className={cn(
        'gap-1.5 font-medium transition-colors',
        config.bgColor,
        config.color,
        editable && 'cursor-pointer hover:opacity-80',
        className
      )}
    >
      {STATUS_ICONS[status]}
      {config.label}
      {editable && <ChevronDown className="h-3 w-3 opacity-50" />}
    </Badge>
  )

  if (!editable || !onStatusChange) {
    return badgeContent
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{badgeContent}</DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-40">
        {(Object.keys(FEEDBACK_STATUS_CONFIG) as FeedbackStatus[]).map((statusOption) => {
          const statusConfig = FEEDBACK_STATUS_CONFIG[statusOption]
          return (
            <DropdownMenuItem
              key={statusOption}
              onClick={() => onStatusChange(statusOption)}
              className={cn(
                'gap-2',
                status === statusOption && 'bg-accent'
              )}
            >
              <span className={statusConfig.color}>{STATUS_ICONS[statusOption]}</span>
              {statusConfig.label}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
