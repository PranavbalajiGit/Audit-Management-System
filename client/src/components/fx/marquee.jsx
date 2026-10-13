import { cn } from "@/lib/utils"

export function Marquee({
  children,
  className,
  reverse = false,
  pauseOnHover = true,
  vertical = false,
  repeat = 4,
  duration = 40,
  gap = "1rem",
}) {
  return (
    <div
      className={cn(
        "group flex overflow-hidden [gap:var(--gap)]",
        vertical ? "flex-col" : "flex-row",
        className
      )}
      style={{ "--gap": gap }}
    >
      {Array.from({ length: repeat }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "flex shrink-0 justify-around [gap:var(--gap)]",
            vertical
              ? "animate-marquee-vertical flex-col"
              : "animate-marquee flex-row",
            reverse && "[animation-direction:reverse]",
            pauseOnHover && "group-hover:[animation-play-state:paused]"
          )}
          style={{ "--duration": `${duration}s` }}
        >
          {children}
        </div>
      ))}
    </div>
  )
}
