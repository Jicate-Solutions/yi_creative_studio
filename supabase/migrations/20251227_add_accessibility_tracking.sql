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

-- Add RLS policies for accessibility data (if RLS is enabled)
-- Note: Adjust these based on your existing RLS setup

-- Allow users to view accessibility reports for their organization's creatives
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'creatives'
    AND policyname = 'Users can view their organization creatives'
  ) THEN
    -- RLS is enabled, accessibility data inherits existing policies
    RAISE NOTICE 'RLS policies detected - accessibility data will use existing creative access policies';
  END IF;
END $$;

COMMIT;

-- Verification queries (run these manually to verify migration)
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'creatives' AND column_name LIKE 'accessibility%';
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'accessibility_settings';
-- SELECT indexname FROM pg_indexes WHERE tablename = 'creatives' AND indexname LIKE 'idx_creatives_accessibility%';
