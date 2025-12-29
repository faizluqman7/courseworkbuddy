"""AI Decomposer service using Google Gemini API."""

import json
import os
import re
import google.generativeai as genai
from prompts.decomposer import DECOMPOSER_SYSTEM_PROMPT, USER_PROMPT_TEMPLATE
from models.schemas import DecompositionResponse, Task, Milestone


class DecomposerError(Exception):
    """Raised when AI decomposition fails."""
    pass


def get_gemini_model():
    """Get configured Gemini model."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise DecomposerError("GEMINI_API_KEY environment variable not set")
    
    genai.configure(api_key=api_key)
    model_name = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
    
    return genai.GenerativeModel(
        model_name=model_name,
        generation_config=genai.GenerationConfig(
            temperature=0.3,
            max_output_tokens=8192,
            response_mime_type="application/json",
        ),
        system_instruction=DECOMPOSER_SYSTEM_PROMPT,
    )


def clean_json_response(text: str) -> str:
    """
    Clean the AI response to extract valid JSON.
    Handles markdown code blocks and other formatting issues.
    """
    if not text:
        return ""
    
    # Remove markdown code blocks if present
    text = text.strip()
    
    # Handle ```json ... ``` blocks
    if text.startswith("```"):
        # Find the end of the opening fence
        first_newline = text.find('\n')
        if first_newline > 0:
            text = text[first_newline + 1:]
        # Remove closing fence
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
    
    # Try to find JSON object boundaries
    start_idx = text.find('{')
    if start_idx == -1:
        return text
    
    # Find matching closing brace
    brace_count = 0
    end_idx = -1
    for i, char in enumerate(text[start_idx:], start=start_idx):
        if char == '{':
            brace_count += 1
        elif char == '}':
            brace_count -= 1
            if brace_count == 0:
                end_idx = i
                break
    
    if end_idx > start_idx:
        return text[start_idx:end_idx + 1]
    
    return text


def decompose_coursework(pdf_text: str) -> DecompositionResponse:
    """
    Use AI to decompose coursework specification into tasks.
    
    Args:
        pdf_text: Extracted text from the PDF
        
    Returns:
        DecompositionResponse with tasks, milestones, and setup instructions
        
    Raises:
        DecomposerError: If AI fails to process the content
    """
    model = get_gemini_model()
    
    # Truncate very long PDFs to avoid token limits
    max_chars = 50000  # ~12.5k tokens
    if len(pdf_text) > max_chars:
        pdf_text = pdf_text[:max_chars] + "\n\n[PDF text truncated for processing...]"
    
    # Prepare the user prompt
    user_prompt = USER_PROMPT_TEMPLATE.format(pdf_content=pdf_text)
    
    try:
        response = model.generate_content(user_prompt)
        
        # Get the response text
        if not response.text:
            raise DecomposerError("Empty response from AI")
        
        # Clean and parse the response
        content = clean_json_response(response.text)
        
        try:
            data = json.loads(content)
        except json.JSONDecodeError as e:
            # Log the problematic response for debugging
            print(f"Failed to parse JSON. Response length: {len(content)}")
            print(f"First 500 chars: {content[:500]}")
            print(f"Last 500 chars: {content[-500:]}")
            raise DecomposerError(f"Invalid JSON response: {str(e)[:100]}")
        
        # Convert to response model with safe defaults
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
        
        if not tasks:
            raise DecomposerError("No tasks could be extracted from the PDF")
        
        return DecompositionResponse(
            tasks=tasks,
            milestones=milestones,
            setup_instructions=list(data.get("setup_instructions", [])) if data.get("setup_instructions") else [],
            course_name=str(data.get("course_name", "")) if data.get("course_name") else None,
            total_estimated_time=str(data.get("total_estimated_time", "")) if data.get("total_estimated_time") else None,
            summary_overview=str(data.get("summary_overview", "")) if data.get("summary_overview") else None,
            key_deliverables=list(data.get("key_deliverables", [])) if data.get("key_deliverables") else [],
            what_you_need_to_do=str(data.get("what_you_need_to_do", "")) if data.get("what_you_need_to_do") else None,
        )
        
    except json.JSONDecodeError as e:
        raise DecomposerError(f"Failed to parse AI response as JSON: {e}")
    except Exception as e:
        if isinstance(e, DecomposerError):
            raise
        raise DecomposerError(f"AI processing failed: {e}")
