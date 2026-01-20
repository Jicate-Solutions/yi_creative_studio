'use client'

/**
 * Platform Credit Stats Component
 * Display platform-wide credit statistics with auto-refresh
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Coins, TrendingUp, TrendingDown, Activity } from 'lucide-react'
import { useAutoRefresh } from '@/hooks/use-auto-refresh'
import { RefreshIndicator } from '@/components/super-admin/RefreshIndicator'

interface CreditStats {
  total_balance: number
  total_allocated: number
  total_consumed: number
  total_purchased: number
}

export default function PlatformCreditStats() {
  const [stats, setStats] = useState<CreditStats>({
    total_balance: 0,
    total_allocated: 0,
    total_consumed: 0,
    total_purchased: 0,
  })
  const [loading, setLoading] = useState(true)

  // Auto-refresh every 15 seconds
  const { isRefreshing, lastRefresh, manualRefresh } = useAutoRefresh({
    onRefresh: fetchStats,
    interval: 15000,
  })

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {
    setLoading(true)

    try {
      const response = await fetch('/api/super-admin/credits/analytics')
      const data = await response.json()

      if (data.success) {
        setStats({
          total_balance: data.analytics.totals.total_balance,
          total_allocated: data.analytics.totals.total_allocated,
          total_consumed: data.analytics.totals.total_consumed,
          total_purchased: data.analytics.totals.total_purchased,
        })
      }
    } catch (error) {
      console.error('Failed to fetch credit stats:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
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
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <Coins className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : stats.total_balance.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">Available credits</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Allocated</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : stats.total_allocated.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">Lifetime allocations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Consumed</CardTitle>
            <TrendingDown className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : stats.total_consumed.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">Credits used</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Purchased</CardTitle>
            <Activity className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : stats.total_purchased.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">Customer purchases</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
