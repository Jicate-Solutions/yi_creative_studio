'use client'

/**
 * Stats Cards Component
 * Reusable stat cards for displaying platform metrics
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'

export interface StatCard {
  title: string
  value: string | number
  subtitle: string
  icon: LucideIcon
  trend?: {
    value: string
    isPositive: boolean
  }
}

interface StatsCardsProps {
  stats: StatCard[]
}

export default function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <Icon className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-xs text-gray-500">{stat.subtitle}</p>
                {stat.trend && (
                  <span
                    className={`text-xs font-medium ${
                      stat.trend.isPositive ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {stat.trend.value}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
