/**
 * Time Formatting Utilities for Creative Generation
 * Converts various time formats to user-friendly 12-hour AM/PM format
 */

/**
 * Convert time string to 12-hour AM/PM format
 * Handles multiple input formats:
 * - 24-hour format: "14:30" → "2:30 PM"
 * - 12-hour with AM/PM: "2:30 PM" → "2:30 PM" (preserved)
 * - 12-hour without suffix: "2:30" → attempts 24-hour conversion
 *
 * @param timeInput - Time in various formats
 * @returns Time in "h:MM AM/PM" format (e.g., "2:30 PM")
 *
 * Examples:
 * - "14:30" → "2:30 PM"
 * - "09:00" → "9:00 AM"
 * - "00:15" → "12:15 AM"
 * - "12:00" → "12:00 PM"
 * - "23:59" → "11:59 PM"
 * - "1:00 PM" → "1:00 PM" (preserved)
 * - "10:30 AM" → "10:30 AM" (preserved)
 */
export function formatEventTime(timeInput: string | undefined | null): string {
  if (!timeInput || typeof timeInput !== 'string') return ''

  const trimmed = timeInput.trim()
  if (!trimmed) return ''

  // Check if already in 12-hour format with AM/PM suffix
  // Matches: "1:00 PM", "10:30 AM", "12:00PM", "1:00pm", etc.
  const amPmMatch = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)$/i)
  if (amPmMatch) {
    const hour = parseInt(amPmMatch[1], 10)
    const minutes = amPmMatch[2]
    const period = amPmMatch[3].toUpperCase()

    // Validate hour (1-12 for 12-hour format)
    if (hour >= 1 && hour <= 12) {
      return `${hour}:${minutes} ${period}`
    }
  }

  // Handle 24-hour format conversion
  const parts = trimmed.split(':')
  if (parts.length < 2) return trimmed // Return as-is if invalid format

  // Clean the minute part (remove any trailing AM/PM that might be attached)
  const minutePart = parts[1].replace(/\s*(AM|PM|am|pm)$/, '')
  const hour24 = parseInt(parts[0], 10)
  const minutes = minutePart.padStart(2, '0').substring(0, 2)

  if (isNaN(hour24) || hour24 < 0 || hour24 > 23) return trimmed // Return as-is if invalid

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
