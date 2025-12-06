import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Base styles with touch-friendly height (44px)
        "h-11 w-full min-w-0 rounded-lg px-4 py-2",
        // Premium glass background for pastel backdrop
        "bg-white/80 dark:bg-slate-900/80",
        // Typography - 16px on mobile prevents iOS zoom, 14px on desktop
        "text-[16px] sm:text-sm",
        // Shadow instead of border (premium look)
        "shadow-[var(--shadow-input)]",
        // Backdrop blur for glass effect
        "backdrop-blur-md",
        // Transitions for smooth interactions
        "transition-all duration-200",
        // Hover state
        "hover:shadow-[var(--shadow-sm)]",
        // Selection styling
        "selection:bg-primary selection:text-primary-foreground",
        // Placeholder
        "placeholder:text-muted-foreground/60",
        // Focus states - enhanced ring with shadow
        "focus-visible:outline-none focus-visible:shadow-[var(--shadow-input-focus)]",
        // Error states
        "aria-invalid:shadow-[0_0_0_3px_rgba(220,38,38,0.1)]",
        // File input styling
        "file:text-foreground file:inline-flex file:h-8 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        // Disabled state
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Input }
