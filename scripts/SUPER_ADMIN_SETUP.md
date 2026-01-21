# Super Admin Setup Guide

This guide explains how to grant Super Admin access to users in Yi CreativeStudio.

## Current Super Admins

- `sroja@jkkn.ac.in` (initial super admin)
- `director@jkkn.ac.in` ✨ NEW
- `ranjith@jkkn.ac.in` ✨ NEW

## Prerequisites

Before granting Super Admin access to a user:

1. **User must already have an account**: The user must have signed up and created an account first
2. **Email must be verified**: Ensure the user has verified their email address
3. **Service Role Key**: You need the Supabase Service Role Key (in `.env.local`)

## Method 1: Run Migration (Recommended)

If you have access to Supabase CLI or Dashboard:

### Using Supabase CLI

```bash
# Apply the migration
supabase db push

# Or apply specific migration
supabase migration up 20260121142029_grant_super_admin_director_ranjith
```

### Using Supabase Dashboard

1. Go to Supabase Dashboard → SQL Editor
2. Open the migration file: `supabase/migrations/20260121142029_grant_super_admin_director_ranjith.sql`
3. Copy the SQL content
4. Paste and run it in the SQL Editor

## Method 2: Run Node.js Script

If you have access to the codebase and can run scripts:

```bash
# Grant Super Admin to director@jkkn.ac.in and ranjith@jkkn.ac.in
node scripts/grant-super-admin-director-ranjith.js
```

### Expected Output

```
🚀 Starting Super Admin setup for multiple users...

🔍 Looking for users...

📧 Processing: director@jkkn.ac.in
✅ Found user: director@jkkn.ac.in (ID: abc-123-def)
📝 Granting Super Admin access...
✅ Super Admin access granted to director@jkkn.ac.in!

📧 Processing: ranjith@jkkn.ac.in
✅ Found user: ranjith@jkkn.ac.in (ID: xyz-456-uvw)
📝 Granting Super Admin access...
✅ Super Admin access granted to ranjith@jkkn.ac.in!

============================================================
📊 Summary:
✅ Successfully granted: 2 user(s)
❌ Failed: 0 user(s)

📋 Next steps:
1. Users should logout from their current sessions
2. Login again to refresh the session
3. Navigate to /super-admin to access Super Admin panel

🎉 Setup complete!
```

## Method 3: Manual SQL (If scripts fail)

If both methods above fail, run this SQL directly in Supabase Dashboard:

```sql
-- Grant Super Admin to director@jkkn.ac.in
UPDATE auth.users
SET
  raw_app_meta_data = raw_app_meta_data || '{"is_super_admin": true}'::jsonb,
  raw_user_meta_data = raw_user_meta_data || '{"is_super_admin": true}'::jsonb,
  updated_at = NOW()
WHERE email = 'director@jkkn.ac.in';

-- Grant Super Admin to ranjith@jkkn.ac.in
UPDATE auth.users
SET
  raw_app_meta_data = raw_app_meta_data || '{"is_super_admin": true}'::jsonb,
  raw_user_meta_data = raw_user_meta_data || '{"is_super_admin": true}'::jsonb,
  updated_at = NOW()
WHERE email = 'ranjith@jkkn.ac.in';

-- Verify the updates
SELECT
  email,
  raw_app_meta_data->>'is_super_admin' as is_super_admin,
  raw_user_meta_data->>'is_super_admin' as is_super_admin_user_meta
FROM auth.users
WHERE email IN ('director@jkkn.ac.in', 'ranjith@jkkn.ac.in');
```

## Verification

After granting Super Admin access:

### 1. Check Database

```sql
-- Verify both users have super admin flag
SELECT
  email,
  raw_app_meta_data->>'is_super_admin' as is_super_admin,
  created_at
FROM auth.users
WHERE email IN ('director@jkkn.ac.in', 'ranjith@jkkn.ac.in');
```

Expected result:
```
email                    | is_super_admin | created_at
-------------------------|----------------|---------------------------
director@jkkn.ac.in      | true           | 2025-01-21 12:00:00+00
ranjith@jkkn.ac.in       | true           | 2025-01-21 12:00:00+00
```

### 2. User Login Test

1. User logs out (if already logged in)
2. User logs in again (session refresh is required)
3. Navigate to `/super-admin` route
4. Should see Super Admin dashboard (no "Access Denied" error)

### 3. Check Super Admin Features

After login, verify the user can access:

- `/super-admin` - Super Admin Dashboard
- `/super-admin/users` - User Management
- `/super-admin/organizations` - Organization Management
- `/super-admin/credits` - Credit Management
- `/super-admin/analytics` - Platform Analytics
- `/super-admin/billing` - Platform Revenue
- `/super-admin/audit` - Audit Logs
- `/super-admin/brand-assets` - Brand Assets

## Troubleshooting

### User not found

**Problem**: Script shows "User not found: email@example.com"

**Solution**:
1. Verify the user has created an account (check Supabase Dashboard → Authentication → Users)
2. Make sure the email address is spelled correctly
3. User must sign up first before being granted Super Admin access

### Permission denied

**Problem**: Script fails with "permission denied" error

**Solution**:
1. Ensure you're using `SUPABASE_SERVICE_ROLE_KEY` (not anon key)
2. Check `.env.local` file has the correct service role key
3. Try running the SQL directly in Supabase Dashboard

### Super Admin panel not accessible

**Problem**: User can login but sees "Access Denied" when visiting `/super-admin`

**Solution**:
1. User must **logout and login again** (session refresh required)
2. Clear browser cookies and cache
3. Verify the database update was successful (run verification SQL)
4. Check browser console for errors

### Changes not taking effect

**Problem**: Database shows `is_super_admin: true` but access still denied

**Solution**:
1. **CRITICAL**: User MUST logout and login again for session to refresh
2. The super admin flag is stored in the auth token, which only updates on login
3. Clear browser cookies if logout/login doesn't work
4. Try in incognito/private browsing mode

## Adding More Super Admins in the Future

To add more Super Admins:

### Option 1: Create a new migration

```bash
# Create migration file
touch supabase/migrations/$(date +%Y%m%d%H%M%S)_grant_super_admin_newuser.sql
```

Content template:
```sql
UPDATE auth.users
SET
  raw_app_meta_data = raw_app_meta_data || '{"is_super_admin": true}'::jsonb,
  raw_user_meta_data = raw_user_meta_data || '{"is_super_admin": true}'::jsonb,
  updated_at = NOW()
WHERE email = 'newuser@example.com';
```

### Option 2: Use the generic script

Modify `scripts/grant-super-admin.js` and change the `EMAIL` constant to the new email, then run:

```bash
node scripts/grant-super-admin.js
```

### Option 3: Via Super Admin UI (Future Feature)

In the future, existing Super Admins will be able to grant Super Admin access to other users through the UI at `/super-admin/users`.

## Security Notes

⚠️ **Important Security Considerations**:

1. **Super Admin access is powerful**: Super Admins can access ALL data across ALL organizations
2. **Limit Super Admin accounts**: Only grant to trusted personnel
3. **Service Role Key**: Keep the `SUPABASE_SERVICE_ROLE_KEY` secret and secure
4. **Audit logs**: All Super Admin actions are logged in `super_admin_audit_logs` table
5. **Review regularly**: Periodically review who has Super Admin access

## Support

If you encounter issues:

1. Check this guide's troubleshooting section
2. Review the migration file: `supabase/migrations/20260121142029_grant_super_admin_director_ranjith.sql`
3. Check the middleware: `lib/middleware/super-admin-guard.ts`
4. Contact system administrator

---

**Last Updated**: 2026-01-21
**Migration File**: `20260121142029_grant_super_admin_director_ranjith.sql`
**Script File**: `scripts/grant-super-admin-director-ranjith.js`
