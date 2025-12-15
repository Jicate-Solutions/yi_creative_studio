/**
 * Layer 5: Review Queue Interventions
 *
 * Flags creatives for human review when automated fixes aren't sufficient.
 * Examples:
 * - Complex issues requiring human judgment
 * - Low confidence pattern matches
 * - Critical brand compliance concerns
 */

import type {
  PatternMatch,
  GenerationRequestSnapshot,
  LayerInterventionResult,
  AppliedAdjustment,
} from '@/types/learning.types'

// Storage for review flags
const pendingReviewFlags: Map<string, ReviewFlag[]> = new Map()

interface ReviewFlag {
  reason: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  patternId: string
  confidence: number
  suggestedAction?: string
  autoResolve: boolean
}

/**
 * Apply review queue interventions
 */
export async function applyReviewQueueIntervention(
  request: GenerationRequestSnapshot,
  patterns: PatternMatch[]
): Promise<LayerInterventionResult> {
  const adjustments: AppliedAdjustment[] = []
  const requestId = request.timestamp || new Date().toISOString()

  // Clear any existing review flags
  pendingReviewFlags.delete(requestId)
  const flags: ReviewFlag[] = []

  for (const pattern of patterns) {
    const fix = pattern.suggestedFix
    if (fix.layer !== 'L5_review_queue') continue

    const intervention = fix.intervention
    if (intervention.type !== 'review_flag') continue

    const params = intervention.parameters as {
      reason?: string
      severity?: 'low' | 'medium' | 'high' | 'critical'
      suggestedAction?: string
      autoResolve?: boolean
    }

    const flag: ReviewFlag = {
      reason: params.reason || 'Flagged for review by learning system',
      severity: params.severity || 'medium',
      patternId: pattern.patternId,
      confidence: pattern.confidence,
      suggestedAction: params.suggestedAction,
      autoResolve: params.autoResolve || false,
    }

    flags.push(flag)

    adjustments.push({
      field: 'reviewQueue',
      originalValue: null,
      newValue: flag.reason,
      patternId: pattern.patternId,
      layer: 'L5_review_queue',
      confidence: pattern.confidence,
    })
  }

  // Sort by severity (critical first)
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
  flags.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])

  // Store flags for later processing
  if (flags.length > 0) {
    pendingReviewFlags.set(requestId, flags)
  }

  return {
    success: adjustments.length > 0,
    adjustments,
    skipped: adjustments.length === 0,
    skipReason: adjustments.length === 0 ? 'No review flags needed' : undefined,
  }
}

/**
 * Check if a request should be flagged for review
 */
export function shouldFlagForReview(requestId: string): boolean {
  const flags = pendingReviewFlags.get(requestId) || []
  return flags.length > 0
}

/**
 * Get review flags for a request
 */
export function getReviewFlags(requestId: string): ReviewFlag[] {
  return pendingReviewFlags.get(requestId) || []
}

/**
 * Get the highest severity flag
 */
export function getHighestSeverityFlag(requestId: string): ReviewFlag | null {
  const flags = pendingReviewFlags.get(requestId) || []
  return flags.length > 0 ? flags[0] : null // Already sorted by severity
}

/**
 * Check if there are critical flags
 */
export function hasCriticalFlags(requestId: string): boolean {
  const flags = pendingReviewFlags.get(requestId) || []
  return flags.some(f => f.severity === 'critical')
}

/**
 * Add creative to review queue in database
 */
export async function addToReviewQueue(
  creativeId: string,
  requestId: string,
  organizationId?: string
): Promise<string | null> {
  const flags = pendingReviewFlags.get(requestId) || []

  if (flags.length === 0) return null

  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    // Update vision_analysis table with review flag
    // (Assuming we create a review entry in vision_analysis for consistency)
    const highestFlag = flags[0]

    const { data, error } = await (supabase.from as Function)('vision_analysis')
      .insert({
        creative_id: creativeId,
        organization_id: organizationId,
        image_url: '', // Will be updated when image is available
        format_id: 'pending',
        detected_issues: flags.map(f => ({
          category: 'learning_system',
          severity: f.severity,
          description: f.reason,
          confidence: f.confidence,
          suggestedFix: f.suggestedAction,
          relatedPatternKey: f.patternId,
        })),
        overall_score: 0,
        category_scores: {},
        flag_for_review: true,
        review_reasons: flags.map(f => f.reason),
        model_used: 'learning_system',
        processing_time_ms: 0,
      })
      .select('id')
      .single()

    if (error) {
      console.error('[L5] Error adding to review queue:', error)
      return null
    }

    console.log(`[L5] Added creative ${creativeId} to review queue with ${flags.length} flags`)
    return data.id
  } catch (error) {
    console.error('[L5] Error:', error)
    return null
  }
}

/**
 * Mark review item as resolved
 */
export async function resolveReviewItem(
  reviewId: string,
  reviewedBy: string,
  notes?: string
): Promise<boolean> {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const { error } = await (supabase.from as Function)('vision_analysis')
      .update({
        review_completed: true,
        reviewed_by: reviewedBy,
        reviewed_at: new Date().toISOString(),
        review_notes: notes,
      })
      .eq('id', reviewId)

    if (error) {
      console.error('[L5] Error resolving review:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('[L5] Error:', error)
    return false
  }
}

/**
 * Get pending review items
 */
export async function getPendingReviewItems(
  organizationId?: string,
  limit: number = 50
): Promise<Array<{
  id: string
  creativeId: string
  reasons: string[]
  severity: string
  createdAt: string
}>> {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    let query = (supabase.from as Function)('vision_analysis')
      .select('id, creative_id, review_reasons, detected_issues, created_at')
      .eq('flag_for_review', true)
      .eq('review_completed', false)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (organizationId) {
      query = query.eq('organization_id', organizationId)
    }

    const { data, error } = await query

    if (error) {
      console.error('[L5] Error fetching pending reviews:', error)
      return []
    }

    return (data || []).map((item: {
      id: string
      creative_id: string
      review_reasons: string[]
      detected_issues: Array<{ severity: string }>
      created_at: string
    }) => ({
      id: item.id,
      creativeId: item.creative_id,
      reasons: item.review_reasons || [],
      severity: item.detected_issues?.[0]?.severity || 'medium',
      createdAt: item.created_at,
    }))
  } catch (error) {
    console.error('[L5] Error:', error)
    return []
  }
}

/**
 * Clear pending review flags
 */
export function clearPendingReviewFlags(requestId: string): void {
  pendingReviewFlags.delete(requestId)
}
