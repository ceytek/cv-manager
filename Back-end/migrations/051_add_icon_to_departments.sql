-- Migration: Add icon field to departments table
-- Date: 2026-02-01

-- Add icon column to departments table
ALTER TABLE departments 
ADD COLUMN IF NOT EXISTS icon VARCHAR(50) DEFAULT 'building-2';

-- Update comment
COMMENT ON COLUMN departments.icon IS 'Lucide icon name for department (e.g., briefcase, users)';
