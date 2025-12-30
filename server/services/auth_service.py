"""Authentication service for user registration, login, and JWT management."""

import os
import re
import uuid as uuid_module
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple
from uuid import UUID

import bcrypt
from jose import JWTError, jwt
from pydantic import BaseModel, field_validator
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from dotenv import load_dotenv

from models.user import User
from models.token_blacklist import TokenBlacklist

load_dotenv()

# JWT Configuration
JWT_SECRET = os.getenv("JWT_SECRET")
if not JWT_SECRET:
    raise ValueError("JWT_SECRET environment variable is required")

JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_DAYS = 7  # Tokens valid for 7 days


# Email validation regex
EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')


# Pydantic schemas for auth
class UserCreate(BaseModel):
    """Schema for user registration."""
    email: str
    password: str
    name: str
    
    @field_validator('email')
    @classmethod
    def validate_email(cls, v: str) -> str:
        if not EMAIL_REGEX.match(v):
            raise ValueError('Invalid email format')
        return v.lower()


class UserLogin(BaseModel):
    """Schema for user login."""
    email: str
    password: str


class UserResponse(BaseModel):
    """Schema for user response (no password)."""
    id: UUID
    email: str
    name: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    """Schema for JWT token response."""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class AuthError(Exception):
    """Custom exception for authentication errors."""
    def __init__(self, message: str, status_code: int = 401):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    # Encode password and generate salt
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password_bytes, salt).decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    try:
        password_bytes = plain_password.encode('utf-8')
        hashed_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except Exception:
        return False


def create_access_token(user_id: UUID) -> Tuple[str, str, datetime]:
    """Create a JWT access token for a user.

    Returns: (token, jti, expires_at)
    """
    jti = str(uuid_module.uuid4())
    now = datetime.now(timezone.utc)
    expire = now + timedelta(days=JWT_EXPIRATION_DAYS)
    payload = {
        "sub": str(user_id),
        "exp": expire,
        "iat": now,
        "jti": jti,
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return token, jti, expire


def decode_access_token(token: str) -> Optional[Tuple[UUID, str, datetime]]:
    """Decode and validate a JWT token.

    Returns: (user_id, jti, expires_at) or None if invalid.
    """
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        jti = payload.get("jti")
        exp = payload.get("exp")
        if user_id is None or jti is None:
            return None
        expires_at = datetime.fromtimestamp(exp, tz=timezone.utc)
        return UUID(user_id), jti, expires_at
    except JWTError:
        return None


async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
    """Get a user by their email address."""
    result = await db.execute(select(User).where(User.email == email.lower()))
    return result.scalar_one_or_none()


async def get_user_by_id(db: AsyncSession, user_id: UUID) -> Optional[User]:
    """Get a user by their ID."""
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def register_user(db: AsyncSession, user_data: UserCreate) -> TokenResponse:
    """Register a new user and return a JWT token."""
    # Check if email already exists
    existing_user = await get_user_by_email(db, user_data.email)
    if existing_user:
        raise AuthError("Email already registered", status_code=400)

    # Validate password length
    if len(user_data.password) < 8:
        raise AuthError("Password must be at least 8 characters", status_code=400)

    # Create new user
    user = User(
        email=user_data.email.lower(),
        password_hash=hash_password(user_data.password),
        name=user_data.name.strip(),
    )

    db.add(user)
    await db.commit()
    await db.refresh(user)

    # Generate token
    token, _, _ = create_access_token(user.id)

    return TokenResponse(
        access_token=token,
        user=UserResponse.model_validate(user)
    )


async def login_user(db: AsyncSession, credentials: UserLogin) -> TokenResponse:
    """Authenticate a user and return a JWT token."""
    user = await get_user_by_email(db, credentials.email)

    if not user or not verify_password(credentials.password, user.password_hash):
        raise AuthError("Invalid email or password", status_code=401)

    # Generate token
    token, _, _ = create_access_token(user.id)

    return TokenResponse(
        access_token=token,
        user=UserResponse.model_validate(user)
    )


async def is_token_blacklisted(db: AsyncSession, jti: str) -> bool:
    """Check if a token is blacklisted."""
    result = await db.execute(
        select(TokenBlacklist).where(TokenBlacklist.jti == jti)
    )
    return result.scalar_one_or_none() is not None


async def blacklist_token(db: AsyncSession, jti: str, expires_at: datetime) -> None:
    """Add a token to the blacklist."""
    entry = TokenBlacklist(jti=jti, expires_at=expires_at)
    db.add(entry)
    await db.commit()


async def get_current_user(db: AsyncSession, token: str) -> User:
    """Get the current user from a JWT token."""
    decoded = decode_access_token(token)
    if not decoded:
        raise AuthError("Invalid or expired token", status_code=401)

    user_id, jti, _ = decoded

    # Check blacklist
    if await is_token_blacklisted(db, jti):
        raise AuthError("Token has been revoked", status_code=401)

    user = await get_user_by_id(db, user_id)
    if not user:
        raise AuthError("User not found", status_code=401)

    return user
