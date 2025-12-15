/**
 * Feedback Learning Agent - Vision Analysis Endpoint
 *
 * POST /api/agents/feedback-learning/vision
 *   - Analyze an image for quality issues
 *
 * GET /api/agents/feedback-learning/vision
 *   - Get vision analysis statistics and recent analyses
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST - Analyze image for quality issues
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Parse request
    const body = await request.json()

    if (!body.imageUrl) {
      return NextResponse.json(
        { error: 'imageUrl is required' },
        { status: 400 }
      )
    }

    const quickCheck = body.quickCheck === true

    console.log('[Vision API] Analyzing image...', { quickCheck })

    if (quickCheck) {
      // Quick quality check (no detailed analysis)
      const { quickQualityCheck } = await import('@/lib/learning/vision')
      const result = await quickQualityCheck(body.imageUrl)

      return NextResponse.json({
        success: true,
        quickCheck: true,
        ...result,
      })
    }

    // Full vision analysis
    const { analyzeImage } = await import('@/lib/learning/vision')
    const analysis = await analyzeImage({
      imageUrl: body.imageUrl,
      creativeId: body.creativeId,
      formatId: body.formatId,
      organizationId: body.organizationId,
      expectedElements: body.expectedElements,
    })

    if (!analysis) {
      return NextResponse.json(
        { error: 'Vision analysis failed' },
        { status: 500 }
      )
    }

    console.log('[Vision API] Analysis complete:', {
      issueCount: analysis.detectedIssues.length,
      overallScore: analysis.overallScore,
      flagForReview: analysis.flagForReview,
    })

    return NextResponse.json({
      success: true,
      analysis: {
        id: analysis.id,
        overallScore: analysis.overallScore,
        categoryScores: analysis.categoryScores,
        detectedIssues: analysis.detectedIssues,
        flagForReview: analysis.flagForReview,
        reviewReasons: analysis.reviewReasons,
        modelUsed: analysis.modelUsed,
        createdAt: analysis.createdAt,
      },
    })
  } catch (error) {
    console.error('[Vision API] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * GET - Get vision analysis statistics
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get query params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const flaggedOnly = searchParams.get('flagged') === 'true'

    // Get recent analyses
    let query = (supabase.from as Function)('vision_analysis')
      .select(`
        id,
        creative_id,
        overall_score,
        category_scores,
        detected_issues,
        flag_for_review,
        review_reasons,
        model_used,
        created_at
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (flaggedOnly) {
      query = query.eq('flag_for_review', true)
    }

    const { data: analyses, error } = await query

    if (error) {
      console.error('[Vision API] Error fetching analyses:', error)
    }

    // Calculate stats
    const allAnalyses = analyses || []
    const stats = {
      total: allAnalyses.length,
      flagged: allAnalyses.filter((a: Record<string, unknown>) => a.flag_for_review).length,
      avgScore: allAnalyses.length > 0
        ? allAnalyses.reduce((sum: number, a: Record<string, unknown>) =>
            sum + ((a.overall_score as number) || 0), 0) / allAnalyses.length
        : null,
      issuesByCategory: {} as Record<string, number>,
    }

    // Count issues by category
    for (const analysis of allAnalyses) {
      const issues = analysis.detected_issues as Array<{ category?: string }> || []
      for (const issue of issues) {
        const cat = issue.category || 'unknown'
        stats.issuesByCategory[cat] = (stats.issuesByCategory[cat] || 0) + 1
      }
    }

    return NextResponse.json({
      stats,
      analyses: allAnalyses.map((a: Record<string, unknown>) => ({
        id: a.id,
        creativeId: a.creative_id,
        overallScore: a.overall_score,
        categoryScores: a.category_scores,
        issueCount: (a.detected_issues as unknown[])?.length || 0,
        flagForReview: a.flag_for_review,
        reviewReasons: a.review_reasons,
        createdAt: a.created_at,
      })),
    })
  } catch (error) {
    console.error('[Vision API] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
