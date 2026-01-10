/**
 * Super Admin API: Suspend/Reactivate User
 * POST /api/super-admin/users/[id]/suspend
 * DELETE /api/super-admin/users/[id]/suspend (reactivate)
 *
 * Suspend or reactivate user accounts
 */

import { NextRequest, NextResponse } from 'next/server'
import { superAdminGuard, getRequestMetadata } from '@/lib/middleware/super-admin-guard'
import { createClient } from '@/lib/supabase/server'
import { logSuperAdminAction } from '@/lib/services/audit-service'

interface RouteContext {
  params: { id: string }
}

/**
 * POST - Suspend user account
 */
export async function POST(request: NextRequest, context: RouteContext) {
  return superAdminGuard(request, async (req, { superAdmin }) => {
    const supabase = await createClient()
    const { id: userId } = context.params
    const metadata = getRequestMetadata(req)

    try {
      const body = await req.json()
      const { reason } = body

      if (!reason) {
        return NextResponse.json(
          { error: 'Suspension reason is required' },
          { status: 400 }
        )
      }

      // Get user before suspension
      const { data: userBefore, error: fetchError } = await supabase
        .from('auth.users')
        .select('id, email, status')
        .eq('id', userId)
        .single()

      if (fetchError || !userBefore) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }

      // Prevent suspending Super Admins
      if ((userBefore as any).is_super_admin) {
        return NextResponse.json(
          { error: 'Cannot suspend Super Admin users' },
          { status: 403 }
        )
      }

      // Check if already suspended
      if (userBefore.status === 'suspended') {
        return NextResponse.json(
          { error: 'User is already suspended' },
          { status: 400 }
        )
      }

      // Update user status to suspended
      const { error: updateError } = await supabase
        .from('auth.users')
        .update({
          status: 'suspended',
          suspended_at: new Date().toISOString(),
          suspended_by: superAdmin.id,
          suspension_reason: reason,
        })
        .eq('id', userId)

      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to suspend user', details: updateError.message },
          { status: 500 }
        )
      }

      // Log Super Admin action
      await logSuperAdminAction({
        super_admin_id: superAdmin.id,
        action: 'user:suspend',
        resource_type: 'user',
        resource_id: userId,
        target_user_id: userId,
        changes: {
          before: { status: userBefore.status },
          after: { status: 'suspended', reason },
        },
        ...metadata,
      })

      return NextResponse.json({
        success: true,
        message: 'User suspended successfully',
        user: {
          id: userId,
          email: userBefore.email,
          status: 'suspended',
        },
      })
    } catch (error) {
      console.error('[super-admin] Failed to suspend user:', error)
      return NextResponse.json(
        {
          error: 'Failed to suspend user',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      )
    }
  })
}

/**
 * DELETE - Reactivate suspended user
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  return superAdminGuard(request, async (req, { superAdmin }) => {
    const supabase = await createClient()
    const { id: userId } = context.params
    const metadata = getRequestMetadata(req)

    try {
      // Get user before reactivation
      const { data: userBefore, error: fetchError } = await supabase
        .from('auth.users')
        .select('id, email, status, suspended_at, suspension_reason')
        .eq('id', userId)
        .single()

      if (fetchError || !userBefore) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }

      // Check if user is suspended
      if (userBefore.status !== 'suspended') {
        return NextResponse.json(
          { error: 'User is not suspended' },
          { status: 400 }
        )
      }

      // Reactivate user
      const { error: updateError } = await supabase
        .from('auth.users')
        .update({
          status: 'active',
          suspended_at: null,
          suspended_by: null,
          suspension_reason: null,
        })
        .eq('id', userId)

      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to reactivate user', details: updateError.message },
          { status: 500 }
        )
      }

      // Log Super Admin action
      await logSuperAdminAction({
        super_admin_id: superAdmin.id,
        action: 'user:reactivate',
        resource_type: 'user',
        resource_id: userId,
        target_user_id: userId,
        changes: {
          before: { status: 'suspended', reason: userBefore.suspension_reason },
          after: { status: 'active' },
        },
        ...metadata,
      })

      return NextResponse.json({
        success: true,
        message: 'User reactivated successfully',
        user: {
          id: userId,
          email: userBefore.email,
          status: 'active',
        },
      })
    } catch (error) {
      console.error('[super-admin] Failed to reactivate user:', error)
      return NextResponse.json(
        {
          error: 'Failed to reactivate user',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      )
    }
  })
}
