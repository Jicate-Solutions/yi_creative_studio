"use client"

import * as React from "react"
import { Clock } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface TimePickerProps {
  value?: string // Format: HH:MM (24-hour)
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  error?: boolean
}

// Generate hours array (00-23)
const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"))

// Generate minutes array (00, 05, 10, ... 55)
const minutes = Array.from({ length: 12 }, (_, i) =>
  (i * 5).toString().padStart(2, "0")
)

export function TimePicker({
  value,
  onChange,
  disabled = false,
  className,
  error = false,
}: TimePickerProps) {
  // Parse value into hour and minute
  const [hour, minute] = React.useMemo(() => {
    if (!value) return ["", ""]
    const parts = value.split(":")
    if (parts.length >= 2) {
      return [parts[0], parts[1]]
    }
    return ["", ""]
  }, [value])

  // Handle hour change
  const handleHourChange = (newHour: string) => {
    if (onChange) {
      const newMinute = minute || "00"
      onChange(`${newHour}:${newMinute}`)
    }
  }

  // Handle minute change
  const handleMinuteChange = (newMinute: string) => {
    if (onChange) {
      const newHour = hour || "00"
      onChange(`${newHour}:${newMinute}`)
    }
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Clock className="h-4 w-4 text-muted-foreground shrink-0" />

      {/* Hour Select */}
      <Select value={hour} onValueChange={handleHourChange} disabled={disabled}>
        <SelectTrigger
          className={cn(
            "w-[70px]",
            error && "border-destructive"
          )}
        >
          <SelectValue placeholder="HH" />
        </SelectTrigger>
        <SelectContent>
          {hours.map((h) => (
            <SelectItem key={h} value={h}>
              {h}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <span className="text-muted-foreground font-medium">:</span>

      {/* Minute Select */}
      <Select value={minute} onValueChange={handleMinuteChange} disabled={disabled}>
        <SelectTrigger
          className={cn(
            "w-[70px]",
            error && "border-destructive"
          )}
        >
          <SelectValue placeholder="MM" />
        </SelectTrigger>
        <SelectContent>
          {minutes.map((m) => (
            <SelectItem key={m} value={m}>
              {m}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
