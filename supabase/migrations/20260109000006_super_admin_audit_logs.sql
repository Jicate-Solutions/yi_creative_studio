-- Super Admin Audit Logs Table
-- Comprehensive logging of all Super Admin actions for security and compliance
-- Created: 2026-01-09

-- Create super_admin_audit_logs table
CREATE TABLE IF NOT EXISTS super_admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Actor (who performed the action)
  super_admin_id UUID NOT NULL REFERENCES auth.users(id),
  super_admin_email VARCHAR(255) NOT NULL,   -- Cached for historical record

  -- Action details
  action VARCHAR(100) NOT NULL,              -- 'org:create', 'user:suspend', 'credit:allocate', 'brand:delete'
  resource_type VARCHAR(50) NOT NULL,        -- 'organization', 'user', 'subscription', 'credit', 'template', 'logo'
  resource_id UUID,                          -- ID of affected resource

  -- Target entities
  target_organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Change tracking (before/after state)
  changes JSONB,                             -- {"before": {...}, "after": {...}}

  -- Request context
  ip_address INET,
  user_agent TEXT,
  request_id VARCHAR(100),

  -- Impersonation tracking
  was_impersonating BOOLEAN DEFAULT FALSE,
  impersonated_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient audit log queries
CREATE INDEX IF NOT EXISTS idx_sa_audit_super_admin ON super_admin_audit_logs(super_admin_id);
CREATE INDEX IF NOT EXISTS idx_sa_audit_created_at ON super_admin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sa_audit_action ON super_admin_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_sa_audit_target_org ON super_admin_audit_logs(target_organization_id)
  WHERE target_organization_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sa_audit_target_user ON super_admin_audit_logs(target_user_id)
  WHERE target_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sa_audit_resource ON super_admin_audit_logs(resource_type, resource_id)
  WHERE resource_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sa_audit_impersonation ON super_admin_audit_logs(was_impersonating, impersonated_user_id)
  WHERE was_impersonating = TRUE;

-- Composite index for common queries (admin actions on specific org)
CREATE INDEX IF NOT EXISTS idx_sa_audit_admin_org_date ON super_admin_audit_logs(
  super_admin_id,
  target_organization_id,
  created_at DESC
);

-- Add RLS policies
ALTER TABLE super_admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only Super Admins can view audit logs
CREATE POLICY "Super Admins can view audit logs"
  ON super_admin_audit_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.is_super_admin = TRUE
    )
  );

-- Only Super Admins can insert audit logs (system-level logging)
CREATE POLICY "Super Admins can create audit logs"
  ON super_admin_audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.is_super_admin = TRUE
    )
  );

-- No updates or deletes allowed (immutable audit trail)
-- Logs should never be modified or deleted

-- Add comments
COMMENT ON TABLE super_admin_audit_logs IS
  'Immutable audit trail of all Super Admin actions for security and compliance';

COMMENT ON COLUMN super_admin_audit_logs.action IS
  'Action identifier: org:create, user:suspend, credit:allocate, brand:delete, etc.';

COMMENT ON COLUMN super_admin_audit_logs.resource_type IS
  'Type of resource affected: organization, user, subscription, credit, template, logo, etc.';

COMMENT ON COLUMN super_admin_audit_logs.resource_id IS
  'UUID of the affected resource';

COMMENT ON COLUMN super_admin_audit_logs.changes IS
  'JSONB field tracking before/after state: {"before": {...}, "after": {...}}';

COMMENT ON COLUMN super_admin_audit_logs.was_impersonating IS
  'Whether Super Admin was impersonating another user when action was performed';

COMMENT ON COLUMN super_admin_audit_logs.impersonated_user_id IS
  'User being impersonated (if was_impersonating = true)';

COMMENT ON COLUMN super_admin_audit_logs.super_admin_email IS
  'Cached email for historical record (in case user is deleted)';
