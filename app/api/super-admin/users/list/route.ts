/**
 * Super Admin API: List Users
 * GET /api/super-admin/users/list
 *
 * Returns paginated list of all users with organization memberships
 * NOTE: This endpoint requires proper admin client setup with service role key
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

    try {
      // Get users from organization_members (can't directly query auth.users without service role)
      // This shows users who have joined at least one organization
      const query = supabase
        .from('organization_members')
        .select(`
          user_id,
          role,
          joined_at,
          organizations (
            id,
            name
          )
        `, { count: 'exact' })
        .order('joined_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1)

      // Note: search filter would need profiles table to have email column
      // For now, we fetch all and filter in memory if needed

      const { data: memberships, error, count } = await query

      if (error) {
        console.error('[super-admin] Failed to fetch users:', error)
        return NextResponse.json(
          { error: 'Failed to fetch users', details: error.message },
          { status: 500 }
        )
      }

      // Group by user
      const usersMap = new Map<string, {
        id: string
        joined_at: string | null
        organizations: Array<{ id: string; name: string; role: string }>
      }>()

      memberships?.forEach((m) => {
        const userId = m.user_id
        const org = m.organizations as { id: string; name: string } | null

        if (!usersMap.has(userId)) {
          usersMap.set(userId, {
            id: userId,
            joined_at: m.joined_at,
            organizations: [],
          })
        }

        const user = usersMap.get(userId)!
        if (org) {
          user.organizations.push({
            id: org.id,
            name: org.name,
            role: m.role,
          })
        }
      })

      // Convert to array and apply search filter
      let users = Array.from(usersMap.values())
      if (search) {
        const searchLower = search.toLowerCase()
        users = users.filter(u =>
          u.id.toLowerCase().includes(searchLower) ||
          u.organizations.some(o => o.name.toLowerCase().includes(searchLower))
        )
      }

      // Format output
      const formattedUsers = users.map((user) => ({
        id: user.id,
        joined_at: user.joined_at,
        status: 'active', // Default - would need user metadata for accurate status
        is_super_admin: false, // Would need user metadata check
        organizations: user.organizations,
        organization_count: user.organizations.length,
      }))

      return NextResponse.json({
        success: true,
        users: formattedUsers,
        pagination: {
          page,
          pageSize,
          total: count || users.length,
          totalPages: Math.ceil((count || users.length) / pageSize),
        },
        note: 'This endpoint shows users who have joined organizations. For full user list, configure admin client with service role.',
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
