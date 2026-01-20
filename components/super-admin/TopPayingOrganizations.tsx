'use client'

/**
 * Top Paying Organizations Component
 * Display organizations ranked by revenue contribution
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAutoRefresh } from '@/hooks/use-auto-refresh'
import { RefreshIndicator } from '@/components/super-admin/RefreshIndicator'

interface TopPayer {
  organization_id: string
  organization_name: string
  total_revenue_inr: number
  total_revenue_usd: number
  total_credits_purchased: number
  transaction_count: number
}

export default function TopPayingOrganizations() {
  const [topPayers, setTopPayers] = useState<TopPayer[]>([])
  const [loading, setLoading] = useState(true)

  // Auto-refresh every 30 seconds
  const { isRefreshing, lastRefresh, manualRefresh } = useAutoRefresh({
    onRefresh: fetchTopPayers,
    interval: 30000,
  })

  useEffect(() => {
    fetchTopPayers()
  }, [])

  async function fetchTopPayers() {
    setLoading(true)

    const params = new URLSearchParams({ dateRange: 'all', limit: '20' })

    try {
      const response = await fetch(`/api/super-admin/billing/platform-revenue?${params}`)
      const data = await response.json()

      if (data.success) {
        setTopPayers(data.topPayingOrganizations || [])
      }
    } catch (error) {
      console.error('Failed to fetch top payers:', error)
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
          <CardTitle>Top Paying Organizations (All Time)</CardTitle>
          <RefreshIndicator
            lastRefresh={lastRefresh}
            isRefreshing={isRefreshing}
            onManualRefresh={manualRefresh}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Transactions</TableHead>
                <TableHead>Credits Purchased</TableHead>
                <TableHead>Revenue (INR)</TableHead>
                <TableHead>Revenue (USD)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    Loading top payers...
                  </TableCell>
                </TableRow>
              ) : topPayers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No purchase data available
                  </TableCell>
                </TableRow>
              ) : (
                topPayers.map((org, idx) => (
                  <TableRow key={org.organization_id}>
                    <TableCell>{getRankBadge(idx)}</TableCell>
                    <TableCell className="font-medium">{org.organization_name || 'Unknown'}</TableCell>
                    <TableCell>{(org.transaction_count ?? 0).toLocaleString()}</TableCell>
                    <TableCell>
                      <span className="font-medium">
                        {(org.total_credits_purchased ?? 0).toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">
                      ₹{(org.total_revenue_inr ?? 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="font-medium">
                      ${(org.total_revenue_usd ?? 0).toLocaleString()}
                    </TableCell>
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
