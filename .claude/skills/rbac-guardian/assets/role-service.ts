/**
 * Role Service - Database Integration Layer
 * 
 * This file provides example implementations for different database schemas.
 * Adapt the queries to match YOUR application's database structure.
 */

import { Role, RoleService } from './role-provider';

// ============================================================================
// EXAMPLE 1: Supabase with dedicated roles/permissions tables
// ============================================================================

export function createSupabaseRoleService(supabaseClient: any): RoleService {
  return {
    async getAllRoles(): Promise<Role[]> {
      const { data, error } = await supabaseClient
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

      return (data || []).map((role: any) => ({
        ...role,
        permissions: role.role_permissions
          ?.map((rp: any) => rp.permissions?.name)
          .filter(Boolean) || [],
      }));
    },

    async getUserRole(userId: string): Promise<Role | null> {
      const { data, error } = await supabaseClient
        .from('user_roles')
        .select(`
          roles (
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
          )
        `)
        .eq('user_id', userId)
        .maybeSingle();

      if (error || !data?.roles) return null;

      const role = data.roles as any;
      return {
        ...role,
        permissions: role.role_permissions
          ?.map((rp: any) => rp.permissions?.name)
          .filter(Boolean) || [],
      };
    },

    async canUserSwitchRoles(userId: string): Promise<boolean> {
      const { data } = await supabaseClient
        .from('user_roles')
        .select(`
          roles!inner (name)
        `)
        .eq('user_id', userId)
        .in('roles.name', ['super_admin', 'superadmin', 'root', 'administrator'])
        .maybeSingle();

      return !!data;
    },

    async getRoleById(roleId: string): Promise<Role | null> {
      const { data, error } = await supabaseClient
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
        permissions: data.role_permissions
          ?.map((rp: any) => rp.permissions?.name)
          .filter(Boolean) || [],
      };
    },
  };
}

// ============================================================================
// EXAMPLE 2: Simple role field in profiles/users table
// ============================================================================

export function createSimpleRoleService(supabaseClient: any): RoleService {
  // Define role metadata (since it's not in database)
  const ROLE_METADATA: Record<string, Partial<Role>> = {
    super_admin: {
      display_name: 'Super Admin',
      description: 'Full system access',
      hierarchy: 100,
      color: 'bg-gradient-to-r from-purple-600 to-indigo-600',
      icon: 'crown',
      permissions: ['*'], // All permissions
    },
    admin: {
      display_name: 'Admin',
      description: 'Administrative access',
      hierarchy: 80,
      color: 'bg-gradient-to-r from-blue-600 to-cyan-600',
      icon: 'shield',
      permissions: ['users:read', 'users:write', 'content:*', 'settings:read'],
    },
    user: {
      display_name: 'User',
      description: 'Standard user access',
      hierarchy: 20,
      color: 'bg-gradient-to-r from-gray-500 to-slate-500',
      icon: 'user',
      permissions: ['content:read'],
    },
  };

  return {
    async getAllRoles(): Promise<Role[]> {
      // Get distinct roles from profiles
      const { data, error } = await supabaseClient
        .from('profiles')
        .select('role')
        .not('role', 'is', null);

      if (error) throw error;

      // Get unique roles
      const uniqueRoles = [...new Set(data?.map((d: any) => d.role) || [])];

      return uniqueRoles.map((roleName: string) => ({
        id: roleName,
        name: roleName,
        ...ROLE_METADATA[roleName] || {
          display_name: roleName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          hierarchy: 50,
        },
      }));
    },

    async getUserRole(userId: string): Promise<Role | null> {
      const { data, error } = await supabaseClient
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (error || !data?.role) return null;

      const roleName = data.role;
      return {
        id: roleName,
        name: roleName,
        ...ROLE_METADATA[roleName] || {
          display_name: roleName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          hierarchy: 50,
        },
      };
    },

    async canUserSwitchRoles(userId: string): Promise<boolean> {
      const { data } = await supabaseClient
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      return data?.role === 'super_admin' || data?.role === 'admin';
    },
  };
}

// ============================================================================
// EXAMPLE 3: API-based role service (for external auth providers)
// ============================================================================

export function createApiRoleService(apiBaseUrl: string, getToken: () => string): RoleService {
  const fetchWithAuth = async (endpoint: string) => {
    const response = await fetch(`${apiBaseUrl}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json();
  };

  return {
    async getAllRoles(): Promise<Role[]> {
      const data = await fetchWithAuth('/api/roles');
      return data.roles || data;
    },

    async getUserRole(userId: string): Promise<Role | null> {
      try {
        const data = await fetchWithAuth(`/api/users/${userId}/role`);
        return data.role || data;
      } catch {
        return null;
      }
    },

    async canUserSwitchRoles(userId: string): Promise<boolean> {
      try {
        const data = await fetchWithAuth(`/api/users/${userId}/permissions`);
        return data.canSwitchRoles || data.permissions?.includes('roles:switch');
      } catch {
        return false;
      }
    },

    async getRoleById(roleId: string): Promise<Role | null> {
      try {
        const data = await fetchWithAuth(`/api/roles/${roleId}`);
        return data.role || data;
      } catch {
        return null;
      }
    },
  };
}

// ============================================================================
// EXAMPLE 4: Static roles (for simple apps without database roles)
// ============================================================================

export function createStaticRoleService(
  roles: Role[],
  getUserRoleName: (userId: string) => Promise<string>,
  superAdminRoles: string[] = ['super_admin', 'admin']
): RoleService {
  return {
    async getAllRoles(): Promise<Role[]> {
      return roles;
    },

    async getUserRole(userId: string): Promise<Role | null> {
      const roleName = await getUserRoleName(userId);
      return roles.find(r => r.name === roleName) || null;
    },

    async canUserSwitchRoles(userId: string): Promise<boolean> {
      const roleName = await getUserRoleName(userId);
      return superAdminRoles.includes(roleName);
    },

    async getRoleById(roleId: string): Promise<Role | null> {
      return roles.find(r => r.id === roleId) || null;
    },
  };
}
