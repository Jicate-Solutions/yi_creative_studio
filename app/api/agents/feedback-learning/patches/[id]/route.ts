/**
 * Feedback Learning Agent - Individual Patch Management
 *
 * GET /api/agents/feedback-learning/patches/[id] - Get patch details
 * PATCH /api/agents/feedback-learning/patches/[id] - Approve/reject patch
 * POST /api/agents/feedback-learning/patches/[id] - Apply approved patch
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { applyPatch } from '@/lib/services/knowledge-patch'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params
    const supabase = await createClient()

    // Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin role
    const { data: member } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (!member || !['owner', 'admin'].includes(member.role)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Get patch details
    const { data: patch, error } = await (supabase.from as Function)('knowledge_patches')
      .select('*, learned_patterns(*)')
      .eq('id', id)
      .single()

    if (error || !patch) {
      return NextResponse.json({ error: 'Patch not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      patch,
    })
  } catch (error) {
    console.error('[Patch API] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params
    const supabase = await createClient()

    // Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin role
    const { data: member } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (!member || !['owner', 'admin'].includes(member.role)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const action = body.action as 'approve' | 'reject'

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'action must be "approve" or "reject"' },
        { status: 400 }
      )
    }

    // Update patch status
    const newStatus = action === 'approve' ? 'approved' : 'rejected'
    const { data: patch, error } = await (supabase.from as Function)('knowledge_patches')
      .update({
        status: newStatus,
        admin_reviewed_at: new Date().toISOString(),
        admin_reviewed_by: user.id,
        review_notes: body.reviewNotes || null,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[Patch API] Error updating patch:', error)
      return NextResponse.json({ error: 'Failed to update patch' }, { status: 500 })
    }

    // If approved, update the linked learned pattern status
    if (newStatus === 'approved' && patch.learned_pattern_id) {
      await (supabase.from as Function)('learned_patterns')
        .update({ status: 'active' })
        .eq('id', patch.learned_pattern_id)
    } else if (newStatus === 'rejected' && patch.learned_pattern_id) {
      await (supabase.from as Function)('learned_patterns')
        .update({ status: 'deprecated' })
        .eq('id', patch.learned_pattern_id)
    }

    console.log(`[Patch API] Patch ${id} ${action}d by ${user.email}`)

    return NextResponse.json({
      success: true,
      patch,
      action,
    })
  } catch (error) {
    console.error('[Patch API] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params
    const supabase = await createClient()

    // Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin role
    const { data: member } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (!member || !['owner', 'admin'].includes(member.role)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Get patch to verify it's approved
    const { data: patch } = await (supabase.from as Function)('knowledge_patches')
      .select('*')
      .eq('id', id)
      .single()

    if (!patch) {
      return NextResponse.json({ error: 'Patch not found' }, { status: 404 })
    }

    if (patch.status !== 'approved') {
      return NextResponse.json(
        { error: 'Only approved patches can be applied' },
        { status: 400 }
      )
    }

    // Apply the patch
    const result = await applyPatch(id)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to apply patch' },
        { status: 500 }
      )
    }

    console.log(`[Patch API] Patch ${id} applied by ${user.email}`)

    return NextResponse.json({
      success: true,
      message: 'Patch applied successfully',
    })
  } catch (error) {
    console.error('[Patch API] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
