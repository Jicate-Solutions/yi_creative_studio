'use client'

import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'

const spinnerVariants = cva(
  'animate-spin',
  {
    variants: {
      size: {
        xs: 'h-3 w-3',
        sm: 'h-4 w-4',
        default: 'h-5 w-5',
        md: 'h-6 w-6',
        lg: 'h-8 w-8',
        xl: 'h-10 w-10',
      },
      variant: {
        default: 'text-muted-foreground',
        primary: 'text-primary',
        secondary: 'text-secondary',
        accent: 'text-accent',
        white: 'text-white',
        destructive: 'text-destructive',
      },
    },
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
  }
)

export interface LoadingSpinnerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof spinnerVariants> {
  /** Optional text to display alongside the spinner */
  text?: string
  /** Show spinner in a centered container */
  centered?: boolean
  /** Full screen overlay spinner */
  fullScreen?: boolean
}

/**
 * Standardized loading spinner component
 *
 * @example
 * // Basic spinner
 * <LoadingSpinner />
 *
 * // With text
 * <LoadingSpinner text="Loading..." />
 *
 * // Large primary spinner
 * <LoadingSpinner size="lg" variant="primary" />
 *
 * // Centered in container
 * <LoadingSpinner centered text="Please wait..." />
 *
 * // Full screen overlay
 * <LoadingSpinner fullScreen text="Processing..." />
 */
export function LoadingSpinner({
  size,
  variant,
  text,
  centered = false,
  fullScreen = false,
  className,
  ...props
}: LoadingSpinnerProps) {
  const spinner = (
    <div
      className={cn(
        'flex items-center gap-2',
        centered && 'justify-center',
        className
      )}
      {...props}
    >
      <Loader2 className={cn(spinnerVariants({ size, variant }))} />
      {text && (
        <span
          className={cn(
            'text-sm',
            variant === 'white' ? 'text-white' : 'text-muted-foreground'
          )}
        >
          {text}
        </span>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-3">
          <Loader2
            className={cn(
              spinnerVariants({ size: 'xl', variant: variant || 'primary' })
            )}
          />
          {text && (
            <span className="text-sm font-medium text-foreground">{text}</span>
          )}
        </div>
      </div>
    )
  }

  if (centered) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        {spinner}
      </div>
    )
  }

  return spinner
}

/**
 * Inline loading spinner for buttons
 */
export function ButtonSpinner({
  className,
}: {
  className?: string
}) {
  return (
    <Loader2 className={cn('h-4 w-4 animate-spin', className)} />
  )
}

/**
 * Page-level loading component
 */
export function PageLoading({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
      <LoadingSpinner size="lg" variant="primary" />
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  )
}
