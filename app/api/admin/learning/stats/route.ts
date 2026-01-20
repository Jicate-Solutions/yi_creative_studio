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

    // 1. Pattern statistics - using learned_patterns table
    // Note: TypeScript types have 'effectiveness' as Json, not separate columns
    const patternQuery = supabase.from('learned_patterns')
      .select('id, pattern_type, issue_signature, times_applied, success_rate, confidence, status', { count: 'exact' })

    // Note: learned_patterns doesn't have organization_id, it's global
    // Skip organization filter for patterns

    const { data: patterns, count: totalPatterns } = await patternQuery

    // times_applied and success_rate are direct columns on learned_patterns
    const activePatterns = patterns?.filter((p) => p.status === 'active').length || 0
    const totalApplications = patterns?.reduce((sum: number, p) => {
      return sum + (p.times_applied || 0)
    }, 0) || 0
    // Calculate successes from success_rate * times_applied
    const totalSuccesses = patterns?.reduce((sum: number, p) => {
      const applications = p.times_applied || 0
      const rate = p.success_rate || 0
      return sum + Math.round(applications * rate)
    }, 0) || 0
    const overallEffectiveness = totalApplications > 0
      ? Math.round((totalSuccesses / totalApplications) * 100)
      : 0

    // 2. Pending patches count - using knowledge_patches table (actual table name)
    const patchQuery = supabase.from('knowledge_patches')
      .select('id', { count: 'exact' })
      .eq('status', 'pending')

    // Note: knowledge_patches doesn't have organization_id

    const { count: pendingPatches } = await patchQuery

    // 3. A/B Testing statistics - simplified for now
    // The RPC and creative_feedback table may not be in TypeScript types yet
    // Using empty defaults until types are regenerated
    const abTestStats = {
      prevention_count: 0,
      prevention_avg_rating: 0,
      holdout_count: 0,
      holdout_avg_rating: 0,
      improvement: 0,
      statistical_significance: 'insufficient_data' as const,
    }

    // 4. Issue type breakdown - using pattern_type column
    type BreakdownAcc = Record<string, { count: number; applications: number; successes: number }>
    const issueTypeBreakdown = patterns?.reduce((acc: BreakdownAcc, p) => {
      const type = p.pattern_type || 'unknown'
      if (!acc[type]) {
        acc[type] = { count: 0, applications: 0, successes: 0 }
      }
      acc[type].count++
      const applications = p.times_applied || 0
      acc[type].applications += applications
      acc[type].successes += Math.round(applications * (p.success_rate || 0))
      return acc
    }, {} as BreakdownAcc) || {}

    // 5. Format breakdown - format_id is stored in issue_signature jsonb
    type IssueSignature = { format_id?: string } | null
    const formatBreakdown = patterns?.reduce((acc: BreakdownAcc, p) => {
      const sigJson = p.issue_signature as IssueSignature
      const format = sigJson?.format_id || 'unknown'
      if (!acc[format]) {
        acc[format] = { count: 0, applications: 0, successes: 0 }
      }
      acc[format].count++
      const applications = p.times_applied || 0
      acc[format].applications += applications
      acc[format].successes += Math.round(applications * (p.success_rate || 0))
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
