/**
 * Universal Fetch Wrapper with Retry Logic
 *
 * Provides robust HTTP request handling with:
 * - Configurable timeouts using AbortController
 * - Exponential backoff with jitter for retries
 * - Network error detection and categorization
 * - Retryable vs non-retryable error distinction
 * - Structured logging for debugging
 *
 * Usage:
 * ```typescript
 * const response = await fetchWithRetry(
 *   'https://api.example.com/endpoint',
 *   { method: 'POST', headers: {...}, body: JSON.stringify(data) },
 *   { maxRetries: 3, timeout: 60000, baseDelay: 1000 }
 * )
 * ```
 */

/**
 * Custom error class for network-related failures
 * (ECONNRESET, ETIMEDOUT, ECONNREFUSED, etc.)
 */
export class NetworkError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message)
    this.name = 'NetworkError'
  }
}

/**
 * Custom error class for timeout failures
 */
export class TimeoutError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'TimeoutError'
  }
}

/**
 * Configuration options for fetch retry behavior
 */
export interface FetchWithRetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number

  /** Base delay in milliseconds for exponential backoff (default: 1000ms) */
  baseDelay?: number

  /** Request timeout in milliseconds (default: 60000ms / 60s) */
  timeout?: number

  /** HTTP status codes that should trigger a retry (default: [408, 429, 500, 502, 503, 504]) */
  retryableStatuses?: number[]

  /** Optional request ID for logging and tracing */
  requestId?: string

  /** When false, 429 responses throw immediately instead of retrying (default: true).
   *  Use for quota-exhausted APIs (e.g. Gemini image gen) where retrying in 2-8s is pointless. */
  retryOn429?: boolean
}

/**
 * Default retry configuration
 */
const DEFAULT_OPTIONS: Required<Omit<FetchWithRetryOptions, 'requestId'>> = {
  maxRetries: 3,
  baseDelay: 1000,
  timeout: 60000, // 60 seconds
  retryableStatuses: [408, 429, 500, 502, 503, 504],
  retryOn429: true,
}

/**
 * Detect if an error is a network-related error that should trigger a retry
 */
function isNetworkError(error: any): boolean {
  // Check error code (Node.js network errors)
  if (
    error.code === 'ECONNRESET' ||
    error.code === 'ECONNREFUSED' ||
    error.code === 'ETIMEDOUT' ||
    error.code === 'EHOSTUNREACH' ||
    error.code === 'ENOTFOUND' ||
    error.code === 'EAI_AGAIN'
  ) {
    return true
  }

  // Check cause chain (nested errors)
  if (error.cause) {
    const causeCode = error.cause.code
    if (
      causeCode === 'ECONNRESET' ||
      causeCode === 'ECONNREFUSED' ||
      causeCode === 'ETIMEDOUT' ||
      causeCode === 'EHOSTUNREACH'
    ) {
      return true
    }
  }

  // Check error message patterns
  const message = error.message?.toLowerCase() || ''
  if (
    message.includes('fetch failed') ||
    message.includes('network') ||
    message.includes('connection') ||
    message.includes('econnreset')
  ) {
    return true
  }

  return false
}

/**
 * Build a human-readable detail string for an error, digging into the cause chain.
 * undici throws `TypeError: fetch failed` whose REAL reason lives in `error.cause.code`
 * (e.g. ECONNRESET, UND_ERR_HEADERS_TIMEOUT, self-signed-cert). Surface it for diagnosis.
 */
function describeError(error: any): string {
  const parts = [
    error?.code,
    error?.cause?.code,
    error?.cause?.cause?.code,
    error?.cause?.message,
  ].filter(Boolean)
  const detail = parts.length ? ` [${Array.from(new Set(parts)).join(' → ')}]` : ''
  return `${error?.message || String(error)}${detail}`
}

/**
 * Check if HTTP status code should trigger a retry
 */
function isRetryableStatus(status: number, retryableStatuses: number[]): boolean {
  return retryableStatuses.includes(status)
}

/**
 * Calculate delay for exponential backoff with jitter
 *
 * Formula: (baseDelay * 2^attempt) + jitter
 * Jitter: Random value between -30% and +30% of baseDelay
 *
 * Example with baseDelay=1000ms:
 * - Attempt 0: ~1000ms ± 300ms = 700-1300ms
 * - Attempt 1: ~2000ms ± 300ms = 1700-2300ms
 * - Attempt 2: ~4000ms ± 300ms = 3700-4300ms
 */
function calculateBackoffDelay(attempt: number, baseDelay: number): number {
  // Exponential backoff: baseDelay * 2^attempt
  const exponentialDelay = baseDelay * Math.pow(2, attempt)

  // Add jitter: ±30% of baseDelay to prevent thundering herd
  const jitter = (Math.random() - 0.5) * 2 * 0.3 * baseDelay

  return Math.floor(exponentialDelay + jitter)
}

/**
 * Fetch with automatic retry logic and timeout handling
 *
 * Features:
 * - Retries transient network errors and specific HTTP status codes
 * - Exponential backoff with jitter to prevent thundering herd
 * - Configurable timeout using AbortController
 * - Does NOT retry non-retryable errors (auth errors, validation errors)
 * - Structured logging for debugging and monitoring
 *
 * @throws {NetworkError} When network error persists after all retries
 * @throws {TimeoutError} When request exceeds timeout
 * @throws {Error} For non-retryable errors (auth, validation, etc.)
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retryOptions: FetchWithRetryOptions = {}
): Promise<Response> {
  // Merge with defaults
  const config = {
    ...DEFAULT_OPTIONS,
    ...retryOptions
  }

  const { maxRetries, baseDelay, timeout, retryableStatuses, requestId, retryOn429 = true } = config
  const logPrefix = requestId ? `[Fetch ${requestId}]` : '[Fetch]'

  let lastError: Error | null = null

  // Retry loop
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Create AbortController for timeout
      const abortController = new AbortController()
      const timeoutId = setTimeout(() => abortController.abort(), timeout)

      // Merge abort signal with existing signal (if any)
      const signal = options.signal
        ? (() => {
            // Create a combined signal that aborts when either original or timeout aborts
            const originalSignal = options.signal
            const controller = abortController

            if (originalSignal.aborted) {
              controller.abort()
            } else {
              originalSignal.addEventListener('abort', () => controller.abort())
            }

            return controller.signal
          })()
        : abortController.signal

      // Make the fetch request
      console.log(`${logPrefix} Attempt ${attempt + 1}/${maxRetries + 1}: ${url}`)

      const response = await fetch(url, {
        ...options,
        signal
      })

      // Clear timeout on success
      clearTimeout(timeoutId)

      // Check if response status is retryable
      if (!response.ok && isRetryableStatus(response.status, retryableStatuses)) {
        // v43.4: Fast-fail on 429 when retryOn429=false (quota errors don't recover in 2-8s)
        if (response.status === 429 && !retryOn429) {
          console.error(`${logPrefix} ⚡ Rate limited (429) — fast-fail (retryOn429=false)`)
          throw new Error(`HTTP 429: ${response.statusText}`)
        }

        const isLastAttempt = attempt === maxRetries

        if (isLastAttempt) {
          console.error(`${logPrefix} ❌ All ${maxRetries + 1} attempts failed with status ${response.status}`)
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        // For 429: respect Retry-After header if present
        let delay: number
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After')
          delay = retryAfter ? parseInt(retryAfter, 10) * 1000 : calculateBackoffDelay(attempt, baseDelay)
          console.warn(`${logPrefix} ⏳ Rate limited (429) — waiting ${delay}ms (Retry-After: ${retryAfter ?? 'not set'})`)
        } else {
          delay = calculateBackoffDelay(attempt, baseDelay)
          console.warn(`${logPrefix} ⚠️ Attempt ${attempt + 1} failed with status ${response.status}, retrying in ${delay}ms...`)
        }
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }

      // Success or non-retryable error
      console.log(`${logPrefix} ✅ Request succeeded (status ${response.status})`)
      return response

    } catch (error: any) {
      const isLastAttempt = attempt === maxRetries

      // Check if error is due to timeout
      if (error.name === 'AbortError') {
        console.error(`${logPrefix} ⏱️ Request timed out after ${timeout}ms`)
        throw new TimeoutError(`Request timed out after ${timeout}ms`)
      }

      // Check if error is a network error (retryable)
      if (isNetworkError(error)) {
        lastError = error

        if (isLastAttempt) {
          // All retries exhausted
          console.error(`${logPrefix} ❌ Network error after ${maxRetries + 1} attempts:`, describeError(error))
          throw new NetworkError(
            `Network error after ${maxRetries + 1} attempts: ${describeError(error)}`,
            error
          )
        }

        // Calculate backoff delay and retry
        const delay = calculateBackoffDelay(attempt, baseDelay)
        console.warn(
          `${logPrefix} ⚠️ Attempt ${attempt + 1} failed with network error: ${describeError(error)}. Retrying in ${delay}ms...`
        )
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }

      // Non-retryable error (auth, validation, etc.) - throw immediately
      console.error(`${logPrefix} ❌ Non-retryable error:`, describeError(error))
      throw error
    }
  }

  // Should never reach here, but TypeScript requires it
  throw lastError || new Error('Unexpected retry loop exit')
}

/**
 * Convenience wrapper for JSON requests with retry logic
 *
 * Automatically:
 * - Sets Content-Type: application/json
 * - Parses response as JSON
 * - Handles JSON parse errors
 */
export async function fetchJsonWithRetry<T = any>(
  url: string,
  options: RequestInit = {},
  retryOptions: FetchWithRetryOptions = {}
): Promise<T> {
  const response = await fetchWithRetry(
    url,
    {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    },
    retryOptions
  )

  if (!response.ok) {
    // Try to parse error response
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`
    try {
      const errorData = await response.json()
      if (errorData.error?.message) {
        errorMessage = errorData.error.message
      } else if (errorData.message) {
        errorMessage = errorData.message
      }
    } catch {
      // Failed to parse error - use status text
    }
    throw new Error(errorMessage)
  }

  // Parse successful response
  try {
    return await response.json()
  } catch (error) {
    throw new Error(`Failed to parse JSON response: ${error}`)
  }
}
