-- Migration: Add rejection fields to applications table
-- Date: 2025-12-30
-- Description: Adds rejection note, rejected_at timestamp, and template reference

ALTER TABLE applications
ADD COLUMN IF NOT EXISTS rejection_note TEXT NULL,
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS rejection_template_id VARCHAR(36) NULL;

-- Comments
COMMENT ON COLUMN applications.rejection_note IS 'Internal note for rejection reason (not shown to candidate)';
COMMENT ON COLUMN applications.rejected_at IS 'Timestamp when the application was rejected';
COMMENT ON COLUMN applications.rejection_template_id IS 'ID of the rejection template used';

