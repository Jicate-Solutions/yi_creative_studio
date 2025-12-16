/**
 * Creative Learning Agent - 10/10 Production Architecture
 *
 * A comprehensive learning system that transforms from reactive batch processing
 * to a proactive, real-time, statistically-validated learning engine.
 *
 * Core Features:
 * 1. Shadow Mode - Validates patterns before activation
 * 2. Pre-Seeded Patterns - 25+ patterns for day-1 value
 * 3. Real-Time Learning - Learns within minutes
 * 4. Multi-Layer Interventions - 5 layers for root cause resolution
 * 5. A/B Testing - Statistical validation with Welch's t-test
 * 6. Latency Optimization - <50ms with cache hits
 * 7. Ground Truth Tracking - Full causal analysis via lineage
 * 8. Rollback Safety - Checkpoints + quality guards
 * 9. Vision Analysis - Proactive detection via Gemini
 * 10. Success Patterns - Amplifies what works
 * 11. Pattern Hierarchy - Global -> Format -> Org -> User
 * 12. Feedback Enrichment - AI extracts structure from comments
 */

// Import for local use
import {
  patternCache as _patternCache,
  matchPatternsFromCache as _matchPatternsFromCache,
} from './cache'
import { runShadowMode as _runShadowMode } from './shadow'
import { getRunningExperiments as _getRunningExperiments } from './ab-testing'
import { orchestrateInterventions as _orchestrateInterventions } from './interventions'
import type { ExperimentVariant } from '@/types/learning.types'

// Pattern Cache - Ultra-fast pattern matching
export {
  patternCache,
  matchPatternsFromCache,
  invalidatePatternCache,
} from './cache'

// Pre-Seeded Patterns - Day-1 value
export {
  PRE_SEEDED_PATTERNS,
  seedPatterns,
} from './seeding'

// Shadow Mode - Validate before activating
export {
  runShadowMode,
  linkShadowLogToCreative,
  getShadowModeStats,
  runCorrelationAnalysis,
  getUncorrelatedShadowLogs,
} from './shadow'

// A/B Testing - Statistical validation
export {
  createExperiment,
  routeToExperiment,
  recordAssignmentFeedback,
  analyzeExperiment,
  checkSignificance,
  manuallyPromote,
  manuallyDeprecate,
  processRunningExperiments,
  getRunningExperiments,
  getTestResult,
} from './ab-testing'

// Interventions - Multi-layer fixes
export {
  orchestrateInterventions,
  applyFormDataIntervention,
  applyPromptIntervention,
  applyDesignContextIntervention,
  applyPostProcessIntervention,
  shouldFlagForReview,
  addToReviewQueue,
} from './interventions'

// Vision Analysis - Proactive detection
export {
  analyzeImage,
  quickQualityCheck,
  analyzeAndSave,
} from './vision'

// Success Patterns - Learn from wins
export {
  extractSuccessPatterns,
} from './success'

// Rollback Safety - Checkpoints + recovery
export {
  createCheckpoint,
  rollback,
  getRecentCheckpoints,
  cleanupExpiredCheckpoints,
} from './rollback'

// Real-Time Learning - Event processing
export {
  processEventQueue,
  queueEvent,
  getQueueStats,
} from './real-time'

// Re-export types for convenience
export type {
  // Core types
  SeededPattern,
  PatternMatch,
  GenerationRequestSnapshot,

  // Shadow mode
  ShadowModeLog,
  ShadowModeResponse,
  ShadowCorrelationResult,

  // A/B Testing
  ABExperiment,
  ABAssignment,
  ExperimentVariant,
  ExperimentResults,

  // Interventions
  InterventionLayer,
  InterventionRequest,
  InterventionResult,

  // Vision
  VisionAnalysis,
  VisionAnalysisRequest,
  DetectedIssue,

  // Success patterns
  SuccessPattern,
  SuccessSignature,
  SuccessExtractionResult,

  // Rollback
  RollbackCheckpoint,
  RollbackRequest,
  RollbackResult,
  CheckpointType,
  CheckpointEntityType,

  // Real-time
  LearningQueueItem,
  LearningEventType,
  QueueStatus,

  // Lineage
  GenerationLineage,
  PipelineTrace,

  // Config
  LearningSystemConfig,
} from '@/types/learning.types'

// Re-export prevention types
export type { PreventionPipelineResult } from '@/types/learning.types'

export { DEFAULT_LEARNING_CONFIG } from '@/types/learning.types'

/**
 * Main Prevention Flow
 *
 * Orchestrates the full prevention pipeline:
 * 1. Pattern cache check (fast, no AI)
 * 2. Shadow mode evaluation (if enabled)
 * 3. A/B experiment assignment (if active)
 * 4. Multi-layer intervention execution
 * 5. Lineage tracking for ground truth
 *
 * @param request - The generation request snapshot
 * @param options - Prevention options
 * @returns Prevention result with any applied adjustments
 */
export async function runPreventionPipeline(
  request: GenerationRequestSnapshot,
  options: {
    generationRequestId: string
    organizationId?: string
    userId?: string
    shadowOnly?: boolean
    skipAB?: boolean
  }
): Promise<PreventionPipelineResult> {
  const startTime = Date.now()

  try {
    // Step 1: Fast pattern matching from cache
    const matches = _matchPatternsFromCache(request)

    if (matches.length === 0) {
      return {
        prevented: false,
        adjustments: [],
        matchedPatterns: [],
        latencyMs: Date.now() - startTime,
        shadowMode: false,
      }
    }

    // Step 2: Shadow mode (log but don't apply)
    if (options.shadowOnly) {
      const shadowResult = await _runShadowMode(request, options.generationRequestId)
      return {
        prevented: false,
        adjustments: [],
        matchedPatterns: matches.map(m => m.patternId),
        latencyMs: Date.now() - startTime,
        shadowMode: true,
        shadowLogId: shadowResult.logId,
        proposedAdjustments: shadowResult.proposedAdjustments,
      }
    }

    // Step 3: A/B experiment assignment
    let activeExperiment: ABExperiment | null = null
    let variant: ExperimentVariant = 'treatment'

    if (!options.skipAB) {
      const experiments = await _getRunningExperiments()
      // Find experiment for matched patterns
      for (const exp of experiments) {
        if (matches.some(m => m.patternId === exp.patternId)) {
          activeExperiment = exp
          const { routeToExperiment } = await import('./ab-testing')
          const assignment = await routeToExperiment(
            exp.patternId,
            options.organizationId,
            options.userId
          )
          if (assignment) {
            variant = assignment.variant
          }
          break
        }
      }
    }

    // If control variant, log but don't apply
    if (variant === 'control') {
      return {
        prevented: false,
        adjustments: [],
        matchedPatterns: matches.map(m => m.patternId),
        latencyMs: Date.now() - startTime,
        shadowMode: false,
        experimentId: activeExperiment?.id,
        variant: 'control',
      }
    }

    // Step 4: Apply interventions
    const interventionResult = await _orchestrateInterventions({
      generationRequest: request,
      matchedPatterns: matches,
      shadowMode: false,
    })

    // Step 5: Track lineage
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const lineageData = {
      generation_request_id: options.generationRequestId,
      organization_id: options.organizationId,
      patterns_matched: matches.map(m => m.patternId),
      adjustments_applied: interventionResult.adjustments,
      shadow_mode: false,
      experiment_id: activeExperiment?.id,
      variant,
      pipeline_trace: {
        cacheHit: true,
        matchCount: matches.length,
        interventionLayer: interventionResult.layer,
        latencyMs: Date.now() - startTime,
      },
    }

    const { data: lineage } = await (supabase.from as Function)('generation_lineage')
      .insert(lineageData)
      .select('id')
      .single()

    return {
      prevented: interventionResult.adjustments.length > 0,
      adjustments: interventionResult.adjustments,
      matchedPatterns: matches.map(m => m.patternId),
      latencyMs: Date.now() - startTime,
      shadowMode: false,
      experimentId: activeExperiment?.id,
      variant,
      lineageId: lineage?.id,
    }
  } catch (error) {
    console.error('[PreventionPipeline] Error:', error)
    return {
      prevented: false,
      adjustments: [],
      matchedPatterns: [],
      latencyMs: Date.now() - startTime,
      shadowMode: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Import types for function signatures
import type {
  GenerationRequestSnapshot,
  ABExperiment,
  PreventionPipelineResult,
} from '@/types/learning.types'
