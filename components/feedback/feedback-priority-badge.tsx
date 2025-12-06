'use client'

import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { ChevronDown, ArrowDown, Minus, ArrowUp, AlertTriangle } from 'lucide-react'
import type { FeedbackPriority } from '@/types/feedback'
import { FEEDBACK_PRIORITY_CONFIG } from '@/types/feedback'

interface FeedbackPriorityBadgeProps {
  priority: FeedbackPriority
  editable?: boolean
  onPriorityChange?: (priority: FeedbackPriority) => void
  className?: string
  compact?: boolean
}

const PRIORITY_ICONS: Record<FeedbackPriority, React.ReactNode> = {
  low: <ArrowDown className="h-3 w-3" />,
  normal: <Minus className="h-3 w-3" />,
  high: <ArrowUp className="h-3 w-3" />,
  urgent: <AlertTriangle className="h-3 w-3" />,
}

export function FeedbackPriorityBadge({
  priority,
  editable = false,
  onPriorityChange,
  className,
  compact = false,
}: FeedbackPriorityBadgeProps) {
  const config = FEEDBACK_PRIORITY_CONFIG[priority]

  const badgeContent = (
    <Badge
      variant="outline"
      className={cn(
        'gap-1 font-medium transition-colors',
        config.bgColor,
        config.color,
        editable && 'cursor-pointer hover:opacity-80',
        compact && 'h-6 px-1.5',
        className
      )}
    >
      {PRIORITY_ICONS[priority]}
      {!compact && config.label}
      {editable && <ChevronDown className="h-3 w-3 opacity-50" />}
    </Badge>
  )

  if (!editable || !onPriorityChange) {
    return badgeContent
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{badgeContent}</DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-32">
        {(Object.keys(FEEDBACK_PRIORITY_CONFIG) as FeedbackPriority[]).map((priorityOption) => {
          const priorityConfig = FEEDBACK_PRIORITY_CONFIG[priorityOption]
          return (
            <DropdownMenuItem
              key={priorityOption}
              onClick={() => onPriorityChange(priorityOption)}
              className={cn(
                'gap-2',
                priority === priorityOption && 'bg-accent'
              )}
            >
              <span className={priorityConfig.color}>{PRIORITY_ICONS[priorityOption]}</span>
              {priorityConfig.label}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
