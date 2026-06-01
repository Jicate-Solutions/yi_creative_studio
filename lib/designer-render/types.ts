/**
 * Shared types for the designer render layer.
 *
 * This layer sits AFTER the common designer planning pipeline (Design
 * Intelligence → Creative Director → typography → prompt assembly) and BEFORE
 * the final image call. Its only job is to pick the right image provider for
 * the selected model and normalize the result — the planning pipeline above it
 * is provider-agnostic and unchanged.
 *
 * Design note — `imageUrl` is intentionally a union of two shapes:
 *   - Gemini / OpenAI return a base64 data URL ("data:image/png;base64,…")
 *   - Ideogram returns a plain remote http(s) URL
 * The existing downstream Sharp/storage code already handles both, so the
 * router preserves that contract rather than forcing one representation.
 */

import type { DesignData } from '@/lib/config/design-constants'
import type { CreativeFormat } from '@/lib/config/creative-formats'

export type RenderProvider = 'google' | 'ideogram' | 'openai'

/**
 * Everything a provider adapter might need. Most fields are provider-specific
 * and simply ignored by adapters that don't use them — this keeps the two
 * route call sites to a single object literal instead of long positional args.
 */
export interface RenderInput {
  /** Model id from the request, e.g. 'gemini-3-pro-image-preview' | 'gpt-image-1'. */
  modelId?: string
  /** Explicit provider override; when omitted the router derives it from modelId. */
  provider?: RenderProvider

  // Shared
  prompt: string
  systemPrompt?: string
  designData?: DesignData | null
  format?: CreativeFormat | null
  resolution?: string

  // Gemini (Flash 3.1 only)
  thinkingLevel?: 'minimal' | 'High'
  useImageSearch?: boolean

  // Ideogram
  styleType?: string
  magicPrompt?: string
  negativePrompt?: string

  // OpenAI (gpt-image-1)
  /** Pre-built OpenAI-specific prompt (from buildOpenAIPrompt). Falls back to `prompt`. */
  openAIPromptText?: string
  imageQuality?: 'low' | 'medium' | 'high'
  /** Caller AbortSignal (e.g. request.signal), forwarded to the hardened OpenAI client. */
  signal?: AbortSignal
}

/**
 * Normalized render result.
 *
 * `actualModel` is optional on purpose: the legacy Ideogram branch never set an
 * "actual model", so its adapter returns it undefined and the route leaves the
 * pre-existing value untouched — byte-for-byte parity with today's behavior.
 *
 * `regenerateWithEmphasis` is the Gemini-only retry hook used when required
 * visible text is missing; other providers omit it.
 */
export interface RenderResult {
  imageUrl: string
  actualModel?: string
  regenerateWithEmphasis?: (missing: string[]) => Promise<string>
}

/** A provider adapter: takes the unified input, returns a normalized result. */
export type Renderer = (input: RenderInput) => Promise<RenderResult>

/** The set of adapters the route injects into the router (dependency injection). */
export type RendererMap = Record<RenderProvider, Renderer>
