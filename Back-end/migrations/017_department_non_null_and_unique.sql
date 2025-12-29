-- Migration 017: Enforce per-company uniqueness and non-null company_id on departments
-- Date: 2025-11-21

-- 1. Drop old unique index on name if it exists
DROP INDEX IF EXISTS ix_departments_name;

-- 2. Ensure all rows have a company_id (fallback to default company if any slipped through)
UPDATE departments SET company_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE company_id IS NULL;

-- 3. Enforce NOT NULL on company_id
ALTER TABLE departments ALTER COLUMN company_id SET NOT NULL;

-- 4. Add composite unique constraint (company_id, name) if not present
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'uq_department_company_name'
    ) THEN
        ALTER TABLE departments ADD CONSTRAINT uq_department_company_name UNIQUE (company_id, name);
    END IF;
END$$;

COMMENT ON CONSTRAINT uq_department_company_name ON departments IS 'Department name unique per company';
