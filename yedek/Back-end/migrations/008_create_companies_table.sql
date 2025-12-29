-- Migration: Create companies table
-- Date: 2025-11-20
-- Description: Multi-tenancy support - Companies (tenants) management

CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_code VARCHAR(6) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    logo_url VARCHAR(500),
    subdomain VARCHAR(100) UNIQUE,
    custom_domain VARCHAR(255) UNIQUE,
    theme_colors JSONB DEFAULT '{"primary": "#667eea", "secondary": "#764ba2"}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT company_code_format CHECK (company_code ~ '^[A-Z0-9]{6}$')
);

-- Indexes
CREATE INDEX idx_companies_code ON companies(company_code);
CREATE INDEX idx_companies_subdomain ON companies(subdomain) WHERE subdomain IS NOT NULL;
CREATE INDEX idx_companies_active ON companies(is_active);
CREATE INDEX idx_companies_created_at ON companies(created_at);

-- Comments
COMMENT ON TABLE companies IS 'Stores company (tenant) information for multi-tenancy';
COMMENT ON COLUMN companies.company_code IS '6-character unique code for login (e.g., ABC123)';
COMMENT ON COLUMN companies.subdomain IS 'Subdomain for white-label access (e.g., company.hrsmart.co)';
COMMENT ON COLUMN companies.custom_domain IS 'Custom domain for white-label (e.g., ik.company.com)';
COMMENT ON COLUMN companies.theme_colors IS 'Custom brand colors for white-label UI';

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_companies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER companies_updated_at_trigger
    BEFORE UPDATE ON companies
    FOR EACH ROW
    EXECUTE FUNCTION update_companies_updated_at();

-- Seed default company for existing data migration
INSERT INTO companies (
    id,
    company_code,
    name,
    email,
    phone,
    is_active
) VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'SYS001',
    'Default Company',
    'admin@hrsmart.co',
    '+90 555 000 0000',
    true
);
