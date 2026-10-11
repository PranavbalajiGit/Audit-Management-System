import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AnimatedGridPattern } from '@/components/magicui/animated-grid-pattern';
import { cn } from '@/lib/utils';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setError('');
    setSubmitting(true);

    try {
      const user = await login(email, password);
      if (user.role === 'Admin') {
        navigate('/admin');
      } else {
        navigate('/auditor');
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickLogin = async (quickEmail, quickPassword) => {
    setEmail(quickEmail);
    setPassword(quickPassword);
    setError('');
    setSubmitting(true);

    try {
      const user = await login(quickEmail, quickPassword);
      if (user.role === 'Admin') {
        navigate('/admin');
      } else {
        navigate('/auditor');
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#050b18] px-4 py-8">
      {/* 1. Full-screen background image layer */}
      <div
        className="absolute inset-0 bg-[#050b18] bg-cover bg-no-repeat bg-center md:bg-[right_center] z-0"
        style={{
          backgroundImage: "url('/media/Audit%20Management%20Background%20Still.jpg')",
        }}
        aria-hidden="true"
      />

      {/* 2. Slow CSS pulse glow behind the shield (radial gradient of blue-500/20, scale 1-1.05, opacity 0.6-0.9 over 6s) */}
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-full md:w-3/5 flex items-center justify-center md:justify-end overflow-hidden z-0"
        aria-hidden="true"
      >
        <div className="w-[500px] h-[500px] sm:w-[650px] sm:h-[650px] md:w-[800px] md:h-[800px] rounded-full bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.20)_0%,rgba(59,130,246,0.08)_40%,transparent_70%)] animate-shield-glow motion-reduce:animate-none" />
      </div>

      {/* 3. Magic UI Animated Grid Pattern with low opacity (0.25), masked so it fades toward the left edge */}
      <AnimatedGridPattern
        numSquares={35}
        maxOpacity={0.25}
        duration={3.5}
        repeatDelay={1}
        className={cn(
          "pointer-events-none absolute inset-0 h-full w-full opacity-25 z-0",
          "[mask-image:linear-gradient(to_right,transparent_0%,black_65%)]",
          "[-webkit-mask-image:linear-gradient(to_right,transparent_0%,black_65%)]",
          "fill-blue-400/25 stroke-blue-400/20"
        )}
      />

      {/* 4. Dark gradient overlay from the left so the form area stays readable */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-[#050b18] via-[#050b18]/90 md:via-[#050b18]/75 to-[#050b18]/40 md:to-transparent z-0"
        aria-hidden="true"
      />

      {/* 5. Login Card with entrance animation (z-10 layer for clickable form inputs and buttons) */}
      <Card className="relative z-10 w-full max-w-md bg-slate-900/70 backdrop-blur-md border border-slate-700/50 rounded-2xl shadow-2xl animate-card-entrance motion-reduce:animate-none">
        <CardHeader className="text-center pb-2 pt-8 px-6 sm:px-8">
          {/* Shield Icon inside a small rounded square with a blue tint */}
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20 mb-4">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Smart Audit Login
          </CardTitle>
          <CardDescription className="text-sm text-slate-400 mt-1.5">
            Sign in to access your audit workspace
          </CardDescription>
        </CardHeader>

        <CardContent className="px-6 pb-8 pt-4 sm:px-8">
          {/* Quick Login Buttons */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <button
              type="button"
              onClick={() => handleQuickLogin('admin@s7.com', 'Password123!')}
              disabled={submitting}
              className="flex flex-col items-center justify-center w-full h-16 p-3 rounded-xl border border-slate-700/60 bg-slate-950/40 hover:bg-slate-800/60 hover:border-blue-500 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-center group"
            >
              <span className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">
                Quick Admin
              </span>
              <span className="text-xs text-slate-400 mt-0.5">
                admin@s7.com
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('auditor@s7.com', 'Password123!')}
              disabled={submitting}
              className="flex flex-col items-center justify-center w-full h-16 p-3 rounded-xl border border-slate-700/60 bg-slate-950/40 hover:bg-slate-800/60 hover:border-blue-500 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-center group"
            >
              <span className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">
                Quick Auditor
              </span>
              <span className="text-xs text-slate-400 mt-0.5">
                auditor@s7.com
              </span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-5 flex items-center justify-center">
            <Separator className="w-full bg-slate-800" />
            <span className="absolute bg-slate-900/90 px-3 text-xs text-slate-500">
              Or credentials
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-slate-200">
                Email Address
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. auditor@s7.com"
                className="h-11 bg-slate-950/60 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-blue-500 focus-visible:border-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-slate-200">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-11 bg-slate-950/60 border-slate-700 text-white placeholder:text-slate-500 pr-10 focus-visible:ring-blue-500 focus-visible:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-0 h-11 w-10 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <Alert variant="destructive" className="bg-destructive/15 border-destructive/30 text-red-300 py-2.5 px-3">
                <AlertDescription className="text-xs text-red-300 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                  <span>{error}</span>
                </AlertDescription>
              </Alert>
            )}

            {/* Sign In Button */}
            <Button
              type="submit"
              disabled={submitting}
              className="h-11 w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-medium shadow-lg shadow-blue-500/20 transition-all duration-200 active:scale-[0.99] disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed border-0 mt-2"
            >
              {submitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Signing in...</span>
                </div>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
