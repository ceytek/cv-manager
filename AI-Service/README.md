# AI Service

AI-powered CV parsing and job matching service using OpenAI GPT-4o-mini.

## 🎯 Purpose

Separate microservice handling:
- CV text extraction (PDF/DOCX)
- Structured CV parsing with OpenAI
- Job matching and scoring (coming soon)

## 🚀 Setup

1. **Install dependencies:**
```bash
cd AI-Service
pip install -r requirements.txt
```

2. **Configure environment:**
```bash
cp .env.example .env
# Edit .env with your OpenAI API key
```

3. **Run service:**
```bash
python -m uvicorn app.main:app --reload --port 8001
```

## 📡 API Endpoints

### Health Check
```
GET /
Response: {"status": "healthy", "service": "AI Service"}
```

### Parse CV from File
```
POST /parse-cv-file
Content-Type: multipart/form-data
Body: file (PDF or DOCX)

Response:
{
  "success": true,
  "data": {
    "personal": {...},
    "education": [...],
    "experience": [...],
    "skills": {...},
    ...
  }
}
```

### Parse CV from Text
```
POST /parse-cv-text
Content-Type: application/json
Body: {"cv_text": "..."}

Response: Same as above
```

## 🔧 Configuration

Edit `.env` file:
- `OPENAI_API_KEY`: Your OpenAI API key
- `MODEL_NAME`: gpt-4o-mini (default)
- `AI_SERVICE_PORT`: 8001 (default)

## 📊 Architecture

```
AI-Service (Port 8001)
├── app/
│   ├── main.py              → FastAPI endpoints
│   ├── config.py            → Settings
│   ├── services/
│   │   ├── openai_client.py → OpenAI wrapper
│   │   └── cv_parser.py     → CV parsing logic
│   └── prompts/
│       └── cv_parsing_prompt.py → GPT prompts
```

## 🔗 Integration

Back-end service calls AI-Service via HTTP:
```python
import httpx

async with httpx.AsyncClient() as client:
    response = await client.post(
        "http://localhost:8001/parse-cv-text",
        json={"cv_text": extracted_text}
    )
    parsed_cv = response.json()
```

## 💰 Cost Estimation

Using GPT-4o-mini:
- ~$0.001-0.002 per CV parsing
- Very cost-effective for production use

## 🛡️ Security

- API key stored in `.env` (gitignored)
- CORS restricted to Back-end service
- File size validation (max 10MB)
