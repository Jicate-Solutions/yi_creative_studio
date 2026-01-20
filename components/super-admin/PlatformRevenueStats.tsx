'use client'

/**
 * Platform Revenue Stats Component
 * Display platform-wide revenue statistics with auto-refresh
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DollarSign, TrendingUp, CreditCard, Activity } from 'lucide-react'
import { useAutoRefresh } from '@/hooks/use-auto-refresh'
import { RefreshIndicator } from '@/components/super-admin/RefreshIndicator'

interface RevenueStats {
  total_revenue_inr: number
  total_revenue_usd: number
  total_credits_sold: number
  transaction_count: number
}

export default function PlatformRevenueStats() {
  const [stats, setStats] = useState<RevenueStats>({
    total_revenue_inr: 0,
    total_revenue_usd: 0,
    total_credits_sold: 0,
    transaction_count: 0,
  })
  const [dateRange, setDateRange] = useState('month')
  const [loading, setLoading] = useState(true)

  // Auto-refresh every 30 seconds
  const { isRefreshing, lastRefresh, manualRefresh } = useAutoRefresh({
    onRefresh: fetchStats,
    interval: 30000,
  })

  useEffect(() => {
    fetchStats()
  }, [dateRange])

  async function fetchStats() {
    setLoading(true)

    const params = new URLSearchParams({ dateRange })

    try {
      const response = await fetch(`/api/super-admin/billing/platform-revenue?${params}`)
      const data = await response.json()

      if (data.success) {
        setStats({
          total_revenue_inr: data.totals?.total_revenue_inr ?? 0,
          total_revenue_usd: data.totals?.total_revenue_usd ?? 0,
          total_credits_sold: data.totals?.total_credits_sold ?? 0,
          transaction_count: data.totals?.transaction_count ?? 0,
        })
      }
    } catch (error) {
      console.error('Failed to fetch revenue stats:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters & Refresh */}
      <div className="flex items-center justify-between gap-4">
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select date range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">Last 7 Days</SelectItem>
            <SelectItem value="month">Last 30 Days</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>

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
            <CardTitle className="text-sm font-medium">Revenue (INR)</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : `₹${stats.total_revenue_inr.toLocaleString()}`}
            </div>
            <p className="text-xs text-gray-500 mt-1">Platform revenue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue (USD)</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : `$${stats.total_revenue_usd.toLocaleString()}`}
            </div>
            <p className="text-xs text-gray-500 mt-1">Platform revenue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credits Sold</CardTitle>
            <CreditCard className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : stats.total_credits_sold.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">Total credits purchased</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <Activity className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : stats.transaction_count.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">Credit purchases</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
