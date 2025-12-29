-- Migration: Add company_id to existing tables
-- Date: 2025-11-20
-- Description: Add company_id foreign key to all existing tables for multi-tenancy

-- Add company_id to users table
ALTER TABLE users ADD COLUMN company_id UUID;

-- Add company_id to candidates table
ALTER TABLE candidates ADD COLUMN company_id UUID;

-- Add company_id to jobs table
ALTER TABLE jobs ADD COLUMN company_id UUID;

-- Add company_id to departments table
ALTER TABLE departments ADD COLUMN company_id UUID;

-- Add company_id to applications table
ALTER TABLE applications ADD COLUMN company_id UUID;

-- Comments
COMMENT ON COLUMN users.company_id IS 'Foreign key to companies table - multi-tenancy';
COMMENT ON COLUMN candidates.company_id IS 'Foreign key to companies table - multi-tenancy';
COMMENT ON COLUMN jobs.company_id IS 'Foreign key to companies table - multi-tenancy';
COMMENT ON COLUMN departments.company_id IS 'Foreign key to companies table - multi-tenancy';
COMMENT ON COLUMN applications.company_id IS 'Foreign key to companies table - multi-tenancy';

-- Note: Constraints will be added in migration 015 after data migration
