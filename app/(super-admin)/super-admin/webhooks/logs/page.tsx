/**
 * Super Admin Webhook Logs Page
 * View webhook call history
 */

import WebhookLogsTable from '@/components/super-admin/webhooks/WebhookLogsTable'

export default function WebhookLogsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Webhook Logs</h1>
        <p className="text-gray-600 mt-2">
          Monitor webhook calls, errors, and response times
        </p>
      </div>

      {/* Webhook Logs Table */}
      <WebhookLogsTable />
    </div>
  )
}
