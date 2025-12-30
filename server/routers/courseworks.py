"""Courseworks CRUD API router."""

from typing import Optional
from uuid import UUID
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.coursework import Coursework
from models.user import User
from services.auth_service import get_current_user, AuthError

router = APIRouter(prefix="/api/courseworks", tags=["courseworks"])


# Request/Response schemas
class CourseworkCreate(BaseModel):
    """Schema for creating a new coursework."""
    course_name: str
    deadline: Optional[str] = None
    deadline_note: Optional[str] = None
    roadmap_data: dict  # Full DecompositionResponse as dict


class CourseworkUpdate(BaseModel):
    """Schema for updating a coursework."""
    course_name: Optional[str] = None
    roadmap_data: Optional[dict] = None  # Can update tasks, etc.


class CourseworkSummary(BaseModel):
    """Schema for coursework list item (summary view)."""
    id: UUID
    course_name: str
    deadline: Optional[str] = None
    deadline_note: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    total_tasks: int
    completed_tasks: int
    
    class Config:
        from_attributes = True


class CourseworkDetail(BaseModel):
    """Schema for full coursework detail."""
    id: UUID
    course_name: str
    deadline: Optional[str] = None
    deadline_note: Optional[str] = None
    roadmap_data: dict
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


def extract_token(authorization: Optional[str] = Header(None)) -> Optional[str]:
    """Extract JWT token from Authorization header."""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    return authorization[7:]


async def get_authenticated_user(
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db)
) -> User:
    """Dependency that requires authentication and returns the user."""
    token = extract_token(authorization)
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    try:
        return await get_current_user(db, token)
    except AuthError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


def count_tasks(roadmap_data: dict) -> tuple[int, int]:
    """Count total and completed tasks from roadmap data."""
    tasks = roadmap_data.get("tasks", [])
    total = len(tasks)
    completed = sum(1 for t in tasks if t.get("status") == "done")
    return total, completed


@router.post("", response_model=CourseworkDetail, status_code=201)
async def create_coursework(
    data: CourseworkCreate,
    user: User = Depends(get_authenticated_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Save a new coursework roadmap.
    
    Stores the complete DecompositionResponse including all tasks,
    milestones, guides, terminology, and other extracted data.
    """
    coursework = Coursework(
        user_id=user.id,
        course_name=data.course_name or "Untitled Coursework",
        deadline=data.deadline,
        deadline_note=data.deadline_note,
        roadmap_data=data.roadmap_data,
    )
    
    db.add(coursework)
    await db.commit()
    await db.refresh(coursework)
    
    return CourseworkDetail.model_validate(coursework)


@router.get("", response_model=list[CourseworkSummary])
async def list_courseworks(
    user: User = Depends(get_authenticated_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all courseworks for the authenticated user.
    
    Returns summary info for each coursework suitable for dashboard display.
    """
    result = await db.execute(
        select(Coursework)
        .where(Coursework.user_id == user.id)
        .order_by(Coursework.updated_at.desc())
    )
    courseworks = result.scalars().all()
    
    summaries = []
    for cw in courseworks:
        total, completed = count_tasks(cw.roadmap_data)
        summaries.append(CourseworkSummary(
            id=cw.id,
            course_name=cw.course_name,
            deadline=cw.deadline,
            deadline_note=cw.deadline_note,
            created_at=cw.created_at,
            updated_at=cw.updated_at,
            total_tasks=total,
            completed_tasks=completed,
        ))
    
    return summaries


@router.get("/{coursework_id}", response_model=CourseworkDetail)
async def get_coursework(
    coursework_id: UUID,
    user: User = Depends(get_authenticated_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get a single coursework by ID.
    
    Returns the full roadmap data including all guides and tasks.
    """
    result = await db.execute(
        select(Coursework)
        .where(Coursework.id == coursework_id, Coursework.user_id == user.id)
    )
    coursework = result.scalar_one_or_none()
    
    if not coursework:
        raise HTTPException(status_code=404, detail="Coursework not found")
    
    return CourseworkDetail.model_validate(coursework)


@router.put("/{coursework_id}", response_model=CourseworkDetail)
async def update_coursework(
    coursework_id: UUID,
    data: CourseworkUpdate,
    user: User = Depends(get_authenticated_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update a coursework.
    
    Can update course name and/or roadmap data (e.g., task statuses).
    """
    result = await db.execute(
        select(Coursework)
        .where(Coursework.id == coursework_id, Coursework.user_id == user.id)
    )
    coursework = result.scalar_one_or_none()
    
    if not coursework:
        raise HTTPException(status_code=404, detail="Coursework not found")
    
    if data.course_name is not None:
        coursework.course_name = data.course_name
    
    if data.roadmap_data is not None:
        coursework.roadmap_data = data.roadmap_data
        # Also update deadline from roadmap if present
        coursework.deadline = data.roadmap_data.get("deadline")
        coursework.deadline_note = data.roadmap_data.get("deadline_note")
    
    coursework.updated_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(coursework)
    
    return CourseworkDetail.model_validate(coursework)


@router.delete("/{coursework_id}", status_code=204)
async def delete_coursework(
    coursework_id: UUID,
    user: User = Depends(get_authenticated_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a coursework.
    
    Permanently removes the coursework and all its data.
    """
    result = await db.execute(
        select(Coursework)
        .where(Coursework.id == coursework_id, Coursework.user_id == user.id)
    )
    coursework = result.scalar_one_or_none()
    
    if not coursework:
        raise HTTPException(status_code=404, detail="Coursework not found")
    
    await db.delete(coursework)
    await db.commit()
    
    return None
