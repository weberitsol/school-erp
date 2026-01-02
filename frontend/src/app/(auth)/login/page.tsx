'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Lock, Loader2, Sparkles, ArrowRight, CheckCircle } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { login, isLoading, error, clearError } = useAuthStore();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      const success = await login(formData);

      if (success) {
        toast({
          title: 'Welcome back!',
          description: 'You have been logged in successfully.',
        });

        // Small delay to ensure state is persisted before navigation
        await new Promise(resolve => setTimeout(resolve, 100));

        // Use replace instead of push to prevent back button returning to login
        router.replace('/dashboard');
      } else {
        toast({
          title: 'Login failed',
          description: error || 'Invalid email or password',
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('Login error:', err);
      toast({
        title: 'Login failed',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
  };

  const features = [
    'AI-Powered Document Processing',
    'Real-time Analytics Dashboard',
    'Multi-language Support (20+)',
    'Mobile Apps for All Platforms',
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 mb-4">
          <Sparkles className="h-4 w-4 text-blue-500" />
          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
            Future-Ready ERP Platform
          </span>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
          Welcome back
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-lg">
          Sign in to continue to your dashboard
        </p>
      </div>

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email Input */}
        <div className="space-y-2">
          <label
            htmlFor="email"
            className="text-sm font-semibold text-gray-700 dark:text-gray-300"
          >
            Email Address
          </label>
          <div
            className={cn(
              'relative group transition-all duration-300',
              focusedField === 'email' && 'transform scale-[1.02]'
            )}
          >
            <div
              className={cn(
                'absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 blur-xl transition-opacity duration-300',
                focusedField === 'email' && 'opacity-20'
              )}
            />
            <div className="relative">
              <Mail
                className={cn(
                  'absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors duration-300',
                  focusedField === 'email'
                    ? 'text-blue-500'
                    : 'text-gray-400'
                )}
              />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                disabled={isLoading}
                className={cn(
                  'w-full pl-12 pr-4 py-4 rounded-xl border-2 bg-white dark:bg-gray-800/50',
                  'text-gray-900 dark:text-white placeholder-gray-400',
                  'focus:outline-none transition-all duration-300',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  focusedField === 'email'
                    ? 'border-blue-500 dark:border-blue-400 ring-4 ring-blue-500/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                )}
                placeholder="you@example.com"
              />
            </div>
          </div>
        </div>

        {/* Password Input */}
        <div className="space-y-2">
          <label
            htmlFor="password"
            className="text-sm font-semibold text-gray-700 dark:text-gray-300"
          >
            Password
          </label>
          <div
            className={cn(
              'relative group transition-all duration-300',
              focusedField === 'password' && 'transform scale-[1.02]'
            )}
          >
            <div
              className={cn(
                'absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 blur-xl transition-opacity duration-300',
                focusedField === 'password' && 'opacity-20'
              )}
            />
            <div className="relative">
              <Lock
                className={cn(
                  'absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors duration-300',
                  focusedField === 'password'
                    ? 'text-blue-500'
                    : 'text-gray-400'
                )}
              />
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleChange}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                disabled={isLoading}
                className={cn(
                  'w-full pl-12 pr-14 py-4 rounded-xl border-2 bg-white dark:bg-gray-800/50',
                  'text-gray-900 dark:text-white placeholder-gray-400',
                  'focus:outline-none transition-all duration-300',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  focusedField === 'password'
                    ? 'border-blue-500 dark:border-blue-400 ring-4 ring-blue-500/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                )}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="peer sr-only"
              />
              <div className="w-5 h-5 rounded-md border-2 border-gray-300 dark:border-gray-600 peer-checked:border-blue-500 peer-checked:bg-blue-500 transition-all duration-200 flex items-center justify-center">
                {rememberMe && <CheckCircle className="h-3 w-3 text-white" />}
              </div>
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
              Remember me
            </span>
          </label>
          <Link
            href="/forgot-password"
            className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 animate-scale-in">
            <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className={cn(
            'w-full py-4 px-6 rounded-xl font-semibold text-white text-lg',
            'bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700',
            'hover:from-blue-700 hover:via-blue-800 hover:to-purple-800',
            'focus:outline-none focus:ring-4 focus:ring-blue-500/30',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/25',
            'flex items-center justify-center gap-3 btn-glow'
          )}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              Sign in
              <ArrowRight className="h-5 w-5" />
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200 dark:border-gray-700" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400">
            Or continue with
          </span>
        </div>
      </div>

      {/* Social Login */}
      <div className="grid grid-cols-2 gap-4">
        <button className="flex items-center justify-center gap-3 px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md group">
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              className="fill-[#4285F4]"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              className="fill-[#34A853]"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              className="fill-[#FBBC05]"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              className="fill-[#EA4335]"
            />
          </svg>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
            Google
          </span>
        </button>
        <button className="flex items-center justify-center gap-3 px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md group">
          <svg className="h-5 w-5 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
            Facebook
          </span>
        </button>
      </div>

      {/* Quick Login for Dev */}
      {process.env.NODE_ENV === 'development' && (
        <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-4 font-medium uppercase tracking-wider">
            Development Quick Access
          </p>
          <div className="grid grid-cols-4 gap-2">
            {[
              { role: 'Admin', color: 'from-cyan-500 to-blue-500', email: 'admin@school.com' },
              { role: 'Teacher', color: 'from-green-500 to-emerald-500', email: 'teacher@school.com' },
              { role: 'Student', color: 'from-purple-500 to-pink-500', email: 'student@school.com' },
              { role: 'Parent', color: 'from-orange-500 to-red-500', email: 'parent@school.com' },
            ].map(({ role, color, email }) => (
              <button
                key={role}
                onClick={() => setFormData({ email, password: 'admin123' })}
                className={cn(
                  'px-3 py-2.5 text-xs font-semibold rounded-lg text-white transition-all duration-300',
                  'hover:scale-105 hover:shadow-lg',
                  `bg-gradient-to-r ${color}`
                )}
              >
                {role}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sign Up Link */}
      <p className="text-center text-gray-600 dark:text-gray-400">
        Don&apos;t have an account?{' '}
        <Link
          href="/register"
          className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
        >
          Create account
        </Link>
      </p>

      {/* Features List */}
      <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 gap-3">
          {features.map((feature, index) => (
            <div
              key={index}
              className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400"
            >
              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
