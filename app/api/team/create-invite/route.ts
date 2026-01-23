/**
 * Create Role-Based Invite Link
 * POST /api/team/create-invite
 *
 * Creates a new invite link with a specific role assignment
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { orgAdminGuard } from '@/lib/middleware/org-admin-guard'
import { generateInviteToken } from '@/lib/utils/invite-token'
import { z } from 'zod'

const createInviteSchema = z.object({
  role: z.enum(['viewer', 'editor', 'admin']),
  email: z.string().email().optional().nullable(),
  maxUses: z.number().int().min(0).max(100).optional().default(1), // 0 = unlimited
  expiresIn: z.number().int().min(0).max(720).optional().nullable(), // Hours, max 30 days
})

export async function POST(request: NextRequest) {
  return orgAdminGuard(request, async (req, context) => {
    const { user, organizationId, organizationName } = context

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

    const validation = createInviteSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { role, email, maxUses, expiresIn } = validation.data

    // Generate secure token
    const token = generateInviteToken()

    // Calculate expiration time
    let expiresAt: string | null = null
    if (expiresIn && expiresIn > 0) {
      const expireDate = new Date()
      expireDate.setHours(expireDate.getHours() + expiresIn)
      expiresAt = expireDate.toISOString()
    }

    // Create invite in database
    const supabase = await createClient()
    const { data: invite, error } = await supabase
      .from('organization_invites')
      .insert({
        organization_id: organizationId,
        token,
        role,
        created_by: user.id,
        email: email || null,
        max_uses: maxUses === 0 ? null : maxUses, // null = unlimited
        expires_at: expiresAt,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error('[create-invite] Database error:', error)
      return NextResponse.json(
        { error: 'Failed to create invite', details: error.message },
        { status: 500 }
      )
    }

    // Build invite URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://yi-creative-studio.vercel.app'
    const inviteUrl = `${baseUrl}/join/invite/${token}`

    return NextResponse.json({
      success: true,
      invite: {
        id: invite.id,
        token: invite.token,
        role: invite.role,
        email: invite.email,
        url: inviteUrl,
        maxUses: invite.max_uses,
        usedCount: invite.used_count,
        expiresAt: invite.expires_at,
        createdAt: invite.created_at,
        organizationName,
      },
    })
  })
}
