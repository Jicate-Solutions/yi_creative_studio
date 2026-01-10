/**
 * Super Admin API: Organization Details
 * GET /api/super-admin/organizations/[id]
 * PATCH /api/super-admin/organizations/[id]
 * DELETE /api/super-admin/organizations/[id]
 *
 * Manage individual organization details, settings, and lifecycle
 */

import { NextRequest, NextResponse } from 'next/server'
import { superAdminGuard, getRequestMetadata } from '@/lib/middleware/super-admin-guard'
import { createClient } from '@/lib/supabase/server'
import { logSuperAdminAction } from '@/lib/services/audit-service'

interface RouteContext {
  params: { id: string }
}

/**
 * GET - Retrieve organization details with full stats
 */
export async function GET(request: NextRequest, context: RouteContext) {
  return superAdminGuard(request, async (req, { superAdmin }) => {
    const supabase = await createClient()
    const { id } = context.params

    try {
      // Fetch organization with all related data
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select(
          `
          *,
          organization_credits(*),
          organization_subscriptions(
            *,
            subscription_tiers(*)
          )
        `
        )
        .eq('id', id)
        .single()

      if (orgError || !org) {
        return NextResponse.json(
          { error: 'Organization not found', details: orgError?.message },
          { status: 404 }
        )
      }

      // Get member count and list
      const { data: members } = await supabase
        .from('organization_members')
        .select(
          `
          *,
          auth.users(id, email, raw_user_meta_data)
        `
        )
        .eq('organization_id', id)

      // Get recent credit transactions
      const { data: recentTransactions } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('organization_id', id)
        .order('created_at', { ascending: false })
        .limit(10)

      // Get creative count
      const { count: creativeCount } = await supabase
        .from('creatives')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', id)

      // Calculate analytics
      const totalCreditConsumed = org.organization_credits?.[0]?.total_consumed || 0
      const currentBalance = org.organization_credits?.[0]?.balance || 0
      const lastActivity = org.organization_credits?.[0]?.last_consumption_at || org.created_at

      return NextResponse.json({
        success: true,
        organization: {
          ...org,
          stats: {
            member_count: members?.length || 0,
            creative_count: creativeCount || 0,
            total_credit_consumed: totalCreditConsumed,
            current_balance: currentBalance,
            last_activity: lastActivity,
          },
          members: members || [],
          recent_transactions: recentTransactions || [],
        },
      })
    } catch (error) {
      console.error('[super-admin] Failed to fetch org details:', error)
      return NextResponse.json(
        {
          error: 'Failed to fetch organization details',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      )
    }
  })
}

/**
 * PATCH - Update organization settings
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  return superAdminGuard(request, async (req, { superAdmin }) => {
    const supabase = await createClient()
    const { id } = context.params
    const metadata = getRequestMetadata(req)

    try {
      const body = await req.json()
      const { name, type, settings } = body

      // Get organization before update
      const { data: orgBefore } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', id)
        .single()

      if (!orgBefore) {
        return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
      }

      // Update organization
      const updateData: any = {}
      if (name !== undefined) updateData.name = name
      if (type !== undefined) updateData.type = type
      if (settings !== undefined) updateData.settings = settings

      const { data: orgAfter, error: updateError } = await supabase
        .from('organizations')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to update organization', details: updateError.message },
          { status: 500 }
        )
      }

      // Log Super Admin action
      await logSuperAdminAction({
        super_admin_id: superAdmin.id,
        action: 'org:update',
        resource_type: 'organization',
        resource_id: id,
        target_organization_id: id,
        changes: {
          before: orgBefore,
          after: orgAfter,
        },
        ...metadata,
      })

      return NextResponse.json({
        success: true,
        organization: orgAfter,
        message: 'Organization updated successfully',
      })
    } catch (error) {
      console.error('[super-admin] Failed to update org:', error)
      return NextResponse.json(
        {
          error: 'Failed to update organization',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      )
    }
  })
}

/**
 * DELETE - Soft delete organization
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  return superAdminGuard(request, async (req, { superAdmin }) => {
    const supabase = await createClient()
    const { id } = context.params
    const metadata = getRequestMetadata(req)

    try {
      // Get organization before deletion
      const { data: orgBefore } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', id)
        .single()

      if (!orgBefore) {
        return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
      }

      // Soft delete (mark as deleted instead of actual deletion)
      const { error: deleteError } = await supabase
        .from('organizations')
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: superAdmin.id,
        })
        .eq('id', id)

      if (deleteError) {
        return NextResponse.json(
          { error: 'Failed to delete organization', details: deleteError.message },
          { status: 500 }
        )
      }

      // Log Super Admin action
      await logSuperAdminAction({
        super_admin_id: superAdmin.id,
        action: 'org:delete',
        resource_type: 'organization',
        resource_id: id,
        target_organization_id: id,
        changes: {
          before: orgBefore,
          after: { deleted_at: new Date().toISOString() },
        },
        ...metadata,
      })

      return NextResponse.json({
        success: true,
        message: 'Organization deleted successfully',
      })
    } catch (error) {
      console.error('[super-admin] Failed to delete org:', error)
      return NextResponse.json(
        {
          error: 'Failed to delete organization',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      )
    }
  })
}
