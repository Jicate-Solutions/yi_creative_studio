/**
 * Time Formatting Utilities for Creative Generation
 * Converts 24-hour format to user-friendly 12-hour AM/PM format
 */

/**
 * Convert 24-hour time string to 12-hour AM/PM format
 * @param time24 - Time in "HH:MM" or "HH:MM:SS" 24-hour format
 * @returns Time in "h:MM AM/PM" format (e.g., "2:30 PM")
 *
 * Examples:
 * - "14:30" → "2:30 PM"
 * - "09:00" → "9:00 AM"
 * - "00:15" → "12:15 AM"
 * - "12:00" → "12:00 PM"
 * - "23:59" → "11:59 PM"
 */
export function formatEventTime(time24: string | undefined | null): string {
  if (!time24 || typeof time24 !== 'string') return ''

  // Extract hours and minutes
  const parts = time24.trim().split(':')
  if (parts.length < 2) return time24 // Return as-is if invalid format

  const hour24 = parseInt(parts[0], 10)
  const minutes = parts[1].padStart(2, '0')

  if (isNaN(hour24)) return time24 // Return as-is if invalid

  // Convert to 12-hour format
  let hour12: number
  let period: 'AM' | 'PM'

  if (hour24 === 0) {
    hour12 = 12
    period = 'AM'
  } else if (hour24 === 12) {
    hour12 = 12
    period = 'PM'
  } else if (hour24 > 12) {
    hour12 = hour24 - 12
    period = 'PM'
  } else {
    hour12 = hour24
    period = 'AM'
  }

  return `${hour12}:${minutes} ${period}`
}

/**
 * Format time range for display (e.g., "2:30 PM - 5:00 PM")
 * @param startTime - Start time in 24-hour format
 * @param endTime - End time in 24-hour format
 * @returns Formatted time range string
 */
export function formatTimeRange(startTime: string | undefined | null, endTime: string | undefined | null): string {
  const start = formatEventTime(startTime)
  const end = formatEventTime(endTime)

  if (start && end) {
    return `${start} - ${end}`
  } else if (start) {
    return start
  } else if (end) {
    return end
  }

  return ''
}
