import os
from pathlib import Path

# Base directory
BASE_DIR = Path(__file__).resolve().parent.parent

# Secret key for JWT
SECRET_KEY = os.getenv("SECRET_KEY", "softlocker-dev-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

# Database
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'softlocker.db'}")

# File uploads
UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", str(BASE_DIR / "uploads")))
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

# Allowed file types
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".pdf", ".docx"}
ALLOWED_MIME_TYPES = {
    "image/jpeg",
    "image/png",
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}
