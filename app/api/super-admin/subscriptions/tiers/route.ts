/**
 * Super Admin API: Subscription Tiers
 * GET /api/super-admin/subscriptions/tiers - List all subscription tiers
 * POST /api/super-admin/subscriptions/tiers - Create new subscription tier
 *
 * Manage subscription tier definitions (Free/Pro/Enterprise)
 */

import { NextRequest, NextResponse } from 'next/server'
import { superAdminGuard, getRequestMetadata } from '@/lib/middleware/super-admin-guard'
import { createClient } from '@/lib/supabase/server'
import { logSuperAdminAction } from '@/lib/services/audit-service'

/**
 * GET - List all subscription tiers
 */
export async function GET(request: NextRequest) {
  return superAdminGuard(request, async () => {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const includeInactive = searchParams.get('includeInactive') === 'true'

    try {
      let query = supabase
        .from('subscription_tiers')
        .select('*')
        .order('sort_order', { ascending: true })

      if (!includeInactive) {
        query = query.eq('is_active', true)
      }

      const { data: tiers, error } = await query

      if (error) {
        console.error('[super-admin] Failed to fetch subscription tiers:', error)
        return NextResponse.json(
          { error: 'Failed to fetch subscription tiers', details: error.message },
          { status: 500 }
        )
      }

      // Get subscription counts for each tier
      const { data: subscriptionCounts } = await supabase
        .from('organization_subscriptions')
        .select('tier_id, status')
        .eq('status', 'active')

      const countsMap = subscriptionCounts?.reduce((acc, sub) => {
        acc[sub.tier_id] = (acc[sub.tier_id] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {}

      const tiersWithCounts = tiers?.map((tier) => ({
        ...tier,
        active_subscriptions: countsMap[tier.id] || 0,
      }))

      return NextResponse.json({
        success: true,
        tiers: tiersWithCounts || [],
      })
    } catch (error) {
      console.error('[super-admin] Exception fetching subscription tiers:', error)
      return NextResponse.json(
        {
          error: 'Internal server error',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      )
    }
  })
}

/**
 * POST - Create new subscription tier
 */
export async function POST(request: NextRequest) {
  return superAdminGuard(request, async (req, { superAdmin }) => {
    const supabase = await createClient()
    const metadata = getRequestMetadata(req)

    try {
      const body = await req.json()
      const {
        name,
        display_name,
        description,
        price_monthly,
        price_yearly,
        monthly_credits,
        rollover_allowed,
        max_rollover_credits,
        features,
        is_active,
        is_public,
        sort_order,
      } = body

      // Validation
      if (!name || !display_name || price_monthly === undefined || !monthly_credits) {
        return NextResponse.json(
          {
            error: 'Missing required fields',
            details: 'name, display_name, price_monthly, and monthly_credits are required',
          },
          { status: 400 }
        )
      }

      // Check if tier name already exists
      const { data: existing } = await supabase
        .from('subscription_tiers')
        .select('id')
        .eq('name', name)
        .single()

      if (existing) {
        return NextResponse.json(
          { error: 'Tier name already exists', details: `A tier with name "${name}" already exists` },
          { status: 409 }
        )
      }

      // Create tier
      const { data: tier, error: createError } = await supabase
        .from('subscription_tiers')
        .insert({
          name,
          display_name,
          description: description || null,
          price_monthly: parseFloat(price_monthly),
          price_yearly: price_yearly ? parseFloat(price_yearly) : null,
          monthly_credits: parseInt(monthly_credits),
          rollover_allowed: rollover_allowed || false,
          max_rollover_credits: max_rollover_credits ? parseInt(max_rollover_credits) : null,
          features: features || {},
          is_active: is_active !== false,
          is_public: is_public !== false,
          sort_order: sort_order !== undefined ? parseInt(sort_order) : 0,
        })
        .select()
        .single()

      if (createError) {
        return NextResponse.json(
          { error: 'Failed to create subscription tier', details: createError.message },
          { status: 500 }
        )
      }

      // Log Super Admin action
      await logSuperAdminAction({
        super_admin_id: superAdmin.id,
        action: 'subscription_tier:create',
        resource_type: 'subscription_tier',
        resource_id: tier.id,
        changes: {
          after: {
            name,
            display_name,
            price_monthly,
            monthly_credits,
          },
        },
        ...metadata,
      })

      return NextResponse.json({
        success: true,
        message: 'Subscription tier created successfully',
        tier,
      })
    } catch (error) {
      console.error('[super-admin] Failed to create subscription tier:', error)
      return NextResponse.json(
        {
          error: 'Failed to create subscription tier',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      )
    }
  })
}
