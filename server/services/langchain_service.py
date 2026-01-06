"""LangChain service configuration for Google Gemini."""

import os
from functools import lru_cache
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from dotenv import load_dotenv

load_dotenv()


class LangChainService:
    """Singleton service for LangChain components."""
    
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialize()
        return cls._instance
    
    def _initialize(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable required")
        
        model_name = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
        
        # Primary LLM for complex tasks (analysis, decomposition)
        self.llm = ChatGoogleGenerativeAI(
            model=model_name,
            google_api_key=api_key,
            temperature=0.3,
            max_output_tokens=16384,
        )
        
        # Fast LLM for simple tasks (chat, quick queries)
        self.llm_fast = ChatGoogleGenerativeAI(
            model=model_name,
            google_api_key=api_key,
            temperature=0.5,
            max_output_tokens=2048,
        )
        
        # Embeddings for vector store (free tier compatible)
        self.embeddings = GoogleGenerativeAIEmbeddings(
            model="models/text-embedding-004",
            google_api_key=api_key,
        )
    
    def get_llm(self, fast: bool = False) -> ChatGoogleGenerativeAI:
        """Get LLM instance. Use fast=True for simple/chat tasks."""
        return self.llm_fast if fast else self.llm
    
    def get_embeddings(self) -> GoogleGenerativeAIEmbeddings:
        """Get embeddings model for vector operations."""
        return self.embeddings


@lru_cache()
def get_langchain_service() -> LangChainService:
    """Get singleton LangChain service instance."""
    return LangChainService()
