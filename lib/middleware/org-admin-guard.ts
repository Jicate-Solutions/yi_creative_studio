/**
 * Organization Admin Guard Middleware
 * Protects org-level admin API routes ensuring users can only manage THEIR OWN organization
 *
 * Use this for org-scoped admin actions like:
 * - Team management (invite, remove, update roles)
 * - Billing/credit purchases
 * - Organization settings
 *
 * Usage:
 * ```typescript
 * import { orgAdminGuard } from '@/lib/middleware/org-admin-guard'
 *
 * export async function POST(request: NextRequest) {
 *   return orgAdminGuard(request, async (req, context) => {
 *     const { user, organizationId, role } = context
 *     // User is guaranteed to be admin of organizationId
 *     return NextResponse.json({ data: 'Admin data' })
 *   })
 * }
 * ```
 *
 * @module org-admin-guard
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export interface OrgAdminContext {
  user: {
    id: string
    email: string
    [key: string]: any
  }
  organizationId: string
  organizationName?: string
  role: 'admin' | 'super_admin'
  isSuperAdmin: boolean
}

/**
 * Organization Admin Guard Middleware
 *
 * Protects API routes by:
 * 1. Verifying authentication
 * 2. Checking user has 'admin' role in their organization
 * 3. Optionally validating target organization matches user's org
 * 4. Providing organization context to handler
 *
 * Super Admins automatically pass this check for any organization.
 *
 * @param request - Next.js request object
 * @param handler - Handler function to execute if authorized
 * @param options - Optional configuration
 * @returns NextResponse
 */
export async function orgAdminGuard(
  request: NextRequest,
  handler: (req: NextRequest, context: OrgAdminContext) => Promise<NextResponse>,
  options?: {
    /**
     * If provided, validates that the user's organization matches this target.
     * Super Admins bypass this check.
     */
    targetOrganizationId?: string
    /**
     * Allow editor role in addition to admin
     */
    allowEditor?: boolean
  }
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

  // 2. Check Super Admin flag (platform-level bypass)
  const isSuperAdmin = (user as any).is_super_admin === true

  // 3. Get user's organization membership
  const { data: membership, error: membershipError } = await supabase
    .from('organization_members')
    .select(`
      role,
      organization_id,
      organizations!inner(name)
    `)
    .eq('user_id', user.id)
    .single()

  if (membershipError || !membership) {
    return NextResponse.json(
      {
        error: 'Organization membership required',
        code: 'NO_ORGANIZATION',
        message: 'You must be a member of an organization to access this resource',
      },
      { status: 403 }
    )
  }

  // 4. Check role
  const allowedRoles = options?.allowEditor
    ? ['admin', 'editor', 'super_admin']
    : ['admin', 'super_admin']

  if (!isSuperAdmin && !allowedRoles.includes(membership.role)) {
    return NextResponse.json(
      {
        error: 'Insufficient permissions',
        code: 'ADMIN_REQUIRED',
        message: 'Admin role required to access this resource',
      },
      { status: 403 }
    )
  }

  // 5. Validate target organization (if specified)
  if (options?.targetOrganizationId && !isSuperAdmin) {
    if (membership.organization_id !== options.targetOrganizationId) {
      return NextResponse.json(
        {
          error: 'Access denied',
          code: 'CROSS_ORG_ACCESS_DENIED',
          message: 'You can only manage your own organization',
        },
        { status: 403 }
      )
    }
  }

  // 6. Execute handler with organization context
  try {
    return await handler(request, {
      user: {
        ...user,
        id: user.id,
        email: user.email || 'unknown',
      },
      organizationId: membership.organization_id,
      organizationName: (membership.organizations as any)?.name,
      role: isSuperAdmin ? 'super_admin' : membership.role as 'admin',
      isSuperAdmin,
    })
  } catch (error) {
    console.error('[org-admin-guard] Handler error:', error)

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
 * Editor Guard - Allows both admin and editor roles
 * Use for actions that editors should be able to perform
 *
 * @example
 * ```typescript
 * export async function POST(request: NextRequest) {
 *   return editorGuard(request, async (req, context) => {
 *     // User is editor or admin
 *     return NextResponse.json({ success: true })
 *   })
 * }
 * ```
 */
export async function editorGuard(
  request: NextRequest,
  handler: (req: NextRequest, context: OrgAdminContext) => Promise<NextResponse>
): Promise<NextResponse> {
  return orgAdminGuard(request, handler, { allowEditor: true })
}

/**
 * Validate that a target organization ID matches the user's organization
 * Use when you need to validate org access before calling orgAdminGuard
 *
 * @param userOrgId - The user's organization ID from their membership
 * @param targetOrgId - The target organization ID from the request
 * @param isSuperAdmin - Whether the user is a Super Admin
 * @returns true if access is allowed, false otherwise
 */
export function canAccessOrganization(
  userOrgId: string,
  targetOrgId: string,
  isSuperAdmin: boolean = false
): boolean {
  if (isSuperAdmin) return true
  return userOrgId === targetOrgId
}

/**
 * Extract organization ID from request body or query params
 * Helper for routes that need to validate target organization
 *
 * @param request - Next.js request object
 * @param body - Parsed request body (if available)
 * @returns The organization ID or null
 */
export function getTargetOrganizationId(
  request: NextRequest,
  body?: { organization_id?: string; organizationId?: string }
): string | null {
  // Check body first
  if (body?.organization_id) return body.organization_id
  if (body?.organizationId) return body.organizationId

  // Check query params
  const { searchParams } = new URL(request.url)
  return searchParams.get('organization_id') || searchParams.get('organizationId')
}

/**
 * Get request metadata for audit logging
 */
export function getOrgRequestMetadata(request: NextRequest) {
  return {
    ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    user_agent: request.headers.get('user-agent') || 'unknown',
    request_id: request.headers.get('x-request-id') || crypto.randomUUID(),
  }
}
