/**
 * Super Admin Subscriptions Page
 * Manage organization subscription tiers
 */

import SubscriptionManager from '@/components/super-admin/SubscriptionManager'

export default function SubscriptionsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Subscription Management</h1>
        <p className="text-gray-600 mt-2">
          Manage organization tiers and subscription status
        </p>
      </div>

      {/* Subscription Manager */}
      <SubscriptionManager />
    </div>
  )
}
