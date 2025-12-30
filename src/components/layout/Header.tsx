import { useState } from 'react';
import { Sparkles, Github, Menu, LogIn, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { AuthModal } from '@/components/auth/AuthModal';
import { UserMenu } from '@/components/auth/UserMenu';
import { Link } from 'react-router-dom';

export function Header() {
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

    const { isAuthenticated, isLoading } = useAuth();

    const openLogin = () => {
        setAuthModalMode('login');
        setAuthModalOpen(true);
    };

    const openRegister = () => {
        setAuthModalMode('register');
        setAuthModalOpen(true);
    };

    return (
        <>
            <header className="sticky top-0 z-50 glass border-b border-[var(--color-border)]">
                <div className="max-w-6xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
                            <div className="relative">
                                <div className="absolute inset-0 bg-[var(--color-primary)] blur-lg opacity-50" />
                                <div className="relative p-2.5 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)]">
                                    <Sparkles className="w-5 h-5 text-white" />
                                </div>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold gradient-text">CourseworkBuddy</h1>
                            </div>
                        </Link>

                        {/* Desktop Nav */}
                        <nav className="hidden md:flex items-center gap-6">
                            {isAuthenticated && (
                                <Link
                                    to="/dashboard"
                                    className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors font-medium"
                                >
                                    My Courseworks
                                </Link>
                            )}
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

                        {/* Auth Section */}
                        <div className="flex items-center gap-3">
                            {isLoading ? (
                                <div className="w-8 h-8 rounded-lg bg-[var(--color-surface-elevated)] animate-pulse" />
                            ) : isAuthenticated ? (
                                <UserMenu />
                            ) : (
                                <>
                                    <Button
                                        variant="ghost"
                                        onClick={openLogin}
                                        className="hidden sm:flex"
                                    >
                                        <LogIn className="w-4 h-4 mr-2" />
                                        Sign In
                                    </Button>
                                    <Button onClick={openRegister} className="hidden sm:flex">
                                        <UserPlus className="w-4 h-4 mr-2" />
                                        Sign Up
                                    </Button>
                                </>
                            )}

                            <Button variant="ghost" size="icon" className="md:hidden">
                                <Menu className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Auth Modal */}
            <AuthModal
                isOpen={authModalOpen}
                onClose={() => setAuthModalOpen(false)}
                initialMode={authModalMode}
            />
        </>
    );
}
