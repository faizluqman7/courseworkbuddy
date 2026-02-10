"""Qdrant Cloud vector store service."""

import os
from typing import List, Optional, Dict, Any
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams
from langchain_core.documents import Document
from langchain_qdrant import QdrantVectorStore

from services.langchain_service import get_langchain_service


class VectorStoreService:
    """Manage Qdrant Cloud vector store for document embeddings."""
    
    def __init__(self):
        """
        Initialize vector store service.
        
        Requires environment variables:
            - QDRANT_URL: Qdrant Cloud cluster URL
            - QDRANT_API_KEY: Qdrant Cloud API key
        """
        self.qdrant_url = os.getenv("QDRANT_URL", "")
        self.qdrant_api_key = os.getenv("QDRANT_API_KEY", "")
        
        if not self.qdrant_url or not self.qdrant_api_key:
            # Fallback to in-memory for local dev
            print("Warning: QDRANT_URL/QDRANT_API_KEY not set. Using in-memory storage.")
            self.client = QdrantClient(":memory:")
            self._is_memory = True
        else:
            self.client = QdrantClient(
                url=self.qdrant_url,
                api_key=self.qdrant_api_key,
            )
            self._is_memory = False
        
        self.langchain = get_langchain_service()
        self._vectorstores: Dict[str, QdrantVectorStore] = {}
        
        # Embedding dimension for gemini-embedding-001
        self._embedding_dim = 3072
    
    def _ensure_collection(self, collection_name: str):
        """Ensure collection exists with proper configuration."""
        try:
            self.client.get_collection(collection_name)
        except Exception:
            # Collection doesn't exist, create it
            self.client.create_collection(
                collection_name=collection_name,
                vectors_config=VectorParams(
                    size=self._embedding_dim,
                    distance=Distance.COSINE,
                ),
            )
    
    def get_or_create_collection(self, collection_name: str) -> QdrantVectorStore:
        """
        Get or create a LangChain Qdrant vector store.
        
        Args:
            collection_name: Name of the collection (usually 'coursework_{user_id}')
        
        Returns:
            QdrantVectorStore instance
        """
        if collection_name not in self._vectorstores:
            self._ensure_collection(collection_name)
            self._vectorstores[collection_name] = QdrantVectorStore(
                client=self.client,
                collection_name=collection_name,
                embedding=self.langchain.get_embeddings(),
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
            List of document IDs assigned
        """
        if not documents:
            return []
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
        try:
            from qdrant_client.models import Filter, FieldCondition, MatchValue
            
            self.client.delete(
                collection_name=collection_name,
                points_selector=Filter(
                    must=[
                        FieldCondition(
                            key="metadata.document_id",
                            match=MatchValue(value=document_id),
                        )
                    ]
                ),
            )
        except Exception as e:
            print(f"Delete document error: {e}")
    
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
            info = self.client.get_collection(collection_name)
            return {
                "name": collection_name,
                "count": info.points_count,
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
