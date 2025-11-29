---
name: rbac-guardian
description: Dynamic Role-Based Access Control (RBAC) implementation that fetches roles from any application's database. This skill should be used when implementing role-switching functionality where Super Admin can explore all roles dynamically via dropdown, creating adaptive permission systems that work with any role structure. Automatically triggers when user mentions 'role switching', 'dynamic roles', 'super admin dropdown', 'role exploration', 'view as role', or 'role-based access'.
---

# RBAC Guardian - Dynamic Role Switching System

This skill provides a framework for implementing dynamic Role-Based Access Control where roles are **fetched from the application's database** rather than hardcoded. Super Admins can explore any role that exists in the system through a dropdown.

## Core Concept

The RBAC Guardian **dynamically fetches all roles** from the target application's database and displays them in a dropdown. When Super Admin selects a role:

1. The system fetches that role's permissions from the database
2. The UI adapts to show only what that role can access
3. Navigation items hide/show based on the selected role's permissions
4. A visual indicator shows "Viewing as [Role Name]"
5. Original Super Admin context is preserved for easy switching back

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Dynamic RBAC System                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐ │
│  │  Database   │───▶│  API/Hook   │───▶│   Role Dropdown     │ │
│  │  (roles)    │    │  useRoles() │    │   (dynamic list)    │ │
│  └─────────────┘    └─────────────┘    └─────────────────────┘ │
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐ │
│  │ permissions │───▶│ usePerms()  │───▶│  Permission Gates   │ │
│  │  (table)    │    │             │    │  (UI adaptation)    │ │
│  └─────────────┘    └─────────────┘    └─────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Implementation Workflow

### Phase 1: Database Schema Discovery

First, identify the application's existing role structure. Common patterns:

```sql
-- Pattern A: Simple roles table
SELECT * FROM roles;
-- Returns: id, name, display_name, description, etc.

-- Pattern B: Roles with permissions junction
SELECT r.*, array_agg(p.name) as permissions
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id
GROUP BY r.id;

-- Pattern C: User roles assignment
SELECT DISTINCT r.* FROM roles r
JOIN user_roles ur ON r.id = ur.role_id;
```

### Phase 2: Create Role Types (Adaptive)

```typescript
// types/rbac.ts
// These types adapt to whatever structure the database has

export interface Role {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  hierarchy?: number;
  color?: string;
  icon?: string;
  permissions?: string[];
  created_at?: string;
}

export interface RoleContextType {
  // User's actual role from auth
  actualRole: Role | null;
  // Currently active/simulated role
  activeRole: Role | null;
  // All available roles from database
  availableRoles: Role[];
  // Loading state
  isLoading: boolean;
  // Switch to different role
  switchRole: (roleId: string) => void;
  // Reset to actual role
  resetRole: () => void;
  // Check if simulating
  isSimulating: boolean;
  // Check permission
  hasPermission: (permission: string) => boolean;
  // Check if can switch roles (is super admin)
  canSwitchRoles: boolean;
}
```

### Phase 3: Role Service (Database Integration)

```typescript
// services/role-service.ts
import { createClient } from '@/lib/supabase/client';
import { Role } from '@/types/rbac';

export const roleService = {
  /**
   * Fetch all roles from database
   * Adapt the query based on your schema
   */
  async getAllRoles(): Promise<Role[]> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('roles')
      .select(`
        id,
        name,
        display_name,
        description,
        hierarchy,
        color,
        icon,
        role_permissions (
          permissions (name)
        )
      `)
      .order('hierarchy', { ascending: false });

    if (error) throw error;

    // Transform to include permissions array
    return data.map(role => ({
      ...role,
      permissions: role.role_permissions?.map(
        (rp: any) => rp.permissions?.name
      ).filter(Boolean) || [],
    }));
  },

  /**
   * Fetch single role with permissions
   */
  async getRoleById(roleId: string): Promise<Role | null> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('roles')
      .select(`
        *,
        role_permissions (
          permissions (name)
        )
      `)
      .eq('id', roleId)
      .single();

    if (error) return null;

    return {
      ...data,
      permissions: data.role_permissions?.map(
        (rp: any) => rp.permissions?.name
      ).filter(Boolean) || [],
    };
  },

  /**
   * Fetch user's current role
   */
  async getUserRole(userId: string): Promise<Role | null> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('user_roles')
      .select(`
        roles (
          *,
          role_permissions (
            permissions (name)
          )
        )
      `)
      .eq('user_id', userId)
      .single();

    if (error || !data?.roles) return null;

    const role = data.roles as any;
    return {
      ...role,
      permissions: role.role_permissions?.map(
        (rp: any) => rp.permissions?.name
      ).filter(Boolean) || [],
    };
  },

  /**
   * Check if user is super admin (can switch roles)
   */
  async canUserSwitchRoles(userId: string): Promise<boolean> {
    const supabase = createClient();
    
    const { data } = await supabase
      .from('user_roles')
      .select(`
        roles!inner (name)
      `)
      .eq('user_id', userId)
      .in('roles.name', ['super_admin', 'superadmin', 'root'])
      .maybeSingle();

    return !!data;
  },
};
```

### Phase 4: Dynamic Role Context

```typescript
// contexts/RoleContext.tsx
'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { Role, RoleContextType } from '@/types/rbac';
import { roleService } from '@/services/role-service';
import { useAuth } from '@/hooks/useAuth'; // Your auth hook

const RoleContext = createContext<RoleContextType | undefined>(undefined);

const SIMULATED_ROLE_KEY = 'rbac_simulated_role_id';

interface RoleProviderProps {
  children: ReactNode;
}

export function RoleProvider({ children }: RoleProviderProps) {
  const { user } = useAuth();
  
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [actualRole, setActualRole] = useState<Role | null>(null);
  const [activeRole, setActiveRole] = useState<Role | null>(null);
  const [canSwitchRoles, setCanSwitchRoles] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all roles and user's role on mount
  useEffect(() => {
    async function loadRoles() {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        // Parallel fetch for efficiency
        const [roles, userRole, canSwitch] = await Promise.all([
          roleService.getAllRoles(),
          roleService.getUserRole(user.id),
          roleService.canUserSwitchRoles(user.id),
        ]);

        setAvailableRoles(roles);
        setActualRole(userRole);
        setCanSwitchRoles(canSwitch);

        // Check for persisted simulation
        const storedRoleId = sessionStorage.getItem(SIMULATED_ROLE_KEY);
        if (storedRoleId && canSwitch) {
          const simulatedRole = roles.find(r => r.id === storedRoleId);
          setActiveRole(simulatedRole || userRole);
        } else {
          setActiveRole(userRole);
        }
      } catch (error) {
        console.error('Failed to load roles:', error);
        setActiveRole(actualRole);
      } finally {
        setIsLoading(false);
      }
    }

    loadRoles();
  }, [user?.id]);

  const isSimulating = !!(
    activeRole && 
    actualRole && 
    activeRole.id !== actualRole.id
  );

  const switchRole = useCallback(async (roleId: string) => {
    if (!canSwitchRoles) return;

    const role = availableRoles.find(r => r.id === roleId);
    if (!role) return;

    // If role doesn't have permissions loaded, fetch them
    if (!role.permissions?.length) {
      const fullRole = await roleService.getRoleById(roleId);
      if (fullRole) {
        setActiveRole(fullRole);
        sessionStorage.setItem(SIMULATED_ROLE_KEY, roleId);
        return;
      }
    }

    setActiveRole(role);
    sessionStorage.setItem(SIMULATED_ROLE_KEY, roleId);
  }, [canSwitchRoles, availableRoles]);

  const resetRole = useCallback(() => {
    setActiveRole(actualRole);
    sessionStorage.removeItem(SIMULATED_ROLE_KEY);
  }, [actualRole]);

  const hasPermission = useCallback((permission: string) => {
    if (!activeRole?.permissions) return false;
    return activeRole.permissions.includes(permission);
  }, [activeRole]);

  return (
    <RoleContext.Provider
      value={{
        actualRole,
        activeRole,
        availableRoles,
        isLoading,
        switchRole,
        resetRole,
        isSimulating,
        hasPermission,
        canSwitchRoles,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within RoleProvider');
  }
  return context;
}
```

### Phase 5: Dynamic Role Switcher Component

```typescript
// components/rbac/RoleSwitcher.tsx
'use client';

import { useRole } from '@/contexts/RoleContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronDown, 
  RotateCcw, 
  Check, 
  AlertCircle,
  Loader2,
  User,
  Shield,
  Crown,
  Eye,
  Edit,
  Palette,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Dynamic icon mapping - add more as needed
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  crown: Crown,
  shield: Shield,
  user: User,
  eye: Eye,
  edit: Edit,
  palette: Palette,
};

function getRoleIcon(iconName?: string) {
  if (!iconName) return User;
  return ICON_MAP[iconName.toLowerCase()] || User;
}

// Default colors if not in database
function getRoleColor(role: { color?: string; hierarchy?: number }) {
  if (role.color) return role.color;
  
  // Generate color based on hierarchy
  const h = role.hierarchy || 50;
  if (h >= 90) return 'bg-gradient-to-r from-purple-600 to-indigo-600';
  if (h >= 70) return 'bg-gradient-to-r from-blue-600 to-cyan-600';
  if (h >= 50) return 'bg-gradient-to-r from-green-600 to-emerald-600';
  if (h >= 30) return 'bg-gradient-to-r from-orange-600 to-amber-600';
  return 'bg-gradient-to-r from-gray-500 to-slate-500';
}

export function RoleSwitcher() {
  const {
    activeRole,
    actualRole,
    availableRoles,
    switchRole,
    resetRole,
    canSwitchRoles,
    isSimulating,
    isLoading,
  } = useRole();

  // Don't render if user cannot switch roles
  if (!canSwitchRoles) return null;

  // Show loading state
  if (isLoading) {
    return (
      <Button variant="outline" disabled className="gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="hidden sm:inline">Loading...</span>
      </Button>
    );
  }

  if (!activeRole) return null;

  const RoleIcon = getRoleIcon(activeRole.icon);
  const roleColor = getRoleColor(activeRole);

  return (
    <div className="flex items-center gap-2">
      {/* Simulation Indicator */}
      {isSimulating && (
        <Badge
          variant="outline"
          className="hidden sm:flex items-center gap-1.5 animate-pulse border-amber-500/50 text-amber-600 bg-amber-50 dark:bg-amber-950/30"
        >
          <AlertCircle className="w-3 h-3" />
          Viewing as {activeRole.display_name}
        </Badge>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "gap-2 transition-all",
              isSimulating && "ring-2 ring-amber-500/30 border-amber-500/50"
            )}
          >
            <div className={cn(
              "w-6 h-6 rounded-full flex items-center justify-center",
              roleColor
            )}>
              <RoleIcon className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="hidden sm:inline">{activeRole.display_name}</span>
            <ChevronDown className="w-4 h-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-72">
          <DropdownMenuLabel className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Switch Role View
            </span>
            <span className="text-xs text-muted-foreground">
              {availableRoles.length} roles
            </span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* Dynamic Role List from Database */}
          <div className="max-h-80 overflow-y-auto">
            {availableRoles.map((role) => {
              const Icon = getRoleIcon(role.icon);
              const color = getRoleColor(role);
              const isActive = role.id === activeRole.id;
              const isActual = role.id === actualRole?.id;

              return (
                <DropdownMenuItem
                  key={role.id}
                  onClick={() => switchRole(role.id)}
                  className={cn(
                    "flex items-center gap-3 cursor-pointer py-2.5",
                    isActive && "bg-accent"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center",
                    color
                  )}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">
                        {role.display_name}
                      </p>
                      {isActual && (
                        <Badge variant="outline" className="text-[10px] px-1 py-0">
                          You
                        </Badge>
                      )}
                    </div>
                    {role.description && (
                      <p className="text-xs text-muted-foreground truncate">
                        {role.description}
                      </p>
                    )}
                  </div>
                  {isActive && <Check className="w-4 h-4 text-primary" />}
                </DropdownMenuItem>
              );
            })}
          </div>

          {/* Reset Button */}
          {isSimulating && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={resetRole}
                className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset to {actualRole?.display_name}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
```

### Phase 6: Permission-Based Navigation

```typescript
// components/layout/Navigation.tsx
'use client';

import { useRole } from '@/contexts/RoleContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Define nav items with required permissions
const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', permission: null },
  { href: '/users', label: 'Users', permission: 'users:read' },
  { href: '/content', label: 'Content', permission: 'content:read' },
  { href: '/analytics', label: 'Analytics', permission: 'analytics:read' },
  { href: '/billing', label: 'Billing', permission: 'billing:read' },
  { href: '/settings', label: 'Settings', permission: 'settings:read' },
];

export function Navigation() {
  const { hasPermission, isLoading } = useRole();
  const pathname = usePathname();

  // Filter nav items based on active role's permissions
  const visibleItems = NAV_ITEMS.filter(item => 
    !item.permission || hasPermission(item.permission)
  );

  if (isLoading) {
    return <nav className="animate-pulse">Loading...</nav>;
  }

  return (
    <nav className="flex items-center gap-6">
      {visibleItems.map(item => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "text-sm font-medium transition-colors",
            pathname === item.href
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
```

### Phase 7: Simulation Banner

```typescript
// components/rbac/SimulationBanner.tsx
'use client';

import { useRole } from '@/contexts/RoleContext';
import { AlertCircle, X } from 'lucide-react';

export function SimulationBanner() {
  const { isSimulating, activeRole, resetRole } = useRole();

  if (!isSimulating || !activeRole) return null;

  return (
    <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800 px-4 py-2">
      <div className="container flex items-center justify-between">
        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">
            Viewing as <strong>{activeRole.display_name}</strong> - 
            Some features may be hidden
          </span>
        </div>
        <button
          onClick={resetRole}
          className="text-amber-600 hover:text-amber-800 p-1"
          aria-label="Exit simulation"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
```

## Adapting to Different Database Schemas

### If roles are in a `profiles` table:

```typescript
async getUserRole(userId: string) {
  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();
  
  // Map simple role string to role object
  return { id: data.role, name: data.role, display_name: data.role };
}
```

### If using enum-based roles:

```typescript
// Fetch enum values as roles
async getAllRoles() {
  const { data } = await supabase.rpc('get_role_enum_values');
  return data.map((name: string, index: number) => ({
    id: name,
    name,
    display_name: name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    hierarchy: 100 - (index * 20),
  }));
}
```

### If roles are nested in user object:

```typescript
async getUserRole(userId: string) {
  const { data } = await supabase
    .from('users')
    .select('role:roles(*)')
    .eq('id', userId)
    .single();
  
  return data.role;
}
```

## Best Practices

1. **Cache roles**: Roles don't change often, cache them
2. **Server validation**: Always validate permissions server-side
3. **Audit logging**: Log when admins switch roles
4. **Session storage**: Use sessionStorage, not localStorage for simulation
5. **Loading states**: Show skeleton/loading while fetching roles

## Files Reference

- `references/role-definitions.md` - Role structure patterns
- `references/permission-matrix.md` - Permission patterns
- `references/audit-checklist.md` - Implementation checklist
- `assets/role-provider.tsx` - Complete context provider
- `assets/role-switcher.tsx` - Dynamic dropdown component
- `assets/role-service.ts` - Database service layer
