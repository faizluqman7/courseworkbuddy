import { useState, useCallback } from 'react'
import { ListTodo, Clock, PlayCircle, CheckCircle2 } from 'lucide-react'
import { TaskCard } from './TaskCard'
import type { Task, DecompositionResponse } from '@/types'
import { cn } from '@/lib/utils'

interface TaskBoardProps {
    data: DecompositionResponse
}

type ColumnKey = 'todo' | 'in_progress' | 'done'

interface Column {
    key: ColumnKey
    title: string
    icon: React.ReactNode
    color: string
}

const columns: Column[] = [
    {
        key: 'todo',
        title: 'To Do',
        icon: <ListTodo className="w-4 h-4" />,
        color: 'var(--color-text-muted)',
    },
    {
        key: 'in_progress',
        title: 'In Progress',
        icon: <PlayCircle className="w-4 h-4" />,
        color: 'var(--color-warning)',
    },
    {
        key: 'done',
        title: 'Done',
        icon: <CheckCircle2 className="w-4 h-4" />,
        color: 'var(--color-success)',
    },
]

export function TaskBoard({ data }: TaskBoardProps) {
    const [tasks, setTasks] = useState<Task[]>(data.tasks)

    const handleStatusChange = useCallback((taskId: string, newStatus: Task['status']) => {
        setTasks(prev =>
            prev.map(task =>
                task.task_id === taskId ? { ...task, status: newStatus } : task
            )
        )
    }, [])

    const getTasksByStatus = (status: ColumnKey) =>
        tasks.filter(task => task.status === status)

    const totalTime = tasks.reduce((acc, task) => {
        const match = task.estimated_time?.match(/(\d+)/)
        return acc + (match ? parseInt(match[1]) : 0)
    }, 0)

    const completedTasks = tasks.filter(t => t.status === 'done').length
    const progress = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header Stats */}
            <div className="glass rounded-2xl p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold gradient-text">
                            {data.course_name || 'Coursework Tasks'}
                        </h2>
                        <p className="text-sm text-[var(--color-text-muted)] mt-1">
                            {tasks.length} tasks • {completedTasks} completed
                        </p>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                            <Clock className="w-4 h-4" />
                            <span>~{totalTime} mins total</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-32">
                            <div className="h-2 bg-[var(--color-surface-elevated)] rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-[var(--color-success)] transition-all duration-500"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <p className="text-xs text-[var(--color-text-muted)] mt-1 text-right">
                                {Math.round(progress)}% done
                            </p>
                        </div>
                    </div>
                </div>

                {/* Setup Instructions */}
                {data.setup_instructions && data.setup_instructions.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
                        <h3 className="text-sm font-medium text-[var(--color-warning)] mb-2">
                            ⚠️ Setup Required First
                        </h3>
                        <ul className="text-sm text-[var(--color-text-secondary)] space-y-1">
                            {data.setup_instructions.map((instruction, index) => (
                                <li key={index} className="flex items-start gap-2">
                                    <span className="text-[var(--color-text-muted)]">•</span>
                                    {instruction}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* Kanban Board */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {columns.map(column => {
                    const columnTasks = getTasksByStatus(column.key)

                    return (
                        <div key={column.key} className="space-y-4">
                            {/* Column Header */}
                            <div className="flex items-center gap-2 pb-2 border-b border-[var(--color-border)]">
                                <span style={{ color: column.color }}>{column.icon}</span>
                                <h3 className="font-medium" style={{ color: column.color }}>
                                    {column.title}
                                </h3>
                                <span className={cn(
                                    "ml-auto text-xs px-2 py-0.5 rounded-full",
                                    "bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)]"
                                )}>
                                    {columnTasks.length}
                                </span>
                            </div>

                            {/* Column Tasks */}
                            <div className="space-y-3 min-h-[200px]">
                                {columnTasks.length === 0 ? (
                                    <div className="text-center py-8 text-sm text-[var(--color-text-muted)]">
                                        No tasks here
                                    </div>
                                ) : (
                                    columnTasks.map(task => (
                                        <TaskCard
                                            key={task.task_id}
                                            task={task}
                                            onStatusChange={handleStatusChange}
                                        />
                                    ))
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
