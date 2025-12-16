/**
 * Learning Patches API
 * GET: List pending patches awaiting review
 * PATCH: Approve/reject a patch
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get search params for filtering
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'pending' // pending, applied, rejected
    const formatId = searchParams.get('format_id')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    let query = (supabase.from as Function)('learning_patch_queue')
      .select(`
        *,
        source_feedback:creative_feedback(
          id,
          feedback_type,
          feedback_text,
          creative_id
        )
      `, { count: 'exact' })
      .eq('status', status)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (formatId) {
      query = query.eq('format_id', formatId)
    }

    const { data: patches, error, count } = await query

    if (error) throw error

    return NextResponse.json({
      success: true,
      patches: patches || [],
      total: count || 0,
      limit,
      offset,
    })
  } catch (error) {
    console.error('[Learning Patches API] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch patches' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { patchId, action, notes } = body // action: 'approve' | 'reject'

    if (!patchId || !action) {
      return NextResponse.json({ error: 'Missing patchId or action' }, { status: 400 })
    }

    // Get the patch details
    const { data: patch, error: fetchError } = await (supabase.from as Function)('learning_patch_queue')
      .select('*')
      .eq('id', patchId)
      .single()

    if (fetchError || !patch) {
      return NextResponse.json({ error: 'Patch not found' }, { status: 404 })
    }

    if (action === 'approve') {
      // Create a new pattern from the approved patch
      const { data: newPattern, error: patternError } = await (supabase.from as Function)('learning_patterns')
        .insert({
          organization_id: patch.organization_id,
          format_id: patch.format_id,
          issue_type: patch.issue_type,
          issue_pattern: patch.issue_pattern,
          prevention_strategy: patch.prevention_strategy,
          confidence: patch.confidence,
          is_active: true,
          application_count: 0,
          success_count: 0,
          source_feedback_ids: [patch.source_feedback_id],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (patternError) throw patternError

      // Update patch status
      const { error: updateError } = await (supabase.from as Function)('learning_patch_queue')
        .update({
          status: 'applied',
          applied_pattern_id: newPattern.id,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          review_notes: notes || null,
        })
        .eq('id', patchId)

      if (updateError) throw updateError

      return NextResponse.json({
        success: true,
        message: 'Patch approved and pattern created',
        pattern: newPattern,
      })
    } else if (action === 'reject') {
      // Update patch status to rejected
      const { error: updateError } = await (supabase.from as Function)('learning_patch_queue')
        .update({
          status: 'rejected',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          review_notes: notes || null,
        })
        .eq('id', patchId)

      if (updateError) throw updateError

      return NextResponse.json({
        success: true,
        message: 'Patch rejected',
      })
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('[Learning Patches API] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process patch' },
      { status: 500 }
    )
  }
}
