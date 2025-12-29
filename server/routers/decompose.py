"""Decomposition API router."""

from fastapi import APIRouter, File, Form, UploadFile, HTTPException

from services.pdf_parser import extract_text_from_pdf, PDFParserError
from services.ai_decomposer import decompose_coursework, DecomposerError
from models.schemas import DecompositionResponse

router = APIRouter(prefix="/api", tags=["decomposition"])

# Maximum file size in bytes (20MB)
MAX_FILE_SIZE = 20 * 1024 * 1024


@router.post("/decompose", response_model=DecompositionResponse)
async def decompose_pdf(
    file: UploadFile = File(..., description="PDF specification file"),
    course_url: str | None = Form(None, description="Optional course URL for context"),
):
    """
    Decompose a coursework PDF specification into actionable tasks.
    
    - **file**: PDF file containing the coursework specification (max 20MB)
    - **course_url**: Optional URL to the course page for additional context
    
    Returns a structured breakdown of tasks, milestones, and setup instructions.
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
    
    # Extract text from PDF
    try:
        pdf_text = extract_text_from_pdf(content)
    except PDFParserError as e:
        raise HTTPException(
            status_code=422,
            detail=f"Failed to parse PDF: {str(e)}"
        )
    
    # Decompose using AI
    try:
        result = decompose_coursework(pdf_text)
    except DecomposerError as e:
        raise HTTPException(
            status_code=500,
            detail=f"AI processing failed: {str(e)}"
        )
    
    return result
