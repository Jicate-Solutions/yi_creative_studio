/**
 * Premium Button Component Template
 *
 * A glassmorphism button with gradient, glow, and animation variants.
 * Supports multiple visual styles for different use cases.
 *
 * Usage:
 * <PremiumButton variant="glass-primary" size="lg" glow>
 *   Get Started
 * </PremiumButton>
 */

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

// ============================================================
// BUTTON VARIANTS
// ============================================================

const premiumButtonVariants = cva(
  // Base styles
  [
    'inline-flex items-center justify-center gap-2',
    'whitespace-nowrap rounded-lg',
    'text-sm font-semibold',
    'transition-all duration-200',
    'focus-visible:outline-none',
    'focus-visible:ring-2',
    'focus-visible:ring-ring',
    'focus-visible:ring-offset-2',
    'disabled:pointer-events-none',
    'disabled:opacity-50',
    '[&_svg]:pointer-events-none',
    '[&_svg]:size-4',
    '[&_svg]:shrink-0',
  ],
  {
    variants: {
      variant: {
        // Solid variants
        default: [
          'bg-primary text-primary-foreground',
          'hover:bg-primary/90',
          'active:scale-[0.98]',
        ],
        destructive: [
          'bg-destructive text-destructive-foreground',
          'hover:bg-destructive/90',
          'active:scale-[0.98]',
        ],
        outline: [
          'border border-input bg-background',
          'hover:bg-accent hover:text-accent-foreground',
          'active:scale-[0.98]',
        ],
        secondary: [
          'bg-secondary text-secondary-foreground',
          'hover:bg-secondary/80',
          'active:scale-[0.98]',
        ],
        ghost: [
          'hover:bg-accent hover:text-accent-foreground',
          'active:scale-[0.98]',
        ],
        link: [
          'text-primary underline-offset-4',
          'hover:underline',
        ],

        // Gradient variants
        'gradient-primary': [
          'bg-gradient-to-r from-[#005B96] to-[#1B998B]',
          'text-white',
          'hover:shadow-lg hover:-translate-y-0.5',
          'active:scale-[0.98]',
        ],
        'gradient-secondary': [
          'bg-gradient-to-r from-[#FF6B35] to-[#005B96]',
          'text-white',
          'hover:shadow-lg hover:-translate-y-0.5',
          'active:scale-[0.98]',
        ],
        'gradient-accent': [
          'bg-gradient-to-r from-[#1B998B] to-[#FF6B35]',
          'text-white',
          'hover:shadow-lg hover:-translate-y-0.5',
          'active:scale-[0.98]',
        ],
        'gradient-gold': [
          'bg-gradient-to-r from-[#D4AF37] to-[#F4D03F]',
          'text-slate-900',
          'hover:shadow-lg hover:-translate-y-0.5',
          'active:scale-[0.98]',
        ],

        // Glass variants
        'glass-primary': [
          'bg-white/70 dark:bg-slate-900/70',
          'backdrop-blur-xl',
          'border border-white/30 dark:border-white/10',
          'text-[#005B96] dark:text-white',
          'hover:bg-white/80 dark:hover:bg-slate-900/80',
          'hover:-translate-y-0.5',
          'active:scale-[0.98]',
        ],
        'glass-secondary': [
          'bg-white/50 dark:bg-slate-900/50',
          'backdrop-blur-lg',
          'border border-white/20 dark:border-white/5',
          'text-slate-700 dark:text-slate-200',
          'hover:bg-white/60 dark:hover:bg-slate-900/60',
          'active:scale-[0.98]',
        ],
        'glass-outline': [
          'bg-transparent',
          'backdrop-blur-sm',
          'border-2 border-[#005B96]/30',
          'text-[#005B96] dark:text-white',
          'hover:border-[#005B96]/50',
          'hover:bg-[#005B96]/5',
          'active:scale-[0.98]',
        ],
        'glass-cta': [
          'bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A]',
          'backdrop-blur-sm',
          'text-white',
          'shadow-[0_4px_16px_rgba(255,107,53,0.4)]',
          'hover:shadow-[0_6px_20px_rgba(255,107,53,0.5)]',
          'hover:-translate-y-0.5',
          'active:scale-[0.98]',
        ],
      },
      size: {
        sm: 'h-9 px-3 text-xs',
        md: 'h-10 px-4',
        lg: 'h-12 px-6 text-base',
        xl: 'h-14 px-8 text-lg',
        icon: 'h-10 w-10',
        'icon-sm': 'h-8 w-8',
        'icon-lg': 'h-12 w-12',
      },
      glow: {
        true: '',
        false: '',
      },
    },
    compoundVariants: [
      // Glow effects for gradient variants
      {
        variant: 'gradient-primary',
        glow: true,
        className: 'shadow-[0_0_20px_rgba(0,91,150,0.4)]',
      },
      {
        variant: 'gradient-secondary',
        glow: true,
        className: 'shadow-[0_0_20px_rgba(255,107,53,0.4)]',
      },
      {
        variant: 'gradient-accent',
        glow: true,
        className: 'shadow-[0_0_20px_rgba(27,153,139,0.4)]',
      },
      {
        variant: 'gradient-gold',
        glow: true,
        className: 'shadow-[0_0_20px_rgba(212,175,55,0.4)]',
      },
      // Glow effects for glass variants
      {
        variant: 'glass-primary',
        glow: true,
        className: 'shadow-[0_0_15px_rgba(0,91,150,0.2)]',
      },
      {
        variant: 'glass-cta',
        glow: true,
        className: 'shadow-[0_0_25px_rgba(255,107,53,0.5)]',
      },
    ],
    defaultVariants: {
      variant: 'default',
      size: 'md',
      glow: false,
    },
  }
)

// ============================================================
// BUTTON COMPONENT
// ============================================================

export interface PremiumButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof premiumButtonVariants> {
  /** Render as child element (for composition with Link, etc.) */
  asChild?: boolean
  /** Show loading state */
  loading?: boolean
}

const PremiumButton = React.forwardRef<HTMLButtonElement, PremiumButtonProps>(
  (
    {
      className,
      variant,
      size,
      glow,
      asChild = false,
      loading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button'

    return (
      <Comp
        className={cn(premiumButtonVariants({ variant, size, glow }), className)}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Loading...
          </>
        ) : (
          children
        )}
      </Comp>
    )
  }
)
PremiumButton.displayName = 'PremiumButton'

// ============================================================
// EXPORTS
// ============================================================

export { PremiumButton, premiumButtonVariants }
