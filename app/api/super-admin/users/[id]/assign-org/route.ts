/**
 * Super Admin API: Assign User to Organization
 * POST /api/super-admin/users/[id]/assign-org
 *
 * Directly add a user to an organization with a specified role
 */

import { NextRequest, NextResponse } from 'next/server'
import { superAdminGuard, getRequestMetadata } from '@/lib/middleware/super-admin-guard'
import { logSuperAdminAction } from '@/lib/services/audit-service'

interface AssignOrgBody {
  organization_id: string
  role?: 'viewer' | 'editor' | 'admin'
}

/**
 * POST - Assign user to an organization
 * Body: { organization_id: string, role?: 'viewer' | 'editor' | 'admin' }
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: targetUserId } = await params

  return superAdminGuard(request, async (req, { superAdmin, adminClient }) => {
    const body: AssignOrgBody = await req.json()
    const { organization_id, role = 'viewer' } = body

    // Validate organization_id
    if (!organization_id || typeof organization_id !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Invalid request',
        details: 'organization_id is required',
      }, { status: 400 })
    }

    // Validate role
    const validRoles = ['viewer', 'editor', 'admin']
    if (!validRoles.includes(role)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request',
        details: `Role must be one of: ${validRoles.join(', ')}`,
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

    // Check if user is suspended (banned_until is in the API response)
    const bannedUntil = (targetUser as unknown as { banned_until?: string }).banned_until
    if (bannedUntil && new Date(bannedUntil) > new Date()) {
      return NextResponse.json({
        success: false,
        error: 'User is suspended',
        details: 'Cannot assign suspended users to organizations. Please reactivate the user first.',
      }, { status: 400 })
    }

    // Verify organization exists
    const { data: organization, error: orgError } = await adminClient
      .from('organizations')
      .select('id, name, slug')
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

    // Add user to organization
    const { error: insertError } = await adminClient
      .from('organization_members')
      .insert({
        user_id: targetUserId,
        organization_id: organization_id,
        role: role,
        joined_at: new Date().toISOString(),
        invited_by: superAdmin.id,
      })

    if (insertError) {
      console.error('[super-admin] Failed to assign user to org:', insertError)
      return NextResponse.json({
        success: false,
        error: 'Assignment failed',
        details: insertError.message,
      }, { status: 500 })
    }

    // Log audit trail
    const metadata = getRequestMetadata(request)
    await logSuperAdminAction({
      super_admin_id: superAdmin.id,
      action: 'user:assign-org',
      resource_type: 'organization_member',
      target_user_id: targetUserId,
      target_organization_id: organization_id,
      changes: {
        after: {
          organization_id,
          organization_name: organization.name,
          role,
        },
      },
      ip_address: metadata.ip_address,
      user_agent: metadata.user_agent,
    })

    console.log('[super-admin] User assigned to org:', targetUserId, '->', organization.name, 'as', role, 'by', superAdmin.email)

    return NextResponse.json({
      success: true,
      message: `User ${targetUser.email} has been assigned to ${organization.name} as ${role}`,
      membership: {
        user_id: targetUserId,
        user_email: targetUser.email,
        organization_id: organization.id,
        organization_name: organization.name,
        role: role,
        joined_at: new Date().toISOString(),
      },
    })
  })
}
