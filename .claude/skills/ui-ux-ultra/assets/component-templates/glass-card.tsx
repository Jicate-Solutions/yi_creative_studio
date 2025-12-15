/**
 * Glass Card Component Template
 *
 * A premium glassmorphism card with hover effects, shadows, and animations.
 * Supports multiple glass intensities and interactive states.
 *
 * Usage:
 * <GlassCard glass="premium" interactive>
 *   <GlassCardHeader>
 *     <GlassCardTitle>Title</GlassCardTitle>
 *   </GlassCardHeader>
 *   <GlassCardContent>Content</GlassCardContent>
 * </GlassCard>
 */

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

// ============================================================
// CARD VARIANTS
// ============================================================

const glassCardVariants = cva(
  // Base styles
  [
    'rounded-xl',
    'border',
    'transition-all duration-200',
  ],
  {
    variants: {
      glass: {
        none: 'bg-card border-border',
        subtle: [
          'bg-white/50 dark:bg-slate-900/80',
          'backdrop-blur-[12px]',
          'border-white/10 dark:border-white/5',
        ],
        medium: [
          'bg-white/70 dark:bg-slate-900/85',
          'backdrop-blur-[16px]',
          'border-white/20 dark:border-white/10',
        ],
        strong: [
          'bg-white/80 dark:bg-slate-900/88',
          'backdrop-blur-[20px]',
          'border-white/30 dark:border-white/15',
        ],
        premium: [
          'bg-white/85 dark:bg-slate-900/90',
          'backdrop-blur-[20px]',
          'border-white/40 dark:border-white/20',
          'shadow-[0_8px_32px_rgba(0,91,150,0.1)]',
        ],
      },
      shadow: {
        none: '',
        xs: 'shadow-[var(--shadow-xs)]',
        sm: 'shadow-[var(--shadow-sm)]',
        md: 'shadow-[var(--shadow-md)]',
        lg: 'shadow-[var(--shadow-lg)]',
        xl: 'shadow-[var(--shadow-xl)]',
        premium: 'shadow-[0_8px_32px_rgba(0,91,150,0.15)]',
      },
      interactive: {
        true: [
          'cursor-pointer',
          'hover:shadow-[var(--shadow-card-hover)]',
          'hover:-translate-y-0.5',
          'active:scale-[0.99]',
          'focus-visible:outline-none',
          'focus-visible:ring-2',
          'focus-visible:ring-ring',
          'focus-visible:ring-offset-2',
        ],
        false: '',
      },
    },
    defaultVariants: {
      glass: 'medium',
      shadow: 'md',
      interactive: false,
    },
  }
)

// ============================================================
// CARD COMPONENT
// ============================================================

export interface GlassCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof glassCardVariants> {
  /** Make the card a clickable/focusable element */
  asChild?: boolean
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, glass, shadow, interactive, asChild, ...props }, ref) => {
    const Comp = asChild ? 'button' : 'div'

    return (
      <Comp
        ref={ref as React.Ref<HTMLDivElement>}
        className={cn(glassCardVariants({ glass, shadow, interactive }), className)}
        {...props}
      />
    )
  }
)
GlassCard.displayName = 'GlassCard'

// ============================================================
// CARD HEADER
// ============================================================

const GlassCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6', className)}
    {...props}
  />
))
GlassCardHeader.displayName = 'GlassCardHeader'

// ============================================================
// CARD TITLE
// ============================================================

const GlassCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'text-2xl font-semibold leading-none tracking-tight',
      'text-slate-900 dark:text-white',
      className
    )}
    {...props}
  />
))
GlassCardTitle.displayName = 'GlassCardTitle'

// ============================================================
// CARD DESCRIPTION
// ============================================================

const GlassCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
))
GlassCardDescription.displayName = 'GlassCardDescription'

// ============================================================
// CARD CONTENT
// ============================================================

const GlassCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
))
GlassCardContent.displayName = 'GlassCardContent'

// ============================================================
// CARD FOOTER
// ============================================================

const GlassCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-6 pt-0', className)}
    {...props}
  />
))
GlassCardFooter.displayName = 'GlassCardFooter'

// ============================================================
// EXPORTS
// ============================================================

export {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardDescription,
  GlassCardContent,
  GlassCardFooter,
  glassCardVariants,
}
