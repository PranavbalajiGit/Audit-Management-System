import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const STATUS_VARIANT = {
  Approved: "success",
  Active: "success",
  Verified: "success",
  "Review Required": "warning",
  Pending: "warning",
  Rejected: "destructive",
  Failed: "destructive",
  "In Progress": "info",
  Submitted: "info",
  Assigned: "secondary",
  Disabled: "secondary",
  Draft: "secondary",
}

export function StatusBadge({ status, dot = true, className, children }) {
  const variant = STATUS_VARIANT[status] || "secondary"
  return (
    <Badge variant={variant} dot={dot} className={cn(className)}>
      {children ?? status}
    </Badge>
  )
}

export function ConfidenceMeter({ score = 0, showLabel = true, className }) {
  const value = Math.max(0, Math.min(100, Number(score) || 0))
  const tone =
    value >= 90
      ? { bar: "bg-success", text: "text-success", label: "High" }
      : value >= 70
        ? { bar: "bg-warning", text: "text-warning", label: "Moderate" }
        : { bar: "bg-destructive", text: "text-destructive", label: "Low" }

  return (
    <div className={cn("space-y-1.5", className)}>
      {showLabel && (
        <div className="flex items-center justify-between">
          <span className={cn("font-mono-data text-sm font-semibold", tone.text)}>
            {value}%
          </span>
          <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
            {tone.label}
          </span>
        </div>
      )}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={cn("h-full rounded-full transition-all duration-700 ease-out", tone.bar)}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}
