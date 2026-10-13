import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

export function AppModal({
  open,
  onOpenChange,
  title,
  description,
  icon: Icon,
  children,
  footer,
  className,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("max-h-[90vh] overflow-y-auto scrollbar-thin", className)}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
                <Icon className="h-5 w-5" strokeWidth={2} />
              </div>
            )}
            <div className="space-y-0.5">
              <DialogTitle>{title}</DialogTitle>
              {description && <DialogDescription>{description}</DialogDescription>}
            </div>
          </div>
        </DialogHeader>
        <div className="py-1">{children}</div>
        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  )
}

export function Field({ label, hint, required, children, className }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
          {required && <span className="text-destructive">*</span>}
        </label>
      )}
      {children}
      {hint && <p className="text-[0.7rem] text-muted-foreground">{hint}</p>}
    </div>
  )
}
