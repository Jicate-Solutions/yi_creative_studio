/**
 * Feedback Learning Agent - Rollback Safety Endpoint
 *
 * POST /api/agents/feedback-learning/rollback
 *   - Execute rollback for a checkpoint
 *
 * GET /api/agents/feedback-learning/rollback
 *   - Get recent checkpoints
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST - Execute rollback
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

    // Parse request
    const body = await request.json()

    if (!body.checkpointId) {
      return NextResponse.json(
        { error: 'checkpointId is required' },
        { status: 400 }
      )
    }

    console.log('[Rollback API] Executing rollback for checkpoint:', body.checkpointId)

    // Execute rollback
    const { rollback } = await import('@/lib/learning/rollback')
    const result = await rollback({
      checkpointId: body.checkpointId,
      reason: body.reason || 'Manual rollback via API',
      force: body.force === true,
    })

    console.log('[Rollback API] Rollback result:', {
      success: result.success,
      affectedEntities: result.affectedEntities.length,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('[Rollback API] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * GET - Get recent checkpoints
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
    const includeRolledBack = searchParams.get('rolledBack') === 'true'

    // Get checkpoints
    const { getRecentCheckpoints } = await import('@/lib/learning/rollback')
    const checkpoints = await getRecentCheckpoints(limit, includeRolledBack)

    // Calculate stats
    const stats = {
      total: checkpoints.length,
      available: checkpoints.filter(c => !c.rolledBack).length,
      rolledBack: checkpoints.filter(c => c.rolledBack).length,
      byType: {} as Record<string, number>,
    }

    for (const checkpoint of checkpoints) {
      stats.byType[checkpoint.checkpointType] =
        (stats.byType[checkpoint.checkpointType] || 0) + 1
    }

    return NextResponse.json({
      stats,
      checkpoints: checkpoints.map(c => ({
        id: c.id,
        checkpointType: c.checkpointType,
        entityType: c.entityType,
        entityId: c.entityId,
        changesSummary: c.changesSummary,
        reason: c.reason,
        createdBy: c.createdBy,
        rolledBack: c.rolledBack,
        rolledBackAt: c.rolledBackAt,
        rollbackReason: c.rollbackReason,
        expiresAt: c.expiresAt,
        createdAt: c.createdAt,
      })),
    })
  } catch (error) {
    console.error('[Rollback API] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
