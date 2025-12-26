'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { DailyActivity } from '@/types/dashboard.types'

interface CalendarHeatmapProps {
  data: DailyActivity[]
  className?: string
  showDayLabels?: boolean
  showWeekLabels?: boolean
  colorScheme?: 'primary' | 'green' | 'gradient'
}

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

export function CalendarHeatmap({
  data,
  className,
  showDayLabels = true,
  showWeekLabels = false,
  colorScheme = 'primary'
}: CalendarHeatmapProps) {
  // Calculate intensity levels based on max count
  const { maxCount, weeks } = useMemo(() => {
    const max = Math.max(...data.map(d => d.count), 1)

    // Group by weeks (7 days each)
    const weekGroups: DailyActivity[][] = []
    let currentWeek: DailyActivity[] = []

    // Pad start of first week if needed
    if (data.length > 0) {
      const firstDayOfWeek = data[0].dayOfWeek
      for (let i = 0; i < firstDayOfWeek; i++) {
        currentWeek.push({ date: '', count: -1, dayOfWeek: i }) // -1 = empty
      }
    }

    data.forEach((day) => {
      currentWeek.push(day)
      if (day.dayOfWeek === 6) {
        weekGroups.push(currentWeek)
        currentWeek = []
      }
    })

    // Push remaining days
    if (currentWeek.length > 0) {
      // Pad end of last week
      while (currentWeek.length < 7) {
        currentWeek.push({ date: '', count: -1, dayOfWeek: currentWeek.length })
      }
      weekGroups.push(currentWeek)
    }

    return { maxCount: max, weeks: weekGroups }
  }, [data])

  // Get intensity level (0-4)
  const getIntensity = (count: number): number => {
    if (count <= 0) return 0
    if (count === 1) return 1
    if (count <= 3) return 2
    if (count <= 5) return 3
    return 4
  }

  // Get color class based on intensity and scheme
  const getColorClass = (count: number, isToday?: boolean): string => {
    if (count === -1) return 'bg-transparent'

    const intensity = getIntensity(count)

    if (isToday) {
      return 'ring-2 ring-primary ring-offset-1 ring-offset-background'
    }

    if (colorScheme === 'primary') {
      const colors = [
        'bg-muted/50',
        'bg-primary/20',
        'bg-primary/40',
        'bg-primary/60',
        'bg-primary/80'
      ]
      return colors[intensity]
    }

    if (colorScheme === 'green') {
      const colors = [
        'bg-muted/50',
        'bg-green-500/20',
        'bg-green-500/40',
        'bg-green-500/60',
        'bg-green-500/80'
      ]
      return colors[intensity]
    }

    // Gradient scheme
    const colors = [
      'bg-muted/50',
      'bg-amber-500/30',
      'bg-orange-500/50',
      'bg-primary/60',
      'bg-primary'
    ]
    return colors[intensity]
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Day labels */}
      {showDayLabels && (
        <div className="flex gap-1 ml-6 mb-1">
          {DAY_LABELS.map((label, i) => (
            <div
              key={i}
              className="w-4 h-4 flex items-center justify-center text-[9px] text-muted-foreground font-medium"
            >
              {label}
            </div>
          ))}
        </div>
      )}

      {/* Heatmap grid */}
      <div className="flex gap-1.5">
        {/* Week labels */}
        {showWeekLabels && (
          <div className="flex flex-col gap-1 justify-center">
            {weeks.map((_, i) => (
              <div
                key={i}
                className="h-4 flex items-center text-[9px] text-muted-foreground font-medium"
              >
                W{i + 1}
              </div>
            ))}
          </div>
        )}

        {/* Grid */}
        <div className="flex flex-col gap-1">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex gap-1">
              {week.map((day, dayIndex) => (
                <motion.div
                  key={`${weekIndex}-${dayIndex}`}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    delay: (weekIndex * 7 + dayIndex) * 0.015,
                    duration: 0.2
                  }}
                  className="relative group"
                >
                  <div
                    className={cn(
                      'w-4 h-4 rounded-sm transition-all duration-200',
                      getColorClass(day.count, day.isToday),
                      day.count > 0 && 'cursor-pointer hover:ring-2 hover:ring-primary/50 hover:ring-offset-1 hover:ring-offset-background',
                      day.isToday && getColorClass(day.count)
                    )}
                  />

                  {/* Tooltip */}
                  {day.count >= 0 && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                      <div className="bg-popover text-popover-foreground px-2 py-1 rounded-md shadow-lg text-xs whitespace-nowrap border border-border">
                        <div className="font-medium">
                          {day.count} creative{day.count !== 1 ? 's' : ''}
                        </div>
                        <div className="text-muted-foreground text-[10px]">
                          {day.date}
                        </div>
                      </div>
                      {/* Arrow */}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-4 border-transparent border-t-popover" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-3 text-[10px] text-muted-foreground">
        <span>Less</span>
        <div className="flex gap-0.5">
          {[0, 1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className={cn(
                'w-3 h-3 rounded-sm',
                colorScheme === 'primary' && [
                  'bg-muted/50',
                  'bg-primary/20',
                  'bg-primary/40',
                  'bg-primary/60',
                  'bg-primary/80'
                ][level],
                colorScheme === 'green' && [
                  'bg-muted/50',
                  'bg-green-500/20',
                  'bg-green-500/40',
                  'bg-green-500/60',
                  'bg-green-500/80'
                ][level],
                colorScheme === 'gradient' && [
                  'bg-muted/50',
                  'bg-amber-500/30',
                  'bg-orange-500/50',
                  'bg-primary/60',
                  'bg-primary'
                ][level]
              )}
            />
          ))}
        </div>
        <span>More</span>
      </div>
    </div>
  )
}

// Helper function to generate sample heatmap data
export function generateSampleHeatmapData(daysInMonth: number = 31): DailyActivity[] {
  const today = new Date()
  const currentDay = today.getDate()
  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()

  const data: DailyActivity[] = []

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentYear, currentMonth, day)
    const isPast = day <= currentDay

    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      count: isPast ? Math.floor(Math.random() * 6) : 0,
      dayOfWeek: date.getDay(),
      isToday: day === currentDay
    })
  }

  return data
}
