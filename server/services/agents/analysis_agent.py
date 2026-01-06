"""Analysis Agent - performs coursework decomposition with RAG."""

import json
from typing import Any, Dict

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import PydanticOutputParser

from services.agents.base import BaseAgent
from services.langchain_service import get_langchain_service
from services.rag_chain import RAGChain
from models.schemas import DecompositionResponse
from prompts.decomposer import DECOMPOSER_SYSTEM_PROMPT


class AnalysisAgent(BaseAgent):
    """Agent responsible for coursework analysis and decomposition."""
    
    def __init__(self):
        super().__init__(
            name="AnalysisAgent",
            description="Analyzes coursework specifications and creates comprehensive implementation guides",
        )
        self.langchain = get_langchain_service()
    
    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze coursework and generate decomposition.
        
        Input:
            - pdf_text: str - Extracted PDF text
            - collection_name: str - Vector store collection for RAG
            - document_id: str - Document identifier
        
        Output:
            - decomposition: DecompositionResponse
            - session_id: str - For follow-up chat
        """
        pdf_text = input_data.get("pdf_text")
        collection_name = input_data.get("collection_name")
        document_id = input_data.get("document_id")
        
        if not pdf_text:
            raise ValueError("pdf_text is required")
        
        # Truncate for initial analysis
        # Full content is available in vector store for Q&A
        max_chars = 50000
        truncated_text = pdf_text[:max_chars]
        if len(pdf_text) > max_chars:
            truncated_text += "\n\n[Text truncated - full content available for Q&A via chat]"
        
        # Build the prompt
        prompt = ChatPromptTemplate.from_messages([
            ("system", DECOMPOSER_SYSTEM_PROMPT),
            ("human", """Analyze this coursework specification and create a comprehensive Implementation Guide.

## PDF Content

{pdf_content}

---

Create a complete Implementation Guide with all required fields.
Return valid JSON only."""),
        ])
        
        # Create chain with structured output
        chain = prompt | self.langchain.get_llm()
        
        try:
            # Get raw response
            response = chain.invoke({"pdf_content": truncated_text})
            response_text = response.content if hasattr(response, 'content') else str(response)
            
            # Parse JSON response
            result = self._parse_response(response_text)
            
        except Exception as e:
            print(f"Analysis agent error: {e}")
            # Fallback to legacy decomposer if LangChain fails
            from services.ai_decomposer import decompose_coursework
            result = decompose_coursework(pdf_text)
        
        # Create session ID for follow-up chat
        session_id = f"{document_id}:chat"
        
        return {
            "decomposition": result,
            "session_id": session_id,
            "document_id": document_id,
            "collection_name": collection_name,
        }
    
    def _parse_response(self, response_text: str) -> DecompositionResponse:
        """Parse LLM response into DecompositionResponse."""
        from services.ai_decomposer import repair_json
        
        # Clean and repair JSON
        cleaned = repair_json(response_text)
        data = json.loads(cleaned)
        
        # Use existing parsing logic from ai_decomposer
        from services.ai_decomposer import (
            Task, Milestone, TermDefinition, MarkingCriterion,
            GetStartedStep, PrioritizationTier, WeeklySchedule, DirectoryEntry
        )
        
        # Parse tasks
        tasks = []
        for task_data in data.get("tasks", []):
            try:
                tasks.append(Task(
                    task_id=str(task_data.get("task_id", f"t{len(tasks)+1}")),
                    title=str(task_data.get("title", "Untitled Task")),
                    description=str(task_data.get("description", "")),
                    estimated_time=str(task_data.get("estimated_time", "Unknown")),
                    related_files=list(task_data.get("related_files", [])) if task_data.get("related_files") else [],
                    pdf_snippet=str(task_data.get("pdf_snippet", "")) if task_data.get("pdf_snippet") else None,
                    commands=list(task_data.get("commands", [])) if task_data.get("commands") else [],
                    prerequisites=list(task_data.get("prerequisites", [])) if task_data.get("prerequisites") else [],
                    status=str(task_data.get("status", "todo")),
                    priority=int(task_data.get("priority")) if task_data.get("priority") is not None else None,
                ))
            except Exception as e:
                print(f"Error parsing task: {e}")
                continue
        
        # Parse milestones
        milestones = []
        for milestone_data in data.get("milestones", []):
            try:
                milestones.append(Milestone(
                    id=str(milestone_data.get("id", f"m{len(milestones)+1}")),
                    title=str(milestone_data.get("title", "Untitled Milestone")),
                    description=str(milestone_data.get("description", "")) if milestone_data.get("description") else None,
                    summary=str(milestone_data.get("summary", "")) if milestone_data.get("summary") else None,
                    tasks=list(milestone_data.get("tasks", [])) if milestone_data.get("tasks") else [],
                ))
            except Exception as e:
                print(f"Error parsing milestone: {e}")
                continue
        
        # Parse terminology
        terminology = []
        for term_data in data.get("terminology", []):
            try:
                terminology.append(TermDefinition(
                    term=str(term_data.get("term", "")),
                    definition=str(term_data.get("definition", "")),
                    example=str(term_data.get("example", "")) if term_data.get("example") else None,
                ))
            except Exception:
                continue
        
        # Parse marking criteria
        marking_criteria = []
        for mc_data in data.get("marking_criteria", []):
            try:
                marking_criteria.append(MarkingCriterion(
                    component=str(mc_data.get("component", "")),
                    percentage=int(mc_data.get("percentage")) if mc_data.get("percentage") is not None else None,
                    description=str(mc_data.get("description", "")),
                    priority=str(mc_data.get("priority", "essential")),
                ))
            except Exception:
                continue
        
        # Parse get started steps
        get_started_steps = []
        for step_data in data.get("get_started_steps", []):
            try:
                get_started_steps.append(GetStartedStep(
                    step_number=int(step_data.get("step_number", len(get_started_steps)+1)),
                    title=str(step_data.get("title", "")),
                    description=str(step_data.get("description", "")),
                    commands=list(step_data.get("commands", [])) if step_data.get("commands") else [],
                    expected_output=str(step_data.get("expected_output", "")) if step_data.get("expected_output") else None,
                ))
            except Exception:
                continue
        
        # Parse prioritization tiers
        prioritization_tiers = []
        for tier_data in data.get("prioritization_tiers", []):
            try:
                prioritization_tiers.append(PrioritizationTier(
                    tier=str(tier_data.get("tier", "")),
                    description=str(tier_data.get("description", "")),
                    time_estimate=str(tier_data.get("time_estimate", "")),
                    task_ids=list(tier_data.get("task_ids", [])) if tier_data.get("task_ids") else [],
                ))
            except Exception:
                continue
        
        # Parse recommended schedule
        recommended_schedule = []
        for week_data in data.get("recommended_schedule", []):
            try:
                recommended_schedule.append(WeeklySchedule(
                    week=int(week_data.get("week", len(recommended_schedule)+1)),
                    title=str(week_data.get("title", "")),
                    task_ids=list(week_data.get("task_ids", [])) if week_data.get("task_ids") else [],
                    hours_estimate=int(week_data.get("hours_estimate", 0)),
                ))
            except Exception:
                continue
        
        # Parse directory structure
        directory_structure = []
        for dir_data in data.get("directory_structure", []):
            try:
                directory_structure.append(DirectoryEntry(
                    path=str(dir_data.get("path", "")),
                    type=str(dir_data.get("type", "file")),
                    description=str(dir_data.get("description", "")) if dir_data.get("description") else None,
                ))
            except Exception:
                continue
        
        # Track extraction warnings
        extraction_warnings = []
        if not tasks:
            extraction_warnings.append("tasks")
            tasks = [Task(
                task_id="fallback-1",
                title="Review Specifications Manually",
                description="Could not extract specific tasks. Please review your coursework specifications directly.",
                estimated_time="Varies",
                status="todo"
            )]
        if not marking_criteria:
            extraction_warnings.append("marking_criteria")
        if not data.get("deadline"):
            extraction_warnings.append("deadline")
        
        return DecompositionResponse(
            tasks=tasks,
            milestones=milestones,
            setup_instructions=list(data.get("setup_instructions", [])) if data.get("setup_instructions") else [],
            course_name=str(data.get("course_name", "")) if data.get("course_name") else None,
            total_estimated_time=str(data.get("total_estimated_time", "")) if data.get("total_estimated_time") else None,
            summary_overview=str(data.get("summary_overview", "")) if data.get("summary_overview") else None,
            key_deliverables=list(data.get("key_deliverables", [])) if data.get("key_deliverables") else [],
            what_you_need_to_do=str(data.get("what_you_need_to_do", "")) if data.get("what_you_need_to_do") else None,
            deadline=str(data.get("deadline", "")) if data.get("deadline") else None,
            deadline_note=str(data.get("deadline_note", "")) if data.get("deadline_note") else None,
            get_started_steps=get_started_steps,
            directory_structure=directory_structure,
            terminology=terminology,
            marking_criteria=marking_criteria,
            prioritization_tiers=prioritization_tiers,
            recommended_schedule=recommended_schedule,
            constraints=list(data.get("constraints", [])) if data.get("constraints") else [],
            debugging_tips=list(data.get("debugging_tips", [])) if data.get("debugging_tips") else [],
            extraction_warnings=extraction_warnings,
        )
