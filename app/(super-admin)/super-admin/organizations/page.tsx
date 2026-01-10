/**
 * Super Admin Organizations Page
 * List and manage all organizations on the platform
 */

import OrganizationsTable from '@/components/super-admin/OrganizationsTable'

export default function OrganizationsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Organizations</h1>
        <p className="text-gray-600 mt-2">Manage all customer organizations on the platform</p>
      </div>

      {/* Organizations Table */}
      <OrganizationsTable />
    </div>
  )
}
