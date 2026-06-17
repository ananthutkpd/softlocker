"""SoftLocker API — FastAPI application entry point."""

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.database import init_db
from src.routers import auth, documents

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

app = FastAPI(
    title="SoftLocker API",
    description="AI-powered document categorization and management",
    version="0.1.0",
)

# CORS — allow Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(documents.router)


@app.on_event("startup")
def on_startup():
    """Initialize database tables on startup."""
    init_db()
    logging.info("SoftLocker API started — database initialized")


@app.get("/api/health")
def health_check():
    """Health check endpoint."""
    return {"status": "ok", "service": "softlocker-api"}
