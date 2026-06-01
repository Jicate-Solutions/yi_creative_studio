/**
 * Model registry — authoritative map of `model_id → provider + capabilities`.
 *
 * This is the one place that decides which image provider a given model uses.
 * The render router consults it (after first honoring any explicit
 * request-level `provider`), so adding a new model is a one-line change here
 * rather than a new `if` branch in the 5,700-line route file.
 *
 * Capabilities mirror the existing GEMINI_MODEL_CAPABILITIES (route.ts) and
 * OPENAI_MODEL_CAPABILITIES (lib/pipelines/openai-pipeline.ts). They are
 * informational this round (useful for UI/validation later) and do NOT change
 * render behavior — the provider field is the only load-bearing part today.
 */

import type { RenderProvider } from './types'

export interface ModelCapabilities {
  /** Resolution ids (Gemini) or pixel sizes (OpenAI) the model accepts. */
  sizes: string[]
  supportsThinking: boolean
  supportsImageSearch: boolean
  supportsImageInput: boolean
  /** OpenAI low/medium/high quality tier support. */
  supportsQualityTier: boolean
}

export interface ModelEntry {
  modelId: string
  provider: RenderProvider
  displayName: string
  capabilities: ModelCapabilities
}

const GEMINI_CAPS = (
  sizes: string[],
  opts: Partial<ModelCapabilities> = {}
): ModelCapabilities => ({
  sizes,
  supportsThinking: false,
  supportsImageSearch: false,
  supportsImageInput: false,
  supportsQualityTier: false,
  ...opts,
})

/** Explicitly known models. Source of truth for the UI dropdown's providers. */
const REGISTRY: Record<string, ModelEntry> = {
  'gemini-2.5-flash-image': {
    modelId: 'gemini-2.5-flash-image',
    provider: 'google',
    displayName: 'Nano Banana (Gemini 2.5 Flash Image)',
    capabilities: GEMINI_CAPS(['1K']),
  },
  'gemini-2.0-flash-preview-image-generation': {
    modelId: 'gemini-2.0-flash-preview-image-generation',
    provider: 'google',
    displayName: 'Gemini 2.0 Flash (Preview)',
    capabilities: GEMINI_CAPS(['1K']),
  },
  'gemini-3.1-flash-image-preview': {
    modelId: 'gemini-3.1-flash-image-preview',
    provider: 'google',
    displayName: 'Nano Banana 2 (Flash 3.1)',
    capabilities: GEMINI_CAPS(['512px', '1K', '2K', '4K'], {
      supportsThinking: true,
      supportsImageSearch: true,
      supportsImageInput: true,
    }),
  },
  'gemini-3-pro-image-preview': {
    modelId: 'gemini-3-pro-image-preview',
    provider: 'google',
    displayName: 'Nano Banana Pro (Gemini 3 Pro)',
    capabilities: GEMINI_CAPS(['1K', '2K', '4K'], { supportsImageInput: true }),
  },
  'gpt-image-1': {
    modelId: 'gpt-image-1',
    provider: 'openai',
    displayName: 'ChatGPT Image (gpt-image-1)',
    capabilities: {
      sizes: ['1024x1024', '1024x1536', '1536x1024'],
      supportsThinking: false,
      supportsImageSearch: false,
      supportsImageInput: false,
      supportsQualityTier: true,
    },
  },
}

const DEFAULT_CAPS: Record<RenderProvider, ModelCapabilities> = {
  google: GEMINI_CAPS(['1K']),
  ideogram: GEMINI_CAPS(['1K']),
  openai: {
    sizes: ['1024x1024'],
    supportsThinking: false,
    supportsImageSearch: false,
    supportsImageInput: false,
    supportsQualityTier: true,
  },
}

/**
 * Fallback classification for a model id that isn't in REGISTRY.
 *
 * Policy (least surprising for this codebase): match the id substring, and
 * default to Gemini ('google') since it is the platform's default renderer.
 * The router only reaches this path when the request carries no explicit
 * `provider` AND the model is unregistered — a genuine edge case — so a safe
 * default beats throwing here.
 */
export function classifyUnknownModel(modelId?: string): RenderProvider {
  const id = (modelId ?? '').toLowerCase()
  if (id.includes('gpt') || id.includes('openai') || id.includes('dall')) return 'openai'
  if (id.includes('ideogram')) return 'ideogram'
  return 'google'
}

/**
 * Resolve a model id to its registry entry. Unknown models synthesize an entry
 * using `fallbackProvider` (e.g. the request's DB provider) when supplied,
 * otherwise `classifyUnknownModel`.
 */
export function getModelEntry(
  modelId?: string,
  fallbackProvider?: RenderProvider
): ModelEntry {
  const known = modelId ? REGISTRY[modelId] : undefined
  if (known) return known

  const provider = fallbackProvider ?? classifyUnknownModel(modelId)
  return {
    modelId: modelId ?? 'unknown',
    provider,
    displayName: modelId ?? 'Unknown model',
    capabilities: DEFAULT_CAPS[provider],
  }
}

/** All explicitly registered models (for diagnostics / UI listing). */
export function listRegisteredModels(): ModelEntry[] {
  return Object.values(REGISTRY)
}
