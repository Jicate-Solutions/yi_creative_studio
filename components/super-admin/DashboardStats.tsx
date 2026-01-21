'use client'

/**
 * Dashboard Stats Component
 * Display platform metrics with realtime updates via Supabase
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Building2, Users, CreditCard, TrendingUp, Zap, ImagePlus, Wifi, WifiOff, AlertTriangle } from 'lucide-react'
import { useSuperAdminRealtime } from '@/hooks/use-super-admin-realtime'

export default function DashboardStats() {
  const {
    isConnected,
    connectionStatus,
    stats,
    todayNewOrgs,
    todayNewUsers,
    todayTransactions,
    todayGenerations,
    refreshStats,
  } = useSuperAdminRealtime({ enabled: true })

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isConnected ? (
            <>
              <Wifi className="h-4 w-4 text-green-500" />
              <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                Live Updates
              </Badge>
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4 text-amber-500" />
              <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
                {connectionStatus === 'connecting' ? 'Connecting...' : 'Reconnecting...'}
              </Badge>
            </>
          )}
        </div>
        <button
          onClick={refreshStats}
          className="text-xs text-gray-500 hover:text-gray-700 underline"
        >
          Refresh
        </button>
      </div>

      {/* Low Credit Warning - Only show if there are orgs with low credits */}
      {stats.lowCreditOrgsCount > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">Low Credit Alert</CardTitle>
            <AlertTriangle className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.lowCreditOrgsCount}</div>
            <p className="text-xs text-orange-700 mt-1">
              Organization{stats.lowCreditOrgsCount !== 1 ? 's' : ''} with &lt;10 credits
            </p>
            <a
              href="/super-admin/credits"
              className="text-xs text-orange-600 hover:text-orange-800 underline mt-2 inline-block"
            >
              View &amp; allocate credits →
            </a>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Organizations</CardTitle>
            <Building2 className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.orgCount.toLocaleString()}</div>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs text-gray-500">Registered organizations</p>
              {todayNewOrgs > 0 && (
                <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                  +{todayNewOrgs} today
                </Badge>
              )}
            </div>
          </CardContent>
          {todayNewOrgs > 0 && (
            <div className="absolute top-0 right-0 w-2 h-2 m-2 rounded-full bg-green-500 animate-pulse" />
          )}
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.userCount.toLocaleString()}</div>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs text-gray-500">Platform users</p>
              {todayNewUsers > 0 && (
                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                  +{todayNewUsers} today
                </Badge>
              )}
            </div>
          </CardContent>
          {todayNewUsers > 0 && (
            <div className="absolute top-0 right-0 w-2 h-2 m-2 rounded-full bg-blue-500 animate-pulse" />
          )}
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Generations</CardTitle>
            <ImagePlus className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayGenerations.toLocaleString()}</div>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs text-gray-500">Creatives generated</p>
              {todayGenerations > 0 && (
                <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">
                  <Zap className="h-3 w-3 mr-1" />
                  Live
                </Badge>
              )}
            </div>
          </CardContent>
          {todayGenerations > 0 && (
            <div className="absolute top-0 right-0 w-2 h-2 m-2 rounded-full bg-purple-500 animate-pulse" />
          )}
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credits Allocated</CardTitle>
            <CreditCard className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCreditsAllocated.toLocaleString()}</div>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs text-gray-500">Total lifetime credits</p>
              {todayTransactions > 0 && (
                <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700">
                  {todayTransactions} txn today
                </Badge>
              )}
            </div>
          </CardContent>
          {todayTransactions > 0 && (
            <div className="absolute top-0 right-0 w-2 h-2 m-2 rounded-full bg-amber-500 animate-pulse" />
          )}
        </Card>
      </div>

      {/* Credits Usage Today */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Today&apos;s Activity Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-green-600">+{todayNewOrgs}</div>
              <div className="text-xs text-gray-500">New Orgs</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-blue-600">+{todayNewUsers}</div>
              <div className="text-xs text-gray-500">New Users</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-purple-600">{todayGenerations}</div>
              <div className="text-xs text-gray-500">Generations</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-amber-600">{stats.todayCreditsUsed}</div>
              <div className="text-xs text-gray-500">Credits Used</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
