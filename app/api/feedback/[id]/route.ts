import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { FeedbackStatus, FeedbackPriority, UpdateFeedbackRequest } from '@/types/feedback'

// Valid status values
const VALID_STATUSES: FeedbackStatus[] = ['new', 'reviewed', 'acknowledged', 'resolved', 'archived']
const VALID_PRIORITIES: FeedbackPriority[] = ['low', 'normal', 'high', 'urgent']

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/feedback/[id]
 * Fetch a single feedback item with related data
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch feedback with joined data
    const { data: feedback, error } = await (supabase.from as Function)('creative_feedback')
      .select(`
        *,
        creatives:creative_id (id, title, thumbnail_url, image_url),
        user_profiles:user_id (id, full_name, avatar_url)
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Feedback fetch error:', error)
      return NextResponse.json({ error: 'Feedback not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: feedback })
  } catch (error) {
    console.error('Feedback GET error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

/**
 * PATCH /api/feedback/[id]
 * Update feedback status, priority, or add admin response
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has admin/manager permissions
    const { data: member } = await supabase
      .from('organization_members')
      .select('role, organization_id')
      .eq('user_id', user.id)
      .single()

    if (!member || !['admin', 'owner', 'manager'].includes(member.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body: UpdateFeedbackRequest = await request.json()
    const { status, priority, admin_response } = body

    // Validate status if provided
    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate priority if provided
    if (priority && !VALID_PRIORITIES.includes(priority)) {
      return NextResponse.json(
        { error: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}` },
        { status: 400 }
      )
    }

    // Build update object
    const updateData: Record<string, unknown> = {}
    if (status) updateData.status = status
    if (priority) updateData.priority = priority
    if (admin_response !== undefined) {
      updateData.admin_response = admin_response
      updateData.responded_by = user.id
      updateData.responded_at = new Date().toISOString()
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    // Update the feedback
    const { data: feedback, error } = await (supabase.from as Function)('creative_feedback')
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', member.organization_id)
      .select()
      .single()

    if (error) {
      console.error('Feedback update error:', error)
      return NextResponse.json({ error: 'Failed to update feedback' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: feedback })
  } catch (error) {
    console.error('Feedback PATCH error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

/**
 * DELETE /api/feedback/[id]
 * Soft delete (archive) feedback
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has admin/manager permissions
    const { data: member } = await supabase
      .from('organization_members')
      .select('role, organization_id')
      .eq('user_id', user.id)
      .single()

    if (!member || !['admin', 'owner'].includes(member.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Soft delete by setting status to archived
    const { data: feedback, error } = await (supabase.from as Function)('creative_feedback')
      .update({ status: 'archived' })
      .eq('id', id)
      .eq('organization_id', member.organization_id)
      .select()
      .single()

    if (error) {
      console.error('Feedback delete error:', error)
      return NextResponse.json({ error: 'Failed to archive feedback' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: feedback })
  } catch (error) {
    console.error('Feedback DELETE error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
