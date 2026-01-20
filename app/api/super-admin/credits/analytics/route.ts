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
      // 1. Get all organizations with their credit balances
      const { data: organizations } = await supabase
        .from('organizations')
        .select('id, name, credits_balance')

      const totalBalance = organizations?.reduce(
        (sum, org) => sum + (org.credits_balance || 0),
        0
      ) || 0

      // 2. Credit distribution (organizations by balance range)
      const balanceRanges = {
        empty: organizations?.filter((org) => org.credits_balance === 0).length || 0,
        low: organizations?.filter((org) => org.credits_balance > 0 && org.credits_balance <= 100).length || 0,
        medium: organizations?.filter((org) => org.credits_balance > 100 && org.credits_balance <= 1000).length || 0,
        high: organizations?.filter((org) => org.credits_balance > 1000).length || 0,
      }

      // 3. Calculate totals from credit_transactions
      const { data: allTransactions } = await supabase
        .from('credit_transactions')
        .select('type, amount')

      const totals = allTransactions?.reduce(
        (acc, txn) => {
          if (txn.type === 'purchase') {
            acc.total_purchased += txn.amount || 0
          } else if (txn.type === 'allocation' || txn.type === 'bonus') {
            acc.total_allocated += txn.amount || 0
          } else if (txn.type === 'usage' || txn.type === 'consumption') {
            acc.total_consumed += Math.abs(txn.amount || 0)
          }
          return acc
        },
        { total_balance: totalBalance, total_purchased: 0, total_allocated: 0, total_consumed: 0 }
      ) || { total_balance: totalBalance, total_purchased: 0, total_allocated: 0, total_consumed: 0 }

      // 4. Recent credit transactions (last 7 days)
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

        if (txn.type === 'allocation' || txn.type === 'bonus' || txn.type === 'purchase') {
          acc[day].allocated += txn.amount || 0
        } else if (txn.type === 'usage' || txn.type === 'consumption') {
          acc[day].consumed += Math.abs(txn.amount || 0)
        } else if (txn.type === 'refund') {
          acc[day].refunded += txn.amount || 0
        }

        return acc
      }, {} as Record<string, { allocated: number; consumed: number; refunded: number }>)

      // 5. Top consumers - from organizations sorted by credits usage
      // Calculate total consumed per organization from transactions
      const { data: consumptionByOrg } = await supabase
        .from('credit_transactions')
        .select('organization_id, amount')
        .in('type', ['usage', 'consumption'])

      const orgConsumption: Record<string, number> = {}
      consumptionByOrg?.forEach((txn) => {
        if (txn.organization_id) {
          orgConsumption[txn.organization_id] = (orgConsumption[txn.organization_id] || 0) + Math.abs(txn.amount || 0)
        }
      })

      // Sort and get top 10
      const topConsumers = Object.entries(orgConsumption)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([orgId, consumed]) => {
          const org = organizations?.find((o) => o.id === orgId)
          return {
            organization_id: orgId,
            organization_name: org?.name || 'Unknown',
            total_consumed: consumed,
          }
        })

      // 6. Organizations needing attention (low balance)
      const lowBalanceOrgs = organizations
        ?.filter((org) => org.credits_balance <= 100)
        .sort((a, b) => a.credits_balance - b.credits_balance)
        .slice(0, 10)
        .map((org) => ({
          organization_id: org.id,
          organization_name: org.name,
          balance: org.credits_balance,
        })) || []

      return NextResponse.json({
        success: true,
        analytics: {
          totals,
          balance_distribution: balanceRanges,
          daily_stats: dailyStats || {},
          top_consumers: topConsumers || [],
          low_balance_orgs: lowBalanceOrgs,
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
