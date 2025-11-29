# Permission Matrix Reference

Comprehensive mapping of permissions to resources and actions.

## Permission Naming Convention

```
{resource}:{action}
```

**Examples**:
- `users:read` - Read user data
- `content:write` - Create/update content
- `billing:delete` - Remove billing records

## Complete Permission Matrix

### User Management

| Permission | Super Admin | Admin | Creator | Editor | Viewer | Guest |
|------------|:-----------:|:-----:|:-------:|:------:|:------:|:-----:|
| `users:read` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `users:write` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `users:delete` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `users:invite` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `users:suspend` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

### Content Management

| Permission | Super Admin | Admin | Creator | Editor | Viewer | Guest |
|------------|:-----------:|:-----:|:-------:|:------:|:------:|:-----:|
| `content:read` | ✅ | ✅ | ✅ | ✅ | ✅ | 🔸 |
| `content:write` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| `content:delete` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `content:publish` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `content:archive` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |

🔸 = Limited (public content only)

### Settings & Configuration

| Permission | Super Admin | Admin | Creator | Editor | Viewer | Guest |
|------------|:-----------:|:-----:|:-------:|:------:|:------:|:-----:|
| `settings:read` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `settings:write` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `settings:system` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

### Billing & Subscriptions

| Permission | Super Admin | Admin | Creator | Editor | Viewer | Guest |
|------------|:-----------:|:-----:|:-------:|:------:|:------:|:-----:|
| `billing:read` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `billing:write` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `billing:refund` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

### Analytics

| Permission | Super Admin | Admin | Creator | Editor | Viewer | Guest |
|------------|:-----------:|:-----:|:-------:|:------:|:------:|:-----:|
| `analytics:read` | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| `analytics:export` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `analytics:configure` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

### Role Management

| Permission | Super Admin | Admin | Creator | Editor | Viewer | Guest |
|------------|:-----------:|:-----:|:-------:|:------:|:------:|:-----:|
| `roles:read` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `roles:write` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `roles:switch` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `roles:assign` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

## Permission Categories

### Resource Types

```typescript
type Resource =
  | 'users'
  | 'content'
  | 'settings'
  | 'billing'
  | 'analytics'
  | 'roles'
  | 'projects'
  | 'teams'
  | 'api'
  | 'audit';
```

### Action Types

```typescript
type Action =
  | 'read'      // View/list resources
  | 'write'     // Create/update resources
  | 'delete'    // Remove resources
  | 'publish'   // Make resources public
  | 'archive'   // Archive resources
  | 'export'    // Export data
  | 'configure' // System configuration
  | 'invite'    // Invite users
  | 'suspend'   // Suspend accounts
  | 'switch'    // Switch roles
  | 'assign';   // Assign roles
```

## Permission Checking Utilities

```typescript
// Check single permission
function hasPermission(
  userPermissions: Permission[],
  required: Permission
): boolean {
  return userPermissions.includes(required);
}

// Check any of multiple permissions
function hasAnyPermission(
  userPermissions: Permission[],
  required: Permission[]
): boolean {
  return required.some(p => userPermissions.includes(p));
}

// Check all of multiple permissions
function hasAllPermissions(
  userPermissions: Permission[],
  required: Permission[]
): boolean {
  return required.every(p => userPermissions.includes(p));
}

// Check resource:action format
function canAccess(
  userPermissions: Permission[],
  resource: Resource,
  action: Action
): boolean {
  const permission = `${resource}:${action}` as Permission;
  return userPermissions.includes(permission);
}
```

## Conditional Permission Patterns

### Ownership-Based Permissions

```typescript
// Users can edit their own content even without general write permission
function canEditContent(
  user: User,
  content: Content,
  permissions: Permission[]
): boolean {
  // Has general write permission
  if (permissions.includes('content:write')) return true;
  
  // Is content owner
  if (content.authorId === user.id) return true;
  
  return false;
}
```

### Team-Based Permissions

```typescript
// Check permission within team context
function hasTeamPermission(
  user: User,
  teamId: string,
  permission: Permission
): boolean {
  const teamRole = user.teamRoles.find(tr => tr.teamId === teamId);
  if (!teamRole) return false;
  
  return ROLE_CONFIGS[teamRole.role].permissions.includes(permission);
}
```

### Time-Based Permissions

```typescript
// Temporary elevated permissions
function hasTemporaryPermission(
  user: User,
  permission: Permission
): boolean {
  const grant = user.temporaryGrants.find(g => 
    g.permission === permission &&
    new Date() < new Date(g.expiresAt)
  );
  
  return !!grant;
}
```

## API Permission Middleware

```typescript
// Express/Next.js middleware example
function requirePermission(...permissions: Permission[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = await getUser(req);
    
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const userPermissions = await getUserPermissions(user.id);
    const hasAccess = permissions.some(p => userPermissions.includes(p));
    
    if (!hasAccess) {
      return res.status(403).json({ 
        error: 'Forbidden',
        required: permissions,
      });
    }
    
    next();
  };
}

// Usage
app.get('/api/users', requirePermission('users:read'), getUsersHandler);
app.post('/api/users', requirePermission('users:write'), createUserHandler);
app.delete('/api/users/:id', requirePermission('users:delete'), deleteUserHandler);
```
