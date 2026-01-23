/**
 * Utility functions for generating secure invite tokens
 */

/**
 * Generate a secure random token for invite links
 * @returns 32-character hexadecimal string
 */
export function generateInviteToken(): string {
  // Use Web Crypto API for secure random generation
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Generate a short display-friendly token
 * Uses characters that are easy to read and type (no 0/O, 1/I/L confusion)
 * @returns 8-character alphanumeric string
 */
export function generateShortToken(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const array = new Uint8Array(8)
  crypto.getRandomValues(array)
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars[array[i] % chars.length]
  }
  return result
}
