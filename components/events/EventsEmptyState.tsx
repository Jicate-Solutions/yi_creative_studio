'use client'

/**
 * EventsEmptyState Component
 * Friendly empty state for when no events are available
 */

import { CalendarX2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GoogleCalendarConnect } from '@/components/settings/integrations'

interface EventsEmptyStateProps {
  variant: 'no-events' | 'no-results' | 'error'
  selectedDate?: Date | null
  onClearFilter?: () => void
  onRetry?: () => void
  errorMessage?: string
  organizationId?: string
}

export function EventsEmptyState({
  variant,
  selectedDate,
  onClearFilter,
  onRetry,
  errorMessage,
  organizationId,
}: EventsEmptyStateProps) {
  if (variant === 'error') {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
          <CalendarX2 className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Failed to load events
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-sm">
          {errorMessage || 'Something went wrong while fetching events. Please try again.'}
        </p>
        {onRetry && (
          <Button variant="outline" onClick={onRetry}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        )}
      </div>
    )
  }

  if (variant === 'no-results' && selectedDate) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
          <CalendarX2 className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          No events on this date
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          There are no events scheduled for the selected date.
        </p>
        {onClearFilter && (
          <Button variant="outline" onClick={onClearFilter}>
            Clear Date Filter
          </Button>
        )}
      </div>
    )
  }

  // Default: no-events
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <CalendarX2 className="w-8 h-8 text-primary" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        No events yet
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
        Connect your Google Calendar to automatically sync events and create posters.
      </p>
      {organizationId && (
        <GoogleCalendarConnect
          organizationId={organizationId}
          variant="button"
        />
      )}
    </div>
  )
}

export default EventsEmptyState
