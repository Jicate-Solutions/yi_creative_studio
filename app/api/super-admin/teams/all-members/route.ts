/**
 * Super Admin All Team Members API
 * Returns all team members across all organizations
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { superAdminGuard } from '@/lib/middleware/super-admin-guard'

export async function GET(request: NextRequest) {
  return superAdminGuard(request, async (req, { superAdmin }) => {
    const supabase = await createClient()

    // Parse query parameters
    const searchParams = req.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const organizationId = searchParams.get('organizationId')
    const role = searchParams.get('role')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '100')

    try {
      // Build query for organization members with user profiles
      let query = supabase
        .from('organization_members')
        .select(`
          user_id,
          role,
          joined_at,
          organization_id,
          organizations (
            id,
            name
          ),
          user_profiles (
            id,
            full_name
          )
        `)

      // Apply filters
      if (organizationId) {
        query = query.eq('organization_id', organizationId)
      }
      if (role) {
        query = query.eq('role', role)
      }

      // Execute query
      const { data: memberships, error: memberError } = await query

      if (memberError) {
        throw memberError
      }

      // Group by user and aggregate organizations
      const userMap: Record<string, any> = {}

      memberships?.forEach((membership: any) => {
        const userId = membership.user_id

        if (!userMap[userId]) {
          userMap[userId] = {
            user_id: userId,
            full_name: membership.user_profiles?.full_name || 'Unknown',
            organizations: [],
          }
        }

        userMap[userId].organizations.push({
          organization_id: membership.organization_id,
          organization_name: membership.organizations?.name || 'Unknown',
          role: membership.role,
          joined_at: membership.joined_at,
        })
      })

      // Convert to array
      let users = Object.values(userMap)

      // Apply search filter
      if (search) {
        const searchLower = search.toLowerCase()
        users = users.filter((user: any) =>
          user.full_name.toLowerCase().includes(searchLower)
        )
      }

      // Sort by full name
      users.sort((a: any, b: any) => a.full_name.localeCompare(b.full_name))

      // Calculate pagination
      const totalUsers = users.length
      const totalPages = Math.ceil(totalUsers / pageSize)
      const startIndex = (page - 1) * pageSize
      const endIndex = startIndex + pageSize
      const paginatedUsers = users.slice(startIndex, endIndex)

      // Calculate statistics
      const stats = {
        total_users: totalUsers,
        users_in_multiple_orgs: users.filter((u: any) => u.organizations.length > 1).length,
        role_breakdown: {
          admin: memberships?.filter((m: any) => m.role === 'admin').length || 0,
          editor: memberships?.filter((m: any) => m.role === 'editor').length || 0,
          viewer: memberships?.filter((m: any) => m.role === 'viewer').length || 0,
        },
      }

      return NextResponse.json({
        success: true,
        stats,
        users: paginatedUsers,
        pagination: {
          page,
          pageSize,
          totalPages,
          totalUsers,
        },
      })
    } catch (error) {
      console.error('Failed to fetch team members:', error)
      return NextResponse.json(
        { error: 'Failed to fetch team members' },
        { status: 500 }
      )
    }
  })
}
