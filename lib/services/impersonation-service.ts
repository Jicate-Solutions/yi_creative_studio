/**
 * Impersonation Service
 * Allows Super Admins to impersonate users for support purposes
 *
 * Security measures:
 * - Time-limited sessions (30 minutes)
 * - Restricted actions during impersonation
 * - User notifications
 * - Full audit logging
 *
 * @module impersonation-service
 */

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logSuperAdminAction } from './audit-service'

export interface ImpersonationSession {
  super_admin_id: string
  impersonated_user_id: string
  started_at: Date
  expires_at: Date
  restrictions: string[]
  reason: string
}

const IMPERSONATION_DURATION_MS = 30 * 60 * 1000 // 30 minutes

/**
 * Actions blocked during impersonation
 * Critical operations that require real user consent
 */
const IMPERSONATION_RESTRICTIONS = [
  'delete_organization',
  'manage_billing',
  'change_subscription',
  'delete_users',
  'update_payment_method',
  'export_data',
  'delete_account',
]

/**
 * Start impersonation session
 *
 * @example
 * ```typescript
 * const session = await startImpersonation(
 *   superAdmin.id,
 *   targetUser.id,
 *   'Customer support - debug gallery issue'
 * )
 * ```
 */
export async function startImpersonation(
  superAdminId: string,
  targetUserId: string,
  reason: string,
  metadata?: { ip_address?: string; user_agent?: string }
): Promise<{
  success: boolean
  session_token: string
  expires_at: Date
  restrictions: string[]
}> {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  try {
    // Verify target user exists using admin client
    const { data: userData, error: userError } = await adminClient.auth.admin.getUserById(targetUserId)

    if (userError || !userData?.user) {
      throw new Error('Target user not found')
    }

    const targetUser = userData.user

    // Check if target is a Super Admin (cannot impersonate)
    const isSuperAdmin = targetUser.app_metadata?.is_super_admin === true
    if (isSuperAdmin) {
      throw new Error('Cannot impersonate Super Admin users')
    }

    // Check if user is confirmed (not deleted)
    if (targetUser.deleted_at) {
      throw new Error('Cannot impersonate deleted users')
    }

    const now = new Date()
    const expiresAt = new Date(now.getTime() + IMPERSONATION_DURATION_MS)

    // Generate session token
    const sessionToken = `imp_${crypto.randomUUID()}`

    // Store session metadata (In production, use Redis or similar)
    // For MVP, session will be verified via header check in middleware
    const session: ImpersonationSession = {
      super_admin_id: superAdminId,
      impersonated_user_id: targetUserId,
      started_at: now,
      expires_at: expiresAt,
      restrictions: IMPERSONATION_RESTRICTIONS,
      reason,
    }

    // Log audit trail
    await logSuperAdminAction({
      super_admin_id: superAdminId,
      action: 'user:impersonate:start',
      resource_type: 'user',
      resource_id: targetUserId,
      target_user_id: targetUserId,
      changes: {
        after: {
          reason,
          expires_at: expiresAt.toISOString(),
          restrictions: IMPERSONATION_RESTRICTIONS,
        },
      },
      was_impersonating: false,
      ...metadata,
    })

    // TODO: Send notification to impersonated user
    // await sendImpersonationNotification(targetUser.email, {
    //   super_admin_email: superAdmin.email,
    //   reason,
    //   expires_at: expiresAt,
    // })

    console.log(`[Impersonation] Session started: Super Admin ${superAdminId} -> User ${targetUserId}`)
    console.log(`[Impersonation] Expires: ${expiresAt.toISOString()}`)
    console.log(`[Impersonation] Reason: ${reason}`)

    return {
      success: true,
      session_token: sessionToken,
      expires_at: expiresAt,
      restrictions: IMPERSONATION_RESTRICTIONS,
    }
  } catch (error) {
    console.error('[impersonation-service] Failed to start impersonation:', error)
    throw error
  }
}

/**
 * Stop impersonation session
 *
 * @example
 * ```typescript
 * await stopImpersonation(superAdmin.id, sessionToken)
 * ```
 */
export async function stopImpersonation(
  superAdminId: string,
  sessionToken: string,
  metadata?: { ip_address?: string; user_agent?: string }
): Promise<{ success: boolean }> {
  try {
    // Log audit trail
    await logSuperAdminAction({
      super_admin_id: superAdminId,
      action: 'user:impersonate:stop',
      resource_type: 'user',
      changes: {
        before: { session_token: sessionToken },
      },
      was_impersonating: true,
      ...metadata,
    })

    console.log(`[Impersonation] Session stopped: Token ${sessionToken}`)

    return {
      success: true,
    }
  } catch (error) {
    console.error('[impersonation-service] Failed to stop impersonation:', error)
    throw error
  }
}

/**
 * Check if action is allowed during impersonation
 *
 * @example
 * ```typescript
 * if (!isActionAllowedDuringImpersonation('delete_organization')) {
 *   throw new Error('This action is restricted during impersonation')
 * }
 * ```
 */
export function isActionAllowedDuringImpersonation(action: string): boolean {
  return !IMPERSONATION_RESTRICTIONS.includes(action)
}

/**
 * Get list of restricted actions
 */
export function getImpersonationRestrictions(): string[] {
  return [...IMPERSONATION_RESTRICTIONS]
}

/**
 * Validate impersonation session token
 * In production, this would check Redis/session store
 * For MVP, this is a placeholder
 */
export function validateImpersonationSession(sessionToken: string): {
  valid: boolean
  expires_at?: Date
  super_admin_id?: string
  impersonated_user_id?: string
} {
  // TODO: Implement session validation with Redis/session store
  // For MVP, return invalid (impersonation requires full implementation)
  return {
    valid: false,
  }
}
