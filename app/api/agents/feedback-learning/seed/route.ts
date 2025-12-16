/**
 * Feedback Learning Agent - Seed Patterns Endpoint
 *
 * POST /api/agents/feedback-learning/seed
 *
 * Seeds pre-defined patterns into the database for day-1 value.
 * Admin only endpoint.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Auth check - admin only
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check admin status
    const { data: member } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (member?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Parse options
    const body = await request.json().catch(() => ({}))
    const forceReseed = body.forceReseed === true

    console.log('[Seed API] Starting pattern seeding...', { forceReseed })

    // Import and run seeding
    const { seedPatterns } = await import('@/lib/learning/seeding')
    const result = await seedPatterns({ forceUpdate: forceReseed })

    // Refresh pattern cache
    const { patternCache } = await import('@/lib/learning')
    await patternCache.refresh()

    console.log('[Seed API] Seeding complete:', result)

    return NextResponse.json({
      ...result,
      cacheRefreshed: true,
    })
  } catch (error) {
    console.error('[Seed API] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/agents/feedback-learning/seed
 *
 * Get list of available pre-seeded patterns
 */
export async function GET() {
  try {
    const { PRE_SEEDED_PATTERNS } = await import('@/lib/learning/seeding')

    // Group by category
    const byCategory: Record<string, { count: number; patterns: string[] }> = {}

    for (const pattern of PRE_SEEDED_PATTERNS) {
      if (!byCategory[pattern.category]) {
        byCategory[pattern.category] = { count: 0, patterns: [] }
      }
      byCategory[pattern.category].count++
      byCategory[pattern.category].patterns.push(pattern.name)
    }

    return NextResponse.json({
      totalPatterns: PRE_SEEDED_PATTERNS.length,
      byCategory,
      patterns: PRE_SEEDED_PATTERNS.map(p => ({
        key: p.patternKey,
        name: p.name,
        category: p.category,
        confidence: p.confidence,
      })),
    })
  } catch (error) {
    console.error('[Seed API] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
