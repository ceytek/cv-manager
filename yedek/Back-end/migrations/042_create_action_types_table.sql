-- Migration: Create action_types table
-- Description: Defines all possible actions/events in the recruitment process

CREATE TABLE IF NOT EXISTS action_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,  -- NULL = system-wide action
    
    code VARCHAR(50) NOT NULL UNIQUE,
    name_tr VARCHAR(100) NOT NULL,
    name_en VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(20),
    is_system BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_action_types_code ON action_types(code);
CREATE INDEX IF NOT EXISTS idx_action_types_company_id ON action_types(company_id);

-- Insert default system action types
INSERT INTO action_types (code, name_tr, name_en, icon, color, is_system, sort_order) VALUES
    ('cv_uploaded', 'CV Yüklendi', 'CV Uploaded', 'upload', 'blue', TRUE, 1),
    ('cv_analyzed', 'CV Analiz Edildi', 'CV Analyzed', 'search', 'purple', TRUE, 2),
    ('likert_sent', 'Likert Testi Gönderildi', 'Likert Test Sent', 'send', 'orange', TRUE, 3),
    ('likert_started', 'Likert Testi Başlatıldı', 'Likert Test Started', 'play', 'orange', TRUE, 4),
    ('likert_completed', 'Likert Testi Tamamlandı', 'Likert Test Completed', 'check-circle', 'green', TRUE, 5),
    ('interview_sent', 'Mülakat Daveti Gönderildi', 'Interview Invitation Sent', 'video', 'blue', TRUE, 6),
    ('interview_started', 'Mülakat Başlatıldı', 'Interview Started', 'play', 'blue', TRUE, 7),
    ('interview_completed', 'Mülakat Tamamlandı', 'Interview Completed', 'check-circle', 'green', TRUE, 8),
    ('rejected', 'Reddedildi', 'Rejected', 'x-circle', 'red', TRUE, 100),
    ('hired', 'İşe Alındı', 'Hired', 'user-check', 'green', TRUE, 101),
    ('note_added', 'Not Eklendi', 'Note Added', 'message-square', 'gray', TRUE, 50)
ON CONFLICT (code) DO NOTHING;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_action_types_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_action_types_updated_at ON action_types;
CREATE TRIGGER trigger_action_types_updated_at
    BEFORE UPDATE ON action_types
    FOR EACH ROW
    EXECUTE FUNCTION update_action_types_updated_at();

