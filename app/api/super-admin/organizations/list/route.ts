/**
 * Super Admin API: List Organizations
 * GET /api/super-admin/organizations/list
 *
 * Returns paginated list of all organizations with subscription, credit, and member data
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
    const status = searchParams.get('status') || '' // 'active', 'trial', 'cancelled', etc.
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const offset = (page - 1) * pageSize

    try {
      // Build base query with joins
      let query = supabase
        .from('organizations')
        .select(
          `
          *,
          organization_credits(balance, total_consumed, last_consumption_at),
          organization_subscriptions!inner(
            id,
            tier_id,
            status,
            period_start,
            period_end,
            subscription_tiers(name, display_name)
          )
        `,
          { count: 'exact' }
        )

      // Search filter (name or ID)
      if (search) {
        query = query.or(`name.ilike.%${search}%,id.eq.${search}`)
      }

      // Status filter (subscription status)
      if (status) {
        query = query.eq('organization_subscriptions.status', status)
      }

      // Sorting
      if (sortBy === 'name') {
        query = query.order('name', { ascending: sortOrder === 'asc' })
      } else if (sortBy === 'credits') {
        // Sort by credit balance (requires join)
        query = query.order('organization_credits.balance', { ascending: sortOrder === 'asc' })
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

      // Calculate health scores and format data
      const formattedOrganizations = organizations?.map((org) => {
        const subscription = org.organization_subscriptions?.[0]
        const credits = org.organization_credits?.[0]

        // Health score calculation
        const healthScore = calculateHealthScore({
          creditBalance: credits?.balance || 0,
          subscriptionStatus: subscription?.status || 'expired',
          lastActivity: credits?.last_consumption_at || org.created_at,
          memberCount: memberCountMap[org.id] || 0,
        })

        return {
          id: org.id,
          name: org.name,
          type: org.type,
          created_at: org.created_at,

          // Subscription info
          subscription_tier: subscription?.subscription_tiers?.name || 'none',
          subscription_tier_display: subscription?.subscription_tiers?.display_name || 'No Subscription',
          subscription_status: subscription?.status || 'expired',
          subscription_period_end: subscription?.period_end,

          // Credit info
          credit_balance: credits?.balance || 0,
          total_consumed: credits?.total_consumed || 0,

          // Team info
          member_count: memberCountMap[org.id] || 0,

          // Activity
          last_activity: credits?.last_consumption_at || org.created_at,

          // Health score
          health_score: healthScore,

          // Raw data for detail pages
          _raw: org,
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
  subscriptionStatus: string
  lastActivity: string
  memberCount: number
}): 'healthy' | 'warning' | 'critical' {
  const { creditBalance, subscriptionStatus, lastActivity, memberCount } = params

  // Critical conditions
  if (subscriptionStatus === 'cancelled' || subscriptionStatus === 'expired') {
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
