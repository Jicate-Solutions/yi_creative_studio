/**
 * Super Admin Analytics Page
 * Platform-wide API usage and cost analytics
 */

import PlatformAnalyticsDashboard from '@/components/super-admin/PlatformAnalyticsDashboard'
import OrganizationUsageBreakdown from '@/components/super-admin/OrganizationUsageBreakdown'

export default function AnalyticsPlatformPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Platform Analytics</h1>
        <p className="text-gray-600 mt-2">API usage and cost analytics across all organizations</p>
      </div>

      {/* Platform Analytics Dashboard */}
      <PlatformAnalyticsDashboard />

      {/* Organization Usage Breakdown */}
      <OrganizationUsageBreakdown />
    </div>
  )
}
