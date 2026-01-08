"""InfoFlow Backend - FastAPI Application."""

import os
import sys
from pathlib import Path
from contextlib import asynccontextmanager

# Add server directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

from routers import decompose, auth, courseworks, chat, images
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
    
    # Debug: Print all registered routes
    print("\n" + "="*50)
    print("Registered Routes:")
    print("="*50)
    for route in app.routes:
        if hasattr(route, 'methods') and hasattr(route, 'path'):
            methods = ','.join(route.methods)
            print(f"{methods:8} {route.path}")
    print("="*50 + "\n")
    
    yield
    # Cleanup on shutdown (if needed)


# Create FastAPI app
app = FastAPI(
    title="CourseworkBuddy API",
    description="AI-powered coursework decomposition with multi-agent RAG for University of Edinburgh Informatics students",
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan,
)

# Rate limiting (optional)
if RATE_LIMIT_ENABLED and limiter:
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Build CORS origins list
cors_origins = [
    "http://localhost:5173",  # Vite dev server
    "http://localhost:3000",  # Alternative dev port
    "http://127.0.0.1:5173",
]

# Add production frontend URL if configured
frontend_url = os.environ.get("FRONTEND_URL")
if frontend_url:
    cors_origins.append(frontend_url)

# Configure CORS for frontend
# Allow Vercel preview deployments (e.g., courseworkbuddy-git-rag-*.vercel.app)
def is_allowed_origin(origin: str) -> bool:
    """Check if origin is allowed - supports Vercel preview deployments."""
    if not origin:
        return False
    
    # Check explicit allowed origins
    if origin in cors_origins:
        return True
    
    # Allow all Vercel preview deployments
    if origin.startswith("https://") and ".vercel.app" in origin:
        return True
    
    return False

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https://.*\.vercel\.app",  # Allow all Vercel deployments
    allow_origins=cors_origins,  # Plus explicit origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(decompose.router)
app.include_router(auth.router)
app.include_router(courseworks.router)
app.include_router(chat.router)
app.include_router(images.router)


@app.api_route("/api/health", methods=["GET", "HEAD"])
async def health_check():
    """Health check endpoint - supports both GET and HEAD (for UptimeRobot)."""
    return {"status": "healthy", "service": "infoflow-api"}


@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "name": "CourseworkBuddy API",
        "version": "2.0.0",
        "docs": "/api/docs",
        "features": [
            "Multi-agent RAG decomposition",
            "Follow-up chat with context",
            "ChromaDB vector storage",
        ],
    }

