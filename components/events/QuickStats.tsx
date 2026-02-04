'use client'

/**
 * QuickStats Component
 * Stats widget showing event counts
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CalendarDays, TrendingUp, Clock, Calendar } from 'lucide-react'
import { format } from 'date-fns'

interface QuickStatsProps {
  eventsThisMonth: number
  totalEvents: number
  upcomingCount: number
  todayCount: number
  currentMonth: Date
}

export function QuickStats({
  eventsThisMonth,
  totalEvents,
  upcomingCount,
  todayCount,
  currentMonth,
}: QuickStatsProps) {
  const stats = [
    {
      label: "Today's Events",
      value: todayCount,
      icon: Clock,
      color: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30',
    },
    {
      label: 'Upcoming',
      value: upcomingCount,
      icon: TrendingUp,
      color: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30',
    },
    {
      label: format(currentMonth, 'MMM'),
      value: eventsThisMonth,
      icon: Calendar,
      color: 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30',
    },
    {
      label: 'Total Synced',
      value: totalEvents,
      icon: CalendarDays,
      color: 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-800',
    },
  ]

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          Quick Stats
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50"
            >
              <div className={`p-1.5 rounded ${stat.color}`}>
                <stat.icon className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {stat.value}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {stat.label}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default QuickStats
