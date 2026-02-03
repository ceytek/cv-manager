-- Migration: Add about field to companies table
-- Date: 2026-02-03
-- Description: Add company description/about field for public job page display

-- Add about column
ALTER TABLE companies ADD COLUMN IF NOT EXISTS about TEXT;

-- Comment
COMMENT ON COLUMN companies.about IS 'Company description/about text (HTML format) for public display';
