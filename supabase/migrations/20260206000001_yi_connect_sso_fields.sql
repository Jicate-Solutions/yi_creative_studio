-- Migration: Add Yi Connect SSO reference fields
-- This migration adds fields to link Yi Creative entities with Yi Connect

-- ============================================================================
-- 1. Add yi_connect_user_id to user_profiles
-- ============================================================================

-- Add column for Yi Connect user reference
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS yi_connect_user_id UUID UNIQUE;

-- Add synced_at timestamp for tracking last sync
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS yi_connect_synced_at TIMESTAMPTZ;

-- Create index for fast lookups by Yi Connect user ID
CREATE INDEX IF NOT EXISTS idx_user_profiles_yi_connect_user_id
ON user_profiles(yi_connect_user_id)
WHERE yi_connect_user_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN user_profiles.yi_connect_user_id IS
  'UUID reference to the user in Yi Connect. Used for SSO user identification.';
COMMENT ON COLUMN user_profiles.yi_connect_synced_at IS
  'Timestamp of last sync from Yi Connect.';

-- ============================================================================
-- 2. Add yi_connect_chapter_id to organizations
-- ============================================================================

-- Add column for Yi Connect chapter reference
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS yi_connect_chapter_id UUID UNIQUE;

-- Add synced_at timestamp for tracking last sync
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS yi_connect_synced_at TIMESTAMPTZ;

-- Create index for fast lookups by Yi Connect chapter ID
CREATE INDEX IF NOT EXISTS idx_organizations_yi_connect_chapter_id
ON organizations(yi_connect_chapter_id)
WHERE yi_connect_chapter_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN organizations.yi_connect_chapter_id IS
  'UUID reference to the chapter in Yi Connect. Used for SSO organization mapping.';
COMMENT ON COLUMN organizations.yi_connect_synced_at IS
  'Timestamp of last sync from Yi Connect.';

-- ============================================================================
-- 3. Add sso_provider to track authentication source
-- ============================================================================

-- Add SSO provider field to track where user authenticated from
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS sso_provider VARCHAR(50);

COMMENT ON COLUMN user_profiles.sso_provider IS
  'SSO provider name (e.g., yi-connect) if user authenticated via SSO.';

-- ============================================================================
-- 4. Create SSO session tracking table (optional, for replay protection)
-- ============================================================================

CREATE TABLE IF NOT EXISTS sso_token_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash VARCHAR(64) NOT NULL, -- SHA-256 hash of the token
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  yi_connect_user_id UUID NOT NULL,
  used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,

  -- Unique constraint to prevent token reuse
  UNIQUE(token_hash)
);

-- Index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_sso_token_log_used_at
ON sso_token_log(used_at);

-- Auto-cleanup old tokens (older than 1 hour)
-- This can be done via a scheduled function or cleanup job

COMMENT ON TABLE sso_token_log IS
  'Tracks used SSO tokens for replay protection. Tokens should be cleaned up after 1 hour.';

-- ============================================================================
-- 5. RLS Policies for sso_token_log
-- ============================================================================

ALTER TABLE sso_token_log ENABLE ROW LEVEL SECURITY;

-- Only service role can insert (during SSO callback)
CREATE POLICY "Service role can manage SSO tokens"
ON sso_token_log
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- 6. Function to clean up old SSO tokens
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_old_sso_tokens()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM sso_token_log
  WHERE used_at < NOW() - INTERVAL '1 hour';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION cleanup_old_sso_tokens IS
  'Removes SSO tokens older than 1 hour. Should be called periodically.';
