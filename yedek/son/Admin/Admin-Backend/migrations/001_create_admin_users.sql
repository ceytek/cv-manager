-- Admin Users Table
-- Isolated authentication for system owner/admin access

-- Drop table if exists
DROP TABLE IF EXISTS admin_users;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster username lookups
CREATE INDEX idx_admin_users_username ON admin_users(username);

-- Insert default admin (password: admin123)
-- Hash generated with bcrypt for 'admin123'
INSERT INTO admin_users (username, password_hash, full_name) 
VALUES ('admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5agyWNdB8L6eq', 'System Administrator');
