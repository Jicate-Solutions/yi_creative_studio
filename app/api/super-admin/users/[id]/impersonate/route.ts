/**
 * Super Admin API: Impersonate User
 * POST /api/super-admin/users/[id]/impersonate
 *
 * Start impersonation session to access user's account for support
 */

import { NextRequest, NextResponse } from 'next/server'
import { superAdminGuard, getRequestMetadata } from '@/lib/middleware/super-admin-guard'
import { startImpersonation } from '@/lib/services/impersonation-service'

/**
 * POST - Start impersonation session
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: targetUserId } = await params
  return superAdminGuard(request, async (req, { superAdmin }) => {
    const metadata = getRequestMetadata(req)

    try {
      const body = await req.json()
      const { reason } = body

      if (!reason || reason.trim().length < 10) {
        return NextResponse.json(
          {
            error: 'Invalid reason',
            details: 'Please provide a detailed reason for impersonation (minimum 10 characters)',
          },
          { status: 400 }
        )
      }

      // Start impersonation session
      const session = await startImpersonation(
        superAdmin.id,
        targetUserId,
        reason.trim(),
        metadata
      )

      return NextResponse.json({
        success: true,
        message: 'Impersonation session started',
        session: {
          token: session.session_token,
          expires_at: session.expires_at,
          restrictions: session.restrictions,
          duration_minutes: 30,
        },
        warning: 'This session will expire in 30 minutes. The user has been notified.',
      })
    } catch (error) {
      console.error('[super-admin] Failed to start impersonation:', error)
      return NextResponse.json(
        {
          error: 'Failed to start impersonation',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      )
    }
  })
}
