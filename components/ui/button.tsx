import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive active:scale-[0.98] active:transition-transform",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/30 hover:scale-[1.02]",
        destructive:
          "bg-destructive text-white shadow-md shadow-destructive/20 hover:bg-destructive/90 hover:shadow-lg hover:shadow-destructive/30 hover:scale-[1.02] focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "bg-background border-2 border-border hover:bg-muted/50 hover:border-primary/50 hover:shadow-md transition-colors",
        secondary:
          "bg-secondary text-secondary-foreground shadow-md shadow-secondary/20 hover:bg-secondary/90 hover:shadow-lg hover:shadow-secondary/30 hover:scale-[1.02]",
        ghost:
          "hover:bg-muted/50 transition-colors",
        link: "text-primary underline-offset-4 hover:underline",
        // Canva-style gradient variants
        "gradient-primary": "btn-gradient-primary",
        "gradient-secondary": "btn-gradient-secondary",
        "gradient-accent": "btn-gradient-accent",
        // Glassmorphism gradient variants
        "glass-primary": "btn-glass-primary",
        "glass-secondary": "btn-glass-secondary",
        "glass-accent": "btn-glass-accent",
        "glass-outline": "btn-glass-outline",
        // CTA variant - Yi Orange for calls to action
        "cta": "btn-glass-cta",
        "glass-cta": "btn-glass-cta",
        // Premium Gold variant
        "gold": "btn-glass-gold",
        "glass-gold": "btn-glass-gold",
        // Status variants
        success: "bg-success text-success-foreground shadow-sm hover:bg-success/90 hover:shadow-md",
        warning: "bg-warning text-warning-foreground shadow-sm hover:bg-warning/90 hover:shadow-md",
        info: "bg-info text-info-foreground shadow-sm hover:bg-info/90 hover:shadow-md",
        // Generation state variant - Loading/Generating indicator
        "generating": "relative overflow-hidden bg-gradient-to-r from-[#005B96] to-[#1B998B] text-white font-semibold shadow-[0_8px_32px_rgba(0,91,150,0.3)] pointer-events-none cursor-wait",
        // Dark mode CTA variant
        "dark-cta": "bg-gradient-to-br from-[#FF6B35] to-[#FF8C5A] text-white shadow-[0_8px_24px_rgba(255,107,53,0.35)] hover:shadow-[0_12px_32px_rgba(255,107,53,0.45)] dark:from-[#FF6B35] dark:to-[#FF8C5A]",
      },
      size: {
        default: "h-11 px-4 py-2 has-[>svg]:px-3",
        sm: "h-10 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-12 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-11",
        "icon-sm": "size-10",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
