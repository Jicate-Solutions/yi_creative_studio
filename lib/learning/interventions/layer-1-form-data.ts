/**
 * Layer 1: Form Data Interventions
 *
 * Modifies user form input to prevent issues.
 * Examples:
 * - Truncate long titles
 * - Suggest color changes
 * - Fix logo positions
 */

import type {
  PatternMatch,
  GenerationRequestSnapshot,
  LayerInterventionResult,
  AppliedAdjustment,
} from '@/types/learning.types'

/**
 * Apply form data interventions
 */
export async function applyFormDataIntervention(
  request: GenerationRequestSnapshot,
  patterns: PatternMatch[]
): Promise<LayerInterventionResult> {
  const adjustments: AppliedAdjustment[] = []

  for (const pattern of patterns) {
    const fix = pattern.suggestedFix
    if (fix.layer !== 'L1_form_data') continue

    const intervention = fix.intervention
    if (intervention.type !== 'field_modification') continue

    const params = intervention.parameters as {
      field?: string
      suggestedValue?: unknown
      action?: string
      maxLength?: number
      rules?: Record<string, string>
      autoTruncate?: boolean
    }

    switch (intervention.action) {
      case 'suggest_truncation':
        // Truncate long text fields
        if (params.field && params.maxLength) {
          const currentValue = getFieldValue(request.formData, params.field)
          if (typeof currentValue === 'string' && currentValue.length > params.maxLength) {
            const truncated = currentValue.substring(0, params.maxLength - 3) + '...'
            adjustments.push({
              field: params.field,
              originalValue: currentValue,
              newValue: truncated,
              patternId: pattern.patternId,
              layer: 'L1_form_data',
              confidence: pattern.confidence,
            })
          }
        }
        break

      case 'enforce_logo_positions':
        // Enforce logo position rules (Yi = top-left, CII = top-right)
        if (params.rules && request.logosPlacements) {
          for (const placement of request.logosPlacements) {
            const requiredPosition = params.rules[placement.type]
            if (requiredPosition && placement.position !== requiredPosition) {
              adjustments.push({
                field: `logosPlacements.${placement.type}.position`,
                originalValue: placement.position,
                newValue: requiredPosition,
                patternId: pattern.patternId,
                layer: 'L1_form_data',
                confidence: pattern.confidence,
              })
            }
          }
        }
        break

      case 'set_value':
        // Directly set a field value
        if (params.field && params.suggestedValue !== undefined) {
          const currentValue = getFieldValue(request.formData, params.field)
          if (currentValue !== params.suggestedValue) {
            adjustments.push({
              field: params.field,
              originalValue: currentValue,
              newValue: params.suggestedValue,
              patternId: pattern.patternId,
              layer: 'L1_form_data',
              confidence: pattern.confidence,
            })
          }
        }
        break

      case 'append_value':
        // Append to existing value
        if (params.field && params.suggestedValue) {
          const currentValue = getFieldValue(request.formData, params.field)
          const newValue = typeof currentValue === 'string'
            ? `${currentValue} ${params.suggestedValue}`
            : params.suggestedValue
          adjustments.push({
            field: params.field,
            originalValue: currentValue,
            newValue,
            patternId: pattern.patternId,
            layer: 'L1_form_data',
            confidence: pattern.confidence,
          })
        }
        break

      default:
        console.warn(`[L1] Unknown action: ${intervention.action}`)
    }
  }

  return {
    success: adjustments.length > 0,
    adjustments,
    skipped: adjustments.length === 0,
    skipReason: adjustments.length === 0 ? 'No applicable form data adjustments' : undefined,
  }
}

/**
 * Get a field value from form data using dot notation
 */
function getFieldValue(formData: Record<string, unknown>, field: string): unknown {
  const parts = field.split('.')
  let current: unknown = formData

  for (const part of parts) {
    if (current === null || current === undefined) return undefined
    if (typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[part]
  }

  return current
}
