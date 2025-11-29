# Role Discovery Patterns

This reference documents all patterns used to auto-discover an application's role system.

---

## 1. TypeScript Type Definitions

### Location: `types/*.ts`, `lib/types.ts`, `types/database.ts`

### Pattern 1: Union Type
```typescript
// Most common pattern
export type MemberRole = "admin" | "editor" | "viewer";
export type UserRole = "superadmin" | "manager" | "staff" | "user";
export type AccountRole = "owner" | "admin" | "member" | "guest";
```

**Regex:** `export\s+type\s+(\w*[Rr]ole\w*)\s*=\s*["']([^"']+)["'](\s*\|\s*["']([^"']+)["'])*`

### Pattern 2: Enum
```typescript
export enum Role {
  ADMIN = 'admin',
  EDITOR = 'editor',
  VIEWER = 'viewer'
}

export enum UserRole {
  SUPER_ADMIN,
  MANAGER,
  STAFF,
  USER
}
```

**Regex:** `enum\s+(\w*[Rr]ole\w*)\s*\{([^}]+)\}`

### Pattern 3: Const Array
```typescript
export const ROLES = ['admin', 'editor', 'viewer'] as const;
export type Role = (typeof ROLES)[number];
```

**Regex:** `const\s+(ROLES?|USER_ROLES?)\s*=\s*\[([^\]]+)\]`

### Pattern 4: Database Schema Type
```typescript
// In types/database.ts (Supabase generated)
export interface Database {
  public: {
    Tables: {
      organization_members: {
        Row: {
          role: "admin" | "editor" | "viewer";
        }
      }
    }
  }
}
```

---

## 2. Auth Hook Patterns

### Location: `hooks/use-auth*.ts`, `hooks/use-organization*.ts`, `hooks/use-permissions*.ts`

### Pattern 1: Role Boolean Helpers
```typescript
// Common pattern found in hooks
return {
  isAdmin: currentOrg?.role === "admin",
  isEditor: currentOrg?.role === "admin" || currentOrg?.role === "editor",
  isViewer: currentOrg?.role === "viewer",
}
```

**What this tells us:**
- Role accessor: `currentOrg?.role`
- Roles: admin, editor, viewer
- Hierarchy: admin > editor > viewer

### Pattern 2: hasRole Function
```typescript
const hasRole = useCallback(
  (...roles: string[]) => {
    if (!userRole) return false;
    return roles.includes(userRole);
  },
  [userRole]
);
```

### Pattern 3: Permission Hook
```typescript
export function usePermissions() {
  const { user } = useAuth();

  return {
    hasPermission: (permission: string) =>
      PERMISSIONS[permission]?.includes(user?.role),
    canView: (module: string) => hasPermission(`${module}.view`),
    canCreate: (module: string) => hasPermission(`${module}.create`),
  };
}
```

---

## 3. Auth Provider Patterns

### Supabase (Organization-Scoped)
```typescript
// Role stored in junction table
const { data: membership } = await supabase
  .from('organization_members')
  .select('role')
  .eq('user_id', user.id)
  .eq('organization_id', orgId)
  .single();

const role = membership?.role;
```

**Characteristics:**
- Multi-tenant (user can have different roles in different orgs)
- Role stored in membership table
- Requires org context to get role

### Supabase (User-Scoped)
```typescript
// Role stored on user profile
const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', user.id)
  .single();

const role = profile?.role;
```

**Characteristics:**
- Single role per user
- Simpler queries
- No org context needed

### Supabase (JWT-Based)
```typescript
// Role stored in JWT claims
const role = user?.app_metadata?.role;
// OR
const role = session?.user?.user_metadata?.role;
```

**Characteristics:**
- No extra DB query needed
- Role set during sign-up or by admin
- Used in RLS with `auth.jwt()->>'role'`

### NextAuth
```typescript
import { useSession } from 'next-auth/react';

export function useAuth() {
  const { data: session } = useSession();
  return {
    user: session?.user,
    role: session?.user?.role,
  };
}
```

### Clerk
```typescript
import { useUser } from '@clerk/nextjs';

export function useAuth() {
  const { user } = useUser();
  return {
    user,
    role: user?.publicMetadata?.role,
  };
}
```

---

## 4. Database Schema Patterns

### Supabase MCP Query
```sql
-- Find role columns
SELECT table_name, column_name, data_type, udt_name
FROM information_schema.columns
WHERE column_name LIKE '%role%'
ORDER BY table_name;

-- Find role enums
SELECT t.typname as enum_name, e.enumlabel as enum_value
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname LIKE '%role%'
ORDER BY t.typname, e.enumsortorder;

-- Check if role is a foreign key to roles table
SELECT * FROM information_schema.table_constraints
WHERE constraint_type = 'FOREIGN KEY'
AND constraint_name LIKE '%role%';
```

### Common Table Structures

**Organization Members (Multi-tenant):**
```sql
CREATE TABLE organization_members (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  user_id UUID REFERENCES auth.users(id),
  role member_role NOT NULL DEFAULT 'viewer',
  joined_at TIMESTAMPTZ DEFAULT now()
);

CREATE TYPE member_role AS ENUM ('admin', 'editor', 'viewer');
```

**User Profiles (Single-tenant):**
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT,
  role user_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TYPE user_role AS ENUM ('admin', 'manager', 'staff', 'user');
```

---

## 5. Permission Definition Patterns

### Pattern 1: Flat Permission Object
```typescript
export const PERMISSIONS: Record<string, string[]> = {
  'dashboard.view': ['admin', 'editor', 'viewer'],
  'dashboard.edit': ['admin', 'editor'],
  'users.view': ['admin'],
  'users.create': ['admin'],
  'users.delete': ['admin'],
};
```

### Pattern 2: Nested Permission Object
```typescript
export const PERMISSIONS = {
  dashboard: {
    view: ['admin', 'editor', 'viewer'],
    edit: ['admin', 'editor'],
  },
  users: {
    view: ['admin'],
    create: ['admin'],
    delete: ['admin'],
  },
};
```

### Pattern 3: Menu-Based Permissions
```typescript
export const MENU_PERMISSIONS = {
  dashboard: {
    path: '/dashboard',
    allowedRoles: ['admin', 'editor', 'viewer'],
    children: {
      analytics: { allowedRoles: ['admin', 'editor'] },
      settings: { allowedRoles: ['admin'] },
    },
  },
};
```

---

## 6. Role Hierarchy Inference

### From Boolean Helpers
```typescript
isAdmin: role === "admin",
isEditor: role === "admin" || role === "editor",
// Implies: admin > editor (admin includes editor permissions)
```

### From Permission Definitions
```typescript
PERMISSIONS = {
  'view': ['admin', 'editor', 'viewer'],  // All can view
  'edit': ['admin', 'editor'],             // Admin and editor can edit
  'delete': ['admin'],                      // Only admin can delete
};
// Implies: admin (3 perms) > editor (2 perms) > viewer (1 perm)
```

### Common Hierarchies
```typescript
// Standard 3-tier
const HIERARCHY = { admin: 100, editor: 50, viewer: 10 };

// Enterprise 4-tier
const HIERARCHY = { superadmin: 1000, admin: 100, manager: 50, user: 10 };

// SaaS 4-tier
const HIERARCHY = { owner: 1000, admin: 100, member: 50, guest: 10 };
```

---

## 7. Search Order

When discovering roles, search in this order:

1. **`types/database.ts`** - Supabase generated types (most reliable)
2. **`types/*.ts`** - Custom type definitions
3. **`hooks/use-auth*.ts`** - Auth hooks with role helpers
4. **`hooks/use-organization*.ts`** - Org hooks with membership
5. **`lib/permissions.ts`** - Permission definitions
6. **`stores/auth-store.ts`** - Zustand auth store
7. **Database query** - Via Supabase MCP

---

## 8. Discovery Output Format

After discovery, generate this summary:

```typescript
interface RoleDiscovery {
  authProvider: 'supabase' | 'nextauth' | 'clerk' | 'custom';
  roleSystem: 'organization-scoped' | 'user-scoped' | 'jwt-based';

  roles: string[];  // ['admin', 'editor', 'viewer']
  hierarchy: Record<string, number>;  // { admin: 100, editor: 50, viewer: 10 }

  roleLocation: string;  // 'organization_members.role'
  roleAccessor: string;  // 'currentOrg?.role'
  authHook: string;  // 'useOrganization'

  existingPatterns: {
    hasPermissionHook: boolean;
    hasGuardComponents: boolean;
    hasRoleChecks: boolean;
    hasRLSPolicies: boolean;
  };

  keyFiles: {
    types: string[];
    hooks: string[];
    permissions: string[];
  };
}
```
