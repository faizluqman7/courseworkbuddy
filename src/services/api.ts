import type { DecompositionResponse } from '@/types';

const API_BASE = '/api';

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
