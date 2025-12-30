import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    FolderOpen,
    Calendar,
    Clock,
    Trash2,
    Plus,
    Loader2,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { listCourseworks, deleteCoursework, ApiError } from '@/services/api';
import type { CourseworkSummary } from '@/services/api';

export function Dashboard() {
    const [courseworks, setCourseworks] = useState<CourseworkSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const navigate = useNavigate();

    // Redirect if not authenticated
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            navigate('/');
        }
    }, [isAuthenticated, authLoading, navigate]);

    // Fetch courseworks
    useEffect(() => {
        if (isAuthenticated) {
            fetchCourseworks();
        }
    }, [isAuthenticated]);

    const fetchCourseworks = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await listCourseworks();
            setCourseworks(data);
        } catch (err) {
            const message = err instanceof ApiError ? err.message : 'Failed to load courseworks';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!confirm('Are you sure you want to delete this coursework? This cannot be undone.')) {
            return;
        }

        setDeletingId(id);
        try {
            await deleteCoursework(id);
            setCourseworks(prev => prev.filter(c => c.id !== id));
        } catch (err) {
            const message = err instanceof ApiError ? err.message : 'Failed to delete';
            alert(message);
        } finally {
            setDeletingId(null);
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const getProgress = (cw: CourseworkSummary) => {
        if (cw.total_tasks === 0) return 0;
        return Math.round((cw.completed_tasks / cw.total_tasks) * 100);
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-6 py-12">
            {/* Header */}
            <div className="flex items-center justify-between mb-12">
                <div>
                    <h1 className="text-4xl font-bold mb-2">My Courseworks</h1>
                    <p className="text-[var(--color-text-secondary)]">
                        Your saved roadmaps and progress tracking
                    </p>
                </div>
                <Link to="/">
                    <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        New Analysis
                    </Button>
                </Link>
            </div>

            {/* Error */}
            {error && (
                <div className="mb-8 p-4 rounded-2xl bg-[var(--color-error)]/10 border border-[var(--color-error)]/20 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-[var(--color-error)] flex-shrink-0 mt-0.5" />
                    <p className="text-[var(--color-error)]">{error}</p>
                    <Button variant="ghost" size="sm" onClick={fetchCourseworks} className="ml-auto">
                        Retry
                    </Button>
                </div>
            )}

            {/* Loading */}
            {isLoading ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="glass rounded-3xl p-6 animate-pulse">
                            <div className="h-6 bg-[var(--color-surface-elevated)] rounded mb-4 w-3/4" />
                            <div className="h-4 bg-[var(--color-surface-elevated)] rounded mb-2 w-1/2" />
                            <div className="h-4 bg-[var(--color-surface-elevated)] rounded w-1/3" />
                        </div>
                    ))}
                </div>
            ) : courseworks.length === 0 ? (
                /* Empty State */
                <div className="text-center py-20">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-[var(--color-surface-elevated)] flex items-center justify-center">
                        <FolderOpen className="w-10 h-10 text-[var(--color-text-muted)]" />
                    </div>
                    <h2 className="text-2xl font-bold mb-3">No courseworks yet</h2>
                    <p className="text-[var(--color-text-secondary)] mb-8 max-w-md mx-auto">
                        Upload a PDF specification to generate your first roadmap, then save it here for easy access.
                    </p>
                    <Link to="/">
                        <Button size="lg">
                            <Plus className="w-5 h-5 mr-2" />
                            Analyze Your First PDF
                        </Button>
                    </Link>
                </div>
            ) : (
                /* Coursework Grid */
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courseworks.map(cw => {
                        const progress = getProgress(cw);
                        return (
                            <Link
                                key={cw.id}
                                to={`/coursework/${cw.id}`}
                                className="glass rounded-3xl p-6 hover:border-[var(--color-primary)]/40 hover:-translate-y-1 transition-all group"
                            >
                                {/* Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <h3 className="text-lg font-bold group-hover:text-[var(--color-primary)] transition-colors line-clamp-2">
                                        {cw.course_name}
                                    </h3>
                                    <button
                                        onClick={(e) => handleDelete(cw.id, e)}
                                        disabled={deletingId === cw.id}
                                        className="p-2 rounded-lg hover:bg-[var(--color-error)]/10 text-[var(--color-text-muted)] hover:text-[var(--color-error)] transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        {deletingId === cw.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Trash2 className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>

                                {/* Deadline */}
                                {cw.deadline && (
                                    <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] mb-3">
                                        <Calendar className="w-4 h-4" />
                                        <span>Due: {cw.deadline_note || cw.deadline}</span>
                                    </div>
                                )}

                                {/* Progress */}
                                <div className="mb-4">
                                    <div className="flex items-center justify-between text-sm mb-2">
                                        <span className="text-[var(--color-text-muted)]">Progress</span>
                                        <span className="font-medium">{progress}%</span>
                                    </div>
                                    <div className="h-2 bg-[var(--color-surface-elevated)] rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all ${progress === 100
                                                ? 'bg-[var(--color-success)]'
                                                : 'bg-[var(--color-primary)]'
                                                }`}
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="flex items-center gap-4 text-sm text-[var(--color-text-muted)]">
                                    <div className="flex items-center gap-1.5">
                                        <CheckCircle2 className="w-4 h-4" />
                                        {cw.completed_tasks}/{cw.total_tasks} tasks
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Clock className="w-4 h-4" />
                                        {formatDate(cw.updated_at)}
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
