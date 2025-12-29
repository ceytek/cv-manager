# CV Manager Backend

FastAPI backend for CV Manager - HR CV Evaluation System

## Features

- ✅ User Authentication (Register, Login)
- ✅ JWT Token Authentication
- ✅ Password Reset (Email with 6-digit code)
- ✅ Change Password
- ✅ Email Service (Mailtrap)
- ✅ PostgreSQL + pgvector

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Configure environment:
```bash
cp .env.example .env
# Edit .env with your credentials
```

3. Setup Mailtrap:
- Go to https://mailtrap.io/
- Create account (free)
- Get SMTP credentials
- Update .env:
  - MAIL_USERNAME=your_username
  - MAIL_PASSWORD=your_password

4. Run server:
```bash
uvicorn app.main:app --reload --port 8000
```

## API Documentation

http://localhost:8000/docs

## Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/forgot-password` - Request reset code
- `POST /api/auth/verify-reset-token` - Verify reset code
- `POST /api/auth/reset-password` - Reset password
- `POST /api/auth/change-password` - Change password (auth required)
- `GET /api/auth/me` - Get current user (auth required)

## Project Structure

```
Back-end/
├── app/
│   ├── api/
│   │   ├── routes/
│   │   │   └── auth.py          # Auth endpoints
│   │   └── dependencies.py      # Auth dependencies
│   ├── core/
│   │   ├── config.py            # Settings
│   │   └── database.py          # DB connection
│   ├── models/
│   │   └── user.py              # User model
│   ├── schemas/
│   │   └── user.py              # Pydantic schemas
│   ├── services/
│   │   ├── auth.py              # Auth business logic
│   │   └── email.py             # Email service
│   ├── utils/
│   │   ├── security.py          # JWT, password hashing
│   │   └── token.py             # Reset token utils
│   └── main.py                  # FastAPI app
├── .env                         # Environment variables
├── .env.example                 # Example env file
└── requirements.txt             # Dependencies
```
