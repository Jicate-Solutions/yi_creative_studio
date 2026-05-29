/**
 * Stage 12 — Scene Generation (renderingMode-aware)
 *
 * Builds the image-model prompt according to the chosen renderingMode:
 *   - engine_exact : background ART ONLY (no text). Engine draws all type.
 *   - hybrid_shape : background + EMPTY designed text containers. Engine fills text.
 *   - ai_native    : the FULL poster — scene + all copy as designed typography.
 *
 * Across all modes the hard-won lessons are re-applied deterministically: the
 * actor-preservation anchor, the brand-color palette, and (where relevant) the
 * reserved typography bands. Wrapped in <scene_description> so the route's shared
 * Gemini sanitizer uses GENTLE mode (preserves natural sentences and copy).
 */

import type { CreativeContext } from '../contracts/creative-context'
import type { CreativeDirection } from '../contracts/direction'
import type { SceneSpec, RenderingMode } from '../contracts/scene'

const NO_TEXT_NEGATIVE =
  'No text, no words, no letters, no numbers, no headline, no captions, no readable signs or labels, no CTA buttons, no date or venue text, no signage, no logos, no watermark, no UI, no posters-within-the-poster.'

function reservedZoneSentence(
  width: number,
  height: number,
  logoBarsEnabled: boolean,
  fullCanvas: boolean
): string {
  if (fullCanvas && !logoBarsEnabled) {
    return `Keep generous calm negative space across the upper third and lower third as soft atmospheric continuation of the background, so headline and footer typography can be composited there afterwards.`
  }
  const topPx = Math.round(height * 0.4)
  const bottomPx = Math.round(height * 0.18)
  return `Keep the top 40% (first ${topPx} pixels) and the bottom 18% (last ${bottomPx} pixels) of the ${width}×${height} canvas as soft, empty atmospheric continuation of the background — no figures, faces, text, icons, or decorative detail there. Logo bars and footer typography are composited into those bands during post-processing.`
}

/** Restate the hero so it survives even if the Director's prose under-emphasized it. */
function anchorClause(direction: CreativeDirection): string {
  const a = direction.narrativeAnchor
  if (!a.mustRemainVisible) return ''
  return `The clear main subject is ${a.primaryActor} ${a.primaryAction}, prominent and recognizable in the frame.${
    a.supportingSymbols.length
      ? ` ${a.supportingSymbols.join(', ')} appear only as supporting elements and never replace the people.`
      : ''
  }`
}

function sceneCore(direction: CreativeDirection): string {
  return [
    direction.sceneNarrative,
    `Lighting: ${direction.lightingStyle}.`,
    `Composition: ${direction.compositionFeel}.`,
    `Color: ${direction.paletteDirection}.`,
    direction.moodWords.length ? `Mood: ${direction.moodWords.join(', ')}.` : '',
    direction.designerReference ? `Visual reference: in the spirit of ${direction.designerReference}.` : '',
    `Premium magazine-print finish, fine detail, professional color grade, no distortion.`,
  ]
    .filter(Boolean)
    .join(' ')
}

/** The exact copy lines, in hierarchy order, for ai_native (and verification). */
function gatherCopy(context: CreativeContext): Array<{ label: string; value: string }> {
  const r = context.renderableText
  const out: Array<{ label: string; value: string }> = []
  if (r.headline) out.push({ label: 'HEADLINE', value: r.headline })
  if (r.subtitle) out.push({ label: 'SUBHEADLINE', value: r.subtitle })
  const dt = [r.dateLine, r.timeLine].filter(Boolean).join(' • ')
  if (dt) out.push({ label: 'DATE & TIME', value: dt })
  if (r.venueLine) out.push({ label: 'VENUE', value: r.venueLine })
  if (r.callToAction) out.push({ label: 'CALL TO ACTION', value: r.callToAction })
  if (context.brandContext.organizationName)
    out.push({ label: 'INITIATIVE / FOOTER', value: context.brandContext.organizationName })
  return out
}

function block(text: string): string {
  return `<scene_description>\n${text}\n</scene_description>`
}

function metaOf(direction: CreativeDirection, prompt: string) {
  return {
    estimatedTokens: Math.round(prompt.length / 4),
    theme: direction.creativeTheme,
    mood: direction.moodWords.join(', '),
  }
}

// ── ai_native: the AI renders the entire advertising poster ────────────────────
function buildAiNativeScene(direction: CreativeDirection, context: CreativeContext): SceneSpec {
  const copy = gatherCopy(context)
  const copyBlock = copy.map((c) => `${c.label}: "${c.value}"`).join('\n')

  const prompt = [
    'Design a finished, premium advertising poster — a complete art-directed layout, not just a background.',
    block(
      `${anchorClause(direction)} ${sceneCore(direction)}`.trim()
    ),
    block(
      `Render ALL of the following copy as beautifully designed, correctly spelled typography with confident advertising hierarchy — the headline dominant and high-impact, the supporting lines clearly legible and elegantly placed. Keep the brand palette consistent across type and scene.\n\n${copyBlock}`
    ),
    block(
      `The people described above remain the visible heroes of the composition. Spelling must be exact, every line present and readable. No placeholder text, no lorem ipsum, no watermark, no duplicated or garbled lettering.`
    ),
  ].join('\n\n')

  return {
    backgroundPrompt: prompt,
    renderingMode: 'ai_native',
    requiredVisibleText: copy.map((c) => c.value),
    negativePrompt: undefined, // AI must render text in this mode
    conditioningImages: [],
    reservedZoneInstruction: '',
    meta: metaOf(direction, prompt),
  }
}

// ── hybrid_shape: AI renders scene + EMPTY designed text holders ───────────────
function buildHybridScene(direction: CreativeDirection, context: CreativeContext): SceneSpec {
  const { format, logoBarsEnabled, fullCanvas } = context.spatialContext
  const reserved = reservedZoneSentence(format.width, format.height, logoBarsEnabled, fullCanvas)

  const prompt = [
    'Render a premium poster background with the scene below, PLUS tasteful EMPTY design containers where text will be placed.',
    block(`${anchorClause(direction)} ${sceneCore(direction)}`.trim()),
    block(
      `Include clean, on-brand empty text holders — for example a soft card or plate in the lower-middle and a slim ribbon or banner near the bottom — sized to hold a headline and a few detail lines. Leave every container COMPLETELY EMPTY of words; the copy is typeset afterwards by a separate layer.`
    ),
    block(reserved),
    block(
      `No text, no letters, no numbers anywhere — not inside the containers, not in the scene. Only the empty designed shapes. No logos, no watermark, no UI.`
    ),
  ].join('\n\n')

  return {
    backgroundPrompt: prompt,
    renderingMode: 'hybrid_shape',
    requiredVisibleText: [],
    negativePrompt: NO_TEXT_NEGATIVE,
    conditioningImages: [],
    reservedZoneInstruction: reserved,
    meta: metaOf(direction, prompt),
  }
}

// ── engine_exact: background ART ONLY (text drawn deterministically) ───────────
function buildEngineExactScene(direction: CreativeDirection, context: CreativeContext): SceneSpec {
  const { format, logoBarsEnabled, fullCanvas } = context.spatialContext
  const reserved = reservedZoneSentence(format.width, format.height, logoBarsEnabled, fullCanvas)
  const negative = `${NO_TEXT_NEGATIVE} The image is pure background artwork only.`

  const prompt = [
    'Render the following scene as a single coherent image — background artwork only.',
    block(`${anchorClause(direction)} ${sceneCore(direction)}`.trim()),
    block(reserved),
    block(negative),
  ].join('\n\n')

  return {
    backgroundPrompt: prompt,
    renderingMode: 'engine_exact',
    requiredVisibleText: [],
    negativePrompt: negative,
    conditioningImages: [],
    reservedZoneInstruction: reserved,
    meta: metaOf(direction, prompt),
  }
}

export function buildSceneSpec(
  direction: CreativeDirection,
  context: CreativeContext,
  mode: RenderingMode
): SceneSpec {
  switch (mode) {
    case 'ai_native':
      return buildAiNativeScene(direction, context)
    case 'hybrid_shape':
      return buildHybridScene(direction, context)
    default:
      return buildEngineExactScene(direction, context)
  }
}
