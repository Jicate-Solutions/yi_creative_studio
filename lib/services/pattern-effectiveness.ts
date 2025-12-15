/**
 * Pattern Effectiveness Service
 *
 * Tracks the effectiveness of learned patterns by correlating:
 * - Prevention actions (patterns that were applied)
 * - Subsequent user feedback (did the prevention help?)
 *
 * Patterns that consistently fail to prevent issues are auto-deprecated.
 */

import { createClient } from '@/lib/supabase/server'
import {
  PATTERN_DEPRECATION_THRESHOLD,
  MIN_APPLICATIONS_FOR_EVALUATION,
} from '@/types/feedback-agent.types'

/**
 * Update effectiveness metrics for patterns that were applied
 * during a creative generation, based on the resulting feedback.
 *
 * Called when user submits feedback for a creative that had prevention applied.
 *
 * @param preventionActionId - The ID of the prevention action
 * @param rating - User's rating (1-5)
 */
export async function updatePatternEffectivenessFromFeedback(
  preventionActionId: string,
  rating: number
): Promise<void> {
  const supabase = await createClient()

  try {
    // Get the prevention action to find which patterns were applied
    const { data: action } = await (supabase.from as Function)('prevention_actions')
      .select('matched_patterns, was_effective')
      .eq('id', preventionActionId)
      .single()

    if (!action || !action.matched_patterns?.length) {
      console.log('[Pattern Effectiveness] No patterns to update for action:', preventionActionId)
      return
    }

    // Determine if the prevention was effective based on rating
    // Rating > 3 = effective, rating <= 3 = not effective
    const wasEffective = rating > 3

    // Update the prevention action with effectiveness
    await (supabase.from as Function)('prevention_actions')
      .update({
        was_effective: wasEffective,
        feedback_rating: rating,
      })
      .eq('id', preventionActionId)

    // Update each pattern's effectiveness metrics
    for (const patternId of action.matched_patterns) {
      await updatePatternMetrics(patternId, wasEffective)
    }

    console.log('[Pattern Effectiveness] Updated', action.matched_patterns.length, 'patterns. Effective:', wasEffective)
  } catch (error) {
    console.error('[Pattern Effectiveness] Error updating from feedback:', error)
  }
}

/**
 * Update a single pattern's effectiveness metrics
 */
async function updatePatternMetrics(
  patternId: string,
  wasEffective: boolean
): Promise<void> {
  const supabase = await createClient()

  try {
    // Get current pattern metrics
    const { data: pattern } = await (supabase.from as Function)('learned_patterns')
      .select('times_applied, success_rate')
      .eq('id', patternId)
      .single()

    if (!pattern) return

    const currentApplied = pattern.times_applied || 0
    const currentSuccessRate = pattern.success_rate || 0

    // Calculate new success rate (rolling average)
    const newApplied = currentApplied + 1
    const successCount = Math.round(currentSuccessRate * currentApplied) + (wasEffective ? 1 : 0)
    const newSuccessRate = successCount / newApplied

    // Calculate feedback improvement (simplified - would need more data for real calculation)
    const feedbackImprovement = wasEffective ? 0.1 : -0.1

    // Update pattern metrics
    await (supabase.from as Function)('learned_patterns')
      .update({
        times_applied: newApplied,
        success_rate: newSuccessRate,
        feedback_improvement: feedbackImprovement,
        last_evaluated: new Date().toISOString(),
      })
      .eq('id', patternId)

  } catch (error) {
    console.error('[Pattern Effectiveness] Error updating pattern metrics:', error)
  }
}

/**
 * Deprecate patterns that have a success rate below the threshold
 * after being applied a minimum number of times.
 *
 * Should be called periodically (e.g., daily cron job) or after analyze mode.
 */
export async function deprecateIneffectivePatterns(): Promise<{
  deprecated: number
  evaluated: number
}> {
  const supabase = await createClient()

  try {
    // Find patterns that have been applied enough times to evaluate
    // and have a success rate below the deprecation threshold
    const { data: patternsToDeprecate } = await (supabase.from as Function)('learned_patterns')
      .select('id, times_applied, success_rate')
      .eq('status', 'active')
      .gte('times_applied', MIN_APPLICATIONS_FOR_EVALUATION)
      .lt('success_rate', PATTERN_DEPRECATION_THRESHOLD)

    if (!patternsToDeprecate?.length) {
      return { deprecated: 0, evaluated: 0 }
    }

    // Deprecate the ineffective patterns
    const patternIds = patternsToDeprecate.map((p: { id: string }) => p.id)
    await (supabase.from as Function)('learned_patterns')
      .update({
        status: 'deprecated',
        updated_at: new Date().toISOString(),
      })
      .in('id', patternIds)

    console.log('[Pattern Effectiveness] Deprecated', patternIds.length, 'ineffective patterns')

    return {
      deprecated: patternIds.length,
      evaluated: patternsToDeprecate.length,
    }
  } catch (error) {
    console.error('[Pattern Effectiveness] Error deprecating patterns:', error)
    return { deprecated: 0, evaluated: 0 }
  }
}

/**
 * Get effectiveness statistics for all patterns
 */
export async function getPatternEffectivenessStats(): Promise<{
  total: number
  active: number
  testing: number
  deprecated: number
  avgSuccessRate: number
  totalApplications: number
}> {
  const supabase = await createClient()

  try {
    const { data: patterns } = await (supabase.from as Function)('learned_patterns')
      .select('status, times_applied, success_rate')

    if (!patterns?.length) {
      return {
        total: 0,
        active: 0,
        testing: 0,
        deprecated: 0,
        avgSuccessRate: 0,
        totalApplications: 0,
      }
    }

    const stats = patterns.reduce(
      (acc: {
        active: number
        testing: number
        deprecated: number
        totalSuccessRate: number
        totalApplications: number
        patternsWithApplications: number
      }, p: { status: string; times_applied: number; success_rate: number }) => {
        if (p.status === 'active') acc.active++
        else if (p.status === 'testing') acc.testing++
        else if (p.status === 'deprecated') acc.deprecated++

        acc.totalApplications += p.times_applied || 0
        if (p.times_applied > 0) {
          acc.totalSuccessRate += p.success_rate || 0
          acc.patternsWithApplications++
        }
        return acc
      },
      { active: 0, testing: 0, deprecated: 0, totalSuccessRate: 0, totalApplications: 0, patternsWithApplications: 0 }
    )

    return {
      total: patterns.length,
      active: stats.active,
      testing: stats.testing,
      deprecated: stats.deprecated,
      avgSuccessRate: stats.patternsWithApplications > 0
        ? stats.totalSuccessRate / stats.patternsWithApplications
        : 0,
      totalApplications: stats.totalApplications,
    }
  } catch (error) {
    console.error('[Pattern Effectiveness] Error getting stats:', error)
    return {
      total: 0,
      active: 0,
      testing: 0,
      deprecated: 0,
      avgSuccessRate: 0,
      totalApplications: 0,
    }
  }
}

/**
 * Activate a testing pattern after admin approval
 * This is called when a patch is approved and applied
 */
export async function activatePattern(patternId: string): Promise<boolean> {
  const supabase = await createClient()

  try {
    const { error } = await (supabase.from as Function)('learned_patterns')
      .update({
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', patternId)

    if (error) {
      console.error('[Pattern Effectiveness] Error activating pattern:', error)
      return false
    }

    console.log('[Pattern Effectiveness] Activated pattern:', patternId)
    return true
  } catch (error) {
    console.error('[Pattern Effectiveness] Error activating pattern:', error)
    return false
  }
}
