-- Migration: Enforce company_id constraints
-- Date: 2025-11-20
-- Description: Make company_id NOT NULL and add foreign key constraints with indexes

-- Make company_id NOT NULL on all tables
ALTER TABLE users ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE candidates ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE jobs ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE departments ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE applications ALTER COLUMN company_id SET NOT NULL;

-- Add foreign key constraints
ALTER TABLE users 
    ADD CONSTRAINT fk_users_company 
    FOREIGN KEY (company_id) 
    REFERENCES companies(id) 
    ON DELETE CASCADE;

ALTER TABLE candidates 
    ADD CONSTRAINT fk_candidates_company 
    FOREIGN KEY (company_id) 
    REFERENCES companies(id) 
    ON DELETE CASCADE;

ALTER TABLE jobs 
    ADD CONSTRAINT fk_jobs_company 
    FOREIGN KEY (company_id) 
    REFERENCES companies(id) 
    ON DELETE CASCADE;

ALTER TABLE departments 
    ADD CONSTRAINT fk_departments_company 
    FOREIGN KEY (company_id) 
    REFERENCES companies(id) 
    ON DELETE CASCADE;

ALTER TABLE applications 
    ADD CONSTRAINT fk_applications_company 
    FOREIGN KEY (company_id) 
    REFERENCES companies(id) 
    ON DELETE CASCADE;

-- Create indexes on company_id for query performance
CREATE INDEX idx_users_company ON users(company_id);
CREATE INDEX idx_candidates_company ON candidates(company_id);
CREATE INDEX idx_jobs_company ON jobs(company_id);
CREATE INDEX idx_departments_company ON departments(company_id);
CREATE INDEX idx_applications_company ON applications(company_id);

-- Create composite indexes for common query patterns
CREATE INDEX idx_users_company_email ON users(company_id, email);
CREATE INDEX idx_candidates_company_created ON candidates(company_id, created_at DESC);
CREATE INDEX idx_jobs_company_status ON jobs(company_id, status);
CREATE INDEX idx_applications_company_status ON applications(company_id, status);

-- Comments
COMMENT ON INDEX idx_users_company IS 'Performance index for company isolation on users';
COMMENT ON INDEX idx_candidates_company IS 'Performance index for company isolation on candidates';
COMMENT ON INDEX idx_jobs_company IS 'Performance index for company isolation on jobs';
COMMENT ON INDEX idx_departments_company IS 'Performance index for company isolation on departments';
COMMENT ON INDEX idx_applications_company IS 'Performance index for company isolation on applications';

COMMENT ON INDEX idx_users_company_email IS 'Composite index for login queries';
COMMENT ON INDEX idx_candidates_company_created IS 'Composite index for company candidate listings';
COMMENT ON INDEX idx_jobs_company_status IS 'Composite index for company job filtering';
COMMENT ON INDEX idx_applications_company_status IS 'Composite index for company application filtering';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '====================================';
    RAISE NOTICE 'Multi-tenancy Migration Complete!';
    RAISE NOTICE '====================================';
    RAISE NOTICE 'All tables now have:';
    RAISE NOTICE '  - company_id NOT NULL constraint';
    RAISE NOTICE '  - Foreign key to companies table';
    RAISE NOTICE '  - Performance indexes';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '  1. Update backend services to filter by company_id';
    RAISE NOTICE '  2. Add company_id to JWT tokens';
    RAISE NOTICE '  3. Update GraphQL resolvers';
    RAISE NOTICE '  4. Modify login to include company_code';
    RAISE NOTICE '====================================';
END $$;
