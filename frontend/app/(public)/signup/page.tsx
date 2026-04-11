'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/context/auth-context';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { signup } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);

    try {
      await signup(email, password, name);
      router.push('/dashboard');
    } catch (err) {
      setError('Signup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 relative z-10 min-h-[70vh]">
      <div className="relative w-full max-w-md">
        <div className="glass-panel p-8 sm:p-12 shadow-[0_20px_50px_rgba(245,158,81,0.05),0_10px_30px_rgba(58,3,83,0.05)] border border-primary/20 rounded-[3rem] transition-all duration-500 hover:shadow-primary/10">
          <div className="text-center mb-10">
            <div className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center mx-auto mb-6 shadow-xl hover:scale-105 transition-transform duration-500">
              <img src="/logo.png" alt="GradOs Logo" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-4xl font-bold mb-3 text-foreground tracking-tight">Create Account</h1>
            <p className="text-base text-muted-foreground/70 font-medium tracking-wide text-center">Join thousand of students creating professional reports</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-sm text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Full Name</label>
              <Input
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email Address</label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <Input
                type="password"
                placeholder="Minimum 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Confirm Password</label>
              <Input
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full mt-6 py-6 text-base font-semibold"
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-muted-foreground text-sm">
              Already have an account?{' '}
              <Link href="/login" className="text-primary hover:underline font-semibold">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
