'use client'

/**
 * Organization Analytics Component
 * Displays analytics for a specific organization or all organizations
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Building2,
  CreditCard,
  Image as ImageIcon,
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  RefreshCw
} from 'lucide-react'

interface OrgSummary {
  organization_id: string
  organization_name: string
  slug: string
  credits_balance: number
  credits_used: number
  creatives_count: number
  api_cost_usd: number
  active_users: number
  total_members: number
  created_at: string
}

interface Summary {
  total_organizations: number
  total_credits_balance: number
  total_credits_used: number
  total_creatives: number
  total_api_cost_usd: number
  date_range_days: number
}

interface OrganizationAnalyticsProps {
  organizationId?: string // If provided, show single org analytics
  showTable?: boolean // Whether to show the comparison table
}

export default function OrganizationAnalytics({
  organizationId,
  showTable = true
}: OrganizationAnalyticsProps) {
  const [organizations, setOrganizations] = useState<OrgSummary[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState('30')
  const [sortBy, setSortBy] = useState('credits_used')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    fetchAnalytics()
  }, [days, sortBy, sortOrder, organizationId])

  async function fetchAnalytics() {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        days,
        sortBy,
        sortOrder,
        limit: '100',
      })

      const response = await fetch(`/api/super-admin/analytics/organization-summary?${params}`)
      const data = await response.json()

      if (data.success) {
        if (organizationId) {
          // Filter to single organization
          const filtered = data.organizations.filter(
            (o: OrgSummary) => o.organization_id === organizationId
          )
          setOrganizations(filtered)
        } else {
          setOrganizations(data.organizations)
        }
        setSummary(data.summary)
      }
    } catch (error) {
      console.error('Failed to fetch organization analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  function toggleSort(field: string) {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  function formatCurrency(value: number) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(value)
  }

  function getUsageLevel(creditsUsed: number, balance: number) {
    if (creditsUsed === 0) return { level: 'inactive', color: 'bg-gray-100 text-gray-800' }
    const ratio = balance > 0 ? creditsUsed / (creditsUsed + balance) : 1
    if (ratio > 0.8) return { level: 'high', color: 'bg-red-100 text-red-800' }
    if (ratio > 0.5) return { level: 'medium', color: 'bg-yellow-100 text-yellow-800' }
    return { level: 'low', color: 'bg-green-100 text-green-800' }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // Get single org data when organizationId is provided
  const singleOrg = organizationId && organizations.length > 0 ? organizations[0] : null

  return (
    <div className="space-y-6">
      {/* Single Organization Stats - when organizationId is provided */}
      {singleOrg && !showTable && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Credits Used ({days}d)</p>
                  <p className="text-2xl font-bold">{singleOrg.credits_used.toLocaleString()}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Creatives ({days}d)</p>
                  <p className="text-2xl font-bold">{singleOrg.creatives_count.toLocaleString()}</p>
                </div>
                <ImageIcon className="h-8 w-8 text-purple-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">API Cost ({days}d)</p>
                  <p className="text-2xl font-bold">{formatCurrency(singleOrg.api_cost_usd)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-red-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Active Users ({days}d)</p>
                  <p className="text-2xl font-bold">{singleOrg.active_users}/{singleOrg.total_members}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Time Range Selector for single org view */}
      {organizationId && !showTable && (
        <div className="flex items-center gap-4">
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={fetchAnalytics} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      )}

      {/* Summary Cards - Platform-wide view */}
      {summary && !organizationId && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Organizations</p>
                  <p className="text-2xl font-bold">{summary.total_organizations}</p>
                </div>
                <Building2 className="h-8 w-8 text-blue-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Balance</p>
                  <p className="text-2xl font-bold">{summary.total_credits_balance.toLocaleString()}</p>
                </div>
                <CreditCard className="h-8 w-8 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Credits Used ({days}d)</p>
                  <p className="text-2xl font-bold">{summary.total_credits_used.toLocaleString()}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Creatives ({days}d)</p>
                  <p className="text-2xl font-bold">{summary.total_creatives.toLocaleString()}</p>
                </div>
                <ImageIcon className="h-8 w-8 text-purple-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">API Cost ({days}d)</p>
                  <p className="text-2xl font-bold">{formatCurrency(summary.total_api_cost_usd)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-red-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      {showTable && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Select value={days} onValueChange={setDays}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="credits_used">Credits Used</SelectItem>
                <SelectItem value="creatives_count">Creatives</SelectItem>
                <SelectItem value="api_cost_usd">API Cost</SelectItem>
                <SelectItem value="credits_balance">Balance</SelectItem>
                <SelectItem value="active_users">Active Users</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button variant="outline" onClick={fetchAnalytics} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      )}

      {/* Organization Table */}
      {showTable && (
        <Card>
          <CardHeader>
            <CardTitle>Organization Analytics</CardTitle>
            <CardDescription>
              Performance metrics for all organizations in the last {days} days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Organization</TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-gray-100"
                      onClick={() => toggleSort('credits_balance')}
                    >
                      <div className="flex items-center gap-1">
                        Balance
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-gray-100"
                      onClick={() => toggleSort('credits_used')}
                    >
                      <div className="flex items-center gap-1">
                        Used ({days}d)
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-gray-100"
                      onClick={() => toggleSort('creatives_count')}
                    >
                      <div className="flex items-center gap-1">
                        Creatives
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-gray-100"
                      onClick={() => toggleSort('api_cost_usd')}
                    >
                      <div className="flex items-center gap-1">
                        API Cost
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-gray-100"
                      onClick={() => toggleSort('active_users')}
                    >
                      <div className="flex items-center gap-1">
                        Active
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead>Usage Level</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {organizations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        No organizations found
                      </TableCell>
                    </TableRow>
                  ) : (
                    organizations.map((org) => {
                      const usage = getUsageLevel(org.credits_used, org.credits_balance)
                      return (
                        <TableRow key={org.organization_id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{org.organization_name}</div>
                              <div className="text-xs text-gray-500">
                                {org.total_members} member{org.total_members !== 1 ? 's' : ''}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={org.credits_balance <= 10 ? 'text-red-600 font-semibold' : ''}>
                              {org.credits_balance.toLocaleString()}
                            </span>
                          </TableCell>
                          <TableCell className="font-medium">
                            {org.credits_used.toLocaleString()}
                          </TableCell>
                          <TableCell>{org.creatives_count.toLocaleString()}</TableCell>
                          <TableCell>{formatCurrency(org.api_cost_usd)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4 text-gray-400" />
                              {org.active_users}/{org.total_members}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={usage.color}>
                              {usage.level}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
