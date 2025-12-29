-- Add cv_language and cv_photo_path columns to candidates table

ALTER TABLE candidates 
ADD COLUMN cv_language VARCHAR(10),
ADD COLUMN cv_photo_path VARCHAR(500);

-- Create index on cv_language for filtering
CREATE INDEX idx_candidates_cv_language ON candidates(cv_language);

-- Add comment for documentation
COMMENT ON COLUMN candidates.cv_language IS 'Language of the CV detected by AI (e.g., TR, EN, DE)';
COMMENT ON COLUMN candidates.cv_photo_path IS 'Path to extracted photo from CV if available';
