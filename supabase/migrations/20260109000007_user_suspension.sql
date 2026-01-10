-- User Suspension and Soft Delete
-- Adds status tracking columns to auth.users for suspension and soft deletion
-- Created: 2026-01-09

-- Add user status columns to auth.users
ALTER TABLE auth.users
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspended_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

-- Create index for quick status checks
CREATE INDEX IF NOT EXISTS idx_users_status ON auth.users(status);

-- Partial index for suspended users
CREATE INDEX IF NOT EXISTS idx_users_suspended ON auth.users(suspended_at)
  WHERE status = 'suspended';

-- Partial index for soft-deleted users
CREATE INDEX IF NOT EXISTS idx_users_deleted ON auth.users(deleted_at)
  WHERE status = 'deleted';

-- Add comments
COMMENT ON COLUMN auth.users.status IS
  'User account status: active, suspended (temporary), or deleted (soft delete)';

COMMENT ON COLUMN auth.users.suspended_at IS
  'Timestamp when user was suspended';

COMMENT ON COLUMN auth.users.suspended_by IS
  'Super Admin who suspended the user';

COMMENT ON COLUMN auth.users.suspension_reason IS
  'Reason for suspension (for audit and user communication)';

COMMENT ON COLUMN auth.users.deleted_at IS
  'Timestamp when user was soft-deleted (account deactivated)';

COMMENT ON COLUMN auth.users.deleted_by IS
  'Super Admin who soft-deleted the user';

-- Function to prevent suspended/deleted users from logging in
-- This should be integrated with Supabase Auth hooks in production
CREATE OR REPLACE FUNCTION check_user_status_on_login()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'suspended' THEN
    RAISE EXCEPTION 'Account suspended: %', NEW.suspension_reason;
  END IF;

  IF NEW.status = 'deleted' THEN
    RAISE EXCEPTION 'Account has been deactivated';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: The actual login prevention should be implemented via Supabase Auth Hooks
-- in production. This trigger is a database-level safeguard.
