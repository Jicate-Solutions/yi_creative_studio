-- Migration: Add Accessibility Tracking
-- Adds accessibility validation and reporting features to creatives and organizations
-- Supports WCAG 2.1 compliance tracking and organizational accessibility settings

BEGIN;

-- Add accessibility columns to creatives table
ALTER TABLE creatives
ADD COLUMN IF NOT EXISTS accessibility_report JSONB,
ADD COLUMN IF NOT EXISTS accessibility_score INTEGER CHECK (accessibility_score >= 0 AND accessibility_score <= 100),
ADD COLUMN IF NOT EXISTS accessibility_level TEXT CHECK (accessibility_level IN ('A', 'AA', 'AAA'));

-- Add indexes for accessibility queries
CREATE INDEX IF NOT EXISTS idx_creatives_accessibility_score
ON creatives(accessibility_score DESC)
WHERE accessibility_score IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_creatives_accessibility_level
ON creatives(accessibility_level)
WHERE accessibility_level IS NOT NULL;

-- Add accessibility settings to organizations table
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS accessibility_settings JSONB DEFAULT '{
  "targetLevel": "AA",
  "enforceValidation": false,
  "autoFix": true,
  "showWarnings": true
}'::jsonb;

-- Create index for organizations with enforced validation
CREATE INDEX IF NOT EXISTS idx_organizations_enforce_accessibility
ON organizations((accessibility_settings->>'enforceValidation'))
WHERE (accessibility_settings->>'enforceValidation')::boolean = true;

-- Add comments for documentation
COMMENT ON COLUMN creatives.accessibility_report IS 'Complete WCAG 2.1 accessibility validation report (JSON)';
COMMENT ON COLUMN creatives.accessibility_score IS 'Overall accessibility score (0-100)';
COMMENT ON COLUMN creatives.accessibility_level IS 'Highest WCAG compliance level achieved (A, AA, or AAA)';
COMMENT ON COLUMN organizations.accessibility_settings IS 'Organization-wide accessibility validation settings';

-- Create function to update accessibility scores when report is added
CREATE OR REPLACE FUNCTION update_accessibility_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Extract score and level from report if they exist
  IF NEW.accessibility_report IS NOT NULL THEN
    NEW.accessibility_score := (NEW.accessibility_report->>'overallScore')::INTEGER;
    NEW.accessibility_level := NEW.accessibility_report->>'wcagLevel';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update metrics
DROP TRIGGER IF EXISTS trigger_update_accessibility_metrics ON creatives;
CREATE TRIGGER trigger_update_accessibility_metrics
  BEFORE INSERT OR UPDATE OF accessibility_report
  ON creatives
  FOR EACH ROW
  EXECUTE FUNCTION update_accessibility_metrics();

-- Add RLS policies for accessibility data
-- Accessibility columns are part of creatives table, so they inherit creatives RLS policies
-- This section verifies RLS is properly configured

DO $$
BEGIN
  -- Check if RLS is enabled on creatives table
  IF EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'creatives'
    AND rowsecurity = true
  ) THEN
    -- Verify required policies exist
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
      AND tablename = 'creatives'
      AND (policyname LIKE '%select%' OR policyname LIKE '%view%')
    ) THEN
      RAISE EXCEPTION 'RLS is enabled on creatives but no SELECT/VIEW policies found. Accessibility data may be exposed!';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
      AND tablename = 'creatives'
      AND (policyname LIKE '%insert%' OR policyname LIKE '%create%')
    ) THEN
      RAISE WARNING 'No INSERT policies found on creatives table. Users may not be able to create accessibility reports.';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
      AND tablename = 'creatives'
      AND policyname LIKE '%update%'
    ) THEN
      RAISE WARNING 'No UPDATE policies found on creatives table. Users may not be able to update accessibility reports.';
    END IF;

    RAISE NOTICE 'RLS policies verified - accessibility data will use existing creative access policies';
  ELSE
    RAISE WARNING 'RLS is NOT enabled on creatives table! Accessibility data is not protected by row-level security.';
  END IF;
END $$;

-- Additional policy verification: Ensure organization_members access pattern
-- This creates policies if they don't exist (following the logo_presets pattern)
DO $$
BEGIN
  -- Only create policies if RLS is enabled but policies are missing
  IF EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'creatives'
    AND rowsecurity = true
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'creatives'
  ) THEN
    -- Create basic organization-based policies for creatives
    CREATE POLICY "creatives_select" ON creatives
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM organization_members
          WHERE organization_members.user_id = (SELECT auth.uid())
          AND organization_members.organization_id = creatives.organization_id
        )
      );

    CREATE POLICY "creatives_insert" ON creatives
      FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM organization_members
          WHERE organization_members.user_id = (SELECT auth.uid())
          AND organization_members.organization_id = creatives.organization_id
        )
      );

    CREATE POLICY "creatives_update" ON creatives
      FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM organization_members
          WHERE organization_members.user_id = (SELECT auth.uid())
          AND organization_members.organization_id = creatives.organization_id
        )
      );

    CREATE POLICY "creatives_delete" ON creatives
      FOR DELETE
      USING (
        EXISTS (
          SELECT 1 FROM organization_members
          WHERE organization_members.user_id = (SELECT auth.uid())
          AND organization_members.organization_id = creatives.organization_id
        )
      );

    RAISE NOTICE 'Created RLS policies for creatives table (includes accessibility columns)';
  END IF;
END $$;

COMMIT;

-- Verification queries (run these manually to verify migration)
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'creatives' AND column_name LIKE 'accessibility%';
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'accessibility_settings';
-- SELECT indexname FROM pg_indexes WHERE tablename = 'creatives' AND indexname LIKE 'idx_creatives_accessibility%';
