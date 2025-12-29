-- Migration: Create candidates table
-- Date: 2025-10-22
-- Description: Adds candidates table for CV management system

CREATE TYPE candidate_status AS ENUM ('new', 'reviewing', 'interviewed', 'accepted', 'rejected');

CREATE TABLE candidates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    cv_file_name VARCHAR(500) NOT NULL,
    cv_file_path VARCHAR(1000) NOT NULL,
    cv_file_size INTEGER NOT NULL,
    cv_text TEXT,
    status candidate_status NOT NULL DEFAULT 'new',
    department_id VARCHAR(36) NOT NULL,
    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_department
        FOREIGN KEY (department_id)
        REFERENCES departments(id)
        ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_candidates_name ON candidates(name);
CREATE INDEX idx_candidates_email ON candidates(email);
CREATE INDEX idx_candidates_status ON candidates(status);
CREATE INDEX idx_candidates_department_id ON candidates(department_id);

-- Comments
COMMENT ON TABLE candidates IS 'Stores uploaded candidate CVs and parsed information';
COMMENT ON COLUMN candidates.cv_text IS 'Full text extracted from CV file for AI matching';
COMMENT ON COLUMN candidates.status IS 'Current status of candidate application';
