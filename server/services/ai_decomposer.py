"""AI Decomposer service using Google Gemini API."""

import json
import os
import re
import google.generativeai as genai
from prompts.decomposer import DECOMPOSER_SYSTEM_PROMPT, USER_PROMPT_TEMPLATE
from models.schemas import (
    DecompositionResponse, Task, Milestone,
    TermDefinition, MarkingCriterion, GetStartedStep,
    PrioritizationTier, WeeklySchedule, DirectoryEntry
)


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
            max_output_tokens=16384,  # Increased for larger output
            response_mime_type="application/json",
        ),
        system_instruction=DECOMPOSER_SYSTEM_PROMPT,
    )


def repair_json(text: str) -> str:
    """
    Repair malformed JSON from AI responses.
    Handles: unterminated strings, missing brackets, truncation, markdown fences.
    Uses a state machine to properly track string boundaries.
    """
    if not text:
        return "{}"

    text = text.strip()

    # Remove markdown fences
    if text.startswith("```"):
        first_nl = text.find('\n')
        if first_nl > 0:
            text = text[first_nl + 1:]
        if "```" in text:
            text = text[:text.rfind("```")]
        text = text.strip()

    # Find JSON start
    start = text.find('{')
    if start == -1:
        return "{}"
    text = text[start:]

    # State machine to track JSON structure
    result = []
    i = 0
    stack = []  # Track open brackets: '{' or '['
    in_string = False
    escape_next = False

    while i < len(text):
        char = text[i]

        if escape_next:
            result.append(char)
            escape_next = False
            i += 1
            continue

        if char == '\\' and in_string:
            result.append(char)
            escape_next = True
            i += 1
            continue

        if char == '"' and not escape_next:
            in_string = not in_string
            result.append(char)
            i += 1
            continue

        if in_string:
            # Handle problematic characters in strings
            if char in '\n\r\t':
                # Replace literal newlines/tabs with escaped versions
                if char == '\n':
                    result.append('\\n')
                elif char == '\r':
                    result.append('\\r')
                elif char == '\t':
                    result.append('\\t')
            else:
                result.append(char)
            i += 1
            continue

        # Outside string - track structure
        if char == '{':
            stack.append('{')
            result.append(char)
        elif char == '[':
            stack.append('[')
            result.append(char)
        elif char == '}':
            if stack and stack[-1] == '{':
                stack.pop()
            result.append(char)
        elif char == ']':
            if stack and stack[-1] == '[':
                stack.pop()
            result.append(char)
        else:
            result.append(char)

        i += 1

        # Stop if we've closed the root object
        if not stack and result and result[0] == '{':
            break

    json_str = ''.join(result)

    # Fix unterminated string
    if in_string:
        json_str += '"'

    # Close any remaining open brackets (in reverse order)
    while stack:
        bracket = stack.pop()
        if bracket == '{':
            json_str += '}'
        else:
            json_str += ']'

    # Validate and attempt parse
    try:
        json.loads(json_str)
        return json_str
    except json.JSONDecodeError:
        # Try to fix common issues
        # Remove trailing comma before closing bracket
        json_str = re.sub(r',\s*([}\]])', r'\1', json_str)
        # Remove any content after the last valid closing brace
        last_brace = json_str.rfind('}')
        if last_brace > 0:
            json_str = json_str[:last_brace + 1]
        # Try again
        try:
            json.loads(json_str)
            return json_str
        except json.JSONDecodeError:
            # Ultimate fallback - return empty object
            print(f"JSON repair failed. Length: {len(json_str)}, First 200: {json_str[:200]}")
            return "{}"


def _parse_priority(priority_value) -> int | None:
    """
    Parse priority value - handles both integers and strings.
    
    Strings like 'essential', 'strong', 'excellence' are converted to priority levels:
    - 'essential' / 'high' / 'critical' -> 0 (highest)
    - 'strong' / 'medium' / 'important' -> 1
    - 'excellence' / 'low' / 'optional' / 'bonus' -> 2
    """
    if priority_value is None:
        return None
    
    # If already an integer, return it
    if isinstance(priority_value, int):
        return priority_value
    
    # Try to convert string to int first
    try:
        return int(priority_value)
    except (ValueError, TypeError):
        pass
    
    # Map string values to priority levels
    priority_str = str(priority_value).lower().strip()
    priority_map = {
        'essential': 0,
        'critical': 0,
        'high': 0,
        'must': 0,
        'strong': 1,
        'important': 1,
        'medium': 1,
        'should': 1,
        'excellence': 2,
        'bonus': 2,
        'optional': 2,
        'low': 2,
        'nice': 2,
    }
    
    for key, value in priority_map.items():
        if key in priority_str:
            return value
    
    # Default to medium priority
    return 1


def decompose_coursework(pdf_text: str) -> DecompositionResponse:
    """
    Use AI to decompose coursework specification into an Implementation Guide.
    
    Args:
        pdf_text: Extracted text from the PDF
        
    Returns:
        DecompositionResponse with tasks, milestones, and implementation guide fields
        
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
        content = repair_json(response.text)
        
        try:
            data = json.loads(content)
        except json.JSONDecodeError as e:
            # Log the problematic response for debugging
            print(f"Failed to parse JSON. Response length: {len(content)}")
            print(f"First 500 chars: {content[:500]}")
            print(f"Last 500 chars: {content[-500:]}")
            raise DecomposerError(f"Invalid JSON response: {str(e)[:100]}")
        
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
                    priority=_parse_priority(task_data.get("priority")),
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
            except Exception as e:
                print(f"Error parsing term: {e}")
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
            except Exception as e:
                print(f"Error parsing marking criterion: {e}")
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
            except Exception as e:
                print(f"Error parsing get started step: {e}")
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
            except Exception as e:
                print(f"Error parsing prioritization tier: {e}")
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
            except Exception as e:
                print(f"Error parsing schedule week: {e}")
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
            except Exception as e:
                print(f"Error parsing directory entry: {e}")
                continue
        
        # Track extraction warnings
        extraction_warnings = []

        # Failsafe: if no tasks extracted, create a fallback
        if not tasks:
            extraction_warnings.append("tasks")
            tasks = [Task(
                task_id="fallback-1",
                title="Review Specifications Manually",
                description="Could not extract specific tasks from your PDF. Please review your coursework specifications directly and create your own task breakdown.",
                estimated_time="Varies",
                status="todo"
            )]

        # Track other missing fields
        if not marking_criteria:
            extraction_warnings.append("marking_criteria")
        if not data.get("deadline"):
            extraction_warnings.append("deadline")
        if not data.get("key_deliverables"):
            extraction_warnings.append("key_deliverables")
        if not prioritization_tiers:
            extraction_warnings.append("prioritization_tiers")
        if not get_started_steps:
            extraction_warnings.append("get_started_steps")
        if not milestones:
            extraction_warnings.append("milestones")

        return DecompositionResponse(
            # Core fields
            tasks=tasks,
            milestones=milestones,
            setup_instructions=list(data.get("setup_instructions", [])) if data.get("setup_instructions") else [],
            course_name=str(data.get("course_name", "")) if data.get("course_name") else None,
            total_estimated_time=str(data.get("total_estimated_time", "")) if data.get("total_estimated_time") else None,
            summary_overview=str(data.get("summary_overview", "")) if data.get("summary_overview") else None,
            key_deliverables=list(data.get("key_deliverables", [])) if data.get("key_deliverables") else [],
            what_you_need_to_do=str(data.get("what_you_need_to_do", "")) if data.get("what_you_need_to_do") else None,
            
            # NEW: Implementation Guide fields
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
        
    except json.JSONDecodeError as e:
        raise DecomposerError(f"Failed to parse AI response as JSON: {e}")
    except Exception as e:
        if isinstance(e, DecomposerError):
            raise
        raise DecomposerError(f"AI processing failed: {e}")

