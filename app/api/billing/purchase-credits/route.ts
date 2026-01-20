/**
 * Credit Purchase API
 *
 * SECURITY: Only organization admins can purchase credits
 * Uses orgAdminGuard middleware for proper role enforcement
 *
 * POST /api/billing/purchase-credits
 * Body: { amount: number, amountINR: number, paymentId: string, description?: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { orgAdminGuard } from '@/lib/middleware/org-admin-guard'

export async function POST(request: NextRequest) {
  return orgAdminGuard(request, async (req, context) => {
    const { organizationId } = context
    const supabase = await createClient()

    const body = await req.json()
    const { amount, amountINR, paymentId, description } = body as {
      amount: number
      amountINR: number
      paymentId: string
      description?: string
    }

    // Validate required fields
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid credit amount' },
        { status: 400 }
      )
    }

    if (!amountINR || amountINR < 0) {
      return NextResponse.json(
        { error: 'Invalid amount in INR' },
        { status: 400 }
      )
    }

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      )
    }

    // Add credits via RPC function
    const { data, error } = await supabase.rpc('add_credits', {
      p_organization_id: organizationId,
      p_amount: amount,
      p_amount_inr: amountINR,
      p_payment_id: paymentId,
      p_description: description || 'Credit purchase',
    })

    if (error) {
      console.error('[billing/purchase-credits] RPC error:', error)
      return NextResponse.json(
        { error: 'Failed to add credits', details: error.message },
        { status: 500 }
      )
    }

    if (!data?.[0]?.success) {
      return NextResponse.json(
        { error: 'Failed to add credits', details: (data?.[0] as any)?.error_message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `${amount} credits added successfully`,
      newBalance: data[0].new_balance,
      transactionId: data[0].transaction_id,
    })
  })
}
