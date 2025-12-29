-- Migration: Create transactions table
-- Date: 2025-11-20
-- Description: Payment and billing transaction records

CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'failed', 'refunded', 'cancelled');
CREATE TYPE payment_method AS ENUM ('credit_card', 'bank_transfer', 'paypal', 'stripe', 'manual');

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    subscription_id UUID,
    transaction_type VARCHAR(50) NOT NULL, -- 'subscription', 'upgrade', 'renewal', 'refund'
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'TRY',
    payment_method payment_method,
    status transaction_status NOT NULL DEFAULT 'pending',
    transaction_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    invoice_number VARCHAR(50) UNIQUE,
    payment_reference VARCHAR(255), -- External payment gateway reference
    description TEXT,
    transaction_metadata JSONB DEFAULT '{}'::jsonb,
    notes TEXT,
    created_by UUID, -- User who initiated transaction
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_company
        FOREIGN KEY (company_id)
        REFERENCES companies(id)
        ON DELETE CASCADE,
    
    CONSTRAINT fk_subscription
        FOREIGN KEY (subscription_id)
        REFERENCES company_subscriptions(id)
        ON DELETE SET NULL,
    
    CONSTRAINT positive_amount CHECK (amount >= 0)
);

-- Indexes
CREATE INDEX idx_transactions_company ON transactions(company_id);
CREATE INDEX idx_transactions_subscription ON transactions(subscription_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_invoice ON transactions(invoice_number) WHERE invoice_number IS NOT NULL;
CREATE INDEX idx_transactions_company_date ON transactions(company_id, transaction_date DESC);

-- Comments
COMMENT ON TABLE transactions IS 'Payment and billing transaction history';
COMMENT ON COLUMN transactions.transaction_type IS 'Type of transaction (subscription, upgrade, renewal, refund)';
COMMENT ON COLUMN transactions.invoice_number IS 'Unique invoice number for completed transactions';
COMMENT ON COLUMN transactions.payment_reference IS 'External payment gateway transaction ID';
COMMENT ON COLUMN transactions.transaction_metadata IS 'Additional transaction data (payment details, gateway response)';

-- Auto-update trigger
CREATE TRIGGER transactions_updated_at_trigger
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_companies_updated_at();

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number() RETURNS VARCHAR AS $$
DECLARE
    v_year VARCHAR(4);
    v_month VARCHAR(2);
    v_sequence VARCHAR(6);
    v_invoice_number VARCHAR(50);
BEGIN
    v_year := TO_CHAR(CURRENT_DATE, 'YYYY');
    v_month := TO_CHAR(CURRENT_DATE, 'MM');
    
    -- Get next sequence number for this month
    SELECT LPAD((COUNT(*) + 1)::TEXT, 6, '0') INTO v_sequence
    FROM transactions
    WHERE invoice_number LIKE 'INV-' || v_year || v_month || '%';
    
    v_invoice_number := 'INV-' || v_year || v_month || v_sequence;
    
    RETURN v_invoice_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate invoice number on completion
CREATE OR REPLACE FUNCTION set_invoice_number() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND NEW.invoice_number IS NULL THEN
        NEW.invoice_number := generate_invoice_number();
        NEW.completed_at := CURRENT_TIMESTAMP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER transactions_invoice_trigger
    BEFORE INSERT OR UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION set_invoice_number();
