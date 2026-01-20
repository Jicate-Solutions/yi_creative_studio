'use client'

/**
 * Team Statistics Component
 * Display platform-wide team member statistics
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Shield, Edit, Eye, UserCog } from 'lucide-react'
import { useAutoRefresh } from '@/hooks/use-auto-refresh'
import { RefreshIndicator } from '@/components/super-admin/RefreshIndicator'

interface TeamStats {
  total_users: number
  users_in_multiple_orgs: number
  role_breakdown: {
    admin: number
    editor: number
    viewer: number
  }
}

export default function TeamStatistics() {
  const [stats, setStats] = useState<TeamStats>({
    total_users: 0,
    users_in_multiple_orgs: 0,
    role_breakdown: {
      admin: 0,
      editor: 0,
      viewer: 0,
    },
  })
  const [loading, setLoading] = useState(true)

  // Auto-refresh every 60 seconds
  const { isRefreshing, lastRefresh, manualRefresh } = useAutoRefresh({
    onRefresh: fetchStats,
    interval: 60000,
  })

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {
    setLoading(true)

    try {
      const response = await fetch('/api/super-admin/teams/all-members?pageSize=1000')
      const data = await response.json()

      if (data.success) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to fetch team stats:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Refresh indicator */}
      <div className="flex justify-end">
        <RefreshIndicator
          lastRefresh={lastRefresh}
          isRefreshing={isRefreshing}
          onManualRefresh={manualRefresh}
        />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : stats.total_users.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">Platform members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Multi-Org Users</CardTitle>
            <UserCog className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : stats.users_in_multiple_orgs.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">In 2+ organizations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Shield className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : stats.role_breakdown.admin.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">Full access</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Editors</CardTitle>
            <Edit className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : stats.role_breakdown.editor.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">Can create content</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Viewers</CardTitle>
            <Eye className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : stats.role_breakdown.viewer.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">Read-only access</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
