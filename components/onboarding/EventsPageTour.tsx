'use client'

import { SpotlightTour, type TourStep } from './SpotlightTour'
import { useTour } from '@/hooks/use-tour'
import { getTourConfig } from './tour-registry'

const TOUR_ID = 'events-page-tour'

const EVENTS_TOUR_STEPS: TourStep[] = [
  {
    target: 'events-title',
    title: 'Welcome to Events Calendar',
    content: 'This is your central hub for viewing synced events and creating promotional posters for them.',
    placement: 'bottom',
  },
  {
    target: 'events-google-connect',
    title: 'Connect Your Google Calendar',
    content: 'Sync your Google Calendar to automatically import events. Once connected, events will appear here in real-time.',
    placement: 'bottom',
  },
  {
    target: 'event-card',
    title: 'Event Cards',
    content: 'Each card shows key event details - title, date, time, location, and capacity. Virtual events show meeting links.',
    placement: 'right',
  },
  {
    target: 'event-create-poster-btn',
    title: 'Create Event Posters',
    content: 'Click "Create Poster" to generate professional promotional materials for any event. Event details auto-fill!',
    placement: 'top',
  },
  {
    target: 'compact-calendar',
    title: 'Filter by Date',
    content: 'Use the calendar to view events for specific dates. Days with dots have events scheduled.',
    placement: 'left',
  },
  {
    target: 'quick-stats',
    title: 'Quick Statistics',
    content: 'See an overview of upcoming events, today\'s schedule, and total synced events at a glance.',
    placement: 'left',
  },
  {
    target: 'events-refresh-button',
    title: 'Sync Latest Events',
    content: 'Refresh to sync the latest events from your connected calendars. New events appear automatically!',
    placement: 'bottom',
  },
]

interface EventsPageTourProps {
  onComplete?: () => void
}

export function EventsPageTour({ onComplete }: EventsPageTourProps) {
  const { activeTourId, setActiveTour, markTourComplete } = useTour()
  const tourConfig = getTourConfig(TOUR_ID)

  if (!tourConfig) return null

  const isActive = activeTourId === TOUR_ID

  const handleComplete = () => {
    markTourComplete(TOUR_ID)
    onComplete?.()
  }

  const handleSkip = () => {
    setActiveTour(null)
  }

  return (
    <SpotlightTour
      tourId={TOUR_ID}
      steps={EVENTS_TOUR_STEPS}
      forceShow={isActive}
      storageKey={tourConfig.storageKey}
      onComplete={handleComplete}
      onSkip={handleSkip}
    />
  )
}
