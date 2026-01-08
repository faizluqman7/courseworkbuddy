"""Decomposition API router with Multi-Agent RAG."""

from fastapi import APIRouter, File, Form, UploadFile, HTTPException, Depends
from typing import Optional

from services.agents.orchestrator import get_orchestrator
from models.schemas import DecomposeResponseWithSession
from routers.auth import get_current_user_optional

router = APIRouter(prefix="/api", tags=["decomposition"])

# Maximum file size in bytes (20MB)
MAX_FILE_SIZE = 20 * 1024 * 1024


@router.post("/decompose", response_model=DecomposeResponseWithSession)
async def decompose_pdf(
    file: UploadFile = File(..., description="PDF specification file"),
    course_url: Optional[str] = Form(None, description="Optional course URL for context"),
    current_user = Depends(get_current_user_optional),
):
    """
    Decompose a coursework PDF specification into actionable tasks.
    
    This endpoint uses a multi-agent RAG pipeline:
    1. **Ingestion Agent**: Extracts text, chunks document, creates embeddings
    2. **Analysis Agent**: Generates comprehensive implementation guide
    
    - **file**: PDF file containing the coursework specification (max 20MB)
    - **course_url**: Optional URL to the course page for additional context
    
    Returns a structured breakdown with:
    - Tasks and milestones
    - Terminology definitions
    - Marking criteria
    - Prioritization guide
    - session_id for follow-up chat via /api/chat
    
    **Rate Limits**: Gemini free tier limits apply (15 requests/min)
    """
    # Validate file type
    if not file.filename or not file.filename.lower().endswith('.pdf'):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are accepted"
        )
    
    # Read file content
    content = await file.read()
    
    # Validate file size
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB"
        )
    
    # Run multi-agent decomposition pipeline
    orchestrator = get_orchestrator()
    user_id = str(current_user.id) if current_user else "anonymous"
    
    try:
        result = await orchestrator.run_decomposition(
            pdf_content=content,
            user_id=user_id,
            metadata={"course_url": course_url} if course_url else None,
        )
    except ValueError as e:
        # Validation errors from agents
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        # Log the full error for debugging
        import traceback
        print(f"Decomposition error: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"Processing failed: {str(e)}"
        )
    
    # Build response with session info for follow-up chat
    decomposition = result["decomposition"]
    
    return DecomposeResponseWithSession(
        # Core fields from decomposition
        tasks=decomposition.tasks,
        milestones=decomposition.milestones,
        setup_instructions=decomposition.setup_instructions,
        course_name=decomposition.course_name,
        total_estimated_time=decomposition.total_estimated_time,
        summary_overview=decomposition.summary_overview,
        key_deliverables=decomposition.key_deliverables,
        what_you_need_to_do=decomposition.what_you_need_to_do,
        deadline=decomposition.deadline,
        deadline_note=decomposition.deadline_note,
        get_started_steps=decomposition.get_started_steps,
        directory_structure=decomposition.directory_structure,
        terminology=decomposition.terminology,
        marking_criteria=decomposition.marking_criteria,
        prioritization_tiers=decomposition.prioritization_tiers,
        recommended_schedule=decomposition.recommended_schedule,
        constraints=decomposition.constraints,
        debugging_tips=decomposition.debugging_tips,
        extraction_warnings=decomposition.extraction_warnings,
        # Session info for follow-up chat
        session_id=result["session_id"],
        document_id=result["document_id"],
    )
