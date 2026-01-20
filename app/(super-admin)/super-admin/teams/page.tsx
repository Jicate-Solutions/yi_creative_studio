/**
 * Super Admin Teams Page
 * View all team members across all organizations
 */

import TeamStatistics from '@/components/super-admin/TeamStatistics'
import AllTeamMembersTable from '@/components/super-admin/AllTeamMembersTable'

export default function TeamsPlatformPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Platform Teams</h1>
        <p className="text-gray-600 mt-2">Manage team members across all organizations</p>
      </div>

      {/* Team Statistics */}
      <TeamStatistics />

      {/* All Team Members Table */}
      <AllTeamMembersTable />
    </div>
  )
}
