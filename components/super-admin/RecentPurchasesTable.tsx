'use client'

/**
 * Recent Purchases Table Component
 * Display recent credit purchases across the platform
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAutoRefresh } from '@/hooks/use-auto-refresh'
import { RefreshIndicator } from '@/components/super-admin/RefreshIndicator'

interface Purchase {
  id: string
  organization_name: string
  amount_inr: number
  amount_usd: number
  credits: number
  payment_provider: string
  created_at: string
}

export default function RecentPurchasesTable() {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)

  // Auto-refresh every 30 seconds
  const { isRefreshing, lastRefresh, manualRefresh } = useAutoRefresh({
    onRefresh: fetchPurchases,
    interval: 30000,
  })

  useEffect(() => {
    fetchPurchases()
  }, [])

  async function fetchPurchases() {
    setLoading(true)

    const params = new URLSearchParams({ dateRange: 'month', limit: '20' })

    try {
      const response = await fetch(`/api/super-admin/billing/platform-revenue?${params}`)
      const data = await response.json()

      if (data.success) {
        setPurchases(data.recentPurchases || [])
      }
    } catch (error) {
      console.error('Failed to fetch recent purchases:', error)
    } finally {
      setLoading(false)
    }
  }

  function getProviderBadge(provider: string) {
    const colors = {
      razorpay: 'bg-blue-100 text-blue-800',
      stripe: 'bg-purple-100 text-purple-800',
      manual: 'bg-gray-100 text-gray-800',
      bonus: 'bg-green-100 text-green-800',
    }
    return (
      <Badge className={colors[provider as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {provider || 'manual'}
      </Badge>
    )
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Recent Purchases</CardTitle>
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
                <TableHead>Date</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Credits</TableHead>
                <TableHead>Amount (INR)</TableHead>
                <TableHead>Amount (USD)</TableHead>
                <TableHead>Provider</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    Loading purchases...
                  </TableCell>
                </TableRow>
              ) : purchases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No recent purchases
                  </TableCell>
                </TableRow>
              ) : (
                purchases.map((purchase) => (
                  <TableRow key={purchase.id}>
                    <TableCell className="text-sm">{formatDate(purchase.created_at)}</TableCell>
                    <TableCell className="font-medium">{purchase.organization_name}</TableCell>
                    <TableCell>
                      <span className="font-medium">{purchase.credits.toLocaleString()}</span>
                    </TableCell>
                    <TableCell>₹{purchase.amount_inr?.toLocaleString() || 0}</TableCell>
                    <TableCell>${purchase.amount_usd?.toLocaleString() || 0}</TableCell>
                    <TableCell>{getProviderBadge(purchase.payment_provider)}</TableCell>
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
