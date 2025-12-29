-- Migration: Create company subscriptions table
-- Date: 2025-11-20
-- Description: Tracks active subscriptions for each company

CREATE TYPE subscription_status AS ENUM ('trial', 'active', 'expired', 'cancelled', 'suspended');

CREATE TABLE company_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    plan_id UUID NOT NULL,
    status subscription_status NOT NULL DEFAULT 'trial',
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    trial_end_date DATE,
    auto_renew BOOLEAN NOT NULL DEFAULT true,
    billing_cycle VARCHAR(20) DEFAULT 'monthly', -- 'monthly' or 'yearly'
    last_billing_date DATE,
    next_billing_date DATE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_company
        FOREIGN KEY (company_id)
        REFERENCES companies(id)
        ON DELETE CASCADE,
    
    CONSTRAINT fk_plan
        FOREIGN KEY (plan_id)
        REFERENCES subscription_plans(id)
        ON DELETE RESTRICT,
    
    CONSTRAINT valid_dates CHECK (
        (end_date IS NULL OR end_date >= start_date) AND
        (trial_end_date IS NULL OR trial_end_date >= start_date)
    )
);

-- Indexes
CREATE INDEX idx_company_subscriptions_company ON company_subscriptions(company_id);
CREATE INDEX idx_company_subscriptions_plan ON company_subscriptions(plan_id);
CREATE INDEX idx_company_subscriptions_status ON company_subscriptions(status);
CREATE INDEX idx_company_subscriptions_dates ON company_subscriptions(start_date, end_date);
CREATE INDEX idx_company_subscriptions_active ON company_subscriptions(company_id, status) WHERE status = 'active';

-- Unique constraint: One active subscription per company
CREATE UNIQUE INDEX idx_company_active_subscription 
    ON company_subscriptions(company_id) 
    WHERE status IN ('active', 'trial');

-- Comments
COMMENT ON TABLE company_subscriptions IS 'Tracks subscription status for each company';
COMMENT ON COLUMN company_subscriptions.trial_end_date IS '14-day trial period end date';
COMMENT ON COLUMN company_subscriptions.billing_cycle IS 'Monthly or yearly billing cycle';

-- Auto-update trigger
CREATE TRIGGER company_subscriptions_updated_at_trigger
    BEFORE UPDATE ON company_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_companies_updated_at();

-- Assign default company to Unlimited plan
INSERT INTO company_subscriptions (
    company_id,
    plan_id,
    status,
    start_date,
    auto_renew
) VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    (SELECT id FROM subscription_plans WHERE slug = 'unlimited' LIMIT 1),
    'active',
    CURRENT_DATE,
    false
);
