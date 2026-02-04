-- Migration: Enable Organization Admin Webhook Management
-- Allows organization admins to create, update, and delete their own event sources

-- ============================================================================
-- RLS POLICIES FOR EVENT_SOURCES
-- ============================================================================

-- Drop existing org admin SELECT policy (will recreate with INSERT/UPDATE/DELETE)
DROP POLICY IF EXISTS "Org admins can view their event_sources" ON event_sources;

-- Org admins can SELECT their organization's event sources
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

-- Org admins can INSERT event sources for their organization
CREATE POLICY "Org admins can create event_sources"
  ON event_sources
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = event_sources.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role = 'admin'
    )
  );

-- Org admins can UPDATE event sources for their organization
CREATE POLICY "Org admins can update their event_sources"
  ON event_sources
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = event_sources.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role = 'admin'
    )
  );

-- Org admins can DELETE event sources for their organization
CREATE POLICY "Org admins can delete their event_sources"
  ON event_sources
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = event_sources.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role = 'admin'
    )
  );

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON POLICY "Org admins can view their event_sources" ON event_sources IS
'Organization admins can view event sources belonging to their organization';

COMMENT ON POLICY "Org admins can create event_sources" ON event_sources IS
'Organization admins can create new event sources for their organization';

COMMENT ON POLICY "Org admins can update their event_sources" ON event_sources IS
'Organization admins can update event sources belonging to their organization';

COMMENT ON POLICY "Org admins can delete their event_sources" ON event_sources IS
'Organization admins can delete event sources belonging to their organization';
