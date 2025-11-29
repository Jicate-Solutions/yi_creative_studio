# RBAC Implementation Audit Checklist

Use this checklist when implementing the RBAC Guardian system in any application.

## Phase 1: Database Discovery

- [ ] **Identify role storage**
  - [ ] Dedicated `roles` table exists?
  - [ ] Roles stored in `profiles`/`users` table?
  - [ ] Using database enum for roles?
  - [ ] External auth provider manages roles?

- [ ] **Map role structure**
  - [ ] Document all role fields (id, name, display_name, etc.)
  - [ ] Identify permission storage method
  - [ ] Check for role hierarchy field
  - [ ] Note any custom fields (color, icon, etc.)

- [ ] **Permission structure**
  - [ ] Separate `permissions` table?
  - [ ] Junction table `role_permissions`?
  - [ ] Permissions embedded in role record?
  - [ ] Permission naming convention (resource:action)?

## Phase 2: Service Layer

- [ ] **Create role service** matching your schema
  - [ ] `getAllRoles()` - Fetch all available roles
  - [ ] `getUserRole(userId)` - Get user's current role
  - [ ] `canUserSwitchRoles(userId)` - Check super admin status
  - [ ] `getRoleById(roleId)` - Get full role with permissions

- [ ] **Test queries**
  - [ ] Verify roles query returns expected data
  - [ ] Confirm permissions are included
  - [ ] Check super admin detection works
  - [ ] Test with different user types

## Phase 3: Context Integration

- [ ] **Install RoleProvider**
  - [ ] Wrap app with `RoleProvider`
  - [ ] Pass `userId` from auth
  - [ ] Provide `roleService` implementation
  - [ ] Add `onRoleSwitch` callback for logging

- [ ] **Verify context works**
  - [ ] `useRole()` returns data
  - [ ] `availableRoles` populated correctly
  - [ ] `activeRole` matches user's role
  - [ ] `canSwitchRoles` accurate for super admin

## Phase 4: UI Components

- [ ] **Add RoleSwitcher to header**
  - [ ] Import and add `<RoleSwitcher />` component
  - [ ] Verify dropdown shows all database roles
  - [ ] Test role switching works
  - [ ] Confirm visual indicators show when simulating

- [ ] **Add SimulationBanner**
  - [ ] Add `<SimulationBanner />` to layout
  - [ ] Verify banner appears when simulating
  - [ ] Test reset button works

- [ ] **Implement permission gates**
  - [ ] Wrap sensitive UI with `<PermissionGate>`
  - [ ] Add `<RoleGuard>` to admin sections
  - [ ] Verify UI hides/shows based on role

## Phase 5: Navigation

- [ ] **Permission-based nav filtering**
  - [ ] Add permission field to nav items
  - [ ] Filter nav based on `hasPermission()`
  - [ ] Test nav changes when switching roles

- [ ] **Route protection**
  - [ ] Add middleware for protected routes
  - [ ] Verify unauthorized access is blocked
  - [ ] Test with different roles

## Phase 6: Testing

- [ ] **Manual testing**
  - [ ] Log in as super admin
  - [ ] Switch to each available role
  - [ ] Verify UI changes appropriately
  - [ ] Check navigation updates
  - [ ] Confirm features hide/show correctly
  - [ ] Test reset to original role

- [ ] **Edge cases**
  - [ ] Page refresh preserves simulation
  - [ ] Logout clears simulation
  - [ ] Non-super-admin cannot see switcher
  - [ ] Handles missing permissions gracefully

## Phase 7: Security

- [ ] **Server-side validation**
  - [ ] API routes check real permissions (not simulated)
  - [ ] Database queries use actual user role
  - [ ] Sensitive actions validate server-side

- [ ] **Audit logging**
  - [ ] Log role switch events
  - [ ] Include who switched and to what
  - [ ] Timestamp all switches

## Common Issues & Solutions

### Roles not loading
```typescript
// Check: Is userId being passed?
<RoleProvider userId={user?.id} roleService={roleService}>

// Check: Is service query correct?
const { data, error } = await supabase.from('roles').select('*');
console.log('Roles query:', { data, error });
```

### Can't switch roles
```typescript
// Check: canUserSwitchRoles returning false?
// Verify super admin detection:
const canSwitch = await roleService.canUserSwitchRoles(userId);
console.log('Can switch:', canSwitch);
```

### Permissions not working
```typescript
// Check: Are permissions being loaded?
console.log('Active role permissions:', activeRole?.permissions);

// Verify permission format matches:
hasPermission('users:read') // vs hasPermission('users.read')
```

### UI not updating on switch
```typescript
// Check: Is component using useRole()?
const { activeRole } = useRole();

// Verify re-render on role change
useEffect(() => {
  console.log('Role changed:', activeRole);
}, [activeRole]);
```

## Database Schema Examples

### Supabase with junction tables
```sql
-- roles table
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  hierarchy INTEGER DEFAULT 0,
  color TEXT,
  icon TEXT
);

-- permissions table
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  resource TEXT NOT NULL,
  action TEXT NOT NULL
);

-- junction table
CREATE TABLE role_permissions (
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- user assignment
CREATE TABLE user_roles (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);
```

### Simple role in profiles
```sql
-- Just add role column
ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'user';

-- Or with enum
CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'user', 'guest');
ALTER TABLE profiles ADD COLUMN role user_role DEFAULT 'user';
```

## Verification Queries

```sql
-- List all roles with permissions
SELECT r.*, array_agg(p.name) as permissions
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id
GROUP BY r.id;

-- Check user's role
SELECT u.id, u.email, r.name as role, r.display_name
FROM auth.users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE u.id = 'USER_ID';

-- Verify super admin
SELECT EXISTS (
  SELECT 1 FROM user_roles ur
  JOIN roles r ON ur.role_id = r.id
  WHERE ur.user_id = 'USER_ID'
  AND r.name IN ('super_admin', 'admin')
) as is_super_admin;
```
