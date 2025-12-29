-- Migration: Make usage_tracking support per-session rows
-- Date: 2025-11-26
-- Description: Remove monthly unique constraint and index batch_number to allow multiple rows per month per resource

-- Drop existing unique index that enforces one row per month
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'idx_usage_tracking_unique' AND n.nspname = 'public'
    ) THEN
        DROP INDEX IF EXISTS idx_usage_tracking_unique;
    END IF;
END $$;

-- Ensure an index on (company_id, resource_type, period_start) for queries
CREATE INDEX IF NOT EXISTS idx_usage_tracking_company_resource_period
    ON usage_tracking(company_id, resource_type, period_start);

-- Add/Ensure index on batch_number to group sessions
CREATE INDEX IF NOT EXISTS idx_usage_tracking_batch_number
    ON usage_tracking(batch_number);

-- Optional: composite index to speed session queries per month and batch
CREATE INDEX IF NOT EXISTS idx_usage_tracking_company_resource_batch_period
    ON usage_tracking(company_id, resource_type, batch_number, period_start);
