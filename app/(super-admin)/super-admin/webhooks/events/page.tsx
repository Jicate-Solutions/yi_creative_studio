/**
 * Super Admin Synced Events Page
 * View all events synced from external sources
 */

import SyncedEventsTable from '@/components/super-admin/webhooks/SyncedEventsTable'

export default function SyncedEventsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Synced Events</h1>
        <p className="text-gray-600 mt-2">
          Browse all events synced from external applications
        </p>
      </div>

      {/* Synced Events Table */}
      <SyncedEventsTable />
    </div>
  )
}
