/**
 * Pipeline orchestration types.
 *
 * For increment 1 the engine produces everything UP TO the scene prompt + layout
 * (`CreativePlan`). The Forge route then runs its existing Gemini call with
 * `scene.backgroundPrompt`, feeds the background back through the render adapter,
 * and runs verify + critic. This keeps the engine free of the Gemini/Sharp SDKs
 * and fully unit-testable.
 */

import type {
  CanonicalEvent,
  SemanticProfile,
  EventPsychology,
  CreativeContext,
  CreativeDirection,
  TypographySpec,
  LayoutSpec,
  SceneSpec,
  StrategySelection,
  VisualStrategy,
  RenderingMode,
} from './contracts'

export interface EngineConfig {
  formatId: string
  signal?: AbortSignal
  /** When present, AI stages log token usage to the org dashboard. */
  trackUsage?: {
    organizationId: string
    userId: string
    creativeId?: string | null
  }
  /** Force every AI stage to its deterministic fallback (tests / offline). */
  forceFallback?: boolean
  /** User override for the visual strategy (else the selector picks a sensible default). */
  visualStrategy?: VisualStrategy
  /** User override for the rendering mode (else selected from style/format/language). */
  renderingMode?: RenderingMode
}

export interface StageOutcome {
  stage: string
  status: 'ok' | 'fallback' | 'skipped' | 'failed'
  durationMs: number
  source?: 'ai' | 'pure' | 'fallback'
  note?: string
}

/**
 * The planning half of the pipeline (stages 1–12a): canonical → … → scene prompt
 * + layout. No image generation, no Sharp compositing.
 */
export interface CreativePlan {
  canonical: CanonicalEvent
  semantic: SemanticProfile
  psychology: EventPsychology
  strategy: StrategySelection
  renderingMode: RenderingMode
  context: CreativeContext
  direction: CreativeDirection
  typography: TypographySpec
  layout: LayoutSpec
  scene: SceneSpec
  diagnostics: StageOutcome[]
}
