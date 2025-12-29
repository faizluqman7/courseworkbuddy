import { useState, useCallback } from 'react'
import { Upload, FileText, X, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface UploadZoneProps {
    onUpload: (file: File) => void
    isLoading?: boolean
}

export function UploadZone({ onUpload, isLoading }: UploadZoneProps) {
    const [isDragging, setIsDragging] = useState(false)
    const [file, setFile] = useState<File | null>(null)

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }, [])

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
    }, [])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)

        const droppedFile = e.dataTransfer.files[0]
        if (droppedFile?.type === 'application/pdf') {
            setFile(droppedFile)
        }
    }, [])

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (selectedFile?.type === 'application/pdf') {
            setFile(selectedFile)
        }
    }, [])

    const handleRemoveFile = () => {
        setFile(null)
    }

    const handleSubmit = () => {
        if (file) {
            onUpload(file)
        }
    }

    return (
        <div className="w-full max-w-xl mx-auto space-y-6 animate-fade-in">
            {/* Upload Zone */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                    "relative border-2 border-dashed rounded-2xl p-10 text-center transition-all-smooth cursor-pointer group",
                    isDragging
                        ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 glow scale-[1.02]"
                        : "border-[var(--color-border)] hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-surface)]/50",
                    isLoading && "pointer-events-none opacity-50"
                )}
            >
                <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={isLoading}
                />

                {file ? (
                    <div className="space-y-4">
                        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] flex items-center justify-center glow">
                            <FileText className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <p className="text-lg font-semibold text-[var(--color-text-primary)]">
                                {file.name}
                            </p>
                            <p className="text-sm text-[var(--color-text-muted)]">
                                {(file.size / 1024 / 1024).toFixed(2)} MB • Ready to analyze
                            </p>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e: React.MouseEvent) => {
                                e.stopPropagation()
                                handleRemoveFile()
                            }}
                            className="text-[var(--color-text-muted)] hover:text-[var(--color-error)]"
                        >
                            <X className="w-4 h-4 mr-1" />
                            Remove
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="w-16 h-16 mx-auto rounded-2xl bg-[var(--color-surface-elevated)] flex items-center justify-center group-hover:bg-[var(--color-primary)]/20 transition-all-smooth">
                            <Upload className="w-8 h-8 text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)] transition-colors" />
                        </div>
                        <div>
                            <p className="text-lg font-semibold text-[var(--color-text-primary)]">
                                Drop your coursework PDF
                            </p>
                            <p className="text-sm text-[var(--color-text-muted)]">
                                or click to browse • Max 20MB
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Submit Button */}
            <Button
                onClick={handleSubmit}
                disabled={!file || isLoading}
                size="lg"
                className="w-full h-14 text-base font-semibold"
            >
                {isLoading ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="ml-2">AI is analyzing your coursework...</span>
                    </>
                ) : (
                    <>
                        <Sparkles className="w-5 h-5" />
                        <span className="ml-2">Generate My Roadmap</span>
                    </>
                )}
            </Button>

            {/* Info text */}
            <p className="text-center text-xs text-[var(--color-text-muted)]">
                AI will automatically detect course context and create your personalized learning path
            </p>
        </div>
    )
}
