-- Super Admin Flag Migration
-- Adds is_super_admin flag to auth.users for platform-level Super Admin role
-- Created: 2026-01-09

-- Add Super Admin flag columns to auth.users
ALTER TABLE auth.users
  ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS super_admin_granted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS super_admin_granted_by UUID REFERENCES auth.users(id);

-- Add index for quick Super Admin permission checks
-- Partial index only on Super Admin users for efficiency
CREATE INDEX IF NOT EXISTS idx_users_is_super_admin
  ON auth.users(is_super_admin)
  WHERE is_super_admin = TRUE;

-- Add comment for documentation
COMMENT ON COLUMN auth.users.is_super_admin IS
  'Platform-level Super Admin flag. Yi team members only. Grants access to /super-admin portal.';

COMMENT ON COLUMN auth.users.super_admin_granted_at IS
  'Timestamp when Super Admin privileges were granted';

COMMENT ON COLUMN auth.users.super_admin_granted_by IS
  'User ID of Super Admin who granted these privileges';
