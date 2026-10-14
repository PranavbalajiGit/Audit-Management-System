import { useRef } from "react"
import { motion, useInView } from "framer-motion"

import { cn } from "@/lib/utils"

const ease = [0.16, 1, 0.3, 1]

export const staggerContainer = (stagger = 0.06, delayChildren = 0.04) => ({
  hidden: {},
  visible: {
    transition: { staggerChildren: stagger, delayChildren },
  },
})

export const staggerItem = {
  hidden: { opacity: 0, y: 14, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.5, ease },
  },
}

export function Stagger({
  children,
  className,
  stagger = 0.06,
  delayChildren = 0.04,
  once = true,
  margin = "-40px",
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once, margin })

  return (
    <motion.div
      ref={ref}
      variants={staggerContainer(stagger, delayChildren)}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      className={cn(className)}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({ children, className }) {
  return (
    <motion.div variants={staggerItem} className={cn(className)}>
      {children}
    </motion.div>
  )
}
