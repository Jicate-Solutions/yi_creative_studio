/**
 * Super Admin API: Assign Subscription to Organization
 * POST /api/super-admin/subscriptions/[id]/assign
 *
 * Assign a subscription tier to an organization
 */

import { NextRequest, NextResponse } from 'next/server'
import { superAdminGuard, getRequestMetadata } from '@/lib/middleware/super-admin-guard'
import { createClient } from '@/lib/supabase/server'
import { logSuperAdminAction } from '@/lib/services/audit-service'
import { allocateCredits } from '@/lib/services/credit-service'

interface RouteContext {
  params: { id: string }
}

/**
 * POST - Assign subscription tier to organization
 */
export async function POST(request: NextRequest, context: RouteContext) {
  return superAdminGuard(request, async (req, { superAdmin }) => {
    const supabase = await createClient()
    const { id: organizationId } = context.params
    const metadata = getRequestMetadata(req)

    try {
      const body = await req.json()
      const {
        tier_id,
        billing_cycle = 'monthly',
        is_trial = false,
        trial_days = 14,
        auto_renew = true,
        discount_percent = 0,
        discount_reason,
      } = body

      if (!tier_id) {
        return NextResponse.json(
          { error: 'tier_id is required' },
          { status: 400 }
        )
      }

      // Verify organization exists
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('id, name')
        .eq('id', organizationId)
        .single()

      if (orgError || !org) {
        return NextResponse.json(
          { error: 'Organization not found' },
          { status: 404 }
        )
      }

      // Verify tier exists
      const { data: tier, error: tierError } = await supabase
        .from('subscription_tiers')
        .select('*')
        .eq('id', tier_id)
        .single()

      if (tierError || !tier) {
        return NextResponse.json(
          { error: 'Subscription tier not found' },
          { status: 404 }
        )
      }

      // Check for existing active subscription
      const { data: existingSubscription } = await supabase
        .from('organization_subscriptions')
        .select('id, status, subscription_tiers(name)')
        .eq('organization_id', organizationId)
        .in('status', ['active', 'trial'])
        .single()

      if (existingSubscription) {
        return NextResponse.json(
          {
            error: 'Organization already has an active subscription',
            details: `This organization is currently on the "${(existingSubscription.subscription_tiers as any)?.name}" plan`,
            current_subscription_id: existingSubscription.id,
          },
          { status: 409 }
        )
      }

      // Calculate subscription period
      const now = new Date()
      const periodStart = now
      const periodEnd = new Date(now)

      if (is_trial) {
        periodEnd.setDate(periodEnd.getDate() + trial_days)
      } else if (billing_cycle === 'yearly') {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1)
      } else {
        periodEnd.setMonth(periodEnd.getMonth() + 1)
      }

      // Create subscription
      const { data: subscription, error: createError } = await supabase
        .from('organization_subscriptions')
        .insert({
          organization_id: organizationId,
          tier_id,
          status: is_trial ? 'trial' : 'active',
          period_start: periodStart.toISOString(),
          period_end: periodEnd.toISOString(),
          auto_renew,
          is_trial,
          trial_ends_at: is_trial ? periodEnd.toISOString() : null,
          next_billing_date: !is_trial ? periodEnd.toISOString() : null,
          billing_cycle,
          discount_percent: parseFloat(discount_percent) || 0,
          discount_reason: discount_reason || null,
          created_by: superAdmin.id,
        })
        .select()
        .single()

      if (createError) {
        return NextResponse.json(
          { error: 'Failed to create subscription', details: createError.message },
          { status: 500 }
        )
      }

      // Allocate monthly credits
      try {
        await allocateCredits({
          organization_id: organizationId,
          amount: tier.monthly_credits,
          reason: `${tier.display_name} subscription ${is_trial ? 'trial ' : ''}started`,
          allocated_by: superAdmin.id,
          reference_type: 'subscription_renewal',
          reference_id: subscription.id,
        })
      } catch (creditError) {
        console.error('[super-admin] Failed to allocate credits:', creditError)
        // Don't fail the subscription creation, but log the error
      }

      // Log Super Admin action
      await logSuperAdminAction({
        super_admin_id: superAdmin.id,
        action: 'subscription:assign',
        resource_type: 'subscription',
        resource_id: subscription.id,
        target_organization_id: organizationId,
        changes: {
          after: {
            tier_name: tier.name,
            billing_cycle,
            is_trial,
            period_start: periodStart.toISOString(),
            period_end: periodEnd.toISOString(),
            monthly_credits: tier.monthly_credits,
          },
        },
        ...metadata,
      })

      return NextResponse.json({
        success: true,
        message: `${tier.display_name} subscription assigned successfully`,
        subscription: {
          id: subscription.id,
          organization_id: organizationId,
          organization_name: org.name,
          tier_name: tier.display_name,
          status: subscription.status,
          period_start: subscription.period_start,
          period_end: subscription.period_end,
          monthly_credits: tier.monthly_credits,
          is_trial,
        },
      })
    } catch (error) {
      console.error('[super-admin] Failed to assign subscription:', error)
      return NextResponse.json(
        {
          error: 'Failed to assign subscription',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      )
    }
  })
}
