/**
 * Scene Generation — contracts (stage 12)
 *
 * SceneSpec.backgroundPrompt describes ART ONLY — no text, logos, dates, or
 * names. It is a drop-in replacement for the Forge route's current
 * `assembled.prompt`, so the existing Gemini call path can consume it unchanged.
 */

export interface ConditioningImage {
  buffer: Buffer
  mimeType: string
  role: 'scaffold' | 'style-ref' | 'portrait'
}

/**
 * How the final poster is rendered — the division of labour between the image
 * model and the deterministic engine:
 *   - ai_native     : AI renders the FULL poster (scene + typography + layout).
 *                     Used for advertising. Text verified after generation.
 *   - hybrid_shape  : AI renders scene + EMPTY designed text containers; the
 *                     engine renders the exact copy into the content band.
 *   - engine_exact  : AI renders background ONLY; the engine renders all text.
 *                     Used for certificates, notices, multilingual, brand-safe.
 */
export type RenderingMode = 'ai_native' | 'hybrid_shape' | 'engine_exact'

export interface SceneSpec {
  /** Final string sent to the image model. Content depends on renderingMode. */
  backgroundPrompt: string
  /** Which rendering strategy this scene was built for. */
  renderingMode: RenderingMode
  /** For ai_native: the exact strings that MUST be visible in the output (verified post-gen). */
  requiredVisibleText: string[]
  /** Explicit negatives (empty for ai_native, since the AI must render text). */
  negativePrompt?: string
  conditioningImages: ConditioningImage[]
  /** The reserved-zone atmospheric-continuation sentence (kept separate for tuning). */
  reservedZoneInstruction: string
  meta: {
    estimatedTokens: number
    theme: string
    mood: string
  }
}

/** Output of the image model (produced by the route's Gemini path, fed back in). */
export interface GeneratedBackground {
  imageBuffer: Buffer
  width: number
  height: number
  mimeType: string
  source: 'image-model' | 'fallback-gradient'
}
