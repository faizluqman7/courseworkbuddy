from pydantic import BaseModel, Field
from typing import Optional


class Task(BaseModel):
    """Individual task extracted from coursework specification."""
    task_id: str = Field(..., description="Unique identifier for the task")
    title: str = Field(..., description="Clear, concise task title")
    description: str = Field(..., description="Detailed description of what needs to be done")
    estimated_time: str = Field(..., description="Estimated time to complete (e.g., '30 mins')")
    related_files: list[str] = Field(default_factory=list, description="Files to work on")
    pdf_snippet: Optional[str] = Field(None, description="Relevant text from the PDF")
    commands: list[str] = Field(default_factory=list, description="Terminal commands needed")
    prerequisites: list[str] = Field(default_factory=list, description="Task IDs that must be done first")
    status: str = Field(default="todo", description="Current status: todo, in_progress, done")
    priority: Optional[int] = Field(None, description="Priority level (0 = highest)")


class Milestone(BaseModel):
    """Major deliverable containing multiple tasks."""
    id: str = Field(..., description="Milestone identifier")
    title: str = Field(..., description="Milestone title")
    description: Optional[str] = Field(None, description="Milestone description")
    summary: Optional[str] = Field(None, description="Brief summary of what to accomplish")
    tasks: list[str] = Field(default_factory=list, description="Task IDs in this milestone")


class DecompositionResponse(BaseModel):
    """Response from the decomposition endpoint."""
    tasks: list[Task] = Field(..., description="List of atomic tasks")
    milestones: list[Milestone] = Field(default_factory=list, description="Major deliverables")
    setup_instructions: list[str] = Field(default_factory=list, description="Environment setup steps")
    course_name: Optional[str] = Field(None, description="Detected course name")
    total_estimated_time: Optional[str] = Field(None, description="Total time estimate")
    summary_overview: Optional[str] = Field(None, description="Brief overview of the coursework")
    key_deliverables: list[str] = Field(default_factory=list, description="Main things to deliver")
    what_you_need_to_do: Optional[str] = Field(None, description="Plain language explanation")


class ErrorResponse(BaseModel):
    """Error response model."""
    detail: str
    error_code: Optional[str] = None
