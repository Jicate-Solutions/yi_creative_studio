/**
 * Super Admin Webhook Tester Page
 * Test webhook integration with sample payloads
 */

import WebhookTester from '@/components/super-admin/webhooks/WebhookTester'

export default function WebhookTestPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Webhook Tester</h1>
        <p className="text-gray-600 mt-2">
          Send test webhooks to verify your integration works correctly
        </p>
      </div>

      {/* Webhook Tester */}
      <WebhookTester />
    </div>
  )
}
