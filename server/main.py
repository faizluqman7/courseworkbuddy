"""InfoFlow Backend - FastAPI Application."""

import sys
from pathlib import Path

# Add server directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from routers import decompose

# Load environment variables
load_dotenv()

# Create FastAPI app
app = FastAPI(
    title="InfoFlow API",
    description="AI-powered coursework decomposition tool for University of Edinburgh Informatics students",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# Configure CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",  # Alternative dev port
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(decompose.router)


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "infoflow-api"}


@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "name": "InfoFlow API",
        "version": "1.0.0",
        "docs": "/api/docs",
    }
