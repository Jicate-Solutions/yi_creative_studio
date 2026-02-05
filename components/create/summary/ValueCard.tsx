'use client'

import { cn } from '@/lib/utils'
import { IconField } from './IconField'
import { getFieldIcon } from '@/lib/config/field-icons'
import type { LucideIcon } from 'lucide-react'

interface FieldData {
  id: string
  value: string
  isAiFilled?: boolean
}

interface ValueCardProps {
  /** Group icon (optional - shown in header if provided) */
  icon?: LucideIcon
  /** Group label for accessibility (sr-only) */
  label: string
  /** Fields to display in this card */
  fields: FieldData[]
  /** Callback when a field edit is triggered */
  onEditField: (fieldId: string) => void
  /** Whether device is mobile */
  isMobile: boolean
  /** Optional class name */
  className?: string
  /** Whether to show fields inline (horizontal) vs stacked (vertical) */
  inline?: boolean
}

/**
 * Value Card Component
 *
 * Groups related fields into a mini-card with icon-only display.
 * Used in the redesigned Summary Card for card-per-group layout.
 *
 * @example
 * ```tsx
 * <ValueCard
 *   label="Timing"
 *   fields={[
 *     { id: 'eventDate', value: '28.01.2026' },
 *     { id: 'eventTime', value: '10:00 AM' },
 *   ]}
 *   onEditField={(id) => openEditModal(id)}
 *   isMobile={false}
 * />
 * ```
 */
export function ValueCard({
  icon: GroupIcon,
  label,
  fields,
  onEditField,
  isMobile,
  className,
  inline = false,
}: ValueCardProps) {
  // Filter out empty fields
  const nonEmptyFields = fields.filter(
    (f) => f.value && f.value.trim() !== ''
  )

  // Don't render if all fields are empty
  if (nonEmptyFields.length === 0) {
    return null
  }

  return (
    <div
      className={cn(
        'rounded-lg border bg-card/50 overflow-hidden',
        className
      )}
      role="group"
      aria-label={label}
    >
      {/* Visually hidden label for accessibility */}
      <span className="sr-only">{label}</span>

      {/* Fields container */}
      <div
        className={cn(
          'p-2',
          inline ? 'flex flex-wrap items-center gap-x-4 gap-y-1' : 'space-y-0.5'
        )}
      >
        {nonEmptyFields.map((field) => {
          const FieldIcon = getFieldIcon(field.id)

          if (inline) {
            // Inline mode: compact display with bullet separators
            return (
              <div
                key={field.id}
                className="flex items-center gap-1.5 text-sm"
              >
                <FieldIcon className={cn(
                  'h-3.5 w-3.5 shrink-0',
                  field.isAiFilled ? 'text-violet-600' : 'text-muted-foreground'
                )} />
                <span className="truncate">{field.value}</span>
              </div>
            )
          }

          // Stacked mode: full IconField with edit support
          return (
            <IconField
              key={field.id}
              fieldId={field.id}
              icon={FieldIcon}
              value={field.value}
              isAiFilled={field.isAiFilled}
              onEdit={() => onEditField(field.id)}
              isMobile={isMobile}
            />
          )
        })}
      </div>
    </div>
  )
}

/**
 * Compact inline display for timing (date + time on one line)
 */
export function TimingCard({
  date,
  time,
  endTime,
  onEditField,
  isMobile,
  aiFilledFields = [],
}: {
  date?: string
  time?: string
  endTime?: string
  onEditField: (fieldId: string) => void
  isMobile: boolean
  aiFilledFields?: string[]
}) {
  const hasContent = date || time || endTime

  if (!hasContent) return null

  const fields: FieldData[] = []

  if (date) {
    fields.push({ id: 'eventDate', value: date, isAiFilled: aiFilledFields.includes('eventDate') })
  }
  if (time) {
    fields.push({ id: 'eventTime', value: time, isAiFilled: aiFilledFields.includes('eventTime') })
  }
  if (endTime) {
    fields.push({ id: 'eventEndTime', value: endTime, isAiFilled: aiFilledFields.includes('eventEndTime') })
  }

  return (
    <ValueCard
      label="Timing"
      fields={fields}
      onEditField={onEditField}
      isMobile={isMobile}
      inline={true}
    />
  )
}
