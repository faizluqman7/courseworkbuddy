import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertCircle, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Roadmap } from '@/components/tasks/Roadmap';
import { useAuth } from '@/contexts/AuthContext';
import {
    getCoursework,
    updateCoursework,
    deleteCoursework,
    ApiError
} from '@/services/api';
import type { CourseworkDetail as CourseworkDetailType } from '@/services/api';
import type { DecompositionResponse } from '@/types';

export function CourseworkDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { isAuthenticated, isLoading: authLoading } = useAuth();

    const [coursework, setCoursework] = useState<CourseworkDetailType | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);

    // Redirect if not authenticated
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            navigate('/');
        }
    }, [isAuthenticated, authLoading, navigate]);

    // Fetch coursework
    useEffect(() => {
        if (isAuthenticated && id) {
            fetchCoursework();
        }
    }, [isAuthenticated, id]);

    const fetchCoursework = async () => {
        if (!id) return;
        setIsLoading(true);
        setError(null);
        try {
            const data = await getCoursework(id);
            setCoursework(data);
        } catch (err) {
            const message = err instanceof ApiError ? err.message : 'Failed to load coursework';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = useCallback(async (updatedData: DecompositionResponse) => {
        if (!id || !coursework) return;

        setIsSaving(true);
        try {
            await updateCoursework(id, { roadmap_data: updatedData });
            setCoursework(prev => prev ? { ...prev, roadmap_data: updatedData } : null);
            setHasChanges(false);
            setLastSaved(new Date());
        } catch (err) {
            const message = err instanceof ApiError ? err.message : 'Failed to save';
            setError(message);
        } finally {
            setIsSaving(false);
        }
    }, [id, coursework]);

    const handleChange = useCallback((updatedData: DecompositionResponse) => {
        setHasChanges(true);
        // Auto-save after 2 seconds of no changes
        const timeout = setTimeout(() => {
            handleSave(updatedData);
        }, 2000);
        return () => clearTimeout(timeout);
    }, [handleSave]);

    const handleDelete = async () => {
        if (!id) return;
        if (!confirm('Are you sure you want to delete this coursework? This cannot be undone.')) {
            return;
        }

        setIsDeleting(true);
        try {
            await deleteCoursework(id);
            navigate('/dashboard');
        } catch (err) {
            const message = err instanceof ApiError ? err.message : 'Failed to delete';
            setError(message);
            setIsDeleting(false);
        }
    };

    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-4xl mx-auto px-6 py-12">
                <div className="p-6 rounded-2xl bg-[var(--color-error)]/10 border border-[var(--color-error)]/20 flex items-start gap-4">
                    <AlertCircle className="w-6 h-6 text-[var(--color-error)] flex-shrink-0" />
                    <div>
                        <h2 className="text-lg font-bold text-[var(--color-error)] mb-2">Error</h2>
                        <p className="text-[var(--color-text-secondary)] mb-4">{error}</p>
                        <div className="flex gap-3">
                            <Button variant="outline" onClick={() => navigate('/dashboard')}>
                                Back to Dashboard
                            </Button>
                            <Button onClick={fetchCoursework}>
                                Try Again
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!coursework) {
        return null;
    }

    return (
        <div className="w-full flex flex-col items-center px-4 sm:px-6 lg:px-8 py-12">
            {/* Top Bar */}
            <div className="w-full max-w-5xl mb-8 flex items-center justify-between">
                <Link to="/dashboard">
                    <Button variant="ghost" className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Dashboard
                    </Button>
                </Link>

                <div className="flex items-center gap-3">
                    {/* Save Status */}
                    {lastSaved && !hasChanges && (
                        <span className="text-sm text-[var(--color-success)] flex items-center gap-1">
                            <Save className="w-4 h-4" />
                            Saved
                        </span>
                    )}
                    {isSaving && (
                        <span className="text-sm text-[var(--color-text-muted)] flex items-center gap-1">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Saving...
                        </span>
                    )}
                    {hasChanges && !isSaving && (
                        <Button variant="outline" size="sm" onClick={() => handleSave(coursework.roadmap_data)}>
                            <Save className="w-4 h-4 mr-2" />
                            Save
                        </Button>
                    )}

                    {/* Delete */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="text-[var(--color-error)] hover:text-[var(--color-error)] hover:bg-[var(--color-error)]/10"
                    >
                        {isDeleting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Trash2 className="w-4 h-4" />
                        )}
                    </Button>
                </div>
            </div>

            {/* Roadmap */}
            <Roadmap
                data={coursework.roadmap_data}
                onTaskChange={handleChange}
                isSaved={true}
            />
        </div>
    );
}
