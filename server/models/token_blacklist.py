"""Token blacklist model for JWT revocation."""

from datetime import datetime
from sqlalchemy import String, DateTime
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class TokenBlacklist(Base):
    """Blacklisted JWT tokens (revoked on logout)."""

    __tablename__ = "token_blacklist"

    jti: Mapped[str] = mapped_column(
        String(36),
        primary_key=True
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        index=True
    )
