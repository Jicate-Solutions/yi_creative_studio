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
  value?: string // Format: HH:MM (24-hour) for storage
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  error?: boolean
}

// Generate hours array (12-hour format: 12, 01, 02, ... 11)
const hours12 = ["12", "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11"]

// Generate minutes array (00, 05, 10, ... 55)
const minutes = Array.from({ length: 12 }, (_, i) =>
  (i * 5).toString().padStart(2, "0")
)

/**
 * Convert 24-hour format to 12-hour format with AM/PM
 */
function to12Hour(hour24: string): { hour12: string; period: "AM" | "PM" } {
  const h = parseInt(hour24, 10)
  if (isNaN(h)) return { hour12: "", period: "AM" }

  if (h === 0) return { hour12: "12", period: "AM" }
  if (h === 12) return { hour12: "12", period: "PM" }
  if (h > 12) return { hour12: (h - 12).toString().padStart(2, "0"), period: "PM" }
  return { hour12: h.toString().padStart(2, "0"), period: "AM" }
}

/**
 * Convert 12-hour format + period to 24-hour format
 */
function to24Hour(hour12: string, period: "AM" | "PM"): string {
  const h = parseInt(hour12, 10)
  if (isNaN(h)) return "00"

  if (period === "AM") {
    // 12 AM = 00, 1-11 AM = 01-11
    return h === 12 ? "00" : h.toString().padStart(2, "0")
  } else {
    // 12 PM = 12, 1-11 PM = 13-23
    return h === 12 ? "12" : (h + 12).toString().padStart(2, "0")
  }
}

export function TimePicker({
  value,
  onChange,
  disabled = false,
  className,
  error = false,
}: TimePickerProps) {
  // Parse value (24-hour format) into components
  const { hour24, minute } = React.useMemo(() => {
    if (!value) return { hour24: "", minute: "" }
    const parts = value.split(":")
    if (parts.length >= 2) {
      return { hour24: parts[0], minute: parts[1] }
    }
    return { hour24: "", minute: "" }
  }, [value])

  // Convert 24-hour to 12-hour for display
  const { hour12, period } = React.useMemo(() => {
    if (!hour24) return { hour12: "", period: "AM" as const }
    return to12Hour(hour24)
  }, [hour24])

  // Handle hour change (receives 12-hour format)
  const handleHourChange = (newHour12: string) => {
    if (onChange) {
      const newHour24 = to24Hour(newHour12, period)
      const newMinute = minute || "00"
      onChange(`${newHour24}:${newMinute}`)
    }
  }

  // Handle minute change
  const handleMinuteChange = (newMinute: string) => {
    if (onChange) {
      const currentHour24 = hour24 || "00"
      onChange(`${currentHour24}:${newMinute}`)
    }
  }

  // Handle period (AM/PM) change
  const handlePeriodChange = (newPeriod: "AM" | "PM") => {
    if (onChange) {
      const currentHour12 = hour12 || "12"
      const newHour24 = to24Hour(currentHour12, newPeriod)
      const currentMinute = minute || "00"
      onChange(`${newHour24}:${currentMinute}`)
    }
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 w-full h-10 px-3 border rounded-md bg-background",
        error && "border-destructive",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <Clock className="h-4 w-4 text-muted-foreground shrink-0" />

      <div className="flex items-center gap-1 flex-1">
        {/* Hour Select (12-hour format: 12, 01-11) */}
        <Select value={hour12} onValueChange={handleHourChange} disabled={disabled}>
          <SelectTrigger className="w-[58px] border-0 shadow-none h-8 px-2 focus:ring-0">
            <SelectValue placeholder="HH" />
          </SelectTrigger>
          <SelectContent>
            {hours12.map((h) => (
              <SelectItem key={h} value={h}>
                {h}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="text-muted-foreground font-medium">:</span>

        {/* Minute Select (00, 05, 10, ... 55) */}
        <Select value={minute} onValueChange={handleMinuteChange} disabled={disabled}>
          <SelectTrigger className="w-[58px] border-0 shadow-none h-8 px-2 focus:ring-0">
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

        {/* AM/PM Select */}
        <Select value={period} onValueChange={handlePeriodChange} disabled={disabled}>
          <SelectTrigger className="w-[58px] border-0 shadow-none h-8 px-2 focus:ring-0">
            <SelectValue placeholder="AM" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="AM">AM</SelectItem>
            <SelectItem value="PM">PM</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
