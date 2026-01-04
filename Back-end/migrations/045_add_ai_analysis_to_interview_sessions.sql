-- Migration: Add AI analysis results to interview_sessions
-- Date: 2026-01-03

-- Add AI analysis JSON result
ALTER TABLE interview_sessions 
ADD COLUMN IF NOT EXISTS ai_analysis JSONB DEFAULT NULL;

-- Add AI overall score (1-5 scale)
ALTER TABLE interview_sessions 
ADD COLUMN IF NOT EXISTS ai_overall_score DECIMAL(3,2) DEFAULT NULL;

-- Add browser STT support flag (null = not checked, true = supported, false = not supported)
ALTER TABLE interview_sessions 
ADD COLUMN IF NOT EXISTS browser_stt_supported BOOLEAN DEFAULT NULL;

-- Add index for sessions with AI analysis
CREATE INDEX IF NOT EXISTS idx_interview_sessions_ai_score 
ON interview_sessions(ai_overall_score) 
WHERE ai_overall_score IS NOT NULL;

-- Add comments
COMMENT ON COLUMN interview_sessions.ai_analysis IS 'JSON object containing AI analysis results with categories and scores';
COMMENT ON COLUMN interview_sessions.ai_overall_score IS 'Overall AI score from 1 to 5';
COMMENT ON COLUMN interview_sessions.browser_stt_supported IS 'Whether browser supported Speech-to-Text during interview';

