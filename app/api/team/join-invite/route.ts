/**
 * Join Organization via Invite Token
 * POST /api/team/join-invite
 *
 * Validates an invite token and adds the user to the organization
 * with the role specified in the invite
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const joinInviteSchema = z.object({
  token: z.string().min(1),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  // 1. Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Authentication required', code: 'UNAUTHORIZED' },
      { status: 401 }
    )
  }

  // 2. Parse and validate request body
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  const validation = joinInviteSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: validation.error.flatten() },
      { status: 400 }
    )
  }

  const { token } = validation.data

  // 3. Find the invite
  const { data: invite, error: inviteError } = await supabase
    .from('organization_invites')
    .select(`
      id,
      organization_id,
      token,
      role,
      email,
      max_uses,
      used_count,
      expires_at,
      is_active,
      organizations!inner(name, is_active)
    `)
    .eq('token', token)
    .single()

  if (inviteError || !invite) {
    return NextResponse.json(
      { error: 'Invalid invite link', code: 'INVITE_NOT_FOUND' },
      { status: 404 }
    )
  }

  // 4. Validate invite is active
  if (!invite.is_active) {
    return NextResponse.json(
      { error: 'This invite link has been revoked', code: 'INVITE_REVOKED' },
      { status: 400 }
    )
  }

  // 5. Check expiration
  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return NextResponse.json(
      { error: 'This invite link has expired', code: 'INVITE_EXPIRED' },
      { status: 400 }
    )
  }

  // 6. Check max uses
  if (invite.max_uses !== null && (invite.used_count ?? 0) >= invite.max_uses) {
    return NextResponse.json(
      { error: 'This invite link has reached its maximum uses', code: 'INVITE_USED_UP' },
      { status: 400 }
    )
  }

  // 7. Check email restriction
  if (invite.email && invite.email.toLowerCase() !== user.email?.toLowerCase()) {
    return NextResponse.json(
      { error: 'This invite link is restricted to a specific email address', code: 'EMAIL_MISMATCH' },
      { status: 403 }
    )
  }

  // 8. Check organization is active
  const org = invite.organizations as any
  if (!org?.is_active) {
    return NextResponse.json(
      { error: 'This organization is no longer active', code: 'ORG_INACTIVE' },
      { status: 400 }
    )
  }

  // 9. Check if user is already a member
  const { data: existingMembership } = await supabase
    .from('organization_members')
    .select('id')
    .eq('organization_id', invite.organization_id)
    .eq('user_id', user.id)
    .single()

  if (existingMembership) {
    return NextResponse.json(
      {
        error: 'You are already a member of this organization',
        code: 'ALREADY_MEMBER',
        organizationName: org.name,
      },
      { status: 400 }
    )
  }

  // 10. Create membership with invite's role
  const { error: membershipError } = await supabase
    .from('organization_members')
    .insert({
      organization_id: invite.organization_id,
      user_id: user.id,
      role: invite.role,
      invited_by: null, // Could track invite creator here
    })

  if (membershipError) {
    console.error('[join-invite] Failed to create membership:', membershipError)
    return NextResponse.json(
      { error: 'Failed to join organization', details: membershipError.message },
      { status: 500 }
    )
  }

  // 11. Update invite usage
  const newUsedCount = (invite.used_count ?? 0) + 1
  const { error: updateError } = await supabase
    .from('organization_invites')
    .update({
      used_count: newUsedCount,
      used_at: new Date().toISOString(),
      used_by: user.id,
      // Deactivate if max uses reached
      is_active: invite.max_uses === null || newUsedCount < invite.max_uses,
    })
    .eq('id', invite.id)

  if (updateError) {
    console.error('[join-invite] Failed to update invite usage:', updateError)
    // Don't fail the request - membership was created successfully
  }

  return NextResponse.json({
    success: true,
    message: `Successfully joined ${org.name} as ${invite.role}`,
    organization: {
      id: invite.organization_id,
      name: org.name,
    },
    role: invite.role,
  })
}
