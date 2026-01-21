/**
 * Super Admin API: Invite User to Organization
 * POST /api/super-admin/users/[id]/invite-org
 *
 * Send an organization invite to a user
 */

import { NextRequest, NextResponse } from 'next/server'
import { superAdminGuard, getRequestMetadata } from '@/lib/middleware/super-admin-guard'
import { logSuperAdminAction } from '@/lib/services/audit-service'

interface InviteOrgBody {
  organization_id: string
}

/**
 * POST - Invite user to an organization
 * Body: { organization_id: string }
 *
 * Returns the invite code/link that can be shared with the user
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: targetUserId } = await params

  return superAdminGuard(request, async (req, { superAdmin, adminClient }) => {
    const body: InviteOrgBody = await req.json()
    const { organization_id } = body

    // Validate organization_id
    if (!organization_id || typeof organization_id !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Invalid request',
        details: 'organization_id is required',
      }, { status: 400 })
    }

    // Verify user exists
    const { data: { user: targetUser }, error: getUserError } = await adminClient.auth.admin.getUserById(targetUserId)

    if (getUserError || !targetUser) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
        details: getUserError?.message || 'User does not exist',
      }, { status: 404 })
    }

    // Verify organization exists and get invite code
    const { data: organization, error: orgError } = await adminClient
      .from('organizations')
      .select('id, name, slug, invite_code')
      .eq('id', organization_id)
      .single()

    if (orgError || !organization) {
      return NextResponse.json({
        success: false,
        error: 'Organization not found',
        details: orgError?.message || 'Organization does not exist',
      }, { status: 404 })
    }

    // Check if user is already a member of this organization
    const { data: existingMember } = await adminClient
      .from('organization_members')
      .select('id, role')
      .eq('user_id', targetUserId)
      .eq('organization_id', organization_id)
      .single()

    if (existingMember) {
      return NextResponse.json({
        success: false,
        error: 'Already a member',
        details: `User is already a member of ${organization.name} with role: ${existingMember.role}`,
      }, { status: 409 })
    }

    // Generate invite code if organization doesn't have one
    let inviteCode = organization.invite_code
    if (!inviteCode) {
      // Generate a new invite code
      inviteCode = generateInviteCode()
      const { error: updateError } = await adminClient
        .from('organizations')
        .update({ invite_code: inviteCode })
        .eq('id', organization_id)

      if (updateError) {
        console.error('[super-admin] Failed to generate invite code:', updateError)
        return NextResponse.json({
          success: false,
          error: 'Failed to generate invite',
          details: updateError.message,
        }, { status: 500 })
      }
    }

    // Build invite URL
    const baseUrl = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const inviteUrl = `${baseUrl}/join/${inviteCode}`

    // Log audit trail
    const metadata = getRequestMetadata(request)
    await logSuperAdminAction({
      super_admin_id: superAdmin.id,
      action: 'user:invite-org',
      resource_type: 'organization_invite',
      target_user_id: targetUserId,
      target_organization_id: organization_id,
      changes: {
        after: {
          organization_id,
          organization_name: organization.name,
          invite_code: inviteCode,
          user_email: targetUser.email,
        },
      },
      ip_address: metadata.ip_address,
      user_agent: metadata.user_agent,
    })

    console.log('[super-admin] Invite generated for user:', targetUserId, 'to', organization.name, 'by', superAdmin.email)

    return NextResponse.json({
      success: true,
      message: `Invite generated for ${targetUser.email} to join ${organization.name}`,
      invite: {
        user_id: targetUserId,
        user_email: targetUser.email,
        organization_id: organization.id,
        organization_name: organization.name,
        invite_code: inviteCode,
        invite_url: inviteUrl,
      },
      instructions: `Share this link with the user: ${inviteUrl}`,
    })
  })
}

/**
 * Generate a random invite code
 */
function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Avoid confusing characters like 0/O, 1/I/L
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}
