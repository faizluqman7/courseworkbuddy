"""Authentication API router."""

from fastapi import APIRouter, Depends, HTTPException, Header, Request
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from database import get_db
from services.auth_service import (
    UserCreate,
    UserLogin,
    UserResponse,
    TokenResponse,
    AuthError,
    register_user,
    login_user,
    get_current_user,
    decode_access_token,
    blacklist_token,
)

# Optional rate limiting (skip if slowapi not installed)
try:
    from slowapi import Limiter
    from slowapi.util import get_remote_address
    limiter = Limiter(key_func=get_remote_address)
    RATE_LIMIT_ENABLED = True
except ImportError:
    limiter = None
    RATE_LIMIT_ENABLED = False


def rate_limit(limit: str):
    """Decorator that applies rate limit only if slowapi is available."""
    def decorator(func):
        if RATE_LIMIT_ENABLED and limiter:
            return limiter.limit(limit)(func)
        return func
    return decorator

router = APIRouter(prefix="/api/auth", tags=["authentication"])


def get_token_from_header(authorization: Optional[str] = Header(None)) -> Optional[str]:
    """Extract JWT token from Authorization header."""
    if not authorization:
        return None
    if not authorization.startswith("Bearer "):
        return None
    return authorization[7:]


async def require_auth(
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db)
):
    """Dependency that requires authentication."""
    token = get_token_from_header(authorization)
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    try:
        user = await get_current_user(db, token)
        return user
    except AuthError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.post("/register", response_model=TokenResponse)
@rate_limit("3/minute")
async def register(
    request: Request,
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Register a new user account.

    - **email**: Valid email address (must be unique)
    - **password**: At least 8 characters
    - **name**: User's display name

    Returns a JWT token and user info.
    """
    try:
        return await register_user(db, user_data)
    except AuthError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.post("/login", response_model=TokenResponse)
@rate_limit("5/minute")
async def login(
    request: Request,
    credentials: UserLogin,
    db: AsyncSession = Depends(get_db)
):
    """
    Authenticate and get a JWT token.

    - **email**: Registered email address
    - **password**: Account password

    Returns a JWT token and user info.
    """
    try:
        return await login_user(db, credentials)
    except AuthError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.get("/me", response_model=UserResponse)
async def get_me(
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db)
):
    """
    Get the current authenticated user's info.
    
    Requires Authorization header with Bearer token.
    """
    token = get_token_from_header(authorization)
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    try:
        user = await get_current_user(db, token)
        return UserResponse.model_validate(user)
    except AuthError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.post("/logout", status_code=204)
async def logout(
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db)
):
    """
    Logout and invalidate the current token.

    Adds the token to a blacklist so it can no longer be used.
    """
    token = get_token_from_header(authorization)
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required")

    decoded = decode_access_token(token)
    if not decoded:
        raise HTTPException(status_code=401, detail="Invalid token")

    _, jti, expires_at = decoded
    await blacklist_token(db, jti, expires_at)
    return None
