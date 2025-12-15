-- =============================================================================
-- Database Optimization: Recommended Indexes
-- =============================================================================
-- Apply these indexes via Supabase Dashboard SQL Editor when database is stable
-- These indexes address high IO issues identified in Supabase performance analysis
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. CREATIVES TABLE INDEXES
-- These are critical for gallery queries which are high-frequency operations
-- -----------------------------------------------------------------------------

-- Index for filtering by organization (most common filter)
CREATE INDEX IF NOT EXISTS idx_creatives_organization_id
ON public.creatives (organization_id);

-- Composite index for gallery listing (org + created_at descending)
CREATE INDEX IF NOT EXISTS idx_creatives_org_created_desc
ON public.creatives (organization_id, created_at DESC);

-- Index for vertical filtering (common filter in gallery)
CREATE INDEX IF NOT EXISTS idx_creatives_vertical
ON public.creatives (vertical);

-- Composite index for favorites filter (org + favorite status)
CREATE INDEX IF NOT EXISTS idx_creatives_org_favorites
ON public.creatives (organization_id, is_favorite)
WHERE is_favorite = true;

-- Index for base64 image migration queries
CREATE INDEX IF NOT EXISTS idx_creatives_image_url_base64
ON public.creatives (id)
WHERE image_url LIKE 'data:image%';

-- -----------------------------------------------------------------------------
-- 2. API_USAGE TABLE INDEXES
-- Critical for analytics queries and cost tracking
-- -----------------------------------------------------------------------------

-- Index for organization filtering (most common filter)
CREATE INDEX IF NOT EXISTS idx_api_usage_organization_id
ON public.api_usage (organization_id);

-- Composite index for analytics queries (org + created_at)
CREATE INDEX IF NOT EXISTS idx_api_usage_org_created_desc
ON public.api_usage (organization_id, created_at DESC);

-- Index for creative-specific cost lookups
CREATE INDEX IF NOT EXISTS idx_api_usage_creative_id
ON public.api_usage (creative_id);

-- Composite index for daily cost queries
CREATE INDEX IF NOT EXISTS idx_api_usage_org_daily
ON public.api_usage (organization_id, created_at);

-- -----------------------------------------------------------------------------
-- 3. ORGANIZATION_MEMBERS TABLE INDEXES
-- Used in almost every authenticated request
-- -----------------------------------------------------------------------------

-- Index for user lookups (most common query)
CREATE INDEX IF NOT EXISTS idx_org_members_user_id
ON public.organization_members (user_id);

-- Composite index for user+role queries (admin checks)
CREATE INDEX IF NOT EXISTS idx_org_members_user_role
ON public.organization_members (user_id, role);

-- Index for organization member listings
CREATE INDEX IF NOT EXISTS idx_org_members_org_id
ON public.organization_members (organization_id);

-- -----------------------------------------------------------------------------
-- 4. VERTICAL_PRESETS TABLE INDEXES
-- Used on every creative form page load
-- -----------------------------------------------------------------------------

-- Index for active verticals query
CREATE INDEX IF NOT EXISTS idx_vertical_presets_active
ON public.vertical_presets (is_active, display_order)
WHERE is_active = true;

-- -----------------------------------------------------------------------------
-- 5. USER_PROFILES TABLE INDEXES
-- Used during authentication and profile lookups
-- -----------------------------------------------------------------------------

-- Primary key is already indexed, but ensure email is indexed for lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_email
ON public.user_profiles (email);

-- -----------------------------------------------------------------------------
-- VERIFICATION QUERY
-- Run this after applying indexes to verify they were created
-- -----------------------------------------------------------------------------
-- SELECT
--     schemaname,
--     tablename,
--     indexname,
--     indexdef
-- FROM pg_indexes
-- WHERE schemaname = 'public'
--   AND tablename IN ('creatives', 'api_usage', 'organization_members', 'vertical_presets', 'user_profiles')
-- ORDER BY tablename, indexname;

-- -----------------------------------------------------------------------------
-- NOTES
-- -----------------------------------------------------------------------------
-- 1. These indexes will increase write time slightly but dramatically improve read performance
-- 2. The partial indexes (WHERE clauses) reduce index size and improve efficiency
-- 3. Monitor disk space after applying - indexes require storage
-- 4. Consider running ANALYZE after index creation to update query planner statistics:
--    ANALYZE public.creatives;
--    ANALYZE public.api_usage;
--    ANALYZE public.organization_members;
--    ANALYZE public.vertical_presets;
