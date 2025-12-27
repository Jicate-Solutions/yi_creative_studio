-- Migration: Fix Logo Presets RLS
-- Priority: CRITICAL - Fixes 403 Forbidden error
-- Description: Reverts the "optimization" that relied on non-existent JWT claims.
--              Restores the standard organization_members check.

-- 1. Drop the broken policies
DROP POLICY IF EXISTS "logo_presets_select" ON logo_presets;
DROP POLICY IF EXISTS "logo_presets_insert" ON logo_presets;
DROP POLICY IF EXISTS "logo_presets_update" ON logo_presets;
DROP POLICY IF EXISTS "logo_presets_delete" ON logo_presets;

-- 2. Re-create correct policies using organization_members check

-- SELECT
CREATE POLICY "logo_presets_select" ON logo_presets
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.user_id = (SELECT auth.uid())
      AND organization_members.organization_id = logo_presets.organization_id
    )
  );

-- INSERT
CREATE POLICY "logo_presets_insert" ON logo_presets
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.user_id = (SELECT auth.uid())
      AND organization_members.organization_id = logo_presets.organization_id
    )
  );

-- UPDATE
CREATE POLICY "logo_presets_update" ON logo_presets
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.user_id = (SELECT auth.uid())
      AND organization_members.organization_id = logo_presets.organization_id
    )
  );

-- DELETE
CREATE POLICY "logo_presets_delete" ON logo_presets
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.user_id = (SELECT auth.uid())
      AND organization_members.organization_id = logo_presets.organization_id
    )
  );
