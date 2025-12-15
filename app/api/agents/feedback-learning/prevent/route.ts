/**
 * Feedback Learning Agent - Prevention Mode Endpoint (10/10 Architecture)
 *
 * POST /api/agents/feedback-learning/prevent
 *
 * Enhanced prevention flow with:
 * 1. Ultra-fast cache-based pattern matching (<50ms)
 * 2. Shadow mode for pattern validation
 * 3. A/B testing for statistical validation
 * 4. Multi-layer interventions (L1-L5)
 * 5. Full lineage tracking for ground truth
 *
 * Called internally from generate route.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { GenerationRequestSnapshot } from '@/types/learning.types'

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const supabase = await createClient()

    // Auth check - can be internal or authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Parse request body
    const body = await request.json()

    if (!body.generationRequest) {
      return NextResponse.json(
        { error: 'generationRequest is required' },
        { status: 400 }
      )
    }

    // Validate organization access if user is authenticated
    if (user && body.generationRequest.organizationId) {
      const { data: member } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .eq('organization_id', body.generationRequest.organizationId)
        .single()

      if (!member) {
        return NextResponse.json(
          { error: 'Organization access denied' },
          { status: 403 }
        )
      }
    }

    // Convert to GenerationRequestSnapshot for new learning system
    const requestSnapshot: GenerationRequestSnapshot = {
      formatId: body.generationRequest.formatId,
      formData: body.generationRequest.formData || {},
      organizationId: body.generationRequest.organizationId,
      userId: user?.id,
      verticalId: body.generationRequest.verticalId,
      designContext: body.generationRequest.designContext,
      logosPlacements: body.generationRequest.logosPlacements || [],
    }

    // Determine mode
    const shadowOnly = body.shadowOnly === true
    const skipAB = body.skipAB === true
    const useNewSystem = body.useNewSystem !== false // Default to new system

    console.log('[Prevention API] Request for format:', requestSnapshot.formatId, {
      shadowOnly,
      skipAB,
      useNewSystem,
    })

    // Use new 10/10 learning system
    if (useNewSystem) {
      try {
        const { runPreventionPipeline, patternCache } = await import('@/lib/learning')

        // Ensure cache is warm
        if (!patternCache.isWarm()) {
          console.log('[Prevention API] Warming pattern cache...')
          await patternCache.refresh()
        }

        // Generate a unique request ID for tracking
        const generationRequestId = body.generationRequestId ||
          `req-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

        // Run the new prevention pipeline
        const result = await runPreventionPipeline(requestSnapshot, {
          generationRequestId,
          organizationId: requestSnapshot.organizationId,
          userId: requestSnapshot.userId,
          shadowOnly,
          skipAB,
        })

        console.log('[Prevention API] New system result:', {
          prevented: result.prevented,
          matchedPatterns: result.matchedPatterns.length,
          latencyMs: result.latencyMs,
          shadowMode: result.shadowMode,
          variant: result.variant,
        })

        // Map to response format
        return NextResponse.json({
          success: true,
          shouldAdjust: result.prevented,
          adjustments: result.adjustments.map(adj => ({
            id: adj.id || `adj-${Date.now()}`,
            type: adj.layer.replace('L', 'layer_').toLowerCase(),
            target: adj.layer,
            originalValue: null,
            suggestedValue: adj.value,
            reason: adj.reason,
            patternId: adj.patternId,
            confidence: adj.confidence,
          })),
          matchedPatterns: result.matchedPatterns.map(id => ({
            patternId: id,
            matchScore: 0.8, // Simplified
          })),
          confidence: result.matchedPatterns.length > 0 ? 0.8 : 0,
          reasoning: result.prevented
            ? `Matched ${result.matchedPatterns.length} patterns and applied ${result.adjustments.length} interventions`
            : result.shadowMode
              ? `Shadow mode: Would have matched ${result.matchedPatterns.length} patterns`
              : result.variant === 'control'
                ? `A/B control: Skipping ${result.matchedPatterns.length} matched patterns`
                : 'No patterns matched',
          preventionActionId: result.preventionActionId,
          lineageId: result.lineageId,
          experimentId: result.experimentId,
          variant: result.variant,
          shadowMode: result.shadowMode,
          shadowLogId: result.shadowLogId,
          proposedAdjustments: result.proposedAdjustments,
          latencyMs: result.latencyMs,
          usage: {
            totalTokens: 0,
            inputTokens: 0,
            outputTokens: 0,
            totalDurationMs: Date.now() - startTime,
            apiCalls: 0,
            estimatedCostUsd: 0,
          },
        })
      } catch (newSystemError) {
        console.error('[Prevention API] New system error, falling back to legacy:', newSystemError)
        // Fall through to legacy system
      }
    }

    // Legacy fallback: Use old FeedbackLearningAgent
    console.log('[Prevention API] Using legacy prevention system')
    const { FeedbackLearningAgent } = await import('@/lib/agents/feedback-learning-agent')
    const agent = new FeedbackLearningAgent('prevent')
    const result = await agent.prevent(body.generationRequest)

    return NextResponse.json({
      ...result,
      latencyMs: Date.now() - startTime,
    })
  } catch (error) {
    console.error('[Prevention API] Error:', error)

    // Return safe response on error - don't block generation
    return NextResponse.json({
      success: false,
      shouldAdjust: false,
      adjustments: [],
      matchedPatterns: [],
      confidence: 0,
      reasoning: 'Prevention check failed - proceeding without adjustments',
      latencyMs: Date.now() - startTime,
      usage: {
        totalTokens: 0,
        inputTokens: 0,
        outputTokens: 0,
        totalDurationMs: Date.now() - startTime,
        apiCalls: 0,
        estimatedCostUsd: 0,
      },
    })
  }
}

/**
 * GET /api/agents/feedback-learning/prevent
 *
 * Get prevention system status and statistics
 */
export async function GET() {
  try {
    const { patternCache, getQueueStats, getShadowStats } = await import('@/lib/learning')

    // Get cache stats
    const cacheStats = {
      isWarm: patternCache.isWarm(),
      totalPatterns: patternCache.getActivePatternCount(),
      lastRefreshed: patternCache.getLastRefreshTime(),
    }

    // Get queue stats
    const queueStats = await getQueueStats()

    // Get shadow stats
    const shadowStats = await getShadowStats()

    return NextResponse.json({
      status: 'operational',
      system: '10/10 Learning Architecture',
      cache: cacheStats,
      queue: queueStats,
      shadow: shadowStats,
      features: {
        shadowMode: true,
        abTesting: true,
        multiLayerInterventions: true,
        visionAnalysis: true,
        successPatterns: true,
        rollbackSafety: true,
        realTimeLearning: true,
      },
    })
  } catch (error) {
    console.error('[Prevention API] Status error:', error)
    return NextResponse.json({
      status: 'degraded',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
