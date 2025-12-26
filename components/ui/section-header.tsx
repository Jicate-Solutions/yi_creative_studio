'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const sectionHeaderVariants = cva(
  'flex items-center justify-between gap-4',
  {
    variants: {
      spacing: {
        default: 'mb-4',
        lg: 'mb-6',
        sm: 'mb-3',
        none: 'mb-0',
      },
    },
    defaultVariants: {
      spacing: 'default',
    },
  }
)

const titleVariants = cva(
  'font-semibold tracking-tight',
  {
    variants: {
      size: {
        default: 'text-lg',
        lg: 'text-xl',
        sm: 'text-base',
        xs: 'text-sm',
      },
      variant: {
        default: 'text-foreground',
        muted: 'text-muted-foreground',
        gradient: 'text-gradient-yi',
        caption: 'text-xs uppercase tracking-wider text-muted-foreground font-medium',
      },
    },
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
  }
)

export interface SectionHeaderProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof sectionHeaderVariants> {
  title: string
  titleSize?: 'default' | 'lg' | 'sm' | 'xs'
  titleVariant?: 'default' | 'muted' | 'gradient' | 'caption'
  description?: string
  icon?: React.ReactNode
  actions?: React.ReactNode
  count?: number
  badge?: React.ReactNode
}

function SectionHeader({
  className,
  spacing,
  title,
  titleSize = 'default',
  titleVariant = 'default',
  description,
  icon,
  actions,
  count,
  badge,
  ...props
}: SectionHeaderProps) {
  return (
    <div
      className={cn(sectionHeaderVariants({ spacing }), className)}
      {...props}
    >
      <div className="flex items-center gap-3 min-w-0">
        {/* Icon */}
        {icon && (
          <div className="shrink-0 flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
        )}

        {/* Title and Description */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2
              className={cn(
                titleVariants({ size: titleSize, variant: titleVariant }),
                'truncate'
              )}
            >
              {title}
            </h2>
            {count !== undefined && (
              <span className="shrink-0 inline-flex items-center justify-center h-5 min-w-5 px-1.5 text-xs font-medium rounded-full bg-muted text-muted-foreground">
                {count}
              </span>
            )}
            {badge && <div className="shrink-0">{badge}</div>}
          </div>
          {description && (
            <p className="text-sm text-muted-foreground mt-0.5 truncate">
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      {actions && (
        <div className="flex items-center gap-2 shrink-0">{actions}</div>
      )}
    </div>
  )
}

export { SectionHeader, sectionHeaderVariants }
