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

/**
 * GET - Retrieve organization details with full stats
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return superAdminGuard(request, async (req, { superAdmin }) => {
    const supabase = await createClient()
    const { id } = await params

    try {
      // Fetch organization
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', id)
        .single()

      if (orgError || !org) {
        return NextResponse.json(
          { error: 'Organization not found', details: orgError?.message },
          { status: 404 }
        )
      }

      // Get member count and list with user profiles
      const { data: members } = await supabase
        .from('organization_members')
        .select(`
          *,
          user_profiles(id, full_name)
        `)
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

      // Calculate total credits consumed from transactions
      const { data: consumptionTxns } = await supabase
        .from('credit_transactions')
        .select('amount')
        .eq('organization_id', id)
        .in('type', ['usage', 'consumption'])

      const totalCreditConsumed = consumptionTxns?.reduce(
        (sum, tx) => sum + Math.abs(tx.amount || 0),
        0
      ) || 0

      // Get last activity from most recent transaction
      const lastTransaction = recentTransactions?.[0]
      const lastActivity = lastTransaction?.created_at || org.created_at

      return NextResponse.json({
        success: true,
        organization: {
          ...org,
          stats: {
            member_count: members?.length || 0,
            creative_count: creativeCount || 0,
            total_credit_consumed: totalCreditConsumed,
            current_balance: org.credits_balance || 0,
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
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return superAdminGuard(request, async (req, { superAdmin }) => {
    const supabase = await createClient()
    const { id } = await params
    const metadata = getRequestMetadata(req)

    try {
      const body = await req.json()
      const { name, type } = body

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
      const updateData: Record<string, unknown> = {}
      if (name !== undefined) updateData.name = name
      if (type !== undefined) updateData.type = type
      updateData.updated_at = new Date().toISOString()

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
 * DELETE - Deactivate organization (soft delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return superAdminGuard(request, async (req, { superAdmin }) => {
    const supabase = await createClient()
    const { id } = await params
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

      // Soft delete (mark as inactive instead of actual deletion)
      const { error: deleteError } = await supabase
        .from('organizations')
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
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
          after: { is_active: false },
        },
        ...metadata,
      })

      return NextResponse.json({
        success: true,
        message: 'Organization deactivated successfully',
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
