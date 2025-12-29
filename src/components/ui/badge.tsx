import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "secondary" | "success" | "warning" | "outline"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
    const variants = {
        default: "bg-[var(--color-primary)] text-white",
        secondary: "bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)]",
        success: "bg-[var(--color-success)]/20 text-[var(--color-success)] border border-[var(--color-success)]/30",
        warning: "bg-[var(--color-warning)]/20 text-[var(--color-warning)] border border-[var(--color-warning)]/30",
        outline: "border border-[var(--color-border)] text-[var(--color-text-secondary)]",
    }

    return (
        <div
            className={cn(
                "inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium transition-colors",
                variants[variant],
                className
            )}
            {...props}
        />
    )
}

export { Badge }
