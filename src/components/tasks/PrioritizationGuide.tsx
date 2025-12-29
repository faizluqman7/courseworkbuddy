import { useState } from 'react'
import { Target, Clock, CheckSquare, X, ChevronRight } from 'lucide-react'
import type { PrioritizationTier, Task } from '@/types'
import { cn } from '@/lib/utils'

interface PrioritizationGuideProps {
    tiers: PrioritizationTier[];
    tasks: Task[];
}

export function PrioritizationGuide({ tiers, tasks }: PrioritizationGuideProps) {
    const [isOpen, setIsOpen] = useState(false);

    if (tiers.length === 0) return null;

    const getTierStyles = (tierName: string) => {
        const normalizedTier = tierName.toLowerCase();
        if (normalizedTier.includes('essential')) {
            return {
                gradient: 'from-red-500 to-rose-600',
                bg: 'bg-red-500/10',
                border: 'border-red-500/30',
                text: 'text-red-400',
                icon: '🔴',
                label: 'Essential'
            };
        }
        if (normalizedTier.includes('strong')) {
            return {
                gradient: 'from-amber-500 to-orange-500',
                bg: 'bg-amber-500/10',
                border: 'border-amber-500/30',
                text: 'text-amber-400',
                icon: '🟡',
                label: 'Strong'
            };
        }
        if (normalizedTier.includes('excellence')) {
            return {
                gradient: 'from-emerald-500 to-teal-500',
                bg: 'bg-emerald-500/10',
                border: 'border-emerald-500/30',
                text: 'text-emerald-400',
                icon: '🟢',
                label: 'Excellence'
            };
        }
        return {
            gradient: 'from-[var(--color-primary)] to-[var(--color-primary-dark)]',
            bg: 'bg-[var(--color-primary)]/10',
            border: 'border-[var(--color-primary)]/30',
            text: 'text-[var(--color-primary)]',
            icon: '⚪',
            label: tierName
        };
    };

    const getTasksForTier = (taskIds: string[]) => {
        return tasks.filter(t => taskIds.includes(t.task_id));
    };

    return (
        <>
            {/* Card */}
            <button
                onClick={() => setIsOpen(true)}
                className="glass rounded-3xl overflow-hidden h-full w-full p-10 flex items-center gap-5 text-left hover:bg-[var(--color-surface-elevated)]/30 transition-colors group"
            >
                <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600">
                    <Target className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                    <h2 className="text-2xl font-bold">🎯 Prioritization Guide</h2>
                    <p className="text-base text-[var(--color-text-muted)] mt-1">
                        What to focus on based on your goals
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
                            <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600">
                                <Target className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">🎯 Prioritization Guide</h2>
                                <p className="text-base text-[var(--color-text-muted)] mt-1">
                                    What to focus on based on your goals
                                </p>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="space-y-5">
                            {tiers.map((tier, i) => {
                                const styles = getTierStyles(tier.tier);
                                const tierTasks = getTasksForTier(tier.task_ids);
                                const completedCount = tierTasks.filter(t => t.status === 'done').length;

                                return (
                                    <div
                                        key={i}
                                        className={cn(
                                            "p-6 rounded-2xl border transition-all",
                                            styles.bg,
                                            styles.border
                                        )}
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-2xl",
                                                    styles.gradient
                                                )}>
                                                    {styles.icon}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-lg">{styles.label}</h3>
                                                    <p className="text-sm text-[var(--color-text-muted)]">
                                                        {tier.description}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
                                                    <Clock className="w-4 h-4" />
                                                    <span className="font-bold">{tier.time_estimate}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {tierTasks.length > 0 && (
                                            <div className="space-y-3 mt-4">
                                                <div className="flex items-center justify-between text-sm text-[var(--color-text-muted)] mb-2">
                                                    <span>{tierTasks.length} tasks</span>
                                                    <span className={styles.text}>{completedCount}/{tierTasks.length} done</span>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {tierTasks.slice(0, 5).map((task) => (
                                                        <div
                                                            key={task.task_id}
                                                            className={cn(
                                                                "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                                                                task.status === 'done'
                                                                    ? "bg-emerald-500/20 text-emerald-400 line-through"
                                                                    : "bg-[var(--color-background)] text-[var(--color-text-secondary)]"
                                                            )}
                                                        >
                                                            {task.title.length > 25 ? task.title.slice(0, 25) + '...' : task.title}
                                                        </div>
                                                    ))}
                                                    {tierTasks.length > 5 && (
                                                        <div className="px-3 py-1.5 rounded-lg text-sm bg-[var(--color-background)] text-[var(--color-text-muted)]">
                                                            +{tierTasks.length - 5} more
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            <div className="mt-6 p-5 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)]">
                                <div className="flex items-center gap-3 text-sm text-[var(--color-text-muted)]">
                                    <CheckSquare className="w-5 h-5" />
                                    <span>
                                        <strong className="text-[var(--color-text-primary)]">Pro tip:</strong> Complete all 🔴 Essential tasks first, then add 🟡 Strong features for better marks, and 🟢 Excellence for top grades.
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
