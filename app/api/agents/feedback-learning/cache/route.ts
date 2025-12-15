/**
 * Feedback Learning Agent - Cache Management Endpoint
 *
 * POST /api/agents/feedback-learning/cache
 *   - Refresh/invalidate pattern cache
 *
 * GET /api/agents/feedback-learning/cache
 *   - Get cache status and statistics
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST - Manage cache
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

    // Parse action
    const body = await request.json().catch(() => ({}))
    const action = body.action || 'refresh'

    console.log('[Cache API] Action:', action)

    const { patternCache, invalidatePatternCache } = await import('@/lib/learning')

    let result: { action: string; success: boolean; message: string }

    switch (action) {
      case 'refresh': {
        await patternCache.refresh()
        result = {
          action: 'refresh',
          success: true,
          message: `Cache refreshed with ${patternCache.getActivePatternCount()} patterns`,
        }
        break
      }

      case 'invalidate': {
        invalidatePatternCache()
        result = {
          action: 'invalidate',
          success: true,
          message: 'Cache invalidated',
        }
        break
      }

      case 'warm': {
        if (!patternCache.isWarm()) {
          await patternCache.refresh()
          result = {
            action: 'warm',
            success: true,
            message: `Cache warmed with ${patternCache.getActivePatternCount()} patterns`,
          }
        } else {
          result = {
            action: 'warm',
            success: true,
            message: 'Cache already warm',
          }
        }
        break
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }

    return NextResponse.json({
      ...result,
      cache: {
        isWarm: patternCache.isWarm(),
        totalPatterns: patternCache.getActivePatternCount(),
        lastRefreshed: patternCache.getLastRefreshTime(),
      },
    })
  } catch (error) {
    console.error('[Cache API] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * GET - Get cache status
 */
export async function GET() {
  try {
    const { patternCache } = await import('@/lib/learning')

    const isWarm = patternCache.isWarm()
    const totalPatterns = patternCache.getActivePatternCount()
    const lastRefreshed = patternCache.getLastRefreshTime()

    // Get patterns by category from cache
    const categoryStats: Record<string, number> = {}
    const allPatterns = patternCache.getAllPatterns()
    for (const pattern of allPatterns) {
      categoryStats[pattern.category] = (categoryStats[pattern.category] || 0) + 1
    }

    return NextResponse.json({
      status: isWarm ? 'warm' : 'cold',
      totalPatterns,
      lastRefreshed,
      byCategory: categoryStats,
      health: {
        isOperational: true,
        patternCount: totalPatterns,
        lastUpdate: lastRefreshed,
      },
    })
  } catch (error) {
    console.error('[Cache API] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
