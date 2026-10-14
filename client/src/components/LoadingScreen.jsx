import { cn } from "@/lib/utils"

export function LoadingScreen({ label = "Calibrating workspace...", className }) {
  return (
    <div className={cn("flex h-96 flex-col items-center justify-center gap-5 text-muted-foreground", className)}>
      <div className="relative h-14 w-14">
        <div className="absolute inset-0 rounded-full border border-border/70" />
        <div className="absolute inset-0 rounded-full border-t-2 border-primary animate-spin" />
        <div className="absolute inset-2 rounded-full border border-dashed border-primary/30 animate-[spin_8s_linear_infinite]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
        </div>
      </div>
      <div className="space-y-1 text-center">
        <p className="font-display text-sm font-semibold text-foreground">{label}</p>
        <p className="font-mono-data text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">
          s7 · audit engine
        </p>
      </div>
    </div>
  )
}

export function InlineLoader({ label, className }) {
  return (
    <div className={cn("flex items-center justify-center gap-3 text-muted-foreground", className)}>
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary/60 border-t-transparent" />
      {label && <span className="text-xs font-medium">{label}</span>}
    </div>
  )
}
