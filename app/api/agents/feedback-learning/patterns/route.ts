/**
 * Feedback Learning Agent - Patterns Management Endpoint
 *
 * GET /api/agents/feedback-learning/patterns
 *   - List all active patterns
 *
 * POST /api/agents/feedback-learning/patterns
 *   - Create new pattern manually
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET - List patterns
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get query params
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const isActive = searchParams.get('active') !== 'false'
    const limit = parseInt(searchParams.get('limit') || '50')

    // Build query
    let query = (supabase.from as Function)('seeded_patterns')
      .select(`
        id,
        pattern_key,
        category,
        name,
        description,
        issue_signature,
        fix_mapping,
        source,
        confidence,
        is_active,
        times_applied,
        success_rate,
        last_applied_at,
        created_at,
        updated_at
      `)
      .order('confidence', { ascending: false })
      .limit(limit)

    if (category) {
      query = query.eq('category', category)
    }

    if (isActive) {
      query = query.eq('is_active', true)
    }

    const { data: patterns, error } = await query

    if (error) {
      console.error('[Patterns API] Error fetching patterns:', error)
      return NextResponse.json(
        { error: 'Failed to fetch patterns' },
        { status: 500 }
      )
    }

    // Get cache stats
    const { patternCache } = await import('@/lib/learning')
    const cacheStats = {
      isWarm: patternCache.isWarm(),
      totalInCache: patternCache.getActivePatternCount(),
    }

    // Calculate stats by category
    const stats = {
      total: patterns?.length || 0,
      byCategory: {} as Record<string, number>,
      avgConfidence: 0,
    }

    let totalConfidence = 0
    for (const pattern of patterns || []) {
      stats.byCategory[pattern.category] =
        (stats.byCategory[pattern.category] || 0) + 1
      totalConfidence += pattern.confidence || 0
    }
    stats.avgConfidence = stats.total > 0 ? totalConfidence / stats.total : 0

    return NextResponse.json({
      cache: cacheStats,
      stats,
      patterns: patterns?.map(p => ({
        id: p.id,
        patternKey: p.pattern_key,
        category: p.category,
        name: p.name,
        description: p.description,
        issueSignature: p.issue_signature,
        fixMapping: p.fix_mapping,
        source: p.source,
        confidence: p.confidence,
        isActive: p.is_active,
        timesApplied: p.times_applied,
        successRate: p.success_rate,
        lastAppliedAt: p.last_applied_at,
        createdAt: p.created_at,
      })) || [],
    })
  } catch (error) {
    console.error('[Patterns API] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * POST - Create new pattern
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Auth check - admin only
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check admin status
    const { data: member } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (member?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Parse pattern data
    const body = await request.json()

    if (!body.patternKey || !body.category || !body.name || !body.issueSignature || !body.fixMapping) {
      return NextResponse.json(
        { error: 'patternKey, category, name, issueSignature, and fixMapping are required' },
        { status: 400 }
      )
    }

    console.log('[Patterns API] Creating pattern:', body.name)

    // Create pattern
    const { data: pattern, error } = await (supabase.from as Function)('seeded_patterns')
      .insert({
        pattern_key: body.patternKey,
        category: body.category,
        name: body.name,
        description: body.description || '',
        issue_signature: body.issueSignature,
        fix_mapping: body.fixMapping,
        source: body.source || 'manual',
        confidence: body.confidence || 0.8,
        is_active: body.isActive !== false,
      })
      .select()
      .single()

    if (error) {
      console.error('[Patterns API] Error creating pattern:', error)
      return NextResponse.json(
        { error: 'Failed to create pattern' },
        { status: 500 }
      )
    }

    // Refresh cache
    const { patternCache } = await import('@/lib/learning')
    await patternCache.refresh()

    console.log('[Patterns API] Pattern created:', pattern.id)

    return NextResponse.json({
      success: true,
      pattern: {
        id: pattern.id,
        patternKey: pattern.pattern_key,
        name: pattern.name,
        category: pattern.category,
      },
      cacheRefreshed: true,
    })
  } catch (error) {
    console.error('[Patterns API] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
