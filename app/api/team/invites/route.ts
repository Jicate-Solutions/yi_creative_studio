/**
 * List Organization Invites
 * GET /api/team/invites
 *
 * Returns all invite links for the user's organization
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { orgAdminGuard } from '@/lib/middleware/org-admin-guard'

export async function GET(request: NextRequest) {
  return orgAdminGuard(request, async (req, context) => {
    const { organizationId } = context

    const supabase = await createClient()

    // Get all invites for this organization
    const { data: invites, error } = await supabase
      .from('organization_invites')
      .select(`
        id,
        token,
        role,
        email,
        max_uses,
        used_count,
        expires_at,
        is_active,
        created_at,
        created_by,
        used_at,
        used_by
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[list-invites] Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch invites', details: error.message },
        { status: 500 }
      )
    }

    // Get creator profiles
    const creatorIds = [...new Set(invites?.map(i => i.created_by) || [])]
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, full_name')
      .in('id', creatorIds)

    const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) || [])

    // Build invite URL base
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://yi-creative-studio.vercel.app'

    // Enrich invites with creator names and URLs
    const enrichedInvites = (invites || []).map(invite => {
      // Check if invite is expired
      const isExpired = invite.expires_at && new Date(invite.expires_at) < new Date()
      // Check if invite has reached max uses
      const isUsedUp = invite.max_uses !== null && (invite.used_count ?? 0) >= invite.max_uses

      return {
        id: invite.id,
        token: invite.token,
        role: invite.role,
        email: invite.email,
        maxUses: invite.max_uses,
        usedCount: invite.used_count,
        expiresAt: invite.expires_at,
        isActive: invite.is_active && !isExpired && !isUsedUp,
        isExpired,
        isUsedUp,
        createdAt: invite.created_at,
        createdBy: {
          id: invite.created_by,
          name: profileMap.get(invite.created_by) || 'Unknown',
        },
        usedAt: invite.used_at,
        url: `${baseUrl}/join/invite/${invite.token}`,
      }
    })

    return NextResponse.json({
      success: true,
      invites: enrichedInvites,
    })
  })
}
