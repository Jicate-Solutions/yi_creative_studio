-- Migration: Google Calendar Integration
-- Creates tables for Google Calendar OAuth connections and push notification logs

-- ============================================================================
-- 1. ENABLE PGCRYPTO EXTENSION
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- 2. GOOGLE CALENDAR CONNECTIONS TABLE
-- ============================================================================
-- Stores OAuth tokens per organization (one calendar connection per org)

CREATE TABLE IF NOT EXISTS google_calendar_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- OAuth tokens (encrypted with pgcrypto)
  -- Note: Nullable initially, set via store_google_calendar_tokens RPC
  access_token_encrypted BYTEA,
  refresh_token_encrypted BYTEA,
  token_expiry TIMESTAMPTZ,

  -- Google account info
  google_account_email TEXT,
  google_account_id TEXT,

  -- Selected calendar
  calendar_id TEXT NOT NULL DEFAULT 'primary',
  calendar_name TEXT,
  calendar_timezone TEXT,

  -- Connection metadata
  connected_by UUID REFERENCES auth.users(id),
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  last_sync_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'syncing', 'synced', 'error', 'disconnected')),
  sync_error TEXT,

  -- Incremental sync token from Google
  sync_token TEXT,

  -- Google push notification channel
  push_channel_id TEXT,
  push_resource_id TEXT,
  push_channel_expiry TIMESTAMPTZ,
  push_channel_token TEXT, -- Signed token for webhook verification

  -- Sync settings
  sync_past_days INTEGER DEFAULT 30,
  sync_future_days INTEGER DEFAULT 90,
  is_active BOOLEAN DEFAULT true,

  -- Stats
  total_events_synced INTEGER DEFAULT 0,
  total_syncs INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,

  -- Audit timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One connection per organization
  UNIQUE(organization_id)
);

-- ============================================================================
-- 3. GOOGLE CALENDAR PUSH LOGS TABLE
-- ============================================================================
-- Track push notification channel events and webhook calls

CREATE TABLE IF NOT EXISTS google_calendar_push_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID REFERENCES google_calendar_connections(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,

  -- Event type
  event_type TEXT NOT NULL CHECK (event_type IN (
    'channel_created',
    'channel_renewed',
    'channel_stopped',
    'push_received',
    'sync_triggered',
    'sync_completed',
    'sync_failed',
    'token_refreshed',
    'token_refresh_failed'
  )),

  -- Push notification details
  channel_id TEXT,
  resource_id TEXT,
  resource_state TEXT, -- 'sync', 'exists', 'update', 'delete' from Google
  message_number TEXT,

  -- Sync results
  events_added INTEGER,
  events_updated INTEGER,
  events_deleted INTEGER,

  -- Status
  success BOOLEAN DEFAULT true,
  error_message TEXT,

  -- Request/Response data (for debugging)
  request_headers JSONB,
  response_payload JSONB,

  -- Performance
  duration_ms INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 4. INDEXES
-- ============================================================================

-- Google Calendar Connections indexes
CREATE INDEX IF NOT EXISTS idx_google_cal_conn_org
  ON google_calendar_connections(organization_id);
CREATE INDEX IF NOT EXISTS idx_google_cal_conn_active
  ON google_calendar_connections(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_google_cal_conn_status
  ON google_calendar_connections(sync_status);
CREATE INDEX IF NOT EXISTS idx_google_cal_conn_expiry
  ON google_calendar_connections(push_channel_expiry);
CREATE INDEX IF NOT EXISTS idx_google_cal_conn_token_expiry
  ON google_calendar_connections(token_expiry);

-- Push Logs indexes
CREATE INDEX IF NOT EXISTS idx_google_cal_push_logs_conn
  ON google_calendar_push_logs(connection_id);
CREATE INDEX IF NOT EXISTS idx_google_cal_push_logs_org
  ON google_calendar_push_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_google_cal_push_logs_type
  ON google_calendar_push_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_google_cal_push_logs_created
  ON google_calendar_push_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_google_cal_push_logs_channel
  ON google_calendar_push_logs(channel_id);

-- ============================================================================
-- 5. UPDATE TIMESTAMP TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION update_google_calendar_connection_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS google_calendar_connections_updated_at ON google_calendar_connections;
CREATE TRIGGER google_calendar_connections_updated_at
  BEFORE UPDATE ON google_calendar_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_google_calendar_connection_updated_at();

-- ============================================================================
-- 6. ENCRYPTION FUNCTIONS
-- ============================================================================
-- Note: These functions use a config setting for the encryption key.
-- Set the key in Supabase: ALTER DATABASE postgres SET app.google_calendar_encryption_key = 'your-key';

CREATE OR REPLACE FUNCTION encrypt_google_token(token TEXT)
RETURNS BYTEA AS $$
DECLARE
  encryption_key TEXT;
BEGIN
  -- Try to get the encryption key from config, fall back to env var pattern
  encryption_key := current_setting('app.google_calendar_encryption_key', true);

  IF encryption_key IS NULL OR encryption_key = '' THEN
    RAISE EXCEPTION 'Encryption key not configured. Set app.google_calendar_encryption_key';
  END IF;

  RETURN pgp_sym_encrypt(token, encryption_key);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrypt_google_token(encrypted BYTEA)
RETURNS TEXT AS $$
DECLARE
  encryption_key TEXT;
BEGIN
  encryption_key := current_setting('app.google_calendar_encryption_key', true);

  IF encryption_key IS NULL OR encryption_key = '' THEN
    RAISE EXCEPTION 'Encryption key not configured. Set app.google_calendar_encryption_key';
  END IF;

  RETURN pgp_sym_decrypt(encrypted, encryption_key);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 7. HELPER FUNCTIONS
-- ============================================================================

-- Update connection sync stats
CREATE OR REPLACE FUNCTION update_google_calendar_sync_stats(
  p_connection_id UUID,
  p_events_synced INTEGER DEFAULT 0,
  p_is_error BOOLEAN DEFAULT false,
  p_error_message TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  UPDATE google_calendar_connections
  SET
    last_sync_at = NOW(),
    total_syncs = total_syncs + 1,
    total_events_synced = total_events_synced + COALESCE(p_events_synced, 0),
    error_count = CASE WHEN p_is_error THEN error_count + 1 ELSE error_count END,
    sync_status = CASE WHEN p_is_error THEN 'error' ELSE 'synced' END,
    sync_error = CASE WHEN p_is_error THEN p_error_message ELSE NULL END
  WHERE id = p_connection_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Generate push channel token for verification
CREATE OR REPLACE FUNCTION generate_push_channel_token(p_organization_id UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN encode(
    hmac(
      p_organization_id::text || ':' || extract(epoch from now())::text,
      current_setting('app.google_calendar_encryption_key', true),
      'sha256'
    ),
    'hex'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Store encrypted OAuth tokens for a connection
CREATE OR REPLACE FUNCTION store_google_calendar_tokens(
  p_connection_id UUID,
  p_access_token TEXT,
  p_refresh_token TEXT,
  p_token_expiry TIMESTAMPTZ
)
RETURNS void AS $$
DECLARE
  encryption_key TEXT;
BEGIN
  encryption_key := current_setting('app.google_calendar_encryption_key', true);

  IF encryption_key IS NULL OR encryption_key = '' THEN
    RAISE EXCEPTION 'Encryption key not configured';
  END IF;

  UPDATE google_calendar_connections
  SET
    access_token_encrypted = pgp_sym_encrypt(p_access_token, encryption_key),
    refresh_token_encrypted = pgp_sym_encrypt(p_refresh_token, encryption_key),
    token_expiry = p_token_expiry,
    updated_at = NOW()
  WHERE id = p_connection_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get decrypted OAuth tokens for a connection
CREATE OR REPLACE FUNCTION get_google_calendar_tokens(p_connection_id UUID)
RETURNS TABLE (
  access_token TEXT,
  refresh_token TEXT,
  token_expiry TIMESTAMPTZ
) AS $$
DECLARE
  encryption_key TEXT;
BEGIN
  encryption_key := current_setting('app.google_calendar_encryption_key', true);

  IF encryption_key IS NULL OR encryption_key = '' THEN
    RAISE EXCEPTION 'Encryption key not configured';
  END IF;

  RETURN QUERY
  SELECT
    pgp_sym_decrypt(access_token_encrypted, encryption_key) as access_token,
    pgp_sym_decrypt(refresh_token_encrypted, encryption_key) as refresh_token,
    gcc.token_expiry
  FROM google_calendar_connections gcc
  WHERE gcc.id = p_connection_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 8. RLS POLICIES
-- ============================================================================

ALTER TABLE google_calendar_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_calendar_push_logs ENABLE ROW LEVEL SECURITY;

-- Super admins can manage all connections (using existing function)
DROP POLICY IF EXISTS "Super admins can manage all google_calendar_connections" ON google_calendar_connections;
CREATE POLICY "Super admins can manage all google_calendar_connections"
  ON google_calendar_connections
  FOR ALL
  USING (is_current_user_super_admin());

-- Organization admins can manage their own connections
DROP POLICY IF EXISTS "Org admins can manage their google_calendar_connections" ON google_calendar_connections;
CREATE POLICY "Org admins can manage their google_calendar_connections"
  ON google_calendar_connections
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = google_calendar_connections.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role = 'admin'
    )
  );

-- Organization members can view connections (but not manage)
DROP POLICY IF EXISTS "Org members can view google_calendar_connections" ON google_calendar_connections;
CREATE POLICY "Org members can view google_calendar_connections"
  ON google_calendar_connections
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = google_calendar_connections.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

-- Push Logs: Super admins can view all
DROP POLICY IF EXISTS "Super admins can view all google_calendar_push_logs" ON google_calendar_push_logs;
CREATE POLICY "Super admins can view all google_calendar_push_logs"
  ON google_calendar_push_logs
  FOR SELECT
  USING (is_current_user_super_admin());

-- Push Logs: Org admins can view their own
DROP POLICY IF EXISTS "Org admins can view their google_calendar_push_logs" ON google_calendar_push_logs;
CREATE POLICY "Org admins can view their google_calendar_push_logs"
  ON google_calendar_push_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = google_calendar_push_logs.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role = 'admin'
    )
  );

-- Service role can insert push logs (for webhook processing)
DROP POLICY IF EXISTS "Service role can insert google_calendar_push_logs" ON google_calendar_push_logs;
CREATE POLICY "Service role can insert google_calendar_push_logs"
  ON google_calendar_push_logs
  FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- 9. COMMENTS
-- ============================================================================

COMMENT ON TABLE google_calendar_connections IS 'OAuth connections for Google Calendar integration per organization';
COMMENT ON COLUMN google_calendar_connections.access_token_encrypted IS 'AES-256 encrypted OAuth access token';
COMMENT ON COLUMN google_calendar_connections.refresh_token_encrypted IS 'AES-256 encrypted OAuth refresh token';
COMMENT ON COLUMN google_calendar_connections.token_expiry IS 'When the access token expires (refresh before this)';
COMMENT ON COLUMN google_calendar_connections.calendar_id IS 'Selected Google Calendar ID (primary or specific calendar)';
COMMENT ON COLUMN google_calendar_connections.sync_token IS 'Google incremental sync token for efficient updates';
COMMENT ON COLUMN google_calendar_connections.push_channel_id IS 'Google Push Notification channel ID';
COMMENT ON COLUMN google_calendar_connections.push_channel_expiry IS 'Channel expiry time (max 7 days, auto-renew before)';
COMMENT ON COLUMN google_calendar_connections.push_channel_token IS 'HMAC token for verifying incoming webhook requests';

COMMENT ON TABLE google_calendar_push_logs IS 'Audit log of Google Calendar push notifications and sync events';
COMMENT ON COLUMN google_calendar_push_logs.event_type IS 'Type of event: channel_created, push_received, sync_completed, etc.';
COMMENT ON COLUMN google_calendar_push_logs.resource_state IS 'Google push notification state: sync, exists, update, delete';
