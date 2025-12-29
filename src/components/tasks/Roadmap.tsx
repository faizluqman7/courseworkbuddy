import { useState, useCallback, useMemo } from 'react'
import {
    CheckCircle2,
    Circle,
    PlayCircle,
    Clock,
    ChevronDown,
    ChevronUp,
    FileCode,
    Terminal,
    Quote,
    Zap,
    Target,
    Trophy,
    Flag
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Task, DecompositionResponse, Milestone } from '@/types'
import { cn } from '@/lib/utils'

interface RoadmapProps {
    data: DecompositionResponse
}

export function Roadmap({ data }: RoadmapProps) {
    const [tasks, setTasks] = useState<Task[]>(data.tasks)
    const [expandedTask, setExpandedTask] = useState<string | null>(null)
    const [expandedMilestone, setExpandedMilestone] = useState<string | null>(
        data.milestones?.[0]?.id || null
    )

    // Group tasks by milestone
    const groupedTasks = useMemo(() => {
        if (data.milestones && data.milestones.length > 0) {
            return data.milestones.map(milestone => ({
                milestone,
                tasks: tasks.filter(t => milestone.tasks.includes(t.task_id))
            }))
        }
        // Fallback: create auto-groups of ~4 tasks each
        const groups: { milestone: Milestone; tasks: Task[] }[] = []
        const chunkSize = 4
        for (let i = 0; i < tasks.length; i += chunkSize) {
            groups.push({
                milestone: {
                    id: `auto-${i}`,
                    title: `Phase ${groups.length + 1}`,
                    tasks: []
                },
                tasks: tasks.slice(i, i + chunkSize)
            })
        }
        return groups
    }, [tasks, data.milestones])

    const handleStatusChange = useCallback((taskId: string, newStatus: Task['status']) => {
        setTasks(prev =>
            prev.map(task =>
                task.task_id === taskId ? { ...task, status: newStatus } : task
            )
        )
    }, [])

    const toggleExpand = (taskId: string) => {
        setExpandedTask(prev => prev === taskId ? null : taskId)
    }

    const toggleMilestone = (milestoneId: string) => {
        setExpandedMilestone(prev => prev === milestoneId ? null : milestoneId)
    }

    const completedTasks = tasks.filter(t => t.status === 'done').length
    const progress = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0

    const totalMins = tasks.reduce((acc, task) => {
        const match = task.estimated_time?.match(/(\d+)/)
        return acc + (match ? parseInt(match[1]) : 0)
    }, 0)

    const getStatusIcon = (status: Task['status']) => {
        switch (status) {
            case 'done':
                return <CheckCircle2 className="w-5 h-5 text-[var(--color-success)]" />
            case 'in_progress':
                return <PlayCircle className="w-5 h-5 text-[var(--color-warning)]" />
            default:
                return <Circle className="w-5 h-5 text-[var(--color-text-muted)]" />
        }
    }

    const cycleStatus = (task: Task, e: React.MouseEvent) => {
        e.stopPropagation()
        const statusOrder: Task['status'][] = ['todo', 'in_progress', 'done']
        const currentIndex = statusOrder.indexOf(task.status)
        const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length]
        handleStatusChange(task.task_id, nextStatus)
    }

    const getMilestoneProgress = (milestoneTasks: Task[]) => {
        const completed = milestoneTasks.filter(t => t.status === 'done').length
        return milestoneTasks.length > 0 ? Math.round((completed / milestoneTasks.length) * 100) : 0
    }

    return (
        <div className="w-full max-w-4xl space-y-16 animate-fade-in">
            {/* Header */}
            <div className="text-center">
                <div className="inline-flex items-center gap-3 mb-6">
                    <div className="p-4 rounded-3xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] glow">
                        <Target className="w-8 h-8 text-white" />
                    </div>
                </div>
                <h1 className="text-4xl sm:text-5xl font-bold mb-4">
                    {data.course_name || 'Your Learning Roadmap'}
                </h1>
                <p className="text-lg text-[var(--color-text-secondary)]">
                    {tasks.length} tasks across {groupedTasks.length} milestones
                </p>
            </div>

            {/* Overall Progress */}
            <div className="glass rounded-3xl p-10">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <Trophy className="w-6 h-6 text-[var(--color-success)]" />
                        <span className="text-lg font-medium">Overall Progress</span>
                    </div>
                    <span className="text-3xl font-bold gradient-text">{Math.round(progress)}%</span>
                </div>
                <div className="h-4 bg-[var(--color-surface-elevated)] rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-success)] transition-all duration-700 rounded-full"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <p className="text-[var(--color-text-muted)] mt-4 text-center">
                    {completedTasks} of {tasks.length} tasks • {data.total_estimated_time || `~${Math.round(totalMins / 60)}h`} total
                </p>
            </div>

            {/* Summary Overview */}
            {data.summary_overview && (
                <div className="glass rounded-3xl p-10 text-center">
                    <h2 className="text-xl font-semibold mb-4 text-[var(--color-primary-light)]">
                        📋 Overview
                    </h2>
                    <p className="text-lg text-[var(--color-text-secondary)] leading-relaxed max-w-3xl mx-auto">
                        {data.summary_overview}
                    </p>
                </div>
            )}

            {/* What You Need To Do */}
            {data.what_you_need_to_do && (
                <div className="glass rounded-3xl p-10 bg-gradient-to-br from-[var(--color-primary)]/5 to-transparent">
                    <h2 className="text-xl font-semibold mb-4 flex items-center justify-center gap-3">
                        <Target className="w-6 h-6 text-[var(--color-primary)]" />
                        What You Need to Do
                    </h2>
                    <p className="text-lg text-[var(--color-text-secondary)] leading-relaxed text-center max-w-3xl mx-auto">
                        {data.what_you_need_to_do}
                    </p>
                </div>
            )}

            {/* Key Deliverables */}
            {data.key_deliverables && data.key_deliverables.length > 0 && (
                <div className="glass rounded-3xl p-10">
                    <h2 className="text-xl font-semibold mb-6 flex items-center justify-center gap-3">
                        <Flag className="w-6 h-6 text-[var(--color-success)]" />
                        Key Deliverables
                    </h2>
                    <ul className="space-y-4 max-w-2xl mx-auto">
                        {data.key_deliverables.map((deliverable, i) => (
                            <li key={i} className="flex items-start gap-4 p-4 rounded-xl bg-[var(--color-surface-elevated)]/50">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--color-success)]/20 flex items-center justify-center text-sm font-bold text-[var(--color-success)]">
                                    {i + 1}
                                </div>
                                <span className="text-lg text-[var(--color-text-secondary)] pt-0.5">{deliverable}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Setup Instructions */}
            {data.setup_instructions && data.setup_instructions.length > 0 && (
                <div className="rounded-3xl p-10 bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/20">
                    <div className="flex items-start gap-6 max-w-3xl mx-auto">
                        <div className="p-3 rounded-2xl bg-[var(--color-warning)]/20">
                            <Zap className="w-8 h-8 text-[var(--color-warning)]" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-xl font-semibold text-[var(--color-warning)] mb-4">
                                Setup Required First
                            </h3>
                            <ul className="space-y-4">
                                {data.setup_instructions.map((instruction, i) => (
                                    <li key={i} className="flex items-start gap-3 text-[var(--color-text-secondary)]">
                                        <span className="text-[var(--color-warning)] mt-1.5">•</span>
                                        <span className="leading-relaxed">{instruction}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* Milestones */}
            <div className="space-y-8">
                {groupedTasks.map((group, groupIndex) => {
                    const isExpanded = expandedMilestone === group.milestone.id
                    const milestoneProgress = getMilestoneProgress(group.tasks)
                    const isComplete = milestoneProgress === 100

                    return (
                        <div key={group.milestone.id} className="relative group">
                            {/* Milestone Header */}
                            <button
                                onClick={() => toggleMilestone(group.milestone.id)}
                                className={cn(
                                    "w-full glass rounded-3xl p-8 text-left transition-all duration-300",
                                    "hover:border-[var(--color-primary)]/40 hover:translate-x-2",
                                    isExpanded && "border-[var(--color-primary)]/40 glow"
                                )}
                            >
                                <div className="flex items-center gap-6">
                                    {/* Milestone Icon */}
                                    <div className={cn(
                                        "flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center transition-colors duration-300",
                                        isComplete
                                            ? "bg-[var(--color-success)]/20"
                                            : "bg-[var(--color-primary)]/20"
                                    )}>
                                        {isComplete ? (
                                            <CheckCircle2 className="w-8 h-8 text-[var(--color-success)]" />
                                        ) : (
                                            <Flag className="w-8 h-8 text-[var(--color-primary)]" />
                                        )}
                                    </div>

                                    {/* Milestone Info */}
                                    <div className="flex-1 min-w-0 py-2">
                                        <div className="flex items-center gap-4 mb-2">
                                            <span className="text-sm font-mono text-[var(--color-primary-light)] tracking-wider">
                                                MILESTONE {groupIndex + 1}
                                            </span>
                                            <Badge variant={isComplete ? "success" : "outline"} className="text-xs px-3 py-1">
                                                {milestoneProgress}%
                                            </Badge>
                                        </div>
                                        <h2 className="text-2xl font-bold mb-2">{group.milestone.title}</h2>
                                        {group.milestone.description && (
                                            <p className="text-[var(--color-text-secondary)] leading-relaxed">
                                                {group.milestone.description}
                                            </p>
                                        )}
                                        <p className="text-sm text-[var(--color-text-muted)] mt-3">
                                            {group.tasks.filter(t => t.status === 'done').length} of {group.tasks.length} tasks complete
                                        </p>
                                    </div>

                                    {/* Expand Icon */}
                                    <div className="flex-shrink-0 px-2">
                                        {isExpanded ? (
                                            <ChevronUp className="w-6 h-6 text-[var(--color-text-muted)]" />
                                        ) : (
                                            <ChevronDown className="w-6 h-6 text-[var(--color-text-muted)]" />
                                        )}
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="mt-8 h-2 bg-[var(--color-surface-elevated)] rounded-full overflow-hidden">
                                    <div
                                        className={cn(
                                            "h-full transition-all duration-700 rounded-full",
                                            isComplete ? "bg-[var(--color-success)]" : "bg-[var(--color-primary)]"
                                        )}
                                        style={{ width: `${milestoneProgress}%` }}
                                    />
                                </div>
                            </button>

                            {/* Tasks List */}
                            {isExpanded && (
                                <div className="mt-6 ml-8 pl-8 border-l-2 border-[var(--color-border)] space-y-6 animate-fade-in">
                                    {group.tasks.map((task, taskIndex) => {
                                        const isTaskExpanded = expandedTask === task.task_id
                                        const hasDetails = task.pdf_snippet || (task.related_files?.length ?? 0) > 0 || (task.commands?.length ?? 0) > 0

                                        return (
                                            <div
                                                key={task.task_id}
                                                className={cn(
                                                    "glass rounded-2xl p-8 transition-all duration-300",
                                                    "hover:border-[var(--color-primary)]/30 hover:bg-[var(--color-surface-elevated)]/30",
                                                    task.status === 'done' && "opacity-60"
                                                )}
                                            >
                                                {/* Task Header */}
                                                <div className="flex items-start gap-6">
                                                    {/* Status Button */}
                                                    <button
                                                        onClick={(e) => cycleStatus(task, e)}
                                                        className="flex-shrink-0 mt-1 hover:scale-110 transition-transform"
                                                        title="Click to change status"
                                                    >
                                                        {getStatusIcon(task.status)}
                                                    </button>

                                                    {/* Task Content */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-3 flex-wrap mb-3">
                                                            <span className="text-xs font-mono text-[var(--color-text-muted)] uppercase tracking-wide">
                                                                Task {taskIndex + 1}
                                                            </span>
                                                            {task.priority === 0 && (
                                                                <Badge variant="warning" className="text-[10px] px-2 py-0.5">PRIORITY</Badge>
                                                            )}
                                                            {task.estimated_time && (
                                                                <Badge variant="outline" className="text-[10px] px-2 py-0.5">
                                                                    <Clock className="w-3 h-3 mr-1" />
                                                                    {task.estimated_time}
                                                                </Badge>
                                                            )}
                                                        </div>

                                                        <h3 className={cn(
                                                            "text-lg font-bold mb-3",
                                                            task.status === 'done' && "line-through text-[var(--color-text-muted)]"
                                                        )}>
                                                            {task.title}
                                                        </h3>

                                                        <p className="text-[var(--color-text-secondary)] leading-relaxed text-base">
                                                            {task.description}
                                                        </p>

                                                        {/* Quick Meta */}
                                                        {(task.related_files?.length ?? 0) > 0 && !isTaskExpanded && (
                                                            <div className="flex items-center gap-2 mt-4 text-sm text-[var(--color-text-muted)]">
                                                                <FileCode className="w-4 h-4" />
                                                                <span>{task.related_files?.join(', ')}</span>
                                                            </div>
                                                        )}

                                                        {/* Expand Button */}
                                                        {hasDetails && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => toggleExpand(task.task_id)}
                                                                className="mt-4 text-[var(--color-primary)] hover:text-[var(--color-primary-light)] px-0 h-auto"
                                                            >
                                                                <span className="text-sm font-medium">
                                                                    {isTaskExpanded ? 'Hide details' : 'Show details'}
                                                                </span>
                                                                {isTaskExpanded ? (
                                                                    <ChevronUp className="w-4 h-4 ml-1" />
                                                                ) : (
                                                                    <ChevronDown className="w-4 h-4 ml-1" />
                                                                )}
                                                            </Button>
                                                        )}

                                                        {/* Expanded Details */}
                                                        {isTaskExpanded && hasDetails && (
                                                            <div className="mt-6 pt-6 border-t border-[var(--color-border)] space-y-6 animate-fade-in">
                                                                {task.pdf_snippet && (
                                                                    <div>
                                                                        <div className="flex items-center gap-2 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">
                                                                            <Quote className="w-4 h-4" />
                                                                            From the Specification
                                                                        </div>
                                                                        <blockquote className="text-base text-[var(--color-text-secondary)] bg-[var(--color-surface-elevated)] p-6 rounded-2xl border-l-4 border-[var(--color-primary)] italic leading-relaxed">
                                                                            &quot;{task.pdf_snippet}&quot;
                                                                        </blockquote>
                                                                    </div>
                                                                )}

                                                                {task.related_files && task.related_files.length > 0 && (
                                                                    <div>
                                                                        <div className="flex items-center gap-2 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">
                                                                            <FileCode className="w-4 h-4" />
                                                                            Files to Work On
                                                                        </div>
                                                                        <div className="flex flex-wrap gap-3">
                                                                            {task.related_files.map((file, i) => (
                                                                                <code
                                                                                    key={i}
                                                                                    className="text-sm bg-[var(--color-surface-elevated)] px-4 py-2 rounded-xl text-[var(--color-primary-light)] font-mono border border-[var(--color-border)]"
                                                                                >
                                                                                    {file}
                                                                                </code>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {task.commands && task.commands.length > 0 && (
                                                                    <div>
                                                                        <div className="flex items-center gap-2 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">
                                                                            <Terminal className="w-4 h-4" />
                                                                            Commands
                                                                        </div>
                                                                        <div className="space-y-3">
                                                                            {task.commands.map((cmd, i) => (
                                                                                <div
                                                                                    key={i}
                                                                                    className="text-sm font-mono bg-[var(--color-background)] px-6 py-4 rounded-xl text-[var(--color-success)] border border-[var(--color-border)] shadow-inner"
                                                                                >
                                                                                    $ {cmd}
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )
                })}

                {/* Completion Card */}
                <div className="glass rounded-3xl p-12 text-center bg-gradient-to-br from-[var(--color-success)]/10 to-transparent">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-[var(--color-success)] to-[var(--color-primary)] flex items-center justify-center glow">
                        <Trophy className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3">🎉 Coursework Complete!</h3>
                    <p className="text-lg text-[var(--color-text-secondary)]">
                        Complete all milestones above to finish your coursework
                    </p>
                </div>
            </div>
        </div>
    )
}
