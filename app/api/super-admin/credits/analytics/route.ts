/**
 * Super Admin API: Credit Analytics
 * GET /api/super-admin/credits/analytics
 *
 * Platform-wide credit usage analytics and statistics
 * Note: Credits are stored directly on organizations.credits_balance
 */

import { NextRequest, NextResponse } from 'next/server'
import { superAdminGuard } from '@/lib/middleware/super-admin-guard'

export async function GET(request: NextRequest) {
  return superAdminGuard(request, async (req, { adminClient }) => {
    // Use adminClient to bypass RLS and access all credit analytics
    const supabase = adminClient

    try {
      // Parse date range from query params
      const { searchParams } = new URL(req.url)
      const range = searchParams.get('range') || '7d'

      // Calculate date range
      let daysBack = 7
      if (range === '30d') daysBack = 30
      else if (range === '90d') daysBack = 90

      const startDate = new Date()
      startDate.setDate(startDate.getDate() - daysBack)

      // 1. Get all organizations with their credit balance
      const { data: organizations, error: orgsError } = await supabase
        .from('organizations')
        .select('id, name, is_active, credits_balance')

      if (orgsError) {
        console.error('[credits-analytics] Failed to fetch organizations:', orgsError)
        throw new Error('Failed to fetch organizations')
      }

      // Calculate total balance across all organizations
      const totalBalance = organizations?.reduce(
        (sum, org) => sum + (org.credits_balance || 0),
        0
      ) || 0

      // 2. Get aggregated transaction data for totals
      const { data: transactions, error: txnError } = await supabase
        .from('credit_transactions')
        .select('type, amount')

      if (txnError) {
        console.error('[credits-analytics] Failed to fetch transactions:', txnError)
      }

      // Calculate totals from transactions
      let totalAllocated = 0
      let totalConsumed = 0
      let totalPurchased = 0
      let totalRefunded = 0

      transactions?.forEach((txn) => {
        const amount = txn.amount || 0
        switch (txn.type) {
          case 'bonus':
          case 'adjustment':
            if (amount > 0) totalAllocated += amount
            break
          case 'purchase':
            totalPurchased += amount
            totalAllocated += amount
            break
          case 'generation':
            totalConsumed += Math.abs(amount)
            break
          case 'refund':
            totalRefunded += amount
            break
        }
      })

      // 3. Credit distribution (organizations by balance range)
      const balanceRanges = {
        empty: organizations?.filter((org) => (org.credits_balance || 0) === 0).length || 0,
        low: organizations?.filter((org) => {
          const balance = org.credits_balance || 0
          return balance > 0 && balance <= 100
        }).length || 0,
        medium: organizations?.filter((org) => {
          const balance = org.credits_balance || 0
          return balance > 100 && balance <= 1000
        }).length || 0,
        high: organizations?.filter((org) => (org.credits_balance || 0) > 1000).length || 0,
      }

      // 4. Totals object
      const totals = {
        total_balance: totalBalance,
        total_allocated: totalAllocated,
        total_consumed: totalConsumed,
        total_purchased: totalPurchased,
        total_refunded: totalRefunded,
      }

      // 5. Recent credit transactions (based on date range)
      const { data: recentTransactions } = await supabase
        .from('credit_transactions')
        .select('type, amount, created_at')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true })

      // Group by day
      const dailyStats = recentTransactions?.reduce((acc, txn) => {
        const day = new Date(txn.created_at).toISOString().split('T')[0]
        if (!acc[day]) {
          acc[day] = { allocated: 0, consumed: 0, refunded: 0 }
        }

        if (txn.type === 'bonus' || txn.type === 'purchase' || txn.type === 'adjustment') {
          acc[day].allocated += txn.amount || 0
        } else if (txn.type === 'generation') {
          acc[day].consumed += Math.abs(txn.amount || 0)
        } else if (txn.type === 'refund') {
          acc[day].refunded += txn.amount || 0
        }

        return acc
      }, {} as Record<string, { allocated: number; consumed: number; refunded: number }>)

      // 6. Top consumers - aggregate from credit_transactions by organization
      const { data: consumptionByOrg } = await supabase
        .from('credit_transactions')
        .select('organization_id, amount')
        .eq('type', 'generation')

      // Aggregate consumption by organization
      const orgConsumption: Record<string, number> = {}
      consumptionByOrg?.forEach((txn) => {
        if (txn.organization_id) {
          orgConsumption[txn.organization_id] = (orgConsumption[txn.organization_id] || 0) + Math.abs(txn.amount || 0)
        }
      })

      // Map to organization details and sort
      const topConsumers = Object.entries(orgConsumption)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([orgId, consumed]) => {
          const org = organizations?.find((o) => o.id === orgId)
          return {
            organization_id: orgId,
            organization_name: org?.name || 'Unknown',
            total_consumed: consumed,
            current_balance: org?.credits_balance || 0,
          }
        })

      // 7. Organizations needing attention (low balance, threshold = 100)
      const LOW_BALANCE_THRESHOLD = 100
      const lowBalanceOrgs = organizations
        ?.filter((org) => org.is_active && (org.credits_balance || 0) <= LOW_BALANCE_THRESHOLD)
        .sort((a, b) => (a.credits_balance || 0) - (b.credits_balance || 0))
        .slice(0, 10)
        .map((org) => ({
          organization_id: org.id,
          organization_name: org.name,
          balance: org.credits_balance || 0,
          threshold: LOW_BALANCE_THRESHOLD,
        })) || []

      return NextResponse.json({
        success: true,
        analytics: {
          totals,
          balance_distribution: balanceRanges,
          daily_stats: dailyStats || {},
          top_consumers: topConsumers,
          low_balance_orgs: lowBalanceOrgs,
        },
      })
    } catch (error) {
      console.error('[credits-analytics] Exception fetching analytics:', error)
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
