-- Change candidate id from integer to UUID

-- First, drop the existing primary key
ALTER TABLE candidates DROP CONSTRAINT candidates_pkey;

-- Change id column type to UUID and set default
ALTER TABLE candidates 
ALTER COLUMN id TYPE VARCHAR(36),
ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

-- Add primary key back
ALTER TABLE candidates ADD PRIMARY KEY (id);

-- Recreate index
CREATE INDEX IF NOT EXISTS idx_candidates_id ON candidates(id);

-- Note: Existing data will keep integer IDs as strings
-- New records will have UUID format
