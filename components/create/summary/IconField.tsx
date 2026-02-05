'use client'

import { useState } from 'react'
import { Pencil, Sparkles, Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useLongPress } from '@/hooks/use-long-press'
import type { LucideIcon } from 'lucide-react'

interface IconFieldProps {
  /** Field ID for editing */
  fieldId: string
  /** Icon to display before value */
  icon: LucideIcon
  /** The field value to display */
  value: string
  /** Whether this field was filled by AI */
  isAiFilled?: boolean
  /** Callback when edit is triggered */
  onEdit: () => void
  /** Whether device is mobile (for touch interactions) */
  isMobile: boolean
  /** Optional class name */
  className?: string
}

/**
 * Icon-only field display for the Summary Card
 *
 * Displays: [Icon] Value with edit affordance
 * - Desktop: Hover reveals edit icon
 * - Mobile: Long-press triggers context menu
 */
export function IconField({
  fieldId,
  icon: Icon,
  value,
  isAiFilled = false,
  onEdit,
  isMobile,
  className,
}: IconFieldProps) {
  const [showContextMenu, setShowContextMenu] = useState(false)
  const [copied, setCopied] = useState(false)

  // Long press handler for mobile
  const { handlers, isLongPressing } = useLongPress({
    onLongPress: () => setShowContextMenu(true),
    onClick: isMobile ? undefined : onEdit, // On mobile, single tap does nothing (long press for menu)
    threshold: 500,
  })

  // Copy value to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      setShowContextMenu(false)
    } catch {
      // Clipboard access denied
    }
  }

  // Handle edit from context menu
  const handleEdit = () => {
    setShowContextMenu(false)
    onEdit()
  }

  return (
    <div className="relative">
      <div
        {...(isMobile ? handlers : {})}
        className={cn(
          'group flex items-start gap-2 rounded-md px-2 py-1.5 transition-colors',
          'hover:bg-muted/50',
          isLongPressing && 'bg-muted/70',
          isAiFilled && 'bg-violet-50/50 dark:bg-violet-900/10',
          className
        )}
      >
        {/* Icon */}
        <Icon className={cn(
          'h-4 w-4 shrink-0 mt-0.5',
          isAiFilled ? 'text-violet-600 dark:text-violet-400' : 'text-muted-foreground'
        )} />

        {/* Value */}
        <span className="flex-1 text-sm break-words">
          {value}
        </span>

        {/* AI indicator */}
        {isAiFilled && (
          <Sparkles className="h-3 w-3 shrink-0 text-violet-500 mt-0.5" />
        )}

        {/* Edit button - Desktop only (hover to reveal) */}
        {!isMobile && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation()
              onEdit()
            }}
            className={cn(
              'h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity',
              'text-muted-foreground hover:text-foreground'
            )}
          >
            <Pencil className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Mobile Context Menu (shown on long-press) */}
      {showContextMenu && isMobile && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowContextMenu(false)}
          />

          {/* Menu */}
          <div className="absolute right-0 top-full mt-1 z-50 min-w-[120px] rounded-md border bg-popover p-1 shadow-md">
            <button
              onClick={handleEdit}
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </button>
            <button
              onClick={handleCopy}
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-green-600" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
