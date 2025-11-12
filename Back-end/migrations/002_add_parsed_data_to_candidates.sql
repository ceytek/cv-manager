-- Migration: Add parsed_data column to candidates
-- Date: 2025-10-22
-- Description: Adds JSONB column for AI-parsed CV data

ALTER TABLE candidates 
ADD COLUMN parsed_data JSONB;

-- Index for faster JSON queries
CREATE INDEX idx_candidates_parsed_data ON candidates USING GIN (parsed_data);

COMMENT ON COLUMN candidates.parsed_data IS 'AI-parsed structured CV data (education, experience, skills, etc.)';
