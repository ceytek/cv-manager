-- Migration: Add AI analysis and voice response options to interview_templates
-- Date: 2026-01-03

-- Add AI analysis enabled flag
ALTER TABLE interview_templates 
ADD COLUMN IF NOT EXISTS ai_analysis_enabled BOOLEAN DEFAULT FALSE;

-- Add voice response enabled flag
ALTER TABLE interview_templates 
ADD COLUMN IF NOT EXISTS voice_response_enabled BOOLEAN DEFAULT FALSE;

-- Add comments
COMMENT ON COLUMN interview_templates.ai_analysis_enabled IS 'When true, AI will analyze all answers after interview completion';
COMMENT ON COLUMN interview_templates.voice_response_enabled IS 'When true, candidates can respond using voice (Speech-to-Text)';

