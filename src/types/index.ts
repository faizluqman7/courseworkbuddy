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

export interface DecompositionResponse {
    tasks: Task[];
    milestones: Milestone[];
    setup_instructions?: string[];
    course_name?: string;
    total_estimated_time?: string;
    summary_overview?: string;
    key_deliverables?: string[];
    what_you_need_to_do?: string;
}

export interface DecompositionRequest {
    file: File;
    course_url?: string;
    repo_url?: string;
}
