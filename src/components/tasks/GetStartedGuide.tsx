import { useState } from 'react'
import { Rocket, Terminal, FolderTree, Copy, Check, X, ChevronRight } from 'lucide-react'
import type { GetStartedStep, DirectoryEntry } from '@/types'
import { cn } from '@/lib/utils'

interface GetStartedGuideProps {
    steps: GetStartedStep[];
    directoryStructure?: DirectoryEntry[];
}

export function GetStartedGuide({ steps, directoryStructure }: GetStartedGuideProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
    const [copiedCommand, setCopiedCommand] = useState<string | null>(null);

    if (steps.length === 0 && (!directoryStructure || directoryStructure.length === 0)) {
        return null;
    }

    const toggleStep = (stepNumber: number) => {
        const newCompleted = new Set(completedSteps);
        if (newCompleted.has(stepNumber)) {
            newCompleted.delete(stepNumber);
        } else {
            newCompleted.add(stepNumber);
        }
        setCompletedSteps(newCompleted);
    };

    const copyCommand = async (command: string) => {
        await navigator.clipboard.writeText(command);
        setCopiedCommand(command);
        setTimeout(() => setCopiedCommand(null), 2000);
    };

    return (
        <>
            {/* Card */}
            <button
                onClick={() => setIsOpen(true)}
                className="glass rounded-3xl overflow-hidden h-full w-full p-10 flex items-center gap-5 text-left hover:bg-[var(--color-surface-elevated)]/30 transition-colors group"
            >
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600">
                    <Rocket className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                    <h2 className="text-2xl font-bold">🚀 Get Started Guide</h2>
                    <p className="text-base text-[var(--color-text-muted)] mt-1">
                        {completedSteps.size}/{steps.length} steps complete
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
                        className="relative w-full max-w-3xl max-h-[85vh] overflow-auto glass rounded-3xl p-8"
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
                            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600">
                                <Rocket className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">🚀 Get Started Guide</h2>
                                <p className="text-base text-[var(--color-text-muted)] mt-1">
                                    {completedSteps.size}/{steps.length} steps complete
                                </p>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="space-y-6">
                            {/* Directory Structure */}
                            {directoryStructure && directoryStructure.length > 0 && (
                                <div className="p-6 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)]">
                                    <div className="flex items-center gap-3 mb-4">
                                        <FolderTree className="w-5 h-5 text-[var(--color-primary)]" />
                                        <h3 className="font-bold text-lg">Project Structure</h3>
                                    </div>
                                    <div className="font-mono text-sm space-y-1.5">
                                        {directoryStructure.map((entry, i) => (
                                            <div key={i} className="flex items-start gap-3">
                                                <span className={cn(
                                                    "flex-shrink-0",
                                                    entry.type === 'directory' ? 'text-amber-400' : 'text-blue-400'
                                                )}>
                                                    {entry.type === 'directory' ? '📁' : '📄'}
                                                </span>
                                                <span className="text-[var(--color-text-primary)]">{entry.path}</span>
                                                {entry.description && (
                                                    <span className="text-[var(--color-text-muted)]">
                                                        — {entry.description}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Steps */}
                            <div className="space-y-4">
                                {steps.map((step) => {
                                    const isComplete = completedSteps.has(step.step_number);
                                    return (
                                        <div
                                            key={step.step_number}
                                            className={cn(
                                                "p-6 rounded-2xl border transition-all",
                                                isComplete
                                                    ? "bg-emerald-500/5 border-emerald-500/30"
                                                    : "bg-[var(--color-surface-elevated)] border-[var(--color-border)]"
                                            )}
                                        >
                                            <div className="flex items-start gap-4">
                                                <button
                                                    onClick={() => toggleStep(step.step_number)}
                                                    className={cn(
                                                        "flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-colors",
                                                        isComplete
                                                            ? "bg-emerald-500 text-white"
                                                            : "bg-[var(--color-primary)]/20 text-[var(--color-primary)]"
                                                    )}
                                                >
                                                    {isComplete ? <Check className="w-4 h-4" /> : step.step_number}
                                                </button>
                                                <div className="flex-1">
                                                    <h4 className={cn(
                                                        "font-bold text-base mb-1.5",
                                                        isComplete && "line-through opacity-60"
                                                    )}>
                                                        {step.title}
                                                    </h4>
                                                    <p className="text-[var(--color-text-secondary)] text-sm mb-3">
                                                        {step.description}
                                                    </p>

                                                    {step.commands && step.commands.length > 0 && (
                                                        <div className="space-y-2">
                                                            {step.commands.map((cmd, i) => (
                                                                <div
                                                                    key={i}
                                                                    className="group flex items-center gap-3 bg-[var(--color-background)] rounded-lg px-4 py-3 font-mono text-sm"
                                                                >
                                                                    <Terminal className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                                                    <code className="text-emerald-400 flex-1">$ {cmd}</code>
                                                                    <button
                                                                        onClick={() => copyCommand(cmd)}
                                                                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-[var(--color-surface-elevated)] rounded"
                                                                    >
                                                                        {copiedCommand === cmd ? (
                                                                            <Check className="w-4 h-4 text-emerald-400" />
                                                                        ) : (
                                                                            <Copy className="w-4 h-4 text-[var(--color-text-muted)]" />
                                                                        )}
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {step.expected_output && (
                                                        <div className="mt-3 p-3 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-sm">
                                                            <span className="text-[var(--color-text-muted)]">Expected: </span>
                                                            <span className="text-[var(--color-text-secondary)]">{step.expected_output}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
