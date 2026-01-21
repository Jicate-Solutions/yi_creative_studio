/**
 * Super Admin API: Suspend/Unsuspend User
 * POST /api/super-admin/users/[id]/suspend - Suspend user (soft delete)
 * DELETE /api/super-admin/users/[id]/suspend - Reactivate user
 */

import { NextRequest, NextResponse } from 'next/server'
import { superAdminGuard, getRequestMetadata } from '@/lib/middleware/super-admin-guard'
import { logSuperAdminAction } from '@/lib/services/audit-service'

/**
 * POST - Suspend user (soft delete)
 * Bans the user for 100 years, effectively permanently suspending them
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: targetUserId } = await params

  return superAdminGuard(request, async (req, { superAdmin, adminClient }) => {
    const body = await req.json()
    const { reason } = body

    if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request',
        details: 'Suspension reason is required (minimum 5 characters)',
      }, { status: 400 })
    }

    // Get user details first
    const { data: { user: targetUser }, error: getUserError } = await adminClient.auth.admin.getUserById(targetUserId)

    if (getUserError || !targetUser) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
        details: getUserError?.message || 'User does not exist',
      }, { status: 404 })
    }

    // Check if user is a Super Admin (cannot suspend)
    if (targetUser.app_metadata?.is_super_admin === true) {
      return NextResponse.json({
        success: false,
        error: 'Forbidden',
        details: 'Super Admin users cannot be suspended',
      }, { status: 403 })
    }

    // Check if already suspended (banned_until is available in the API response)
    const bannedUntil = (targetUser as any).banned_until
    if (bannedUntil && new Date(bannedUntil) > new Date()) {
      return NextResponse.json({
        success: false,
        error: 'User already suspended',
        details: 'This user is already suspended',
      }, { status: 409 })
    }

    // Ban user for 100 years (effectively permanent)
    const { error: banError } = await adminClient.auth.admin.updateUserById(targetUserId, {
      ban_duration: '876000h', // 100 years in hours
      user_metadata: {
        ...targetUser.user_metadata,
        suspended_at: new Date().toISOString(),
        suspension_reason: reason.trim(),
        suspended_by: superAdmin.id,
      },
    })

    if (banError) {
      console.error('[super-admin] Failed to suspend user:', banError)
      return NextResponse.json({
        success: false,
        error: 'Suspension failed',
        details: banError.message,
      }, { status: 500 })
    }

    // Log audit trail
    const metadata = getRequestMetadata(request)
    await logSuperAdminAction({
      super_admin_id: superAdmin.id,
      action: 'user:suspend',
      resource_type: 'user',
      resource_id: targetUserId,
      target_user_id: targetUserId,
      changes: {
        before: { status: 'active' },
        after: { status: 'suspended', reason: reason.trim() },
      },
      ip_address: metadata.ip_address,
      user_agent: metadata.user_agent,
    })

    console.log('[super-admin] User suspended:', targetUserId, 'by', superAdmin.email)

    return NextResponse.json({
      success: true,
      message: `User ${targetUser.email} has been suspended`,
      user: {
        id: targetUserId,
        email: targetUser.email,
        status: 'suspended',
        suspended_at: new Date().toISOString(),
      },
    })
  })
}

/**
 * DELETE - Reactivate user (remove ban)
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: targetUserId } = await params

  return superAdminGuard(request, async (req, { superAdmin, adminClient }) => {
    // Get user details first
    const { data: { user: targetUser }, error: getUserError } = await adminClient.auth.admin.getUserById(targetUserId)

    if (getUserError || !targetUser) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
        details: getUserError?.message || 'User does not exist',
      }, { status: 404 })
    }

    // Check if user is actually suspended (banned_until is available in the API response)
    const bannedUntil = (targetUser as any).banned_until
    if (!bannedUntil || new Date(bannedUntil) <= new Date()) {
      return NextResponse.json({
        success: false,
        error: 'User not suspended',
        details: 'This user is not currently suspended',
      }, { status: 400 })
    }

    // Remove ban by setting ban_duration to 'none'
    const { error: unbanError } = await adminClient.auth.admin.updateUserById(targetUserId, {
      ban_duration: 'none',
      user_metadata: {
        ...targetUser.user_metadata,
        suspended_at: null,
        suspension_reason: null,
        suspended_by: null,
        reactivated_at: new Date().toISOString(),
        reactivated_by: superAdmin.id,
      },
    })

    if (unbanError) {
      console.error('[super-admin] Failed to reactivate user:', unbanError)
      return NextResponse.json({
        success: false,
        error: 'Reactivation failed',
        details: unbanError.message,
      }, { status: 500 })
    }

    // Log audit trail
    const metadata = getRequestMetadata(request)
    await logSuperAdminAction({
      super_admin_id: superAdmin.id,
      action: 'user:reactivate',
      resource_type: 'user',
      resource_id: targetUserId,
      target_user_id: targetUserId,
      changes: {
        before: { status: 'suspended' },
        after: { status: 'active' },
      },
      ip_address: metadata.ip_address,
      user_agent: metadata.user_agent,
    })

    console.log('[super-admin] User reactivated:', targetUserId, 'by', superAdmin.email)

    return NextResponse.json({
      success: true,
      message: `User ${targetUser.email} has been reactivated`,
      user: {
        id: targetUserId,
        email: targetUser.email,
        status: 'active',
        reactivated_at: new Date().toISOString(),
      },
    })
  })
}
