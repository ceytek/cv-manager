# Admin Backend

Isolated admin API for CV Manager system owner operations.

## Features
- Separate authentication (admin_users table)
- Company management
- Subscription management
- User impersonation
- Audit logs

## Setup

```bash
cd Admin-Backend
python -m venv venv
source venv/bin/activate  # macOS/Linux
pip install -r requirements.txt

# Run migrations
psql -U your_user -d cv_manager -f migrations/001_create_admin_users.sql

# Start server (port 8002)
uvicorn app.main:app --reload --port 8002
```

## GraphQL Endpoint
http://localhost:8002/graphql

## Environment Variables
Copy `.env.example` to `.env` and configure:
- DATABASE_URL
- ADMIN_JWT_SECRET
