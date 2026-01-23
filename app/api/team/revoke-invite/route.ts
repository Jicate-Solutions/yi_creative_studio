/**
 * Revoke Invite Link
 * POST /api/team/revoke-invite
 *
 * Deactivates an invite link so it can no longer be used
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { orgAdminGuard } from '@/lib/middleware/org-admin-guard'
import { z } from 'zod'

const revokeInviteSchema = z.object({
  inviteId: z.string().uuid(),
})

export async function POST(request: NextRequest) {
  return orgAdminGuard(request, async (req, context) => {
    const { organizationId } = context

    // Parse and validate request body
    let body
    try {
      body = await req.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      )
    }

    const validation = revokeInviteSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { inviteId } = validation.data

    const supabase = await createClient()

    // Verify invite belongs to user's organization
    const { data: invite, error: fetchError } = await supabase
      .from('organization_invites')
      .select('id, organization_id')
      .eq('id', inviteId)
      .single()

    if (fetchError || !invite) {
      return NextResponse.json(
        { error: 'Invite not found' },
        { status: 404 }
      )
    }

    if (invite.organization_id !== organizationId) {
      return NextResponse.json(
        { error: 'Access denied', message: 'You can only manage invites for your own organization' },
        { status: 403 }
      )
    }

    // Deactivate the invite
    const { error: updateError } = await supabase
      .from('organization_invites')
      .update({ is_active: false })
      .eq('id', inviteId)

    if (updateError) {
      console.error('[revoke-invite] Database error:', updateError)
      return NextResponse.json(
        { error: 'Failed to revoke invite', details: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Invite link has been revoked',
    })
  })
}
