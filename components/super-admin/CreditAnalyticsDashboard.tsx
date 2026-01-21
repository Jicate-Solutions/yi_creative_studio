'use client'

/**
 * Credit Analytics Dashboard Component
 * Displays credit consumption trends, cost breakdown by organization,
 * and top consumers with interactive charts
 */

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  Coins,
  Building,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import { useAutoRefresh } from '@/hooks/use-auto-refresh'
import { RefreshIndicator } from '@/components/super-admin/RefreshIndicator'
import { toast } from 'sonner'

interface CreditAnalytics {
  totals: {
    total_balance: number
    total_allocated: number
    total_consumed: number
    total_purchased: number
    total_refunded: number
  }
  balance_distribution: {
    empty: number
    low: number
    medium: number
    high: number
  }
  daily_stats: Record<string, { allocated: number; consumed: number; refunded: number }>
  top_consumers: Array<{
    organization_id: string
    organization_name: string
    total_consumed: number
    current_balance: number
  }>
  low_balance_orgs: Array<{
    organization_id: string
    organization_name: string
    balance: number
    threshold: number
  }>
}

// Chart configuration
const consumptionChartConfig = {
  allocated: {
    label: 'Allocated',
    color: '#22c55e',
  },
  consumed: {
    label: 'Consumed',
    color: '#ef4444',
  },
  refunded: {
    label: 'Refunded',
    color: '#3b82f6',
  },
} satisfies ChartConfig

const distributionChartConfig = {
  empty: {
    label: 'Empty (0)',
    color: '#ef4444',
  },
  low: {
    label: 'Low (1-100)',
    color: '#f97316',
  },
  medium: {
    label: 'Medium (101-1000)',
    color: '#eab308',
  },
  high: {
    label: 'High (1000+)',
    color: '#22c55e',
  },
} satisfies ChartConfig

const DISTRIBUTION_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e']

export default function CreditAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<CreditAnalytics | null>(null)
  const [dateRange, setDateRange] = useState('7d')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Auto-refresh every 60 seconds
  const { isRefreshing, lastRefresh, manualRefresh } = useAutoRefresh({
    onRefresh: fetchAnalytics,
    interval: 60000,
  })

  useEffect(() => {
    fetchAnalytics()
  }, [dateRange])

  async function fetchAnalytics() {
    try {
      setError(null)
      const response = await fetch(`/api/super-admin/credits/analytics?range=${dateRange}`)
      const data = await response.json()

      if (data.success) {
        setAnalytics(data.analytics)
      } else {
        throw new Error(data.error || 'Failed to fetch analytics')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load analytics'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  // Transform daily stats for line chart
  const dailyChartData = useMemo(() => {
    if (!analytics?.daily_stats) return []

    return Object.entries(analytics.daily_stats)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, stats]) => ({
        date,
        displayDate: new Date(date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        allocated: stats.allocated,
        consumed: stats.consumed,
        refunded: stats.refunded,
      }))
  }, [analytics?.daily_stats])

  // Transform distribution for pie chart
  const distributionData = useMemo(() => {
    if (!analytics?.balance_distribution) return []

    return [
      { name: 'Empty (0)', value: analytics.balance_distribution.empty, key: 'empty' },
      { name: 'Low (1-100)', value: analytics.balance_distribution.low, key: 'low' },
      { name: 'Medium (101-1K)', value: analytics.balance_distribution.medium, key: 'medium' },
      { name: 'High (1K+)', value: analytics.balance_distribution.high, key: 'high' },
    ].filter((item) => item.value > 0)
  }, [analytics?.balance_distribution])

  // Calculate consumption trend (compare first half vs second half of period)
  const consumptionTrend = useMemo(() => {
    if (dailyChartData.length < 2) return { direction: 'neutral', percentage: 0 }

    const midpoint = Math.floor(dailyChartData.length / 2)
    const firstHalf = dailyChartData.slice(0, midpoint)
    const secondHalf = dailyChartData.slice(midpoint)

    const firstHalfAvg =
      firstHalf.reduce((sum, d) => sum + d.consumed, 0) / firstHalf.length || 0
    const secondHalfAvg =
      secondHalf.reduce((sum, d) => sum + d.consumed, 0) / secondHalf.length || 0

    if (firstHalfAvg === 0) return { direction: 'up', percentage: 100 }

    const change = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100

    return {
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
      percentage: Math.abs(change),
    }
  }, [dailyChartData])

  if (loading) {
    return <CreditAnalyticsSkeleton />
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => fetchAnalytics()}
              className="mt-2 text-sm text-red-600 underline hover:no-underline"
            >
              Try again
            </button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!analytics) return null

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <RefreshIndicator
          lastRefresh={lastRefresh}
          isRefreshing={isRefreshing}
          onManualRefresh={manualRefresh}
        />
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <Coins className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.totals.total_balance.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Credits across all orgs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Allocated</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              +{analytics.totals.total_allocated.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Includes bonuses & purchases
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Consumed</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              -{analytics.totals.total_consumed.toLocaleString()}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {consumptionTrend.direction === 'up' ? (
                <>
                  <ArrowUpRight className="h-3 w-3 text-red-500" />
                  <span className="text-red-500">
                    +{consumptionTrend.percentage.toFixed(1)}%
                  </span>
                </>
              ) : consumptionTrend.direction === 'down' ? (
                <>
                  <ArrowDownRight className="h-3 w-3 text-green-500" />
                  <span className="text-green-500">
                    -{consumptionTrend.percentage.toFixed(1)}%
                  </span>
                </>
              ) : (
                <span>No change</span>
              )}
              <span className="ml-1">vs prior period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Balance Orgs</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {analytics.low_balance_orgs.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Organizations needing credits
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Consumption Trends Line Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Credit Activity Trends</CardTitle>
            <CardDescription>
              Daily allocation, consumption, and refunds
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dailyChartData.length > 0 ? (
              <ChartContainer config={consumptionChartConfig} className="h-[300px] w-full">
                <LineChart data={dailyChartData} accessibilityLayer>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="displayDate"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Line
                    type="monotone"
                    dataKey="allocated"
                    stroke="var(--color-allocated)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="consumed"
                    stroke="var(--color-consumed)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="refunded"
                    stroke="var(--color-refunded)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ChartContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No activity data for selected period
              </div>
            )}
          </CardContent>
        </Card>

        {/* Balance Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Balance Distribution</CardTitle>
            <CardDescription>Organizations by credit balance range</CardDescription>
          </CardHeader>
          <CardContent>
            {distributionData.length > 0 ? (
              <ChartContainer config={distributionChartConfig} className="h-[300px] w-full">
                <PieChart accessibilityLayer>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Pie
                    data={distributionData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={60}
                    paddingAngle={2}
                  >
                    {distributionData.map((entry, index) => (
                      <Cell
                        key={entry.key}
                        fill={DISTRIBUTION_COLORS[['empty', 'low', 'medium', 'high'].indexOf(entry.key)]}
                      />
                    ))}
                  </Pie>
                  <ChartLegend content={<ChartLegendContent />} />
                </PieChart>
              </ChartContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No distribution data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Consumers Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Top Credit Consumers
            </CardTitle>
            <CardDescription>
              Organizations with highest credit usage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organization</TableHead>
                    <TableHead className="text-right">Consumed</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.top_consumers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                        No consumption data yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    analytics.top_consumers.map((org, idx) => (
                      <TableRow key={org.organization_id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground w-4">
                              {idx + 1}.
                            </span>
                            {org.organization_name}
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-red-600 font-medium">
                          {org.total_consumed.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant="outline"
                            className={
                              org.current_balance <= 0
                                ? 'border-red-200 text-red-700 bg-red-50'
                                : org.current_balance <= 100
                                  ? 'border-orange-200 text-orange-700 bg-orange-50'
                                  : 'border-green-200 text-green-700 bg-green-50'
                            }
                          >
                            {org.current_balance.toLocaleString()}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Low Balance Organizations Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Organizations Needing Credits
            </CardTitle>
            <CardDescription>
              Below {analytics.low_balance_orgs[0]?.threshold || 100} credits threshold
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organization</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.low_balance_orgs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-4 text-green-600">
                        All organizations have sufficient credits
                      </TableCell>
                    </TableRow>
                  ) : (
                    analytics.low_balance_orgs.map((org) => (
                      <TableRow key={org.organization_id}>
                        <TableCell className="font-medium">
                          {org.organization_name}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {org.balance.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {org.balance === 0 ? (
                            <Badge variant="destructive">Empty</Badge>
                          ) : org.balance <= 10 ? (
                            <Badge className="bg-red-100 text-red-800 border-red-200">
                              Critical
                            </Badge>
                          ) : (
                            <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                              Low
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function CreditAnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-[140px]" />
        <Skeleton className="h-8 w-[200px]" />
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20 mb-1" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-56" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      </div>

      {/* Tables skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-4 w-52" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[200px] w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
