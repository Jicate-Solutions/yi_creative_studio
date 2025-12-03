/**
 * Date utilities for form validation
 * Supports multiple date formats commonly used in event forms
 */

const MONTH_NAMES = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december'
]

const MONTH_ABBREVS = [
  'jan', 'feb', 'mar', 'apr', 'may', 'jun',
  'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
]

/**
 * Parse various date string formats into a Date object
 * Supports:
 * - ISO format: 2025-12-25
 * - US format: 12/25/2025 or 12-25-2025
 * - European format: 25/12/2025 or 25-12-2025
 * - Natural format: December 25, 2025 or Dec 25 2025
 * - Compact: 25 December 2025
 *
 * @param dateStr - Date string to parse
 * @returns Date object or null if parsing fails
 */
export function parseDateString(dateStr: string): Date | null {
  if (!dateStr || typeof dateStr !== 'string') return null

  const trimmed = dateStr.trim()
  if (!trimmed) return null

  // Try native Date parsing first (handles ISO and many standard formats)
  const nativeParsed = new Date(trimmed)
  if (!isNaN(nativeParsed.getTime())) {
    return nativeParsed
  }

  // Try DD/MM/YYYY or DD-MM-YYYY format (European)
  const europeanFormat = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
  if (europeanFormat) {
    const [, day, month, year] = europeanFormat
    const d = parseInt(day, 10)
    const m = parseInt(month, 10)
    const y = parseInt(year, 10)

    // Validate ranges
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31 && y >= 1900 && y <= 2100) {
      return new Date(y, m - 1, d)
    }
  }

  // Try "Month DD, YYYY" or "Month DD YYYY" format
  for (let i = 0; i < MONTH_NAMES.length; i++) {
    const monthName = MONTH_NAMES[i]
    const monthAbbrev = MONTH_ABBREVS[i]

    // Full month name: December 25, 2025
    const fullMonthRegex = new RegExp(`${monthName}\\s+(\\d{1,2}),?\\s+(\\d{4})`, 'i')
    const fullMatch = trimmed.match(fullMonthRegex)
    if (fullMatch) {
      return new Date(parseInt(fullMatch[2], 10), i, parseInt(fullMatch[1], 10))
    }

    // Abbreviated month: Dec 25, 2025
    const abbrevRegex = new RegExp(`${monthAbbrev}\\s+(\\d{1,2}),?\\s+(\\d{4})`, 'i')
    const abbrevMatch = trimmed.match(abbrevRegex)
    if (abbrevMatch) {
      return new Date(parseInt(abbrevMatch[2], 10), i, parseInt(abbrevMatch[1], 10))
    }

    // DD Month YYYY: 25 December 2025
    const dayFirstRegex = new RegExp(`(\\d{1,2})\\s+${monthName},?\\s+(\\d{4})`, 'i')
    const dayFirstMatch = trimmed.match(dayFirstRegex)
    if (dayFirstMatch) {
      return new Date(parseInt(dayFirstMatch[2], 10), i, parseInt(dayFirstMatch[1], 10))
    }

    // DD Mon YYYY: 25 Dec 2025
    const dayFirstAbbrevRegex = new RegExp(`(\\d{1,2})\\s+${monthAbbrev},?\\s+(\\d{4})`, 'i')
    const dayFirstAbbrevMatch = trimmed.match(dayFirstAbbrevRegex)
    if (dayFirstAbbrevMatch) {
      return new Date(parseInt(dayFirstAbbrevMatch[2], 10), i, parseInt(dayFirstAbbrevMatch[1], 10))
    }
  }

  return null
}

/**
 * Check if a date string represents a date in the past
 * Compares against today's date at midnight (ignores time)
 *
 * @param dateStr - Date string to check
 * @returns true if date is in the past, false otherwise (including invalid dates)
 */
export function isPastDate(dateStr: string): boolean {
  const parsed = parseDateString(dateStr)
  if (!parsed) return false

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const eventDate = new Date(parsed)
  eventDate.setHours(0, 0, 0, 0)

  return eventDate < today
}

/**
 * Check if a date is valid
 *
 * @param dateStr - Date string to check
 * @returns true if date can be parsed successfully
 */
export function isValidDate(dateStr: string): boolean {
  return parseDateString(dateStr) !== null
}

/**
 * Format a date for display
 *
 * @param dateStr - Date string to format
 * @returns Formatted date string or original if parsing fails
 */
export function formatDateForDisplay(dateStr: string): string {
  const parsed = parseDateString(dateStr)
  if (!parsed) return dateStr

  return parsed.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
