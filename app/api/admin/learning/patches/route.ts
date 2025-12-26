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

    // Build query - using knowledge_patches table (actual table name)
    let query = supabase.from('knowledge_patches')
      .select(`
        *,
        learned_pattern:learned_patterns(
          id,
          pattern_type,
          issue_signature,
          confidence
        )
      `, { count: 'exact' })
      .eq('status', status)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (formatId) {
      query = query.eq('target_file', formatId)
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

    // Get the patch details - using knowledge_patches table
    const { data: patch, error: fetchError } = await supabase.from('knowledge_patches')
      .select('*')
      .eq('id', patchId)
      .single()

    if (fetchError || !patch) {
      return NextResponse.json({ error: 'Patch not found' }, { status: 404 })
    }

    if (action === 'approve') {
      // Create a new pattern from the approved patch - using learned_patterns table
      // Note: effectiveness is a Json field that stores { times_applied, success_rate, ... }
      const { data: newPattern, error: patternError } = await supabase.from('learned_patterns')
        .insert({
          pattern_type: patch.patch_type || 'issue',
          issue_signature: {
            target_file: patch.target_file,
            original_content: patch.original_content,
          },
          fix_mapping: {
            proposed_content: patch.proposed_content,
            reasoning: patch.reasoning,
          },
          confidence: patch.pattern_confidence || 0.7,
          status: 'active',
          effectiveness: { times_applied: 0, success_rate: 0 },
          created_from_feedback_ids: patch.feedback_ids || [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (patternError) throw patternError

      // Update patch status - use admin_reviewed_by/at columns (per TypeScript types)
      const { error: updateError } = await supabase.from('knowledge_patches')
        .update({
          status: 'applied',
          learned_pattern_id: newPattern.id,
          admin_reviewed_by: user.id,
          admin_reviewed_at: new Date().toISOString(),
          review_notes: notes || null,
          applied_at: new Date().toISOString(),
        })
        .eq('id', patchId)

      if (updateError) throw updateError

      return NextResponse.json({
        success: true,
        message: 'Patch approved and pattern created',
        pattern: newPattern,
      })
    } else if (action === 'reject') {
      // Update patch status to rejected - use admin_reviewed_by/at columns
      const { error: updateError } = await supabase.from('knowledge_patches')
        .update({
          status: 'rejected',
          admin_reviewed_by: user.id,
          admin_reviewed_at: new Date().toISOString(),
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
