/**
 * Layer 3: Design Context Interventions
 *
 * Overrides design intelligence outputs to enforce requirements.
 * Examples:
 * - Force brand colors
 * - Override style for specific formats
 * - Set mood/tone appropriately
 */

import type {
  PatternMatch,
  GenerationRequestSnapshot,
  LayerInterventionResult,
  AppliedAdjustment,
} from '@/types/learning.types'

// Storage for design context overrides
const pendingDesignOverrides: Map<string, DesignContextOverride[]> = new Map()

interface DesignContextOverride {
  field: string
  value: unknown
  mode: 'replace' | 'merge' | 'append'
  patternId: string
  confidence: number
}

/**
 * Apply design context interventions
 */
export async function applyDesignContextIntervention(
  request: GenerationRequestSnapshot,
  patterns: PatternMatch[]
): Promise<LayerInterventionResult> {
  const adjustments: AppliedAdjustment[] = []
  const requestId = request.timestamp || new Date().toISOString()

  // Clear any existing overrides for this request
  pendingDesignOverrides.delete(requestId)
  const overrides: DesignContextOverride[] = []

  for (const pattern of patterns) {
    const fix = pattern.suggestedFix
    if (fix.layer !== 'L3_design_context') continue

    const intervention = fix.intervention
    if (intervention.type !== 'design_context_override') continue

    const params = intervention.parameters as Record<string, unknown>

    // Handle different override types
    if (params.style !== undefined) {
      overrides.push({
        field: 'style',
        value: params.style,
        mode: 'replace',
        patternId: pattern.patternId,
        confidence: pattern.confidence,
      })
      adjustments.push({
        field: 'designContext.style',
        originalValue: request.designData?.style,
        newValue: params.style,
        patternId: pattern.patternId,
        layer: 'L3_design_context',
        confidence: pattern.confidence,
      })
    }

    if (params.mood !== undefined) {
      overrides.push({
        field: 'mood',
        value: params.mood,
        mode: 'replace',
        patternId: pattern.patternId,
        confidence: pattern.confidence,
      })
      adjustments.push({
        field: 'designContext.mood',
        originalValue: request.designData?.mood,
        newValue: params.mood,
        patternId: pattern.patternId,
        layer: 'L3_design_context',
        confidence: pattern.confidence,
      })
    }

    if (params.tone !== undefined) {
      overrides.push({
        field: 'tone',
        value: params.tone,
        mode: 'replace',
        patternId: pattern.patternId,
        confidence: pattern.confidence,
      })
      adjustments.push({
        field: 'designContext.tone',
        originalValue: request.designData?.tone,
        newValue: params.tone,
        patternId: pattern.patternId,
        layer: 'L3_design_context',
        confidence: pattern.confidence,
      })
    }

    if (params.primary !== undefined || params.secondary !== undefined || params.accent !== undefined) {
      const colorOverride = {
        primary: params.primary,
        secondary: params.secondary,
        accent: params.accent,
      }
      overrides.push({
        field: 'colorPalette',
        value: colorOverride,
        mode: 'merge',
        patternId: pattern.patternId,
        confidence: pattern.confidence,
      })
      adjustments.push({
        field: 'designContext.colorPalette',
        originalValue: request.designData?.colorPalette,
        newValue: colorOverride,
        patternId: pattern.patternId,
        layer: 'L3_design_context',
        confidence: pattern.confidence,
      })
    }

    if (params.elements !== undefined) {
      overrides.push({
        field: 'visualElements',
        value: params.elements,
        mode: 'append',
        patternId: pattern.patternId,
        confidence: pattern.confidence,
      })
      adjustments.push({
        field: 'designContext.visualElements',
        originalValue: request.designData?.visualElements,
        newValue: params.elements,
        patternId: pattern.patternId,
        layer: 'L3_design_context',
        confidence: pattern.confidence,
      })
    }

    if (params.avoid !== undefined) {
      overrides.push({
        field: 'avoid',
        value: params.avoid,
        mode: 'append',
        patternId: pattern.patternId,
        confidence: pattern.confidence,
      })
      adjustments.push({
        field: 'designContext.avoid',
        originalValue: request.designData?.avoid,
        newValue: params.avoid,
        patternId: pattern.patternId,
        layer: 'L3_design_context',
        confidence: pattern.confidence,
      })
    }

    if (params.requirement !== undefined) {
      overrides.push({
        field: 'requirements',
        value: params.requirement,
        mode: 'append',
        patternId: pattern.patternId,
        confidence: pattern.confidence,
      })
      adjustments.push({
        field: 'designContext.requirements',
        originalValue: null,
        newValue: params.requirement,
        patternId: pattern.patternId,
        layer: 'L3_design_context',
        confidence: pattern.confidence,
      })
    }
  }

  // Store overrides for later application
  if (overrides.length > 0) {
    pendingDesignOverrides.set(requestId, overrides)
  }

  return {
    success: adjustments.length > 0,
    adjustments,
    skipped: adjustments.length === 0,
    skipReason: adjustments.length === 0 ? 'No applicable design context overrides' : undefined,
  }
}

/**
 * Get pending design context overrides
 */
export function getPendingDesignOverrides(requestId: string): DesignContextOverride[] {
  return pendingDesignOverrides.get(requestId) || []
}

/**
 * Apply overrides to design context
 */
export function applyDesignOverrides(
  designContext: Record<string, unknown>,
  overrides: DesignContextOverride[]
): Record<string, unknown> {
  let result = { ...designContext }

  for (const override of overrides) {
    switch (override.mode) {
      case 'replace':
        result[override.field] = override.value
        break

      case 'merge':
        if (typeof result[override.field] === 'object' && typeof override.value === 'object') {
          result[override.field] = {
            ...(result[override.field] as Record<string, unknown>),
            ...(override.value as Record<string, unknown>),
          }
        } else {
          result[override.field] = override.value
        }
        break

      case 'append':
        if (Array.isArray(result[override.field])) {
          if (Array.isArray(override.value)) {
            result[override.field] = [...(result[override.field] as unknown[]), ...override.value]
          } else {
            result[override.field] = [...(result[override.field] as unknown[]), override.value]
          }
        } else if (typeof result[override.field] === 'string' && typeof override.value === 'string') {
          result[override.field] = `${result[override.field]}; ${override.value}`
        } else {
          result[override.field] = override.value
        }
        break
    }
  }

  return result
}

/**
 * Clear pending overrides
 */
export function clearPendingDesignOverrides(requestId: string): void {
  pendingDesignOverrides.delete(requestId)
}
