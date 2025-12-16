/**
 * Feedback Integration Service
 *
 * Integrates learned patterns from the feedback system into prompt generation:
 * - Fetches relevant patterns based on format/event type
 * - Applies modifications to Design Context and prompts
 * - Tracks pattern effectiveness
 */

import { createClient } from '@/lib/supabase/client'
import { FEEDBACK_CONFIG } from './config'
import type { FeedbackPattern } from './schemas'

// ============================================================
// PATTERN FETCHING
// ============================================================

/**
 * Fetch relevant feedback patterns for a given context
 */
export async function fetchRelevantPatterns(params: {
  formatId: string
  eventType?: string
  organizationId?: string
}): Promise<FeedbackPattern[]> {
  try {
    const supabase = createClient()

    // Query learned patterns from database
    // Note: This assumes a 'prompt_patterns' table exists
    // If not, we'll use the feedback_actions table as a fallback
    const { data: patterns, error } = await (supabase.from as Function)('feedback_patterns')
      .select('*')
      .eq('format_id', params.formatId)
      .gte('confidence', FEEDBACK_CONFIG.minConfidence)
      .order('success_count', { ascending: false })
      .limit(FEEDBACK_CONFIG.maxPatternsPerPrompt * 2) // Fetch extra to filter

    if (error) {
      // Table might not exist yet - gracefully handle
      console.log('[Feedback Integration] Patterns table not available:', error.message)
      return getBuiltInPatterns(params.formatId, params.eventType)
    }

    if (!patterns || patterns.length === 0) {
      return getBuiltInPatterns(params.formatId, params.eventType)
    }

    // Transform database records to FeedbackPattern type
    type PatternRecord = {
      id: string
      format_id: string
      pattern_type: string
      trigger?: Record<string, unknown>
      modification: string
      confidence: number
      success_count?: number
      failure_count?: number
      last_applied?: string
    }
    return patterns.slice(0, FEEDBACK_CONFIG.maxPatternsPerPrompt).map((p: PatternRecord) => ({
      patternId: p.id,
      formatId: p.format_id,
      patternType: p.pattern_type,
      trigger: p.trigger || {},
      modification: p.modification,
      confidence: p.confidence,
      successCount: p.success_count || 0,
      failureCount: p.failure_count || 0,
      lastApplied: p.last_applied,
    }))
  } catch (error) {
    console.warn('[Feedback Integration] Error fetching patterns:', error)
    return getBuiltInPatterns(params.formatId, params.eventType)
  }
}

/**
 * Built-in patterns based on common issues and best practices
 * These serve as defaults when no learned patterns exist
 */
function getBuiltInPatterns(formatId: string, eventType?: string): FeedbackPattern[] {
  const patterns: FeedbackPattern[] = []

  // Format-specific built-in patterns
  switch (formatId) {
    case 'event_poster':
      patterns.push({
        patternId: 'builtin_poster_hierarchy',
        formatId: 'event_poster',
        patternType: 'constraint_addition',
        trigger: {},
        modification: {
          action: 'append',
          target: 'constraints',
          content: 'Event name must be the largest text element, at least 2x the size of other text',
        },
        confidence: 0.95,
        successCount: 100,
        failureCount: 5,
      })

      // Tech event specific
      if (eventType?.toLowerCase().includes('tech') || eventType?.toLowerCase().includes('ai')) {
        patterns.push({
          patternId: 'builtin_tech_visuals',
          formatId: 'event_poster',
          patternType: 'style_modifier',
          trigger: { eventType: 'tech' },
          modification: {
            action: 'inject',
            target: 'visualElements',
            content: 'neural network visualization, glowing data nodes, circuit patterns, holographic elements',
          },
          confidence: 0.9,
          successCount: 50,
          failureCount: 3,
        })
      }

      // Health event specific
      if (eventType?.toLowerCase().includes('health') || eventType?.toLowerCase().includes('medical')) {
        patterns.push({
          patternId: 'builtin_health_visuals',
          formatId: 'event_poster',
          patternType: 'style_modifier',
          trigger: { eventType: 'health' },
          modification: {
            action: 'inject',
            target: 'visualElements',
            content: 'medical cross symbol, heart rate line, caring hands, clean medical environment',
          },
          confidence: 0.9,
          successCount: 40,
          failureCount: 2,
        })
      }
      break

    case 'youtube_thumbnail':
      patterns.push({
        patternId: 'builtin_thumbnail_contrast',
        formatId: 'youtube_thumbnail',
        patternType: 'constraint_addition',
        trigger: {},
        modification: {
          action: 'append',
          target: 'constraints',
          content: 'Text must have thick black outline (3-5px) for readability at 160x90 pixels',
        },
        confidence: 0.98,
        successCount: 200,
        failureCount: 2,
      })

      patterns.push({
        patternId: 'builtin_thumbnail_face',
        formatId: 'youtube_thumbnail',
        patternType: 'style_modifier',
        trigger: {},
        modification: {
          action: 'inject',
          target: 'visualElements',
          content: 'expressive human face taking 50-60% of frame, dramatic lighting, eye contact with viewer',
        },
        confidence: 0.95,
        successCount: 150,
        failureCount: 8,
      })
      break

    case 'certificate':
      patterns.push({
        patternId: 'builtin_certificate_formal',
        formatId: 'certificate',
        patternType: 'style_modifier',
        trigger: {},
        modification: {
          action: 'inject',
          target: 'visualElements',
          content: 'ornate gold border, laurel wreath corners, official seal placeholder, elegant script accents',
        },
        confidence: 0.95,
        successCount: 80,
        failureCount: 4,
      })
      break

    case 'flyer':
    case 'flyer_a4':
    case 'flyer_a5':
      patterns.push({
        patternId: 'builtin_flyer_cta',
        formatId: formatId,
        patternType: 'constraint_addition',
        trigger: {},
        modification: {
          action: 'append',
          target: 'constraints',
          content: 'Call-to-action button must be prominent with high contrast colors, positioned in bottom third',
        },
        confidence: 0.92,
        successCount: 60,
        failureCount: 5,
      })
      break
  }

  return patterns
}

// ============================================================
// PATTERN APPLICATION
// ============================================================

/**
 * Apply feedback patterns to Design Context
 */
export function applyPatternsToDesignContext(
  context: Record<string, unknown>,
  patterns: FeedbackPattern[]
): Record<string, unknown> {
  const modified = { ...context }

  for (const pattern of patterns) {
    if (pattern.confidence < FEEDBACK_CONFIG.minConfidence) continue

    const { action, target, content } = pattern.modification

    try {
      switch (action) {
        case 'append':
          if (typeof modified[target] === 'string') {
            modified[target] = `${modified[target]}. ${content}`
          } else if (Array.isArray(modified[target])) {
            modified[target] = [...modified[target] as unknown[], content]
          }
          break

        case 'prepend':
          if (typeof modified[target] === 'string') {
            modified[target] = `${content}. ${modified[target]}`
          } else if (Array.isArray(modified[target])) {
            modified[target] = [content, ...modified[target] as unknown[]]
          }
          break

        case 'inject':
          // For arrays, add elements; for strings, merge
          if (Array.isArray(modified[target])) {
            const newElements = content.split(',').map(s => s.trim())
            modified[target] = [...modified[target] as unknown[], ...newElements]
          } else if (typeof modified[target] === 'string') {
            modified[target] = `${modified[target]} ${content}`
          }
          break

        case 'replace':
          modified[target] = content
          break
      }

      console.log(`[Feedback Integration] Applied pattern ${pattern.patternId} to ${target}`)
    } catch (error) {
      console.warn(`[Feedback Integration] Failed to apply pattern ${pattern.patternId}:`, error)
    }
  }

  return modified
}

/**
 * Apply feedback patterns to prompt string
 */
export function applyPatternsToPrompt(
  prompt: string,
  patterns: FeedbackPattern[]
): string {
  let modified = prompt

  for (const pattern of patterns) {
    if (pattern.confidence < FEEDBACK_CONFIG.minConfidence) continue
    if (pattern.modification.target !== 'constraints') continue

    const { action, content } = pattern.modification

    switch (action) {
      case 'append':
        // Add to constraints section if it exists
        if (modified.includes('<constraints>') || modified.includes('CONSTRAINTS:')) {
          modified = modified.replace(
            /(<\/constraints>|CONSTRAINTS:[\s\S]*?(?=\n\n))/,
            `$1\n${content}`
          )
        } else {
          // Add at end
          modified = `${modified}\n\nADDITIONAL CONSTRAINT: ${content}`
        }
        break

      case 'prepend':
        // Add before main content
        modified = `LEARNED REQUIREMENT: ${content}\n\n${modified}`
        break
    }
  }

  return modified
}

// ============================================================
// PATTERN TRACKING
// ============================================================

/**
 * Record that a pattern was applied (for effectiveness tracking)
 */
export async function recordPatternApplication(
  patternId: string,
  success: boolean
): Promise<void> {
  try {
    const supabase = createClient()

    // Update pattern statistics
    const field = success ? 'success_count' : 'failure_count'

    await (supabase.rpc as Function)('increment_pattern_count', {
      p_pattern_id: patternId,
      p_field: field,
    })

    // Also update last_applied timestamp
    await (supabase.from as Function)('feedback_patterns')
      .update({ last_applied: new Date().toISOString() })
      .eq('id', patternId)
  } catch (error) {
    // Non-critical - log and continue
    console.warn('[Feedback Integration] Failed to record pattern application:', error)
  }
}

/**
 * Create a new learned pattern from successful generation
 */
export async function createLearnedPattern(params: {
  formatId: string
  eventType?: string
  patternType: 'prompt_enhancement' | 'constraint_addition' | 'style_modifier'
  trigger: Record<string, string>
  modification: {
    action: 'prepend' | 'append' | 'replace' | 'inject'
    target: string
    content: string
  }
  organizationId: string
}): Promise<string | null> {
  try {
    const supabase = createClient()

    const { data, error } = await (supabase.from as Function)('feedback_patterns')
      .insert({
        format_id: params.formatId,
        event_type: params.eventType,
        pattern_type: params.patternType,
        trigger: params.trigger,
        modification: params.modification,
        confidence: 0.5, // Start with moderate confidence
        success_count: 1,
        failure_count: 0,
        organization_id: params.organizationId,
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (error) {
      console.warn('[Feedback Integration] Failed to create pattern:', error)
      return null
    }

    return data?.id || null
  } catch (error) {
    console.warn('[Feedback Integration] Error creating pattern:', error)
    return null
  }
}

// ============================================================
// INTEGRATION HELPERS
// ============================================================

/**
 * Full integration flow: fetch patterns and apply to context
 */
export async function integratePattersWithDesignContext(
  context: Record<string, unknown>,
  params: {
    formatId: string
    eventType?: string
    organizationId?: string
  }
): Promise<{
  enhancedContext: Record<string, unknown>
  appliedPatterns: string[]
}> {
  // Fetch relevant patterns
  const patterns = await fetchRelevantPatterns(params)

  if (patterns.length === 0) {
    return {
      enhancedContext: context,
      appliedPatterns: [],
    }
  }

  // Apply patterns
  const enhancedContext = applyPatternsToDesignContext(context, patterns)

  return {
    enhancedContext,
    appliedPatterns: patterns.map(p => p.patternId),
  }
}
