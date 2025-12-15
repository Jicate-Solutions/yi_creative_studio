/**
 * Checkpoint Manager for Rollback Safety
 *
 * Creates and manages checkpoints before making changes to:
 * - Pattern activations/deprecations
 * - Experiment promotions
 * - Bulk updates
 * - Cache refreshes
 */

import type {
  RollbackCheckpoint,
  CheckpointType,
  CheckpointEntityType,
  RollbackRequest,
  RollbackResult,
} from '@/types/learning.types'

/**
 * Create a checkpoint before making changes
 */
export async function createCheckpoint(
  checkpointType: CheckpointType,
  entityType: CheckpointEntityType,
  entityId: string | undefined,
  previousState: unknown,
  newState: unknown,
  options?: {
    reason?: string
    createdBy?: string
    organizationId?: string
    qualityScoreBefore?: number
  }
): Promise<string | null> {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const { data, error } = await (supabase.from as Function)('rollback_checkpoints')
      .insert({
        checkpoint_type: checkpointType,
        entity_type: entityType,
        entity_id: entityId,
        previous_state: previousState,
        new_state: newState,
        changes_summary: generateChangesSummary(previousState, newState),
        reason: options?.reason,
        created_by: options?.createdBy,
        organization_id: options?.organizationId,
        quality_score_before: options?.qualityScoreBefore,
      })
      .select('id')
      .single()

    if (error) {
      console.error('[Checkpoint] Error creating:', error)
      return null
    }

    console.log(`[Checkpoint] Created ${checkpointType} checkpoint: ${data.id}`)
    return data.id
  } catch (error) {
    console.error('[Checkpoint] Error:', error)
    return null
  }
}

/**
 * Execute rollback for a checkpoint
 */
export async function rollback(request: RollbackRequest): Promise<RollbackResult> {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    // Get checkpoint
    const { data: checkpoint, error: fetchError } = await (supabase.from as Function)('rollback_checkpoints')
      .select('*')
      .eq('id', request.checkpointId)
      .single()

    if (fetchError || !checkpoint) {
      return {
        success: false,
        checkpointId: request.checkpointId,
        restoredState: null,
        affectedEntities: [],
        message: 'Checkpoint not found',
      }
    }

    if (checkpoint.rolled_back && !request.force) {
      return {
        success: false,
        checkpointId: request.checkpointId,
        restoredState: null,
        affectedEntities: [],
        message: 'Checkpoint already rolled back',
      }
    }

    // Restore previous state based on entity type
    const affectedEntities: string[] = []
    let restoreError: string | null = null

    switch (checkpoint.entity_type) {
      case 'seeded_pattern':
        if (checkpoint.entity_id) {
          const { error } = await (supabase.from as Function)('seeded_patterns')
            .update(checkpoint.previous_state)
            .eq('id', checkpoint.entity_id)
          if (error) restoreError = error.message
          else affectedEntities.push(checkpoint.entity_id)
        }
        break

      case 'success_pattern':
        if (checkpoint.entity_id) {
          const { error } = await (supabase.from as Function)('success_patterns')
            .update(checkpoint.previous_state)
            .eq('id', checkpoint.entity_id)
          if (error) restoreError = error.message
          else affectedEntities.push(checkpoint.entity_id)
        }
        break

      case 'ab_experiment':
        if (checkpoint.entity_id) {
          const { error } = await (supabase.from as Function)('ab_experiments')
            .update(checkpoint.previous_state)
            .eq('id', checkpoint.entity_id)
          if (error) restoreError = error.message
          else affectedEntities.push(checkpoint.entity_id)
        }
        break

      case 'pattern_cache':
        // Invalidate cache to force refresh
        const { invalidatePatternCache } = await import('../cache/pattern-cache')
        invalidatePatternCache()
        affectedEntities.push('pattern_cache')
        break
    }

    if (restoreError) {
      return {
        success: false,
        checkpointId: request.checkpointId,
        restoredState: checkpoint.previous_state,
        affectedEntities,
        message: `Rollback failed: ${restoreError}`,
      }
    }

    // Mark checkpoint as rolled back
    await (supabase.from as Function)('rollback_checkpoints')
      .update({
        rolled_back: true,
        rolled_back_at: new Date().toISOString(),
        rollback_reason: request.reason,
      })
      .eq('id', request.checkpointId)

    console.log(`[Checkpoint] Rolled back: ${request.checkpointId}`)

    return {
      success: true,
      checkpointId: request.checkpointId,
      restoredState: checkpoint.previous_state,
      affectedEntities,
      message: 'Rollback successful',
    }
  } catch (error) {
    console.error('[Checkpoint] Rollback error:', error)
    return {
      success: false,
      checkpointId: request.checkpointId,
      restoredState: null,
      affectedEntities: [],
      message: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get recent checkpoints
 */
export async function getRecentCheckpoints(
  limit: number = 20,
  includeRolledBack: boolean = false
): Promise<RollbackCheckpoint[]> {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    let query = (supabase.from as Function)('rollback_checkpoints')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (!includeRolledBack) {
      query = query.eq('rolled_back', false)
    }

    const { data, error } = await query

    if (error) {
      console.error('[Checkpoint] Error fetching:', error)
      return []
    }

    return (data || []).map(mapDbToCheckpoint)
  } catch (error) {
    console.error('[Checkpoint] Error:', error)
    return []
  }
}

/**
 * Clean up old checkpoints
 */
export async function cleanupExpiredCheckpoints(): Promise<number> {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const { data, error } = await (supabase.from as Function)('rollback_checkpoints')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .select('id')

    if (error) {
      console.error('[Checkpoint] Cleanup error:', error)
      return 0
    }

    const count = data?.length || 0
    if (count > 0) {
      console.log(`[Checkpoint] Cleaned up ${count} expired checkpoints`)
    }
    return count
  } catch (error) {
    console.error('[Checkpoint] Error:', error)
    return 0
  }
}

// Helper functions

function generateChangesSummary(previous: unknown, next: unknown): string {
  try {
    const prevObj = previous as Record<string, unknown>
    const nextObj = next as Record<string, unknown>

    const changes: string[] = []

    for (const key of Object.keys(nextObj)) {
      if (JSON.stringify(prevObj[key]) !== JSON.stringify(nextObj[key])) {
        changes.push(`${key}: ${JSON.stringify(prevObj[key])} → ${JSON.stringify(nextObj[key])}`)
      }
    }

    return changes.slice(0, 5).join('; ') + (changes.length > 5 ? '...' : '')
  } catch {
    return 'Unable to generate summary'
  }
}

function mapDbToCheckpoint(db: Record<string, unknown>): RollbackCheckpoint {
  return {
    id: db.id as string,
    checkpointType: db.checkpoint_type as CheckpointType,
    entityType: db.entity_type as CheckpointEntityType,
    entityId: db.entity_id as string | undefined,
    previousState: db.previous_state,
    newState: db.new_state,
    changesSummary: db.changes_summary as string | undefined,
    reason: db.reason as string | undefined,
    createdBy: db.created_by as string | undefined,
    organizationId: db.organization_id as string | undefined,
    qualityScoreBefore: db.quality_score_before as number | undefined,
    qualityScoreAfter: db.quality_score_after as number | undefined,
    rolledBack: db.rolled_back as boolean,
    rolledBackAt: db.rolled_back_at as string | undefined,
    rolledBackBy: db.rolled_back_by as string | undefined,
    rollbackReason: db.rollback_reason as string | undefined,
    expiresAt: db.expires_at as string,
    createdAt: db.created_at as string,
  }
}
