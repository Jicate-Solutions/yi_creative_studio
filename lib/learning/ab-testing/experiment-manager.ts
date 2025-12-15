/**
 * A/B Experiment Manager
 *
 * Manages the lifecycle of A/B experiments for pattern validation:
 * - Create experiments for new/testing patterns
 * - Track experiment status
 * - Handle completion and promotion/deprecation
 */

import type {
  ABExperiment,
  ExperimentStatus,
  ExperimentResults,
  SeededPattern,
} from '@/types/learning.types'

const DEFAULT_TRAFFIC_PERCENTAGE = 0.5
const DEFAULT_MIN_SAMPLES = 100
const DEFAULT_CONFIDENCE_LEVEL = 0.95

interface CreateExperimentOptions {
  name: string
  patternId: string
  description?: string
  trafficPercentage?: number
  minSamples?: number
  confidenceLevel?: number
  createdBy?: string
}

/**
 * Create a new A/B experiment for a pattern
 */
export async function createExperiment(
  options: CreateExperimentOptions
): Promise<ABExperiment | null> {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    // Check if pattern exists
    const { data: pattern } = await (supabase.from as Function)('seeded_patterns')
      .select('id, pattern_key, name')
      .eq('id', options.patternId)
      .single()

    if (!pattern) {
      console.error('[ExperimentManager] Pattern not found:', options.patternId)
      return null
    }

    // Check for existing active experiment for this pattern
    const { data: existing } = await (supabase.from as Function)('ab_experiments')
      .select('id')
      .eq('pattern_id', options.patternId)
      .in('status', ['draft', 'running', 'paused'])
      .single()

    if (existing) {
      console.error('[ExperimentManager] Active experiment already exists for pattern:', options.patternId)
      return null
    }

    // Create experiment
    const { data: experiment, error } = await (supabase.from as Function)('ab_experiments')
      .insert({
        name: options.name,
        description: options.description || `A/B test for pattern: ${pattern.name}`,
        pattern_id: options.patternId,
        traffic_percentage: options.trafficPercentage || DEFAULT_TRAFFIC_PERCENTAGE,
        status: 'draft',
        min_samples: options.minSamples || DEFAULT_MIN_SAMPLES,
        confidence_level: options.confidenceLevel || DEFAULT_CONFIDENCE_LEVEL,
        control_count: 0,
        treatment_count: 0,
        control_avg_rating: 0,
        treatment_avg_rating: 0,
        results: {},
        created_by: options.createdBy,
      })
      .select()
      .single()

    if (error) {
      console.error('[ExperimentManager] Error creating experiment:', error)
      return null
    }

    console.log(`[ExperimentManager] Created experiment ${experiment.id} for pattern ${options.patternId}`)
    return mapDbToExperiment(experiment)
  } catch (error) {
    console.error('[ExperimentManager] Error:', error)
    return null
  }
}

/**
 * Start an experiment (change status from draft to running)
 */
export async function startExperiment(experimentId: string): Promise<boolean> {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const { data: experiment } = await (supabase.from as Function)('ab_experiments')
      .select('status')
      .eq('id', experimentId)
      .single()

    if (!experiment || experiment.status !== 'draft') {
      console.error('[ExperimentManager] Cannot start experiment - invalid status')
      return false
    }

    const { error } = await (supabase.from as Function)('ab_experiments')
      .update({
        status: 'running',
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', experimentId)

    if (error) {
      console.error('[ExperimentManager] Error starting experiment:', error)
      return false
    }

    console.log(`[ExperimentManager] Started experiment ${experimentId}`)
    return true
  } catch (error) {
    console.error('[ExperimentManager] Error:', error)
    return false
  }
}

/**
 * Pause a running experiment
 */
export async function pauseExperiment(experimentId: string): Promise<boolean> {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const { error } = await (supabase.from as Function)('ab_experiments')
      .update({
        status: 'paused',
        updated_at: new Date().toISOString(),
      })
      .eq('id', experimentId)
      .eq('status', 'running')

    if (error) {
      console.error('[ExperimentManager] Error pausing experiment:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('[ExperimentManager] Error:', error)
    return false
  }
}

/**
 * Resume a paused experiment
 */
export async function resumeExperiment(experimentId: string): Promise<boolean> {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const { error } = await (supabase.from as Function)('ab_experiments')
      .update({
        status: 'running',
        updated_at: new Date().toISOString(),
      })
      .eq('id', experimentId)
      .eq('status', 'paused')

    if (error) {
      console.error('[ExperimentManager] Error resuming experiment:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('[ExperimentManager] Error:', error)
    return false
  }
}

/**
 * Complete an experiment with final results
 */
export async function completeExperiment(
  experimentId: string,
  results: ExperimentResults,
  winner: 'control' | 'treatment' | 'inconclusive'
): Promise<boolean> {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const { error } = await (supabase.from as Function)('ab_experiments')
      .update({
        status: 'completed',
        results,
        winner,
        is_significant: results.pValue < 0.05,
        p_value: results.pValue,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', experimentId)

    if (error) {
      console.error('[ExperimentManager] Error completing experiment:', error)
      return false
    }

    console.log(`[ExperimentManager] Completed experiment ${experimentId}, winner: ${winner}`)
    return true
  } catch (error) {
    console.error('[ExperimentManager] Error:', error)
    return false
  }
}

/**
 * Promote a pattern based on experiment results
 */
export async function promoteExperimentPattern(experimentId: string): Promise<boolean> {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    // Get experiment
    const { data: experiment } = await (supabase.from as Function)('ab_experiments')
      .select('pattern_id, status, winner')
      .eq('id', experimentId)
      .single()

    if (!experiment || experiment.status !== 'completed' || experiment.winner !== 'treatment') {
      console.error('[ExperimentManager] Cannot promote - invalid experiment state')
      return false
    }

    // Update experiment status
    await (supabase.from as Function)('ab_experiments')
      .update({
        status: 'promoted',
        promoted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', experimentId)

    // Activate the pattern
    await (supabase.from as Function)('seeded_patterns')
      .update({
        is_active: true,
        source: 'learned',
        updated_at: new Date().toISOString(),
      })
      .eq('id', experiment.pattern_id)

    console.log(`[ExperimentManager] Promoted pattern ${experiment.pattern_id}`)
    return true
  } catch (error) {
    console.error('[ExperimentManager] Error:', error)
    return false
  }
}

/**
 * Deprecate a pattern based on experiment results
 */
export async function deprecateExperimentPattern(experimentId: string): Promise<boolean> {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    // Get experiment
    const { data: experiment } = await (supabase.from as Function)('ab_experiments')
      .select('pattern_id, status, winner')
      .eq('id', experimentId)
      .single()

    if (!experiment || experiment.status !== 'completed') {
      console.error('[ExperimentManager] Cannot deprecate - invalid experiment state')
      return false
    }

    // Update experiment status
    await (supabase.from as Function)('ab_experiments')
      .update({
        status: 'deprecated',
        updated_at: new Date().toISOString(),
      })
      .eq('id', experimentId)

    // Deactivate the pattern
    await (supabase.from as Function)('seeded_patterns')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', experiment.pattern_id)

    console.log(`[ExperimentManager] Deprecated pattern ${experiment.pattern_id}`)
    return true
  } catch (error) {
    console.error('[ExperimentManager] Error:', error)
    return false
  }
}

/**
 * Get experiment by ID
 */
export async function getExperiment(experimentId: string): Promise<ABExperiment | null> {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const { data, error } = await (supabase.from as Function)('ab_experiments')
      .select('*')
      .eq('id', experimentId)
      .single()

    if (error || !data) return null
    return mapDbToExperiment(data)
  } catch (error) {
    console.error('[ExperimentManager] Error:', error)
    return null
  }
}

/**
 * Get all running experiments
 */
export async function getRunningExperiments(): Promise<ABExperiment[]> {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const { data, error } = await (supabase.from as Function)('ab_experiments')
      .select('*')
      .eq('status', 'running')
      .order('created_at', { ascending: false })

    if (error || !data) return []
    return data.map(mapDbToExperiment)
  } catch (error) {
    console.error('[ExperimentManager] Error:', error)
    return []
  }
}

/**
 * Get experiments for a pattern
 */
export async function getExperimentsForPattern(patternId: string): Promise<ABExperiment[]> {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const { data, error } = await (supabase.from as Function)('ab_experiments')
      .select('*')
      .eq('pattern_id', patternId)
      .order('created_at', { ascending: false })

    if (error || !data) return []
    return data.map(mapDbToExperiment)
  } catch (error) {
    console.error('[ExperimentManager] Error:', error)
    return []
  }
}

/**
 * Update experiment metrics from assignment
 */
export async function updateExperimentMetrics(
  experimentId: string,
  variant: 'control' | 'treatment',
  rating?: number
): Promise<void> {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    // Get current experiment
    const { data: experiment } = await (supabase.from as Function)('ab_experiments')
      .select('control_count, treatment_count, control_avg_rating, treatment_avg_rating')
      .eq('id', experimentId)
      .single()

    if (!experiment) return

    let updates: Record<string, unknown> = {}

    if (variant === 'control') {
      const newCount = experiment.control_count + 1
      updates.control_count = newCount

      if (rating !== undefined) {
        // Calculate new average
        const totalRating = experiment.control_avg_rating * experiment.control_count + rating
        updates.control_avg_rating = totalRating / newCount
      }
    } else {
      const newCount = experiment.treatment_count + 1
      updates.treatment_count = newCount

      if (rating !== undefined) {
        const totalRating = experiment.treatment_avg_rating * experiment.treatment_count + rating
        updates.treatment_avg_rating = totalRating / newCount
      }
    }

    updates.updated_at = new Date().toISOString()

    await (supabase.from as Function)('ab_experiments')
      .update(updates)
      .eq('id', experimentId)
  } catch (error) {
    console.error('[ExperimentManager] Error updating metrics:', error)
  }
}

// Helper function to map DB row to ABExperiment type
function mapDbToExperiment(db: Record<string, unknown>): ABExperiment {
  return {
    id: db.id as string,
    name: db.name as string,
    description: db.description as string | undefined,
    patternId: db.pattern_id as string,
    trafficPercentage: db.traffic_percentage as number,
    status: db.status as ExperimentStatus,
    minSamples: db.min_samples as number,
    confidenceLevel: db.confidence_level as number,
    controlCount: db.control_count as number,
    treatmentCount: db.treatment_count as number,
    controlAvgRating: db.control_avg_rating as number,
    treatmentAvgRating: db.treatment_avg_rating as number,
    pValue: db.p_value as number | undefined,
    isSignificant: db.is_significant as boolean,
    winner: db.winner as 'control' | 'treatment' | 'inconclusive' | undefined,
    results: db.results as ExperimentResults,
    startedAt: db.started_at as string | undefined,
    completedAt: db.completed_at as string | undefined,
    promotedAt: db.promoted_at as string | undefined,
    createdBy: db.created_by as string | undefined,
    createdAt: db.created_at as string,
    updatedAt: db.updated_at as string,
  }
}
