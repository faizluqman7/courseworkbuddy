import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Header } from '@/components/layout/Header'
import { UploadZone } from '@/components/upload/UploadZone'
import { Roadmap } from '@/components/tasks/Roadmap'
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
  Users
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const queryClient = new QueryClient()

function AppContent() {
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
    <div className="min-h-screen flex flex-col">
      <Header />

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
                {/* Badge */}
                {/* <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 text-sm mb-8 animate-fade-in">
                  <Star className="w-4 h-4 text-[var(--color-warning)]" />
                  <span className="text-[var(--color-primary-light)]">Built for Edinburgh Informatics Students</span>
                </div> */}

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
            <section className="py-24 relative">
              <div className="max-w-6xl mx-auto px-6">
                <div className="text-center mb-16">
                  <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                    Why Students Love <span className="gradient-text">CourseworkBuddy</span>
                  </h2>
                  <p className="text-[var(--color-text-secondary)] max-w-xl mx-auto">
                    Stop spending hours decoding requirements. Start building immediately.
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                  {[
                    {
                      icon: Brain,
                      title: 'AI-Powered Analysis',
                      description: 'Our AI reads your entire spec and extracts every requirement, deadline, and deliverable automatically.',
                      gradient: 'from-purple-500 to-indigo-500'
                    },
                    {
                      icon: Zap,
                      title: 'Instant Roadmap',
                      description: 'Get a visual learning path with time estimates, so you can plan your week without guesswork.',
                      gradient: 'from-amber-500 to-orange-500'
                    },
                    {
                      icon: Shield,
                      title: 'Academic Integrity',
                      description: 'We guide your thinking — never write code for you. Perfect for learning, safe for submission.',
                      gradient: 'from-emerald-500 to-teal-500'
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
            <section className="py-24 relative bg-[var(--color-surface)]/30">
              <div className="max-w-6xl mx-auto px-6">
                <div className="text-center mb-16">
                  <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                    How It Works
                  </h2>
                  <p className="text-[var(--color-text-secondary)]">
                    Three simple steps to clarity
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                  {[
                    { step: '01', title: 'Upload PDF', desc: 'Drop your coursework specification' },
                    { step: '02', title: 'AI Analysis', desc: 'Our AI extracts tasks and structure' },
                    { step: '03', title: 'Get Roadmap', desc: 'Interactive path to completion' },
                  ].map((item, index) => (
                    <div key={index} className="relative text-center">
                      <div className="text-7xl font-bold text-[var(--color-primary)]/10 mb-4">
                        {item.step}
                      </div>
                      <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                      <p className="text-[var(--color-text-secondary)]">{item.desc}</p>

                      {index < 2 && (
                        <div className="hidden md:block absolute top-1/4 -right-4 text-[var(--color-text-muted)]">
                          →
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

      {/* Footer */}
      <footer className="border-t border-[var(--color-border)] py-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold gradient-text">CourseworkBuddy</span>
            </div>
            <p className="text-sm text-[var(--color-text-muted)]">
              Built for University of Edinburgh Informatics Students
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  )
}
