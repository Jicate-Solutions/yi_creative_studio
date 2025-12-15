/**
 * A/B Traffic Router
 *
 * Deterministically assigns users to experiment variants based on a hash
 * of user ID, organization ID, and experiment ID.
 *
 * Key properties:
 * - Same user always gets same variant for a given experiment
 * - Traffic split is configurable per experiment
 * - No external state needed for assignment
 */

import type {
  ABExperiment,
  TrafficRoutingResult,
  ExperimentVariant,
  ABAssignment,
  SeededPattern,
} from '@/types/learning.types'
import { createHash } from 'crypto'
import { getRunningExperiments, updateExperimentMetrics } from './experiment-manager'

/**
 * Route a request to an experiment variant
 * Returns the experiment and variant if matched, null if no experiment applies
 */
export async function routeToExperiment(
  patternId: string,
  organizationId?: string,
  userId?: string
): Promise<TrafficRoutingResult | null> {
  try {
    // Get running experiments for this pattern
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const { data: experiments } = await (supabase.from as Function)('ab_experiments')
      .select('*')
      .eq('pattern_id', patternId)
      .eq('status', 'running')
      .single()

    if (!experiments) return null

    const experiment = experiments as {
      id: string
      traffic_percentage: number
      pattern_id: string
    }

    // Generate deterministic hash for assignment
    const assignmentHash = generateAssignmentHash(
      experiment.id,
      organizationId,
      userId
    )

    // Convert hash to 0-1 range
    const hashValue = hashToFloat(assignmentHash)

    // Determine variant based on traffic percentage
    const variant: ExperimentVariant = hashValue < experiment.traffic_percentage
      ? 'treatment'
      : 'control'

    // Get the pattern if treatment
    let patternToApply: SeededPattern | undefined
    if (variant === 'treatment') {
      const { data: pattern } = await (supabase.from as Function)('seeded_patterns')
        .select('*')
        .eq('id', patternId)
        .single()

      if (pattern) {
        patternToApply = mapDbToPattern(pattern)
      }
    }

    return {
      experimentId: experiment.id,
      variant,
      assignmentHash,
      patternToApply,
    }
  } catch (error) {
    console.error('[TrafficRouter] Error routing:', error)
    return null
  }
}

/**
 * Route request considering multiple potential pattern matches
 */
export async function routeRequestToExperiments(
  matchedPatternIds: string[],
  organizationId?: string,
  userId?: string
): Promise<TrafficRoutingResult[]> {
  const results: TrafficRoutingResult[] = []

  for (const patternId of matchedPatternIds) {
    const result = await routeToExperiment(patternId, organizationId, userId)
    if (result) {
      results.push(result)
    }
  }

  return results
}

/**
 * Record an A/B assignment
 */
export async function recordAssignment(
  experimentId: string,
  variant: ExperimentVariant,
  assignmentHash: string,
  creativeId?: string,
  organizationId?: string,
  userId?: string,
  patternApplied: boolean = false,
  adjustmentsMade: unknown[] = []
): Promise<string | null> {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const { data: assignment, error } = await (supabase.from as Function)('ab_assignments')
      .insert({
        experiment_id: experimentId,
        creative_id: creativeId,
        organization_id: organizationId,
        user_id: userId,
        variant,
        pattern_applied: patternApplied,
        adjustments_made: adjustmentsMade,
        assignment_hash: assignmentHash,
      })
      .select('id')
      .single()

    if (error) {
      console.error('[TrafficRouter] Error recording assignment:', error)
      return null
    }

    // Update experiment metrics
    await updateExperimentMetrics(experimentId, variant)

    return assignment.id
  } catch (error) {
    console.error('[TrafficRouter] Error:', error)
    return null
  }
}

/**
 * Record feedback for an assignment
 */
export async function recordAssignmentFeedback(
  assignmentId: string,
  feedbackId: string,
  rating: number
): Promise<boolean> {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    // Get assignment to find experiment
    const { data: assignment } = await (supabase.from as Function)('ab_assignments')
      .select('experiment_id, variant')
      .eq('id', assignmentId)
      .single()

    if (!assignment) return false

    // Update assignment with feedback
    await (supabase.from as Function)('ab_assignments')
      .update({
        feedback_id: feedbackId,
        feedback_rating: rating,
        feedback_received_at: new Date().toISOString(),
      })
      .eq('id', assignmentId)

    // Update experiment metrics with rating
    await updateExperimentMetrics(assignment.experiment_id, assignment.variant, rating)

    return true
  } catch (error) {
    console.error('[TrafficRouter] Error recording feedback:', error)
    return false
  }
}

/**
 * Find assignment by creative ID
 */
export async function findAssignmentByCreative(
  creativeId: string
): Promise<ABAssignment | null> {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const { data, error } = await (supabase.from as Function)('ab_assignments')
      .select('*')
      .eq('creative_id', creativeId)
      .single()

    if (error || !data) return null
    return mapDbToAssignment(data)
  } catch (error) {
    console.error('[TrafficRouter] Error:', error)
    return null
  }
}

/**
 * Get assignment statistics for an experiment
 */
export async function getAssignmentStats(experimentId: string): Promise<{
  controlCount: number
  treatmentCount: number
  controlWithFeedback: number
  treatmentWithFeedback: number
  controlAvgRating: number
  treatmentAvgRating: number
  controlRatings: number[]
  treatmentRatings: number[]
}> {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const { data: assignments } = await (supabase.from as Function)('ab_assignments')
      .select('variant, feedback_rating')
      .eq('experiment_id', experimentId)

    if (!assignments) {
      return {
        controlCount: 0,
        treatmentCount: 0,
        controlWithFeedback: 0,
        treatmentWithFeedback: 0,
        controlAvgRating: 0,
        treatmentAvgRating: 0,
        controlRatings: [],
        treatmentRatings: [],
      }
    }

    const controlAssignments = assignments.filter((a: { variant: string }) => a.variant === 'control')
    const treatmentAssignments = assignments.filter((a: { variant: string }) => a.variant === 'treatment')

    const controlRatings = controlAssignments
      .filter((a: { feedback_rating: number | null }) => a.feedback_rating !== null)
      .map((a: { feedback_rating: number }) => a.feedback_rating)

    const treatmentRatings = treatmentAssignments
      .filter((a: { feedback_rating: number | null }) => a.feedback_rating !== null)
      .map((a: { feedback_rating: number }) => a.feedback_rating)

    const controlAvg = controlRatings.length > 0
      ? controlRatings.reduce((a: number, b: number) => a + b, 0) / controlRatings.length
      : 0

    const treatmentAvg = treatmentRatings.length > 0
      ? treatmentRatings.reduce((a: number, b: number) => a + b, 0) / treatmentRatings.length
      : 0

    return {
      controlCount: controlAssignments.length,
      treatmentCount: treatmentAssignments.length,
      controlWithFeedback: controlRatings.length,
      treatmentWithFeedback: treatmentRatings.length,
      controlAvgRating: controlAvg,
      treatmentAvgRating: treatmentAvg,
      controlRatings,
      treatmentRatings,
    }
  } catch (error) {
    console.error('[TrafficRouter] Error getting stats:', error)
    return {
      controlCount: 0,
      treatmentCount: 0,
      controlWithFeedback: 0,
      treatmentWithFeedback: 0,
      controlAvgRating: 0,
      treatmentAvgRating: 0,
      controlRatings: [],
      treatmentRatings: [],
    }
  }
}

// Helper functions

/**
 * Generate a deterministic hash for experiment assignment
 */
function generateAssignmentHash(
  experimentId: string,
  organizationId?: string,
  userId?: string
): string {
  const input = `${experimentId}:${organizationId || 'global'}:${userId || 'anonymous'}`
  return createHash('md5').update(input).digest('hex')
}

/**
 * Convert a hex hash string to a float between 0 and 1
 */
function hashToFloat(hash: string): number {
  // Take first 8 characters of hash and convert to number
  const num = parseInt(hash.substring(0, 8), 16)
  // Normalize to 0-1 range
  return num / 0xffffffff
}

function mapDbToPattern(db: Record<string, unknown>): SeededPattern {
  return {
    id: db.id as string,
    patternKey: db.pattern_key as string,
    category: db.category as SeededPattern['category'],
    name: db.name as string,
    description: db.description as string,
    issueSignature: db.issue_signature as SeededPattern['issueSignature'],
    fixMapping: db.fix_mapping as SeededPattern['fixMapping'],
    source: db.source as SeededPattern['source'],
    confidence: db.confidence as number,
    isActive: db.is_active as boolean,
    version: db.version as number,
    formatIds: db.format_ids as string[],
    organizationId: db.organization_id as string | undefined,
    timesApplied: db.times_applied as number,
    successRate: db.success_rate as number,
    lastAppliedAt: db.last_applied_at as string | undefined,
    createdAt: db.created_at as string,
    updatedAt: db.updated_at as string,
  }
}

function mapDbToAssignment(db: Record<string, unknown>): ABAssignment {
  return {
    id: db.id as string,
    experimentId: db.experiment_id as string,
    creativeId: db.creative_id as string | undefined,
    organizationId: db.organization_id as string | undefined,
    userId: db.user_id as string | undefined,
    variant: db.variant as ExperimentVariant,
    patternApplied: db.pattern_applied as boolean,
    adjustmentsMade: db.adjustments_made as ABAssignment['adjustmentsMade'],
    feedbackId: db.feedback_id as string | undefined,
    feedbackRating: db.feedback_rating as number | undefined,
    feedbackReceivedAt: db.feedback_received_at as string | undefined,
    assignmentHash: db.assignment_hash as string,
    createdAt: db.created_at as string,
  }
}
