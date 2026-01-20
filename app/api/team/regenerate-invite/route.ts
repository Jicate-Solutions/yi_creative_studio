/**
 * Regenerate Organization Invite Code API
 *
 * SECURITY: Only organization admins can regenerate invite codes
 * Uses orgAdminGuard middleware for proper role enforcement
 *
 * POST /api/team/regenerate-invite
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { orgAdminGuard } from '@/lib/middleware/org-admin-guard'

export async function POST(request: NextRequest) {
  return orgAdminGuard(request, async (req, context) => {
    const { organizationId } = context
    const supabase = await createClient()

    // Generate new invite code
    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase()

    // Update the organization's invite code
    const { error } = await supabase
      .from('organizations')
      .update({ invite_code: newCode })
      .eq('id', organizationId)

    if (error) {
      console.error('[team/regenerate-invite] Failed to regenerate invite code:', error)
      return NextResponse.json(
        { error: 'Failed to regenerate invite code' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'New invite code generated',
      inviteCode: newCode,
    })
  })
}
