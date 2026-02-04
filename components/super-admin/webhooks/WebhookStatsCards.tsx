'use client'

/**
 * Webhook Stats Cards Component
 * Display webhook dashboard statistics
 */

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Webhook, Calendar, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface WebhookStats {
  sources: {
    total: number
    active: number
    inactive: number
  }
  events: {
    total: number
    last24h: number
  }
  logs: {
    successRate: number
    recentErrors: number
    totalLast7Days: number
  }
}

interface RecentActivity {
  id: string
  source_app_id: string
  action: string
  status: string
  event_name: string | null
  created_at: string
}

export default function WebhookStatsCards() {
  const [stats, setStats] = useState<WebhookStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  const fetchStats = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/super-admin/webhooks/stats')
      const data = await response.json()

      if (data.success) {
        setStats(data.stats)
        setRecentActivity(data.recentActivity || [])
      }
    } catch (error) {
      console.error('Failed to fetch webhook stats:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  const statCards = [
    {
      title: 'Event Sources',
      value: stats?.sources.total || 0,
      subtitle: `${stats?.sources.active || 0} active, ${stats?.sources.inactive || 0} inactive`,
      icon: Webhook,
    },
    {
      title: 'Synced Events',
      value: stats?.events.total || 0,
      subtitle: `${stats?.events.last24h || 0} in last 24h`,
      icon: Calendar,
    },
    {
      title: 'Success Rate',
      value: `${stats?.logs.successRate || 100}%`,
      subtitle: `Last 7 days (${stats?.logs.totalLast7Days || 0} calls)`,
      icon: CheckCircle,
    },
    {
      title: 'Recent Errors',
      value: stats?.logs.recentErrors || 0,
      subtitle: 'Last 7 days',
      icon: AlertTriangle,
    },
  ]

  function formatDate(dateString: string) {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-50'
      case 'error':
        return 'text-red-600 bg-red-50'
      case 'validation_error':
        return 'text-amber-600 bg-amber-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Overview</h2>
        <Button variant="ghost" size="sm" onClick={fetchStats} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? '...' : stat.value}</div>
                <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-gray-500">No recent webhook activity</p>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between text-sm border-b last:border-0 pb-2 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(activity.status)}`}
                    >
                      {activity.status}
                    </span>
                    <span className="font-medium">{activity.source_app_id}</span>
                    <span className="text-gray-500">
                      {activity.action} {activity.event_name && `- ${activity.event_name}`}
                    </span>
                  </div>
                  <span className="text-gray-400 text-xs">{formatDate(activity.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
