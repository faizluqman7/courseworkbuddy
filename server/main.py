"""InfoFlow Backend - FastAPI Application."""

import sys
from pathlib import Path
from contextlib import asynccontextmanager

# Add server directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

from routers import decompose, auth, courseworks
from routers.auth import limiter, RATE_LIMIT_ENABLED
from database import create_tables

# Optional rate limiting imports
if RATE_LIMIT_ENABLED:
    from slowapi import _rate_limit_exceeded_handler
    from slowapi.errors import RateLimitExceeded

# Load environment variables
load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    # Create database tables on startup
    await create_tables()
    yield
    # Cleanup on shutdown (if needed)


# Create FastAPI app
app = FastAPI(
    title="InfoFlow API",
    description="AI-powered coursework decomposition tool for University of Edinburgh Informatics students",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan,
)

# Rate limiting (optional)
if RATE_LIMIT_ENABLED and limiter:
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

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
app.include_router(auth.router)
app.include_router(courseworks.router)


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

