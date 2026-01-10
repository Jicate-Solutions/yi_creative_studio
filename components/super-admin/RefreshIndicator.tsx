'use client'

import { Button } from '@/components/ui/button'
import { useTimeAgo } from '@/hooks/use-time-ago'
import { RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RefreshIndicatorProps {
  lastRefresh: Date
  isRefreshing: boolean
  onManualRefresh: () => void
}

/**
 * Display refresh status and manual refresh button
 * Shows spinning icon during refresh and "Updated Xs ago" timestamp
 */
export function RefreshIndicator({
  lastRefresh,
  isRefreshing,
  onManualRefresh,
}: RefreshIndicatorProps) {
  const timeAgo = useTimeAgo(lastRefresh)

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={onManualRefresh}
        disabled={isRefreshing}
      >
        <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
        {isRefreshing ? 'Refreshing...' : 'Refresh'}
      </Button>
      <span className="text-xs text-muted-foreground">
        Updated {timeAgo}
      </span>
    </div>
  )
}
