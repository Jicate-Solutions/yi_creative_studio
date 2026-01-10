/**
 * Super Admin Platform Revenue API
 * Returns platform-wide revenue from credit purchases
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
  const limit = parseInt(searchParams.get('limit') || '20')

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
    } else if (dateRange === 'all') {
      // No date filter
    }

    // Fetch credit purchase transactions
    let query = supabase
      .from('credit_transactions')
      .select(`
        id,
        amount,
        amount_inr,
        amount_usd,
        payment_provider,
        created_at,
        organization_id,
        organizations (
          id,
          name
        )
      `)
      .eq('type', 'purchase')
      .order('created_at', { ascending: false })

    if (dateFilter.gte) {
      query = query.gte('created_at', dateFilter.gte)
    }

    const { data: transactions, error: txnError } = await query.limit(limit)

    if (txnError) {
      throw txnError
    }

    // Calculate revenue totals
    let totalRevenueINR = 0
    let totalRevenueUSD = 0
    let totalCreditsSold = 0

    transactions?.forEach((txn) => {
      totalRevenueINR += txn.amount_inr || 0
      totalRevenueUSD += txn.amount_usd || 0
      totalCreditsSold += txn.amount || 0
    })

    // Group by organization for top payers
    const orgRevenue: Record<string, any> = {}

    transactions?.forEach((txn: any) => {
      const orgId = txn.organization_id
      if (!orgRevenue[orgId]) {
        orgRevenue[orgId] = {
          organization_id: orgId,
          organization_name: txn.organizations?.name || 'Unknown',
          total_revenue_inr: 0,
          total_revenue_usd: 0,
          total_credits_purchased: 0,
          transaction_count: 0,
        }
      }

      orgRevenue[orgId].total_revenue_inr += txn.amount_inr || 0
      orgRevenue[orgId].total_revenue_usd += txn.amount_usd || 0
      orgRevenue[orgId].total_credits_purchased += txn.amount || 0
      orgRevenue[orgId].transaction_count += 1
    })

    // Convert to array and sort by revenue
    const topPayingOrgs = Object.values(orgRevenue)
      .sort((a: any, b: any) => b.total_revenue_inr - a.total_revenue_inr)
      .slice(0, 10)

    // Payment provider breakdown
    const providerBreakdown: Record<string, any> = {}

    transactions?.forEach((txn) => {
      const provider = txn.payment_provider || 'manual'
      if (!providerBreakdown[provider]) {
        providerBreakdown[provider] = {
          provider,
          revenue_inr: 0,
          revenue_usd: 0,
          transaction_count: 0,
        }
      }

      providerBreakdown[provider].revenue_inr += txn.amount_inr || 0
      providerBreakdown[provider].revenue_usd += txn.amount_usd || 0
      providerBreakdown[provider].transaction_count += 1
    })

    return NextResponse.json({
      success: true,
      dateRange,
      totals: {
        total_revenue_inr: totalRevenueINR,
        total_revenue_usd: totalRevenueUSD,
        total_credits_sold: totalCreditsSold,
        transaction_count: transactions?.length || 0,
      },
      recentPurchases: transactions?.map((txn: any) => ({
        id: txn.id,
        organization_name: txn.organizations?.name || 'Unknown',
        amount_inr: txn.amount_inr,
        amount_usd: txn.amount_usd,
        credits: txn.amount,
        payment_provider: txn.payment_provider,
        created_at: txn.created_at,
      })),
      topPayingOrganizations: topPayingOrgs,
      paymentProviderBreakdown: Object.values(providerBreakdown),
    })
  } catch (error) {
    console.error('Failed to fetch platform revenue:', error)
    return NextResponse.json(
      { error: 'Failed to fetch platform revenue' },
      { status: 500 }
    )
  }
}
