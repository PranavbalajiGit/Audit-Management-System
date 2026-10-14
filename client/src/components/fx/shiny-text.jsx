import { cn } from "@/lib/utils"

export function ShinyText({ children, text, disabled = false, speed = 5, className }) {
  return (
    <span
      className={cn("inline-block", !disabled && "shine-text", className)}
      style={!disabled ? { animationDuration: `${speed}s` } : undefined}
    >
      {text ?? children}
    </span>
  )
}
