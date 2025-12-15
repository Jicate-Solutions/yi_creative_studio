/**
 * Shadow Mode Engine
 *
 * Logs what WOULD have been prevented without actually applying changes.
 * Enables pattern validation before activation through feedback correlation.
 *
 * Flow:
 * 1. Match patterns against request (same as prevention)
 * 2. Log matches and proposed adjustments to shadow_mode_logs
 * 3. Later: correlate with feedback to validate predictions
 */

import type {
  ShadowModeLog,
  PatternMatch,
  ProposedAdjustment,
  GenerationRequestSnapshot,
  ShadowModeResponse,
  InterventionLayer,
} from '@/types/learning.types'
import { matchPatternsFromCache } from '../cache/pattern-cache'

/**
 * Run shadow mode analysis on a generation request
 * Returns what would have been done without applying changes
 */
export async function runShadowMode(
  request: GenerationRequestSnapshot,
  generationRequestId: string
): Promise<ShadowModeResponse> {
  const startTime = Date.now()

  try {
    // Match patterns from cache
    const matchedPatterns = matchPatternsFromCache(request)

    // Determine if we would have adjusted
    const wouldHaveAdjusted = matchedPatterns.length > 0 &&
      matchedPatterns.some(p => p.confidence >= 0.7)

    // Generate proposed adjustments
    const proposedAdjustments = generateProposedAdjustments(matchedPatterns, request)

    // Log to shadow_mode_logs
    const logId = await logShadowMode({
      generationRequestId,
      organizationId: request.organizationId,
      userId: request.userId,
      formatId: request.formatId,
      matchedPatterns,
      wouldHaveAdjusted,
      proposedAdjustments,
      requestSnapshot: request,
    })

    const processingTimeMs = Date.now() - startTime
    console.log(`[ShadowMode] Logged ${matchedPatterns.length} patterns in ${processingTimeMs}ms`)

    return {
      success: true,
      logged: true,
      logId,
      matchedPatterns,
      wouldHaveAdjusted,
      proposedAdjustments,
    }
  } catch (error) {
    console.error('[ShadowMode] Error:', error)
    return {
      success: false,
      logged: false,
      logId: '',
      matchedPatterns: [],
      wouldHaveAdjusted: false,
      proposedAdjustments: [],
    }
  }
}

/**
 * Generate proposed adjustments from matched patterns
 */
function generateProposedAdjustments(
  patterns: PatternMatch[],
  request: GenerationRequestSnapshot
): ProposedAdjustment[] {
  const adjustments: ProposedAdjustment[] = []

  for (const pattern of patterns) {
    const fix = pattern.suggestedFix

    if (fix.layer === 'L1_form_data' && fix.intervention.type === 'field_modification') {
      const params = fix.intervention.parameters as {
        field?: string
        suggestedValue?: unknown
      }

      if (params.field) {
        const originalValue = getNestedValue(request.formData, params.field)
        adjustments.push({
          layer: fix.layer,
          field: params.field,
          originalValue,
          proposedValue: params.suggestedValue,
          patternId: pattern.patternId,
          reasoning: pattern.reasoning,
        })
      }
    } else if (fix.layer === 'L2_prompt' && fix.intervention.type === 'prompt_injection') {
      adjustments.push({
        layer: fix.layer,
        field: 'prompt',
        originalValue: null,
        proposedValue: (fix.intervention.parameters as { instruction?: string }).instruction,
        patternId: pattern.patternId,
        reasoning: pattern.reasoning,
      })
    } else if (fix.layer === 'L3_design_context' && fix.intervention.type === 'design_context_override') {
      adjustments.push({
        layer: fix.layer,
        field: 'designContext',
        originalValue: request.designData,
        proposedValue: fix.intervention.parameters,
        patternId: pattern.patternId,
        reasoning: pattern.reasoning,
      })
    }
  }

  return adjustments
}

/**
 * Log shadow mode analysis to database
 */
async function logShadowMode(data: {
  generationRequestId: string
  organizationId?: string
  userId?: string
  formatId: string
  matchedPatterns: PatternMatch[]
  wouldHaveAdjusted: boolean
  proposedAdjustments: ProposedAdjustment[]
  requestSnapshot: GenerationRequestSnapshot
}): Promise<string> {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const { data: log, error } = await (supabase.from as Function)('shadow_mode_logs')
      .insert({
        generation_request_id: data.generationRequestId,
        organization_id: data.organizationId,
        user_id: data.userId,
        format_id: data.formatId,
        matched_patterns: data.matchedPatterns,
        would_have_adjusted: data.wouldHaveAdjusted,
        proposed_adjustments: data.proposedAdjustments,
        request_snapshot: data.requestSnapshot,
      })
      .select('id')
      .single()

    if (error) {
      console.error('[ShadowMode] Error logging:', error)
      return ''
    }

    return log.id
  } catch (error) {
    console.error('[ShadowMode] Error logging:', error)
    return ''
  }
}

/**
 * Link a shadow log to a creative after generation completes
 */
export async function linkShadowLogToCreative(
  generationRequestId: string,
  creativeId: string
): Promise<boolean> {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const { error } = await (supabase.from as Function)('shadow_mode_logs')
      .update({ creative_id: creativeId })
      .eq('generation_request_id', generationRequestId)

    if (error) {
      console.error('[ShadowMode] Error linking to creative:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('[ShadowMode] Error linking to creative:', error)
    return false
  }
}

/**
 * Get uncorrelated shadow logs for a time window
 */
export async function getUncorrelatedShadowLogs(
  windowHours: number = 24
): Promise<ShadowModeLog[]> {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const windowStart = new Date(Date.now() - windowHours * 60 * 60 * 1000).toISOString()

    const { data: logs, error } = await (supabase.from as Function)('shadow_mode_logs')
      .select('*')
      .is('correlated_at', null)
      .not('creative_id', 'is', null)
      .gte('created_at', windowStart)
      .order('created_at', { ascending: true })
      .limit(100)

    if (error) {
      console.error('[ShadowMode] Error fetching uncorrelated logs:', error)
      return []
    }

    return (logs || []).map(mapDbToShadowLog)
  } catch (error) {
    console.error('[ShadowMode] Error fetching uncorrelated logs:', error)
    return []
  }
}

/**
 * Get shadow log statistics
 */
export async function getShadowModeStats(): Promise<{
  totalLogs: number
  correlatedLogs: number
  accuratePredictions: number
  averageConfidenceDelta: number
  patternPerformance: Record<string, { accurate: number; total: number }>
}> {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    // Get total counts
    const { count: totalLogs } = await (supabase.from as Function)('shadow_mode_logs')
      .select('*', { count: 'exact', head: true })

    const { count: correlatedLogs } = await (supabase.from as Function)('shadow_mode_logs')
      .select('*', { count: 'exact', head: true })
      .not('correlated_at', 'is', null)

    const { count: accuratePredictions } = await (supabase.from as Function)('shadow_mode_logs')
      .select('*', { count: 'exact', head: true })
      .eq('prediction_accurate', true)

    // Get average confidence delta
    const { data: deltaData } = await (supabase.from as Function)('shadow_mode_logs')
      .select('confidence_delta')
      .not('confidence_delta', 'is', null)

    const avgDelta = deltaData?.length
      ? deltaData.reduce((sum: number, d: { confidence_delta: number }) => sum + d.confidence_delta, 0) / deltaData.length
      : 0

    return {
      totalLogs: totalLogs || 0,
      correlatedLogs: correlatedLogs || 0,
      accuratePredictions: accuratePredictions || 0,
      averageConfidenceDelta: avgDelta,
      patternPerformance: {}, // Would need aggregation query
    }
  } catch (error) {
    console.error('[ShadowMode] Error getting stats:', error)
    return {
      totalLogs: 0,
      correlatedLogs: 0,
      accuratePredictions: 0,
      averageConfidenceDelta: 0,
      patternPerformance: {},
    }
  }
}

// Helper functions

function getNestedValue(obj: unknown, path: string): unknown {
  const parts = path.split('.')
  let current: unknown = obj
  for (const part of parts) {
    if (current === null || current === undefined) return undefined
    if (typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[part]
  }
  return current
}

function mapDbToShadowLog(db: Record<string, unknown>): ShadowModeLog {
  return {
    id: db.id as string,
    generationRequestId: db.generation_request_id as string,
    organizationId: db.organization_id as string | undefined,
    userId: db.user_id as string | undefined,
    formatId: db.format_id as string,
    matchedPatterns: db.matched_patterns as PatternMatch[],
    wouldHaveAdjusted: db.would_have_adjusted as boolean,
    proposedAdjustments: db.proposed_adjustments as ProposedAdjustment[],
    requestSnapshot: db.request_snapshot as GenerationRequestSnapshot,
    creativeId: db.creative_id as string | undefined,
    feedbackId: db.feedback_id as string | undefined,
    feedbackRating: db.feedback_rating as number | undefined,
    predictionAccurate: db.prediction_accurate as boolean | undefined,
    confidenceDelta: db.confidence_delta as number | undefined,
    correlationNotes: db.correlation_notes as string | undefined,
    createdAt: db.created_at as string,
    correlatedAt: db.correlated_at as string | undefined,
  }
}
