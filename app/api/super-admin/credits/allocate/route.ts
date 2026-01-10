/**
 * Super Admin API: Allocate Credits
 * POST /api/super-admin/credits/allocate
 *
 * Manually allocate credits to an organization
 */

import { NextRequest, NextResponse } from 'next/server'
import { superAdminGuard, getRequestMetadata } from '@/lib/middleware/super-admin-guard'
import { allocateCredits } from '@/lib/services/credit-service'

export async function POST(request: NextRequest) {
  return superAdminGuard(request, async (req, { superAdmin }) => {
    const metadata = getRequestMetadata(req)

    try {
      const body = await req.json()
      const { organization_id, amount, reason, reference_type } = body

      // Validation
      if (!organization_id || !amount || !reason) {
        return NextResponse.json(
          {
            error: 'Missing required fields',
            details: 'organization_id, amount, and reason are required',
          },
          { status: 400 }
        )
      }

      if (amount <= 0) {
        return NextResponse.json(
          { error: 'Invalid amount', details: 'Amount must be greater than 0' },
          { status: 400 }
        )
      }

      // Allocate credits
      const result = await allocateCredits({
        organization_id,
        amount,
        reason,
        allocated_by: superAdmin.id,
        reference_type: reference_type || 'manual_allocation',
        metadata: {
          ...metadata,
          super_admin_email: superAdmin.email,
        },
      })

      return NextResponse.json({
        success: true,
        message: `Successfully allocated ${amount} credits`,
        new_balance: result.new_balance,
        transaction_id: result.transaction_id,
      })
    } catch (error) {
      console.error('[super-admin] Failed to allocate credits:', error)
      return NextResponse.json(
        {
          error: 'Failed to allocate credits',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      )
    }
  })
}
