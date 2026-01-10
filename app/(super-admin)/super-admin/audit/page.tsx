/**
 * Super Admin Audit Logs Page
 * View and export audit trail of all Super Admin actions
 */

import AuditLogViewer from '@/components/super-admin/AuditLogViewer'

export default function AuditLogsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
        <p className="text-gray-600 mt-2">
          Complete audit trail of all Super Admin actions and system events
        </p>
      </div>

      {/* Audit Log Viewer */}
      <AuditLogViewer />
    </div>
  )
}
