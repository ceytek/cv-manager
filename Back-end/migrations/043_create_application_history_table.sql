-- Migration: Create application_history table
-- Description: Tracks all actions/events for candidates throughout the recruitment process
-- This is the single source of truth for application status and timeline

CREATE TABLE IF NOT EXISTS application_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Multi-tenancy - ALWAYS required
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    -- References
    application_id VARCHAR(36) NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    candidate_id VARCHAR(36) NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    job_id VARCHAR(36) NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    
    -- Action
    action_type_id UUID NOT NULL REFERENCES action_types(id) ON DELETE RESTRICT,
    
    -- Who performed the action (NULL = system/automatic)
    performed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    
    -- Additional data for the action (flexible storage)
    action_data JSONB DEFAULT '{}',
    
    -- Note/comment for this action
    note TEXT,
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_application_history_company_id ON application_history(company_id);
CREATE INDEX IF NOT EXISTS idx_application_history_application_id ON application_history(application_id);
CREATE INDEX IF NOT EXISTS idx_application_history_candidate_id ON application_history(candidate_id);
CREATE INDEX IF NOT EXISTS idx_application_history_job_id ON application_history(job_id);
CREATE INDEX IF NOT EXISTS idx_application_history_action_type_id ON application_history(action_type_id);
CREATE INDEX IF NOT EXISTS idx_application_history_created_at ON application_history(created_at DESC);

-- Composite index for common queries (last status lookup)
CREATE INDEX IF NOT EXISTS idx_application_history_app_created 
    ON application_history(application_id, created_at DESC);

-- Composite index for job-candidate history
CREATE INDEX IF NOT EXISTS idx_application_history_job_candidate 
    ON application_history(job_id, candidate_id, created_at DESC);

-- Comment
COMMENT ON TABLE application_history IS 'Single source of truth for tracking all candidate actions and events';
COMMENT ON COLUMN application_history.action_data IS 'Flexible JSONB storage for action-specific data (rejection_note, template_id, score, link, etc.)';

