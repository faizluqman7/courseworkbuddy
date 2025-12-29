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


class TermDefinition(BaseModel):
    """Domain-specific term with explanation."""
    term: str = Field(..., description="The technical term")
    definition: str = Field(..., description="Plain-English explanation for 2nd year CS students")
    example: Optional[str] = Field(None, description="Concrete example if helpful")


class MarkingCriterion(BaseModel):
    """Grading component from the specification."""
    component: str = Field(..., description="Name of the graded component")
    percentage: Optional[int] = Field(None, description="Percentage if specified, None if not found")
    description: str = Field(..., description="What this component assesses")
    priority: str = Field(default="essential", description="Tier: 'essential', 'strong', or 'excellence'")


class GetStartedStep(BaseModel):
    """Step in the getting started guide."""
    step_number: int = Field(..., description="Step order number")
    title: str = Field(..., description="Brief step title")
    description: str = Field(..., description="Detailed explanation")
    commands: list[str] = Field(default_factory=list, description="Terminal commands to run")
    expected_output: Optional[str] = Field(None, description="What user should see after running")


class PrioritizationTier(BaseModel):
    """Task grouping by priority tier."""
    tier: str = Field(..., description="Tier name: 'Essential', 'Strong', or 'Excellence'")
    description: str = Field(..., description="What this tier represents")
    time_estimate: str = Field(..., description="Estimated hours for this tier")
    task_ids: list[str] = Field(default_factory=list, description="Tasks in this tier")


class WeeklySchedule(BaseModel):
    """Recommended work schedule entry."""
    week: int = Field(..., description="Week number")
    title: str = Field(..., description="Week focus title")
    task_ids: list[str] = Field(default_factory=list, description="Task IDs to complete this week")
    hours_estimate: int = Field(..., description="Estimated hours this week")


class DirectoryEntry(BaseModel):
    """Entry in the project directory structure."""
    path: str = Field(..., description="File or folder path")
    type: str = Field(..., description="'file' or 'directory'")
    description: Optional[str] = Field(None, description="What this file/folder contains")


class DecompositionResponse(BaseModel):
    """Response from the decomposition endpoint."""
    # Core fields (existing)
    tasks: list[Task] = Field(..., description="List of atomic tasks")
    milestones: list[Milestone] = Field(default_factory=list, description="Major deliverables")
    setup_instructions: list[str] = Field(default_factory=list, description="Environment setup steps")
    course_name: Optional[str] = Field(None, description="Detected course name")
    total_estimated_time: Optional[str] = Field(None, description="Total time estimate")
    summary_overview: Optional[str] = Field(None, description="Brief overview of the coursework")
    key_deliverables: list[str] = Field(default_factory=list, description="Main things to deliver")
    what_you_need_to_do: Optional[str] = Field(None, description="Plain language explanation")
    
    # NEW: Implementation Guide fields
    deadline: Optional[str] = Field(None, description="Deadline in ISO 8601 format (YYYY-MM-DDTHH:MM:SS)")
    deadline_note: Optional[str] = Field(None, description="Additional deadline info, e.g., 'Friday noon'")
    
    get_started_steps: list[GetStartedStep] = Field(default_factory=list, description="Getting started guide")
    directory_structure: list[DirectoryEntry] = Field(default_factory=list, description="Expected project structure")
    
    terminology: list[TermDefinition] = Field(default_factory=list, description="Domain-specific terms explained")
    marking_criteria: list[MarkingCriterion] = Field(default_factory=list, description="Grading breakdown")
    prioritization_tiers: list[PrioritizationTier] = Field(default_factory=list, description="Tasks grouped by priority")
    recommended_schedule: list[WeeklySchedule] = Field(default_factory=list, description="Weekly work plan")
    constraints: list[str] = Field(default_factory=list, description="Explicit restrictions from spec")
    debugging_tips: list[str] = Field(default_factory=list, description="Common pitfalls and fixes")

    # Extraction metadata
    extraction_warnings: list[str] = Field(default_factory=list, description="Fields that couldn't be extracted - user should cross-check specs")


class ErrorResponse(BaseModel):
    """Error response model."""
    detail: str
    error_code: Optional[str] = None

