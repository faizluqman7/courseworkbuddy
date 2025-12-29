import { useState, useEffect } from 'react'
import { Clock, AlertTriangle } from 'lucide-react'

interface DeadlineCountdownProps {
    deadline?: string;
    deadlineNote?: string;
}

export function DeadlineCountdown({ deadline, deadlineNote }: DeadlineCountdownProps) {
    const [timeLeft, setTimeLeft] = useState<{
        days: number;
        hours: number;
        minutes: number;
        seconds: number;
        isOverdue: boolean;
    } | null>(null);

    useEffect(() => {
        if (!deadline) return;

        const calculateTimeLeft = () => {
            const deadlineDate = new Date(deadline);
            const now = new Date();
            const diff = deadlineDate.getTime() - now.getTime();

            if (diff <= 0) {
                return { days: 0, hours: 0, minutes: 0, seconds: 0, isOverdue: true };
            }

            return {
                days: Math.floor(diff / (1000 * 60 * 60 * 24)),
                hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((diff % (1000 * 60)) / 1000),
                isOverdue: false,
            };
        };

        setTimeLeft(calculateTimeLeft());
        const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
        return () => clearInterval(timer);
    }, [deadline]);

    // No deadline - show fallback note in compact form
    if (!deadline) {
        return (
            <div className="flex items-center justify-center gap-4 p-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-[var(--color-text-secondary)]">
                <Clock className="w-6 h-6 text-amber-400" />
                <span className="font-medium text-lg text-amber-400">
                    {deadlineNote || "Please check on Learn for deadline"}
                </span>
            </div>
        );
    }

    if (!timeLeft) return null;

    const deadlineDate = new Date(deadline);
    const formattedDate = deadlineDate.toLocaleDateString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    });

    // Determine urgency color
    const totalHours = timeLeft.days * 24 + timeLeft.hours;
    const urgencyGradient = timeLeft.isOverdue
        ? 'from-red-600 to-red-800'
        : totalHours < 24
            ? 'from-red-500 to-orange-500'
            : totalHours < 72
                ? 'from-orange-500 to-yellow-500'
                : 'from-emerald-500 to-teal-500';

    const borderColor = timeLeft.isOverdue
        ? 'border-red-500/30'
        : totalHours < 24
            ? 'border-red-500/30'
            : totalHours < 72
                ? 'border-orange-500/30'
                : 'border-emerald-500/30';

    return (
        <div className={`glass rounded-3xl p-10 ${borderColor}`}>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                {/* Deadline Info */}
                <div className="flex items-center gap-5">
                    {timeLeft.isOverdue ? (
                        <div className="p-4 rounded-2xl bg-red-500/20">
                            <AlertTriangle className="w-7 h-7 text-red-400" />
                        </div>
                    ) : (
                        <div className="p-4 rounded-2xl bg-[var(--color-primary)]/20">
                            <Clock className="w-7 h-7 text-[var(--color-primary)]" />
                        </div>
                    )}
                    <div>
                        <span className="text-sm font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Deadline</span>
                        <p className="font-bold text-2xl">
                            {formattedDate}
                        </p>
                        {deadlineNote && (
                            <span className="text-base text-[var(--color-text-muted)]">
                                {deadlineNote}
                            </span>
                        )}
                    </div>
                </div>

                {/* Countdown Timer */}
                {timeLeft.isOverdue ? (
                    <div className="flex items-center gap-3 px-6 py-4 rounded-xl bg-red-500/20 text-red-400 font-bold text-lg">
                        <AlertTriangle className="w-6 h-6" />
                        OVERDUE
                    </div>
                ) : (
                    <div className="flex items-center gap-4">
                        <div className={`flex items-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r ${urgencyGradient} text-white font-mono font-bold text-xl shadow-lg`}>
                            {timeLeft.days > 0 && (
                                <>
                                    <span className="tabular-nums">{timeLeft.days}d</span>
                                    <span className="opacity-60 mx-1">:</span>
                                </>
                            )}
                            <span className="tabular-nums">{String(timeLeft.hours).padStart(2, '0')}h</span>
                            <span className="opacity-60 mx-1">:</span>
                            <span className="tabular-nums">{String(timeLeft.minutes).padStart(2, '0')}m</span>
                            <span className="opacity-60 mx-1">:</span>
                            <span className="tabular-nums">{String(timeLeft.seconds).padStart(2, '0')}s</span>
                        </div>
                        <span className="text-base text-[var(--color-text-muted)] hidden sm:inline">remaining</span>
                    </div>
                )}
            </div>
        </div>
    );
}
