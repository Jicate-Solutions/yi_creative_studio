'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Coins,
  Download,
  Users,
  Calendar,
  Image,
  Clock,
} from 'lucide-react'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import type { Creative, CreditTransaction } from '@/types/database.types'

interface AnalyticsData {
  totalCreatives: number
  totalCreditsUsed: number
  totalDownloads: number
  averageGenerationTime: number
  creativesByVertical: Record<string, number>
  creativesByModel: Record<string, number>
  dailyActivity: Array<{ date: string; count: number; credits: number }>
  topPerformingCreatives: Creative[]
}

export default function AnalyticsPage() {
  const supabase = createClient()
  const { currentOrganization } = useAuthStore()
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d')
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)

  const fetchAnalytics = useCallback(async () => {
    if (!currentOrganization?.id) return

    setIsLoading(true)

    // Calculate date range
    let startDate: Date | null = null
    if (timeRange === '7d') startDate = subDays(new Date(), 7)
    else if (timeRange === '30d') startDate = subDays(new Date(), 30)
    else if (timeRange === '90d') startDate = subDays(new Date(), 90)

    // Fetch creatives
    let creativesQuery = supabase
      .from('creatives')
      .select('*')
      .eq('organization_id', currentOrganization.id)
      .order('created_at', { ascending: false })

    if (startDate) {
      creativesQuery = creativesQuery.gte('created_at', startDate.toISOString())
    }

    const { data: creatives } = await creativesQuery

    // Fetch credit transactions
    let transactionsQuery = supabase
      .from('credit_transactions')
      .select('*')
      .eq('organization_id', currentOrganization.id)
      .eq('type', 'usage')

    if (startDate) {
      transactionsQuery = transactionsQuery.gte('created_at', startDate.toISOString())
    }

    const { data: transactions } = await transactionsQuery

    setIsLoading(false)

    if (!creatives) {
      setAnalytics(null)
      return
    }

    // Calculate analytics
    const totalCreatives = creatives.length
    const totalCreditsUsed = creatives.reduce((sum, c) => sum + c.credits_used, 0)
    const totalDownloads = creatives.reduce((sum, c) => sum + (c.download_count || 0), 0)
    const avgGenTime = creatives.filter(c => c.generation_time_ms).length > 0
      ? creatives.reduce((sum, c) => sum + (c.generation_time_ms || 0), 0) /
        creatives.filter(c => c.generation_time_ms).length
      : 0

    // Group by vertical
    const creativesByVertical: Record<string, number> = {}
    creatives.forEach(c => {
      const vertical = c.vertical || 'General'
      creativesByVertical[vertical] = (creativesByVertical[vertical] || 0) + 1
    })

    // Group by model
    const creativesByModel: Record<string, number> = {}
    creatives.forEach(c => {
      creativesByModel[c.ai_model] = (creativesByModel[c.ai_model] || 0) + 1
    })

    // Daily activity (last 7 days)
    const dailyActivity: Array<{ date: string; count: number; credits: number }> = []
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i)
      const dayStart = startOfDay(date)
      const dayEnd = endOfDay(date)

      const dayCreatives = creatives.filter(c => {
        const created = new Date(c.created_at)
        return created >= dayStart && created <= dayEnd
      })

      dailyActivity.push({
        date: format(date, 'MMM d'),
        count: dayCreatives.length,
        credits: dayCreatives.reduce((sum, c) => sum + c.credits_used, 0),
      })
    }

    // Top performing (most downloaded)
    const topPerformingCreatives = [...creatives]
      .sort((a, b) => (b.download_count || 0) - (a.download_count || 0))
      .slice(0, 5)

    setAnalytics({
      totalCreatives,
      totalCreditsUsed,
      totalDownloads,
      averageGenerationTime: avgGenTime,
      creativesByVertical,
      creativesByModel,
      dailyActivity,
      topPerformingCreatives,
    })
  }, [currentOrganization?.id, supabase, timeRange])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  const getMaxValue = (arr: Array<{ count: number }>) => {
    return Math.max(...arr.map(a => a.count), 1)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Usage Analytics</h1>
          <p className="text-muted-foreground">
            Track your creative generation and credit usage
          </p>
        </div>
        <Select value={timeRange} onValueChange={(v) => setTimeRange(v as typeof timeRange)}>
          <SelectTrigger className="w-[180px]">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
            <SelectItem value="90d">Last 90 Days</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : !analytics ? (
        <Card className="py-12">
          <CardContent className="text-center">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-medium mb-2">No data available</h3>
            <p className="text-muted-foreground">
              Start generating creatives to see analytics
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Creatives</CardTitle>
                <Sparkles className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalCreatives}</div>
                <p className="text-xs text-muted-foreground">
                  Generated in this period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Credits Used</CardTitle>
                <Coins className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalCreditsUsed}</div>
                <p className="text-xs text-muted-foreground">
                  Total credits consumed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Downloads</CardTitle>
                <Download className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalDownloads}</div>
                <p className="text-xs text-muted-foreground">
                  Total downloads
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Gen Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(analytics.averageGenerationTime / 1000).toFixed(1)}s
                </div>
                <p className="text-xs text-muted-foreground">
                  Average generation time
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Daily Activity Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Daily Activity</CardTitle>
                <CardDescription>Creatives generated per day</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between gap-2 h-40">
                  {analytics.dailyActivity.map((day, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full bg-primary rounded-t transition-all"
                        style={{
                          height: `${(day.count / getMaxValue(analytics.dailyActivity)) * 100}%`,
                          minHeight: day.count > 0 ? '4px' : '0',
                        }}
                      />
                      <span className="text-xs text-muted-foreground">{day.date}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* By Vertical */}
            <Card>
              <CardHeader>
                <CardTitle>By Vertical</CardTitle>
                <CardDescription>Distribution by Yi initiative</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(analytics.creativesByVertical)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([vertical, count]) => (
                      <div key={vertical} className="flex items-center gap-3">
                        <div className="w-24 text-sm font-medium truncate">{vertical}</div>
                        <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{
                              width: `${(count / analytics.totalCreatives) * 100}%`,
                            }}
                          />
                        </div>
                        <div className="w-8 text-right text-sm text-muted-foreground">
                          {count}
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* By AI Model */}
            <Card>
              <CardHeader>
                <CardTitle>By AI Model</CardTitle>
                <CardDescription>Usage by model type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(analytics.creativesByModel)
                    .sort((a, b) => b[1] - a[1])
                    .map(([model, count]) => (
                      <div key={model} className="flex items-center gap-3">
                        <div className="w-24 text-sm font-medium truncate">{model}</div>
                        <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full bg-secondary rounded-full transition-all"
                            style={{
                              width: `${(count / analytics.totalCreatives) * 100}%`,
                            }}
                          />
                        </div>
                        <div className="w-8 text-right text-sm text-muted-foreground">
                          {count}
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Performing */}
            <Card>
              <CardHeader>
                <CardTitle>Top Performing</CardTitle>
                <CardDescription>Most downloaded creatives</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics.topPerformingCreatives.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No downloads yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {analytics.topPerformingCreatives.map((creative, i) => (
                      <div key={creative.id} className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded overflow-hidden bg-muted flex-shrink-0">
                          <img
                            src={creative.thumbnail_url || creative.image_url}
                            alt={creative.title || 'Creative'}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {creative.title || 'Untitled'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {creative.vertical}
                          </p>
                        </div>
                        <Badge variant="secondary">
                          <Download className="h-3 w-3 mr-1" />
                          {creative.download_count || 0}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
