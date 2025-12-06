import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm [a&]:hover:bg-primary/90",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm [a&]:hover:bg-secondary/90",
        destructive:
          "bg-destructive text-white shadow-sm [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "bg-background text-foreground shadow-[var(--shadow-card)] [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        // Status variants - solid
        success:
          "bg-success text-success-foreground shadow-sm [a&]:hover:bg-success/90",
        warning:
          "bg-warning text-warning-foreground shadow-sm [a&]:hover:bg-warning/90",
        info:
          "bg-info text-info-foreground shadow-sm [a&]:hover:bg-info/90",
        // Status variants - muted/soft
        "success-muted":
          "bg-success-muted text-success shadow-sm [a&]:hover:bg-success/20",
        "warning-muted":
          "bg-warning-muted text-warning shadow-sm [a&]:hover:bg-warning/20",
        "info-muted":
          "bg-info-muted text-info shadow-sm [a&]:hover:bg-info/20",
        "destructive-muted":
          "bg-destructive/10 text-destructive shadow-sm [a&]:hover:bg-destructive/20",
        // Premium Gold variants
        premium:
          "badge-premium",
        gold:
          "badge-gold",
        "gold-outline":
          "badge-gold-outline",
        "gold-muted":
          "badge-gold-muted",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
