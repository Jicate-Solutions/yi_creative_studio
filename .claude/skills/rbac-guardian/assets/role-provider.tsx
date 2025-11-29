'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';

// ============================================================================
// Types - Adapt these to match your application's database schema
// ============================================================================

export interface Role {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  hierarchy?: number;
  color?: string;
  icon?: string;
  permissions?: string[];
  [key: string]: any; // Allow additional fields from database
}

export interface RoleContextType {
  /** User's actual role from authentication */
  actualRole: Role | null;
  /** Currently active/simulated role */
  activeRole: Role | null;
  /** All available roles fetched from database */
  availableRoles: Role[];
  /** Loading state while fetching roles */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
  /** Switch to a different role (Super Admin only) */
  switchRole: (roleId: string) => void;
  /** Reset to actual role */
  resetRole: () => void;
  /** Whether currently simulating another role */
  isSimulating: boolean;
  /** Check if has specific permission */
  hasPermission: (permission: string) => boolean;
  /** Check if has any of the permissions */
  hasAnyPermission: (permissions: string[]) => boolean;
  /** Check if has all permissions */
  hasAllPermissions: (permissions: string[]) => boolean;
  /** Whether user can switch roles */
  canSwitchRoles: boolean;
  /** Refetch roles from database */
  refetchRoles: () => Promise<void>;
}

// ============================================================================
// Context
// ============================================================================

const RoleContext = createContext<RoleContextType | undefined>(undefined);

const SIMULATED_ROLE_KEY = 'rbac_simulated_role_id';

// ============================================================================
// Service Interface - Implement this for your database
// ============================================================================

export interface RoleService {
  /** Fetch all roles from database */
  getAllRoles: () => Promise<Role[]>;
  /** Fetch user's current role */
  getUserRole: (userId: string) => Promise<Role | null>;
  /** Check if user can switch roles (is super admin) */
  canUserSwitchRoles: (userId: string) => Promise<boolean>;
  /** Optional: Fetch single role with full permissions */
  getRoleById?: (roleId: string) => Promise<Role | null>;
}

// ============================================================================
// Provider Component
// ============================================================================

interface RoleProviderProps {
  children: ReactNode;
  /** Current user ID from your auth system */
  userId: string | null;
  /** Role service implementation for your database */
  roleService: RoleService;
  /** Callback when role is switched (for analytics/logging) */
  onRoleSwitch?: (fromRole: Role | null, toRole: Role) => void;
}

export function RoleProvider({
  children,
  userId,
  roleService,
  onRoleSwitch,
}: RoleProviderProps) {
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [actualRole, setActualRole] = useState<Role | null>(null);
  const [activeRole, setActiveRole] = useState<Role | null>(null);
  const [canSwitchRoles, setCanSwitchRoles] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch roles function
  const fetchRoles = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Parallel fetch for efficiency
      const [roles, userRole, canSwitch] = await Promise.all([
        roleService.getAllRoles(),
        roleService.getUserRole(userId),
        roleService.canUserSwitchRoles(userId),
      ]);

      setAvailableRoles(roles);
      setActualRole(userRole);
      setCanSwitchRoles(canSwitch);

      // Check for persisted simulation
      if (typeof window !== 'undefined') {
        const storedRoleId = sessionStorage.getItem(SIMULATED_ROLE_KEY);
        if (storedRoleId && canSwitch) {
          const simulatedRole = roles.find(r => r.id === storedRoleId);
          setActiveRole(simulatedRole || userRole);
        } else {
          setActiveRole(userRole);
        }
      } else {
        setActiveRole(userRole);
      }
    } catch (err) {
      console.error('Failed to fetch roles:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch roles'));
      setActiveRole(actualRole);
    } finally {
      setIsLoading(false);
    }
  }, [userId, roleService]);

  // Initial fetch
  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  // Derived state
  const isSimulating = !!(
    activeRole &&
    actualRole &&
    activeRole.id !== actualRole.id
  );

  // Switch role handler
  const switchRole = useCallback(
    async (roleId: string) => {
      if (!canSwitchRoles) {
        console.warn('User does not have permission to switch roles');
        return;
      }

      let role = availableRoles.find(r => r.id === roleId);
      
      // If role doesn't have permissions, try to fetch full role
      if (role && !role.permissions?.length && roleService.getRoleById) {
        try {
          const fullRole = await roleService.getRoleById(roleId);
          if (fullRole) role = fullRole;
        } catch (err) {
          console.error('Failed to fetch full role:', err);
        }
      }

      if (!role) {
        console.error('Role not found:', roleId);
        return;
      }

      const fromRole = activeRole;
      setActiveRole(role);

      if (typeof window !== 'undefined') {
        sessionStorage.setItem(SIMULATED_ROLE_KEY, roleId);
      }

      onRoleSwitch?.(fromRole, role);
    },
    [canSwitchRoles, availableRoles, activeRole, roleService, onRoleSwitch]
  );

  // Reset to actual role
  const resetRole = useCallback(() => {
    const fromRole = activeRole;
    setActiveRole(actualRole);

    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(SIMULATED_ROLE_KEY);
    }

    if (fromRole && actualRole && fromRole.id !== actualRole.id) {
      onRoleSwitch?.(fromRole, actualRole);
    }
  }, [activeRole, actualRole, onRoleSwitch]);

  // Permission checking
  const hasPermission = useCallback(
    (permission: string) => {
      if (!activeRole?.permissions) return false;
      return activeRole.permissions.includes(permission);
    },
    [activeRole]
  );

  const hasAnyPermission = useCallback(
    (permissions: string[]) => {
      if (!activeRole?.permissions) return false;
      return permissions.some(p => activeRole.permissions!.includes(p));
    },
    [activeRole]
  );

  const hasAllPermissions = useCallback(
    (permissions: string[]) => {
      if (!activeRole?.permissions) return false;
      return permissions.every(p => activeRole.permissions!.includes(p));
    },
    [activeRole]
  );

  const value: RoleContextType = {
    actualRole,
    activeRole,
    availableRoles,
    isLoading,
    error,
    switchRole,
    resetRole,
    isSimulating,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canSwitchRoles,
    refetchRoles: fetchRoles,
  };

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

// ============================================================================
// Hook
// ============================================================================

export function useRole() {
  const context = useContext(RoleContext);

  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }

  return context;
}

// ============================================================================
// Utility Hooks
// ============================================================================

/** Check if user has a specific permission */
export function useHasPermission(permission: string): boolean {
  const { hasPermission } = useRole();
  return hasPermission(permission);
}

/** Check if currently simulating */
export function useIsSimulating(): boolean {
  const { isSimulating } = useRole();
  return isSimulating;
}

/** Get active role info */
export function useActiveRole(): Role | null {
  const { activeRole } = useRole();
  return activeRole;
}
