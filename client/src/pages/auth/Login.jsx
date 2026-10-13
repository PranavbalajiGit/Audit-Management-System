import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  ScanLine,
  Fingerprint,
  MapPin,
  Lock,
  Mail,
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AnimatedGridPattern } from '@/components/magicui/animated-grid-pattern';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Meteors } from '@/components/fx/meteors';
import { ShinyText } from '@/components/fx/shiny-text';
import { NumberTicker } from '@/components/fx/number-ticker';
import { BlurFade } from '@/components/fx/blur-fade';
import { cn } from '@/lib/utils';

const ease = [0.16, 1, 0.3, 1];

const telemetry = [
  { label: 'Authenticity', value: 98, suffix: '%', tone: 'text-success' },
  { label: 'Rooms mapped', value: 240, suffix: '+', tone: 'text-primary' },
  { label: 'GPS tolerance', value: 50, suffix: 'm', tone: 'text-accent' },
];

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const redirectFor = (user) => {
    navigate(user.role === 'Admin' ? '/admin' : '/auditor');
  };

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
      redirectFor(user);
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
      redirectFor(user);
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background">
      <div className="absolute right-5 top-5 z-20 lg:right-8 lg:top-8">
        <ThemeToggle />
      </div>
      {/* Background layers */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center opacity-[0.14] md:bg-[right_center]"
        style={{ backgroundImage: "url('/media/Audit%20Management%20Background%20Still.jpg')" }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 z-0 blueprint-grid opacity-70" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
        <Meteors number={14} className="opacity-50" />
      </div>
      <div
        className="pointer-events-none absolute -right-24 top-1/2 z-0 h-[36rem] w-[36rem] -translate-y-1/2 rounded-full bg-radial-signal blur-2xl animate-drift"
        aria-hidden="true"
      />
      <AnimatedGridPattern
        numSquares={30}
        maxOpacity={0.18}
        duration={4}
        repeatDelay={1}
        className={cn(
          'pointer-events-none absolute inset-0 z-0 opacity-20',
          '[mask-image:linear-gradient(to_bottom,transparent_0%,black_60%)]',
          '[-webkit-mask-image:linear-gradient(to_bottom,transparent_0%,black_60%)]',
          'fill-primary/25 stroke-primary/15'
        )}
      />

      <div className="relative z-10 mx-auto grid min-h-screen w-full max-w-6xl grid-cols-1 items-center gap-10 px-5 py-10 lg:grid-cols-[1.1fr_minmax(380px,440px)] lg:gap-16 lg:px-8">
        {/* Narrative panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease }}
          className="hidden lg:block"
        >
          <BlurFade delay={0.05}>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/50 px-3 py-1.5 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              <span className="font-mono-data text-[0.65rem] uppercase tracking-[0.24em] text-muted-foreground">
                Smart Infrastructure Audit
              </span>
            </div>
          </BlurFade>

          <h1 className="mt-6 max-w-xl text-balance font-display text-5xl font-bold leading-[1.05] tracking-tight text-foreground xl:text-6xl">
            Every room, <ShinyText>verified</ShinyText> before it is trusted.
          </h1>

          <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground">
            Auditors prove presence on site with QR tags, live GPS and fresh captures. Admins
            get one calibrated view of which inspections hold up — and which need a second look.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {[
              { icon: ScanLine, label: 'QR-tagged rooms' },
              { icon: MapPin, label: 'GPS proof of presence' },
              { icon: Fingerprint, label: 'AI authenticity score' },
            ].map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-xs font-medium text-muted-foreground backdrop-blur"
              >
                <Icon className="h-3.5 w-3.5 text-primary" />
                {label}
              </span>
            ))}
          </div>

          <div className="mt-10 grid max-w-lg grid-cols-3 gap-6 border-t border-border/60 pt-6">
            {telemetry.map((t, i) => (
              <BlurFade key={t.label} delay={0.3 + i * 0.1}>
                <p className="font-mono-data text-[0.6rem] uppercase tracking-[0.18em] text-muted-foreground">
                  {t.label}
                </p>
                <p className={cn('mt-1 font-display text-2xl font-bold', t.tone)}>
                  <NumberTicker value={t.value} suffix={t.suffix} delay={0.4 + i * 0.12} />
                </p>
              </BlurFade>
            ))}
          </div>
        </motion.div>

        {/* Auth panel */}
        <motion.div
          initial={{ opacity: 0, y: 24, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.65, ease }}
        >
          <Card className="reg-marks relative overflow-hidden border-border/70 bg-card/80 shadow-instrument backdrop-blur-2xl">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent"
            />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-24 overflow-hidden" aria-hidden>
              <div className="absolute inset-x-0 h-px animate-scanline bg-gradient-to-r from-transparent via-accent/70 to-transparent" />
            </div>

            <CardContent className="px-6 py-8 sm:px-8">
              <div className="mb-6 flex items-center gap-3">
                <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/25">
                  <span className="absolute inset-0 rounded-xl bg-primary/20 animate-pulse-ring" />
                  <ShieldCheck className="relative h-6 w-6" strokeWidth={2.2} />
                </div>
                <div>
                  <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
                    S7 Audit Console
                  </h2>
                  <p className="text-sm text-muted-foreground">Sign in to your workspace</p>
                </div>
              </div>

              {/* Quick access */}
              <div className="mb-5 grid grid-cols-2 gap-3">
                {[
                  { role: 'Admin', email: 'admin@s7.com', desc: 'Full control', icon: ShieldCheck },
                  { role: 'Auditor', email: 'auditor@s7.com', desc: 'Field tasks', icon: ScanLine },
                ].map((q) => (
                  <motion.button
                    key={q.role}
                    type="button"
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleQuickLogin(q.email, 'Password123!')}
                    disabled={submitting}
                    className="group flex flex-col items-start gap-1 rounded-xl border border-border/60 bg-background/40 p-3 text-left transition-colors hover:border-primary/50 disabled:opacity-50"
                  >
                    <span className="flex w-full items-center justify-between">
                      <q.icon className="h-4 w-4 text-primary" />
                      <ArrowRight className="h-3.5 w-3.5 -translate-x-1 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                    </span>
                    <span className="mt-1 font-display text-sm font-semibold text-foreground">
                      {q.role}
                    </span>
                    <span className="text-[0.7rem] text-muted-foreground">{q.desc}</span>
                  </motion.button>
                ))}
              </div>

              <div className="relative my-5 flex items-center justify-center">
                <Separator className="bg-border/70" />
                <span className="absolute bg-card px-3 font-mono-data text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                  or use credentials
                </span>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Email address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="auditor@s7.com"
                      className="h-11 pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-11 pl-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-0 top-0 flex h-11 w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <Alert
                    variant="destructive"
                    className="border-destructive/30 bg-destructive/10 px-3 py-2.5"
                  >
                    <AlertDescription className="flex items-center gap-2 text-xs text-destructive">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{error}</span>
                    </AlertDescription>
                  </Alert>
                )}

                <Button type="submit" disabled={submitting} size="lg" className="mt-2 w-full">
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/70 border-t-transparent" />
                      Establishing session...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Enter workspace
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </form>

              <p className="mt-6 flex items-center justify-center gap-2 font-mono-data text-[0.6rem] uppercase tracking-[0.18em] text-muted-foreground">
                <span className="h-1 w-1 rounded-full bg-success" />
                end-to-end encrypted session
              </p>
            </CardContent>
          </Card>

          <p className="mt-5 text-center text-[0.7rem] text-muted-foreground lg:hidden">
            S7 · Smart Infrastructure Audit Console
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
