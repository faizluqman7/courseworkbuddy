"""Q&A Agent - handles follow-up questions with conversation memory."""

from typing import Any, Dict, List, Optional
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage, BaseMessage
from langchain_core.output_parsers import StrOutputParser

from services.agents.base import BaseAgent
from services.langchain_service import get_langchain_service
from services.rag_chain import RAGChain


class ConversationMemory:
    """
    Simple in-memory conversation storage.
    
    For production, this should be persisted to PostgreSQL.
    """
    
    _sessions: Dict[str, List[BaseMessage]] = {}
    _max_history: int = 20  # Keep last 20 messages per session
    
    @classmethod
    def get_history(cls, session_id: str, limit: int = 10) -> List[BaseMessage]:
        """Get conversation history for a session."""
        history = cls._sessions.get(session_id, [])
        return history[-limit:] if limit else history
    
    @classmethod
    def add_message(cls, session_id: str, message: BaseMessage):
        """Add a message to session history."""
        if session_id not in cls._sessions:
            cls._sessions[session_id] = []
        
        cls._sessions[session_id].append(message)
        
        # Trim to max history
        if len(cls._sessions[session_id]) > cls._max_history:
            cls._sessions[session_id] = cls._sessions[session_id][-cls._max_history:]
    
    @classmethod
    def add_exchange(cls, session_id: str, user_message: str, assistant_message: str):
        """Add a user-assistant exchange to history."""
        cls.add_message(session_id, HumanMessage(content=user_message))
        cls.add_message(session_id, AIMessage(content=assistant_message))
    
    @classmethod
    def clear(cls, session_id: str):
        """Clear history for a session."""
        cls._sessions.pop(session_id, None)
    
    @classmethod
    def get_session_count(cls) -> int:
        """Get number of active sessions."""
        return len(cls._sessions)
    
    @classmethod
    def cleanup_empty_sessions(cls):
        """Remove empty sessions."""
        empty = [k for k, v in cls._sessions.items() if not v]
        for k in empty:
            del cls._sessions[k]


class QAAgent(BaseAgent):
    """Agent for answering follow-up questions about coursework using RAG."""
    
    def __init__(self):
        super().__init__(
            name="QAAgent",
            description="Answers student questions about their coursework using RAG with conversation memory",
        )
        self.langchain = get_langchain_service()
    
    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Answer a follow-up question about coursework.
        
        Input:
            - question: str - User's question
            - session_id: str - Chat session identifier
            - collection_name: str - Vector store collection
        
        Output:
            - answer: str - Generated answer
            - sources: List[dict] - Retrieved context sources
            - images: List[str] - Paths to relevant images
        """
        question = input_data.get("question")
        session_id = input_data.get("session_id")
        collection_name = input_data.get("collection_name")
        
        if not all([question, session_id, collection_name]):
            raise ValueError("question, session_id, and collection_name are required")
        
        # Get conversation history
        history = ConversationMemory.get_history(session_id, limit=10)
        
        # Retrieve relevant context from vector store (text + image descriptions)
        rag = RAGChain(collection_name)
        context_docs = rag.retrieve_context(question, k=6)  # Increased for multimodal
        
        # Format context, noting image sources
        context_parts = []
        for i, doc in enumerate(context_docs):
            source_type = doc.metadata.get("source_type", "text")
            chunk_idx = doc.metadata.get("chunk_index", i)
            
            if source_type == "image":
                page_num = doc.metadata.get("page_number", "?")
                context_parts.append(
                    f"[Image from Page {page_num} - Chunk {chunk_idx}]\n{doc.page_content}"
                )
            else:
                context_parts.append(f"[Text Chunk {chunk_idx}]\n{doc.page_content}")
        
        context = "\n\n---\n\n".join(context_parts)
        
        # Build prompt with history and context
        prompt = ChatPromptTemplate.from_messages([
            ("system", """You are a helpful assistant for university students working on their coursework.
Use the following context from their coursework specification to answer questions.
The context may include both text and descriptions of diagrams/images from the PDF.
Be concise but thorough. If you cannot find the answer in the context, say so.

IMPORTANT RULES:
1. Guide their thinking, DO NOT write code or solutions for them
2. If asked to solve something, explain the approach conceptually but don't implement it
3. If asked about specific requirements, cite the relevant section from context
4. If referencing a diagram, mention which page it's from
5. Be encouraging and supportive - coursework can be stressful!

Context from coursework specification:
{context}"""),
            MessagesPlaceholder(variable_name="history"),
            ("human", "{question}"),
        ])
        
        chain = prompt | self.langchain.get_llm(fast=True) | StrOutputParser()
        
        answer = chain.invoke({
            "context": context,
            "history": history,
            "question": question,
        })
        
        # Save to conversation memory
        ConversationMemory.add_exchange(session_id, question, answer)
        
        # Prepare source references and collect images
        sources = []
        images = []
        
        for i, doc in enumerate(context_docs):
            source_type = doc.metadata.get("source_type", "text")
            
            source_info = {
                "chunk_id": doc.metadata.get("chunk_id", ""),
                "chunk_index": doc.metadata.get("chunk_index", i),
                "preview": doc.page_content[:200] + ("..." if len(doc.page_content) > 200 else ""),
                "source_type": source_type,
            }
            
            # If this is an image, include the path
            if source_type == "image":
                image_path = doc.metadata.get("image_path", "")
                if image_path:
                    source_info["image_path"] = image_path
                    # Only include unique images
                    if image_path not in images:
                        images.append(image_path)
            
            sources.append(source_info)
        
        return {
            "answer": answer,
            "sources": sources,
            "images": images,  # List of relevant image paths
        }

