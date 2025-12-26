'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'

const pageHeaderVariants = cva(
  'w-full',
  {
    variants: {
      spacing: {
        default: 'mb-6',
        compact: 'mb-4',
        none: 'mb-0',
      },
    },
    defaultVariants: {
      spacing: 'default',
    },
  }
)

const titleVariants = cva(
  'font-bold tracking-tight',
  {
    variants: {
      size: {
        default: 'text-2xl md:text-3xl',
        lg: 'text-3xl md:text-4xl',
        sm: 'text-xl md:text-2xl',
      },
      gradient: {
        true: 'text-gradient-yi',
        false: 'text-foreground',
      },
    },
    defaultVariants: {
      size: 'default',
      gradient: false,
    },
  }
)

export interface BreadcrumbItem {
  label: string
  href?: string
}

export interface PageHeaderProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof pageHeaderVariants> {
  title: string
  description?: string
  titleSize?: 'default' | 'lg' | 'sm'
  gradientTitle?: boolean
  breadcrumbs?: BreadcrumbItem[]
  actions?: React.ReactNode
  badge?: React.ReactNode
}

function PageHeader({
  className,
  spacing,
  title,
  description,
  titleSize = 'default',
  gradientTitle = false,
  breadcrumbs,
  actions,
  badge,
  ...props
}: PageHeaderProps) {
  return (
    <div
      className={cn(pageHeaderVariants({ spacing }), className)}
      {...props}
    >
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav
          aria-label="Breadcrumb"
          className="mb-3 flex items-center gap-1 text-sm text-muted-foreground"
        >
          {breadcrumbs.map((item, index) => (
            <React.Fragment key={index}>
              {index > 0 && (
                <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50" />
              )}
              {item.href ? (
                <Link
                  href={item.href}
                  className="hover:text-foreground transition-colors duration-quick"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-foreground font-medium">{item.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* Header Content */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          {/* Title Row */}
          <div className="flex items-center gap-3">
            <h1
              className={cn(
                titleVariants({ size: titleSize, gradient: gradientTitle })
              )}
            >
              {title}
            </h1>
            {badge && <div className="shrink-0">{badge}</div>}
          </div>

          {/* Description */}
          {description && (
            <p className="text-sm md:text-base text-muted-foreground max-w-2xl">
              {description}
            </p>
          )}
        </div>

        {/* Actions */}
        {actions && (
          <div className="flex items-center gap-2 shrink-0">{actions}</div>
        )}
      </div>
    </div>
  )
}

export { PageHeader, pageHeaderVariants }
