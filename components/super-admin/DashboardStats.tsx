'use client'

/**
 * Dashboard Stats Component
 * Display platform metrics with auto-refresh
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Users, CreditCard, TrendingUp } from 'lucide-react'
import { useAutoRefresh } from '@/hooks/use-auto-refresh'
import { RefreshIndicator } from '@/components/super-admin/RefreshIndicator'

interface PlatformStats {
  orgCount: number
  userCount: number
  activeSubsCount: number
  totalCreditsAllocated: number
}

export default function DashboardStats() {
  const [stats, setStats] = useState<PlatformStats>({
    orgCount: 0,
    userCount: 0,
    activeSubsCount: 0,
    totalCreditsAllocated: 0,
  })
  const [loading, setLoading] = useState(true)

  // Auto-refresh every 30 seconds
  const { isRefreshing, lastRefresh, manualRefresh } = useAutoRefresh({
    onRefresh: fetchStats,
    interval: 30000, // 30 seconds
  })

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {
    setLoading(true)

    try {
      const response = await fetch('/api/super-admin/dashboard/stats')
      const data = await response.json()

      if (data.success) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Refresh indicator */}
      <div className="flex justify-end">
        <RefreshIndicator
          lastRefresh={lastRefresh}
          isRefreshing={isRefreshing}
          onManualRefresh={manualRefresh}
        />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Organizations</CardTitle>
            <Building2 className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : stats.orgCount.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">Registered organizations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : stats.userCount.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">Platform users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : stats.activeSubsCount.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credits Allocated</CardTitle>
            <CreditCard className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : stats.totalCreditsAllocated.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">Total lifetime credits</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
