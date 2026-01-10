/**
 * Super Admin Users Page
 * Search and manage all platform users
 */

import UserSearchTable from '@/components/super-admin/UserSearchTable'

export default function UsersPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600 mt-2">Search, suspend, and manage all platform users</p>
      </div>

      {/* User Search Table */}
      <UserSearchTable />
    </div>
  )
}
