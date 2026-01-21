/**
 * Super Admin Platform Analytics API
 * Returns aggregated API usage across all organizations
 */

import { NextRequest, NextResponse } from 'next/server'
import { superAdminGuard } from '@/lib/middleware/super-admin-guard'
import { convertToINR } from '@/lib/services/currency'

export async function GET(request: NextRequest) {
  return superAdminGuard(request, async (req, { superAdmin, adminClient }) => {
    // Use adminClient to bypass RLS and access all platform usage data
    const supabase = adminClient

    // Parse query parameters
    const searchParams = req.nextUrl.searchParams
    const dateRange = searchParams.get('dateRange') || 'today' // today, week, month, custom
    const organizationId = searchParams.get('organizationId') // optional filter
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    try {
      // Calculate date range
      let dateFilter: { gte?: string; lte?: string } = {}
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
      } else if (dateRange === 'custom' && startDate && endDate) {
        dateFilter.gte = new Date(startDate).toISOString()
        dateFilter.lte = new Date(endDate).toISOString()
      }

      // Build query
      let query = supabase
        .from('api_usage')
        .select('provider, model, input_tokens, output_tokens, estimated_cost_usd, organization_id')

      if (dateFilter.gte) {
        query = query.gte('created_at', dateFilter.gte)
      }
      if (dateFilter.lte) {
        query = query.lte('created_at', dateFilter.lte)
      }
      if (organizationId) {
        query = query.eq('organization_id', organizationId)
      }

      const { data: usageData, error: usageError } = await query

      if (usageError) {
        throw usageError
      }

      // Aggregate by provider and model
      const aggregatedByProvider: Record<string, any> = {}

      usageData?.forEach((usage) => {
        const key = `${usage.provider}-${usage.model}`
        if (!aggregatedByProvider[key]) {
          aggregatedByProvider[key] = {
            provider: usage.provider,
            model: usage.model,
            total_input_tokens: 0,
            total_output_tokens: 0,
            total_cost_usd: 0,
            total_cost_inr: 0,
            request_count: 0,
          }
        }

        aggregatedByProvider[key].total_input_tokens += usage.input_tokens || 0
        aggregatedByProvider[key].total_output_tokens += usage.output_tokens || 0
        aggregatedByProvider[key].total_cost_usd += usage.estimated_cost_usd || 0
        aggregatedByProvider[key].total_cost_inr = convertToINR(aggregatedByProvider[key].total_cost_usd)
        aggregatedByProvider[key].request_count += 1
      })

      // Convert to array and sort by cost
      const aggregated = Object.values(aggregatedByProvider).sort(
        (a: any, b: any) => b.total_cost_usd - a.total_cost_usd
      )

      // Calculate totals
      const totalCostUSD = usageData?.reduce((sum, u) => sum + (u.estimated_cost_usd || 0), 0) || 0
      const totals = {
        total_requests: usageData?.length || 0,
        total_input_tokens: usageData?.reduce((sum, u) => sum + (u.input_tokens || 0), 0) || 0,
        total_output_tokens: usageData?.reduce((sum, u) => sum + (u.output_tokens || 0), 0) || 0,
        total_cost_usd: totalCostUSD,
        total_cost_inr: convertToINR(totalCostUSD),
      }

      return NextResponse.json({
        success: true,
        dateRange,
        filters: {
          organizationId,
          startDate: dateFilter.gte,
          endDate: dateFilter.lte,
        },
        totals,
        byProviderModel: aggregated,
      })
    } catch (error) {
      console.error('Failed to fetch platform usage:', error)
      return NextResponse.json(
        { error: 'Failed to fetch platform usage analytics' },
        { status: 500 }
      )
    }
  })
}
