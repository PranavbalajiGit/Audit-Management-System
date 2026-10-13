import React, { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ClipboardList, History, LogOut, Menu, X, ScanLine, MapPin } from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { cn } from '@/lib/utils';
import PageTransition from '@/components/PageTransition';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const menuItems = [
  { name: 'My Tasks', path: '/auditor', icon: ClipboardList },
  { name: 'Audit History', path: '/auditor/history', icon: History },
];

const ease = [0.16, 1, 0.3, 1];

const AuditorLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [online, setOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="relative flex min-h-screen flex-col bg-background text-foreground antialiased">
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 blueprint-grid opacity-50" />
        <div className="absolute -right-40 -top-32 h-[30rem] w-[30rem] rounded-full bg-[radial-gradient(circle_at_center,hsl(var(--success)/0.12)_0%,transparent_70%)] blur-3xl" />
      </div>

      <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border/60 bg-background/80 px-4 backdrop-blur-xl sm:px-6">
        <Link to="/auditor" className="flex items-center gap-3">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-success/10 text-success ring-1 ring-success/25">
            <span className="absolute inset-0 rounded-lg bg-success/25 animate-pulse-ring" />
            <ScanLine className="relative h-5 w-5" strokeWidth={2.2} />
          </div>
          <div className="leading-none">
            <p className="font-display text-base font-bold text-foreground">Field Auditor</p>
            <p className="font-mono-data text-[0.6rem] uppercase tracking-[0.22em] text-success/80">
              s7 mobile
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 rounded-lg border border-border/60 bg-secondary/30 p-1 md:flex">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'relative flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  isActive ? 'text-success-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="auditor-active-item"
                    className="absolute inset-0 rounded-md bg-success shadow-[0_8px_24px_-12px_hsl(var(--success)/0.9)]"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  />
                )}
                <Icon className="relative h-4 w-4" strokeWidth={2} />
                <span className="relative">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <span
            className={cn(
              'hidden items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono-data text-[0.6rem] uppercase tracking-wider sm:flex',
              online
                ? 'border-success/30 bg-success/10 text-success'
                : 'border-warning/30 bg-warning/10 text-warning'
            )}
          >
            <MapPin className="h-3 w-3" />
            {online ? 'gps ready' : 'offline'}
          </span>

          <div className="hidden items-center gap-2 sm:flex">
            <Avatar className="h-8 w-8 ring-1 ring-success/30">
              <AvatarFallback className="bg-success/15 text-xs text-success">
                {user?.name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <span className="hidden text-sm font-semibold text-foreground lg:inline">
              {user?.name || 'Auditor'}
            </span>
          </div>

          <button
            onClick={logout}
            className="hidden items-center gap-1.5 rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-1.5 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/10 md:flex"
          >
            <LogOut className="h-3.5 w-3.5" />
            Log out
          </button>

          <button
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label="Toggle menu"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 text-muted-foreground hover:bg-secondary hover:text-foreground md:hidden"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease }}
            className="sticky top-16 z-20 overflow-hidden border-b border-border/60 bg-background/95 backdrop-blur-xl md:hidden"
          >
            <div className="space-y-1 p-3">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium',
                      isActive ? 'bg-success/15 text-success' : 'text-muted-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4" /> {item.name}
                  </Link>
                );
              })}
              <button
                onClick={logout}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive"
              >
                <LogOut className="h-4 w-4" /> Log out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="relative z-10 mx-auto w-full max-w-5xl flex-1 p-4 sm:p-6">
        <AnimatePresence mode="wait">
          <PageTransition key={location.pathname}>
            <Outlet />
          </PageTransition>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default AuditorLayout;
