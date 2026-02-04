-- Migration: Webhook Management Tables
-- Creates tables for managing external event sources and webhook logs

-- ============================================================================
-- 1. EVENT SOURCES TABLE
-- ============================================================================

-- Create event_sources table if it doesn't exist
CREATE TABLE IF NOT EXISTS event_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  source_app_id TEXT NOT NULL,
  webhook_secret TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, source_app_id)
);

-- Add additional columns for webhook management (idempotent)
ALTER TABLE event_sources
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS total_syncs INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS error_count INTEGER DEFAULT 0;

-- Update timestamp trigger for event_sources
CREATE OR REPLACE FUNCTION update_event_sources_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS event_sources_updated_at ON event_sources;
CREATE TRIGGER event_sources_updated_at
  BEFORE UPDATE ON event_sources
  FOR EACH ROW
  EXECUTE FUNCTION update_event_sources_updated_at();

-- Indexes for event_sources
CREATE INDEX IF NOT EXISTS idx_event_sources_org ON event_sources(organization_id);
CREATE INDEX IF NOT EXISTS idx_event_sources_source_app ON event_sources(source_app_id);
CREATE INDEX IF NOT EXISTS idx_event_sources_active ON event_sources(is_active) WHERE is_active = true;

-- ============================================================================
-- 2. WEBHOOK LOGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_source_id UUID REFERENCES event_sources(id) ON DELETE SET NULL,
  source_app_id TEXT NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete')),
  external_event_id TEXT,
  event_name TEXT,
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'validation_error')),
  error_message TEXT,
  request_payload JSONB,
  response_payload JSONB,
  ip_address TEXT,
  user_agent TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for webhook_logs
CREATE INDEX IF NOT EXISTS idx_webhook_logs_source ON webhook_logs(source_app_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_org ON webhook_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_status ON webhook_logs(status);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created ON webhook_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_action ON webhook_logs(action);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_source ON webhook_logs(event_source_id);

-- ============================================================================
-- 3. RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE event_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- Event Sources policies
-- Super admins can do everything
DROP POLICY IF EXISTS "Super admins can manage all event_sources" ON event_sources;
CREATE POLICY "Super admins can manage all event_sources"
  ON event_sources
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_super_admin = true
    )
  );

-- Organization admins can view their own event sources
DROP POLICY IF EXISTS "Org admins can view their event_sources" ON event_sources;
CREATE POLICY "Org admins can view their event_sources"
  ON event_sources
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = event_sources.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role = 'admin'
    )
  );

-- Webhook Logs policies
-- Super admins can view all logs
DROP POLICY IF EXISTS "Super admins can view all webhook_logs" ON webhook_logs;
CREATE POLICY "Super admins can view all webhook_logs"
  ON webhook_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_super_admin = true
    )
  );

-- Organization admins can view their own logs
DROP POLICY IF EXISTS "Org admins can view their webhook_logs" ON webhook_logs;
CREATE POLICY "Org admins can view their webhook_logs"
  ON webhook_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = webhook_logs.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role = 'admin'
    )
  );

-- Service role can insert logs (for webhook processing)
DROP POLICY IF EXISTS "Service role can insert webhook_logs" ON webhook_logs;
CREATE POLICY "Service role can insert webhook_logs"
  ON webhook_logs
  FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- 4. HELPER FUNCTIONS
-- ============================================================================

-- Function to increment sync count on event_sources
CREATE OR REPLACE FUNCTION increment_event_source_sync(
  p_organization_id UUID,
  p_source_app_id TEXT,
  p_is_error BOOLEAN DEFAULT false
)
RETURNS void AS $$
BEGIN
  UPDATE event_sources
  SET
    last_sync_at = NOW(),
    total_syncs = total_syncs + 1,
    error_count = CASE WHEN p_is_error THEN error_count + 1 ELSE error_count END
  WHERE organization_id = p_organization_id
    AND source_app_id = p_source_app_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate a secure webhook secret
CREATE OR REPLACE FUNCTION generate_webhook_secret()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 5. COMMENTS
-- ============================================================================

COMMENT ON TABLE event_sources IS 'Configuration for external event sources (Yi Connect, MyJKKN, etc.)';
COMMENT ON COLUMN event_sources.name IS 'Display name for the event source';
COMMENT ON COLUMN event_sources.source_app_id IS 'Unique identifier for the source app (yi-connect, myjkkn)';
COMMENT ON COLUMN event_sources.webhook_secret IS 'Shared secret for webhook verification';
COMMENT ON COLUMN event_sources.is_active IS 'Whether this source is active and accepting webhooks';
COMMENT ON COLUMN event_sources.last_sync_at IS 'Timestamp of last successful sync';
COMMENT ON COLUMN event_sources.total_syncs IS 'Total number of webhook calls received';
COMMENT ON COLUMN event_sources.error_count IS 'Number of failed webhook calls';

COMMENT ON TABLE webhook_logs IS 'Log of all incoming webhook calls';
COMMENT ON COLUMN webhook_logs.action IS 'Webhook action: create, update, or delete';
COMMENT ON COLUMN webhook_logs.status IS 'Result status: success, error, or validation_error';
COMMENT ON COLUMN webhook_logs.duration_ms IS 'Processing time in milliseconds';
