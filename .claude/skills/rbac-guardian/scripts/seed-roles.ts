/**
 * RBAC Role Seeding Script
 * 
 * Seeds the database with default roles and permissions.
 * Run with: npx tsx scripts/seed-roles.ts
 */

import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ============================================================================
// Role Definitions
// ============================================================================

const ROLES = [
  {
    name: 'super_admin',
    display_name: 'Super Admin',
    description: 'Full system access with role switching capability',
    hierarchy: 100,
    color: 'bg-gradient-to-r from-purple-600 to-indigo-600',
    icon: 'Crown',
  },
  {
    name: 'admin',
    display_name: 'Admin',
    description: 'Administrative access without billing',
    hierarchy: 80,
    color: 'bg-gradient-to-r from-blue-600 to-cyan-600',
    icon: 'Shield',
  },
  {
    name: 'creator',
    display_name: 'Creator',
    description: 'Content creation and management',
    hierarchy: 60,
    color: 'bg-gradient-to-r from-green-600 to-emerald-600',
    icon: 'Palette',
  },
  {
    name: 'editor',
    display_name: 'Editor',
    description: 'Edit existing content',
    hierarchy: 40,
    color: 'bg-gradient-to-r from-orange-600 to-amber-600',
    icon: 'Edit',
  },
  {
    name: 'viewer',
    display_name: 'Viewer',
    description: 'Read-only access',
    hierarchy: 20,
    color: 'bg-gradient-to-r from-gray-600 to-slate-600',
    icon: 'Eye',
  },
  {
    name: 'guest',
    display_name: 'Guest',
    description: 'Limited public access',
    hierarchy: 0,
    color: 'bg-gray-400',
    icon: 'User',
  },
];

// ============================================================================
// Permission Definitions
// ============================================================================

const PERMISSIONS = [
  // Users
  { name: 'users:read', resource: 'users', action: 'read', description: 'View user accounts' },
  { name: 'users:write', resource: 'users', action: 'write', description: 'Create and edit users' },
  { name: 'users:delete', resource: 'users', action: 'delete', description: 'Delete user accounts' },
  { name: 'users:invite', resource: 'users', action: 'invite', description: 'Invite new users' },
  { name: 'users:suspend', resource: 'users', action: 'suspend', description: 'Suspend user accounts' },
  
  // Content
  { name: 'content:read', resource: 'content', action: 'read', description: 'View content' },
  { name: 'content:write', resource: 'content', action: 'write', description: 'Create and edit content' },
  { name: 'content:delete', resource: 'content', action: 'delete', description: 'Delete content' },
  { name: 'content:publish', resource: 'content', action: 'publish', description: 'Publish content' },
  { name: 'content:archive', resource: 'content', action: 'archive', description: 'Archive content' },
  
  // Settings
  { name: 'settings:read', resource: 'settings', action: 'read', description: 'View settings' },
  { name: 'settings:write', resource: 'settings', action: 'write', description: 'Modify settings' },
  { name: 'settings:system', resource: 'settings', action: 'system', description: 'System configuration' },
  
  // Billing
  { name: 'billing:read', resource: 'billing', action: 'read', description: 'View billing information' },
  { name: 'billing:write', resource: 'billing', action: 'write', description: 'Manage billing' },
  { name: 'billing:refund', resource: 'billing', action: 'refund', description: 'Process refunds' },
  
  // Analytics
  { name: 'analytics:read', resource: 'analytics', action: 'read', description: 'View analytics' },
  { name: 'analytics:export', resource: 'analytics', action: 'export', description: 'Export analytics data' },
  { name: 'analytics:configure', resource: 'analytics', action: 'configure', description: 'Configure analytics' },
  
  // Roles
  { name: 'roles:read', resource: 'roles', action: 'read', description: 'View roles' },
  { name: 'roles:write', resource: 'roles', action: 'write', description: 'Manage roles' },
  { name: 'roles:switch', resource: 'roles', action: 'switch', description: 'Switch between roles' },
  { name: 'roles:assign', resource: 'roles', action: 'assign', description: 'Assign roles to users' },
];

// ============================================================================
// Role-Permission Mappings
// ============================================================================

const ROLE_PERMISSIONS: Record<string, string[]> = {
  super_admin: [
    'users:read', 'users:write', 'users:delete', 'users:invite', 'users:suspend',
    'content:read', 'content:write', 'content:delete', 'content:publish', 'content:archive',
    'settings:read', 'settings:write', 'settings:system',
    'billing:read', 'billing:write', 'billing:refund',
    'analytics:read', 'analytics:export', 'analytics:configure',
    'roles:read', 'roles:write', 'roles:switch', 'roles:assign',
  ],
  admin: [
    'users:read', 'users:write', 'users:invite', 'users:suspend',
    'content:read', 'content:write', 'content:delete', 'content:publish', 'content:archive',
    'settings:read', 'settings:write',
    'analytics:read', 'analytics:export',
    'roles:read', 'roles:assign',
  ],
  creator: [
    'content:read', 'content:write', 'content:publish', 'content:archive',
    'analytics:read',
  ],
  editor: [
    'content:read', 'content:write',
  ],
  viewer: [
    'content:read',
    'analytics:read',
  ],
  guest: [],
};

// ============================================================================
// Seeding Functions
// ============================================================================

async function seedRoles() {
  console.log('Seeding roles...');
  
  const { data, error } = await supabase
    .from('roles')
    .upsert(ROLES, { onConflict: 'name' })
    .select();
    
  if (error) {
    console.error('Error seeding roles:', error);
    throw error;
  }
  
  console.log(`Seeded ${data.length} roles`);
  return data;
}

async function seedPermissions() {
  console.log('Seeding permissions...');
  
  const { data, error } = await supabase
    .from('permissions')
    .upsert(PERMISSIONS, { onConflict: 'name' })
    .select();
    
  if (error) {
    console.error('Error seeding permissions:', error);
    throw error;
  }
  
  console.log(`Seeded ${data.length} permissions`);
  return data;
}

async function seedRolePermissions(
  roles: { id: string; name: string }[],
  permissions: { id: string; name: string }[]
) {
  console.log('Seeding role-permission mappings...');
  
  const roleMap = new Map(roles.map(r => [r.name, r.id]));
  const permissionMap = new Map(permissions.map(p => [p.name, p.id]));
  
  const mappings: { role_id: string; permission_id: string }[] = [];
  
  for (const [roleName, permissionNames] of Object.entries(ROLE_PERMISSIONS)) {
    const roleId = roleMap.get(roleName);
    if (!roleId) continue;
    
    for (const permName of permissionNames) {
      const permId = permissionMap.get(permName);
      if (!permId) continue;
      
      mappings.push({ role_id: roleId, permission_id: permId });
    }
  }
  
  // Clear existing mappings
  await supabase.from('role_permissions').delete().neq('role_id', '');
  
  // Insert new mappings
  const { error } = await supabase
    .from('role_permissions')
    .insert(mappings);
    
  if (error) {
    console.error('Error seeding role permissions:', error);
    throw error;
  }
  
  console.log(`Seeded ${mappings.length} role-permission mappings`);
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log('Starting RBAC seeding...\n');
  
  try {
    const roles = await seedRoles();
    const permissions = await seedPermissions();
    await seedRolePermissions(roles, permissions);
    
    console.log('\nRBAC seeding completed successfully!');
  } catch (error) {
    console.error('\nRBAC seeding failed:', error);
    process.exit(1);
  }
}

main();
