/**
 * Creative Engine orchestrator — the planning half (stages 1–12a).
 *
 * Chains canonical → semantic → psychology → context → director → typography →
 * layout → scene. AI stages (psychology, director) degrade to deterministic
 * fallbacks; pure stages are total functions. Produces a CreativePlan: a scene
 * prompt (background art only) + a layout (deterministic text).
 *
 * The Forge route then: generates the background with its existing Gemini path
 * using `plan.scene.backgroundPrompt`, composites text via the sharp-render
 * adapter using `plan.layout` + `plan.context.renderableText`, and runs verify +
 * critic.
 */

import type { CompiledFormData } from '@/lib/prompts/services/form-data-compiler'
import { toCanonicalEvent, type CanonicalAdapterExtras } from './adapters/form-compiler-adapter'
import { enrichSemantics } from './stages/s05-semantic-enrichment'
import { runEventPsychology } from './stages/s07-event-psychology'
import { selectVisualStrategy } from './stages/s07b-strategy-selector'
import { buildCreativeContext } from './stages/s06-context-builder'
import { runCreativeDirector } from './stages/s08-creative-director'
import { runTypography } from './stages/s09-typography'
import { runLayout } from './stages/s10-layout'
import { selectRenderingMode } from './stages/rendering-mode'
import { buildSceneSpec } from './stages/s12-scene-generation'
import type { CreativePlan, EngineConfig, StageOutcome } from './pipeline.types'

export interface PlanInput {
  compiled: CompiledFormData
  extras: CanonicalAdapterExtras
}

export async function planCreative(input: PlanInput, cfg: EngineConfig): Promise<CreativePlan> {
  const diagnostics: StageOutcome[] = []
  const now = () => Date.now()

  let s = now()
  const canonical = toCanonicalEvent(input.compiled, input.extras)
  diagnostics.push({ stage: 'canonical', status: 'ok', durationMs: now() - s, source: 'pure' })

  s = now()
  const semantic = enrichSemantics(canonical)
  diagnostics.push({ stage: 'semantic', status: 'ok', durationMs: now() - s, source: 'pure' })

  s = now()
  const psychology = await runEventPsychology(canonical, semantic, cfg)
  diagnostics.push({
    stage: 'psychology',
    status: psychology.source === 'heuristic' ? 'fallback' : 'ok',
    durationMs: now() - s,
    source: psychology.source === 'ai' ? 'ai' : 'fallback',
  })

  s = now()
  const strategy = selectVisualStrategy(semantic, psychology, canonical, cfg.visualStrategy)
  diagnostics.push({
    stage: 'strategy',
    status: 'ok',
    durationMs: now() - s,
    source: 'pure',
    note: `${strategy.strategy} (${strategy.source})`,
  })

  s = now()
  const renderingMode = selectRenderingMode(canonical, semantic, cfg.renderingMode)
  diagnostics.push({
    stage: 'rendering-mode',
    status: 'ok',
    durationMs: now() - s,
    source: 'pure',
    note: renderingMode,
  })

  s = now()
  const context = buildCreativeContext(canonical, semantic, psychology)
  diagnostics.push({ stage: 'context', status: 'ok', durationMs: now() - s, source: 'pure' })

  s = now()
  const direction = await runCreativeDirector(context, canonical, strategy, cfg)
  diagnostics.push({
    stage: 'director',
    status: direction.source === 'fallback' ? 'fallback' : 'ok',
    durationMs: now() - s,
    source: direction.source === 'ai' ? 'ai' : 'fallback',
  })

  s = now()
  const typography = runTypography(context.typographyContext)
  diagnostics.push({ stage: 'typography', status: 'ok', durationMs: now() - s, source: 'pure' })

  s = now()
  const layout = runLayout(context.spatialContext, typography, context.renderableText)
  diagnostics.push({ stage: 'layout', status: 'ok', durationMs: now() - s, source: 'pure' })

  s = now()
  const scene = buildSceneSpec(direction, context, renderingMode)
  diagnostics.push({ stage: 'scene', status: 'ok', durationMs: now() - s, source: 'pure' })

  return {
    canonical,
    semantic,
    psychology,
    strategy,
    renderingMode,
    context,
    direction,
    typography,
    layout,
    scene,
    diagnostics,
  }
}
