/**
 * Super Admin API: Subscription Tier Management
 * PATCH /api/super-admin/subscriptions/tiers/[id] - Update tier
 * DELETE /api/super-admin/subscriptions/tiers/[id] - Delete tier
 *
 * Manage individual subscription tier settings
 */

import { NextRequest, NextResponse } from 'next/server'
import { superAdminGuard, getRequestMetadata } from '@/lib/middleware/super-admin-guard'
import { createClient } from '@/lib/supabase/server'
import { logSuperAdminAction } from '@/lib/services/audit-service'

interface RouteContext {
  params: { id: string }
}

/**
 * PATCH - Update subscription tier
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  return superAdminGuard(request, async (req, { superAdmin }) => {
    const supabase = await createClient()
    const { id: tierId } = context.params
    const metadata = getRequestMetadata(req)

    try {
      const body = await req.json()

      // Get current tier data
      const { data: tierBefore, error: fetchError } = await supabase
        .from('subscription_tiers')
        .select('*')
        .eq('id', tierId)
        .single()

      if (fetchError || !tierBefore) {
        return NextResponse.json(
          { error: 'Subscription tier not found' },
          { status: 404 }
        )
      }

      // Build update object
      const updateData: any = {}

      if (body.display_name !== undefined) updateData.display_name = body.display_name
      if (body.description !== undefined) updateData.description = body.description
      if (body.price_monthly !== undefined) updateData.price_monthly = parseFloat(body.price_monthly)
      if (body.price_yearly !== undefined) updateData.price_yearly = body.price_yearly ? parseFloat(body.price_yearly) : null
      if (body.monthly_credits !== undefined) updateData.monthly_credits = parseInt(body.monthly_credits)
      if (body.rollover_allowed !== undefined) updateData.rollover_allowed = body.rollover_allowed
      if (body.max_rollover_credits !== undefined) updateData.max_rollover_credits = body.max_rollover_credits ? parseInt(body.max_rollover_credits) : null
      if (body.features !== undefined) updateData.features = body.features
      if (body.is_active !== undefined) updateData.is_active = body.is_active
      if (body.is_public !== undefined) updateData.is_public = body.is_public
      if (body.sort_order !== undefined) updateData.sort_order = parseInt(body.sort_order)

      updateData.updated_at = new Date().toISOString()

      // Update tier
      const { data: tierAfter, error: updateError } = await supabase
        .from('subscription_tiers')
        .update(updateData)
        .eq('id', tierId)
        .select()
        .single()

      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to update subscription tier', details: updateError.message },
          { status: 500 }
        )
      }

      // Log Super Admin action
      await logSuperAdminAction({
        super_admin_id: superAdmin.id,
        action: 'subscription_tier:update',
        resource_type: 'subscription_tier',
        resource_id: tierId,
        changes: {
          before: {
            display_name: tierBefore.display_name,
            price_monthly: tierBefore.price_monthly,
            monthly_credits: tierBefore.monthly_credits,
          },
          after: {
            display_name: tierAfter.display_name,
            price_monthly: tierAfter.price_monthly,
            monthly_credits: tierAfter.monthly_credits,
          },
        },
        ...metadata,
      })

      return NextResponse.json({
        success: true,
        message: 'Subscription tier updated successfully',
        tier: tierAfter,
      })
    } catch (error) {
      console.error('[super-admin] Failed to update subscription tier:', error)
      return NextResponse.json(
        {
          error: 'Failed to update subscription tier',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      )
    }
  })
}

/**
 * DELETE - Delete subscription tier
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  return superAdminGuard(request, async (req, { superAdmin }) => {
    const supabase = await createClient()
    const { id: tierId } = context.params
    const metadata = getRequestMetadata(req)

    try {
      // Check if tier exists
      const { data: tier, error: fetchError } = await supabase
        .from('subscription_tiers')
        .select('*, subscription_tiers!inner(id)')
        .eq('id', tierId)
        .single()

      if (fetchError || !tier) {
        return NextResponse.json(
          { error: 'Subscription tier not found' },
          { status: 404 }
        )
      }

      // Check if tier has active subscriptions
      const { data: activeSubscriptions, error: subsError } = await supabase
        .from('organization_subscriptions')
        .select('id')
        .eq('tier_id', tierId)
        .eq('status', 'active')

      if (subsError) {
        return NextResponse.json(
          { error: 'Failed to check active subscriptions', details: subsError.message },
          { status: 500 }
        )
      }

      if (activeSubscriptions && activeSubscriptions.length > 0) {
        return NextResponse.json(
          {
            error: 'Cannot delete tier with active subscriptions',
            details: `This tier has ${activeSubscriptions.length} active subscription(s). Please reassign or cancel them first.`,
            active_subscriptions_count: activeSubscriptions.length,
          },
          { status: 409 }
        )
      }

      // Delete tier
      const { error: deleteError } = await supabase
        .from('subscription_tiers')
        .delete()
        .eq('id', tierId)

      if (deleteError) {
        return NextResponse.json(
          { error: 'Failed to delete subscription tier', details: deleteError.message },
          { status: 500 }
        )
      }

      // Log Super Admin action
      await logSuperAdminAction({
        super_admin_id: superAdmin.id,
        action: 'subscription_tier:delete',
        resource_type: 'subscription_tier',
        resource_id: tierId,
        changes: {
          before: {
            name: tier.name,
            display_name: tier.display_name,
            price_monthly: tier.price_monthly,
          },
        },
        ...metadata,
      })

      return NextResponse.json({
        success: true,
        message: 'Subscription tier deleted successfully',
      })
    } catch (error) {
      console.error('[super-admin] Failed to delete subscription tier:', error)
      return NextResponse.json(
        {
          error: 'Failed to delete subscription tier',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      )
    }
  })
}
