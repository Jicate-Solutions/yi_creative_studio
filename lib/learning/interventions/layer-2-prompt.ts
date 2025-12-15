/**
 * Layer 2: Prompt Interventions
 *
 * Injects instructions into AI prompts to prevent issues.
 * Examples:
 * - Add contrast requirements
 * - Specify text hierarchy
 * - Include logo safe zones
 */

import type {
  PatternMatch,
  GenerationRequestSnapshot,
  LayerInterventionResult,
  AppliedAdjustment,
} from '@/types/learning.types'

// Storage for prompt injections to be applied during prompt building
const pendingPromptInjections: Map<string, PromptInjection[]> = new Map()

interface PromptInjection {
  instruction: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  patternId: string
  confidence: number
  position: 'prepend' | 'append' | 'section'
  section?: string
}

/**
 * Apply prompt interventions
 * Note: These are queued and applied during actual prompt building
 */
export async function applyPromptIntervention(
  request: GenerationRequestSnapshot,
  patterns: PatternMatch[]
): Promise<LayerInterventionResult> {
  const adjustments: AppliedAdjustment[] = []
  const requestId = request.timestamp || new Date().toISOString()

  // Clear any existing injections for this request
  pendingPromptInjections.delete(requestId)
  const injections: PromptInjection[] = []

  for (const pattern of patterns) {
    const fix = pattern.suggestedFix
    if (fix.layer !== 'L2_prompt') continue

    const intervention = fix.intervention
    if (intervention.type !== 'prompt_injection') continue

    const params = intervention.parameters as {
      instruction?: string
      priority?: 'low' | 'medium' | 'high' | 'critical'
      position?: 'prepend' | 'append' | 'section'
      section?: string
    }

    if (!params.instruction) continue

    const injection: PromptInjection = {
      instruction: params.instruction,
      priority: params.priority || 'medium',
      patternId: pattern.patternId,
      confidence: pattern.confidence,
      position: params.position || 'append',
      section: params.section,
    }

    injections.push(injection)

    adjustments.push({
      field: 'prompt',
      originalValue: null,
      newValue: params.instruction,
      patternId: pattern.patternId,
      layer: 'L2_prompt',
      confidence: pattern.confidence,
    })
  }

  // Sort by priority (critical first)
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
  injections.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

  // Store for later retrieval during prompt building
  if (injections.length > 0) {
    pendingPromptInjections.set(requestId, injections)
  }

  return {
    success: adjustments.length > 0,
    adjustments,
    skipped: adjustments.length === 0,
    skipReason: adjustments.length === 0 ? 'No applicable prompt injections' : undefined,
  }
}

/**
 * Get pending prompt injections for a request
 * Called during prompt building to retrieve queued injections
 */
export function getPendingPromptInjections(requestId: string): PromptInjection[] {
  return pendingPromptInjections.get(requestId) || []
}

/**
 * Clear pending injections after they've been applied
 */
export function clearPendingPromptInjections(requestId: string): void {
  pendingPromptInjections.delete(requestId)
}

/**
 * Format injections into prompt text
 */
export function formatInjectionsForPrompt(injections: PromptInjection[]): string {
  if (injections.length === 0) return ''

  const lines: string[] = []

  // Group by priority
  const critical = injections.filter(i => i.priority === 'critical')
  const high = injections.filter(i => i.priority === 'high')
  const medium = injections.filter(i => i.priority === 'medium')
  const low = injections.filter(i => i.priority === 'low')

  if (critical.length > 0) {
    lines.push('\n<instruction role="critical">')
    lines.push('CRITICAL REQUIREMENTS (DO NOT IGNORE):')
    critical.forEach(i => lines.push(`- ${i.instruction}`))
    lines.push('</instruction>')
  }

  if (high.length > 0) {
    lines.push('\n<instruction role="high-priority">')
    lines.push('HIGH PRIORITY:')
    high.forEach(i => lines.push(`- ${i.instruction}`))
    lines.push('</instruction>')
  }

  if (medium.length > 0) {
    lines.push('\n<instruction role="guidelines">')
    lines.push('GUIDELINES:')
    medium.forEach(i => lines.push(`- ${i.instruction}`))
    lines.push('</instruction>')
  }

  if (low.length > 0) {
    lines.push('\n<instruction role="suggestions">')
    lines.push('SUGGESTIONS:')
    low.forEach(i => lines.push(`- ${i.instruction}`))
    lines.push('</instruction>')
  }

  return lines.join('\n')
}

/**
 * Check if there are any high-priority injections
 */
export function hasHighPriorityInjections(requestId: string): boolean {
  const injections = pendingPromptInjections.get(requestId) || []
  return injections.some(i => i.priority === 'critical' || i.priority === 'high')
}
