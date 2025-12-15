/**
 * Layer 4: Post-Process Interventions
 *
 * Adjustments applied after image generation.
 * Examples:
 * - Increase logo size
 * - Apply color corrections
 * - Add text overlays
 */

import type {
  PatternMatch,
  GenerationRequestSnapshot,
  LayerInterventionResult,
  AppliedAdjustment,
} from '@/types/learning.types'

// Storage for post-process adjustments
const pendingPostProcessAdjustments: Map<string, PostProcessAdjustment[]> = new Map()

interface PostProcessAdjustment {
  type: 'logo_size' | 'logo_position' | 'color_correction' | 'text_overlay' | 'crop_adjustment'
  parameters: Record<string, unknown>
  patternId: string
  confidence: number
  priority: number
}

/**
 * Apply post-process interventions
 */
export async function applyPostProcessIntervention(
  request: GenerationRequestSnapshot,
  patterns: PatternMatch[]
): Promise<LayerInterventionResult> {
  const adjustments: AppliedAdjustment[] = []
  const requestId = request.timestamp || new Date().toISOString()

  // Clear any existing post-process adjustments
  pendingPostProcessAdjustments.delete(requestId)
  const postProcessAdjs: PostProcessAdjustment[] = []

  for (const pattern of patterns) {
    const fix = pattern.suggestedFix
    if (fix.layer !== 'L4_post_process') continue

    const intervention = fix.intervention
    if (intervention.type !== 'post_process_adjustment') continue

    const params = intervention.parameters as Record<string, unknown>

    switch (intervention.action) {
      case 'increase_logo_size':
        // Increase logo size for visibility
        postProcessAdjs.push({
          type: 'logo_size',
          parameters: {
            minSize: params.minSize || 'medium',
            scaleFactor: params.scaleFactor || 1.2,
          },
          patternId: pattern.patternId,
          confidence: pattern.confidence,
          priority: intervention.priority || 5,
        })
        adjustments.push({
          field: 'postProcess.logoSize',
          originalValue: 'original',
          newValue: params.minSize || 'medium',
          patternId: pattern.patternId,
          layer: 'L4_post_process',
          confidence: pattern.confidence,
        })
        break

      case 'use_high_res_logo':
        // Use high resolution logo
        postProcessAdjs.push({
          type: 'logo_size',
          parameters: {
            minDPI: params.minDPI || 300,
            preferSVG: params.preferSVG || true,
            upscale: true,
          },
          patternId: pattern.patternId,
          confidence: pattern.confidence,
          priority: intervention.priority || 5,
        })
        adjustments.push({
          field: 'postProcess.logoQuality',
          originalValue: 'standard',
          newValue: 'high-res',
          patternId: pattern.patternId,
          layer: 'L4_post_process',
          confidence: pattern.confidence,
        })
        break

      case 'adjust_crop':
        // Adjust crop to ensure content safety
        postProcessAdjs.push({
          type: 'crop_adjustment',
          parameters: {
            safeZone: params.safeZone || 0.1,
            preserveCenter: params.preserveCenter || true,
          },
          patternId: pattern.patternId,
          confidence: pattern.confidence,
          priority: intervention.priority || 5,
        })
        adjustments.push({
          field: 'postProcess.crop',
          originalValue: null,
          newValue: params.safeZone || 0.1,
          patternId: pattern.patternId,
          layer: 'L4_post_process',
          confidence: pattern.confidence,
        })
        break

      case 'color_correction':
        // Apply color corrections
        postProcessAdjs.push({
          type: 'color_correction',
          parameters: {
            contrast: params.contrast,
            brightness: params.brightness,
            saturation: params.saturation,
          },
          patternId: pattern.patternId,
          confidence: pattern.confidence,
          priority: intervention.priority || 5,
        })
        adjustments.push({
          field: 'postProcess.colorCorrection',
          originalValue: null,
          newValue: params,
          patternId: pattern.patternId,
          layer: 'L4_post_process',
          confidence: pattern.confidence,
        })
        break

      default:
        console.warn(`[L4] Unknown action: ${intervention.action}`)
    }
  }

  // Sort by priority
  postProcessAdjs.sort((a, b) => a.priority - b.priority)

  // Store for later application during post-processing
  if (postProcessAdjs.length > 0) {
    pendingPostProcessAdjustments.set(requestId, postProcessAdjs)
  }

  return {
    success: adjustments.length > 0,
    adjustments,
    skipped: adjustments.length === 0,
    skipReason: adjustments.length === 0 ? 'No applicable post-process adjustments' : undefined,
  }
}

/**
 * Get pending post-process adjustments
 */
export function getPendingPostProcessAdjustments(requestId: string): PostProcessAdjustment[] {
  return pendingPostProcessAdjustments.get(requestId) || []
}

/**
 * Apply post-process adjustments to logo overlay options
 */
export function applyToLogoOverlayOptions(
  options: Record<string, unknown>,
  adjustments: PostProcessAdjustment[]
): Record<string, unknown> {
  let result = { ...options }

  for (const adj of adjustments) {
    if (adj.type === 'logo_size') {
      const params = adj.parameters
      if (params.scaleFactor) {
        result.scaleFactor = params.scaleFactor
      }
      if (params.minSize) {
        // Map size names to scale factors
        const sizeMap: Record<string, number> = {
          small: 0.8,
          medium: 1.0,
          large: 1.3,
        }
        const currentSize = result.size as string || 'medium'
        const minScale = sizeMap[params.minSize as string] || 1.0
        const currentScale = sizeMap[currentSize] || 1.0
        if (currentScale < minScale) {
          result.size = params.minSize
        }
      }
      if (params.preferSVG) {
        result.preferSVG = true
      }
      if (params.upscale) {
        result.allowUpscale = true
      }
    }
  }

  return result
}

/**
 * Get color correction parameters
 */
export function getColorCorrectionParams(requestId: string): {
  contrast?: number
  brightness?: number
  saturation?: number
} | null {
  const adjustments = pendingPostProcessAdjustments.get(requestId) || []
  const colorAdj = adjustments.find(a => a.type === 'color_correction')

  if (!colorAdj) return null

  return {
    contrast: colorAdj.parameters.contrast as number | undefined,
    brightness: colorAdj.parameters.brightness as number | undefined,
    saturation: colorAdj.parameters.saturation as number | undefined,
  }
}

/**
 * Clear pending post-process adjustments
 */
export function clearPendingPostProcessAdjustments(requestId: string): void {
  pendingPostProcessAdjustments.delete(requestId)
}
