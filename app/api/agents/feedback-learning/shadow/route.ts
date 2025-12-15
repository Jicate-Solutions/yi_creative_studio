/**
 * Feedback Learning Agent - Shadow Mode Endpoint
 *
 * POST /api/agents/feedback-learning/shadow
 *   - Run correlation analysis for shadow logs
 *
 * GET /api/agents/feedback-learning/shadow
 *   - Get shadow mode statistics and recent logs
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST - Run shadow mode correlation analysis
 */
export async function POST(request: NextRequest) {
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

    // Parse options
    const body = await request.json().catch(() => ({}))
    const windowHours = body.windowHours || 24

    console.log('[Shadow API] Running correlation analysis...', { windowHours })

    // Run correlation analysis
    const { runCorrelationAnalysis } = await import('@/lib/learning/shadow')
    const result = await runCorrelationAnalysis(windowHours)

    console.log('[Shadow API] Correlation complete:', {
      processed: result.processed,
      correlated: result.correlated,
    })

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error) {
    console.error('[Shadow API] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * GET - Get shadow mode statistics
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
    const limit = parseInt(searchParams.get('limit') || '20')
    const includeUncorrelated = searchParams.get('uncorrelated') === 'true'

    // Get shadow stats
    const { getShadowStats } = await import('@/lib/learning/shadow')
    const stats = await getShadowStats()

    // Get recent shadow logs
    let query = (supabase.from as Function)('shadow_mode_logs')
      .select(`
        id,
        generation_request_id,
        format_id,
        matched_patterns,
        would_have_adjusted,
        prediction_accurate,
        confidence_delta,
        created_at,
        correlated_at
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (!includeUncorrelated) {
      query = query.not('correlated_at', 'is', null)
    }

    const { data: logs, error } = await query

    if (error) {
      console.error('[Shadow API] Error fetching logs:', error)
    }

    // Calculate accuracy metrics
    const correlatedLogs = (logs || []).filter(
      (l: Record<string, unknown>) => l.prediction_accurate !== null
    )
    const accuratePredictions = correlatedLogs.filter(
      (l: Record<string, unknown>) => l.prediction_accurate === true
    )
    const accuracy = correlatedLogs.length > 0
      ? accuratePredictions.length / correlatedLogs.length
      : null

    return NextResponse.json({
      stats,
      accuracy: accuracy !== null ? {
        rate: accuracy,
        correct: accuratePredictions.length,
        total: correlatedLogs.length,
      } : null,
      recentLogs: logs || [],
    })
  } catch (error) {
    console.error('[Shadow API] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
