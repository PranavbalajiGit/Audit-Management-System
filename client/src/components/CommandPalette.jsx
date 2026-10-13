import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowRight, CornerDownLeft, Search } from "lucide-react"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

export function CommandPalette({ open, onOpenChange, items, placeholder = "Search actions, pages, records..." }) {
  const [query, setQuery] = useState("")
  const [activeIndex, setActiveIndex] = useState(0)
  const navigate = useNavigate()
  const listRef = useRef(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        (item.keywords || "").toLowerCase().includes(q)
    )
  }, [items, query])

  useEffect(() => {
    setActiveIndex(0)
  }, [query, open])

  useEffect(() => {
    if (!open) setQuery("")
  }, [open])

  const handleSelect = (item) => {
    onOpenChange(false)
    if (item.onSelect) item.onSelect()
    else if (item.path) navigate(item.path)
  }

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (filtered[activeIndex]) handleSelect(filtered[activeIndex])
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-[18%] max-w-xl translate-y-0 gap-0 overflow-hidden p-0">
        <div className="flex items-center gap-3 border-b border-border/70 px-4">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="h-14 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            aria-label="Command search"
          />
          <kbd className="hidden rounded border border-border bg-secondary px-1.5 py-0.5 font-mono-data text-[0.65rem] text-muted-foreground sm:block">
            ESC
          </kbd>
        </div>

        <div ref={listRef} className="max-h-80 overflow-y-auto scrollbar-thin p-2">
          {filtered.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              No matching actions.
            </p>
          ) : (
            filtered.map((item, index) => (
              <button
                key={item.path || item.name}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => handleSelect(item)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                  index === activeIndex
                    ? "bg-primary/12 text-foreground"
                    : "text-muted-foreground hover:bg-secondary/60"
                )}
              >
                {item.icon && (
                  <item.icon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      index === activeIndex ? "text-primary" : "text-muted-foreground"
                    )}
                    strokeWidth={2}
                  />
                )}
                <span className="flex-1 font-medium">{item.name}</span>
                {item.hint && (
                  <span className="font-mono-data text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                    {item.hint}
                  </span>
                )}
                <ArrowRight
                  className={cn(
                    "h-3.5 w-3.5 transition-opacity",
                    index === activeIndex ? "opacity-100 text-primary" : "opacity-0"
                  )}
                />
              </button>
            ))
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border/70 px-4 py-2.5 text-[0.65rem] text-muted-foreground">
          <span className="flex items-center gap-2">
            <CornerDownLeft className="h-3 w-3" /> select
            <span className="text-border">|</span>
            <span>↑↓ navigate</span>
          </span>
          <span className="font-mono-data uppercase tracking-wider">s7 console</span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
