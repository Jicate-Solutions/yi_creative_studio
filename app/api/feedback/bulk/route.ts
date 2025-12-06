import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { FeedbackStatus, FeedbackPriority, BulkFeedbackRequest, BulkFeedbackResponse } from '@/types/feedback'

// Valid values for validation
const VALID_STATUSES: FeedbackStatus[] = ['new', 'reviewed', 'acknowledged', 'resolved', 'archived']
const VALID_PRIORITIES: FeedbackPriority[] = ['low', 'normal', 'high', 'urgent']

/**
 * POST /api/feedback/bulk
 * Bulk update status, priority, or archive multiple feedback items
 */
export async function POST(request: NextRequest) {
  try {
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

    const body: BulkFeedbackRequest = await request.json()
    const { feedbackIds, action, value } = body

    // Validate request
    if (!feedbackIds || !Array.isArray(feedbackIds) || feedbackIds.length === 0) {
      return NextResponse.json(
        { error: 'feedbackIds must be a non-empty array' },
        { status: 400 }
      )
    }

    if (!action || !['status', 'priority', 'archive'].includes(action)) {
      return NextResponse.json(
        { error: 'action must be one of: status, priority, archive' },
        { status: 400 }
      )
    }

    // Validate value based on action
    if (action === 'status' && !VALID_STATUSES.includes(value as FeedbackStatus)) {
      return NextResponse.json(
        { error: `Invalid status value. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      )
    }

    if (action === 'priority' && !VALID_PRIORITIES.includes(value as FeedbackPriority)) {
      return NextResponse.json(
        { error: `Invalid priority value. Must be one of: ${VALID_PRIORITIES.join(', ')}` },
        { status: 400 }
      )
    }

    // Build update object based on action
    let updateData: Record<string, unknown> = {}

    switch (action) {
      case 'status':
        updateData = { status: value }
        break
      case 'priority':
        updateData = { priority: value }
        break
      case 'archive':
        updateData = { status: 'archived' }
        break
    }

    // Perform bulk update
    const { data: updated, error } = await (supabase.from as Function)('creative_feedback')
      .update(updateData)
      .in('id', feedbackIds)
      .eq('organization_id', member.organization_id)
      .select('id')

    if (error) {
      console.error('Bulk feedback update error:', error)
      return NextResponse.json(
        { error: 'Failed to update feedback items' },
        { status: 500 }
      )
    }

    const response: BulkFeedbackResponse = {
      success: true,
      updated: updated?.length || 0,
      failed: feedbackIds.length - (updated?.length || 0),
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Bulk feedback API error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
