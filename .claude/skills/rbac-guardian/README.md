# RBAC Guardian Skill

**Dynamic Role-Based Access Control** that fetches roles from any application's database and enables Super Admin role exploration via dropdown.

## Key Feature

This skill **dynamically fetches roles from your database** - no hardcoded roles. Whatever roles exist in your application, they appear in the dropdown automatically.

## How It Works

```
┌────────────────┐      ┌────────────────┐      ┌────────────────┐
│  Your Database │ ───▶ │  Role Service  │ ───▶ │ Role Dropdown  │
│    (roles)     │      │  (adapter)     │      │  (dynamic UI)  │
└────────────────┘      └────────────────┘      └────────────────┘
```

1. **Role Service** fetches all roles from your database
2. **RoleProvider** context makes them available app-wide
3. **RoleSwitcher** displays them in header dropdown
4. **Super Admin** selects any role to explore the platform

## Quick Start

### 1. Create Role Service (adapt to your schema)

```typescript
// services/role-service.ts
import { createSupabaseRoleService } from './role-service-templates';
import { createClient } from '@/lib/supabase/client';

export const roleService = createSupabaseRoleService(createClient());
```

### 2. Wrap App with Provider

```tsx
// app/layout.tsx
import { RoleProvider } from '@/contexts/RoleContext';
import { roleService } from '@/services/role-service';

export default function Layout({ children }) {
  const user = await getUser();
  
  return (
    <RoleProvider userId={user?.id} roleService={roleService}>
      {children}
    </RoleProvider>
  );
}
```

### 3. Add Dropdown to Header

```tsx
// components/Header.tsx
import { RoleSwitcher, SimulationBanner } from '@/components/rbac';

export function Header() {
  return (
    <>
      <SimulationBanner />
      <header>
        <nav>...</nav>
        <RoleSwitcher />
      </header>
    </>
  );
}
```

### 4. Gate Features by Permission

```tsx
import { PermissionGate } from '@/components/rbac';

<PermissionGate permission="users:write">
  <EditUserButton />
</PermissionGate>
```

## Supported Database Patterns

| Pattern | Example |
|---------|---------|
| Dedicated roles table | `SELECT * FROM roles` |
| Role in profiles | `profiles.role` column |
| Enum-based roles | `user_role` enum type |
| External auth | Auth0, Clerk, Firebase |

See `references/role-definitions.md` for detailed patterns.

## Files

```
rbac-guardian/
├── SKILL.md                      # Main implementation guide
├── README.md                     # This file
├── references/
│   ├── role-definitions.md       # Schema adaptation guide
│   ├── permission-matrix.md      # Permission patterns
│   └── audit-checklist.md        # Implementation checklist
├── assets/
│   ├── role-provider.tsx         # Context with dynamic fetching
│   ├── role-service.ts           # Service layer templates
│   ├── role-switcher.tsx         # Dropdown component
│   └── permission-components.tsx # Gate components
└── scripts/
    └── seed-roles.ts             # Optional DB seeder
```

## Requirements

- React 18+
- Next.js 13+ (App Router)
- shadcn/ui components (dropdown-menu, button, badge)
- Database with roles (Supabase, Postgres, etc.)

## License

MIT
