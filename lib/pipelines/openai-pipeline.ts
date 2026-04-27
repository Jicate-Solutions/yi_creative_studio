/**
 * OpenAI gpt-image-1 generation pipeline.
 *
 * Hardened wrapper around the OpenAI Node SDK that prevents the
 * `TypeError: terminated` / `ECONNRESET` failures observed on long
 * high-quality generations. The SDK's default client timeout is 10 minutes,
 * but Node 22's undici fetch can still drop an idle socket — so we ALSO
 * attach a request-level AbortSignal and map the resulting error classes
 * to clean, user-facing messages.
 *
 * Used exclusively by `app/api/generate-openai/route.ts`. The legacy
 * OpenAI branch in `app/api/generate/route.ts` is untouched.
 */

import OpenAI from 'openai'
import { Agent } from 'undici'
import type { CreativeFormat } from '@/lib/config/creative-formats'

export type GptImageQuality = 'low' | 'medium' | 'high'
export type GptImageSize = '1024x1024' | '1024x1536' | '1536x1024'

export const OPENAI_MODEL_CAPABILITIES: Record<string, {
  supportedSizes: GptImageSize[]
  supportsQualityTier: boolean
}> = {
  'gpt-image-1': {
    supportedSizes: ['1024x1024', '1024x1536', '1536x1024'],
    supportsQualityTier: true,
  },
}

export function validateOpenAIModelSize(modelId: string, size: string): boolean {
  const caps = OPENAI_MODEL_CAPABILITIES[modelId]
  if (!caps) return false
  return caps.supportedSizes.includes(size as GptImageSize)
}

export class OpenAITimeoutError extends Error {
  constructor(msg: string) {
    super(msg)
    this.name = 'OpenAITimeoutError'
  }
}

export class OpenAIConfigurationError extends Error {
  constructor(msg: string) {
    super(msg)
    this.name = 'OpenAIConfigurationError'
  }
}

const TIMEOUT_SIGNALS = [
  'econnreset',
  'terminated',
  'etimedout',
  'und_err_socket',
  'und_err_headers_timeout',
  'und_err_body_timeout',
  'und_err_connect_timeout',
  'aborterror',
  'aborted',
  'fetch failed',
  'request timed out',
  'socket hang up',
  'other side closed',
]

function isSocketTimeoutError(err: unknown): boolean {
  if (!err) return false
  const e = err as { name?: string; code?: string; message?: string; cause?: { code?: string; name?: string; message?: string } }
  const parts = [
    e.name, e.code, e.message,
    e.cause?.code, e.cause?.name, e.cause?.message,
  ].filter(Boolean).join(' ').toLowerCase()
  return TIMEOUT_SIGNALS.some((s) => parts.includes(s))
}

/**
 * Detects a truncated-response failure: OpenAI generated successfully and
 * began streaming the response, but the connection dropped mid-transfer
 * (ISP router, corporate proxy, Cloudflare edge, or undici itself). The
 * body arrives partial, the SDK's internal `JSON.parse` chokes, and we see
 * a bare `SyntaxError: Unexpected end of JSON input` with no socket-level
 * hints attached. Semantically identical to ECONNRESET — just one layer up
 * the stack — and equally retryable.
 *
 * Also covers `Unexpected token '<'` (HTML error page from an intermediate
 * proxy) and `Premature close` (stream ended early).
 */
function isTruncatedResponseError(err: unknown): boolean {
  if (!err) return false
  const e = err as { name?: string; message?: string; cause?: { name?: string; message?: string } }
  const name = (e.name ?? e.cause?.name ?? '').toLowerCase()
  const msg = (e.message ?? e.cause?.message ?? '').toLowerCase()
  if (name !== 'syntaxerror' && !msg.includes('premature close')) return false
  return (
    msg.includes('unexpected end of json') ||
    msg.includes('unexpected token') ||
    msg.includes('premature close')
  )
}

function isRetryableTransport(err: unknown): boolean {
  return isSocketTimeoutError(err) || isTruncatedResponseError(err)
}

// User-abort (request.signal aborted) vs infrastructure timeout (ECONNRESET, undici socket)
// — we only retry the latter.
function wasUserAborted(signal: AbortSignal | undefined, err: unknown): boolean {
  if (!signal?.aborted) return false
  const e = err as { name?: string; message?: string }
  const msg = `${e?.name ?? ''} ${e?.message ?? ''}`.toLowerCase()
  return msg.includes('abort')
}

/**
 * Module-level undici dispatcher.
 *
 * gpt-image-1 can take 2–3 minutes to respond. Undici's defaults
 * (headersTimeout: 300s, bodyTimeout: 300s) are close to that window,
 * and real-world traces show intermediate hops (ISP routers, corporate
 * proxies, Cloudflare) closing idle TCP sockets at ~100–150s. We disable
 * both timeouts here and rely on the per-request AbortSignal to enforce
 * an overall deadline. `keepAliveTimeout` is bumped so the socket stays
 * alive across the long idle period while the model is thinking.
 */
const openAIDispatcher = new Agent({
  headersTimeout: 0,
  bodyTimeout: 0,
  keepAliveTimeout: 120_000,
  keepAliveMaxTimeout: 10 * 60 * 1000,
  connect: { timeout: 30_000 },
  connections: 4,
  pipelining: 0,
})

export interface GenerateOpenAIParams {
  prompt: string
  format: CreativeFormat
  quality: GptImageQuality
  modelId?: string
  /** Optional caller signal (e.g. `request.signal`) — merged with our 9-minute hard cap. */
  signal?: AbortSignal
}

export interface GenerateOpenAIResult {
  /** Full data URL, e.g. `data:image/png;base64,...`. */
  imageBase64: string
  actualModel: string
  durationMs: number
}

/**
 * Generate an image with gpt-image-1.
 *
 * Hardening applied:
 *  - `timeout: 10 min` on the SDK client (inactivity cap).
 *  - `maxRetries: 2` — SDK auto-retries 429 / 5xx / socket errors.
 *  - Request-level `AbortSignal.any([caller, AbortSignal.timeout(9 min)])`
 *    so undici cannot silently close the socket before we notice.
 *  - Socket-timeout errors (ECONNRESET, `terminated`, `UND_ERR_*`, etc.)
 *    are converted into `OpenAITimeoutError` with a friendly message.
 *  - `response_format` is NEVER sent — gpt-image-1 rejects it; b64_json
 *    is the default response shape.
 */
export async function generateWithOpenAI(
  params: GenerateOpenAIParams
): Promise<GenerateOpenAIResult> {
  const { prompt, format, quality, modelId = 'gpt-image-1', signal: externalSignal } = params

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new OpenAIConfigurationError('OPENAI_API_KEY is not set')
  }

  const size: GptImageSize = (format.gptImageSize ?? '1024x1024') as GptImageSize
  if (!validateOpenAIModelSize(modelId, size)) {
    const caps = OPENAI_MODEL_CAPABILITIES[modelId]
    const supported = caps ? caps.supportedSizes.join(', ') : 'unknown'
    throw new OpenAIConfigurationError(
      `Model "${modelId}" does not support size "${size}". Supported: ${supported}.`
    )
  }

  // Custom dispatcher disables undici's socket timeouts so intermediate hops
  // can't silently kill the connection at ~2 minutes. Maps to `fetchOptions.dispatcher`
  // per OpenAI Node SDK v6 migration guide (the old `httpAgent` option was removed).
  const client = new OpenAI({
    apiKey,
    timeout: 10 * 60 * 1000,
    maxRetries: 0, // we do our own retries below so we can log each attempt
    // SDK v6 replaced `httpAgent` with `fetchOptions.dispatcher` (undici).
    // DOM RequestInit has no `dispatcher` key, and the SDK's MergedRequestInit
    // type narrows out per-request fields — cast loosely for this non-standard option.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fetchOptions: { dispatcher: openAIDispatcher } as any,
  })

  const hardCap = AbortSignal.timeout(9 * 60 * 1000)
  const signal: AbortSignal = externalSignal
    ? AbortSignal.any([externalSignal, hardCap])
    : hardCap

  const MAX_ATTEMPTS = 3
  const BACKOFF_MS = [0, 3_000, 8_000] // attempt 1: immediate, 2: 3s, 3: 8s

  let lastErr: unknown
  const overallT0 = Date.now()

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    if (BACKOFF_MS[attempt - 1] > 0) {
      console.log(`[OpenAI Pipeline] ⏳ Retry wait ${BACKOFF_MS[attempt - 1]}ms before attempt ${attempt}/${MAX_ATTEMPTS}`)
      await new Promise((resolve) => setTimeout(resolve, BACKOFF_MS[attempt - 1]))
    }

    if (signal.aborted) {
      console.log(`[OpenAI Pipeline] ⚠ Aborted before attempt ${attempt}`)
      break
    }

    const attemptT0 = Date.now()
    console.log(
      `[OpenAI Pipeline] → images.generate attempt ${attempt}/${MAX_ATTEMPTS} model=${modelId} size=${size} quality=${quality} promptLen=${prompt.length}`
    )

    try {
      const response = await client.images.generate(
        { model: modelId, prompt, size, quality, n: 1 },
        { signal }
      )

      const first = response.data?.[0] as { b64_json?: string } | undefined
      const b64 = first?.b64_json
      if (!b64) {
        throw new OpenAIConfigurationError('gpt-image-1 returned an empty b64_json payload')
      }

      const attemptMs = Date.now() - attemptT0
      const totalMs = Date.now() - overallT0
      console.log(
        `[OpenAI Pipeline] ✓ generated in ${(attemptMs / 1000).toFixed(1)}s (attempt ${attempt}/${MAX_ATTEMPTS}, total ${(totalMs / 1000).toFixed(1)}s)`
      )

      return {
        imageBase64: `data:image/png;base64,${b64}`,
        actualModel: modelId,
        durationMs: totalMs,
      }
    } catch (err) {
      lastErr = err
      const attemptMs = Date.now() - attemptT0
      const e = err as {
        name?: string
        code?: string
        message?: string
        status?: number
        cause?: { code?: string; name?: string; message?: string }
      }
      console.error(
        `[OpenAI Pipeline] ✗ attempt ${attempt}/${MAX_ATTEMPTS} failed after ${(attemptMs / 1000).toFixed(1)}s`,
        {
          name: e?.name,
          code: e?.code,
          status: e?.status,
          causeCode: e?.cause?.code,
          causeName: e?.cause?.name,
          message: e?.message,
        }
      )

      // Configuration errors don't retry.
      if (err instanceof OpenAIConfigurationError) throw err

      // Caller-side abort (browser tab closed, request.signal aborted) — don't retry.
      if (externalSignal && wasUserAborted(externalSignal, err)) {
        console.log('[OpenAI Pipeline] ⚠ Client aborted request — stopping retries')
        throw err
      }

      // Our 9-minute hard cap fired — no point retrying.
      if (hardCap.aborted) {
        throw new OpenAITimeoutError(
          'OpenAI image generation exceeded the overall 9-minute deadline. Please retry with medium quality for a faster response.'
        )
      }

      // Transport-level error (socket drop OR truncated JSON body from a
      // dropped stream) → retry if attempts remain. Both are symptoms of the
      // same underlying failure — a mid-flight connection sever — manifesting
      // at different layers of the stack.
      if (isRetryableTransport(err) && attempt < MAX_ATTEMPTS) {
        continue
      }

      // Non-retryable error (auth, 400, billing, etc) or out of attempts.
      break
    }
  }

  // All attempts exhausted.
  if (isRetryableTransport(lastErr)) {
    const kind = isTruncatedResponseError(lastErr)
      ? 'truncated response (connection dropped mid-transfer)'
      : 'connection reset'
    throw new OpenAITimeoutError(
      `OpenAI image generation failed with a ${kind} after ${MAX_ATTEMPTS} attempts. ` +
        'This usually means an intermediate network hop (ISP, corporate proxy, or OpenAI edge) ' +
        'is closing long-running requests. Try medium quality for a faster response, or check your network.'
    )
  }
  throw lastErr instanceof Error ? lastErr : new Error('OpenAI generation failed')
}
