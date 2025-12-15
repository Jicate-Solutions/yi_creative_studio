/**
 * Feedback Learning Agent - A/B Experiments Endpoint
 *
 * POST /api/agents/feedback-learning/experiments
 *   - Create new experiment
 *
 * GET /api/agents/feedback-learning/experiments
 *   - List experiments with optional filters
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST - Create new A/B experiment
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

    // Parse experiment data
    const body = await request.json()

    if (!body.patternId || !body.name) {
      return NextResponse.json(
        { error: 'patternId and name are required' },
        { status: 400 }
      )
    }

    console.log('[Experiments API] Creating experiment:', body.name)

    // Create experiment
    const { createExperiment } = await import('@/lib/learning/ab-testing')
    const experiment = await createExperiment({
      patternId: body.patternId,
      name: body.name,
      description: body.description,
      trafficPercentage: body.trafficPercentage || 0.5,
      minSamples: body.minSamples || 100,
      confidenceLevel: body.confidenceLevel || 0.95,
      organizationId: body.organizationId,
    })

    if (!experiment) {
      return NextResponse.json(
        { error: 'Failed to create experiment' },
        { status: 500 }
      )
    }

    console.log('[Experiments API] Created experiment:', experiment.id)

    return NextResponse.json({
      success: true,
      experiment,
    })
  } catch (error) {
    console.error('[Experiments API] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * GET - List experiments
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
    const status = searchParams.get('status') // running, completed, etc.
    const limit = parseInt(searchParams.get('limit') || '20')
    const includeResults = searchParams.get('results') === 'true'

    // Build query
    let query = (supabase.from as Function)('ab_experiments')
      .select(`
        id,
        name,
        description,
        pattern_id,
        status,
        traffic_percentage,
        min_samples,
        confidence_level,
        control_samples,
        treatment_samples,
        results,
        created_at,
        started_at,
        completed_at
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (status) {
      query = query.eq('status', status)
    }

    const { data: experiments, error } = await query

    if (error) {
      console.error('[Experiments API] Error fetching experiments:', error)
      return NextResponse.json(
        { error: 'Failed to fetch experiments' },
        { status: 500 }
      )
    }

    // Get active experiments count
    const { getActiveExperiments } = await import('@/lib/learning/ab-testing')
    const activeExperiments = await getActiveExperiments()

    // Calculate summary stats
    const stats = {
      total: experiments?.length || 0,
      active: activeExperiments.length,
      byStatus: {} as Record<string, number>,
    }

    for (const exp of experiments || []) {
      const s = exp.status as string
      stats.byStatus[s] = (stats.byStatus[s] || 0) + 1
    }

    return NextResponse.json({
      experiments: experiments?.map(exp => ({
        id: exp.id,
        name: exp.name,
        description: exp.description,
        patternId: exp.pattern_id,
        status: exp.status,
        trafficPercentage: exp.traffic_percentage,
        minSamples: exp.min_samples,
        confidenceLevel: exp.confidence_level,
        samples: {
          control: exp.control_samples || 0,
          treatment: exp.treatment_samples || 0,
          total: (exp.control_samples || 0) + (exp.treatment_samples || 0),
        },
        results: includeResults ? exp.results : undefined,
        createdAt: exp.created_at,
        startedAt: exp.started_at,
        completedAt: exp.completed_at,
      })) || [],
      stats,
    })
  } catch (error) {
    console.error('[Experiments API] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
