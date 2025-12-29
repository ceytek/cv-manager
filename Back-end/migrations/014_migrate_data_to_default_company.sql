-- Migration: Assign existing data to default company
-- Date: 2025-11-20
-- Description: Migrate all existing records to the default company (SYS001)

-- Default company ID
-- '00000000-0000-0000-0000-000000000001'

DO $$
DECLARE
    v_default_company_id UUID := '00000000-0000-0000-0000-000000000001';
    v_users_count INTEGER;
    v_candidates_count INTEGER;
    v_jobs_count INTEGER;
    v_departments_count INTEGER;
    v_applications_count INTEGER;
BEGIN
    -- Update users table
    UPDATE users 
    SET company_id = v_default_company_id 
    WHERE company_id IS NULL;
    
    GET DIAGNOSTICS v_users_count = ROW_COUNT;
    RAISE NOTICE 'Updated % users with default company_id', v_users_count;

    -- Update candidates table
    UPDATE candidates 
    SET company_id = v_default_company_id 
    WHERE company_id IS NULL;
    
    GET DIAGNOSTICS v_candidates_count = ROW_COUNT;
    RAISE NOTICE 'Updated % candidates with default company_id', v_candidates_count;

    -- Update jobs table
    UPDATE jobs 
    SET company_id = v_default_company_id 
    WHERE company_id IS NULL;
    
    GET DIAGNOSTICS v_jobs_count = ROW_COUNT;
    RAISE NOTICE 'Updated % jobs with default company_id', v_jobs_count;

    -- Update departments table
    UPDATE departments 
    SET company_id = v_default_company_id 
    WHERE company_id IS NULL;
    
    GET DIAGNOSTICS v_departments_count = ROW_COUNT;
    RAISE NOTICE 'Updated % departments with default company_id', v_departments_count;

    -- Update applications table
    UPDATE applications 
    SET company_id = v_default_company_id 
    WHERE company_id IS NULL;
    
    GET DIAGNOSTICS v_applications_count = ROW_COUNT;
    RAISE NOTICE 'Updated % applications with default company_id', v_applications_count;

    -- Summary
    RAISE NOTICE '====================================';
    RAISE NOTICE 'Data Migration Summary:';
    RAISE NOTICE 'Users: %', v_users_count;
    RAISE NOTICE 'Candidates: %', v_candidates_count;
    RAISE NOTICE 'Jobs: %', v_jobs_count;
    RAISE NOTICE 'Departments: %', v_departments_count;
    RAISE NOTICE 'Applications: %', v_applications_count;
    RAISE NOTICE 'Total records migrated: %', 
        v_users_count + v_candidates_count + v_jobs_count + v_departments_count + v_applications_count;
    RAISE NOTICE '====================================';
END $$;

-- Verify no null company_id records remain
DO $$
DECLARE
    v_null_count INTEGER;
BEGIN
    SELECT 
        (SELECT COUNT(*) FROM users WHERE company_id IS NULL) +
        (SELECT COUNT(*) FROM candidates WHERE company_id IS NULL) +
        (SELECT COUNT(*) FROM jobs WHERE company_id IS NULL) +
        (SELECT COUNT(*) FROM departments WHERE company_id IS NULL) +
        (SELECT COUNT(*) FROM applications WHERE company_id IS NULL)
    INTO v_null_count;
    
    IF v_null_count > 0 THEN
        RAISE EXCEPTION 'Data migration incomplete: % records still have NULL company_id', v_null_count;
    ELSE
        RAISE NOTICE 'Verification successful: All records have company_id assigned';
    END IF;
END $$;
