/**
 * Super Admin API: List Users
 * GET /api/super-admin/users/list
 *
 * Returns paginated list of all users with organization memberships
 */

import { NextRequest, NextResponse } from 'next/server'
import { superAdminGuard } from '@/lib/middleware/super-admin-guard'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  return superAdminGuard(request, async (req) => {
    const supabase = await createClient()
    const { searchParams } = new URL(req.url)

    // Query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '25')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || '' // 'active', 'suspended', 'deleted'
    const isSuperAdmin = searchParams.get('isSuperAdmin') || '' // 'true', 'false'

    const offset = (page - 1) * pageSize

    try {
      // Build query for users
      let query = supabase
        .from('auth.users')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })

      // Search filter (email)
      if (search) {
        query = query.ilike('email', `%${search}%`)
      }

      // Status filter
      if (status) {
        query = query.eq('status', status)
      }

      // Super Admin filter
      if (isSuperAdmin === 'true') {
        query = query.eq('is_super_admin', true)
      } else if (isSuperAdmin === 'false') {
        query = query.eq('is_super_admin', false)
      }

      // Pagination
      query = query.range(offset, offset + pageSize - 1)

      const { data: users, error, count } = await query

      if (error) {
        console.error('[super-admin] Failed to fetch users:', error)
        return NextResponse.json(
          { error: 'Failed to fetch users', details: error.message },
          { status: 500 }
        )
      }

      // Get organization memberships for each user
      const userIds = users?.map((u) => u.id) || []
      const { data: memberships } = await supabase
        .from('organization_members')
        .select('user_id, organization_id, role, organizations(name)')
        .in('user_id', userIds)

      // Map memberships to users
      const membershipMap = memberships?.reduce((acc, m) => {
        if (!acc[m.user_id]) acc[m.user_id] = []
        acc[m.user_id].push({
          organization_id: m.organization_id,
          organization_name: (m.organizations as any)?.name || 'Unknown',
          role: m.role,
        })
        return acc
      }, {} as Record<string, any[]>) || {}

      // Format users
      const formattedUsers = users?.map((user) => ({
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
        status: user.status || 'active',
        is_super_admin: user.is_super_admin || false,
        suspended_at: user.suspended_at,
        suspension_reason: user.suspension_reason,
        organizations: membershipMap[user.id] || [],
        organization_count: (membershipMap[user.id] || []).length,
      }))

      return NextResponse.json({
        success: true,
        users: formattedUsers || [],
        pagination: {
          page,
          pageSize,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / pageSize),
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
