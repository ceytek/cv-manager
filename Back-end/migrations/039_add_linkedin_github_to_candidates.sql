-- Migration: Add linkedin and github columns to candidates table
-- Date: 2025-12-30
-- Description: Adds LinkedIn and GitHub profile URL columns to candidates table for social profile tracking

-- Add linkedin column
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS linkedin VARCHAR(500);

-- Add github column  
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS github VARCHAR(500);

-- Add comment for documentation
COMMENT ON COLUMN candidates.linkedin IS 'LinkedIn profile URL extracted from CV';
COMMENT ON COLUMN candidates.github IS 'GitHub profile URL extracted from CV';


