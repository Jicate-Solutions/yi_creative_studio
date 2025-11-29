'use client';

import { ReactNode } from 'react';
import { useRole } from '@/contexts/RoleContext';
import { Permission, Role } from '@/types/rbac';
import { ROLE_CONFIGS } from '@/config/roles';
import { AlertCircle, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// Permission Gate Component
// ============================================================================

interface PermissionGateProps {
  /** Required permission(s) */
  permission: Permission | Permission[];
  /** Content to show when permission is granted */
  children: ReactNode;
  /** Content to show when permission is denied (optional) */
  fallback?: ReactNode;
  /** If true, ALL permissions are required; otherwise ANY permission grants access */
  requireAll?: boolean;
  /** Show a styled "access denied" message instead of custom fallback */
  showDenied?: boolean;
}

/**
 * Conditionally renders content based on permission(s)
 * 
 * @example
 * // Single permission
 * <PermissionGate permission="users:write">
 *   <EditButton />
 * </PermissionGate>
 * 
 * @example
 * // Any of multiple permissions
 * <PermissionGate permission={['billing:read', 'billing:write']}>
 *   <BillingSection />
 * </PermissionGate>
 * 
 * @example
 * // All permissions required
 * <PermissionGate 
 *   permission={['users:read', 'users:write']} 
 *   requireAll
 *   fallback={<UpgradePrompt />}
 * >
 *   <UserManagement />
 * </PermissionGate>
 */
export function PermissionGate({
  permission,
  children,
  fallback = null,
  requireAll = false,
  showDenied = false,
}: PermissionGateProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = useRole();

  const permissions = Array.isArray(permission) ? permission : [permission];

  const hasAccess = requireAll
    ? hasAllPermissions(permissions)
    : hasAnyPermission(permissions);

  if (!hasAccess) {
    if (showDenied) {
      return <AccessDeniedMessage permissions={permissions} />;
    }
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// ============================================================================
// Role Guard Component
// ============================================================================

interface RoleGuardProps {
  /** Specific roles that are allowed */
  allowedRoles?: Role[];
  /** Minimum role hierarchy required */
  minRole?: Role;
  /** Content to show when access is granted */
  children: ReactNode;
  /** Content to show when access is denied */
  fallback?: ReactNode;
  /** Show styled access denied message */
  showDenied?: boolean;
}

/**
 * Conditionally renders content based on role
 * 
 * @example
 * // Specific roles
 * <RoleGuard allowedRoles={['super_admin', 'admin']}>
 *   <AdminPanel />
 * </RoleGuard>
 * 
 * @example
 * // Minimum role hierarchy
 * <RoleGuard minRole="creator">
 *   <CreatorTools />
 * </RoleGuard>
 */
export function RoleGuard({
  allowedRoles,
  minRole,
  children,
  fallback = null,
  showDenied = false,
}: RoleGuardProps) {
  const { activeRole, meetsMinimumRole } = useRole();

  let hasAccess = false;

  if (allowedRoles) {
    hasAccess = allowedRoles.includes(activeRole);
  } else if (minRole) {
    hasAccess = meetsMinimumRole(minRole);
  } else {
    // No restrictions specified, allow access
    hasAccess = true;
  }

  if (!hasAccess) {
    if (showDenied) {
      return (
        <AccessDeniedMessage 
          requiredRole={minRole || allowedRoles?.[0]} 
        />
      );
    }
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// ============================================================================
// Access Denied Message Component
// ============================================================================

interface AccessDeniedMessageProps {
  permissions?: Permission[];
  requiredRole?: Role;
  className?: string;
}

export function AccessDeniedMessage({
  permissions,
  requiredRole,
  className,
}: AccessDeniedMessageProps) {
  const roleConfig = requiredRole ? ROLE_CONFIGS[requiredRole] : null;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-6",
        "bg-muted/30 rounded-lg border border-dashed",
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
        <Lock className="w-6 h-6 text-muted-foreground" />
      </div>
      
      <h3 className="text-lg font-semibold text-foreground mb-2">
        Access Restricted
      </h3>
      
      <p className="text-sm text-muted-foreground text-center max-w-sm">
        {permissions && permissions.length > 0 ? (
          <>
            You need the{' '}
            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
              {permissions.join(', ')}
            </code>{' '}
            permission(s) to view this content.
          </>
        ) : roleConfig ? (
          <>
            This content requires{' '}
            <span className="font-medium">{roleConfig.displayName}</span>{' '}
            role or higher.
          </>
        ) : (
          'You do not have permission to view this content.'
        )}
      </p>
    </div>
  );
}

// ============================================================================
// Simulation Warning Banner
// ============================================================================

interface SimulationBannerProps {
  className?: string;
}

export function SimulationBanner({ className }: SimulationBannerProps) {
  const { isSimulating, activeRole, getRoleConfig, resetRole } = useRole();

  if (!isSimulating) return null;

  const config = getRoleConfig(activeRole);

  return (
    <div
      className={cn(
        "bg-amber-50 dark:bg-amber-950/30",
        "border-b border-amber-200 dark:border-amber-800",
        "px-4 py-2",
        className
      )}
    >
      <div className="container flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p className="text-sm">
            You are viewing the platform as a{' '}
            <strong>{config.displayName}</strong>. Some features may be hidden
            or restricted.
          </p>
        </div>
        <button
          onClick={resetRole}
          className={cn(
            "text-sm font-medium",
            "text-amber-600 hover:text-amber-700",
            "dark:text-amber-400 dark:hover:text-amber-300",
            "underline underline-offset-2"
          )}
        >
          Exit Simulation
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Conditional Wrapper HOC
// ============================================================================

interface WithPermissionProps {
  permission: Permission | Permission[];
  requireAll?: boolean;
}

/**
 * Higher-order component to wrap components with permission checking
 * 
 * @example
 * const ProtectedButton = withPermission(Button, { permission: 'users:write' });
 */
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  { permission, requireAll = false }: WithPermissionProps
) {
  return function PermissionWrappedComponent(props: P) {
    return (
      <PermissionGate permission={permission} requireAll={requireAll}>
        <Component {...props} />
      </PermissionGate>
    );
  };
}

// ============================================================================
// Permission Badge Component
// ============================================================================

interface PermissionBadgeProps {
  permission: Permission;
  className?: string;
}

/**
 * Shows a badge indicating whether user has a permission
 */
export function PermissionBadge({ permission, className }: PermissionBadgeProps) {
  const { hasPermission } = useRole();
  const granted = hasPermission(permission);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
        granted
          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
        className
      )}
    >
      <span
        className={cn(
          "w-1.5 h-1.5 rounded-full",
          granted ? "bg-green-500" : "bg-red-500"
        )}
      />
      {permission}
    </span>
  );
}
