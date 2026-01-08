"""Ingestion Agent - handles multimodal document processing and embedding."""

import uuid
from typing import Any, Dict

from services.agents.base import BaseAgent
from services.document_processor import MultimodalDocumentProcessor
from services.vector_store import get_vector_store


class IngestionAgent(BaseAgent):
    """
    Agent responsible for multimodal document ingestion.
    
    Extracts text and images from PDFs, generates AI descriptions 
    for images, and stores all embeddings in ChromaDB.
    """
    
    def __init__(self, max_images: int = 10):
        super().__init__(
            name="IngestionAgent",
            description="Processes PDF documents with text and images, creates embeddings",
        )
        self.doc_processor = MultimodalDocumentProcessor(
            chunk_size=1000,
            chunk_overlap=200,
            max_images=max_images,
        )
        self.vector_store = get_vector_store()
    
    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process and ingest a PDF document with multimodal content.
        
        Input:
            - pdf_content: bytes - Raw PDF file content
            - user_id: str - User identifier (optional, defaults to 'anonymous')
            - metadata: dict - Additional metadata (optional)
        
        Output:
            - document_id: str - Unique document identifier
            - text_chunk_count: int - Number of text chunks created
            - image_count: int - Number of images processed
            - collection_name: str - ChromaDB collection name
            - pdf_text: str - Extracted text (for analysis agent)
            - images: list - Info about extracted images
        """
        pdf_content = input_data.get("pdf_content")
        user_id = input_data.get("user_id", "anonymous")
        metadata = input_data.get("metadata", {})
        
        if not pdf_content:
            raise ValueError("pdf_content is required")
        
        # Generate unique document ID
        document_id = str(uuid.uuid4())
        collection_name = f"coursework_{user_id}"
        
        # Process PDF with multimodal processor (text + images)
        text_docs, image_docs, image_info = self.doc_processor.process_pdf(
            pdf_content=pdf_content,
            document_id=document_id,
            metadata={
                "user_id": user_id,
                **metadata,
            },
        )
        
        # Store text embeddings
        if text_docs:
            self.vector_store.add_documents(collection_name, text_docs)
        
        # Store image description embeddings
        if image_docs:
            self.vector_store.add_documents(collection_name, image_docs)
        
        # Extract full text for analysis agent
        pdf_text = self.doc_processor.get_full_text(pdf_content)
        
        return {
            "document_id": document_id,
            "text_chunk_count": len(text_docs),
            "image_count": len(image_docs),
            "collection_name": collection_name,
            "pdf_text": pdf_text,
            "images": image_info,
        }
