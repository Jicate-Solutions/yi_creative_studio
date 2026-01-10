/**
 * Super Admin Dashboard
 * Overview of platform metrics and recent activity
 */

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowRight } from 'lucide-react'
import DashboardStats from '@/components/super-admin/DashboardStats'

export default function SuperAdminDashboard() {

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Platform Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome to the Yi CreativeStudio Super Admin portal</p>
      </div>

      {/* Stats Grid with Auto-refresh */}
      <DashboardStats />

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common Super Admin tasks</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/super-admin/organizations">
            <Button variant="outline" className="w-full justify-between">
              <span>Manage Organizations</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/super-admin/credits">
            <Button variant="outline" className="w-full justify-between">
              <span>Allocate Credits</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/super-admin/audit">
            <Button variant="outline" className="w-full justify-between">
              <span>View Audit Logs</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Recent Activity (Placeholder for Phase 2+) */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest platform events</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">Activity monitoring will be implemented in Phase 2+</p>
        </CardContent>
      </Card>
    </div>
  )
}
