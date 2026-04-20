'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/context/auth-context';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GoogleLogin } from '@react-oauth/google';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, googleLogin } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      setError('Invalid email or password');
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
              <img src="/logo.svg" alt="Rappori Logo" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-4xl font-bold mb-3 text-foreground tracking-tight">Welcome Back</h1>
            <p className="text-base text-muted-foreground/70 font-medium tracking-wide">Sign in to your Rappori workspace</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-sm text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full mt-6 py-6 text-base font-semibold"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-muted/30"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground/50 tracking-widest font-bold">Or continue with</span>
            </div>
          </div>

          <div className="flex justify-center social-login-wrapper">
            <GoogleLogin
              onSuccess={credentialResponse => {
                if (credentialResponse.credential) {
                  setIsLoading(true);
                  googleLogin(credentialResponse.credential)
                    .then(() => router.push('/dashboard'))
                    .catch(() => setError('Google sign-in failed. Please try again.'))
                    .finally(() => setIsLoading(false));
                }
              }}
              onError={() => {
                setError('Google authentication failed');
              }}
              theme="outline"
              size="large"
              width="100%"
              shape="pill"
            />
          </div>

          <div className="mt-6 text-center">
            <p className="text-muted-foreground text-sm">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-primary hover:underline font-semibold">
                Sign up free
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
