/**
 * Super Admin API: Hard Delete User
 * DELETE /api/super-admin/users/[id]/delete
 *
 * Permanently deletes a user and all associated data:
 * - Removes from all organizations
 * - Anonymizes their creatives (keeps artwork, removes personal info)
 * - Deletes user profile
 * - Deletes auth user
 */

import { NextRequest, NextResponse } from 'next/server'
import { superAdminGuard } from '@/lib/middleware/super-admin-guard'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id: userId } = await params

  return superAdminGuard(request, async (req, { adminClient, superAdmin }) => {
    const supabase = adminClient

    try {
      // Validate confirmation
      const { searchParams } = new URL(req.url)
      const confirmDelete = searchParams.get('confirm')

      if (confirmDelete !== 'DELETE') {
        return NextResponse.json(
          { success: false, error: 'Deletion not confirmed. Pass ?confirm=DELETE' },
          { status: 400 }
        )
      }

      // Check if user exists
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, full_name, email')
        .eq('id', userId)
        .single()

      if (profileError || !profile) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        )
      }

      // Prevent self-deletion
      if (userId === superAdmin.id) {
        return NextResponse.json(
          { success: false, error: 'You cannot delete your own account' },
          { status: 400 }
        )
      }

      const userName = profile.full_name || profile.email || 'Unknown User'

      // Start deletion process
      const deletionSummary = {
        userId,
        userName,
        organizationsRemoved: 0,
        creativesAnonymized: 0,
        profileDeleted: false,
        authUserDeleted: false,
      }

      // 1. Remove from all organizations
      const { data: memberships, error: membershipQueryError } = await supabase
        .from('organization_members')
        .select('id, organization_id')
        .eq('user_id', userId)

      if (!membershipQueryError && memberships && memberships.length > 0) {
        const { error: membershipDeleteError } = await supabase
          .from('organization_members')
          .delete()
          .eq('user_id', userId)

        if (!membershipDeleteError) {
          deletionSummary.organizationsRemoved = memberships.length
        } else {
          console.error('[user-delete] Failed to remove memberships:', membershipDeleteError)
        }
      }

      // 2. Anonymize creatives (keep the artwork, remove personal info)
      const { data: creatives, error: creativesQueryError } = await supabase
        .from('creatives')
        .select('id')
        .eq('created_by', userId)

      if (!creativesQueryError && creatives && creatives.length > 0) {
        const { error: creativesUpdateError } = await supabase
          .from('creatives')
          .update({
            created_by: null,
            metadata: supabase.sql`metadata || '{"anonymized": true, "original_user_deleted": true}'::jsonb`,
          })
          .eq('created_by', userId)

        if (!creativesUpdateError) {
          deletionSummary.creativesAnonymized = creatives.length
        } else {
          console.error('[user-delete] Failed to anonymize creatives:', creativesUpdateError)
        }
      }

      // 3. Delete user profile
      const { error: profileDeleteError } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', userId)

      if (!profileDeleteError) {
        deletionSummary.profileDeleted = true
      } else {
        console.error('[user-delete] Failed to delete profile:', profileDeleteError)
      }

      // 4. Delete auth user (using admin API)
      const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId)

      if (!authDeleteError) {
        deletionSummary.authUserDeleted = true
      } else {
        console.error('[user-delete] Failed to delete auth user:', authDeleteError)
      }

      // Log audit entry
      await supabase.from('super_admin_audit_logs').insert({
        super_admin_id: superAdmin.id,
        super_admin_email: superAdmin.email,
        action: 'user_hard_deleted',
        resource_type: 'user',
        resource_id: userId,
        target_user_id: userId,
        changes: {
          deleted_user_name: userName,
          ...deletionSummary,
        },
      })

      // Check if deletion was complete
      const deletionComplete =
        deletionSummary.profileDeleted && deletionSummary.authUserDeleted

      if (!deletionComplete) {
        return NextResponse.json({
          success: false,
          error: 'Partial deletion completed. Some data may remain.',
          summary: deletionSummary,
        })
      }

      return NextResponse.json({
        success: true,
        message: `User "${userName}" has been permanently deleted`,
        summary: deletionSummary,
      })
    } catch (error) {
      console.error('[user-delete] Error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to delete user' },
        { status: 500 }
      )
    }
  })
}
