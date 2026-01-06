"""RAG chain for context-aware generation."""

from typing import List, Optional, Dict, Any
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from langchain_core.documents import Document
from langchain_core.messages import BaseMessage

from services.langchain_service import get_langchain_service
from services.vector_store import get_vector_store


class RAGChain:
    """Retrieval-Augmented Generation chain for coursework Q&A."""
    
    def __init__(self, collection_name: str):
        """
        Initialize RAG chain for a specific collection.
        
        Args:
            collection_name: Vector store collection to retrieve from
        """
        self.collection_name = collection_name
        self.langchain = get_langchain_service()
        self.vector_store = get_vector_store()
    
    def _format_docs(self, docs: List[Document]) -> str:
        """Format retrieved documents for context injection."""
        formatted = []
        for i, doc in enumerate(docs, 1):
            chunk_idx = doc.metadata.get('chunk_index', i)
            formatted.append(f"[Chunk {chunk_idx}]\n{doc.page_content}")
        return "\n\n---\n\n".join(formatted)
    
    def retrieve_context(
        self,
        query: str,
        k: int = 5,
        filter: Optional[Dict[str, Any]] = None,
    ) -> List[Document]:
        """
        Retrieve relevant context without generation.
        
        Args:
            query: Search query
            k: Number of documents to retrieve
            filter: Optional metadata filter
        
        Returns:
            List of relevant Document objects
        """
        return self.vector_store.similarity_search(
            self.collection_name, query, k=k, filter=filter
        )
    
    def query(
        self,
        question: str,
        system_prompt: Optional[str] = None,
        k: int = 5,
        filter: Optional[Dict[str, Any]] = None,
    ) -> str:
        """
        Query the RAG chain with a question.
        
        Args:
            question: User's question
            system_prompt: Optional system prompt override
            k: Number of documents to retrieve
            filter: Optional metadata filter
        
        Returns:
            Generated response string
        """
        retriever = self.vector_store.get_retriever(self.collection_name, k=k)
        
        default_system = """You are a helpful assistant for university students.
Use the following context from their coursework specification to answer questions.
If you cannot find the answer in the context, say so clearly.
Do not make up information that is not in the context.

Context:
{context}"""
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt or default_system),
            ("human", "{question}"),
        ])
        
        chain = (
            {
                "context": retriever | self._format_docs,
                "question": RunnablePassthrough(),
            }
            | prompt
            | self.langchain.get_llm(fast=True)
            | StrOutputParser()
        )
        
        return chain.invoke(question)
    
    def query_with_history(
        self,
        question: str,
        history: List[BaseMessage],
        system_prompt: Optional[str] = None,
        k: int = 5,
    ) -> str:
        """
        Query with conversation history for multi-turn chat.
        
        Args:
            question: Current question
            history: List of previous messages
            system_prompt: Optional system prompt override
            k: Number of documents to retrieve
        
        Returns:
            Generated response string
        """
        # Retrieve context based on current question
        context_docs = self.retrieve_context(question, k=k)
        context = self._format_docs(context_docs)
        
        default_system = """You are a helpful assistant for university students working on their coursework.
Use the following context from their coursework specification to answer questions.
Be concise but thorough. If you cannot find the answer in the context, say so.

IMPORTANT RULES:
1. Guide their thinking, DO NOT write code or solutions for them
2. If asked to solve something, explain the approach but don't implement it
3. Cite relevant parts of the specification when helpful

Context from coursework specification:
{context}"""
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", (system_prompt or default_system).format(context=context)),
            MessagesPlaceholder(variable_name="history"),
            ("human", "{question}"),
        ])
        
        chain = prompt | self.langchain.get_llm(fast=True) | StrOutputParser()
        
        return chain.invoke({
            "history": history,
            "question": question,
        })
