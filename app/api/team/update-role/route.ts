/**
 * Team Role Update API
 *
 * SECURITY: Only organization admins can update member roles
 * Uses orgAdminGuard middleware for proper role enforcement
 *
 * POST /api/team/update-role
 * Body: { memberId: string, newRole: 'admin' | 'editor' | 'viewer' }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { orgAdminGuard } from '@/lib/middleware/org-admin-guard'

export async function POST(request: NextRequest) {
  return orgAdminGuard(request, async (req, context) => {
    const { user, organizationId, isSuperAdmin } = context
    const supabase = await createClient()

    const body = await req.json()
    const { memberId, newRole } = body as {
      memberId: string
      newRole: 'admin' | 'editor' | 'viewer'
    }

    if (!memberId || !newRole) {
      return NextResponse.json(
        { error: 'Missing required fields: memberId and newRole' },
        { status: 400 }
      )
    }

    // Validate role
    const validRoles = ['admin', 'editor', 'viewer']
    if (!validRoles.includes(newRole)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be admin, editor, or viewer' },
        { status: 400 }
      )
    }

    // Get the target member to verify they belong to user's org
    const { data: targetMember, error: memberError } = await supabase
      .from('organization_members')
      .select('id, user_id, organization_id, role')
      .eq('id', memberId)
      .single()

    if (memberError || !targetMember) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      )
    }

    // Security check: Can only update members in own organization (unless Super Admin)
    if (!isSuperAdmin && targetMember.organization_id !== organizationId) {
      return NextResponse.json(
        {
          error: 'Access denied',
          code: 'CROSS_ORG_ACCESS_DENIED',
          message: 'You can only manage members in your own organization',
        },
        { status: 403 }
      )
    }

    // Prevent self-demotion from admin (edge case protection)
    if (targetMember.user_id === user.id && targetMember.role === 'admin' && newRole !== 'admin') {
      return NextResponse.json(
        {
          error: 'Cannot change your own admin role',
          message: 'You cannot demote yourself from admin. Ask another admin to do this.',
        },
        { status: 400 }
      )
    }

    // Update the member's role
    const { error: updateError } = await supabase
      .from('organization_members')
      .update({ role: newRole })
      .eq('id', memberId)

    if (updateError) {
      console.error('[team/update-role] Failed to update role:', updateError)
      return NextResponse.json(
        { error: 'Failed to update member role' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Member role updated to ${newRole}`,
      memberId,
      newRole,
    })
  })
}
