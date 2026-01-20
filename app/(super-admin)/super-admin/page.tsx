/**
 * Super Admin Dashboard
 * Overview of platform metrics and real-time activity
 */

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowRight, Building2, CreditCard, FileSearch, Users, BarChart3, Shield } from 'lucide-react'
import DashboardStats from '@/components/super-admin/DashboardStats'
import RealtimeActivityFeed from '@/components/super-admin/RealtimeActivityFeed'

export default function SuperAdminDashboard() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Platform Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Real-time overview of Yi CreativeStudio platform
        </p>
      </div>

      {/* Stats Grid with Real-time Updates */}
      <DashboardStats />

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common Super Admin tasks</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link href="/super-admin/organizations">
            <Button variant="outline" className="w-full justify-between h-auto py-3">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-blue-500" />
                <div className="text-left">
                  <div className="font-medium">Manage Organizations</div>
                  <div className="text-xs text-gray-500">View and manage all organizations</div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/super-admin/credits">
            <Button variant="outline" className="w-full justify-between h-auto py-3">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-amber-500" />
                <div className="text-left">
                  <div className="font-medium">Allocate Credits</div>
                  <div className="text-xs text-gray-500">Add credits to organizations</div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/super-admin/users">
            <Button variant="outline" className="w-full justify-between h-auto py-3">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-green-500" />
                <div className="text-left">
                  <div className="font-medium">User Management</div>
                  <div className="text-xs text-gray-500">Search and manage platform users</div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/super-admin/audit">
            <Button variant="outline" className="w-full justify-between h-auto py-3">
              <div className="flex items-center gap-3">
                <FileSearch className="h-5 w-5 text-purple-500" />
                <div className="text-left">
                  <div className="font-medium">View Audit Logs</div>
                  <div className="text-xs text-gray-500">Review admin actions and events</div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/super-admin/analytics">
            <Button variant="outline" className="w-full justify-between h-auto py-3">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-5 w-5 text-pink-500" />
                <div className="text-left">
                  <div className="font-medium">Platform Analytics</div>
                  <div className="text-xs text-gray-500">API usage and performance metrics</div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/super-admin/subscriptions">
            <Button variant="outline" className="w-full justify-between h-auto py-3">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-indigo-500" />
                <div className="text-left">
                  <div className="font-medium">Subscriptions</div>
                  <div className="text-xs text-gray-500">Manage subscription tiers</div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Real-time Activity Feed */}
      <RealtimeActivityFeed maxHeight="500px" />
    </div>
  )
}
