'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react'
import { useAuthStore } from '@/stores/auth-store'
import type { UserRole } from '@/lib/config/constants'
import {
  type Role,
  type RoleContextType,
  SIMULATED_ROLE_KEY,
  getRoleDefinition,
  getAllRoles,
  roleHasPermission,
} from '@/types/rbac'

const RoleContext = createContext<RoleContextType | undefined>(undefined)

interface RoleProviderProps {
  children: ReactNode
}

export function RoleProvider({ children }: RoleProviderProps) {
  const { membership, isAuthenticated, isLoading: authLoading } = useAuthStore()

  const [activeRoleId, setActiveRoleId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false) // Start false, auth handles loading

  // Get user's actual role from membership
  const actualRole = useMemo(() => {
    if (!membership?.role) return null
    return getRoleDefinition(membership.role as UserRole)
  }, [membership?.role])

  // Get all available roles
  const availableRoles = useMemo(() => getAllRoles(), [])

  // Determine if user can switch roles (only admins)
  const canSwitchRoles = useMemo(() => {
    return actualRole?.name === 'admin'
  }, [actualRole])

  // Get active role (simulated or actual)
  const activeRole = useMemo(() => {
    if (!activeRoleId) return actualRole
    const role = availableRoles.find((r) => r.id === activeRoleId)
    return role || actualRole
  }, [activeRoleId, actualRole, availableRoles])

  // Check if currently simulating
  const isSimulating = useMemo(() => {
    return !!(activeRoleId && actualRole && activeRoleId !== actualRole.id)
  }, [activeRoleId, actualRole])

  // Load persisted simulated role on mount
  useEffect(() => {
    if (!isAuthenticated || !canSwitchRoles) {
      return
    }

    try {
      const stored = sessionStorage.getItem(SIMULATED_ROLE_KEY)
      if (stored) {
        setActiveRoleId(stored)
      }
    } catch {
      // sessionStorage not available
    }
  }, [isAuthenticated, canSwitchRoles])

  // Clear simulation when user logs out or membership changes
  useEffect(() => {
    if (!isAuthenticated || !membership) {
      setActiveRoleId(null)
      try {
        sessionStorage.removeItem(SIMULATED_ROLE_KEY)
      } catch {
        // sessionStorage not available
      }
    }
  }, [isAuthenticated, membership])

  // Switch to a different role view
  const switchRole = useCallback((roleId: string) => {
    if (!canSwitchRoles) return

    const role = availableRoles.find((r) => r.id === roleId)
    if (!role) return

    setActiveRoleId(roleId)
    try {
      sessionStorage.setItem(SIMULATED_ROLE_KEY, roleId)
    } catch {
      // sessionStorage not available
    }
  }, [canSwitchRoles, availableRoles])

  // Reset to actual role
  const resetRole = useCallback(() => {
    setActiveRoleId(null)
    try {
      sessionStorage.removeItem(SIMULATED_ROLE_KEY)
    } catch {
      // sessionStorage not available
    }
  }, [])

  // Check if active role has permission
  const hasPermission = useCallback((permission: string) => {
    return roleHasPermission(activeRole, permission)
  }, [activeRole])

  // Get all permissions for active role
  const getPermissions = useCallback(() => {
    if (!activeRole) return []
    return activeRole.permissions.map((p) => p.name)
  }, [activeRole])

  // Combine local and auth loading states
  const combinedLoading = isLoading || authLoading

  const value: RoleContextType = {
    actualRole,
    activeRole,
    availableRoles,
    isLoading: combinedLoading,
    switchRole,
    resetRole,
    isSimulating,
    hasPermission,
    canSwitchRoles,
    getPermissions,
  }

  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  )
}

export function useRole() {
  const context = useContext(RoleContext)
  if (!context) {
    throw new Error('useRole must be used within RoleProvider')
  }
  return context
}

// Convenience hook for permission checking
export function usePermission(permission: string): boolean {
  const { hasPermission, isLoading } = useRole()
  if (isLoading) return false
  return hasPermission(permission)
}

// Convenience hook for multiple permissions (AND logic)
export function usePermissions(permissions: string[]): boolean {
  const { hasPermission, isLoading } = useRole()
  if (isLoading) return false
  return permissions.every((p) => hasPermission(p))
}

// Convenience hook for any permission (OR logic)
export function useAnyPermission(permissions: string[]): boolean {
  const { hasPermission, isLoading } = useRole()
  if (isLoading) return false
  return permissions.some((p) => hasPermission(p))
}
