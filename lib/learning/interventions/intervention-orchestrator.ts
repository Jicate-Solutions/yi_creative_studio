/**
 * Intervention Orchestrator
 *
 * Coordinates multi-layer interventions based on matched patterns.
 * Each layer targets a different stage of the generation pipeline.
 *
 * Layers:
 * L1 - Form Data: Modify user input fields
 * L2 - Prompt: Inject instructions into prompts
 * L3 - Design Context: Override design intelligence outputs
 * L4 - Post-Process: Adjust after image generation
 * L5 - Review Queue: Flag for human review
 */

import type {
  InterventionRequest,
  InterventionResult,
  AppliedAdjustment,
  PatternMatch,
  InterventionLayer,
  GenerationRequestSnapshot,
  LayerInterventionResult,
} from '@/types/learning.types'
import { applyFormDataIntervention } from './layer-1-form-data'
import { applyPromptIntervention } from './layer-2-prompt'
import { applyDesignContextIntervention } from './layer-3-design-context'
import { applyPostProcessIntervention } from './layer-4-post-process'
import { applyReviewQueueIntervention } from './layer-5-review-queue'

// Configuration
const MAX_ADJUSTMENTS_PER_REQUEST = 5
const INTERVENTION_CONFIDENCE_THRESHOLD = 0.7

// Layer execution order
const LAYER_ORDER: InterventionLayer[] = [
  'L1_form_data',
  'L2_prompt',
  'L3_design_context',
  'L4_post_process',
  'L5_review_queue',
]

// Layer handlers
const LAYER_HANDLERS: Record<InterventionLayer, (
  request: GenerationRequestSnapshot,
  patterns: PatternMatch[]
) => Promise<LayerInterventionResult>> = {
  'L1_form_data': applyFormDataIntervention,
  'L2_prompt': applyPromptIntervention,
  'L3_design_context': applyDesignContextIntervention,
  'L4_post_process': applyPostProcessIntervention,
  'L5_review_queue': applyReviewQueueIntervention,
}

/**
 * Orchestrate interventions across all layers
 */
export async function orchestrateInterventions(
  request: InterventionRequest
): Promise<InterventionResult> {
  const startTime = Date.now()
  const allAdjustments: AppliedAdjustment[] = []
  let modifiedRequest = { ...request.generationRequest }

  // Filter patterns by confidence threshold
  const eligiblePatterns = request.matchedPatterns.filter(
    p => p.confidence >= INTERVENTION_CONFIDENCE_THRESHOLD
  )

  if (eligiblePatterns.length === 0) {
    return {
      applied: false,
      layer: 'L1_form_data',
      adjustments: [],
      modifiedRequest,
      processingTimeMs: Date.now() - startTime,
      reasoning: 'No patterns above confidence threshold',
    }
  }

  // If shadow mode, don't actually apply interventions
  if (request.shadowMode) {
    return {
      applied: false,
      layer: 'L1_form_data',
      adjustments: [],
      modifiedRequest,
      processingTimeMs: Date.now() - startTime,
      reasoning: 'Shadow mode - interventions logged but not applied',
    }
  }

  // Group patterns by their target layer
  const patternsByLayer = groupPatternsByLayer(eligiblePatterns)

  // Process each layer in order
  for (const layer of LAYER_ORDER) {
    const layerPatterns = patternsByLayer.get(layer) || []
    if (layerPatterns.length === 0) continue

    // Check if we've reached max adjustments
    if (allAdjustments.length >= MAX_ADJUSTMENTS_PER_REQUEST) {
      console.log(`[Orchestrator] Max adjustments (${MAX_ADJUSTMENTS_PER_REQUEST}) reached, skipping remaining layers`)
      break
    }

    const handler = LAYER_HANDLERS[layer]
    if (!handler) continue

    try {
      const result = await handler(modifiedRequest, layerPatterns)

      if (result.success && result.adjustments.length > 0) {
        // Apply adjustments to request
        modifiedRequest = applyAdjustmentsToRequest(modifiedRequest, result.adjustments)
        allAdjustments.push(...result.adjustments)

        console.log(`[Orchestrator] ${layer}: Applied ${result.adjustments.length} adjustments`)
      } else if (result.skipped) {
        console.log(`[Orchestrator] ${layer}: Skipped - ${result.skipReason}`)
      }
    } catch (error) {
      console.error(`[Orchestrator] Error in ${layer}:`, error)
    }
  }

  const processingTimeMs = Date.now() - startTime

  return {
    applied: allAdjustments.length > 0,
    layer: allAdjustments.length > 0 ? allAdjustments[0].layer : 'L1_form_data',
    adjustments: allAdjustments,
    modifiedRequest,
    processingTimeMs,
    reasoning: allAdjustments.length > 0
      ? `Applied ${allAdjustments.length} adjustments across ${new Set(allAdjustments.map(a => a.layer)).size} layers`
      : 'No adjustments applied',
  }
}

/**
 * Group patterns by their target intervention layer
 */
function groupPatternsByLayer(patterns: PatternMatch[]): Map<InterventionLayer, PatternMatch[]> {
  const grouped = new Map<InterventionLayer, PatternMatch[]>()

  for (const pattern of patterns) {
    const layer = pattern.suggestedFix.layer

    if (!grouped.has(layer)) {
      grouped.set(layer, [])
    }
    grouped.get(layer)!.push(pattern)
  }

  return grouped
}

/**
 * Apply adjustments to the request object
 */
function applyAdjustmentsToRequest(
  request: GenerationRequestSnapshot,
  adjustments: AppliedAdjustment[]
): GenerationRequestSnapshot {
  let modified = { ...request }

  for (const adj of adjustments) {
    if (adj.layer === 'L1_form_data') {
      // Apply form data modifications
      modified = {
        ...modified,
        formData: {
          ...modified.formData,
          [adj.field]: adj.newValue,
        },
      }
    } else if (adj.layer === 'L3_design_context') {
      // Apply design context overrides
      modified = {
        ...modified,
        designData: {
          ...modified.designData,
          [adj.field]: adj.newValue,
        },
      }
    }
    // L2 (prompt) and L4 (post-process) are applied at their respective pipeline stages
    // L5 (review) is a flag, not a request modification
  }

  return modified
}

/**
 * Get intervention statistics
 */
export function getInterventionStats(
  adjustments: AppliedAdjustment[]
): {
  totalAdjustments: number
  byLayer: Record<InterventionLayer, number>
  byPatternId: Record<string, number>
  averageConfidence: number
} {
  const byLayer: Record<InterventionLayer, number> = {
    L1_form_data: 0,
    L2_prompt: 0,
    L3_design_context: 0,
    L4_post_process: 0,
    L5_review_queue: 0,
  }

  const byPatternId: Record<string, number> = {}
  let totalConfidence = 0

  for (const adj of adjustments) {
    byLayer[adj.layer]++

    if (!byPatternId[adj.patternId]) {
      byPatternId[adj.patternId] = 0
    }
    byPatternId[adj.patternId]++

    totalConfidence += adj.confidence
  }

  return {
    totalAdjustments: adjustments.length,
    byLayer,
    byPatternId,
    averageConfidence: adjustments.length > 0 ? totalConfidence / adjustments.length : 0,
  }
}

/**
 * Validate that an intervention is safe to apply
 */
export function validateIntervention(
  request: GenerationRequestSnapshot,
  adjustment: AppliedAdjustment
): { valid: boolean; reason?: string } {
  // Don't modify critical fields
  const protectedFields = ['organizationId', 'userId', 'formatId']
  if (protectedFields.includes(adjustment.field)) {
    return { valid: false, reason: 'Cannot modify protected field' }
  }

  // Don't remove required values
  if (adjustment.newValue === null || adjustment.newValue === undefined) {
    const requiredFields = ['title', 'eventName', 'headline']
    if (requiredFields.includes(adjustment.field)) {
      return { valid: false, reason: 'Cannot remove required field value' }
    }
  }

  // Confidence must be above threshold
  if (adjustment.confidence < INTERVENTION_CONFIDENCE_THRESHOLD) {
    return { valid: false, reason: 'Confidence below threshold' }
  }

  return { valid: true }
}

/**
 * Create a rollback point before applying interventions
 */
export function createRollbackPoint(
  request: GenerationRequestSnapshot
): { id: string; snapshot: GenerationRequestSnapshot; timestamp: string } {
  return {
    id: crypto.randomUUID(),
    snapshot: JSON.parse(JSON.stringify(request)),
    timestamp: new Date().toISOString(),
  }
}
