# Dynamic Role Definitions Reference

This reference explains how to adapt the RBAC Guardian to any application's role structure.

## Role Discovery Patterns

### Pattern 1: Dedicated Roles Table

Most common in larger applications with complex permissions.

```sql
-- Query to discover role structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'roles';

-- Expected columns:
-- id, name, display_name, description, hierarchy, color, icon, created_at
```

**Service Implementation:**
```typescript
async getAllRoles() {
  const { data } = await supabase
    .from('roles')
    .select('*')
    .order('hierarchy', { ascending: false });
  return data;
}
```

### Pattern 2: Role in User/Profile Table

Common in simpler applications.

```sql
-- Check if role is a column
SELECT DISTINCT role FROM profiles;
-- or
SELECT DISTINCT role FROM users;
```

**Service Implementation:**
```typescript
async getAllRoles() {
  // Get unique roles from profiles
  const { data } = await supabase
    .from('profiles')
    .select('role')
    .not('role', 'is', null);
  
  // Return unique with metadata
  const unique = [...new Set(data.map(d => d.role))];
  return unique.map(name => ({
    id: name,
    name,
    display_name: formatRoleName(name),
  }));
}
```

### Pattern 3: Enum-Based Roles

Used when roles are fixed and defined in database schema.

```sql
-- PostgreSQL: Get enum values
SELECT unnest(enum_range(NULL::user_role)) as role;
```

**Service Implementation:**
```typescript
async getAllRoles() {
  const { data } = await supabase.rpc('get_role_enum_values');
  return data.map((name, index) => ({
    id: name,
    name,
    display_name: formatRoleName(name),
    hierarchy: 100 - (index * 20),
  }));
}
```

### Pattern 4: External Auth Provider

When using Auth0, Clerk, Firebase, etc.

```typescript
async getAllRoles() {
  // Fetch from auth provider's API
  const response = await fetch('https://auth-provider/api/roles', {
    headers: { Authorization: `Bearer ${apiKey}` }
  });
  return response.json();
}
```

## Permission Discovery

### Junction Table Pattern

```sql
-- Discover permission structure
SELECT r.name as role, array_agg(p.name) as permissions
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id  
LEFT JOIN permissions p ON rp.permission_id = p.id
GROUP BY r.name;
```

### Embedded Permissions

```sql
-- If permissions stored as JSON/array in roles table
SELECT name, permissions FROM roles;
-- Returns: {"name": "admin", "permissions": ["users:read", "users:write"]}
```

### No Permissions Table

Define permissions in code based on role:

```typescript
const ROLE_PERMISSIONS: Record<string, string[]> = {
  super_admin: ['*'],
  admin: ['users:read', 'users:write', 'content:*'],
  editor: ['content:read', 'content:write'],
  viewer: ['content:read'],
};

async getAllRoles() {
  const roles = await fetchRolesFromDb();
  return roles.map(role => ({
    ...role,
    permissions: ROLE_PERMISSIONS[role.name] || [],
  }));
}
```

## Super Admin Detection

### By Role Name

```typescript
async canUserSwitchRoles(userId: string) {
  const role = await getUserRole(userId);
  return ['super_admin', 'superadmin', 'root', 'administrator'].includes(role?.name);
}
```

### By Hierarchy Level

```typescript
async canUserSwitchRoles(userId: string) {
  const role = await getUserRole(userId);
  return (role?.hierarchy ?? 0) >= 90;
}
```

### By Specific Permission

```typescript
async canUserSwitchRoles(userId: string) {
  const role = await getUserRole(userId);
  return role?.permissions?.includes('roles:switch');
}
```

### By Database Flag

```sql
-- If there's an is_super_admin column
SELECT is_super_admin FROM profiles WHERE id = 'USER_ID';
```

## Role Display Customization

### Auto-Generate Display Name

```typescript
function formatRoleName(name: string): string {
  return name
    .replace(/_/g, ' ')           // super_admin -> super admin
    .replace(/-/g, ' ')           // super-admin -> super admin
    .replace(/([a-z])([A-Z])/g, '$1 $2')  // superAdmin -> super Admin
    .replace(/\b\w/g, c => c.toUpperCase()); // capitalize
}
// super_admin -> Super Admin
```

### Auto-Generate Colors

```typescript
function getRoleColor(role: Role): string {
  // Color based on hierarchy
  const h = role.hierarchy ?? 50;
  
  const colors = [
    { min: 90, color: 'from-purple-600 to-indigo-600' },
    { min: 70, color: 'from-blue-600 to-cyan-600' },
    { min: 50, color: 'from-green-600 to-emerald-600' },
    { min: 30, color: 'from-orange-600 to-amber-600' },
    { min: 0, color: 'from-gray-500 to-slate-500' },
  ];
  
  return `bg-gradient-to-r ${colors.find(c => h >= c.min)?.color}`;
}
```

### Auto-Generate Icons

```typescript
function getRoleIcon(role: Role): string {
  // Map common role names to icons
  const iconMap: Record<string, string> = {
    super_admin: 'crown',
    admin: 'shield',
    moderator: 'shield',
    creator: 'palette',
    editor: 'edit',
    viewer: 'eye',
    user: 'user',
    guest: 'user',
  };
  
  return iconMap[role.name.toLowerCase()] || 'user';
}
```

## Common Role Hierarchies

### Standard Business Hierarchy

```
100: Super Admin / Root
 90: System Admin
 80: Organization Admin
 70: Department Manager
 60: Team Lead
 50: Senior Member
 40: Member
 30: Junior Member
 20: Guest
 10: Restricted
  0: None / Blocked
```

### Content Platform Hierarchy

```
100: Super Admin
 80: Admin
 60: Publisher
 50: Editor
 40: Author
 30: Contributor
 20: Subscriber
 10: Viewer
  0: Guest
```

### SaaS Application Hierarchy

```
100: Super Admin
 90: Enterprise Admin
 80: Organization Owner
 70: Organization Admin
 60: Workspace Admin
 50: Project Manager
 40: Team Member
 30: Collaborator
 20: Viewer
 10: Free User
  0: Trial User
```

## Migration Examples

### Adding Missing Columns

```sql
-- Add hierarchy if missing
ALTER TABLE roles 
ADD COLUMN IF NOT EXISTS hierarchy INTEGER DEFAULT 50;

-- Add display_name if missing
ALTER TABLE roles 
ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Populate display_name from name
UPDATE roles 
SET display_name = INITCAP(REPLACE(name, '_', ' '))
WHERE display_name IS NULL;

-- Add color and icon
ALTER TABLE roles 
ADD COLUMN IF NOT EXISTS color TEXT,
ADD COLUMN IF NOT EXISTS icon TEXT;
```

### Creating Junction Table

```sql
-- If permissions exist but no junction
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- Migrate from array column
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN LATERAL unnest(r.permissions_array) AS perm_name
JOIN permissions p ON p.name = perm_name;
```
