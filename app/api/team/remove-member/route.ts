/**
 * Team Member Removal API
 *
 * SECURITY: Only organization admins can remove members
 * Uses orgAdminGuard middleware for proper role enforcement
 *
 * POST /api/team/remove-member
 * Body: { memberId: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { orgAdminGuard } from '@/lib/middleware/org-admin-guard'

export async function POST(request: NextRequest) {
  return orgAdminGuard(request, async (req, context) => {
    const { user, organizationId, isSuperAdmin } = context
    const supabase = await createClient()

    const body = await req.json()
    const { memberId } = body as { memberId: string }

    if (!memberId) {
      return NextResponse.json(
        { error: 'Missing required field: memberId' },
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

    // Security check: Can only remove members from own organization (unless Super Admin)
    if (!isSuperAdmin && targetMember.organization_id !== organizationId) {
      return NextResponse.json(
        {
          error: 'Access denied',
          code: 'CROSS_ORG_ACCESS_DENIED',
          message: 'You can only remove members from your own organization',
        },
        { status: 403 }
      )
    }

    // Prevent self-removal
    if (targetMember.user_id === user.id) {
      return NextResponse.json(
        {
          error: 'Cannot remove yourself',
          message: 'You cannot remove yourself from the organization',
        },
        { status: 400 }
      )
    }

    // Remove the member
    const { error: deleteError } = await supabase
      .from('organization_members')
      .delete()
      .eq('id', memberId)

    if (deleteError) {
      console.error('[team/remove-member] Failed to remove member:', deleteError)
      return NextResponse.json(
        { error: 'Failed to remove member' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Member removed from organization',
      memberId,
    })
  })
}
