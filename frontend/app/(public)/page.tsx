'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/app/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  return (
    <div className="flex flex-col relative w-full pt-0">
      {/* Animated Background Elements specific to Home */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-[-1]">
        <div className="absolute -top-40 right-[-10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-accent/15 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Hero Section */}
      <section className="relative pt-8 pb-20 px-6 sm:px-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-full mb-6 hover:bg-primary/20 transition-colors">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
              <p className="text-sm font-bold text-primary uppercase tracking-widest font-sans">AI-Powered Thesis & PFE Platform</p>
            </div>

            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-bold mb-8 tracking-tighter">
              <span className="text-[#F59E51]">
                Transform Your Research
              </span>
              <br />
              <span className="text-[#3A0353]">Into Professional Reports</span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed">
              Build, polish, and export your final year project report in minutes. Our intelligent wizard guides you through every section with real-time preview and AI suggestions.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link href="/signup">
                <Button size="lg" className="px-8 py-6 text-base font-semibold rounded-lg hover:shadow-lg hover:shadow-primary/50 transition-all">
                  Start Free Now
                </Button>
              </Link>
              <Link href="#features">
                <Button size="lg" variant="outline" className="px-8 py-6 text-base font-semibold rounded-lg">
                  Learn More
                </Button>
              </Link>
            </div>

            {/* Hero Image / Stats */}
            <div className="relative">
              <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto">
                <div className="p-4 bg-card/50 border border-border rounded-xl backdrop-blur-sm hover:bg-card transition-colors">
                  <p className="text-2xl font-bold text-primary">50K+</p>
                  <p className="text-sm text-muted-foreground">Reports Created</p>
                </div>
                <div className="p-4 bg-card/50 border border-border rounded-xl backdrop-blur-sm hover:bg-card transition-colors">
                  <p className="text-2xl font-bold text-accent">95%</p>
                  <p className="text-sm text-muted-foreground">User Satisfaction</p>
                </div>
                <div className="p-4 bg-card/50 border border-border rounded-xl backdrop-blur-sm hover:bg-card transition-colors">
                  <p className="text-2xl font-bold text-primary">180+</p>
                  <p className="text-sm text-muted-foreground">Universities</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-24 px-6 sm:px-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">Powerful Features</h2>
            <p className="text-lg text-muted-foreground">Everything you need to create an exceptional report</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group relative overflow-hidden p-8 bg-card border border-border rounded-2xl hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-primary/50 mb-6 flex items-center justify-center group-hover:shadow-lg group-hover:shadow-primary/50 transition-all">
                  <span className="text-2xl">✨</span>
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground">AI-Powered Writing</h3>
                <p className="text-muted-foreground">Get intelligent suggestions for better writing at every step. Our AI understands academic requirements.</p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group relative overflow-hidden p-8 bg-card border border-border rounded-2xl hover:border-accent/50 hover:shadow-xl hover:shadow-accent/10 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent to-accent/50 mb-6 flex items-center justify-center group-hover:shadow-lg group-hover:shadow-accent/50 transition-all">
                  <span className="text-2xl">👁️</span>
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground">Live Preview</h3>
                <p className="text-muted-foreground">Watch your report format perfectly as you type. See exactly what your final document will look like.</p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group relative overflow-hidden p-8 bg-card border border-border rounded-2xl hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-primary/50 mb-6 flex items-center justify-center group-hover:shadow-lg group-hover:shadow-primary/50 transition-all">
                  <span className="text-2xl">💾</span>
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground">Auto-Save & Export</h3>
                <p className="text-muted-foreground">Never lose your work. Auto-save every change and export to PDF, Word, or print-ready formats.</p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="group relative overflow-hidden p-8 bg-card border border-border rounded-2xl hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-primary/50 mb-6 flex items-center justify-center group-hover:shadow-lg group-hover:shadow-primary/50 transition-all">
                  <span className="text-2xl">📋</span>
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground">Smart Wizard</h3>
                <p className="text-muted-foreground">Guided step-by-step process. Our wizard handles all formatting so you focus on content.</p>
              </div>
            </div>

            {/* Feature 5 */}
            <div className="group relative overflow-hidden p-8 bg-card border border-border rounded-2xl hover:border-accent/50 hover:shadow-xl hover:shadow-accent/10 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent to-accent/50 mb-6 flex items-center justify-center group-hover:shadow-lg group-hover:shadow-accent/50 transition-all">
                  <span className="text-2xl">🔐</span>
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground">Secure & Private</h3>
                <p className="text-muted-foreground">Your data is encrypted and secure. Full privacy control with zero data sharing.</p>
              </div>
            </div>

            {/* Feature 6 */}
            <div className="group relative overflow-hidden p-8 bg-card border border-border rounded-2xl hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-primary/50 mb-6 flex items-center justify-center group-hover:shadow-lg group-hover:shadow-primary/50 transition-all">
                  <span className="text-2xl">🚀</span>
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground">Lightning Fast</h3>
                <p className="text-muted-foreground">Cloud-based processing ensures instant rendering and smooth performance anytime, anywhere.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative py-24 px-6 sm:px-10 mx-4 sm:mx-6 lg:mx-10 my-16 bg-secondary/10 dark:bg-white/5 backdrop-blur-3xl rounded-[3rem] shadow-[0_10px_60px_rgba(0,0,0,0.05)]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">How It Works</h2>
            <p className="text-lg text-muted-foreground">Create your report in 5 simple steps</p>
          </div>

          <div className="grid md:grid-cols-5 gap-4 relative">
            {[
              { number: '1', title: 'Sign Up', description: 'Create your account' },
              { number: '2', title: 'Fill Details', description: 'Enter project info' },
              { number: '3', title: 'Write Content', description: 'Add your research' },
              { number: '4', title: 'Review', description: 'Polish your work' },
              { number: '5', title: 'Export', description: 'Download as PDF' },
            ].map((step, idx) => (
              <div key={idx} className="relative">
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xl font-bold text-white mb-4 shadow-lg shadow-primary/30">
                    {step.number}
                  </div>
                  <h3 className="font-bold mb-1">{step.title}</h3>
                  <p className="text-sm text-muted-foreground text-center">{step.description}</p>
                </div>
                {idx < 4 && (
                  <div className="hidden md:block absolute top-8 -right-4 w-8 h-[2px] bg-gradient-to-r from-primary/50 to-accent/50"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 px-6 sm:px-10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-muted-foreground mb-10">
            Join thousands of students creating professional reports. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="px-10 py-6 text-base font-semibold rounded-full bg-primary hover:bg-primary/90 text-white shadow-[0_4px_14px_rgba(var(--primary),0.4)] transition-all">
                Create Free Account
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="px-10 py-6 text-base font-semibold rounded-full border-border hover:bg-slate-50 transition-colors">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
