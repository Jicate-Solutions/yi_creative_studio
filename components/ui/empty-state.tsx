'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  FileX,
  SearchX,
  ImageOff,
  FolderOpen,
  Inbox,
  AlertCircle,
  type LucideIcon,
} from 'lucide-react'

// Preset icons for common empty states
const presetIcons: Record<string, LucideIcon> = {
  noResults: SearchX,
  noData: FileX,
  noImages: ImageOff,
  emptyFolder: FolderOpen,
  inbox: Inbox,
  error: AlertCircle,
}

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Main title */
  title: string
  /** Description text */
  description?: string
  /** Icon to display - can be a preset name or custom icon component */
  icon?: keyof typeof presetIcons | LucideIcon
  /** Primary action button */
  action?: {
    label: string
    onClick: () => void
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  }
  /** Secondary action button */
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  /** Size variant */
  size?: 'sm' | 'default' | 'lg'
  /** Show in a card container */
  card?: boolean
}

/**
 * Reusable empty state component for consistent empty/no-data UI
 *
 * @example
 * // Basic usage
 * <EmptyState
 *   title="No results found"
 *   description="Try adjusting your search filters"
 *   icon="noResults"
 * />
 *
 * // With action button
 * <EmptyState
 *   title="No images yet"
 *   description="Upload your first image to get started"
 *   icon="noImages"
 *   action={{
 *     label: "Upload Image",
 *     onClick: () => setShowUpload(true),
 *   }}
 * />
 *
 * // Custom icon
 * <EmptyState
 *   title="No templates"
 *   icon={LayoutTemplate}
 *   action={{ label: "Create Template", onClick: handleCreate }}
 * />
 *
 * // In a card
 * <EmptyState
 *   card
 *   title="Empty Gallery"
 *   description="Your creatives will appear here"
 *   icon="noImages"
 * />
 */
export function EmptyState({
  title,
  description,
  icon = 'noData',
  action,
  secondaryAction,
  size = 'default',
  card = false,
  className,
  ...props
}: EmptyStateProps) {
  // Resolve icon - either from presets or custom component
  const Icon = typeof icon === 'string' ? presetIcons[icon] || FileX : icon

  const sizeClasses = {
    sm: {
      container: 'py-8',
      icon: 'h-10 w-10',
      iconContainer: 'p-3',
      title: 'text-sm font-medium',
      description: 'text-xs',
      button: 'h-8 text-xs',
    },
    default: {
      container: 'py-12',
      icon: 'h-12 w-12',
      iconContainer: 'p-4',
      title: 'text-base font-semibold',
      description: 'text-sm',
      button: 'h-9',
    },
    lg: {
      container: 'py-16',
      icon: 'h-16 w-16',
      iconContainer: 'p-5',
      title: 'text-lg font-semibold',
      description: 'text-base',
      button: 'h-10',
    },
  }

  const sizes = sizeClasses[size]

  const content = (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        sizes.container,
        className
      )}
      {...props}
    >
      {/* Icon */}
      <div
        className={cn(
          'rounded-full bg-muted mb-4',
          sizes.iconContainer
        )}
      >
        <Icon className={cn(sizes.icon, 'text-muted-foreground')} />
      </div>

      {/* Title */}
      <h3 className={cn(sizes.title, 'text-foreground mb-1')}>{title}</h3>

      {/* Description */}
      {description && (
        <p
          className={cn(
            sizes.description,
            'text-muted-foreground max-w-sm mb-4'
          )}
        >
          {description}
        </p>
      )}

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex items-center gap-2 mt-2">
          {action && (
            <Button
              onClick={action.onClick}
              variant={action.variant || 'default'}
              className={sizes.button}
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              onClick={secondaryAction.onClick}
              variant="outline"
              className={sizes.button}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  )

  if (card) {
    return (
      <Card className={cn('border-dashed', className)}>
        <CardContent className="p-0">{content}</CardContent>
      </Card>
    )
  }

  return content
}

/**
 * Compact inline empty state for lists and tables
 */
export function EmptyStateInline({
  message,
  className,
}: {
  message: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-center py-8 text-sm text-muted-foreground',
        className
      )}
    >
      {message}
    </div>
  )
}

/**
 * Empty state specifically for search results
 */
export function NoSearchResults({
  query,
  onClear,
}: {
  query?: string
  onClear?: () => void
}) {
  return (
    <EmptyState
      icon="noResults"
      title="No results found"
      description={
        query
          ? `No items match "${query}". Try different search terms.`
          : 'Try adjusting your search or filters.'
      }
      action={
        onClear
          ? {
              label: 'Clear Search',
              onClick: onClear,
              variant: 'outline',
            }
          : undefined
      }
    />
  )
}
