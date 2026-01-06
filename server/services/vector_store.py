"""ChromaDB vector store service."""

import os
from typing import List, Optional, Dict, Any
from pathlib import Path
import chromadb
from chromadb.config import Settings
from langchain_core.documents import Document
from langchain_chroma import Chroma

from services.langchain_service import get_langchain_service


class VectorStoreService:
    """Manage ChromaDB vector store for document embeddings."""
    
    def __init__(self, persist_directory: Optional[str] = None):
        """
        Initialize vector store service.
        
        Args:
            persist_directory: Path to store ChromaDB data. 
                             Defaults to ./chroma_data in server directory.
        """
        self.persist_directory = persist_directory or os.getenv(
            "CHROMA_PERSIST_DIR", 
            str(Path(__file__).parent.parent / "chroma_data")
        )
        
        # Ensure directory exists
        Path(self.persist_directory).mkdir(parents=True, exist_ok=True)
        
        # Initialize ChromaDB client with persistent storage
        self.client = chromadb.PersistentClient(
            path=self.persist_directory,
            settings=Settings(anonymized_telemetry=False),
        )
        
        self.langchain = get_langchain_service()
        self._vectorstores: Dict[str, Chroma] = {}
    
    def get_or_create_collection(self, collection_name: str) -> Chroma:
        """
        Get or create a LangChain Chroma vector store.
        
        Args:
            collection_name: Name of the collection (usually 'coursework_{user_id}')
        
        Returns:
            Chroma vector store instance
        """
        if collection_name not in self._vectorstores:
            self._vectorstores[collection_name] = Chroma(
                collection_name=collection_name,
                embedding_function=self.langchain.get_embeddings(),
                client=self.client,  # Use shared client to avoid settings conflict
            )
        return self._vectorstores[collection_name]
    
    def add_documents(
        self,
        collection_name: str,
        documents: List[Document],
    ) -> List[str]:
        """
        Add documents to a collection.
        
        Args:
            collection_name: Target collection name
            documents: List of Document objects with content and metadata
        
        Returns:
            List of document IDs assigned by ChromaDB
        """
        vectorstore = self.get_or_create_collection(collection_name)
        ids = vectorstore.add_documents(documents)
        return ids
    
    def similarity_search(
        self,
        collection_name: str,
        query: str,
        k: int = 5,
        filter: Optional[Dict[str, Any]] = None,
    ) -> List[Document]:
        """
        Search for similar documents.
        
        Args:
            collection_name: Collection to search in
            query: Search query text
            k: Number of results to return
            filter: Optional metadata filter
        
        Returns:
            List of similar Document objects
        """
        vectorstore = self.get_or_create_collection(collection_name)
        
        if filter:
            return vectorstore.similarity_search(query, k=k, filter=filter)
        return vectorstore.similarity_search(query, k=k)
    
    def similarity_search_with_score(
        self,
        collection_name: str,
        query: str,
        k: int = 5,
    ) -> List[tuple[Document, float]]:
        """Search with relevance scores."""
        vectorstore = self.get_or_create_collection(collection_name)
        return vectorstore.similarity_search_with_score(query, k=k)
    
    def delete_document(self, collection_name: str, document_id: str):
        """
        Delete all chunks for a document.
        
        Args:
            collection_name: Collection containing the document
            document_id: Document ID to delete
        """
        vectorstore = self.get_or_create_collection(collection_name)
        # Delete by metadata filter
        vectorstore.delete(where={"document_id": document_id})
    
    def delete_collection(self, collection_name: str):
        """Delete an entire collection."""
        try:
            self.client.delete_collection(collection_name)
            self._vectorstores.pop(collection_name, None)
        except Exception:
            pass  # Collection might not exist
    
    def get_retriever(self, collection_name: str, k: int = 5):
        """
        Get a retriever for RAG chains.
        
        Args:
            collection_name: Collection to retrieve from
            k: Number of documents to retrieve
        
        Returns:
            LangChain retriever object
        """
        vectorstore = self.get_or_create_collection(collection_name)
        return vectorstore.as_retriever(search_kwargs={"k": k})
    
    def get_collection_stats(self, collection_name: str) -> Dict[str, Any]:
        """Get statistics about a collection."""
        try:
            collection = self.client.get_collection(collection_name)
            return {
                "name": collection_name,
                "count": collection.count(),
            }
        except Exception:
            return {"name": collection_name, "count": 0}


# Singleton instance
_vector_store_instance: Optional[VectorStoreService] = None


def get_vector_store() -> VectorStoreService:
    """Get singleton vector store service instance."""
    global _vector_store_instance
    if _vector_store_instance is None:
        _vector_store_instance = VectorStoreService()
    return _vector_store_instance
