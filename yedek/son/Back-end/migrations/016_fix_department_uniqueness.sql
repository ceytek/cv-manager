-- Migration 016: Fix department uniqueness to be per company
-- Date: 2025-11-21
-- Purpose: Allow same department names across different companies.

-- 1. Drop existing unique index on name if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' AND indexname = 'ix_departments_name'
    ) THEN
        BEGIN
            DROP INDEX IF EXISTS ix_departments_name;
        EXCEPTION WHEN undefined_object THEN
            -- Ignore
            NULL;
        END;
    END IF;
END$$;

-- 2. Drop any existing unique constraint that only covers name
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT conname FROM pg_constraint 
        WHERE conrelid = 'public.departments'::regclass 
          AND contype = 'u'
    ) LOOP
        -- If constraint is only on (name), drop it
        IF (
            SELECT array_agg(att.attname) FROM pg_attribute att
            JOIN pg_constraint c ON c.conrelid = att.attrelid AND att.attnum = ANY(c.conkey)
            WHERE c.conname = r.conname
        ) = ARRAY['name'] THEN
            EXECUTE format('ALTER TABLE departments DROP CONSTRAINT %I', r.conname);
        END IF;
    END LOOP;
END$$;

-- 3. Create new unique constraint on (company_id, name)
ALTER TABLE departments
    ADD CONSTRAINT uq_department_company_name UNIQUE (company_id, name);

-- 4. Ensure existing rows have company_id (migration 015 should have enforced NOT NULL)
-- If any legacy rows lack company_id, set them to default company to avoid violating new constraint
UPDATE departments SET company_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE company_id IS NULL;

COMMENT ON CONSTRAINT uq_department_company_name ON departments IS 'Department name must be unique per company';
