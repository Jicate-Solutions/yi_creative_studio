'use client'

import { type ReactNode } from 'react'
import { useRole, usePermission, usePermissions, useAnyPermission } from '@/contexts/RoleContext'

interface PermissionGateProps {
  children: ReactNode
  /** Single permission to check */
  permission?: string
  /** Multiple permissions - all required (AND logic) */
  permissions?: string[]
  /** Multiple permissions - any one required (OR logic) */
  anyPermission?: string[]
  /** Fallback content when permission denied */
  fallback?: ReactNode
  /** Show loading state while checking */
  showLoading?: boolean
}

/**
 * Gate component that conditionally renders children based on permissions.
 *
 * Usage:
 * ```tsx
 * // Single permission
 * <PermissionGate permission="creatives:write">
 *   <CreateButton />
 * </PermissionGate>
 *
 * // Multiple required permissions (AND)
 * <PermissionGate permissions={["brand:read", "brand:write"]}>
 *   <BrandEditor />
 * </PermissionGate>
 *
 * // Any permission (OR)
 * <PermissionGate anyPermission={["team:manage", "team:write"]}>
 *   <InviteButton />
 * </PermissionGate>
 * ```
 */
export function PermissionGate({
  children,
  permission,
  permissions,
  anyPermission,
  fallback = null,
  showLoading = false,
}: PermissionGateProps) {
  const { isLoading, hasPermission } = useRole()

  if (isLoading && showLoading) {
    return (
      <div className="animate-pulse bg-muted rounded h-8 w-24" />
    )
  }

  if (isLoading) {
    return null
  }

  // Check single permission
  if (permission) {
    if (!hasPermission(permission)) {
      return <>{fallback}</>
    }
  }

  // Check all permissions (AND logic)
  if (permissions?.length) {
    const hasAll = permissions.every((p) => hasPermission(p))
    if (!hasAll) {
      return <>{fallback}</>
    }
  }

  // Check any permission (OR logic)
  if (anyPermission?.length) {
    const hasAny = anyPermission.some((p) => hasPermission(p))
    if (!hasAny) {
      return <>{fallback}</>
    }
  }

  return <>{children}</>
}

/**
 * Higher-order component version of PermissionGate
 */
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  permission: string,
  FallbackComponent?: React.ComponentType<P>
) {
  return function PermissionWrapped(props: P) {
    const hasPermission = usePermission(permission)

    if (!hasPermission) {
      return FallbackComponent ? <FallbackComponent {...props} /> : null
    }

    return <Component {...props} />
  }
}

/**
 * Hook-based permission check with render prop pattern
 */
interface PermissionRenderProps {
  permission: string
  children: (hasPermission: boolean) => ReactNode
}

export function Permission({ permission, children }: PermissionRenderProps) {
  const hasPermission = usePermission(permission)
  return <>{children(hasPermission)}</>
}
