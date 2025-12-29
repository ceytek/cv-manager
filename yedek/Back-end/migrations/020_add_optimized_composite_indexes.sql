-- Migration: Add optimized composite indexes for query performance
-- Date: 2025-11-26
-- Description: Strategic composite indexes based on real query patterns

-- ============================================================================
-- CANDIDATES TABLE - Primary query: List candidates by company/status/language
-- ============================================================================

-- Drop any existing single-column indexes that will be replaced
DROP INDEX IF EXISTS idx_candidates_location;
DROP INDEX IF EXISTS idx_candidates_cv_language;

-- Main query pattern: "Get candidates for this company, filter by status and CV language"
CREATE INDEX idx_candidates_query_optimized 
    ON candidates(company_id, status, cv_language)
    WHERE status IS NOT NULL;

-- Secondary pattern: "Search candidates by location within company"
-- Using partial index for non-null locations only
CREATE INDEX idx_candidates_location_search 
    ON candidates(company_id, location)
    WHERE location IS NOT NULL AND location != '';

-- ============================================================================
-- JOBS TABLE - Primary query: List active jobs by company with filters
-- ============================================================================

-- Drop any existing single-column indexes that will be replaced
DROP INDEX IF EXISTS idx_jobs_location;
DROP INDEX IF EXISTS idx_jobs_employment_type;

-- Main query pattern: "Get active jobs for company, optionally filter by location/type"
CREATE INDEX idx_jobs_query_optimized 
    ON jobs(company_id, status, location, employment_type)
    WHERE status = 'active';

-- ============================================================================
-- APPLICATIONS TABLE - Primary queries: Reporting and job detail views
-- ============================================================================

-- Pattern 1: "Get recent applications for company (dashboard/reports)"
CREATE INDEX idx_applications_company_reporting 
    ON applications(company_id, created_at DESC)
    INCLUDE (job_id, candidate_id, status);

-- Pattern 2: "Get all applications for a specific job (job detail page)"
CREATE INDEX idx_applications_job_detail 
    ON applications(job_id, status, created_at DESC)
    INCLUDE (candidate_id, match_score);

-- ============================================================================
-- ANALYZE for query planner optimization
-- ============================================================================

ANALYZE candidates;
ANALYZE jobs;
ANALYZE applications;

-- ============================================================================
-- INDEX USAGE NOTES
-- ============================================================================

COMMENT ON INDEX idx_candidates_query_optimized IS 'Optimizes: WHERE company_id=X AND status=Y [AND cv_language=Z]';
COMMENT ON INDEX idx_candidates_location_search IS 'Optimizes: WHERE company_id=X AND location ILIKE pattern (partial index for non-null only)';
COMMENT ON INDEX idx_jobs_query_optimized IS 'Optimizes: WHERE company_id=X AND status=active [AND location/employment_type] (partial index)';
COMMENT ON INDEX idx_applications_company_reporting IS 'Optimizes: WHERE company_id=X ORDER BY created_at DESC (covering index with INCLUDE)';
COMMENT ON INDEX idx_applications_job_detail IS 'Optimizes: WHERE job_id=X [AND status=Y] ORDER BY created_at DESC (covering index)';
