'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  format,
  parseISO,
  isToday,
  isTomorrow,
  isFuture,
  isPast,
  startOfToday,
  isAfter,
  isBefore,
  addMonths,
  subMonths,
} from 'date-fns'
import { RefreshCw, Filter, Loader2, CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useExternalEvents, type ExternalEvent } from '@/hooks/use-external-events'
import { useAuthStore } from '@/stores/auth-store'
import { cn } from '@/lib/utils'

// Import new components
import { EventListCard } from '@/components/events/EventListCard'
import { CompactCalendar } from '@/components/events/CompactCalendar'
import { QuickStats } from '@/components/events/QuickStats'
import { EventsEmptyState } from '@/components/events/EventsEmptyState'
import { GoogleCalendarConnect } from '@/components/settings/integrations'

/**
 * Events Calendar Page - List-First Layout
 *
 * Displays synced events from external apps prominently as cards,
 * with a compact calendar widget for date filtering.
 */
export default function EventsPage() {
  const router = useRouter()
  const { currentOrganization } = useAuthStore()
  const [sourceFilter, setSourceFilter] = useState<string>('all')

  const {
    events,
    isLoading,
    error,
    selectedDate,
    currentMonth,
    eventsByDate,
    eventSources,
    refresh,
    setCurrentMonth,
    selectDate,
  } = useExternalEvents({
    sourceFilter: sourceFilter === 'all' ? undefined : sourceFilter,
  })

  // Parse current month for calendar
  const currentMonthDate = useMemo(() => {
    const [year, month] = currentMonth.split('-').map(Number)
    return new Date(year, month - 1, 1)
  }, [currentMonth])

  // Parse selected date
  const selectedDateObj = useMemo(() => {
    return selectedDate ? parseISO(selectedDate) : null
  }, [selectedDate])

  // Get event dates for calendar dots
  const eventDates = useMemo(() => {
    return Object.keys(eventsByDate)
  }, [eventsByDate])

  // Group events into "Today", "Tomorrow", and "Upcoming"
  const groupedEvents = useMemo(() => {
    const today = startOfToday()

    // If a date is selected, only show events for that date
    if (selectedDate) {
      return {
        filtered: eventsByDate[selectedDate] || [],
        todayEvents: [],
        tomorrowEvents: [],
        upcomingEvents: [],
        pastEvents: [],
      }
    }

    const todayEvents: ExternalEvent[] = []
    const tomorrowEvents: ExternalEvent[] = []
    const upcomingEvents: ExternalEvent[] = []
    const pastEvents: ExternalEvent[] = []

    events.forEach((event) => {
      const eventDate = parseISO(event.date)
      if (isToday(eventDate)) {
        todayEvents.push(event)
      } else if (isTomorrow(eventDate)) {
        tomorrowEvents.push(event)
      } else if (isFuture(eventDate)) {
        upcomingEvents.push(event)
      } else {
        pastEvents.push(event)
      }
    })

    // Sort upcoming by date
    upcomingEvents.sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime())
    // Sort past by date descending (most recent first)
    pastEvents.sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime())

    return {
      filtered: [],
      todayEvents,
      tomorrowEvents,
      upcomingEvents,
      pastEvents,
    }
  }, [events, eventsByDate, selectedDate])

  // Calculate stats
  const stats = useMemo(() => {
    const today = startOfToday()
    const todayCount = events.filter((e) => isToday(parseISO(e.date))).length
    const upcomingCount = events.filter((e) => {
      const eventDate = parseISO(e.date)
      return isAfter(eventDate, today) || isToday(eventDate)
    }).length

    return {
      todayCount,
      upcomingCount,
      eventsThisMonth: events.length,
      totalEvents: events.length,
    }
  }, [events])

  // Handle month change from calendar
  const handleMonthChange = useCallback(
    (date: Date) => {
      setCurrentMonth(format(date, 'yyyy-MM'))
    },
    [setCurrentMonth]
  )

  // Handle date selection from calendar
  const handleDateSelect = useCallback(
    (date: Date | null) => {
      selectDate(date ? format(date, 'yyyy-MM-dd') : null)
    },
    [selectDate]
  )

  // Handle create poster from event card - navigate to canvas create page
  const handleCreatePoster = useCallback(
    (event: ExternalEvent) => {
      // Use the event's actual source_app_id instead of hardcoding 'external'
      // This ensures Google Calendar events (source='google-calendar') work correctly
      const eventWithMetadata = event as ExternalEvent & {
        _sourceAppId?: string
      }
      const source = eventWithMetadata._sourceAppId || 'external'
      router.push(`/create?eventId=${event.id}&source=${source}`)
    },
    [router]
  )

  // Check if there are any events to display
  const hasEvents = events.length > 0
  const hasFilteredEvents =
    selectedDate && groupedEvents.filtered.length > 0
  const hasGroupedEvents =
    !selectedDate &&
    (groupedEvents.todayEvents.length > 0 ||
      groupedEvents.tomorrowEvents.length > 0 ||
      groupedEvents.upcomingEvents.length > 0)

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-primary" />
            Events Calendar
          </h1>
          <p className="text-muted-foreground mt-1">
            View synced events and create promotional posters
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Google Calendar Connection - n8n-like simple connect */}
          {currentOrganization?.id && (
            <GoogleCalendarConnect
              organizationId={currentOrganization.id}
              compact
              variant="button"
            />
          )}

          {/* Source Filter */}
          {eventSources.length > 1 && (
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-[160px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="All Sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                {eventSources.map((source) => (
                  <SelectItem key={source} value={source}>
                    {source}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={refresh}
            disabled={isLoading}
          >
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
          </Button>
        </div>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Event List - Takes 2/3 on desktop */}
        <div className="lg:col-span-2 space-y-4 pb-20 lg:pb-0">
          {/* Loading State */}
          {isLoading && events.length === 0 && (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-lg" />
              ))}
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <EventsEmptyState
              variant="error"
              errorMessage={error}
              onRetry={refresh}
            />
          )}

          {/* Empty State - No events at all */}
          {!isLoading && !error && !hasEvents && (
            <EventsEmptyState
              variant="no-events"
              organizationId={currentOrganization?.id}
            />
          )}

          {/* Filtered by date - no results */}
          {!isLoading &&
            !error &&
            selectedDate &&
            !hasFilteredEvents && (
              <EventsEmptyState
                variant="no-results"
                selectedDate={selectedDateObj}
                onClearFilter={() => selectDate(null)}
              />
            )}

          {/* Filtered Events (when date is selected) */}
          {selectedDate && hasFilteredEvents && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
                  <span className="w-1 h-4 rounded-full bg-primary/60 inline-block" />
                  Events on {format(selectedDateObj!, 'MMMM d, yyyy')}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => selectDate(null)}
                >
                  Clear filter
                </Button>
              </div>
              <div className="space-y-2.5">
                {groupedEvents.filtered.map((event) => (
                  <EventListCard
                    key={event.id}
                    event={event}
                    onCreatePoster={() => handleCreatePoster(event)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Grouped Events (when no date filter) */}
          {!selectedDate && hasGroupedEvents && (
            <>
              {/* Today's Events */}
              {groupedEvents.todayEvents.length > 0 && (
                <div className="space-y-2.5">
                  <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    Today&apos;s Events
                  </h2>
                  {groupedEvents.todayEvents.map((event) => (
                    <EventListCard
                      key={event.id}
                      event={event}
                      onCreatePoster={() => handleCreatePoster(event)}
                    />
                  ))}
                </div>
              )}

              {/* Tomorrow's Events */}
              {groupedEvents.tomorrowEvents.length > 0 && (
                <div className="space-y-2.5">
                  <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
                    <span className="w-1 h-4 rounded-full bg-primary/60 inline-block" />
                    Tomorrow
                  </h2>
                  {groupedEvents.tomorrowEvents.map((event) => (
                    <EventListCard
                      key={event.id}
                      event={event}
                      onCreatePoster={() => handleCreatePoster(event)}
                    />
                  ))}
                </div>
              )}

              {/* Upcoming Events */}
              {groupedEvents.upcomingEvents.length > 0 && (
                <div className="space-y-2.5">
                  <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
                    <span className="w-1 h-4 rounded-full bg-primary/40 inline-block" />
                    Upcoming This Month
                  </h2>
                  {groupedEvents.upcomingEvents.map((event) => (
                    <EventListCard
                      key={event.id}
                      event={event}
                      onCreatePoster={() => handleCreatePoster(event)}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Show past events if no upcoming */}
          {!selectedDate &&
            !hasGroupedEvents &&
            hasEvents &&
            groupedEvents.pastEvents.length > 0 && (
              <div className="space-y-2.5">
                <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
                  <span className="w-1 h-4 rounded-full bg-muted-foreground/30 inline-block" />
                  Past Events
                </h2>
                {groupedEvents.pastEvents.slice(0, 5).map((event) => (
                  <EventListCard
                    key={event.id}
                    event={event}
                    onCreatePoster={() => handleCreatePoster(event)}
                  />
                ))}
                {groupedEvents.pastEvents.length > 5 && (
                  <p className="text-sm text-gray-500 text-center py-2">
                    + {groupedEvents.pastEvents.length - 5} more past events
                  </p>
                )}
              </div>
            )}
        </div>

        {/* Sidebar - Calendar + Stats (1/3 on desktop, hidden on mobile by default) */}
        <div className="space-y-3 hidden lg:block">
          {/* Compact Calendar */}
          <CompactCalendar
            currentMonth={currentMonthDate}
            onMonthChange={handleMonthChange}
            selectedDate={selectedDateObj}
            onDateSelect={handleDateSelect}
            eventDates={eventDates}
          />

          {/* Quick Stats */}
          <QuickStats
            eventsThisMonth={stats.eventsThisMonth}
            totalEvents={stats.totalEvents}
            upcomingCount={stats.upcomingCount}
            todayCount={stats.todayCount}
            currentMonth={currentMonthDate}
          />
        </div>
      </div>

      {/* Mobile Calendar Toggle (shown only on mobile) */}
      <div className="lg:hidden fixed bottom-[200px] right-4 z-50">
        <MobileCalendarSheet
          currentMonth={currentMonthDate}
          onMonthChange={handleMonthChange}
          selectedDate={selectedDateObj}
          onDateSelect={handleDateSelect}
          eventDates={eventDates}
          stats={stats}
        />
      </div>
    </div>
  )
}

// ============================================================================
// Mobile Calendar Sheet Component
// ============================================================================

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Calendar } from 'lucide-react'

interface MobileCalendarSheetProps {
  currentMonth: Date
  onMonthChange: (date: Date) => void
  selectedDate: Date | null
  onDateSelect: (date: Date | null) => void
  eventDates: string[]
  stats: {
    eventsThisMonth: number
    totalEvents: number
    upcomingCount: number
    todayCount: number
  }
}

function MobileCalendarSheet({
  currentMonth,
  onMonthChange,
  selectedDate,
  onDateSelect,
  eventDates,
  stats,
}: MobileCalendarSheetProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="icon" className="h-12 w-12 rounded-full shadow-lg">
          <Calendar className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[70vh]">
        <SheetHeader>
          <SheetTitle>Calendar</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 py-4 overflow-y-auto">
          <CompactCalendar
            currentMonth={currentMonth}
            onMonthChange={onMonthChange}
            selectedDate={selectedDate}
            onDateSelect={onDateSelect}
            eventDates={eventDates}
          />
          <QuickStats
            eventsThisMonth={stats.eventsThisMonth}
            totalEvents={stats.totalEvents}
            upcomingCount={stats.upcomingCount}
            todayCount={stats.todayCount}
            currentMonth={currentMonth}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}
