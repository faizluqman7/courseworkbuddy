import { useState } from 'react'
import { BookOpen, Search, X, ChevronRight } from 'lucide-react'
import type { TermDefinition } from '@/types'
import { cn } from '@/lib/utils'

interface TerminologyPanelProps {
    terminology: TermDefinition[];
}

export function TerminologyPanel({ terminology }: TerminologyPanelProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedTerm, setExpandedTerm] = useState<string | null>(null);

    if (terminology.length === 0) return null;

    const filteredTerms = searchQuery
        ? terminology.filter(t =>
            t.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.definition.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : terminology;

    return (
        <>
            {/* Card */}
            <button
                onClick={() => setIsOpen(true)}
                className="glass rounded-3xl overflow-hidden h-full w-full p-10 flex items-center gap-5 text-left hover:bg-[var(--color-surface-elevated)]/30 transition-colors group"
            >
                <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500">
                    <BookOpen className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                    <h2 className="text-2xl font-bold">📚 Terminology</h2>
                    <p className="text-base text-[var(--color-text-muted)] mt-1">
                        {terminology.length} terms defined
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
                            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500">
                                <BookOpen className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">📚 Terminology</h2>
                                <p className="text-base text-[var(--color-text-muted)] mt-1">
                                    {terminology.length} terms defined
                                </p>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="space-y-5">
                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]" />
                                <input
                                    type="text"
                                    placeholder="Search terms..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-base text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)]"
                                />
                            </div>

                            {/* Terms Grid */}
                            <div className="grid gap-3">
                                {filteredTerms.map((term, i) => (
                                    <div
                                        key={i}
                                        className={cn(
                                            "p-5 rounded-xl border transition-all cursor-pointer",
                                            expandedTerm === term.term
                                                ? "bg-[var(--color-primary)]/10 border-[var(--color-primary)]/30"
                                                : "bg-[var(--color-surface-elevated)] border-[var(--color-border)] hover:border-[var(--color-primary)]/30"
                                        )}
                                        onClick={() => setExpandedTerm(expandedTerm === term.term ? null : term.term)}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <h4 className="font-bold text-base text-[var(--color-primary-light)] mb-1">
                                                    {term.term}
                                                </h4>
                                                <p className="text-sm text-[var(--color-text-secondary)]">
                                                    {term.definition}
                                                </p>

                                                {expandedTerm === term.term && term.example && (
                                                    <div className="mt-3 p-3 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] animate-fade-in">
                                                        <span className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Example:</span>
                                                        <p className="text-sm text-[var(--color-text-secondary)] mt-1 italic">
                                                            {term.example}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                            {term.example && (
                                                <div className={cn(
                                                    "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm transition-all",
                                                    expandedTerm === term.term
                                                        ? "bg-[var(--color-primary)] text-white"
                                                        : "bg-[var(--color-background)] text-[var(--color-text-muted)]"
                                                )}>
                                                    {expandedTerm === term.term ? '−' : '+'}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {filteredTerms.length === 0 && (
                                <div className="text-center py-8 text-sm text-[var(--color-text-muted)]">
                                    No terms match "{searchQuery}"
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
