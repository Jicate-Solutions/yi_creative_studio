import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Type for credit request (table not yet in generated types)
interface CreditRequestRow {
  id: string
  organization_id: string
  requested_by: string
  package_id: string
  package_name: string
  credits_amount: number
  price_inr: number
  status: string
  rejection_reason?: string
  admin_notes?: string
  reviewed_by?: string
  reviewed_at?: string
  created_at: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is super admin
    const isSuperAdmin = user.user_metadata?.is_super_admin === true

    if (!isSuperAdmin) {
      return NextResponse.json(
        { error: 'Only super admins can approve credit requests' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { requestId, adminNotes } = body

    if (!requestId) {
      return NextResponse.json(
        { error: 'Request ID is required' },
        { status: 400 }
      )
    }

    // Fetch the credit request
    // Note: Using 'any' cast as credit_requests table types need regeneration
    const { data: creditRequest, error: fetchError } = (await supabase
      .from('credit_requests' as any)
      .select('*')
      .eq('id', requestId)
      .single()) as { data: CreditRequestRow | null; error: any }

    if (fetchError || !creditRequest) {
      return NextResponse.json(
        { error: 'Credit request not found' },
        { status: 404 }
      )
    }

    if (creditRequest.status !== 'pending') {
      return NextResponse.json(
        { error: `Request is already ${creditRequest.status}` },
        { status: 400 }
      )
    }

    // Start a transaction: update request status and add credits
    // First, update the request status
    const { error: updateError } = await supabase
      .from('credit_requests' as any)
      .update({
        status: 'approved',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        admin_notes: adminNotes || null,
      })
      .eq('id', requestId)

    if (updateError) {
      console.error('Error updating credit request:', updateError)
      return NextResponse.json(
        { error: 'Failed to update request status' },
        { status: 500 }
      )
    }

    // Add credits to the organization using the existing RPC function
    // Note: RPC returns { new_balance: number } but types may not reflect this
    const { data: creditResult, error: creditError } = await supabase.rpc(
      'add_credits',
      {
        p_organization_id: creditRequest.organization_id,
        p_amount: creditRequest.credits_amount,
        p_amount_inr: creditRequest.price_inr,
        p_payment_id: `credit-request-${requestId}`,
        p_description: `Approved: ${creditRequest.package_name} (${creditRequest.credits_amount} credits)`,
      }
    ) as { data: { new_balance?: number } | null; error: any }

    if (creditError) {
      console.error('Error adding credits:', creditError)
      // Rollback the status update
      await supabase
        .from('credit_requests' as any)
        .update({
          status: 'pending',
          reviewed_by: null,
          reviewed_at: null,
          admin_notes: null,
        })
        .eq('id', requestId)

      return NextResponse.json(
        { error: 'Failed to add credits to organization' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Approved ${creditRequest.credits_amount} credits for organization`,
      newBalance: creditResult?.new_balance,
    })
  } catch (error) {
    console.error('Approve request error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
