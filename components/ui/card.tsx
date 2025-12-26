import * as React from "react"
import { Slot } from "@radix-ui/react-slot"

import { cn } from "@/lib/utils"

interface CardProps extends React.ComponentProps<"div"> {
  interactive?: boolean
  glass?: boolean | 'subtle' | 'medium' | 'strong' | 'interactive' | 'elevated' | 'inset' | 'stat'
  darkVariant?: 'elevated' | 'floating' | 'glass-strong' | 'default'
  asChild?: boolean
  /** Apply glow effect on hover */
  glow?: boolean | 'primary' | 'success' | 'warning' | 'gradient'
  /** Selected state with ring/glow */
  selected?: boolean
  /** Disabled state with reduced opacity */
  disabled?: boolean
  /** Apply gradient border */
  gradientBorder?: boolean | 'subtle' | 'animated' | 'focus'
}

function Card({
  className,
  interactive = false,
  glass = false,
  darkVariant = 'default',
  asChild = false,
  glow = false,
  selected = false,
  disabled = false,
  gradientBorder = false,
  ...props
}: CardProps) {
  const Comp = asChild ? Slot : "div"

  // Determine glass class based on prop value
  const glassClass = glass
    ? glass === true
      ? 'glass-card'
      : `glass-${glass}`
    : null

  // Determine dark variant class
  const darkClass = darkVariant !== 'default'
    ? `dark:card-dark-${darkVariant}`
    : null

  // Determine glow class
  const glowClass = glow
    ? glow === true || glow === 'primary'
      ? 'hover:shadow-[0_8px_32px_rgba(0,91,150,0.2)] dark:hover:shadow-[0_8px_32px_rgba(59,158,255,0.25)]'
      : glow === 'success'
        ? 'hover:shadow-[0_8px_32px_rgba(34,197,94,0.2)] dark:hover:shadow-[0_8px_32px_rgba(74,222,128,0.25)]'
        : glow === 'warning'
          ? 'hover:shadow-[0_8px_32px_rgba(245,158,11,0.2)] dark:hover:shadow-[0_8px_32px_rgba(251,191,36,0.25)]'
          : glow === 'gradient'
            ? 'hover:shadow-[0_8px_32px_rgba(0,91,150,0.15),0_8px_32px_rgba(27,153,139,0.1)] dark:hover:shadow-[0_8px_32px_rgba(59,158,255,0.2),0_8px_32px_rgba(34,211,181,0.15)]'
            : null
    : null

  // Determine gradient border class
  const gradientBorderClass = gradientBorder
    ? gradientBorder === true || gradientBorder === 'subtle'
      ? 'gradient-border-subtle'
      : gradientBorder === 'animated'
        ? 'gradient-border-animated'
        : gradientBorder === 'focus'
          ? 'gradient-border-focus'
          : null
    : null

  return (
    <Comp
      data-slot="card"
      data-selected={selected || undefined}
      data-disabled={disabled || undefined}
      aria-disabled={disabled || undefined}
      className={cn(
        // Base styles with responsive padding
        "text-card-foreground flex flex-col gap-4 md:gap-6 rounded-xl py-4 md:py-6",
        // Background - Premium glass effect with subtle blur on pastel background
        !glass && "bg-card backdrop-blur-sm shadow-[var(--shadow-card)]",
        // Glass effect variant
        glassClass,
        // Dark mode premium variant
        darkClass,
        // Gradient border variant
        gradientBorderClass,
        // Smooth transition for all properties
        "transition-all duration-300",
        // Interactive variant - hover lift effect with shadow
        interactive && !disabled && [
          "cursor-pointer",
          "hover:shadow-[var(--shadow-card-hover)]",
          "hover:-translate-y-1",
          "dark:hover:shadow-[0_12px_48px_rgba(0,0,0,0.6)]",
          "active:scale-[0.99]",
          "active:shadow-[var(--shadow-card-active)]",
        ],
        // Glow effect on hover
        glowClass,
        // Selected state
        selected && [
          "ring-2 ring-primary",
          "shadow-[0_0_0_4px_rgba(0,91,150,0.1)]",
          "dark:ring-[#3B9EFF]",
          "dark:shadow-[0_0_0_4px_rgba(59,158,255,0.15)]",
        ],
        // Disabled state
        disabled && [
          "opacity-50",
          "pointer-events-none",
          "cursor-not-allowed",
          "select-none",
        ],
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-3 md:px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-4 md:[.border-b]:pb-6",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-none font-semibold", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-3 md:px-6", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-3 md:px-6 [.border-t]:pt-4 md:[.border-t]:pt-6", className)}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
