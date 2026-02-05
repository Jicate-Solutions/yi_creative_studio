import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CREDIT_PACKAGES } from '@/lib/config/constants'

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

    // Parse request body
    const body = await request.json()
    const { packageId, organizationId } = body

    if (!packageId || !organizationId) {
      return NextResponse.json(
        { error: 'Package ID and Organization ID are required' },
        { status: 400 }
      )
    }

    // Validate package exists
    const creditPackage = CREDIT_PACKAGES.find((p) => p.id === packageId)
    if (!creditPackage) {
      return NextResponse.json({ error: 'Invalid package ID' }, { status: 400 })
    }

    // Verify user is admin of the organization
    const { data: membership, error: memberError } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single()

    if (memberError || !membership) {
      return NextResponse.json(
        { error: 'You are not a member of this organization' },
        { status: 403 }
      )
    }

    if (!['admin', 'owner'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Only organization admins can request credits' },
        { status: 403 }
      )
    }

    // Check if there's already a pending request for this org
    // Note: Using 'any' cast as credit_requests table types need regeneration
    const { data: existingRequest } = (await supabase
      .from('credit_requests' as any)
      .select('id, package_name, credits_amount')
      .eq('organization_id', organizationId)
      .eq('status', 'pending')
      .single()) as { data: { id: string; package_name: string; credits_amount: number } | null; error: any }

    if (existingRequest) {
      return NextResponse.json(
        {
          error: `You already have a pending request for ${existingRequest.package_name} (${existingRequest.credits_amount} credits). Please wait for admin approval or cancel it first.`,
        },
        { status: 400 }
      )
    }

    // Create the credit request
    // Note: Using 'any' cast as credit_requests table types need regeneration
    const { data: request_data, error: insertError } = await supabase
      .from('credit_requests' as any)
      .insert({
        organization_id: organizationId,
        requested_by: user.id,
        package_id: creditPackage.id,
        package_name: creditPackage.name,
        credits_amount: creditPackage.credits,
        price_inr: creditPackage.priceINR,
        status: 'pending',
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating credit request:', insertError)
      return NextResponse.json(
        { error: 'Failed to create credit request' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Credit request submitted for ${creditPackage.name} (${creditPackage.credits} credits). Awaiting admin approval.`,
      request: request_data,
    })
  } catch (error) {
    console.error('Request credits error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET: Fetch credit requests for an organization
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    // Fetch requests for the organization
    // Note: Using 'any' cast as credit_requests table types need regeneration
    const { data: requests, error: fetchError } = await supabase
      .from('credit_requests' as any)
      .select(`
        *,
        requester:requested_by(email, raw_user_meta_data),
        reviewer:reviewed_by(email, raw_user_meta_data)
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('Error fetching credit requests:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch credit requests' },
        { status: 500 }
      )
    }

    return NextResponse.json({ requests })
  } catch (error) {
    console.error('Fetch credit requests error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
