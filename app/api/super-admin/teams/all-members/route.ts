/**
 * Super Admin All Team Members API
 * Returns all team members across all organizations
 */

import { NextRequest, NextResponse } from 'next/server'
import { superAdminGuard } from '@/lib/middleware/super-admin-guard'

export async function GET(request: NextRequest) {
  return superAdminGuard(request, async (req, { superAdmin, adminClient }) => {
    // Use adminClient to bypass RLS and access all team members
    const supabase = adminClient

    // Parse query parameters
    const searchParams = req.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const organizationId = searchParams.get('organizationId')
    const role = searchParams.get('role')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '100')

    try {
      // Step 1: Query organization_members with only organizations join
      // (user_profiles has no FK relationship, so we fetch it separately)
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

      // Step 2: Get unique user IDs
      const userIds = [...new Set(memberships?.map(m => m.user_id) || [])]

      // Step 3: Fetch user profiles separately (no FK constraint)
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, full_name')
        .in('id', userIds)

      const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) || [])

      // Step 4: Fetch user emails from auth (in batches to avoid rate limits)
      const userAuthMap = new Map<string, { email: string; full_name?: string }>()
      const failedLookups: string[] = []

      // Process in batches of 50 to avoid overwhelming the auth API
      const batchSize = 50
      for (let i = 0; i < userIds.length; i += batchSize) {
        const batch = userIds.slice(i, i + batchSize)
        const userPromises = batch.map(async (userId) => {
          try {
            const { data: { user }, error } = await adminClient.auth.admin.getUserById(userId)
            if (error) {
              console.warn(`[teams-all-members] Failed to fetch user ${userId}:`, error.message)
              failedLookups.push(userId)
              return
            }
            if (user) {
              userAuthMap.set(userId, {
                email: user.email || '',
                full_name: user.user_metadata?.full_name as string | undefined,
              })
            }
          } catch (e) {
            // User might have been deleted or network error
            console.warn(`[teams-all-members] Exception fetching user ${userId}:`, e instanceof Error ? e.message : 'Unknown')
            failedLookups.push(userId)
          }
        })
        await Promise.all(userPromises)
      }

      // Log summary of failed lookups if any
      if (failedLookups.length > 0) {
        console.warn(`[teams-all-members] ${failedLookups.length} user(s) could not be fetched from auth`)
      }

      // Step 5: Group by user and aggregate organizations
      const userMap: Record<string, any> = {}

      memberships?.forEach((membership: any) => {
        const userId = membership.user_id
        const authData = userAuthMap.get(userId)
        const profileName = profileMap.get(userId)

        if (!userMap[userId]) {
          userMap[userId] = {
            user_id: userId,
            email: authData?.email || '',
            full_name: profileName || authData?.full_name || 'Unknown',
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

      // Apply search filter (now includes email search)
      if (search) {
        const searchLower = search.toLowerCase()
        users = users.filter((user: any) =>
          user.full_name.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower)
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
