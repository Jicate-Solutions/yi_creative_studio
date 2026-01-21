/**
 * Super Admin API: List Users
 * GET /api/super-admin/users/list
 *
 * Returns paginated list of all users with organization memberships
 * Uses admin client with service role to access auth.users
 */

import { NextRequest, NextResponse } from 'next/server'
import { superAdminGuard } from '@/lib/middleware/super-admin-guard'

export async function GET(request: NextRequest) {
  return superAdminGuard(request, async (req, { adminClient }) => {
    const supabase = adminClient
    const { searchParams } = new URL(req.url)

    // Query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '25')
    const search = searchParams.get('search') || ''

    try {
      // Fetch all users from auth.users using admin API
      const { data: authData, error: authError } = await supabase.auth.admin.listUsers({
        page,
        perPage: pageSize,
      })

      if (authError) {
        console.error('[super-admin] Failed to fetch auth users:', authError)
        return NextResponse.json(
          { error: 'Failed to fetch users', details: authError.message },
          { status: 500 }
        )
      }

      const authUsers = authData?.users || []
      const totalUsers = authData?.total || authUsers.length

      // Get organization memberships for all users
      const userIds = authUsers.map(u => u.id)
      const { data: memberships } = await supabase
        .from('organization_members')
        .select(`
          user_id,
          role,
          joined_at,
          organizations (
            id,
            name
          )
        `)
        .in('user_id', userIds)

      // Build membership map
      const membershipMap = new Map<string, Array<{ organization_id: string; organization_name: string; role: string }>>()
      memberships?.forEach((m) => {
        const org = m.organizations as { id: string; name: string } | null
        if (!membershipMap.has(m.user_id)) {
          membershipMap.set(m.user_id, [])
        }
        if (org) {
          membershipMap.get(m.user_id)!.push({
            organization_id: org.id,
            organization_name: org.name,
            role: m.role,
          })
        }
      })

      // Format users with auth data and memberships
      let formattedUsers = authUsers.map((user) => {
        // Check for banned_until in user_metadata or app_metadata
        // Supabase stores suspension info in different places depending on version
        const userMeta = user.user_metadata as Record<string, unknown> | undefined
        const appMeta = user.app_metadata as Record<string, unknown> | undefined
        const isBanned = !!(userMeta?.banned_until || appMeta?.banned_until)

        // Determine user status
        let status: 'suspended' | 'active' | 'pending' = 'pending'
        if (isBanned) {
          status = 'suspended'
        } else if (user.confirmed_at) {
          status = 'active'
        }

        return {
          id: user.id,
          email: user.email || 'No email',
          created_at: user.created_at,
          last_sign_in_at: user.last_sign_in_at,
          status,
          is_super_admin: appMeta?.is_super_admin === true,
          organizations: membershipMap.get(user.id) || [],
          organization_count: (membershipMap.get(user.id) || []).length,
        }
      })

      // Apply search filter
      if (search) {
        const searchLower = search.toLowerCase()
        formattedUsers = formattedUsers.filter(u =>
          u.email.toLowerCase().includes(searchLower) ||
          u.id.toLowerCase().includes(searchLower) ||
          u.organizations.some(o => o.organization_name.toLowerCase().includes(searchLower))
        )
      }

      return NextResponse.json({
        success: true,
        users: formattedUsers,
        pagination: {
          page,
          pageSize,
          total: totalUsers,
          totalPages: Math.ceil(totalUsers / pageSize),
        },
      })
    } catch (error) {
      console.error('[super-admin] Exception fetching users:', error)
      return NextResponse.json(
        {
          error: 'Internal server error',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      )
    }
  })
}
