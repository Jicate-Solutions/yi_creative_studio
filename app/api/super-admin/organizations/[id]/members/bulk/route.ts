/**
 * Super Admin API: Bulk Member Operations
 * POST /api/super-admin/organizations/[id]/members/bulk
 *
 * Perform bulk operations on organization members:
 * - change_role: Change role for multiple members
 * - remove: Remove multiple members from organization
 */

import { NextRequest, NextResponse } from 'next/server'
import { superAdminGuard } from '@/lib/middleware/super-admin-guard'

interface RouteParams {
  params: Promise<{ id: string }>
}

interface BulkOperation {
  action: 'change_role' | 'remove'
  member_ids: string[]
  new_role?: string
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id: organizationId } = await params

  return superAdminGuard(request, async (req, { adminClient, superAdmin }) => {
    const supabase = adminClient

    try {
      const body: BulkOperation = await req.json()
      const { action, member_ids, new_role } = body

      // Validate inputs
      if (!action || !['change_role', 'remove'].includes(action)) {
        return NextResponse.json(
          { success: false, error: 'Invalid action. Use "change_role" or "remove"' },
          { status: 400 }
        )
      }

      if (!member_ids || !Array.isArray(member_ids) || member_ids.length === 0) {
        return NextResponse.json(
          { success: false, error: 'No members selected' },
          { status: 400 }
        )
      }

      if (action === 'change_role' && !new_role) {
        return NextResponse.json(
          { success: false, error: 'New role is required for change_role action' },
          { status: 400 }
        )
      }

      if (new_role && !['admin', 'editor', 'viewer'].includes(new_role)) {
        return NextResponse.json(
          { success: false, error: 'Invalid role. Use "admin", "editor", or "viewer"' },
          { status: 400 }
        )
      }

      // Check if organization exists
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('id, name')
        .eq('id', organizationId)
        .single()

      if (orgError || !org) {
        return NextResponse.json(
          { success: false, error: 'Organization not found' },
          { status: 404 }
        )
      }

      // Verify all members belong to this organization
      const { data: validMembers, error: memberError } = await supabase
        .from('organization_members')
        .select('id, user_id, role')
        .eq('organization_id', organizationId)
        .in('id', member_ids)

      if (memberError) {
        console.error('[bulk-members] Failed to verify members:', memberError)
        return NextResponse.json(
          { success: false, error: 'Failed to verify members' },
          { status: 500 }
        )
      }

      if (!validMembers || validMembers.length === 0) {
        return NextResponse.json(
          { success: false, error: 'No valid members found for this organization' },
          { status: 400 }
        )
      }

      const validMemberIds = validMembers.map((m) => m.id)
      const invalidCount = member_ids.length - validMemberIds.length

      let result = { updated: 0, failed: 0, invalidCount }

      if (action === 'change_role') {
        // Update role for all valid members
        const { error: updateError, count } = await supabase
          .from('organization_members')
          .update({ role: new_role })
          .in('id', validMemberIds)

        if (updateError) {
          console.error('[bulk-members] Role update failed:', updateError)
          return NextResponse.json(
            { success: false, error: 'Failed to update roles' },
            { status: 500 }
          )
        }

        result.updated = count || validMemberIds.length

        // Log audit entry
        await supabase.from('super_admin_audit_logs').insert({
          super_admin_id: superAdmin.id,
          super_admin_email: superAdmin.email,
          action: 'bulk_role_change',
          resource_type: 'organization_members',
          resource_id: organizationId,
          target_organization_id: organizationId,
          changes: {
            organization_name: org.name,
            member_count: result.updated,
            new_role,
          },
        })

        return NextResponse.json({
          success: true,
          message: `Updated role to "${new_role}" for ${result.updated} member(s)`,
          result,
        })
      }

      if (action === 'remove') {
        // Remove all valid members from organization
        const { error: deleteError, count } = await supabase
          .from('organization_members')
          .delete()
          .in('id', validMemberIds)

        if (deleteError) {
          console.error('[bulk-members] Remove failed:', deleteError)
          return NextResponse.json(
            { success: false, error: 'Failed to remove members' },
            { status: 500 }
          )
        }

        result.updated = count || validMemberIds.length

        // Log audit entry
        await supabase.from('super_admin_audit_logs').insert({
          super_admin_id: superAdmin.id,
          super_admin_email: superAdmin.email,
          action: 'bulk_member_removal',
          resource_type: 'organization_members',
          resource_id: organizationId,
          target_organization_id: organizationId,
          changes: {
            organization_name: org.name,
            member_count: result.updated,
            removed_user_ids: validMembers.map((m) => m.user_id),
          },
        })

        return NextResponse.json({
          success: true,
          message: `Removed ${result.updated} member(s) from organization`,
          result,
        })
      }

      return NextResponse.json(
        { success: false, error: 'Unknown action' },
        { status: 400 }
      )
    } catch (error) {
      console.error('[bulk-members] Error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to perform bulk operation' },
        { status: 500 }
      )
    }
  })
}
