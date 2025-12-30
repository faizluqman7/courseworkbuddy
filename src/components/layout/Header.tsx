import { useState } from 'react';
import { Sparkles, Github, Menu, X, LogIn, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { AuthModal } from '@/components/auth/AuthModal';
import { UserMenu } from '@/components/auth/UserMenu';
import { Link } from 'react-router-dom';

export function Header() {
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const { isAuthenticated, isLoading } = useAuth();

    const openLogin = () => {
        setAuthModalMode('login');
        setAuthModalOpen(true);
        setMobileMenuOpen(false);
    };

    const openRegister = () => {
        setAuthModalMode('register');
        setAuthModalOpen(true);
        setMobileMenuOpen(false);
    };

    const closeMobileMenu = () => {
        setMobileMenuOpen(false);
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

                            {/* Mobile Menu Toggle */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="md:hidden"
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            >
                                {mobileMenuOpen ? (
                                    <X className="w-5 h-5" />
                                ) : (
                                    <Menu className="w-5 h-5" />
                                )}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu */}
                <div
                    className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${mobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                        }`}
                >
                    <nav className="px-6 py-4 border-t border-[var(--color-border)] space-y-1">
                        {isAuthenticated && (
                            <Link
                                to="/dashboard"
                                onClick={closeMobileMenu}
                                className="block w-full text-left px-4 py-3 rounded-xl text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-elevated)] transition-colors font-medium"
                            >
                                My Courseworks
                            </Link>
                        )}
                        <a
                            href="#features"
                            onClick={closeMobileMenu}
                            className="block w-full text-left px-4 py-3 rounded-xl text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-elevated)] transition-colors"
                        >
                            Features
                        </a>
                        <a
                            href="#how-it-works"
                            onClick={closeMobileMenu}
                            className="block w-full text-left px-4 py-3 rounded-xl text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-elevated)] transition-colors"
                        >
                            How It Works
                        </a>
                        <a
                            href="https://github.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={closeMobileMenu}
                            className="flex items-center gap-2 w-full text-left px-4 py-3 rounded-xl text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-elevated)] transition-colors"
                        >
                            <Github className="w-4 h-4" />
                            GitHub
                        </a>

                        {/* Mobile Auth Buttons */}
                        {!isAuthenticated && !isLoading && (
                            <div className="pt-3 mt-3 border-t border-[var(--color-border)] space-y-2">
                                <Button
                                    variant="ghost"
                                    onClick={openLogin}
                                    className="w-full justify-start px-4"
                                >
                                    <LogIn className="w-4 h-4 mr-2" />
                                    Sign In
                                </Button>
                                <Button
                                    onClick={openRegister}
                                    className="w-full justify-start px-4"
                                >
                                    <UserPlus className="w-4 h-4 mr-2" />
                                    Sign Up
                                </Button>
                            </div>
                        )}
                    </nav>
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
