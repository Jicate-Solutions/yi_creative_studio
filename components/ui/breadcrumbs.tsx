'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'

const breadcrumbsVariants = cva('flex items-center gap-1 text-sm', {
  variants: {
    variant: {
      default: 'text-muted-foreground',
      light: 'text-foreground/60',
      pill: 'bg-muted/50 px-3 py-1.5 rounded-full',
    },
    size: {
      default: 'text-sm',
      sm: 'text-xs',
      lg: 'text-base',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
})

const breadcrumbItemVariants = cva(
  'transition-colors duration-quick hover:text-foreground',
  {
    variants: {
      active: {
        true: 'text-foreground font-medium pointer-events-none',
        false: '',
      },
    },
    defaultVariants: {
      active: false,
    },
  }
)

export interface BreadcrumbItem {
  label: string
  href?: string
  icon?: React.ReactNode
}

export interface BreadcrumbsProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof breadcrumbsVariants> {
  items: BreadcrumbItem[]
  showHome?: boolean
  homeHref?: string
  separator?: React.ReactNode
  maxItems?: number
  collapseFrom?: 'start' | 'middle'
}

function Breadcrumbs({
  className,
  variant,
  size,
  items,
  showHome = false,
  homeHref = '/dashboard',
  separator,
  maxItems,
  collapseFrom = 'middle',
  ...props
}: BreadcrumbsProps) {
  // Handle collapsing for long breadcrumb trails
  const displayItems = React.useMemo(() => {
    if (!maxItems || items.length <= maxItems) {
      return items
    }

    if (collapseFrom === 'start') {
      // Keep last N items
      return [
        { label: '...', href: undefined },
        ...items.slice(-(maxItems - 1)),
      ]
    }

    // Middle collapse: keep first and last, collapse middle
    const first = items.slice(0, 1)
    const last = items.slice(-(maxItems - 2))
    return [...first, { label: '...', href: undefined }, ...last]
  }, [items, maxItems, collapseFrom])

  const defaultSeparator = (
    <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50" />
  )

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(breadcrumbsVariants({ variant, size }), className)}
      {...props}
    >
      <ol className="flex items-center gap-1 flex-wrap">
        {/* Home link */}
        {showHome && (
          <>
            <li>
              <Link
                href={homeHref}
                className={cn(
                  breadcrumbItemVariants({ active: false }),
                  'flex items-center gap-1'
                )}
              >
                <Home className="h-3.5 w-3.5" />
                <span className="sr-only">Home</span>
              </Link>
            </li>
            <li aria-hidden="true" className="flex items-center">
              {separator || defaultSeparator}
            </li>
          </>
        )}

        {/* Breadcrumb items */}
        {displayItems.map((item, index) => {
          const isLast = index === displayItems.length - 1
          const isEllipsis = item.label === '...'

          return (
            <React.Fragment key={index}>
              <li className="flex items-center">
                {item.href && !isLast && !isEllipsis ? (
                  <Link
                    href={item.href}
                    className={cn(
                      breadcrumbItemVariants({ active: false }),
                      'flex items-center gap-1.5'
                    )}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                ) : (
                  <span
                    className={cn(
                      breadcrumbItemVariants({ active: isLast }),
                      'flex items-center gap-1.5',
                      isEllipsis && 'px-1'
                    )}
                    aria-current={isLast ? 'page' : undefined}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </span>
                )}
              </li>

              {/* Separator */}
              {!isLast && (
                <li aria-hidden="true" className="flex items-center">
                  {separator || defaultSeparator}
                </li>
              )}
            </React.Fragment>
          )
        })}
      </ol>
    </nav>
  )
}

export { Breadcrumbs, breadcrumbsVariants }
