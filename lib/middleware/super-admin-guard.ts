/**
 * Super Admin Guard Middleware
 * Protects Super Admin API routes and ensures only authorized Super Admins can access them
 *
 * Usage:
 * ```typescript
 * import { superAdminGuard } from '@/lib/middleware/super-admin-guard'
 *
 * export async function GET(request: NextRequest) {
 *   return superAdminGuard(request, async (req, context) => {
 *     // Your Super Admin route logic here
 *     // context.superAdmin contains the authenticated Super Admin user
 *     return NextResponse.json({ data: 'Super Admin data' })
 *   })
 * }
 * ```
 *
 * @module super-admin-guard
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logSuperAdminAction } from '@/lib/services/audit-service'

export interface SuperAdminContext {
  superAdmin: {
    id: string
    email: string
    is_super_admin: boolean
    [key: string]: any
  }
}

/**
 * Super Admin Guard Middleware
 *
 * Protects API routes by:
 * 1. Verifying authentication
 * 2. Checking Super Admin flag
 * 3. Logging unauthorized access attempts
 * 4. Providing Super Admin context to handler
 *
 * @param request - Next.js request object
 * @param handler - Handler function to execute if authorized
 * @returns NextResponse
 *
 * @example
 * ```typescript
 * export async function POST(request: NextRequest) {
 *   return superAdminGuard(request, async (req, context) => {
 *     const { superAdmin } = context
 *
 *     // Your Super Admin logic here
 *     const body = await req.json()
 *
 *     // Log the action
 *     await logSuperAdminAction({
 *       super_admin_id: superAdmin.id,
 *       action: 'credit:allocate',
 *       resource_type: 'credit',
 *       target_organization_id: body.org_id,
 *       changes: { after: { amount: body.amount } }
 *     })
 *
 *     return NextResponse.json({ success: true })
 *   })
 * }
 * ```
 */
export async function superAdminGuard(
  request: NextRequest,
  handler: (req: NextRequest, context: SuperAdminContext) => Promise<NextResponse>
): Promise<NextResponse> {
  const supabase = await createClient()

  // 1. Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      {
        error: 'Authentication required',
        code: 'UNAUTHORIZED',
        message: 'You must be logged in to access this resource',
      },
      { status: 401 }
    )
  }

  // 2. Check Super Admin flag using RPC function (checks raw_app_meta_data)
  const { data: isSuperAdmin, error: rpcError } = await (supabase as any).rpc('is_current_user_super_admin')

  if (rpcError) {
    console.error('[super-admin-guard] RPC error checking super admin status:', rpcError)
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        code: 'RPC_ERROR',
        message: 'Failed to verify Super Admin status',
      },
      { status: 500 }
    )
  }

  if (!isSuperAdmin) {
    // Log unauthorized access attempt for security monitoring
    // Note: This may fail silently if user doesn't have insert permission, which is fine
    try {
      await logSuperAdminAction({
        super_admin_id: user.id,
        action: 'unauthorized_access_attempt',
        resource_type: 'platform',
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
      })
    } catch (logError) {
      console.warn('[super-admin-guard] Failed to log unauthorized access attempt:', logError)
    }

    return NextResponse.json(
      {
        error: 'Forbidden',
        code: 'SUPER_ADMIN_REQUIRED',
        message: 'Super Admin access required to access this resource',
      },
      { status: 403 }
    )
  }

  // 3. Execute handler with Super Admin context
  try {
    return await handler(request, {
      superAdmin: {
        id: user.id,
        email: user.email || 'unknown',
        is_super_admin: true,
      },
    })
  } catch (error) {
    console.error('[super-admin-guard] Handler error:', error)

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        code: 'HANDLER_ERROR',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
      { status: 500 }
    )
  }
}

/**
 * Validate Super Admin flag on user object
 * Checks raw_app_meta_data.is_super_admin for the flag
 *
 * @param user - Supabase user object (from auth.getUser())
 * @returns boolean indicating if user is Super Admin
 *
 * @example
 * ```typescript
 * const user = await supabase.auth.getUser()
 * if (isSuperAdminUser(user.data.user)) {
 *   // Show Super Admin UI
 * }
 * ```
 *
 * Note: For server-side checks, prefer using the RPC function
 * `is_current_user_super_admin` for database-level validation.
 */
export function isSuperAdminUser(user: any): boolean {
  // Check raw_app_meta_data for the is_super_admin flag
  return user?.app_metadata?.is_super_admin === true
}

/**
 * Extract request metadata for audit logging
 *
 * @param request - Next.js request object
 * @returns Object with IP address, user agent, and request ID
 *
 * @example
 * ```typescript
 * const metadata = getRequestMetadata(request)
 * await logSuperAdminAction({
 *   ...metadata,
 *   super_admin_id: user.id,
 *   action: 'org:create'
 * })
 * ```
 */
export function getRequestMetadata(request: NextRequest) {
  return {
    ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    user_agent: request.headers.get('user-agent') || 'unknown',
    request_id: request.headers.get('x-request-id') || crypto.randomUUID(),
  }
}

/**
 * Check if request is from impersonation session
 * (For future implementation with impersonation service)
 *
 * @param request - Next.js request object
 * @returns Object with impersonation status and impersonated user ID
 */
export function checkImpersonationStatus(request: NextRequest): {
  was_impersonating: boolean
  impersonated_user_id?: string
} {
  // TODO: Implement impersonation session checking
  // This will check for impersonation session token/cookie
  // and return impersonation status
  const impersonationHeader = request.headers.get('x-impersonating-user')

  if (impersonationHeader) {
    return {
      was_impersonating: true,
      impersonated_user_id: impersonationHeader,
    }
  }

  return {
    was_impersonating: false,
  }
}
