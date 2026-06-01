/**
 * Render router — the single switch point between the common designer pipeline
 * and the per-provider image call.
 *
 * It is deliberately SDK-free: it never imports the OpenAI/Gemini/Ideogram
 * clients. Instead the route injects a `RendererMap` of closures that wrap the
 * existing provider functions (dependency injection). That keeps this module
 * pure and trivially unit-testable, and means the big render functions never
 * have to move out of the route ("wrap, don't rewrite").
 */

import { getModelEntry } from './model-registry'
import type { RenderInput, RenderResult, RenderProvider, RendererMap } from './types'

/**
 * Resolve the provider for a render request.
 *
 * Priority: an explicit `input.provider` wins (the request already carries the
 * DB-sourced provider), otherwise we classify from the model id via the
 * registry. The registry itself decides how to handle unknown models.
 */
export function resolveProvider(input: RenderInput): RenderProvider {
  if (input.provider) return input.provider
  return getModelEntry(input.modelId).provider
}

/**
 * Dispatch a single render request to the correct provider adapter and return
 * a normalized result. Throws a clear error if no adapter is registered for the
 * resolved provider (e.g. a future provider added to the registry but not wired).
 */
export async function renderPoster(
  input: RenderInput,
  renderers: RendererMap
): Promise<RenderResult> {
  const provider = resolveProvider(input)
  const renderer = renderers[provider]

  if (!renderer) {
    throw new Error(
      `[render-router] No adapter registered for provider "${provider}" ` +
        `(model "${input.modelId ?? 'unknown'}")`
    )
  }

  return renderer(input)
}
