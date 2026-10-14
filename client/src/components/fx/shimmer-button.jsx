import { cn } from "@/lib/utils"

export function ShimmerButton({
  children,
  className,
  shimmerColor = "hsl(var(--primary))",
  background = "hsl(var(--primary))",
  ...props
}) {
  return (
    <button
      className={cn(
        "group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-lg border border-primary/40 px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_8px_28px_-14px_hsl(var(--primary)/0.9)] transition-transform duration-200 active:translate-y-px [&_svg]:size-4 [&_svg]:shrink-0",
        className
      )}
      style={{ background }}
      {...props}
    >
      <span aria-hidden className="absolute inset-0 overflow-hidden rounded-[inherit]">
        <span
          className="animate-spin-around absolute inset-[-100%]"
          style={{
            background: `conic-gradient(from 90deg at 50% 50%, transparent 0%, ${shimmerColor}66 50%, transparent 100%)`,
          }}
        />
        <span className="absolute inset-[1.5px] rounded-[inherit]" style={{ background }} />
      </span>
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
    </button>
  )
}
