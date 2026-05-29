/**
 * Creative Engine — public surface.
 *
 * A structured 15-stage creative-intelligence pipeline:
 *   Fields → Meaning → Creative Intelligence → Directed Scene → Engineered Poster
 *
 * The image model paints background art only; the deterministic engine draws all
 * typography. Provider-neutral planning half (`planCreative`) + Sharp-bound
 * render/verify/critic stages.
 *
 * Wired into app/api/generate-forge only. /api/generate and /api/generate-lab are
 * untouched.
 */

// Orchestrator + config
export { planCreative, type PlanInput } from './pipeline'
export type { CreativePlan, EngineConfig, StageOutcome } from './pipeline.types'

// Contracts (full typed vocabulary)
export * from './contracts'

// Registry (stages 2–3)
export {
  SEMANTIC_FIELD_REGISTRY,
  getFieldMeta,
  getFieldSemantic,
  getFieldAffects,
  resolveAliases,
  type AliasResolution,
} from './registry'

// Adapters
export { toCanonicalEvent, type CanonicalAdapterExtras } from './adapters/form-compiler-adapter'
export { renderTextLayers, type RenderOptions } from './adapters/sharp-render-adapter'

// Stage helpers the route invokes after image generation
export { runSpatialVerification } from './stages/s14-spatial-verify'
export { runPosterCritic } from './stages/s15-critic'

// Pure-stage helpers (exported for tests / reuse)
export { enrichSemantics, classifyEventFamily } from './stages/s05-semantic-enrichment'
export { buildCreativeContext } from './stages/s06-context-builder'
export { runTypography } from './stages/s09-typography'
export { runLayout } from './stages/s10-layout'
export { buildSceneSpec } from './stages/s12-scene-generation'
export { runCreativeDirector } from './stages/s08-creative-director'
export { runEventPsychology } from './stages/s07-event-psychology'
export { selectVisualStrategy, DIRECTIVES } from './stages/s07b-strategy-selector'
export { selectRenderingMode } from './stages/rendering-mode'
export { verifyVisibleText, type TextVerificationResult } from './stages/s14b-text-verify'
