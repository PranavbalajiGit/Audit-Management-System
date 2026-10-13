import { Monitor, Moon, Sun } from 'lucide-react';

import { useTheme } from '@/context/ThemeContext';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const OPTIONS = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];

export function ThemeToggle({ variant = 'dropdown', className }) {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  const ActiveIcon = resolvedTheme === 'dark' ? Moon : Sun;

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground',
          className
        )}
      >
        <ActiveIcon className="h-4 w-4" />
      </button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Toggle theme"
          className={cn(
            'flex h-9 items-center gap-2 rounded-lg border border-border/60 px-3 text-xs font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground',
            className
          )}
        >
          <ActiveIcon className="h-4 w-4" />
          <span className="hidden capitalize sm:inline">
            {theme === 'system' ? 'System' : theme}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        {OPTIONS.map(({ value, label, icon: Icon }) => (
          <DropdownMenuItem
            key={value}
            onSelect={() => setTheme(value)}
            className={cn(
              'flex items-center gap-2',
              theme === value && 'text-primary focus:text-primary'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
            {theme === value && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default ThemeToggle;
