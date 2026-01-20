'use client'

/**
 * Platform Analytics Dashboard Component
 * Display platform-wide API usage statistics with auto-refresh
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DollarSign, Zap, TrendingUp, Activity } from 'lucide-react'
import { useAutoRefresh } from '@/hooks/use-auto-refresh'
import { RefreshIndicator } from '@/components/super-admin/RefreshIndicator'

interface PlatformUsage {
  totals: {
    total_requests: number
    total_input_tokens: number
    total_output_tokens: number
    total_cost_usd: number
    total_cost_inr: number
  }
  byProviderModel: Array<{
    provider: string
    model: string
    total_input_tokens: number
    total_output_tokens: number
    total_cost_usd: number
    total_cost_inr: number
    request_count: number
  }>
}

export default function PlatformAnalyticsDashboard() {
  const [usage, setUsage] = useState<PlatformUsage>({
    totals: {
      total_requests: 0,
      total_input_tokens: 0,
      total_output_tokens: 0,
      total_cost_usd: 0,
      total_cost_inr: 0,
    },
    byProviderModel: [],
  })
  const [dateRange, setDateRange] = useState('today')
  const [loading, setLoading] = useState(true)

  // Auto-refresh every 60 seconds
  const { isRefreshing, lastRefresh, manualRefresh } = useAutoRefresh({
    onRefresh: fetchUsage,
    interval: 60000,
  })

  useEffect(() => {
    fetchUsage()
  }, [dateRange])

  async function fetchUsage() {
    setLoading(true)

    const params = new URLSearchParams({ dateRange })

    try {
      const response = await fetch(`/api/super-admin/analytics/platform-usage?${params}`)
      const data = await response.json()

      if (data.success) {
        setUsage({
          totals: {
            total_requests: data.totals?.total_requests ?? 0,
            total_input_tokens: data.totals?.total_input_tokens ?? 0,
            total_output_tokens: data.totals?.total_output_tokens ?? 0,
            total_cost_usd: data.totals?.total_cost_usd ?? 0,
            total_cost_inr: data.totals?.total_cost_inr ?? 0,
          },
          byProviderModel: data.byProviderModel ?? [],
        })
      }
    } catch (error) {
      console.error('Failed to fetch platform usage:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
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
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Activity className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : usage.totals.total_requests.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">API calls</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
            <Zap className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading
                ? '...'
                : (
                    usage.totals.total_input_tokens + usage.totals.total_output_tokens
                  ).toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              In: {usage.totals.total_input_tokens.toLocaleString()} | Out:{' '}
              {usage.totals.total_output_tokens.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost (USD)</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : `$${usage.totals.total_cost_usd.toFixed(2)}`}
            </div>
            <p className="text-xs text-gray-500 mt-1">Platform cost</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost (INR)</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : `₹${usage.totals.total_cost_inr.toFixed(2)}`}
            </div>
            <p className="text-xs text-gray-500 mt-1">Platform cost</p>
          </CardContent>
        </Card>
      </div>

      {/* Usage by Provider/Model */}
      <Card>
        <CardHeader>
          <CardTitle>Usage by Provider & Model</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Requests</TableHead>
                  <TableHead>Tokens</TableHead>
                  <TableHead>Cost (USD)</TableHead>
                  <TableHead>Cost (INR)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      Loading usage data...
                    </TableCell>
                  </TableRow>
                ) : usage.byProviderModel.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No usage data for selected period
                    </TableCell>
                  </TableRow>
                ) : (
                  usage.byProviderModel.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium capitalize">{item.provider}</TableCell>
                      <TableCell>{item.model}</TableCell>
                      <TableCell>{item.request_count.toLocaleString()}</TableCell>
                      <TableCell>
                        {(item.total_input_tokens + item.total_output_tokens).toLocaleString()}
                      </TableCell>
                      <TableCell>${item.total_cost_usd.toFixed(4)}</TableCell>
                      <TableCell>₹{item.total_cost_inr.toFixed(2)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
