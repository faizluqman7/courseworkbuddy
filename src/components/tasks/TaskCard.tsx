import { useState } from 'react'
import {
    Clock,
    FileCode,
    Terminal,
    ChevronDown,
    ChevronUp,
    CheckCircle2,
    Circle,
    PlayCircle,
    Quote
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Task } from '@/types'
import { cn } from '@/lib/utils'

interface TaskCardProps {
    task: Task
    onStatusChange?: (taskId: string, status: Task['status']) => void
}

export function TaskCard({ task, onStatusChange }: TaskCardProps) {
    const [isExpanded, setIsExpanded] = useState(false)

    const statusIcon = {
        todo: <Circle className="w-5 h-5 text-[var(--color-text-muted)]" />,
        in_progress: <PlayCircle className="w-5 h-5 text-[var(--color-warning)]" />,
        done: <CheckCircle2 className="w-5 h-5 text-[var(--color-success)]" />,
    }

    const statusLabel = {
        todo: 'To Do',
        in_progress: 'In Progress',
        done: 'Done',
    }

    const cycleStatus = () => {
        const statusOrder: Task['status'][] = ['todo', 'in_progress', 'done']
        const currentIndex = statusOrder.indexOf(task.status)
        const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length]
        onStatusChange?.(task.task_id, nextStatus)
    }

    const hasStarterPack = task.pdf_snippet || (task.related_files?.length ?? 0) > 0 || (task.commands?.length ?? 0) > 0

    return (
        <Card className={cn(
            "hover:border-[var(--color-border-hover)] cursor-pointer",
            task.status === 'done' && "opacity-60"
        )}>
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                cycleStatus()
                            }}
                            className="flex-shrink-0 mt-0.5 hover:scale-110 transition-transform"
                            title={`Status: ${statusLabel[task.status]}`}
                        >
                            {statusIcon[task.status]}
                        </button>
                        <div className="flex-1 min-w-0">
                            <CardTitle className={cn(
                                "text-base leading-tight",
                                task.status === 'done' && "line-through text-[var(--color-text-muted)]"
                            )}>
                                {task.title}
                            </CardTitle>
                        </div>
                    </div>

                    {task.priority === 0 && (
                        <Badge variant="warning" className="flex-shrink-0">
                            Priority 0
                        </Badge>
                    )}
                </div>
            </CardHeader>

            <CardContent className="space-y-3">
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                    {task.description}
                </p>

                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--color-text-muted)]">
                    {task.estimated_time && (
                        <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {task.estimated_time}
                        </span>
                    )}
                    {task.related_files && task.related_files.length > 0 && (
                        <span className="flex items-center gap-1">
                            <FileCode className="w-3.5 h-3.5" />
                            {task.related_files.length} file{task.related_files.length > 1 ? 's' : ''}
                        </span>
                    )}
                    {task.commands && task.commands.length > 0 && (
                        <span className="flex items-center gap-1">
                            <Terminal className="w-3.5 h-3.5" />
                            {task.commands.length} command{task.commands.length > 1 ? 's' : ''}
                        </span>
                    )}
                </div>

                {/* Prerequisites */}
                {task.prerequisites && task.prerequisites.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {task.prerequisites.map((prereq, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                                Requires: {prereq}
                            </Badge>
                        ))}
                    </div>
                )}

                {/* Starter Pack Toggle */}
                {hasStarterPack && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="w-full justify-between text-[var(--color-primary)] hover:text-[var(--color-primary-light)]"
                    >
                        <span>How to Start</span>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                )}

                {/* Expanded Starter Pack */}
                {isExpanded && hasStarterPack && (
                    <div className="space-y-4 pt-3 border-t border-[var(--color-border)] animate-fade-in">
                        {/* PDF Snippet */}
                        {task.pdf_snippet && (
                            <div className="space-y-2">
                                <h4 className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide flex items-center gap-1.5">
                                    <Quote className="w-3.5 h-3.5" />
                                    From the Spec
                                </h4>
                                <blockquote className="text-sm text-[var(--color-text-secondary)] bg-[var(--color-surface-elevated)] p-3 rounded-lg border-l-2 border-[var(--color-primary)] italic">
                                    "{task.pdf_snippet}"
                                </blockquote>
                            </div>
                        )}

                        {/* Related Files */}
                        {task.related_files && task.related_files.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide flex items-center gap-1.5">
                                    <FileCode className="w-3.5 h-3.5" />
                                    Files to Work On
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {task.related_files.map((file, index) => (
                                        <code
                                            key={index}
                                            className="text-xs bg-[var(--color-surface-elevated)] px-2 py-1 rounded text-[var(--color-primary-light)]"
                                        >
                                            {file}
                                        </code>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Commands */}
                        {task.commands && task.commands.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide flex items-center gap-1.5">
                                    <Terminal className="w-3.5 h-3.5" />
                                    Commands You May Need
                                </h4>
                                <div className="space-y-1.5">
                                    {task.commands.map((cmd, index) => (
                                        <div
                                            key={index}
                                            className="text-sm font-mono bg-[var(--color-background)] px-3 py-2 rounded-lg text-[var(--color-success)]"
                                        >
                                            $ {cmd}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
