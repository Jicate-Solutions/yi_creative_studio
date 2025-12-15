/**
 * Feedback Learning Agent - Single Experiment Endpoint
 *
 * GET /api/agents/feedback-learning/experiments/[id]
 *   - Get experiment details with results
 *
 * PATCH /api/agents/feedback-learning/experiments/[id]
 *   - Update experiment (pause, resume, promote, deprecate)
 *
 * DELETE /api/agents/feedback-learning/experiments/[id]
 *   - Delete experiment
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type RouteContext = {
  params: Promise<{ id: string }>
}

/**
 * GET - Get experiment details with full results
 */
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
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Analyze experiment to get latest results
    const { analyzeExperiment, checkSignificance } = await import('@/lib/learning/ab-testing')
    const results = await analyzeExperiment(id)

    if (!results) {
      return NextResponse.json(
        { error: 'Experiment not found' },
        { status: 404 }
      )
    }

    // Check significance
    const significance = await checkSignificance(id)

    // Get experiment details
    const { data: experiment, error } = await (supabase.from as Function)('ab_experiments')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !experiment) {
      return NextResponse.json(
        { error: 'Experiment not found' },
        { status: 404 }
      )
    }

    // Get recent assignments
    const { data: assignments } = await (supabase.from as Function)('ab_assignments')
      .select('id, variant, feedback_rating, created_at')
      .eq('experiment_id', id)
      .order('created_at', { ascending: false })
      .limit(20)

    return NextResponse.json({
      experiment: {
        id: experiment.id,
        name: experiment.name,
        description: experiment.description,
        patternId: experiment.pattern_id,
        status: experiment.status,
        trafficPercentage: experiment.traffic_percentage,
        minSamples: experiment.min_samples,
        confidenceLevel: experiment.confidence_level,
        createdAt: experiment.created_at,
        startedAt: experiment.started_at,
        completedAt: experiment.completed_at,
      },
      results: {
        controlSamples: results.controlSamples,
        treatmentSamples: results.treatmentSamples,
        controlMean: results.controlMean,
        treatmentMean: results.treatmentMean,
        controlStdDev: results.controlStdDev,
        treatmentStdDev: results.treatmentStdDev,
        effectSize: results.effectSize,
        pValue: results.pValue,
        isSignificant: results.isSignificant,
        confidenceInterval: results.confidenceInterval,
        recommendation: results.recommendation,
      },
      significance,
      recentAssignments: assignments || [],
    })
  } catch (error) {
    console.error('[Experiment API] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH - Update experiment status
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params
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

    // Parse action
    const body = await request.json()
    const action = body.action as string

    if (!action) {
      return NextResponse.json(
        { error: 'action is required' },
        { status: 400 }
      )
    }

    console.log('[Experiment API] Action:', action, 'on experiment:', id)

    let result: unknown
    switch (action) {
      case 'pause': {
        const { error } = await (supabase.from as Function)('ab_experiments')
          .update({ status: 'paused' })
          .eq('id', id)
        if (error) throw error
        result = { status: 'paused' }
        break
      }

      case 'resume': {
        const { error } = await (supabase.from as Function)('ab_experiments')
          .update({ status: 'running' })
          .eq('id', id)
        if (error) throw error
        result = { status: 'running' }
        break
      }

      case 'promote': {
        const { promoteExperiment } = await import('@/lib/learning/ab-testing')
        const promoted = await promoteExperiment(id)
        result = { promoted, status: promoted ? 'promoted' : 'failed' }
        break
      }

      case 'deprecate': {
        const { deprecateExperiment } = await import('@/lib/learning/ab-testing')
        const deprecated = await deprecateExperiment(id)
        result = { deprecated, status: deprecated ? 'deprecated' : 'failed' }
        break
      }

      case 'complete': {
        const { error } = await (supabase.from as Function)('ab_experiments')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
          })
          .eq('id', id)
        if (error) throw error
        result = { status: 'completed' }
        break
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      experimentId: id,
      action,
      result,
    })
  } catch (error) {
    console.error('[Experiment API] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Delete experiment
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params
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

    console.log('[Experiment API] Deleting experiment:', id)

    // Delete assignments first
    await (supabase.from as Function)('ab_assignments')
      .delete()
      .eq('experiment_id', id)

    // Delete experiment
    const { error } = await (supabase.from as Function)('ab_experiments')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete experiment' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      deleted: id,
    })
  } catch (error) {
    console.error('[Experiment API] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
