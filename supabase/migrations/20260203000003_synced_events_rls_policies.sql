-- Migration: Add RLS Policies for synced_events table
-- Fixes: Google Calendar sync failing with RLS violation

-- ============================================================================
-- 1. ENSURE RLS IS ENABLED
-- ============================================================================

ALTER TABLE synced_events ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. DROP EXISTING POLICIES (if any, for idempotency)
-- ============================================================================

DROP POLICY IF EXISTS "Super admins can manage all synced_events" ON synced_events;
DROP POLICY IF EXISTS "Org admins can manage their synced_events" ON synced_events;
DROP POLICY IF EXISTS "Org members can view their synced_events" ON synced_events;
DROP POLICY IF EXISTS "Org admins can insert synced_events" ON synced_events;

-- ============================================================================
-- 3. CREATE POLICIES
-- ============================================================================

-- Super admins can manage all events
CREATE POLICY "Super admins can manage all synced_events"
  ON synced_events
  FOR ALL
  USING (is_current_user_super_admin());

-- Organization admins can manage events for their organization
CREATE POLICY "Org admins can manage their synced_events"
  ON synced_events
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = synced_events.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role = 'admin'
    )
  );

-- Organization members can view events for their organization
CREATE POLICY "Org members can view their synced_events"
  ON synced_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = synced_events.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

-- Allow inserts from authenticated users who are org admins (for sync operations)
CREATE POLICY "Org admins can insert synced_events"
  ON synced_events
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = synced_events.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role = 'admin'
    )
  );

-- ============================================================================
-- 4. COMMENTS
-- ============================================================================

COMMENT ON POLICY "Super admins can manage all synced_events" ON synced_events
  IS 'Super admins have full access to all synced events';
COMMENT ON POLICY "Org admins can manage their synced_events" ON synced_events
  IS 'Organization admins can CRUD events for their organization';
COMMENT ON POLICY "Org members can view their synced_events" ON synced_events
  IS 'All organization members can view synced events';
COMMENT ON POLICY "Org admins can insert synced_events" ON synced_events
  IS 'Organization admins can insert new synced events during sync operations';
