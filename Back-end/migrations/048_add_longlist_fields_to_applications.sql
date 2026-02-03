-- Migration: Add Long List fields to applications table
-- Date: 2026-02-01
-- Description: Adds fields to support Long List functionality (3-stage funnel: Pool → Long List → Short List)

-- Add Long List columns to applications table
ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS is_in_longlist BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS longlist_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS longlist_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS longlist_note TEXT;

-- Add comments for documentation
COMMENT ON COLUMN applications.is_in_longlist IS 'Whether candidate is in long list (first stage filtering)';
COMMENT ON COLUMN applications.longlist_at IS 'When candidate was added to long list';
COMMENT ON COLUMN applications.longlist_by IS 'User ID who added candidate to long list';
COMMENT ON COLUMN applications.longlist_note IS 'Note when adding to long list';

-- Create index for faster Long List queries
CREATE INDEX IF NOT EXISTS idx_applications_longlist ON applications(job_id, is_in_longlist) WHERE is_in_longlist = TRUE;

-- Create composite index for list type filtering
CREATE INDEX IF NOT EXISTS idx_applications_list_status ON applications(job_id, is_in_longlist, is_shortlisted);

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'applications' 
AND column_name IN ('is_in_longlist', 'longlist_at', 'longlist_by', 'longlist_note');
