-- Migration: Fix batch_number indexes to include company_id for multi-tenancy
-- Date: 2025-11-26
-- Description: Add company_id to batch_number indexes for security and performance

-- ============================================================================
-- CANDIDATES TABLE
-- ============================================================================

-- Drop old single-column batch_number index
DROP INDEX IF EXISTS idx_candidates_batch_number;

-- Create composite index with company_id for multi-tenant isolation
CREATE INDEX idx_candidates_batch_company 
    ON candidates(batch_number, company_id)
    WHERE batch_number IS NOT NULL;

COMMENT ON INDEX idx_candidates_batch_company IS 
    'Multi-tenant safe batch lookup: WHERE batch_number=X AND company_id=Y';

-- ============================================================================
-- APPLICATIONS TABLE
-- ============================================================================

-- Drop old single-column batch_number index
DROP INDEX IF EXISTS idx_applications_batch_number;

-- Create composite index with company_id for multi-tenant isolation
CREATE INDEX idx_applications_batch_company 
    ON applications(batch_number, company_id)
    WHERE batch_number IS NOT NULL;

COMMENT ON INDEX idx_applications_batch_company IS 
    'Multi-tenant safe batch lookup: WHERE batch_number=X AND company_id=Y';

-- ============================================================================
-- ANALYZE
-- ============================================================================

ANALYZE candidates;
ANALYZE applications;
