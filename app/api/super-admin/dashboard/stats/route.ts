/**
 * Super Admin Dashboard Stats API
 * Returns platform-wide statistics including today's activity
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { superAdminGuard } from '@/lib/middleware/super-admin-guard'

export async function GET(request: NextRequest) {
  return superAdminGuard(request, async (req, { superAdmin }) => {
    const supabase = await createClient()

    try {
      // Get today's date for filtering
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayISO = today.toISOString()

      // Fetch organization count
      const { count: orgCount } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true })

      // Fetch user count
      const { count: userCount } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })

      // Fetch active organizations count (those with credits > 0)
      const { count: activeOrgsCount } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true })
        .gt('credits_balance', 0)

      // Calculate total credits balance across all organizations
      const { data: orgCredits } = await supabase
        .from('organizations')
        .select('credits_balance')

      const totalCreditsBalance = orgCredits?.reduce((sum, org) => sum + (org.credits_balance || 0), 0) || 0

      // Calculate total credits allocated from transactions
      const { data: allocationTxns } = await supabase
        .from('credit_transactions')
        .select('amount')
        .in('type', ['allocation', 'purchase', 'bonus'])

      const totalCreditsAllocated = allocationTxns?.reduce((sum, tx) => sum + (tx.amount || 0), 0) || 0

      // Fetch today's credit usage
      const { data: todayUsageData } = await supabase
        .from('credit_transactions')
        .select('amount')
        .in('type', ['usage', 'consumption'])
        .gte('created_at', todayISO)

      const todayCreditsUsed = todayUsageData?.reduce((sum, tx) => sum + Math.abs(tx.amount || 0), 0) || 0

      // Fetch today's generation count
      const { count: todayGenerations } = await supabase
        .from('creatives')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', todayISO)

      return NextResponse.json({
        success: true,
        stats: {
          orgCount: orgCount || 0,
          userCount: userCount || 0,
          activeOrgsCount: activeOrgsCount || 0,
          totalCreditsBalance,
          totalCreditsAllocated,
          todayCreditsUsed,
          todayGenerations: todayGenerations || 0,
        },
      })
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error)
      return NextResponse.json(
        { error: 'Failed to fetch dashboard stats' },
        { status: 500 }
      )
    }
  })
}
