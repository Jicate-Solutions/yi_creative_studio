/**
 * Super Admin Subscriptions Page
 * Manage subscription tiers and assignments
 */

import SubscriptionTiersTable from '@/components/super-admin/SubscriptionTiersTable'

export default function SubscriptionsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Subscription Management</h1>
        <p className="text-gray-600 mt-2">
          Manage subscription tiers, pricing, and organization subscriptions
        </p>
      </div>

      {/* Subscription Tiers Table */}
      <SubscriptionTiersTable />
    </div>
  )
}
