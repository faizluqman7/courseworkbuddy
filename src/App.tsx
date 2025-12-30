import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Header } from '@/components/layout/Header'
import { UploadZone } from '@/components/upload/UploadZone'
import { Roadmap } from '@/components/tasks/Roadmap'
import { Dashboard } from '@/pages/Dashboard'
import { CourseworkDetail } from '@/pages/CourseworkDetail'
import { AuthProvider } from '@/contexts/AuthContext'
import { useDecomposition } from '@/hooks/useDecomposition'
import type { DecompositionResponse } from '@/types'
import {
  AlertCircle,
  ArrowLeft,
  Sparkles,
  Zap,
  Brain,
  Shield,
  Clock,
  Users,
  Target,
  GraduationCap,
  FileText,
  BarChart3,
  Github,
  Twitter,
  Linkedin,
  Heart,
  Space
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const queryClient = new QueryClient()

function HomePage() {
  const [result, setResult] = useState<DecompositionResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const decomposition = useDecomposition({
    onSuccess: (data: DecompositionResponse) => {
      setResult(data)
      setError(null)
    },
    onError: (err: { message: string }) => {
      setError(err.message)
    },
  })

  const handleUpload = (file: File) => {
    setError(null)
    decomposition.mutate({ file })
  }

  const handleReset = () => {
    setResult(null)
    setError(null)
  }

  return (
    <main className="flex-1">
      {result ? (
        <div className="w-full flex flex-col items-center px-4 sm:px-6 lg:px-8 py-12">
          {/* Back Button */}
          <div className="w-full max-w-3xl mb-8">
            <Button
              variant="ghost"
              onClick={handleReset}
              className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              New Analysis
            </Button>
          </div>

          <Roadmap data={result} />
        </div>
      ) : (
        <>
          {/* Hero Section */}
          <section className="relative pt-20 pb-32 overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--color-primary)]/20 rounded-full blur-3xl" />
              <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[var(--color-primary-dark)]/20 rounded-full blur-3xl" />
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--color-primary)]/50 to-transparent" />
            </div>

            <div className="relative max-w-6xl mx-auto px-6 text-center">
              {/* Headline */}
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
                Turn Coursework Chaos
                <br />
                <span className="gradient-text">Into Clear Roadmaps</span>
              </h1>

              {/* Subtitle */}
              <p className="text-xl text-[var(--color-text-secondary)] max-w-2xl mx-auto mb-12">
                Upload your PDF coursework specifications. Our AI breaks it down into actionable milestones
                with time estimates, implementation guides, and instructions - so you know exactly what to do next.
              </p>

              {/* Upload Zone */}
              <div className="max-w-xl mx-auto">
                <UploadZone
                  onUpload={handleUpload}
                  isLoading={decomposition.isPending}
                />
              </div>

              {/* Error Display */}
              {error && (
                <div className="mt-8 max-w-xl mx-auto p-4 rounded-2xl bg-[var(--color-error)]/10 border border-[var(--color-error)]/20 flex items-start gap-3 animate-fade-in">
                  <AlertCircle className="w-5 h-5 text-[var(--color-error)] flex-shrink-0 mt-0.5" />
                  <div className="text-left">
                    <p className="font-semibold text-[var(--color-error)]">Upload Failed</p>
                    <p className="text-sm text-[var(--color-text-secondary)] mt-1">{error}</p>
                  </div>
                </div>
              )}

              {/* Trust Badges */}
              <div className="mt-16 flex flex-wrap justify-center gap-8 text-sm text-[var(--color-text-muted)]">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[var(--color-success)]" />
                  <span>No code generation</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[var(--color-primary)]" />
                  <span>Analysis in seconds</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[var(--color-warning)]" />
                  <span>Made by students, for students</span>
                </div>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section className="py-24 relative" id="features">
            <div className="max-w-6xl mx-auto px-6">
              <div className="text-center mb-16">
                <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                  Why Students Love <span className="gradient-text">CourseworkBuddy</span>
                </h2>
                <p className="text-[var(--color-text-secondary)] max-w-2xl mx-auto">
                  Stop spending hours decoding requirements. Our AI-powered platform transforms complex coursework specifications into clear, actionable roadmaps.
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[
                  {
                    icon: Brain,
                    title: 'AI-Powered Analysis',
                    description: 'Our advanced AI reads your entire spec and extracts every requirement, deadline, and deliverable automatically. No more missing hidden requirements.',
                    gradient: 'from-purple-500 to-indigo-500'
                  },
                  {
                    icon: Zap,
                    title: 'Instant Roadmap',
                    description: 'Get a visual learning path with accurate time estimates within seconds, so you can plan your week without guesswork or procrastination.',
                    gradient: 'from-amber-500 to-orange-500'
                  },
                  {
                    icon: Shield,
                    title: 'Academic Integrity',
                    description: 'We guide your thinking — never write code for you. Perfect for learning, safe for submission, and fully compliant with academic policies.',
                    gradient: 'from-emerald-500 to-teal-500'
                  },
                  {
                    icon: Target,
                    title: 'Priority Guidance',
                    description: 'Understand which tasks are critical for passing versus those that boost your grade. Focus your energy where it matters most.',
                    gradient: 'from-rose-500 to-pink-500'
                  },
                  {
                    icon: Clock,
                    title: 'Time Management',
                    description: 'Get realistic time estimates for each task based on complexity. Build a study schedule that actually works for your deadline.',
                    gradient: 'from-cyan-500 to-blue-500'
                  },
                  {
                    icon: GraduationCap,
                    title: 'Learning Resources',
                    description: 'Each task comes with curated terminology explanations and implementation hints to accelerate your understanding.',
                    gradient: 'from-violet-500 to-purple-500'
                  }
                ].map((feature, index) => (
                  <div
                    key={index}
                    className="group relative glass rounded-3xl p-8 hover:border-[var(--color-primary)]/30 transition-all-smooth hover:-translate-y-1"
                  >
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                      <feature.icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                    <p className="text-[var(--color-text-secondary)] leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* How It Works */}
          <section className="py-24 relative bg-[var(--color-surface)]/30" id="how-it-works">
            <div className="max-w-6xl mx-auto px-6">
              <div className="text-center mb-16">
                <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                  How It Works
                </h2>
                <p className="text-[var(--color-text-secondary)] max-w-xl mx-auto">
                  Transform your coursework specification into a clear action plan in three simple steps
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                {[
                  {
                    step: '01',
                    title: 'Upload Your PDF',
                    desc: 'Drop your coursework specification PDF into our secure uploader. We accept any standard PDF format from your university.',
                    icon: FileText
                  },
                  {
                    step: '02',
                    title: 'AI Analysis',
                    desc: 'Our advanced AI reads through your entire document, identifying tasks, requirements, marking criteria, and hidden dependencies.',
                    icon: Brain
                  },
                  {
                    step: '03',
                    title: 'Get Your Roadmap',
                    desc: 'Receive an interactive, prioritized roadmap with time estimates, implementation guides, and terminology explanations.',
                    icon: BarChart3
                  },
                ].map((item, index) => (
                  <div key={index} className="relative">
                    <div className="glass rounded-3xl p-8 h-full">
                      <div className="flex items-center justify-between mb-6">
                        <div className="text-5xl font-bold gradient-text">
                          {item.step}
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center">
                          <item.icon className="w-6 h-6 text-[var(--color-primary)]" />
                        </div>
                      </div>
                      <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                      <p className="text-[var(--color-text-secondary)] leading-relaxed">{item.desc}</p>
                    </div>
                    {index < 2 && (
                      <div className="hidden md:flex absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                        <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white font-bold">
                          →
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-24 relative">
            <div className="max-w-4xl mx-auto px-6 text-center">
              <div className="glass rounded-3xl p-12 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)]/10 to-transparent" />
                <div className="relative">
                  <Sparkles className="w-12 h-12 mx-auto text-[var(--color-primary)] mb-6" />
                  <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                    Ready to Get Started?
                  </h2>
                  <p className="text-[var(--color-text-secondary)] mb-8 max-w-lg mx-auto">
                    Upload your first coursework PDF and see the magic happen. No signup required.
                  </p>
                  <Button
                    size="lg"
                    className="h-14 px-8 text-base"
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    Try CourseworkBuddy Now
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </main>
  )
}

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      {children}
      {/* Footer */}
      <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface)]/30 ">
        {/* Main Footer Content */}
        <div className="py-16"> &nbsp;</div>
        <div className="max-w-6xl mx-auto px-6 py-16 gap-6 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12 ">
            {/* Brand Column */}
            <div className="col-span-2 md:col-span-1 gap-4 mb-2">
              <div className="flex items-center gap-2 mb-4 ">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold gradient-text">CourseworkBuddy</span>
              </div>
              <p className="text-sm text-[var(--color-text-secondary)] mb-6 max-w-xs">
                Transforming complex coursework specifications into clear, actionable roadmaps for students worldwide.
              </p>
              <div className="flex items-center gap-3">
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl bg-[var(--color-surface-elevated)] flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-surface-hover)] transition-colors"
                >
                  <Twitter className="w-5 h-5" />
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl bg-[var(--color-surface-elevated)] flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-surface-hover)] transition-colors"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl bg-[var(--color-surface-elevated)] flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-surface-hover)] transition-colors"
                >
                  <Github className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Product Column */}
            <div className="pt-4 md:pt-0">
              <h4 className="font-semibold text-[var(--color-text-primary)] mb-4">Product</h4>
              <ul className="space-y-3">
                <li>
                  <a href="#features" className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#how-it-works" className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors">
                    How It Works
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors">
                    GitHub
                  </a>
                </li>
              </ul>
            </div>

            {/* Company Column */}
            <div className="pt-4 md:pt-0 gap-4 mb-2">
              <h4 className="font-semibold text-[var(--color-text-primary)] mb-4">Company</h4>
              <ul className="space-y-3">
                <li>
                  <a href="#about" className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#careers" className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#blog" className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#contact" className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal Column */}
            <div className="pt-4 md:pt-0">
              <h4 className="font-semibold text-[var(--color-text-primary)] mb-4">Legal</h4>
              <ul className="space-y-3">
                <li>
                  <a href="#privacy" className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#terms" className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#cookies" className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors">
                    Cookie Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-[var(--color-border)]">
          <div className="max-w-6xl mx-auto px-6 py-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
                <span>© 2024 CourseworkBuddy. All rights reserved.</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-[var(--color-text-muted)]">
                <span>Made with</span>
                <Heart className="w-4 h-4 text-[var(--color-error)] fill-current" />
                <span>for students everywhere</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <AppLayout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/coursework/:id" element={<CourseworkDetail />} />
            </Routes>
          </AppLayout>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  )
}
