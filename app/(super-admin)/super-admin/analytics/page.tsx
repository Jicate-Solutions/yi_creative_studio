/**
 * Super Admin Analytics Page
 * Platform-wide API usage and cost analytics
 */

import PlatformAnalyticsDashboard from '@/components/super-admin/PlatformAnalyticsDashboard'
import OrganizationUsageBreakdown from '@/components/super-admin/OrganizationUsageBreakdown'
import OrganizationAnalytics from '@/components/super-admin/OrganizationAnalytics'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function AnalyticsPlatformPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Platform Analytics</h1>
        <p className="text-gray-600 mt-2">API usage and cost analytics across all organizations</p>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="comparison">Organization Comparison</TabsTrigger>
          <TabsTrigger value="breakdown">API Breakdown</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-8">
          {/* Platform Analytics Dashboard */}
          <PlatformAnalyticsDashboard />
        </TabsContent>

        {/* Organization Comparison Tab */}
        <TabsContent value="comparison" className="space-y-6">
          <OrganizationAnalytics showTable={true} />
        </TabsContent>

        {/* API Breakdown Tab */}
        <TabsContent value="breakdown" className="space-y-6">
          <OrganizationUsageBreakdown />
        </TabsContent>
      </Tabs>
    </div>
  )
}
