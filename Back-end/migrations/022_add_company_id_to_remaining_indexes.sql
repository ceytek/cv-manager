-- Migration: Add company_id to remaining indexes for complete multi-tenancy
-- Date: 2025-11-26
-- Description: Ensure all filterable indexes include company_id for data isolation

-- ============================================================================
-- CANDIDATES TABLE
-- ============================================================================

-- Drop old single-column indexes
DROP INDEX IF EXISTS idx_candidates_email;
DROP INDEX IF EXISTS idx_candidates_name;

-- Recreate with company_id prefix
CREATE INDEX idx_candidates_company_email 
    ON candidates(company_id, email)
    WHERE email IS NOT NULL;

CREATE INDEX idx_candidates_company_name 
    ON candidates(company_id, name)
    WHERE name IS NOT NULL;

COMMENT ON INDEX idx_candidates_company_email IS 
    'Multi-tenant email lookup: WHERE company_id=X AND email=Y';
COMMENT ON INDEX idx_candidates_company_name IS 
    'Multi-tenant name search: WHERE company_id=X AND name ILIKE pattern';

-- ============================================================================
-- APPLICATIONS TABLE
-- ============================================================================

-- Drop old single-column indexes
DROP INDEX IF EXISTS idx_applications_source;
DROP INDEX IF EXISTS idx_applications_match_score;
DROP INDEX IF EXISTS idx_applications_overall_score;

-- Recreate with company_id prefix
CREATE INDEX idx_applications_company_source 
    ON applications(company_id, source)
    WHERE source IS NOT NULL;

CREATE INDEX idx_applications_company_match_score 
    ON applications(company_id, match_score DESC)
    WHERE match_score IS NOT NULL;

CREATE INDEX idx_applications_company_overall_score 
    ON applications(company_id, overall_score DESC)
    WHERE overall_score IS NOT NULL;

COMMENT ON INDEX idx_applications_company_source IS 
    'Multi-tenant source filter: WHERE company_id=X AND source=Y';
COMMENT ON INDEX idx_applications_company_match_score IS 
    'Multi-tenant score ranking: WHERE company_id=X ORDER BY match_score DESC';
COMMENT ON INDEX idx_applications_company_overall_score IS 
    'Multi-tenant overall ranking: WHERE company_id=X ORDER BY overall_score DESC';

-- ============================================================================
-- USAGE_TRACKING TABLE
-- ============================================================================

-- Note: idx_usage_tracking_resource and idx_usage_tracking_batch_number
-- These are for admin/global queries, keep as-is
-- All company-specific queries already use composite indexes with company_id

-- ============================================================================
-- ANALYZE
-- ============================================================================

ANALYZE candidates;
ANALYZE applications;
