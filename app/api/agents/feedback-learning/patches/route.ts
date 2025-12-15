/**
 * Feedback Learning Agent - Patches List Endpoint
 *
 * GET /api/agents/feedback-learning/patches - List pending patches
 * POST /api/agents/feedback-learning/patches - Create new patch (manual)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
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
      .select('role, organization_id')
      .eq('user_id', user.id)
      .single()

    if (!member || !['owner', 'admin'].includes(member.role)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Parse query params
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'pending'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get patches
    const { data: patches, error, count } = await (supabase.from as Function)('knowledge_patches')
      .select('*, learned_patterns(id, pattern_type, issue_signature, confidence)', { count: 'exact' })
      .eq('status', status)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('[Patches API] Error fetching patches:', error)
      return NextResponse.json({ error: 'Failed to fetch patches' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      patches: patches || [],
      total: count || 0,
      limit,
      offset,
    })
  } catch (error) {
    console.error('[Patches API] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
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
      .select('role, organization_id')
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

    if (!body.target_file || !body.proposed_content || !body.patch_type) {
      return NextResponse.json(
        { error: 'target_file, proposed_content, and patch_type are required' },
        { status: 400 }
      )
    }

    // Create manual patch
    const { data: patch, error } = await (supabase.from as Function)('knowledge_patches')
      .insert({
        target_file: body.target_file,
        patch_type: body.patch_type,
        original_content: body.original_content,
        proposed_content: body.proposed_content,
        reasoning: body.reasoning || 'Manual patch created by admin',
        status: 'pending',
        auto_generated: false,
        feedback_ids: body.feedback_ids || [],
        feedback_count: body.feedback_ids?.length || 0,
        pattern_confidence: body.confidence || 1.0,
      })
      .select()
      .single()

    if (error) {
      console.error('[Patches API] Error creating patch:', error)
      return NextResponse.json({ error: 'Failed to create patch' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      patch,
    })
  } catch (error) {
    console.error('[Patches API] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
