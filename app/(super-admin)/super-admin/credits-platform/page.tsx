/**
 * Super Admin Credits Platform Page
 * View all organizations' credit balances and allocate credits
 */

import PlatformCreditStats from '@/components/super-admin/PlatformCreditStats'
import AllOrganizationsCreditsTable from '@/components/super-admin/AllOrganizationsCreditsTable'

export default function CreditsPlatformPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Platform Credits</h1>
        <p className="text-gray-600 mt-2">View and manage credits across all organizations</p>
      </div>

      {/* Platform Credit Stats */}
      <PlatformCreditStats />

      {/* All Organizations Credits Table */}
      <AllOrganizationsCreditsTable />
    </div>
  )
}
