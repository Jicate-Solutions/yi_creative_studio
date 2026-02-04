-- Migration: Add Dynamic Fields Support to synced_events
-- This enables capturing arbitrary/unknown fields from external applications
-- Fields not in the static schema are stored in custom_data JSONB column

-- 1. Add JSONB column for arbitrary/unknown fields from external apps
ALTER TABLE synced_events
ADD COLUMN IF NOT EXISTS custom_data JSONB DEFAULT '{}'::jsonb;

-- 2. Add field_metadata column to track field types for form rendering
ALTER TABLE synced_events
ADD COLUMN IF NOT EXISTS field_metadata JSONB DEFAULT '{}'::jsonb;

-- 3. Add GIN index for efficient JSONB queries (containment, key existence, path queries)
CREATE INDEX IF NOT EXISTS idx_synced_events_custom_data
ON synced_events USING GIN (custom_data);

-- 4. Add documentation comments
COMMENT ON COLUMN synced_events.custom_data IS
'Stores arbitrary/unknown fields from external apps as key-value pairs.
Keys are normalized field names (snake_case), values are the field data.
Example: {"dress_code": "Business Casual", "parking_info": "Free valet", "registration_time": "09:00"}';

COMMENT ON COLUMN synced_events.field_metadata IS
'Metadata about custom fields (type hints, labels, source).
Example: {"dress_code": {"type": "text", "label": "Dress Code", "source": "yi-connect"}}';
