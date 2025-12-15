/**
 * Feedback Learning Agent - Analyze Mode Endpoint
 *
 * POST /api/agents/feedback-learning/analyze
 *
 * Analyzes feedback batch and generates knowledge patches.
 * Admin only, manual trigger.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { FeedbackLearningAgent } from '@/lib/agents/feedback-learning-agent'
import { createUsageTracker } from '@/lib/services/api-usage'
import type { AnalyzeRequest } from '@/types/feedback-agent.types'

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const supabase = await createClient()

    // Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin role
    const { data: member } = await supabase
      .from('organization_members')
      .select('role, organization_id')
      .eq('user_id', user.id)
      .single()

    if (!member || !['owner', 'admin'].includes(member.role)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Parse request body
    const body: AnalyzeRequest = await request.json().catch(() => ({}))

    console.log('[Feedback Learning API] Analyze mode triggered by', user.email)

    // Create usage tracker
    const usageTracker = createUsageTracker({
      organizationId: member.organization_id,
      userId: user.id,
    })

    // Run analyze mode
    const agent = new FeedbackLearningAgent('analyze')
    const result = await agent.analyze({
      maxRating: body.feedbackFilters?.maxRating,
      maxFeedback: body.maxFeedback,
      minConfidence: body.minConfidence,
    })

    // Track usage
    if (result.usage.totalTokens > 0) {
      await usageTracker.track(
        'feedback_learning_analyze',
        'claude',
        'claude-haiku-4-5-20251001',
        {
          inputTokens: result.usage.inputTokens,
          outputTokens: result.usage.outputTokens,
          cachedTokens: 0,
        }
      )
    }

    // Log session
    await (supabase.from as Function)('learning_agent_sessions')
      .insert({
        mode: 'analyze',
        organization_id: member.organization_id,
        user_id: user.id,
        input_summary: {
          filters: body.feedbackFilters,
          maxFeedback: body.maxFeedback,
          minConfidence: body.minConfidence,
        },
        output_summary: {
          analyzed: result.analyzed,
          patternsFound: result.patternsFound.length,
          patchesCreated: result.patchesCreated.length,
        },
        patterns_matched: result.patternsFound.length,
        patches_created: result.patchesCreated.length,
        completed_at: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
        total_tokens: result.usage.totalTokens,
        estimated_cost_usd: result.usage.estimatedCostUsd,
      })

    return NextResponse.json(result)
  } catch (error) {
    console.error('[Feedback Learning API] Analyze error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
