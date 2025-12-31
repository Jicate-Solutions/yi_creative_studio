'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  BarChart3,
  Sparkles,
  Coins,
  Download,
  Calendar,
  Clock,
  DollarSign,
  Cpu,
  Zap,
  Brain,
  Image as ImageIcon,
  MessageSquare,
  TrendingUp,
  Info,
} from 'lucide-react'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import type { Creative } from '@/types/database.types'
import { type UsageAnalytics } from '@/lib/services/api-usage'
import { formatUSD, formatINR, USD_TO_INR, convertToINR, EXCHANGE_RATE_UPDATED } from '@/lib/services/currency'
import { REQUEST_TYPE_LABELS, type AIProvider, type RequestType } from '@/lib/config/ai-pricing'

interface AnalyticsData {
  totalCreatives: number
  totalCreditsUsed: number
  totalDownloads: number
  averageGenerationTime: number
  creativesByVertical: Record<string, number>
  creativesByModel: Record<string, number>
  dailyActivity: Array<{ date: string; count: number; credits: number }>
  topPerformingCreatives: Pick<Creative, 'id' | 'credits_used' | 'download_count' | 'generation_time_ms' | 'vertical' | 'ai_model' | 'created_at' | 'creative_type' | 'thumbnail_url' | 'image_url' | 'title'>[]
}

// Helper function to get icon for request type
function getStageIcon(requestType: string) {
  switch (requestType) {
    case 'design_intelligence':
      return <Brain className="h-4 w-4 text-purple-500" />
    case 'ultra_pro_prompt':
      return <MessageSquare className="h-4 w-4 text-blue-500" />
    case 'image_generation':
      return <ImageIcon className="h-4 w-4 text-green-500" />
    case 'field_suggestion':
      return <Sparkles className="h-4 w-4 text-yellow-500" />
    default:
      return <Zap className="h-4 w-4 text-gray-500" />
  }
}

// Helper to get friendly stage label
function getStageLabel(requestType: string): string {
  return REQUEST_TYPE_LABELS[requestType as RequestType] || requestType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

// Helper to get model display name
function getModelDisplayName(model: string): string {
  const modelNames: Record<string, string> = {
    // Gemini models - Image generation
    'gemini-2.5-flash-image': 'Gemini 2.5 Flash (Image)',
    'gemini-3-pro-image-preview': 'Gemini 3 Pro (Image)',
    // Gemini models - Text
    'gemini-2.5-flash': 'Gemini 2.5 Flash',
    'gemini-2.5-flash-lite': 'Gemini 2.5 Flash Lite',
    'gemini-2.5-flash-exp': 'Gemini 2.5 Flash (Exp)',
    'gemini-2.5-pro': 'Gemini 2.5 Pro',
    'gemini-2.0-flash': 'Gemini 2.0 Flash',
    'gemini-2.0-flash-exp': 'Gemini 2.0 Flash (Exp)',
    'gemini-2.0-flash-001': 'Gemini 2.0 Flash',
    'gemini-3-pro-preview': 'Gemini 3 Pro Preview',
    // Claude Haiku models
    'claude-haiku-4-5-20251001': 'Claude Haiku 4.5',
    'claude-haiku-4-5': 'Claude Haiku 4.5',
    'claude-3-5-haiku-latest': 'Claude Haiku 3.5 (Legacy)',
    'claude-3-5-haiku-20241022': 'Claude Haiku 3.5 (Legacy)',
    // Claude Sonnet models
    'claude-sonnet-4-5-20251022': 'Claude Sonnet 4.5',
    'claude-sonnet-4-5': 'Claude Sonnet 4.5',
    'claude-sonnet-4-20250514': 'Claude Sonnet 4',
    'claude-3-5-sonnet-latest': 'Claude Sonnet 3.5 (Legacy)',
    // Claude Opus models
    'claude-opus-4-5-20251101': 'Claude Opus 4.5',
    'claude-opus-4-5': 'Claude Opus 4.5',
    'claude-opus-4-20250514': 'Claude Opus 4',
  }
  return modelNames[model] || model
}


export default function AnalyticsPage() {
  const supabase = useMemo(() => createClient(), [])
  const { currentOrganization, isLoading: authLoading } = useAuthStore()
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d')
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [apiUsage, setApiUsage] = useState<UsageAnalytics | null>(null)

  const fetchAnalytics = useCallback(async () => {
    // Don't fetch if organization isn't ready yet
    if (!currentOrganization?.id) {
      setIsLoading(false)  // Clear loading state when org not ready
      return
    }

    setIsLoading(true)

    // Calculate date range
    let startDate: Date | null = null
    if (timeRange === '7d') startDate = subDays(new Date(), 7)
    else if (timeRange === '30d') startDate = subDays(new Date(), 30)
    else if (timeRange === '90d') startDate = subDays(new Date(), 90)

    // Fetch creatives (only needed columns to reduce disk IO)
    let creativesQuery = supabase
      .from('creatives')
      .select('id, credits_used, download_count, generation_time_ms, vertical, ai_model, created_at, creative_type, thumbnail_url, image_url, title')
      .eq('organization_id', currentOrganization.id)
      .order('created_at', { ascending: false })
      .limit(1000) // Safety limit for 90 days of data

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
      .limit(1000) // Safety limit for 90 days of data

    if (startDate) {
      transactionsQuery = transactionsQuery.gte('created_at', startDate.toISOString())
    }

    // Legacy: transactions fetched for potential future credit-based analytics
    const { data: _transactions } = await transactionsQuery

    // Fetch API usage analytics using PostgreSQL aggregation (Phase 2 optimization)
    const [aggregatedResult, dailyTrendResult, recentRecordsResult] = await Promise.all([
      supabase.rpc('get_api_usage_analytics', {
        org_id: currentOrganization.id,
        start_date: startDate?.toISOString() || null
      }),
      supabase.rpc('get_daily_usage_trend', {
        org_id: currentOrganization.id,
        start_date: startDate?.toISOString() || null
      }),
      supabase.rpc('get_recent_api_usage', {
        org_id: currentOrganization.id,
        start_date: startDate?.toISOString() || null,
        record_limit: 10
      })
    ])

    setIsLoading(false)

    // Process aggregated API usage data (already aggregated by PostgreSQL - Phase 2 optimization)
    if (aggregatedResult.data && aggregatedResult.data.length > 0) {
      const aggregated = aggregatedResult.data

      // Transform pre-aggregated data into UsageAnalytics interface
      const usageAnalytics: UsageAnalytics = {
        totalCostUsd: 0,
        totalCostInr: 0,
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalCachedTokens: 0,
        totalImages: 0,
        byProvider: {} as UsageAnalytics['byProvider'],
        byRequestType: {},
        byModel: {},
        dailyTrend: [],
        recentRecords: [],
      }

      // Calculate totals and group by provider/requestType/model from pre-aggregated results
      for (const row of aggregated) {
        const cost = Number(row.total_cost_usd) || 0
        const inputTokens = Number(row.total_input_tokens) || 0
        const outputTokens = Number(row.total_output_tokens) || 0
        const cachedTokens = Number(row.total_cached_tokens) || 0
        const imageCount = Number(row.total_images) || 0
        const requestCount = Number(row.request_count) || 0

        // Add to totals
        usageAnalytics.totalCostUsd += cost
        usageAnalytics.totalInputTokens += inputTokens
        usageAnalytics.totalOutputTokens += outputTokens
        usageAnalytics.totalCachedTokens += cachedTokens
        usageAnalytics.totalImages += imageCount

        // Group by provider
        const provider = row.provider as AIProvider
        if (!usageAnalytics.byProvider[provider]) {
          usageAnalytics.byProvider[provider] = { costUsd: 0, inputTokens: 0, outputTokens: 0, requestCount: 0 }
        }
        usageAnalytics.byProvider[provider].costUsd += cost
        usageAnalytics.byProvider[provider].inputTokens += inputTokens
        usageAnalytics.byProvider[provider].outputTokens += outputTokens
        usageAnalytics.byProvider[provider].requestCount += requestCount

        // Group by request type
        const requestType = row.request_type
        if (!usageAnalytics.byRequestType[requestType]) {
          usageAnalytics.byRequestType[requestType] = { costUsd: 0, inputTokens: 0, outputTokens: 0, requestCount: 0 }
        }
        usageAnalytics.byRequestType[requestType].costUsd += cost
        usageAnalytics.byRequestType[requestType].inputTokens += inputTokens
        usageAnalytics.byRequestType[requestType].outputTokens += outputTokens
        usageAnalytics.byRequestType[requestType].requestCount += requestCount

        // Group by model
        const model = row.model
        if (!usageAnalytics.byModel[model]) {
          usageAnalytics.byModel[model] = { costUsd: 0, inputTokens: 0, outputTokens: 0, requestCount: 0 }
        }
        usageAnalytics.byModel[model].costUsd += cost
        usageAnalytics.byModel[model].inputTokens += inputTokens
        usageAnalytics.byModel[model].outputTokens += outputTokens
        usageAnalytics.byModel[model].requestCount += requestCount
      }

      // Transform daily trend data (already aggregated by PostgreSQL)
      if (dailyTrendResult.data && dailyTrendResult.data.length > 0) {
        usageAnalytics.dailyTrend = dailyTrendResult.data.map((row: any) => ({
          date: row.usage_date,
          costUsd: Number(row.total_cost_usd) || 0,
          requestCount: Number(row.request_count) || 0,
          inputTokens: Number(row.input_tokens) || 0,
          outputTokens: Number(row.output_tokens) || 0,
        })).sort((a: any, b: any) => a.date.localeCompare(b.date))
      }

      // Transform recent records
      if (recentRecordsResult.data && recentRecordsResult.data.length > 0) {
        usageAnalytics.recentRecords = recentRecordsResult.data.map((r: any) => ({
          id: r.id,
          createdAt: r.created_at,
          requestType: r.request_type,
          provider: r.provider,
          model: r.model,
          costUsd: Number(r.estimated_cost_usd) || 0,
          inputTokens: r.input_tokens || 0,
          outputTokens: r.output_tokens || 0,
        }))
      }

      usageAnalytics.totalCostInr = convertToINR(usageAnalytics.totalCostUsd)

      setApiUsage(usageAnalytics)
    } else {
      setApiUsage(null)
    }

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
      {/* Time Range Filter */}
      <div className="flex justify-end">
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

      {/* Show loading skeletons only during actual loading */}
      {(authLoading || isLoading) ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : !currentOrganization?.id ? (
        // Organization not available - show helpful message instead of infinite skeletons
        <Card className="py-12">
          <CardContent className="text-center">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-medium mb-2">Organization Required</h3>
            <p className="text-muted-foreground">
              Please select an organization to view analytics
            </p>
          </CardContent>
        </Card>
      ) : !analytics ? (
        <div className="space-y-6">
          {/* No Data State with Pricing Info */}
          <Card className="py-12">
            <CardContent className="text-center">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-medium mb-2">No usage data yet</h3>
              <p className="text-muted-foreground mb-6">
                Generate your first creative to start tracking API usage and costs
              </p>
            </CardContent>
          </Card>

          {/* Show AI Pricing Reference */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-blue-500" />
                AI Pricing Reference
              </CardTitle>
              <CardDescription>
                Current pricing for AI models used in creative generation (USD per 1M tokens)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="generation" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="generation">Generation Pipeline</TabsTrigger>
                  <TabsTrigger value="models">All Models</TabsTrigger>
                </TabsList>
                <TabsContent value="generation" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    {/* Stage 1: Ultra-Pro Prompt */}
                    <Card className="border-blue-200 dark:border-blue-800">
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-blue-500" />
                          <CardTitle className="text-sm">Stage 1: Ultra-Pro Prompt</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="text-sm space-y-1">
                        <p className="text-muted-foreground">Claude Haiku 4.5</p>
                        <p>Input: <span className="font-medium">$1.00</span>/1M tokens</p>
                        <p>Output: <span className="font-medium">$5.00</span>/1M tokens</p>
                        <p className="text-xs text-muted-foreground">Cached: $0.10/1M (90% savings)</p>
                      </CardContent>
                    </Card>

                    {/* Stage 2: Design Intelligence */}
                    <Card className="border-purple-200 dark:border-purple-800">
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                          <Brain className="h-4 w-4 text-purple-500" />
                          <CardTitle className="text-sm">Stage 2: Design Intelligence</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="text-sm space-y-1">
                        <p className="text-muted-foreground">Claude Haiku 4.5</p>
                        <p>Input: <span className="font-medium">$1.00</span>/1M tokens</p>
                        <p>Output: <span className="font-medium">$5.00</span>/1M tokens</p>
                        <p className="text-xs text-muted-foreground">Cached: $0.10/1M (90% savings)</p>
                      </CardContent>
                    </Card>

                    {/* Stage 3: Image Generation */}
                    <Card className="border-green-200 dark:border-green-800">
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                          <ImageIcon className="h-4 w-4 text-green-500" />
                          <CardTitle className="text-sm">Stage 3: Image Generation</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="text-sm space-y-1">
                        <p className="text-muted-foreground">Gemini 2.5 Flash</p>
                        <p>Per Image: <span className="font-medium">$0.039</span></p>
                        <p className="text-xs text-muted-foreground">(~₹{(0.039 * USD_TO_INR).toFixed(2)} per image)</p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4 text-sm">
                    <p className="font-medium mb-2">Estimated Cost per Creative</p>
                    <p className="text-muted-foreground">
                      A typical creative generation costs approximately <span className="font-medium text-foreground">$0.05 - $0.08</span> (₹{(0.05 * USD_TO_INR).toFixed(2)} - ₹{(0.08 * USD_TO_INR).toFixed(2)} INR) depending on prompt complexity.
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="models">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Provider</TableHead>
                        <TableHead>Model</TableHead>
                        <TableHead className="text-right">Input/1M</TableHead>
                        <TableHead className="text-right">Output/1M</TableHead>
                        <TableHead className="text-right">Cached/1M</TableHead>
                        <TableHead className="text-right">Image Cost</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell><Badge className="bg-blue-500">Gemini</Badge></TableCell>
                        <TableCell>Gemini 2.5 Flash (Image)</TableCell>
                        <TableCell className="text-right">$0.30</TableCell>
                        <TableCell className="text-right">$2.50</TableCell>
                        <TableCell className="text-right text-muted-foreground">$0.03</TableCell>
                        <TableCell className="text-right font-medium">$0.039</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><Badge className="bg-blue-500">Gemini</Badge></TableCell>
                        <TableCell>Gemini 2.5 Pro</TableCell>
                        <TableCell className="text-right">$1.25</TableCell>
                        <TableCell className="text-right">$10.00</TableCell>
                        <TableCell className="text-right text-muted-foreground">$0.125</TableCell>
                        <TableCell className="text-right">-</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><Badge className="bg-purple-500">Claude</Badge></TableCell>
                        <TableCell>Claude Haiku 4.5</TableCell>
                        <TableCell className="text-right">$1.00</TableCell>
                        <TableCell className="text-right">$5.00</TableCell>
                        <TableCell className="text-right text-muted-foreground">$0.10</TableCell>
                        <TableCell className="text-right">-</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><Badge className="bg-purple-500">Claude</Badge></TableCell>
                        <TableCell>Claude Sonnet 4.5</TableCell>
                        <TableCell className="text-right">$3.00</TableCell>
                        <TableCell className="text-right">$15.00</TableCell>
                        <TableCell className="text-right text-muted-foreground">$0.30</TableCell>
                        <TableCell className="text-right">-</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><Badge className="bg-purple-500">Claude</Badge></TableCell>
                        <TableCell>Claude Opus 4.5</TableCell>
                        <TableCell className="text-right">$5.00</TableCell>
                        <TableCell className="text-right">$25.00</TableCell>
                        <TableCell className="text-right text-muted-foreground">$0.50</TableCell>
                        <TableCell className="text-right">-</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
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

          {/* API Cost Metrics */}
          {apiUsage && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-500" />
                <h2 className="text-xl font-semibold">API Cost Analytics</h2>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-green-200 dark:border-green-800">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total API Cost (USD)</CardTitle>
                    <DollarSign className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {formatUSD(apiUsage.totalCostUsd, 2)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {apiUsage.totalInputTokens.toLocaleString()} input / {apiUsage.totalOutputTokens.toLocaleString()} output tokens
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-orange-200 dark:border-orange-800">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total API Cost (INR)</CardTitle>
                    <span className="text-orange-500 font-medium">₹</span>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">
                      {formatINR(apiUsage.totalCostInr)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      ₹{USD_TO_INR}/USD (updated {EXCHANGE_RATE_UPDATED})
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
                    <Cpu className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {(apiUsage.totalInputTokens + apiUsage.totalOutputTokens).toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {apiUsage.totalCachedTokens > 0 && `${apiUsage.totalCachedTokens.toLocaleString()} cached`}
                      {apiUsage.totalImages > 0 && ` • ${apiUsage.totalImages} images`}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Cost per Creative</CardTitle>
                    <Zap className="h-4 w-4 text-yellow-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {analytics.totalCreatives > 0
                        ? formatUSD(apiUsage.totalCostUsd / analytics.totalCreatives, 4)
                        : '$0.00'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {analytics.totalCreatives > 0
                        ? `${formatINR(apiUsage.totalCostInr / analytics.totalCreatives)} INR avg`
                        : 'No creatives yet'}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Cost Breakdown */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* By Provider */}
                <Card>
                  <CardHeader>
                    <CardTitle>Cost by Provider</CardTitle>
                    <CardDescription>Spending breakdown by AI provider</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(apiUsage.byProvider)
                        .sort((a, b) => b[1].costUsd - a[1].costUsd)
                        .map(([provider, data]) => (
                          <div key={provider} className="space-y-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Badge variant={provider === 'gemini' ? 'default' : 'secondary'}>
                                  {provider}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {data.requestCount} requests
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="font-medium">{formatUSD(data.costUsd)}</span>
                                <span className="text-xs text-muted-foreground ml-2">
                                  ({formatINR(convertToINR(data.costUsd))})
                                </span>
                              </div>
                            </div>
                            <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  provider === 'gemini' ? 'bg-blue-500' : 'bg-purple-500'
                                }`}
                                style={{
                                  width: `${(data.costUsd / apiUsage.totalCostUsd) * 100}%`,
                                }}
                              />
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>

                {/* By Request Type - Enhanced with Token Details */}
                <Card>
                  <CardHeader>
                    <CardTitle>Cost by Generation Stage</CardTitle>
                    <CardDescription>Detailed breakdown by each stage in the pipeline</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(apiUsage.byRequestType)
                        .sort((a, b) => b[1].costUsd - a[1].costUsd)
                        .map(([type, data]) => {
                          const label = getStageLabel(type)
                          const icon = getStageIcon(type)
                          return (
                            <div key={type} className="space-y-2 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {icon}
                                  <span className="text-sm font-medium">{label}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {data.requestCount} calls
                                  </Badge>
                                </div>
                                <div className="text-right">
                                  <span className="font-bold text-green-600">{formatUSD(data.costUsd)}</span>
                                  <span className="text-xs text-muted-foreground ml-2">
                                    ({formatINR(convertToINR(data.costUsd))})
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <div className="flex gap-4">
                                  <span>Input: <span className="font-medium text-foreground">{data.inputTokens.toLocaleString()}</span> tokens</span>
                                  <span>Output: <span className="font-medium text-foreground">{data.outputTokens.toLocaleString()}</span> tokens</span>
                                </div>
                                <span className="text-xs">
                                  {((data.costUsd / apiUsage.totalCostUsd) * 100).toFixed(1)}% of total
                                </span>
                              </div>
                              <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all"
                                  style={{
                                    width: `${(data.costUsd / apiUsage.totalCostUsd) * 100}%`,
                                  }}
                                />
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Model Usage Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Cpu className="h-5 w-5 text-blue-500" />
                    Token Usage by Model
                  </CardTitle>
                  <CardDescription>Detailed token consumption and costs per AI model</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Model</TableHead>
                        <TableHead className="text-right">Calls</TableHead>
                        <TableHead className="text-right">Input Tokens</TableHead>
                        <TableHead className="text-right">Output Tokens</TableHead>
                        <TableHead className="text-right">Cost (USD)</TableHead>
                        <TableHead className="text-right">Cost (INR)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(apiUsage.byModel)
                        .sort((a, b) => b[1].costUsd - a[1].costUsd)
                        .map(([model, data]) => (
                          <TableRow key={model}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${model.includes('gemini') ? 'bg-blue-500' : 'bg-purple-500'}`} />
                                <span className="font-medium">{getModelDisplayName(model)}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">{data.requestCount}</TableCell>
                            <TableCell className="text-right font-mono text-sm">{data.inputTokens.toLocaleString()}</TableCell>
                            <TableCell className="text-right font-mono text-sm">{data.outputTokens.toLocaleString()}</TableCell>
                            <TableCell className="text-right font-medium text-green-600">{formatUSD(data.costUsd)}</TableCell>
                            <TableCell className="text-right text-orange-600">{formatINR(convertToINR(data.costUsd))}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Recent API Calls - Enhanced Table View */}
              {apiUsage.recentRecords.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-500" />
                      Recent API Calls
                    </CardTitle>
                    <CardDescription>Last 10 API requests with detailed cost breakdown</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Stage</TableHead>
                          <TableHead>Model</TableHead>
                          <TableHead className="text-right">Input</TableHead>
                          <TableHead className="text-right">Output</TableHead>
                          <TableHead className="text-right">Cost</TableHead>
                          <TableHead className="text-right">Time</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {apiUsage.recentRecords.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getStageIcon(record.requestType)}
                                <span className="font-medium">{getStageLabel(record.requestType)}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Badge variant={record.provider === 'gemini' ? 'default' : 'secondary'} className="text-xs">
                                  {record.provider}
                                </Badge>
                                <span className="text-xs text-muted-foreground">{getModelDisplayName(record.model)}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm">{record.inputTokens.toLocaleString()}</TableCell>
                            <TableCell className="text-right font-mono text-sm">{record.outputTokens.toLocaleString()}</TableCell>
                            <TableCell className="text-right">
                              <div>
                                <span className="font-medium text-green-600">{formatUSD(record.costUsd)}</span>
                                <p className="text-xs text-muted-foreground">{formatINR(convertToINR(record.costUsd))}</p>
                              </div>
                            </TableCell>
                            <TableCell className="text-right text-xs text-muted-foreground">
                              {format(new Date(record.createdAt), 'MMM d, h:mm a')}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

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
                    {analytics.topPerformingCreatives.map((creative) => (
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
