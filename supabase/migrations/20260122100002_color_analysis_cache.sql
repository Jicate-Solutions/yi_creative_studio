-- Create color analysis cache table for storing Claude Haiku Vision results
-- Purpose: Cache semantic color zone detection for 7 days to reduce AI costs

CREATE TABLE IF NOT EXISTS color_analysis_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creative_id UUID NOT NULL REFERENCES creatives(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,

  -- Claude Haiku Vision results
  analysis_result JSONB NOT NULL,
  detected_zones JSONB NOT NULL,
  content_zone_bounds JSONB,

  -- Cost tracking
  model_used TEXT DEFAULT 'claude-3-5-haiku-20241022',
  input_tokens INTEGER,
  output_tokens INTEGER,
  estimated_cost_usd DECIMAL(10, 6),

  -- Lifecycle
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),

  UNIQUE(creative_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_color_cache_creative ON color_analysis_cache(creative_id);
CREATE INDEX IF NOT EXISTS idx_color_cache_expiry ON color_analysis_cache(expires_at) WHERE status = 'completed';
CREATE INDEX IF NOT EXISTS idx_color_cache_status ON color_analysis_cache(status);

-- Add comments for documentation
COMMENT ON TABLE color_analysis_cache IS 'Caches Claude Haiku Vision semantic color zone detection for 7 days. Expected 90% cache hit rate after first shuffle.';
COMMENT ON COLUMN color_analysis_cache.analysis_result IS 'Full JSON response from Claude Haiku Vision API';
COMMENT ON COLUMN color_analysis_cache.detected_zones IS 'Parsed semantic zones (background, text, accent) with colors and coverage';
COMMENT ON COLUMN color_analysis_cache.content_zone_bounds IS 'Pixel boundaries for content zone (e.g., {topPercent: 40, bottomPercent: 70})';
COMMENT ON COLUMN color_analysis_cache.estimated_cost_usd IS 'Estimated cost of Claude API call (~$0.001 per analysis)';

-- RLS Policies (inherit from parent creative)
ALTER TABLE color_analysis_cache ENABLE ROW LEVEL SECURITY;

-- Allow users to read cache for their organization's creatives
CREATE POLICY "Users can view cache for their org's creatives"
  ON color_analysis_cache FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM creatives
      WHERE creatives.id = color_analysis_cache.creative_id
      AND creatives.organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- Allow users to insert/update cache for their org's creatives
CREATE POLICY "Users can manage cache for their org's creatives"
  ON color_analysis_cache FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM creatives
      WHERE creatives.id = color_analysis_cache.creative_id
      AND creatives.organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- Cleanup job function (optional - for removing expired cache entries)
CREATE OR REPLACE FUNCTION cleanup_expired_color_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM color_analysis_cache
  WHERE expires_at < NOW()
  AND status = 'completed';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_expired_color_cache IS 'Removes expired cache entries. Run via cron job or manually.';
