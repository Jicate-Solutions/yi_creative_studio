import * as React from "react"

import { cn } from "@/lib/utils"

interface CardProps extends React.ComponentProps<"div"> {
  interactive?: boolean
  glass?: boolean | 'subtle' | 'medium' | 'strong'
}

function Card({ className, interactive = false, glass = false, ...props }: CardProps) {
  // Determine glass class based on prop value
  const glassClass = glass
    ? glass === true
      ? 'glass-card'
      : `glass-${glass}`
    : null

  return (
    <div
      data-slot="card"
      className={cn(
        // Base styles with responsive padding
        "text-card-foreground flex flex-col gap-4 md:gap-6 rounded-xl py-4 md:py-6",
        // Background - Premium glass effect with subtle blur on pastel background
        !glass && "bg-card backdrop-blur-sm shadow-[var(--shadow-card)]",
        // Glass effect variant
        glassClass,
        // Smooth transition for all properties
        "transition-all duration-200",
        // Interactive variant - hover lift effect with shadow
        interactive && [
          "cursor-pointer",
          "hover:shadow-[var(--shadow-card-hover)]",
          "hover:-translate-y-0.5",
          "active:scale-[0.99]",
          "active:shadow-[var(--shadow-card-active)]",
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
