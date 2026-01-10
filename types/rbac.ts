/**
 * RBAC Guardian - Type Definitions
 * Dynamic Role-Based Access Control for Yi CreativeStudio
 */

import type { UserRole } from '@/lib/config/constants'

// Role definition with permissions
export interface Role {
  id: string
  name: UserRole
  displayName: string
  description: string
  permissions: Permission[]
  hierarchy: number // Higher = more access
  color: string
  icon: string
}

// Permission definition
export interface Permission {
  name: string
  resource: string
  action: 'read' | 'write' | 'delete' | 'manage' | 'create' | 'impersonate'
  description: string
}

// Role context type for provider
export interface RoleContextType {
  // User's actual role from organization membership
  actualRole: Role | null
  // Currently active/simulated role (for role switching)
  activeRole: Role | null
  // All available roles in the system
  availableRoles: Role[]
  // Loading state
  isLoading: boolean
  // Switch to different role view
  switchRole: (roleId: string) => void
  // Reset to actual role
  resetRole: () => void
  // Check if currently simulating a different role
  isSimulating: boolean
  // Check specific permission
  hasPermission: (permission: string) => boolean
  // Check if user can switch roles (admins and super admins)
  canSwitchRoles: boolean
  // Get permission list for current active role
  getPermissions: () => string[]

  // Super Admin context (platform-level)
  isSuperAdmin: boolean
  canAccessPlatform: boolean
}

// Session storage key for persisting simulated role
export const SIMULATED_ROLE_KEY = 'yi_rbac_simulated_role'

// Role definitions with full details
export const ROLE_DEFINITIONS: Record<UserRole, Omit<Role, 'id'>> = {
  super_admin: {
    name: 'super_admin',
    displayName: 'Super Administrator',
    description: 'Yi platform operator with global access across all organizations',
    hierarchy: 200,
    color: 'bg-gradient-to-r from-purple-600 to-pink-600',
    icon: 'shield-crown',
    permissions: [
      // Platform-level permissions (Super Admin only)
      { name: 'platform:read', resource: 'platform', action: 'read', description: 'View platform dashboard' },
      { name: 'platform:write', resource: 'platform', action: 'write', description: 'Configure platform settings' },

      // User management (all users across platform)
      { name: 'users:read', resource: 'users', action: 'read', description: 'View all users' },
      { name: 'users:write', resource: 'users', action: 'write', description: 'Edit user details' },
      { name: 'users:delete', resource: 'users', action: 'delete', description: 'Suspend/delete users' },
      { name: 'users:impersonate', resource: 'users', action: 'impersonate', description: 'Login as user' },

      // Organization management (all organizations)
      { name: 'organizations:read', resource: 'organizations', action: 'read', description: 'View all orgs' },
      { name: 'organizations:write', resource: 'organizations', action: 'write', description: 'Edit org settings' },
      { name: 'organizations:delete', resource: 'organizations', action: 'delete', description: 'Delete organizations' },
      { name: 'organizations:create', resource: 'organizations', action: 'create', description: 'Create organizations' },

      // Subscription management
      { name: 'subscriptions:read', resource: 'subscriptions', action: 'read', description: 'View subscriptions' },
      { name: 'subscriptions:write', resource: 'subscriptions', action: 'write', description: 'Manage subscriptions' },
      { name: 'subscriptions:create', resource: 'subscriptions', action: 'create', description: 'Create subscription tiers' },

      // Credit management
      { name: 'credits:read', resource: 'credits', action: 'read', description: 'View credit usage' },
      { name: 'credits:write', resource: 'credits', action: 'write', description: 'Allocate/revoke credits' },

      // Audit logs
      { name: 'audit:read', resource: 'audit', action: 'read', description: 'View audit logs' },

      // Global brand management (across all organizations)
      { name: 'global_brand:read', resource: 'global_brand', action: 'read', description: 'View all org brand assets' },
      { name: 'global_brand:write', resource: 'global_brand', action: 'write', description: 'Edit any org brand assets' },
      { name: 'global_brand:delete', resource: 'global_brand', action: 'delete', description: 'Delete any org brand assets' },

      // Inherit ALL admin permissions (18 total)
      { name: 'creatives:read', resource: 'creatives', action: 'read', description: 'View creatives' },
      { name: 'creatives:write', resource: 'creatives', action: 'write', description: 'Create/edit creatives' },
      { name: 'creatives:delete', resource: 'creatives', action: 'delete', description: 'Delete creatives' },
      { name: 'templates:read', resource: 'templates', action: 'read', description: 'View templates' },
      { name: 'templates:write', resource: 'templates', action: 'write', description: 'Create/edit templates' },
      { name: 'templates:delete', resource: 'templates', action: 'delete', description: 'Delete templates' },
      { name: 'logos:read', resource: 'logos', action: 'read', description: 'View logos' },
      { name: 'logos:write', resource: 'logos', action: 'write', description: 'Upload/edit logos' },
      { name: 'logos:delete', resource: 'logos', action: 'delete', description: 'Delete logos' },
      { name: 'brand:read', resource: 'brand', action: 'read', description: 'View brand settings' },
      { name: 'brand:write', resource: 'brand', action: 'write', description: 'Edit brand settings' },
      { name: 'team:read', resource: 'team', action: 'read', description: 'View team members' },
      { name: 'team:write', resource: 'team', action: 'write', description: 'Invite team members' },
      { name: 'team:delete', resource: 'team', action: 'delete', description: 'Remove team members' },
      { name: 'team:manage', resource: 'team', action: 'manage', description: 'Manage roles' },
      { name: 'billing:read', resource: 'billing', action: 'read', description: 'View billing/credits' },
      { name: 'billing:write', resource: 'billing', action: 'write', description: 'Purchase credits' },
      { name: 'analytics:read', resource: 'analytics', action: 'read', description: 'View analytics' },
      { name: 'settings:read', resource: 'settings', action: 'read', description: 'View settings' },
      { name: 'settings:write', resource: 'settings', action: 'write', description: 'Edit settings' },
      { name: 'roles:switch', resource: 'roles', action: 'read', description: 'Switch role view' },
    ],
  },
  admin: {
    name: 'admin',
    displayName: 'Administrator',
    description: 'Full organization access with team management',
    hierarchy: 100,
    color: 'bg-gradient-to-r from-purple-600 to-indigo-600',
    icon: 'crown',
    permissions: [
      { name: 'creatives:read', resource: 'creatives', action: 'read', description: 'View creatives' },
      { name: 'creatives:write', resource: 'creatives', action: 'write', description: 'Create/edit creatives' },
      { name: 'creatives:delete', resource: 'creatives', action: 'delete', description: 'Delete creatives' },
      { name: 'templates:read', resource: 'templates', action: 'read', description: 'View templates' },
      { name: 'templates:write', resource: 'templates', action: 'write', description: 'Create/edit templates' },
      { name: 'templates:delete', resource: 'templates', action: 'delete', description: 'Delete templates' },
      { name: 'logos:read', resource: 'logos', action: 'read', description: 'View logos' },
      { name: 'logos:write', resource: 'logos', action: 'write', description: 'Upload/edit logos' },
      { name: 'logos:delete', resource: 'logos', action: 'delete', description: 'Delete logos' },
      { name: 'brand:read', resource: 'brand', action: 'read', description: 'View brand settings' },
      { name: 'brand:write', resource: 'brand', action: 'write', description: 'Edit brand settings' },
      { name: 'team:read', resource: 'team', action: 'read', description: 'View team members' },
      { name: 'team:write', resource: 'team', action: 'write', description: 'Invite team members' },
      { name: 'team:delete', resource: 'team', action: 'delete', description: 'Remove team members' },
      { name: 'team:manage', resource: 'team', action: 'manage', description: 'Manage roles' },
      { name: 'billing:read', resource: 'billing', action: 'read', description: 'View billing/credits' },
      { name: 'billing:write', resource: 'billing', action: 'write', description: 'Purchase credits' },
      { name: 'analytics:read', resource: 'analytics', action: 'read', description: 'View analytics' },
      { name: 'settings:read', resource: 'settings', action: 'read', description: 'View settings' },
      { name: 'settings:write', resource: 'settings', action: 'write', description: 'Edit settings' },
      { name: 'roles:switch', resource: 'roles', action: 'read', description: 'Switch role view' },
    ],
  },
  editor: {
    name: 'editor',
    displayName: 'Editor',
    description: 'Create and edit content, manage logos',
    hierarchy: 50,
    color: 'bg-gradient-to-r from-blue-600 to-cyan-600',
    icon: 'edit',
    permissions: [
      { name: 'creatives:read', resource: 'creatives', action: 'read', description: 'View creatives' },
      { name: 'creatives:write', resource: 'creatives', action: 'write', description: 'Create/edit creatives' },
      { name: 'templates:read', resource: 'templates', action: 'read', description: 'View templates' },
      { name: 'templates:write', resource: 'templates', action: 'write', description: 'Create templates' },
      { name: 'logos:read', resource: 'logos', action: 'read', description: 'View logos' },
      { name: 'logos:write', resource: 'logos', action: 'write', description: 'Upload logos' },
      { name: 'brand:read', resource: 'brand', action: 'read', description: 'View brand settings' },
      { name: 'team:read', resource: 'team', action: 'read', description: 'View team members' },
      { name: 'billing:read', resource: 'billing', action: 'read', description: 'View credits balance' },
      { name: 'analytics:read', resource: 'analytics', action: 'read', description: 'View analytics' },
    ],
  },
  viewer: {
    name: 'viewer',
    displayName: 'Viewer',
    description: 'View-only access to content and templates',
    hierarchy: 10,
    color: 'bg-gradient-to-r from-gray-500 to-slate-500',
    icon: 'eye',
    permissions: [
      { name: 'creatives:read', resource: 'creatives', action: 'read', description: 'View creatives' },
      { name: 'templates:read', resource: 'templates', action: 'read', description: 'View templates' },
      { name: 'logos:read', resource: 'logos', action: 'read', description: 'View logos' },
      { name: 'brand:read', resource: 'brand', action: 'read', description: 'View brand settings' },
      { name: 'team:read', resource: 'team', action: 'read', description: 'View team members' },
    ],
  },
}

// Helper to get role by name
export function getRoleDefinition(roleName: UserRole): Role {
  const def = ROLE_DEFINITIONS[roleName]
  return {
    id: roleName,
    ...def,
  }
}

// Helper to get all roles as array
export function getAllRoles(): Role[] {
  return Object.keys(ROLE_DEFINITIONS).map((key) =>
    getRoleDefinition(key as UserRole)
  ).sort((a, b) => b.hierarchy - a.hierarchy)
}

// Helper to check if a role has a specific permission
export function roleHasPermission(role: Role | null, permission: string): boolean {
  if (!role) return false
  return role.permissions.some((p) => p.name === permission)
}

/**
 * Super Admin Helper Functions
 * For platform-level permission checks
 */

/**
 * Check if user is Super Admin (platform-level)
 */
export function isSuperAdmin(user: { is_super_admin?: boolean } | null): boolean {
  return user?.is_super_admin === true
}

/**
 * Check if role has minimum hierarchy level
 */
export function hasMinimumHierarchy(role: Role | null, minHierarchy: number): boolean {
  return (role?.hierarchy ?? 0) >= minHierarchy
}

/**
 * Check if user can manage ANY organization (Super Admin only)
 */
export function canManageAnyOrganization(user: { is_super_admin?: boolean } | null): boolean {
  return isSuperAdmin(user)
}

/**
 * Check if user can manage specific organization
 * - Super Admin: ANY organization
 * - Admin: Only their own organization
 */
export function canManageOrganization(
  user: { is_super_admin?: boolean } | null,
  userOrgId: string | null,
  targetOrgId: string
): boolean {
  if (isSuperAdmin(user)) return true
  return userOrgId === targetOrgId
}

/**
 * Check if user can edit any organization's brand assets
 */
export function canEditAnyBrandAsset(user: { is_super_admin?: boolean } | null): boolean {
  return isSuperAdmin(user)
}

/**
 * Check if user can view audit logs
 */
export function canViewAuditLogs(user: { is_super_admin?: boolean } | null): boolean {
  return isSuperAdmin(user)
}

/**
 * Check if user can impersonate other users
 */
export function canImpersonateUsers(user: { is_super_admin?: boolean } | null): boolean {
  return isSuperAdmin(user)
}
