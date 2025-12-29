-- Create applications table for CV-Job matching results

CREATE TABLE applications (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    job_id VARCHAR(36) NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    candidate_id VARCHAR(36) NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    analysis_data JSONB,
    overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    analyzed_at TIMESTAMP,
    reviewed_at TIMESTAMP,
    reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_applications_job_id ON applications(job_id);
CREATE INDEX idx_applications_candidate_id ON applications(candidate_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_overall_score ON applications(overall_score DESC);
CREATE INDEX idx_applications_analysis_data ON applications USING GIN(analysis_data);

-- Unique constraint: one application per job-candidate pair
CREATE UNIQUE INDEX idx_applications_job_candidate ON applications(job_id, candidate_id);

-- Add comments
COMMENT ON TABLE applications IS 'Stores AI-powered CV to job matching analysis results';
COMMENT ON COLUMN applications.analysis_data IS 'JSONB containing detailed AI analysis: breakdown, matched/missing skills, strengths, weaknesses, recommendation';
COMMENT ON COLUMN applications.overall_score IS 'Overall match score from 0 to 100';
COMMENT ON COLUMN applications.status IS 'Analysis status: pending, analyzed, reviewed, rejected, accepted';
