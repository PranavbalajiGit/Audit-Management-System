import { useMemo } from "react"
import { useReducedMotion } from "framer-motion"

import { cn } from "@/lib/utils"

export function Meteors({
  number = 18,
  className,
  minDelay = 0.2,
  maxDelay = 1.2,
  minDuration = 3,
  maxDuration = 8,
}) {
  const shouldReduceMotion = useReducedMotion()

  const meteors = useMemo(() => {
    const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 1200
    return Array.from({ length: number }, () => ({
      left: Math.floor(Math.random() * viewportWidth) + "px",
      delay: Math.random() * (maxDelay - minDelay) + minDelay + "s",
      duration:
        Math.floor(Math.random() * (maxDuration - minDuration) + minDuration) + "s",
    }))
  }, [number, minDelay, maxDelay, minDuration, maxDuration])

  if (shouldReduceMotion) {
    return null
  }

  return (
    <>
      {meteors.map((m, idx) => (
        <span
          key={idx}
          className={cn(
            "animate-meteor pointer-events-none absolute left-1/2 top-1/2 h-0.5 w-0.5 rotate-[215deg] rounded-full bg-primary shadow-[0_0_0_1px_hsl(var(--primary)/0.1)]",
            "before:absolute before:top-1/2 before:h-px before:w-[60px] before:-translate-y-1/2 before:bg-gradient-to-r before:from-primary/80 before:to-transparent before:content-['']",
            className
          )}
          style={{
            top: 0,
            left: m.left,
            animationDelay: m.delay,
            animationDuration: m.duration,
          }}
        />
      ))}
    </>
  )
}
