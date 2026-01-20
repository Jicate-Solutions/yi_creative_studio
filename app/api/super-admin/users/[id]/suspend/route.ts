/**
 * Super Admin API: Suspend/Unsuspend User
 * POST /api/super-admin/users/[id]/suspend
 *
 * Suspend or unsuspend a user account (placeholder)
 */

import { NextRequest, NextResponse } from 'next/server'
import { superAdminGuard } from '@/lib/middleware/super-admin-guard'

/**
 * POST - Suspend/Unsuspend user
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: targetUserId } = await params
  return superAdminGuard(request, async () => {
    // Placeholder - feature not yet implemented
    console.log('[super-admin] Suspend requested for user:', targetUserId)

    return NextResponse.json({
      success: false,
      error: 'Feature not yet implemented',
      message: 'User suspension feature is coming soon',
    }, { status: 501 })
  })
}
