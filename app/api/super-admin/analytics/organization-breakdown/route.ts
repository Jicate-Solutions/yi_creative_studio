/**
 * Super Admin Organization Breakdown API
 * Returns per-organization API usage statistics
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  // Check Super Admin authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify Super Admin role
  const { data: userData } = await supabase
    .from('user_profiles')
    .select('is_super_admin')
    .eq('id', user.id)
    .single()

  if (!userData?.is_super_admin) {
    return NextResponse.json({ error: 'Forbidden - Super Admin access required' }, { status: 403 })
  }

  // Parse query parameters
  const searchParams = request.nextUrl.searchParams
  const dateRange = searchParams.get('dateRange') || 'month'
  const sortBy = searchParams.get('sortBy') || 'cost' // cost, tokens, requests
  const limit = parseInt(searchParams.get('limit') || '50')

  try {
    // Calculate date range
    let dateFilter: { gte?: string } = {}
    const now = new Date()

    if (dateRange === 'today') {
      const todayStart = new Date(now.setHours(0, 0, 0, 0))
      dateFilter.gte = todayStart.toISOString()
    } else if (dateRange === 'week') {
      const weekAgo = new Date(now.setDate(now.getDate() - 7))
      dateFilter.gte = weekAgo.toISOString()
    } else if (dateRange === 'month') {
      const monthAgo = new Date(now.setMonth(now.getMonth() - 1))
      dateFilter.gte = monthAgo.toISOString()
    }

    // Fetch all organizations
    const { data: organizations, error: orgError } = await supabase
      .from('organizations')
      .select('id, name')

    if (orgError) {
      throw orgError
    }

    // Fetch API usage data
    let usageQuery = supabase
      .from('api_usage')
      .select('organization_id, input_tokens, output_tokens, estimated_cost_usd')

    if (dateFilter.gte) {
      usageQuery = usageQuery.gte('created_at', dateFilter.gte)
    }

    const { data: usageData, error: usageError } = await usageQuery

    if (usageError) {
      throw usageError
    }

    // Aggregate by organization
    const orgStats: Record<string, any> = {}

    organizations?.forEach((org) => {
      orgStats[org.id] = {
        organization_id: org.id,
        organization_name: org.name,
        request_count: 0,
        total_tokens: 0,
        total_cost_usd: 0,
      }
    })

    usageData?.forEach((usage) => {
      if (orgStats[usage.organization_id]) {
        orgStats[usage.organization_id].request_count += 1
        orgStats[usage.organization_id].total_tokens += (usage.input_tokens || 0) + (usage.output_tokens || 0)
        orgStats[usage.organization_id].total_cost_usd += usage.estimated_cost_usd || 0
      }
    })

    // Convert to array and sort
    let orgArray = Object.values(orgStats)

    if (sortBy === 'cost') {
      orgArray.sort((a: any, b: any) => b.total_cost_usd - a.total_cost_usd)
    } else if (sortBy === 'tokens') {
      orgArray.sort((a: any, b: any) => b.total_tokens - a.total_tokens)
    } else if (sortBy === 'requests') {
      orgArray.sort((a: any, b: any) => b.request_count - a.request_count)
    }

    // Apply limit
    orgArray = orgArray.slice(0, limit)

    // Calculate platform totals
    const platformTotals = {
      total_organizations: organizations?.length || 0,
      total_requests: usageData?.length || 0,
      total_tokens: usageData?.reduce((sum, u) => sum + (u.input_tokens || 0) + (u.output_tokens || 0), 0) || 0,
      total_cost_usd: usageData?.reduce((sum, u) => sum + (u.estimated_cost_usd || 0), 0) || 0,
    }

    return NextResponse.json({
      success: true,
      dateRange,
      sortBy,
      platformTotals,
      organizations: orgArray,
    })
  } catch (error) {
    console.error('Failed to fetch organization breakdown:', error)
    return NextResponse.json(
      { error: 'Failed to fetch organization breakdown' },
      { status: 500 }
    )
  }
}
