import os
from dotenv import load_dotenv

load_dotenv()

# Database
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://ceyhuntekin:ceytek85@localhost:5432/cv_manager_db"
)

# JWT Configuration
ADMIN_JWT_SECRET = os.getenv("ADMIN_JWT_SECRET", "admin-super-secret-key-change-in-production")
ADMIN_JWT_ALGORITHM = "HS256"
ADMIN_JWT_EXPIRE_MINUTES = 480  # 8 hours

# CORS
CORS_ORIGINS = [
    "http://localhost:5174",  # Admin frontend default Vite port
    "http://localhost:5173",
    "http://localhost:3000",
]

# Admin Backend Port
ADMIN_BACKEND_PORT = 8002  # Different from main backend (8000) and AI service (8001)
