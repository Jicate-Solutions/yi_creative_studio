/**
 * Super Admin API: Credit Analytics
 * GET /api/super-admin/credits/analytics
 *
 * Platform-wide credit usage analytics and statistics
 */

import { NextRequest, NextResponse } from 'next/server'
import { superAdminGuard } from '@/lib/middleware/super-admin-guard'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  return superAdminGuard(request, async (req) => {
    const supabase = await createClient()

    try {
      // 1. Total credits allocated across all organizations
      const { data: creditData } = await supabase
        .from('organization_credits')
        .select('balance, total_allocated, total_consumed, total_purchased')

      const totals = creditData?.reduce(
        (acc, org) => ({
          total_balance: acc.total_balance + (org.balance || 0),
          total_allocated: acc.total_allocated + (org.total_allocated || 0),
          total_consumed: acc.total_consumed + (org.total_consumed || 0),
          total_purchased: acc.total_purchased + (org.total_purchased || 0),
        }),
        { total_balance: 0, total_allocated: 0, total_consumed: 0, total_purchased: 0 }
      ) || { total_balance: 0, total_allocated: 0, total_consumed: 0, total_purchased: 0 }

      // 2. Credit distribution (organizations by balance range)
      const balanceRanges = {
        empty: creditData?.filter((org) => org.balance === 0).length || 0,
        low: creditData?.filter((org) => org.balance > 0 && org.balance <= 100).length || 0,
        medium: creditData?.filter((org) => org.balance > 100 && org.balance <= 1000).length || 0,
        high: creditData?.filter((org) => org.balance > 1000).length || 0,
      }

      // 3. Recent credit transactions (last 7 days)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const { data: recentTransactions } = await supabase
        .from('credit_transactions')
        .select('type, amount, created_at')
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: true })

      // Group by day
      const dailyStats = recentTransactions?.reduce((acc, txn) => {
        const day = new Date(txn.created_at).toISOString().split('T')[0]
        if (!acc[day]) {
          acc[day] = { allocated: 0, consumed: 0, refunded: 0 }
        }

        if (txn.type === 'allocation' || txn.type === 'manual_allocation' || txn.type === 'bonus') {
          acc[day].allocated += txn.amount
        } else if (txn.type === 'consumption') {
          acc[day].consumed += Math.abs(txn.amount)
        } else if (txn.type === 'refund') {
          acc[day].refunded += txn.amount
        }

        return acc
      }, {} as Record<string, { allocated: number; consumed: number; refunded: number }>)

      // 4. Top consumers (top 10 organizations by consumption)
      const { data: topConsumers } = await supabase
        .from('organization_credits')
        .select('organization_id, total_consumed, organizations(name)')
        .order('total_consumed', { ascending: false })
        .limit(10)

      const formattedTopConsumers = topConsumers?.map((org) => ({
        organization_id: org.organization_id,
        organization_name: (org.organizations as any)?.name || 'Unknown',
        total_consumed: org.total_consumed,
      }))

      // 5. Organizations needing attention (low balance)
      const { data: lowBalanceOrgs } = await supabase
        .from('organization_credits')
        .select('organization_id, balance, low_balance_threshold, organizations(name)')
        .lte('balance', 100)
        .order('balance', { ascending: true })
        .limit(10)

      const formattedLowBalance = lowBalanceOrgs?.map((org) => ({
        organization_id: org.organization_id,
        organization_name: (org.organizations as any)?.name || 'Unknown',
        balance: org.balance,
        threshold: org.low_balance_threshold,
      }))

      return NextResponse.json({
        success: true,
        analytics: {
          totals,
          balance_distribution: balanceRanges,
          daily_stats: dailyStats || {},
          top_consumers: formattedTopConsumers || [],
          low_balance_orgs: formattedLowBalance || [],
        },
      })
    } catch (error) {
      console.error('[super-admin] Exception fetching analytics:', error)
      return NextResponse.json(
        {
          error: 'Failed to fetch analytics',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      )
    }
  })
}
