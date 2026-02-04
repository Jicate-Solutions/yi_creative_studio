/**
 * Google Event Mapper
 *
 * Transforms Google Calendar events to ExternalEvent format
 */

import { ExternalEvent } from '@/types/external-event.types'
import { GoogleCalendarEvent } from '@/types/google-calendar.types'

/**
 * Map a Google Calendar event to ExternalEvent format
 */
export function mapGoogleEventToExternalEvent(
  event: GoogleCalendarEvent
): ExternalEvent {
  // Extract date and time from start
  const { date, startTime } = extractDateTime(event.start)
  const { startTime: endTime } = extractDateTime(event.end)

  // Detect if event is virtual
  const isVirtual = detectVirtualEvent(event)
  const virtualMeetingLink = extractMeetingLink(event)

  // Map status
  const status = mapEventStatus(event.status)

  return {
    id: event.id,
    name: event.summary || 'Untitled Event',
    date,
    startTime,
    endTime,
    venue: isVirtual ? undefined : event.location,
    venueAddress: isVirtual ? undefined : event.location,
    description: cleanDescription(event.description),
    isVirtual,
    virtualMeetingLink,
    organizerName: event.organizer?.displayName || event.organizer?.email,
    status,
    createdAt: event.created,
    updatedAt: event.updated,
    tags: extractHashtags(event.description),
  }
}

/**
 * Extract date and time from Google Calendar datetime object
 */
function extractDateTime(dt: GoogleCalendarEvent['start']): {
  date: string
  startTime: string | undefined
} {
  if (dt.date) {
    // All-day event (YYYY-MM-DD format)
    return {
      date: dt.date,
      startTime: undefined,
    }
  }

  if (dt.dateTime) {
    // Timed event (RFC3339 format)
    const dateObj = new Date(dt.dateTime)

    // Format date as YYYY-MM-DD
    const date = dateObj.toISOString().split('T')[0]

    // Format time as HH:mm (24-hour)
    const startTime = dateObj.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: dt.timeZone || undefined,
    })

    return { date, startTime }
  }

  // Fallback
  return {
    date: new Date().toISOString().split('T')[0],
    startTime: undefined,
  }
}

/**
 * Detect if an event is virtual
 */
function detectVirtualEvent(event: GoogleCalendarEvent): boolean {
  // Check if there's conference data
  if (event.conferenceData?.entryPoints?.length) {
    return true
  }

  // Check if location contains video meeting indicators
  const location = event.location?.toLowerCase() || ''
  const virtualIndicators = [
    'zoom',
    'meet.google',
    'teams.microsoft',
    'webex',
    'gotomeeting',
    'online',
    'virtual',
    'video call',
    'video conference',
  ]

  return virtualIndicators.some(indicator => location.includes(indicator))
}

/**
 * Extract video meeting link from event
 */
function extractMeetingLink(event: GoogleCalendarEvent): string | undefined {
  // Check conference data first
  if (event.conferenceData?.entryPoints) {
    const videoEntry = event.conferenceData.entryPoints.find(
      ep => ep.entryPointType === 'video'
    )
    if (videoEntry?.uri) {
      return videoEntry.uri
    }
  }

  // Check location for meeting URLs
  const location = event.location || ''
  const urlMatch = location.match(
    /https?:\/\/[^\s]+(?:zoom|meet\.google|teams\.microsoft|webex)[^\s]*/i
  )
  if (urlMatch) {
    return urlMatch[0]
  }

  // Check description for meeting URLs
  const description = event.description || ''
  const descUrlMatch = description.match(
    /https?:\/\/[^\s]+(?:zoom|meet\.google|teams\.microsoft|webex)[^\s]*/i
  )
  if (descUrlMatch) {
    return descUrlMatch[0]
  }

  return undefined
}

/**
 * Map Google event status to our status format
 */
function mapEventStatus(
  googleStatus: GoogleCalendarEvent['status']
): ExternalEvent['status'] {
  switch (googleStatus) {
    case 'confirmed':
      return 'published'
    case 'tentative':
      return 'draft'
    case 'cancelled':
      return 'cancelled'
    default:
      return 'published'
  }
}

/**
 * Clean up HTML from description
 */
function cleanDescription(description: string | undefined): string | undefined {
  if (!description) return undefined

  // Remove HTML tags
  let cleaned = description.replace(/<[^>]*>/g, '')

  // Decode HTML entities
  cleaned = cleaned
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")

  // Trim whitespace
  cleaned = cleaned.trim()

  // Limit length for poster generation
  if (cleaned.length > 500) {
    cleaned = cleaned.substring(0, 497) + '...'
  }

  return cleaned || undefined
}

/**
 * Extract hashtags from description
 */
function extractHashtags(description: string | undefined): string[] {
  if (!description) return []

  const hashtagRegex = /#[a-zA-Z0-9_]+/g
  const matches = description.match(hashtagRegex)

  if (!matches) return []

  // Remove # and dedupe
  return [...new Set(matches.map(tag => tag.substring(1)))]
}

/**
 * Check if an event is in the past
 */
export function isEventPast(event: ExternalEvent): boolean {
  const eventDate = new Date(event.date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return eventDate < today
}

/**
 * Check if an event is today
 */
export function isEventToday(event: ExternalEvent): boolean {
  const eventDate = new Date(event.date)
  const today = new Date()

  return (
    eventDate.getFullYear() === today.getFullYear() &&
    eventDate.getMonth() === today.getMonth() &&
    eventDate.getDate() === today.getDate()
  )
}

/**
 * Sort events by date (ascending)
 */
export function sortEventsByDate(events: ExternalEvent[]): ExternalEvent[] {
  return [...events].sort((a, b) => {
    const dateA = new Date(a.date + (a.startTime ? `T${a.startTime}` : ''))
    const dateB = new Date(b.date + (b.startTime ? `T${b.startTime}` : ''))
    return dateA.getTime() - dateB.getTime()
  })
}

/**
 * Group events by date
 */
export function groupEventsByDate(
  events: ExternalEvent[]
): Record<string, ExternalEvent[]> {
  return events.reduce(
    (groups, event) => {
      const date = event.date
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(event)
      return groups
    },
    {} as Record<string, ExternalEvent[]>
  )
}
