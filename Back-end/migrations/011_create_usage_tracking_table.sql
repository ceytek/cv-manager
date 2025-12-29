-- Migration: Create usage tracking table
-- Date: 2025-11-20
-- Description: Track resource usage per company for limit enforcement

CREATE TYPE resource_type AS ENUM ('cv_upload', 'job_post', 'ai_analysis', 'user_account', 'api_call');

CREATE TABLE usage_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    resource_type resource_type NOT NULL,
    count INTEGER NOT NULL DEFAULT 0,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_company
        FOREIGN KEY (company_id)
        REFERENCES companies(id)
        ON DELETE CASCADE,
    
    CONSTRAINT positive_count CHECK (count >= 0),
    CONSTRAINT valid_period CHECK (period_end >= period_start)
);

-- Indexes
CREATE INDEX idx_usage_tracking_company ON usage_tracking(company_id);
CREATE INDEX idx_usage_tracking_resource ON usage_tracking(resource_type);
CREATE INDEX idx_usage_tracking_period ON usage_tracking(period_start, period_end);
CREATE INDEX idx_usage_tracking_company_resource ON usage_tracking(company_id, resource_type, period_start);

-- Unique constraint: One record per company/resource/period
CREATE UNIQUE INDEX idx_usage_tracking_unique 
    ON usage_tracking(company_id, resource_type, period_start, period_end);

-- Comments
COMMENT ON TABLE usage_tracking IS 'Tracks resource usage per company for quota management';
COMMENT ON COLUMN usage_tracking.count IS 'Current usage count for this period';
COMMENT ON COLUMN usage_tracking.period_start IS 'Usage period start (monthly reset)';
COMMENT ON COLUMN usage_tracking.metadata IS 'Additional tracking data (e.g., detailed breakdown)';

-- Auto-update trigger
CREATE TRIGGER usage_tracking_updated_at_trigger
    BEFORE UPDATE ON usage_tracking
    FOR EACH ROW
    EXECUTE FUNCTION update_companies_updated_at();

-- Function to get or create current period usage
CREATE OR REPLACE FUNCTION get_current_usage(
    p_company_id UUID,
    p_resource_type resource_type
) RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
    v_period_start DATE;
    v_period_end DATE;
BEGIN
    -- Calculate current period (monthly)
    v_period_start := DATE_TRUNC('month', CURRENT_DATE)::DATE;
    v_period_end := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE;
    
    -- Get or create usage record
    INSERT INTO usage_tracking (company_id, resource_type, period_start, period_end, count)
    VALUES (p_company_id, p_resource_type, v_period_start, v_period_end, 0)
    ON CONFLICT (company_id, resource_type, period_start, period_end) 
    DO NOTHING;
    
    -- Return current count
    SELECT count INTO v_count
    FROM usage_tracking
    WHERE company_id = p_company_id
      AND resource_type = p_resource_type
      AND period_start = v_period_start
      AND period_end = v_period_end;
    
    RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to increment usage
CREATE OR REPLACE FUNCTION increment_usage(
    p_company_id UUID,
    p_resource_type resource_type,
    p_increment INTEGER DEFAULT 1
) RETURNS INTEGER AS $$
DECLARE
    v_new_count INTEGER;
    v_period_start DATE;
    v_period_end DATE;
BEGIN
    v_period_start := DATE_TRUNC('month', CURRENT_DATE)::DATE;
    v_period_end := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE;
    
    INSERT INTO usage_tracking (company_id, resource_type, period_start, period_end, count)
    VALUES (p_company_id, p_resource_type, v_period_start, v_period_end, p_increment)
    ON CONFLICT (company_id, resource_type, period_start, period_end) 
    DO UPDATE SET 
        count = usage_tracking.count + p_increment,
        updated_at = CURRENT_TIMESTAMP
    RETURNING count INTO v_new_count;
    
    RETURN v_new_count;
END;
$$ LANGUAGE plpgsql;

-- Initialize usage tracking for default company
INSERT INTO usage_tracking (company_id, resource_type, period_start, period_end, count)
VALUES 
    ('00000000-0000-0000-0000-000000000001'::uuid, 'cv_upload', DATE_TRUNC('month', CURRENT_DATE)::DATE, (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE, 0),
    ('00000000-0000-0000-0000-000000000001'::uuid, 'job_post', DATE_TRUNC('month', CURRENT_DATE)::DATE, (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE, 0),
    ('00000000-0000-0000-0000-000000000001'::uuid, 'ai_analysis', DATE_TRUNC('month', CURRENT_DATE)::DATE, (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE, 0);
