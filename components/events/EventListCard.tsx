'use client'

/**
 * EventListCard Component
 * Large, actionable event card for the list-first Events Calendar layout
 */

import { ExternalEvent } from '@/types/external-event.types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Calendar, Clock, MapPin, Users, Sparkles, Globe, Video } from 'lucide-react'
import { format, parseISO, isToday, isTomorrow, isPast } from 'date-fns'

interface EventListCardProps {
  event: ExternalEvent & {
    _syncedEventId?: string
    _sourceAppId?: string
    _syncedAt?: string
  }
  onCreatePoster?: (event: ExternalEvent) => void
}

export function EventListCard({ event, onCreatePoster }: EventListCardProps) {
  // Format date for display
  const eventDate = parseISO(event.date)
  const isEventToday = isToday(eventDate)
  const isEventTomorrow = isTomorrow(eventDate)
  const isEventPast = isPast(eventDate) && !isEventToday

  // Format time display
  const formatTime = (time?: string) => {
    if (!time) return null
    try {
      const [hours, minutes] = time.split(':')
      const date = new Date()
      date.setHours(parseInt(hours), parseInt(minutes))
      return format(date, 'h:mm a')
    } catch {
      return time
    }
  }

  // Get date label
  const getDateLabel = () => {
    if (isEventToday) return 'Today'
    if (isEventTomorrow) return 'Tomorrow'
    return format(eventDate, 'EEE, MMM d')
  }

  // Get source badge color
  const getSourceBadgeColor = () => {
    switch (event._sourceAppId) {
      case 'yi-connect':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
      case 'myjkkn':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
    }
  }

  // Convert snake_case field key to human-readable label
  const keyToLabel = (key: string): string => {
    return key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  // Handle create poster click
  const handleCreatePoster = () => {
    if (onCreatePoster) {
      onCreatePoster(event)
    }
  }

  return (
    <Card className={`group transition-all hover:shadow-lg hover:border-primary/30 ${isEventPast ? 'opacity-60' : ''}`}>
      <CardContent className="p-2 sm:p-3">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
          {/* Event Info */}
          <div className="flex-1 min-w-0 space-y-1.5">
            {/* Title and badges */}
            <div className="flex flex-wrap items-center gap-1.5">
              {event.isFeatured && (
                <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Featured
                </Badge>
              )}
              {event.isVirtual && (
                <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                  <Video className="w-3 h-3 mr-1" />
                  Virtual
                </Badge>
              )}
              {event._sourceAppId && (
                <Badge variant="secondary" className={getSourceBadgeColor()}>
                  {event._sourceAppId}
                </Badge>
              )}
            </div>

            {/* Event name */}
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
              {event.name}
            </h3>

            {/* Date and time */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3 h-3 text-primary" />
                <span className={isEventToday ? 'font-semibold text-primary' : ''}>
                  {getDateLabel()}
                </span>
              </div>
              {event.startTime && (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-gray-400" />
                  <span>
                    {formatTime(event.startTime)}
                    {event.endTime && ` - ${formatTime(event.endTime)}`}
                  </span>
                </div>
              )}
            </div>

            {/* Location */}
            {(event.venue || event.city) && (
              <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                <span className="truncate">
                  {[event.venue, event.city].filter(Boolean).join(', ')}
                </span>
              </div>
            )}

            {/* Virtual meeting link */}
            {event.isVirtual && event.virtualMeetingLink && (
              <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
                <Globe className="w-3 h-3 flex-shrink-0" />
                <a
                  href={event.virtualMeetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate hover:underline"
                >
                  Join online
                </a>
              </div>
            )}

            {/* Capacity indicator */}
            {event.maxCapacity && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                <Users className="w-3 h-3" />
                {event.currentRegistrations !== undefined ? (
                  <span>
                    {event.currentRegistrations} / {event.maxCapacity} registered
                    {event.maxCapacity - (event.currentRegistrations || 0) <= 10 && (
                      <span className="text-orange-600 font-medium ml-1">
                        (Few spots left!)
                      </span>
                    )}
                  </span>
                ) : (
                  <span>Capacity: {event.maxCapacity}</span>
                )}
              </div>
            )}

            {/* Tags */}
            {event.tags && event.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {event.tags.slice(0, 3).map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
                {event.tags.length > 3 && (
                  <Badge variant="outline" className="text-xs text-gray-400">
                    +{event.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}

            {/* Additional Info - Dynamic Fields (v3.0) */}
            {event.customData && Object.keys(event.customData).length > 0 && (
              <div className="pt-2 mt-2 border-t border-border/50">
                <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Additional Info
                </p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(event.customData).slice(0, 4).map(([key, value]) => (
                    <Badge key={key} variant="secondary" className="text-xs">
                      <span className="text-muted-foreground mr-1">
                        {keyToLabel(key)}:
                      </span>
                      {String(value)}
                    </Badge>
                  ))}
                  {Object.keys(event.customData).length > 4 && (
                    <Badge variant="outline" className="text-xs text-gray-400">
                      +{Object.keys(event.customData).length - 4} more
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action button */}
          <div className="flex-shrink-0 self-end sm:self-center">
            {!isEventPast ? (
              <Button
                onClick={handleCreatePoster}
                className="w-full sm:w-auto whitespace-nowrap"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Create Poster
              </Button>
            ) : (
              <Badge variant="secondary" className="bg-gray-100 text-gray-500">
                Past Event
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default EventListCard
