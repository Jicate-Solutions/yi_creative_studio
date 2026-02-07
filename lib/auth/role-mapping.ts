/**
 * Yi Connect → Yi Creative Role Mapping
 *
 * Maps Yi Connect's 7-level role hierarchy to Yi Creative's 4-level system.
 *
 * Yi Connect Hierarchy:
 * - Level 7: Super Admin → super_admin
 * - Level 6: National Admin → super_admin
 * - Level 5: Executive Member → admin
 * - Level 4: Chair → admin
 * - Level 3: Co-Chair → editor
 * - Level 2: EC Member → editor
 * - Level 1: Member → editor (all members can create content)
 */

import type { YiConnectRole, YiCreativeRole } from './sso-types'

/**
 * Role mapping from Yi Connect role names to Yi Creative roles
 */
const ROLE_NAME_MAP: Record<string, YiCreativeRole> = {
  super_admin: 'super_admin',
  national_admin: 'super_admin',
  executive_member: 'admin',
  chair: 'admin',
  co_chair: 'editor',
  ec_member: 'editor',
  member: 'editor',
}

/**
 * Role mapping from Yi Connect hierarchy levels to Yi Creative roles
 */
const ROLE_LEVEL_MAP: Record<number, YiCreativeRole> = {
  7: 'super_admin', // Super Admin
  6: 'super_admin', // National Admin
  5: 'admin', // Executive Member
  4: 'admin', // Chair
  3: 'editor', // Co-Chair
  2: 'editor', // EC Member
  1: 'editor', // Member
}

/**
 * Map Yi Connect role to Yi Creative role by role name
 *
 * @param yiConnectRole - Yi Connect role name (e.g., 'chair', 'member')
 * @returns Yi Creative role name
 */
export function mapRoleByName(yiConnectRole: string): YiCreativeRole {
  const normalizedRole = yiConnectRole.toLowerCase().replace(/\s+/g, '_')
  return ROLE_NAME_MAP[normalizedRole] || 'editor'
}

/**
 * Map Yi Connect role to Yi Creative role by hierarchy level
 *
 * @param hierarchyLevel - Yi Connect hierarchy level (1-7)
 * @returns Yi Creative role name
 */
export function mapRoleByLevel(hierarchyLevel: number): YiCreativeRole {
  return ROLE_LEVEL_MAP[hierarchyLevel] || 'editor'
}

/**
 * Map Yi Connect role to Yi Creative role (uses both name and level for accuracy)
 *
 * @param roleName - Yi Connect role name
 * @param hierarchyLevel - Yi Connect hierarchy level (optional, used as fallback)
 * @returns Yi Creative role name
 */
export function mapRole(
  roleName: string,
  hierarchyLevel?: number
): YiCreativeRole {
  // Try name mapping first
  const normalizedRole = roleName.toLowerCase().replace(/\s+/g, '_')
  if (ROLE_NAME_MAP[normalizedRole]) {
    return ROLE_NAME_MAP[normalizedRole]
  }

  // Fall back to level mapping if available
  if (hierarchyLevel !== undefined && ROLE_LEVEL_MAP[hierarchyLevel]) {
    return ROLE_LEVEL_MAP[hierarchyLevel]
  }

  // Default to editor (all members can create content)
  return 'editor'
}

/**
 * Get the highest role from multiple chapter memberships
 *
 * When a user belongs to multiple chapters with different roles,
 * this determines their "global" role for platform-level access.
 *
 * @param chapters - Array of chapter memberships with roles
 * @returns The highest Yi Creative role
 */
export function getHighestRole(
  chapters: Array<{ role: string; hierarchy_level: number }>
): YiCreativeRole {
  if (chapters.length === 0) {
    return 'viewer'
  }

  // Find the highest hierarchy level
  const highestLevel = Math.max(...chapters.map((c) => c.hierarchy_level))
  return mapRoleByLevel(highestLevel)
}

/**
 * Check if a role has platform-level (super admin) access
 */
export function isPlatformRole(hierarchyLevel: number): boolean {
  return hierarchyLevel >= 6 // Level 6+ are platform-level (National Admin, Super Admin)
}

/**
 * Check if a role has admin access (can manage team, settings)
 */
export function isAdminRole(hierarchyLevel: number): boolean {
  return hierarchyLevel >= 4 // Level 4+ are admins (Chair and above)
}

/**
 * Check if a role can create content
 */
export function canCreateContent(hierarchyLevel: number): boolean {
  return hierarchyLevel >= 1 // All members can create content
}

/**
 * Yi Connect role display names for UI
 */
export const YI_CONNECT_ROLE_DISPLAY: Record<string, string> = {
  super_admin: 'Super Admin',
  national_admin: 'National Admin',
  executive_member: 'Executive Member',
  chair: 'Chair',
  co_chair: 'Co-Chair',
  ec_member: 'EC Member',
  member: 'Member',
}

/**
 * Get display name for Yi Connect role
 */
export function getRoleDisplayName(roleName: string): string {
  const normalizedRole = roleName.toLowerCase().replace(/\s+/g, '_')
  return YI_CONNECT_ROLE_DISPLAY[normalizedRole] || roleName
}

/**
 * Map Yi Connect role to organization membership role
 *
 * CRITICAL: The organization_members table has a check constraint that
 * only allows: 'admin', 'editor', 'viewer'
 *
 * super_admin is a PLATFORM-LEVEL role (stored in auth.users.is_super_admin),
 * NOT a valid organization membership role.
 *
 * This function ensures platform roles are converted to valid org membership roles.
 *
 * @param roleName - Yi Connect role name
 * @param hierarchyLevel - Yi Connect hierarchy level (optional)
 * @returns Valid organization membership role ('admin' | 'editor' | 'viewer')
 */
export function mapRoleForMembership(
  roleName: string,
  hierarchyLevel?: number
): 'admin' | 'editor' | 'viewer' {
  const creativeRole = mapRole(roleName, hierarchyLevel)

  // Platform roles (super_admin) should be 'admin' for org membership purposes
  // They still have super_admin access via auth.users.is_super_admin flag
  if (creativeRole === 'super_admin') {
    return 'admin'
  }

  return creativeRole as 'admin' | 'editor' | 'viewer'
}
