import { motion } from "framer-motion"

import { NumberTicker } from "@/components/fx/number-ticker"
import { SpotlightCard } from "@/components/fx/spotlight-card"
import { cn } from "@/lib/utils"

const TONES = {
  primary: { text: "text-primary", glow: "bg-primary/10", ring: "ring-primary/25" },
  success: { text: "text-success", glow: "bg-success/10", ring: "ring-success/25" },
  warning: { text: "text-warning", glow: "bg-warning/10", ring: "ring-warning/25" },
  danger: { text: "text-destructive", glow: "bg-destructive/10", ring: "ring-destructive/25" },
  accent: { text: "text-accent", glow: "bg-accent/10", ring: "ring-accent/25" },
}

export function StatCard({
  label,
  value,
  suffix = "",
  prefix = "",
  hint,
  icon: Icon,
  tone = "primary",
  numeric = true,
  decimals = 0,
  delay = 0,
  footer,
  className,
}) {
  const t = TONES[tone] || TONES.primary

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      className={cn("h-full", className)}
    >
      <SpotlightCard className="reg-marks h-full rounded-xl border border-border/70 bg-card/70 p-5 shadow-panel transition-colors hover:border-primary/35">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {label}
            </p>
            <div className="flex items-baseline gap-1">
              {prefix && <span className={cn("font-display text-lg font-semibold", t.text)}>{prefix}</span>}
              <span className="font-display text-3xl font-bold leading-none text-foreground">
                {numeric ? (
                  <NumberTicker value={Number(value) || 0} delay={delay} decimalPlaces={decimals} suffix={suffix} />
                ) : (
                  <>
                    {value}
                    <span className="text-xl">{suffix}</span>
                  </>
                )}
              </span>
            </div>
          </div>
          {Icon && (
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1",
                t.glow,
                t.ring
              )}
            >
              <Icon className={cn("h-5 w-5", t.text)} strokeWidth={2} />
            </div>
          )}
        </div>
        {(hint || footer) && (
          <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3">
            {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
            {footer}
          </div>
        )}
      </SpotlightCard>
    </motion.div>
  )
}
