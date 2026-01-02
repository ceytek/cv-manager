-- Migration: Create rejection_templates table
-- Date: 2025-12-30
-- Description: Stores rejection email templates with variable placeholders

CREATE TABLE IF NOT EXISTS rejection_templates (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    body TEXT NOT NULL,
    language VARCHAR(10) DEFAULT 'TR',
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    company_id UUID NOT NULL REFERENCES companies(id),
    created_by VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for company lookup
CREATE INDEX IF NOT EXISTS idx_rejection_templates_company ON rejection_templates(company_id);

-- Index for active templates
CREATE INDEX IF NOT EXISTS idx_rejection_templates_active ON rejection_templates(company_id, is_active);

-- Comment
COMMENT ON TABLE rejection_templates IS 'Stores rejection email templates with variable placeholders like {ad}, {soyad}, {ilan_adi}';

