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

    // Build query
    let query = (supabase.from as Function)('learning_patterns')
      .select('*', { count: 'exact' })
      .order('success_count', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (status === 'active') {
      query = query.eq('is_active', true)
    } else if (status === 'deprecated') {
      query = query.eq('is_active', false)
    }

    if (formatId) {
      query = query.eq('format_id', formatId)
    }

    if (issueType) {
      query = query.eq('issue_type', issueType)
    }

    const { data: patterns, error, count } = await query

    if (error) throw error

    // Calculate effectiveness rate for each pattern
    const patternsWithStats = patterns?.map((pattern: { application_count?: number; success_count?: number }) => ({
      ...pattern,
      effectiveness_rate: (pattern.application_count ?? 0) > 0
        ? Math.round(((pattern.success_count ?? 0) / (pattern.application_count ?? 1)) * 100)
        : 0,
    })) || []

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

    const isActive = action === 'activate'

    const { data, error } = await (supabase.from as Function)('learning_patterns')
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq('id', patternId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      pattern: data,
      message: `Pattern ${isActive ? 'activated' : 'deprecated'} successfully`,
    })
  } catch (error) {
    console.error('[Learning Patterns API] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update pattern' },
      { status: 500 }
    )
  }
}
