import { useRef } from "react"
import { motion, useInView } from "framer-motion"

import { cn } from "@/lib/utils"

export function BlurFade({
  children,
  className,
  duration = 0.5,
  delay = 0,
  yOffset = 8,
  blur = "8px",
  once = true,
  margin = "-40px",
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once, margin })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: yOffset, filter: `blur(${blur})` }}
      animate={
        isInView
          ? { opacity: 1, y: 0, filter: "blur(0px)" }
          : { opacity: 0, y: yOffset, filter: `blur(${blur})` }
      }
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  )
}
