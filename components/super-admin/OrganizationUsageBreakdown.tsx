'use client'

/**
 * Organization Usage Breakdown Component
 * Display per-organization API usage statistics
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
import { Badge } from '@/components/ui/badge'
import { useAutoRefresh } from '@/hooks/use-auto-refresh'
import { RefreshIndicator } from '@/components/super-admin/RefreshIndicator'

interface OrganizationUsage {
  organization_id: string
  organization_name: string
  request_count: number
  total_tokens: number
  total_cost_usd: number
}

interface BreakdownData {
  platformTotals: {
    total_organizations: number
    total_requests: number
    total_tokens: number
    total_cost_usd: number
  }
  organizations: OrganizationUsage[]
}

export default function OrganizationUsageBreakdown() {
  const [data, setData] = useState<BreakdownData>({
    platformTotals: {
      total_organizations: 0,
      total_requests: 0,
      total_tokens: 0,
      total_cost_usd: 0,
    },
    organizations: [],
  })
  const [dateRange, setDateRange] = useState('month')
  const [sortBy, setSortBy] = useState('cost')
  const [loading, setLoading] = useState(true)

  // Auto-refresh every 60 seconds
  const { isRefreshing, lastRefresh, manualRefresh } = useAutoRefresh({
    onRefresh: fetchBreakdown,
    interval: 60000,
  })

  useEffect(() => {
    fetchBreakdown()
  }, [dateRange, sortBy])

  async function fetchBreakdown() {
    setLoading(true)

    const params = new URLSearchParams({ dateRange, sortBy, limit: '50' })

    try {
      const response = await fetch(`/api/super-admin/analytics/organization-breakdown?${params}`)
      const apiData = await response.json()

      if (apiData.success) {
        setData({
          platformTotals: apiData.platformTotals,
          organizations: apiData.organizations,
        })
      }
    } catch (error) {
      console.error('Failed to fetch organization breakdown:', error)
    } finally {
      setLoading(false)
    }
  }

  function getRankBadge(index: number) {
    if (index === 0) {
      return <Badge className="bg-yellow-100 text-yellow-800">🥇 #1</Badge>
    } else if (index === 1) {
      return <Badge className="bg-gray-100 text-gray-800">🥈 #2</Badge>
    } else if (index === 2) {
      return <Badge className="bg-orange-100 text-orange-800">🥉 #3</Badge>
    } else {
      return <span className="text-gray-500">#{index + 1}</span>
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Organization Usage Breakdown</CardTitle>
          <RefreshIndicator
            lastRefresh={lastRefresh}
            isRefreshing={isRefreshing}
            onManualRefresh={manualRefresh}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex items-center gap-4">
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

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cost">Sort by Cost</SelectItem>
              <SelectItem value="tokens">Sort by Tokens</SelectItem>
              <SelectItem value="requests">Sort by Requests</SelectItem>
            </SelectContent>
          </Select>

          <div className="text-sm text-gray-500 ml-auto">
            Total: {data.platformTotals.total_requests.toLocaleString()} requests | $
            {data.platformTotals.total_cost_usd.toFixed(2)}
          </div>
        </div>

        {/* Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Requests</TableHead>
                <TableHead>Tokens</TableHead>
                <TableHead>Cost (USD)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    Loading breakdown...
                  </TableCell>
                </TableRow>
              ) : data.organizations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    No usage data for selected period
                  </TableCell>
                </TableRow>
              ) : (
                data.organizations.map((org, idx) => (
                  <TableRow key={org.organization_id}>
                    <TableCell>{getRankBadge(idx)}</TableCell>
                    <TableCell className="font-medium">{org.organization_name}</TableCell>
                    <TableCell>{org.request_count.toLocaleString()}</TableCell>
                    <TableCell>{org.total_tokens.toLocaleString()}</TableCell>
                    <TableCell className="font-medium">${org.total_cost_usd.toFixed(2)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
