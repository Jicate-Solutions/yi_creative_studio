/**
 * Sanitize Log Data Utility
 * Truncates base64 data URLs to prevent console flooding while preserving debugging info
 */

/**
 * Sanitizes objects for console logging by truncating base64 data URLs
 *
 * @param data - Any object that may contain base64 image data (formData, speakers, etc.)
 * @param maxBase64Length - Maximum length of base64 strings to show (default: 50)
 * @returns Sanitized copy safe for console logging
 *
 * @example
 * const formData = {
 *   speakers: [{ name: "John", photoUrl: "data:image/png;base64,iVBORw0..." }]
 * }
 * console.log(JSON.stringify(sanitizeForLogging(formData), null, 2))
 * // Output: { speakers: [{ name: "John", photoUrl: "data:image/png;base64,iVBOR...[TRUNCATED 50000 chars]" }] }
 */
export function sanitizeForLogging(data: any, maxBase64Length: number = 50): any {
  // Handle null/undefined
  if (data === null || data === undefined) {
    return data
  }

  // Handle primitive types (string, number, boolean)
  if (typeof data === 'string') {
    return sanitizeString(data, maxBase64Length)
  }

  if (typeof data !== 'object') {
    return data
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeForLogging(item, maxBase64Length))
  }

  // Handle objects - deep clone and recursively sanitize
  const sanitized: any = {}
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      sanitized[key] = sanitizeForLogging(data[key], maxBase64Length)
    }
  }

  return sanitized
}

/**
 * Sanitizes a single string value by truncating base64 data URLs
 * @param value - String value to sanitize
 * @param maxBase64Length - Maximum length of base64 strings to show
 * @returns Sanitized string
 */
function sanitizeString(value: string, maxBase64Length: number): string {
  // Check if this is a base64 data URL
  // Pattern: data:image/{format};base64,{base64-data}
  const base64Pattern = /^data:image\/[^;]+;base64,/
  const match = value.match(base64Pattern)

  if (!match) {
    // Not a base64 data URL, return as-is
    return value
  }

  // Extract the prefix (data:image/png;base64,) and the base64 data
  const prefix = match[0]
  const base64Data = value.substring(prefix.length)

  // If the base64 data is short enough, keep it
  if (base64Data.length <= maxBase64Length) {
    return value
  }

  // Truncate the base64 data and add a marker
  const truncatedBase64 = base64Data.substring(0, maxBase64Length)
  const originalLength = base64Data.length

  return `${prefix}${truncatedBase64}...[TRUNCATED ${originalLength} chars]`
}

/**
 * Alternative: JSON.stringify replacer function for inline use
 * Can be used directly in JSON.stringify as the second parameter
 *
 * @example
 * JSON.stringify(data, createBase64Replacer(50), 2)
 */
export function createBase64Replacer(maxBase64Length: number = 50) {
  return function replacer(_key: string, value: any): any {
    if (typeof value === 'string') {
      return sanitizeString(value, maxBase64Length)
    }
    return value
  }
}
