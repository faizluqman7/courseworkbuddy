"""Chat API router for follow-up questions about coursework."""

from fastapi import APIRouter, HTTPException, Depends
from typing import Optional

from services.agents.orchestrator import get_orchestrator
from services.agents.qa_agent import ConversationMemory
from models.schemas import ChatRequest, ChatResponse, ChatSource
from routers.auth import get_current_user_optional


router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("/", response_model=ChatResponse)
async def chat_with_coursework(
    request: ChatRequest,
    current_user = Depends(get_current_user_optional),
):
    """
    Ask a follow-up question about your coursework.
    
    Requires a valid session_id from a previous /api/decompose call.
    Uses RAG to retrieve relevant context from the coursework specification
    and maintains conversation history for multi-turn chat.
    
    **Rate Limits**: Gemini free tier limits apply (15 requests/min)
    """
    orchestrator = get_orchestrator()
    
    # Extract user ID for collection namespacing
    user_id = str(current_user.id) if current_user else "anonymous"
    collection_name = f"coursework_{user_id}"
    
    try:
        result = await orchestrator.run_chat(
            question=request.question,
            session_id=request.session_id,
            collection_name=collection_name,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")
    
    return ChatResponse(
        answer=result["answer"],
        sources=[ChatSource(**s) for s in result["sources"]],
        images=result.get("images", []),  # Include relevant images for display
    )


@router.delete("/{session_id}")
async def clear_chat_history(
    session_id: str,
    current_user = Depends(get_current_user_optional),
):
    """
    Clear chat history for a session.
    
    Useful for starting a fresh conversation while keeping 
    the document embeddings intact.
    """
    ConversationMemory.clear(session_id)
    return {"status": "cleared", "session_id": session_id}


@router.get("/sessions/count")
async def get_session_count():
    """Get number of active chat sessions (for monitoring)."""
    return {"active_sessions": ConversationMemory.get_session_count()}
