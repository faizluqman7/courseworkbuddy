"""Agent Orchestrator - coordinates the multi-agent workflow."""

from typing import Any, Dict, Optional
from enum import Enum

from services.agents.ingestion_agent import IngestionAgent
from services.agents.analysis_agent import AnalysisAgent
from services.agents.qa_agent import QAAgent


class TaskType(str, Enum):
    """Types of tasks the orchestrator can handle."""
    DECOMPOSE = "decompose"
    CHAT = "chat"


class AgentOrchestrator:
    """
    Orchestrates the multi-agent workflow for CourseworkBuddy.
    
    Workflow for DECOMPOSE (PDF → Implementation Guide):
        1. IngestionAgent: Process PDF → chunks → embeddings
        2. AnalysisAgent: Analyze content → generate decomposition
    
    Workflow for CHAT (Follow-up Q&A):
        1. QAAgent: Answer question using RAG + conversation history
    """
    
    def __init__(self):
        """Initialize all agents."""
        self.ingestion_agent = IngestionAgent()
        self.analysis_agent = AnalysisAgent()
        self.qa_agent = QAAgent()
    
    async def run_decomposition(
        self,
        pdf_content: bytes,
        user_id: str = "anonymous",
        metadata: Optional[Dict] = None,
    ) -> Dict[str, Any]:
        """
        Run the full decomposition pipeline.
        
        Args:
            pdf_content: Raw PDF file bytes
            user_id: User identifier for collection namespacing
            metadata: Optional additional metadata
        
        Returns:
            Dict containing:
                - decomposition: DecompositionResponse object
                - session_id: ID for follow-up chat
                - document_id: Unique document identifier
                - text_chunk_count: Number of text chunks created
                - image_count: Number of images processed
        """
        # Step 1: Ingest document (extract, chunk, embed)
        ingestion_result = await self.ingestion_agent.execute({
            "pdf_content": pdf_content,
            "user_id": user_id,
            "metadata": metadata or {},
        })
        
        # Step 2: Analyze and decompose
        analysis_result = await self.analysis_agent.execute({
            "pdf_text": ingestion_result["pdf_text"],
            "collection_name": ingestion_result["collection_name"],
            "document_id": ingestion_result["document_id"],
        })
        
        return {
            "decomposition": analysis_result["decomposition"],
            "session_id": analysis_result["session_id"],
            "document_id": analysis_result["document_id"],
            "text_chunk_count": ingestion_result["text_chunk_count"],
            "image_count": ingestion_result.get("image_count", 0),
        }
    
    async def run_chat(
        self,
        question: str,
        session_id: str,
        collection_name: str,
    ) -> Dict[str, Any]:
        """
        Handle a follow-up chat message.
        
        Args:
            question: User's question
            session_id: Chat session identifier
            collection_name: Vector store collection name
        
        Returns:
            Dict containing:
                - answer: Generated response
                - sources: List of source chunks used
        """
        return await self.qa_agent.execute({
            "question": question,
            "session_id": session_id,
            "collection_name": collection_name,
        })


# Singleton instance
_orchestrator: Optional[AgentOrchestrator] = None


def get_orchestrator() -> AgentOrchestrator:
    """Get singleton orchestrator instance."""
    global _orchestrator
    if _orchestrator is None:
        _orchestrator = AgentOrchestrator()
    return _orchestrator
