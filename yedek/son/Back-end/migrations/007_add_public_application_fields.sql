-- Add fields for public job applications
-- This migration adds support for external candidate applications via public career page

-- Add match_score column (AI-generated compatibility score)
-- Note: overall_score already exists for internal analysis, match_score is for public applications
ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS match_score INTEGER CHECK (match_score >= 0 AND match_score <= 100);

-- Add match_details column (detailed AI matching breakdown)
ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS match_details JSONB;

-- Add source column to distinguish application origin
ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'internal';

-- Add applicant contact info for public applications (optional, as candidate table has this too)
ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS applicant_email VARCHAR(255);

ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS applicant_phone VARCHAR(50);

-- Create index for match_score for sorting/filtering
CREATE INDEX IF NOT EXISTS idx_applications_match_score ON applications(match_score DESC);

-- Create index for source for filtering
CREATE INDEX IF NOT EXISTS idx_applications_source ON applications(source);

-- Create composite index for job applications with high match scores
CREATE INDEX IF NOT EXISTS idx_applications_job_match 
ON applications(job_id, match_score DESC) 
WHERE match_score IS NOT NULL;

-- Add comments
COMMENT ON COLUMN applications.match_score IS 'AI-generated match score for public applications (0-100)';
COMMENT ON COLUMN applications.match_details IS 'Detailed AI matching breakdown: strengths, weaknesses, recommendations';
COMMENT ON COLUMN applications.source IS 'Application source: internal (CV upload), public_application (career page), referral';
COMMENT ON COLUMN applications.applicant_email IS 'Applicant email for public applications (backup, also in candidates table)';
COMMENT ON COLUMN applications.applicant_phone IS 'Applicant phone for public applications (backup, also in candidates table)';

-- Update status column comment to include new statuses
COMMENT ON COLUMN applications.status IS 'Application status: pending, analyzed, under_review, shortlisted, rejected, hired';
