import { cn } from "@/lib/utils"

export function BorderBeam({ className, duration = 8, opacity = 0.85 }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]",
        className
      )}
      style={{
        padding: "1px",
        WebkitMask:
          "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
        WebkitMaskComposite: "xor",
        mask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
        maskComposite: "exclude",
      }}
    >
      <div
        className="absolute left-1/2 top-1/2 h-[250%] w-[250%] -translate-x-1/2 -translate-y-1/2 animate-beam-sweep"
        style={{
          animationDuration: `${duration}s`,
          opacity,
          background:
            "conic-gradient(from 0deg, transparent 0deg, transparent 300deg, hsl(var(--primary)) 336deg, hsl(var(--accent)) 348deg, transparent 360deg)",
        }}
      />
    </div>
  )
}
