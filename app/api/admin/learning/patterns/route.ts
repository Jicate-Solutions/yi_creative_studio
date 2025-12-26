/**
 * Learning Patterns API
 * GET: List all patterns with effectiveness stats
 * PATCH: Update pattern status (approve/deprecate)
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
    const status = searchParams.get('status') // active, deprecated
    const formatId = searchParams.get('format_id')
    const issueType = searchParams.get('issue_type')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query - using learned_patterns table
    // Note: TypeScript types have 'effectiveness' as Json field
    let query = supabase.from('learned_patterns')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters - status column uses 'active', 'deprecated', 'testing'
    if (status === 'active') {
      query = query.eq('status', 'active')
    } else if (status === 'deprecated') {
      query = query.eq('status', 'deprecated')
    }

    if (formatId) {
      // Format ID would be stored in issue_signature jsonb
      query = query.contains('issue_signature', { format_id: formatId })
    }

    if (issueType) {
      query = query.eq('pattern_type', issueType)
    }

    const { data: patterns, error, count } = await query

    if (error) throw error

    // Calculate effectiveness rate for each pattern
    // effectiveness is a Json field: { times_applied, success_rate, ... }
    type EffectivenessData = { times_applied?: number; success_rate?: number }
    const patternsWithStats = patterns?.map((pattern) => {
      const eff = pattern.effectiveness as EffectivenessData | null
      return {
        ...pattern,
        effectiveness_rate: Math.round((eff?.success_rate ?? 0) * 100),
      }
    }) || []

    return NextResponse.json({
      success: true,
      patterns: patternsWithStats,
      total: count || 0,
      limit,
      offset,
    })
  } catch (error) {
    console.error('[Learning Patterns API] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch patterns' },
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
    const { patternId, action } = body // action: 'activate' | 'deprecate'

    if (!patternId || !action) {
      return NextResponse.json({ error: 'Missing patternId or action' }, { status: 400 })
    }

    const newStatus = action === 'activate' ? 'active' : 'deprecated'

    // Using learned_patterns table with status column
    const { data, error } = await supabase.from('learned_patterns')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', patternId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      pattern: data,
      message: `Pattern ${action === 'activate' ? 'activated' : 'deprecated'} successfully`,
    })
  } catch (error) {
    console.error('[Learning Patterns API] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update pattern' },
      { status: 500 }
    )
  }
}
