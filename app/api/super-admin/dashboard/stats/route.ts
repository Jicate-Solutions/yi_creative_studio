/**
 * Super Admin Dashboard Stats API
 * Returns platform-wide statistics including today's activity
 */

import { NextRequest, NextResponse } from 'next/server'
import { superAdminGuard } from '@/lib/middleware/super-admin-guard'

export async function GET(request: NextRequest) {
  return superAdminGuard(request, async (req, { superAdmin, adminClient }) => {
    // Use adminClient to bypass RLS and get accurate platform-wide stats
    const supabase = adminClient

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
      // Note: credits_balance is stored directly on organizations table
      const { count: activeOrgsCount } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true })
        .gt('credits_balance', 0)

      // Calculate total credits balance across all organizations
      // Note: organizations table has credits_balance column directly
      const { data: orgsWithCredits } = await supabase
        .from('organizations')
        .select('credits_balance')

      const totalCreditsBalance = orgsWithCredits?.reduce((sum, org) => sum + (org.credits_balance || 0), 0) || 0

      // Count organizations with low credits (<10)
      const { count: lowCreditOrgsCount } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true })
        .lt('credits_balance', 10)

      // Calculate total allocated from credit_transactions (bonus/purchase types)
      const { data: allocations } = await supabase
        .from('credit_transactions')
        .select('amount')
        .in('type', ['bonus', 'purchase', 'adjustment'])
        .gt('amount', 0)

      const totalCreditsAllocated = allocations?.reduce((sum, tx) => sum + (tx.amount || 0), 0) || 0

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
          lowCreditOrgsCount: lowCreditOrgsCount || 0,
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
