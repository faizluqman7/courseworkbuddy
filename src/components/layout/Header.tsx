import { Sparkles, Github, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Header() {
    return (
        <header className="sticky top-0 z-50 glass border-b border-[var(--color-border)]">
            <div className="max-w-6xl mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="absolute inset-0 bg-[var(--color-primary)] blur-lg opacity-50" />
                            <div className="relative p-2.5 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)]">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold gradient-text">InfoFlow</h1>
                        </div>
                    </div>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-6">
                        <a
                            href="#features"
                            className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                        >
                            Features
                        </a>
                        <a
                            href="#how-it-works"
                            className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                        >
                            How It Works
                        </a>
                        <a
                            href="https://github.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                        >
                            <Github className="w-4 h-4" />
                            GitHub
                        </a>
                    </nav>

                    {/* CTA Button */}
                    <div className="flex items-center gap-4">
                        <Button className="hidden sm:flex">
                            <Sparkles className="w-4 h-4 mr-2" />
                            Get Started
                        </Button>
                        <Button variant="ghost" size="icon" className="md:hidden">
                            <Menu className="w-5 h-5" />
                        </Button>
                    </div>
                </div>
            </div>
        </header>
    )
}
