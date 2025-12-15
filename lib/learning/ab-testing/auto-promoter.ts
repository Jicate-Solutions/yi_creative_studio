/**
 * Auto-Promoter for A/B Experiments
 *
 * Automatically promotes or deprecates patterns based on experiment results.
 * Runs periodically to check experiment status and take action.
 *
 * Conditions for auto-action:
 * - Minimum samples reached
 * - Statistical significance achieved
 * - Clear winner determined
 */

import {
  getRunningExperiments,
  completeExperiment,
  promoteExperimentPattern,
  deprecateExperimentPattern,
  getExperiment,
} from './experiment-manager'
import { analyzeExperiment, checkSignificance } from './statistical-analyzer'
import type { ABExperiment, ExperimentResults } from '@/types/learning.types'

// Thresholds for auto-action
const AUTO_PROMOTE_P_VALUE_THRESHOLD = 0.05
const AUTO_DEPRECATE_P_VALUE_THRESHOLD = 0.05
const MIN_EFFECT_SIZE_FOR_PROMOTION = 0.1 // At least 0.1 rating improvement
const MIN_SAMPLES_FOR_DECISION = 50 // Per variant

interface AutoPromotionResult {
  experimentId: string
  action: 'promoted' | 'deprecated' | 'completed' | 'continue' | 'error'
  reason: string
  results?: ExperimentResults
}

/**
 * Process all running experiments for potential auto-action
 */
export async function processRunningExperiments(): Promise<AutoPromotionResult[]> {
  const results: AutoPromotionResult[] = []

  try {
    const experiments = await getRunningExperiments()

    console.log(`[AutoPromoter] Processing ${experiments.length} running experiments`)

    for (const experiment of experiments) {
      const result = await processExperiment(experiment)
      results.push(result)
    }

    const promoted = results.filter(r => r.action === 'promoted').length
    const deprecated = results.filter(r => r.action === 'deprecated').length
    const completed = results.filter(r => r.action === 'completed').length

    console.log(`[AutoPromoter] Results: ${promoted} promoted, ${deprecated} deprecated, ${completed} completed inconclusive`)

    return results
  } catch (error) {
    console.error('[AutoPromoter] Error processing experiments:', error)
    return results
  }
}

/**
 * Process a single experiment
 */
async function processExperiment(experiment: ABExperiment): Promise<AutoPromotionResult> {
  try {
    // Check if we have enough samples
    const totalSamples = experiment.controlCount + experiment.treatmentCount
    const minSamples = experiment.minSamples

    if (totalSamples < minSamples) {
      return {
        experimentId: experiment.id,
        action: 'continue',
        reason: `Insufficient samples: ${totalSamples}/${minSamples}`,
      }
    }

    // Analyze the experiment
    const analysisResults = await analyzeExperiment(experiment.id)

    if (!analysisResults) {
      return {
        experimentId: experiment.id,
        action: 'continue',
        reason: 'Unable to analyze experiment',
      }
    }

    // Check significance
    const significance = await checkSignificance(experiment.id)

    // Determine action based on results
    return await determineAction(experiment, analysisResults, significance)
  } catch (error) {
    console.error(`[AutoPromoter] Error processing experiment ${experiment.id}:`, error)
    return {
      experimentId: experiment.id,
      action: 'error',
      reason: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Determine what action to take based on experiment results
 */
async function determineAction(
  experiment: ABExperiment,
  results: ExperimentResults,
  significance: { isSignificant: boolean; pValue: number; recommendation: string }
): Promise<AutoPromotionResult> {
  const { isSignificant, pValue, recommendation } = significance
  const { effectSize, treatmentMean, controlMean } = results

  // Not significant yet - check if we should continue or give up
  if (!isSignificant) {
    // If we have enough samples and still no significance, mark as inconclusive
    const totalSamples = results.controlSamples + results.treatmentSamples
    if (totalSamples >= experiment.minSamples * 2) {
      await completeExperiment(experiment.id, results, 'inconclusive')
      return {
        experimentId: experiment.id,
        action: 'completed',
        reason: `No significant difference after ${totalSamples} samples`,
        results,
      }
    }

    return {
      experimentId: experiment.id,
      action: 'continue',
      reason: `Not yet significant (p=${pValue.toFixed(4)})`,
      results,
    }
  }

  // Significant results - determine winner
  const treatmentBetter = treatmentMean > controlMean

  if (treatmentBetter && effectSize >= MIN_EFFECT_SIZE_FOR_PROMOTION) {
    // Treatment wins - promote the pattern
    await completeExperiment(experiment.id, results, 'treatment')
    await promoteExperimentPattern(experiment.id)

    return {
      experimentId: experiment.id,
      action: 'promoted',
      reason: `Treatment significantly better (effect=${effectSize.toFixed(3)}, p=${pValue.toFixed(4)})`,
      results,
    }
  } else if (!treatmentBetter && Math.abs(effectSize) >= MIN_EFFECT_SIZE_FOR_PROMOTION) {
    // Control wins - deprecate the pattern
    await completeExperiment(experiment.id, results, 'control')
    await deprecateExperimentPattern(experiment.id)

    return {
      experimentId: experiment.id,
      action: 'deprecated',
      reason: `Control significantly better (effect=${effectSize.toFixed(3)}, p=${pValue.toFixed(4)})`,
      results,
    }
  } else {
    // Significant but effect size too small
    await completeExperiment(experiment.id, results, 'inconclusive')

    return {
      experimentId: experiment.id,
      action: 'completed',
      reason: `Significant but effect size too small (${effectSize.toFixed(3)})`,
      results,
    }
  }
}

/**
 * Manually trigger promotion for an experiment
 */
export async function manuallyPromote(
  experimentId: string,
  reason: string
): Promise<boolean> {
  try {
    const experiment = await getExperiment(experimentId)
    if (!experiment) return false

    const results = await analyzeExperiment(experimentId)
    if (results) {
      await completeExperiment(experimentId, results, 'treatment')
    }

    await promoteExperimentPattern(experimentId)

    console.log(`[AutoPromoter] Manually promoted experiment ${experimentId}: ${reason}`)
    return true
  } catch (error) {
    console.error('[AutoPromoter] Error in manual promotion:', error)
    return false
  }
}

/**
 * Manually trigger deprecation for an experiment
 */
export async function manuallyDeprecate(
  experimentId: string,
  reason: string
): Promise<boolean> {
  try {
    const experiment = await getExperiment(experimentId)
    if (!experiment) return false

    const results = await analyzeExperiment(experimentId)
    if (results) {
      await completeExperiment(experimentId, results, 'control')
    }

    await deprecateExperimentPattern(experimentId)

    console.log(`[AutoPromoter] Manually deprecated experiment ${experimentId}: ${reason}`)
    return true
  } catch (error) {
    console.error('[AutoPromoter] Error in manual deprecation:', error)
    return false
  }
}

/**
 * Get experiments that are ready for decision
 */
export async function getExperimentsReadyForDecision(): Promise<{
  ready: ABExperiment[]
  needMoreSamples: ABExperiment[]
}> {
  const experiments = await getRunningExperiments()
  const ready: ABExperiment[] = []
  const needMoreSamples: ABExperiment[] = []

  for (const exp of experiments) {
    const totalSamples = exp.controlCount + exp.treatmentCount

    if (totalSamples >= exp.minSamples) {
      const significance = await checkSignificance(exp.id)
      if (significance.isSignificant) {
        ready.push(exp)
      } else {
        needMoreSamples.push(exp)
      }
    } else {
      needMoreSamples.push(exp)
    }
  }

  return { ready, needMoreSamples }
}

/**
 * Get summary statistics for all experiments
 */
export async function getExperimentsSummary(): Promise<{
  total: number
  running: number
  promoted: number
  deprecated: number
  inconclusive: number
  averageEffectSize: number
}> {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const { data: experiments } = await (supabase.from as Function)('ab_experiments')
      .select('status, results')

    if (!experiments) {
      return {
        total: 0,
        running: 0,
        promoted: 0,
        deprecated: 0,
        inconclusive: 0,
        averageEffectSize: 0,
      }
    }

    const running = experiments.filter((e: { status: string }) => e.status === 'running').length
    const promoted = experiments.filter((e: { status: string }) => e.status === 'promoted').length
    const deprecated = experiments.filter((e: { status: string }) => e.status === 'deprecated').length
    const inconclusive = experiments.filter((e: { status: string }) => e.status === 'completed').length

    const effectSizes = experiments
      .filter((e: { results?: { effectSize?: number } }) => e.results?.effectSize !== undefined)
      .map((e: { results: { effectSize: number } }) => Math.abs(e.results.effectSize))

    const avgEffectSize = effectSizes.length > 0
      ? effectSizes.reduce((a: number, b: number) => a + b, 0) / effectSizes.length
      : 0

    return {
      total: experiments.length,
      running,
      promoted,
      deprecated,
      inconclusive,
      averageEffectSize: avgEffectSize,
    }
  } catch (error) {
    console.error('[AutoPromoter] Error getting summary:', error)
    return {
      total: 0,
      running: 0,
      promoted: 0,
      deprecated: 0,
      inconclusive: 0,
      averageEffectSize: 0,
    }
  }
}
