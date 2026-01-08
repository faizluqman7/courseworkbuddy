import type { DecompositionResponse } from '@/types';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export class ApiError extends Error {
    status: number;
    details?: unknown;

    constructor(message: string, status: number, details?: unknown) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.details = details;
    }
}

// Get the stored auth token
export function getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
}

// Set the auth token
export function setAuthToken(token: string): void {
    localStorage.setItem('auth_token', token);
}

// Remove the auth token
export function removeAuthToken(): void {
    localStorage.removeItem('auth_token');
}

// Create headers with optional auth
function createHeaders(includeAuth: boolean = false): HeadersInit {
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };

    if (includeAuth) {
        const token = getAuthToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
    }

    return headers;
}

// ============ Auth API ============

export interface User {
    id: string;
    email: string;
    name: string;
    created_at: string;
}

export interface AuthResponse {
    access_token: string;
    token_type: string;
    user: User;
}

export interface RegisterData {
    email: string;
    password: string;
    name: string;
}

export interface LoginData {
    email: string;
    password: string;
}

export async function register(data: RegisterData): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: createHeaders(),
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
            errorData.detail || 'Registration failed',
            response.status,
            errorData
        );
    }

    return response.json();
}

export async function login(data: LoginData): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: createHeaders(),
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
            errorData.detail || 'Login failed',
            response.status,
            errorData
        );
    }

    return response.json();
}

export async function getMe(): Promise<User> {
    const response = await fetch(`${API_BASE}/auth/me`, {
        method: 'GET',
        headers: createHeaders(true),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
            errorData.detail || 'Failed to get user',
            response.status,
            errorData
        );
    }

    return response.json();
}

export async function logout(): Promise<void> {
    const response = await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: createHeaders(true),
    });

    if (!response.ok && response.status !== 401) {
        // Ignore 401 - token may already be invalid
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
            errorData.detail || 'Logout failed',
            response.status,
            errorData
        );
    }
}

// ============ Courseworks API ============

export interface CourseworkSummary {
    id: string;
    course_name: string;
    deadline: string | null;
    deadline_note: string | null;
    created_at: string;
    updated_at: string;
    total_tasks: number;
    completed_tasks: number;
}

export interface CourseworkDetail {
    id: string;
    course_name: string;
    deadline: string | null;
    deadline_note: string | null;
    roadmap_data: DecompositionResponse;
    created_at: string;
    updated_at: string;
}

export interface CreateCourseworkData {
    course_name: string;
    deadline?: string | null;
    deadline_note?: string | null;
    roadmap_data: DecompositionResponse;
}

export interface UpdateCourseworkData {
    course_name?: string;
    roadmap_data?: DecompositionResponse;
}

export async function createCoursework(data: CreateCourseworkData): Promise<CourseworkDetail> {
    const response = await fetch(`${API_BASE}/courseworks`, {
        method: 'POST',
        headers: createHeaders(true),
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
            errorData.detail || 'Failed to save coursework',
            response.status,
            errorData
        );
    }

    return response.json();
}

export async function listCourseworks(): Promise<CourseworkSummary[]> {
    const response = await fetch(`${API_BASE}/courseworks`, {
        method: 'GET',
        headers: createHeaders(true),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
            errorData.detail || 'Failed to fetch courseworks',
            response.status,
            errorData
        );
    }

    return response.json();
}

export async function getCoursework(id: string): Promise<CourseworkDetail> {
    const response = await fetch(`${API_BASE}/courseworks/${id}`, {
        method: 'GET',
        headers: createHeaders(true),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
            errorData.detail || 'Failed to fetch coursework',
            response.status,
            errorData
        );
    }

    return response.json();
}

export async function updateCoursework(id: string, data: UpdateCourseworkData): Promise<CourseworkDetail> {
    const response = await fetch(`${API_BASE}/courseworks/${id}`, {
        method: 'PUT',
        headers: createHeaders(true),
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
            errorData.detail || 'Failed to update coursework',
            response.status,
            errorData
        );
    }

    return response.json();
}

export async function deleteCoursework(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/courseworks/${id}`, {
        method: 'DELETE',
        headers: createHeaders(true),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
            errorData.detail || 'Failed to delete coursework',
            response.status,
            errorData
        );
    }
}

// ============ Decomposition API ============

export async function decomposePdf(file: File): Promise<DecompositionResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE}/decompose`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
            errorData.detail || 'Failed to process PDF',
            response.status,
            errorData
        );
    }

    return response.json();
}

export async function healthCheck(): Promise<{ status: string }> {
    const response = await fetch(`${API_BASE}/health`);

    if (!response.ok) {
        throw new ApiError('Backend unavailable', response.status);
    }

    return response.json();
}
