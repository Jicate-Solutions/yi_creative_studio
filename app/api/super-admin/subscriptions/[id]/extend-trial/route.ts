/**
 * Super Admin API: Extend Trial Period
 * POST /api/super-admin/subscriptions/[id]/extend-trial
 *
 * Extend the trial period for a subscription
 */

import { NextRequest, NextResponse } from 'next/server'
import { superAdminGuard, getRequestMetadata } from '@/lib/middleware/super-admin-guard'
import { createClient } from '@/lib/supabase/server'
import { logSuperAdminAction } from '@/lib/services/audit-service'

interface RouteContext {
  params: { id: string }
}

/**
 * POST - Extend trial period for subscription
 */
export async function POST(request: NextRequest, context: RouteContext) {
  return superAdminGuard(request, async (req, { superAdmin }) => {
    const supabase = await createClient()
    const { id: subscriptionId } = context.params
    const metadata = getRequestMetadata(req)

    try {
      const body = await req.json()
      const { days = 7, reason } = body

      if (!reason || reason.trim().length < 10) {
        return NextResponse.json(
          {
            error: 'Invalid reason',
            details: 'Please provide a detailed reason for trial extension (minimum 10 characters)',
          },
          { status: 400 }
        )
      }

      if (days < 1 || days > 90) {
        return NextResponse.json(
          { error: 'Extension days must be between 1 and 90' },
          { status: 400 }
        )
      }

      // Get subscription details
      const { data: subscription, error: fetchError } = await supabase
        .from('organization_subscriptions')
        .select(`
          *,
          organizations(id, name),
          subscription_tiers(name, display_name)
        `)
        .eq('id', subscriptionId)
        .single()

      if (fetchError || !subscription) {
        return NextResponse.json(
          { error: 'Subscription not found' },
          { status: 404 }
        )
      }

      // Verify subscription is in trial
      if (subscription.status !== 'trial') {
        return NextResponse.json(
          {
            error: 'Subscription is not in trial status',
            details: `Current status: ${subscription.status}`,
          },
          { status: 400 }
        )
      }

      // Calculate new trial end date
      const currentTrialEnd = new Date(subscription.trial_ends_at || subscription.period_end)
      const newTrialEnd = new Date(currentTrialEnd)
      newTrialEnd.setDate(newTrialEnd.getDate() + days)

      // Update subscription
      const { data: updatedSubscription, error: updateError } = await supabase
        .from('organization_subscriptions')
        .update({
          trial_ends_at: newTrialEnd.toISOString(),
          period_end: newTrialEnd.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscriptionId)
        .select()
        .single()

      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to extend trial', details: updateError.message },
          { status: 500 }
        )
      }

      // Log Super Admin action
      await logSuperAdminAction({
        super_admin_id: superAdmin.id,
        action: 'subscription:extend_trial',
        resource_type: 'subscription',
        resource_id: subscriptionId,
        target_organization_id: subscription.organization_id,
        changes: {
          before: {
            trial_ends_at: currentTrialEnd.toISOString(),
          },
          after: {
            trial_ends_at: newTrialEnd.toISOString(),
            extension_days: days,
            reason,
          },
        },
        ...metadata,
      })

      return NextResponse.json({
        success: true,
        message: `Trial extended by ${days} day(s)`,
        subscription: {
          id: updatedSubscription.id,
          organization_name: (subscription.organizations as any)?.name,
          tier_name: (subscription.subscription_tiers as any)?.display_name,
          original_trial_end: currentTrialEnd.toISOString(),
          new_trial_end: newTrialEnd.toISOString(),
          extension_days: days,
        },
      })
    } catch (error) {
      console.error('[super-admin] Failed to extend trial:', error)
      return NextResponse.json(
        {
          error: 'Failed to extend trial',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      )
    }
  })
}
