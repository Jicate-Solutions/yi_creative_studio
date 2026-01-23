-- Add color shuffle columns to creatives table
-- Simplified approach: Store only the last kept shuffled variant

ALTER TABLE creatives
ADD COLUMN IF NOT EXISTS shuffled_image_url TEXT,
ADD COLUMN IF NOT EXISTS shuffled_color_mapping JSONB,
ADD COLUMN IF NOT EXISTS shuffled_at TIMESTAMPTZ;

-- Add comment for documentation
COMMENT ON COLUMN creatives.shuffled_image_url IS 'URL to the last kept shuffled variant in Supabase Storage (overwrites previous)';
COMMENT ON COLUMN creatives.shuffled_color_mapping IS 'JSON object containing color zone mappings used for the shuffled variant';
COMMENT ON COLUMN creatives.shuffled_at IS 'Timestamp when the current shuffled variant was saved';

-- Create index for filtering by shuffled status
CREATE INDEX IF NOT EXISTS idx_creatives_shuffled ON creatives(shuffled_at) WHERE shuffled_image_url IS NOT NULL;
