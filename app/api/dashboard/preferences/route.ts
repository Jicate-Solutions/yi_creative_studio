import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { DashboardCardId } from '@/types/dashboard.types'

const DEFAULT_CARD_ORDER: DashboardCardId[] = ['credits', 'creatives', 'monthly', 'speed']
const DEFAULT_MONTHLY_GOAL = 50

/**
 * GET /api/dashboard/preferences
 * Fetch user's dashboard preferences
 */
export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Try to fetch existing preferences
    const { data: preferences, error } = await supabase
      .from('user_dashboard_preferences' as any)
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = not found, which is fine
      console.error('Error fetching preferences:', error)
      return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 })
    }

    // Return preferences or defaults
    return NextResponse.json({
      preferences: preferences || {
        card_order: DEFAULT_CARD_ORDER,
        monthly_goal: DEFAULT_MONTHLY_GOAL,
      }
    })
  } catch (error) {
    console.error('Dashboard preferences GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/dashboard/preferences
 * Save user's dashboard preferences
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { card_order, monthly_goal } = body

    // Validate card_order if provided
    if (card_order) {
      const validCards: DashboardCardId[] = ['credits', 'creatives', 'monthly', 'speed']
      if (!Array.isArray(card_order) || card_order.length !== 4) {
        return NextResponse.json(
          { error: 'card_order must be an array of 4 card IDs' },
          { status: 400 }
        )
      }
      const hasAllCards = validCards.every(c => card_order.includes(c))
      if (!hasAllCards) {
        return NextResponse.json(
          { error: 'card_order must contain all 4 card IDs' },
          { status: 400 }
        )
      }
    }

    // Validate monthly_goal if provided
    if (monthly_goal !== undefined) {
      if (typeof monthly_goal !== 'number' || monthly_goal < 10 || monthly_goal > 500) {
        return NextResponse.json(
          { error: 'monthly_goal must be a number between 10 and 500' },
          { status: 400 }
        )
      }
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      user_id: user.id,
      updated_at: new Date().toISOString(),
    }
    if (card_order) updateData.card_order = card_order
    if (monthly_goal !== undefined) updateData.monthly_goal = monthly_goal

    // Upsert preferences
    const { data: preferences, error } = await supabase
      .from('user_dashboard_preferences' as any)
      .upsert(updateData, { onConflict: 'user_id' })
      .select()
      .single()

    if (error) {
      console.error('Error saving preferences:', error)
      return NextResponse.json({ error: 'Failed to save preferences' }, { status: 500 })
    }

    return NextResponse.json({ preferences })
  } catch (error) {
    console.error('Dashboard preferences POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
