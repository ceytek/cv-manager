-- Migration: Add list_type column to shortlist_shares for Long List sharing
-- Date: 2026-02-01

-- Add list_type column
ALTER TABLE shortlist_shares ADD COLUMN IF NOT EXISTS list_type VARCHAR(20) NOT NULL DEFAULT 'shortlist';

-- Add comment
COMMENT ON COLUMN shortlist_shares.list_type IS 'Type of list: shortlist or longlist';

-- Add index for filtering
CREATE INDEX IF NOT EXISTS idx_shortlist_shares_list_type ON shortlist_shares (list_type);
