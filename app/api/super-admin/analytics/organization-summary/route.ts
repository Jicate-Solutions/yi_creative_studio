/**
 * Super Admin API: Organization Analytics Summary
 * GET /api/super-admin/analytics/organization-summary
 *
 * Returns analytics summary for all organizations including:
 * - Credits balance and usage
 * - Creatives generated
 * - Active users
 * - API costs
 */

import { NextRequest, NextResponse } from 'next/server'
import { superAdminGuard } from '@/lib/middleware/super-admin-guard'

export async function GET(request: NextRequest) {
  return superAdminGuard(request, async (req, { adminClient }) => {
    const supabase = adminClient
    const { searchParams } = new URL(req.url)

    // Query parameters
    const days = parseInt(searchParams.get('days') || '30')
    const sortBy = searchParams.get('sortBy') || 'credits_used' // credits_used, creatives, cost, balance
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const limit = parseInt(searchParams.get('limit') || '50')

    try {
      // Calculate date range
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)
      const startDateStr = startDate.toISOString()

      // Step 1: Get all organizations with their basic info
      const { data: organizations, error: orgError } = await supabase
        .from('organizations')
        .select('id, name, slug, credits_balance, is_active, created_at')
        .eq('is_active', true)

      if (orgError) {
        console.error('[super-admin] Failed to fetch organizations:', orgError)
        return NextResponse.json(
          { error: 'Failed to fetch organizations', details: orgError.message },
          { status: 500 }
        )
      }

      if (!organizations || organizations.length === 0) {
        return NextResponse.json({
          success: true,
          organizations: [],
          summary: {
            total_organizations: 0,
            total_credits_balance: 0,
            total_credits_used: 0,
            total_creatives: 0,
            total_api_cost: 0,
          },
        })
      }

      const orgIds = organizations.map(o => o.id)

      // Step 2: Get credit transactions (consumption) in the date range
      const { data: creditTransactions } = await supabase
        .from('credit_transactions')
        .select('organization_id, amount, type')
        .in('organization_id', orgIds)
        .eq('type', 'generation')
        .gte('created_at', startDateStr)

      // Build credits used map (generation type = consumption)
      const creditsUsedMap = new Map<string, number>()
      creditTransactions?.forEach((t) => {
        const current = creditsUsedMap.get(t.organization_id) || 0
        // amount is negative for consumption, so we use absolute value
        creditsUsedMap.set(t.organization_id, current + Math.abs(t.amount))
      })

      // Step 3: Get creatives count in the date range
      const { data: creativeCounts } = await supabase
        .from('creatives')
        .select('organization_id')
        .in('organization_id', orgIds)
        .gte('created_at', startDateStr)

      // Build creatives count map
      const creativesMap = new Map<string, number>()
      creativeCounts?.forEach((c) => {
        const current = creativesMap.get(c.organization_id) || 0
        creativesMap.set(c.organization_id, current + 1)
      })

      // Step 4: Get API costs in the date range
      const { data: apiUsage } = await supabase
        .from('api_usage')
        .select('organization_id, estimated_cost_usd')
        .in('organization_id', orgIds)
        .gte('created_at', startDateStr)

      // Build API cost map
      const apiCostMap = new Map<string, number>()
      apiUsage?.forEach((u) => {
        if (!u.organization_id) return
        const current = apiCostMap.get(u.organization_id) || 0
        apiCostMap.set(u.organization_id, current + (u.estimated_cost_usd || 0))
      })

      // Step 5: Get active users count (users who created something in date range)
      const { data: activeUsers } = await supabase
        .from('creatives')
        .select('organization_id, created_by')
        .in('organization_id', orgIds)
        .gte('created_at', startDateStr)

      // Build active users map (unique users per org)
      const activeUsersMap = new Map<string, Set<string>>()
      activeUsers?.forEach((c) => {
        if (!activeUsersMap.has(c.organization_id)) {
          activeUsersMap.set(c.organization_id, new Set())
        }
        if (c.created_by) {
          activeUsersMap.get(c.organization_id)!.add(c.created_by)
        }
      })

      // Step 6: Get total members per org
      const { data: memberCounts } = await supabase
        .from('organization_members')
        .select('organization_id')
        .in('organization_id', orgIds)

      const membersMap = new Map<string, number>()
      memberCounts?.forEach((m) => {
        const current = membersMap.get(m.organization_id) || 0
        membersMap.set(m.organization_id, current + 1)
      })

      // Step 7: Combine all data
      let orgSummaries = organizations.map((org) => ({
        organization_id: org.id,
        organization_name: org.name,
        slug: org.slug,
        credits_balance: org.credits_balance || 0,
        credits_used: creditsUsedMap.get(org.id) || 0,
        creatives_count: creativesMap.get(org.id) || 0,
        api_cost_usd: Number((apiCostMap.get(org.id) || 0).toFixed(4)),
        active_users: activeUsersMap.get(org.id)?.size || 0,
        total_members: membersMap.get(org.id) || 0,
        created_at: org.created_at,
      }))

      // Step 8: Sort by requested field
      const sortField = sortBy as keyof typeof orgSummaries[0]
      orgSummaries.sort((a, b) => {
        const aVal = a[sortField] ?? 0
        const bVal = b[sortField] ?? 0
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortOrder === 'desc' ? bVal - aVal : aVal - bVal
        }
        return 0
      })

      // Apply limit
      const limitedSummaries = orgSummaries.slice(0, limit)

      // Calculate totals
      const summary = {
        total_organizations: organizations.length,
        total_credits_balance: organizations.reduce((sum, o) => sum + (o.credits_balance || 0), 0),
        total_credits_used: Array.from(creditsUsedMap.values()).reduce((sum, v) => sum + v, 0),
        total_creatives: Array.from(creativesMap.values()).reduce((sum, v) => sum + v, 0),
        total_api_cost_usd: Number(Array.from(apiCostMap.values()).reduce((sum, v) => sum + v, 0).toFixed(4)),
        date_range_days: days,
      }

      return NextResponse.json({
        success: true,
        organizations: limitedSummaries,
        summary,
      })
    } catch (error) {
      console.error('[super-admin] Exception fetching org summary:', error)
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
