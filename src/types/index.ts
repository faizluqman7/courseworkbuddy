export type TaskStatus = 'todo' | 'in_progress' | 'done';

export interface Task {
    task_id: string;
    title: string;
    description: string;
    estimated_time: string;
    related_files: string[];
    pdf_snippet?: string;
    commands?: string[];
    prerequisites?: string[];
    status: TaskStatus;
    priority?: number;
}

export interface Milestone {
    id: string;
    title: string;
    description?: string;
    summary?: string;
    tasks: string[];
}

export interface TermDefinition {
    term: string;
    definition: string;
    example?: string;
}

export interface MarkingCriterion {
    component: string;
    percentage?: number;
    description: string;
    priority: 'essential' | 'strong' | 'excellence';
}

export interface GetStartedStep {
    step_number: number;
    title: string;
    description: string;
    commands: string[];
    expected_output?: string;
}

export interface PrioritizationTier {
    tier: 'Essential' | 'Strong' | 'Excellence';
    description: string;
    time_estimate: string;
    task_ids: string[];
}

export interface WeeklySchedule {
    week: number;
    title: string;
    task_ids: string[];
    hours_estimate: number;
}

export interface DirectoryEntry {
    path: string;
    type: 'file' | 'directory';
    description?: string;
}

export interface DecompositionResponse {
    // Core fields
    tasks: Task[];
    milestones: Milestone[];
    setup_instructions?: string[];
    course_name?: string;
    total_estimated_time?: string;
    summary_overview?: string;
    key_deliverables?: string[];
    what_you_need_to_do?: string;

    // Implementation Guide fields
    deadline?: string;
    deadline_note?: string;
    get_started_steps?: GetStartedStep[];
    directory_structure?: DirectoryEntry[];
    terminology?: TermDefinition[];
    marking_criteria?: MarkingCriterion[];
    prioritization_tiers?: PrioritizationTier[];
    recommended_schedule?: WeeklySchedule[];
    constraints?: string[];
    debugging_tips?: string[];

    // Extraction metadata
    extraction_warnings?: string[];

    // Session info for follow-up chat (new in v2)
    session_id?: string;
    document_id?: string;
}

export interface DecompositionRequest {
    file: File;
    course_url?: string;
    repo_url?: string;
}

// ============ Chat Types ============

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    sources?: ChatSource[];
    images?: string[];  // Relevant image paths for display
}

export interface ChatSource {
    chunk_id: string;
    chunk_index: number;
    preview: string;
    source_type?: 'text' | 'image';  // Type of source
    image_path?: string;  // Path if source is an image
}

export interface ChatRequest {
    question: string;
    session_id: string;
}

export interface ChatResponse {
    answer: string;
    sources: ChatSource[];
    images: string[];  // Relevant image paths for display
}
