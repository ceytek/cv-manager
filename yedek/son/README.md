# 🎯 CV Manager - AI-Powered Recruitment Management System

> Modern, intelligent recruitment platform that automates CV analysis and candidate matching using AI

[![React](https://img.shields.io/badge/React-19.1.1-blue.svg)](https://reactjs.org/)
[![Python](https://img.shields.io/badge/Python-3.11+-green.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Latest-teal.svg)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-blue.svg)](https://www.postgresql.org/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o--mini-orange.svg)](https://openai.com/)

## 📋 Overview

CV Manager is a comprehensive HR platform that digitalizes and automates recruitment processes using artificial intelligence. It intelligently analyzes candidate CVs, automatically matches them with job postings, and helps you quickly identify the most suitable candidates.

### 🌟 Key Features

- ✅ **Smart CV Upload & Analysis** - Bulk or individual CV upload with AI-powered parsing
- ✅ **Automatic Candidate-Job Matching** - AI compatibility scoring (0-100%)
- ✅ **Candidate Comparison** - Side-by-side analysis of two candidates
- ✅ **Job Management** - Create, edit, and track job postings
- ✅ **Multi-language Support** - Turkish & English UI with dynamic AI outputs
- ✅ **Comprehensive Dashboard** - Statistics and visualizations
- ✅ **Department Organization** - Manage jobs and candidates by department

### 💼 Time Savings

| Process | Manual | With CV Manager | Savings |
|---------|--------|-----------------|---------|
| **100 CVs Analysis** | 32 hours | 50 minutes | **97% reduction** |
| **Candidate Comparison** | 5 hours | 5 minutes | **98% reduction** |
| **Monthly Capacity** | 1 job/week | 10+ jobs/week | **10x increase** |

## 🏗️ Architecture

This is a **monorepo** containing three main services:

```
CV-Manager-dev/
├── Front-end/          # React 19 + Vite frontend
├── Back-end/           # Python FastAPI + GraphQL backend
├── AI-Service/         # Python FastAPI + OpenAI AI engine
└── README.md
```

### Technology Stack

**Frontend:**
- React 19.1.1 with Vite
- Apollo Client (GraphQL)
- react-i18next (i18n)
- Lucide Icons
- TipTap Editor

**Backend:**
- Python 3.11+
- FastAPI
- Strawberry GraphQL
- SQLAlchemy ORM
- PostgreSQL
- JWT Authentication

**AI Service:**
- Python 3.11+
- FastAPI
- OpenAI GPT-4o-mini
- PyMuPDF (PDF parsing)
- python-docx (Word parsing)

## 🚀 Quick Start

### Prerequisites

- Python 3.11 or higher
- Node.js 18 or higher
- PostgreSQL 16 or higher
- OpenAI API Key

### 1. Clone the Repository

```bash
git clone <repository-url>
cd CV-Manager-dev
```

### 2. Setup Frontend

```bash
cd Front-end
npm install
cp .env.example .env  # Configure environment variables
npm run dev
```

Frontend will run on: http://localhost:5173

### 3. Setup Backend

```bash
cd Back-end
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Configure database
cp .env.example .env  # Add your DATABASE_URL and JWT_SECRET

# Run migrations
# Apply SQL migrations from migrations/ folder to your PostgreSQL database

# Start server
uvicorn app.main:app --reload --port 8000
```

Backend will run on: http://localhost:8000
GraphQL Playground: http://localhost:8000/graphql

### 4. Setup AI Service

```bash
cd AI-Service
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Configure OpenAI
cp .env.example .env  # Add your OPENAI_API_KEY

# Start server
uvicorn app.main:app --reload --port 8001
```

AI Service will run on: http://localhost:8001

## 📁 Project Structure

### Frontend (`/Front-end`)

```
src/
├── components/       # Reusable UI components
│   ├── CVEvaluation/ # CV analysis components
│   ├── CVCompareView.jsx
│   └── ...
├── pages/            # Page components
├── graphql/          # GraphQL queries/mutations
├── i18n/            # Translation files (tr.json, en.json)
├── services/         # API services
└── utils/            # Utility functions
```

### Backend (`/Back-end`)

```
app/
├── api/              # REST API routes
├── core/             # Core configuration
├── graphql/          # GraphQL schema & resolvers
├── models/           # SQLAlchemy models
├── schemas/          # Pydantic schemas
├── services/         # Business logic
└── utils/            # Utilities
migrations/           # SQL migration files
uploads/cvs/          # Uploaded CV storage
```

### AI Service (`/AI-Service`)

```
app/
├── prompts/          # AI prompt templates
│   ├── cv_parsing_prompt.py
│   ├── cv_job_matching_prompt.py
│   └── cv_compare_prompt.py
├── services/         # AI processing services
│   ├── cv_parser.py
│   ├── job_matcher_service.py
│   └── compare_service.py
└── main.py           # FastAPI application
```

## 🔧 Configuration

### Frontend (.env)

```env
VITE_GRAPHQL_URL=http://localhost:8000/graphql
VITE_GRAPHQL_WS_URL=ws://localhost:8000/graphql
```

### Backend (.env)

```env
DATABASE_URL=postgresql://user:password@localhost:5432/cv_manager
JWT_SECRET=your-secret-key-here
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
AI_SERVICE_URL=http://localhost:8001
```

### AI Service (.env)

```env
OPENAI_API_KEY=your-openai-api-key-here
```

## 🔐 Authentication

The system uses JWT token-based authentication:

1. User registers/logs in via GraphQL
2. Backend issues access token + refresh token
3. Frontend stores tokens and includes in requests
4. Tokens are validated on each protected endpoint

## 🌐 API Documentation

### GraphQL API (Backend)

Visit http://localhost:8000/graphql for interactive GraphQL playground

**Key Queries:**
- `candidates` - List all candidates
- `jobs` - List all jobs
- `applications` - List applications for a job
- `compareCandidates` - Compare two candidates

**Key Mutations:**
- `register` / `login` - Authentication
- `createJob` - Create new job posting
- `analyzeJobCandidates` - Analyze candidates for a job
- `uploadCV` - Upload and parse CV

### REST API (AI Service)

Visit http://localhost:8001/docs for Swagger documentation

**Endpoints:**
- `POST /parse-cv` - Parse CV file
- `POST /match-cv-to-job` - Match candidate to job
- `POST /compare-cvs` - Compare two CVs

## 🎨 Features in Detail

### 1. CV Parsing

Upload CVs in PDF or Word format. AI automatically extracts:
- Personal information
- Work experience
- Education
- Skills (technical, soft, languages)
- Certifications
- Projects

### 2. Job-Candidate Matching

AI analyzes candidates against job requirements with breakdown:
- **Experience Score** (30 points)
- **Education Score** (20 points)
- **Skills Score** (30 points)
- **Language Score** (10 points)
- **Overall Fit** (10 points)

Plus location matching and detailed reasoning.

### 3. Candidate Comparison

Compare two candidates side-by-side with:
- Overall compatibility scores
- Overlapping vs. unique skills
- Experience comparison
- Education comparison
- AI-generated summary

### 4. Multi-language AI Outputs

When you switch language in the UI (TR ↔ EN), all NEW analyses are generated in that language:
- Analysis summaries
- Strengths/weaknesses
- Comparison reports
- Reasoning texts

## 🛠️ Development

### Running Tests

```bash
# Backend tests
cd Back-end
pytest

# Frontend tests
cd Front-end
npm test
```

### Code Style

- **Python**: Follow PEP 8, use Black formatter
- **JavaScript**: Follow Airbnb style guide, use ESLint + Prettier

### Database Migrations

SQL migrations are stored in `Back-end/migrations/`. Apply them manually to your PostgreSQL database in order.

## 📊 Database Schema

Key tables:
- `users` - User accounts
- `departments` - Organization departments
- `jobs` - Job postings
- `candidates` - Candidate CVs
- `applications` - Job-candidate applications with AI analysis

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is proprietary software. All rights reserved.

## 👥 Team

Developed by [Your Team/Company Name]

## 📧 Contact

For questions or support, contact: [your-email@example.com]

---

**Made with ❤️ using React, FastAPI, and OpenAI**
