import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  ScanLine,
  MapPin,
  Camera,
  Fingerprint,
  FileText,
  WifiOff,
  Building2,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Users,
  LayoutDashboard,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ThemeToggle';
import { AnimatedGridPattern } from '@/components/magicui/animated-grid-pattern';
import { Meteors } from '@/components/fx/meteors';
import { ShinyText } from '@/components/fx/shiny-text';
import { NumberTicker } from '@/components/fx/number-ticker';
import { BlurFade } from '@/components/fx/blur-fade';
import { Stagger, StaggerItem } from '@/components/fx/stagger';
import { SpotlightCard } from '@/components/fx/spotlight-card';
import { BorderBeam } from '@/components/fx/border-beam';

const ease = [0.16, 1, 0.3, 1];

const features = [
  {
    icon: ScanLine,
    title: 'QR-tagged rooms',
    description:
      'Every room carries a unique signed tag. Inspections only begin when the auditor scans the physical code on site.',
  },
  {
    icon: MapPin,
    title: 'GPS proof of presence',
    description:
      'Coordinates are validated against the room registry with a configurable tolerance — no remote sign-offs.',
  },
  {
    icon: Camera,
    title: 'Live-capture enforcement',
    description:
      'Photos must come from the live camera feed. Uploaded galleries are rejected before they ever reach review.',
  },
  {
    icon: Fingerprint,
    title: 'AI authenticity score',
    description:
      'A vision model classifies each scene and cross-checks answers, producing a confidence score for every submission.',
  },
  {
    icon: FileText,
    title: 'Audit-ready reports',
    description:
      'Export signed PDF records with checklist responses, GPS data and AI findings in one click.',
  },
  {
    icon: WifiOff,
    title: 'Field-resilient',
    description:
      'Designed for campuses and sites where connectivity is unreliable — captures queue and sync when back online.',
  },
];

const steps = [
  {
    icon: Building2,
    title: 'Map the estate',
    description: 'Register buildings and rooms with coordinates, then issue QR tags to each space.',
  },
  {
    icon: ClipboardCheck,
    title: 'Dispatch inspections',
    description: 'Assign rooms to auditors with the right checklist and a due date.',
  },
  {
    icon: ShieldCheck,
    title: 'Verify & decide',
    description: 'Review authenticity signals and approve, or send back for a second look.',
  },
];

const roles = [
  {
    name: 'For administrators',
    icon: LayoutDashboard,
    tone: 'primary',
    points: [
      'Command center across every building',
      'Manage users, rooms and checklists',
      'Review queue with confidence scoring',
      'One-click PDF compliance exports',
    ],
  },
  {
    name: 'For field auditors',
    icon: Users,
    tone: 'success',
    points: [
      'Personal queue of assigned inspections',
      'Guided QR, GPS and capture wizard',
      'Works on phone with live camera',
      'Full history of submitted audits',
    ],
  },
];

const stats = [
  { label: 'Authenticity signal', value: 98, suffix: '%', tone: 'text-success' },
  { label: 'GPS tolerance', value: 50, suffix: 'm', tone: 'text-accent' },
  { label: 'Traceable captures', value: 100, suffix: '%', tone: 'text-primary' },
];

const Landing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const consolePath = user?.role === 'Admin' ? '/admin' : '/auditor';

  const goToLogin = () => navigate('/login');

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background text-foreground">
      {/* Background layers */}
      <div className="absolute inset-0 z-0 blueprint-grid opacity-60" aria-hidden />
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
        <Meteors number={12} className="opacity-40" />
      </div>
      <div
        className="pointer-events-none absolute -left-32 top-24 z-0 h-[34rem] w-[34rem] rounded-full bg-radial-signal blur-3xl animate-drift"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-40 top-[38rem] z-0 h-[30rem] w-[30rem] rounded-full bg-radial-beacon opacity-60 blur-3xl"
        aria-hidden
      />
      <AnimatedGridPattern
        numSquares={30}
        maxOpacity={0.15}
        duration={4}
        repeatDelay={1}
        className={cn(
          'pointer-events-none absolute inset-0 z-0 opacity-25',
          '[mask-image:linear-gradient(to_bottom,transparent_0%,black_55%)]',
          '[-webkit-mask-image:linear-gradient(to_bottom,transparent_0%,black_55%)]',
          'fill-primary/20 stroke-primary/10'
        )}
      />

      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/25">
              <span className="absolute inset-0 rounded-lg bg-primary/20 animate-pulse-ring" />
              <ShieldCheck className="relative h-5 w-5" strokeWidth={2.2} />
            </div>
            <div className="leading-none">
              <p className="font-display text-base font-bold">Audit Console</p>
              <p className="font-mono-data text-[0.6rem] uppercase tracking-[0.22em] text-muted-foreground">
                smart infrastructure audit
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-7 md:flex">
            {[
              { label: 'Features', href: '#features' },
              { label: 'How it works', href: '#how' },
              { label: 'Roles', href: '#roles' },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle variant="icon" />
            {user ? (
              <Button size="sm" onClick={() => navigate(consolePath)}>
                Open console <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button size="sm" onClick={goToLogin}>
                Sign in <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-12 px-5 py-16 lg:grid-cols-[1.05fr_minmax(340px,440px)] lg:gap-16 lg:py-24 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease }}
        >
          <BlurFade delay={0.05}>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/50 px-3 py-1.5 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              <span className="font-mono-data text-[0.65rem] uppercase tracking-[0.24em] text-muted-foreground">
                Trust, verified at the source
              </span>
            </div>
          </BlurFade>

          <h1 className="mt-6 max-w-2xl text-balance font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl xl:text-6xl">
            Infrastructure audits that <ShinyText>prove themselves</ShinyText>.
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
            Audit Console turns room-by-room inspections into verifiable records. QR tags, live GPS and
            camera-only captures stop the shortcuts, while an AI authenticity score tells admins
            exactly which submissions to trust.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button size="lg" onClick={goToLogin}>
              {user ? 'Go to console' : 'Sign in to workspace'}
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="#features">Explore features</a>
            </Button>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
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
            {stats.map((t, i) => (
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

        {/* Hero visual */}
        <motion.div
          initial={{ opacity: 0, y: 24, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.7, ease, delay: 0.1 }}
        >
          <SpotlightCard className="reg-marks relative overflow-hidden rounded-2xl border border-border/70 bg-card/80 p-6 shadow-instrument backdrop-blur-2xl">
            <BorderBeam duration={10} />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-mono-data text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                live verification
              </span>
              <Badge variant="success" dot>
                Approved
              </Badge>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <p className="font-display text-2xl font-bold">Room 214 · Science Complex</p>
                <p className="text-xs text-muted-foreground">Assigned to auditor@s7.com</p>
              </div>

              <div className="space-y-2.5 rounded-xl border border-border/60 bg-secondary/30 p-4">
                {[
                  { label: 'QR tag match', value: 'Verified', ok: true },
                  { label: 'GPS distance', value: '12 m away', ok: true },
                  { label: 'Live captures', value: '3 / 3 fresh', ok: true },
                  { label: 'AI classification', value: 'Laboratory', ok: true },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className="flex items-center gap-1.5 font-semibold text-foreground">
                      <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono-data text-sm font-semibold text-success">96%</span>
                  <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
                    authenticity
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                  <motion.div
                    className="h-full rounded-full bg-success"
                    initial={{ width: 0 }}
                    animate={{ width: '96%' }}
                    transition={{ duration: 1.2, ease, delay: 0.6 }}
                  />
                </div>
              </div>
            </div>
          </SpotlightCard>
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 mx-auto w-full max-w-6xl px-5 py-16 lg:px-8">
        <BlurFade>
          <div className="max-w-2xl">
            <p className="font-mono-data text-[0.65rem] uppercase tracking-[0.24em] text-primary">
              Capabilities
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Verification built into every step
            </h2>
            <p className="mt-3 text-muted-foreground">
              The console enforces the evidence chain from the first scan to the final sign-off.
            </p>
          </div>
        </BlurFade>

        <Stagger className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, description }) => (
            <StaggerItem key={title}>
              <SpotlightCard className="reg-marks h-full rounded-xl border border-border/70 bg-card/60 p-5 shadow-panel transition-colors hover:border-primary/35">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </div>
                <h3 className="mt-4 font-display text-base font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
              </SpotlightCard>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* How it works */}
      <section id="how" className="relative z-10 border-y border-border/50 bg-card/30">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 lg:px-8">
          <BlurFade>
            <div className="max-w-2xl">
              <p className="font-mono-data text-[0.65rem] uppercase tracking-[0.24em] text-accent">
                Workflow
              </p>
              <h2 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
                From estate map to signed report
              </h2>
            </div>
          </BlurFade>

          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            {steps.map(({ icon: Icon, title, description }, i) => (
              <BlurFade key={title} delay={i * 0.1}>
                <div className="relative h-full rounded-xl border border-border/70 bg-background/60 p-6">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent ring-1 ring-accent/25">
                      <Icon className="h-5 w-5" strokeWidth={2} />
                    </span>
                    <span className="font-mono-data text-3xl font-bold text-border">
                      0{i + 1}
                    </span>
                  </div>
                  <h3 className="mt-4 font-display text-lg font-bold">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
                </div>
              </BlurFade>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section id="roles" className="relative z-10 mx-auto w-full max-w-6xl px-5 py-16 lg:px-8">
        <BlurFade>
          <div className="max-w-2xl">
            <p className="font-mono-data text-[0.65rem] uppercase tracking-[0.24em] text-primary">
              Two workspaces
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              One source of truth, two views
            </h2>
          </div>
        </BlurFade>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
          {roles.map(({ name, icon: Icon, tone, points }, i) => (
            <BlurFade key={name} delay={i * 0.1}>
              <SpotlightCard className="reg-marks h-full rounded-xl border border-border/70 bg-card/60 p-6 shadow-panel">
                <div
                  className={cn(
                    'flex h-11 w-11 items-center justify-center rounded-xl ring-1',
                    tone === 'success'
                      ? 'bg-success/10 text-success ring-success/25'
                      : 'bg-primary/10 text-primary ring-primary/25'
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </div>
                <h3 className="mt-4 font-display text-lg font-bold">{name}</h3>
                <ul className="mt-4 space-y-2.5">
                  {points.map((p) => (
                    <li key={p} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                      <CheckCircle2
                        className={cn(
                          'mt-0.5 h-4 w-4 shrink-0',
                          tone === 'success' ? 'text-success' : 'text-primary'
                        )}
                      />
                      {p}
                    </li>
                  ))}
                </ul>
              </SpotlightCard>
            </BlurFade>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-20 lg:px-8">
        <BlurFade>
          <div className="reg-marks relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/10 via-card/60 to-accent/5 p-10 text-center shadow-instrument">
            <BorderBeam duration={12} />
            <h2 className="mx-auto max-w-2xl font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to make every inspection count?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Sign in to dispatch audits, verify sites and export compliance records in minutes.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" onClick={goToLogin}>
                {user ? 'Open console' : 'Sign in now'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </BlurFade>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 bg-background/70 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 sm:flex-row lg:px-8">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span className="font-display text-sm font-semibold">Audit Console</span>
          </div>
          <p className="font-mono-data text-[0.6rem] uppercase tracking-[0.18em] text-muted-foreground">
            smart infrastructure audit · verified records
          </p>
          <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
            Sign in <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
