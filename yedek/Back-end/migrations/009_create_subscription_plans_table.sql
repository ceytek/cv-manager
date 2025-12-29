-- Migration: Create subscription plans table
-- Date: 2025-11-20
-- Description: Subscription plan definitions (Starter, Pro, Business, Unlimited)

CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    cv_limit INTEGER,
    job_limit INTEGER,
    user_limit INTEGER,
    monthly_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    yearly_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    features JSONB DEFAULT '{}'::jsonb,
    is_white_label BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT positive_limits CHECK (
        (cv_limit IS NULL OR cv_limit > 0) AND
        (job_limit IS NULL OR job_limit > 0) AND
        (user_limit IS NULL OR user_limit > 0)
    ),
    CONSTRAINT positive_prices CHECK (
        monthly_price >= 0 AND yearly_price >= 0
    )
);

-- Indexes
CREATE INDEX idx_subscription_plans_slug ON subscription_plans(slug);
CREATE INDEX idx_subscription_plans_active ON subscription_plans(is_active);
CREATE INDEX idx_subscription_plans_white_label ON subscription_plans(is_white_label);

-- Comments
COMMENT ON TABLE subscription_plans IS 'Defines available subscription plans';
COMMENT ON COLUMN subscription_plans.cv_limit IS 'Max CVs per month (NULL = unlimited)';
COMMENT ON COLUMN subscription_plans.job_limit IS 'Max active job postings (NULL = unlimited)';
COMMENT ON COLUMN subscription_plans.user_limit IS 'Max users in company (NULL = unlimited)';
COMMENT ON COLUMN subscription_plans.features IS 'JSON object of enabled features';
COMMENT ON COLUMN subscription_plans.is_white_label IS 'True for Unlimited/White-label packages';

-- Auto-update trigger
CREATE TRIGGER subscription_plans_updated_at_trigger
    BEFORE UPDATE ON subscription_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_companies_updated_at();

-- Seed subscription plans
INSERT INTO subscription_plans (name, slug, description, cv_limit, job_limit, user_limit, monthly_price, yearly_price, features, is_white_label, sort_order) VALUES
(
    'Starter',
    'starter',
    'Küçük işletmeler için ideal başlangıç paketi',
    10,
    5,
    3,
    499.00,
    4990.00,
    '{"ai_matching": false, "bulk_upload": false, "advanced_reports": false, "api_access": false, "email_support": true}'::jsonb,
    false,
    1
),
(
    'Pro',
    'pro',
    'Büyüyen şirketler için profesyonel çözüm',
    100,
    20,
    10,
    999.00,
    9990.00,
    '{"ai_matching": true, "bulk_upload": true, "advanced_reports": true, "api_access": false, "email_support": true, "priority_support": true}'::jsonb,
    false,
    2
),
(
    'Business',
    'business',
    'Kurumsal şirketler için gelişmiş özellikler',
    500,
    50,
    25,
    2499.00,
    24990.00,
    '{"ai_matching": true, "bulk_upload": true, "advanced_reports": true, "api_access": true, "email_support": true, "priority_support": true, "custom_integrations": true}'::jsonb,
    false,
    3
),
(
    'Unlimited',
    'unlimited',
    'White-label çözüm - Sınırsız kullanım',
    NULL,
    NULL,
    NULL,
    0.00,
    0.00,
    '{"ai_matching": true, "bulk_upload": true, "advanced_reports": true, "api_access": true, "email_support": true, "priority_support": true, "custom_integrations": true, "white_label": true, "custom_domain": true, "custom_branding": true}'::jsonb,
    true,
    4
);
