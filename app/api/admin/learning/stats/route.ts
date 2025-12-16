/**
 * Learning Stats API
 * GET: Aggregate statistics including A/B testing effectiveness
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get search params for filtering
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organization_id')
    const days = parseInt(searchParams.get('days') || '30')

    const sinceDate = new Date()
    sinceDate.setDate(sinceDate.getDate() - days)
    const sinceDateStr = sinceDate.toISOString()

    // 1. Pattern statistics
    let patternQuery = (supabase.from as Function)('learning_patterns')
      .select('id, format_id, issue_type, application_count, success_count, is_active', { count: 'exact' })

    if (organizationId) {
      patternQuery = patternQuery.eq('organization_id', organizationId)
    }

    const { data: patterns, count: totalPatterns } = await patternQuery

    type PatternRow = { is_active?: boolean; application_count?: number; success_count?: number }
    const activePatterns = patterns?.filter((p: PatternRow) => p.is_active).length || 0
    const totalApplications = patterns?.reduce((sum: number, p: PatternRow) => sum + (p.application_count || 0), 0) || 0
    const totalSuccesses = patterns?.reduce((sum: number, p: PatternRow) => sum + (p.success_count || 0), 0) || 0
    const overallEffectiveness = totalApplications > 0
      ? Math.round((totalSuccesses / totalApplications) * 100)
      : 0

    // 2. Pending patches count
    let patchQuery = (supabase.from as Function)('learning_patch_queue')
      .select('id', { count: 'exact' })
      .eq('status', 'pending')

    if (organizationId) {
      patchQuery = patchQuery.eq('organization_id', organizationId)
    }

    const { count: pendingPatches } = await patchQuery

    // 3. A/B Testing statistics
    // Compare feedback ratings between prevention-applied and holdout groups
    const { data: abTestData, error: abError } = await (supabase.rpc as Function)('get_ab_test_stats', {
      p_since_date: sinceDateStr,
      p_organization_id: organizationId || null,
    }).single()

    // If RPC doesn't exist yet, calculate manually
    let abTestStats = abTestData
    if (abError || !abTestData) {
      // Manual calculation as fallback
      const { data: creatives } = await supabase
        .from('creatives')
        .select('id, prevention_applied, prevention_holdout, created_at')
        .gte('created_at', sinceDateStr)
        .not('prevention_applied', 'is', null)

      const { data: feedbacks } = await (supabase.from as Function)('creative_feedback')
        .select('creative_id, rating')
        .not('rating', 'is', null)

      if (creatives && feedbacks) {
        type FeedbackRow = { creative_id: string; rating: number }
        type CreativeRow = { id: string; prevention_applied: boolean | null; prevention_holdout: boolean | null }

        // Build a map of creative_id to ratings
        const ratingMap = new Map<string, number[]>()
        feedbacks.forEach((f: FeedbackRow) => {
          if (!ratingMap.has(f.creative_id)) {
            ratingMap.set(f.creative_id, [])
          }
          ratingMap.get(f.creative_id)?.push(f.rating)
        })

        // Separate into groups
        const preventionGroup = {
          count: 0,
          totalRating: 0,
          ratings: [] as number[],
        }
        const holdoutGroup = {
          count: 0,
          totalRating: 0,
          ratings: [] as number[],
        }

        creatives.forEach((c: CreativeRow) => {
          const ratings = ratingMap.get(c.id)
          if (ratings && ratings.length > 0) {
            const avgRating = ratings.reduce((a, b) => a + b, 0) / ratings.length

            if (c.prevention_holdout) {
              holdoutGroup.count++
              holdoutGroup.totalRating += avgRating
              holdoutGroup.ratings.push(avgRating)
            } else if (c.prevention_applied) {
              preventionGroup.count++
              preventionGroup.totalRating += avgRating
              preventionGroup.ratings.push(avgRating)
            }
          }
        })

        const preventionAvg = preventionGroup.count > 0
          ? preventionGroup.totalRating / preventionGroup.count
          : 0
        const holdoutAvg = holdoutGroup.count > 0
          ? holdoutGroup.totalRating / holdoutGroup.count
          : 0

        abTestStats = {
          prevention_count: preventionGroup.count,
          prevention_avg_rating: Math.round(preventionAvg * 100) / 100,
          holdout_count: holdoutGroup.count,
          holdout_avg_rating: Math.round(holdoutAvg * 100) / 100,
          improvement: preventionAvg - holdoutAvg,
          statistical_significance: calculateSignificance(
            preventionGroup.ratings,
            holdoutGroup.ratings
          ),
        }
      }
    }

    // 4. Issue type breakdown
    type BreakdownAcc = Record<string, { count: number; applications: number; successes: number }>
    type PatternItem = { issue_type?: string; format_id?: string; application_count?: number; success_count?: number }
    const issueTypeBreakdown = patterns?.reduce((acc: BreakdownAcc, p: PatternItem) => {
      const type = p.issue_type || 'unknown'
      if (!acc[type]) {
        acc[type] = { count: 0, applications: 0, successes: 0 }
      }
      acc[type].count++
      acc[type].applications += p.application_count || 0
      acc[type].successes += p.success_count || 0
      return acc
    }, {} as BreakdownAcc) || {}

    // 5. Format breakdown
    const formatBreakdown = patterns?.reduce((acc: BreakdownAcc, p: PatternItem) => {
      const format = p.format_id || 'unknown'
      if (!acc[format]) {
        acc[format] = { count: 0, applications: 0, successes: 0 }
      }
      acc[format].count++
      acc[format].applications += p.application_count || 0
      acc[format].successes += p.success_count || 0
      return acc
    }, {} as Record<string, { count: number; applications: number; successes: number }>) || {}

    return NextResponse.json({
      success: true,
      stats: {
        // Pattern stats
        totalPatterns: totalPatterns || 0,
        activePatterns,
        totalApplications,
        totalSuccesses,
        overallEffectiveness,
        pendingPatches: pendingPatches || 0,

        // A/B testing stats
        abTesting: abTestStats || {
          prevention_count: 0,
          prevention_avg_rating: 0,
          holdout_count: 0,
          holdout_avg_rating: 0,
          improvement: 0,
          statistical_significance: null,
        },

        // Breakdowns
        issueTypeBreakdown,
        formatBreakdown,
      },
      period: {
        days,
        since: sinceDateStr,
      },
    })
  } catch (error) {
    console.error('[Learning Stats API] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}

/**
 * Calculate statistical significance using a simple t-test approximation
 */
function calculateSignificance(
  group1: number[],
  group2: number[]
): 'significant' | 'not_significant' | 'insufficient_data' {
  // Need at least 10 samples in each group for meaningful analysis
  if (group1.length < 10 || group2.length < 10) {
    return 'insufficient_data'
  }

  const mean1 = group1.reduce((a, b) => a + b, 0) / group1.length
  const mean2 = group2.reduce((a, b) => a + b, 0) / group2.length

  const var1 = group1.reduce((sum, x) => sum + Math.pow(x - mean1, 2), 0) / (group1.length - 1)
  const var2 = group2.reduce((sum, x) => sum + Math.pow(x - mean2, 2), 0) / (group2.length - 1)

  const pooledSE = Math.sqrt(var1 / group1.length + var2 / group2.length)

  if (pooledSE === 0) return 'insufficient_data'

  const tStat = Math.abs(mean1 - mean2) / pooledSE

  // For 95% confidence with large sample, t > 1.96 is significant
  return tStat > 1.96 ? 'significant' : 'not_significant'
}
