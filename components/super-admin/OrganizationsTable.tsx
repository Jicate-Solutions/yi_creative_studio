'use client'

/**
 * Organizations Table Component
 * Display all organizations with search, filters, pagination, and realtime updates
 */

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { Search, Wifi, WifiOff, RefreshCw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'
import toast from 'react-hot-toast'
import { ExportButton, type ExportColumn } from '@/components/super-admin/ExportButton'

// Export columns definition
const ORG_EXPORT_COLUMNS: ExportColumn[] = [
  { key: 'id', label: 'Organization ID' },
  { key: 'name', label: 'Name', selected: true },
  { key: 'slug', label: 'Slug' },
  { key: 'credits_balance', label: 'Credits Balance', selected: true },
  { key: 'member_count', label: 'Member Count', selected: true },
  { key: 'is_active', label: 'Active Status', selected: true },
  { key: 'created_at', label: 'Created At', selected: true },
  { key: 'updated_at', label: 'Updated At' },
]

interface Organization {
  id: string
  name: string
  subscription_tier: string
  subscription_tier_display: string
  subscription_status: string
  credit_balance: number
  member_count: number
  last_activity: string
  health_score: 'healthy' | 'warning' | 'critical'
  created_at: string
}

export default function OrganizationsTable() {
  const supabase = useMemo(() => createClient(), [])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isConnected, setIsConnected] = useState(false)
  const channelRef = useRef<RealtimeChannel | null>(null)

  const fetchOrganizations = useCallback(async () => {
    setLoading(true)

    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: '25',
      search,
      ...(statusFilter !== 'all' && { status: statusFilter }),
    })

    try {
      const response = await fetch(`/api/super-admin/organizations/list?${params}`)
      const data = await response.json()

      if (data.success) {
        setOrganizations(data.organizations)
        setTotalPages(data.pagination.totalPages)
      }
    } catch (error) {
      console.error('Failed to fetch organizations:', error)
      toast.error('Failed to load organizations. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter])

  // Set up realtime subscription
  useEffect(() => {
    const channelName = `org-table-${Date.now()}`

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'organizations' },
        () => {
          // Refresh the list when any organization changes
          fetchOrganizations()
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'organization_credits' },
        () => {
          // Refresh when credits change
          fetchOrganizations()
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'organization_members' },
        () => {
          // Refresh when members change (affects member count)
          fetchOrganizations()
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true)
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setIsConnected(false)
        }
      })

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
      setIsConnected(false)
    }
  }, [supabase, fetchOrganizations])

  // Fetch data when filters change
  useEffect(() => {
    fetchOrganizations()
  }, [fetchOrganizations])

  function getHealthBadge(score: string) {
    const colors = {
      healthy: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
      critical: 'bg-red-100 text-red-800',
    }
    return (
      <Badge className={colors[score as keyof typeof colors]}>
        {score}
      </Badge>
    )
  }

  function getStatusBadge(status: string) {
    const colors = {
      active: 'bg-blue-100 text-blue-800',
      trial: 'bg-purple-100 text-purple-800',
      cancelled: 'bg-gray-100 text-gray-800',
      expired: 'bg-red-100 text-red-800',
    }
    return (
      <Badge className={colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {status}
      </Badge>
    )
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className="space-y-4">
      {/* Search & Filters - Responsive */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 flex-1">
          <div className="relative flex-1 min-w-0 sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search organizations..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1) // Reset to first page on search
              }}
              className="pl-10"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="trial">Trial</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Export, Connection Status & Refresh */}
        <div className="flex items-center gap-2">
          <ExportButton
            endpoint="/api/super-admin/organizations/export"
            filename="organizations_export"
            columns={ORG_EXPORT_COLUMNS}
            queryParams={{
              search,
              status: statusFilter !== 'all' ? statusFilter : '',
            }}
          />
          {isConnected ? (
            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
              <Wifi className="h-3 w-3 mr-1" />
              Live
            </Badge>
          ) : (
            <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
              <WifiOff className="h-3 w-3 mr-1" />
              Offline
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchOrganizations}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Table - Horizontal scroll on mobile */}
      <div className="border rounded-lg bg-white overflow-x-auto">
        <Table className="min-w-[800px]">
          <TableHeader>
            <TableRow>
              <TableHead>Organization</TableHead>
              <TableHead>Subscription</TableHead>
              <TableHead>Credits</TableHead>
              <TableHead>Members</TableHead>
              <TableHead>Last Activity</TableHead>
              <TableHead>Health</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  Loading organizations...
                </TableCell>
              </TableRow>
            ) : organizations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  No organizations found
                </TableCell>
              </TableRow>
            ) : (
              organizations.map((org) => (
                <TableRow key={org.id} className="hover:bg-gray-50 transition-colors">
                  <TableCell className="font-medium">
                    <div>
                      <div className="font-semibold">{org.name}</div>
                      <div className="text-xs text-gray-500">{org.id.slice(0, 8)}...</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium capitalize">{org.subscription_tier_display}</div>
                      {getStatusBadge(org.subscription_status)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">{org.credit_balance.toLocaleString()}</div>
                      <div className="text-gray-500">credits</div>
                    </div>
                  </TableCell>
                  <TableCell>{org.member_count}</TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {formatDate(org.last_activity)}
                  </TableCell>
                  <TableCell>{getHealthBadge(org.health_score)}</TableCell>
                  <TableCell>
                    <Link href={`/super-admin/organizations/${org.id}`}>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
