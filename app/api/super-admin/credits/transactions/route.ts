/**
 * Super Admin API: Credit Transactions
 * GET /api/super-admin/credits/transactions
 *
 * Retrieve credit transaction history with filtering and pagination
 */

import { NextRequest, NextResponse } from 'next/server'
import { superAdminGuard } from '@/lib/middleware/super-admin-guard'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  return superAdminGuard(request, async (req) => {
    const supabase = await createClient()
    const { searchParams } = new URL(req.url)

    // Query parameters
    const organization_id = searchParams.get('organization_id')
    const type = searchParams.get('type') // 'allocation', 'consumption', 'refund', etc.
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '50')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const offset = (page - 1) * pageSize

    try {
      // Build query
      let query = supabase
        .from('credit_transactions')
        .select(
          `
          *,
          organizations(id, name)
        `,
          { count: 'exact' }
        )
        .order('created_at', { ascending: false })

      // Filters
      if (organization_id) {
        query = query.eq('organization_id', organization_id)
      }

      if (type) {
        query = query.eq('type', type)
      }

      if (startDate) {
        query = query.gte('created_at', startDate)
      }

      if (endDate) {
        query = query.lte('created_at', endDate)
      }

      // Pagination
      query = query.range(offset, offset + pageSize - 1)

      const { data: transactions, error, count } = await query

      if (error) {
        console.error('[super-admin] Failed to fetch transactions:', error)
        return NextResponse.json(
          { error: 'Failed to fetch transactions', details: error.message },
          { status: 500 }
        )
      }

      // Format transactions
      const formattedTransactions = transactions?.map((txn) => ({
        id: txn.id,
        organization_id: txn.organization_id,
        organization_name: (txn.organizations as any)?.name || 'Unknown',
        type: txn.type,
        amount: txn.amount,
        balance_before: txn.balance_before,
        balance_after: txn.balance_after,
        reason: txn.reason,
        reference_type: txn.reference_type,
        reference_id: txn.reference_id,
        metadata: txn.metadata,
        created_at: txn.created_at,
        created_by: txn.created_by,
      }))

      return NextResponse.json({
        success: true,
        transactions: formattedTransactions || [],
        pagination: {
          page,
          pageSize,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / pageSize),
        },
      })
    } catch (error) {
      console.error('[super-admin] Exception fetching transactions:', error)
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
