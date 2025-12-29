-- Recreate candidates table with UUID id

-- Drop existing table (will cascade to foreign keys if any)
DROP TABLE IF EXISTS candidates CASCADE;

-- Recreate with UUID id
CREATE TABLE candidates (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    cv_file_name VARCHAR(500) NOT NULL,
    cv_file_path VARCHAR(1000) NOT NULL,
    cv_file_size INTEGER NOT NULL,
    cv_text TEXT,
    parsed_data JSONB,
    cv_language VARCHAR(10),
    cv_photo_path VARCHAR(500),
    status VARCHAR(50) NOT NULL DEFAULT 'new',
    department_id VARCHAR(36) NOT NULL REFERENCES departments(id),
    uploaded_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_candidates_id ON candidates(id);
CREATE INDEX idx_candidates_name ON candidates(name);
CREATE INDEX idx_candidates_email ON candidates(email);
CREATE INDEX idx_candidates_status ON candidates(status);
CREATE INDEX idx_candidates_department_id ON candidates(department_id);
CREATE INDEX idx_candidates_cv_language ON candidates(cv_language);
CREATE INDEX idx_candidates_parsed_data ON candidates USING GIN(parsed_data);

-- Add comments
COMMENT ON COLUMN candidates.cv_language IS 'Language of the CV detected by AI (e.g., TR, EN, DE)';
COMMENT ON COLUMN candidates.cv_photo_path IS 'Path to extracted photo from CV if available';
