/**
 * Correlation Analyzer
 *
 * Links shadow mode logs to user feedback to validate pattern predictions.
 * Determines if "would have prevented" was accurate based on actual feedback.
 *
 * Logic:
 * - If shadow predicted adjustment + feedback rating > 3: prediction was wrong (false positive)
 * - If shadow predicted adjustment + feedback rating <= 3: prediction was right (true positive)
 * - If shadow predicted no adjustment + feedback rating > 3: correct non-intervention (true negative)
 * - If shadow predicted no adjustment + feedback rating <= 3: missed opportunity (false negative)
 */

import type {
  ShadowModeLog,
  ShadowCorrelationResult,
  PatternConfidenceAdjustment,
} from '@/types/learning.types'
import { getUncorrelatedShadowLogs } from './shadow-mode'

// Rating threshold - ratings above this are considered "good"
const GOOD_RATING_THRESHOLD = 3

// Confidence adjustment amounts
const CONFIDENCE_BOOST = 0.05 // Increase confidence for accurate predictions
const CONFIDENCE_PENALTY = -0.08 // Decrease confidence for inaccurate predictions
const MIN_CONFIDENCE = 0.1
const MAX_CONFIDENCE = 1.0

/**
 * Run correlation analysis for uncorrelated shadow logs
 */
export async function runCorrelationAnalysis(
  windowHours: number = 24
): Promise<{
  processed: number
  correlated: number
  results: ShadowCorrelationResult[]
}> {
  const results: ShadowCorrelationResult[] = []

  try {
    // Get uncorrelated shadow logs
    const logs = await getUncorrelatedShadowLogs(windowHours)

    if (logs.length === 0) {
      return { processed: 0, correlated: 0, results: [] }
    }

    // Get feedback for linked creatives
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const creativeIds = logs
      .map(l => l.creativeId)
      .filter((id): id is string => !!id)

    if (creativeIds.length === 0) {
      return { processed: logs.length, correlated: 0, results: [] }
    }

    // Fetch feedback for these creatives
    const { data: feedback } = await (supabase.from as Function)('creative_feedback')
      .select('id, creative_id, rating')
      .in('creative_id', creativeIds)

    if (!feedback || feedback.length === 0) {
      return { processed: logs.length, correlated: 0, results: [] }
    }

    // Build feedback map
    const feedbackMap = new Map<string, { id: string; rating: number }[]>()
    for (const f of feedback) {
      const existing = feedbackMap.get(f.creative_id) || []
      existing.push({ id: f.id, rating: f.rating })
      feedbackMap.set(f.creative_id, existing)
    }

    // Correlate each log
    for (const log of logs) {
      if (!log.creativeId) continue

      const creativeFeedback = feedbackMap.get(log.creativeId)
      if (!creativeFeedback || creativeFeedback.length === 0) continue

      // Use the latest feedback for this creative
      const latestFeedback = creativeFeedback[creativeFeedback.length - 1]

      const result = await correlateLogWithFeedback(
        supabase,
        log,
        latestFeedback.id,
        latestFeedback.rating
      )

      if (result) {
        results.push(result)
      }
    }

    console.log(`[Correlation] Processed ${logs.length} logs, correlated ${results.length}`)

    return {
      processed: logs.length,
      correlated: results.length,
      results,
    }
  } catch (error) {
    console.error('[Correlation] Error running analysis:', error)
    return { processed: 0, correlated: 0, results: [] }
  }
}

/**
 * Correlate a single shadow log with feedback
 */
async function correlateLogWithFeedback(
  supabase: unknown,
  log: ShadowModeLog,
  feedbackId: string,
  feedbackRating: number
): Promise<ShadowCorrelationResult | null> {
  try {
    // Determine if prediction was accurate
    const isGoodRating = feedbackRating > GOOD_RATING_THRESHOLD
    const predictedAdjustment = log.wouldHaveAdjusted

    /*
     * Prediction accuracy matrix:
     * - Predicted adjustment + bad rating = TRUE POSITIVE (correct)
     * - Predicted adjustment + good rating = FALSE POSITIVE (wrong)
     * - No prediction + good rating = TRUE NEGATIVE (correct)
     * - No prediction + bad rating = FALSE NEGATIVE (missed)
     */
    let predictionAccurate: boolean
    let confidenceDelta: number

    if (predictedAdjustment && !isGoodRating) {
      // True positive - we would have helped
      predictionAccurate = true
      confidenceDelta = CONFIDENCE_BOOST
    } else if (predictedAdjustment && isGoodRating) {
      // False positive - we would have intervened unnecessarily
      predictionAccurate = false
      confidenceDelta = CONFIDENCE_PENALTY
    } else if (!predictedAdjustment && isGoodRating) {
      // True negative - correctly didn't intervene
      predictionAccurate = true
      confidenceDelta = 0 // No change for correct non-intervention
    } else {
      // False negative - should have intervened
      predictionAccurate = false
      confidenceDelta = CONFIDENCE_PENALTY * 0.5 // Smaller penalty for missed detection
    }

    // Calculate pattern-level adjustments
    const patternsToAdjust = await calculatePatternAdjustments(
      supabase,
      log.matchedPatterns,
      predictionAccurate,
      confidenceDelta
    )

    // Update shadow log with correlation
    await ((supabase as { from: Function }).from as Function)('shadow_mode_logs')
      .update({
        feedback_id: feedbackId,
        feedback_rating: feedbackRating,
        prediction_accurate: predictionAccurate,
        confidence_delta: confidenceDelta,
        correlated_at: new Date().toISOString(),
        correlation_notes: predictionAccurate
          ? `Prediction validated (rating: ${feedbackRating})`
          : `Prediction incorrect (rating: ${feedbackRating})`,
      })
      .eq('id', log.id)

    // Apply pattern confidence adjustments
    await applyPatternConfidenceAdjustments(supabase, patternsToAdjust)

    return {
      logId: log.id,
      feedbackId,
      feedbackRating,
      predictionAccurate,
      confidenceDelta,
      patternsToAdjust,
    }
  } catch (error) {
    console.error('[Correlation] Error correlating log:', error)
    return null
  }
}

/**
 * Calculate confidence adjustments for patterns
 */
async function calculatePatternAdjustments(
  supabase: unknown,
  matchedPatterns: Array<{ patternId: string; confidence: number }>,
  predictionAccurate: boolean,
  baseDelta: number
): Promise<PatternConfidenceAdjustment[]> {
  const adjustments: PatternConfidenceAdjustment[] = []

  if (matchedPatterns.length === 0 || baseDelta === 0) {
    return adjustments
  }

  // Get current pattern confidences
  const patternIds = matchedPatterns.map(p => p.patternId)
  const { data: patterns } = await ((supabase as { from: Function }).from as Function)('seeded_patterns')
    .select('id, confidence')
    .in('id', patternIds)

  if (!patterns) return adjustments

  const confidenceMap = new Map(
    patterns.map((p: { id: string; confidence: number }) => [p.id, p.confidence])
  )

  for (const pattern of matchedPatterns) {
    const currentConfidence = confidenceMap.get(pattern.patternId)
    if (currentConfidence === undefined) continue

    // Scale delta by pattern's match confidence
    const scaledDelta = baseDelta * (pattern.confidence / 1.0)
    let newConfidence = currentConfidence + scaledDelta

    // Clamp to valid range
    newConfidence = Math.max(MIN_CONFIDENCE, Math.min(MAX_CONFIDENCE, newConfidence))

    if (newConfidence !== currentConfidence) {
      adjustments.push({
        patternId: pattern.patternId,
        previousConfidence: currentConfidence,
        newConfidence,
        reason: predictionAccurate
          ? 'Accurate prediction boosted confidence'
          : 'Inaccurate prediction reduced confidence',
      })
    }
  }

  return adjustments
}

/**
 * Apply confidence adjustments to patterns
 */
async function applyPatternConfidenceAdjustments(
  supabase: unknown,
  adjustments: PatternConfidenceAdjustment[]
): Promise<void> {
  for (const adj of adjustments) {
    try {
      await ((supabase as { from: Function }).from as Function)('seeded_patterns')
        .update({
          confidence: adj.newConfidence,
          updated_at: new Date().toISOString(),
        })
        .eq('id', adj.patternId)

      console.log(`[Correlation] Updated pattern ${adj.patternId}: ${adj.previousConfidence.toFixed(3)} -> ${adj.newConfidence.toFixed(3)}`)
    } catch (error) {
      console.error(`[Correlation] Failed to update pattern ${adj.patternId}:`, error)
    }
  }
}

/**
 * Get correlation statistics
 */
export async function getCorrelationStats(): Promise<{
  totalCorrelated: number
  truePositives: number
  falsePositives: number
  trueNegatives: number
  falseNegatives: number
  accuracy: number
  precision: number
  recall: number
}> {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const { data: logs } = await (supabase.from as Function)('shadow_mode_logs')
      .select('would_have_adjusted, prediction_accurate, feedback_rating')
      .not('correlated_at', 'is', null)

    if (!logs || logs.length === 0) {
      return {
        totalCorrelated: 0,
        truePositives: 0,
        falsePositives: 0,
        trueNegatives: 0,
        falseNegatives: 0,
        accuracy: 0,
        precision: 0,
        recall: 0,
      }
    }

    let tp = 0, fp = 0, tn = 0, fn = 0

    for (const log of logs) {
      const predicted = log.would_have_adjusted
      const isGood = log.feedback_rating > GOOD_RATING_THRESHOLD

      if (predicted && !isGood) tp++
      else if (predicted && isGood) fp++
      else if (!predicted && isGood) tn++
      else fn++
    }

    const total = tp + fp + tn + fn
    const accuracy = total > 0 ? (tp + tn) / total : 0
    const precision = (tp + fp) > 0 ? tp / (tp + fp) : 0
    const recall = (tp + fn) > 0 ? tp / (tp + fn) : 0

    return {
      totalCorrelated: total,
      truePositives: tp,
      falsePositives: fp,
      trueNegatives: tn,
      falseNegatives: fn,
      accuracy,
      precision,
      recall,
    }
  } catch (error) {
    console.error('[Correlation] Error getting stats:', error)
    return {
      totalCorrelated: 0,
      truePositives: 0,
      falsePositives: 0,
      trueNegatives: 0,
      falseNegatives: 0,
      accuracy: 0,
      precision: 0,
      recall: 0,
    }
  }
}
