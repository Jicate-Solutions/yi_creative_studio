'use client'

import { useState, useEffect, useMemo, Fragment } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { createClient } from '@/lib/supabase/client'
import {
  AnalyticsFilters,
  AnalyticsFiltersState,
  getDefaultFilters,
} from '@/components/analytics/analytics-filters'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCostAsINR, convertToINR, USD_TO_INR } from '@/lib/services/currency'
import { CREATIVE_FORMATS, getFormatLabel } from '@/lib/config/creative-formats'
import { cn } from '@/lib/utils'
import {
  Coins,
  TrendingUp,
  TrendingDown,
  ImageIcon,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

interface CreativeWithCost {
  id: string
  title: string | null
  creative_type: string
  vertical: string | null
  thumbnail_url: string | null
  created_at: string
  totalCostUsd: number
  totalInputTokens: number
  totalOutputTokens: number
  stages: {
    request_type: string
    provider: string
    model: string
    input_tokens: number
    output_tokens: number
    estimated_cost_usd: number
  }[]
}

interface SummaryStats {
  totalCost: number
  avgCostPerCreative: number
  mostExpensiveCost: number
  cheapestCost: number
  totalCreatives: number
}

export default function TokenCostsPage() {
  const { currentOrganization } = useAuthStore()
  const [filters, setFilters] = useState<AnalyticsFiltersState>(getDefaultFilters())
  const [creativesWithCosts, setCreativesWithCosts] = useState<CreativeWithCost[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [sortField, setSortField] = useState<'created_at' | 'totalCostUsd'>('created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  // Fetch creatives with their API usage costs
  useEffect(() => {
    async function fetchData() {
      if (!currentOrganization?.id) return

      setLoading(true)
      const supabase = createClient()

      // Fetch creatives first
      let creativesQuery = supabase
        .from('creatives')
        .select('id, title, creative_type, vertical, thumbnail_url, created_at')
        .eq('organization_id', currentOrganization.id)

      // Apply date filters
      if (filters.dateRange?.from) {
        creativesQuery = creativesQuery.gte('created_at', filters.dateRange.from.toISOString())
      }
      if (filters.dateRange?.to) {
        creativesQuery = creativesQuery.lte('created_at', filters.dateRange.to.toISOString())
      }

      // Apply creative type filter
      if (filters.creativeType) {
        creativesQuery = creativesQuery.eq('creative_type', filters.creativeType)
      }

      // Apply vertical filter
      if (filters.vertical) {
        creativesQuery = creativesQuery.eq('vertical', filters.vertical)
      }

      creativesQuery = creativesQuery.order('created_at', { ascending: false })

      const { data: creatives, error: creativesError } = await creativesQuery

      if (creativesError) {
        console.error('Error fetching creatives:', creativesError)
        setLoading(false)
        return
      }

      if (!creatives || creatives.length === 0) {
        setCreativesWithCosts([])
        setLoading(false)
        return
      }

      // Get creative IDs for fetching api_usage
      const creativeIds = creatives.map(c => c.id)

      // Fetch api_usage for these creatives
      const { data: apiUsageData, error: apiUsageError } = await supabase
        .from('api_usage')
        .select('creative_id, request_type, provider, model, input_tokens, output_tokens, estimated_cost_usd')
        .in('creative_id', creativeIds)

      if (apiUsageError) {
        console.error('Error fetching API usage:', apiUsageError)
        // Continue without api_usage data - show creatives with 0 costs
      }

      // Group api_usage by creative_id
      const usageByCreative = new Map<string, typeof apiUsageData>()
      if (apiUsageData) {
        for (const usage of apiUsageData) {
          if (usage.creative_id) {
            const existing = usageByCreative.get(usage.creative_id) || []
            existing.push(usage)
            usageByCreative.set(usage.creative_id, existing)
          }
        }
      }

      // Transform data to include aggregated costs
      const transformed: CreativeWithCost[] = creatives.map((creative) => {
        const apiUsage = usageByCreative.get(creative.id) || []
        const totalCostUsd = apiUsage.reduce(
          (sum, u) => sum + (u.estimated_cost_usd || 0),
          0
        )
        const totalInputTokens = apiUsage.reduce(
          (sum, u) => sum + (u.input_tokens || 0),
          0
        )
        const totalOutputTokens = apiUsage.reduce(
          (sum, u) => sum + (u.output_tokens || 0),
          0
        )

        return {
          id: creative.id,
          title: creative.title,
          creative_type: creative.creative_type,
          vertical: creative.vertical,
          thumbnail_url: creative.thumbnail_url,
          created_at: creative.created_at,
          totalCostUsd,
          totalInputTokens,
          totalOutputTokens,
          stages: apiUsage.map((u) => ({
            request_type: u.request_type || 'unknown',
            provider: u.provider || 'unknown',
            model: u.model || 'unknown',
            input_tokens: u.input_tokens || 0,
            output_tokens: u.output_tokens || 0,
            estimated_cost_usd: u.estimated_cost_usd || 0,
          })),
        }
      })

      // Apply cost filters (client-side since we aggregate)
      let filtered = transformed
      if (filters.minCostInr) {
        const minUsd = filters.minCostInr / USD_TO_INR
        filtered = filtered.filter((c) => c.totalCostUsd >= minUsd)
      }
      if (filters.maxCostInr) {
        const maxUsd = filters.maxCostInr / USD_TO_INR
        filtered = filtered.filter((c) => c.totalCostUsd <= maxUsd)
      }

      setCreativesWithCosts(filtered)
      setLoading(false)
    }

    fetchData()
  }, [currentOrganization?.id, filters])

  // Calculate summary stats
  const summaryStats: SummaryStats = useMemo(() => {
    if (creativesWithCosts.length === 0) {
      return {
        totalCost: 0,
        avgCostPerCreative: 0,
        mostExpensiveCost: 0,
        cheapestCost: 0,
        totalCreatives: 0,
      }
    }

    const costs = creativesWithCosts.map((c) => c.totalCostUsd)
    const totalCost = costs.reduce((sum, c) => sum + c, 0)

    return {
      totalCost,
      avgCostPerCreative: totalCost / creativesWithCosts.length,
      mostExpensiveCost: Math.max(...costs),
      cheapestCost: Math.min(...costs),
      totalCreatives: creativesWithCosts.length,
    }
  }, [creativesWithCosts])

  // Sort data
  const sortedData = useMemo(() => {
    return [...creativesWithCosts].sort((a, b) => {
      const aVal = sortField === 'created_at' ? new Date(a.created_at).getTime() : a.totalCostUsd
      const bVal = sortField === 'created_at' ? new Date(b.created_at).getTime() : b.totalCostUsd
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal
    })
  }, [creativesWithCosts, sortField, sortDir])

  const toggleSort = (field: 'created_at' | 'totalCostUsd') => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('desc')
    }
  }

  const toggleRowExpand = (id: string) => {
    const newSet = new Set(expandedRows)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setExpandedRows(newSet)
  }

  // getFormatLabel imported from @/lib/config/creative-formats

  const getStageLabel = (requestType: string) => {
    const labels: Record<string, string> = {
      design_intelligence: 'Design Intelligence',
      ultra_pro_prompt: 'Prompt Enhancement',
      image_generation: 'Image Generation',
      field_suggestion: 'Field Suggestions',
    }
    return labels[requestType] || requestType
  }

  if (!currentOrganization?.id) {
    return (
      <div className="space-y-6">
        <p className="text-muted-foreground">Please select an organization.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <AnalyticsFilters
        filters={filters}
        onFiltersChange={setFilters}
        showCostFilter={true}
        organizationId={currentOrganization.id}
      />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">
                {formatCostAsINR(summaryStats.totalCost)}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {summaryStats.totalCreatives} creatives
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg per Creative</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">
                {formatCostAsINR(summaryStats.avgCostPerCreative)}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Average cost</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Expensive</CardTitle>
            <TrendingUp className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold text-red-600">
                {formatCostAsINR(summaryStats.mostExpensiveCost)}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Highest cost</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cheapest</CardTitle>
            <TrendingDown className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold text-green-600">
                {formatCostAsINR(summaryStats.cheapestCost)}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Lowest cost</p>
          </CardContent>
        </Card>
      </div>

      {/* Creatives Table */}
      <Card>
        <CardHeader>
          <CardTitle>Creatives by Cost</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : sortedData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ImageIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No creatives found</p>
              <p className="text-sm text-muted-foreground">
                Try adjusting your filters
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Creative</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Vertical</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 -ml-3"
                        onClick={() => toggleSort('totalCostUsd')}
                      >
                        Cost
                        {sortField === 'totalCostUsd' && (
                          sortDir === 'desc' ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 -ml-3"
                        onClick={() => toggleSort('created_at')}
                      >
                        Date
                        {sortField === 'created_at' && (
                          sortDir === 'desc' ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedData.map((creative) => (
                    <Fragment key={creative.id}>
                      <TableRow
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => toggleRowExpand(creative.id)}
                      >
                        <TableCell>
                          {creative.thumbnail_url ? (
                            <div className="relative h-10 w-10 rounded overflow-hidden">
                              <Image
                                src={creative.thumbnail_url}
                                alt={creative.title || 'Creative'}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                              <ImageIcon className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium truncate max-w-[200px]">
                              {creative.title}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {creative.totalInputTokens.toLocaleString()} in / {creative.totalOutputTokens.toLocaleString()} out
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {getFormatLabel(creative.creative_type)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {creative.vertical ? (
                            <Badge variant="secondary">{creative.vertical}</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className={cn(
                            'font-semibold',
                            creative.totalCostUsd === summaryStats.mostExpensiveCost && 'text-red-600',
                            creative.totalCostUsd === summaryStats.cheapestCost && 'text-green-600'
                          )}>
                            {formatCostAsINR(creative.totalCostUsd)}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(creative.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            {expandedRows.has(creative.id) ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                      {/* Expanded Row - Stage Breakdown */}
                      {expandedRows.has(creative.id) && (
                        <TableRow>
                          <TableCell colSpan={7} className="bg-muted/30 p-0">
                            <div className="p-4 space-y-2">
                              <p className="text-sm font-medium text-muted-foreground mb-2">
                                Cost Breakdown by Stage
                              </p>
                              <div className="grid gap-2">
                                {creative.stages.map((stage) => (
                                  <div
                                    key={`${creative.id}-${stage.request_type}-${stage.provider}-${stage.model}`}
                                    className="flex items-center justify-between p-2 bg-background rounded border"
                                  >
                                    <div className="flex items-center gap-3">
                                      <Badge variant="outline" className="text-xs">
                                        {getStageLabel(stage.request_type)}
                                      </Badge>
                                      <span className="text-xs text-muted-foreground">
                                        {stage.provider}/{stage.model}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                      <span className="text-xs text-muted-foreground">
                                        {stage.input_tokens.toLocaleString()} in / {stage.output_tokens.toLocaleString()} out
                                      </span>
                                      <span className="font-medium">
                                        {formatCostAsINR(stage.estimated_cost_usd)}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <div className="flex justify-end mt-2">
                                <Link href={`/gallery?id=${creative.id}`}>
                                  <Button variant="outline" size="sm" className="gap-2">
                                    <ExternalLink className="h-4 w-4" />
                                    View in Gallery
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
