import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Type for credit request (table not yet in generated types)
interface CreditRequestRow {
  id: string
  organization_id: string
  status: string
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
        { error: 'Only super admins can reject credit requests' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { requestId, rejectionReason } = body

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

    // Update the request status to rejected
    const { error: updateError } = await supabase
      .from('credit_requests' as any)
      .update({
        status: 'rejected',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        rejection_reason: rejectionReason || 'No reason provided',
      })
      .eq('id', requestId)

    if (updateError) {
      console.error('Error rejecting credit request:', updateError)
      return NextResponse.json(
        { error: 'Failed to reject request' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Credit request rejected`,
    })
  } catch (error) {
    console.error('Reject request error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
