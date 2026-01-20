/**
 * Super Admin Billing Page
 * Platform-wide revenue and billing analytics
 */

import PlatformRevenueStats from '@/components/super-admin/PlatformRevenueStats'
import RecentPurchasesTable from '@/components/super-admin/RecentPurchasesTable'
import TopPayingOrganizations from '@/components/super-admin/TopPayingOrganizations'

export default function BillingPlatformPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Platform Billing</h1>
        <p className="text-gray-600 mt-2">Revenue tracking and credit purchases across the platform</p>
      </div>

      {/* Platform Revenue Stats */}
      <PlatformRevenueStats />

      {/* Recent Purchases */}
      <RecentPurchasesTable />

      {/* Top Paying Organizations */}
      <TopPayingOrganizations />
    </div>
  )
}
