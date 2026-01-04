-- Migration: Add interview usage types to resource_type enum
-- interview_completed: When a candidate completes an interview
-- interview_ai_analysis: When AI analysis is performed on an interview

-- Add new enum values to resource_type
ALTER TYPE resource_type ADD VALUE IF NOT EXISTS 'interview_completed';
ALTER TYPE resource_type ADD VALUE IF NOT EXISTS 'interview_ai_analysis';

-- Add comments
COMMENT ON TYPE resource_type IS 'Resource types for usage tracking: cv_upload, job_post, ai_analysis, user_account, api_call, interview_completed, interview_ai_analysis';

