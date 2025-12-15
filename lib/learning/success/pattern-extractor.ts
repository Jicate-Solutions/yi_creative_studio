/**
 * Success Pattern Extractor
 *
 * Learns from highly-rated creatives to identify and amplify what works.
 * Extracts common patterns from successful creatives to apply to future generations.
 */

import type {
  SuccessPattern,
  SuccessSignature,
  SuccessExtractionResult,
} from '@/types/learning.types'

// Minimum rating to consider a creative "successful"
const SUCCESS_RATING_THRESHOLD = 4
// Minimum number of successful creatives to extract a pattern
const MIN_SAMPLES_FOR_PATTERN = 3

/**
 * Extract success patterns from high-rated creatives
 */
export async function extractSuccessPatterns(
  formatId?: string,
  organizationId?: string,
  limit: number = 100
): Promise<SuccessExtractionResult> {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    // Get high-rated creatives with their form data
    let query = (supabase.from as Function)('creatives')
      .select(`
        id,
        format_id,
        organization_id,
        form_data,
        design_data,
        created_at
      `)
      .gte('average_rating', SUCCESS_RATING_THRESHOLD)
      .not('form_data', 'is', null)
      .order('average_rating', { ascending: false })
      .limit(limit)

    if (formatId) {
      query = query.eq('format_id', formatId)
    }
    if (organizationId) {
      query = query.eq('organization_id', organizationId)
    }

    const { data: creatives, error } = await query

    if (error || !creatives?.length) {
      console.log('[SuccessExtractor] No successful creatives found')
      return {
        patternsFound: 0,
        newPatterns: [],
        updatedPatterns: [],
        sourceCreatives: [],
      }
    }

    // Group creatives by format
    const byFormat = new Map<string, typeof creatives>()
    for (const creative of creatives) {
      const fmtId = creative.format_id
      if (!byFormat.has(fmtId)) {
        byFormat.set(fmtId, [])
      }
      byFormat.get(fmtId)!.push(creative)
    }

    const newPatterns: SuccessPattern[] = []
    const updatedPatterns: SuccessPattern[] = []
    const sourceCreativeIds: string[] = []

    // Extract patterns for each format
    for (const [fmtId, fmtCreatives] of byFormat) {
      if (fmtCreatives.length < MIN_SAMPLES_FOR_PATTERN) continue

      const signature = extractSignatureFromCreatives(fmtCreatives)
      const avgRating = calculateAverageRating(fmtCreatives)

      // Check if pattern already exists
      const existingPattern = await findExistingPattern(supabase, fmtId, organizationId)

      if (existingPattern) {
        // Update existing pattern
        const updated = await updateSuccessPattern(
          supabase,
          existingPattern.id,
          signature,
          avgRating,
          fmtCreatives.length,
          fmtCreatives.map((c: { id: string }) => c.id)
        )
        if (updated) {
          updatedPatterns.push(updated)
        }
      } else {
        // Create new pattern
        const created = await createSuccessPattern(
          supabase,
          fmtId,
          organizationId,
          signature,
          avgRating,
          fmtCreatives.map((c: { id: string }) => c.id)
        )
        if (created) {
          newPatterns.push(created)
        }
      }

      sourceCreativeIds.push(...fmtCreatives.map((c: { id: string }) => c.id))
    }

    console.log(`[SuccessExtractor] Found ${newPatterns.length} new, ${updatedPatterns.length} updated patterns`)

    return {
      patternsFound: newPatterns.length + updatedPatterns.length,
      newPatterns,
      updatedPatterns,
      sourceCreatives: sourceCreativeIds,
    }
  } catch (error) {
    console.error('[SuccessExtractor] Error:', error)
    return {
      patternsFound: 0,
      newPatterns: [],
      updatedPatterns: [],
      sourceCreatives: [],
    }
  }
}

/**
 * Extract common signature from creatives
 */
function extractSignatureFromCreatives(
  creatives: Array<{
    form_data: Record<string, unknown>
    design_data?: Record<string, unknown>
  }>
): SuccessSignature {
  // Extract common form data patterns
  const formDataPatterns: Record<string, unknown> = {}
  const designContextPatterns: Record<string, unknown> = {}
  const allKeywords: string[] = []

  // Find common fields that appear in majority of successful creatives
  const fieldCounts = new Map<string, number>()
  const fieldValues = new Map<string, unknown[]>()

  for (const creative of creatives) {
    const formData = creative.form_data || {}

    for (const [key, value] of Object.entries(formData)) {
      if (value === null || value === undefined || value === '') continue

      fieldCounts.set(key, (fieldCounts.get(key) || 0) + 1)

      if (!fieldValues.has(key)) {
        fieldValues.set(key, [])
      }
      fieldValues.get(key)!.push(value)

      // Extract keywords from text fields
      if (typeof value === 'string') {
        const words = value.toLowerCase().split(/\s+/).filter(w => w.length > 3)
        allKeywords.push(...words)
      }
    }

    // Design data patterns
    if (creative.design_data) {
      for (const [key, value] of Object.entries(creative.design_data)) {
        if (value !== null && value !== undefined) {
          if (!designContextPatterns[key]) {
            designContextPatterns[key] = value
          }
        }
      }
    }
  }

  // Keep fields that appear in >60% of creatives
  const threshold = creatives.length * 0.6
  for (const [field, count] of fieldCounts) {
    if (count >= threshold) {
      const values = fieldValues.get(field)!
      // Find most common value
      const valueCounts = new Map<string, number>()
      for (const v of values) {
        const key = JSON.stringify(v)
        valueCounts.set(key, (valueCounts.get(key) || 0) + 1)
      }
      let mostCommon = values[0]
      let maxCount = 0
      for (const [key, cnt] of valueCounts) {
        if (cnt > maxCount) {
          maxCount = cnt
          mostCommon = JSON.parse(key)
        }
      }
      formDataPatterns[field] = mostCommon
    }
  }

  // Find most common keywords
  const keywordCounts = new Map<string, number>()
  for (const kw of allKeywords) {
    keywordCounts.set(kw, (keywordCounts.get(kw) || 0) + 1)
  }
  const commonKeywords = Array.from(keywordCounts.entries())
    .filter(([_, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([kw]) => kw)

  return {
    formDataPatterns,
    designContextPatterns,
    commonKeywords,
  }
}

/**
 * Calculate average rating from creatives
 */
function calculateAverageRating(
  creatives: Array<{ average_rating?: number }>
): number {
  const ratings = creatives
    .map(c => c.average_rating)
    .filter((r): r is number => r !== undefined && r !== null)

  if (ratings.length === 0) return 0
  return ratings.reduce((a, b) => a + b, 0) / ratings.length
}

/**
 * Find existing success pattern
 */
async function findExistingPattern(
  supabase: unknown,
  formatId: string,
  organizationId?: string
): Promise<{ id: string } | null> {
  const query = ((supabase as { from: Function }).from as Function)('success_patterns')
    .select('id')
    .eq('format_id', formatId)

  if (organizationId) {
    query.eq('organization_id', organizationId)
  } else {
    query.is('organization_id', null)
  }

  const { data } = await query.single()
  return data
}

/**
 * Create new success pattern
 */
async function createSuccessPattern(
  supabase: unknown,
  formatId: string,
  organizationId: string | undefined,
  signature: SuccessSignature,
  avgRating: number,
  sourceCreativeIds: string[]
): Promise<SuccessPattern | null> {
  const patternKey = `success_${formatId}_${organizationId || 'global'}_${Date.now()}`

  const { data, error } = await ((supabase as { from: Function }).from as Function)('success_patterns')
    .insert({
      pattern_key: patternKey,
      format_id: formatId,
      organization_id: organizationId,
      name: `Success pattern for ${formatId}`,
      success_signature: signature,
      amplification_hints: generateAmplificationHints(signature),
      source_creative_ids: sourceCreativeIds,
      avg_rating: avgRating,
      sample_count: sourceCreativeIds.length,
      confidence: calculateConfidence(sourceCreativeIds.length, avgRating),
      is_active: true,
    })
    .select()
    .single()

  if (error) {
    console.error('[SuccessExtractor] Error creating pattern:', error)
    return null
  }

  return mapDbToSuccessPattern(data)
}

/**
 * Update existing success pattern
 */
async function updateSuccessPattern(
  supabase: unknown,
  patternId: string,
  signature: SuccessSignature,
  avgRating: number,
  sampleCount: number,
  sourceCreativeIds: string[]
): Promise<SuccessPattern | null> {
  const { data, error } = await ((supabase as { from: Function }).from as Function)('success_patterns')
    .update({
      success_signature: signature,
      amplification_hints: generateAmplificationHints(signature),
      source_creative_ids: sourceCreativeIds,
      avg_rating: avgRating,
      sample_count: sampleCount,
      confidence: calculateConfidence(sampleCount, avgRating),
      updated_at: new Date().toISOString(),
    })
    .eq('id', patternId)
    .select()
    .single()

  if (error) {
    console.error('[SuccessExtractor] Error updating pattern:', error)
    return null
  }

  return mapDbToSuccessPattern(data)
}

/**
 * Generate amplification hints from signature
 */
function generateAmplificationHints(signature: SuccessSignature): {
  promptEnhancements: string[]
  designSuggestions: string[]
  styleRecommendations: string[]
} {
  const promptEnhancements: string[] = []
  const designSuggestions: string[] = []
  const styleRecommendations: string[] = []

  // Generate hints from common keywords
  if (signature.commonKeywords.length > 0) {
    promptEnhancements.push(
      `Incorporate themes: ${signature.commonKeywords.slice(0, 5).join(', ')}`
    )
  }

  // Generate hints from form data patterns
  for (const [key, value] of Object.entries(signature.formDataPatterns)) {
    if (key.includes('style')) {
      styleRecommendations.push(`Consider ${key}: ${value}`)
    } else if (key.includes('color')) {
      designSuggestions.push(`Use ${key}: ${value}`)
    }
  }

  return {
    promptEnhancements,
    designSuggestions,
    styleRecommendations,
  }
}

/**
 * Calculate pattern confidence based on sample size and rating
 */
function calculateConfidence(sampleCount: number, avgRating: number): number {
  // More samples + higher rating = higher confidence
  const sampleFactor = Math.min(sampleCount / 10, 1) // Max at 10 samples
  const ratingFactor = (avgRating - 3) / 2 // 0-1 for ratings 3-5
  return Math.min(0.5 + (sampleFactor * 0.3) + (ratingFactor * 0.2), 1)
}

function mapDbToSuccessPattern(db: Record<string, unknown>): SuccessPattern {
  return {
    id: db.id as string,
    patternKey: db.pattern_key as string,
    formatId: db.format_id as string,
    organizationId: db.organization_id as string | undefined,
    name: db.name as string,
    description: db.description as string | undefined,
    successSignature: db.success_signature as SuccessSignature,
    amplificationHints: db.amplification_hints as SuccessPattern['amplificationHints'],
    sourceCreativeIds: db.source_creative_ids as string[],
    avgRating: db.avg_rating as number,
    sampleCount: db.sample_count as number,
    confidence: db.confidence as number,
    isActive: db.is_active as boolean,
    timesApplied: db.times_applied as number,
    applicationSuccessRate: db.application_success_rate as number,
    lastAppliedAt: db.last_applied_at as string | undefined,
    createdAt: db.created_at as string,
    updatedAt: db.updated_at as string,
  }
}
