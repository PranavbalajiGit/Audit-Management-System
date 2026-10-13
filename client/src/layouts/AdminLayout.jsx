import React, { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Building2,
  DoorOpen,
  ListChecks,
  CalendarClock,
  FileBarChart,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  Search,
  ShieldCheck,
  Command as CommandIcon,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { cn } from '@/lib/utils';
import { CommandPalette } from '@/components/CommandPalette';
import { ThemeToggle } from '@/components/ThemeToggle';
import PageTransition from '@/components/PageTransition';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Avatar,
  AvatarFallback,
} from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const menuItems = [
  { name: 'Dashboard', path: '/admin', icon: LayoutDashboard, hint: 'Overview' },
  { name: 'Users', path: '/admin/users', icon: Users, hint: 'People' },
  { name: 'Buildings', path: '/admin/buildings', icon: Building2, hint: 'Registry' },
  { name: 'Rooms', path: '/admin/rooms', icon: DoorOpen, hint: 'Registry' },
  { name: 'Checklists', path: '/admin/checklists', icon: ListChecks, hint: 'Templates' },
  { name: 'Assignments', path: '/admin/assignments', icon: CalendarClock, hint: 'Dispatch' },
  { name: 'Reports', path: '/admin/reports', icon: FileBarChart, hint: 'Review' },
];

const ease = [0.16, 1, 0.3, 1];

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [clock, setClock] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const activeItem = menuItems.find((item) => item.path === location.pathname);

  const commandItems = menuItems.map((item) => ({
    name: item.name,
    path: item.path,
    icon: item.icon,
    hint: item.hint,
  }));

  return (
    <div className="relative flex min-h-screen bg-background text-foreground antialiased">
      {/* Ambient blueprint backdrop */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 blueprint-grid opacity-60" />
        <div className="absolute -left-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-radial-signal blur-3xl" />
        <div className="absolute -bottom-52 right-0 h-[30rem] w-[30rem] rounded-full bg-[radial-gradient(circle_at_center,hsl(var(--accent)/0.09)_0%,transparent_70%)] blur-3xl" />
      </div>

      {/* Rail */}
      <motion.aside
        animate={{ width: sidebarOpen ? 256 : 76 }}
        transition={{ duration: 0.35, ease }}
        className="relative z-20 flex shrink-0 flex-col border-r border-border/60 bg-card/70 backdrop-blur-xl"
      >
        <div className="flex h-16 items-center gap-3 border-b border-border/60 px-4">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/25">
            <span className="absolute inset-0 rounded-xl bg-primary/20 animate-pulse-ring" />
            <ShieldCheck className="relative h-5 w-5" strokeWidth={2.2} />
          </div>
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2 }}
                className="min-w-0"
              >
                <p className="font-display text-base font-bold leading-none text-foreground">
                  Audit Console
                </p>
                <p className="font-mono-data text-[0.6rem] uppercase tracking-[0.22em] text-primary/80">
                  admin
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Tooltip key={item.path}>
                <TooltipTrigger asChild>
                  <Link
                    to={item.path}
                    className={cn(
                      'relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
                      !sidebarOpen && 'justify-center'
                    )}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="admin-active-item"
                        className="absolute inset-0 rounded-lg bg-primary shadow-[0_10px_30px_-14px_hsl(var(--primary)/0.9)]"
                        transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                      />
                    )}
                    <Icon className="relative h-[18px] w-[18px] shrink-0" strokeWidth={2} />
                    <AnimatePresence>
                      {sidebarOpen && (
                        <motion.span
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -6 }}
                          transition={{ duration: 0.18 }}
                          className="relative whitespace-nowrap"
                        >
                          {item.name}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Link>
                </TooltipTrigger>
                {!sidebarOpen && <TooltipContent side="right">{item.name}</TooltipContent>}
              </Tooltip>
            );
          })}
        </nav>

        <div className="border-t border-border/60 p-3">
          <button
            onClick={logout}
            className={cn(
              'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive/90 transition-colors hover:bg-destructive/10',
              !sidebarOpen && 'justify-center'
            )}
          >
            <LogOut className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
            {sidebarOpen && <span>Log out</span>}
          </button>
        </div>
      </motion.aside>

      {/* Body */}
      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border/60 bg-background/70 px-4 backdrop-blur-xl sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              aria-label="Toggle sidebar"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
            </button>
            <div className="min-w-0">
              <p className="font-mono-data text-[0.6rem] uppercase tracking-[0.22em] text-muted-foreground">
                Audit Console
              </p>
              <h1 className="truncate font-display text-lg font-bold leading-tight text-foreground">
                {activeItem?.name || 'Console'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setPaletteOpen(true)}
              className="hidden items-center gap-2 rounded-lg border border-border/60 bg-secondary/40 px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground md:flex"
            >
              <Search className="h-3.5 w-3.5" />
              <span>Search</span>
              <kbd className="ml-2 flex items-center gap-0.5 rounded border border-border bg-background/60 px-1.5 py-0.5 font-mono-data text-[0.6rem]">
                <CommandIcon className="h-2.5 w-2.5" />K
              </kbd>
            </button>

            <div className="hidden items-center gap-2 rounded-lg border border-border/60 bg-secondary/30 px-3 py-2 lg:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              <span className="font-mono-data text-xs text-muted-foreground">
                {clock.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <ThemeToggle variant="icon" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full border border-border/60 p-0.5 pr-2 transition-colors hover:border-primary/40">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {user?.name?.charAt(0) || 'A'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden text-left sm:block">
                    <p className="text-xs font-semibold leading-tight text-foreground">
                      {user?.name || 'Admin User'}
                    </p>
                    <p className="font-mono-data text-[0.6rem] uppercase tracking-wider text-primary/80">
                      {user?.role || 'Administrator'}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Signed in</DropdownMenuLabel>
                <div className="px-2 pb-2">
                  <p className="truncate text-sm font-medium text-foreground">{user?.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setPaletteOpen(true)}>
                  <Search className="h-4 w-4" /> Search console
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="h-4 w-4" /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden p-4 sm:p-6">
          <AnimatePresence mode="wait">
            <PageTransition key={location.pathname} className="mx-auto max-w-[1400px]">
              <Outlet />
            </PageTransition>
          </AnimatePresence>
        </main>
      </div>

      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        items={commandItems}
      />
    </div>
  );
};

export default AdminLayout;
