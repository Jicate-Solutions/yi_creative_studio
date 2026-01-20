/**
 * Super Admin Credits Organizations API
 * Returns all organizations with their credit information
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { superAdminGuard } from '@/lib/middleware/super-admin-guard'

export async function GET(request: NextRequest) {
  return superAdminGuard(request, async (req, { superAdmin }) => {
    const supabase = await createClient()

    // Parse query parameters
    const searchParams = req.nextUrl.searchParams
    const search = searchParams.get('search') || ''

    try {
      // Fetch organizations with their credit balances
      const { data: orgsData, error: orgsError } = await supabase
        .from('organizations')
        .select('id, name, credits_balance, created_at')
        .order('credits_balance', { ascending: false })

      if (orgsError) {
        throw orgsError
      }

      // Get credit transaction summaries per organization
      const { data: transactionSummaries } = await supabase
        .from('credit_transactions')
        .select('organization_id, type, amount')

      // Calculate totals per organization
      const orgTotals: Record<string, { allocated: number; consumed: number; purchased: number; lastTransaction: string | null }> = {}

      transactionSummaries?.forEach((txn) => {
        if (!txn.organization_id) return

        if (!orgTotals[txn.organization_id]) {
          orgTotals[txn.organization_id] = { allocated: 0, consumed: 0, purchased: 0, lastTransaction: null }
        }

        if (txn.type === 'purchase') {
          orgTotals[txn.organization_id].purchased += txn.amount || 0
        } else if (txn.type === 'allocation' || txn.type === 'bonus') {
          orgTotals[txn.organization_id].allocated += txn.amount || 0
        } else if (txn.type === 'usage' || txn.type === 'consumption') {
          orgTotals[txn.organization_id].consumed += Math.abs(txn.amount || 0)
        }
      })

      // Format results
      let organizations = orgsData?.map((org) => {
        const totals = orgTotals[org.id] || { allocated: 0, consumed: 0, purchased: 0 }
        return {
          organization_id: org.id,
          organization_name: org.name || 'Unknown',
          balance: org.credits_balance || 0,
          total_allocated: totals.allocated,
          total_consumed: totals.consumed,
          total_purchased: totals.purchased,
        }
      }) || []

      // Apply search filter
      if (search) {
        const searchLower = search.toLowerCase()
        organizations = organizations.filter((org) =>
          org.organization_name.toLowerCase().includes(searchLower) ||
          org.organization_id.toLowerCase().includes(searchLower)
        )
      }

      return NextResponse.json({
        success: true,
        organizations,
      })
    } catch (error) {
      console.error('Failed to fetch organization credits:', error)
      return NextResponse.json(
        { error: 'Failed to fetch organization credits' },
        { status: 500 }
      )
    }
  })
}
