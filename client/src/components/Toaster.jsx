import { Toaster as Sonner } from "sonner"

export function Toaster() {
  return (
    <Sonner
      theme="dark"
      position="top-right"
      toastOptions={{
        style: {
          background: "hsl(var(--card))",
          border: "1px solid hsl(var(--border))",
          color: "hsl(var(--foreground))",
          borderRadius: "0.75rem",
        },
        classNames: {
          title: "font-display text-sm font-semibold",
          description: "text-xs text-muted-foreground",
        },
      }}
    />
  )
}
