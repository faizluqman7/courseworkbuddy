import { useState } from 'react'
import { Award, AlertCircle, X, ChevronRight } from 'lucide-react'
import type { MarkingCriterion } from '@/types'
import { cn } from '@/lib/utils'

interface MarkingCriteriaProps {
    criteria: MarkingCriterion[];
}

export function MarkingCriteria({ criteria }: MarkingCriteriaProps) {
    const [isOpen, setIsOpen] = useState(false);

    if (criteria.length === 0) {
        return null;
    }

    // Check if we have real percentages or it's a fallback
    const hasPercentages = criteria.some(c => c.percentage != null);
    const isFallback = criteria.length === 1 && criteria[0].component === "Marking Criteria";

    const getTierColor = (priority: string) => {
        switch (priority) {
            case 'essential': return 'bg-red-500';
            case 'strong': return 'bg-amber-500';
            case 'excellence': return 'bg-emerald-500';
            default: return 'bg-[var(--color-primary)]';
        }
    };

    const getTierBgColor = (priority: string) => {
        switch (priority) {
            case 'essential': return 'bg-red-500/10 border-red-500/30';
            case 'strong': return 'bg-amber-500/10 border-amber-500/30';
            case 'excellence': return 'bg-emerald-500/10 border-emerald-500/30';
            default: return 'bg-[var(--color-surface-elevated)] border-[var(--color-border)]';
        }
    };

    const getTierLabel = (priority: string) => {
        switch (priority) {
            case 'essential': return '🔴 Essential';
            case 'strong': return '🟡 Strong';
            case 'excellence': return '🟢 Excellence';
            default: return priority;
        }
    };

    return (
        <>
            {/* Card */}
            <button
                onClick={() => setIsOpen(true)}
                className="glass rounded-3xl overflow-hidden h-full w-full p-10 flex items-center gap-5 text-left hover:bg-[var(--color-surface-elevated)]/30 transition-colors group"
            >
                <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600">
                    <Award className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                    <h2 className="text-2xl font-bold">📊 Marking Criteria</h2>
                    <p className="text-base text-[var(--color-text-muted)] mt-1">
                        {hasPercentages
                            ? `${criteria.length} graded components`
                            : 'Grade breakdown'}
                    </p>
                </div>
                <ChevronRight className="w-6 h-6 text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)] group-hover:translate-x-1 transition-all" />
            </button>

            {/* Modal */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
                    onClick={() => setIsOpen(false)}
                >
                    <div
                        className="relative w-full max-w-2xl max-h-[80vh] overflow-auto glass rounded-3xl p-8"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close button */}
                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute top-4 right-4 p-2 rounded-full hover:bg-[var(--color-surface-elevated)] transition-colors"
                        >
                            <X className="w-5 h-5 text-[var(--color-text-muted)]" />
                        </button>

                        {/* Modal header */}
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600">
                                <Award className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">📊 Marking Criteria</h2>
                                <p className="text-base text-[var(--color-text-muted)] mt-1">
                                    {hasPercentages
                                        ? `${criteria.length} graded components`
                                        : 'Grade breakdown'}
                                </p>
                            </div>
                        </div>

                        {/* Content */}
                        {isFallback ? (
                            <div className="flex items-start gap-5 p-8 rounded-2xl bg-amber-500/10 border border-amber-500/30">
                                <AlertCircle className="w-7 h-7 text-amber-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="font-bold text-lg text-amber-400 mb-2">Marking Criteria Not Found</h3>
                                    <p className="text-base text-[var(--color-text-secondary)]">
                                        {criteria[0].description}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-5">
                                {criteria.map((criterion, i) => (
                                    <div
                                        key={i}
                                        className={cn(
                                            "p-6 rounded-2xl border transition-all",
                                            getTierBgColor(criterion.priority)
                                        )}
                                    >
                                        <div className="flex items-start justify-between gap-5 mb-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-4 mb-2">
                                                    <h3 className="font-bold text-lg">{criterion.component}</h3>
                                                    <span className="text-sm px-3 py-1.5 rounded-full bg-[var(--color-background)]/50 text-[var(--color-text-secondary)]">
                                                        {getTierLabel(criterion.priority)}
                                                    </span>
                                                </div>
                                                <p className="text-[var(--color-text-secondary)] text-base">
                                                    {criterion.description}
                                                </p>
                                            </div>
                                            {criterion.percentage != null && (
                                                <div className="flex-shrink-0 text-right">
                                                    <div className="text-3xl font-bold gradient-text">
                                                        {criterion.percentage}%
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {criterion.percentage != null && (
                                            <div className="h-3 bg-[var(--color-background)] rounded-full overflow-hidden">
                                                <div
                                                    className={cn("h-full rounded-full transition-all duration-700", getTierColor(criterion.priority))}
                                                    style={{ width: `${criterion.percentage}%` }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {hasPercentages && (
                                    <div className="mt-6 p-5 rounded-xl bg-[var(--color-surface-elevated)] border border-[var(--color-border)]">
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium text-lg text-[var(--color-text-secondary)]">Total</span>
                                            <span className="text-2xl font-bold gradient-text">
                                                {criteria.reduce((sum, c) => sum + (c.percentage || 0), 0)}%
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
