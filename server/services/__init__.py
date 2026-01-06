# Services package
"""
CourseworkBuddy Services

Core services for the multi-agent RAG system:
- langchain_service: LangChain/Gemini configuration
- document_processor: PDF chunking and processing
- vector_store: ChromaDB vector storage
- rag_chain: Retrieval-Augmented Generation
- agents: Multi-agent orchestration system

Legacy services (kept for fallback):
- ai_decomposer: Original direct LLM decomposition
- pdf_parser: PyMuPDF text extraction
"""

from .langchain_service import get_langchain_service, LangChainService
from .document_processor import DocumentProcessor
from .vector_store import get_vector_store, VectorStoreService
from .rag_chain import RAGChain
from .pdf_parser import extract_text_from_pdf, get_pdf_metadata
from .ai_decomposer import decompose_coursework

__all__ = [
    # New LangChain services
    "get_langchain_service",
    "LangChainService",
    "DocumentProcessor",
    "get_vector_store",
    "VectorStoreService",
    "RAGChain",
    # Legacy services
    "extract_text_from_pdf",
    "get_pdf_metadata",
    "decompose_coursework",
]
