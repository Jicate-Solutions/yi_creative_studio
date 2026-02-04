'use client'

/**
 * CompactCalendar Component
 * Small calendar widget with event dots for date filtering
 */

import { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  getDay,
  isToday,
  parseISO,
} from 'date-fns'

interface CompactCalendarProps {
  currentMonth: Date
  onMonthChange: (date: Date) => void
  selectedDate: Date | null
  onDateSelect: (date: Date | null) => void
  eventDates: string[] // Array of ISO date strings with events
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

export function CompactCalendar({
  currentMonth,
  onMonthChange,
  selectedDate,
  onDateSelect,
  eventDates,
}: CompactCalendarProps) {
  // Create a Set of event dates for quick lookup
  const eventDateSet = useMemo(() => new Set(eventDates), [eventDates])

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

    // Add padding days at the start to align with weekday
    const startPadding = getDay(monthStart)
    const paddedDays: (Date | null)[] = Array(startPadding).fill(null)
    paddedDays.push(...days)

    // Add padding at the end to complete the grid
    const endPadding = (7 - (paddedDays.length % 7)) % 7
    for (let i = 0; i < endPadding; i++) {
      paddedDays.push(null)
    }

    return paddedDays
  }, [currentMonth])

  // Check if a date has events
  const hasEvent = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return eventDateSet.has(dateStr)
  }

  // Handle previous month
  const handlePrevMonth = () => {
    onMonthChange(subMonths(currentMonth, 1))
  }

  // Handle next month
  const handleNextMonth = () => {
    onMonthChange(addMonths(currentMonth, 1))
  }

  // Handle date click
  const handleDateClick = (date: Date) => {
    if (selectedDate && isSameDay(selectedDate, date)) {
      // Clicking same date clears selection
      onDateSelect(null)
    } else {
      onDateSelect(date)
    }
  }

  // Handle today button
  const handleTodayClick = () => {
    const today = new Date()
    onMonthChange(today)
    onDateSelect(null)
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            {format(currentMonth, 'MMMM yyyy')}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handlePrevMonth}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={handleTodayClick}
            >
              Today
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleNextMonth}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-1">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-1"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-px">
          {calendarDays.map((date, index) => {
            if (!date) {
              return <div key={`empty-${index}`} className="aspect-square" />
            }

            const isCurrentMonth = isSameMonth(date, currentMonth)
            const isSelected = selectedDate && isSameDay(date, selectedDate)
            const isTodayDate = isToday(date)
            const dateHasEvent = hasEvent(date)

            return (
              <button
                key={date.toISOString()}
                onClick={() => handleDateClick(date)}
                className={`
                  aspect-square flex flex-col items-center justify-center
                  text-sm rounded-md transition-colors relative
                  ${!isCurrentMonth ? 'text-gray-300 dark:text-gray-600' : ''}
                  ${isSelected ? 'bg-primary text-white' : ''}
                  ${isTodayDate && !isSelected ? 'bg-primary/10 text-primary font-semibold' : ''}
                  ${!isSelected && isCurrentMonth ? 'hover:bg-gray-100 dark:hover:bg-gray-800' : ''}
                  ${isCurrentMonth && !isSelected && !isTodayDate ? 'text-gray-700 dark:text-gray-300' : ''}
                `}
              >
                <span>{format(date, 'd')}</span>
                {/* Event indicator dot */}
                {dateHasEvent && (
                  <span
                    className={`
                      absolute bottom-0.5 w-1 h-1 rounded-full
                      ${isSelected ? 'bg-white' : 'bg-primary'}
                    `}
                  />
                )}
              </button>
            )
          })}
        </div>

        {/* Legend */}
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-primary" />
              <span>Has events</span>
            </div>
            {selectedDate && (
              <button
                onClick={() => onDateSelect(null)}
                className="text-primary hover:underline"
              >
                Clear filter
              </button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default CompactCalendar
