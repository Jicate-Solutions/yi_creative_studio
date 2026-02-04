-- Migration: Create Dynamic Field Registry Table
-- This table tracks all dynamic fields discovered from external applications
-- Enables field management, usage statistics, and runtime field definitions

-- Create dynamic_field_registry table
CREATE TABLE IF NOT EXISTS dynamic_field_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Field identification
  field_id TEXT NOT NULL,              -- Canonical field ID (snake_case, e.g., "dress_code")
  field_label TEXT NOT NULL,           -- Human-readable label (e.g., "Dress Code")

  -- Source tracking
  source_app_id TEXT NOT NULL,         -- Which external app introduced this field (e.g., "yi-connect", "myjkkn")
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Field configuration
  field_type TEXT DEFAULT 'text',      -- text, textarea, date, time, select, number, boolean
  category TEXT DEFAULT 'custom',      -- core, speaker, contact, custom, etc.
  placeholder TEXT,                    -- Placeholder text for form input
  max_length INTEGER,                  -- Maximum character length for text fields
  options JSONB,                       -- For select fields: ["Option 1", "Option 2"]
  help_text TEXT,                      -- Help text displayed under the field

  -- Usage statistics
  usage_count INTEGER DEFAULT 1,       -- How many events use this field
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),

  -- Mapping configuration
  canonical_mapping TEXT,              -- If this maps to a known canonical field (e.g., "eventName")
  is_active BOOLEAN DEFAULT true,      -- Can be disabled without deletion
  is_required BOOLEAN DEFAULT false,   -- Whether field should be marked as required
  display_order INTEGER DEFAULT 999,   -- Order in form rendering (lower = earlier)

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint: one field_id per organization + source combination
  CONSTRAINT dynamic_field_registry_unique UNIQUE(organization_id, source_app_id, field_id)
);

-- Index for quick lookups by organization and source
CREATE INDEX IF NOT EXISTS idx_dynamic_field_registry_org_source
ON dynamic_field_registry (organization_id, source_app_id);

-- Index for looking up specific field across all sources
CREATE INDEX IF NOT EXISTS idx_dynamic_field_registry_field_id
ON dynamic_field_registry (field_id);

-- Index for active fields only
CREATE INDEX IF NOT EXISTS idx_dynamic_field_registry_active
ON dynamic_field_registry (organization_id, is_active) WHERE is_active = true;

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_dynamic_field_registry_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_dynamic_field_registry_updated_at
BEFORE UPDATE ON dynamic_field_registry
FOR EACH ROW
EXECUTE FUNCTION update_dynamic_field_registry_updated_at();

-- RLS policies
ALTER TABLE dynamic_field_registry ENABLE ROW LEVEL SECURITY;

-- Users can view their organization's dynamic fields
CREATE POLICY "Users can view their organization's dynamic fields"
ON dynamic_field_registry FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
  )
);

-- Admins and editors can manage dynamic fields
CREATE POLICY "Admins can manage dynamic fields"
ON dynamic_field_registry FOR ALL
USING (
  organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() AND role IN ('admin', 'editor')
  )
);

-- Service role can manage all fields (for webhook processing)
CREATE POLICY "Service role can manage all dynamic fields"
ON dynamic_field_registry FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Function to increment usage count (called from webhook processor)
CREATE OR REPLACE FUNCTION increment_dynamic_field_usage(
  p_org_id UUID,
  p_source_id TEXT,
  p_field_id TEXT
)
RETURNS void AS $$
BEGIN
  UPDATE dynamic_field_registry
  SET
    usage_count = usage_count + 1,
    last_seen_at = NOW()
  WHERE
    organization_id = p_org_id
    AND source_app_id = p_source_id
    AND field_id = p_field_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add documentation comments
COMMENT ON TABLE dynamic_field_registry IS
'Registry of dynamically discovered fields from external applications.
Fields not in the static schema are automatically registered here when received via webhook.
Enables tracking field usage, customizing labels/types, and form rendering configuration.';

COMMENT ON COLUMN dynamic_field_registry.field_id IS 'Normalized field ID in snake_case (e.g., dress_code, parking_info)';
COMMENT ON COLUMN dynamic_field_registry.field_label IS 'Human-readable label derived from field_id or customized by admin';
COMMENT ON COLUMN dynamic_field_registry.field_type IS 'Field type for form rendering: text, textarea, date, time, select, number, boolean';
COMMENT ON COLUMN dynamic_field_registry.canonical_mapping IS 'If this dynamic field should map to a canonical field (e.g., attire -> dressCode)';
COMMENT ON COLUMN dynamic_field_registry.usage_count IS 'Number of events using this field - helps identify commonly used fields';
