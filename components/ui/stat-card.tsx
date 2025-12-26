'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react'

const statCardVariants = cva(
  'relative overflow-hidden rounded-2xl p-5 transition-all',
  {
    variants: {
      variant: {
        default: 'glass-stat',
        elevated: 'glass-elevated',
        flat: 'bg-card',
        gradient: 'glass-interactive gradient-border-subtle',
      },
      size: {
        default: '',
        sm: 'p-4',
        lg: 'p-6',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

const trendVariants = cva(
  'inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full',
  {
    variants: {
      trend: {
        up: 'bg-success/10 text-success dark:bg-success/20',
        down: 'bg-destructive/10 text-destructive dark:bg-destructive/20',
        neutral: 'bg-muted text-muted-foreground',
      },
    },
    defaultVariants: {
      trend: 'neutral',
    },
  }
)

export interface StatCardTrend {
  value: number | string
  direction: 'up' | 'down' | 'neutral'
  label?: string
}

export interface StatCardDetails {
  title?: string
  items: { label: string; value: string | number }[]
  actions?: { label: string; href: string }[]
}

export interface StatCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statCardVariants> {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  iconBgClass?: string
  gradientClass?: string
  trend?: StatCardTrend
  details?: StatCardDetails
  expandable?: boolean
  animateValue?: boolean
  loading?: boolean
  actions?: React.ReactNode
}

function StatCard({
  className,
  variant,
  size,
  title,
  value,
  subtitle,
  icon,
  iconBgClass = 'bg-primary/10',
  gradientClass,
  trend,
  details,
  expandable = false,
  animateValue = true,
  loading = false,
  actions,
  onDrag,
  onDragEnd,
  onDragStart,
  onAnimationStart,
  onAnimationEnd,
  ...props
}: StatCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [displayValue, setDisplayValue] = useState<number | string>(
    typeof value === 'number' ? 0 : value
  )

  // Animated counter for numeric values
  useEffect(() => {
    if (!animateValue || typeof value !== 'number') {
      setDisplayValue(value)
      return
    }

    const duration = 1000
    const steps = 30
    const increment = value / steps
    let current = 0

    const timer = setInterval(() => {
      current += increment
      if (current >= value) {
        setDisplayValue(value)
        clearInterval(timer)
      } else {
        setDisplayValue(Math.floor(current))
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [value, animateValue])

  const TrendIcon =
    trend?.direction === 'up'
      ? TrendingUp
      : trend?.direction === 'down'
        ? TrendingDown
        : Minus

  const handleClick = () => {
    if (expandable && details) {
      setIsExpanded(!isExpanded)
    }
  }

  return (
    <motion.div
      className={cn(
        statCardVariants({ variant, size }),
        expandable && details && 'cursor-pointer',
        className
      )}
      onClick={handleClick}
      whileHover={expandable ? { y: -2, scale: 1.01 } : undefined}
      layout
      {...props}
    >
      {/* Background Gradient */}
      {gradientClass && (
        <div
          className={cn(
            'absolute inset-0 bg-gradient-to-br opacity-50 pointer-events-none',
            gradientClass
          )}
        />
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-20">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10">
        {/* Header Row: Icon + Actions */}
        <div className="flex items-start justify-between mb-3">
          {/* Icon */}
          {icon && (
            <div
              className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center',
                iconBgClass
              )}
            >
              {icon}
            </div>
          )}

          {/* Actions or Expand Indicator */}
          {actions ? (
            <div onClick={(e) => e.stopPropagation()}>{actions}</div>
          ) : expandable && details ? (
            <motion.div
              animate={{ rotate: isExpanded ? 90 : 0 }}
              className="text-muted-foreground"
            >
              <ChevronRight className="w-4 h-4" />
            </motion.div>
          ) : null}
        </div>

        {/* Value */}
        <motion.div
          className="text-2xl font-bold text-foreground mb-1"
          key={String(displayValue)}
        >
          {typeof displayValue === 'number'
            ? displayValue.toLocaleString()
            : displayValue}
        </motion.div>

        {/* Title */}
        <div className="text-sm font-medium text-foreground/80 mb-0.5">
          {title}
        </div>

        {/* Subtitle + Trend Row */}
        <div className="flex items-center gap-2 flex-wrap">
          {subtitle && (
            <span className="text-xs text-muted-foreground">{subtitle}</span>
          )}
          {trend && (
            <span className={cn(trendVariants({ trend: trend.direction }))}>
              <TrendIcon className="w-3 h-3" />
              {trend.value}
              {trend.label && (
                <span className="text-muted-foreground ml-1">{trend.label}</span>
              )}
            </span>
          )}
        </div>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {isExpanded && details && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="relative z-10 mt-4 pt-4 border-t border-border/50"
          >
            {details.title && (
              <h4 className="text-sm font-semibold text-foreground mb-2">
                {details.title}
              </h4>
            )}
            <div className="space-y-1.5">
              {details.items.map((item, i) => (
                <div key={i} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-medium text-foreground">
                    {typeof item.value === 'number'
                      ? item.value.toLocaleString()
                      : item.value}
                  </span>
                </div>
              ))}
            </div>
            {details.actions && details.actions.length > 0 && (
              <div className="flex gap-2 mt-3">
                {details.actions.map((action, i) => (
                  <a
                    key={i}
                    href={action.href}
                    className="text-xs text-primary hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {action.label}
                  </a>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export { StatCard, statCardVariants }
