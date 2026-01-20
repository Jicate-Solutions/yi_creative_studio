/**
 * Super Admin API: List Organizations
 * GET /api/super-admin/organizations/list
 *
 * Returns paginated list of all organizations with credit and member data
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
    const isActive = searchParams.get('isActive') // 'true', 'false', or null for all
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const offset = (page - 1) * pageSize

    try {
      // Build base query
      let query = supabase
        .from('organizations')
        .select('*', { count: 'exact' })

      // Search filter (name or ID)
      if (search) {
        query = query.or(`name.ilike.%${search}%,id.eq.${search}`)
      }

      // Active status filter
      if (isActive === 'true') {
        query = query.eq('is_active', true)
      } else if (isActive === 'false') {
        query = query.eq('is_active', false)
      }

      // Sorting
      if (sortBy === 'name') {
        query = query.order('name', { ascending: sortOrder === 'asc' })
      } else if (sortBy === 'credits') {
        query = query.order('credits_balance', { ascending: sortOrder === 'asc' })
      } else {
        query = query.order(sortBy, { ascending: sortOrder === 'asc' })
      }

      // Pagination
      query = query.range(offset, offset + pageSize - 1)

      const { data: organizations, error, count } = await query

      if (error) {
        console.error('[super-admin] Failed to fetch organizations:', error)
        return NextResponse.json(
          { error: 'Failed to fetch organizations', details: error.message },
          { status: 500 }
        )
      }

      // Get member counts for each organization
      const orgIds = organizations?.map((org) => org.id) || []
      const { data: memberCounts } = await supabase
        .from('organization_members')
        .select('organization_id')
        .in('organization_id', orgIds)

      // Count members per organization
      const memberCountMap = memberCounts?.reduce((acc, member) => {
        acc[member.organization_id] = (acc[member.organization_id] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {}

      // Get last activity from credit transactions
      const { data: recentTxns } = await supabase
        .from('credit_transactions')
        .select('organization_id, created_at')
        .in('organization_id', orgIds)
        .order('created_at', { ascending: false })

      // Get last activity per organization
      const lastActivityMap: Record<string, string> = {}
      recentTxns?.forEach((txn) => {
        if (!lastActivityMap[txn.organization_id]) {
          lastActivityMap[txn.organization_id] = txn.created_at
        }
      })

      // Calculate health scores and format data
      const formattedOrganizations = organizations?.map((org) => {
        const lastActivity = lastActivityMap[org.id] || org.created_at

        // Health score calculation
        const healthScore = calculateHealthScore({
          creditBalance: org.credits_balance || 0,
          isActive: org.is_active ?? true,
          lastActivity,
          memberCount: memberCountMap[org.id] || 0,
        })

        return {
          id: org.id,
          name: org.name,
          type: org.type,
          created_at: org.created_at,
          is_active: org.is_active ?? true,

          // Credit info
          credit_balance: org.credits_balance || 0,

          // Team info
          member_count: memberCountMap[org.id] || 0,

          // Activity
          last_activity: lastActivity,

          // Health score
          health_score: healthScore,
        }
      }) || []

      return NextResponse.json({
        success: true,
        organizations: formattedOrganizations,
        pagination: {
          page,
          pageSize,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / pageSize),
        },
      })
    } catch (error) {
      console.error('[super-admin] Exception fetching organizations:', error)
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

/**
 * Calculate organization health score
 * Returns: 'healthy', 'warning', 'critical'
 */
function calculateHealthScore(params: {
  creditBalance: number
  isActive: boolean
  lastActivity: string
  memberCount: number
}): 'healthy' | 'warning' | 'critical' {
  const { creditBalance, isActive, lastActivity, memberCount } = params

  // Critical conditions
  if (!isActive) {
    return 'critical'
  }

  if (creditBalance === 0) {
    return 'critical'
  }

  // Warning conditions
  const daysSinceActivity = Math.floor(
    (Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24)
  )

  if (daysSinceActivity > 30) {
    return 'warning'
  }

  if (creditBalance < 100) {
    return 'warning'
  }

  if (memberCount === 0) {
    return 'warning'
  }

  // Healthy
  return 'healthy'
}
