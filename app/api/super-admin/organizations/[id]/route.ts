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
import { logSuperAdminAction } from '@/lib/services/audit-service'

/**
 * GET - Retrieve organization details with full stats
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return superAdminGuard(request, async (req, { superAdmin, adminClient }) => {
    // Use adminClient to bypass RLS and access any organization
    const supabase = adminClient
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

      // Get member count and list
      // Note: user_profiles has no FK relationship to organization_members,
      // so we fetch user data separately
      const { data: rawMembers } = await supabase
        .from('organization_members')
        .select('*')
        .eq('organization_id', id)

      // Fetch user details from auth for each member
      const members = await Promise.all(
        (rawMembers || []).map(async (member) => {
          let email = ''
          let fullName = 'Unknown'

          try {
            // Get user from auth
            const { data: { user } } = await adminClient.auth.admin.getUserById(member.user_id)
            if (user) {
              email = user.email || ''
              fullName = user.user_metadata?.full_name || 'Unknown'
            }
          } catch {
            // User might have been deleted
          }

          // Try to get full name from user_profiles as fallback
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('full_name')
            .eq('id', member.user_id)
            .single()

          return {
            ...member,
            email,
            full_name: profile?.full_name || fullName,
          }
        })
      )

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
  return superAdminGuard(request, async (req, { superAdmin, adminClient }) => {
    // Use adminClient to bypass RLS and modify any organization
    const supabase = adminClient
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
 * DELETE - Deactivate (soft delete) or permanently delete organization
 * Use ?permanent=true for hard delete
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return superAdminGuard(request, async (req, { superAdmin, adminClient }) => {
    // Use adminClient to bypass RLS and modify any organization
    const supabase = adminClient
    const { id } = await params
    const metadata = getRequestMetadata(req)

    // Check if permanent (hard) delete is requested
    const url = new URL(req.url)
    const permanent = url.searchParams.get('permanent') === 'true'

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

      if (permanent) {
        // HARD DELETE - Remove all related data and organization permanently
        console.log(`[super-admin] Hard deleting organization: ${id}`)

        // Delete in order to respect foreign key constraints (children first)

        // 1. Delete related tables that reference creatives
        await supabase.from('api_usage').delete().eq('organization_id', id)
        await supabase.from('creative_feedback').delete().eq('organization_id', id)

        // 2. Delete creatives
        await supabase.from('creatives').delete().eq('organization_id', id)

        // 3. Delete credit transactions
        await supabase.from('credit_transactions').delete().eq('organization_id', id)

        // 4. Delete organization members
        await supabase.from('organization_members').delete().eq('organization_id', id)

        // 5. Delete organization logos
        await supabase.from('organization_logos').delete().eq('organization_id', id)

        // 6. Delete logo presets
        await supabase.from('logo_presets').delete().eq('organization_id', id)

        // 7. Delete footer presets
        await supabase.from('footer_presets').delete().eq('organization_id', id)

        // 8. Delete landmark signatures
        await supabase.from('landmark_signatures').delete().eq('organization_id', id)

        // 9. Delete vertical logo presets
        await supabase.from('vertical_logo_presets').delete().eq('organization_id', id)

        // 10. Delete templates
        await supabase.from('templates').delete().eq('organization_id', id)

        // 11. Delete learning/AI related tables
        await supabase.from('learning_agent_sessions').delete().eq('organization_id', id)
        await supabase.from('learning_queue').delete().eq('organization_id', id)
        await supabase.from('prevention_actions').delete().eq('organization_id', id)
        await supabase.from('generation_lineage').delete().eq('organization_id', id)
        await supabase.from('vision_analysis').delete().eq('organization_id', id)
        await supabase.from('shadow_mode_logs').delete().eq('organization_id', id)
        await supabase.from('ab_assignments').delete().eq('organization_id', id)
        await supabase.from('pattern_cache_state').delete().eq('organization_id', id)
        await supabase.from('seeded_patterns').delete().eq('organization_id', id)
        await supabase.from('success_patterns').delete().eq('organization_id', id)
        await supabase.from('rollback_checkpoints').delete().eq('organization_id', id)

        // 12. Delete super admin audit logs referencing this org
        await supabase.from('super_admin_audit_logs').delete().eq('target_organization_id', id)

        // 13. Finally, delete the organization itself
        const { error: deleteError } = await supabase
          .from('organizations')
          .delete()
          .eq('id', id)

        if (deleteError) {
          console.error('[super-admin] Hard delete error:', deleteError)
          return NextResponse.json(
            { error: 'Failed to permanently delete organization', details: deleteError.message },
            { status: 500 }
          )
        }

        // Log Super Admin action (note: org is already deleted, so use a separate audit entry)
        // We can't log to super_admin_audit_logs with target_organization_id since org is deleted
        console.log(`[super-admin] Organization ${id} (${orgBefore.name}) permanently deleted by ${superAdmin.email}`)

        return NextResponse.json({
          success: true,
          message: 'Organization permanently deleted',
          deleted: {
            id: orgBefore.id,
            name: orgBefore.name,
          },
        })
      } else {
        // SOFT DELETE - Mark as inactive
        const { error: deleteError } = await supabase
          .from('organizations')
          .update({
            is_active: false,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)

        if (deleteError) {
          return NextResponse.json(
            { error: 'Failed to deactivate organization', details: deleteError.message },
            { status: 500 }
          )
        }

        // Log Super Admin action
        await logSuperAdminAction({
          super_admin_id: superAdmin.id,
          action: 'org:deactivate',
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
      }
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
