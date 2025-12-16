/**
 * Pattern Seeding Module
 *
 * Seeds pre-defined patterns into the database for immediate value.
 * Call seedPatterns() on first deployment or to refresh patterns.
 */

import {
  PRE_SEEDED_PATTERNS,
  TOTAL_PATTERN_COUNT,
  getPatternCountByCategory,
  getPatternsForFormat,
  type PreSeededPattern,
} from './pre-seeded-patterns'

export {
  PRE_SEEDED_PATTERNS,
  TOTAL_PATTERN_COUNT,
  getPatternCountByCategory,
  getPatternsForFormat,
  type PreSeededPattern,
}

interface SeedResult {
  success: boolean
  inserted: number
  updated: number
  skipped: number
  errors: string[]
}

/**
 * Seed all pre-defined patterns to the database
 * Uses upsert to handle existing patterns gracefully
 */
export async function seedPatterns(options?: {
  forceUpdate?: boolean
  onlyNew?: boolean
}): Promise<SeedResult> {
  const { forceUpdate = false, onlyNew = false } = options || {}
  const result: SeedResult = {
    success: true,
    inserted: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  }

  try {
    // Dynamic import to avoid server/client issues
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    // Get existing patterns
    const { data: existing } = await (supabase.from as Function)('seeded_patterns')
      .select('pattern_key, version')

    const existingMap = new Map<string, number>(
      (existing || []).map((p: { pattern_key: string; version: number | null }) => [p.pattern_key, p.version ?? 0])
    )

    for (const pattern of PRE_SEEDED_PATTERNS) {
      try {
        const existingVersion = existingMap.get(pattern.patternKey)

        if (existingVersion !== undefined) {
          if (onlyNew) {
            result.skipped++
            continue
          }

          if (!forceUpdate && existingVersion >= 1) {
            result.skipped++
            continue
          }

          // Update existing pattern
          const { error } = await (supabase.from as Function)('seeded_patterns')
            .update({
              category: pattern.category,
              name: pattern.name,
              description: pattern.description,
              issue_signature: pattern.issueSignature,
              fix_mapping: pattern.fixMapping,
              format_ids: pattern.formatIds,
              confidence: pattern.confidence,
              source: 'knowledge_base',
              version: existingVersion + 1,
              updated_at: new Date().toISOString(),
            })
            .eq('pattern_key', pattern.patternKey)

          if (error) {
            result.errors.push(`Update ${pattern.patternKey}: ${error.message}`)
          } else {
            result.updated++
          }
        } else {
          // Insert new pattern
          const { error } = await (supabase.from as Function)('seeded_patterns')
            .insert({
              pattern_key: pattern.patternKey,
              category: pattern.category,
              name: pattern.name,
              description: pattern.description,
              issue_signature: pattern.issueSignature,
              fix_mapping: pattern.fixMapping,
              format_ids: pattern.formatIds,
              confidence: pattern.confidence,
              source: 'knowledge_base',
              is_active: true,
              version: 1,
            })

          if (error) {
            result.errors.push(`Insert ${pattern.patternKey}: ${error.message}`)
          } else {
            result.inserted++
          }
        }
      } catch (error) {
        result.errors.push(`Pattern ${pattern.patternKey}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    result.success = result.errors.length === 0

    console.log('[Seeding] Complete:', {
      inserted: result.inserted,
      updated: result.updated,
      skipped: result.skipped,
      errors: result.errors.length,
    })

    return result
  } catch (error) {
    console.error('[Seeding] Fatal error:', error)
    result.success = false
    result.errors.push(error instanceof Error ? error.message : 'Unknown error')
    return result
  }
}

/**
 * Check if patterns need seeding
 */
export async function checkSeedingStatus(): Promise<{
  needsSeeding: boolean
  currentCount: number
  expectedCount: number
  missingPatterns: string[]
}> {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const { data: existing, count } = await (supabase.from as Function)('seeded_patterns')
      .select('pattern_key', { count: 'exact' })
      .eq('source', 'knowledge_base')

    const existingKeys = new Set((existing || []).map((p: { pattern_key: string }) => p.pattern_key))
    const missingPatterns = PRE_SEEDED_PATTERNS
      .filter(p => !existingKeys.has(p.patternKey))
      .map(p => p.patternKey)

    return {
      needsSeeding: missingPatterns.length > 0,
      currentCount: count || 0,
      expectedCount: TOTAL_PATTERN_COUNT,
      missingPatterns,
    }
  } catch (error) {
    console.error('[Seeding] Error checking status:', error)
    return {
      needsSeeding: true,
      currentCount: 0,
      expectedCount: TOTAL_PATTERN_COUNT,
      missingPatterns: PRE_SEEDED_PATTERNS.map(p => p.patternKey),
    }
  }
}

/**
 * Clear all seeded patterns (for testing/reset)
 */
export async function clearSeededPatterns(): Promise<boolean> {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const { error } = await (supabase.from as Function)('seeded_patterns')
      .delete()
      .eq('source', 'knowledge_base')

    if (error) {
      console.error('[Seeding] Error clearing patterns:', error)
      return false
    }

    console.log('[Seeding] Cleared all knowledge_base patterns')
    return true
  } catch (error) {
    console.error('[Seeding] Error clearing patterns:', error)
    return false
  }
}
